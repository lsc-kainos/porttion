import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { AllocationDonut } from '../allocation-donut';
import type { WalletDetail } from '@kainos/shared-types';

// recharts doesn't render meaningfully under happy-dom
vi.mock('@/components/atoms/charts/donut', () => ({
  Donut: ({ data }: { data: { key: string }[] }) => (
    <div data-testid="donut">{data.map((d) => d.key).join(',')}</div>
  ),
}));

const messages = {
  wallet: {
    allocation: {
      title: 'Alocação',
      empty: 'Sem dados de alocação ainda.',
      classes: {
        acoes_br: 'Ações BR',
        etf: 'ETFs',
        renda_fixa: 'Renda fixa',
        cripto: 'Cripto',
        moeda: 'Moeda',
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

describe('AllocationDonut', () => {
  it('mostra empty state quando allocation vazia', () => {
    render(
      <Wrapper>
        <AllocationDonut wallet={{ allocationByClass: [] } as unknown as WalletDetail} />
      </Wrapper>,
    );
    expect(screen.getByText(/sem dados de aloca/i)).toBeInTheDocument();
  });

  it('renderiza percentuais para cada classe', () => {
    const w = {
      allocationByClass: [
        { assetClass: 'acoes_br', valor: 3000, pct: 60 },
        { assetClass: 'cripto', valor: 2000, pct: 40 },
      ],
    } as unknown as WalletDetail;
    render(
      <Wrapper>
        <AllocationDonut wallet={w} />
      </Wrapper>,
    );
    expect(screen.getByText('60,0%')).toBeInTheDocument();
    expect(screen.getByText('40,0%')).toBeInTheDocument();
  });
});
