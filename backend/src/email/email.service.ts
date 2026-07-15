import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * Every user-supplied value must go through this before being interpolated
 * into an email body — otherwise a contact form is an HTML injection into
 * whoever reads the mail.
 */
function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Swappable email transport. Default = console (dev/no cost). To go live, set
 * EMAIL_PROVIDER=resend + RESEND_API_KEY and implement sendViaResend (or SES).
 * Callers never change.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(msg: EmailMessage): Promise<void> {
    const provider = this.config.get<string>('EMAIL_PROVIDER') ?? 'console';
    if (provider === 'resend' && this.config.get('RESEND_API_KEY')) {
      return this.sendViaResend(msg);
    }
    // console transport
    this.logger.log(`✉️  [${msg.to}] ${msg.subject}`);
  }

  async orderConfirmation(order: {
    orderNumber: string;
    email: string;
    totalCents: number;
    currency: string;
    items: { nameSnapshot: string; qty: number }[];
  }) {
    const lines = order.items
      .map((i) => `<li>${i.qty} × ${i.nameSnapshot}</li>`)
      .join('');
    await this.send({
      to: order.email,
      subject: `ROSYNX — Order ${order.orderNumber} confirmed`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Order <strong>${order.orderNumber}</strong></p>
        <ul>${lines}</ul>
        <p>Total: <strong>${order.currency} ${(order.totalCents / 100).toFixed(2)}</strong></p>
        <p>We'll email you again when it ships.</p>`,
    });
  }

  async contactNotification(msg: {
    name: string;
    email: string;
    subject?: string | null;
    message: string;
  }) {
    const support =
      this.config.get<string>('SUPPORT_EMAIL') ?? 'support@rosynx.com';
    await this.send({
      to: support,
      subject: `ROSYNX — New contact message${msg.subject ? `: ${msg.subject}` : ''}`,
      html: `
        <h2>New contact message</h2>
        <p><strong>From:</strong> ${escapeHtml(msg.name)} (${escapeHtml(msg.email)})</p>
        ${msg.subject ? `<p><strong>Subject:</strong> ${escapeHtml(msg.subject)}</p>` : ''}
        <p>${escapeHtml(msg.message)}</p>`,
    });
  }

  /**
   * Emails the ORIGINAL SENDER an admin's reply to their enquiry. Failures are
   * swallowed: the reply is already persisted and readable in the customer's
   * account, so a mail outage must not fail the admin's request.
   */
  async supportReply(
    msg: {
      name: string;
      email: string;
      subject?: string | null;
      message: string;
    },
    replyBody: string,
  ) {
    try {
      await this.send({
        to: msg.email,
        subject: `Re: ${msg.subject || 'your enquiry'} — ROSYNX Support`,
        html: `
        <h2>ROSYNX Support</h2>
        <p>Hi ${escapeHtml(msg.name)},</p>
        <p>${escapeHtml(replyBody)}</p>
        <hr />
        <p style="color:#888"><strong>Your original message:</strong></p>
        ${msg.subject ? `<p style="color:#888"><strong>Subject:</strong> ${escapeHtml(msg.subject)}</p>` : ''}
        <p style="color:#888">${escapeHtml(msg.message)}</p>
        <p>You can also reply from your account.</p>`,
      });
    } catch (e) {
      this.logger.error(
        `supportReply email to ${msg.email} failed (reply is saved)`,
        e as Error,
      );
    }
  }

  private async sendViaResend(msg: EmailMessage): Promise<void> {
    const key = this.config.get<string>('RESEND_API_KEY');
    const from =
      this.config.get<string>('EMAIL_FROM') ?? 'ROSYNX <onboarding@resend.dev>';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html }),
      });
      if (!res.ok) this.logger.error(`Resend failed: ${res.status}`);
    } catch (e) {
      this.logger.error('Resend error', e as Error);
    }
  }
}
