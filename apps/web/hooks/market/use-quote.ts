'use client';
import useSWR from 'swr';
import type { Quote } from '@kainos/shared-types';

export function useQuote(ticker: string | null) {
  return useSWR<Quote & { stale?: boolean }>(ticker ? `/v1/market/quote/${ticker}` : null, {
    refreshInterval: 5 * 60_000,
  });
}
