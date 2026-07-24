import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Tells the storefront to rebuild affected pages immediately after an admin
 * edit, instead of waiting out the ISR window (/shop 5 min, /product 10 min).
 *
 * Every call is best-effort and fire-and-forget: the database write is already
 * committed by the time we get here, so a storefront hiccup must never fail the
 * admin's save. Worst case the page refreshes on its normal ISR schedule.
 */
@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);

  constructor(private readonly config: ConfigService) {}

  private get target(): { url: string; secret: string } | null {
    const url = this.config.get<string>('STOREFRONT_URL');
    const secret = this.config.get<string>('REVALIDATE_SECRET');
    if (!url || !secret) return null; // not configured — silently no-op
    return { url: url.replace(/\/+$/, ''), secret };
  }

  /** Purge specific storefront paths. Never throws. */
  purge(paths: string[]): void {
    const t = this.target;
    if (!t || !paths.length) return;

    // Deliberately not awaited: the caller's response shouldn't wait on this.
    void (async () => {
      try {
        const res = await fetch(`${t.url}/api/revalidate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-revalidate-secret': t.secret,
          },
          body: JSON.stringify({ paths }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
          this.logger.warn(
            `Revalidate failed (${res.status}) for ${paths.join(', ')}`,
          );
        } else {
          this.logger.log(`Revalidated: ${paths.join(', ')}`);
        }
      } catch (err) {
        this.logger.warn(
          `Revalidate request failed: ${(err as Error).message}`,
        );
      }
    })();
  }

  /** A product changed. `number` is the storefront's numeric route id. */
  product(number?: number | null): void {
    const paths = ['/', '/shop'];
    if (number != null) paths.push(`/product/${number}`);
    this.purge(paths);
  }

  /** A category changed — affects the catalog listings. */
  category(): void {
    this.purge(['/', '/shop']);
  }

  /** A blog post changed. */
  blog(slug?: string | null): void {
    const paths = ['/', '/blogs'];
    if (slug) paths.push(`/blog/${slug}`);
    this.purge(paths);
  }

  /** Store settings changed (footer/contact details are rendered server-side). */
  settings(): void {
    this.purge(['/', '/shop', '/contact']);
  }

  /** An FAQ entry changed. */
  faq(): void {
    this.purge(['/faqs']);
  }
}
