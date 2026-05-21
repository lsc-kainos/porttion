'use client';
import { useTranslations, useFormatter } from 'next-intl';
import { KpiCard } from '@/components/molecules/kpi-card';
import type { WalletDetail } from '@kainos/shared-types';

interface Props {
  wallet: WalletDetail;
}

export function KpiGrid({ wallet }: Props) {
  const t = useTranslations('wallet.kpi');
  const fmt = useFormatter();
  const cur = wallet.baseCurrency;

  function money(v: number | null): string {
    return v == null ? '—' : fmt.number(v, { style: 'currency', currency: cur });
  }
  function pct(v: number | null): string {
    return v == null
      ? '—'
      : fmt.number(v / 100, {
          style: 'percent',
          signDisplay: 'always',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }

  const plTone = wallet.plTotal == null ? 'neutral' : wallet.plTotal >= 0 ? 'positive' : 'negative';
  const varTone =
    wallet.variacaoDiaPct == null
      ? 'neutral'
      : wallet.variacaoDiaPct >= 0
        ? 'positive'
        : 'negative';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label={t('patrimonio')} value={money(wallet.patrimonio)} stale={wallet.stale} />
      <KpiCard
        label={t('plTotal')}
        value={money(wallet.plTotal)}
        caption={t('plCaption', {
          custo: fmt.number(wallet.custoTotal, { style: 'currency', currency: cur }),
        })}
        tone={plTone}
        stale={wallet.stale}
      />
      <KpiCard
        label={t('variacaoDia')}
        value={pct(wallet.variacaoDiaPct)}
        tone={varTone}
        stale={wallet.stale}
      />
      <KpiCard
        label={t('positionsCount')}
        value={String(wallet.positionsCount)}
        caption={t('positionsCaption', { count: wallet.positionsCount })}
      />
    </div>
  );
}
