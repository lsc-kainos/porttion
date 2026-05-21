'use client';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import type { PositionWithQuote, BaseCurrency } from '@kainos/shared-types';
import { cn } from '@/lib/utils';

interface Props {
  position: PositionWithQuote;
  baseCurrency: BaseCurrency;
}

export function PositionCard({ position: p, baseCurrency }: Props) {
  const fmt = useFormatter();
  const t = useTranslations('position.card');
  const money = (v: number | null): string =>
    v == null ? t('unavailable') : fmt.number(v, { style: 'currency', currency: baseCurrency });
  return (
    <Link href={`/ativos/${p.ticker}`} className="hover:bg-accent/30 block rounded-xl border p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-base font-semibold">{p.ticker}</span>
        <span className="text-sm tabular-nums">{money(p.quote)}</span>
      </div>
      <div className="text-muted-foreground mt-2 flex items-baseline justify-between text-sm tabular-nums">
        <span>{t('qtyAvg', { qty: p.qty, avg: money(p.avgPrice) })}</span>
        <span
          className={cn(p.pl == null ? '' : p.pl >= 0 ? 'text-emerald-700' : 'text-destructive')}
        >
          {p.pl == null
            ? '—'
            : fmt.number(p.pl, {
                style: 'currency',
                currency: baseCurrency,
                signDisplay: 'always',
              })}
        </span>
      </div>
    </Link>
  );
}
