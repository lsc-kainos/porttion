import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { TickerSearchInput } from '../ticker-search-input';

vi.mock('@/hooks/market/use-ticker-search', () => ({
  useTickerSearch: vi.fn(),
}));
import { useTickerSearch } from '@/hooks/market/use-ticker-search';

const messages = {
  asset: {
    search: {
      placeholder: 'Buscar ticker...',
      loading: 'Carregando...',
      empty: 'Nenhum resultado.',
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

describe('TickerSearchInput', () => {
  it('mostra resultados após digitar e debounce', async () => {
    (useTickerSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [
        { ticker: 'PETR4', name: 'Petrobras PN', assetClass: 'acoes_br', exchange: 'SAO' },
        { ticker: 'PETR3', name: 'Petrobras ON', assetClass: 'acoes_br', exchange: 'SAO' },
      ],
      isLoading: false,
    });
    render(
      <Wrapper>
        <TickerSearchInput value={null} onChange={() => {}} />
      </Wrapper>,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PETR' } });
    await waitFor(() => expect(screen.getByText('PETR4')).toBeInTheDocument());
    expect(screen.getByText('PETR3')).toBeInTheDocument();
  });

  it('chama onChange ao selecionar', async () => {
    (useTickerSearch as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [{ ticker: 'PETR4', name: 'Petrobras PN', assetClass: 'acoes_br', exchange: 'SAO' }],
      isLoading: false,
    });
    const onChange = vi.fn();
    render(
      <Wrapper>
        <TickerSearchInput value={null} onChange={onChange} />
      </Wrapper>,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'PETR' } });
    const item = await screen.findByText('PETR4');
    fireEvent.click(item);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ticker: 'PETR4' }));
  });
});
