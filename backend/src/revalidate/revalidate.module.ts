import { Global, Module } from '@nestjs/common';
import { RevalidateService } from './revalidate.service';

/** Global so any module that mutates storefront-visible data can inject it
 *  without extra wiring (same pattern as PrismaModule). */
@Global()
@Module({
  providers: [RevalidateService],
  exports: [RevalidateService],
})
export class RevalidateModule {}
