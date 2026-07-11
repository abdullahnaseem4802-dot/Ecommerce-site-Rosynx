import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currency: CurrencyService) {}

  @Public()
  @Get('rates')
  rates() {
    return this.currency.getRates();
  }

  @Public()
  @Get('convert')
  convert(@Query('amount') amount: string, @Query('to') to: string) {
    return this.currency.convert(parseFloat(amount) || 0, to || 'USD');
  }
}
