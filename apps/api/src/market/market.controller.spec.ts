import { Test } from '@nestjs/testing';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';

describe('MarketController', () => {
  let controller: MarketController;
  let service: { search: jest.Mock; quote: jest.Mock; ohlc: jest.Mock };

  beforeEach(async () => {
    service = { search: jest.fn(), quote: jest.fn(), ohlc: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [MarketController],
      providers: [{ provide: MarketService, useValue: service }],
    }).compile();
    controller = mod.get(MarketController);
  });

  it('delega search ao service', async () => {
    service.search.mockResolvedValueOnce([]);
    await controller.search({ q: 'PETR', limit: 5 });
    expect(service.search).toHaveBeenCalledWith('PETR', 5);
  });

  it('quote: retorna stale quando service devolve null', async () => {
    service.quote.mockResolvedValueOnce(null);
    const result = await controller.quote('XPTO9');
    expect(result).toMatchObject({ ticker: 'XPTO9', price: null, stale: true });
  });
});
