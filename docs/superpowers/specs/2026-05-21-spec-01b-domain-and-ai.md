# Spec 01b — Domínio (wallets + positions + market) + Hero IA + Landing + Atomic Design

> Spec da segunda metade da F1. Estende o que foi entregue na F1a (foundation visual + auth completo) com tudo que falta para fechar o escopo da F1 descrito em `2026-05-20-spec-00-roadmap.md` §7. Termina em PR única contra `staging`.

- **Data:** 2026-05-21
- **Branch de trabalho:** `feat/spec-01b-domain-and-ai`
- **Alvo:** `staging` (squash and merge, conforme CLAUDE.md §Fluxo de entrega)
- **Pré-requisito:** F1a mergeada (auth email/senha + Resend + tema OpenClaw + i18n estruturado).

---

## 1. Escopo e definição de pronto

### 1.1 Goal

Entregar tudo que falta da F1 (spec-00 §7.1, itens 1, 7-12) em uma única PR, organizado em 5 checkpoints de produto + 1 refactor estrutural inicial.

### 1.2 Sequência aprovada

**Foundation autenticada → CRUD de domínio → Dashboards → Hero IA → Polish.**

Cada checkpoint termina com algo verificável (smoke manual) e CI verde.

### 1.3 Dentro do escopo

1. **Refactor estrutural:** migração de toda a base frontend (incluindo o código F1a) para **Atomic Design** (atoms / molecules / organisms / templates / pages). CLAUDE.md atualizado.
2. **Backend:** módulos `wallets`, `positions`, `market` (adapter `yahoo-finance2`), `ai-analyst` (consome `ai-runtime` com prompt versionado `asset.analysis.v1`).
3. **Frontend autenticado:** shell com sidebar + topbar + `WalletSwitcherProvider`; dashboard KPI Grid; lista e detalhe de carteiras; detalhe do ativo com `CandleChart` SVG próprio + `AIAnalysisCard` (3 estados); configurações (Conta + Idioma/Fuso); erros e loading globais.
4. **Frontend público:** landing real conforme UI doc §4.1 (9 seções).
5. **Testes:** unit (Jest/Vitest), e2e Playwright em mobile + desktop, gates de CI (lint, typecheck, build, i18n-check, coverage).
6. **Documentação:** CLAUDE.md (Atomic Design), spec-00 (backlog) e este spec.

### 1.4 Fora do escopo (vai para fases futuras)

- **F2:** Watchlist, relatório consolidado IA (MD/PDF).
- **F3:** Alocação editável (targets), variantes Tweaks, dashboard Editorial.
- **F4:** Chat IA no detalhe do ativo.
- **F5:** Movimentações, evolução temporal real do patrimônio.
- **F6:** Importação CSV/B3, seções Configurações restantes (Analista IA / Notificações / Zona perigosa).
- **Endpoint público `/ativos` (busca):** busca acontece só dentro do `AddPositionSheet` via `/market/search`.

### 1.5 Definição de pronto

Critérios 1-16 do spec-00 §7.2 verdes em CI + smoke manual em staging do fluxo `signup → login → criar carteira → adicionar posição → ver dashboard → analisar ativo` em iPhone 13 viewport e desktop 1440.

---

## 2. Modelo de domínio (Prisma)

Migração única `f1b_domain`. Aditiva — não toca `User`/`EmailToken` da F1a.

```prisma
model User {
  // (campos da F1a) ...
  wallets  Wallet[]
  analyses AssetAnalysis[]
}

model Wallet {
  id           String     @id @default(cuid())
  userId       String
  name         String                              // 2..60 chars
  baseCurrency String     @default("BRL")          // BRL | USD | EUR
  strategy     String?                             // balanceada | crescimento | renda | personalizada
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
  ticker     String                                 // UPPERCASE, sem .SA
  qty        Float                                  // > 0
  avgPrice   Float                                  // > 0
  assetClass String                                 // acoes_br | etf | renda_fixa | cripto | moeda
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
  windowDays    Int                                 // sempre 7 na v1 (campo preparado para 30 na v2)
  payload       Json
  promptKey     String
  promptVersion Int
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, ticker, createdAt])
}
```

### 2.1 Decisões deliberadas

- **`@@unique([userId, name])` em Wallet:** simplifica UX e desbloqueia slugs futuros. Conflito devolve 409 explícito.
- **`Float` para `qty`/`avgPrice`** (não `Decimal`): consistente com spec-00; KPI é display, não contábil. `Decimal` aparece em F5 quando aportes/movimentos exigirem soma exata.
- **`ticker` UPPERCASE no banco**, sufixo `.SA` aplicado **só** no `MarketService`. UI nunca exibe `.SA`. DTO normaliza com `@Transform(({ value }) => value.toUpperCase())`.
- **`assetClass` como string** (não enum Prisma): futuro F6 traz FII/BDR/criptos exóticas sem migration. Enum vive no DTO Zod.
- **`AssetAnalysis.userId` (não `walletId`):** análise é por ativo+usuário; cache reaproveitado entre wallets do mesmo user.
- **`onDelete: Cascade`** em tudo: enforcement LGPD (deletar `User` apaga toda cauda).

### 2.2 Ownership (enforcement em código)

Toda leitura/escrita filtra por `userId` ou faz JOIN via `wallet.userId`. Padrão:

- `WalletsService.findOwned(userId, walletId)` é o **único** acessor por id. Outros services pedem por ele.
- `PositionsService` valida ownership chamando `walletsService.findOwned` antes de qualquer mutação.
- `JwtAuthGuard` (já existe da F1a) + filtro explícito no `where`. **Sem decorator `@IsOwner` novo** — regra: filtro no `where` vence guard implícito.
- Acesso cross-user retorna **404** (não 403) para evitar enumeration.

### 2.3 Testes obrigatórios

- `wallets.service.spec`: 4 cases de ownership cross-user (find/list/update/delete).
- `positions.service.spec`: 3 cases (create/update/delete) em wallet de outro user.
- Coverage de guards/ownership = **100%** (gate de CI).

---

## 3. Contratos REST e KPIs

### 3.1 Endpoints (todos sob `/api/v1`, autenticados exceto onde marcado)

```
GET    /wallets                          → WalletSummary[]
POST   /wallets                          → WalletSummary
GET    /wallets/:id                      → WalletDetail
PATCH  /wallets/:id                      → WalletSummary
DELETE /wallets/:id                      → 204

POST   /wallets/:id/positions            → Position
PATCH  /positions/:id                    → Position
DELETE /positions/:id                    → 204

GET    /market/search?q=&limit=          → MarketAsset[]
GET    /market/quote/:ticker             → Quote
GET    /market/ohlc/:ticker?period=      → Candle[]            # 7d|30d|6m|1a|5a

POST   /analyst/asset                    → AssetAnalysisDto    # body: { ticker, windowDays: 7 } — DTO Zod restringe windowDays ao literal 7 na v1
```

### 3.2 Shapes compartilhados

Adicionados a `packages/shared-types/src/porttion.ts`:

```typescript
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

export interface WalletDetail extends WalletSummary {
  custoTotal: number;
  positions: PositionWithQuote[];
  allocationByClass: { assetClass: AssetClass; valor: number; pct: number }[];
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

export interface AssetAnalysisDto {
  ticker: string;
  windowDays: number;
  generatedAt: string;
  promptKey: string;
  promptVersion: number;
  cached: boolean;
  payload: {
    tendencia: 'alta' | 'lateral' | 'baixa';
    recomendacao: 'comprar' | 'manter' | 'nao_comprar';
    confianca: number; // 0..100
    padroes: string[]; // max 4
    riscos: string[]; // max 3
    sugestao: string; // max 280
    justificativa: string; // max 500
    horizonte: string; // "1-2 semanas"
  };
}
```

### 3.3 Cálculo de KPIs (server-side, `WalletsService.computeKpis`)

```
patrimonio    = Σ qty × quote                       (ignora posições com quote=null)
custo_total   = Σ qty × avgPrice                    (sempre completo)
pl_total      = patrimonio − Σ qty_com_quote × avgPrice
variacao_dia  = Σ (valor × changePct) / patrimonio  (média ponderada por valor atual)
stale         = ∃ posição com quote=null
```

- Se **todas** as quotes falharem: `patrimonio = null`, `plTotal = null`, `variacaoDiaPct = null`, `stale = true`. UI mostra "— · cotação indisponível" no agregado, sem quebrar layout.
- `MarketService.quoteMany(tickers)` chama Yahoo em batch (1 chamada por wallet, amortiza latência).

### 3.4 Throttler buckets

```typescript
ThrottlerModule.forRoot([
  { name: 'default', ttl: 60_000, limit: 600 },
  { name: 'auth-email', ttl: 900_000, limit: 5 }, // F1a
  { name: 'market', ttl: 60_000, limit: 60 }, // por userId
  { name: 'ai-analyst', ttl: 86_400_000, limit: 20 }, // por userId / 24h
]);
```

KeyGenerator customizado usa `req.user?.id` (cai pro IP só se não autenticado).

### 3.5 Tratamento de erros

| Situação                             | Resposta                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| DTO inválido                         | 400 BadRequest                                           |
| Recurso de outro user ou inexistente | 404 NotFound (mesma resposta para evitar enumeration)    |
| `@@unique` violado                   | 409 Conflict                                             |
| Ticker não existe no Yahoo           | 422 UnprocessableEntity                                  |
| Yahoo cai (em endpoints de wallet)   | 200 com `stale: true` (degraded, não 503)                |
| Yahoo cai (em `/analyst/asset`)      | 503 ServiceUnavailable (análise IA sem candles é inútil) |
| OpenAI cai                           | 503 ServiceUnavailable com mensagem editorial pt-BR      |

**Logs:** sem PII (sem email, sem ticker do user, sem payload de prompt). Estrutura `{ event, userId, durationMs, ok }`.

---

## 4. Market adapter + integração IA

### 4.1 `MarketService` (`apps/api/src/market/`)

Único ponto de toque com `yahoo-finance2`. Resto do código nunca importa direto.

**Operações:**

```typescript
class MarketService {
  search(query: string, limit: number): Promise<MarketAsset[]>;
  quote(ticker: string): Promise<Quote | null>;
  quoteMany(tickers: string[]): Promise<Map<string, Quote | null>>;
  ohlc(ticker: string, period: '7d' | '30d' | '6m' | '1a' | '5a'): Promise<Candle[]>;
  validateTicker(ticker: string): Promise<MarketAsset>; // 422 se inválido
}
```

**Normalização ticker ↔ Yahoo symbol** (`apps/api/src/market/yahoo-symbol.ts`):

- `PETR4` → `PETR4.SA` (B3)
- `BOVA11` → `BOVA11.SA` (ETF B3)
- `AAPL`, `MSFT` → sem sufixo (US)
- Cripto: `BTC` → `BTC-USD`, `ETH` → `ETH-USD`
- Moeda: `USD` → `USDBRL=X` (alias DOL/EUR do legacy)

**Inferência de `assetClass`** (na `search`/`validateTicker`):

- B3 com 3/4/5/6 dígitos finais → `acoes_br`; com 11 finais → `etf`
- Yahoo `quoteType === 'CRYPTOCURRENCY'` → `cripto`
- Yahoo `quoteType === 'CURRENCY'` → `moeda`
- Yahoo `quoteType === 'ETF'` → `etf`
- Outros tickers US (equity) → mapeia para `etf` por aproximação (F2 amplia)

**Caches (LRU manual, sem dep externa):**

- `quoteCache`: 500 itens, TTL 5min, key=ticker normalizado.
- `ohlcCache`: 200 itens, TTL 30min, key=`${ticker}:${period}`.
- `searchCache`: 100 itens, TTL 1h, key=`${q}:${limit}`.

**Resiliência:**

- `quoteMany`: chama `yahooFinance.quote(tickers)` em batch (Yahoo aceita até 100). Falha total → Map com todas as keys → `null` + log warn. Falha parcial → keys sem `regularMarketPrice` viram `null`.
- `ohlc`: período → `(period1, period2)` interno. Fallback `.SA` → bare ticker (estratégia explícita, sem retry loop).
- Timeout 4s por chamada via `fetch` wrapper (env `MARKET_TIMEOUT_MS`).

**Testes (`market.service.spec`):**

- `quote` cache hit (2ª chamada não bate Yahoo).
- `quote` retorna `null` quando Yahoo lança.
- `quoteMany` parcial (3 tickers, 1 falha).
- `validateTicker` joga 422 quando search retorna vazio.
- `ohlc` fallback `.SA` → bare.
- `toYahoo` para 8 cases (B3, ETF B3, US, cripto, moeda, edge).

### 4.2 ai-runtime: prompt `asset.analysis.v1`

A infra `ai-runtime` já existe no template (versionamento + `generateObject` Zod + retry). F1b adiciona o prompt seed em `apps/api/prisma/seed.ts`:

```typescript
await prisma.llmConfig.upsert({
  where: { key_version: { key: 'asset.analysis.v1', version: 1 } },
  create: {
    key: 'asset.analysis.v1',
    version: 1,
    active: true,
    model: 'gpt-4o-mini',
    params: { temperature: 0.2, maxTokens: 600 },
    prompt: ASSET_ANALYSIS_V1_PROMPT,
  },
  update: {},
});
```

**System prompt (resumo do conteúdo):**

```
Você é um analista técnico que olha 7 dias de candles e devolve JSON puro
segundo o schema. Proibido: indicar preço-alvo, garantir retorno, citar
notícia ou fundamento que não esteja nos dados. Cita só padrões clássicos
(engolfo, doji, MM21, suporte/resistência) derriváveis das velas. Resposta
DEVE estar entre marcadores <json>...</json>. Disclaimer não vai no JSON.
```

**User prompt:**

```
<dados>
ticker: {{ticker}}
classe: {{assetClass}}
candles_recentes (mais antigo → mais recente):
{{candles_json}}
</dados>
```

Conteúdo dinâmico **sempre dentro de `<dados>`** (regra anti-injection do CLAUDE.md).

### 4.3 `AiAnalystService.analyze(userId, ticker, windowDays)`

```
1. cache lookup: SELECT mais recente de AssetAnalysis WHERE userId,ticker,windowDays
   AND createdAt > now() − 1h. Hit → retorna com cached:true.
2. validateTicker(ticker) → 422 se inexistente.
3. candles = market.ohlc(ticker, '30d').slice(-7). Se candles.length < 7 (Yahoo degradado), aborta com 503 ServiceUnavailable — não envia janela curta ao LLM (evita análise sem base).
4. resolve LlmConfig active de key='asset.analysis.v1'.
5. aiRuntime.generateObject({ llmConfigKey, input: { ticker, assetClass, candles }, schema }).
6. INSERT AssetAnalysis com payload validado + promptKey/promptVersion.
7. retorna AssetAnalysisDto com cached:false.
```

**Throttler `ai-analyst`** (20/dia/user) + cache 1h cobrem rajadas. Em CI/dev, `AI_RUNTIME_FIXTURE=true` faz `generateObject` retornar fixture pré-gravada — evita custo OpenAI.

**Testes:**

- `ai-analyst.service.spec`: cache hit (não chama LLM); cache miss valida → candles → generate → persist; ticker inválido → 422 sem LLM; TTL 1h respeitado.
- `ai-analyst.controller.spec`: throttle aplica.
- `asset-analysis.schema.spec`: Zod rejeita `recomendacao` fora do enum, `confianca > 100`, `padroes.length > 4`, `sugestao.length > 280`.

---

## 5. Arquitetura frontend — Atomic Design

### 5.1 Regra das 5 camadas (escrita no CLAUDE.md)

| Camada                | Pode                                                                         | Não pode                                                |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| **atoms**             | Receber props puros; renderizar primitivos shadcn ou SVG                     | Conhecer API, ler context, ter estado de domínio        |
| **molecules**         | Compor atoms; estado local simples (open/close, foco)                        | Fetch, conhecer rotas                                   |
| **organisms**         | Compor atoms/molecules; chamar hooks de domínio; fetch via SWR               | Importar organisms de outra feature                     |
| **templates**         | Slots de layout + props de slot                                              | Estado, fetch, lógica                                   |
| **pages** (em `app/`) | Compor templates + organisms; receber `params/searchParams`; server-fetchers | Renderizar atoms direto (passa por molecules/organisms) |

### 5.2 Árvore final

```
apps/web/
├── components/
│   ├── atoms/
│   │   ├── ui/                       # shadcn primitives
│   │   ├── charts/
│   │   │   ├── donut.tsx             # recharts wrapper
│   │   │   ├── sparkline.tsx
│   │   │   ├── area-chart.tsx        # placeholder F5
│   │   │   └── candle-chart.tsx      # SVG próprio
│   │   ├── icons/
│   │   │   ├── asset-icon.tsx        # 10 tickers conhecidos + fallback gradient
│   │   │   └── brand/logo.tsx
│   │   └── typography/
│   │       ├── eyebrow.tsx
│   │       └── editorial-quote.tsx   # Instrument Serif itálico
│   ├── molecules/
│   │   ├── form-field.tsx
│   │   ├── kpi-card.tsx
│   │   ├── stat-box.tsx
│   │   ├── responsive-dialog.tsx     # Dialog md+ / Sheet bottom <md
│   │   ├── ticker-search-input.tsx   # cmdk + GET /market/search debounced
│   │   ├── ohlc-tabs.tsx
│   │   ├── ai-disclaimer.tsx
│   │   ├── empty-state.tsx
│   │   ├── delete-confirm-dialog.tsx
│   │   └── editorial-section-header.tsx
│   ├── organisms/
│   │   ├── auth/                     # MIGRA F1a
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── sidebar-mobile.tsx
│   │   │   ├── topbar.tsx            # MIGRA F1a
│   │   │   └── wallet-switcher.tsx
│   │   ├── wallet/
│   │   ├── asset/
│   │   ├── ai-analyst/
│   │   ├── landing/                  # 9 seções §4.1
│   │   └── settings/
│   ├── templates/
│   │   ├── authed-shell.tsx
│   │   ├── public-shell.tsx
│   │   ├── landing-shell.tsx
│   │   └── error-shell.tsx
│   └── providers/
│       └── wallet-switcher-provider.tsx
├── hooks/                            # fora de components/
│   ├── wallet/
│   │   ├── use-wallets-list.ts
│   │   ├── use-wallet-summary.ts
│   │   ├── use-mutate-wallet.ts
│   │   └── use-mutate-position.ts
│   ├── market/
│   │   ├── use-ticker-search.ts
│   │   └── use-ohlc.ts
│   ├── ai-analyst/
│   │   └── use-asset-analysis.ts
│   └── shared/
│       ├── use-media-query.ts
│       └── use-active-wallet.ts
└── app/                              # pages (App Router)
    ├── (public)/
    │   ├── page.tsx                  # landing real
    │   ├── login, signup, ...        # F1a
    │   ├── error.tsx
    │   └── not-found.tsx
    └── (authed)/
        ├── layout.tsx                # AuthedShell + WalletSwitcherProvider
        ├── loading.tsx
        ├── error.tsx
        ├── dashboard/page.tsx
        ├── carteiras/page.tsx
        ├── carteiras/[id]/page.tsx
        ├── ativos/[ticker]/page.tsx
        └── configuracoes/page.tsx
```

### 5.3 Migração F1a → Atomic Design

Acontece em um commit isolado (`refactor: migrate F1a to atomic design`) antes de qualquer feature nova. Movimentos:

- `components/features/auth/*` → `components/organisms/auth/*`
- `components/layout/topbar.tsx` → `components/organisms/layout/topbar.tsx`
- `components/layout/logo.tsx` → `components/atoms/icons/brand/logo.tsx`
- `components/ui/*` → `components/atoms/ui/*`

`git mv` preserva history. Imports reescritos por script único `scripts/migrate-imports.ts`. Gate: `tsc --noEmit && npm run lint && npm run test && npm run build` verde antes de commitar.

### 5.4 WalletSwitcherProvider (active wallet)

- Server: `(authed)/layout.tsx` chama `GET /wallets` com JWT e passa lista pro provider client.
- Active wallet resolvida nesta ordem:
  1. cookie `porttion_active_wallet`
  2. primeira wallet por `createdAt asc`
  3. zero wallets → `activeWallet = null` + sidebar mostra estado "Crie sua primeira carteira" + `CreateWalletDialog` auto-aberto na primeira visita (flag em `sessionStorage`).
- `switchWallet(id)`: seta cookie + `router.refresh()`.
- `refreshWallets()`: invalida `/wallets` no SWR (chamado após create/edit/delete).
- Listener `storage` event sincroniza entre abas.

### 5.5 `<ResponsiveDialog>`

API única; renderiza `<Dialog>` shadcn em ≥768px e `<Sheet side="bottom">` com drag-handle e `90vh` em <768px. Consumido por todos os flows críticos.

### 5.6 CandleChart (SVG próprio)

- viewBox responsivo. Scale linear no Y (min low → max high). X por índice.
- Por candle: linha vertical low→high + retângulo open→close (verde se close≥open, vermelho senão), com `data-index` para hit detection.
- Volume bars opacidade 50% no rodapé com escala separada.
- Tooltip: hover (desktop) ou long-press (mobile) via `pointerdown + setTimeout 350ms`. Cancela em `pointermove > 8px`. Clamp Y do lado oposto se cursor está perto da borda.
- Tabs `7d|30d|6m|1a|5a` ficam no `<OhlcTabs>` parent.
- A11y: `role="img"` + `aria-label` com resumo período + variação. Candles `focusable` para keyboard tooltip.

### 5.7 `AIAnalysisCard` (3 estados)

```typescript
type AnalysisState =
  | { status: 'empty'; onAnalyze: () => void }
  | { status: 'loading'; windowDays: number }
  | { status: 'done'; data: AssetAnalysisDto; onRefresh?: () => void };
```

Estado `done`: header (brain icon + título + caption timestamp + badge `comprar/manter/nao_comprar` com cor variando), 3-col responsiva (tendência/confiança/horizonte), separator, justificativa em **Instrument Serif itálico** (`editorial-quote.tsx`), badges outline para padrões, badges warning para riscos, sugestão em texto livre, disclaimer mono no rodapé. Strings de labels via `t('ai.analysis.*')`; payload (padrões/riscos/sugestão/justificativa) vem em pt-BR do modelo, **não** passa por i18n.

### 5.8 Landing real

9 organisms em `organisms/landing/*`, montados via `templates/landing-shell.tsx`. Strings 100% via `t('landing.<section>.<key>')`. Hero usa Instrument Serif itálico nas palavras de destaque, tipografia `clamp(32px, 8vw, 56px)`. Lazy load via dynamic import nos componentes abaixo do hero (FAQ accordion, use-cases). Header sticky com `backdrop-filter: blur` quando `scrollY > 8`.

### 5.9 Páginas de erro globais

- `(authed)/error.tsx` — fallback editorial pt-BR, botão "Tentar de novo" chama `reset()`, mantém shell.
- `(authed)/loading.tsx` — skeleton do shell.
- `(public)/error.tsx` — fallback dentro do shell público.
- `app/not-found.tsx` — 404 editorial com CTA para `/` ou `/dashboard`.
- `app/error.tsx` — fallback total caso layout authed quebre.

---

## 6. i18n, testes, observabilidade, CI

### 6.1 i18n — namespaces novos

Estendendo `apps/web/messages/pt-BR.json`:

```
common.errors.*, common.states.*
sidebar.*, dashboard.*, carteira.*
wallet.list.*, wallet.create.*, wallet.edit.*, wallet.card.*, wallet.kpi.*,
  wallet.positions.*, wallet.allocation.*, wallet.delete.*
position.add.*, position.edit.*, position.row.*, position.card.*
asset.header.*, asset.stats.*, asset.chart.*, asset.search.*
ai.analysis.empty.*, ai.analysis.loading.*, ai.analysis.done.*,
  ai.analysis.disclaimer, ai.analysis.errors.*
landing.<section>.*    # expandir 9 seções
settings.account.*, settings.locale.*
error.404.*, error.500.*, error.boundary.*
```

**ICU plurals** obrigatório em `wallet.list.count`, `wallet.kpi.positionsCount`, etc. **Exceções i18n** (documentadas em CLAUDE.md): tickers (`PETR4`), símbolos de moeda (`R$`), labels técnicos mono (`gpt-4o-mini · v1`), payload do `AssetAnalysisDto`.

**`i18n-check.ts`** (F1a) continua válido — key usada sem definição quebra CI.

### 6.2 Testes backend (Jest)

Gates: **≥ 70% statements** nos módulos novos, **100% nos guards/ownership**.

| Módulo       | Specs principais                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wallets`    | service: ownership cross-user (4 cases), `computeKpis` (zero positions, parcial stale, todas stale), `@@unique` 409. Controller: 5 endpoints + ownership 404 |
| `positions`  | service: cross-user 404, duplicate ticker 409, ticker normalization, update preserva `assetClass`. Controller                                                |
| `market`     | service: cache hit, falha total, parcial, validateTicker 422, ohlc fallback. `yahoo-symbol.spec` com 8 cases                                                 |
| `ai-analyst` | service: cache hit, miss, ticker inválido, TTL respeitado. Controller: throttle. `asset-analysis.schema.spec`: Zod rejeita 4 patterns                        |

### 6.3 Testes frontend (Vitest + happy-dom)

Componentes críticos. **Sem snapshots** — assertions semânticas.

- `kpi-grid`: valores formatados; `null` → "—"; `stale:true` → ícone warn.
- `positions-table`: `<table>` em md+ / cards em <md. Empty state.
- `position-row` / `position-card`: `quote:null` → "indisponível" sem quebrar layout.
- `wallet-switcher`: popover; switch seta cookie + refresh; zero wallets → CTA "Criar primeira".
- `candle-chart`: N rects por N candles; cor por close/open; tooltip em pointerenter; clamp Y perto da borda.
- `ai-analysis-card`: 3 estados; em done, justificativa com `font-serif italic`; badge `Comprar` verde; `Não comprar` danger.
- `responsive-dialog`: ≥768 → Dialog; <768 → Sheet.
- `ticker-search-input`: debounce 350ms; seleção fecha popover.
- `landing-header`: `scrollY > 8` aplica backdrop blur.

### 6.4 E2E Playwright (mobile + desktop por fluxo)

Arquivo `e2e/f1b-vertical.spec.ts`:

```
1. login email/senha (usuário verificado via seed)
2. dashboard com zero wallets → "Crie sua primeira carteira"
3. Nova carteira → "Principal", BRL, balanceada → cria
4. AddPositionSheet auto-abre → "PETR" → escolhe PETR4
   → qty 100, avgPrice 30 → confirma
5. dashboard atualiza: Patrimônio > 0, donut, tabela
6. clica PETR4 → /ativos/PETR4
7. header + CandleChart visível + AIAnalysisCard empty
8. "Analisar PETR4" → loading → done em ≤ 10s
9. badge recomendação, justificativa itálico, disclaimer rodapé
10. volta dashboard via sidebar → reload → estado persiste
```

Viewports: **iPhone 13 (390×844)** + **desktop 1440×900**. Falha em qualquer um = CI vermelho.

**Mock estratégico:**

- `page.route('**/yahoo/**')` → fixtures em `apps/web/e2e/fixtures/yahoo.json`.
- `AI_RUNTIME_FIXTURE=true` → `apps/web/e2e/fixtures/ai-analysis.json`.

### 6.5 CI (estender `ci.yml` da F1a)

- **Job `e2e`** novo: Postgres + Redis service containers; Playwright 2 viewports; ~5min.
- **`coverage-gate`** dentro do job `test`: `apps/api/scripts/check-coverage.ts` lê `coverage-summary.json` e falha se `statements < 70%` nos paths novos. Threshold por path em `coverage.config.json`.
- **Lighthouse** (P1, não bloqueia): roda em PR para `staging`, threshold 90/90/90 na landing. Se runner instável, vira issue follow-up.

### 6.6 Observabilidade mínima

Sem Prometheus/tracing (backlog template). Estruturar logs Nest:

- `Logger.log` com payload `{ event, userId, durationMs, ok }`. Sem PII.
- Eventos: `wallet.created`, `position.created`, `market.quote.failed`, `market.ohlc.fallback`, `ai.analysis.cache_hit`, `ai.analysis.generated`, `ai.analysis.failed`.
- Web: `console.error` só em error boundaries.

Suficiente para diagnosticar staging via Railway logs.

### 6.7 Mapeamento spec-00 §7.2 → F1b

Critérios 1-3 (auth) já cobertos pela F1a — verificar não-regressão. Critérios **4-12, 14 são novos da F1b**. Critérios 13 (coverage), 15 (Lighthouse), 16 (i18n-check) são gates de CI.

---

## 7. Riscos, mitigações, rollout

### 7.1 Riscos específicos F1b

| Risco                                  | Prob. | Impacto    | Mitigação                                                                                                    |
| -------------------------------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `yahoo-finance2` quebrar em prod       | Média | Alto       | Cache 5min; `stale:true` graceful; fixtures e2e; spec-02 avalia brapi.dev                                    |
| Migração Atomic Design quebra imports  | Alta  | Médio      | Commit isolado primeiro; codemod `migrate-imports.ts` reversível; `tsc/lint/test/build` gate antes do commit |
| CandleChart quebra em mobile (touch)   | Média | Alto       | Long-press 350ms + cancel em `pointermove > 8px`; testes em iPhone viewport; fallback tooltip estático       |
| Custo OpenAI explode em CI/dev         | Baixa | Médio      | `AI_RUNTIME_FIXTURE=true` em CI/dev; bucket 20/dia/user; cache 1h                                            |
| Lighthouse < 90 na landing             | Média | Baixo (P1) | Lazy load; `next/font display:swap`; gate é P1                                                               |
| WalletSwitcher desincroniza entre tabs | Baixa | Baixo      | Cookie + listener `storage` event + `router.refresh()`                                                       |
| PR muito grande perde revisibilidade   | Alta  | Médio      | 5 checkpoints atômicos; revisor lê commit-by-commit                                                          |
| Explosão de keys i18n (>500)           | Média | Baixo      | `i18n-check.ts` CI gate; colocation `feature.scope.key`                                                      |

### 7.2 Dependências externas (pré-flight)

| Dependência                                  | Onde                   | Bloqueia               |
| -------------------------------------------- | ---------------------- | ---------------------- |
| `OPENAI_API_KEY` em dev + staging            | Cofre Kainos + Railway | Checkpoint 4 (Hero IA) |
| `yahoo-finance2`, `swr`, `recharts`          | npm                    | Checkpoints 1-3        |
| DB staging com migração F1a                  | Já feito               | —                      |
| Resend domain                                | Já F1a                 | —                      |
| Seed `asset.analysis.v1` aplicado em staging | Manual após deploy     | Checkpoint 4           |

### 7.3 Rollout

PR única `feat/spec-01b-domain-and-ai → staging`. **10 commits** (1 setup + 1 refactor + 7 features + 1 e2e):

```
0. chore: pre-flight (deps, env, shadcn primitives, seed code)
1. refactor: migrate F1a to atomic design + update CLAUDE.md
2. feat(web): authed shell + wallet switcher provider
3. feat(api): wallets + positions + market with KPIs
4. feat(web): wallets/positions CRUD UI
5. feat(web): dashboard KPI Grid + carteira detail
6. feat(api): ai-analyst module + prompt v1 seed
7. feat(web): asset detail + candle chart + AI card
8. feat(web): landing real (9 sections) + settings + error pages
9. test(e2e): playwright vertical slice (mobile + desktop)
```

Cada commit deixa CI verde. Squash and merge final usa título conventional.

### 7.4 Smoke staging

1. Signup com email real → fluxo F1a não regrediu.
2. Login → criar "Smoke" → adicionar PETR4 → ver KPIs.
3. `/ativos/PETR4` → analisar → resposta IA não-vazia.
4. iPhone viewport (Chrome DevTools) em cada página → zero scroll horizontal.
5. Lighthouse mobile incognito na landing.
6. Logs Railway: zero `error` no fluxo dourado.

### 7.5 Promoção staging → main

Após **3 dias** estáveis em staging + smoke manual + zero spike de erro → PR `staging → main` (sem código novo, só release notes).

### 7.6 Rollback

- **Web break:** revert da PR + redeploy. ≤ 15min.
- **API break:** revert da PR. Migração `f1b_domain` é aditiva — tabelas órfãs ficam até a próxima migration.
- **Migração com problema:** abrir migration nova `revert_f1b_domain` em PR de fix (Prisma migrate down não é confiável para Postgres).

### 7.7 Follow-up P1 (não bloqueia merge)

Documentados no corpo da PR como checklist:

- `eslint-plugin-boundaries` para enforce imports Atomic.
- Lighthouse threshold no CI se ficar como P1.
- Métricas Prometheus (transversal, backlog template).
- Skeleton mais rico em `loading.tsx`.
- Banner AI Insight com narrativa determinística (revisita se UX pedir).
- Animações de transição entre estados do `AIAnalysisCard`.

---

## 8. Detalhamento dos 10 commits

### Commit 0 — `chore: pre-flight setup`

- Instalar `yahoo-finance2`, `swr`, `recharts`.
- Adicionar ao `env.schema.ts`: `OPENAI_API_KEY`, `MARKET_TIMEOUT_MS` (default 4000), `AI_RUNTIME_FIXTURE` (default false).
- Adicionar shadcn primitives (via MCP): `sheet`, `dropdown-menu`, `command`, `popover`, `tooltip`, `tabs`, `table`, `skeleton`, `accordion`.
- `prisma/seed.ts` estendido com o seed do prompt (sem rodar ainda).
- CI verde.

### Commit 1 — `refactor: migrate F1a to atomic design + update CLAUDE.md`

- `git mv` dos arquivos F1a para a nova árvore (atoms/molecules/organisms).
- Script `scripts/migrate-imports.ts` reescreve paths.
- CLAUDE.md: substituir bloco "Estrutura plana" pela tabela das 5 camadas.
- `docs/architecture.md`: adicionar seção Atomic Design.
- `spec-00 §1 backlog`: remover "Atomic Design (atualmente flat)".
- Gate: `tsc/lint/test/build` verde.

### Commit 2 — `feat(web): authed shell with sidebar, topbar, wallet switcher provider`

- `templates/authed-shell.tsx`.
- `organisms/layout/sidebar.tsx`, `sidebar-mobile.tsx`, `topbar.tsx` (reescrito), `wallet-switcher.tsx` (com fixture até commit 3).
- `providers/wallet-switcher-provider.tsx`.
- `hooks/shared/use-media-query.ts`, `use-active-wallet.ts`.
- `molecules/responsive-dialog.tsx`.
- `(authed)/layout.tsx` usando `AuthedShell`.
- i18n: `sidebar.*`, `topbar.*`.
- Testes: `sidebar.spec`, `wallet-switcher.spec`, `responsive-dialog.spec`.

### Commit 3 — `feat(api): wallets + positions + market with KPIs`

- Migração Prisma `f1b_domain`.
- Módulos `wallets`, `positions`, `market` com testes.
- `MarketService` (cache LRU + `toYahoo` + fallbacks).
- `ThrottlerModule` com buckets `market` e `ai-analyst`.
- `packages/shared-types`: shapes §3.2.
- Smoke via curl: criar wallet, posição, ver KPI.

### Commit 4 — `feat(web): wallets/positions CRUD UI`

- `organisms/wallet/create-wallet-dialog.tsx`, `edit-wallet-dialog.tsx`, `wallet-card-large.tsx`, `wallet-empty-state.tsx`.
- `organisms/wallet/add-position-sheet.tsx` com `molecules/ticker-search-input.tsx`.
- `app/(authed)/carteiras/page.tsx` (lista), `carteiras/[id]/page.tsx` (visão geral sem KPIs ainda — só hero + posições raw).
- `hooks/wallet/*`, `hooks/market/use-ticker-search.ts`.
- Wallet switcher passa a consumir API real.
- Testes Vitest.
- i18n: `wallet.*`, `position.*`, `asset.search.*`.

### Commit 5 — `feat(web): dashboard KPI Grid + carteira detail`

- `organisms/wallet/kpi-grid.tsx`, `positions-table.tsx`, `position-card.tsx`, `position-row.tsx`, `allocation-donut.tsx`.
- `molecules/kpi-card.tsx`.
- `atoms/charts/donut.tsx`, `area-chart.tsx` (placeholder Evolução).
- `app/(authed)/dashboard/page.tsx`: KPIs + Evolução placeholder + Donut + Tabela + AI Insight placeholder + Watchlist placeholder.
- `carteiras/[id]/page.tsx`: hero + 4 KPIs + Evolução placeholder + Donut + Tabela.
- Zero wallets → `WalletEmptyState` + auto-open `CreateWalletDialog`.
- i18n: `dashboard.*`, `carteira.*`.

### Commit 6 — `feat(api): ai-analyst module + prompt v1 seed`

- Módulo `ai-analyst` com `AiAnalystService`.
- Endpoint `POST /analyst/asset` com throttler `ai-analyst`.
- Zod schema do payload + spec.
- Aplicar seed `asset.analysis.v1` (rodar `seed.ts`).
- Testes service + controller + schema.

### Commit 7 — `feat(web): asset detail + candle chart + AI card`

- `atoms/charts/candle-chart.tsx` + testes (clamp, cores, tooltip).
- `atoms/icons/asset-icon.tsx`.
- `molecules/stat-box.tsx`, `ohlc-tabs.tsx`, `ai-disclaimer.tsx`.
- `organisms/asset/asset-header.tsx`, `stats-strip.tsx`, `candle-chart-section.tsx`.
- `organisms/ai-analyst/ai-analysis-card.tsx` (3 estados).
- `hooks/market/use-ohlc.ts`, `hooks/ai-analyst/use-asset-analysis.ts`.
- `app/(authed)/ativos/[ticker]/page.tsx`.
- i18n: `asset.*`, `ai.analysis.*`.

### Commit 8 — `feat(web): landing + settings + error pages`

- `organisms/landing/*` (9 seções).
- `templates/landing-shell.tsx`, `public-shell.tsx`, `error-shell.tsx`.
- `app/(public)/page.tsx` usando `LandingShell`.
- `organisms/settings/account-section.tsx`, `locale-section.tsx`.
- `app/(authed)/configuracoes/page.tsx`.
- `(authed)/error.tsx`, `(authed)/loading.tsx`, `(public)/error.tsx`, `app/not-found.tsx`, `app/error.tsx`.
- i18n: `landing.*` expandido, `settings.*`, `error.*`.

### Commit 9 — `test(e2e): playwright vertical slice (mobile + desktop)`

- `apps/web/e2e/f1b-vertical.spec.ts`.
- `apps/web/e2e/fixtures/yahoo.json`, `ai-analysis.json`.
- `setupTestUser.ts` para seed do usuário verificado.
- `.github/workflows/ci.yml`: job `e2e` com Postgres + Redis services.
- Validar verde em mobile + desktop.

---

## 9. Próximos passos

1. **Revisão deste spec** pelo usuário (gate de aprovação).
2. Invocar `superpowers:writing-plans` para gerar o plano de implementação detalhado (task-by-task estilo F1a).
3. Iniciar implementação pelo commit 0 → commit 9.

---

## 10. Glossário (incremental ao spec-00 §13)

| Termo              | Significado                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Atomic Design      | Padrão de organização frontend em 5 camadas (atoms/molecules/organisms/templates/pages)     |
| Active wallet      | Carteira selecionada no `WalletSwitcher`, persistida em cookie, contexto de todo `(authed)` |
| KPI computado      | Patrimônio, P&L total, custo total, variação do dia — todos server-side, never client       |
| Stale quote        | Cotação que falhou (Yahoo erro ou tickless) — retorna `quote: null` + `stale: true`         |
| Cache 1h           | Cache de `AssetAnalysis` por `(userId, ticker, windowDays)` para 60min                      |
| AI_RUNTIME_FIXTURE | Env que faz `generateObject` retornar fixture sem bater OpenAI (CI/dev)                     |
| Smoke staging      | Roteiro manual de 6 passos validando staging após deploy da PR                              |
