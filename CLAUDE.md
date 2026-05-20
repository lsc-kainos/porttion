# CLAUDE.md

Guidelines para Claude Code (claude.ai/code) ao trabalhar neste repositório e em apps derivados deste template.

## Sobre o template

`kainos-template-app` é o ponto de partida da Kainos para novos produtos. Traz auth, storage, queue, ai-runtime e RBAC já configurados — sem nada de domínio embutido. Cada produto deve estender o template adicionando seus próprios modelos, módulos e features.

Antes de adicionar features novas, considere: **isso é genérico (deveria estar no template) ou específico do produto (vive no app derivado)?** Mudanças genéricas voltam pro template via PR.

## Stack

Monorepo `npm workspaces` + Turborepo:

```
apps/web              # Next.js 16 (App Router) — frontend
apps/api              # NestJS 11 — backend
packages/shared-types # tipos genéricos (Role, MeResponse, ApiError)
```

- **Frontend:** Next.js 16 + shadcn/ui + Tailwind v4 + NextAuth (Google + GitHub) + next-themes + next-intl (pt-BR ativo)
- **Backend:** NestJS 11 + Prisma 6 + class-validator + @nestjs/throttler + helmet + BullMQ + Redis
- **DB/Storage:** PostgreSQL + Railway Volume (dev) / Cloudflare R2 (prod)
- **IA:** OpenAI via Vercel AI SDK (ai-runtime com versionamento de prompts)
- **Tooling dia-0:** ESLint + Prettier + Husky + lint-staged + commitlint (conventional commits) + GitHub Actions

## Decisões arquiteturais que precisam ser respeitadas

### Auth: NextAuth com JWT compartilhado entre web e api

Sem email/senha. O web faz upsert do usuário via S2S `INTERNAL_SERVICE_TOKEN` no `jwt` callback. O Nest valida o JWT com `NEXTAUTH_SECRET` compartilhado via `passport-jwt`. **Não introduzir provedores além de Google/GitHub sem confirmar** — adicionar provider = adicionar superfície de ataque e fluxo de UX.

### Storage abstrato — `STORAGE_SERVICE` token

A abstração em `apps/api/src/storage/` permite swap entre `RailwayVolumeProvider` e `CloudflareR2Provider` via `STORAGE_DRIVER=volume|r2`. **Nunca exponha o filesystem direto** — cliente sempre recebe signed URL com expiração ≤ 15 min.

### Fila distribuída BullMQ + Redis

O template traz um job de exemplo em `apps/api/src/queue/example/`. Para criar uma nova queue: copie a pasta, troque o nome, registre o processor em `QueueModule`. Bull Board fica protegido por basic auth.

### ai-runtime — versionamento de prompts em banco

`LlmConfig` armazena `key + version + model + prompt + params + active`. A `key` é string livre — cada projeto define suas próprias. Admin troca a versão ativa via endpoint sem deploy. **Não chamar OpenAI/Anthropic SDK direto** — use `AiRuntimeService.generateObject()` para manter versionamento + retry + validação Zod.

### shadcn/ui (componentes copiados), não MUI/Chakra

Componentes ficam em `apps/web/components/ui/`, não em `node_modules`. MCP server `shadcn` em `.claude/settings.local.json`.

### Estrutura plana de componentes com hooks de domínio (NÃO Atomic Design)

```
apps/web/components/
├── ui/                              # primitivos shadcn
├── features/<feature>/
│   ├── <feature>.tsx                # apresentação pura
│   └── use-<feature>.ts             # lógica, fetch, estado
└── layout/                          # header, sidebar, providers
```

### Módulos do NestJS separados por responsabilidade

`auth`, `users`, `storage`, `queue`, `ai-runtime`, `admin/metrics`, `health`, `prisma`, `common`, `config`. Adicione novos módulos por domínio do produto.

### i18n desde o dia 0 (mesmo com só pt-BR ativo)

Toda string de UI vai por `t('key')`, mesmo que só tenha `messages/pt-BR.json` por enquanto. **Não hardcodar texto em componentes.**

### Squash and merge, conventional commits

Histórico linear na `main`. PRs descritivos. Commitlint enforça o padrão.

## Restrições de segurança que NÃO podem ser ignoradas

- **Toda query Prisma de dados de usuário filtra por `userId`.** Nunca buscar recurso de usuário sem ownership check. Guards no Nest + filtro explícito no `where`.
- **Validação de upload por magic bytes** (`file-type`), não só extensão. Limite via `UPLOAD_MAX_BYTES`.
- **Volume/R2 nunca exposto direto.** Cliente recebe signed URL da API com expiração ≤ 15 min.
- **Rate limits via `@nestjs/throttler`** por bucket nomeado. Calibre por feature.
- **Prompt injection:** quando passar conteúdo extraído ou input de usuário ao LLM, entre delimitadores XML, **nunca como instrução**. System prompt restritivo.
- **CORS sem wildcard em produção.** Lista via `ALLOWED_ORIGINS`.
- **LGPD — `onDelete: Cascade`** em tudo que pertence ao usuário. Deletar User = apagar tudo.
- **Logs sem dados sensíveis** — sem token, sem conteúdo bruto de documento.
- **S2S `INTERNAL_SERVICE_TOKEN`** — endpoints internos do Nest exigem header `X-Internal-Service-Token` validado por `InternalServiceGuard`.

## Cobertura de testes

**Foco em fluxos críticos, com peso no backend.** Não perseguir 80% de coverage global no template — adicione coverage conforme criar features.

Sempre cobertos:

- Auth/RBAC + ownership checks (guards, strategies, decorators)
- Validação de DTOs e env schema
- Health endpoint
- Provider de storage (Volume + R2)
- ai-runtime (versionamento + generateObject)
- E2E Playwright do fluxo de login

## Comandos

```bash
npm install
npm run dev
npm run dev --workspace=@kainos/web
npm run dev --workspace=@kainos/api
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run db:up                  # postgres + redis
npm run db:setup               # idem + migrate
npm run db:studio
npm run format
```

Para rodar **um único teste**:

- API (Jest): `cd apps/api && npx jest <padrão>`
- Web (Vitest): `cd apps/web && npx vitest run <padrão>`
- E2E (Playwright): `cd apps/web && npx playwright test <arquivo>`

## MCP servers habilitados

`.claude/settings.local.json` habilita o MCP `shadcn`. Use as ferramentas `mcp__shadcn__*` ao adicionar/auditar componentes shadcn — preferível a buscar manualmente na web.

## Funcionalidades incluídas no template

- **Auth (NextAuth):** Google + GitHub + JWT compartilhado + S2S
- **RBAC:** roles USER/ADMIN, painel admin gated por role
- **Storage:** abstração Volume/R2 com signed URLs
- **Queue:** BullMQ + Redis com job exemplo + Bull Board protegido
- **ai-runtime:** versionamento de configs LLM em banco
- **i18n:** next-intl com pt-BR ativo
- **Tema:** dark/light com paleta zinc neutra
- **Tooling:** ESLint + Prettier + Husky + commitlint + GitHub Actions

## Backlog do template (NÃO confundir com features de produto)

- Multi-provider LLM (Anthropic, Google) no ai-runtime
- en-US ativo no i18n
- Atomic Design (atualmente flat)
- Observabilidade avançada (Prometheus, tracing, structured logs)
- Cache de respostas LLM
- 2FA, SSO empresarial
- Audit log completo
- Backup/DR automatizado
- Multi-região

Se um produto derivado precisa de algo dessa lista, considere implementar **no template** (PR de volta) em vez de duplicar em cada produto.
