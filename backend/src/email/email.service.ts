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
    // Gmail / any SMTP: sends to ANY recipient, free, no domain needed. Best for
    // a startup that hasn't bought a domain yet (Resend refuses non-owner
    // recipients until a domain is verified).
    if (
      (provider === 'gmail' || provider === 'smtp') &&
      this.config.get('SMTP_USER') &&
      this.config.get('SMTP_PASS')
    ) {
      return this.sendViaSmtp(msg);
    }
    // Brevo: HTTP API over port 443, so it works on hosts that block SMTP
    // (Render free tier blocks all outbound SMTP). Free 300/day, delivers to
    // ANY recipient after a single-sender verification — no domain purchase.
    if (provider === 'brevo' && this.config.get('BREVO_API_KEY')) {
      return this.sendViaBrevo(msg);
    }
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
    // Best-effort: a mail failure must never fail a placed order.
    try {
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
    } catch (e) {
      this.logger.error(
        `orderConfirmation email to ${order.email} failed (order is placed)`,
        e as Error,
      );
    }
  }

  async contactNotification(msg: {
    name: string;
    email: string;
    subject?: string | null;
    message: string;
  }) {
    const support =
      this.config.get<string>('SUPPORT_EMAIL') ?? 'support@rosynx.com';
    // Best-effort: the message is already saved as a ticket; a mail failure must
    // never fail the customer's contact-form submission.
    try {
      await this.send({
        to: support,
        subject: `ROSYNX — New contact message${msg.subject ? `: ${msg.subject}` : ''}`,
        html: `
        <h2>New contact message</h2>
        <p><strong>From:</strong> ${escapeHtml(msg.name)} (${escapeHtml(msg.email)})</p>
        ${msg.subject ? `<p><strong>Subject:</strong> ${escapeHtml(msg.subject)}</p>` : ''}
        <p>${escapeHtml(msg.message)}</p>`,
      });
    } catch (e) {
      this.logger.error(
        `contactNotification email failed (ticket is saved)`,
        e as Error,
      );
    }
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

  // Cached SMTP transporter (nodemailer). Created lazily on first send.
  private smtpTransport: import('nodemailer').Transporter | null = null;

  /**
   * Send via SMTP (Gmail by default). Free and delivers to ANY recipient with no
   * domain purchase — the from-address is a real Gmail so Google signs it.
   *
   * Setup: EMAIL_PROVIDER=gmail, SMTP_USER=you@gmail.com,
   * SMTP_PASS=<16-char App Password> (Google account → 2-Step Verification →
   * App passwords), EMAIL_FROM="ROSYNX <you@gmail.com>".
   * For a non-Gmail SMTP host, also set SMTP_HOST + SMTP_PORT.
   */
  private async sendViaSmtp(msg: EmailMessage): Promise<void> {
    if (!this.smtpTransport) {
      const nodemailer = await import('nodemailer');
      const host = this.config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com';
      const port = Number(this.config.get<string>('SMTP_PORT') ?? 465);
      this.smtpTransport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
    const from =
      this.config.get<string>('EMAIL_FROM') ??
      `ROSYNX <${this.config.get<string>('SMTP_USER')}>`;
    try {
      await this.smtpTransport.sendMail({
        from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
      });
    } catch (e) {
      // Surface the real reason (bad App Password, blocked login, quota) so the
      // OTP/verify paths can propagate it; best-effort callers catch it.
      this.logger.error(`SMTP send failed to ${msg.to}`, e as Error);
      throw new Error('Email send failed (SMTP)');
    }
  }

  /**
   * Send via Brevo's transactional HTTP API (https, port 443). Works where SMTP
   * is blocked (e.g. Render's free tier). Free 300 emails/day; the from-address
   * must be a Brevo-verified single sender (or a verified domain) — verify one
   * Gmail by clicking Brevo's confirmation link, no domain needed.
   *
   * Setup: EMAIL_PROVIDER=brevo, BREVO_API_KEY=<Brevo → SMTP & API → API Keys>,
   * EMAIL_FROM="ROSYNX <your-verified-sender@gmail.com>".
   */
  private async sendViaBrevo(msg: EmailMessage): Promise<void> {
    const key = this.config.get<string>('BREVO_API_KEY');
    const fromRaw =
      this.config.get<string>('EMAIL_FROM') ?? 'ROSYNX <no-reply@rosynx.com>';
    // Parse "Name <email>" → { name, email }; fall back to the raw as email.
    const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(fromRaw);
    const sender = match
      ? { name: match[1] || 'ROSYNX', email: match[2] }
      : { name: 'ROSYNX', email: fromRaw };
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': key as string,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: msg.to }],
        subject: msg.subject,
        htmlContent: msg.html,
      }),
    });
    if (!res.ok) {
      // Surface the reason (unverified sender, bad key, quota) so OTP/verify
      // paths propagate it; best-effort callers catch it.
      const body = await res.text().catch(() => '');
      this.logger.error(`Brevo send failed (${res.status}) to ${msg.to}: ${body}`);
      throw new Error(`Email send failed (${res.status})`);
    }
  }

  private async sendViaResend(msg: EmailMessage): Promise<void> {
    const key = this.config.get<string>('RESEND_API_KEY');
    const from =
      this.config.get<string>('EMAIL_FROM') ?? 'ROSYNX <onboarding@resend.dev>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, html: msg.html }),
    });
    if (!res.ok) {
      // Surface the real reason (e.g. "domain is not verified", "you can only
      // send to your own address in test mode") so failures aren't silent. The
      // OTP/verify paths let this propagate; best-effort callers catch it.
      const body = await res.text().catch(() => '');
      this.logger.error(`Resend send failed (${res.status}) to ${msg.to}: ${body}`);
      throw new Error(`Email send failed (${res.status})`);
    }
  }
}
