import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  Candle,
  MarketAsset,
  OhlcPeriod,
  Quote,
} from '@kainos/shared-types';
import { inferAssetClass } from '../yahoo-symbol';
import type { MarketProvider } from './market-provider.interface';

// Token global de fetch — injetável pra testes substituírem com mock sem
// monkey-patch global.
export const FETCH_TOKEN = Symbol('FETCH');

type BrapiStockListItem = {
  stock?: string;
  name?: string;
  type?: string;
};
type BrapiQuoteResult = {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: number | string;
  currency?: string;
  historicalDataPrice?: BrapiHistoricalCandle[];
};
type BrapiHistoricalCandle = {
  date?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
};

const PERIOD_TO_RANGE: Record<OhlcPeriod, string> = {
  '7d': '5d',
  '30d': '1mo',
  '6m': '6mo',
  '1a': '1y',
  '5a': '5y',
};

@Injectable()
export class BrapiProvider implements MarketProvider {
  readonly name = 'brapi';
  private readonly logger = new Logger(BrapiProvider.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly config: ConfigService,
    @Inject(FETCH_TOKEN)
    private readonly fetchImpl: typeof fetch = globalThis.fetch,
  ) {
    this.baseUrl =
      this.config.get<string>('BRAPI_BASE_URL') ?? 'https://brapi.dev/api';
    this.token = this.config.get<string>('BRAPI_TOKEN') ?? '';
    this.timeoutMs = this.config.get<number>('MARKET_TIMEOUT_MS') ?? 4000;
  }

  async search(q: string, limit: number): Promise<MarketAsset[]> {
    const url = this.buildUrl('/quote/list', { search: q, limit });
    const body = await this.getJson<{ stocks?: BrapiStockListItem[] }>(url);
    const stocks = body.stocks ?? [];
    return stocks
      .filter(
        (s): s is BrapiStockListItem & { stock: string } =>
          typeof s.stock === 'string',
      )
      .slice(0, limit)
      .map((s) => ({
        ticker: s.stock.toUpperCase(),
        name: s.name ?? s.stock,
        // BRAPI é B3-only — usa inferAssetClass com hint de exchange SAO.
        assetClass: inferAssetClass(s.stock, { exchange: 'SAO' }),
        exchange: 'SAO',
      }));
  }

  async quote(ticker: string): Promise<Quote | null> {
    const upper = ticker.toUpperCase();
    const url = this.buildUrl(`/quote/${encodeURIComponent(upper)}`);
    const body = await this.getJson<{ results?: BrapiQuoteResult[] }>(url, {
      treat404AsEmpty: true,
    });
    const first = body.results?.[0];
    return first ? this.parseQuote(upper, first) : null;
  }

  async quoteMany(tickers: string[]): Promise<Map<string, Quote | null>> {
    const out = new Map<string, Quote | null>();
    if (tickers.length === 0) return out;
    const upper = tickers.map((t) => t.toUpperCase());
    // BRAPI aceita lista vírgula-separada: /quote/PETR4,VALE3
    const url = this.buildUrl(
      `/quote/${upper.map(encodeURIComponent).join(',')}`,
    );
    const body = await this.getJson<{ results?: BrapiQuoteResult[] }>(url);
    const bySymbol = new Map<string, BrapiQuoteResult>();
    for (const r of body.results ?? []) {
      if (typeof r.symbol === 'string') bySymbol.set(r.symbol.toUpperCase(), r);
    }
    for (const t of upper) {
      const r = bySymbol.get(t);
      out.set(t, r ? this.parseQuote(t, r) : null);
    }
    return out;
  }

  async ohlc(ticker: string, period: OhlcPeriod): Promise<Candle[]> {
    const upper = ticker.toUpperCase();
    const range = PERIOD_TO_RANGE[period];
    const url = this.buildUrl(`/quote/${encodeURIComponent(upper)}`, {
      range,
      interval: '1d',
      fundamental: 'false',
    });
    const body = await this.getJson<{ results?: BrapiQuoteResult[] }>(url, {
      treat404AsEmpty: true,
    });
    const candles = body.results?.[0]?.historicalDataPrice ?? [];
    return candles
      .filter(
        (c): c is Required<BrapiHistoricalCandle> =>
          typeof c.date === 'number' &&
          typeof c.open === 'number' &&
          typeof c.close === 'number',
      )
      .map((c) => ({
        // BRAPI devolve `date` como unix timestamp em segundos.
        date: new Date(c.date * 1000).toISOString().slice(0, 10),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));
  }

  private parseQuote(ticker: string, r: BrapiQuoteResult): Quote | null {
    if (typeof r.regularMarketPrice !== 'number') return null;
    const tsRaw = r.regularMarketTime;
    const ts =
      typeof tsRaw === 'number'
        ? new Date(tsRaw * 1000)
        : tsRaw
          ? new Date(tsRaw)
          : new Date();
    return {
      ticker,
      price: r.regularMarketPrice,
      changePct: r.regularMarketChangePercent ?? 0,
      currency: r.currency ?? 'BRL',
      lastUpdate: ts.toISOString(),
    };
  }

  private buildUrl(
    path: string,
    params: Record<string, string | number> = {},
  ): string {
    const u = new URL(`${this.baseUrl}${path}`);
    for (const [k, v] of Object.entries(params)) {
      u.searchParams.set(k, String(v));
    }
    if (this.token) u.searchParams.set('token', this.token);
    return u.toString();
  }

  private async getJson<T>(
    url: string,
    opts: { treat404AsEmpty?: boolean } = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (res.status === 404 && opts.treat404AsEmpty) {
        return { results: [] } as T;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `brapi ${res.status}: ${text.slice(0, 200) || res.statusText}`,
        );
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
