import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EXAMPLE_QUEUE_NAME } from '../../queue/example/example.queue';
import type {
  MetricsResponseDto,
  QueueMetrics,
  UserMetrics,
} from './dto/metrics-response.dto';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const EMPTY_QUEUE_METRICS: QueueMetrics = {
  waiting: 0,
  active: 0,
  completed: 0,
  failed: 0,
  delayed: 0,
  paused: 0,
};

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @InjectQueue(EXAMPLE_QUEUE_NAME)
    private readonly exampleQueue?: Queue,
  ) {}

  async getMetrics(): Promise<MetricsResponseDto> {
    const [users, exampleQueue] = await Promise.all([
      this.getUserMetrics(),
      this.exampleQueue
        ? this.getQueueMetrics(this.exampleQueue)
        : Promise.resolve(EMPTY_QUEUE_METRICS),
    ]);

    return {
      users,
      exampleQueue,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getUserMetrics(): Promise<UserMetrics> {
    const since30d = new Date(Date.now() - THIRTY_DAYS_MS);
    const [total, new30d] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: since30d } } }),
    ]);
    return { total, new30d };
  }

  private async getQueueMetrics(queue: Queue): Promise<QueueMetrics> {
    try {
      const counts = await queue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused',
      );
      return {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
        paused: counts.paused ?? 0,
      };
    } catch (err) {
      this.logger.warn('Queue metrics unavailable (Redis unreachable)', err);
      return EMPTY_QUEUE_METRICS;
    }
  }
}
