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
