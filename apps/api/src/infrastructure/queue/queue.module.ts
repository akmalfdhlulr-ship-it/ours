import { Global, Module } from '@nestjs/common';
import { QUEUE_ADAPTER } from './queue.interface';
import { MemoryQueueAdapter } from './memory-queue.adapter';

@Global()
@Module({
  providers: [
    {
      provide: QUEUE_ADAPTER,
      useClass: MemoryQueueAdapter,
    },
  ],
  exports: [QUEUE_ADAPTER],
})
export class QueueModule {}
