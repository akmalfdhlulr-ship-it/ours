import { Global, Module } from '@nestjs/common';
import { NOTIFICATION_ADAPTER } from './notifications.interface';
import { MockNotificationAdapter } from './mock-notifications.adapter';

@Global()
@Module({
  providers: [
    {
      provide: NOTIFICATION_ADAPTER,
      useClass: MockNotificationAdapter,
    },
  ],
  exports: [NOTIFICATION_ADAPTER],
})
export class NotificationsModule {}
