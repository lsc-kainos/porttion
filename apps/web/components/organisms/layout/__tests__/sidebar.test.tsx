import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/pt-BR.json';
import { Sidebar } from '../sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));
vi.mock('@/components/organisms/layout/wallet-switcher', () => ({
  WalletSwitcher: () => <div data-testid="wallet-switcher" />,
}));

describe('Sidebar', () => {
  it('renderiza links principais', () => {
    render(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <Sidebar />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /carteira/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /configura/i })).toBeInTheDocument();
  });
});
