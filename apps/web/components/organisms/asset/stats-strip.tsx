'use client';
import { useTranslations, useFormatter } from 'next-intl';
import { StatBox } from '@/components/molecules/stat-box';
import type { Candle, Quote } from '@kainos/shared-types';

interface Props {
  quote: Quote | null;
  candles: Candle[];
}

export function StatsStrip({ quote, candles }: Props) {
  const t = useTranslations('asset.stats');
  const fmt = useFormatter();
  if (!quote || candles.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('unavailable')}</p>;
  }
  const last = candles[candles.length - 1];
  const high52 = Math.max(...candles.map((c) => c.high));
  const low52 = Math.min(...candles.map((c) => c.low));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <StatBox
        label={t('open')}
        value={fmt.number(last.open, { style: 'currency', currency: quote.currency })}
      />
      <StatBox
        label={t('high')}
        value={fmt.number(last.high, { style: 'currency', currency: quote.currency })}
      />
      <StatBox
        label={t('low')}
        value={fmt.number(last.low, { style: 'currency', currency: quote.currency })}
      />
      <StatBox
        label={t('high52')}
        value={fmt.number(high52, { style: 'currency', currency: quote.currency })}
      />
      <StatBox
        label={t('low52')}
        value={fmt.number(low52, { style: 'currency', currency: quote.currency })}
      />
    </div>
  );
}
