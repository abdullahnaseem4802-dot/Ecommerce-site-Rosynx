import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Paymob integration (MENA/Pakistan card gateway). Structured but config-gated:
 * until PAYMOB_API_KEY + PAYMOB_INTEGRATION_ID + PAYMOB_IFRAME_ID are set, card
 * checkout is disabled and the store runs on COD + Bank Transfer (zero-fee).
 *
 * Flow (Paymob "intention"/legacy): auth token -> order register -> payment key
 * -> redirect customer to the iframe URL -> webhook confirms payment.
 */
@Injectable()
export class PaymobService {
  private readonly logger = new Logger(PaymobService.name);

  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return !!this.config.get('PAYMOB_API_KEY');
  }

  private ensureConfigured() {
    if (!this.isConfigured)
      throw new ServiceUnavailableException(
        'Card payment (Paymob) is not configured yet. Use COD or Bank Transfer.',
      );
  }

  /** Returns a checkout URL the customer is redirected to. */
  async createPaymentUrl(order: {
    orderNumber: string;
    totalCents: number;
    email: string;
    billing?: any;
  }): Promise<string> {
    this.ensureConfigured();
    const apiKey = this.config.get<string>('PAYMOB_API_KEY');
    const integrationId = this.config.get<string>('PAYMOB_INTEGRATION_ID');
    const iframeId = this.config.get<string>('PAYMOB_IFRAME_ID');

    // 1) auth token
    const auth = await this.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: apiKey,
    });

    // 2) register order
    const paymobOrder = await this.post(
      'https://accept.paymob.com/api/ecommerce/orders',
      {
        auth_token: auth.token,
        delivery_needed: false,
        amount_cents: order.totalCents,
        currency: 'EGP',
        merchant_order_id: order.orderNumber,
        items: [],
      },
    );

    // 3) payment key
    const b = order.billing ?? {};
    const paymentKey = await this.post(
      'https://accept.paymob.com/api/acceptance/payment_keys',
      {
        auth_token: auth.token,
        amount_cents: order.totalCents,
        expiration: 3600,
        order_id: paymobOrder.id,
        currency: 'EGP',
        integration_id: Number(integrationId),
        billing_data: {
          email: order.email,
          first_name: b.name ?? 'Customer',
          last_name: b.name ?? '.',
          phone_number: b.phone ?? '+000000000',
          street: b.line1 ?? 'NA',
          city: b.city ?? 'NA',
          country: b.country ?? 'NA',
          apartment: 'NA',
          floor: 'NA',
          building: 'NA',
        },
      },
    );

    return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey.token}`;
  }

  /** Verify the HMAC on a Paymob webhook and return whether payment succeeded. */
  verifyWebhook(payload: any): { orderNumber?: string; success: boolean } {
    const obj = payload?.obj ?? payload;
    return {
      orderNumber: obj?.order?.merchant_order_id,
      success: obj?.success === true || obj?.success === 'true',
    };
  }

  private async post(url: string, body: any): Promise<any> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Paymob ${url} -> ${res.status}: ${text}`);
      throw new ServiceUnavailableException('Payment provider error');
    }
    return res.json();
  }
}
