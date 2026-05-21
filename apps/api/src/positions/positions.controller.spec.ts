import { Test } from '@nestjs/testing';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

describe('PositionsController', () => {
  let controller: PositionsController;
  let service: { create: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = { create: jest.fn(), update: jest.fn(), remove: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [PositionsController],
      providers: [{ provide: PositionsService, useValue: service }],
    }).compile();
    controller = mod.get(PositionsController);
  });

  it('create delega ao service com userId/walletId/dto', async () => {
    service.create.mockResolvedValueOnce({ id: 'p1' });
    await controller.create({ user: { id: 'u' } }, 'w1', {
      ticker: 'PETR4',
      qty: 100,
      avgPrice: 30,
    });
    expect(service.create).toHaveBeenCalledWith('u', 'w1', {
      ticker: 'PETR4',
      qty: 100,
      avgPrice: 30,
    });
  });
});
