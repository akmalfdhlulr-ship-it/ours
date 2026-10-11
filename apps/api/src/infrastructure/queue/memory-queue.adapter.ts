import { Injectable, Logger } from '@nestjs/common';
import { QueueAdapter, QueueJob } from './queue.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MemoryQueueAdapter implements QueueAdapter {
  private readonly logger = new Logger(MemoryQueueAdapter.name);

  async enqueue<T = unknown>(queueName: string, job: QueueJob<T>): Promise<string> {
    const jobId = uuidv4();
    this.logger.log(`[MemoryQueueAdapter] Enqueued job ${job.name} (id=${jobId}) in queue "${queueName}"`);
    return jobId;
  }
}
