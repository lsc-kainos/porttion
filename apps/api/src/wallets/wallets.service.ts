import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
import { MarketService } from '../market/market.service';
import type {
  Quote,
  WalletSummary,
  WalletDetail,
  PositionWithQuote,
  AssetClass,
} from '@kainos/shared-types';

interface CreateInput {
  name: string;
  baseCurrency: 'BRL' | 'USD' | 'EUR';
  strategy: string | null;
}

interface UpdateInput {
  name?: string;
  strategy?: string | null;
}

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly market: MarketService,
  ) {}

  async list(userId: string): Promise<WalletSummary[]> {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      include: { positions: true },
      orderBy: { createdAt: 'asc' },
    });
    const tickers = Array.from(
      new Set(wallets.flatMap((w) => w.positions.map((p) => p.ticker))),
    );
    const quotes = tickers.length
      ? await this.market.quoteMany(tickers)
      : new Map<string, Quote | null>();
    return wallets.map((w) => {
      const kpis = this.computeSummaryKpis(w.positions, quotes);
      return {
        id: w.id,
        name: w.name,
        baseCurrency: w.baseCurrency as WalletSummary['baseCurrency'],
        strategy: (w.strategy ?? null) as WalletSummary['strategy'],
        positionsCount: w.positions.length,
        patrimonio: kpis.patrimonio,
        plTotal: kpis.plTotal,
        variacaoDiaPct: kpis.variacaoDiaPct,
        stale: kpis.stale,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      };
    });
  }

  async findOwned(userId: string, walletId: string): Promise<WalletDetail> {
    const w = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: { positions: true },
    });
    if (!w || w.userId !== userId)
      throw new NotFoundException('Wallet não encontrada');
    const tickers = w.positions.map((p) => p.ticker);
    const quotes = tickers.length
      ? await this.market.quoteMany(tickers)
      : new Map<string, Quote | null>();
    const positionsWithQuotes: PositionWithQuote[] = w.positions.map((p) => {
      const q = quotes.get(p.ticker) ?? null;
      const valor = q ? p.qty * q.price : null;
      const pl = q ? p.qty * (q.price - p.avgPrice) : null;
      const plPct = q ? ((q.price - p.avgPrice) / p.avgPrice) * 100 : null;
      return {
        id: p.id,
        ticker: p.ticker,
        qty: p.qty,
        avgPrice: p.avgPrice,
        assetClass: p.assetClass as AssetClass,
        quote: q?.price ?? null,
        changePct: q?.changePct ?? null,
        valor,
        pl,
        plPct,
        stale: !q,
        lastUpdate: q?.lastUpdate ?? null,
      };
    });
    const kpis = this.computeSummaryKpis(w.positions, quotes);
    const custoTotal = w.positions.reduce(
      (acc, p) => acc + p.qty * p.avgPrice,
      0,
    );
    const allocation = this.computeAllocation(
      positionsWithQuotes,
      kpis.patrimonio,
    );
    return {
      id: w.id,
      name: w.name,
      baseCurrency: w.baseCurrency as WalletSummary['baseCurrency'],
      strategy: (w.strategy ?? null) as WalletSummary['strategy'],
      positionsCount: w.positions.length,
      patrimonio: kpis.patrimonio,
      plTotal: kpis.plTotal,
      variacaoDiaPct: kpis.variacaoDiaPct,
      stale: kpis.stale,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      custoTotal,
      positions: positionsWithQuotes,
      allocationByClass: allocation,
    };
  }

  async create(userId: string, input: CreateInput): Promise<WalletDetail> {
    try {
      const w = await this.prisma.wallet.create({
        data: {
          userId,
          name: input.name,
          baseCurrency: input.baseCurrency,
          strategy: input.strategy,
        },
        include: { positions: true },
      });
      return this.findOwned(userId, w.id);
    } catch (err) {
      if (isPrismaUniqueError(err)) {
        throw new ConflictException('Você já tem uma carteira com esse nome');
      }
      throw err;
    }
  }

  async update(
    userId: string,
    walletId: string,
    input: UpdateInput,
  ): Promise<WalletDetail> {
    const existing = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });
    if (!existing || existing.userId !== userId) throw new NotFoundException();
    try {
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: {
          name: input.name ?? undefined,
          strategy: input.strategy ?? undefined,
        },
      });
      return this.findOwned(userId, walletId);
    } catch (err) {
      if (isPrismaUniqueError(err)) {
        throw new ConflictException('Você já tem uma carteira com esse nome');
      }
      throw err;
    }
  }

  async remove(userId: string, walletId: string): Promise<void> {
    const existing = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });
    if (!existing || existing.userId !== userId) throw new NotFoundException();
    await this.prisma.wallet.delete({ where: { id: walletId } });
  }

  private computeSummaryKpis(
    positions: { ticker: string; qty: number; avgPrice: number }[],
    quotes: Map<string, Quote | null>,
  ): {
    patrimonio: number | null;
    plTotal: number | null;
    variacaoDiaPct: number | null;
    stale: boolean;
  } {
    if (positions.length === 0) {
      return { patrimonio: 0, plTotal: 0, variacaoDiaPct: 0, stale: false };
    }
    let patrimonio = 0;
    let custoComQuote = 0;
    let stale = false;
    let valorPond = 0;
    let pctPond = 0;
    let hasAny = false;
    for (const p of positions) {
      const q = quotes.get(p.ticker) ?? null;
      if (!q) {
        stale = true;
        continue;
      }
      hasAny = true;
      const valor = p.qty * q.price;
      patrimonio += valor;
      custoComQuote += p.qty * p.avgPrice;
      valorPond += valor;
      pctPond += valor * (q.changePct ?? 0);
    }
    if (!hasAny)
      return {
        patrimonio: null,
        plTotal: null,
        variacaoDiaPct: null,
        stale: true,
      };
    const plTotal = patrimonio - custoComQuote;
    const variacaoDiaPct = valorPond > 0 ? pctPond / valorPond : 0;
    return { patrimonio, plTotal, variacaoDiaPct, stale };
  }

  private computeAllocation(
    positions: PositionWithQuote[],
    patrimonio: number | null,
  ) {
    if (!patrimonio || patrimonio <= 0) return [];
    const byClass = new Map<AssetClass, number>();
    for (const p of positions) {
      if (p.valor == null) continue;
      byClass.set(p.assetClass, (byClass.get(p.assetClass) ?? 0) + p.valor);
    }
    return Array.from(byClass.entries()).map(([assetClass, valor]) => ({
      assetClass,
      valor,
      pct: (valor / patrimonio) * 100,
    }));
  }
}
