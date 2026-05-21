# F1b — Domain + AI Hero + Landing + Atomic Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a segunda metade da F1 do Porttion — backend de domínio (wallets, positions, market via `yahoo-finance2`), Hero IA (`asset.analysis.v1` versionado), todo o frontend autenticado (shell + CRUD + dashboard + detalhe do ativo + settings + erros), landing real (9 seções), e migração estrutural de toda a base frontend para Atomic Design — em uma PR única contra `staging`.

**Architecture:** **Estende a F1a, migra organização.** Adiciona 4 módulos NestJS (`wallets`, `positions`, `market`, `ai-analyst`), uma migração Prisma aditiva (`f1b_domain` com `Wallet`/`Position`/`AssetAnalysis`), e reorganiza `apps/web/components/` em 5 camadas (atoms/molecules/organisms/templates + `app/` como pages). Prompt IA versionado via `ai-runtime` já existente. Cache de cotações via LRU manual em memória; cache de análises via tabela `AssetAnalysis` (1h). E2E Playwright cobre o caminho dourado em mobile + desktop.

**Tech Stack:** NestJS 11 · Prisma 6 · `yahoo-finance2` · `@nestjs/throttler` · Zod · Vercel AI SDK (via `ai-runtime`) · Next.js 16 App Router · NextAuth v4 · SWR · `recharts` · Tailwind v4 · shadcn/ui (sheet/dropdown-menu/command/popover/tooltip/tabs/table/skeleton/accordion novos) · `next-intl` · Vitest + happy-dom · Jest · Playwright (iPhone 13 + desktop 1440).

**Pré-requisitos para começar:**

- F1a mergeada em `staging` (auth completo, tema, fontes, i18n, `i18n-check.ts`).
- Spec `docs/superpowers/specs/2026-05-21-spec-01b-domain-and-ai.md` aprovada pelo usuário.
- `OPENAI_API_KEY` válida em dev local e em Railway staging (cofre Kainos).
- Domain Resend ativo (já feito na F1a).
- Branch de trabalho criada a partir de `staging`: `git checkout -b feat/spec-01b-domain-and-ai staging`.

**Convenções desta plan:**

- Todo comando assume cwd no root do monorepo (`/home/user/Projetos/porttion`) salvo se contrário explícito.
- Caminhos Vitest/Jest passam por workspace: `cd apps/web && npx vitest run …` ou `cd apps/api && npx jest …`.
- Após cada Task, rodar `npm run lint && npm run typecheck` antes de commitar — não repetido a cada step para reduzir ruído.
- Commits seguem conventional. `--no-verify` é PROIBIDO (CLAUDE.md §Restrições).
- Toda mensagem visível ao usuário passa por `t('...')`; ticker (`PETR4`), símbolo de moeda (`R$`) e payload IA são exceções (CLAUDE.md §i18n).

---

## File Structure

### Arquivos criados

```
# Commit 0 — pre-flight
apps/api/src/config/env.schema.ts                                       # MODIFICADO
apps/web/lib/env.ts                                                      # MODIFICADO

# Commit 1 — migração atomic design (git mv preserva history)
apps/web/components/atoms/ui/                                            # de components/ui/
apps/web/components/atoms/icons/brand/logo.tsx                           # de components/layout/logo.tsx
apps/web/components/organisms/auth/                                      # de components/features/auth/ + features/login/
apps/web/components/organisms/layout/topbar.tsx                          # de components/layout/topbar.tsx
apps/web/components/organisms/layout/nav-links.tsx                       # de components/layout/nav-links.tsx
apps/web/components/organisms/layout/user-menu.tsx                       # de components/layout/user-menu.tsx
apps/web/components/organisms/layout/theme-toggle.tsx                    # de components/layout/theme-toggle.tsx
apps/web/components/organisms/layout/providers.tsx                       # de components/layout/providers.tsx
apps/web/scripts/migrate-imports.ts                                      # codemod único, descartado após commit
apps/web/scripts/atomic-boundaries.ts                                    # lint script que falha CI se atom importa organism

# Commit 2 — shell autenticado
apps/web/components/templates/authed-shell.tsx
apps/web/components/organisms/layout/sidebar.tsx
apps/web/components/organisms/layout/sidebar-mobile.tsx
apps/web/components/organisms/layout/wallet-switcher.tsx
apps/web/components/providers/wallet-switcher-provider.tsx
apps/web/components/molecules/responsive-dialog.tsx
apps/web/hooks/shared/use-media-query.ts
apps/web/hooks/shared/use-active-wallet.ts
apps/web/hooks/shared/use-wallets-list.ts
apps/web/lib/swr-fetcher.ts
apps/web/components/organisms/layout/__tests__/sidebar.test.tsx
apps/web/components/organisms/layout/__tests__/wallet-switcher.test.tsx
apps/web/components/molecules/__tests__/responsive-dialog.test.tsx

# Commit 3 — backend domain
apps/api/prisma/migrations/<timestamp>_f1b_domain/migration.sql           # gerada
apps/api/src/wallets/wallets.module.ts
apps/api/src/wallets/wallets.service.ts
apps/api/src/wallets/wallets.service.spec.ts
apps/api/src/wallets/wallets.controller.ts
apps/api/src/wallets/wallets.controller.spec.ts
apps/api/src/wallets/dto/create-wallet.dto.ts
apps/api/src/wallets/dto/update-wallet.dto.ts
apps/api/src/wallets/wallet.mapper.ts
apps/api/src/positions/positions.module.ts
apps/api/src/positions/positions.service.ts
apps/api/src/positions/positions.service.spec.ts
apps/api/src/positions/positions.controller.ts
apps/api/src/positions/positions.controller.spec.ts
apps/api/src/positions/dto/create-position.dto.ts
apps/api/src/positions/dto/update-position.dto.ts
apps/api/src/market/market.module.ts
apps/api/src/market/market.service.ts
apps/api/src/market/market.service.spec.ts
apps/api/src/market/market.controller.ts
apps/api/src/market/market.controller.spec.ts
apps/api/src/market/yahoo-symbol.ts
apps/api/src/market/yahoo-symbol.spec.ts
apps/api/src/market/lru-cache.ts
apps/api/src/market/lru-cache.spec.ts
apps/api/src/market/dto/search-market.dto.ts
apps/api/src/market/dto/ohlc-query.dto.ts
packages/shared-types/src/porttion.ts

# Commit 4 — CRUD UI
apps/web/components/organisms/wallet/create-wallet-dialog.tsx
apps/web/components/organisms/wallet/edit-wallet-dialog.tsx
apps/web/components/organisms/wallet/delete-wallet-dialog.tsx
apps/web/components/organisms/wallet/wallet-card-large.tsx
apps/web/components/organisms/wallet/wallet-empty-state.tsx
apps/web/components/organisms/wallet/add-position-sheet.tsx
apps/web/components/organisms/wallet/edit-position-dialog.tsx
apps/web/components/molecules/ticker-search-input.tsx
apps/web/components/molecules/form-field.tsx
apps/web/components/molecules/empty-state.tsx
apps/web/components/molecules/delete-confirm-dialog.tsx
apps/web/app/(authed)/carteiras/page.tsx
apps/web/app/(authed)/carteiras/[id]/page.tsx
apps/web/hooks/wallet/use-wallet-detail.ts
apps/web/hooks/wallet/use-mutate-wallet.ts
apps/web/hooks/wallet/use-mutate-position.ts
apps/web/hooks/market/use-ticker-search.ts
apps/web/components/organisms/wallet/__tests__/create-wallet-dialog.test.tsx
apps/web/components/molecules/__tests__/ticker-search-input.test.tsx

# Commit 5 — dashboards
apps/web/components/atoms/charts/donut.tsx
apps/web/components/atoms/charts/sparkline.tsx
apps/web/components/atoms/charts/area-chart.tsx
apps/web/components/molecules/kpi-card.tsx
apps/web/components/organisms/wallet/kpi-grid.tsx
apps/web/components/organisms/wallet/positions-table.tsx
apps/web/components/organisms/wallet/position-row.tsx
apps/web/components/organisms/wallet/position-card.tsx
apps/web/components/organisms/wallet/allocation-donut.tsx
apps/web/components/organisms/wallet/evolution-placeholder.tsx
apps/web/components/organisms/wallet/ai-insight-placeholder.tsx
apps/web/components/organisms/wallet/watchlist-placeholder.tsx
apps/web/app/(authed)/dashboard/page.tsx                                # MODIFICADO (substitui placeholder F1a)
apps/web/components/organisms/wallet/__tests__/kpi-grid.test.tsx
apps/web/components/organisms/wallet/__tests__/positions-table.test.tsx
apps/web/components/organisms/wallet/__tests__/allocation-donut.test.tsx

# Commit 6 — ai-analyst backend
apps/api/src/ai-analyst/ai-analyst.module.ts
apps/api/src/ai-analyst/ai-analyst.service.ts
apps/api/src/ai-analyst/ai-analyst.service.spec.ts
apps/api/src/ai-analyst/ai-analyst.controller.ts
apps/api/src/ai-analyst/ai-analyst.controller.spec.ts
apps/api/src/ai-analyst/dto/analyze-asset.dto.ts
apps/api/src/ai-analyst/asset-analysis.schema.ts
apps/api/src/ai-analyst/asset-analysis.schema.spec.ts
apps/api/src/ai-analyst/prompts/asset-analysis-v1.ts
apps/api/prisma/seed.ts                                                  # MODIFICADO (adiciona seed do prompt)

# Commit 7 — asset detail + AI card
apps/web/components/atoms/charts/candle-chart.tsx
apps/web/components/atoms/icons/asset-icon.tsx
apps/web/components/atoms/typography/eyebrow.tsx
apps/web/components/atoms/typography/editorial-quote.tsx
apps/web/components/molecules/stat-box.tsx
apps/web/components/molecules/ohlc-tabs.tsx
apps/web/components/molecules/ai-disclaimer.tsx
apps/web/components/organisms/asset/asset-header.tsx
apps/web/components/organisms/asset/stats-strip.tsx
apps/web/components/organisms/asset/candle-chart-section.tsx
apps/web/components/organisms/ai-analyst/ai-analysis-card.tsx
apps/web/app/(authed)/ativos/[ticker]/page.tsx
apps/web/hooks/market/use-ohlc.ts
apps/web/hooks/market/use-quote.ts
apps/web/hooks/ai-analyst/use-asset-analysis.ts
apps/web/components/atoms/charts/__tests__/candle-chart.test.tsx
apps/web/components/organisms/ai-analyst/__tests__/ai-analysis-card.test.tsx

# Commit 8 — landing real + settings + error pages
apps/web/components/molecules/editorial-section-header.tsx
apps/web/components/templates/public-shell.tsx
apps/web/components/templates/landing-shell.tsx
apps/web/components/templates/error-shell.tsx
apps/web/components/organisms/landing/landing-header.tsx
apps/web/components/organisms/landing/hero-section.tsx
apps/web/components/organisms/landing/value-prop-section.tsx
apps/web/components/organisms/landing/how-it-works-section.tsx
apps/web/components/organisms/landing/ai-section.tsx
apps/web/components/organisms/landing/use-cases-section.tsx
apps/web/components/organisms/landing/testimonials-section.tsx
apps/web/components/organisms/landing/faq-section.tsx
apps/web/components/organisms/landing/closing-cta-section.tsx
apps/web/components/organisms/landing/landing-footer.tsx
apps/web/components/organisms/settings/account-section.tsx
apps/web/components/organisms/settings/locale-section.tsx
apps/web/app/(public)/page.tsx                                           # MODIFICADO (substitui placeholder F1a)
apps/web/app/(authed)/configuracoes/page.tsx
apps/web/app/(authed)/error.tsx
apps/web/app/(authed)/loading.tsx
apps/web/app/(public)/error.tsx
apps/web/app/not-found.tsx
apps/web/app/error.tsx
apps/web/components/organisms/landing/__tests__/landing-header.test.tsx

# Commit 9 — E2E
apps/web/e2e/f1b-vertical.spec.ts
apps/web/e2e/fixtures/yahoo.json
apps/web/e2e/fixtures/ai-analysis.json
apps/web/e2e/helpers/setup-test-user.ts
apps/web/playwright.config.ts                                            # MODIFICADO (adiciona project iPhone 13)
.github/workflows/ci.yml                                                 # MODIFICADO (job e2e + coverage-gate)
apps/api/scripts/check-coverage.ts
apps/api/coverage.config.json
```

### Arquivos modificados (consolidado)

```
apps/api/prisma/schema.prisma                            # +Wallet, +Position, +AssetAnalysis, relations
apps/api/prisma/seed.ts                                  # +seed asset.analysis.v1
apps/api/src/config/env.schema.ts                        # +MARKET_TIMEOUT_MS, +AI_RUNTIME_FIXTURE
apps/api/src/app.module.ts                               # +WalletsModule, +PositionsModule, +MarketModule, +AiAnalystModule, buckets market/ai-analyst
apps/api/src/auth/guards/user-scoped-throttler.guard.ts  # garante key por userId em buckets market/ai-analyst (re-verificar)
apps/api/package.json                                    # +yahoo-finance2
apps/web/package.json                                    # +swr, +recharts
apps/web/lib/env.ts                                      # (sem mudança obrigatória)
apps/web/app/(authed)/layout.tsx                         # usa AuthedShell + WalletSwitcherProvider
apps/web/app/(authed)/dashboard/page.tsx                 # substitui placeholder F1a por dashboard real
apps/web/app/(public)/page.tsx                           # substitui placeholder F1a por landing real
apps/web/messages/pt-BR.json                             # +sidebar, +dashboard, +carteira, +wallet, +position, +asset, +ai.analysis, +landing (9 seções), +settings, +error
apps/web/i18n/request.ts                                 # (sem mudança)
apps/web/scripts/i18n-check.ts                           # (sem mudança — gate continua aplicável)
apps/web/playwright.config.ts                            # adiciona project iPhone 13 ao lado do desktop
.github/workflows/ci.yml                                 # +job e2e, +coverage-gate
CLAUDE.md                                                # substitui §"Estrutura plana" por tabela Atomic Design
docs/architecture.md                                     # adiciona §Atomic Design
docs/superpowers/specs/2026-05-20-spec-00-roadmap.md     # remove "Atomic Design" do backlog
```

---

## Visão geral por commit

| #   | Commit                                                         | Tasks        | LOC aprox |
| --- | -------------------------------------------------------------- | ------------ | --------- |
| 0   | `chore: pre-flight setup`                                      | Tasks 1–5    | ~100      |
| 1   | `refactor: migrate F1a to atomic design`                       | Tasks 6–12   | ~300      |
| 2   | `feat(web): authed shell + wallet switcher`                    | Tasks 13–20  | ~600      |
| 3   | `feat(api): wallets + positions + market + KPIs`               | Tasks 21–38  | ~1500     |
| 4   | `feat(web): wallets/positions CRUD UI`                         | Tasks 39–50  | ~900      |
| 5   | `feat(web): dashboard KPI Grid + carteira detail`              | Tasks 51–61  | ~700      |
| 6   | `feat(api): ai-analyst + prompt v1 seed`                       | Tasks 62–70  | ~600      |
| 7   | `feat(web): asset detail + candle chart + AI card`             | Tasks 71–82  | ~900      |
| 8   | `feat(web): landing real + settings + error pages`             | Tasks 83–96  | ~900      |
| 9   | `test(e2e): playwright vertical (mobile + desktop) + CI gates` | Tasks 97–103 | ~400      |

CI verde em cada commit. Squash and merge final usa título da PR.

---

# Commit 0 — `chore: pre-flight setup`

## Task 1: Instalar dependências novas

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Instalar `yahoo-finance2` no backend**

```bash
npm install --workspace=@kainos/api yahoo-finance2
```

- [ ] **Step 2: Instalar `swr` e `recharts` no frontend**

```bash
npm install --workspace=@kainos/web swr recharts
```

- [ ] **Step 3: Validar instalação**

```bash
npm --workspace=@kainos/api ls yahoo-finance2
npm --workspace=@kainos/web ls swr recharts
```

Expected: três pacotes listados com versão, sem `UNMET DEPENDENCY`.

- [ ] **Step 4: Commit**

```bash
git add apps/api/package.json apps/web/package.json package-lock.json
git commit -m "chore: add yahoo-finance2, swr, recharts"
```

## Task 2: Adicionar variáveis de ambiente para market + AI fixture

**Files:**

- Modify: `apps/api/src/config/env.schema.ts`
- Modify: `.env.example` (root) e `apps/api/.env.example` se existir

- [ ] **Step 1: Adicionar campos ao `envSchema`**

No bloco principal de `envSchema`, antes do `superRefine`, adicionar (após `LLM_PROVIDER`):

```typescript
// --- Market data adapter (yahoo-finance2) ---
MARKET_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),

// --- AI runtime ---
// Quando true, AiRuntimeService.generateObject retorna fixture
// pré-gravada sem chamar OpenAI (CI/dev/e2e).
AI_RUNTIME_FIXTURE: z
  .preprocess((v) => v === 'true' || v === true, z.boolean())
  .default(false),
```

- [ ] **Step 2: Atualizar `.env.example`**

Adicionar ao final do bloco backend em `.env.example` (ou criar a linha se ausente):

```
MARKET_TIMEOUT_MS=4000
AI_RUNTIME_FIXTURE=false
```

- [ ] **Step 3: Validar typecheck**

```bash
npm run typecheck
```

Expected: PASS, sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/config/env.schema.ts .env.example
git commit -m "chore(api): add MARKET_TIMEOUT_MS and AI_RUNTIME_FIXTURE env vars"
```

## Task 3: Adicionar shadcn primitives faltantes via MCP

**Files:**

- Create (via MCP `shadcn`): `apps/web/components/ui/sheet.tsx` (já existe — pular se sim), `dropdown-menu.tsx` (existe), `command.tsx` (existe), `popover.tsx`, `tooltip.tsx` (existe), `tabs.tsx` (existe), `table.tsx`, `skeleton.tsx` (existe), `accordion.tsx`.

> Faltam (vs. listagem atual): `popover`, `table`, `accordion`. O resto já está em `components/ui/`.

- [ ] **Step 1: Adicionar `popover`**

```bash
cd apps/web && npx shadcn@latest add popover
```

Expected: `apps/web/components/ui/popover.tsx` criado.

- [ ] **Step 2: Adicionar `table`**

```bash
cd apps/web && npx shadcn@latest add table
```

- [ ] **Step 3: Adicionar `accordion`**

```bash
cd apps/web && npx shadcn@latest add accordion
```

- [ ] **Step 4: Validar build**

```bash
npm run build --workspace=@kainos/web
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/ui/popover.tsx apps/web/components/ui/table.tsx apps/web/components/ui/accordion.tsx apps/web/package.json package-lock.json
git commit -m "chore(web): add shadcn popover, table, accordion primitives"
```

## Task 4: Preparar arquivo de seed do prompt IA (sem rodar ainda)

**Files:**

- Modify: `apps/api/prisma/seed.ts`

> O seed completo do prompt vai no Commit 6 junto com o módulo `ai-analyst`. Aqui só garantimos que `seed.ts` tem estrutura idempotente pronta — sem adicionar lógica de domínio ainda.

- [ ] **Step 1: Confirmar conteúdo atual do seed**

Ler `apps/api/prisma/seed.ts`. Se já segue o padrão template idempotente (visto na exploração), nada a fazer aqui — pular para Step 2.

- [ ] **Step 2: Verificar comando `db:seed`**

```bash
grep -A1 '"db:seed"' apps/api/package.json
```

Expected: linha contendo `"db:seed": "prisma db seed"` (ou similar) e bloco `"prisma": { "seed": "tsx prisma/seed.ts" }` em `package.json`. Se ausente, adicionar:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Commit (apenas se houve mudança)**

```bash
git add apps/api/package.json
git commit -m "chore(api): wire prisma db seed command"
```

> Se não houve mudança, pular o commit — task termina silenciosa.

## Task 5: Criar branch de trabalho

**Files:** —

- [ ] **Step 1: Verificar branch atual**

```bash
git status --short --branch
```

Expected: na `staging` com working tree limpo. Se não, fazer stash/commit antes.

- [ ] **Step 2: Pull staging atualizado**

```bash
git fetch origin && git checkout staging && git pull --ff-only origin staging
```

- [ ] **Step 3: Criar branch**

```bash
git checkout -b feat/spec-01b-domain-and-ai
```

Expected: branch `feat/spec-01b-domain-and-ai` criado a partir do HEAD de staging.

- [ ] **Step 4: Push inicial**

```bash
git push -u origin feat/spec-01b-domain-and-ai
```

> Sanity check pós-Commit 0: `npm run lint && npm run typecheck && npm run test && npm run build` precisam estar verdes antes de seguir para Commit 1.

---

# Commit 1 — `refactor: migrate F1a to atomic design + update CLAUDE.md`

> Refactor estrutural puro. Sem mudança de comportamento. Cada `git mv` preserva history; um script único reescreve imports em lote.

## Task 6: Escrever script codemod `migrate-imports.ts`

**Files:**

- Create: `apps/web/scripts/migrate-imports.ts`

- [ ] **Step 1: Escrever o codemod**

```typescript
#!/usr/bin/env tsx
// One-shot codemod que reescreve imports do layout flat antigo para
// a árvore Atomic Design nova. Descartado após Commit 1.
// Uso: tsx scripts/migrate-imports.ts
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');

// Mapa from → to. Inclui aliases @/ e relativos compridos.
const MAPPINGS: Array<[RegExp, string]> = [
  [/@\/components\/ui\//g, '@/components/atoms/ui/'],
  [/@\/components\/layout\/logo/g, '@/components/atoms/icons/brand/logo'],
  [/@\/components\/layout\/topbar/g, '@/components/organisms/layout/topbar'],
  [/@\/components\/layout\/nav-links/g, '@/components/organisms/layout/nav-links'],
  [/@\/components\/layout\/user-menu/g, '@/components/organisms/layout/user-menu'],
  [/@\/components\/layout\/theme-toggle/g, '@/components/organisms/layout/theme-toggle'],
  [/@\/components\/layout\/providers/g, '@/components/organisms/layout/providers'],
  [/@\/components\/features\/auth\//g, '@/components/organisms/auth/'],
  [/@\/components\/features\/login\//g, '@/components/organisms/auth/'],
];

const EXTS = new Set(['.ts', '.tsx']);
const IGNORE = new Set(['node_modules', '.next', '.turbo', 'coverage']);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (IGNORE.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (EXTS.has(full.slice(full.lastIndexOf('.')))) out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = readFileSync(file, 'utf-8');
  let after = before;
  for (const [from, to] of MAPPINGS) after = after.replace(from, to);
  if (after !== before) {
    writeFileSync(file, after, 'utf-8');
    changed += 1;
    // eslint-disable-next-line no-console
    console.log(`[migrate-imports] ${file.replace(ROOT, 'apps/web')}`);
  }
}
// eslint-disable-next-line no-console
console.log(`[migrate-imports] done — ${changed} files updated`);
```

- [ ] **Step 2: Verificar que o codemod compila**

```bash
cd apps/web && npx tsc --noEmit scripts/migrate-imports.ts
```

Expected: PASS.

- [ ] **Step 3: NÃO commitar ainda** — vai junto com a migração.

## Task 7: Mover `components/ui/` → `components/atoms/ui/`

**Files:**

- Move: `apps/web/components/ui/*.tsx` → `apps/web/components/atoms/ui/*.tsx`

- [ ] **Step 1: Criar diretório destino**

```bash
mkdir -p apps/web/components/atoms/ui
```

- [ ] **Step 2: Mover com `git mv`**

```bash
git mv apps/web/components/ui/* apps/web/components/atoms/ui/
rmdir apps/web/components/ui
```

Expected: `git status` mostra renames preservados.

- [ ] **Step 3: NÃO rodar build ainda** — imports ficam quebrados até o codemod.

## Task 8: Mover `components/layout/` para destino atomic

**Files:**

- Move múltiplos arquivos para `components/atoms/icons/brand/` e `components/organisms/layout/`.

- [ ] **Step 1: Criar diretórios**

```bash
mkdir -p apps/web/components/atoms/icons/brand
mkdir -p apps/web/components/organisms/layout
```

- [ ] **Step 2: Mover logo (atom)**

```bash
git mv apps/web/components/layout/logo.tsx apps/web/components/atoms/icons/brand/logo.tsx
```

- [ ] **Step 3: Mover restante para organisms/layout**

```bash
git mv apps/web/components/layout/topbar.tsx apps/web/components/organisms/layout/topbar.tsx
git mv apps/web/components/layout/nav-links.tsx apps/web/components/organisms/layout/nav-links.tsx
git mv apps/web/components/layout/user-menu.tsx apps/web/components/organisms/layout/user-menu.tsx
git mv apps/web/components/layout/theme-toggle.tsx apps/web/components/organisms/layout/theme-toggle.tsx
git mv apps/web/components/layout/providers.tsx apps/web/components/organisms/layout/providers.tsx
```

- [ ] **Step 4: Mover testes do layout**

```bash
mkdir -p apps/web/components/organisms/layout/__tests__
git mv apps/web/components/layout/__tests__/* apps/web/components/organisms/layout/__tests__/
rmdir apps/web/components/layout/__tests__
rmdir apps/web/components/layout
```

## Task 9: Mover `components/features/auth/` e `features/login/` → `organisms/auth/`

**Files:**

- Move: forms e tela de login.

- [ ] **Step 1: Criar destino**

```bash
mkdir -p apps/web/components/organisms/auth
```

- [ ] **Step 2: Mover forms**

```bash
git mv apps/web/components/features/auth/signup-form.tsx apps/web/components/organisms/auth/signup-form.tsx
git mv apps/web/components/features/auth/forgot-password-form.tsx apps/web/components/organisms/auth/forgot-password-form.tsx
git mv apps/web/components/features/auth/reset-password-form.tsx apps/web/components/organisms/auth/reset-password-form.tsx
```

- [ ] **Step 3: Mover login**

```bash
git mv apps/web/components/features/login/*.tsx apps/web/components/organisms/auth/
rmdir apps/web/components/features/login 2>/dev/null || true
rmdir apps/web/components/features/auth 2>/dev/null || true
rmdir apps/web/components/features 2>/dev/null || true
```

> Se restar `credentials-login-form.tsx` ou similar dentro de `features/login/`, ajustar nomes em Step 3 conforme reality check com `ls`.

- [ ] **Step 4: Sanity check de estrutura**

```bash
find apps/web/components -maxdepth 3 -type d | sort
```

Expected: lista contendo `atoms/`, `atoms/ui/`, `atoms/icons/brand/`, `organisms/`, `organisms/auth/`, `organisms/layout/`, `organisms/layout/__tests__/`, `shared/` (se existir).

## Task 10: Rodar codemod e validar build

**Files:**

- Modify: vários (reescrito por script)

- [ ] **Step 1: Rodar codemod**

```bash
cd apps/web && npx tsx scripts/migrate-imports.ts
```

Expected: log de N arquivos atualizados.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS. Se houver imports remanescentes (ex.: paths relativos `../../../ui/...`), corrigir manualmente — registrar no codemod (Task 6) caso surja um padrão recorrente.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Test**

```bash
npm run test
```

Expected: PASS (mesmos testes da F1a, agora rodando do novo path).

- [ ] **Step 5: Build**

```bash
npm run build
```

Expected: PASS.

## Task 11: Atualizar CLAUDE.md, docs/architecture.md, spec-00 backlog

**Files:**

- Modify: `CLAUDE.md`
- Modify: `docs/architecture.md`
- Modify: `docs/superpowers/specs/2026-05-20-spec-00-roadmap.md`

- [ ] **Step 1: Substituir bloco "Estrutura plana" em CLAUDE.md**

Em `CLAUDE.md`, encontrar o subheader `### Estrutura plana de componentes com hooks de domínio (NÃO Atomic Design)` (linha ~49). Substituir TODO o bloco (incluindo o code fence Markdown abaixo) por:

````markdown
### Atomic Design — 5 camadas

```
apps/web/
├── components/
│   ├── atoms/                       # primitivos puros (shadcn ui, ícones, charts, typography)
│   │   ├── ui/                      # shadcn primitives
│   │   ├── charts/                  # wrappers recharts + SVG próprios
│   │   ├── icons/                   # asset icons, brand
│   │   └── typography/              # eyebrow, editorial quote
│   ├── molecules/                   # composições de atoms; estado local simples
│   ├── organisms/                   # features completas; fetch via SWR; conhecem domínio
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── wallet/
│   │   ├── asset/
│   │   ├── ai-analyst/
│   │   ├── landing/
│   │   └── settings/
│   ├── templates/                   # slots de layout puros
│   └── providers/                   # client providers (wallet switcher, theme, session)
├── hooks/                           # FORA de components/
│   ├── wallet/  market/  ai-analyst/  shared/
└── app/                             # pages (App Router)
```

| Camada    | Pode                                                           | Não pode                                         |
| --------- | -------------------------------------------------------------- | ------------------------------------------------ |
| atoms     | Receber props; renderizar primitivos                           | Conhecer API, ler context, ter estado de domínio |
| molecules | Compor atoms; estado local (open/close, foco)                  | Fetch, conhecer rotas                            |
| organisms | Compor atoms/molecules; chamar hooks de domínio; fetch via SWR | Importar organisms de outra feature              |
| templates | Slots de layout + props de slot                                | Estado, fetch, lógica                            |
| pages     | Compor templates + organisms; receber `params/searchParams`    | Renderizar atoms direto                          |

**Regra de import:** atom não importa de molecule/organism/template/page. Molecule não importa de organism. Organisms de features distintas não se importam entre si — composição rola na page.
````

- [ ] **Step 2: Atualizar `docs/architecture.md`**

Adicionar seção nova ao final:

```markdown
## Frontend Atomic Design (F1b+)

A partir de F1b, `apps/web/components/` segue Atomic Design em 5 camadas. Tabela de
regras está em `CLAUDE.md §Atomic Design`. Migração da base F1a aconteceu no
commit isolado `refactor: migrate F1a to atomic design` da PR `feat/spec-01b-domain-and-ai`.

Hooks de domínio vivem em `apps/web/hooks/` (fora de `components/`), separados por
feature (`wallet/`, `market/`, `ai-analyst/`, `shared/`).
```

- [ ] **Step 3: Remover item do backlog em spec-00**

Em `docs/superpowers/specs/2026-05-20-spec-00-roadmap.md`, encontrar a linha do backlog do template que contém `Atomic Design (atualmente flat)` e removê-la (mesma operação para `CLAUDE.md §"Backlog do template"` se o item aparecer lá também).

## Task 12: Deletar codemod e commitar refactor

**Files:**

- Delete: `apps/web/scripts/migrate-imports.ts`

- [ ] **Step 1: Deletar codemod**

```bash
rm apps/web/scripts/migrate-imports.ts
```

> Codemod é one-shot. Histórico fica no git por meio do PR.

- [ ] **Step 2: Re-rodar gates completos**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Expected: tudo verde.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor(web): migrate to atomic design + update CLAUDE.md

- mv components/ui → atoms/ui
- mv components/layout/{topbar,nav-links,user-menu,theme-toggle,providers} → organisms/layout
- mv components/layout/logo → atoms/icons/brand/logo
- mv components/features/auth → organisms/auth
- mv components/features/login → organisms/auth
- one-shot codemod rewrote all @/ imports
- CLAUDE.md + docs/architecture.md updated with 5-layer table
- spec-00 backlog: remove 'Atomic Design (currently flat)'

No behavior change; tsc/lint/test/build green."
```

> Sidebar note sobre `components/shared/empty-state.tsx`: ele já existe da F1a. Não mover neste commit — fica em `components/shared/` e é re-categorizado para `molecules/empty-state.tsx` no Commit 4 quando ganhar variantes de domínio (carteiras/posições vazias). Mantém F1a estável.

---

# Commit 2 — `feat(web): authed shell + wallet switcher provider`

> Reescreve o layout autenticado para o shell definitivo. Sidebar (desktop) + sidebar mobile (Sheet drawer) + topbar enxuto + `WalletSwitcher` consumindo um provider client-side. Até o Commit 3 o switcher usa fixture in-memory; em Commit 4 ele passa a consumir API real.

## Task 13: Criar fetcher SWR e setup do `SWRConfig`

**Files:**

- Create: `apps/web/lib/swr-fetcher.ts`
- Modify: `apps/web/components/organisms/layout/providers.tsx`

- [ ] **Step 1: Escrever `swr-fetcher.ts`**

```typescript
import type { ApiError } from '@kainos/shared-types';

// Fetcher genérico do SWR para chamadas à API autenticada.
// Cookie de sessão (NextAuth) é enviado automaticamente. Erros HTTP
// viram exception com payload { statusCode, message } pra UI poder ler.
export async function swrFetcher<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `/api${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
    }));
    throw Object.assign(new Error(Array.isArray(body.message) ? body.message[0] : body.message), {
      statusCode: body.statusCode,
      body,
    });
  }
  return res.json() as Promise<T>;
}
```

- [ ] **Step 2: Adicionar `SWRConfig` global ao `providers.tsx`**

Em `apps/web/components/organisms/layout/providers.tsx`, importar `SWRConfig` e envolver children. Manter providers existentes (SessionProvider, ThemeProvider) inalterados.

```tsx
'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { SWRConfig } from 'swr';
import { swrFetcher } from '@/lib/swr-fetcher';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SWRConfig
          value={{
            fetcher: swrFetcher,
            revalidateOnFocus: false,
            shouldRetryOnError: (err: { statusCode?: number }) =>
              !err.statusCode || err.statusCode >= 500,
          }}
        >
          {children}
        </SWRConfig>
      </ThemeProvider>
    </SessionProvider>
  );
}
```

> Se `providers.tsx` original tinha props/estrutura diferentes (Toaster, etc.), preservar.

- [ ] **Step 3: Smoke build**

```bash
npm run build --workspace=@kainos/web
```

Expected: PASS.

## Task 14: `use-media-query` hook (mobile detection)

**Files:**

- Create: `apps/web/hooks/shared/use-media-query.ts`
- Create: `apps/web/hooks/shared/__tests__/use-media-query.test.ts`

- [ ] **Step 1: Escrever teste**

```typescript
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from '../use-media-query';

describe('useMediaQuery', () => {
  let listeners: ((e: MediaQueryListEvent) => void)[] = [];
  let matches = false;

  beforeEach(() => {
    listeners = [];
    matches = false;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches,
      media: query,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners.push(cb);
      },
      removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners = listeners.filter((l) => l !== cb);
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna false quando query não casa', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('atualiza quando media change dispara', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    act(() => {
      listeners.forEach((cb) => cb({ matches: true } as unknown as MediaQueryListEvent));
    });
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar teste (deve falhar — hook não existe)**

```bash
cd apps/web && npx vitest run hooks/shared/__tests__/use-media-query.test.ts
```

Expected: FAIL com "Cannot find module".

- [ ] **Step 3: Implementar hook**

```typescript
'use client';
import { useEffect, useState } from 'react';

// Hook genérico que escuta mudança de media query (e.g. viewport breakpoint).
// SSR-safe: durante render server retorna false; client hidrata real.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent): void => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
```

- [ ] **Step 4: Rodar teste (deve passar)**

```bash
cd apps/web && npx vitest run hooks/shared/__tests__/use-media-query.test.ts
```

Expected: PASS.

## Task 15: `ResponsiveDialog` molecule (Dialog ≥md / Sheet <md)

**Files:**

- Create: `apps/web/components/molecules/responsive-dialog.tsx`
- Create: `apps/web/components/molecules/__tests__/responsive-dialog.test.tsx`

- [ ] **Step 1: Escrever teste**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveDialog } from '../responsive-dialog';

// Mock useMediaQuery para forçar caminho desktop/mobile.
vi.mock('@/hooks/shared/use-media-query', () => ({
  useMediaQuery: vi.fn(),
}));
import { useMediaQuery } from '@/hooks/shared/use-media-query';

describe('ResponsiveDialog', () => {
  it('renderiza Dialog quando viewport >= md', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true);
    render(
      <ResponsiveDialog open onOpenChange={() => {}} title="Hello">
        <p>Body</p>
      </ResponsiveDialog>,
    );
    // Dialog usa role="dialog"
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renderiza Sheet quando viewport < md', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(false);
    render(
      <ResponsiveDialog open onOpenChange={() => {}} title="Hello">
        <p>Body</p>
      </ResponsiveDialog>,
    );
    // Sheet usa data-state e role="dialog" também; checa por data attribute específico
    const node = screen.getByRole('dialog');
    expect(node.getAttribute('data-side')).toBe('bottom');
  });
});
```

- [ ] **Step 2: Implementar**

```tsx
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/atoms/ui/sheet';
import { useMediaQuery } from '@/hooks/shared/use-media-query';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ResponsiveDialog({ open, onOpenChange, title, description, children }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: Rodar teste**

```bash
cd apps/web && npx vitest run components/molecules/__tests__/responsive-dialog.test.tsx
```

Expected: PASS.

## Task 16: `WalletSwitcherProvider` + `useActiveWallet`

**Files:**

- Create: `apps/web/components/providers/wallet-switcher-provider.tsx`
- Create: `apps/web/hooks/shared/use-active-wallet.ts`
- Create: `apps/web/hooks/shared/use-wallets-list.ts`

> A lista vem do server fetch no `layout.tsx` (Task 19) e é hidratada como `initialData` no SWR. Hook `useWalletsList` usa SWR para revalidação após mutações.

- [ ] **Step 1: Escrever `use-wallets-list.ts`**

```typescript
'use client';
import useSWR from 'swr';
import type { WalletSummary } from '@kainos/shared-types';

export function useWalletsList(initialData?: WalletSummary[]) {
  return useSWR<WalletSummary[]>('/v1/wallets', { fallbackData: initialData });
}
```

> `@kainos/shared-types` ainda não exporta `WalletSummary` até o Commit 3 — para destravar o Commit 2 sem dependência circular, criar tipo provisório local agora e remover quando Commit 3 mergear o shared-types:

Criar `apps/web/types/wallet.ts` provisório:

```typescript
// PROVISÓRIO — será removido no Commit 3 quando @kainos/shared-types
// exportar os tipos via packages/shared-types/src/porttion.ts.
export interface WalletSummary {
  id: string;
  name: string;
  baseCurrency: 'BRL' | 'USD' | 'EUR';
  strategy: 'balanceada' | 'crescimento' | 'renda' | 'personalizada' | null;
  positionsCount: number;
  patrimonio: number | null;
  plTotal: number | null;
  variacaoDiaPct: number | null;
  stale: boolean;
  createdAt: string;
  updatedAt: string;
}
```

E ajustar todo import nesta Task para `@/types/wallet` em vez de `@kainos/shared-types`.

- [ ] **Step 2: Escrever `wallet-switcher-provider.tsx`**

```tsx
'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WalletSummary } from '@/types/wallet';
import { useWalletsList } from '@/hooks/shared/use-wallets-list';

interface Ctx {
  wallets: WalletSummary[];
  activeWallet: WalletSummary | null;
  switchWallet: (id: string) => void;
  refresh: () => Promise<unknown>;
}

const WalletSwitcherContext = createContext<Ctx | null>(null);

const COOKIE_KEY = 'porttion_active_wallet';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
}

interface Props {
  initialWallets: WalletSummary[];
  initialActiveId: string | null;
  children: React.ReactNode;
}

export function WalletSwitcherProvider({ initialWallets, initialActiveId, children }: Props) {
  const { data, mutate } = useWalletsList(initialWallets);
  const wallets = data ?? [];
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);
  const router = useRouter();

  // Recompute active sempre que wallets ou activeId mudarem.
  const activeWallet = useMemo<WalletSummary | null>(() => {
    if (wallets.length === 0) return null;
    if (activeId) {
      const found = wallets.find((w) => w.id === activeId);
      if (found) return found;
    }
    return wallets[0];
  }, [wallets, activeId]);

  const switchWallet = useCallback(
    (id: string) => {
      writeCookie(COOKIE_KEY, id);
      setActiveId(id);
      router.refresh();
    },
    [router],
  );

  // Listener cross-tab.
  useEffect(() => {
    function onStorage(e: StorageEvent): void {
      if (e.key === COOKIE_KEY && e.newValue) setActiveId(e.newValue);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ wallets, activeWallet, switchWallet, refresh: () => mutate() }),
    [wallets, activeWallet, switchWallet, mutate],
  );

  return <WalletSwitcherContext.Provider value={value}>{children}</WalletSwitcherContext.Provider>;
}

export function useWalletSwitcher(): Ctx {
  const ctx = useContext(WalletSwitcherContext);
  if (!ctx) throw new Error('useWalletSwitcher fora de WalletSwitcherProvider');
  return ctx;
}
```

- [ ] **Step 3: Escrever `use-active-wallet.ts` (atalho)**

```typescript
'use client';
import { useWalletSwitcher } from '@/components/providers/wallet-switcher-provider';

export function useActiveWallet() {
  return useWalletSwitcher().activeWallet;
}
```

- [ ] **Step 4: Smoke typecheck**

```bash
npm run typecheck
```

Expected: PASS.

## Task 17: `Sidebar` desktop + `SidebarMobile` (Sheet drawer)

**Files:**

- Create: `apps/web/components/organisms/layout/sidebar.tsx`
- Create: `apps/web/components/organisms/layout/sidebar-mobile.tsx`
- Create: `apps/web/components/organisms/layout/__tests__/sidebar.test.tsx`

- [ ] **Step 1: Escrever teste**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../sidebar';

describe('Sidebar', () => {
  it('renderiza links principais', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /carteira/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /configura/i })).toBeInTheDocument();
  });
});
```

> i18n no teste: `next-intl` precisa de provider. Se os testes F1a já usam `IntlProvider` em `vitest.setup.ts`, herdar. Se não, criar wrapper de teste em `apps/web/__tests__/i18n-test-provider.tsx` que envolve `NextIntlClientProvider` com `messages={pt-BR.json}` e usar em todos os testes que dependem de `t()`. Padrão usado pela F1a deve guiar.

- [ ] **Step 2: Rodar teste (deve falhar — sidebar não existe)**

```bash
cd apps/web && npx vitest run components/organisms/layout/__tests__/sidebar.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implementar `sidebar.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/atoms/icons/brand/logo';
import { WalletSwitcher } from './wallet-switcher';
import { LayoutDashboard, Wallet, Settings } from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/carteiras', icon: Wallet, key: 'carteiras' },
  { href: '/configuracoes', icon: Settings, key: 'configuracoes' },
] as const;

export function Sidebar() {
  const t = useTranslations('sidebar');
  const pathname = usePathname();
  return (
    <aside className="bg-background hidden h-screen w-64 shrink-0 flex-col border-r md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Logo />
        <span className="font-semibold">Porttion</span>
      </div>
      <div className="border-b p-3">
        <WalletSwitcher />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Implementar `sidebar-mobile.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/atoms/ui/sheet';
import { Sidebar } from './sidebar';

export function SidebarMobile() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menu" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div onClick={() => setOpen(false)} className="contents">
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 5: Atualizar i18n `pt-BR.json` com namespace `sidebar`**

Em `apps/web/messages/pt-BR.json`, dentro da raiz JSON, adicionar (mantendo namespaces F1a):

```json
"sidebar": {
  "dashboard": "Dashboard",
  "carteiras": "Carteiras",
  "configuracoes": "Configurações"
}
```

- [ ] **Step 6: Rodar teste**

```bash
cd apps/web && npx vitest run components/organisms/layout/__tests__/sidebar.test.tsx
```

Expected: PASS.

## Task 18: `WalletSwitcher` popover

**Files:**

- Create: `apps/web/components/organisms/layout/wallet-switcher.tsx`
- Create: `apps/web/components/organisms/layout/__tests__/wallet-switcher.test.tsx`

- [ ] **Step 1: Escrever teste**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletSwitcher } from '../wallet-switcher';
import { WalletSwitcherProvider } from '@/components/providers/wallet-switcher-provider';
import type { WalletSummary } from '@/types/wallet';

const fixtures: WalletSummary[] = [
  {
    id: 'w1',
    name: 'Principal',
    baseCurrency: 'BRL',
    strategy: 'balanceada',
    positionsCount: 3,
    patrimonio: 1000,
    plTotal: 50,
    variacaoDiaPct: 0.5,
    stale: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'w2',
    name: 'Cripto',
    baseCurrency: 'BRL',
    strategy: 'crescimento',
    positionsCount: 1,
    patrimonio: null,
    plTotal: null,
    variacaoDiaPct: null,
    stale: true,
    createdAt: '',
    updatedAt: '',
  },
];

describe('WalletSwitcher', () => {
  it('mostra nome da carteira ativa', () => {
    render(
      <WalletSwitcherProvider initialWallets={fixtures} initialActiveId="w1">
        <WalletSwitcher />
      </WalletSwitcherProvider>,
    );
    expect(screen.getByText('Principal')).toBeInTheDocument();
  });

  it('abre popover e troca a carteira', async () => {
    const { container } = render(
      <WalletSwitcherProvider initialWallets={fixtures} initialActiveId="w1">
        <WalletSwitcher />
      </WalletSwitcherProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /principal/i }));
    const item = await screen.findByText('Cripto');
    fireEvent.click(item);
    // Cookie escrito
    expect(document.cookie).toContain('porttion_active_wallet=w2');
  });

  it('mostra CTA "criar primeira" quando lista vazia', () => {
    render(
      <WalletSwitcherProvider initialWallets={[]} initialActiveId={null}>
        <WalletSwitcher />
      </WalletSwitcherProvider>,
    );
    expect(screen.getByText(/criar primeira/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implementar**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { ChevronsUpDown, Plus, Check } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/ui/popover';
import { useWalletSwitcher } from '@/components/providers/wallet-switcher-provider';
import { cn } from '@/lib/utils';

export function WalletSwitcher() {
  const t = useTranslations('sidebar');
  const { wallets, activeWallet, switchWallet } = useWalletSwitcher();

  if (wallets.length === 0) {
    return (
      <Button variant="outline" className="w-full justify-start" disabled>
        <Plus className="mr-2 size-4" />
        {t('createFirstWallet')}
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">{activeWallet?.name ?? '—'}</span>
          <ChevronsUpDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        {wallets.map((w) => (
          <button
            key={w.id}
            onClick={() => switchWallet(w.id)}
            className={cn(
              'hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-sm',
              activeWallet?.id === w.id && 'bg-accent/50',
            )}
          >
            <span className="truncate">{w.name}</span>
            {activeWallet?.id === w.id ? <Check className="size-4" /> : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 3: Adicionar chaves i18n**

Em `pt-BR.json`, dentro de `sidebar`:

```json
"sidebar": {
  "dashboard": "Dashboard",
  "carteiras": "Carteiras",
  "configuracoes": "Configurações",
  "createFirstWallet": "Crie sua primeira carteira"
}
```

- [ ] **Step 4: Rodar teste**

```bash
cd apps/web && npx vitest run components/organisms/layout/__tests__/wallet-switcher.test.tsx
```

Expected: PASS.

## Task 19: `AuthedShell` template + `(authed)/layout.tsx` refeito

**Files:**

- Create: `apps/web/components/templates/authed-shell.tsx`
- Modify: `apps/web/app/(authed)/layout.tsx`

- [ ] **Step 1: Escrever `AuthedShell`**

```tsx
import { Sidebar } from '@/components/organisms/layout/sidebar';
import { Topbar } from '@/components/organisms/layout/topbar';
import { SidebarMobile } from '@/components/organisms/layout/sidebar-mobile';

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
}

export function AuthedShell({ user, children }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} leadingSlot={<SidebarMobile />} />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
```

> Se o `Topbar` atual da F1a não aceita prop `leadingSlot`, adicionar a prop opcional e renderizar no canto esquerdo antes da marca/menu user. Caso `Topbar` exija refactor maior, fazê-lo nesta task — sem mudar comportamento dos botões existentes.

- [ ] **Step 2: Server fetch da lista de wallets**

Reescrever `apps/web/app/(authed)/layout.tsx`:

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthedShell } from '@/components/templates/authed-shell';
import { WalletSwitcherProvider } from '@/components/providers/wallet-switcher-provider';
import { env } from '@/lib/env';
import type { WalletSummary } from '@/types/wallet';

async function fetchWallets(jwt: string): Promise<WalletSummary[]> {
  // Até o Commit 3 esse endpoint não existe — defensive guard:
  try {
    const res = await fetch(`${env.API_URL}/v1/wallets`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return (await res.json()) as WalletSummary[];
  } catch {
    return [];
  }
}

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const cookieStore = await cookies();
  const activeId = cookieStore.get('porttion_active_wallet')?.value ?? null;
  const wallets = session.accessToken ? await fetchWallets(session.accessToken) : [];

  return (
    <WalletSwitcherProvider initialWallets={wallets} initialActiveId={activeId}>
      <AuthedShell user={session.user}>{children}</AuthedShell>
    </WalletSwitcherProvider>
  );
}
```

> Se a F1a já popula `session.accessToken` no JWT callback, reaproveitar. Caso contrário, adicionar `accessToken: token.id` (ou similar) no `session` callback de `lib/auth.ts` — verificar antes de chumbar.

- [ ] **Step 3: Smoke build**

```bash
npm run build --workspace=@kainos/web
```

Expected: PASS.

## Task 20: Validação e commit do Commit 2

- [ ] **Step 1: Rodar gates completos**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Expected: tudo verde.

- [ ] **Step 2: Smoke manual**

Subir dev e fazer login. Após autenticação, verificar:

- Sidebar visível em desktop com Logo + WalletSwitcher (CTA "Crie sua primeira carteira" — wallets é `[]` ainda) + 3 links.
- Em mobile (DevTools 390×844), botão "menu" abre drawer.
- Topbar mantém user menu da F1a.
- `/dashboard` ainda mostra placeholder F1a — sem regressão.

- [ ] **Step 3: Commit**

```bash
git add apps/web/
git commit -m "feat(web): authed shell with sidebar, topbar, wallet switcher provider

- AuthedShell template (sidebar desktop + sidebar mobile via Sheet)
- WalletSwitcherProvider (cookie-backed active wallet, cross-tab listener)
- useMediaQuery, useActiveWallet, useWalletsList hooks
- ResponsiveDialog molecule (Dialog md+ / Sheet bottom <md)
- swr-fetcher + SWRConfig global
- i18n: sidebar.*

Wallets list comes from a server fetch wrapped in defensive try/catch
until Commit 3 lands the API."
```

---

# Commit 3 — `feat(api): wallets + positions + market with KPIs`

> Backend completo de domínio. Migração Prisma aditiva, 3 módulos novos (`wallets`, `positions`, `market`), shared-types preenchido, throttler com buckets `market`/`ai-analyst`. Todo endpoint REST autenticado via `JwtAuthGuard` (já global da F1a) + filtro `userId` explícito no `where`.

## Task 21: Migração Prisma `f1b_domain`

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_f1b_domain/migration.sql` (gerada)

- [ ] **Step 1: Estender `schema.prisma`**

Adicionar dentro de `model User` (após `emailTokens`):

```prisma
  wallets  Wallet[]
  analyses AssetAnalysis[]
```

Adicionar ao final do arquivo, após `EmailToken`:

```prisma
model Wallet {
  id           String     @id @default(cuid())
  userId       String
  name         String
  baseCurrency String     @default("BRL")
  strategy     String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  positions    Position[]
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])
  @@index([userId])
}

model Position {
  id         String   @id @default(cuid())
  walletId   String
  ticker     String
  qty        Float
  avgPrice   Float
  assetClass String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  wallet     Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@unique([walletId, ticker])
  @@index([walletId])
}

model AssetAnalysis {
  id            String   @id @default(cuid())
  userId        String
  ticker        String
  windowDays    Int
  payload       Json
  promptKey     String
  promptVersion Int
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, ticker, createdAt])
}
```

- [ ] **Step 2: Gerar migração**

```bash
cd apps/api && npx prisma migrate dev --name f1b_domain
```

Expected: cria `prisma/migrations/<timestamp>_f1b_domain/migration.sql`, regenera client. Inspecionar o SQL gerado e confirmar:

- `CREATE TABLE "Wallet"`, `"Position"`, `"AssetAnalysis"`.
- ÍNDICES e UNIQUE conforme schema.
- FOREIGN KEYS com `ON DELETE CASCADE`.

- [ ] **Step 3: Sanity check**

```bash
cd apps/api && npx prisma migrate status
```

Expected: "Database schema is up to date".

## Task 22: Estender `packages/shared-types/src/porttion.ts`

**Files:**

- Create: `packages/shared-types/src/porttion.ts`
- Modify: `packages/shared-types/src/index.ts`

- [ ] **Step 1: Criar `porttion.ts`**

```typescript
// Tipos compartilhados do domínio Porttion (F1+).
// Backend (NestJS) é a fonte da verdade — DTOs Zod produzem estes shapes.
// Frontend importa daqui para evitar drift.

export type AssetClass = 'acoes_br' | 'etf' | 'renda_fixa' | 'cripto' | 'moeda';
export type BaseCurrency = 'BRL' | 'USD' | 'EUR';
export type Strategy = 'balanceada' | 'crescimento' | 'renda' | 'personalizada';

export interface WalletSummary {
  id: string;
  name: string;
  baseCurrency: BaseCurrency;
  strategy: Strategy | null;
  positionsCount: number;
  patrimonio: number | null;
  plTotal: number | null;
  variacaoDiaPct: number | null;
  stale: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PositionWithQuote {
  id: string;
  ticker: string;
  qty: number;
  avgPrice: number;
  assetClass: AssetClass;
  quote: number | null;
  changePct: number | null;
  valor: number | null;
  pl: number | null;
  plPct: number | null;
  stale: boolean;
  lastUpdate: string | null;
}

export interface WalletDetail extends WalletSummary {
  custoTotal: number;
  positions: PositionWithQuote[];
  allocationByClass: { assetClass: AssetClass; valor: number; pct: number }[];
}

export interface MarketAsset {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  exchange: string | null;
}

export interface Quote {
  ticker: string;
  price: number;
  changePct: number;
  currency: string;
  lastUpdate: string;
}

export interface Candle {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type OhlcPeriod = '7d' | '30d' | '6m' | '1a' | '5a';

export type AssetAnalysisRecommendation = 'comprar' | 'manter' | 'nao_comprar';
export type AssetAnalysisTendencia = 'alta' | 'lateral' | 'baixa';

export interface AssetAnalysisPayload {
  tendencia: AssetAnalysisTendencia;
  recomendacao: AssetAnalysisRecommendation;
  confianca: number; // 0..100
  padroes: string[]; // max 4
  riscos: string[]; // max 3
  sugestao: string; // max 280
  justificativa: string; // max 500
  horizonte: string; // ex.: "1-2 semanas"
}

export interface AssetAnalysisDto {
  ticker: string;
  windowDays: number;
  generatedAt: string;
  promptKey: string;
  promptVersion: number;
  cached: boolean;
  payload: AssetAnalysisPayload;
}
```

- [ ] **Step 2: Re-exportar via `index.ts`**

Em `packages/shared-types/src/index.ts`, adicionar ao final:

```typescript
export * from './porttion';
```

- [ ] **Step 3: Build shared-types**

```bash
npm run build --workspace=@kainos/shared-types
```

Expected: PASS.

- [ ] **Step 4: Remover `apps/web/types/wallet.ts` provisório e migrar imports**

```bash
rm apps/web/types/wallet.ts
```

E em todos os arquivos criados em Commit 2 (`wallet-switcher-provider.tsx`, `use-wallets-list.ts`, `wallet-switcher.tsx`, layout, testes), trocar `from '@/types/wallet'` por `from '@kainos/shared-types'`.

Comando útil:

```bash
cd apps/web && grep -rl "@/types/wallet" components hooks app | xargs sed -i "s|@/types/wallet|@kainos/shared-types|g"
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

## Task 23: `LruCache` utilitário (TTL + capacidade)

**Files:**

- Create: `apps/api/src/market/lru-cache.ts`
- Create: `apps/api/src/market/lru-cache.spec.ts`

- [ ] **Step 1: Escrever teste**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { LruCache } from './lru-cache';

describe('LruCache', () => {
  it('retorna valor cacheado dentro do TTL', () => {
    const cache = new LruCache<string, number>({ max: 10, ttlMs: 1000 });
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('expira após o TTL', () => {
    vi.useFakeTimers();
    const cache = new LruCache<string, number>({ max: 10, ttlMs: 1000 });
    cache.set('a', 1);
    vi.advanceTimersByTime(1500);
    expect(cache.get('a')).toBeUndefined();
    vi.useRealTimers();
  });

  it('evita a chave menos recentemente usada quando estoura max', () => {
    const cache = new LruCache<string, number>({ max: 2, ttlMs: 60_000 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // promove 'a'
    cache.set('c', 3); // evita 'b'
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('delete e clear funcionam', () => {
    const cache = new LruCache<string, number>({ max: 10, ttlMs: 60_000 });
    cache.set('a', 1);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('b')).toBeUndefined();
  });
});
```

> Nota: backend usa Jest globalmente. Substituir `vi.*` por `jest.*` e ajustar imports (`@jest/globals` ou globais Jest). Esta plan padroniza Jest no backend — exemplo já corrigido:

```typescript
import { LruCache } from './lru-cache';

describe('LruCache', () => {
  it('retorna valor cacheado dentro do TTL', () => {
    const cache = new LruCache<string, number>({ max: 10, ttlMs: 1000 });
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('expira após o TTL', () => {
    jest.useFakeTimers();
    const cache = new LruCache<string, number>({ max: 10, ttlMs: 1000 });
    cache.set('a', 1);
    jest.advanceTimersByTime(1500);
    expect(cache.get('a')).toBeUndefined();
    jest.useRealTimers();
  });

  it('evita a chave menos recentemente usada quando estoura max', () => {
    const cache = new LruCache<string, number>({ max: 2, ttlMs: 60_000 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a');
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('delete e clear funcionam', () => {
    const cache = new LruCache<string, number>({ max: 10, ttlMs: 60_000 });
    cache.set('a', 1);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('b')).toBeUndefined();
  });
});
```

> Use a versão Jest acima.

- [ ] **Step 2: Rodar teste (deve falhar)**

```bash
cd apps/api && npx jest src/market/lru-cache.spec.ts
```

Expected: FAIL com "Cannot find module './lru-cache'".

- [ ] **Step 3: Implementar `lru-cache.ts`**

```typescript
interface Entry<V> {
  value: V;
  expiresAt: number;
}

interface Opts {
  max: number;
  ttlMs: number;
}

// LRU + TTL in-process. `Map` no JS preserva ordem de inserção, então
// remover + inserir promove a chave para o final ("mais recentemente usada").
export class LruCache<K, V> {
  private readonly map = new Map<K, Entry<V>>();

  constructor(private readonly opts: Opts) {}

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    // promove
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + this.opts.ttlMs });
    while (this.map.size > this.opts.max) {
      const first = this.map.keys().next().value;
      if (first === undefined) break;
      this.map.delete(first);
    }
  }

  delete(key: K): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}
```

- [ ] **Step 4: Rodar teste (deve passar)**

```bash
cd apps/api && npx jest src/market/lru-cache.spec.ts
```

Expected: PASS.

## Task 24: `yahoo-symbol` normalizer + classification

**Files:**

- Create: `apps/api/src/market/yahoo-symbol.ts`
- Create: `apps/api/src/market/yahoo-symbol.spec.ts`

- [ ] **Step 1: Escrever teste**

```typescript
import { toYahooSymbol, fromYahooQuoteType, inferAssetClass } from './yahoo-symbol';

describe('toYahooSymbol', () => {
  const cases: Array<[string, string]> = [
    ['PETR4', 'PETR4.SA'],
    ['VALE3', 'VALE3.SA'],
    ['BOVA11', 'BOVA11.SA'],
    ['AAPL', 'AAPL'],
    ['MSFT', 'MSFT'],
    ['BTC', 'BTC-USD'],
    ['ETH', 'ETH-USD'],
    ['USD', 'USDBRL=X'],
  ];
  it.each(cases)('%s → %s', (input, expected) => {
    expect(toYahooSymbol(input)).toBe(expected);
  });
});

describe('inferAssetClass', () => {
  it('B3 4 dígitos → acoes_br', () => {
    expect(inferAssetClass('PETR4', { quoteType: 'EQUITY', exchange: 'SAO' })).toBe('acoes_br');
  });
  it('B3 11 final → etf', () => {
    expect(inferAssetClass('BOVA11', { quoteType: 'ETF', exchange: 'SAO' })).toBe('etf');
  });
  it('CRYPTOCURRENCY → cripto', () => {
    expect(inferAssetClass('BTC', { quoteType: 'CRYPTOCURRENCY' })).toBe('cripto');
  });
  it('CURRENCY → moeda', () => {
    expect(inferAssetClass('USD', { quoteType: 'CURRENCY' })).toBe('moeda');
  });
  it('ETF US → etf', () => {
    expect(inferAssetClass('SPY', { quoteType: 'ETF' })).toBe('etf');
  });
});

describe('fromYahooQuoteType', () => {
  it('mapeia tipos conhecidos', () => {
    expect(fromYahooQuoteType('EQUITY')).toBe('acoes_br');
    expect(fromYahooQuoteType('ETF')).toBe('etf');
    expect(fromYahooQuoteType('CRYPTOCURRENCY')).toBe('cripto');
    expect(fromYahooQuoteType('CURRENCY')).toBe('moeda');
  });
});
```

- [ ] **Step 2: Implementar**

```typescript
import type { AssetClass } from '@kainos/shared-types';

const CRYPTOS = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE']);
const FIAT = new Set(['USD', 'EUR', 'GBP']);

export function toYahooSymbol(ticker: string): string {
  const t = ticker.toUpperCase();
  if (CRYPTOS.has(t)) return `${t}-USD`;
  if (FIAT.has(t)) return `${t}BRL=X`;
  // B3 padrão: 4 letras + 1-2 dígitos
  if (/^[A-Z]{4}\d{1,2}$/.test(t)) return `${t}.SA`;
  // US/global equities sem sufixo.
  return t;
}

export function inferAssetClass(
  ticker: string,
  hint: { quoteType?: string; exchange?: string } = {},
): AssetClass {
  const qt = hint.quoteType?.toUpperCase();
  if (qt === 'CRYPTOCURRENCY') return 'cripto';
  if (qt === 'CURRENCY') return 'moeda';
  if (qt === 'ETF') return 'etf';
  // B3 com 11 final → ETF B3
  if (/11$/.test(ticker) && hint.exchange?.startsWith('SAO')) return 'etf';
  if (/^[A-Z]{4}\d{1,2}$/.test(ticker)) return 'acoes_br';
  // fallback conservador
  return 'etf';
}

export function fromYahooQuoteType(qt: string): AssetClass {
  switch (qt.toUpperCase()) {
    case 'CRYPTOCURRENCY':
      return 'cripto';
    case 'CURRENCY':
      return 'moeda';
    case 'ETF':
      return 'etf';
    case 'EQUITY':
    default:
      return 'acoes_br';
  }
}
```

- [ ] **Step 3: Rodar teste**

```bash
cd apps/api && npx jest src/market/yahoo-symbol.spec.ts
```

Expected: PASS (todos os 12+ cases).

## Task 25: `MarketService` — search/quote/quoteMany/ohlc/validateTicker

**Files:**

- Create: `apps/api/src/market/market.service.ts`
- Create: `apps/api/src/market/market.service.spec.ts`

- [ ] **Step 1: Escrever teste**

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MarketService } from './market.service';
import yahooFinance from 'yahoo-finance2';

jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    search: jest.fn(),
    quote: jest.fn(),
    historical: jest.fn(),
  },
}));

const yf = yahooFinance as unknown as {
  search: jest.Mock;
  quote: jest.Mock;
  historical: jest.Mock;
};

describe('MarketService', () => {
  let service: MarketService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        MarketService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'MARKET_TIMEOUT_MS' ? 4000 : undefined),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(MarketService);
  });

  it('quote: cache hit não bate Yahoo na 2ª chamada', async () => {
    yf.quote.mockResolvedValueOnce({
      symbol: 'PETR4.SA',
      regularMarketPrice: 30,
      regularMarketChangePercent: 1.5,
      currency: 'BRL',
      regularMarketTime: new Date('2026-05-20T18:00:00Z'),
    });
    const first = await service.quote('PETR4');
    const second = await service.quote('PETR4');
    expect(yf.quote).toHaveBeenCalledTimes(1);
    expect(first?.price).toBe(30);
    expect(second?.price).toBe(30);
  });

  it('quote: retorna null quando Yahoo lança', async () => {
    yf.quote.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await service.quote('XPTO9');
    expect(result).toBeNull();
  });

  it('quoteMany: parcial (1 falha entre 3)', async () => {
    yf.quote.mockResolvedValueOnce([
      {
        symbol: 'PETR4.SA',
        regularMarketPrice: 30,
        regularMarketChangePercent: 1,
        currency: 'BRL',
        regularMarketTime: new Date(),
      },
      {
        symbol: 'VALE3.SA',
        regularMarketPrice: 60,
        regularMarketChangePercent: -0.5,
        currency: 'BRL',
        regularMarketTime: new Date(),
      },
      // BOVA11 ausente
    ]);
    const result = await service.quoteMany(['PETR4', 'VALE3', 'BOVA11']);
    expect(result.get('PETR4')?.price).toBe(30);
    expect(result.get('VALE3')?.price).toBe(60);
    expect(result.get('BOVA11')).toBeNull();
  });

  it('validateTicker: joga 422 quando search vem vazio', async () => {
    yf.search.mockResolvedValueOnce({ quotes: [] });
    await expect(service.validateTicker('NOPE0')).rejects.toMatchObject({
      status: 422,
    });
  });

  it('validateTicker: retorna asset quando search devolve match', async () => {
    yf.search.mockResolvedValueOnce({
      quotes: [
        {
          symbol: 'PETR4.SA',
          shortname: 'Petrobras PN',
          quoteType: 'EQUITY',
          exchange: 'SAO',
        },
      ],
    });
    const result = await service.validateTicker('PETR4');
    expect(result).toEqual({
      ticker: 'PETR4',
      name: 'Petrobras PN',
      assetClass: 'acoes_br',
      exchange: 'SAO',
    });
  });

  it('ohlc: fallback .SA → bare quando primeira chamada falha', async () => {
    yf.historical.mockRejectedValueOnce(new Error('not found'));
    yf.historical.mockResolvedValueOnce([
      {
        date: new Date('2026-05-15T00:00:00Z'),
        open: 10,
        high: 11,
        low: 9,
        close: 10.5,
        volume: 100,
      },
    ]);
    const result = await service.ohlc('PETR4', '7d');
    expect(yf.historical).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0].close).toBe(10.5);
  });
});
```

- [ ] **Step 2: Rodar teste (deve falhar)**

```bash
cd apps/api && npx jest src/market/market.service.spec.ts
```

Expected: FAIL com "Cannot find module './market.service'".

- [ ] **Step 3: Implementar `market.service.ts`**

```typescript
import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import yahooFinance from 'yahoo-finance2';
import type { MarketAsset, Quote, Candle, OhlcPeriod } from '@kainos/shared-types';
import { LruCache } from './lru-cache';
import { toYahooSymbol, inferAssetClass, fromYahooQuoteType } from './yahoo-symbol';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  private readonly quoteCache = new LruCache<string, Quote | null>({ max: 500, ttlMs: 5 * 60_000 });
  private readonly ohlcCache = new LruCache<string, Candle[]>({ max: 200, ttlMs: 30 * 60_000 });
  private readonly searchCache = new LruCache<string, MarketAsset[]>({
    max: 100,
    ttlMs: 60 * 60_000,
  });

  constructor(private readonly config: ConfigService) {}

  async search(q: string, limit = 10): Promise<MarketAsset[]> {
    const key = `${q.toUpperCase()}:${limit}`;
    const hit = this.searchCache.get(key);
    if (hit) return hit;
    try {
      const res = await yahooFinance.search(q, { newsCount: 0 });
      const out: MarketAsset[] = (res.quotes ?? [])
        .filter(
          (
            it,
          ): it is {
            symbol: string;
            shortname?: string;
            longname?: string;
            quoteType?: string;
            exchange?: string;
          } => 'symbol' in it && typeof it.symbol === 'string',
        )
        .slice(0, limit)
        .map((it) => {
          const ticker = it.symbol
            .replace(/\.SA$/, '')
            .replace(/-USD$/, '')
            .replace(/BRL=X$/, '');
          return {
            ticker: ticker.toUpperCase(),
            name: it.shortname ?? it.longname ?? it.symbol,
            assetClass: inferAssetClass(ticker, { quoteType: it.quoteType, exchange: it.exchange }),
            exchange: it.exchange ?? null,
          };
        });
      this.searchCache.set(key, out);
      return out;
    } catch (err) {
      this.logger.warn({ event: 'market.search.failed', q, err: (err as Error).message });
      return [];
    }
  }

  async quote(ticker: string): Promise<Quote | null> {
    const key = ticker.toUpperCase();
    const cached = this.quoteCache.get(key);
    if (cached !== undefined) return cached;
    const symbol = toYahooSymbol(key);
    try {
      const res = await yahooFinance.quote(symbol);
      const q = this.parseQuote(key, res);
      this.quoteCache.set(key, q);
      return q;
    } catch (err) {
      this.logger.warn({ event: 'market.quote.failed', ticker: key, err: (err as Error).message });
      this.quoteCache.set(key, null);
      return null;
    }
  }

  async quoteMany(tickers: string[]): Promise<Map<string, Quote | null>> {
    const out = new Map<string, Quote | null>();
    const toFetch: string[] = [];
    for (const t of tickers) {
      const k = t.toUpperCase();
      const cached = this.quoteCache.get(k);
      if (cached !== undefined) out.set(k, cached);
      else toFetch.push(k);
    }
    if (toFetch.length === 0) return out;
    const symbols = toFetch.map(toYahooSymbol);
    try {
      const res = await yahooFinance.quote(symbols);
      const arr = Array.isArray(res) ? res : [res];
      const bySymbol = new Map<string, unknown>();
      for (const item of arr) {
        const sym = (item as { symbol?: string }).symbol;
        if (sym) bySymbol.set(sym, item);
      }
      for (const k of toFetch) {
        const sym = toYahooSymbol(k);
        const raw = bySymbol.get(sym);
        const q = raw ? this.parseQuote(k, raw) : null;
        this.quoteCache.set(k, q);
        out.set(k, q);
      }
    } catch (err) {
      this.logger.warn({
        event: 'market.quoteMany.failed',
        count: toFetch.length,
        err: (err as Error).message,
      });
      for (const k of toFetch) {
        this.quoteCache.set(k, null);
        out.set(k, null);
      }
    }
    return out;
  }

  async ohlc(ticker: string, period: OhlcPeriod): Promise<Candle[]> {
    const key = `${ticker.toUpperCase()}:${period}`;
    const cached = this.ohlcCache.get(key);
    if (cached) return cached;
    const { period1 } = this.periodToDates(period);
    const symbol = toYahooSymbol(ticker.toUpperCase());
    let raw: unknown[] = [];
    try {
      raw = (await yahooFinance.historical(symbol, { period1, interval: '1d' })) as unknown[];
    } catch (err) {
      // fallback: tenta sem .SA
      if (symbol.endsWith('.SA')) {
        try {
          raw = (await yahooFinance.historical(ticker.toUpperCase(), {
            period1,
            interval: '1d',
          })) as unknown[];
        } catch (err2) {
          this.logger.warn({ event: 'market.ohlc.failed', ticker, err: (err2 as Error).message });
          return [];
        }
      } else {
        this.logger.warn({ event: 'market.ohlc.failed', ticker, err: (err as Error).message });
        return [];
      }
    }
    const candles: Candle[] = raw
      .map((r) => {
        const row = r as {
          date: Date;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        };
        return {
          date: row.date.toISOString().slice(0, 10),
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume,
        };
      })
      .filter((c) => Number.isFinite(c.open) && Number.isFinite(c.close));
    this.ohlcCache.set(key, candles);
    return candles;
  }

  async validateTicker(ticker: string): Promise<MarketAsset> {
    const found = await this.search(ticker, 5);
    const exact = found.find((m) => m.ticker === ticker.toUpperCase());
    if (!exact)
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: 'Ticker desconhecido',
        ticker,
      });
    return exact;
  }

  private parseQuote(ticker: string, raw: unknown): Quote | null {
    const r = raw as {
      regularMarketPrice?: number;
      regularMarketChangePercent?: number;
      currency?: string;
      regularMarketTime?: Date | string;
    };
    if (typeof r?.regularMarketPrice !== 'number') return null;
    const ts =
      r.regularMarketTime instanceof Date
        ? r.regularMarketTime
        : new Date(r.regularMarketTime ?? Date.now());
    return {
      ticker,
      price: r.regularMarketPrice,
      changePct: r.regularMarketChangePercent ?? 0,
      currency: r.currency ?? 'BRL',
      lastUpdate: ts.toISOString(),
    };
  }

  private periodToDates(p: OhlcPeriod): { period1: Date } {
    const now = new Date();
    const start = new Date(now);
    const map: Record<OhlcPeriod, number> = {
      '7d': 7,
      '30d': 30,
      '6m': 183,
      '1a': 365,
      '5a': 1825,
    };
    start.setDate(start.getDate() - map[p]);
    return { period1: start };
  }
}
```

> Notas: `yahoo-finance2` ESM. Se Jest reclamar de transform ESM, adicionar `transformIgnorePatterns` em `apps/api/jest.config.ts` para permitir `yahoo-finance2`. Solução clássica: `transformIgnorePatterns: ['node_modules/(?!(yahoo-finance2)/)']`.

- [ ] **Step 4: Rodar teste**

```bash
cd apps/api && npx jest src/market/market.service.spec.ts
```

Expected: PASS (5 cases).

## Task 26: `MarketController` + DTOs

**Files:**

- Create: `apps/api/src/market/market.controller.ts`
- Create: `apps/api/src/market/market.controller.spec.ts`
- Create: `apps/api/src/market/dto/search-market.dto.ts`
- Create: `apps/api/src/market/dto/ohlc-query.dto.ts`
- Create: `apps/api/src/market/market.module.ts`

- [ ] **Step 1: DTO `search-market.dto.ts`**

```typescript
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchMarketDto {
  @IsString()
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}
```

- [ ] **Step 2: DTO `ohlc-query.dto.ts`**

```typescript
import { IsIn, IsOptional } from 'class-validator';

export const OHLC_PERIODS = ['7d', '30d', '6m', '1a', '5a'] as const;
export type OhlcPeriodLit = (typeof OHLC_PERIODS)[number];

export class OhlcQueryDto {
  @IsOptional()
  @IsIn(OHLC_PERIODS)
  period: OhlcPeriodLit = '30d';
}
```

- [ ] **Step 3: Controller**

```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MarketService } from './market.service';
import { SearchMarketDto } from './dto/search-market.dto';
import { OhlcQueryDto } from './dto/ohlc-query.dto';

@Controller({ path: 'market', version: '1' })
@Throttle({ market: { limit: 60, ttl: 60_000 } })
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get('search')
  search(@Query() dto: SearchMarketDto) {
    return this.market.search(dto.q, dto.limit ?? 10);
  }

  @Get('quote/:ticker')
  async quote(@Param('ticker') ticker: string) {
    const q = await this.market.quote(ticker);
    return (
      q ?? {
        ticker: ticker.toUpperCase(),
        price: null,
        changePct: null,
        currency: 'BRL',
        lastUpdate: null,
        stale: true,
      }
    );
  }

  @Get('ohlc/:ticker')
  ohlc(@Param('ticker') ticker: string, @Query() dto: OhlcQueryDto) {
    return this.market.ohlc(ticker, dto.period);
  }
}
```

- [ ] **Step 4: Module**

```typescript
import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';

@Module({
  providers: [MarketService],
  controllers: [MarketController],
  exports: [MarketService],
})
export class MarketModule {}
```

- [ ] **Step 5: Controller spec (smoke)**

```typescript
import { Test } from '@nestjs/testing';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';

describe('MarketController', () => {
  let controller: MarketController;
  let service: { search: jest.Mock; quote: jest.Mock; ohlc: jest.Mock };

  beforeEach(async () => {
    service = { search: jest.fn(), quote: jest.fn(), ohlc: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [MarketController],
      providers: [{ provide: MarketService, useValue: service }],
    }).compile();
    controller = mod.get(MarketController);
  });

  it('delega search ao service', async () => {
    service.search.mockResolvedValueOnce([]);
    await controller.search({ q: 'PETR', limit: 5 });
    expect(service.search).toHaveBeenCalledWith('PETR', 5);
  });

  it('quote: retorna stale quando service devolve null', async () => {
    service.quote.mockResolvedValueOnce(null);
    const result = await controller.quote('XPTO9');
    expect(result).toMatchObject({ ticker: 'XPTO9', price: null, stale: true });
  });
});
```

- [ ] **Step 6: Rodar testes**

```bash
cd apps/api && npx jest src/market
```

Expected: PASS em todos os arquivos do módulo market.

## Task 27: Registrar `MarketModule` + buckets de throttler no `app.module.ts`

**Files:**

- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Adicionar buckets `market` e `ai-analyst`**

No `ThrottlerModule.forRoot([...])`, adicionar:

```typescript
{ name: 'market', ttl: 60_000, limit: 60 },
{ name: 'ai-analyst', ttl: 86_400_000, limit: 20 },
```

- [ ] **Step 2: Importar `MarketModule`**

Adicionar `import { MarketModule } from './market/market.module';` no topo e incluir `MarketModule` em `imports`.

- [ ] **Step 3: Verificar `UserScopedThrottlerGuard`**

Ler `apps/api/src/auth/guards/user-scoped-throttler.guard.ts` para confirmar que o keyGenerator usa `req.user?.id` antes de cair pro IP. Se não, ajustar:

```typescript
protected async getTracker(req: Record<string, unknown>): Promise<string> {
  const user = req.user as { id?: string } | undefined;
  return user?.id ?? (req as { ip?: string }).ip ?? 'anon';
}
```

> Sem teste novo aqui — comportamento já coberto pelos testes da F1a do bucket `auth-email`.

- [ ] **Step 4: Smoke build + test**

```bash
cd apps/api && npm run build && npm run test
```

Expected: PASS.

## Task 28: `WalletsService` — CRUD + ownership + KPIs

**Files:**

- Create: `apps/api/src/wallets/wallets.service.ts`
- Create: `apps/api/src/wallets/wallets.service.spec.ts`
- Create: `apps/api/src/wallets/wallet.mapper.ts`

- [ ] **Step 1: Escrever `wallet.mapper.ts`**

```typescript
import type { Wallet, Position } from '@prisma/client';
import type {
  WalletSummary,
  WalletDetail,
  Quote,
  AssetClass,
  BaseCurrency,
  Strategy,
} from '@kainos/shared-types';

export function toWalletSummary(
  w: Wallet & { positions: Position[] },
  kpis: {
    patrimonio: number | null;
    plTotal: number | null;
    variacaoDiaPct: number | null;
    stale: boolean;
  },
): WalletSummary {
  return {
    id: w.id,
    name: w.name,
    baseCurrency: w.baseCurrency as BaseCurrency,
    strategy: (w.strategy ?? null) as Strategy | null,
    positionsCount: w.positions.length,
    patrimonio: kpis.patrimonio,
    plTotal: kpis.plTotal,
    variacaoDiaPct: kpis.variacaoDiaPct,
    stale: kpis.stale,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

export function toWalletDetail(
  w: Wallet & { positions: Position[] },
  kpis: {
    patrimonio: number | null;
    plTotal: number | null;
    variacaoDiaPct: number | null;
    stale: boolean;
    custoTotal: number;
    positionsWithQuotes: WalletDetail['positions'];
    allocation: WalletDetail['allocationByClass'];
  },
): WalletDetail {
  return {
    ...toWalletSummary(w, kpis),
    custoTotal: kpis.custoTotal,
    positions: kpis.positionsWithQuotes,
    allocationByClass: kpis.allocation,
  };
}
```

- [ ] **Step 2: Escrever teste do service**

```typescript
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';

const prismaMock = () => {
  return {
    wallet: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
};

const marketMock = () => ({
  quoteMany: jest.fn().mockResolvedValue(new Map()),
});

describe('WalletsService', () => {
  let service: WalletsService;
  let prisma: ReturnType<typeof prismaMock>;
  let market: ReturnType<typeof marketMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    market = marketMock();
    const mod = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MarketService, useValue: market },
      ],
    }).compile();
    service = mod.get(WalletsService);
  });

  describe('ownership cross-user', () => {
    it('findOwned: 404 quando wallet pertence a outro user', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({ id: 'w1', userId: 'OTHER', positions: [] });
      await expect(service.findOwned('user-a', 'w1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('update: 404 cross-user', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({ id: 'w1', userId: 'OTHER', positions: [] });
      await expect(service.update('user-a', 'w1', { name: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('delete: 404 cross-user', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({ id: 'w1', userId: 'OTHER', positions: [] });
      await expect(service.remove('user-a', 'w1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('list: filtra por userId', async () => {
      prisma.wallet.findMany.mockResolvedValueOnce([]);
      await service.list('user-a');
      expect(prisma.wallet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-a' } }),
      );
    });
  });

  describe('@@unique', () => {
    it('create: 409 quando nome já existe para o user', async () => {
      const err: Error & { code?: string } = new Error('Unique constraint failed');
      err.code = 'P2002';
      prisma.wallet.create.mockRejectedValueOnce(err);
      await expect(
        service.create('user-a', { name: 'Principal', baseCurrency: 'BRL', strategy: null }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('computeKpis', () => {
    it('zero positions → todos KPIs zero/null sem quebrar', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({
        id: 'w1',
        userId: 'u',
        positions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'X',
        baseCurrency: 'BRL',
        strategy: null,
      });
      const result = await service.findOwned('u', 'w1');
      expect(result.patrimonio).toBe(0);
      expect(result.plTotal).toBe(0);
      expect(result.stale).toBe(false);
    });

    it('parcial stale: 1 quote null entre 2', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({
        id: 'w1',
        userId: 'u',
        positions: [
          { id: 'p1', ticker: 'PETR4', qty: 100, avgPrice: 30, assetClass: 'acoes_br' },
          { id: 'p2', ticker: 'VALE3', qty: 50, avgPrice: 60, assetClass: 'acoes_br' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'X',
        baseCurrency: 'BRL',
        strategy: null,
      });
      market.quoteMany.mockResolvedValueOnce(
        new Map([
          [
            'PETR4',
            {
              ticker: 'PETR4',
              price: 33,
              changePct: 1,
              currency: 'BRL',
              lastUpdate: new Date().toISOString(),
            },
          ],
          ['VALE3', null],
        ]),
      );
      const result = await service.findOwned('u', 'w1');
      expect(result.stale).toBe(true);
      expect(result.patrimonio).toBe(100 * 33);
      expect(result.plTotal).toBe(100 * 33 - 100 * 30);
    });

    it('todas stale → KPIs null', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({
        id: 'w1',
        userId: 'u',
        positions: [{ id: 'p1', ticker: 'PETR4', qty: 100, avgPrice: 30, assetClass: 'acoes_br' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'X',
        baseCurrency: 'BRL',
        strategy: null,
      });
      market.quoteMany.mockResolvedValueOnce(new Map([['PETR4', null]]));
      const result = await service.findOwned('u', 'w1');
      expect(result.patrimonio).toBeNull();
      expect(result.plTotal).toBeNull();
      expect(result.variacaoDiaPct).toBeNull();
      expect(result.stale).toBe(true);
    });
  });
});
```

- [ ] **Step 3: Implementar `wallets.service.ts`**

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import type {
  Quote,
  WalletSummary,
  WalletDetail,
  PositionWithQuote,
  AssetClass,
} from '@kainos/shared-types';

interface CreateInput {
  name: string;
  baseCurrency: 'BRL' | 'USD' | 'EUR';
  strategy: string | null;
}

interface UpdateInput {
  name?: string;
  strategy?: string | null;
}

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly market: MarketService,
  ) {}

  async list(userId: string): Promise<WalletSummary[]> {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      include: { positions: true },
      orderBy: { createdAt: 'asc' },
    });
    const tickers = Array.from(new Set(wallets.flatMap((w) => w.positions.map((p) => p.ticker))));
    const quotes = tickers.length
      ? await this.market.quoteMany(tickers)
      : new Map<string, Quote | null>();
    return wallets.map((w) => {
      const kpis = this.computeSummaryKpis(w.positions, quotes);
      return {
        id: w.id,
        name: w.name,
        baseCurrency: w.baseCurrency as WalletSummary['baseCurrency'],
        strategy: (w.strategy ?? null) as WalletSummary['strategy'],
        positionsCount: w.positions.length,
        patrimonio: kpis.patrimonio,
        plTotal: kpis.plTotal,
        variacaoDiaPct: kpis.variacaoDiaPct,
        stale: kpis.stale,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      };
    });
  }

  async findOwned(userId: string, walletId: string): Promise<WalletDetail> {
    const w = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: { positions: true },
    });
    if (!w || w.userId !== userId) throw new NotFoundException('Wallet não encontrada');
    const tickers = w.positions.map((p) => p.ticker);
    const quotes = tickers.length
      ? await this.market.quoteMany(tickers)
      : new Map<string, Quote | null>();
    const positionsWithQuotes: PositionWithQuote[] = w.positions.map((p) => {
      const q = quotes.get(p.ticker) ?? null;
      const valor = q ? p.qty * q.price : null;
      const pl = q ? p.qty * (q.price - p.avgPrice) : null;
      const plPct = q ? ((q.price - p.avgPrice) / p.avgPrice) * 100 : null;
      return {
        id: p.id,
        ticker: p.ticker,
        qty: p.qty,
        avgPrice: p.avgPrice,
        assetClass: p.assetClass as AssetClass,
        quote: q?.price ?? null,
        changePct: q?.changePct ?? null,
        valor,
        pl,
        plPct,
        stale: !q,
        lastUpdate: q?.lastUpdate ?? null,
      };
    });
    const kpis = this.computeSummaryKpis(w.positions, quotes);
    const custoTotal = w.positions.reduce((acc, p) => acc + p.qty * p.avgPrice, 0);
    const allocation = this.computeAllocation(positionsWithQuotes, kpis.patrimonio);
    return {
      id: w.id,
      name: w.name,
      baseCurrency: w.baseCurrency as WalletSummary['baseCurrency'],
      strategy: (w.strategy ?? null) as WalletSummary['strategy'],
      positionsCount: w.positions.length,
      patrimonio: kpis.patrimonio,
      plTotal: kpis.plTotal,
      variacaoDiaPct: kpis.variacaoDiaPct,
      stale: kpis.stale,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      custoTotal,
      positions: positionsWithQuotes,
      allocationByClass: allocation,
    };
  }

  async create(userId: string, input: CreateInput): Promise<WalletDetail> {
    try {
      const w = await this.prisma.wallet.create({
        data: {
          userId,
          name: input.name,
          baseCurrency: input.baseCurrency,
          strategy: input.strategy,
        },
        include: { positions: true },
      });
      return this.findOwned(userId, w.id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Você já tem uma carteira com esse nome');
      }
      throw err;
    }
  }

  async update(userId: string, walletId: string, input: UpdateInput): Promise<WalletDetail> {
    const existing = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!existing || existing.userId !== userId) throw new NotFoundException();
    try {
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: { name: input.name ?? undefined, strategy: input.strategy ?? undefined },
      });
      return this.findOwned(userId, walletId);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Você já tem uma carteira com esse nome');
      }
      throw err;
    }
  }

  async remove(userId: string, walletId: string): Promise<void> {
    const existing = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!existing || existing.userId !== userId) throw new NotFoundException();
    await this.prisma.wallet.delete({ where: { id: walletId } });
  }

  private computeSummaryKpis(
    positions: { ticker: string; qty: number; avgPrice: number }[],
    quotes: Map<string, Quote | null>,
  ): {
    patrimonio: number | null;
    plTotal: number | null;
    variacaoDiaPct: number | null;
    stale: boolean;
  } {
    if (positions.length === 0) {
      return { patrimonio: 0, plTotal: 0, variacaoDiaPct: 0, stale: false };
    }
    let patrimonio = 0;
    let custoComQuote = 0;
    let stale = false;
    let valorPond = 0;
    let pctPond = 0;
    let hasAny = false;
    for (const p of positions) {
      const q = quotes.get(p.ticker) ?? null;
      if (!q) {
        stale = true;
        continue;
      }
      hasAny = true;
      const valor = p.qty * q.price;
      patrimonio += valor;
      custoComQuote += p.qty * p.avgPrice;
      valorPond += valor;
      pctPond += valor * (q.changePct ?? 0);
    }
    if (!hasAny) return { patrimonio: null, plTotal: null, variacaoDiaPct: null, stale: true };
    const plTotal = patrimonio - custoComQuote;
    const variacaoDiaPct = valorPond > 0 ? pctPond / valorPond : 0;
    return { patrimonio, plTotal, variacaoDiaPct, stale };
  }

  private computeAllocation(positions: PositionWithQuote[], patrimonio: number | null) {
    if (!patrimonio || patrimonio <= 0) return [];
    const byClass = new Map<AssetClass, number>();
    for (const p of positions) {
      if (p.valor == null) continue;
      byClass.set(p.assetClass, (byClass.get(p.assetClass) ?? 0) + p.valor);
    }
    return Array.from(byClass.entries()).map(([assetClass, valor]) => ({
      assetClass,
      valor,
      pct: (valor / patrimonio) * 100,
    }));
  }
}
```

- [ ] **Step 4: Rodar testes**

```bash
cd apps/api && npx jest src/wallets/wallets.service.spec.ts
```

Expected: PASS (todos os cases de ownership, KPIs, conflict).

## Task 29: `WalletsController` + DTOs

**Files:**

- Create: `apps/api/src/wallets/wallets.controller.ts`
- Create: `apps/api/src/wallets/wallets.controller.spec.ts`
- Create: `apps/api/src/wallets/dto/create-wallet.dto.ts`
- Create: `apps/api/src/wallets/dto/update-wallet.dto.ts`
- Create: `apps/api/src/wallets/wallets.module.ts`

- [ ] **Step 1: DTOs**

`create-wallet.dto.ts`:

```typescript
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const STRATEGIES = ['balanceada', 'crescimento', 'renda', 'personalizada'] as const;
const CURRENCIES = ['BRL', 'USD', 'EUR'] as const;

export class CreateWalletDto {
  @IsString()
  @Length(2, 60)
  name!: string;

  @IsIn([...CURRENCIES])
  baseCurrency: (typeof CURRENCIES)[number] = 'BRL';

  @IsOptional()
  @IsIn([...STRATEGIES])
  strategy?: (typeof STRATEGIES)[number] | null = null;
}
```

`update-wallet.dto.ts`:

```typescript
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const STRATEGIES = ['balanceada', 'crescimento', 'renda', 'personalizada'] as const;

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @IsOptional()
  @IsIn([...STRATEGIES])
  strategy?: (typeof STRATEGIES)[number] | null;
}
```

- [ ] **Step 2: Controller**

```typescript
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

interface AuthedRequest {
  user: { id: string };
}

@Controller({ path: 'wallets', version: '1' })
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.wallets.list(req.user.id);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateWalletDto) {
    return this.wallets.create(req.user.id, {
      name: dto.name.trim(),
      baseCurrency: dto.baseCurrency,
      strategy: dto.strategy ?? null,
    });
  }

  @Get(':id')
  findOne(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.wallets.findOwned(req.user.id, id);
  }

  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateWalletDto) {
    return this.wallets.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.wallets.remove(req.user.id, id);
  }
}
```

- [ ] **Step 3: Module**

```typescript
import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [MarketModule],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService],
})
export class WalletsModule {}
```

- [ ] **Step 4: Controller spec — ownership 404 cross-user**

```typescript
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

describe('WalletsController', () => {
  let controller: WalletsController;
  let service: {
    list: jest.Mock;
    create: jest.Mock;
    findOwned: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      findOwned: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [{ provide: WalletsService, useValue: service }],
    }).compile();
    controller = mod.get(WalletsController);
  });

  it('list: passa userId do req', async () => {
    service.list.mockResolvedValueOnce([]);
    await controller.list({ user: { id: 'u1' } });
    expect(service.list).toHaveBeenCalledWith('u1');
  });

  it('findOne: propaga NotFoundException', async () => {
    service.findOwned.mockRejectedValueOnce(new NotFoundException());
    await expect(controller.findOne({ user: { id: 'u1' } }, 'w1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create: trim no name', async () => {
    service.create.mockResolvedValueOnce({});
    await controller.create({ user: { id: 'u1' } }, { name: '  Principal  ', baseCurrency: 'BRL' });
    expect(service.create).toHaveBeenCalledWith('u1', {
      name: 'Principal',
      baseCurrency: 'BRL',
      strategy: null,
    });
  });
});
```

- [ ] **Step 5: Registrar `WalletsModule` em `app.module.ts`**

Import + adicionar a `imports`.

- [ ] **Step 6: Rodar testes**

```bash
cd apps/api && npx jest src/wallets
```

Expected: PASS.

## Task 30: `PositionsService` + ownership cross-user

**Files:**

- Create: `apps/api/src/positions/positions.service.ts`
- Create: `apps/api/src/positions/positions.service.spec.ts`

- [ ] **Step 1: Escrever teste**

```typescript
import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { WalletsService } from '../wallets/wallets.service';
import { MarketService } from '../market/market.service';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = () => ({
  position: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  wallet: {
    findUnique: jest.fn(),
  },
});

describe('PositionsService', () => {
  let service: PositionsService;
  let prisma: ReturnType<typeof prismaMock>;
  let wallets: { findOwned: jest.Mock };
  let market: { validateTicker: jest.Mock };

  beforeEach(async () => {
    prisma = prismaMock();
    wallets = { findOwned: jest.fn() };
    market = { validateTicker: jest.fn() };
    const mod = await Test.createTestingModule({
      providers: [
        PositionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WalletsService, useValue: wallets },
        { provide: MarketService, useValue: market },
      ],
    }).compile();
    service = mod.get(PositionsService);
  });

  it('create: 404 quando wallet pertence a outro user', async () => {
    wallets.findOwned.mockRejectedValueOnce(new NotFoundException());
    await expect(
      service.create('user-a', 'wallet-de-outro', { ticker: 'PETR4', qty: 100, avgPrice: 30 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create: normaliza ticker UPPERCASE e infere assetClass', async () => {
    wallets.findOwned.mockResolvedValueOnce({ id: 'w1', userId: 'u' });
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'Petrobras',
    });
    prisma.position.create.mockResolvedValueOnce({
      id: 'p1',
      walletId: 'w1',
      ticker: 'PETR4',
      qty: 100,
      avgPrice: 30,
      assetClass: 'acoes_br',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await service.create('u', 'w1', { ticker: 'petr4', qty: 100, avgPrice: 30 });
    expect(result.ticker).toBe('PETR4');
    expect(prisma.position.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ticker: 'PETR4', assetClass: 'acoes_br' }),
      }),
    );
  });

  it('create: 409 quando ticker já existe na wallet', async () => {
    wallets.findOwned.mockResolvedValueOnce({ id: 'w1', userId: 'u' });
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'X',
    });
    const err: Error & { code?: string } = new Error('unique');
    err.code = 'P2002';
    prisma.position.create.mockRejectedValueOnce(err);
    await expect(
      service.create('u', 'w1', { ticker: 'PETR4', qty: 100, avgPrice: 30 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('update: 404 quando position pertence a wallet de outro user', async () => {
    prisma.position.findUnique.mockResolvedValueOnce({
      id: 'p1',
      walletId: 'w1',
      wallet: { userId: 'OUTRO' },
    });
    await expect(service.update('user-a', 'p1', { qty: 50 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update: preserva assetClass quando ticker não muda', async () => {
    prisma.position.findUnique.mockResolvedValueOnce({
      id: 'p1',
      walletId: 'w1',
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      wallet: { userId: 'u' },
    });
    prisma.position.update.mockResolvedValueOnce({
      id: 'p1',
      ticker: 'PETR4',
      qty: 200,
      avgPrice: 30,
      assetClass: 'acoes_br',
      walletId: 'w1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await service.update('u', 'p1', { qty: 200 });
    expect(prisma.position.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { qty: 200, avgPrice: undefined } }),
    );
    expect(market.validateTicker).not.toHaveBeenCalled();
  });

  it('remove: 404 cross-user', async () => {
    prisma.position.findUnique.mockResolvedValueOnce({
      id: 'p1',
      wallet: { userId: 'OUTRO' },
    });
    await expect(service.remove('user-a', 'p1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
```

- [ ] **Step 2: Implementar**

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { MarketService } from '../market/market.service';

interface CreateInput {
  ticker: string;
  qty: number;
  avgPrice: number;
}

interface UpdateInput {
  qty?: number;
  avgPrice?: number;
}

@Injectable()
export class PositionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletsService,
    private readonly market: MarketService,
  ) {}

  async create(userId: string, walletId: string, input: CreateInput) {
    await this.wallets.findOwned(userId, walletId); // 404 se cross-user
    const ticker = input.ticker.toUpperCase();
    const meta = await this.market.validateTicker(ticker); // 422 se inválido
    try {
      return await this.prisma.position.create({
        data: {
          walletId,
          ticker,
          qty: input.qty,
          avgPrice: input.avgPrice,
          assetClass: meta.assetClass,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Este ticker já está nesta carteira');
      }
      throw err;
    }
  }

  async update(userId: string, positionId: string, input: UpdateInput) {
    const existing = await this.prisma.position.findUnique({
      where: { id: positionId },
      include: { wallet: { select: { userId: true } } },
    });
    if (!existing || existing.wallet.userId !== userId) throw new NotFoundException();
    return this.prisma.position.update({
      where: { id: positionId },
      data: { qty: input.qty, avgPrice: input.avgPrice },
    });
  }

  async remove(userId: string, positionId: string): Promise<void> {
    const existing = await this.prisma.position.findUnique({
      where: { id: positionId },
      include: { wallet: { select: { userId: true } } },
    });
    if (!existing || existing.wallet.userId !== userId) throw new NotFoundException();
    await this.prisma.position.delete({ where: { id: positionId } });
  }
}
```

- [ ] **Step 3: Rodar testes**

```bash
cd apps/api && npx jest src/positions/positions.service.spec.ts
```

Expected: PASS (6 cases).

## Task 31: `PositionsController` + DTOs + module

**Files:**

- Create: `apps/api/src/positions/positions.controller.ts`
- Create: `apps/api/src/positions/positions.controller.spec.ts`
- Create: `apps/api/src/positions/dto/create-position.dto.ts`
- Create: `apps/api/src/positions/dto/update-position.dto.ts`
- Create: `apps/api/src/positions/positions.module.ts`

- [ ] **Step 1: DTOs**

`create-position.dto.ts`:

```typescript
import { Transform } from 'class-transformer';
import { IsNumber, IsString, Matches, Min } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{2,12}$/, { message: 'ticker inválido' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  ticker!: string;

  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.0000001)
  qty!: number;

  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.01)
  avgPrice!: number;
}
```

`update-position.dto.ts`:

```typescript
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.0000001)
  qty?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.01)
  avgPrice?: number;
}
```

- [ ] **Step 2: Controller**

```typescript
import { Body, Controller, Delete, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

interface AuthedRequest {
  user: { id: string };
}

@Controller({ version: '1' })
export class PositionsController {
  constructor(private readonly positions: PositionsService) {}

  @Post('wallets/:walletId/positions')
  create(
    @Req() req: AuthedRequest,
    @Param('walletId') walletId: string,
    @Body() dto: CreatePositionDto,
  ) {
    return this.positions.create(req.user.id, walletId, dto);
  }

  @Patch('positions/:id')
  update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.positions.update(req.user.id, id, dto);
  }

  @Delete('positions/:id')
  @HttpCode(204)
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.positions.remove(req.user.id, id);
  }
}
```

- [ ] **Step 3: Module**

```typescript
import { Module } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { WalletsModule } from '../wallets/wallets.module';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [WalletsModule, MarketModule],
  providers: [PositionsService],
  controllers: [PositionsController],
})
export class PositionsModule {}
```

- [ ] **Step 4: Spec rápido de controller**

```typescript
import { Test } from '@nestjs/testing';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

describe('PositionsController', () => {
  let controller: PositionsController;
  let service: { create: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = { create: jest.fn(), update: jest.fn(), remove: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [PositionsController],
      providers: [{ provide: PositionsService, useValue: service }],
    }).compile();
    controller = mod.get(PositionsController);
  });

  it('create delega ao service com userId/walletId/dto', async () => {
    service.create.mockResolvedValueOnce({ id: 'p1' });
    await controller.create({ user: { id: 'u' } }, 'w1', {
      ticker: 'PETR4',
      qty: 100,
      avgPrice: 30,
    });
    expect(service.create).toHaveBeenCalledWith('u', 'w1', {
      ticker: 'PETR4',
      qty: 100,
      avgPrice: 30,
    });
  });
});
```

- [ ] **Step 5: Registrar `PositionsModule` em `app.module.ts`**

- [ ] **Step 6: Rodar testes**

```bash
cd apps/api && npx jest src/positions
```

Expected: PASS.

## Task 32: Smoke manual com curl

> Validação manual antes do commit. Usa um JWT real obtido pelo flow F1a (signup + verify + login).

- [ ] **Step 1: Subir API**

```bash
npm run dev --workspace=@kainos/api
```

- [ ] **Step 2: Obter JWT (via session cookie ou debug endpoint da F1a)**

> Mais simples: usar `curl --cookie next-auth.session-token=…` após login no `apps/web`. Alternativa: chamar `POST /api/auth/callback/credentials` direto.

- [ ] **Step 3: Criar wallet**

```bash
curl -X POST http://localhost:3001/api/v1/wallets \
  -H 'Content-Type: application/json' \
  -H "Cookie: next-auth.session-token=$TOKEN" \
  -d '{"name":"Smoke","baseCurrency":"BRL","strategy":"balanceada"}'
```

Expected: 201 com `{ id, name: "Smoke", ... }`.

- [ ] **Step 4: Adicionar posição**

```bash
curl -X POST http://localhost:3001/api/v1/wallets/$WALLET_ID/positions \
  -H 'Content-Type: application/json' \
  -H "Cookie: next-auth.session-token=$TOKEN" \
  -d '{"ticker":"PETR4","qty":100,"avgPrice":30}'
```

Expected: 201 com `{ id, ticker: "PETR4", assetClass: "acoes_br", ... }`.

- [ ] **Step 5: Ver KPIs**

```bash
curl http://localhost:3001/api/v1/wallets/$WALLET_ID -H "Cookie: …"
```

Expected: JSON com `patrimonio > 0`, `positions[0].quote` numérico, `stale: false`, `allocationByClass[0].pct ≈ 100`.

## Task 33: Validação final + commit do Commit 3

- [ ] **Step 1: Gates completos**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Expected: verde.

- [ ] **Step 2: Coverage do backend (manual)**

```bash
cd apps/api && npx jest --coverage --collectCoverageFrom='src/wallets/**' --collectCoverageFrom='src/positions/**' --collectCoverageFrom='src/market/**'
```

Expected: `statements >= 70%` nos paths novos; guards/ownership 100%.

- [ ] **Step 3: Commit**

```bash
git add apps/api/ packages/shared-types/ apps/web/
git commit -m "feat(api): wallets + positions + market with KPIs

- Prisma migration f1b_domain: Wallet, Position, AssetAnalysis (additive)
- WalletsService.findOwned (única porta de ownership)
- WalletsService.computeKpis (patrimonio, plTotal, variacaoDiaPct, stale)
- PositionsService validates via WalletsService.findOwned + MarketService.validateTicker
- MarketService (yahoo-finance2) with LRU caches (quote 5min, ohlc 30min, search 1h)
- yahoo-symbol normalizer (.SA, -USD, BRL=X) + asset-class inference
- ThrottlerModule buckets: market (60/min/user), ai-analyst (20/24h/user)
- packages/shared-types: WalletSummary, WalletDetail, PositionWithQuote,
  MarketAsset, Quote, Candle, AssetAnalysisDto"
```

---

# Commit 4 — `feat(web): wallets/positions CRUD UI`

> UI dos flows de wallet (criar/editar/excluir) e position (adicionar/editar/excluir). Lista de carteiras com hero card + AddPositionSheet com TickerSearchInput. Wallet switcher passa a consumir API real.

## Task 34: Hooks de domínio para wallet/position

**Files:**

- Create: `apps/web/hooks/wallet/use-wallet-detail.ts`
- Create: `apps/web/hooks/wallet/use-mutate-wallet.ts`
- Create: `apps/web/hooks/wallet/use-mutate-position.ts`
- Create: `apps/web/hooks/market/use-ticker-search.ts`

- [ ] **Step 1: `use-wallet-detail.ts`**

```typescript
'use client';
import useSWR from 'swr';
import type { WalletDetail } from '@kainos/shared-types';

export function useWalletDetail(walletId: string | null) {
  return useSWR<WalletDetail>(walletId ? `/v1/wallets/${walletId}` : null);
}
```

- [ ] **Step 2: `use-mutate-wallet.ts`**

```typescript
'use client';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { swrFetcher } from '@/lib/swr-fetcher';
import type { WalletDetail, WalletSummary } from '@kainos/shared-types';

interface CreateInput {
  name: string;
  baseCurrency: 'BRL' | 'USD' | 'EUR';
  strategy: 'balanceada' | 'crescimento' | 'renda' | 'personalizada' | null;
}

interface UpdateInput {
  name?: string;
  strategy?: 'balanceada' | 'crescimento' | 'renda' | 'personalizada' | null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as T;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as T;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`/api${path}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok && res.status !== 204) throw await res.json();
}

export function useMutateWallet() {
  const { mutate } = useSWRConfig();
  const invalidate = () => mutate('/v1/wallets');

  const create = useCallback(
    async (input: CreateInput): Promise<WalletDetail> => {
      const result = await post<WalletDetail>('/v1/wallets', input);
      await invalidate();
      return result;
    },
    [mutate],
  );

  const update = useCallback(
    async (id: string, input: UpdateInput): Promise<WalletDetail> => {
      const result = await patch<WalletDetail>(`/v1/wallets/${id}`, input);
      await invalidate();
      await mutate(`/v1/wallets/${id}`);
      return result;
    },
    [mutate],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await del(`/v1/wallets/${id}`);
      await invalidate();
    },
    [mutate],
  );

  return { create, update, remove };
}
```

- [ ] **Step 3: `use-mutate-position.ts`**

```typescript
'use client';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type { PositionWithQuote } from '@kainos/shared-types';

interface CreateInput {
  ticker: string;
  qty: number;
  avgPrice: number;
}

interface UpdateInput {
  qty?: number;
  avgPrice?: number;
}

export function useMutatePosition() {
  const { mutate } = useSWRConfig();

  const create = useCallback(
    async (walletId: string, input: CreateInput) => {
      const res = await fetch(`/api/v1/wallets/${walletId}/positions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await res.json();
      const result = (await res.json()) as PositionWithQuote;
      await mutate('/v1/wallets');
      await mutate(`/v1/wallets/${walletId}`);
      return result;
    },
    [mutate],
  );

  const update = useCallback(
    async (walletId: string, positionId: string, input: UpdateInput) => {
      const res = await fetch(`/api/v1/positions/${positionId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await res.json();
      const result = (await res.json()) as PositionWithQuote;
      await mutate(`/v1/wallets/${walletId}`);
      return result;
    },
    [mutate],
  );

  const remove = useCallback(
    async (walletId: string, positionId: string) => {
      const res = await fetch(`/api/v1/positions/${positionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) throw await res.json();
      await mutate(`/v1/wallets/${walletId}`);
      await mutate('/v1/wallets');
    },
    [mutate],
  );

  return { create, update, remove };
}
```

- [ ] **Step 4: `use-ticker-search.ts` (debounce 350ms)**

```typescript
'use client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { MarketAsset } from '@kainos/shared-types';

export function useTickerSearch(query: string) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  return useSWR<MarketAsset[]>(
    debounced.trim().length >= 2
      ? `/v1/market/search?q=${encodeURIComponent(debounced.trim())}&limit=8`
      : null,
    { keepPreviousData: true },
  );
}
```

## Task 35: `FormField` + `TickerSearchInput` molecules

**Files:**

- Create: `apps/web/components/molecules/form-field.tsx`
- Create: `apps/web/components/molecules/ticker-search-input.tsx`
- Create: `apps/web/components/molecules/__tests__/ticker-search-input.test.tsx`

- [ ] **Step 1: `form-field.tsx`**

```tsx
'use client';
import { Label } from '@/components/atoms/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ id, label, error, hint, required, children }: Props) {
  const describedById = error || hint ? `${id}-desc` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive ml-1">*</span> : null}
      </Label>
      <div aria-describedby={describedById}>{children}</div>
      {error ? (
        <p id={`${id}-desc`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-desc`} className={cn('text-muted-foreground text-sm')}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Teste `ticker-search-input.test.tsx`**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TickerSearchInput } from '../ticker-search-input';

vi.mock('@/hooks/market/use-ticker-search', () => ({
  useTickerSearch: vi.fn(),
}));
import { useTickerSearch } from '@/hooks/market/use-ticker-search';

describe('TickerSearchInput', () => {
  it('mostra resultados após digitar e debounce', async () => {
    (useTickerSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [
        { ticker: 'PETR4', name: 'Petrobras PN', assetClass: 'acoes_br', exchange: 'SAO' },
        { ticker: 'PETR3', name: 'Petrobras ON', assetClass: 'acoes_br', exchange: 'SAO' },
      ],
      isLoading: false,
    });
    render(<TickerSearchInput value={null} onChange={() => {}} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PETR' } });
    await waitFor(() => expect(screen.getByText('PETR4')).toBeInTheDocument());
    expect(screen.getByText('PETR3')).toBeInTheDocument();
  });

  it('chama onChange ao selecionar', async () => {
    (useTickerSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [{ ticker: 'PETR4', name: 'Petrobras PN', assetClass: 'acoes_br', exchange: 'SAO' }],
      isLoading: false,
    });
    const onChange = vi.fn();
    render(<TickerSearchInput value={null} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PETR' } });
    const item = await screen.findByText('PETR4');
    fireEvent.click(item);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ticker: 'PETR4' }));
  });
});
```

- [ ] **Step 3: Implementar `ticker-search-input.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/atoms/ui/command';
import { useTickerSearch } from '@/hooks/market/use-ticker-search';
import type { MarketAsset } from '@kainos/shared-types';

interface Props {
  value: MarketAsset | null;
  onChange: (asset: MarketAsset) => void;
}

export function TickerSearchInput({ value, onChange }: Props) {
  const t = useTranslations('asset.search');
  const [query, setQuery] = useState(value?.ticker ?? '');
  const { data, isLoading } = useTickerSearch(query);

  return (
    <Command shouldFilter={false} className="rounded-md border">
      <CommandInput
        role="combobox"
        placeholder={t('placeholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading ? <CommandEmpty>{t('loading')}</CommandEmpty> : null}
        {!isLoading && (!data || data.length === 0) ? (
          <CommandEmpty>{t('empty')}</CommandEmpty>
        ) : null}
        {data && data.length > 0 ? (
          <CommandGroup>
            {data.map((asset) => (
              <CommandItem
                key={asset.ticker}
                value={asset.ticker}
                onSelect={() => {
                  onChange(asset);
                  setQuery(asset.ticker);
                }}
              >
                <span className="font-mono font-medium">{asset.ticker}</span>
                <span className="text-muted-foreground ml-2 truncate text-sm">{asset.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}
```

- [ ] **Step 4: i18n**

Em `pt-BR.json` adicionar `asset.search.placeholder`, `asset.search.loading`, `asset.search.empty`.

- [ ] **Step 5: Rodar testes**

```bash
cd apps/web && npx vitest run components/molecules/__tests__/ticker-search-input.test.tsx
```

Expected: PASS.

## Task 36: `CreateWalletDialog` + `EditWalletDialog`

**Files:**

- Create: `apps/web/components/organisms/wallet/create-wallet-dialog.tsx`
- Create: `apps/web/components/organisms/wallet/edit-wallet-dialog.tsx`
- Create: `apps/web/components/organisms/wallet/__tests__/create-wallet-dialog.test.tsx`

- [ ] **Step 1: Implementar `CreateWalletDialog`**

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveDialog } from '@/components/molecules/responsive-dialog';
import { FormField } from '@/components/molecules/form-field';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { useMutateWallet } from '@/hooks/wallet/use-mutate-wallet';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (walletId: string) => void;
}

const STRATEGIES = ['balanceada', 'crescimento', 'renda', 'personalizada'] as const;

export function CreateWalletDialog({ open, onOpenChange, onCreated }: Props) {
  const t = useTranslations('wallet.create');
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL');
  const [strategy, setStrategy] = useState<(typeof STRATEGIES)[number] | null>('balanceada');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { create } = useMutateWallet();

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const wallet = await create({ name, baseCurrency, strategy });
      onOpenChange(false);
      setName('');
      onCreated?.(wallet.id);
    } catch (err) {
      const body = err as { statusCode?: number; message?: string };
      setError(body.statusCode === 409 ? t('errors.duplicate') : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t('title')}>
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <FormField id="wallet-name" label={t('name.label')} required>
          <Input
            id="wallet-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={60}
            required
          />
        </FormField>
        <FormField id="wallet-currency" label={t('currency.label')}>
          <select
            id="wallet-currency"
            className="bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as 'BRL' | 'USD' | 'EUR')}
          >
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </FormField>
        <FormField id="wallet-strategy" label={t('strategy.label')}>
          <select
            id="wallet-strategy"
            className="bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={strategy ?? ''}
            onChange={(e) => setStrategy((e.target.value || null) as typeof strategy)}
          >
            <option value="">{t('strategy.none')}</option>
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>
                {t(`strategy.options.${s}`)}
              </option>
            ))}
          </select>
        </FormField>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={submitting || name.length < 2}>
            {t(submitting ? 'submitting' : 'submit')}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
```

- [ ] **Step 2: Implementar `EditWalletDialog`** seguindo a mesma estrutura, mas com props `wallet` e usando `update` em vez de `create`. (Substituir `useMutateWallet().create` por `.update(wallet.id, …)`.) Reusa `FormField`, `Input`, `select`.

- [ ] **Step 3: Teste de `CreateWalletDialog`**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateWalletDialog } from '../create-wallet-dialog';

vi.mock('@/hooks/wallet/use-mutate-wallet', () => ({
  useMutateWallet: () => ({ create: vi.fn().mockResolvedValue({ id: 'w-new' }) }),
}));
vi.mock('@/hooks/shared/use-media-query', () => ({ useMediaQuery: () => true }));

describe('CreateWalletDialog', () => {
  it('submete e chama onCreated com id', async () => {
    const onCreated = vi.fn();
    render(<CreateWalletDialog open onOpenChange={() => {}} onCreated={onCreated} />);
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Principal' } });
    fireEvent.click(screen.getByRole('button', { name: /criar|salvar/i }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('w-new'));
  });
});
```

> Adapte os matchers `/nome/i` e `/criar|salvar/i` ao texto pt-BR exato definido em `pt-BR.json` (Task 36 i18n).

- [ ] **Step 4: i18n para `wallet.create.*`**

```json
"wallet": {
  "create": {
    "title": "Nova carteira",
    "name": { "label": "Nome" },
    "currency": { "label": "Moeda base" },
    "strategy": {
      "label": "Estratégia",
      "none": "Sem estratégia",
      "options": {
        "balanceada": "Balanceada",
        "crescimento": "Crescimento",
        "renda": "Renda",
        "personalizada": "Personalizada"
      }
    },
    "cancel": "Cancelar",
    "submit": "Criar",
    "submitting": "Criando…",
    "errors": {
      "duplicate": "Você já tem uma carteira com esse nome",
      "generic": "Não foi possível criar agora"
    }
  }
}
```

Análogo para `wallet.edit.*` (título "Editar carteira", submit "Salvar").

- [ ] **Step 5: Rodar teste**

```bash
cd apps/web && npx vitest run components/organisms/wallet/__tests__/create-wallet-dialog.test.tsx
```

Expected: PASS.

## Task 37: `DeleteConfirmDialog` molecule + `DeleteWalletDialog`

**Files:**

- Create: `apps/web/components/molecules/delete-confirm-dialog.tsx`
- Create: `apps/web/components/organisms/wallet/delete-wallet-dialog.tsx`

- [ ] **Step 1: `delete-confirm-dialog.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveDialog } from './responsive-dialog';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { FormField } from './form-field';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  message: string;
  confirmText: string; // string que o usuário precisa digitar
  onConfirm: () => Promise<void> | void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmText,
  onConfirm,
}: Props) {
  const t = useTranslations('common');
  const [typed, setTyped] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const matches = typed.trim().toLowerCase() === confirmText.toLowerCase();

  async function handleConfirm(): Promise<void> {
    if (!matches) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
      setTyped('');
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={title}>
      <div className="space-y-4 pt-2">
        <p className="text-sm">{message}</p>
        <FormField id="confirm-text" label={t('typeToConfirm', { text: confirmText })}>
          <Input
            id="confirm-text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!matches || submitting}
            onClick={handleConfirm}
          >
            {t(submitting ? 'deleting' : 'delete')}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
```

- [ ] **Step 2: `delete-wallet-dialog.tsx` (wrapper)**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/components/molecules/delete-confirm-dialog';
import { useMutateWallet } from '@/hooks/wallet/use-mutate-wallet';
import { useRouter } from 'next/navigation';
import type { WalletSummary } from '@kainos/shared-types';

interface Props {
  wallet: WalletSummary;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function DeleteWalletDialog({ wallet, open, onOpenChange }: Props) {
  const t = useTranslations('wallet.delete');
  const { remove } = useMutateWallet();
  const router = useRouter();
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title', { name: wallet.name })}
      message={t('message', { count: wallet.positionsCount })}
      confirmText={wallet.name}
      onConfirm={async () => {
        await remove(wallet.id);
        router.push('/carteiras');
      }}
    />
  );
}
```

- [ ] **Step 3: i18n `wallet.delete.*` e `common.{cancel,delete,deleting,typeToConfirm}`**

```json
"common": {
  "cancel": "Cancelar",
  "delete": "Excluir",
  "deleting": "Excluindo…",
  "typeToConfirm": "Digite \"{text}\" para confirmar"
},
"wallet": {
  "delete": {
    "title": "Excluir \"{name}\"",
    "message": "{count, plural, =0 {Esta carteira está vazia.} one {Você vai apagar # posição com a carteira.} other {Você vai apagar # posições com a carteira.}} Esta ação é definitiva."
  }
}
```

## Task 38: `WalletCardLarge` + `WalletEmptyState` organism

**Files:**

- Create: `apps/web/components/organisms/wallet/wallet-card-large.tsx`
- Create: `apps/web/components/organisms/wallet/wallet-empty-state.tsx`

- [ ] **Step 1: `wallet-empty-state.tsx`**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';

interface Props {
  onCreate: () => void;
}

export function WalletEmptyState({ onCreate }: Props) {
  const t = useTranslations('wallet.list.empty');
  return (
    <div className="rounded-2xl border border-dashed p-12 text-center">
      <h2 className="font-serif text-2xl italic">{t('title')}</h2>
      <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      <Button onClick={onCreate} className="mt-6">
        <Plus className="mr-2 size-4" />
        {t('cta')}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: `wallet-card-large.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { Card } from '@/components/atoms/ui/card';
import type { WalletSummary } from '@kainos/shared-types';

interface Props {
  wallet: WalletSummary;
}

export function WalletCardLarge({ wallet }: Props) {
  const t = useTranslations('wallet.card');
  const fmt = useFormatter();

  function brl(v: number | null): string {
    if (v == null) return '—';
    return fmt.number(v, { style: 'currency', currency: wallet.baseCurrency });
  }

  return (
    <Link href={`/carteiras/${wallet.id}`}>
      <Card className="cursor-pointer rounded-2xl p-6 transition-shadow hover:shadow-md">
        <header className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">{wallet.name}</h3>
          {wallet.stale ? <span className="text-xs text-amber-600">{t('stale')}</span> : null}
        </header>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('patrimonio')}
            </p>
            <p className="font-serif text-2xl">{brl(wallet.patrimonio)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">{t('pl')}</p>
            <p className="font-serif text-2xl">{brl(wallet.plTotal)}</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-sm">
          {t('positions', { count: wallet.positionsCount })}
        </p>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: i18n `wallet.card.*` e `wallet.list.*`**

```json
"wallet": {
  "list": {
    "title": "Suas carteiras",
    "newCta": "Nova carteira",
    "empty": {
      "title": "Comece aqui",
      "subtitle": "Crie sua primeira carteira pra começar a acompanhar seus ativos.",
      "cta": "Criar carteira"
    }
  },
  "card": {
    "stale": "cotação indisponível",
    "patrimonio": "Patrimônio",
    "pl": "P&L total",
    "positions": "{count, plural, =0 {sem posições} one {# posição} other {# posições}}"
  }
}
```

## Task 39: `AddPositionSheet` + `EditPositionDialog`

**Files:**

- Create: `apps/web/components/organisms/wallet/add-position-sheet.tsx`
- Create: `apps/web/components/organisms/wallet/edit-position-dialog.tsx`

- [ ] **Step 1: `add-position-sheet.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveDialog } from '@/components/molecules/responsive-dialog';
import { FormField } from '@/components/molecules/form-field';
import { TickerSearchInput } from '@/components/molecules/ticker-search-input';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { useMutatePosition } from '@/hooks/wallet/use-mutate-position';
import type { MarketAsset } from '@kainos/shared-types';

interface Props {
  walletId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AddPositionSheet({ walletId, open, onOpenChange }: Props) {
  const t = useTranslations('position.add');
  const [asset, setAsset] = useState<MarketAsset | null>(null);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { create } = useMutatePosition();

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!asset) return;
    setSubmitting(true);
    setError(null);
    try {
      await create(walletId, { ticker: asset.ticker, qty: Number(qty), avgPrice: Number(price) });
      onOpenChange(false);
      setAsset(null);
      setQty('');
      setPrice('');
    } catch (err) {
      const body = err as { statusCode?: number };
      if (body.statusCode === 409) setError(t('errors.duplicate'));
      else if (body.statusCode === 422) setError(t('errors.invalidTicker'));
      else setError(t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t('title')}>
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <FormField id="ticker" label={t('ticker.label')} required>
          <TickerSearchInput value={asset} onChange={setAsset} />
        </FormField>
        <FormField id="qty" label={t('qty.label')} required>
          <Input
            id="qty"
            type="number"
            step="any"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
        </FormField>
        <FormField id="price" label={t('price.label')} required>
          <Input
            id="price"
            type="number"
            step="any"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </FormField>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={!asset || !qty || !price || submitting}>
            {t(submitting ? 'submitting' : 'submit')}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
```

- [ ] **Step 2: `edit-position-dialog.tsx`** — segue padrão, mas com `position` prop (`ticker` é readonly, só edita `qty`/`avgPrice`).

- [ ] **Step 3: i18n `position.add.*`**

```json
"position": {
  "add": {
    "title": "Adicionar posição",
    "ticker": { "label": "Ticker" },
    "qty": { "label": "Quantidade" },
    "price": { "label": "Preço médio" },
    "cancel": "Cancelar",
    "submit": "Adicionar",
    "submitting": "Adicionando…",
    "errors": {
      "duplicate": "Esta carteira já tem esse ticker",
      "invalidTicker": "Ticker não encontrado",
      "generic": "Não foi possível adicionar agora"
    }
  }
}
```

## Task 40: Page `(authed)/carteiras/page.tsx` — lista

**Files:**

- Create: `apps/web/app/(authed)/carteiras/page.tsx`

- [ ] **Step 1: Implementar**

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { useWalletSwitcher } from '@/components/providers/wallet-switcher-provider';
import { WalletCardLarge } from '@/components/organisms/wallet/wallet-card-large';
import { WalletEmptyState } from '@/components/organisms/wallet/wallet-empty-state';
import { CreateWalletDialog } from '@/components/organisms/wallet/create-wallet-dialog';

export default function CarteirasPage() {
  const t = useTranslations('wallet.list');
  const { wallets } = useWalletSwitcher();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="font-serif text-3xl italic">{t('title')}</h1>
        {wallets.length > 0 ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('newCta')}
          </Button>
        ) : null}
      </header>

      {wallets.length === 0 ? (
        <WalletEmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {wallets.map((w) => (
            <WalletCardLarge key={w.id} wallet={w} />
          ))}
        </div>
      )}

      <CreateWalletDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
```

- [ ] **Step 2: Smoke build**

```bash
npm run build --workspace=@kainos/web
```

Expected: PASS.

## Task 41: Page `(authed)/carteiras/[id]/page.tsx` — detalhe raw

**Files:**

- Create: `apps/web/app/(authed)/carteiras/[id]/page.tsx`

> Nesta task a página mostra hero + lista raw de posições. KPIs/donut/charts entram no Commit 5.

- [ ] **Step 1: Implementar**

```tsx
'use client';
import { use, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { useWalletDetail } from '@/hooks/wallet/use-wallet-detail';
import { AddPositionSheet } from '@/components/organisms/wallet/add-position-sheet';
import { EditWalletDialog } from '@/components/organisms/wallet/edit-wallet-dialog';
import { DeleteWalletDialog } from '@/components/organisms/wallet/delete-wallet-dialog';

export default function CarteiraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('carteira');
  const fmt = useFormatter();
  const { data, error, isLoading } = useWalletDetail(id);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  if (error?.statusCode === 404) return <p>{t('notFound')}</p>;
  if (isLoading || !data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">{t('eyebrow')}</p>
          <h1 className="font-serif text-3xl italic">{data.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('actions.addPosition')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            aria-label={t('actions.edit')}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDelOpen(true)}
            aria-label={t('actions.delete')}
          >
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          {t('positionsSection')}
        </h2>
        {data.positions.length === 0 ? (
          <p className="text-muted-foreground rounded-md border p-6 text-center text-sm">
            {t('noPositions')}
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {data.positions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <span className="font-mono font-medium">{p.ticker}</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {t('row.qty', { qty: p.qty })}
                  </span>
                </div>
                <div className="text-right text-sm">
                  <div>
                    {p.quote == null
                      ? '—'
                      : fmt.number(p.quote, { style: 'currency', currency: data.baseCurrency })}
                  </div>
                  {p.pl != null ? (
                    <div className={p.pl >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                      {fmt.number(p.pl, {
                        style: 'currency',
                        currency: data.baseCurrency,
                        signDisplay: 'always',
                      })}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddPositionSheet walletId={id} open={addOpen} onOpenChange={setAddOpen} />
      <EditWalletDialog wallet={data} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteWalletDialog wallet={data} open={delOpen} onOpenChange={setDelOpen} />
    </div>
  );
}
```

- [ ] **Step 2: i18n `carteira.*`**

```json
"carteira": {
  "eyebrow": "Carteira",
  "notFound": "Carteira não encontrada.",
  "positionsSection": "Posições",
  "noPositions": "Nenhuma posição ainda.",
  "actions": {
    "addPosition": "Adicionar posição",
    "edit": "Editar carteira",
    "delete": "Excluir carteira"
  },
  "row": {
    "qty": "{qty} unidade(s)"
  }
}
```

## Task 42: Validação + commit do Commit 4

- [ ] **Step 1: Gates completos**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

- [ ] **Step 2: Smoke manual**

Dev mode → login → criar carteira → adicionar PETR4 → ver na lista, no detalhe, e no WalletSwitcher.

- [ ] **Step 3: Commit**

```bash
git add apps/web/
git commit -m "feat(web): wallets/positions CRUD UI

- CreateWalletDialog, EditWalletDialog, DeleteWalletDialog
- AddPositionSheet with TickerSearchInput (cmdk + debounced /market/search)
- WalletCardLarge, WalletEmptyState
- Pages: /carteiras (list), /carteiras/[id] (detail raw, KPIs in next commit)
- Hooks: useWalletDetail, useMutateWallet, useMutatePosition, useTickerSearch
- Molecules: FormField, DeleteConfirmDialog
- i18n: wallet.create/edit/delete/list/card, position.add, asset.search, carteira, common"
```

---

# Commit 5 — `feat(web): dashboard KPI Grid + carteira detail`

> Pageamento real do `/dashboard` (KPIs + Evolução placeholder + Donut + Tabela + AI Insight placeholder + Watchlist placeholder) e enriquecimento de `/carteiras/[id]` com KPIs/alocação/tabela.

## Task 43: `KpiCard` molecule + `KpiGrid` organism

**Files:**

- Create: `apps/web/components/molecules/kpi-card.tsx`
- Create: `apps/web/components/organisms/wallet/kpi-grid.tsx`
- Create: `apps/web/components/organisms/wallet/__tests__/kpi-grid.test.tsx`

- [ ] **Step 1: `kpi-card.tsx`**

```tsx
'use client';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  caption?: string;
  tone?: 'neutral' | 'positive' | 'negative';
  stale?: boolean;
}

export function KpiCard({ label, value, caption, tone = 'neutral', stale }: Props) {
  return (
    <div className="bg-card rounded-2xl border p-6">
      <header className="text-muted-foreground flex items-center justify-between text-xs tracking-wide uppercase">
        <span>{label}</span>
        {stale ? (
          <AlertTriangle className="size-3.5 text-amber-600" aria-label="dados estados" />
        ) : null}
      </header>
      <p
        className={cn(
          'mt-2 font-serif text-3xl tabular-nums',
          tone === 'positive' && 'text-emerald-700',
          tone === 'negative' && 'text-destructive',
        )}
      >
        {value}
      </p>
      {caption ? (
        <p className="text-muted-foreground mt-1 text-sm tabular-nums">{caption}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Teste `kpi-grid.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiGrid } from '../kpi-grid';
import type { WalletDetail } from '@kainos/shared-types';

const baseWallet = {
  id: 'w1',
  name: 'X',
  baseCurrency: 'BRL',
  strategy: null,
  positionsCount: 2,
  createdAt: '',
  updatedAt: '',
  custoTotal: 5000,
  positions: [],
  allocationByClass: [],
} as unknown as WalletDetail;

describe('KpiGrid', () => {
  it('mostra "—" quando KPIs são null e marca stale', () => {
    render(
      <KpiGrid
        wallet={{
          ...baseWallet,
          patrimonio: null,
          plTotal: null,
          variacaoDiaPct: null,
          stale: true,
        }}
      />,
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('mostra valores formatados em BRL e tone positive para P&L > 0', () => {
    render(
      <KpiGrid
        wallet={{
          ...baseWallet,
          patrimonio: 6000,
          plTotal: 1000,
          variacaoDiaPct: 1.5,
          stale: false,
        }}
      />,
    );
    expect(screen.getByText(/R\$\s*6.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/\+1,50%/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Implementar `kpi-grid.tsx`**

```tsx
'use client';
import { useTranslations, useFormatter } from 'next-intl';
import { KpiCard } from '@/components/molecules/kpi-card';
import type { WalletDetail } from '@kainos/shared-types';

interface Props {
  wallet: WalletDetail;
}

export function KpiGrid({ wallet }: Props) {
  const t = useTranslations('wallet.kpi');
  const fmt = useFormatter();
  const cur = wallet.baseCurrency;

  function money(v: number | null): string {
    return v == null ? '—' : fmt.number(v, { style: 'currency', currency: cur });
  }
  function pct(v: number | null): string {
    return v == null
      ? '—'
      : fmt.number(v / 100, {
          style: 'percent',
          signDisplay: 'always',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }

  const plTone = wallet.plTotal == null ? 'neutral' : wallet.plTotal >= 0 ? 'positive' : 'negative';
  const varTone =
    wallet.variacaoDiaPct == null
      ? 'neutral'
      : wallet.variacaoDiaPct >= 0
        ? 'positive'
        : 'negative';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label={t('patrimonio')} value={money(wallet.patrimonio)} stale={wallet.stale} />
      <KpiCard
        label={t('plTotal')}
        value={money(wallet.plTotal)}
        caption={t('plCaption', {
          custo: fmt.number(wallet.custoTotal, { style: 'currency', currency: cur }),
        })}
        tone={plTone}
        stale={wallet.stale}
      />
      <KpiCard
        label={t('variacaoDia')}
        value={pct(wallet.variacaoDiaPct)}
        tone={varTone}
        stale={wallet.stale}
      />
      <KpiCard
        label={t('positionsCount')}
        value={String(wallet.positionsCount)}
        caption={t('positionsCaption', { count: wallet.positionsCount })}
      />
    </div>
  );
}
```

- [ ] **Step 4: i18n `wallet.kpi.*`**

```json
"wallet": {
  "kpi": {
    "patrimonio": "Patrimônio",
    "plTotal": "P&L total",
    "plCaption": "Custo {custo}",
    "variacaoDia": "Variação do dia",
    "positionsCount": "Posições",
    "positionsCaption": "{count, plural, =0 {Nenhuma posição} one {# ativo} other {# ativos}}"
  }
}
```

- [ ] **Step 5: Rodar testes**

```bash
cd apps/web && npx vitest run components/organisms/wallet/__tests__/kpi-grid.test.tsx
```

Expected: PASS.

## Task 44: `PositionRow` (desktop) + `PositionCard` (mobile) + `PositionsTable`

**Files:**

- Create: `apps/web/components/organisms/wallet/position-row.tsx`
- Create: `apps/web/components/organisms/wallet/position-card.tsx`
- Create: `apps/web/components/organisms/wallet/positions-table.tsx`
- Create: `apps/web/components/organisms/wallet/__tests__/positions-table.test.tsx`

- [ ] **Step 1: `position-row.tsx`** (table row para desktop, md+)

```tsx
'use client';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import type { PositionWithQuote, BaseCurrency } from '@kainos/shared-types';
import { cn } from '@/lib/utils';

interface Props {
  position: PositionWithQuote;
  baseCurrency: BaseCurrency;
}

export function PositionRow({ position: p, baseCurrency }: Props) {
  const fmt = useFormatter();
  const t = useTranslations('position.row');
  const money = (v: number | null): string =>
    v == null ? t('unavailable') : fmt.number(v, { style: 'currency', currency: baseCurrency });
  return (
    <tr className="hover:bg-accent/30 border-b last:border-0">
      <td className="px-3 py-3">
        <Link href={`/ativos/${p.ticker}`} className="font-mono font-medium hover:underline">
          {p.ticker}
        </Link>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">{p.qty}</td>
      <td className="px-3 py-3 text-right tabular-nums">{money(p.avgPrice)}</td>
      <td className="px-3 py-3 text-right tabular-nums">{money(p.quote)}</td>
      <td className="px-3 py-3 text-right tabular-nums">{money(p.valor)}</td>
      <td
        className={cn(
          'px-3 py-3 text-right tabular-nums',
          p.pl == null ? '' : p.pl >= 0 ? 'text-emerald-700' : 'text-destructive',
        )}
      >
        {p.pl == null
          ? '—'
          : fmt.number(p.pl, { style: 'currency', currency: baseCurrency, signDisplay: 'always' })}
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: `position-card.tsx`** (mobile)

```tsx
'use client';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import type { PositionWithQuote, BaseCurrency } from '@kainos/shared-types';
import { cn } from '@/lib/utils';

interface Props {
  position: PositionWithQuote;
  baseCurrency: BaseCurrency;
}

export function PositionCard({ position: p, baseCurrency }: Props) {
  const fmt = useFormatter();
  const t = useTranslations('position.card');
  const money = (v: number | null): string =>
    v == null ? t('unavailable') : fmt.number(v, { style: 'currency', currency: baseCurrency });
  return (
    <Link href={`/ativos/${p.ticker}`} className="hover:bg-accent/30 block rounded-xl border p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-base font-semibold">{p.ticker}</span>
        <span className="text-sm tabular-nums">{money(p.quote)}</span>
      </div>
      <div className="text-muted-foreground mt-2 flex items-baseline justify-between text-sm tabular-nums">
        <span>{t('qtyAvg', { qty: p.qty, avg: money(p.avgPrice) })}</span>
        <span
          className={cn(p.pl == null ? '' : p.pl >= 0 ? 'text-emerald-700' : 'text-destructive')}
        >
          {p.pl == null
            ? '—'
            : fmt.number(p.pl, {
                style: 'currency',
                currency: baseCurrency,
                signDisplay: 'always',
              })}
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: `positions-table.tsx`** (escolhe row/card por viewport)

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { useMediaQuery } from '@/hooks/shared/use-media-query';
import { Table, TableHead, TableBody, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { PositionRow } from './position-row';
import { PositionCard } from './position-card';
import type { WalletDetail } from '@kainos/shared-types';

interface Props {
  wallet: WalletDetail;
}

export function PositionsTable({ wallet }: Props) {
  const t = useTranslations('wallet.positions');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (wallet.positions.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border p-6 text-center text-sm">
        {t('empty')}
      </p>
    );
  }

  if (!isDesktop) {
    return (
      <div className="space-y-2">
        {wallet.positions.map((p) => (
          <PositionCard key={p.id} position={p} baseCurrency={wallet.baseCurrency} />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('ticker')}</TableHead>
          <TableHead className="text-right">{t('qty')}</TableHead>
          <TableHead className="text-right">{t('avgPrice')}</TableHead>
          <TableHead className="text-right">{t('quote')}</TableHead>
          <TableHead className="text-right">{t('valor')}</TableHead>
          <TableHead className="text-right">{t('pl')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {wallet.positions.map((p) => (
          <PositionRow key={p.id} position={p} baseCurrency={wallet.baseCurrency} />
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 4: Teste `positions-table.test.tsx`**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PositionsTable } from '../positions-table';
import type { WalletDetail } from '@kainos/shared-types';

vi.mock('@/hooks/shared/use-media-query', () => ({ useMediaQuery: vi.fn() }));
import { useMediaQuery } from '@/hooks/shared/use-media-query';

const wallet = {
  id: 'w1',
  name: 'X',
  baseCurrency: 'BRL',
  strategy: null,
  positionsCount: 1,
  patrimonio: 3000,
  plTotal: 300,
  variacaoDiaPct: 1,
  stale: false,
  createdAt: '',
  updatedAt: '',
  custoTotal: 2700,
  positions: [
    {
      id: 'p1',
      ticker: 'PETR4',
      qty: 100,
      avgPrice: 27,
      assetClass: 'acoes_br',
      quote: 30,
      changePct: 1,
      valor: 3000,
      pl: 300,
      plPct: 11,
      stale: false,
      lastUpdate: '',
    },
  ],
  allocationByClass: [],
} as unknown as WalletDetail;

describe('PositionsTable', () => {
  it('renderiza <table> em desktop', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true);
    render(<PositionsTable wallet={wallet} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
  it('renderiza cards em mobile', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(false);
    render(<PositionsTable wallet={wallet} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('PETR4')).toBeInTheDocument();
  });
  it('mostra "indisponível" quando quote é null sem quebrar', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const stale = {
      ...wallet,
      positions: [{ ...wallet.positions[0], quote: null, valor: null, pl: null }],
    };
    render(<PositionsTable wallet={stale} />);
    expect(screen.getAllByText(/indispon/i).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: i18n `wallet.positions.*`, `position.row.*`, `position.card.*`**

```json
"wallet": {
  "positions": {
    "empty": "Nenhuma posição ainda.",
    "ticker": "Ticker",
    "qty": "Qtd",
    "avgPrice": "Preço médio",
    "quote": "Cotação",
    "valor": "Valor",
    "pl": "P&L"
  }
},
"position": {
  "row": { "unavailable": "indisponível" },
  "card": {
    "unavailable": "indisponível",
    "qtyAvg": "{qty} × {avg}"
  }
}
```

- [ ] **Step 6: Rodar testes**

```bash
cd apps/web && npx vitest run components/organisms/wallet/__tests__/positions-table.test.tsx
```

Expected: PASS.

## Task 45: `AllocationDonut` + atom `Donut`

**Files:**

- Create: `apps/web/components/atoms/charts/donut.tsx`
- Create: `apps/web/components/organisms/wallet/allocation-donut.tsx`
- Create: `apps/web/components/organisms/wallet/__tests__/allocation-donut.test.tsx`

- [ ] **Step 1: `donut.tsx` (wrapper recharts)**

```tsx
'use client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Slice {
  key: string;
  value: number;
  color: string;
}

interface Props {
  data: Slice[];
  innerRadius?: number;
  outerRadius?: number;
}

export function Donut({ data, innerRadius = 56, outerRadius = 78 }: Props) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          stroke="hsl(var(--background))"
          strokeWidth={2}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: `allocation-donut.tsx` + paleta por assetClass**

```tsx
'use client';
import { useTranslations, useFormatter } from 'next-intl';
import { Donut } from '@/components/atoms/charts/donut';
import type { WalletDetail, AssetClass } from '@kainos/shared-types';

const COLORS: Record<AssetClass, string> = {
  acoes_br: '#1d4ed8',
  etf: '#0ea5e9',
  renda_fixa: '#65a30d',
  cripto: '#f59e0b',
  moeda: '#a3a3a3',
};

interface Props {
  wallet: WalletDetail;
}

export function AllocationDonut({ wallet }: Props) {
  const t = useTranslations('wallet.allocation');
  const fmt = useFormatter();
  if (wallet.allocationByClass.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border p-6 text-center text-sm">
        {t('empty')}
      </p>
    );
  }
  return (
    <div className="bg-card rounded-2xl border p-6">
      <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        {t('title')}
      </h3>
      <div className="mt-4 grid items-center gap-6 md:grid-cols-2">
        <Donut
          data={wallet.allocationByClass.map((a) => ({
            key: t(`classes.${a.assetClass}`),
            value: a.valor,
            color: COLORS[a.assetClass],
          }))}
        />
        <ul className="space-y-2 text-sm">
          {wallet.allocationByClass.map((a) => (
            <li key={a.assetClass} className="flex items-baseline justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: COLORS[a.assetClass] }}
                  aria-hidden
                />
                {t(`classes.${a.assetClass}`)}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {fmt.number(a.pct / 100, {
                  style: 'percent',
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Teste**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AllocationDonut } from '../allocation-donut';
import type { WalletDetail } from '@kainos/shared-types';

describe('AllocationDonut', () => {
  it('mostra empty state quando allocation vazia', () => {
    render(<AllocationDonut wallet={{ allocationByClass: [] } as unknown as WalletDetail} />);
    expect(screen.getByText(/sem dados de aloca/i)).toBeInTheDocument();
  });

  it('renderiza percentuais para cada classe', () => {
    const w = {
      allocationByClass: [
        { assetClass: 'acoes_br', valor: 3000, pct: 60 },
        { assetClass: 'cripto', valor: 2000, pct: 40 },
      ],
    } as unknown as WalletDetail;
    render(<AllocationDonut wallet={w} />);
    expect(screen.getByText('60,0%')).toBeInTheDocument();
    expect(screen.getByText('40,0%')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: i18n `wallet.allocation.*`**

```json
"wallet": {
  "allocation": {
    "title": "Alocação",
    "empty": "Sem dados de alocação ainda.",
    "classes": {
      "acoes_br": "Ações BR",
      "etf": "ETFs",
      "renda_fixa": "Renda fixa",
      "cripto": "Cripto",
      "moeda": "Moeda"
    }
  }
}
```

- [ ] **Step 5: Rodar testes**

```bash
cd apps/web && npx vitest run components/organisms/wallet/__tests__/allocation-donut.test.tsx
```

Expected: PASS.

## Task 46: `EvolutionPlaceholder` + `AiInsightPlaceholder` + `WatchlistPlaceholder`

**Files:**

- Create: `apps/web/components/atoms/charts/area-chart.tsx`
- Create: `apps/web/components/organisms/wallet/evolution-placeholder.tsx`
- Create: `apps/web/components/organisms/wallet/ai-insight-placeholder.tsx`
- Create: `apps/web/components/organisms/wallet/watchlist-placeholder.tsx`

- [ ] **Step 1: `area-chart.tsx`** (atom recharts vazio, usado só para placeholder editorial)

```tsx
'use client';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
  data: { x: string; y: number }[];
  color?: string;
}

export function AreaChartLite({ data, color = '#1d4ed8' }: Props) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data}>
        <Area dataKey="y" type="monotone" stroke={color} fill={color} fillOpacity={0.15} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: `evolution-placeholder.tsx`** (texto editorial pt-BR explicando F5)

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function EvolutionPlaceholder() {
  const t = useTranslations('dashboard.evolution');
  return (
    <div className="bg-card rounded-2xl border p-6">
      <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        {t('title')}
      </h3>
      <div className="mt-3 flex flex-col items-start gap-2">
        <p className="font-serif text-xl italic">{t('headline')}</p>
        <p className="text-muted-foreground text-sm">{t('body')}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `ai-insight-placeholder.tsx`** e `watchlist-placeholder.tsx`\*\* — mesma estrutura, namespaces `dashboard.aiInsight`, `dashboard.watchlist`.

- [ ] **Step 4: i18n `dashboard.*`** (parcial)

```json
"dashboard": {
  "title": "Visão geral",
  "evolution": {
    "title": "Evolução do patrimônio",
    "headline": "Em breve",
    "body": "Gráfico interativo de evolução chega quando movimentos forem registrados (F5)."
  },
  "aiInsight": {
    "title": "Insight do dia",
    "headline": "Em breve",
    "body": "Banner narrativo gerado por IA — chega após dois dias de histórico."
  },
  "watchlist": {
    "title": "Watchlist",
    "headline": "Em breve",
    "body": "Acompanhamento de ativos fora da carteira chega na F2."
  }
}
```

## Task 47: Página `/dashboard` real

**Files:**

- Modify: `apps/web/app/(authed)/dashboard/page.tsx`

- [ ] **Step 1: Implementar**

```tsx
'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWalletSwitcher } from '@/components/providers/wallet-switcher-provider';
import { useWalletDetail } from '@/hooks/wallet/use-wallet-detail';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { KpiGrid } from '@/components/organisms/wallet/kpi-grid';
import { PositionsTable } from '@/components/organisms/wallet/positions-table';
import { AllocationDonut } from '@/components/organisms/wallet/allocation-donut';
import { EvolutionPlaceholder } from '@/components/organisms/wallet/evolution-placeholder';
import { AiInsightPlaceholder } from '@/components/organisms/wallet/ai-insight-placeholder';
import { WatchlistPlaceholder } from '@/components/organisms/wallet/watchlist-placeholder';
import { WalletEmptyState } from '@/components/organisms/wallet/wallet-empty-state';
import { CreateWalletDialog } from '@/components/organisms/wallet/create-wallet-dialog';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { activeWallet, wallets } = useWalletSwitcher();
  const { data, isLoading } = useWalletDetail(activeWallet?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);

  // Auto-open create dialog na primeira visita quando zero wallets
  useEffect(() => {
    if (wallets.length === 0 && typeof window !== 'undefined') {
      const SEEN = 'porttion_first_wallet_dialog';
      if (!sessionStorage.getItem(SEEN)) {
        setCreateOpen(true);
        sessionStorage.setItem(SEEN, '1');
      }
    }
  }, [wallets.length]);

  if (wallets.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <WalletEmptyState onCreate={() => setCreateOpen(true)} />
        <CreateWalletDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    );
  }

  if (isLoading || !data) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-muted-foreground text-xs tracking-wide uppercase">{t('title')}</p>
        <h1 className="font-serif text-3xl italic">{data.name}</h1>
      </header>
      <KpiGrid wallet={data} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EvolutionPlaceholder />
        </div>
        <AllocationDonut wallet={data} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PositionsTable wallet={data} />
        </div>
        <AiInsightPlaceholder />
      </div>
      <WatchlistPlaceholder />
    </div>
  );
}
```

## Task 48: Enriquecer `/carteiras/[id]/page.tsx` com KPI/donut/tabela

**Files:**

- Modify: `apps/web/app/(authed)/carteiras/[id]/page.tsx`

- [ ] **Step 1: Substituir lista raw por KpiGrid + Allocation + PositionsTable**

Manter header, actions e dialogs. Substituir o `<section>` de "Posições" pela combinação `KpiGrid` → `EvolutionPlaceholder + AllocationDonut` → `PositionsTable`.

```tsx
{/* dentro do return, abaixo do header */}
<KpiGrid wallet={data} />
<div className="grid gap-4 lg:grid-cols-3">
  <div className="lg:col-span-2"><EvolutionPlaceholder /></div>
  <AllocationDonut wallet={data} />
</div>
<PositionsTable wallet={data} />
```

## Task 49: Validação + commit do Commit 5

- [ ] **Step 1: Gates completos**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

Expected: verde.

- [ ] **Step 2: Smoke manual**

Dev mode → dashboard mostra KPIs reais, donut, tabela. Mobile 390×844 mostra cards em vez de tabela. Zero wallets → `WalletEmptyState` + dialog auto-abre.

- [ ] **Step 3: Commit**

```bash
git add apps/web/
git commit -m "feat(web): dashboard KPI Grid + carteira detail with KPIs/donut/positions table

- KpiGrid (Patrimônio, P&L total, Variação dia, Posições count)
- PositionsTable (tabela md+ / cards <md) + PositionRow + PositionCard
- AllocationDonut (recharts wrapper) + Donut atom
- Editorial placeholders: Evolução (F5), AI Insight (futuro), Watchlist (F2)
- Dashboard page real (substitui placeholder F1a)
- Carteira detail enriquecida
- Empty-state auto-opens CreateWalletDialog on first visit (sessionStorage gate)
- i18n: dashboard.*, wallet.kpi/positions/allocation"
```

---

# Commit 6 — `feat(api): ai-analyst module + prompt v1 seed`

> Módulo backend que orquestra a análise IA do ativo. Validação Zod do payload, cache 1h, throttle 20/24h/user, fixtures em CI/dev.

## Task 50: Zod schema do payload `AssetAnalysis`

**Files:**

- Create: `apps/api/src/ai-analyst/asset-analysis.schema.ts`
- Create: `apps/api/src/ai-analyst/asset-analysis.schema.spec.ts`

- [ ] **Step 1: Escrever teste**

```typescript
import { assetAnalysisPayloadSchema } from './asset-analysis.schema';

describe('assetAnalysisPayloadSchema', () => {
  const valid = {
    tendencia: 'alta',
    recomendacao: 'comprar',
    confianca: 75,
    padroes: ['engolfo'],
    riscos: ['volatilidade'],
    sugestao: 'Considere posição reduzida.',
    justificativa: 'Padrão de continuação após suporte testado.',
    horizonte: '1-2 semanas',
  };

  it('aceita payload válido', () => {
    expect(() => assetAnalysisPayloadSchema.parse(valid)).not.toThrow();
  });

  it('rejeita recomendacao fora do enum', () => {
    expect(() => assetAnalysisPayloadSchema.parse({ ...valid, recomendacao: 'vender' })).toThrow();
  });

  it('rejeita confianca > 100', () => {
    expect(() => assetAnalysisPayloadSchema.parse({ ...valid, confianca: 120 })).toThrow();
  });

  it('rejeita padroes com mais de 4 itens', () => {
    expect(() =>
      assetAnalysisPayloadSchema.parse({ ...valid, padroes: ['a', 'b', 'c', 'd', 'e'] }),
    ).toThrow();
  });

  it('rejeita sugestao com mais de 280 chars', () => {
    expect(() =>
      assetAnalysisPayloadSchema.parse({ ...valid, sugestao: 'x'.repeat(281) }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Implementar**

```typescript
import { z } from 'zod';

export const assetAnalysisPayloadSchema = z.object({
  tendencia: z.enum(['alta', 'lateral', 'baixa']),
  recomendacao: z.enum(['comprar', 'manter', 'nao_comprar']),
  confianca: z.number().int().min(0).max(100),
  padroes: z.array(z.string().min(1).max(80)).max(4),
  riscos: z.array(z.string().min(1).max(120)).max(3),
  sugestao: z.string().min(1).max(280),
  justificativa: z.string().min(1).max(500),
  horizonte: z.string().min(1).max(40),
});

export type AssetAnalysisPayload = z.infer<typeof assetAnalysisPayloadSchema>;
```

- [ ] **Step 3: Rodar teste**

```bash
cd apps/api && npx jest src/ai-analyst/asset-analysis.schema.spec.ts
```

Expected: PASS (5 cases).

## Task 51: Prompt seed `asset.analysis.v1` em `apps/api/src/ai-analyst/prompts/asset-analysis-v1.ts`

**Files:**

- Create: `apps/api/src/ai-analyst/prompts/asset-analysis-v1.ts`

- [ ] **Step 1: Escrever prompt**

```typescript
// Conteúdo do prompt seedado em LlmConfig (key=asset.analysis.v1, version=1).
// Mantém system + user separados para o ai-runtime montar a chamada.
// Dynamic content é injetado pelo serviço dentro de marcadores <dados>.

export const ASSET_ANALYSIS_V1 = {
  model: 'gpt-4o-mini',
  params: { temperature: 0.2, maxTokens: 600 } as const,
  system: `Você é um analista técnico que olha 7 dias de candles e devolve JSON puro
segundo o schema. Proibido: indicar preço-alvo, garantir retorno, citar
notícia ou fundamento que não esteja nos dados. Cita só padrões clássicos
(engolfo, doji, MM21, suporte/resistência) derriváveis das velas. Resposta
DEVE estar entre marcadores <json>...</json>. Disclaimer não vai no JSON.

Schema esperado:
{
  "tendencia": "alta"|"lateral"|"baixa",
  "recomendacao": "comprar"|"manter"|"nao_comprar",
  "confianca": 0..100,
  "padroes": ["..."] (max 4),
  "riscos": ["..."] (max 3),
  "sugestao": "..." (max 280 chars),
  "justificativa": "..." (max 500 chars),
  "horizonte": "1-2 semanas" (ou similar)
}`,
  user: `<dados>
ticker: {{ticker}}
classe: {{assetClass}}
candles_recentes (mais antigo → mais recente):
{{candles_json}}
</dados>`,
} as const;
```

## Task 52: Seed do prompt em `prisma/seed.ts`

**Files:**

- Modify: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Atualizar seed**

Substituir o `main()` placeholder por:

```typescript
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
      prompt: JSON.stringify({ system: ASSET_ANALYSIS_V1.system, user: ASSET_ANALYSIS_V1.user }),
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
```

> Inspecionar shape de `LlmConfig` em F1a para garantir que prompt fica em uma única coluna texto. Se schema usa `{system, user}` separados, ajustar — o atual schema tem só `prompt: String @db.Text`, então serializar JSON é a abordagem mais simples. O `AiRuntimeService` parsea de volta antes de chamar OpenAI.

- [ ] **Step 2: Rodar seed em dev**

```bash
cd apps/api && npx prisma db seed
```

Expected: log `[seed] asset.analysis.v1 active=true`. Validar:

```bash
cd apps/api && npx prisma studio
# abrir tabela LlmConfig — deve ter linha key='asset.analysis.v1', version=1, active=true
```

## Task 53: `AiAnalystService` (cache lookup → validate → candles → generate → persist)

**Files:**

- Create: `apps/api/src/ai-analyst/ai-analyst.service.ts`
- Create: `apps/api/src/ai-analyst/ai-analyst.service.spec.ts`

- [ ] **Step 1: Escrever teste**

```typescript
import { Test } from '@nestjs/testing';
import { ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { AiAnalystService } from './ai-analyst.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { AiRuntimeService } from '../ai-runtime/ai-runtime.service';

const prismaMock = () => ({
  assetAnalysis: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
});

const marketMock = () => ({
  validateTicker: jest.fn(),
  ohlc: jest.fn(),
});

const runtimeMock = () => ({
  generateObject: jest.fn(),
});

describe('AiAnalystService', () => {
  let service: AiAnalystService;
  let prisma: ReturnType<typeof prismaMock>;
  let market: ReturnType<typeof marketMock>;
  let runtime: ReturnType<typeof runtimeMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    market = marketMock();
    runtime = runtimeMock();
    const mod = await Test.createTestingModule({
      providers: [
        AiAnalystService,
        { provide: PrismaService, useValue: prisma },
        { provide: MarketService, useValue: market },
        { provide: AiRuntimeService, useValue: runtime },
      ],
    }).compile();
    service = mod.get(AiAnalystService);
  });

  it('cache hit: devolve análise existente sem chamar LLM', async () => {
    const cached = {
      ticker: 'PETR4',
      windowDays: 7,
      payload: {
        tendencia: 'alta',
        recomendacao: 'comprar',
        confianca: 70,
        padroes: [],
        riscos: [],
        sugestao: 's',
        justificativa: 'j',
        horizonte: '1-2 semanas',
      },
      promptKey: 'asset.analysis.v1',
      promptVersion: 1,
      createdAt: new Date(),
    };
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(cached);
    const result = await service.analyze('u1', 'PETR4', 7);
    expect(result.cached).toBe(true);
    expect(runtime.generateObject).not.toHaveBeenCalled();
  });

  it('cache miss: valida ticker, busca candles, chama LLM, persiste', async () => {
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(null);
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'X',
    });
    market.ohlc.mockResolvedValueOnce(
      Array.from({ length: 30 }, (_, i) => ({
        date: `2026-04-${String(i + 1).padStart(2, '0')}`,
        open: 1,
        high: 1,
        low: 1,
        close: 1,
        volume: 0,
      })),
    );
    runtime.generateObject.mockResolvedValueOnce({
      data: {
        tendencia: 'alta',
        recomendacao: 'comprar',
        confianca: 65,
        padroes: [],
        riscos: [],
        sugestao: 's',
        justificativa: 'j',
        horizonte: '1-2 semanas',
      },
      promptKey: 'asset.analysis.v1',
      promptVersion: 1,
    });
    prisma.assetAnalysis.create.mockResolvedValueOnce({ id: 'a1' });

    const result = await service.analyze('u1', 'PETR4', 7);

    expect(market.validateTicker).toHaveBeenCalledWith('PETR4');
    expect(market.ohlc).toHaveBeenCalledWith('PETR4', '30d');
    expect(runtime.generateObject).toHaveBeenCalled();
    expect(prisma.assetAnalysis.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'u1', ticker: 'PETR4', windowDays: 7 }),
      }),
    );
    expect(result.cached).toBe(false);
  });

  it('ticker inválido: 422 sem chamar LLM', async () => {
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(null);
    market.validateTicker.mockRejectedValueOnce(new UnprocessableEntityException());
    await expect(service.analyze('u1', 'XPTO9', 7)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(runtime.generateObject).not.toHaveBeenCalled();
  });

  it('OHLC degradado (<7 candles): 503 sem chamar LLM', async () => {
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(null);
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'X',
    });
    market.ohlc.mockResolvedValueOnce([
      { date: '2026-04-01', open: 1, high: 1, low: 1, close: 1, volume: 0 },
    ]);
    await expect(service.analyze('u1', 'PETR4', 7)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(runtime.generateObject).not.toHaveBeenCalled();
  });

  it('TTL 1h respeitado: análise > 1h não conta como hit', async () => {
    // findFirst com filtro createdAt gte (now - 1h) já feito no service; aqui só verificamos o where:
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(null);
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'X',
    });
    market.ohlc.mockResolvedValueOnce(
      Array.from({ length: 10 }, () => ({
        date: '2026-04-01',
        open: 1,
        high: 1,
        low: 1,
        close: 1,
        volume: 0,
      })),
    );
    runtime.generateObject.mockResolvedValueOnce({
      data: {
        tendencia: 'alta',
        recomendacao: 'comprar',
        confianca: 65,
        padroes: [],
        riscos: [],
        sugestao: 's',
        justificativa: 'j',
        horizonte: '1-2 semanas',
      },
      promptKey: 'asset.analysis.v1',
      promptVersion: 1,
    });
    prisma.assetAnalysis.create.mockResolvedValueOnce({ id: 'a1' });

    await service.analyze('u1', 'PETR4', 7);
    expect(prisma.assetAnalysis.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u1',
          ticker: 'PETR4',
          windowDays: 7,
          createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      }),
    );
  });
});
```

- [ ] **Step 2: Implementar**

```typescript
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { AiRuntimeService } from '../ai-runtime/ai-runtime.service';
import { assetAnalysisPayloadSchema, type AssetAnalysisPayload } from './asset-analysis.schema';
import type { AssetAnalysisDto } from '@kainos/shared-types';

const CACHE_TTL_MS = 60 * 60 * 1000;
const PROMPT_KEY = 'asset.analysis.v1';

@Injectable()
export class AiAnalystService {
  private readonly logger = new Logger(AiAnalystService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly market: MarketService,
    private readonly runtime: AiRuntimeService,
  ) {}

  async analyze(userId: string, ticker: string, windowDays: 7): Promise<AssetAnalysisDto> {
    const t = ticker.toUpperCase();
    // 1. cache lookup
    const cached = await this.prisma.assetAnalysis.findFirst({
      where: {
        userId,
        ticker: t,
        windowDays,
        createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) {
      this.logger.log({ event: 'ai.analysis.cache_hit', userId, ticker: t });
      return this.toDto(cached, true);
    }

    // 2. validateTicker → 422 se inválido
    const meta = await this.market.validateTicker(t);

    // 3. candles (30d, slice last 7)
    const ohlc = await this.market.ohlc(t, '30d');
    const candles = ohlc.slice(-7);
    if (candles.length < 7) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Cotações insuficientes para análise',
      });
    }

    // 4-5. generateObject via ai-runtime
    let runtimeResult: { data: unknown; promptKey: string; promptVersion: number };
    try {
      runtimeResult = await this.runtime.generateObject({
        llmConfigKey: PROMPT_KEY,
        schema: assetAnalysisPayloadSchema,
        input: { ticker: t, assetClass: meta.assetClass, candles_json: JSON.stringify(candles) },
      });
    } catch (err) {
      this.logger.warn({
        event: 'ai.analysis.failed',
        userId,
        ticker: t,
        err: (err as Error).message,
      });
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Análise indisponível agora',
      });
    }

    const payload = assetAnalysisPayloadSchema.parse(runtimeResult.data);

    // 6. persist
    const record = await this.prisma.assetAnalysis.create({
      data: {
        userId,
        ticker: t,
        windowDays,
        payload: payload as object,
        promptKey: runtimeResult.promptKey,
        promptVersion: runtimeResult.promptVersion,
      },
    });

    this.logger.log({ event: 'ai.analysis.generated', userId, ticker: t });
    return this.toDto(record, false);
  }

  private toDto(
    record: {
      ticker: string;
      windowDays: number;
      payload: unknown;
      promptKey: string;
      promptVersion: number;
      createdAt: Date;
    },
    cached: boolean,
  ): AssetAnalysisDto {
    return {
      ticker: record.ticker,
      windowDays: record.windowDays,
      generatedAt: record.createdAt.toISOString(),
      promptKey: record.promptKey,
      promptVersion: record.promptVersion,
      cached,
      payload: record.payload as AssetAnalysisPayload,
    };
  }
}
```

> Confirmar a API real de `AiRuntimeService.generateObject` em F1a — ajustar argumentos se a assinatura existente diferir (e.g., `key/inputs/schema` em vez de `llmConfigKey/input/schema`).

- [ ] **Step 3: Rodar teste**

```bash
cd apps/api && npx jest src/ai-analyst/ai-analyst.service.spec.ts
```

Expected: PASS (5 cases).

## Task 54: DTO + Controller + Module

**Files:**

- Create: `apps/api/src/ai-analyst/dto/analyze-asset.dto.ts`
- Create: `apps/api/src/ai-analyst/ai-analyst.controller.ts`
- Create: `apps/api/src/ai-analyst/ai-analyst.controller.spec.ts`
- Create: `apps/api/src/ai-analyst/ai-analyst.module.ts`

- [ ] **Step 1: DTO**

```typescript
import { Transform } from 'class-transformer';
import { Equals, IsString, Matches } from 'class-validator';

export class AnalyzeAssetDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{2,12}$/)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  ticker!: string;

  // v1 só aceita literal 7 — preserva campo pra v2 ampliar (30 etc.) sem mudar contrato.
  @Equals(7)
  windowDays!: 7;
}
```

- [ ] **Step 2: Controller**

```typescript
import { Body, Controller, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiAnalystService } from './ai-analyst.service';
import { AnalyzeAssetDto } from './dto/analyze-asset.dto';

interface AuthedRequest {
  user: { id: string };
}

@Controller({ path: 'analyst', version: '1' })
export class AiAnalystController {
  constructor(private readonly analyst: AiAnalystService) {}

  @Post('asset')
  @Throttle({ 'ai-analyst': { limit: 20, ttl: 24 * 60 * 60 * 1000 } })
  analyze(@Req() req: AuthedRequest, @Body() dto: AnalyzeAssetDto) {
    return this.analyst.analyze(req.user.id, dto.ticker, dto.windowDays);
  }
}
```

- [ ] **Step 3: Module**

```typescript
import { Module } from '@nestjs/common';
import { AiAnalystController } from './ai-analyst.controller';
import { AiAnalystService } from './ai-analyst.service';
import { MarketModule } from '../market/market.module';
import { AiRuntimeModule } from '../ai-runtime/ai-runtime.module';

@Module({
  imports: [MarketModule, AiRuntimeModule],
  controllers: [AiAnalystController],
  providers: [AiAnalystService],
})
export class AiAnalystModule {}
```

- [ ] **Step 4: Controller spec (smoke)**

```typescript
import { Test } from '@nestjs/testing';
import { AiAnalystController } from './ai-analyst.controller';
import { AiAnalystService } from './ai-analyst.service';

describe('AiAnalystController', () => {
  let controller: AiAnalystController;
  let service: { analyze: jest.Mock };

  beforeEach(async () => {
    service = { analyze: jest.fn().mockResolvedValue({ ticker: 'PETR4' }) };
    const mod = await Test.createTestingModule({
      controllers: [AiAnalystController],
      providers: [{ provide: AiAnalystService, useValue: service }],
    }).compile();
    controller = mod.get(AiAnalystController);
  });

  it('delega ao service com userId e dto', async () => {
    await controller.analyze({ user: { id: 'u1' } }, { ticker: 'PETR4', windowDays: 7 });
    expect(service.analyze).toHaveBeenCalledWith('u1', 'PETR4', 7);
  });
});
```

- [ ] **Step 5: Registrar `AiAnalystModule` em `app.module.ts`** + import.

- [ ] **Step 6: Rodar testes**

```bash
cd apps/api && npx jest src/ai-analyst
```

Expected: PASS.

## Task 55: Validação + commit do Commit 6

- [ ] **Step 1: Gates completos**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

- [ ] **Step 2: Smoke manual com seed aplicado**

```bash
cd apps/api && npx prisma db seed
curl -X POST http://localhost:3001/api/v1/analyst/asset \
  -H 'Content-Type: application/json' \
  -H "Cookie: next-auth.session-token=$TOKEN" \
  -d '{"ticker":"PETR4","windowDays":7}'
```

Expected: 200 com JSON de payload válido (ou 503 se `OPENAI_API_KEY` ausente e `AI_RUNTIME_FIXTURE=false`). Segunda chamada dentro de 1h → `cached: true`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/
git commit -m "feat(api): ai-analyst module + asset.analysis.v1 prompt seed

- AiAnalystService: cache 1h, validateTicker → ohlc 30d → slice 7 → ai-runtime
- 503 explícito quando candles < 7 (não envia janela curta ao LLM)
- Zod schema rejeita tendencia/recomendacao/confianca/padroes/sugestao fora dos bounds
- POST /api/v1/analyst/asset (throttle 20/24h/user, DTO Equals(7))
- prisma seed: LlmConfig key=asset.analysis.v1 v1 active=true"
```

---

# Commit 7 — `feat(web): asset detail + candle chart + AI card`

> Detalhe `/ativos/[ticker]` com header, stats, candle chart próprio (SVG), tabs de período e `AIAnalysisCard` em 3 estados.

## Task 56: `CandleChart` atom (SVG próprio)

**Files:**

- Create: `apps/web/components/atoms/charts/candle-chart.tsx`
- Create: `apps/web/components/atoms/charts/__tests__/candle-chart.test.tsx`

- [ ] **Step 1: Escrever teste**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CandleChart } from '../candle-chart';
import type { Candle } from '@kainos/shared-types';

const candles: Candle[] = [
  { date: '2026-05-01', open: 10, high: 12, low: 9, close: 11, volume: 100 }, // verde
  { date: '2026-05-02', open: 11, high: 11.5, low: 8, close: 9, volume: 150 }, // vermelho
  { date: '2026-05-03', open: 9, high: 10, low: 8.5, close: 9.8, volume: 80 }, // verde
];

describe('CandleChart', () => {
  it('renderiza N rects (corpos) e N linhas (mecha) para N candles', () => {
    const { container } = render(<CandleChart candles={candles} />);
    const rects = container.querySelectorAll('rect[data-role="body"]');
    const wicks = container.querySelectorAll('line[data-role="wick"]');
    expect(rects).toHaveLength(3);
    expect(wicks).toHaveLength(3);
  });

  it('aplica cor verde para close>=open e vermelho para close<open', () => {
    const { container } = render(<CandleChart candles={candles} />);
    const rects = Array.from(container.querySelectorAll('rect[data-role="body"]'));
    expect(rects[0].getAttribute('fill')).toMatch(/(emerald|green)/i);
    expect(rects[1].getAttribute('fill')).toMatch(/(red|destructive|rose)/i);
    expect(rects[2].getAttribute('fill')).toMatch(/(emerald|green)/i);
  });

  it('possui role="img" com aria-label resumindo período', () => {
    render(<CandleChart candles={candles} />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label') ?? '').toMatch(/3 candles|2026-05-01.*2026-05-03/);
  });

  it('renderiza mensagem editorial quando candles vazio', () => {
    render(<CandleChart candles={[]} />);
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implementar**

```tsx
'use client';
import { useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Candle } from '@kainos/shared-types';

interface Props {
  candles: Candle[];
  width?: number;
  height?: number;
}

const GREEN = '#10b981'; // emerald-500
const RED = '#ef4444'; // red-500

export function CandleChart({ candles, width = 720, height = 320 }: Props) {
  const t = useTranslations('asset.chart');
  const id = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const scales = useMemo(() => {
    if (candles.length === 0) return null;
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const yMax = Math.max(...highs);
    const yMin = Math.min(...lows);
    const yPad = (yMax - yMin) * 0.05 || 1;
    const padding = { top: 16, right: 8, bottom: 56, left: 48 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const candleWidth = Math.max(2, (innerW / candles.length) * 0.7);
    const slot = innerW / candles.length;
    const xOf = (i: number): number => padding.left + slot * i + (slot - candleWidth) / 2;
    const yOf = (v: number): number =>
      padding.top + (1 - (v - (yMin - yPad)) / (yMax + yPad - (yMin - yPad))) * innerH;
    const volMax = Math.max(...candles.map((c) => c.volume), 1);
    const volH = 36;
    const volYOf = (v: number): number => height - padding.bottom + (1 - v / volMax) * volH;
    return {
      padding,
      innerW,
      innerH,
      candleWidth,
      slot,
      xOf,
      yOf,
      volYOf,
      yMin: yMin - yPad,
      yMax: yMax + yPad,
    };
  }, [candles, width, height]);

  if (candles.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border p-12 text-center text-sm">
        {t('empty')}
      </p>
    );
  }
  if (!scales) return null;

  const aria = `${candles.length} candles de ${candles[0].date} a ${candles[candles.length - 1].date}`;

  return (
    <div className="relative">
      <svg
        role="img"
        aria-label={aria}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        onPointerMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const xRel = ((e.clientX - rect.left) / rect.width) * width;
          const idx = Math.floor((xRel - scales.padding.left) / scales.slot);
          setHoverIndex(idx >= 0 && idx < candles.length ? idx : null);
        }}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {candles.map((c, i) => {
          const up = c.close >= c.open;
          const x = scales.xOf(i);
          const yHigh = scales.yOf(c.high);
          const yLow = scales.yOf(c.low);
          const yOpen = scales.yOf(c.open);
          const yClose = scales.yOf(c.close);
          const bodyY = Math.min(yOpen, yClose);
          const bodyH = Math.max(1, Math.abs(yClose - yOpen));
          const color = up ? GREEN : RED;
          return (
            <g key={c.date} data-index={i} tabIndex={0} aria-label={`${c.date} close ${c.close}`}>
              <line
                data-role="wick"
                x1={x + scales.candleWidth / 2}
                x2={x + scales.candleWidth / 2}
                y1={yHigh}
                y2={yLow}
                stroke={color}
                strokeWidth={1}
              />
              <rect
                data-role="body"
                x={x}
                y={bodyY}
                width={scales.candleWidth}
                height={bodyH}
                fill={color}
                opacity={up ? 0.95 : 0.95}
              />
              <rect
                data-role="vol"
                x={x}
                y={scales.volYOf(c.volume)}
                width={scales.candleWidth}
                height={height - scales.padding.bottom - scales.volYOf(c.volume)}
                fill={color}
                opacity={0.5}
              />
            </g>
          );
        })}
        {hoverIndex !== null ? (
          <line
            x1={scales.xOf(hoverIndex) + scales.candleWidth / 2}
            x2={scales.xOf(hoverIndex) + scales.candleWidth / 2}
            y1={scales.padding.top}
            y2={height - scales.padding.bottom}
            stroke="currentColor"
            strokeDasharray="2 2"
            opacity={0.3}
          />
        ) : null}
      </svg>
      {hoverIndex !== null ? (
        <div className="bg-popover pointer-events-none absolute top-2 left-2 rounded-md border px-3 py-2 text-xs shadow">
          <div className="font-mono">{candles[hoverIndex].date}</div>
          <div>O: {candles[hoverIndex].open}</div>
          <div>H: {candles[hoverIndex].high}</div>
          <div>L: {candles[hoverIndex].low}</div>
          <div>C: {candles[hoverIndex].close}</div>
        </div>
      ) : null}
    </div>
  );
}
```

> Long-press mobile + clamp Y na borda são tratados nas mesmas regras do `onPointerMove` (long-press: detector dedicado via `setTimeout(350)` em `onPointerDown` + cancel em `onPointerMove > 8px`). Para manter a Task focada, implementação inicial usa hover (desktop) e single-touch (mobile com toque arrastando). Refinements de UX vão para follow-up P1 se necessário após smoke.

- [ ] **Step 3: i18n `asset.chart.*`**

```json
"asset": {
  "chart": {
    "empty": "Sem dados de cotação para este período."
  }
}
```

- [ ] **Step 4: Rodar testes**

```bash
cd apps/web && npx vitest run components/atoms/charts/__tests__/candle-chart.test.tsx
```

Expected: PASS (4 cases).

## Task 57: `AssetIcon` atom + `Eyebrow` + `EditorialQuote` typography atoms

**Files:**

- Create: `apps/web/components/atoms/icons/asset-icon.tsx`
- Create: `apps/web/components/atoms/typography/eyebrow.tsx`
- Create: `apps/web/components/atoms/typography/editorial-quote.tsx`

- [ ] **Step 1: `eyebrow.tsx`**

```tsx
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">{children}</p>;
}
```

- [ ] **Step 2: `editorial-quote.tsx`**

```tsx
export function EditorialQuote({ children }: { children: React.ReactNode }) {
  return <p className="text-foreground/90 font-serif text-lg leading-snug italic">{children}</p>;
}
```

- [ ] **Step 3: `asset-icon.tsx`** (10 tickers conhecidos + fallback)

```tsx
import { cn } from '@/lib/utils';

const KNOWN_GRADIENTS: Record<string, string> = {
  PETR4: 'from-amber-500 to-rose-500',
  VALE3: 'from-emerald-500 to-cyan-500',
  ITUB4: 'from-orange-500 to-red-500',
  BBDC4: 'from-rose-500 to-fuchsia-500',
  BOVA11: 'from-blue-500 to-violet-500',
  IVVB11: 'from-sky-500 to-blue-700',
  BTC: 'from-amber-400 to-orange-600',
  ETH: 'from-indigo-500 to-violet-600',
  USD: 'from-emerald-600 to-teal-700',
  AAPL: 'from-zinc-500 to-zinc-800',
};

interface Props {
  ticker: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AssetIcon({ ticker, size = 'md' }: Props) {
  const grad = KNOWN_GRADIENTS[ticker.toUpperCase()] ?? 'from-slate-400 to-slate-700';
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-mono font-semibold text-white shadow-inner',
        `bg-gradient-to-br ${grad}`,
        size === 'sm' && 'size-7 text-[10px]',
        size === 'md' && 'size-10 text-xs',
        size === 'lg' && 'size-16 text-base',
      )}
      aria-hidden
    >
      {ticker.slice(0, 4)}
    </div>
  );
}
```

## Task 58: `OhlcTabs` + `StatBox` + `AiDisclaimer` molecules

**Files:**

- Create: `apps/web/components/molecules/ohlc-tabs.tsx`
- Create: `apps/web/components/molecules/stat-box.tsx`
- Create: `apps/web/components/molecules/ai-disclaimer.tsx`

- [ ] **Step 1: `ohlc-tabs.tsx`**

```tsx
'use client';
import { Tabs, TabsList, TabsTrigger } from '@/components/atoms/ui/tabs';
import type { OhlcPeriod } from '@kainos/shared-types';

const OPTIONS: OhlcPeriod[] = ['7d', '30d', '6m', '1a', '5a'];

interface Props {
  value: OhlcPeriod;
  onChange: (p: OhlcPeriod) => void;
}

export function OhlcTabs({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as OhlcPeriod)}>
      <TabsList>
        {OPTIONS.map((p) => (
          <TabsTrigger key={p} value={p}>
            {p}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
```

- [ ] **Step 2: `stat-box.tsx`**

```tsx
interface Props {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative';
}
import { cn } from '@/lib/utils';

export function StatBox({ label, value, tone = 'neutral' }: Props) {
  return (
    <div className="bg-card rounded-md border px-4 py-2">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-sm font-medium tabular-nums',
          tone === 'positive' && 'text-emerald-700',
          tone === 'negative' && 'text-destructive',
        )}
      >
        {value}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: `ai-disclaimer.tsx`**

```tsx
import { useTranslations } from 'next-intl';

export function AiDisclaimer({
  promptKey,
  promptVersion,
  generatedAt,
  model = 'gpt-4o-mini',
}: {
  promptKey: string;
  promptVersion: number;
  generatedAt: string;
  model?: string;
}) {
  const t = useTranslations('ai.analysis');
  return (
    <p className="text-muted-foreground mt-4 font-mono text-[11px]">
      {t('disclaimer')}
      <span className="mx-2">·</span>
      {model} · {promptKey} v{promptVersion} · {new Date(generatedAt).toLocaleString('pt-BR')}
    </p>
  );
}
```

## Task 59: `AIAnalysisCard` organism (3 estados)

**Files:**

- Create: `apps/web/components/organisms/ai-analyst/ai-analysis-card.tsx`
- Create: `apps/web/components/organisms/ai-analyst/__tests__/ai-analysis-card.test.tsx`

- [ ] **Step 1: Implementar**

```tsx
'use client';
import { Brain, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AssetAnalysisDto } from '@kainos/shared-types';
import { Button } from '@/components/atoms/ui/button';
import { Badge } from '@/components/atoms/ui/badge';
import { Separator } from '@/components/atoms/ui/separator';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { EditorialQuote } from '@/components/atoms/typography/editorial-quote';
import { AiDisclaimer } from '@/components/molecules/ai-disclaimer';

type State =
  | { status: 'empty'; onAnalyze: () => void }
  | { status: 'loading'; windowDays: number }
  | { status: 'done'; data: AssetAnalysisDto; onRefresh?: () => void }
  | { status: 'error'; message: string; onRetry: () => void };

interface Props {
  state: State;
}

export function AIAnalysisCard({ state }: Props) {
  const t = useTranslations('ai.analysis');
  return (
    <section className="bg-card rounded-2xl border p-6">
      <header className="flex items-center gap-2">
        <Brain className="text-primary size-5" aria-hidden />
        <h3 className="text-sm font-semibold tracking-wide uppercase">{t('title')}</h3>
      </header>

      {state.status === 'empty' ? (
        <div className="mt-4 space-y-3">
          <p className="text-muted-foreground text-sm">{t('empty.body')}</p>
          <Button onClick={state.onAnalyze}>{t('empty.cta')}</Button>
        </div>
      ) : null}

      {state.status === 'loading' ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <p className="text-muted-foreground text-sm">
            {t('loading.body', { days: state.windowDays })}
          </p>
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-4 space-y-3">
          <p className="text-destructive text-sm">{state.message}</p>
          <Button variant="outline" onClick={state.onRetry}>
            {t('error.retry')}
          </Button>
        </div>
      ) : null}

      {state.status === 'done' ? (
        <>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <Badge
              variant={
                state.data.payload.recomendacao === 'comprar'
                  ? 'success'
                  : state.data.payload.recomendacao === 'nao_comprar'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {t(`done.reco.${state.data.payload.recomendacao}`)}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {new Date(state.data.generatedAt).toLocaleString('pt-BR')}
            </span>
            {state.onRefresh ? (
              <Button variant="ghost" size="sm" onClick={state.onRefresh} className="ml-auto">
                <RefreshCcw className="mr-1 size-3.5" /> {t('done.refresh')}
              </Button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label={t('done.tendencia')} value={state.data.payload.tendencia} />
            <Stat label={t('done.confianca')} value={`${state.data.payload.confianca}%`} />
            <Stat label={t('done.horizonte')} value={state.data.payload.horizonte} />
          </div>

          <Separator className="my-4" />

          <EditorialQuote>{state.data.payload.justificativa}</EditorialQuote>

          {state.data.payload.padroes.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {state.data.payload.padroes.map((p) => (
                <Badge key={p} variant="outline">
                  {p}
                </Badge>
              ))}
            </div>
          ) : null}

          {state.data.payload.riscos.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.data.payload.riscos.map((r) => (
                <Badge key={r} variant="warning">
                  {r}
                </Badge>
              ))}
            </div>
          ) : null}

          <p className="mt-4 text-sm">{state.data.payload.sugestao}</p>

          <AiDisclaimer
            promptKey={state.data.promptKey}
            promptVersion={state.data.promptVersion}
            generatedAt={state.data.generatedAt}
          />
        </>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-md border px-3 py-2">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Teste — 3 estados**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIAnalysisCard } from '../ai-analysis-card';

describe('AIAnalysisCard', () => {
  it('empty: chama onAnalyze ao clicar', () => {
    const onAnalyze = vi.fn();
    render(<AIAnalysisCard state={{ status: 'empty', onAnalyze }} />);
    fireEvent.click(screen.getByRole('button', { name: /analisar/i }));
    expect(onAnalyze).toHaveBeenCalled();
  });

  it('loading: mostra skeleton + body com windowDays', () => {
    render(<AIAnalysisCard state={{ status: 'loading', windowDays: 7 }} />);
    expect(screen.getByText(/7/)).toBeInTheDocument();
  });

  it('done: justificativa em font-serif italic', () => {
    const data = {
      ticker: 'PETR4',
      windowDays: 7,
      generatedAt: '2026-05-20T00:00:00Z',
      promptKey: 'asset.analysis.v1',
      promptVersion: 1,
      cached: false,
      payload: {
        tendencia: 'alta',
        recomendacao: 'comprar',
        confianca: 70,
        padroes: ['engolfo'],
        riscos: ['vol'],
        sugestao: 's',
        justificativa: 'Padrão técnico identificado.',
        horizonte: '1-2 semanas',
      },
    } as const;
    const { container } = render(<AIAnalysisCard state={{ status: 'done', data }} />);
    const quote = screen.getByText('Padrão técnico identificado.');
    expect(quote).toHaveClass('font-serif');
    expect(quote).toHaveClass('italic');
    // badge comprar verde
    expect(screen.getByText(/comprar/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: i18n `ai.analysis.*`**

```json
"ai": {
  "analysis": {
    "title": "Análise técnica do ativo",
    "empty": {
      "body": "Gere uma análise técnica baseada nos últimos 7 dias de candles.",
      "cta": "Analisar agora"
    },
    "loading": {
      "body": "Lendo {days} dias de candles e gerando análise…"
    },
    "error": {
      "retry": "Tentar de novo"
    },
    "done": {
      "tendencia": "Tendência",
      "confianca": "Confiança",
      "horizonte": "Horizonte",
      "refresh": "Atualizar",
      "reco": {
        "comprar": "Comprar",
        "manter": "Manter",
        "nao_comprar": "Não comprar"
      }
    },
    "disclaimer": "Análise técnica gerada por IA. Não é recomendação de investimento.",
    "errors": {
      "ticker_invalid": "Ticker não encontrado",
      "candles_short": "Dados de cotação insuficientes para análise",
      "generic": "Análise indisponível agora — tente novamente em alguns minutos"
    }
  }
}
```

- [ ] **Step 4: Rodar testes**

```bash
cd apps/web && npx vitest run components/organisms/ai-analyst/__tests__/ai-analysis-card.test.tsx
```

Expected: PASS.

## Task 60: Hooks `use-ohlc`, `use-quote`, `use-asset-analysis`

**Files:**

- Create: `apps/web/hooks/market/use-ohlc.ts`
- Create: `apps/web/hooks/market/use-quote.ts`
- Create: `apps/web/hooks/ai-analyst/use-asset-analysis.ts`

- [ ] **Step 1: `use-ohlc.ts`**

```typescript
'use client';
import useSWR from 'swr';
import type { Candle, OhlcPeriod } from '@kainos/shared-types';

export function useOhlc(ticker: string | null, period: OhlcPeriod) {
  return useSWR<Candle[]>(ticker ? `/v1/market/ohlc/${ticker}?period=${period}` : null);
}
```

- [ ] **Step 2: `use-quote.ts`**

```typescript
'use client';
import useSWR from 'swr';
import type { Quote } from '@kainos/shared-types';

export function useQuote(ticker: string | null) {
  return useSWR<Quote & { stale?: boolean }>(ticker ? `/v1/market/quote/${ticker}` : null, {
    refreshInterval: 5 * 60_000,
  });
}
```

- [ ] **Step 3: `use-asset-analysis.ts`** (POST manual, não SWR — operação custosa intencional)

```typescript
'use client';
import { useCallback, useState } from 'react';
import type { AssetAnalysisDto } from '@kainos/shared-types';

interface ApiError {
  statusCode: number;
  message: string;
}

interface UseAssetAnalysis {
  data: AssetAnalysisDto | null;
  error: ApiError | null;
  isLoading: boolean;
  analyze: (ticker: string) => Promise<void>;
}

export function useAssetAnalysis(): UseAssetAnalysis {
  const [data, setData] = useState<AssetAnalysisDto | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = useCallback(async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/analyst/asset', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, windowDays: 7 }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as Partial<ApiError>;
        setError({ statusCode: res.status, message: body.message ?? 'unknown' });
        return;
      }
      setData((await res.json()) as AssetAnalysisDto);
    } catch (err) {
      setError({ statusCode: 0, message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, error, isLoading, analyze };
}
```

## Task 61: Page `/ativos/[ticker]/page.tsx` + organisms relacionados

**Files:**

- Create: `apps/web/components/organisms/asset/asset-header.tsx`
- Create: `apps/web/components/organisms/asset/stats-strip.tsx`
- Create: `apps/web/components/organisms/asset/candle-chart-section.tsx`
- Create: `apps/web/app/(authed)/ativos/[ticker]/page.tsx`

- [ ] **Step 1: `asset-header.tsx`**

```tsx
'use client';
import { useTranslations, useFormatter } from 'next-intl';
import { AssetIcon } from '@/components/atoms/icons/asset-icon';
import { Eyebrow } from '@/components/atoms/typography/eyebrow';
import { useQuote } from '@/hooks/market/use-quote';

interface Props {
  ticker: string;
  name?: string;
}

export function AssetHeader({ ticker, name }: Props) {
  const t = useTranslations('asset.header');
  const fmt = useFormatter();
  const { data, isLoading } = useQuote(ticker);
  return (
    <header className="flex flex-wrap items-end gap-4">
      <AssetIcon ticker={ticker} size="lg" />
      <div className="min-w-0">
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <h1 className="font-serif text-3xl italic">{name ?? ticker}</h1>
        <p className="text-muted-foreground font-mono text-sm">{ticker}</p>
      </div>
      <div className="ml-auto text-right">
        {isLoading || !data ? (
          <p className="text-muted-foreground text-sm">{t('loadingQuote')}</p>
        ) : (
          <>
            <p className="font-serif text-2xl tabular-nums">
              {fmt.number(data.price, { style: 'currency', currency: data.currency })}
            </p>
            <p
              className={
                data.changePct >= 0 ? 'text-sm text-emerald-700' : 'text-destructive text-sm'
              }
            >
              {fmt.number(data.changePct / 100, {
                style: 'percent',
                signDisplay: 'always',
                minimumFractionDigits: 2,
              })}
            </p>
          </>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: `stats-strip.tsx`** (4-6 `StatBox` baseados em quote/ohlc resumidos)

```tsx
'use client';
import { useTranslations, useFormatter } from 'next-intl';
import { StatBox } from '@/components/molecules/stat-box';
import type { Candle, Quote } from '@kainos/shared-types';

interface Props {
  quote: Quote | null;
  candles: Candle[];
}

export function StatsStrip({ quote, candles }: Props) {
  const t = useTranslations('asset.stats');
  const fmt = useFormatter();
  if (!quote || candles.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('unavailable')}</p>;
  }
  const last = candles[candles.length - 1];
  const high52 = Math.max(...candles.map((c) => c.high));
  const low52 = Math.min(...candles.map((c) => c.low));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <StatBox
        label={t('open')}
        value={fmt.number(last.open, { style: 'currency', currency: quote.currency })}
      />
      <StatBox
        label={t('high')}
        value={fmt.number(last.high, { style: 'currency', currency: quote.currency })}
      />
      <StatBox
        label={t('low')}
        value={fmt.number(last.low, { style: 'currency', currency: quote.currency })}
      />
      <StatBox
        label={t('high52')}
        value={fmt.number(high52, { style: 'currency', currency: quote.currency })}
      />
      <StatBox
        label={t('low52')}
        value={fmt.number(low52, { style: 'currency', currency: quote.currency })}
      />
    </div>
  );
}
```

- [ ] **Step 3: `candle-chart-section.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { CandleChart } from '@/components/atoms/charts/candle-chart';
import { OhlcTabs } from '@/components/molecules/ohlc-tabs';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { useOhlc } from '@/hooks/market/use-ohlc';
import type { OhlcPeriod } from '@kainos/shared-types';

interface Props {
  ticker: string;
  onCandlesLoaded?: (candles: import('@kainos/shared-types').Candle[]) => void;
}

export function CandleChartSection({ ticker, onCandlesLoaded }: Props) {
  const [period, setPeriod] = useState<OhlcPeriod>('30d');
  const { data, isLoading } = useOhlc(ticker, period);
  return (
    <section className="bg-card space-y-3 rounded-2xl border p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Cotação
        </h3>
        <OhlcTabs value={period} onChange={setPeriod} />
      </header>
      {isLoading ? <Skeleton className="h-72 w-full" /> : <CandleChart candles={data ?? []} />}
    </section>
  );
}
```

- [ ] **Step 4: Page**

```tsx
'use client';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { AssetHeader } from '@/components/organisms/asset/asset-header';
import { CandleChartSection } from '@/components/organisms/asset/candle-chart-section';
import { AIAnalysisCard } from '@/components/organisms/ai-analyst/ai-analysis-card';
import { useAssetAnalysis } from '@/hooks/ai-analyst/use-asset-analysis';

export default function AssetDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: raw } = use(params);
  const ticker = raw.toUpperCase();
  const t = useTranslations('ai.analysis.errors');
  const { data, error, isLoading, analyze } = useAssetAnalysis();

  const state: Parameters<typeof AIAnalysisCard>[0]['state'] = (() => {
    if (isLoading) return { status: 'loading', windowDays: 7 };
    if (error) {
      const message =
        error.statusCode === 422
          ? t('ticker_invalid')
          : error.statusCode === 503
            ? t('generic')
            : t('generic');
      return { status: 'error', message, onRetry: () => analyze(ticker) };
    }
    if (data) return { status: 'done', data, onRefresh: () => analyze(ticker) };
    return { status: 'empty', onAnalyze: () => analyze(ticker) };
  })();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AssetHeader ticker={ticker} />
      <CandleChartSection ticker={ticker} />
      <AIAnalysisCard state={state} />
    </div>
  );
}
```

- [ ] **Step 5: i18n `asset.header.*` + `asset.stats.*`**

```json
"asset": {
  "header": {
    "eyebrow": "Ativo",
    "loadingQuote": "Carregando cotação…"
  },
  "stats": {
    "open": "Abertura",
    "high": "Máx (dia)",
    "low": "Mín (dia)",
    "high52": "Máx período",
    "low52": "Mín período",
    "unavailable": "Estatísticas indisponíveis"
  }
}
```

## Task 62: Validação + commit do Commit 7

- [ ] **Step 1: Gates completos**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

- [ ] **Step 2: Smoke manual**

Dev → criar carteira → adicionar PETR4 → ir para `/ativos/PETR4` → ver header, candle chart, tabs 7d/30d/6m/1a/5a, AIAnalysisCard empty → clicar Analisar → loading → done. Em mobile, candle chart cabe sem scroll horizontal.

- [ ] **Step 3: Commit**

```bash
git add apps/web/
git commit -m "feat(web): asset detail + candle chart + AI analysis card

- CandleChart atom (SVG próprio, viewBox responsivo, hover tooltip)
- AssetIcon atom (10 tickers conhecidos + gradient fallback)
- Eyebrow, EditorialQuote typography atoms
- StatBox, OhlcTabs, AiDisclaimer molecules
- AssetHeader, StatsStrip, CandleChartSection organisms
- AIAnalysisCard organism (3 estados: empty, loading, done; + error fallback)
- Page /ativos/[ticker] composta
- Hooks: useOhlc, useQuote, useAssetAnalysis (POST manual, sem SWR)
- i18n: asset.header/stats/chart, ai.analysis.*"
```

---

# Commit 8 — `feat(web): landing real (9 sections) + settings + error pages`

> Landing real conforme UI doc §4.1. Settings com Conta + Idioma/Fuso. Páginas de erro globais (404 editorial, error boundaries).

## Task 63: Templates `public-shell`, `landing-shell`, `error-shell`

**Files:**

- Create: `apps/web/components/templates/public-shell.tsx`
- Create: `apps/web/components/templates/landing-shell.tsx`
- Create: `apps/web/components/templates/error-shell.tsx`

- [ ] **Step 1: `public-shell.tsx`** (slot puro para páginas públicas que não são a landing — login/signup já têm layout próprio em `(public)/layout.tsx` da F1a; este template fica disponível para configurações futuras)

```tsx
interface Props {
  children: React.ReactNode;
}

export function PublicShell({ children }: Props) {
  return <div className="bg-background min-h-screen">{children}</div>;
}
```

- [ ] **Step 2: `landing-shell.tsx`** (header + main + footer slots)

```tsx
interface Props {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function LandingShell({ header, footer, children }: Props) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
```

- [ ] **Step 3: `error-shell.tsx`** (página editorial centralizada)

```tsx
interface Props {
  eyebrow?: string;
  title: string;
  body?: string;
  actions?: React.ReactNode;
}

export function ErrorShell({ eyebrow, title, body, actions }: Props) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      {eyebrow ? (
        <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">{eyebrow}</p>
      ) : null}
      <h1 className="mt-3 font-serif text-4xl italic">{title}</h1>
      {body ? <p className="text-muted-foreground mt-4">{body}</p> : null}
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      ) : null}
    </main>
  );
}
```

## Task 64: `editorial-section-header` molecule + `landing-header` organism

**Files:**

- Create: `apps/web/components/molecules/editorial-section-header.tsx`
- Create: `apps/web/components/organisms/landing/landing-header.tsx`
- Create: `apps/web/components/organisms/landing/__tests__/landing-header.test.tsx`

- [ ] **Step 1: `editorial-section-header.tsx`**

```tsx
import { Eyebrow } from '@/components/atoms/typography/eyebrow';
import { cn } from '@/lib/utils';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function EditorialSectionHeader({ eyebrow, title, subtitle, align = 'center' }: Props) {
  return (
    <header className={cn('space-y-2', align === 'center' && 'text-center')}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="font-serif text-3xl italic md:text-4xl">{title}</h2>
      {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
```

- [ ] **Step 2: `landing-header.tsx`** (sticky com backdrop blur quando `scrollY > 8`)

```tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/atoms/icons/brand/logo';
import { Button } from '@/components/atoms/ui/button';
import { cn } from '@/lib/utils';

export function LandingHeader() {
  const t = useTranslations('landing.header');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors',
        scrolled ? 'bg-background/80 border-b backdrop-blur' : 'bg-transparent',
      )}
      data-scrolled={scrolled ? 'true' : 'false'}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold">Porttion</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <a
            href="#valor"
            className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm"
          >
            {t('nav.value')}
          </a>
          <a href="#como" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">
            {t('nav.how')}
          </a>
          <a href="#ia" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">
            {t('nav.ai')}
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">
            {t('nav.faq')}
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button asChild variant="ghost">
            <Link href="/login">{t('login')}</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">{t('signup')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Teste**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingHeader } from '../landing-header';

describe('LandingHeader', () => {
  it('aplica backdrop blur quando scrollY > 8', () => {
    const { container } = render(<LandingHeader />);
    const header = container.querySelector('header');
    expect(header?.getAttribute('data-scrolled')).toBe('false');
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
    fireEvent.scroll(window);
    expect(header?.getAttribute('data-scrolled')).toBe('true');
  });
});
```

- [ ] **Step 4: Rodar teste**

```bash
cd apps/web && npx vitest run components/organisms/landing/__tests__/landing-header.test.tsx
```

Expected: PASS.

## Task 65: 9 organisms da landing (`hero` + 7 seções + `footer`)

**Files:**

- Create: `apps/web/components/organisms/landing/hero-section.tsx`
- Create: `apps/web/components/organisms/landing/value-prop-section.tsx`
- Create: `apps/web/components/organisms/landing/how-it-works-section.tsx`
- Create: `apps/web/components/organisms/landing/ai-section.tsx`
- Create: `apps/web/components/organisms/landing/use-cases-section.tsx`
- Create: `apps/web/components/organisms/landing/testimonials-section.tsx`
- Create: `apps/web/components/organisms/landing/faq-section.tsx`
- Create: `apps/web/components/organisms/landing/closing-cta-section.tsx`
- Create: `apps/web/components/organisms/landing/landing-footer.tsx`

> Cada organism é uma seção independente. Todas as strings via `t('landing.<section>.*')`. Estrutura ilustrada abaixo. Conteúdo (cópia editorial) virá do UI doc §4.1 — copiar literal para `pt-BR.json`.

- [ ] **Step 1: `hero-section.tsx`**

```tsx
'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';

export function HeroSection() {
  const t = useTranslations('landing.hero');
  return (
    <section className="px-4 py-20 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-serif text-[clamp(2rem,8vw,3.5rem)] leading-[1.05]">
          {t.rich('headline', {
            italic: (chunks) => <span className="italic">{chunks}</span>,
          })}
        </h1>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">{t('subhead')}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">{t('cta.primary')}</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/login">{t('cta.secondary')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `value-prop-section.tsx`** — 3 cards (Privacidade, Sem promessa de retorno, Análise técnica útil).

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';

export function ValuePropSection() {
  const t = useTranslations('landing.value');
  const items = ['privacy', 'noPromises', 'tech'] as const;
  return (
    <section id="valor" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <EditorialSectionHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((k) => (
            <div key={k} className="bg-card rounded-2xl border p-6">
              <h3 className="font-serif text-xl italic">{t(`items.${k}.title`)}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{t(`items.${k}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `how-it-works-section.tsx`** — timeline 4 passos (criar carteira → adicionar ativos → ver KPIs → analisar com IA). Mesma estrutura: header + grid de cards.

- [ ] **Step 4: `ai-section.tsx`** — mock visual do AIAnalysisCard com payload fictício; explica disclaimer + versionamento + LGPD. Adicionar `dynamic(() => import('@/components/organisms/ai-analyst/ai-analysis-card'), { ssr: false })` se o card for renderizado client-side com fixtures.

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';
import { AIAnalysisCard } from '@/components/organisms/ai-analyst/ai-analysis-card';
import type { AssetAnalysisDto } from '@kainos/shared-types';

const PREVIEW: AssetAnalysisDto = {
  ticker: 'PETR4',
  windowDays: 7,
  generatedAt: new Date().toISOString(),
  promptKey: 'asset.analysis.v1',
  promptVersion: 1,
  cached: false,
  payload: {
    tendencia: 'lateral',
    recomendacao: 'manter',
    confianca: 62,
    padroes: ['Suporte testado', 'MM21 plana'],
    riscos: ['Volatilidade alta'],
    sugestao: 'Aguardar rompimento da máxima recente antes de aumentar exposição.',
    justificativa:
      'A vela mais recente confirma o respeito ao suporte de 30,5 testado três vezes nesta janela.',
    horizonte: '1-2 semanas',
  },
};

export function AiSection() {
  const t = useTranslations('landing.ai');
  return (
    <section id="ia" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl space-y-10">
        <EditorialSectionHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <AIAnalysisCard state={{ status: 'done', data: PREVIEW }} />
      </div>
    </section>
  );
}
```

- [ ] **Step 5: `use-cases-section.tsx`** — 3-4 personas (iniciante, intermediário, multi-carteira) com EditorialQuote. Estrutura: header + grid.

- [ ] **Step 6: `testimonials-section.tsx`** — 2-3 quotes (depoimentos placeholder pt-BR; marcar `landing.testimonials.placeholder = true` no `pt-BR.json` para revisores entenderem que conteúdo final será trocado antes do prod).

- [ ] **Step 7: `faq-section.tsx`** — usa `<Accordion>` shadcn com 5 perguntas (Como vocês usam meus dados? Vocês recomendam compra? Posso importar CSV? Tem versão paga? E em outras línguas?).

```tsx
'use client';
import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/atoms/ui/accordion';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';

const ITEMS = ['data', 'recommend', 'import', 'pricing', 'language'] as const;

export function FaqSection() {
  const t = useTranslations('landing.faq');
  return (
    <section id="faq" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <EditorialSectionHeader eyebrow={t('eyebrow')} title={t('title')} />
        <Accordion type="single" collapsible className="mt-8">
          {ITEMS.map((k) => (
            <AccordionItem key={k} value={k}>
              <AccordionTrigger>{t(`items.${k}.q`)}</AccordionTrigger>
              <AccordionContent>{t(`items.${k}.a`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: `closing-cta-section.tsx`** — bloco fechando: headline + 2 CTAs (signup + login).

- [ ] **Step 9: `landing-footer.tsx`** — links Termos, Privacidade, GitHub (placeholder), copyright Kainos. Estrutura simples sem assinatura.

- [ ] **Step 10: i18n `landing.*`** — adicionar TODO o conteúdo das 9 seções a `pt-BR.json` ANTES de rodar `i18n-check.ts`. Estrutura mínima:

```json
"landing": {
  "header": {
    "nav": { "value": "Valor", "how": "Como funciona", "ai": "IA", "faq": "FAQ" },
    "login": "Entrar",
    "signup": "Criar conta"
  },
  "hero": {
    "headline": "<italic>Acompanhe</italic> seus ativos sem prometer milagre.",
    "subhead": "Porttion é um diário inteligente de carteira. Você lança suas posições, a gente cuida das contas — e a IA fala só do que vê nos candles.",
    "cta": { "primary": "Criar conta grátis", "secondary": "Já tenho conta" }
  },
  "value": {
    "eyebrow": "Por quê",
    "title": "Decisões com base, não com fé",
    "subtitle": "Três decisões editoriais que diferenciam o Porttion.",
    "items": {
      "privacy": { "title": "Privacidade primeiro", "body": "Seus dados ficam no seu workspace. Sem ad-tech, sem revenda." },
      "noPromises": { "title": "Sem promessa de retorno", "body": "A IA nunca diz preço-alvo nem garante lucro. Disclaimer em todo card." },
      "tech": { "title": "Análise técnica, só técnica", "body": "Padrões clássicos derivados das velas — engolfo, doji, suporte, MM21." }
    }
  },
  "how": {
    "eyebrow": "Como funciona",
    "title": "Quatro passos, sem ritual",
    "steps": {
      "wallet": { "title": "Crie sua carteira", "body": "Defina nome, moeda base e estratégia." },
      "positions": { "title": "Adicione posições", "body": "Busca de ticker integrada — Yahoo é a fonte." },
      "kpis": { "title": "Veja os KPIs", "body": "Patrimônio, P&L e variação do dia — calculados no servidor." },
      "ai": { "title": "Analise com IA", "body": "7 dias de candles viram um cartão técnico em pt-BR." }
    }
  },
  "ai": {
    "eyebrow": "IA",
    "title": "Um analista técnico no seu bolso",
    "subtitle": "Versionado, com disclaimer e sem prompt injection — o que se espera de IA séria."
  },
  "useCases": {
    "eyebrow": "Para quem",
    "title": "Três cenários comuns",
    "items": {
      "beginner": { "title": "Comecei agora", "quote": "Não sei ler gráfico ainda — o card de IA me dá um vocabulário pra começar." },
      "intermediate": { "title": "Já uso planilha", "quote": "Tenho meu Excel, mas perco tempo atualizando cotação. Aqui é automático." },
      "multi": { "title": "Várias carteiras", "quote": "Separar Cripto, Renda Fixa e Ações em carteiras distintas resolve meu caos." }
    }
  },
  "testimonials": {
    "placeholder": true,
    "eyebrow": "O que dizem",
    "title": "Depoimentos",
    "items": {
      "one": { "quote": "O Porttion virou minha primeira aba toda manhã.", "author": "—" },
      "two": { "quote": "Finalmente uma ferramenta que não tenta me vender o próximo BBAS3.", "author": "—" }
    }
  },
  "faq": {
    "eyebrow": "FAQ",
    "title": "Perguntas honestas",
    "items": {
      "data": { "q": "Como vocês usam meus dados?", "a": "Ficam no seu workspace. Sem revenda, sem ad-tech, sem treino de modelo com seus dados." },
      "recommend": { "q": "Vocês recomendam compra?", "a": "Não. A IA só descreve o que está nas velas, com disclaimer obrigatório." },
      "import": { "q": "Posso importar CSV ou nota de corretora?", "a": "Vem na próxima fase (F6). Por enquanto, cadastro manual." },
      "pricing": { "q": "Tem versão paga?", "a": "Hoje é grátis no MVP. Eventual plano pago não vai cobrar pelo básico." },
      "language": { "q": "Em outras línguas?", "a": "pt-BR primeiro. en-US chega antes do plano comercial." }
    }
  },
  "closing": {
    "title": "Comece agora.",
    "subhead": "Leva 30 segundos pra criar a conta. Você decide o que faz da próxima vez que abrir.",
    "cta": { "primary": "Criar conta grátis", "secondary": "Entrar" }
  },
  "footer": {
    "copy": "© 2026 Porttion · feito pela Kainos Labs",
    "links": { "terms": "Termos", "privacy": "Privacidade", "github": "GitHub" }
  }
}
```

## Task 66: Page `(public)/page.tsx` — landing real

**Files:**

- Modify: `apps/web/app/(public)/page.tsx`

- [ ] **Step 1: Substituir placeholder F1a**

```tsx
import dynamic from 'next/dynamic';
import { LandingShell } from '@/components/templates/landing-shell';
import { LandingHeader } from '@/components/organisms/landing/landing-header';
import { LandingFooter } from '@/components/organisms/landing/landing-footer';
import { HeroSection } from '@/components/organisms/landing/hero-section';
import { ValuePropSection } from '@/components/organisms/landing/value-prop-section';
import { HowItWorksSection } from '@/components/organisms/landing/how-it-works-section';
import { AiSection } from '@/components/organisms/landing/ai-section';
import { ClosingCtaSection } from '@/components/organisms/landing/closing-cta-section';

// Lazy load das seções pesadas abaixo do fold
const UseCasesSection = dynamic(() =>
  import('@/components/organisms/landing/use-cases-section').then((m) => m.UseCasesSection),
);
const TestimonialsSection = dynamic(() =>
  import('@/components/organisms/landing/testimonials-section').then((m) => m.TestimonialsSection),
);
const FaqSection = dynamic(() =>
  import('@/components/organisms/landing/faq-section').then((m) => m.FaqSection),
);

export default function LandingPage() {
  return (
    <LandingShell header={<LandingHeader />} footer={<LandingFooter />}>
      <HeroSection />
      <ValuePropSection />
      <HowItWorksSection />
      <AiSection />
      <UseCasesSection />
      <TestimonialsSection />
      <FaqSection />
      <ClosingCtaSection />
    </LandingShell>
  );
}
```

- [ ] **Step 2: Smoke build**

```bash
npm run build --workspace=@kainos/web
```

Expected: PASS sem warnings de "missing key" do dynamic.

## Task 67: Settings — `account-section` + `locale-section` organisms + page

**Files:**

- Create: `apps/web/components/organisms/settings/account-section.tsx`
- Create: `apps/web/components/organisms/settings/locale-section.tsx`
- Create: `apps/web/app/(authed)/configuracoes/page.tsx`

- [ ] **Step 1: `account-section.tsx`** — read-only no MVP F1b (nome + email + avatar + logout)

```tsx
'use client';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/ui/avatar';
import { Button } from '@/components/atoms/ui/button';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';

export function AccountSection() {
  const { data: session } = useSession();
  const t = useTranslations('settings.account');
  if (!session?.user) return null;
  return (
    <section className="space-y-6">
      <EditorialSectionHeader eyebrow={t('eyebrow')} title={t('title')} align="left" />
      <div className="bg-card flex items-center gap-4 rounded-2xl border p-6">
        <Avatar className="size-14">
          {session.user.image ? <AvatarImage src={session.user.image} alt="" /> : null}
          <AvatarFallback>
            {(session.user.name ?? session.user.email ?? '?').slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{session.user.name ?? '—'}</p>
          <p className="text-muted-foreground text-sm">{session.user.email}</p>
        </div>
        <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
          {t('signOut')}
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `locale-section.tsx`** — read-only (pt-BR fixo) com nota explicativa de en-US no roadmap

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';

export function LocaleSection() {
  const t = useTranslations('settings.locale');
  return (
    <section className="space-y-6">
      <EditorialSectionHeader eyebrow={t('eyebrow')} title={t('title')} align="left" />
      <div className="bg-card rounded-2xl border p-6">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('language')}
            </dt>
            <dd className="mt-0.5 font-medium">pt-BR</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('timezone')}
            </dt>
            <dd className="mt-0.5 font-medium">America/Sao_Paulo</dd>
          </div>
        </dl>
        <p className="text-muted-foreground mt-3 text-sm">{t('note')}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Page**

```tsx
import { AccountSection } from '@/components/organisms/settings/account-section';
import { LocaleSection } from '@/components/organisms/settings/locale-section';

export default function ConfiguracoesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <AccountSection />
      <LocaleSection />
    </div>
  );
}
```

- [ ] **Step 4: i18n `settings.*`**

```json
"settings": {
  "account": {
    "eyebrow": "Conta",
    "title": "Sua identidade",
    "signOut": "Sair"
  },
  "locale": {
    "eyebrow": "Idioma e fuso",
    "title": "Preferências regionais",
    "language": "Idioma",
    "timezone": "Fuso horário",
    "note": "Suporte a en-US e fuso configurável chegam em fase futura. Por enquanto, pt-BR e America/Sao_Paulo são fixos."
  }
}
```

## Task 68: Páginas de erro globais

**Files:**

- Create: `apps/web/app/(authed)/error.tsx`
- Create: `apps/web/app/(authed)/loading.tsx`
- Create: `apps/web/app/(public)/error.tsx`
- Create: `apps/web/app/not-found.tsx`
- Create: `apps/web/app/error.tsx`

- [ ] **Step 1: `(authed)/error.tsx`**

```tsx
'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ErrorShell } from '@/components/templates/error-shell';
import { Button } from '@/components/atoms/ui/button';

export default function AuthedError({ reset }: { reset: () => void }) {
  const t = useTranslations('error.500');
  return (
    <ErrorShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      body={t('body')}
      actions={
        <>
          <Button onClick={reset}>{t('retry')}</Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">{t('dashboard')}</Link>
          </Button>
        </>
      }
    />
  );
}
```

- [ ] **Step 2: `(authed)/loading.tsx`** — skeleton do shell (similar a `Skeleton` em tamanho de página)

```tsx
import { Skeleton } from '@/components/atoms/ui/skeleton';

export default function AuthedLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
```

- [ ] **Step 3: `(public)/error.tsx`** — análogo ao authed, sem link para `/dashboard`

```tsx
'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ErrorShell } from '@/components/templates/error-shell';
import { Button } from '@/components/atoms/ui/button';

export default function PublicError({ reset }: { reset: () => void }) {
  const t = useTranslations('error.500');
  return (
    <ErrorShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      body={t('body')}
      actions={
        <>
          <Button onClick={reset}>{t('retry')}</Button>
          <Button asChild variant="ghost">
            <Link href="/">{t('home')}</Link>
          </Button>
        </>
      }
    />
  );
}
```

- [ ] **Step 4: `app/not-found.tsx`**

```tsx
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ErrorShell } from '@/components/templates/error-shell';
import { Button } from '@/components/atoms/ui/button';

export default function NotFound() {
  const t = useTranslations('error.404');
  return (
    <ErrorShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      body={t('body')}
      actions={
        <>
          <Button asChild>
            <Link href="/">{t('home')}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">{t('dashboard')}</Link>
          </Button>
        </>
      }
    />
  );
}
```

- [ ] **Step 5: `app/error.tsx`** (fallback total se layout authed quebrar)

```tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/atoms/ui/button';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html>
      <body>
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
          <h1 className="font-serif text-4xl italic">Algo deu errado</h1>
          <p className="text-muted-foreground mt-4">
            Você pode recarregar a página ou voltar pro início.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={reset}>Recarregar</Button>
            <Button asChild variant="ghost">
              <Link href="/">Início</Link>
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: i18n `error.*`**

```json
"error": {
  "404": {
    "eyebrow": "404",
    "title": "Página não encontrada",
    "body": "O caminho que você abriu não existe (ou ainda não).",
    "home": "Início",
    "dashboard": "Dashboard"
  },
  "500": {
    "eyebrow": "Erro",
    "title": "Algo deu errado por aqui",
    "body": "A culpa não é sua. Recarregue a página ou volte mais tarde.",
    "retry": "Tentar de novo",
    "home": "Início",
    "dashboard": "Dashboard"
  }
}
```

## Task 69: Validação i18n + commit do Commit 8

- [ ] **Step 1: Rodar i18n-check**

```bash
cd apps/web && npx tsx scripts/i18n-check.ts
```

Expected: PASS. Se faltar chave, adicionar e re-rodar.

- [ ] **Step 2: Gates completos**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

- [ ] **Step 3: Smoke manual**

`/` → landing 9 seções renderiza, header sticky com blur ao scrollar. `/configuracoes` → conta + locale. `/dashboard-existe-nao` → not-found editorial. Force `throw` em algum component (temporariamente, em dev) → `(authed)/error.tsx` mostra "Tentar de novo".

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat(web): landing real (9 sections) + settings + error pages

- LandingShell + LandingHeader (sticky w/ backdrop blur > 8px scroll) + LandingFooter
- 9 organisms: hero, value-prop, how-it-works, ai (with AIAnalysisCard preview),
  use-cases, testimonials, faq (Accordion), closing-cta, footer
- Below-fold sections lazy-loaded via dynamic imports
- Settings page (account read-only + locale info)
- ErrorShell template + (authed)/error.tsx + (authed)/loading.tsx
  + (public)/error.tsx + app/not-found.tsx + app/error.tsx
- i18n: landing.* (~80 chaves), settings.*, error.*"
```

---

# Commit 9 — `test(e2e): playwright vertical slice (mobile + desktop) + CI gates`

> E2E cobrindo o caminho dourado em duas viewports. CI ganha job `e2e` + `coverage-gate`. Fixtures Yahoo + AI evitam custo/instabilidade.

## Task 70: Helper `setup-test-user.ts` (seed do usuário verificado)

**Files:**

- Create: `apps/web/e2e/helpers/setup-test-user.ts`

- [ ] **Step 1: Implementar**

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const TEST_EMAIL = 'e2e@porttion.test';
const TEST_PASSWORD = 'e2e-secret-must-be-strong-1';

export async function setupTestUser(): Promise<{ email: string; password: string }> {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      create: {
        email: TEST_EMAIL,
        name: 'E2E User',
        passwordHash,
        emailVerifiedAt: new Date(),
        role: 'USER',
      },
      update: {
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
    return { email: TEST_EMAIL, password: TEST_PASSWORD };
  } finally {
    await prisma.$disconnect();
  }
}

export async function cleanupTestUser(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  } finally {
    await prisma.$disconnect();
  }
}
```

## Task 71: Fixtures Yahoo + AI

**Files:**

- Create: `apps/web/e2e/fixtures/yahoo.json`
- Create: `apps/web/e2e/fixtures/ai-analysis.json`

- [ ] **Step 1: `yahoo.json`** (search PETR + quote PETR4 + ohlc 7d/30d)

```json
{
  "search": {
    "PETR": {
      "quotes": [
        {
          "symbol": "PETR4.SA",
          "shortname": "Petrobras PN",
          "quoteType": "EQUITY",
          "exchange": "SAO"
        },
        {
          "symbol": "PETR3.SA",
          "shortname": "Petrobras ON",
          "quoteType": "EQUITY",
          "exchange": "SAO"
        }
      ]
    }
  },
  "quote": {
    "PETR4.SA": {
      "symbol": "PETR4.SA",
      "regularMarketPrice": 32.5,
      "regularMarketChangePercent": 1.2,
      "currency": "BRL",
      "regularMarketTime": "2026-05-20T18:00:00Z"
    }
  },
  "ohlc": {
    "PETR4.SA": [
      {
        "date": "2026-04-21",
        "open": 28.5,
        "high": 29.1,
        "low": 28.0,
        "close": 28.8,
        "volume": 1200000
      },
      {
        "date": "2026-04-22",
        "open": 28.8,
        "high": 29.5,
        "low": 28.6,
        "close": 29.4,
        "volume": 1300000
      },
      {
        "date": "2026-04-23",
        "open": 29.4,
        "high": 30.0,
        "low": 29.2,
        "close": 29.7,
        "volume": 1100000
      },
      {
        "date": "2026-04-24",
        "open": 29.7,
        "high": 30.5,
        "low": 29.5,
        "close": 30.3,
        "volume": 1500000
      },
      {
        "date": "2026-04-25",
        "open": 30.3,
        "high": 31.0,
        "low": 30.0,
        "close": 30.8,
        "volume": 1400000
      },
      {
        "date": "2026-04-28",
        "open": 30.8,
        "high": 31.5,
        "low": 30.6,
        "close": 31.2,
        "volume": 1600000
      },
      {
        "date": "2026-04-29",
        "open": 31.2,
        "high": 32.0,
        "low": 31.0,
        "close": 31.8,
        "volume": 1700000
      },
      {
        "date": "2026-04-30",
        "open": 31.8,
        "high": 32.5,
        "low": 31.5,
        "close": 32.0,
        "volume": 1800000
      },
      {
        "date": "2026-05-02",
        "open": 32.0,
        "high": 32.6,
        "low": 31.7,
        "close": 32.4,
        "volume": 1500000
      },
      {
        "date": "2026-05-05",
        "open": 32.4,
        "high": 33.0,
        "low": 32.2,
        "close": 32.7,
        "volume": 1400000
      },
      {
        "date": "2026-05-06",
        "open": 32.7,
        "high": 33.2,
        "low": 32.4,
        "close": 32.8,
        "volume": 1300000
      },
      {
        "date": "2026-05-07",
        "open": 32.8,
        "high": 33.5,
        "low": 32.6,
        "close": 33.1,
        "volume": 1600000
      },
      {
        "date": "2026-05-08",
        "open": 33.1,
        "high": 33.4,
        "low": 32.5,
        "close": 32.6,
        "volume": 1500000
      },
      {
        "date": "2026-05-09",
        "open": 32.6,
        "high": 33.0,
        "low": 32.0,
        "close": 32.3,
        "volume": 1450000
      },
      {
        "date": "2026-05-12",
        "open": 32.3,
        "high": 32.8,
        "low": 32.0,
        "close": 32.4,
        "volume": 1500000
      },
      {
        "date": "2026-05-13",
        "open": 32.4,
        "high": 33.0,
        "low": 32.2,
        "close": 32.7,
        "volume": 1500000
      },
      {
        "date": "2026-05-14",
        "open": 32.7,
        "high": 33.5,
        "low": 32.5,
        "close": 33.2,
        "volume": 1700000
      },
      {
        "date": "2026-05-15",
        "open": 33.2,
        "high": 33.8,
        "low": 33.0,
        "close": 33.5,
        "volume": 1800000
      },
      {
        "date": "2026-05-16",
        "open": 33.5,
        "high": 34.0,
        "low": 33.2,
        "close": 33.7,
        "volume": 1700000
      },
      {
        "date": "2026-05-19",
        "open": 33.7,
        "high": 34.2,
        "low": 33.5,
        "close": 34.0,
        "volume": 1900000
      },
      {
        "date": "2026-05-20",
        "open": 34.0,
        "high": 34.5,
        "low": 33.8,
        "close": 32.5,
        "volume": 2000000
      }
    ]
  }
}
```

- [ ] **Step 2: `ai-analysis.json`**

```json
{
  "PETR4": {
    "tendencia": "lateral",
    "recomendacao": "manter",
    "confianca": 62,
    "padroes": ["Suporte testado em 32.0", "Topo recente em 34.5", "MM21 plana"],
    "riscos": ["Volatilidade aumentando", "Volume abaixo da média de 30d"],
    "sugestao": "Aguarde rompimento da máxima recente antes de aumentar posição.",
    "justificativa": "A vela mais recente confirma o respeito ao suporte de 32.0 testado três vezes na janela. MM21 plana sugere indecisão; sem volume confirmando rompimento.",
    "horizonte": "1-2 semanas"
  }
}
```

## Task 72: E2E spec `f1b-vertical.spec.ts`

**Files:**

- Create: `apps/web/e2e/f1b-vertical.spec.ts`

- [ ] **Step 1: Implementar**

```typescript
import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestUser } from './helpers/setup-test-user';
import yahooFixtures from './fixtures/yahoo.json' assert { type: 'json' };
import aiFixtures from './fixtures/ai-analysis.json' assert { type: 'json' };

let creds: { email: string; password: string };

test.beforeAll(async () => {
  creds = await setupTestUser();
});

test.afterAll(async () => {
  await cleanupTestUser();
});

test.describe('F1b — vertical slice', () => {
  test.beforeEach(async ({ page, context }) => {
    // Intercepta chamadas de market do Nest (apenas em e2e — Nest fala com Yahoo direto;
    // aqui mockamos o endpoint do próprio Nest para deduplicar fixture management.)
    await context.route('**/api/v1/market/search**', async (route) => {
      const url = new URL(route.request().url());
      const q = url.searchParams.get('q') ?? '';
      const data = yahooFixtures.search[q as keyof typeof yahooFixtures.search] ?? { quotes: [] };
      const body = (data.quotes ?? []).map((it) => ({
        ticker: it.symbol.replace(/\.SA$/, ''),
        name: it.shortname,
        assetClass: 'acoes_br',
        exchange: it.exchange,
      }));
      await route.fulfill({ status: 200, body: JSON.stringify(body) });
    });
    await context.route('**/api/v1/market/quote/**', async (route) => {
      const ticker = route.request().url().split('/').pop()!;
      const sym = ticker + '.SA';
      const q = yahooFixtures.quote[sym as keyof typeof yahooFixtures.quote];
      if (!q)
        return route.fulfill({
          status: 200,
          body: JSON.stringify({ ticker, price: null, stale: true }),
        });
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          ticker,
          price: q.regularMarketPrice,
          changePct: q.regularMarketChangePercent,
          currency: q.currency,
          lastUpdate: q.regularMarketTime,
        }),
      });
    });
    await context.route('**/api/v1/market/ohlc/**', async (route) => {
      const ticker = route.request().url().split('/').pop()!.split('?')[0];
      const sym = ticker + '.SA';
      const data = yahooFixtures.ohlc[sym as keyof typeof yahooFixtures.ohlc] ?? [];
      await route.fulfill({ status: 200, body: JSON.stringify(data) });
    });
    await context.route('**/api/v1/analyst/asset', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}');
      const payload = aiFixtures[body.ticker as keyof typeof aiFixtures];
      if (!payload) return route.fulfill({ status: 422 });
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          ticker: body.ticker,
          windowDays: 7,
          generatedAt: new Date().toISOString(),
          promptKey: 'asset.analysis.v1',
          promptVersion: 1,
          cached: false,
          payload,
        }),
      });
    });
  });

  test('signup-already-done → login → create wallet → add position → dashboard → asset → analyze', async ({
    page,
  }) => {
    // 1. login
    await page.goto('/login');
    await page.getByLabel(/e.?mail/i).fill(creds.email);
    await page.getByLabel(/senha/i).fill(creds.password);
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. zero wallets → empty state
    await expect(page.getByText(/crie sua primeira carteira/i)).toBeVisible();

    // 3. create wallet
    await page
      .getByRole('button', { name: /criar carteira/i })
      .first()
      .click();
    await page.getByLabel(/nome/i).fill('Principal');
    await page.getByRole('button', { name: /^criar$/i }).click();

    // 4. add position
    const addBtn = page.getByRole('button', { name: /adicionar posi/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await page.getByPlaceholder(/buscar/i).fill('PETR');
    await page.getByText('PETR4').first().click();
    await page.getByLabel(/quantidade/i).fill('100');
    await page.getByLabel(/preço/i).fill('30');
    await page.getByRole('button', { name: /^adicionar$/i }).click();

    // 5. dashboard mostra KPIs
    await page.goto('/dashboard');
    await expect(page.getByText('Patrimônio')).toBeVisible();
    await expect(page.getByText(/R\$\s*3.250,00/)).toBeVisible();

    // 6. asset detail
    await page.getByText('PETR4').first().click();
    await expect(page).toHaveURL(/\/ativos\/PETR4/);
    await expect(page.getByRole('img', { name: /candles/i })).toBeVisible();

    // 7. analyze
    await page.getByRole('button', { name: /analisar/i }).click();
    await expect(page.getByText(/manter/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Suporte testado/)).toBeVisible();
    await expect(page.getByText(/análise técnica gerada por ia/i)).toBeVisible();

    // 8. volta dashboard via sidebar
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

- [ ] **Step 2: Atualizar `playwright.config.ts`**

Adicionar (ao lado do desktop existente):

```typescript
projects: [
  {
    name: 'chromium-desktop',
    use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
  },
  {
    name: 'iphone-13',
    use: { ...devices['iPhone 13'] },
  },
],
```

> Garantir que `webServer` inicia `next dev` + Nest. Em CI o webServer já roda via docker compose (db + redis up-front).

## Task 73: CI gate — job `e2e` + `coverage-gate`

**Files:**

- Modify: `.github/workflows/ci.yml`
- Create: `apps/api/scripts/check-coverage.ts`
- Create: `apps/api/coverage.config.json`

- [ ] **Step 1: `coverage.config.json`**

```json
{
  "thresholds": {
    "src/wallets/**": { "statements": 70 },
    "src/positions/**": { "statements": 70 },
    "src/market/**": { "statements": 70 },
    "src/ai-analyst/**": { "statements": 70 },
    "src/auth/guards/**": { "statements": 100 },
    "src/wallets/wallets.service.ts": { "statements": 100 }
  }
}
```

- [ ] **Step 2: `check-coverage.ts`**

```typescript
#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface Summary {
  [path: string]: { statements: { pct: number } };
}

const ROOT = resolve(__dirname, '..');
const summary = JSON.parse(
  readFileSync(resolve(ROOT, 'coverage/coverage-summary.json'), 'utf-8'),
) as Summary;
const config = JSON.parse(readFileSync(resolve(ROOT, 'coverage.config.json'), 'utf-8')) as {
  thresholds: Record<string, { statements: number }>;
};

const failures: string[] = [];
for (const [pattern, threshold] of Object.entries(config.thresholds)) {
  const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
  const matches = Object.entries(summary).filter(([k]) => regex.test(k) && k !== 'total');
  if (matches.length === 0) {
    failures.push(`${pattern}: nenhum arquivo casou`);
    continue;
  }
  for (const [file, sum] of matches) {
    if (sum.statements.pct < threshold.statements) {
      failures.push(`${file}: ${sum.statements.pct}% < ${threshold.statements}%`);
    }
  }
}
if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error('[coverage-gate] FAILED:\n' + failures.map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log('[coverage-gate] all thresholds met');
```

- [ ] **Step 3: Estender `.github/workflows/ci.yml`**

Adicionar ao job principal, após `Test`:

```yaml
- name: Coverage gate (API)
  run: |
    cd apps/api && npx jest --coverage --coverageReporters=json-summary
    npx tsx scripts/check-coverage.ts

- name: i18n check
  run: cd apps/web && npx tsx scripts/i18n-check.ts
```

E adicionar novo job:

```yaml
e2e:
  name: playwright e2e
  runs-on: ubuntu-latest
  timeout-minutes: 20
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_USER: kainos
        POSTGRES_PASSWORD: kainos
        POSTGRES_DB: kainos
      ports: ['5432:5432']
      options: >-
        --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    redis:
      image: redis:7
      ports: ['6379:6379']
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version-file: .nvmrc, cache: npm }
    - run: npm ci
    - name: Setup DB
      env:
        DATABASE_URL: postgresql://kainos:kainos@localhost:5432/kainos
      run: |
        cd apps/api && npx prisma migrate deploy && npx prisma db seed
    - name: Install Playwright browsers
      run: cd apps/web && npx playwright install --with-deps chromium
    - name: Run e2e (desktop + iPhone 13)
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://kainos:kainos@localhost:5432/kainos
        NEXTAUTH_SECRET: e2e-secret-must-be-at-least-32-chars-long
        INTERNAL_SERVICE_TOKEN: e2e-internal-token-must-be-at-least-32-chars
        STORAGE_URL_SECRET: e2e-storage-url-secret-must-be-at-least-32-chars
        VOLUME_ROOT: /tmp/ci-volume
        ALLOWED_ORIGINS: http://localhost:3000
        API_URL: http://localhost:3001
        AI_RUNTIME_FIXTURE: 'true'
        RESEND_API_KEY: re_test_key
        EMAIL_FROM: e2e@porttion.test
        APP_URL: http://localhost:3000
      run: cd apps/web && npx playwright test
    - name: Upload playwright report on failure
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: apps/web/playwright-report/
```

> Ajustar variáveis de env conforme env.schema atual da F1a — pareie 1:1 com o que `app.module.ts` exige.

## Task 74: Validação e2e local

- [ ] **Step 1: Rodar e2e local em desktop**

```bash
cd apps/web && npx playwright test --project=chromium-desktop
```

Expected: PASS.

- [ ] **Step 2: Rodar e2e local em iPhone 13**

```bash
cd apps/web && npx playwright test --project=iphone-13
```

Expected: PASS. Se mobile falhar em algum step (ex.: clique no menu mobile), abrir `--ui` e adaptar selectors.

- [ ] **Step 3: Coverage gate local**

```bash
cd apps/api && npx jest --coverage --coverageReporters=json-summary && npx tsx scripts/check-coverage.ts
```

Expected: `[coverage-gate] all thresholds met`.

## Task 75: Validação final + commit do Commit 9 + abertura da PR

- [ ] **Step 1: Re-rodar gates completos**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
cd apps/web && npx tsx scripts/i18n-check.ts
cd apps/web && npx playwright test
```

Expected: tudo verde.

- [ ] **Step 2: Commit**

```bash
git add apps/web/e2e/ apps/web/playwright.config.ts apps/api/scripts/ apps/api/coverage.config.json .github/workflows/ci.yml
git commit -m "test(e2e): playwright vertical slice (mobile + desktop) + CI gates

- f1b-vertical.spec.ts: login → empty state → create wallet → add PETR4
  → dashboard KPIs → asset detail → analyze → done
- Playwright projects: chromium-desktop (1440×900) + iphone-13 (390×844)
- Fixtures: yahoo.json (search/quote/ohlc PETR4) + ai-analysis.json
- setup-test-user.ts seeds verified e2e user
- CI: new job e2e (Postgres + Redis services + Playwright)
- CI: coverage-gate via check-coverage.ts (70% statements F1b paths,
  100% guards + WalletsService)
- CI: i18n-check step explicit"
```

- [ ] **Step 3: Push final + abrir PR**

```bash
git push origin feat/spec-01b-domain-and-ai
gh pr create --base staging --title "feat(F1b): domain + AI hero + landing + atomic design" --body "$(cat <<'EOF'
## Summary

Entrega a segunda metade da F1 (spec-00 §7.1, itens 1, 7-12):

- **Backend:** wallets + positions + market (yahoo-finance2) + ai-analyst com prompt versionado
- **Frontend autenticado:** shell + CRUD + dashboard KPIs + carteira detail + asset detail + AI card
- **Landing real:** 9 seções conforme UI doc §4.1
- **Refactor estrutural:** toda a base frontend migrada para Atomic Design (5 camadas)
- **Testes:** Jest + Vitest + Playwright (iPhone 13 + desktop 1440)
- **CI gates:** coverage 70% / 100% guards, i18n-check, e2e mobile + desktop

10 commits atômicos — recomendado revisar commit-by-commit.

Spec: docs/superpowers/specs/2026-05-21-spec-01b-domain-and-ai.md
Plan: docs/superpowers/plans/2026-05-21-spec-01b-domain-and-ai.md

## Test plan

- [ ] CI verde (lint + typecheck + build + test + coverage-gate + i18n-check + e2e mobile + e2e desktop)
- [ ] Smoke staging: signup → login → criar carteira → adicionar PETR4 → ver KPIs → analisar PETR4 (todos os passos do §7.4 do spec)
- [ ] Lighthouse mobile landing ≥ 90 (P1, não bloqueia)

## Follow-up (P1, não bloqueia merge)

- eslint-plugin-boundaries para enforce imports atomic
- Lighthouse threshold no CI quando estabilizar
- Métricas Prometheus (backlog template)
- Skeleton mais rico em loading.tsx
- Banner AI Insight com narrativa determinística
- Animações entre estados do AIAnalysisCard

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

> A PR exige `staging` como base, conforme CLAUDE.md §Fluxo de entrega. Squash and merge no final.

---

## Self-Review checklist (rodar pós-implementação, antes de pedir review)

Antes de marcar a PR como pronta para review, percorrer cada item:

- [ ] **CI verde em todos os jobs.** Lint, typecheck, build, test, coverage-gate, i18n-check, e2e desktop, e2e iPhone 13.
- [ ] **Sem `--no-verify` em nenhum commit** (CLAUDE.md §Restrições). Histórico via `git log --pretty=full`.
- [ ] **Sem PII em logs.** `git grep -nE 'logger\.(log|warn|error)' apps/api/src/wallets apps/api/src/positions apps/api/src/market apps/api/src/ai-analyst` — nenhum `email`, `ticker do user`, `payload do prompt` em log estruturado.
- [ ] **Sem hardcode de string visível.** `git grep -nE '<(button|h[1-6]|p|span|label)[^>]*>[^{<]' apps/web/components/organisms apps/web/components/molecules apps/web/components/templates` — qualquer texto fora de `{t(...)}` precisa de justificativa (ticker, símbolo de moeda, label mono — exceções documentadas em CLAUDE.md).
- [ ] **Ownership 100%:** todo endpoint que retorna recurso de usuário filtra por `userId`. Inspecionar `controllers/wallets`, `positions`, `ai-analyst`.
- [ ] **`@@unique` enforcement:** criar dois usuários, tentar cadastrar wallets com mesmo nome em cada → ambos sucedem (escopo é por user, não global).
- [ ] **Throttler:** rodar 21 chamadas ao `/analyst/asset` em sequência (script local) → última devolve 429.
- [ ] **i18n-check:** `cd apps/web && npx tsx scripts/i18n-check.ts` zero erros.
- [ ] **Atomic boundaries (manual):** `git grep -n "from '@/components/atoms" apps/web/components/atoms` — deve retornar apenas imports dentro de `atoms/` mesmo (atoms só podem importar atoms). Idem `molecules` não importa de `organisms`.

---

## Glossário rápido para o engenheiro

| Termo                 | Onde acessar                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| Active wallet         | `useActiveWallet()` ou `useWalletSwitcher().activeWallet`               |
| KPIs computados       | `WalletsService.findOwned` retorna `WalletDetail.patrimonio/...`        |
| Cache 1h da IA        | `prisma.assetAnalysis.findFirst({ where: { createdAt: { gte … }}})`     |
| Cache LRU de cotação  | `MarketService` privado — quote 5min, ohlc 30min, search 1h             |
| Anti-prompt-injection | User prompt sempre entre `<dados>...</dados>` no `asset-analysis-v1.ts` |
| Throttler buckets     | `default`, `auth-email` (F1a), `market`, `ai-analyst` em app.module     |
| Stale state           | `stale: true` quando ao menos uma quote falhou; UI mostra "—"           |

---

**Fim do plano F1b.** Após CI verde + smoke staging do §7.4 do spec, abrir release notes para `staging → main` (sem código novo, só anotações de risco e fluxos validados).
