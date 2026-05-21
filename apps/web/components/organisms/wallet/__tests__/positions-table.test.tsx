import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { PositionsTable } from '../positions-table';
import type { WalletDetail } from '@kainos/shared-types';

vi.mock('@/hooks/shared/use-media-query', () => ({ useMediaQuery: vi.fn() }));
import { useMediaQuery } from '@/hooks/shared/use-media-query';

const messages = {
  wallet: {
    positions: {
      empty: 'Nenhuma posição ainda.',
      ticker: 'Ticker',
      qty: 'Qtd',
      avgPrice: 'Preço médio',
      quote: 'Cotação',
      valor: 'Valor',
      pl: 'P&L',
    },
  },
  position: {
    row: { unavailable: 'indisponível' },
    card: {
      unavailable: 'indisponível',
      qtyAvg: '{qty} × {avg}',
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

const wallet = {
  id: 'w1',
  name: 'X',
  baseCurrency: 'BRL',
  strategy: null,
  positionsCount: 1,
  patrimonio: 3000,
  plTotal: 300,
  variacaoDiaPct: 1,
  stale: false,
  createdAt: '',
  updatedAt: '',
  custoTotal: 2700,
  positions: [
    {
      id: 'p1',
      ticker: 'PETR4',
      qty: 100,
      avgPrice: 27,
      assetClass: 'acoes_br',
      quote: 30,
      changePct: 1,
      valor: 3000,
      pl: 300,
      plPct: 11,
      stale: false,
      lastUpdate: '',
    },
  ],
  allocationByClass: [],
} as unknown as WalletDetail;

describe('PositionsTable', () => {
  it('renderiza <table> em desktop', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true);
    render(
      <Wrapper>
        <PositionsTable wallet={wallet} />
      </Wrapper>,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
  it('renderiza cards em mobile', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(false);
    render(
      <Wrapper>
        <PositionsTable wallet={wallet} />
      </Wrapper>,
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('PETR4')).toBeInTheDocument();
  });
  it('mostra "indisponível" quando quote é null sem quebrar', () => {
    (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const stale = {
      ...wallet,
      positions: [{ ...wallet.positions[0], quote: null, valor: null, pl: null }],
    };
    render(
      <Wrapper>
        <PositionsTable wallet={stale} />
      </Wrapper>,
    );
    expect(screen.getAllByText(/indispon/i).length).toBeGreaterThan(0);
  });
});
