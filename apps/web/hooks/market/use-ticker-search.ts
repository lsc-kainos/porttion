'use client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { MarketAsset } from '@kainos/shared-types';

export function useTickerSearch(query: string) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  return useSWR<MarketAsset[]>(
    debounced.trim().length >= 2
      ? `/v1/market/search?q=${encodeURIComponent(debounced.trim())}&limit=8`
      : null,
    // shouldRetryOnError: false — 503 upstream não deve gerar burst de retries
    // contra Yahoo enquanto o usuário digita.
    { keepPreviousData: true, shouldRetryOnError: false },
  );
}
