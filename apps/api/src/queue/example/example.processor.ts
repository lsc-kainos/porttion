import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EXAMPLE_QUEUE_NAME, type ExampleJobData } from './example.queue';

// Processor de exemplo. Serve como ponto de partida para jobs reais.
// Para adicionar uma nova queue:
//   1. crie src/queue/<nome>/<nome>.queue.ts com o NAME constante + tipo
//   2. crie src/queue/<nome>/<nome>.processor.ts estendendo WorkerHost
//   3. registre BullModule.registerQueue({ name }) no QueueModule
//   4. registre o processor em providers do QueueModule
@Processor(EXAMPLE_QUEUE_NAME)
export class ExampleProcessor extends WorkerHost {
  private readonly logger = new Logger(ExampleProcessor.name);

  async process(job: Job<ExampleJobData>): Promise<void> {
    this.logger.log(
      `processing example job ${job.id} for user=${job.data.userId}: ${job.data.message}`,
    );
    await new Promise((r) => setTimeout(r, 100));
  }
}
