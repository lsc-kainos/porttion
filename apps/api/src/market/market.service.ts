import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  Candle,
  MarketAsset,
  OhlcPeriod,
  Quote,
} from '@kainos/shared-types';
import { LruCache } from './lru-cache';
import { inferAssetClass } from './yahoo-symbol';
import {
  MARKET_PROVIDER,
  type MarketProvider,
} from './providers/market-provider.interface';

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

  constructor(
    private readonly config: ConfigService,
    @Inject(MARKET_PROVIDER) private readonly provider: MarketProvider,
  ) {}

  async search(q: string, limit = 10): Promise<MarketAsset[]> {
    const key = `${q.toUpperCase()}:${limit}`;
    const hit = this.searchCache.get(key);
    if (hit) return hit;
    let out: MarketAsset[];
    try {
      out = await this.provider.search(q, limit);
    } catch (err) {
      this.logger.error({
        event: 'market.search.failed',
        provider: this.provider.name,
        q,
        err: (err as Error).message,
      });
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Busca de ativos indisponível',
        upstream: this.provider.name,
      });
    }
    // Não cachear vazio — uma falha transitória que retorne 0 itens não pode
    // congelar a busca por 1h pra essa query.
    if (out.length > 0) this.searchCache.set(key, out);
    return out;
  }

  async quote(ticker: string): Promise<Quote | null> {
    const key = ticker.toUpperCase();
    const cached = this.quoteCache.get(key);
    if (cached !== undefined) return cached;
    try {
      const q = await this.provider.quote(key);
      this.quoteCache.set(key, q);
      return q;
    } catch (err) {
      this.logger.warn({
        event: 'market.quote.failed',
        provider: this.provider.name,
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
    try {
      const fetched = await this.provider.quoteMany(toFetch);
      for (const k of toFetch) {
        const q = fetched.get(k) ?? null;
        this.quoteCache.set(k, q);
        out.set(k, q);
      }
    } catch (err) {
      this.logger.warn({
        event: 'market.quoteMany.failed',
        provider: this.provider.name,
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
    try {
      const candles = await this.provider.ohlc(ticker, period);
      this.ohlcCache.set(key, candles);
      return candles;
    } catch (err) {
      this.logger.warn({
        event: 'market.ohlc.failed',
        provider: this.provider.name,
        ticker,
        err: (err as Error).message,
      });
      return [];
    }
  }

  async validateTicker(ticker: string): Promise<MarketAsset> {
    // Fixture mode (e2e/CI): aceita qualquer ticker em formato válido sem
    // bater na rede. Sem isso, e2e seria flaky por upstream offline.
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
}
