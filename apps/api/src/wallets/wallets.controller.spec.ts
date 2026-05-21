import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

describe('WalletsController', () => {
  let controller: WalletsController;
  let service: {
    list: jest.Mock;
    create: jest.Mock;
    findOwned: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      findOwned: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [{ provide: WalletsService, useValue: service }],
    }).compile();
    controller = mod.get(WalletsController);
  });

  it('list: passa userId do req', async () => {
    service.list.mockResolvedValueOnce([]);
    await controller.list({ user: { id: 'u1' } });
    expect(service.list).toHaveBeenCalledWith('u1');
  });

  it('findOne: propaga NotFoundException', async () => {
    service.findOwned.mockRejectedValueOnce(new NotFoundException());
    await expect(
      controller.findOne({ user: { id: 'u1' } }, 'w1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create: trim no name', async () => {
    service.create.mockResolvedValueOnce({});
    await controller.create(
      { user: { id: 'u1' } },
      { name: '  Principal  ', baseCurrency: 'BRL' },
    );
    expect(service.create).toHaveBeenCalledWith('u1', {
      name: 'Principal',
      baseCurrency: 'BRL',
      strategy: null,
    });
  });
});
