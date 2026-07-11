/**
 * One-off cleanup: remove the "Best Seller" concept from the live DB.
 * Finds the category by slug 'best-seller' (or name 'Best Seller'), disconnects
 * it from every product (products themselves are kept), then deletes the
 * category. Logs how many products were affected.
 *
 * Run:  node --env-file=.env scripts/remove-bestseller-category.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ slug: 'best-seller' }, { name: 'Best Seller' }],
    },
    include: { products: { select: { id: true } } },
  });

  if (!category) {
    console.log('No "Best Seller" category found — nothing to do.');
    return;
  }

  const productIds = category.products.map((p) => p.id);
  console.log(
    `Found category "${category.name}" (slug=${category.slug}, id=${category.id}) ` +
      `linked to ${productIds.length} product(s).`,
  );

  // Disconnect all product links (products are NOT deleted).
  if (productIds.length > 0) {
    await prisma.category.update({
      where: { id: category.id },
      data: {
        products: { disconnect: productIds.map((id) => ({ id })) },
      },
    });
    console.log(`Disconnected ${productIds.length} product(s) from the category.`);
  }

  await prisma.category.delete({ where: { id: category.id } });
  console.log(`Deleted category "${category.name}". Products preserved.`);
}

main()
  .catch((err) => {
    console.error('Failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
