import { Injectable, Logger } from '@nestjs/common';
import yahooFinanceRaw from 'yahoo-finance2';
import type {
  Candle,
  MarketAsset,
  OhlcPeriod,
  Quote,
} from '@kainos/shared-types';
import { inferAssetClass, toYahooSymbol } from '../yahoo-symbol';
import type { MarketProvider } from './market-provider.interface';

type YfClient = {
  search(
    q: string,
    opts?: Record<string, unknown>,
  ): Promise<{ quotes?: unknown[] }>;
  quote(symbol: string | string[]): Promise<unknown>;
  historical(
    symbol: string,
    opts?: Record<string, unknown>,
  ): Promise<unknown[]>;
};

// yahoo-finance2 é ESM; importamos normalmente e fazemos cast pra uma
// interface estável (sobrecargas condicionais do tipo original quebram
// type-checks em consumidores).
const yf = yahooFinanceRaw as unknown as YfClient;

@Injectable()
export class YahooProvider implements MarketProvider {
  readonly name = 'yahoo';
  private readonly logger = new Logger(YahooProvider.name);

  async search(q: string, limit: number): Promise<MarketAsset[]> {
    const res = await yf.search(q, { newsCount: 0 });
    type QuoteItem = {
      symbol?: string;
      shortname?: string;
      longname?: string;
      quoteType?: string;
      exchange?: string;
    };
    const rawQuotes = (res.quotes ?? []).map((x) => x as QuoteItem);
    return rawQuotes
      .filter(
        (it): it is QuoteItem & { symbol: string } =>
          typeof it.symbol === 'string',
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
          assetClass: inferAssetClass(ticker, {
            quoteType: it.quoteType,
            exchange: it.exchange,
          }),
          exchange: it.exchange ?? null,
        };
      });
  }

  async quote(ticker: string): Promise<Quote | null> {
    const symbol = toYahooSymbol(ticker.toUpperCase());
    const raw = await yf.quote(symbol);
    return this.parseQuote(ticker.toUpperCase(), raw);
  }

  async quoteMany(tickers: string[]): Promise<Map<string, Quote | null>> {
    const out = new Map<string, Quote | null>();
    if (tickers.length === 0) return out;
    const symbols = tickers.map((t) => toYahooSymbol(t.toUpperCase()));
    const res = await yf.quote(symbols);
    const arr = Array.isArray(res) ? res : [res];
    const bySymbol = new Map<string, unknown>();
    for (const item of arr) {
      const sym = (item as { symbol?: string }).symbol;
      if (sym) bySymbol.set(sym, item);
    }
    for (const t of tickers) {
      const upper = t.toUpperCase();
      const sym = toYahooSymbol(upper);
      const raw = bySymbol.get(sym);
      out.set(upper, raw ? this.parseQuote(upper, raw) : null);
    }
    return out;
  }

  async ohlc(ticker: string, period: OhlcPeriod): Promise<Candle[]> {
    const { period1 } = this.periodToDates(period);
    const symbol = toYahooSymbol(ticker.toUpperCase());
    let raw: unknown[] = [];
    try {
      raw = await yf.historical(symbol, { period1, interval: '1d' });
    } catch (err) {
      // Fallback .SA → bare ticker.
      if (symbol.endsWith('.SA')) {
        raw = await yf.historical(ticker.toUpperCase(), {
          period1,
          interval: '1d',
        });
      } else {
        throw err;
      }
    }
    return raw
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
