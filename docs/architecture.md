# Architecture

Visão arquitetural do template Kainos.

## Topologia em alto nível

```
┌──────────────────┐       JWT (NextAuth)         ┌──────────────────┐
│  Next.js (web)   │ ───────────────────────────► │  NestJS (api)    │
│  apps/web        │ ◄─────────────────────────── │  apps/api        │
│  port 3000       │     S2S (Internal Token)     │  port 3001       │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                 │
         │ OAuth Google/GitHub                             ├─► Postgres (Prisma)
         │                                                 ├─► Redis (BullMQ)
         │                                                 ├─► Storage: Volume/R2
         │                                                 └─► OpenAI (via ai-runtime)
```

## Auth flow

1. Usuário clica "Continuar com Google" no `/login`
2. NextAuth redireciona pro OAuth do Google, retorna com perfil
3. **`signIn` callback:** valida que tem email
4. **`jwt` callback:** chama S2S `POST /api/v1/internal/users/sync` com `X-Internal-Service-Token`
   - API faz upsert do User no Prisma, atribui role (USER ou ADMIN baseado em `ADMIN_EMAILS`)
   - Retorna `{ id, email, role }`
   - Web substitui `token.sub` (que vinha do OAuth) pelo CUID do User
5. **`session` callback:** popula `session.user.id` e `session.user.role` a partir do JWT
6. Cliente passa Bearer JWT pra api em todas as requests subsequentes
7. **JwtStrategy:** valida o JWT com `NEXTAUTH_SECRET` (compartilhado entre web e api), extrai `userId` e `role`

Por que isso e não NextAuth standalone? Porque a api é um servidor independente que precisa autenticar requests sem chamar o web. Compartilhando o secret + algoritmo (HS256) ela valida o mesmo JWT que o web emite.

## Storage

`StorageService` é injetado via token `STORAGE_SERVICE` em `apps/api/src/storage/`. Dois providers:

- **`RailwayVolumeProvider`** (dev/test, e produção barata): grava em FS no path `VOLUME_ROOT`. Signed URL é um HMAC do path + expiração, validado pelo controller `GET /api/v1/storage/files/:path`.
- **`CloudflareR2Provider`** (produção S3-compatible): usa SDK `@aws-sdk/client-s3`. Signed URL é nativa do S3 com expiração.

Swap via `STORAGE_DRIVER=volume|r2`. Nenhum consumidor sabe qual está ativo.

## Queue (BullMQ)

`apps/api/src/queue/` traz:

- `queue.module.ts` — registra a queue `example` no BullMQ
- `example/example.queue.ts` — constante `EXAMPLE_QUEUE_NAME` + tipo `ExampleJobData`
- `example/example.processor.ts` — `WorkerHost` que processa o job
- `bull-board.module.ts` — dashboard `/admin/queues` protegido por basic auth

Para criar uma queue nova: copie a pasta `example/`, troque o nome em duas linhas, registre no `QueueModule`.

## ai-runtime

`apps/api/src/ai-runtime/`:

- `LlmConfig` model: `{ key, version, model, prompt, params, active }` — admin troca a versão ativa via endpoint sem deploy.
- `LlmConfigService`: CRUD + cache de 60s da config ativa por `key`.
- `AiRuntimeService.generateObject({ key, schema, messages })`: resolve config, chama Vercel AI SDK `generateObject`, valida output com Zod schema.
- `providers/provider-registry.ts`: factory que mapeia `model` para uma `LanguageModel` do Vercel AI SDK. Hoje só OpenAI; estender adicionando branches.

A `key` é string livre — cada projeto define suas próprias (`extractor`, `chat`, `summarizer`, etc.).

## RBAC

Enum `Role { USER, ADMIN }` no Prisma. `@Roles(Role.ADMIN)` em controllers admin. `RolesGuard` global aplica em qualquer endpoint anotado. No web, o topbar mostra link `/admin` apenas para `session.user.role === 'ADMIN'`.

`ADMIN_EMAILS` (CSV de emails) controla quem recebe role `ADMIN` no primeiro login. Não há UI pra mudar role depois — fazer via Prisma Studio ou seed.

## Throttling

`@nestjs/throttler` configurado globalmente em `app.module.ts`. Bucket único `default: 600 req/min`. Adicione buckets nomeados por feature (`upload: 120/min`, `chat: 60/min`) e aplique com `@Throttle({ feature: { ttl, limit } })`.

`UserScopedThrottlerGuard` faz throttling por userId (não por IP) quando o request tem JWT — limita usuários autenticados individualmente.

## Comunicação web → api

- **JWT (NextAuth):** padrão para qualquer endpoint exposto ao cliente.
- **S2S (`INTERNAL_SERVICE_TOKEN`):** endpoints internos da api (ex: `/api/v1/internal/users/sync`) exigem header `X-Internal-Service-Token` validado pelo `InternalServiceGuard`. Usado pelo web no `jwt` callback do NextAuth, nunca exposto ao browser.

## Deploy

Railway recomendado. Cada serviço (web, api, postgres, redis) vira um serviço Railway. Volume montado em `/data` no api. Env vars sincronizadas via service references (`${{api.INTERNAL_SERVICE_TOKEN}}`).

Ver [`docs/deployment.md`](./deployment.md) para passo a passo.
