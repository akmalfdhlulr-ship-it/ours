export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailAdapter {
  send(options: SendEmailOptions): Promise<boolean>;
}

export const EMAIL_ADAPTER = Symbol('EMAIL_ADAPTER');
