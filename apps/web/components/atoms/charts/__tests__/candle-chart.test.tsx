import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { CandleChart } from '../candle-chart';
import type { Candle } from '@kainos/shared-types';

const messages = {
  asset: {
    chart: {
      empty: 'Sem dados de cotação para este período.',
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

const candles: Candle[] = [
  { date: '2026-05-01', open: 10, high: 12, low: 9, close: 11, volume: 100 }, // verde
  { date: '2026-05-02', open: 11, high: 11.5, low: 8, close: 9, volume: 150 }, // vermelho
  { date: '2026-05-03', open: 9, high: 10, low: 8.5, close: 9.8, volume: 80 }, // verde
];

describe('CandleChart', () => {
  it('renderiza N rects (corpos) e N linhas (mecha) para N candles', () => {
    const { container } = render(
      <Wrapper>
        <CandleChart candles={candles} />
      </Wrapper>,
    );
    const rects = container.querySelectorAll('rect[data-role="body"]');
    const wicks = container.querySelectorAll('line[data-role="wick"]');
    expect(rects).toHaveLength(3);
    expect(wicks).toHaveLength(3);
  });

  it('aplica cor verde para close>=open e vermelho para close<open', () => {
    const { container } = render(
      <Wrapper>
        <CandleChart candles={candles} />
      </Wrapper>,
    );
    const rects = Array.from(container.querySelectorAll('rect[data-role="body"]'));
    expect(rects[0].getAttribute('fill')).toMatch(/(emerald|green)/i);
    expect(rects[1].getAttribute('fill')).toMatch(/(red|destructive|rose)/i);
    expect(rects[2].getAttribute('fill')).toMatch(/(emerald|green)/i);
  });

  it('possui role="img" com aria-label resumindo período', () => {
    render(
      <Wrapper>
        <CandleChart candles={candles} />
      </Wrapper>,
    );
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label') ?? '').toMatch(/3 candles|2026-05-01.*2026-05-03/);
  });

  it('renderiza mensagem editorial quando candles vazio', () => {
    render(
      <Wrapper>
        <CandleChart candles={[]} />
      </Wrapper>,
    );
    expect(screen.getByText(/sem dados/i)).toBeInTheDocument();
  });
});
