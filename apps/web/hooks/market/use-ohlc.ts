'use client';
import useSWR from 'swr';
import type { Candle, OhlcPeriod } from '@kainos/shared-types';

export function useOhlc(ticker: string | null, period: OhlcPeriod) {
  return useSWR<Candle[]>(ticker ? `/v1/market/ohlc/${ticker}?period=${period}` : null);
}
