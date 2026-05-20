import { PrismaClient } from '@prisma/client';

// Seed mínimo do template. Idempotente — pode rodar quantas vezes quiser.
// Cada projeto deve estender este arquivo conforme criar dados de bootstrap
// próprios (configs de LLM, dados estáticos, etc.).
const prisma = new PrismaClient();

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[seed] template seed — nada a popular por enquanto');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] failed', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
