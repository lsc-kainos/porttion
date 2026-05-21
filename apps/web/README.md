# @kainos/web

Frontend Next.js 16 do template Kainos. Auth, admin shell, i18n, tema.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- shadcn/ui + Radix UI
- next-auth (Google + GitHub OAuth)
- next-themes (dark/light)
- next-intl (pt-BR ativo)

## Estrutura

```
app/
├── layout.tsx            # root layout (providers, i18n, theme)
├── globals.css           # paleta zinc (ver docs/theming.md)
├── login/                # OAuth sign-in page
├── (authed)/             # rotas protegidas
│   ├── layout.tsx        # session guard + topbar
│   ├── page.tsx          # home placeholder
│   └── admin/            # admin hub (RBAC)
└── api/
    ├── auth/[...nextauth]/  # NextAuth handler
    ├── v1/me/               # session profile endpoint
    └── healthz/

components/
├── ui/                   # 20 primitivos shadcn (button, card, input, etc.)
├── layout/               # providers, topbar, logo, user-menu, theme-toggle, nav-links
├── shared/               # empty-state
└── features/
    └── login/            # OAuth buttons + branding

lib/
├── auth.ts               # NextAuth config + callbacks
├── api.ts                # apiFetch / apiUpload (Bearer auth)
├── internal-api.ts       # S2S fetch (Internal Service Token)
├── env.ts                # Zod env schema
├── utils.ts              # cn() (classname merge)
├── rate-limit.ts         # client-side rate limiter
└── secret-fingerprint.ts # debug helper pro NEXTAUTH_SECRET

i18n/                     # next-intl config
messages/                 # JSONs de tradução
```

## Comandos

```bash
npm run dev               # next dev --port 3000
npm run build
npm run typecheck
npm run lint
npm run test              # Vitest
npm run test:e2e          # Playwright
```

## Adicionar uma feature

Crie a pasta `components/features/<feature>/`:

```
components/features/my-feature/
├── my-feature.tsx        # apresentação
└── use-my-feature.ts     # hook (fetch, estado, side effects)
```

Adicione a rota em `app/(authed)/my-feature/page.tsx`.

Sempre use `t('key')` ao invés de texto hardcoded — adicione as keys em `messages/pt-BR.json`.

## Customizar tema

Ver [`docs/theming.md`](../../docs/theming.md) na raiz.
