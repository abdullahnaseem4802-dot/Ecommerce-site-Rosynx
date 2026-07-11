import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Display-currency conversion. Prices are stored in ONE base currency (cents);
 * this converts them for display in the visitor's currency (USD/GBP/PKR/…).
 * Rates come from a free no-key source and are cached in memory (refreshed
 * every 12h) so we stay well within any free tier.
 *
 * NOTE: this is for DISPLAY only. The actual charge/settlement currency is
 * decided by the payment gateway at checkout.
 */
@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private rates: Record<string, number> = {};
  private fetchedAt = 0;
  private readonly TTL = 12 * 60 * 60 * 1000;

  // Common currencies to expose to the storefront switcher.
  readonly supported = ['USD', 'PKR', 'GBP', 'EUR', 'CNY', 'AED', 'SAR'];

  constructor(private readonly config: ConfigService) {}

  private get base(): string {
    return this.config.get<string>('BASE_CURRENCY') ?? 'USD';
  }

  private async ensureRates() {
    if (Date.now() - this.fetchedAt < this.TTL && Object.keys(this.rates).length)
      return;
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${this.base}`);
      const data = await res.json();
      if (data?.rates) {
        this.rates = data.rates;
        this.fetchedAt = Date.now();
      }
    } catch (e) {
      this.logger.warn('FX fetch failed; using last cached rates');
    }
  }

  async getRates() {
    await this.ensureRates();
    const filtered: Record<string, number> = {};
    for (const c of this.supported)
      if (this.rates[c] != null) filtered[c] = this.rates[c];
    return { base: this.base, rates: filtered, fetchedAt: this.fetchedAt };
  }

  async convert(amount: number, to: string) {
    await this.ensureRates();
    const rate = this.rates[to.toUpperCase()] ?? 1;
    return {
      base: this.base,
      to: to.toUpperCase(),
      rate,
      amount,
      converted: Math.round(amount * rate * 100) / 100,
    };
  }
}
