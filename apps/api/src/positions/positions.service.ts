import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { MarketService } from '../market/market.service';

interface CreateInput {
  ticker: string;
  qty: number;
  avgPrice: number;
}

interface UpdateInput {
  qty?: number;
  avgPrice?: number;
}

function isPrismaUniqueError(err: unknown): boolean {
  return (
    (err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002') ||
    (typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      err.code === 'P2002')
  );
}

@Injectable()
export class PositionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletsService,
    private readonly market: MarketService,
  ) {}

  async create(userId: string, walletId: string, input: CreateInput) {
    await this.wallets.findOwned(userId, walletId); // 404 se cross-user
    const ticker = input.ticker.toUpperCase();
    const meta = await this.market.validateTicker(ticker); // 422 se inválido
    try {
      return await this.prisma.position.create({
        data: {
          walletId,
          ticker,
          qty: input.qty,
          avgPrice: input.avgPrice,
          assetClass: meta.assetClass,
        },
      });
    } catch (err) {
      if (isPrismaUniqueError(err)) {
        throw new ConflictException('Este ticker já está nesta carteira');
      }
      throw err;
    }
  }

  async update(userId: string, positionId: string, input: UpdateInput) {
    const existing = await this.prisma.position.findUnique({
      where: { id: positionId },
      include: { wallet: { select: { userId: true } } },
    });
    if (!existing || existing.wallet.userId !== userId)
      throw new NotFoundException();
    return this.prisma.position.update({
      where: { id: positionId },
      data: { qty: input.qty, avgPrice: input.avgPrice },
    });
  }

  async remove(userId: string, positionId: string): Promise<void> {
    const existing = await this.prisma.position.findUnique({
      where: { id: positionId },
      include: { wallet: { select: { userId: true } } },
    });
    if (!existing || existing.wallet.userId !== userId)
      throw new NotFoundException();
    await this.prisma.position.delete({ where: { id: positionId } });
  }
}
