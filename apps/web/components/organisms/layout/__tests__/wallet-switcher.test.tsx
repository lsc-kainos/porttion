import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/pt-BR.json';
import { WalletSwitcher } from '../wallet-switcher';
import { WalletSwitcherProvider } from '@/components/providers/wallet-switcher-provider';
import type { WalletSummary } from '@kainos/shared-types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const fixtures: WalletSummary[] = [
  {
    id: 'w1',
    name: 'Principal',
    baseCurrency: 'BRL',
    strategy: 'balanceada',
    positionsCount: 3,
    patrimonio: 1000,
    plTotal: 50,
    variacaoDiaPct: 0.5,
    stale: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'w2',
    name: 'Cripto',
    baseCurrency: 'BRL',
    strategy: 'crescimento',
    positionsCount: 1,
    patrimonio: null,
    plTotal: null,
    variacaoDiaPct: null,
    stale: true,
    createdAt: '',
    updatedAt: '',
  },
];

function wrap(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      {node}
    </NextIntlClientProvider>
  );
}

describe('WalletSwitcher', () => {
  it('mostra nome da carteira ativa', () => {
    render(
      wrap(
        <WalletSwitcherProvider initialWallets={fixtures} initialActiveId="w1">
          <WalletSwitcher />
        </WalletSwitcherProvider>,
      ),
    );
    expect(screen.getByText('Principal')).toBeInTheDocument();
  });

  it('abre popover e troca a carteira', async () => {
    render(
      wrap(
        <WalletSwitcherProvider initialWallets={fixtures} initialActiveId="w1">
          <WalletSwitcher />
        </WalletSwitcherProvider>,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /principal/i }));
    const item = await screen.findByText('Cripto');
    fireEvent.click(item);
    // Cookie escrito
    expect(document.cookie).toContain('porttion_active_wallet=w2');
  });

  it('mostra CTA "criar primeira" quando lista vazia', () => {
    render(
      wrap(
        <WalletSwitcherProvider initialWallets={[]} initialActiveId={null}>
          <WalletSwitcher />
        </WalletSwitcherProvider>,
      ),
    );
    expect(screen.getByRole('button', { name: /primeira carteira/i })).toBeInTheDocument();
  });
});
