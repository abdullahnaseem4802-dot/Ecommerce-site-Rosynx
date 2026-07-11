import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Populates request.user when a valid JWT is present, but allows the request
 * through when it is absent/invalid. Use on routes that serve both logged-in
 * users and guests (e.g. cart). Pair with @Public() to bypass the global guard.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user ?? null;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as Promise<boolean>;
  }
}
