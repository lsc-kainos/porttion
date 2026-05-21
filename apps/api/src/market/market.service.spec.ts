import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MarketService } from './market.service';
import yahooFinance from 'yahoo-finance2';

jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    search: jest.fn(),
    quote: jest.fn(),
    historical: jest.fn(),
  },
}));

const yf = yahooFinance as unknown as {
  search: jest.Mock;
  quote: jest.Mock;
  historical: jest.Mock;
};

describe('MarketService', () => {
  let service: MarketService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        MarketService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'MARKET_TIMEOUT_MS' ? 4000 : undefined,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(MarketService);
  });

  it('quote: cache hit não bate Yahoo na 2ª chamada', async () => {
    yf.quote.mockResolvedValueOnce({
      symbol: 'PETR4.SA',
      regularMarketPrice: 30,
      regularMarketChangePercent: 1.5,
      currency: 'BRL',
      regularMarketTime: new Date('2026-05-20T18:00:00Z'),
    });
    const first = await service.quote('PETR4');
    const second = await service.quote('PETR4');
    expect(yf.quote).toHaveBeenCalledTimes(1);
    expect(first?.price).toBe(30);
    expect(second?.price).toBe(30);
  });

  it('quote: retorna null quando Yahoo lança', async () => {
    yf.quote.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await service.quote('XPTO9');
    expect(result).toBeNull();
  });

  it('quoteMany: parcial (1 falha entre 3)', async () => {
    yf.quote.mockResolvedValueOnce([
      {
        symbol: 'PETR4.SA',
        regularMarketPrice: 30,
        regularMarketChangePercent: 1,
        currency: 'BRL',
        regularMarketTime: new Date(),
      },
      {
        symbol: 'VALE3.SA',
        regularMarketPrice: 60,
        regularMarketChangePercent: -0.5,
        currency: 'BRL',
        regularMarketTime: new Date(),
      },
      // BOVA11 ausente
    ]);
    const result = await service.quoteMany(['PETR4', 'VALE3', 'BOVA11']);
    expect(result.get('PETR4')?.price).toBe(30);
    expect(result.get('VALE3')?.price).toBe(60);
    expect(result.get('BOVA11')).toBeNull();
  });

  it('validateTicker: joga 422 quando search vem vazio', async () => {
    yf.search.mockResolvedValueOnce({ quotes: [] });
    await expect(service.validateTicker('NOPE0')).rejects.toMatchObject({
      status: 422,
    });
  });

  it('validateTicker: retorna asset quando search devolve match', async () => {
    yf.search.mockResolvedValueOnce({
      quotes: [
        {
          symbol: 'PETR4.SA',
          shortname: 'Petrobras PN',
          quoteType: 'EQUITY',
          exchange: 'SAO',
        },
      ],
    });
    const result = await service.validateTicker('PETR4');
    expect(result).toEqual({
      ticker: 'PETR4',
      name: 'Petrobras PN',
      assetClass: 'acoes_br',
      exchange: 'SAO',
    });
  });

  it('ohlc: fallback .SA → bare quando primeira chamada falha', async () => {
    yf.historical.mockRejectedValueOnce(new Error('not found'));
    yf.historical.mockResolvedValueOnce([
      {
        date: new Date('2026-05-15T00:00:00Z'),
        open: 10,
        high: 11,
        low: 9,
        close: 10.5,
        volume: 100,
      },
    ]);
    const result = await service.ohlc('PETR4', '7d');
    expect(yf.historical).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0].close).toBe(10.5);
  });
});
