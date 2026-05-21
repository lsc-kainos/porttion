'use client';
import { useState } from 'react';
import { CandleChart } from '@/components/atoms/charts/candle-chart';
import { OhlcTabs } from '@/components/molecules/ohlc-tabs';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { useOhlc } from '@/hooks/market/use-ohlc';
import type { OhlcPeriod } from '@kainos/shared-types';

interface Props {
  ticker: string;
}

export function CandleChartSection({ ticker }: Props) {
  const [period, setPeriod] = useState<OhlcPeriod>('30d');
  const { data, isLoading } = useOhlc(ticker, period);
  return (
    <section className="bg-card space-y-3 rounded-2xl border p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          Cotação
        </h3>
        <OhlcTabs value={period} onChange={setPeriod} />
      </header>
      {isLoading ? <Skeleton className="h-72 w-full" /> : <CandleChart candles={data ?? []} />}
    </section>
  );
}
