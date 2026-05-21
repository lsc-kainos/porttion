import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { WalletsService } from '../wallets/wallets.service';
import { MarketService } from '../market/market.service';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = () => ({
  position: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  wallet: {
    findUnique: jest.fn(),
  },
});

describe('PositionsService', () => {
  let service: PositionsService;
  let prisma: ReturnType<typeof prismaMock>;
  let wallets: { findOwned: jest.Mock };
  let market: { validateTicker: jest.Mock };

  beforeEach(async () => {
    prisma = prismaMock();
    wallets = { findOwned: jest.fn() };
    market = { validateTicker: jest.fn() };
    const mod = await Test.createTestingModule({
      providers: [
        PositionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WalletsService, useValue: wallets },
        { provide: MarketService, useValue: market },
      ],
    }).compile();
    service = mod.get(PositionsService);
  });

  it('create: 404 quando wallet pertence a outro user', async () => {
    wallets.findOwned.mockRejectedValueOnce(new NotFoundException());
    await expect(
      service.create('user-a', 'wallet-de-outro', {
        ticker: 'PETR4',
        qty: 100,
        avgPrice: 30,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create: normaliza ticker UPPERCASE e infere assetClass', async () => {
    wallets.findOwned.mockResolvedValueOnce({ id: 'w1', userId: 'u' });
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'Petrobras',
    });
    prisma.position.create.mockResolvedValueOnce({
      id: 'p1',
      walletId: 'w1',
      ticker: 'PETR4',
      qty: 100,
      avgPrice: 30,
      assetClass: 'acoes_br',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await service.create('u', 'w1', {
      ticker: 'petr4',
      qty: 100,
      avgPrice: 30,
    });
    expect(result.ticker).toBe('PETR4');
    expect(prisma.position.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ticker: 'PETR4',
          assetClass: 'acoes_br',
        }),
      }),
    );
  });

  it('create: 409 quando ticker já existe na wallet', async () => {
    wallets.findOwned.mockResolvedValueOnce({ id: 'w1', userId: 'u' });
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'X',
    });
    const err: Error & { code?: string } = new Error('unique');
    err.code = 'P2002';
    prisma.position.create.mockRejectedValueOnce(err);
    await expect(
      service.create('u', 'w1', { ticker: 'PETR4', qty: 100, avgPrice: 30 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('update: 404 quando position pertence a wallet de outro user', async () => {
    prisma.position.findUnique.mockResolvedValueOnce({
      id: 'p1',
      walletId: 'w1',
      wallet: { userId: 'OUTRO' },
    });
    await expect(
      service.update('user-a', 'p1', { qty: 50 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: preserva assetClass quando ticker não muda', async () => {
    prisma.position.findUnique.mockResolvedValueOnce({
      id: 'p1',
      walletId: 'w1',
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      wallet: { userId: 'u' },
    });
    prisma.position.update.mockResolvedValueOnce({
      id: 'p1',
      ticker: 'PETR4',
      qty: 200,
      avgPrice: 30,
      assetClass: 'acoes_br',
      walletId: 'w1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await service.update('u', 'p1', { qty: 200 });
    expect(prisma.position.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { qty: 200, avgPrice: undefined } }),
    );
    expect(market.validateTicker).not.toHaveBeenCalled();
  });

  it('remove: 404 cross-user', async () => {
    prisma.position.findUnique.mockResolvedValueOnce({
      id: 'p1',
      wallet: { userId: 'OUTRO' },
    });
    await expect(service.remove('user-a', 'p1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
