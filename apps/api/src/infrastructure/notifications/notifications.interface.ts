export interface PushNotificationPayload {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationAdapter {
  sendPush(payload: PushNotificationPayload): Promise<boolean>;
}

export const NOTIFICATION_ADAPTER = Symbol('NOTIFICATION_ADAPTER');
