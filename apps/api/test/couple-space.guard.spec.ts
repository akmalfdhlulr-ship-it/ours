import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CoupleSpaceGuard } from '../src/common/guards/couple-space.guard';
import { ALLOW_PENDING_SPACE_KEY } from '../src/common/decorators/allow-pending-space.decorator';

describe('CoupleSpaceGuard', () => {
  let guard: CoupleSpaceGuard;
  let reflector: Reflector;
  let prismaMock: any;

  beforeEach(() => {
    reflector = new Reflector();
    prismaMock = {
      coupleMembership: {
        findFirst: jest.fn(),
      },
    };
    guard = new CoupleSpaceGuard(prismaMock, reflector);
  });

  const createMockContext = (
    requestData: any,
    allowPending = false,
    isPublic = false,
  ): ExecutionContext => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: any) => {
      if (key === ALLOW_PENDING_SPACE_KEY) return allowPending;
      if (key === 'isPublic') return isPublic;
      return false;
    });

    return {
      switchToHttp: () => ({
        getRequest: () => requestData,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('throws ForbiddenException when user is not in request', async () => {
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when membership not found', async () => {
    prismaMock.coupleMembership.findFirst.mockResolvedValue(null);
    const context = createMockContext({
      user: { id: 'u1' },
      params: { spaceId: 's1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      'You are not an active member of this couple space',
    );
  });

  it('throws ForbiddenException when couple space is ARCHIVED', async () => {
    prismaMock.coupleMembership.findFirst.mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      coupleSpaceId: 's1',
      status: 'ACTIVE',
      coupleSpace: { id: 's1', status: 'ARCHIVED' },
    });

    const context = createMockContext({
      user: { id: 'u1' },
      params: { spaceId: 's1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      'This couple space has been archived and cannot be accessed or modified',
    );
  });

  it('throws ForbiddenException when space is PENDING and @AllowPendingSpace is not set', async () => {
    prismaMock.coupleMembership.findFirst.mockResolvedValue({
      id: 'm1',
      userId: 'u1',
      coupleSpaceId: 's1',
      status: 'ACTIVE',
      coupleSpace: { id: 's1', status: 'PENDING' },
    });

    const context = createMockContext(
      {
        user: { id: 'u1' },
        params: { spaceId: 's1' },
      },
      false, // allowPending = false
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Couple space is still pending partner pairing',
    );
  });

  it('allows access to PENDING space when @AllowPendingSpace is set', async () => {
    const mockSpace = { id: 's1', status: 'PENDING' };
    const mockMembership = {
      id: 'm1',
      userId: 'u1',
      coupleSpaceId: 's1',
      status: 'ACTIVE',
      coupleSpace: mockSpace,
    };
    prismaMock.coupleMembership.findFirst.mockResolvedValue(mockMembership);

    const request: any = {
      user: { id: 'u1' },
      params: { spaceId: 's1' },
    };
    const context = createMockContext(request, true);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request.coupleSpace).toBe(mockSpace);
    expect(request.membership).toBe(mockMembership);
  });

  it('allows access to ACTIVE space', async () => {
    const mockSpace = { id: 's1', status: 'ACTIVE' };
    const mockMembership = {
      id: 'm1',
      userId: 'u1',
      coupleSpaceId: 's1',
      status: 'ACTIVE',
      coupleSpace: mockSpace,
    };
    prismaMock.coupleMembership.findFirst.mockResolvedValue(mockMembership);

    const request: any = {
      user: { id: 'u1' },
      params: { spaceId: 's1' },
    };
    const context = createMockContext(request, false);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request.coupleSpace).toBe(mockSpace);
    expect(request.membership).toBe(mockMembership);
  });
});
