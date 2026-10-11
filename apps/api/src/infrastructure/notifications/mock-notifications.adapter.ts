import { Injectable, Logger } from '@nestjs/common';
import { NotificationAdapter, PushNotificationPayload } from './notifications.interface';

@Injectable()
export class MockNotificationAdapter implements NotificationAdapter {
  private readonly logger = new Logger(MockNotificationAdapter.name);

  async sendPush(payload: PushNotificationPayload): Promise<boolean> {
    const maskedToken = payload.pushToken.substring(0, 8) + '...';
    this.logger.log(`[MockNotificationAdapter] Sent push to token=${maskedToken} title="${payload.title}"`);
    return true;
  }
}
