'use client';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { AssetHeader } from '@/components/organisms/asset/asset-header';
import { CandleChartSection } from '@/components/organisms/asset/candle-chart-section';
import { AIAnalysisCard } from '@/components/organisms/ai-analyst/ai-analysis-card';
import { useAssetAnalysis } from '@/hooks/ai-analyst/use-asset-analysis';

export default function AssetDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: raw } = use(params);
  const ticker = raw.toUpperCase();
  const t = useTranslations('ai.analysis.errors');
  const { data, error, isLoading, analyze } = useAssetAnalysis();

  const state: Parameters<typeof AIAnalysisCard>[0]['state'] = (() => {
    if (isLoading) return { status: 'loading', windowDays: 7 };
    if (error) {
      const message =
        error.statusCode === 422
          ? t('ticker_invalid')
          : error.statusCode === 503
            ? t('generic')
            : t('generic');
      return { status: 'error', message, onRetry: () => analyze(ticker) };
    }
    if (data) return { status: 'done', data, onRefresh: () => analyze(ticker) };
    return { status: 'empty', onAnalyze: () => analyze(ticker) };
  })();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AssetHeader ticker={ticker} />
      <CandleChartSection ticker={ticker} />
      <AIAnalysisCard state={state} />
    </div>
  );
}
