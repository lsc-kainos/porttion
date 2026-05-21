'use client';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import type { PositionWithQuote, BaseCurrency } from '@kainos/shared-types';
import { cn } from '@/lib/utils';

interface Props {
  position: PositionWithQuote;
  baseCurrency: BaseCurrency;
}

export function PositionRow({ position: p, baseCurrency }: Props) {
  const fmt = useFormatter();
  const t = useTranslations('position.row');
  const money = (v: number | null): string =>
    v == null ? t('unavailable') : fmt.number(v, { style: 'currency', currency: baseCurrency });
  return (
    <tr className="hover:bg-accent/30 border-b last:border-0">
      <td className="px-3 py-3">
        <Link href={`/ativos/${p.ticker}`} className="font-mono font-medium hover:underline">
          {p.ticker}
        </Link>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">{p.qty}</td>
      <td className="px-3 py-3 text-right tabular-nums">{money(p.avgPrice)}</td>
      <td className="px-3 py-3 text-right tabular-nums">{money(p.quote)}</td>
      <td className="px-3 py-3 text-right tabular-nums">{money(p.valor)}</td>
      <td
        className={cn(
          'px-3 py-3 text-right tabular-nums',
          p.pl == null ? '' : p.pl >= 0 ? 'text-emerald-700' : 'text-destructive',
        )}
      >
        {p.pl == null
          ? '—'
          : fmt.number(p.pl, { style: 'currency', currency: baseCurrency, signDisplay: 'always' })}
      </td>
    </tr>
  );
}
