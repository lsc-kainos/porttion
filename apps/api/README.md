# @kainos/api

Backend NestJS 11 do template Kainos. Auth, RBAC, storage abstrato, fila distribuída, ai-runtime.

## Módulos

| Módulo             | Responsabilidade                             | Rota base                   |
| ------------------ | -------------------------------------------- | --------------------------- |
| `auth`             | JWT validation, guards, decorators, RBAC     | —                           |
| `users`            | CRUD de usuários, sync interno (S2S)         | `/api/v1/users`             |
| `prisma`           | Singleton PrismaService                      | —                           |
| `health`           | Health check                                 | `/api/v1/healthz`           |
| `storage`          | Abstração Volume/R2 com signed URLs          | `/api/v1/storage`           |
| `queue`            | BullMQ + Redis + job exemplo                 | —                           |
| `queue/bull-board` | Dashboard de filas com basic auth            | `/admin/queues`             |
| `ai-runtime`       | Versionamento de configs LLM + provider regs | `/api/v1/admin/llm-configs` |
| `admin/metrics`    | Métricas (users + queues)                    | `/api/v1/admin/metrics`     |
| `common`           | Interceptors globais (logger)                | —                           |
| `config`           | Validação de env via Zod                     | —                           |

## Comandos

```bash
npm run dev               # nest start --watch
npm run build
npm run typecheck
npm run lint
npm run test              # Jest unit
npm run test:e2e          # Jest E2E
npx prisma migrate dev    # cria migration nova
npx prisma studio         # UI do banco
```

## Adicionar um módulo novo

```bash
nest g module <nome>
nest g controller <nome>
nest g service <nome>
```

Registre o módulo em `app.module.ts`. Para endpoints autenticados nada precisa fazer (`JwtAuthGuard` é global). Para admin-only, adicione `@Roles(Role.ADMIN)` no controller ou nas rotas individuais.

## Estrutura de teste

- `*.spec.ts` ao lado dos arquivos = unit tests (Jest, `npm run test`)
- `test/*.e2e-spec.ts` = E2E com supertest (`npm run test:e2e`)
