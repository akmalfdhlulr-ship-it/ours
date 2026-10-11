import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentSpace = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const space = request.coupleSpace;
    return data && space ? space[data] : space;
  },
);
