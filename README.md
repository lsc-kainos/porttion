# kainos-template-app

Template de partida para novos produtos da Kainos. Monorepo Next.js + NestJS com auth, storage abstrato, fila distribuída e ai-runtime já configurados — sem nada de domínio embutido.

## Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind v4 + shadcn/ui + NextAuth (Google + GitHub) + next-themes + next-intl (pt-BR ativo)
- **Backend:** NestJS 11 + Prisma 6 + class-validator + @nestjs/throttler + helmet + BullMQ + Redis
- **DB/Storage:** PostgreSQL + Railway Volume (dev) / Cloudflare R2 (prod), abstraídos por `StorageService`
- **Fila:** BullMQ + Redis (`@kainos/api` traz um job de exemplo)
- **IA (opcional):** Vercel AI SDK + OpenAI via `ai-runtime` com versionamento de prompts em banco
- **Auth:** NextAuth OAuth (Google + GitHub) + JWT compartilhado entre web e api + S2S `INTERNAL_SERVICE_TOKEN`
- **Tooling dia-0:** ESLint + Prettier + Husky + lint-staged + commitlint (conventional commits) + GitHub Actions
- **Testes:** Jest (api) + Vitest + Testing Library (web) + Playwright (E2E)

## Setup (5 comandos)

```bash
# 1. Clone o template
gh repo create <seu-projeto> --template Kainos-Labs/kainos-template-app --private --clone
cd <seu-projeto>

# 2. Preencha env vars (mínimo: NEXTAUTH_SECRET, OAuth, DB)
cp .env.example .env.local
npm run env:link

# 3. Instale deps + sobe Postgres/Redis
npm install
npm run db:up

# 4. Crie migration inicial e rode
npm --workspace=@kainos/api exec -- prisma migrate dev --name init

# 5. Suba web + api
npm run dev
```

Acesse `http://localhost:3000`. Login via Google ou GitHub aparece imediatamente. Se seu email estiver em `ADMIN_EMAILS`, você vê o link `/admin` no topbar.

## Estrutura

```
apps/
  web/             Next.js 16 — auth, admin shell, i18n, tema
  api/             NestJS 11 — auth, users, storage, queue, ai-runtime
packages/
  shared-types/    tipos compartilhados (Role, MeResponse, ApiError)
scripts/
  db-setup.sh, env-link.sh
docs/
  architecture.md  visão arquitetural
  modules.md       como desligar storage/queue/ai-runtime
  theming.md       como trocar paleta
  deployment.md    deploy no Railway
```

## Funcionalidades incluídas

- **Auth:** NextAuth Google+GitHub, JWT compartilhado, sign-in callback que faz upsert do user via S2S
- **RBAC:** roles USER / ADMIN, `@Roles()` decorator no Nest, gating no topbar do web
- **Painel admin:** `/admin` com cards para queues (Bull Board) + métricas
- **Storage abstrato:** swap entre Railway Volume (FS local) e Cloudflare R2 via `STORAGE_DRIVER`
- **Queue distribuída:** BullMQ + Redis com job exemplo (`src/queue/example/`) + Bull Board no admin
- **ai-runtime:** versionamento de configs LLM em banco (`LlmConfig`), provider-agnóstico via Vercel AI SDK
- **i18n:** next-intl com pt-BR; adicionar locale = adicionar JSON em `messages/`
- **Tema:** dark/light com next-themes, paleta zinc neutra (ver `docs/theming.md` para customizar)
- **Segurança:** helmet, CORS via `ALLOWED_ORIGINS`, throttler por user, signed URLs do storage, S2S token

## Comandos

```bash
npm run dev                    # web + api em paralelo
npm run dev --workspace=@kainos/web
npm run dev --workspace=@kainos/api
npm run lint
npm run typecheck
npm run test                   # Jest (api) + Vitest (web)
npm run test:e2e               # Playwright
npm run build
npm run db:up                  # sobe postgres + redis via docker compose
npm run db:setup               # idem + migrate deploy
npm run db:studio              # Prisma Studio
npm run format
```

## Desligar módulos opcionais

O template inclui storage, queue e ai-runtime — todos opcionais. Cada um é um módulo Nest independente. Ver [`docs/modules.md`](./docs/modules.md) para o passo a passo de remover qualquer um.

## Próximos passos

1. **Branding:** trocar paleta em `apps/web/app/globals.css` e logo em `components/layout/logo.tsx` (ver `docs/theming.md`).
2. **Schema:** adicionar models de domínio em `apps/api/prisma/schema.prisma` + rodar `prisma migrate dev`.
3. **Features:** criar pasta em `apps/web/components/features/<feature>/` (apresentação + hook) e módulo em `apps/api/src/<feature>/`.
4. **i18n:** adicionar keys em `apps/web/messages/pt-BR.json` (e novos locales conforme precisar).

## Convenções

Ver [`CLAUDE.md`](./CLAUDE.md) para guidelines de arquitetura, segurança e estilo que se aplicam a apps derivados deste template.
