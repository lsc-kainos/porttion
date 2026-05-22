import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MarketService } from './market.service';
import {
  MARKET_PROVIDER,
  type MarketProvider,
} from './providers/market-provider.interface';

function makeProvider(): jest.Mocked<MarketProvider> {
  return {
    name: 'mock',
    search: jest.fn(),
    quote: jest.fn(),
    quoteMany: jest.fn(),
    ohlc: jest.fn(),
  };
}

describe('MarketService', () => {
  let service: MarketService;
  let provider: jest.Mocked<MarketProvider>;

  beforeEach(async () => {
    provider = makeProvider();
    const moduleRef = await Test.createTestingModule({
      providers: [
        MarketService,
        { provide: MARKET_PROVIDER, useValue: provider },
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

  it('quote: cache hit não chama o provider na 2ª chamada', async () => {
    provider.quote.mockResolvedValueOnce({
      ticker: 'PETR4',
      price: 30,
      changePct: 1.5,
      currency: 'BRL',
      lastUpdate: new Date().toISOString(),
    });
    const first = await service.quote('PETR4');
    const second = await service.quote('PETR4');
    expect(provider.quote).toHaveBeenCalledTimes(1);
    expect(first?.price).toBe(30);
    expect(second?.price).toBe(30);
  });

  it('quote: retorna null quando provider lança', async () => {
    provider.quote.mockRejectedValueOnce(new Error('upstream'));
    const result = await service.quote('XPTO9');
    expect(result).toBeNull();
  });

  it('quoteMany: parcial (1 ausente no resultado)', async () => {
    provider.quoteMany.mockResolvedValueOnce(
      new Map([
        [
          'PETR4',
          {
            ticker: 'PETR4',
            price: 30,
            changePct: 1,
            currency: 'BRL',
            lastUpdate: new Date().toISOString(),
          },
        ],
        [
          'VALE3',
          {
            ticker: 'VALE3',
            price: 60,
            changePct: -0.5,
            currency: 'BRL',
            lastUpdate: new Date().toISOString(),
          },
        ],
        ['BOVA11', null],
      ]),
    );
    const result = await service.quoteMany(['PETR4', 'VALE3', 'BOVA11']);
    expect(result.get('PETR4')?.price).toBe(30);
    expect(result.get('VALE3')?.price).toBe(60);
    expect(result.get('BOVA11')).toBeNull();
  });

  it('validateTicker: joga 422 quando search vem vazio', async () => {
    provider.search.mockResolvedValueOnce([]);
    await expect(service.validateTicker('NOPE0')).rejects.toMatchObject({
      status: 422,
    });
  });

  it('validateTicker: retorna asset quando search devolve match', async () => {
    provider.search.mockResolvedValueOnce([
      {
        ticker: 'PETR4',
        name: 'Petrobras PN',
        assetClass: 'acoes_br',
        exchange: 'SAO',
      },
    ]);
    const result = await service.validateTicker('PETR4');
    expect(result).toEqual({
      ticker: 'PETR4',
      name: 'Petrobras PN',
      assetClass: 'acoes_br',
      exchange: 'SAO',
    });
  });

  it('search: propaga 503 quando provider lança', async () => {
    provider.search.mockRejectedValueOnce(new Error('upstream 503'));
    await expect(service.search('PETR')).rejects.toMatchObject({
      status: 503,
    });
  });

  it('search: não cacheia resultado vazio', async () => {
    provider.search.mockResolvedValueOnce([]);
    provider.search.mockResolvedValueOnce([
      {
        ticker: 'PETR4',
        name: 'Petrobras PN',
        assetClass: 'acoes_br',
        exchange: 'SAO',
      },
    ]);
    const first = await service.search('PETR');
    const second = await service.search('PETR');
    expect(first).toEqual([]);
    expect(second).toHaveLength(1);
    expect(provider.search).toHaveBeenCalledTimes(2);
  });

  it('ohlc: retorna [] quando provider lança', async () => {
    provider.ohlc.mockRejectedValueOnce(new Error('upstream'));
    const result = await service.ohlc('PETR4', '7d');
    expect(result).toEqual([]);
  });
});
