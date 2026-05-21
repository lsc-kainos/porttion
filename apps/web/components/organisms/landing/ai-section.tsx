'use client';
import { useTranslations } from 'next-intl';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';
import { AIAnalysisCard } from '@/components/organisms/ai-analyst/ai-analysis-card';
import type { AssetAnalysisDto } from '@kainos/shared-types';

const PREVIEW: AssetAnalysisDto = {
  ticker: 'PETR4',
  windowDays: 7,
  generatedAt: new Date().toISOString(),
  promptKey: 'asset.analysis.v1',
  promptVersion: 1,
  cached: false,
  payload: {
    tendencia: 'lateral',
    recomendacao: 'manter',
    confianca: 62,
    padroes: ['Suporte testado', 'MM21 plana'],
    riscos: ['Volatilidade alta'],
    sugestao: 'Aguardar rompimento da máxima recente antes de aumentar exposição.',
    justificativa:
      'A vela mais recente confirma o respeito ao suporte de 30,5 testado três vezes nesta janela.',
    horizonte: '1-2 semanas',
  },
};

export function AiSection() {
  const t = useTranslations('landing.ai');
  return (
    <section id="ia" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl space-y-10">
        <EditorialSectionHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <AIAnalysisCard state={{ status: 'done', data: PREVIEW }} />
      </div>
    </section>
  );
}
