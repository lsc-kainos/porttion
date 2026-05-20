# Porttion — Estrutura da Interface

> Spec detalhado da interface do **Porttion**, plataforma de análise de ativos com IA, construída sobre o `kainos-template-app` (Next.js 16 + shadcn/ui + Tailwind v4 + NextAuth + Prisma).

---

## 1. Filosofia de design

### 1.1 Premissas

- **Público:** investidor pessoa física iniciante — entende dinheiro, mas não trade.
- **Princípio editorial:** o produto soa como **carta**, não como terminal. Há um sotaque de revista de finanças sóbria.
- **Densidade controlada:** mais leitura do que dado. Números grandes em mono; texto em sans com leading folgado.
- **IA como voz, não como caixa preta:** toda análise vem com tendência, recomendação, **confiança em %**, justificativa rastreável e disclaimer CVM-friendly.
- **Carteira como unidade mental:** o usuário pensa em "Principal", "Reserva" — não em "ativos no Porttion". Por isso o switcher de carteira é o primeiro elemento da sidebar.

### 1.2 Tom visual (resumido)

| Atributo    | Decisão                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Densidade   | Média-baixa. Cards generosos.                                                                                     |
| Cor         | Monocromática (grayscale) + 1 acento (azul vívido em dark mode).                                                  |
| Tipografia  | **Inter** (UI) + **Instrument Serif** itálico (sotaque editorial) + **JetBrains Mono** (números, tickers, datas). |
| Iconografia | Lucide-style stroke 1.5. Nunca cheia.                                                                             |
| Bordas      | Radius 0.625rem (10px).                                                                                           |
| Sombras     | Sutis (`--shadow-sm` mais usado).                                                                                 |
| Background  | `oklch(1 0 0)` (light) / `oklch(0 0 0)` (dark). Sidebar levemente diferente para criar plano.                     |

---

## 2. Design system

### 2.1 Origem

- **Tema:** OpenClaw (via tweakcn) — paleta zinc com acentos azuis na escala de chart.
- **Estendido com:** `--success`, `--warning`, `--border-strong`, `--success-muted`, `--warning-muted`, `--danger-muted` (do template Kainos). Usados em badges Comprar / Manter / Não comprar.

### 2.2 Tokens (CSS variables)

#### Cores semânticas

```
--background     fundo principal
--foreground     texto principal
--card           fundo de cards (levemente diferente em dark)
--popover        fundo de dropdowns / tooltips
--primary        cor de ação (preto em light, azul vívido em dark)
--secondary      botões secundários, badges neutros
--muted          superfícies abafadas (toolbars, headers de tabela)
--accent         hover de sidebar
--destructive    delete / vermelho
--border         linhas finas
--border-strong  bordas de divisão importante
--input          borda de inputs
--ring           focus ring
--sidebar*       variantes para o painel lateral
```

#### Estendidos (badges)

```
--success / --success-muted / --success-muted-foreground
--warning / --warning-muted / --warning-muted-foreground
--danger-muted / --danger-muted-foreground
```

#### Chart palette (sequencial azul)

```
--chart-1  oklch(0.81 0.10 252)   light blue
--chart-2  oklch(0.62 0.19 260)
--chart-3  oklch(0.55 0.22 263)
--chart-4  oklch(0.49 0.22 264)
--chart-5  oklch(0.42 0.18 266)   deep indigo
```

#### Tipografia

```
--font-sans    Inter
--font-serif   Instrument Serif (italic, 400)
--font-mono    JetBrains Mono
```

### 2.3 Tipografia (escala efetiva)

| Uso                  | Tamanho   | Peso    | Família        | Tracking |
| -------------------- | --------- | ------- | -------------- | -------- |
| H1 landing           | 42–68px   | 500     | sans           | -0.02em  |
| H2 sections          | 30–44px   | 500     | sans           | -0.02em  |
| H3 cards             | 18–20px   | 500     | sans           | -0.01em  |
| Patrimônio (hero)    | 40–60px   | normal  | **mono**       | tnum     |
| KPI value            | 22–24px   | 600     | mono           | tnum     |
| Body                 | 13.5–14px | 400     | sans           | normal   |
| Caption              | 12–12.5px | 400     | sans           | normal   |
| Eyebrow              | 11px      | 500     | sans uppercase | 0.14em   |
| Mono inline (ticker) | 12–14px   | 500–600 | mono           | -0.01em  |

**Itálico serifado** é reservado a:

1. Palavras-chave nos headlines da landing (`acontecendo`, `história`, `porquê`)
2. Aspas em citações da IA (`"Sequência de fechamentos acima da MM21..."`)
3. Saudação humanizada (`Bom dia, Alex.`)
4. Marcadores numéricos (`02 · Alocação`)

### 2.4 Componentes (shadcn-inspirados)

Localização no template: `apps/web/components/ui/`.

| Componente                                | Variantes                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `Button`                                  | default · outline · ghost · secondary · link · destructive · sizes sm/md/lg/icon |
| `Badge`                                   | default · outline · success · warning · danger · primary                         |
| `Card`                                    | header · title · desc · content · footer                                         |
| `Input` / `Textarea` / `Label` / `Select` | shadow-sm, focus-ring, h-9                                                       |
| `Tabs`                                    | inline (segmented control) · size sm/md                                          |
| `Separator`                               | horizontal · vertical                                                            |
| `Avatar`                                  | with src / fallback                                                              |
| `Sidebar`                                 | from shadcn `/docs/components/sidebar`                                           |
| `Sheet`                                   | drawer (usado em Nova movimentação)                                              |
| `Dialog`                                  | modal centralizado (Nova carteira)                                               |

#### Widgets de domínio (criados especificamente)

| Widget            | Propósito                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `AssetIcon`       | Quadrado colorido com 2 chars do ticker — cores fixas para tickers conhecidos (PETR4 verde Petrobras, BTC laranja, ETH cinza, etc.) |
| `KPI` / `KpiCard` | Eyebrow + valor mono + delta (up/down/flat) + hint                                                                                  |
| `Sparkline`       | Mini line chart com auto-color (sobe verde, desce vermelho)                                                                         |
| `CandleChart`     | SVG com crosshair, tooltip OHLCV, volume opcional, grid pontilhado                                                                  |
| `AreaChart`       | Linha + fill leve, hover dot, tooltip                                                                                               |
| `Donut`           | Anel com slices coloridos (`--chart-1`...`--chart-5`) e label central                                                               |
| `AllocationRow`   | Barra horizontal com marcador de target vs atual                                                                                    |
| `AssetChat`       | Chat bubble com typing indicator e perguntas sugeridas                                                                              |
| `AIAnalysisCard`  | Card de análise IA estruturado (tendência · confiança · padrões · riscos · sugestão)                                                |

---

## 3. Arquitetura da informação

### 3.1 Rotas

```
PÚBLICO
├─ /                              Landing
└─ /login                         Login (Google / GitHub)

AUTENTICADO (sidebar layout)
├─ /                              Dashboard / Visão geral
├─ /ativos                        Buscar / explorar ativos
├─ /ativos/:ticker                Detalhe do ativo
├─ /watchlist                     Watchlist
├─ /carteiras                     Lista de carteiras
├─ /carteiras/:id                 Visão geral da carteira
├─ /carteiras/:id/movimentacoes   Movimentações (+ drawer de Nova)
├─ /carteiras/:id/alocacao        Target vs atual (rebalanceamento)
├─ /carteiras/:id/analise         Análise IA da carteira
├─ /carteiras/:id/importar        Wizard de importação
└─ /configuracoes                 Configurações
```

### 3.2 Sidebar (grupos)

```
[Logo Porttion]
─────────────────────
[Carteira ativa: Principal ⌄]   ← switcher destacado
─────────────────────
GERAL
└ Visão geral

ANÁLISE
├ Buscar ativos
└ Watchlist

CARTEIRAS
├ Minhas carteiras           [3]
├ Visão geral
├ Movimentações
├ Alocação
├ Análise IA
└ Importar

SISTEMA
└ Configurações
─────────────────────
[⌧ Recolher] [Avatar — Alex Souza]
```

- Item ativo: barra fina à esquerda + bg accent
- Sidebar **colapsável** (Tweaks → Sidebar): expanded 252px / compact 68px (só ícones)
- Em mobile (`< 768px`): hidden, abre via Sheet a partir do hamburger no topbar

### 3.3 Topbar (autenticado)

```
[☰ menu*]   [breadcrumb        ]   [☀/☾/▢]   [🔔]
            [PÁGINA TÍTULO     ]
```

\*mobile only

- **Theme switch**: 3 botões compactos (Claro / Escuro / Sistema) em segmented control
- Notificações: ícone sem badge na fidelidade atual (apenas placeholder)

---

## 4. Telas — descrição detalhada

### 4.1 Landing (`/`)

**Estrutura vertical** (rolagem longa, "infinita"):

#### Header sticky

- Logo + nav (Recursos · Como funciona · Casos de uso · FAQ) + Theme switch + `Entrar` + `Acessar dashboard`

#### Hero — variante A: Editorial (default)

- **Coluna esquerda** (1.05fr):
  - Eyebrow `01 ─── ANÁLISE DE ATIVOS COM IA`
  - H1: "Entenda o que está **acontecendo\*** com a sua carteira." (\*itálico serifado)
  - Subcopy explicando ativos cobertos e voz da IA
  - 2 CTAs: `Começar grátis` (primary) + `Ver uma carteira de exemplo` (outline)
  - 3 selos: sem cartão · importa nota da B3 · dados Yahoo Finance
- **Coluna direita** (1fr):
  - Mockup de janela do app (`porttion.app/ativos/PETR4`) com:
    - Header do ativo PETR4 + badge Alta
    - Candle chart de 30 dias real
    - Card IA: ícone cérebro + eyebrow ANALISTA DE IA + badge Comprar + citação serifada + barra de confiança 78%
  - 2 floating chips: `7d · 30d · 6m · 1a · 5a` (top-right), `dados Yahoo Finance` (bottom-left)

#### Hero — variante B: Centralizado

- **Backdrop de dados**: grid 6×4 de sparklines em opacidade 8%
- Eyebrow centralizado: `✦ Lançamento · v1`
- H1 maior centralizado: "Sua carteira tem uma **história**. A gente te ajuda a lê-la."
- 2 CTAs centralizados
- 3 stats grandes em mono: `5 classes` · `78% confiança` · `<3s análise`

#### Feature strip

4 colunas com ícone + label + 1 linha:

- Candles ajustáveis · Análise IA · Múltiplas carteiras · Rebalanceamento

#### Como funciona

4 passos numerados (01–04) com border-top, eyebrow PASSO, título grande, descrição:

1. Crie sua carteira
2. Adicione ativos e movimentações
3. Veja o gráfico e peça uma leitura
4. Receba o relatório consolidado

#### Cobertura (Asset classes)

5 cards (Ações B3 · ETFs · Renda Fixa · Cripto · Moedas) com ícone, label e exemplos em mono.

#### AI Showcase

- Esquerda: copy explicando o analista de IA (4 bullets com check verde)
- Direita: card grande de análise IA exemplificando VALE3 (tendência Alta, confiança 71%, justificativa serifada, padrões em tags, disclaimer)

#### Casos de uso

3 cards com:

- Badge do perfil (Iniciante · Organizador · Disciplinado)
- Número (01/02/03)
- Título
- Descrição
- 3 pontos com check

#### FAQ

5 perguntas em acordeão minimal (border-bottom, número 01–05, chevron rotativo):

1. O Porttion dá recomendação de investimento?
2. De onde vêm os preços?
3. Posso importar nota de corretagem?
4. Meus dados ficam onde?
5. Posso usar para cripto e dólar?

#### CTA final

Card grande com headline "Tem uma carteira pra _contar_." + 2 CTAs.

#### Footer

4 colunas: Brand · Produto · Recursos · Legal. Linha final com copyright + build version mono.

---

### 4.2 Login (`/login`)

Layout **split duas colunas** (lg+):

- **Esquerda** (editorial, escondida em mobile):
  - Logo Porttion no topo
  - Backdrop de sparklines em opacidade 5%
  - Eyebrow `Bem-vindo de volta`
  - H1: "Sua carteira _já está te esperando_."
  - Subcopy
  - Versão `v1.0 · construído com Kainos Template` em mono no rodapé
- **Direita** (card de auth):
  - Logo (apenas mobile)
  - H2 `Entrar`
  - Subcopy curta
  - `Continuar com Google` (outline, ícone Google)
  - `Continuar com GitHub` (outline, ícone GitHub)
  - Footer com 3 links: Termos · Privacidade · LGPD
  - Link "← Voltar para a landing"

> **Reaproveitamento do template:** copy/layout segue exatamente o padrão de `apps/web/components/features/login/login.tsx`, com adaptação de copy para o tom Porttion.

---

### 4.3 Dashboard / Visão geral (`/`) — autenticado

#### Variante A: KPI Grid (default)

1. **Hero row**
   - Eyebrow: `CARTEIRA PRINCIPAL · BRL`
   - H2: `Bom dia, *Alex*.`
   - "Sua carteira tem 6 ativos · atualizado há 2 min"
   - CTAs: `Alocação` · `Nova movimentação` · `Análise IA` (primary)

2. **4 KPIs em grid**
   - Patrimônio total
   - P&L total
   - Custo total
   - Variação do dia

3. **2 cards lado a lado** (1.55fr + 1fr)
   - **Evolução do patrimônio** (área chart) com tabs `7d 30d 6m 1a 5a`
   - **Alocação por classe** (donut + legenda com %)

4. **2 cards lado a lado** (1.55fr + 1fr)
   - **Posições** (tabela com Ativo, Qtd, PM, Cotação, Valor, P&L, %) — clicável
   - **Atividade recente** (últimas 5 movimentações com badge de tipo)

5. **AI Insight banner**
   - Card gradient com cérebro
   - "IVVB11 está abaixo do seu target em 4 p.p. · _considere aporte direcionado_."
   - CTA `Ver relatório`

6. **Watchlist preview**
   - 5 cards mini com ticker + nome + preço + variação + sparkline

#### Variante B: Editorial

1. **Hero editorial split**
   - Esquerda: eyebrow + frase narrativa ("Sua carteira fechou ontem em alta de **+0,42%**. Está acima da média móvel...") + patrimônio gigante 60px mono + 3 stats inline (P&L, Variação, Hoje) + 2 CTAs
   - Direita: card com AreaChart 90 dias

2. **02 · Alocação** (split)
   - Esquerda: marcador numérico, headline "Onde está _o dinheiro_", parágrafo
   - Direita: barras horizontais por classe com %, valor e cor do chart

3. **03 · Posições** (split)
   - Esquerda: marcador numérico, headline "Os ativos _por dentro_"
   - Direita: tabela de posições

4. **AI Insight banner**

---

### 4.4 Buscar ativos (`/ativos`)

- Hero compacto com headline "Encontre _qualquer ativo_"
- Linha de busca:
  - Input com ícone de lupa, placeholder com exemplos
  - Tabs de filtro por classe: Todos · Ações · ETFs · R. Fixa · Cripto · Moedas
- Grid de cards (3 colunas em lg):
  - AssetIcon + ticker + badge da classe
  - Nome
  - Preço grande em mono
  - Variação do dia
  - Sparkline 30d
- Empty state se a busca não retorna nada

---

### 4.5 Detalhe do ativo (`/ativos/:ticker`) — **tela hero do produto**

#### Header de ativo

- AssetIcon 56px
- Ticker em mono 28px + 2 badges (classe + setor)
- Preço grande mono 32px + variação do dia inline + nome do ativo em mono
- 2 botões: `★ Watchlist` · `+ Adicionar à carteira`

#### Strip de stats do período (5 boxes)

- Variação do período · Máxima · Mínima · Amplitude · Volume médio

#### Card principal — CandleChart

- Tabs `7d 30d 6m 1a 5a`
- Candle interativo:
  - Hover: linha vertical pontilhada + tooltip com OHLCV
  - Candle verde (close ≥ open) ou vermelho
  - Eixo Y direito com preços
  - Eixo X com datas em mono
  - Volume bars opacidade 50% abaixo

#### Linha "Análise + Chat" (1.3fr + 1fr)

##### Análise IA — **estado vazio**

Card centralizado com:

- Ícone cérebro grande
- Headline "Peça uma leitura ao analista de IA"
- Subcopy explicando
- CTA `✦ Analisar PETR4`
- Caption mono: `Custa ~150 tokens · GPT-4o-mini`

##### Análise IA — **loading**

- Botão muda para `● Analisando D-7...` com dot pulsante

##### Análise IA — **estado preenchido**

Card com:

- Header: ícone cérebro + "Análise · 30d · D-7" + caption "gerado pela IA · 14:32" + badge Comprar/Manter/Não comprar (cor varia)
- 3 colunas: Tendência (com ícone trend) · Confiança (barra + %) · Horizonte (1–2 sem.)
- Separator
- **Justificativa** com aspas serifadas: `"Sequência de fechamentos acima da MM21..."`
- **Padrões detectados** — badges outline (Engolfo de alta · Volume crescente)
- **Riscos** — badges warning (Volatilidade do petróleo)
- **Sugestão** — texto livre
- Disclaimer no rodapé: `ⓘ Análise técnica · não constitui recomendação de investimento.`

##### Chat com IA (coluna direita)

Card 680px de altura:

- Header: ícone sparkles + "Pergunte à IA · {ticker}" + caption "contexto: últimos 7 candles"
- Histórico de mensagens:
  - User: bubble cinza à direita com initials
  - IA: bubble cinza à esquerda com ícone cérebro
  - Typing indicator: 3 dots pulsando em sequência
- Linha de sugestões: 3 botões outline pequenos
  - `Quais padrões aparecem?` · `Tem suporte forte?` · `Qual o maior risco?`
- Input + botão send

---

### 4.6 Watchlist (`/watchlist`)

- Hero: "Ativos que você _observa_"
- Botão `+ Adicionar ativo`
- Tabela completa:
  - Ativo (icon + ticker + nome)
  - Preço
  - Variação hoje (colorido)
  - 30 dias (colorido)
  - Sparkline 30d
  - Chevron à direita
- Linhas clicáveis → detalhe do ativo

---

### 4.7 Carteiras — Lista (`/carteiras`)

- Hero: "Suas carteiras _por estratégia_"
- CTA `+ Nova carteira` abre `CreateWalletDialog`
- Grid 3 colunas de **WalletCardLarge**:
  - Mini quadrado colorido (chart-1/2/4) + eyebrow `BRL · desde 2024-03`
  - Nome em 18px
  - Patrimônio grande em mono
  - Variação total
  - Sparkline 30d colorida
  - Footer: contagem de posições + P&L total
- Card final: `+ Criar nova carteira` (dashed border, empty state CTA)

#### CreateWalletDialog

- Input Nome
- Select Moeda base (BRL/USD/EUR)
- Select Estratégia (Balanceada/Crescimento/Renda/Personalizada)
- Hint sobre target inicial
- 2 botões: Cancelar · Criar carteira

---

### 4.8 Carteira — Visão geral (`/carteiras/:id`)

#### Tabs internas (sticky no topo)

`Visão geral` · `Movimentações` · `Alocação` · `Análise IA` · `Importar`

#### Hero da carteira

- Eyebrow `Patrimônio total · BRL`
- Valor gigante 40–52px mono
- P&L em mono colorido + "(vs custo de R$ 54.470,30)"
- CTAs: `Importar` · `Nova movimentação`

#### 4 KPIs

Variação do dia · Posições · Classes · Maior posição

#### Evolução + Alocação (mesmo layout do dashboard)

#### Tabela de posições (mesmo widget)

---

### 4.9 Carteira — Movimentações (`/carteiras/:id/movimentacoes`)

- Tabs internas
- Hero: "{N} registros" + CTAs `Exportar CSV` · `Nova movimentação`
- 4 stats: Compras · Vendas · Aportes · Proventos
- Filtros: Todas · Compras · Vendas · Aportes · Proventos
- Tabela:
  - Data (mono)
  - Tipo (badge colorido)
  - Ativo (icon + ticker)
  - Qtd
  - Preço
  - Total

#### AddMovementSheet (drawer da direita)

Largura 440px:

- Header: eyebrow + título + close
- Tabs de tipo: Compra · Venda · Aporte · Provento
- Campos condicionais por tipo:
  - **Compra/Venda**: Ativo (select), Qtd, Preço, Data, Nota → mostra Total calculado
  - **Aporte**: Valor (R$), Data, Nota
  - **Provento**: Ativo, Qtd, Valor total, Data, Nota
- Footer com Cancelar · Salvar

---

### 4.10 Carteira — Alocação (`/carteiras/:id/alocacao`)

Split 1fr + 1.4fr:

- **Esquerda**:
  - Eyebrow "Alocação · Target vs atual"
  - Headline "Onde rebalancear _no próximo aporte_"
  - Card de plano sugerido com aspas serifadas
- **Direita**:
  - CardTitle "Comparativo por classe"
  - Botão `Editar targets`
  - Linhas (uma por classe):
    - Label + atual % + target % + Badge de gap em p.p. (success/warning/danger)
    - Barra horizontal com fill do atual + marcador vertical do target

---

### 4.11 Carteira — Análise IA (`/carteiras/:id/analise`)

#### Estado: pronto

- Hero: "O relatório completo da _sua carteira_"
- 4 KPIs: Ativos analisados · Sinal Comprar · Sinal Manter/Não · Última geração
- Banner gradient: ícone cérebro + headline "Gerar relatório consolidado" + CTA `✦ Gerar relatório`

#### Estado: generating

- Banner muda para `● Analisando...`
- Card abaixo mostra **ReportSkeleton**: linhas cinza pulsando

#### Estado: done

- Banner muda para 2 botões `↓ .md` `↓ .pdf`
- Card abaixo mostra **ReportBody**:
  - Header: eyebrow + "Carteira Principal · 15 de maio de 2026" + badge "✦ gerado por IA"
  - `## Resumo executivo` — 4 bullets com seta mono
  - `## Visão consolidada` — parágrafo
  - `### Pontos fortes` (3 ítems com check verde)
  - `### Pontos de atenção` (2 ítems com info amarelo)
  - `## Tabela por ativo` (Ativo · Tendência · Recomendação · Var 7d · Fech. atual)
  - `## Plano de acompanhamento` — lista ordenada
  - Footer mono: "Modelo: gpt-4o-mini · prompt v3"

---

### 4.12 Carteira — Importar (`/carteiras/:id/importar`)

Wizard de 3 passos:

#### Stepper visual

`1. Origem` ─── `2. Revisar` ─── `3. Concluído`

#### Passo 1: Origem

3 cards:

- **CSV genérico** (Data, ticker, qtd, preço, tipo)
- **Nota da B3** (PDF de nota de corretagem)
- **Manual** (uma operação por vez)

#### Passo 2: Revisar

- Drop zone com dashed border e ícone upload + CTA `Selecionar arquivo`
- Card de "Exemplo de leitura" com tabela mostrando o que seria importado
- Badge `7 operações reconhecidas`
- Footer: Voltar · Confirmar importação

#### Passo 3: Concluído

Card centralizado:

- Círculo verde com check
- "7 movimentações importadas"
- "Tudo já está na sua carteira"
- 2 botões: Importar mais · Ver movimentações

---

### 4.13 Configurações (`/configuracoes`)

Página simples, max-width 768px:

#### Conta

- Avatar + nome + email + botão Editar perfil
- Idioma (select pt-BR) + Fuso horário

#### Analista de IA

- Modelo (select: gpt-4o-mini / gpt-4o / gpt-5)
- OpenAI API key (password input em mono)
- Estratégia de persistência (tabs: LocalStorage / Sessão / Arquivo)

#### Notificações

4 toggles:

- Variação maior que 5% em um ativo
- Análise IA concluída
- Aporte mensal não realizado
- Resumo semanal por email

#### Zona perigosa

- "Excluir conta" em vermelho

---

## 5. Variações expostas via Tweaks

Painel flutuante (canto inferior direito) — controla:

| Tweak               | Valores                         | Default   |
| ------------------- | ------------------------------- | --------- |
| **Tema**            | Claro / Escuro / Auto (sistema) | Auto      |
| **Hero da landing** | Editorial / Centro              | Editorial |
| **Dashboard**       | KPI Grid / Editorial            | KPI Grid  |
| **Sidebar**         | Expand. / Compact.              | Expand.   |

Cada mudança é persistida no bloco `EDITMODE` do `app.jsx` (live, sem reload).

---

## 6. Padrões compartilhados

### 6.1 Empty states

- Carteira vazia → "Adicione ativos na página Carteira para iniciar a análise."
- Busca vazia → "Nenhum ativo encontrado para "{q}". Tente outro ticker."
- Watchlist vazia → CTA `+ Adicionar ativo`
- Análise IA não gerada → CTA `+ Analisar {ticker}`

### 6.2 Loading

- Spinner pulsante (dot animado) em botões durante async
- Skeleton (linhas cinza com pulse) para o relatório IA
- Typing indicator no chat (3 dots em sequência)

### 6.3 Cores semânticas

| Situação                              | Cor                                     |
| ------------------------------------- | --------------------------------------- |
| Compra · sinal positivo · valorização | `--success` (verde)                     |
| Manter · lateral · neutro             | `--warning` (âmbar)                     |
| Não comprar · desvalorização · venda  | `--destructive` (vermelho)              |
| Aporte · provento                     | `--success` (verde)                     |
| Saída de capital · venda              | `--destructive` (vermelho)              |
| Recomendações IA                      | badges `success` / `warning` / `danger` |
| Gap de alocação (acima do target)     | warning                                 |
| Gap de alocação (abaixo do target)    | danger                                  |
| Gap próximo de zero (<1 p.p.)         | success                                 |

### 6.4 Animações

- Fade-up nas seções do hero da landing (delay escalonado: 0ms · 300ms · 500ms · 700ms · 900ms)
- Slide-in-right no drawer de Nova movimentação (220ms)
- Pulse no typing indicator (steps)
- Transição suave (200ms ease-out) em todos os botões/inputs/links
- Hover em cards: shadow-md + border-strong

---

## 7. Mapping para o template Kainos

| Elemento Porttion           | Onde mora no template                                                 |
| --------------------------- | --------------------------------------------------------------------- |
| Tokens CSS (OpenClaw)       | `apps/web/app/globals.css` (substitui paleta zinc)                    |
| Sidebar shadcn              | `apps/web/components/layout/sidebar.tsx` (a criar — não existe ainda) |
| Topbar                      | `apps/web/components/layout/topbar.tsx` (existe, adaptar)             |
| Login                       | `apps/web/components/features/login/login.tsx` (existe, adaptar copy) |
| Landing                     | `apps/web/app/(public)/page.tsx` (a criar — rota `(public)`)          |
| Dashboard                   | `apps/web/app/(authed)/page.tsx` (existe stub)                        |
| Detalhe ativo               | `apps/web/app/(authed)/ativos/[ticker]/page.tsx`                      |
| Carteiras                   | `apps/web/app/(authed)/carteiras/...` (subárvore inteira)             |
| Configurações               | `apps/web/app/(authed)/configuracoes/page.tsx`                        |
| AssetChat, AIAnalysisCard   | `apps/web/components/features/ai-analyst/...`                         |
| CandleChart                 | `apps/web/components/features/asset/candle-chart.tsx`                 |
| Donut, AreaChart, Sparkline | `apps/web/components/ui/charts/...`                                   |

### 7.1 Backend (NestJS)

Módulos novos a criar em `apps/api/src/`:

- `assets/` — busca, OHLC via yfinance, validação de ticker
- `wallets/` — CRUD de carteira (ownership scope por userId)
- `movements/` — CRUD de movimentação + importação CSV/PDF
- `ai-analyst/` — usa `ai-runtime` existente, prompts versionados (`asset.analysis.v1`, `wallet.report.v1`)
- `watchlist/` — tabela simples user × ticker

### 7.2 Prisma schema (adições)

```
model Wallet {
  id           String   @id @default(cuid())
  userId       String
  name         String
  baseCurrency String   @default("BRL")
  createdAt    DateTime @default(now())
  movements    Movement[]
  targets      Json?    // { "Ações BR": 35, ... }
  User         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Movement {
  id        String   @id @default(cuid())
  walletId  String
  date      DateTime
  kind      MovementKind   // COMPRA, VENDA, APORTE, DIVIDENDO
  ticker    String?
  qty       Float?
  price     Float?
  total     Float
  note      String?
  Wallet    Wallet   @relation(fields: [walletId], references: [id], onDelete: Cascade)
}

model WatchlistItem {
  userId String
  ticker String
  @@id([userId, ticker])
}
```

### 7.3 LLM prompts (via `ai-runtime`)

- `asset.analysis.v1` → retorna JSON `{ tendencia, recomendacao, confianca, padroes[], riscos[], sugestao, justificativa }`
- `wallet.report.v1` → retorna Markdown completo (resumo · visão · pontos fortes/atenção · tabela · plano · conclusão)
- `asset.chat.v1` → free-form chat com contexto de últimos 7 candles

---

## 8. Acessibilidade e responsividade

### 8.1 Breakpoints (Tailwind defaults)

- `sm` 640px — single column transitions to dual
- `md` 768px — sidebar aparece, hero editorial vira split
- `lg` 1024px — todas as grids 3-4 colunas habilitam

### 8.2 Garantias

- Focus ring visível (`--ring`) em todos os elementos focáveis
- Hit targets ≥ 44px em mobile (botões herdam `min-height: 44px` em `< 768px`)
- Cores de status acompanhadas de ícone (não dependem só da cor)
- Contraste AA em todos os pares texto/fundo (light e dark)
- Tabular numbers (`tnum`) em todos os números — colunas alinham
- Lang `pt-BR` na raiz

### 8.3 Não cobertos nesta fidelidade

- Screen reader labels custom além do `aria-label` óbvio
- Reduced motion preference (todas as animações são curtas e não-essenciais — toleráveis sem opt-out)

---

## 9. Roadmap após esta fidelidade

### 9.1 Cortado por escopo

- Comparador de ativos lado-a-lado
- Proventos timeline + projeção 12m
- Notícias / fatos relevantes
- Histórico de análises IA (revisita 30 dias depois — "a IA acertou?")
- Empty states mais ilustrativos
- Mobile dedicado (atualmente responsivo, mas iniciante é mobile-first)
- Onboarding interativo (tour da primeira sessão)
- Notificações push reais
- Compartilhamento de relatório (link público read-only)

### 9.2 Decisões em aberto

- **Paywall**: Free vs Pro? Limitar análises IA por mês?
- **Multi-moeda**: dashboards em USD ou só BRL?
- **Open Banking / Brapi**: integrar pra atualização automática de posições?
- **Notas fiscais B3**: parser próprio ou serviço externo?

---

## 10. Glossário rápido

| Termo        | Significado                                                         |
| ------------ | ------------------------------------------------------------------- |
| Carteira     | Conjunto de ativos do usuário (ex.: "Principal", "Reserva")         |
| Posição      | Holding atual de um ativo dentro de uma carteira (qty + PM + valor) |
| Movimentação | Evento histórico: compra, venda, aporte, provento                   |
| Aporte       | Entrada de capital novo na carteira (TED, PIX)                      |
| Provento     | Dividendo, JCP ou rendimento recebido                               |
| PM           | Preço médio (custo dividido por quantidade)                         |
| P&L          | Profit & Loss — diferença entre valor de mercado e custo            |
| Target       | Percentual desejado de cada classe na carteira                      |
| Gap          | Diferença em pontos percentuais entre atual e target                |
| OHLC         | Open · High · Low · Close (dados de candle)                         |
| MM21 / MM50  | Médias móveis de 21 / 50 dias                                       |
| Tendência    | Direção predominante do preço (alta · baixa · lateral)              |
| Confiança    | Score 0–100% da segurança da análise IA                             |

---

_Documento gerado em 15 de maio de 2026 · Porttion v1 · Kainos Labs_
