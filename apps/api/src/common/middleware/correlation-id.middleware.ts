import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existingId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string);

    const correlationId = existingId || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
