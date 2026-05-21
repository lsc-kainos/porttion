import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EXAMPLE_QUEUE_NAME } from './example/example.queue';
import { ExampleProcessor } from './example/example.processor';

// Módulo de fila distribuída (BullMQ + Redis).
// O job `example` é template: copie-o ao criar novos jobs.
// Para desligar este módulo: remova-o de app.module.ts e remova REDIS_URL,
// BULL_BOARD_* do env.schema.ts. Ver docs/modules.md.
@Module({
  imports: [BullModule.registerQueue({ name: EXAMPLE_QUEUE_NAME })],
  providers: [ExampleProcessor],
  exports: [BullModule],
})
export class QueueModule {}
