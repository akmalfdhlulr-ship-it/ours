import { Global, Module } from '@nestjs/common';
import { EMAIL_ADAPTER } from './email.interface';
import { MockEmailAdapter } from './mock-email.adapter';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_ADAPTER,
      useClass: MockEmailAdapter,
    },
  ],
  exports: [EMAIL_ADAPTER],
})
export class EmailModule {}
