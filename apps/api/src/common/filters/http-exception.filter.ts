import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '@ours/core';
import { ApiErrorResponse } from '@ours/contracts';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request.correlationId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected internal error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        errorCode = exception.name || 'HTTP_ERROR';
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body.message || exception.message;
        errorCode = body.error || exception.name || 'HTTP_ERROR';

        if (body.details !== undefined) {
          details = body.details;
        } else if (Array.isArray(body.message)) {
          details = body.message;
          message = 'Validation failed';
        } else {
          const { message: _m, error: _e, statusCode: _s, ...rest } = body;
          if (Object.keys(rest).length > 0) {
            details = rest;
          }
        }
      }
    } else if (exception instanceof DomainError) {
      status = exception.statusCode;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof Error) {
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    this.logger.error(
      `[${correlationId}] ${request.method} ${request.url} - ${status} ${errorCode}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorPayload: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      correlationId,
    };

    response.status(status).json(errorPayload);
  }
}
