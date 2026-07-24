import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export const SUSPENDED_MESSAGE =
  'This account has been suspended. Please contact support.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
      },
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    // Checked only after the password verifies, so it can't be used to probe
    // which emails exist.
    if (!user.isActive) throw new ForbiddenException(SUSPENDED_MESSAGE);
    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    // 1) Verify the token. Bad/expired token → 401.
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2) DB lookup is OUTSIDE the auth catch. If Neon is waking (P1001), surface
    //    503 so the admin panel doesn't wrongly log the user out.
    let user: User | null;
    try {
      user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientInitializationError ||
        (err as { code?: string })?.code === 'P1001'
      ) {
        throw new ServiceUnavailableException('Database temporarily unavailable');
      }
      throw err;
    }
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    if (!user.isActive) throw new ForbiddenException(SUSPENDED_MESSAGE);
    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8)
      throw new UnauthorizedException('New password must be at least 8 characters');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { changed: true };
  }

  /**
   * Step 1 of the forgot-password flow: email a 6-digit OTP. We ALWAYS return
   * ok, whether or not the email exists, so this can't be used to enumerate
   * accounts. Only a hash of the code is stored; it expires in 15 minutes.
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (user && user.isActive) {
      const otp = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const resetOtpHash = await bcrypt.hash(otp, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetOtpHash,
          resetOtpExpiry: new Date(Date.now() + 15 * 60 * 1000),
          resetOtpAttempts: 0,
        },
      });
      try {
        await this.email.passwordResetOtp(user.email, user.name, otp);
      } catch (e) {
        this.logger.error(`reset OTP email to ${user.email} failed`, e as Error);
      }
    }
    return { ok: true };
  }

  /**
   * Step 2: verify the OTP and set a new password. Throttled to 5 wrong tries,
   * after which the code is burned and a new one must be requested.
   */
  async resetPassword(email: string, otp: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8)
      throw new BadRequestException('New password must be at least 8 characters');

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    const invalid = new BadRequestException('Invalid or expired reset code');
    if (!user || !user.resetOtpHash || !user.resetOtpExpiry) throw invalid;

    if (user.resetOtpExpiry < new Date()) {
      await this.clearOtp(user.id);
      throw new BadRequestException('Reset code expired — request a new one');
    }
    if (user.resetOtpAttempts >= 5) {
      await this.clearOtp(user.id);
      throw new BadRequestException('Too many attempts — request a new code');
    }

    const ok = await bcrypt.compare(otp.trim(), user.resetOtpHash);
    if (!ok) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetOtpAttempts: { increment: 1 } },
      });
      throw invalid;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtpHash: null,
        resetOtpExpiry: null,
        resetOtpAttempts: 0,
      },
    });
    return { reset: true };
  }

  private async clearOtp(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { resetOtpHash: null, resetOtpExpiry: null, resetOtpAttempts: 0 },
    });
  }

  private async buildAuthResponse(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m') as never,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d') as never,
    });
    return { user: this.publicUser(user), accessToken, refreshToken };
  }

  private publicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as Role,
      isActive: user.isActive,
    };
  }
}
