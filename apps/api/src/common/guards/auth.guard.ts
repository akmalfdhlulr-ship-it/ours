import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@ours/database';
import { AUTH_CONFIG } from '@ours/core';
import { hashSha256, parseCookies } from '../../modules/auth/token.util';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const tokenHash = hashSha256(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session has expired or is invalid');
    }

    // Sliding window session extension (throttled to at most once per 15 minutes)
    const fifteenMinutesMs = AUTH_CONFIG.SESSION_SLIDING_WINDOW_MINUTES * 60 * 1000;
    const now = Date.now();
    const lastActive = session.lastActiveAt ? session.lastActiveAt.getTime() : 0;
    if (now - lastActive > fifteenMinutesMs) {
      const newExpiresAt = new Date(now + AUTH_CONFIG.SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      this.prisma.session
        .update({
          where: { id: session.id },
          data: {
            lastActiveAt: new Date(now),
            expiresAt: newExpiresAt,
          },
        })
        .catch(() => {
          // Do not fail current request if sliding window write fails
        });
    }

    // Attach to request context
    request.user = session.user;
    request.session = session;
    request.sessionToken = token;

    return true;
  }

  private extractTokenFromRequest(request: {
    headers: Record<string, string | string[] | undefined>;
  }): string | null {
    // 1. Authorization: Bearer <token>
    const authHeader = request.headers.authorization;
    if (typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type?.toLowerCase() === 'bearer' && token) {
        return token.trim();
      }
    }

    // 2. Cookie: ours_session=<token>
    const cookieHeader = request.headers.cookie;
    if (typeof cookieHeader === 'string') {
      const cookies = parseCookies(cookieHeader);
      if (cookies.ours_session) {
        return cookies.ours_session;
      }
    }

    return null;
  }
}
