# Módulos opcionais

O template inclui storage, queue (BullMQ) e ai-runtime. Cada um é independente — você pode desligar qualquer um sem afetar os outros. Este doc explica como.

## Como desligar Storage (Volume + R2)

Se seu projeto não armazena arquivos:

1. **Schema:** nada a remover (Storage não tem model próprio).
2. **API:**
   - Remover import `StorageModule` de `apps/api/src/app.module.ts`
   - Deletar `apps/api/src/storage/`
3. **Env:** remover `STORAGE_DRIVER`, `VOLUME_ROOT`, `STORAGE_URL_SECRET`, `UPLOAD_MAX_BYTES`, `R2_*` de `.env.example` e de `apps/api/src/config/env.schema.ts`.
4. **Deps:** `apps/api/package.json` — remover `@aws-sdk/client-s3` se não for usar S3 em outro lugar.
5. **Docs:** remover seção Storage de `docs/architecture.md` e `docs/deployment.md`.

## Como desligar Queue (BullMQ + Bull Board)

Se seu projeto não processa nada assíncrono:

1. **Schema:** nada a remover.
2. **API:**
   - Remover `QueueModule` e `BullBoardAdminModule` de `apps/api/src/app.module.ts`
   - Remover o `BullModule.forRootAsync({...})` do bloco `imports` em `app.module.ts`
   - Deletar `apps/api/src/queue/`
   - Atualizar `apps/api/src/admin/metrics/metrics.module.ts` para não importar a queue exemplo (ou desligar métricas — ver abaixo)
3. **Env:** remover `REDIS_URL`, `BULL_BOARD_*`, `BULL_DASHBOARD_URL` de `.env.example` e `env.schema.ts`.
4. **Deps:** `apps/api/package.json` — remover `@nestjs/bullmq`, `bullmq`, `@bull-board/*`.
5. **docker-compose.yml:** remover serviço Redis.
6. **Web:** remover card "Queues" do `/admin` hub.

## Como desligar ai-runtime (LlmConfig + LLM provider)

Se seu projeto não usa LLM:

1. **Schema:** remover `model LlmConfig` de `apps/api/prisma/schema.prisma` + remover a relação `llmConfigs` no `User`. Rodar `prisma migrate dev --name remove_llm_config`.
2. **API:**
   - Remover `AiRuntimeModule` de `apps/api/src/app.module.ts`
   - Deletar `apps/api/src/ai-runtime/`
3. **Env:** remover `OPENAI_API_KEY`, `LLM_PROVIDER` de `.env.example` e `env.schema.ts` (e o `superRefine` que valida `LLM_PROVIDER=openai`).
4. **Deps:** `apps/api/package.json` — remover `@ai-sdk/openai`, `ai`.
5. **Web:** se você expunha alguma UI de admin de LLM configs, remova.

## Como desligar o admin panel inteiro

Se seu projeto não precisa de painel admin:

1. **API:**
   - Remover `MetricsModule` de `apps/api/src/app.module.ts`
   - Remover `BullBoardAdminModule` (Bull Board) de `apps/api/src/app.module.ts`
   - Deletar `apps/api/src/admin/`
   - Deletar `apps/api/src/queue/bull-board.module.ts`
2. **Web:**
   - Deletar `apps/web/app/(authed)/admin/`
   - Em `apps/web/components/layout/topbar.tsx`, remover o bloco `...(user.role === 'ADMIN' ? [...] : [])` do `navItems`.
3. **Schema:** considere remover `Role` enum + a coluna `role` do User se não tiver outro uso.

## Como desligar i18n (usar inglês hardcoded ou só pt-BR)

Se você quer simplificar para uma única língua:

1. **Web:**
   - Deletar `apps/web/i18n/`
   - Remover `next-intl` de `apps/web/package.json`
   - Remover `import { NextIntlClientProvider }` e o wrapper em `apps/web/app/layout.tsx`
   - Substituir `useTranslations` / `getTranslations` por strings hardcoded
2. **Messages:** deletar `apps/web/messages/`

Não recomendado — manter `next-intl` desde o dia 0 (mesmo com só uma língua) facilita muito adicionar outra língua depois.

## Resumindo

| Módulo     | Impacto se desligar                                | Esforço                 |
| ---------- | -------------------------------------------------- | ----------------------- |
| Storage    | Sem upload/download de arquivos                    | 15min                   |
| Queue      | Sem processamento assíncrono, sem Bull Board       | 20min                   |
| ai-runtime | Sem LLM                                            | 15min                   |
| Admin      | Sem painel admin (mas mantém RBAC pra outros usos) | 10min                   |
| i18n       | Texto hardcoded em uma só língua                   | 30min (não recomendado) |

Depois de desligar qualquer módulo, rode `npm run typecheck` e `npm run test` para garantir que nada quebrou.
