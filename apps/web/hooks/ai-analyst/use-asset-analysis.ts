'use client';
import { useCallback, useState } from 'react';
import type { AssetAnalysisDto } from '@kainos/shared-types';

interface ApiError {
  statusCode: number;
  message: string;
}

interface UseAssetAnalysis {
  data: AssetAnalysisDto | null;
  error: ApiError | null;
  isLoading: boolean;
  analyze: (ticker: string) => Promise<void>;
}

export function useAssetAnalysis(): UseAssetAnalysis {
  const [data, setData] = useState<AssetAnalysisDto | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = useCallback(async (ticker: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/analyst/asset', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, windowDays: 7 }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as Partial<ApiError>;
        setError({ statusCode: res.status, message: body.message ?? 'unknown' });
        return;
      }
      setData((await res.json()) as AssetAnalysisDto);
    } catch (err) {
      setError({ statusCode: 0, message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, error, isLoading, analyze };
}
