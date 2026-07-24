import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RevalidateModule } from './revalidate/revalidate.module';
import { KeepAliveModule } from './keepalive/keepalive.module';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UploadsModule } from './uploads/uploads.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CouponsModule } from './coupons/coupons.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AddressesModule } from './addresses/addresses.module';
import { CurrencyModule } from './currency/currency.module';
import { AdminModule } from './admin/admin.module';
import { ContactModule } from './contact/contact.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { SettingsModule } from './settings/settings.module';
import { BlogModule } from './blog/blog.module';
import { FaqModule } from './faq/faq.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RevalidateModule,
    KeepAliveModule,
    StorageModule,
    EmailModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    UploadsModule,
    CartModule,
    WishlistModule,
    CouponsModule,
    PaymentsModule,
    OrdersModule,
    ReviewsModule,
    AddressesModule,
    CurrencyModule,
    AdminModule,
    ContactModule,
    SubscribersModule,
    SettingsModule,
    BlogModule,
    FaqModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
