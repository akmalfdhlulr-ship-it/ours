import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentMembership = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const membership = request.membership;
    return data && membership ? membership[data] : membership;
  },
);
