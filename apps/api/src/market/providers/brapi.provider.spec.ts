import { ConfigService } from '@nestjs/config';
import { BrapiProvider } from './brapi.provider';

type MockResponse = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  _body?: unknown;
};

function mockFetch(handler: (url: string) => MockResponse): jest.Mock {
  return jest.fn((input: string | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    const r = handler(url);
    return Promise.resolve({
      ok: r.ok ?? true,
      status: r.status ?? 200,
      statusText: r.statusText ?? 'OK',
      json: async () => r._body ?? {},
      text: async () => JSON.stringify(r._body ?? ''),
    } as Response);
  });
}

function makeConfig(token = 'tk'): ConfigService {
  return {
    get: (key: string) => {
      if (key === 'BRAPI_BASE_URL') return 'https://brapi.dev/api';
      if (key === 'BRAPI_TOKEN') return token;
      if (key === 'MARKET_TIMEOUT_MS') return 4000;
      return undefined;
    },
  } as unknown as ConfigService;
}

describe('BrapiProvider', () => {
  it('search: mapeia /quote/list e devolve MarketAsset[]', async () => {
    const fetchMock = mockFetch(() => ({
      _body: {
        stocks: [
          { stock: 'PETR4', name: 'Petrobras PN', type: 'stock' },
          { stock: 'PETR3', name: 'Petrobras ON', type: 'stock' },
        ],
      },
    }));
    const provider = new BrapiProvider(makeConfig(), fetchMock as never);
    const out = await provider.search('PETR', 10);
    expect(out).toEqual([
      {
        ticker: 'PETR4',
        name: 'Petrobras PN',
        assetClass: 'acoes_br',
        exchange: 'SAO',
      },
      {
        ticker: 'PETR3',
        name: 'Petrobras ON',
        assetClass: 'acoes_br',
        exchange: 'SAO',
      },
    ]);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/quote/list');
    expect(calledUrl).toContain('search=PETR');
    expect(calledUrl).toContain('token=tk');
  });

  it('search: lança quando upstream retorna 5xx', async () => {
    const fetchMock = mockFetch(() => ({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      _body: 'down',
    }));
    const provider = new BrapiProvider(makeConfig(), fetchMock as never);
    await expect(provider.search('PETR', 10)).rejects.toThrow(/brapi 503/);
  });

  it('quote: parseia regularMarketPrice e converte timestamp em segundos', async () => {
    const fetchMock = mockFetch(() => ({
      _body: {
        results: [
          {
            symbol: 'PETR4',
            regularMarketPrice: 32.5,
            regularMarketChangePercent: 1.2,
            regularMarketTime: 1747843200, // 2025-05-21 16:00 UTC
            currency: 'BRL',
          },
        ],
      },
    }));
    const provider = new BrapiProvider(makeConfig(), fetchMock as never);
    const q = await provider.quote('PETR4');
    expect(q).toMatchObject({
      ticker: 'PETR4',
      price: 32.5,
      changePct: 1.2,
      currency: 'BRL',
    });
    expect(q?.lastUpdate.startsWith('2025-05-21')).toBe(true);
  });

  it('quote: 404 do upstream vira null (ticker desconhecido)', async () => {
    const fetchMock = mockFetch(() => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }));
    const provider = new BrapiProvider(makeConfig(), fetchMock as never);
    expect(await provider.quote('NOPE9')).toBeNull();
  });

  it('quoteMany: monta lista vírgula-separada e mapeia por símbolo', async () => {
    const fetchMock = mockFetch(() => ({
      _body: {
        results: [
          {
            symbol: 'PETR4',
            regularMarketPrice: 30,
            regularMarketChangePercent: 0,
            currency: 'BRL',
            regularMarketTime: 1747843200,
          },
          // VALE3 ausente — espera-se null no Map.
        ],
      },
    }));
    const provider = new BrapiProvider(makeConfig(), fetchMock as never);
    const m = await provider.quoteMany(['PETR4', 'VALE3']);
    expect(m.get('PETR4')?.price).toBe(30);
    expect(m.get('VALE3')).toBeNull();
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/quote/PETR4,VALE3');
  });

  it('ohlc: mapeia historicalDataPrice e converte timestamps', async () => {
    const fetchMock = mockFetch(() => ({
      _body: {
        results: [
          {
            symbol: 'PETR4',
            historicalDataPrice: [
              {
                date: 1747843200, // 2025-05-21
                open: 30,
                high: 31,
                low: 29.5,
                close: 30.5,
                volume: 1_000_000,
              },
            ],
          },
        ],
      },
    }));
    const provider = new BrapiProvider(makeConfig(), fetchMock as never);
    const candles = await provider.ohlc('PETR4', '30d');
    expect(candles).toEqual([
      {
        date: '2025-05-21',
        open: 30,
        high: 31,
        low: 29.5,
        close: 30.5,
        volume: 1_000_000,
      },
    ]);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('range=1mo');
    expect(calledUrl).toContain('interval=1d');
  });
});
