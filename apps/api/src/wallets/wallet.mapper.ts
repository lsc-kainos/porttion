import type { Wallet, Position } from '@prisma/client';
import type {
  WalletSummary,
  WalletDetail,
  BaseCurrency,
  Strategy,
} from '@kainos/shared-types';

export function toWalletSummary(
  w: Wallet & { positions: Position[] },
  kpis: {
    patrimonio: number | null;
    plTotal: number | null;
    variacaoDiaPct: number | null;
    stale: boolean;
  },
): WalletSummary {
  return {
    id: w.id,
    name: w.name,
    baseCurrency: w.baseCurrency as BaseCurrency,
    strategy: (w.strategy ?? null) as Strategy | null,
    positionsCount: w.positions.length,
    patrimonio: kpis.patrimonio,
    plTotal: kpis.plTotal,
    variacaoDiaPct: kpis.variacaoDiaPct,
    stale: kpis.stale,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

export function toWalletDetail(
  w: Wallet & { positions: Position[] },
  kpis: {
    patrimonio: number | null;
    plTotal: number | null;
    variacaoDiaPct: number | null;
    stale: boolean;
    custoTotal: number;
    positionsWithQuotes: WalletDetail['positions'];
    allocation: WalletDetail['allocationByClass'];
  },
): WalletDetail {
  return {
    ...toWalletSummary(w, kpis),
    custoTotal: kpis.custoTotal,
    positions: kpis.positionsWithQuotes,
    allocationByClass: kpis.allocation,
  };
}
