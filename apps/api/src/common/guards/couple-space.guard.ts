import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@ours/database';
import { ALLOW_PENDING_SPACE_KEY } from '../decorators/allow-pending-space.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class CoupleSpaceGuard implements CanActivate {
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
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    const allowPending = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PENDING_SPACE_KEY,
      [context.getHandler(), context.getClass()],
    );

    let spaceId = request.params?.spaceId || request.body?.spaceId;

    let membership;
    if (spaceId) {
      membership = await this.prisma.coupleMembership.findFirst({
        where: {
          userId: user.id,
          coupleSpaceId: spaceId,
          status: 'ACTIVE',
        },
        include: {
          coupleSpace: true,
        },
      });
    } else {
      membership = await this.prisma.coupleMembership.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE',
        },
        include: {
          coupleSpace: true,
        },
      });
      if (membership) {
        spaceId = membership.coupleSpaceId;
      }
    }

    if (!membership) {
      throw new ForbiddenException(
        'You are not an active member of this couple space',
      );
    }

    const space = membership.coupleSpace;
    if (space.status === 'ARCHIVED') {
      throw new ForbiddenException(
        'This couple space has been archived and cannot be accessed or modified',
      );
    }

    if (space.status === 'PENDING' && !allowPending) {
      throw new ForbiddenException(
        'Couple space is still pending partner pairing',
      );
    }

    request.coupleSpace = space;
    request.membership = membership;

    return true;
  }
}
