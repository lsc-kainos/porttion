import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';

const prismaMock = () => {
  return {
    wallet: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
};

const marketMock = () => ({
  quoteMany: jest.fn().mockResolvedValue(new Map()),
});

describe('WalletsService', () => {
  let service: WalletsService;
  let prisma: ReturnType<typeof prismaMock>;
  let market: ReturnType<typeof marketMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    market = marketMock();
    const mod = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MarketService, useValue: market },
      ],
    }).compile();
    service = mod.get(WalletsService);
  });

  describe('ownership cross-user', () => {
    it('findOwned: 404 quando wallet pertence a outro user', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({
        id: 'w1',
        userId: 'OTHER',
        positions: [],
      });
      await expect(service.findOwned('user-a', 'w1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('update: 404 cross-user', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({
        id: 'w1',
        userId: 'OTHER',
        positions: [],
      });
      await expect(
        service.update('user-a', 'w1', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('delete: 404 cross-user', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({
        id: 'w1',
        userId: 'OTHER',
        positions: [],
      });
      await expect(service.remove('user-a', 'w1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('list: filtra por userId', async () => {
      prisma.wallet.findMany.mockResolvedValueOnce([]);
      await service.list('user-a');
      expect(prisma.wallet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-a' } }),
      );
    });
  });

  describe('@@unique', () => {
    it('create: 409 quando nome já existe para o user', async () => {
      const err: Error & { code?: string } = new Error(
        'Unique constraint failed',
      );
      err.code = 'P2002';
      prisma.wallet.create.mockRejectedValueOnce(err);
      await expect(
        service.create('user-a', {
          name: 'Principal',
          baseCurrency: 'BRL',
          strategy: null,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('computeKpis', () => {
    it('zero positions → todos KPIs zero/null sem quebrar', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({
        id: 'w1',
        userId: 'u',
        positions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'X',
        baseCurrency: 'BRL',
        strategy: null,
      });
      const result = await service.findOwned('u', 'w1');
      expect(result.patrimonio).toBe(0);
      expect(result.plTotal).toBe(0);
      expect(result.stale).toBe(false);
    });

    it('parcial stale: 1 quote null entre 2', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({
        id: 'w1',
        userId: 'u',
        positions: [
          {
            id: 'p1',
            ticker: 'PETR4',
            qty: 100,
            avgPrice: 30,
            assetClass: 'acoes_br',
          },
          {
            id: 'p2',
            ticker: 'VALE3',
            qty: 50,
            avgPrice: 60,
            assetClass: 'acoes_br',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'X',
        baseCurrency: 'BRL',
        strategy: null,
      });
      market.quoteMany.mockResolvedValueOnce(
        new Map([
          [
            'PETR4',
            {
              ticker: 'PETR4',
              price: 33,
              changePct: 1,
              currency: 'BRL',
              lastUpdate: new Date().toISOString(),
            },
          ],
          ['VALE3', null],
        ]),
      );
      const result = await service.findOwned('u', 'w1');
      expect(result.stale).toBe(true);
      expect(result.patrimonio).toBe(100 * 33);
      expect(result.plTotal).toBe(100 * 33 - 100 * 30);
    });

    it('todas stale → KPIs null', async () => {
      prisma.wallet.findUnique.mockResolvedValueOnce({
        id: 'w1',
        userId: 'u',
        positions: [
          {
            id: 'p1',
            ticker: 'PETR4',
            qty: 100,
            avgPrice: 30,
            assetClass: 'acoes_br',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'X',
        baseCurrency: 'BRL',
        strategy: null,
      });
      market.quoteMany.mockResolvedValueOnce(new Map([['PETR4', null]]));
      const result = await service.findOwned('u', 'w1');
      expect(result.patrimonio).toBeNull();
      expect(result.plTotal).toBeNull();
      expect(result.variacaoDiaPct).toBeNull();
      expect(result.stale).toBe(true);
    });
  });
});
