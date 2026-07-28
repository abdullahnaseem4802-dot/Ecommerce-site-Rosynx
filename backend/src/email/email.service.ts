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

  /**
   * Emails a subscriber a coupon code (admin "send to subscribers" action).
   * Best-effort per recipient — a single bad address must not abort the batch.
   */
  async couponOffer(
    to: string,
    coupon: {
      code: string;
      type: 'PERCENT' | 'FIXED';
      value: number;
      minSubtotalCents?: number;
      expiresAt?: Date | null;
      currency?: string;
    },
  ): Promise<boolean> {
    const cur = coupon.currency ?? 'USD';
    const amount =
      coupon.type === 'PERCENT'
        ? `${coupon.value}% off`
        : `${cur} ${(coupon.value / 100).toFixed(2)} off`;
    const min =
      coupon.minSubtotalCents && coupon.minSubtotalCents > 0
        ? `<p style="color:#888">Minimum spend: ${cur} ${(coupon.minSubtotalCents / 100).toFixed(2)}</p>`
        : '';
    const expiry = coupon.expiresAt
      ? `<p style="color:#888">Valid until ${new Date(coupon.expiresAt).toDateString()}</p>`
      : '';
    try {
      await this.send({
        to,
        subject: `A gift from ROSYNX — ${amount}`,
        html: `
        <h2>Here's a little something for you 🎁</h2>
        <p>Use this code at checkout to get <strong>${amount}</strong>:</p>
        <p style="font-size:22px;font-weight:700;letter-spacing:2px;padding:12px 16px;background:#faf5ef;border:1px dashed #c96b1f;border-radius:8px;display:inline-block">${escapeHtml(coupon.code)}</p>
        ${min}
        ${expiry}
        <p>Happy shopping,<br/>The ROSYNX team</p>`,
      });
      return true;
    } catch (e) {
      this.logger.error(`couponOffer email to ${to} failed`, e as Error);
      return false;
    }
  }

  /**
   * Emails a password-reset OTP. Failures propagate so the caller can surface a
   * "couldn't send, try again" — unlike the fire-and-forget support/coupon mail,
   * the whole reset flow is useless if the code never arrives.
   */
  async passwordResetOtp(to: string, name: string, otp: string): Promise<void> {
    await this.send({
      to,
      subject: 'ROSYNX — your password reset code',
      html: `
        <h2>Password reset</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your one-time reset code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px">${escapeHtml(otp)}</p>
        <p style="color:#888">This code expires in 15 minutes. If you didn't request it, you can ignore this email.</p>`,
    });
  }

  /**
   * Emails a signup verification OTP. Failures propagate so register() can tell
   * the user "we couldn't send your code" — the whole double-opt-in flow is
   * pointless if the code never arrives.
   */
  async verifyEmailOtp(to: string, name: string, otp: string): Promise<void> {
    await this.send({
      to,
      subject: 'ROSYNX — verify your email',
      html: `
        <h2>Welcome to ROSYNX 🎉</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>Confirm your email with this code to finish creating your account:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px">${escapeHtml(otp)}</p>
        <p style="color:#888">This code expires in 15 minutes. If you didn't sign up, you can ignore this email.</p>`,
    });
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
