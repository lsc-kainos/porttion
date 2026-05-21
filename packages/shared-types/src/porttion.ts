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
