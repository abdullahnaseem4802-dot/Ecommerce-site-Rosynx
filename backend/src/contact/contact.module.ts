import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { SupportController } from './support.controller';

@Module({
  controllers: [ContactController, SupportController],
  providers: [ContactService],
})
export class ContactModule {}
