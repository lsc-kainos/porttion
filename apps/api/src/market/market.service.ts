import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import yahooFinanceRaw from 'yahoo-finance2';

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

// yahoo-finance2 is ESM; we import it normally but cast to a stable interface
// to avoid ESLint type errors caused by conditional overload resolution.
const yf = yahooFinanceRaw as unknown as YfClient;

import type {
  MarketAsset,
  Quote,
  Candle,
  OhlcPeriod,
} from '@kainos/shared-types';
import { LruCache } from './lru-cache';
import { toYahooSymbol, inferAssetClass } from './yahoo-symbol';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  private readonly quoteCache = new LruCache<string, Quote | null>({
    max: 500,
    ttlMs: 5 * 60_000,
  });
  private readonly ohlcCache = new LruCache<string, Candle[]>({
    max: 200,
    ttlMs: 30 * 60_000,
  });
  private readonly searchCache = new LruCache<string, MarketAsset[]>({
    max: 100,
    ttlMs: 60 * 60_000,
  });

  constructor(private readonly config: ConfigService) {}

  async search(q: string, limit = 10): Promise<MarketAsset[]> {
    const key = `${q.toUpperCase()}:${limit}`;
    const hit = this.searchCache.get(key);
    if (hit) return hit;
    let res: { quotes?: unknown[] };
    try {
      res = await yf.search(q, { newsCount: 0 });
    } catch (err) {
      // Falha upstream (Yahoo offline, crumb/cookie inválido, rate-limit, rede).
      // Antes engolíamos como `[]`, o que cacheava o vazio e mascarava a falha.
      // Agora propaga 503 pro cliente distinguir indisponível de "sem resultado".
      this.logger.error({
        event: 'market.search.failed',
        q,
        err: (err as Error).message,
      });
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Busca de ativos indisponível',
        upstream: 'yahoo-finance',
      });
    }
    type QuoteItem = {
      symbol?: string;
      shortname?: string;
      longname?: string;
      quoteType?: string;
      exchange?: string;
    };
    const rawQuotes = (res.quotes ?? []).map((x) => x as QuoteItem);
    const out: MarketAsset[] = rawQuotes
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
    // Não cachear vazio — uma falha transitória que retorne 0 itens não pode
    // congelar a busca por 1h pra essa query.
    if (out.length > 0) this.searchCache.set(key, out);
    return out;
  }

  async quote(ticker: string): Promise<Quote | null> {
    const key = ticker.toUpperCase();
    const cached = this.quoteCache.get(key);
    if (cached !== undefined) return cached;
    const symbol = toYahooSymbol(key);
    try {
      const res = await yf.quote(symbol);
      const q = this.parseQuote(key, res);
      this.quoteCache.set(key, q);
      return q;
    } catch (err) {
      this.logger.warn({
        event: 'market.quote.failed',
        ticker: key,
        err: (err as Error).message,
      });
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
      const res = await yf.quote(symbols);
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
      raw = await yf.historical(symbol, {
        period1,
        interval: '1d',
      });
    } catch (err) {
      // fallback: tenta sem .SA
      if (symbol.endsWith('.SA')) {
        try {
          raw = await yf.historical(ticker.toUpperCase(), {
            period1,
            interval: '1d',
          });
        } catch (err2) {
          this.logger.warn({
            event: 'market.ohlc.failed',
            ticker,
            err: (err2 as Error).message,
          });
          return [];
        }
      } else {
        this.logger.warn({
          event: 'market.ohlc.failed',
          ticker,
          err: (err as Error).message,
        });
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
    // Fixture mode (e2e/CI): aceita qualquer ticker em formato válido sem
    // bater na rede. Sem isso, e2e seria flaky por Yahoo offline/rate-limit.
    if (this.config.get<boolean>('MARKET_FIXTURE')) {
      const t = ticker.toUpperCase();
      if (!/^[A-Z0-9]{2,12}$/.test(t)) {
        throw new UnprocessableEntityException({
          statusCode: 422,
          message: 'Ticker desconhecido',
          ticker,
        });
      }
      return {
        ticker: t,
        name: t,
        assetClass: inferAssetClass(t),
        exchange: 'SAO',
      };
    }
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
