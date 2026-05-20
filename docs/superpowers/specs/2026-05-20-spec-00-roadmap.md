# Spec 00 — Norte do produto e roadmap de fases

> Documento central do **Porttion**. Define visão de produto, princípios inegociáveis, arquitetura técnica, modelo de domínio e o recorte por fases incrementais. Cada fase entrega valor de produto verificável e abre uma spec própria (`spec-01-…`, `spec-02-…`, etc.) com plano de implementação detalhado.

- **Data:** 2026-05-20
- **Branch atual:** `refact`
- **Base:** `kainos-template-app` em monorepo (Next.js 16 + NestJS 11 + Prisma 6 + ai-runtime + storage abstrato + BullMQ)
- **Referência de UI:** `docs/ui/Porttion - Estrutura da interface.md` + `docs/ui/screenshots/`
- **Referência de domínio:** `legacy-app/` (Streamlit + yfinance + OpenAI direto)

---

## 1. Visão de produto

**Porttion** é uma plataforma de análise de carteira pessoal com IA. Voz editorial (carta, não terminal), para o investidor pessoa física iniciante que entende dinheiro mas não trade.

### 1.1 Diferenciais inegociáveis

1. **Carteira como unidade mental.** O switcher de carteira ativa é o primeiro elemento da sidebar. Toda navegação contextual deriva dele.
2. **IA como voz, não caixa preta.** Toda análise traz tendência, recomendação, confiança em %, justificativa rastreável, padrões detectados, riscos e disclaimer CVM-friendly. Nada de "preço-alvo" no schema.
3. **Server-side, prompts versionados, custo da plataforma.** Chave OpenAI vive no servidor via `ai-runtime`; nenhuma chave do usuário. Habilita versionamento de prompt, retry, validação Zod e (em fase futura) quota/paywall.
4. **Mobile-first desde a F1.** O público alvo é mobile-first; todo componente nasce em 375px e expande.
5. **i18n centralizado em tokens desde o dia zero.** Toda string via `t('key')`. Só pt-BR ativo na F1, mas a árvore JSON e a estrutura de namespaces já estão preparadas para múltiplos locales.

### 1.2 Modelagem de domínio adotada (F1)

**Position-based**: snapshot de qty + avgPrice por ativo. KPIs reais a partir de OHLC do Yahoo; evolução temporal do patrimônio fica como placeholder até F5, quando substituímos o modelo por **Movement-based** (histórico de movimentações).

Por que assim:

- Permite KPIs reais (patrimônio, P&L, custo, variação do dia) sem construir parser de movimentações ou motor de cálculo histórico no MVP.
- Adia decisões caras (parser de nota B3, importação CSV, double-write em migração) para fases posteriores onde já há tração.
- O custo de migração F5 é conhecido e mitigável (script reversível + double-write).

---

## 2. Stack e decisões técnicas

| Camada             | Decisão                                                                                                 | Origem             |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ------------------ |
| Monorepo           | npm workspaces + Turborepo                                                                              | template           |
| Frontend           | Next.js 16 (App Router) + shadcn/ui + Tailwind v4 + next-themes + next-intl                             | template           |
| Backend            | NestJS 11 + Prisma 6 + class-validator + helmet + `@nestjs/throttler`                                   | template           |
| Auth — social      | NextAuth (Google + GitHub) com JWT compartilhado + S2S `INTERNAL_SERVICE_TOKEN`                         | template           |
| Auth — email/senha | NextAuth `Credentials` provider + bcrypt + email de verificação + reset                                 | **novo (F1)**      |
| Email              | **Resend** + React Email para templates (verify, reset, welcome opcional)                               | **novo (F1)**      |
| DB                 | PostgreSQL (dev: docker-compose; prod: Railway)                                                         | template           |
| IA                 | `ai-runtime` server-side (`generateObject` com Zod) — OpenAI via Vercel AI SDK                          | template           |
| Mercado            | `yahoo-finance2` (npm) com cache em memória 5min + fallback de período/alias DOL/EUR portados do legacy | nova               |
| Tema               | OpenClaw (tweakcn) substitui paleta zinc; estende com `--success/--warning/--danger-muted` do template  | nova               |
| Fontes             | Inter (UI) + Instrument Serif itálico (sotaque editorial) + JetBrains Mono (números) via `next/font`    | nova               |
| Charts             | `CandleChart` SVG próprio; donut/sparkline/area com `recharts`                                          | meio-termo         |
| i18n               | next-intl, **só pt-BR ativo** na F1, todas strings via tokens com convenção `<feature>.<scope>.<key>`   | template + reforço |
| CI/CD              | GitHub Actions + Railway por branch (deploy automático em `staging`)                                    | template           |
| Variantes Tweaks   | **fora da F1** — fase 1 fixa em hero editorial + dashboard KPI Grid + sidebar expanded                  | recorte            |

### 2.1 Por que Resend (e não Postmark/SES/SendGrid)

- **DX:** SDK Node enxuto, React Email nativo (templates como componentes versionados).
- **Pricing:** 3k emails/mês grátis cobre dev + tração inicial.
- **Webhooks:** bounce/spam decentes out-of-the-box.
- Postmark tem deliverability superior mas DX datado; SES é mais barato em volume alto (>50k/mês) com DX pior e signed senders; SendGrid teve mudanças bruscas pós-Twilio.
- **Reavaliar provedor na F6 ou quando volume cruzar 50k/mês.**

### 2.2 Mobile-first — implicações arquiteturais

- Toda página/componente nasce em 375px e expande.
- Sidebar usa **Sheet (drawer)** como padrão; sidebar persistente é o caso `≥ md (768px)`.
- Tabelas (`PositionsTable`) renderizam `<table>` em desktop e `PositionCard[]` empilhados em mobile. Mesma fonte de dados, dois modos de visualização.
- Forms críticos (Create Wallet, Add Position) usam **bottom sheet** em mobile, dialog centralizado em desktop. Componente abstração: `<ResponsiveDialog>`.
- `CandleChart`: tooltip por long-press em mobile (touch), hover em desktop. Eixo Y rotaciona entre lados se a vela do cursor estiver perto da borda.
- Tipografia escalonada com `clamp()` em todos os níveis.
- Hit targets ≥ 44px em **qualquer** viewport (não só mobile).
- Playwright roda em 2 viewports por fluxo: `iPhone 13` (mobile) + `desktop`. Falha qualquer um = CI vermelho.

### 2.3 i18n centralizado — convenção

- **Naming:** `<feature>.<scope>.<key>`. Exemplos: `wallet.kpi.patrimonio.label`, `landing.hero.headline.parte1`, `ai.analysis.disclaimer`.
- **Estrutura:** `apps/web/messages/pt-BR.json` em árvore, um namespace por feature.
- **Sem concatenação de string em código.** Frases compostas usam ICU MessageFormat:
  - `"Sua carteira tem {n, plural, one {# ativo} other {# ativos}}"`.
- **Datas/números via `next-intl` formatters** (`useFormatter`), nunca `toLocaleString` solto.
- **Validação em CI:** script `scripts/i18n-check.ts` faz AST scan em `apps/web/**`, compara chamadas `t('...')` contra `pt-BR.json` e **falha** se houver key usada que não existe.
- **Strings que NÃO vão para i18n:** símbolos de moeda (`R$`), tickers (`PETR4`), legendas técnicas em mono (`gpt-4o-mini · v1`). Documentar em CLAUDE.md.

---

## 3. Modelo de domínio (F1)

```prisma
// === Auth ampliação (F1) ===
// (Relações F2+ — WatchlistItem, Movement, WalletReport, AssetChatMessage —
//  serão adicionadas no User nas fases correspondentes.)
model User {
  // campos do template ...
  passwordHash    String?
  emailVerifiedAt DateTime?
  emailTokens     EmailToken[]
  wallets         Wallet[]
  analyses        AssetAnalysis[]
}

model EmailToken {
  id        String      @id @default(cuid())
  userId    String
  kind      EmailTokenKind
  tokenHash String      @unique     // hash do token; original vai por email
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime    @default(now())
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, kind])
}

enum EmailTokenKind { VERIFY RESET }

// === Domínio Porttion (F1) ===
model Wallet {
  id           String     @id @default(cuid())
  userId       String
  name         String
  baseCurrency String     @default("BRL")
  strategy     String?    // "balanceada" | "crescimento" | "renda" | "personalizada"
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  positions    Position[]
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model Position {
  id         String   @id @default(cuid())
  walletId   String
  ticker     String   // normalizado (PETR4, BOVA11) — sufixo .SA aplicado só na busca
  qty        Float
  avgPrice   Float    // PM em moeda da carteira
  assetClass String   // "acoes_br" | "etf" | "renda_fixa" | "cripto" | "moeda"
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
  windowDays    Int      // 7, 30
  payload       Json     // saída validada do generateObject
  promptKey     String   // "asset.analysis.v1"
  promptVersion Int
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, ticker, createdAt])
}
```

### 3.1 Ownership

Toda query em `Wallet`, `Position`, `AssetAnalysis`, `EmailToken` filtra por `userId`. Guards no Nest + filtro explícito no `where`. Regra reforçada no CLAUDE.md e em PR template.

### 3.2 LGPD

`onDelete: Cascade` em tudo que pertence ao usuário. Deletar `User` apaga `Wallet`, `Position`, `AssetAnalysis`, `EmailToken`, e em fases futuras `WatchlistItem`, `Movement`, `WalletReport`, `AssetChatMessage`.

---

## 4. Módulos backend (F1)

```
apps/api/src/
├── auth/
│   ├── (existente: nextauth-jwt, internal-service)
│   ├── credentials/        # NextAuth Credentials provider (server-side validate)
│   └── email-verification/ # endpoints verify + reset via EmailToken
├── email/                  # adapter Resend + render React Email
├── wallets/                # CRUD Wallet + listagem com KPIs agregados
├── positions/              # CRUD Position dentro de uma wallet
├── market/                 # yahoo-finance2 adapter (search, quote, ohlc, validation)
├── ai-analyst/             # consome ai-runtime, expõe POST /analyst/asset
└── (já existe: users, ai-runtime, storage, queue, health, prisma, common, config)
```

### 4.1 Contratos REST (F1)

```
# Auth
POST   /auth/signup              → { email, password, name } cria User + envia EmailToken VERIFY
POST   /auth/verify              → { token } marca emailVerifiedAt
POST   /auth/forgot-password     → { email } envia EmailToken RESET
POST   /auth/reset-password      → { token, newPassword } troca senha
GET    /auth/me                  → (já existe no template)

# Carteiras
GET    /wallets                       → Wallet[] do usuário com KPIs (patrimônio, P&L)
POST   /wallets                       → cria
GET    /wallets/:id                   → Wallet + Position[] + KPIs computados
PATCH  /wallets/:id                   → renomeia / muda strategy
DELETE /wallets/:id                   → cascade

# Posições
POST   /wallets/:id/positions         → { ticker, qty, avgPrice, assetClass }
PATCH  /positions/:id                 → ajusta qty/avgPrice
DELETE /positions/:id

# Mercado
GET    /market/search?q=PETR          → [{ ticker, name, assetClass }]
GET    /market/quote/:ticker          → { price, changePct, lastUpdate }
GET    /market/ohlc/:ticker?period=30d → OHLCV[]

# Análise IA
POST   /analyst/asset                 → { ticker, days } → AssetAnalysis (cacheado 1h)
```

### 4.2 KPIs computados server-side

Não computar no cliente. Endpoints retornam:

- `patrimonio = Σ qty × quote atual`
- `pl_total = Σ (quote - avgPrice) × qty`
- `custo_total = Σ qty × avgPrice`
- `variacao_dia = Σ (quote × changePct) ÷ patrimonio` (média ponderada por valor atual)

Falhas de cotação por ticker: posição entra com `quote: null`, flag `stale: true`, e UI mostra "— · indisponível" naquela linha sem quebrar o agregado.

### 4.3 Rate limits (throttler buckets)

- `auth-email`: 5 solicitações/15min/IP (signup, forgot, verify, reset)
- `auth-login`: 10 tentativas/15min/IP+email
- `market`: 60 req/min/usuário
- `ai-analyst`: 20 análises/dia/usuário

---

## 5. Integração IA (F1)

### 5.1 Único prompt versionado na F1: `asset.analysis.v1`

```
key: asset.analysis.v1
model: gpt-4o-mini
schema (Zod):
  tendencia: "alta" | "lateral" | "baixa"
  recomendacao: "comprar" | "manter" | "nao_comprar"
  confianca: number (0-100)
  padroes: string[] (max 4)
  riscos: string[] (max 3)
  sugestao: string (max 280)
  justificativa: string (max 500)    // citação serifada na UI
  horizonte: "1-2 semanas"             // fixo na v1
```

- Entrada: últimos 7 candles OHLC + metadata (ticker, classe).
- System prompt herda regra do legacy (analista técnico, JSON puro) + adiciona disclaimer CVM-friendly + proíbe "preço-alvo" no output.
- **Conteúdo dinâmico entre `<dados>...</dados>` para mitigar prompt injection** (regra de segurança do CLAUDE.md).
- Cache: persistido em `AssetAnalysis`, reutilizado por 1h para `(userId, ticker, windowDays)`.

### 5.2 Disclaimer fixo no rodapé do card

> `ⓘ Análise técnica · não constitui recomendação de investimento.`

---

## 6. Estrutura frontend (F1)

```
apps/web/app/
├── (public)/
│   ├── page.tsx                       # landing
│   ├── login/page.tsx                 # email/senha + Google/GitHub
│   ├── signup/page.tsx
│   ├── verify-email/[token]/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/[token]/page.tsx
└── (authed)/
    ├── layout.tsx                     # sidebar + topbar + wallet switcher provider
    ├── page.tsx                       # dashboard (KPI Grid fixo)
    ├── carteiras/page.tsx             # lista
    ├── carteiras/[id]/page.tsx        # visão geral (tabs internas: só "Visão geral" na F1)
    └── ativos/[ticker]/page.tsx       # detalhe (hero do produto)

apps/web/components/
├── ui/                                # shadcn primitivos + extends
├── ui/charts/donut.tsx, sparkline.tsx, area.tsx
├── layout/
│   ├── sidebar.tsx                    # com wallet switcher
│   ├── topbar.tsx
│   ├── wallet-switcher.tsx
│   └── responsive-dialog.tsx          # dialog desktop / bottom sheet mobile
├── features/
│   ├── auth/
│   │   ├── signup-form.tsx
│   │   ├── login-form.tsx             # email+senha + divisor "ou" + Google/GitHub
│   │   ├── forgot-password-form.tsx
│   │   └── reset-password-form.tsx
│   ├── asset/
│   │   ├── candle-chart.tsx           # SVG próprio
│   │   ├── asset-icon.tsx             # cores fixas para ~10 tickers conhecidos
│   │   ├── asset-header.tsx
│   │   └── use-ohlc.ts
│   ├── ai-analyst/
│   │   ├── ai-analysis-card.tsx       # empty/loading/done states
│   │   └── use-asset-analysis.ts
│   ├── wallet/
│   │   ├── kpi-grid.tsx
│   │   ├── positions-table.tsx        # table desktop / cards mobile
│   │   ├── allocation-donut.tsx
│   │   ├── wallet-card-large.tsx
│   │   ├── create-wallet-dialog.tsx
│   │   ├── add-position-sheet.tsx
│   │   └── use-wallet-summary.ts
│   └── landing/                       # seções da landing
└── emails/                            # React Email templates (verify, reset, welcome)
```

---

## 7. Escopo F1 — critérios de aceitação

### 7.1 Telas entregues

1. Landing (hero editorial + feature strip + Como funciona + Cobertura + AI Showcase + Casos de uso + FAQ + CTA + Footer)
2. Login (email/senha + Google + GitHub)
3. Signup
4. Verify Email (página de confirmação por token)
5. Forgot password
6. Reset password
7. Dashboard / Visão geral autenticado (variante KPI Grid)
8. Carteiras / Lista
9. Carteira / Visão geral (apenas tab "Visão geral"; demais tabs como placeholder "em breve")
10. Detalhe do ativo (header + strip de stats + CandleChart + AIAnalysisCard nos três estados)
11. Configurações (apenas Conta + Idioma/Fuso)
12. Páginas de erro / not-found / loading globais

### 7.2 Critérios de aceitação

1. Usuário se cadastra com email/senha, recebe email de verificação via Resend, clica no link e cai no dashboard autenticado.
2. Login funciona pelos três caminhos: email/senha, Google, GitHub.
3. Fluxo de "esqueci a senha" envia email com link válido por 30min, troca a senha e invalida o token.
4. Cria uma carteira (nome + moeda + estratégia) via `<ResponsiveDialog>`.
5. Adiciona posições manuais (ticker validado no Yahoo + classe escolhida + qty + PM) via sheet/dialog responsivo.
6. Vê KPIs reais (patrimônio, P&L total, custo total, variação do dia) computados server-side.
7. Vê tabela de posições (desktop) ou cards empilhados (mobile) com cotação atual e P&L por linha.
8. Vê donut de alocação por classe.
9. Clica em um ticker → abre detalhe com `CandleChart` (tabs 7d/30d/6m/1a/5a) + stats do período.
10. Clica em "Analisar PETR4" → recebe `AIAnalysisCard` estruturado em ≤ 5s (com loading state e disclaimer).
11. Toggle de tema claro/escuro/sistema funciona em todas as telas.
12. **Todos os critérios 1-11 passam em viewport 375px sem rolagem horizontal.**
13. Coverage backend ≥ 70% nos módulos novos (`wallets`, `positions`, `market`, `ai-analyst`, `auth/credentials`, `auth/email-verification`, `email`); 100% em guards de ownership.
14. E2E Playwright (rodando em mobile **e** desktop): fluxo "signup → verify → login → criar carteira → adicionar posição → ver dashboard → analisar ativo".
15. Lighthouse mobile na landing ≥ 90 em Performance / Accessibility / Best Practices.
16. `scripts/i18n-check.ts` passa (zero key usada sem definição).

### 7.3 Cortado da F1 (vai para F2-F6)

Watchlist, Movimentações (drawer e tabela), Alocação target vs atual, Análise IA consolidada da carteira (relatório MD/PDF), Chat IA no detalhe do ativo, Importação CSV/B3, Tweaks/variantes (hero centro, dashboard editorial, sidebar compact), AssetIcon com cores fixas para mais que ~10 tickers conhecidos, Configurações seções Analista de IA / Notificações / Zona perigosa.

---

## 8. Roadmap detalhado F2-F6

### 8.1 F2 — Relatório consolidado IA + Watchlist

**Entrega:** usuário gera relatório consolidado da carteira em Markdown e PDF; mantém uma watchlist de ativos a observar sem precisar incluí-los em carteira.

**Schema:**

- `WatchlistItem { userId, ticker, createdAt }` com PK composta `(userId, ticker)`.
- `WalletReport { id, userId, walletId, markdown, generatedAt, promptVersion }`.

**Backend:**

- Novo módulo `analyst.wallet` com prompt `wallet.report.v1` (Markdown estruturado, formato do legacy ampliado com "Pontos fortes/atenção").
- Novo módulo `watchlist` (CRUD).
- Geração de PDF: portar `report_export.py` para Node — preferência por `@react-pdf/renderer` (ecossistema React) ou `puppeteer` em modo print (mais fiel mas pesado). **Decisão na spec-02.**
- Geração de relatório roda em job BullMQ (pode demorar 30s para 10 ativos).

**Frontend:**

- Tela Carteira → Análise IA (estados pronto / generating com `ReportSkeleton` / done com `ReportBody`).
- Tela Watchlist (tabela com sparkline 30d; cards em mobile).
- Botões de download `.md` e `.pdf` no estado done.

**Critério-chave:** relatório de 6 ativos gera em ≤ 30s, PDF baixável e visualmente próximo do Markdown renderizado.

---

### 8.2 F3 — Alocação target vs atual + variante editorial do dashboard

**Entrega:** usuário define percentuais alvo por classe e vê o gap entre atual e target; pode trocar entre dashboard KPI Grid e dashboard Editorial.

**Schema:** adiciona `targets Json?` em `Wallet` (`{ "acoes_br": 35, "etf": 20, ... }`).

**Backend:**

- `PATCH /wallets/:id/targets`.
- Endpoint de "plano sugerido" computa próximo aporte por classe a partir do gap (não usa IA na F3; é determinístico).

**Frontend:**

- Tela Carteira → Alocação (`AllocationRow` com barra horizontal + marcador vertical do target; card de plano sugerido com aspas serifadas).
- Variante editorial do dashboard (split com narrativa + área chart 90d + "02 · Alocação" + "03 · Posições").
- Painel Tweaks reativado (persistência em `localStorage`), exposto só em dev por feature flag.

**Crítico:** Tweaks **não** vão para produção como UI exposta a usuário final; é uma ferramenta interna de design QA.

---

### 8.3 F4 — Chat IA no detalhe do ativo

**Entrega:** usuário pergunta livremente sobre o ativo aberto e recebe resposta com streaming.

**Schema:** `AssetChatMessage { id, userId, ticker, role, content, createdAt }` com índice `(userId, ticker, createdAt)`.

**Backend:**

- Novo módulo `analyst.chat` com **stream de tokens via SSE** (não REST).
- Contexto = últimos 7 candles + análise IA mais recente daquele ticker (se houver).
- Novo prompt `asset.chat.v1` (free-form, system prompt restritivo, temperature 0.4).
- Rate limit dedicado: bucket `ai-chat` (50 mensagens/dia/usuário).

**Frontend:**

- `AssetChat` na coluna direita do detalhe do ativo (em desktop) ou bottom sheet em mobile.
- Typing indicator (3 dots pulsando).
- 3 sugestões iniciais (`Quais padrões aparecem?`, `Tem suporte forte?`, `Qual o maior risco?`).

**Risco:** custo. Mitigação: rate limit agressivo + janela de contexto pequena.

---

### 8.4 F5 — Movimentações (Movement-based domain)

**Entrega:** usuário registra histórico real de movimentações; `Position` passa a ser **calculada** a partir do histórico. Desbloqueia evolução temporal real do patrimônio.

**Schema novo:**

```prisma
model Movement {
  id        String       @id @default(cuid())
  walletId  String
  date      DateTime
  kind      MovementKind // COMPRA | VENDA | APORTE | DIVIDENDO
  ticker    String?
  qty       Float?
  price     Float?
  total     Float
  note      String?
  wallet    Wallet       @relation(fields: [walletId], references: [id], onDelete: Cascade)
  @@index([walletId, date])
}
enum MovementKind { COMPRA VENDA APORTE DIVIDENDO }
```

**Migração:**

- Script de migração converte cada `Position` existente em **1 `Movement` de tipo COMPRA** com `date = position.createdAt`, preservando qty/avgPrice como price.
- **Double-write** durante rollout: writes vão para Movement e Position em paralelo por N dias, com feature flag `movement_authoritative` controlando qual é fonte de verdade dos KPIs.
- Após estabilização, `Position` vira **view materializada** (ou tabela computada via trigger) — não mais entrada manual.
- Script reverso documentado.

**Frontend:**

- Tela Carteira → Movimentações (tabela com filtros Compras/Vendas/Aportes/Proventos + 4 stats; `AddMovementSheet` com tabs por tipo).
- Tela Dashboard ganha área chart de **Evolução do patrimônio** com tabs 7d/30d/6m/1a/5a (computa snapshots de qty + cotação histórica por data).

**Risco principal:** migração de dados. Mitigação: feature flag + script reversível + double-write + smoke test em staging por ≥ 3 dias antes de promover.

---

### 8.5 F6 — Importação CSV/Nota B3 + finalizações

**Entrega:** usuário importa histórico de movimentações via CSV ou nota de corretagem B3 (PDF). Configurações ganha seções restantes.

**Backend:**

- Wizard de importação em 3 passos (Origem / Revisar / Concluído).
- Parser CSV genérico (formato documentado: Data, ticker, qty, preço, tipo).
- Parser de nota B3 (PDF): roda em **worker BullMQ** porque é demorado; usa `pdf-parse` + heurísticas. **Avaliar na spec-06** se serviço externo (ex.: Pluggy, Investidor10) compensa o esforço de manter parser próprio.
- Re-uso do storage abstrato do template para armazenar o PDF original (R2 em prod, Volume em dev) por 30 dias.

**Frontend:**

- Wizard com stepper visual.
- Card de "Exemplo de leitura" mostrando tabela do que será importado antes de confirmar.
- Tela Configurações completa: Analista de IA (admin-only, gerencia prompts ativos), Notificações (4 toggles), Zona perigosa (Excluir conta).

**Risco:** parser de nota B3 quebra com mudanças de formato da corretora. Mitigação: parser por corretora (XP, Clear, Rico, Itaú, etc.) com fallback "não reconhecido → cole manualmente o texto".

---

### 8.6 Backlog pós-F6 (não comprometido)

- Comparador de ativos lado-a-lado
- Proventos timeline + projeção 12m
- Notícias / fatos relevantes (via API externa)
- Histórico de análises IA com revisita ("a IA acertou?")
- Onboarding interativo (tour da primeira sessão)
- Notificações push reais (web push API)
- Compartilhamento de relatório (link público read-only com expiração)
- Multi-moeda (dashboards em USD além de BRL)
- en-US ativo no i18n (estrutura já preparada desde F1)
- Quota/paywall para uso de IA
- BYOK opcional (usuário pluga a própria chave OpenAI para uso ilimitado)
- Open Banking / Brapi como provedor secundário de mercado

---

## 9. Riscos e mitigações (transversais ao roadmap)

| Risco                                       | Impacto                         | Mitigação                                                                                                           |
| ------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `yahoo-finance2` quebrar por scraping       | KPIs vazios, análises vazias    | Wrapper com fallback de período/alias do legacy; cache 5min agressivo; F2+ avaliar brapi.dev como secundário        |
| Custo OpenAI sem teto                       | $$ na fatura                    | F1 já com throttler bucket `ai-analyst` (20/dia/usuário); cache 1h em `AssetAnalysis`; F4 adiciona bucket `ai-chat` |
| Análise IA "alucinar" e dar conselho direto | Risco regulatório CVM           | Disclaimer fixo + system prompt restritivo + Zod schema sem campo "preço-alvo"                                      |
| Evolução do patrimônio sem dados históricos | Tela frustrante na F1           | Placeholder explícito ("Disponível após registrar movimentações" + CTA para F5); não interpolar                     |
| Migração `Position` → `Movement` em F5      | Quebra de dados                 | Feature flag + script reversível + double-write + smoke 3 dias                                                      |
| Deliverability de email (Resend)            | Usuário não recebe verify/reset | Domain auth (SPF/DKIM/DMARC) configurado dia 1; webhook de bounce monitorado; fallback: link manual no painel admin |
| Parser de nota B3 quebrar                   | Importação falha                | Parser por corretora + fallback manual; F6 pode adiar para serviço externo                                          |

---

## 10. Padrões compartilhados (todo o roadmap)

- **i18n:** toda string via `t('key')` com convenção `<feature>.<scope>.<key>`. Validação em CI.
- **Validação:** DTOs Nest com class-validator; schemas Zod em todo `generateObject` da IA.
- **Erros:** 4xx para validação (`BadRequest`, `NotFound`, `Forbidden`); 5xx só para falha de upstream (Yahoo, OpenAI, Resend); UI sempre tem fallback editorial pt-BR com CTA "Tentar de novo".
- **Mobile-first:** todo componente nasce em 375px. Playwright roda 2 viewports por fluxo.
- **Testes:** Jest no backend (foco em guards, KPI computation, market adapter); Vitest no frontend (componentes de domínio críticos); Playwright para fluxo principal por fase.
- **Commits/PRs:** conventional commits, squash and merge, uma fase = uma PR grande dividida em commits temáticos.
- **Sem hardcode de texto, sem chave no client, sem query sem ownership.** Reforçado em PR template.
- **Sem dados sensíveis em logs** — sem token, sem conteúdo bruto de documento, sem hash de senha.

---

## 11. Fluxo de entrega (CLAUDE.md — bloco a adicionar)

> Bloco abaixo será incorporado ao `CLAUDE.md` no primeiro commit da F1.

```markdown
## Fluxo de entrega

Toda implementação termina em PR contra a branch `staging` (não direto pra `main`).

### Branches e ambientes

- `main` — produção. Sempre deployable. Deploy automático no Railway (env de produção).
- `staging` — pré-produção. Alvo de todos os PRs de feature. Deploy automático no Railway (env de staging).
- `feat/*`, `fix/*`, `chore/*`, `refactor/*` — branches de trabalho, deletadas após merge.

### Requisitos para merge em staging

1. **CI verde obrigatório:** lint + typecheck + test (Jest+Vitest) + build + e2e (Playwright em mobile e desktop) + `scripts/i18n-check.ts` precisam passar.
   - Nenhum job pode estar `skipped` exceto por path filter justificado (ex.: docs-only).
   - `--no-verify` em hooks é proibido sem aprovação explícita.
2. **Revisão obrigatória** com classificação por severidade:
   - **P0** — bloqueador (bug, regressão, falha de segurança, contrato quebrado, falha de critério de aceitação). **Precisa ser resolvido antes do merge.**
   - **P1** — importante mas não bloqueia (refactor sugerido, melhoria de UX/perf). Vira issue ou commit follow-up; **não bloqueia merge**.
   - **P2** — nice-to-have / opinião / nit. Resolução opcional.
3. **Squash and merge** apenas. Mensagem final = título do PR (conventional commit).

### Promoção staging → main

Promoção é manual e periódica (não automática). Após smoke test em staging do fluxo coberto pela fase, abre-se um PR `staging → main` com o release notes. Mesmo gate de CI verde se aplica.
```

---

## 12. Próximos passos

1. **Aprovar este spec** (grill-me).
2. Abrir `spec-01-foundation-and-vertical-slice.md` com o plano de implementação detalhado da F1 (invocar `writing-plans` do superpowers).
3. Iniciar F1: setup do tema OpenClaw + fontes + i18n base + Resend + auth email/senha → seguindo os commits temáticos do plano.

---

## 13. Glossário

| Termo                     | Significado                                                                   |
| ------------------------- | ----------------------------------------------------------------------------- |
| Carteira (`Wallet`)       | Conjunto de ativos do usuário (ex.: "Principal", "Reserva")                   |
| Posição (`Position`)      | Holding atual de um ativo dentro de uma carteira (qty + avgPrice) — modelo F1 |
| Movimentação (`Movement`) | Evento histórico: compra, venda, aporte, provento — modelo F5+                |
| Aporte                    | Entrada de capital novo na carteira (TED, PIX)                                |
| Provento                  | Dividendo, JCP ou rendimento recebido                                         |
| PM                        | Preço médio (custo dividido por quantidade)                                   |
| P&L                       | Profit & Loss — diferença entre valor de mercado e custo                      |
| Target                    | Percentual desejado de cada classe na carteira                                |
| Gap                       | Diferença em pontos percentuais entre atual e target                          |
| OHLC                      | Open · High · Low · Close (dados de candle)                                   |
| Tendência                 | Direção predominante do preço (alta · baixa · lateral)                        |
| Confiança                 | Score 0–100% da segurança da análise IA                                       |
| P0/P1/P2                  | Severidade de comentário em PR — ver §11                                      |
| BYOK                      | Bring Your Own Key — usuário plugar própria chave OpenAI (backlog pós-F6)     |
