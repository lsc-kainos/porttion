import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AIAnalysisCard } from '../ai-analysis-card';

const messages = {
  ai: {
    analysis: {
      title: 'Análise técnica do ativo',
      empty: {
        body: 'Gere uma análise técnica baseada nos últimos 7 dias de candles.',
        cta: 'Analisar agora',
      },
      loading: {
        body: 'Lendo {days} dias de candles e gerando análise…',
      },
      error: {
        retry: 'Tentar de novo',
      },
      done: {
        tendencia: 'Tendência',
        confianca: 'Confiança',
        horizonte: 'Horizonte',
        refresh: 'Atualizar',
        reco: {
          comprar: 'Comprar',
          manter: 'Manter',
          nao_comprar: 'Não comprar',
        },
      },
      disclaimer: 'Análise técnica gerada por IA. Não é recomendação de investimento.',
      errors: {
        ticker_invalid: 'Ticker não encontrado',
        candles_short: 'Dados de cotação insuficientes para análise',
        generic: 'Análise indisponível agora — tente novamente em alguns minutos',
      },
    },
  },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe('AIAnalysisCard', () => {
  it('empty: chama onAnalyze ao clicar', () => {
    const onAnalyze = vi.fn();
    render(
      <Wrapper>
        <AIAnalysisCard state={{ status: 'empty', onAnalyze }} />
      </Wrapper>,
    );
    fireEvent.click(screen.getByRole('button', { name: /analisar/i }));
    expect(onAnalyze).toHaveBeenCalled();
  });

  it('loading: mostra skeleton + body com windowDays', () => {
    render(
      <Wrapper>
        <AIAnalysisCard state={{ status: 'loading', windowDays: 7 }} />
      </Wrapper>,
    );
    expect(screen.getByText(/7/)).toBeInTheDocument();
  });

  it('done: justificativa em font-serif italic', () => {
    const data = {
      ticker: 'PETR4',
      windowDays: 7,
      generatedAt: '2026-05-20T00:00:00Z',
      promptKey: 'asset.analysis.v1',
      promptVersion: 1,
      cached: false,
      payload: {
        tendencia: 'alta' as const,
        recomendacao: 'comprar' as const,
        confianca: 70,
        padroes: ['engolfo'],
        riscos: ['vol'],
        sugestao: 's',
        justificativa: 'Padrão técnico identificado.',
        horizonte: '1-2 semanas',
      },
    };
    render(
      <Wrapper>
        <AIAnalysisCard state={{ status: 'done', data }} />
      </Wrapper>,
    );
    const quote = screen.getByText('Padrão técnico identificado.');
    expect(quote).toHaveClass('font-serif');
    expect(quote).toHaveClass('italic');
    // badge comprar verde
    expect(screen.getByText(/comprar/i)).toBeInTheDocument();
  });
});
