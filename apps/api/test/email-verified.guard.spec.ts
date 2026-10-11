import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { EmailVerifiedGuard } from '../src/common/guards/email-verified.guard';

describe('EmailVerifiedGuard (Policy BR-I07)', () => {
  let guard: EmailVerifiedGuard;

  beforeEach(() => {
    guard = new EmailVerifiedGuard();
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow verified users to proceed', () => {
    const ctx = createMockContext({ id: 'u1', emailVerified: true });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException for unverified users', () => {
    const ctx = createMockContext({ id: 'u2', emailVerified: false });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user is attached to request', () => {
    const ctx = createMockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
