import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeProduct } from '../products/product.serializer';

export interface CartIdentity {
  userId?: string;
  guestToken?: string;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /** Find or create the cart for a user or a guest token. */
  private async resolveCart(id: CartIdentity) {
    if (!id.userId && !id.guestToken)
      throw new BadRequestException('Provide auth or an x-guest-token header');

    const where = id.userId
      ? { userId: id.userId }
      : { guestToken: id.guestToken };
    let cart = await this.prisma.cart.findFirst({ where });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: id.userId ? { userId: id.userId } : { guestToken: id.guestToken },
      });
    }
    return cart;
  }

  async get(id: CartIdentity) {
    const cart = await this.resolveCart(id);
    return this.serialize(cart.id);
  }

  async addItem(id: CartIdentity, productId: string, qty = 1) {
    if (qty < 1) throw new BadRequestException('qty must be >= 1');
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive)
      throw new NotFoundException('Product not found');
    if (!product.inStock) throw new BadRequestException('Product out of stock');

    const cart = await this.resolveCart(id);
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, qty },
      update: { qty: { increment: qty } },
    });
    return this.serialize(cart.id);
  }

  async setQty(id: CartIdentity, productId: string, qty: number) {
    const cart = await this.resolveCart(id);
    if (qty <= 0) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
    } else {
      await this.prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { qty },
      });
    }
    return this.serialize(cart.id);
  }

  async removeItem(id: CartIdentity, productId: string) {
    const cart = await this.resolveCart(id);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });
    return this.serialize(cart.id);
  }

  async clear(id: CartIdentity) {
    const cart = await this.resolveCart(id);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.serialize(cart.id);
  }

  /** Merge a guest cart into the user's cart on login, then delete the guest cart. */
  async merge(userId: string, guestToken: string) {
    if (!guestToken) return this.get({ userId });
    const guest = await this.prisma.cart.findFirst({
      where: { guestToken },
      include: { items: true },
    });
    if (!guest) return this.get({ userId });
    const userCart = await this.resolveCart({ userId });
    for (const item of guest.items) {
      await this.prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: userCart.id, productId: item.productId },
        },
        create: {
          cartId: userCart.id,
          productId: item.productId,
          qty: item.qty,
        },
        update: { qty: { increment: item.qty } },
      });
    }
    await this.prisma.cart.delete({ where: { id: guest.id } });
    return this.serialize(userCart.id);
  }

  private async serialize(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: { include: { images: true } } } } },
    });
    const lines = (cart?.items ?? []).map((i) => {
      const p = serializeProduct(i.product);
      return {
        productId: i.productId,
        slug: p.slug,
        name: p.name,
        image: p.image,
        priceCents: p.priceCents,
        price: p.price,
        qty: i.qty,
        lineTotalCents: p.priceCents * i.qty,
      };
    });
    const subtotalCents = lines.reduce((n, l) => n + l.lineTotalCents, 0);
    const count = lines.reduce((n, l) => n + l.qty, 0);
    return {
      id: cart?.id,
      guestToken: cart?.guestToken ?? null,
      items: lines,
      count,
      subtotalCents,
      subtotal: subtotalCents / 100,
    };
  }
}
