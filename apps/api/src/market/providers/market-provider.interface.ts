import type {
  Candle,
  MarketAsset,
  OhlcPeriod,
  Quote,
} from '@kainos/shared-types';

export const MARKET_PROVIDER = Symbol('MARKET_PROVIDER');

// Contrato baixo-nível pra fontes de market data (Yahoo, BRAPI, etc).
// Providers fazem fetch cru — não cacheiam e não traduzem erro pra HTTP.
//
// Convenção de erros:
// - "Não encontrado" / "sem matches": retorne valor vazio (`[]`, `null`, mapa
//   com `null`s). Cliente decide se é 404, 422 ou só lista vazia.
// - Falha upstream (rede, 5xx, rate-limit, auth/crumb): lance Error. O
//   MarketService traduz pra ServiceUnavailableException(503).
export interface MarketProvider {
  readonly name: string;
  search(q: string, limit: number): Promise<MarketAsset[]>;
  quote(ticker: string): Promise<Quote | null>;
  quoteMany(tickers: string[]): Promise<Map<string, Quote | null>>;
  ohlc(ticker: string, period: OhlcPeriod): Promise<Candle[]>;
}
