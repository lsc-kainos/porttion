import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EXAMPLE_QUEUE_NAME } from '../../queue/example/example.queue';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: EXAMPLE_QUEUE_NAME }),
    PrismaModule,
    AuthModule,
  ],
  providers: [MetricsService],
  controllers: [MetricsController],
})
export class MetricsModule {}
