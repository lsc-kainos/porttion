'use client';
import { Brain, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AssetAnalysisDto } from '@kainos/shared-types';
import { Button } from '@/components/atoms/ui/button';
import { Badge } from '@/components/atoms/ui/badge';
import { Separator } from '@/components/atoms/ui/separator';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { EditorialQuote } from '@/components/atoms/typography/editorial-quote';
import { AiDisclaimer } from '@/components/molecules/ai-disclaimer';

type State =
  | { status: 'empty'; onAnalyze: () => void }
  | { status: 'loading'; windowDays: number }
  | { status: 'done'; data: AssetAnalysisDto; onRefresh?: () => void }
  | { status: 'error'; message: string; onRetry: () => void };

interface Props {
  state: State;
}

export function AIAnalysisCard({ state }: Props) {
  const t = useTranslations('ai.analysis');
  return (
    <section className="bg-card rounded-2xl border p-6">
      <header className="flex items-center gap-2">
        <Brain className="text-primary size-5" aria-hidden />
        <h3 className="text-sm font-semibold tracking-wide uppercase">{t('title')}</h3>
      </header>

      {state.status === 'empty' ? (
        <div className="mt-4 space-y-3">
          <p className="text-muted-foreground text-sm">{t('empty.body')}</p>
          <Button onClick={state.onAnalyze}>{t('empty.cta')}</Button>
        </div>
      ) : null}

      {state.status === 'loading' ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <p className="text-muted-foreground text-sm">
            {t('loading.body', { days: state.windowDays })}
          </p>
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-4 space-y-3">
          <p className="text-destructive text-sm">{state.message}</p>
          <Button variant="outline" onClick={state.onRetry}>
            {t('error.retry')}
          </Button>
        </div>
      ) : null}

      {state.status === 'done' ? (
        <>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <Badge
              variant={
                state.data.payload.recomendacao === 'comprar'
                  ? 'success'
                  : state.data.payload.recomendacao === 'nao_comprar'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {t(`done.reco.${state.data.payload.recomendacao}`)}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {new Date(state.data.generatedAt).toLocaleString('pt-BR')}
            </span>
            {state.onRefresh ? (
              <Button variant="ghost" size="sm" onClick={state.onRefresh} className="ml-auto">
                <RefreshCcw className="mr-1 size-3.5" /> {t('done.refresh')}
              </Button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label={t('done.tendencia')} value={state.data.payload.tendencia} />
            <Stat label={t('done.confianca')} value={`${state.data.payload.confianca}%`} />
            <Stat label={t('done.horizonte')} value={state.data.payload.horizonte} />
          </div>

          <Separator className="my-4" />

          <EditorialQuote>{state.data.payload.justificativa}</EditorialQuote>

          {state.data.payload.padroes.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {state.data.payload.padroes.map((p) => (
                <Badge key={p} variant="outline">
                  {p}
                </Badge>
              ))}
            </div>
          ) : null}

          {state.data.payload.riscos.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.data.payload.riscos.map((r) => (
                <Badge key={r} variant="warning">
                  {r}
                </Badge>
              ))}
            </div>
          ) : null}

          <p className="mt-4 text-sm">{state.data.payload.sugestao}</p>

          <AiDisclaimer
            promptKey={state.data.promptKey}
            promptVersion={state.data.promptVersion}
            generatedAt={state.data.generatedAt}
          />
        </>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-md border px-3 py-2">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
