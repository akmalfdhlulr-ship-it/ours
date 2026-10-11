export interface QueueJob<T = unknown> {
  name: string;
  data: T;
}

export interface QueueAdapter {
  enqueue<T = unknown>(queueName: string, job: QueueJob<T>): Promise<string>;
}

export const QUEUE_ADAPTER = Symbol('QUEUE_ADAPTER');
