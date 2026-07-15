import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Keeps the service awake on hosts that suspend idle instances (Render's free
 * tier spins down after ~15 min without inbound traffic, and the first visitor
 * afterwards waits ~9s for a cold start).
 *
 * The ping goes out to our own PUBLIC url, so it arrives back as real inbound
 * traffic and resets the idle timer. Keeping the process alive also keeps
 * PrismaService's DB keep-alive running, which in turn stops Neon scaling to
 * zero — so this one ping prevents both cold starts.
 *
 * Set SELF_URL to the public base url to enable; unset (the default, e.g.
 * locally) it does nothing.
 *
 * Note: an always-on free instance uses ~730 of Render's 750 free
 * instance-hours per month, so this is only viable for a single free service.
 */
@Injectable()
export class KeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAliveService.name);
  private timer?: NodeJS.Timeout;

  // Comfortably inside Render's ~15 min idle window.
  private static readonly INTERVAL_MS = 10 * 60_000;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const base = this.config.get<string>('SELF_URL')?.replace(/\/+$/, '');
    if (!base) {
      this.logger.log('SELF_URL not set — keep-alive disabled.');
      return;
    }

    const url = `${base}/api/v1/categories`;
    this.logger.log(
      `Keep-alive enabled: pinging ${url} every ${KeepAliveService.INTERVAL_MS / 60000} min.`,
    );

    this.timer = setInterval(async () => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'user-agent': 'rosynx-keepalive' },
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) this.logger.warn(`Keep-alive ping got HTTP ${res.status}`);
      } catch (err) {
        // Never throw from a timer — an unhandled rejection would crash the app.
        this.logger.warn(`Keep-alive ping failed: ${(err as Error).message}`);
      }
    }, KeepAliveService.INTERVAL_MS);

    this.timer.unref(); // never block process exit
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
