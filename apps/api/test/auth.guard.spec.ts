import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../src/common/guards/auth.guard';
import { hashSha256 } from '../src/modules/auth/token.util';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let mockPrisma: {
    session: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let mockReflector: {
    getAllAndOverride: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      session: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };
    authGuard = new AuthGuard(mockPrisma as any, mockReflector as any);
  });

  const createMockContext = (headers: Record<string, string>): ExecutionContext => {
    const request: any = { headers };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow public routes through without token verification', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createMockContext({});

    const canActivate = await authGuard.canActivate(ctx);
    expect(canActivate).toBe(true);
    expect(mockPrisma.session.findUnique).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when no authorization header or cookie is present', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createMockContext({});

    await expect(authGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when session is not found in database', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createMockContext({ authorization: 'Bearer invalid-token' });
    mockPrisma.session.findUnique.mockResolvedValue(null);

    await expect(authGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when session is expired', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const ctx = createMockContext({ authorization: 'Bearer expired-token' });
    mockPrisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      expiresAt: new Date(Date.now() - 1000), // in the past
      lastActiveAt: new Date(Date.now() - 10000),
      user: { id: 'u1' },
    });

    await expect(authGuard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should authenticate valid session and attach user and session to request', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const validToken = 'valid-session-token-123';
    const ctx = createMockContext({ authorization: `Bearer ${validToken}` });
    const mockSession = {
      id: 'session-1',
      tokenHash: hashSha256(validToken),
      expiresAt: new Date(Date.now() + 3600000),
      lastActiveAt: new Date(), // recent, so no sliding window update triggered
      user: { id: 'u1', email: 'test@example.com' },
    };
    mockPrisma.session.findUnique.mockResolvedValue(mockSession);

    const canActivate = await authGuard.canActivate(ctx);
    expect(canActivate).toBe(true);

    const req = ctx.switchToHttp().getRequest();
    expect(req.user).toEqual(mockSession.user);
    expect(req.session).toEqual(mockSession);
    expect(req.sessionToken).toBe(validToken);
  });

  it('should extract session token from ours_session cookie', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const validToken = 'cookie-session-token-456';
    const ctx = createMockContext({ cookie: `ours_session=${validToken}; other=1` });
    const mockSession = {
      id: 'session-2',
      tokenHash: hashSha256(validToken),
      expiresAt: new Date(Date.now() + 3600000),
      lastActiveAt: new Date(),
      user: { id: 'u2', email: 'cookie@example.com' },
    };
    mockPrisma.session.findUnique.mockResolvedValue(mockSession);

    const canActivate = await authGuard.canActivate(ctx);
    expect(canActivate).toBe(true);
  });
});
