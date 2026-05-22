import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EXAMPLE_QUEUE_NAME } from '../../queue/example/example.queue';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

// Quando QUEUE_ENABLED=false, BullModule global não está registrado.
// Pulamos registerQueue aqui também — MetricsService injeta o queue
// com @Optional() e devolve zeros quando ausente.
const queueImports =
  process.env.QUEUE_ENABLED !== 'false'
    ? [BullModule.registerQueue({ name: EXAMPLE_QUEUE_NAME })]
    : [];

@Module({
  imports: [...queueImports, PrismaModule, AuthModule],
  providers: [MetricsService],
  controllers: [MetricsController],
})
export class MetricsModule {}
