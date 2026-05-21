import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { CreateWalletDialog } from '../create-wallet-dialog';

vi.mock('@/hooks/wallet/use-mutate-wallet', () => ({
  useMutateWallet: () => ({ create: vi.fn().mockResolvedValue({ id: 'w-new' }) }),
}));
vi.mock('@/hooks/shared/use-media-query', () => ({ useMediaQuery: () => true }));

const messages = {
  wallet: {
    create: {
      title: 'Nova carteira',
      name: { label: 'Nome' },
      currency: { label: 'Moeda base' },
      strategy: {
        label: 'Estratégia',
        none: 'Sem estratégia',
        options: {
          balanceada: 'Balanceada',
          crescimento: 'Crescimento',
          renda: 'Renda',
          personalizada: 'Personalizada',
        },
      },
      cancel: 'Cancelar',
      submit: 'Criar',
      submitting: 'Criando…',
      errors: {
        duplicate: 'Você já tem uma carteira com esse nome',
        generic: 'Não foi possível criar agora',
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

describe('CreateWalletDialog', () => {
  it('submete e chama onCreated com id', async () => {
    const onCreated = vi.fn();
    render(
      <Wrapper>
        <CreateWalletDialog open onOpenChange={() => {}} onCreated={onCreated} />
      </Wrapper>,
    );
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Principal' } });
    fireEvent.click(screen.getByRole('button', { name: /criar/i }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('w-new'));
  });
});
