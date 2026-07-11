import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private keepAlive?: NodeJS.Timeout;

  /**
   * Connect with retry + backoff. Neon (serverless Postgres) auto-suspends the
   * compute after a few minutes idle; the first connection to a cold instance
   * can time out (P1001). Instead of crashing boot, wait for it to wake.
   */
  async onModuleInit() {
    const maxAttempts = 8;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Database connected on attempt ${attempt}.`);
        }
        this.startKeepAlive();
        return;
      } catch (err) {
        const last = attempt === maxAttempts;
        const wait = Math.min(1000 * 2 ** (attempt - 1), 8000);
        this.logger.warn(
          `DB connect attempt ${attempt}/${maxAttempts} failed` +
            (last ? '' : ` — retrying in ${wait}ms (Neon may be waking up)…`),
        );
        if (last) throw err;
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }

  /**
   * Keep-alive ping. Neon scales the compute to zero after ~5 min idle. During
   * development that means the first request after a pause hangs while it wakes.
   * A lightweight `SELECT 1` every 4 minutes keeps the instance warm. Disabled
   * by setting DB_KEEPALIVE=false. `.unref()` so it never blocks process exit.
   */
  private startKeepAlive() {
    if (process.env.DB_KEEPALIVE === 'false') return;
    this.keepAlive = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
      } catch (err) {
        this.logger.warn(
          `DB keep-alive ping failed (Neon may be waking up): ${
            (err as Error)?.message ?? err
          }`,
        );
      }
    }, 240000);
    this.keepAlive.unref();
  }

  /**
   * Run a query, retrying on transient Neon wake-up failures (P1001 /
   * PrismaClientInitializationError). Waits 500ms between attempts, up to 3
   * tries total, then rethrows. Use for user-facing reads that would otherwise
   * crash mid-suspend.
   */
  async withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const transient =
          err instanceof Prisma.PrismaClientInitializationError ||
          (err as { code?: string })?.code === 'P1001';
        if (!transient || attempt >= attempts) throw err;
        this.logger.warn(
          `Query failed (attempt ${attempt}/${attempts}, Neon may be waking) — retrying in 500ms…`,
        );
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  async onModuleDestroy() {
    if (this.keepAlive) clearInterval(this.keepAlive);
    await this.$disconnect();
  }
}
