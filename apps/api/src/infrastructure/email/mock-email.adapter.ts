import { Injectable, Logger } from '@nestjs/common';
import { EmailAdapter, SendEmailOptions } from './email.interface';

@Injectable()
export class MockEmailAdapter implements EmailAdapter {
  private readonly logger = new Logger(MockEmailAdapter.name);

  async send(options: SendEmailOptions): Promise<boolean> {
    const maskedTo = options.to.replace(/(?<=^.{2}).+?(?=@)/, '***');
    this.logger.log(`[MockEmailAdapter] Sent email to ${maskedTo}: subject="${options.subject}"`);
    this.logger.log(`[MockEmailAdapter] Body: ${options.text || options.html}`);
    return true;
  }
}
