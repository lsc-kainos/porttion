import { PrismaClient } from '@prisma/client';
import { ASSET_ANALYSIS_V1 } from '../src/ai-analyst/prompts/asset-analysis-v1';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Garante um usuário "system" para a coluna createdBy de LlmConfig.
  const system = await prisma.user.upsert({
    where: { email: 'system@porttion.local' },
    create: { email: 'system@porttion.local', name: 'system', role: 'ADMIN' },
    update: {},
  });

  await prisma.llmConfig.upsert({
    where: { key_version: { key: 'asset.analysis.v1', version: 1 } },
    create: {
      key: 'asset.analysis.v1',
      version: 1,
      active: true,
      model: ASSET_ANALYSIS_V1.model,
      prompt: ASSET_ANALYSIS_V1.system,
      params: ASSET_ANALYSIS_V1.params,
      createdBy: system.id,
    },
    update: { active: true },
  });
  // eslint-disable-next-line no-console
  console.log('[seed] asset.analysis.v1 active=true');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] failed', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
