'use client';
import { useTranslations, useFormatter } from 'next-intl';
import { Donut } from '@/components/atoms/charts/donut';
import type { WalletDetail, AssetClass } from '@kainos/shared-types';

const COLORS: Record<AssetClass, string> = {
  acoes_br: '#1d4ed8',
  etf: '#0ea5e9',
  renda_fixa: '#65a30d',
  cripto: '#f59e0b',
  moeda: '#a3a3a3',
};

interface Props {
  wallet: WalletDetail;
}

export function AllocationDonut({ wallet }: Props) {
  const t = useTranslations('wallet.allocation');
  const fmt = useFormatter();
  if (wallet.allocationByClass.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border p-6 text-center text-sm">
        {t('empty')}
      </p>
    );
  }
  return (
    <div className="bg-card rounded-2xl border p-6">
      <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        {t('title')}
      </h3>
      <div className="mt-4 grid items-center gap-6 md:grid-cols-2">
        <Donut
          data={wallet.allocationByClass.map((a) => ({
            key: t(`classes.${a.assetClass}`),
            value: a.valor,
            color: COLORS[a.assetClass],
          }))}
        />
        <ul className="space-y-2 text-sm">
          {wallet.allocationByClass.map((a) => (
            <li key={a.assetClass} className="flex items-baseline justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: COLORS[a.assetClass] }}
                  aria-hidden
                />
                {t(`classes.${a.assetClass}`)}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {fmt.number(a.pct / 100, {
                  style: 'percent',
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
