import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { sanitizeForLogging } from '@ours/core';

@Injectable()
export class AppLogger implements NestLoggerService {
  private formatLog(level: string, message: any, context?: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logObject: Record<string, any> = {
      timestamp,
      level,
      context: context || 'App',
      message: typeof message === 'string' ? message : sanitizeForLogging(message),
    };

    if (meta) {
      logObject.meta = sanitizeForLogging(meta);
    }

    return JSON.stringify(logObject);
  }

  log(message: any, context?: string, meta?: any) {
    console.log(this.formatLog('INFO', message, context, meta));
  }

  error(message: any, trace?: string, context?: string, meta?: any) {
    const errorMeta = { trace, ...meta };
    console.error(this.formatLog('ERROR', message, context, errorMeta));
  }

  warn(message: any, context?: string, meta?: any) {
    console.warn(this.formatLog('WARN', message, context, meta));
  }

  debug(message: any, context?: string, meta?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatLog('DEBUG', message, context, meta));
    }
  }

  verbose(message: any, context?: string, meta?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatLog('VERBOSE', message, context, meta));
    }
  }
}
