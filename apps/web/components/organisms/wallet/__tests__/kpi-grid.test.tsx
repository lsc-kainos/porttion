import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { KpiGrid } from '../kpi-grid';
import type { WalletDetail } from '@kainos/shared-types';

const messages = {
  wallet: {
    kpi: {
      patrimonio: 'Patrimônio',
      plTotal: 'P&L total',
      plCaption: 'Custo {custo}',
      variacaoDia: 'Variação do dia',
      positionsCount: 'Posições',
      positionsCaption: '{count, plural, =0 {Nenhuma posição} one {# ativo} other {# ativos}}',
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

const baseWallet = {
  id: 'w1',
  name: 'X',
  baseCurrency: 'BRL',
  strategy: null,
  positionsCount: 2,
  createdAt: '',
  updatedAt: '',
  custoTotal: 5000,
  positions: [],
  allocationByClass: [],
} as unknown as WalletDetail;

describe('KpiGrid', () => {
  it('mostra "—" quando KPIs são null e marca stale', () => {
    render(
      <Wrapper>
        <KpiGrid
          wallet={{
            ...baseWallet,
            patrimonio: null,
            plTotal: null,
            variacaoDiaPct: null,
            stale: true,
          }}
        />
      </Wrapper>,
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('mostra valores formatados em BRL e tone positive para P&L > 0', () => {
    render(
      <Wrapper>
        <KpiGrid
          wallet={{
            ...baseWallet,
            patrimonio: 6000,
            plTotal: 1000,
            variacaoDiaPct: 1.5,
            stale: false,
          }}
        />
      </Wrapper>,
    );
    expect(screen.getByText(/R\$\s*6.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/\+1,50%/)).toBeInTheDocument();
  });
});
