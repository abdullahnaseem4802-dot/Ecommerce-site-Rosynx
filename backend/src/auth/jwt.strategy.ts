import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from './decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') as string,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    // A valid signature isn't enough: an access token stays valid for its full
    // lifetime, so without this lookup a blocked user would keep working until
    // it expired. Re-check isActive on every request instead.
    let user: { id: string; email: string; role: string; isActive: boolean } | null;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, isActive: true },
      });
    } catch (err) {
      // Mirrors auth.service.ts refresh(): Neon auto-suspends and the first
      // query to a cold instance can fail with P1001. A connection failure says
      // nothing about whether this user is blocked — answering Unauthorized
      // would log EVERY user out on a cold start. Surface 503 instead.
      if (
        err instanceof Prisma.PrismaClientInitializationError ||
        (err as { code?: string })?.code === 'P1001'
      ) {
        throw new ServiceUnavailableException('Database temporarily unavailable');
      }
      throw err;
    }

    if (!user) throw new UnauthorizedException();
    if (!user.isActive)
      throw new UnauthorizedException(
        'This account has been suspended. Please contact support.',
      );

    return { id: user.id, email: user.email, role: user.role };
  }
}
