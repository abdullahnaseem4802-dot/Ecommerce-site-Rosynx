import { Module } from '@nestjs/common';
import { KeepAliveService } from './keepalive.service';

@Module({
  providers: [KeepAliveService],
})
export class KeepAliveModule {}
