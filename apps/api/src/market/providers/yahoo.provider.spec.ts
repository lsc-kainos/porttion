import yahooFinance from 'yahoo-finance2';
import { YahooProvider } from './yahoo.provider';

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

describe('YahooProvider', () => {
  let provider: YahooProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new YahooProvider();
  });

  it('search: mapeia .SA → ticker bare e infere assetClass', async () => {
    yf.search.mockResolvedValueOnce({
      quotes: [
        {
          symbol: 'PETR4.SA',
          shortname: 'Petrobras PN',
          quoteType: 'EQUITY',
          exchange: 'SAO',
        },
        {
          symbol: 'BTC-USD',
          shortname: 'Bitcoin',
          quoteType: 'CRYPTOCURRENCY',
        },
      ],
    });
    const result = await provider.search('PETR', 10);
    expect(result).toEqual([
      {
        ticker: 'PETR4',
        name: 'Petrobras PN',
        assetClass: 'acoes_br',
        exchange: 'SAO',
      },
      {
        ticker: 'BTC',
        name: 'Bitcoin',
        assetClass: 'cripto',
        exchange: null,
      },
    ]);
  });

  it('search: propaga erro do upstream (sem catch)', async () => {
    yf.search.mockRejectedValueOnce(new Error('fetch failed'));
    await expect(provider.search('PETR', 10)).rejects.toThrow('fetch failed');
  });

  it('quote: parseia regularMarketPrice', async () => {
    yf.quote.mockResolvedValueOnce({
      symbol: 'PETR4.SA',
      regularMarketPrice: 30,
      regularMarketChangePercent: 1.5,
      currency: 'BRL',
      regularMarketTime: new Date('2026-05-20T18:00:00Z'),
    });
    const q = await provider.quote('PETR4');
    expect(q?.price).toBe(30);
    expect(q?.changePct).toBe(1.5);
    expect(q?.currency).toBe('BRL');
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
    const result = await provider.ohlc('PETR4', '7d');
    expect(yf.historical).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0].close).toBe(10.5);
  });
});
