import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LandingHeader } from '../landing-header';

const messages = {
  landing: {
    header: {
      nav: { value: 'Valor', how: 'Como funciona', ai: 'IA', faq: 'FAQ' },
      login: 'Entrar',
      signup: 'Criar conta',
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

describe('LandingHeader', () => {
  it('aplica backdrop blur quando scrollY > 8', () => {
    const { container } = render(
      <Wrapper>
        <LandingHeader />
      </Wrapper>,
    );
    const header = container.querySelector('header');
    expect(header?.getAttribute('data-scrolled')).toBe('false');
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
    fireEvent.scroll(window);
    expect(header?.getAttribute('data-scrolled')).toBe('true');
  });

  it('renderiza links de login e signup', () => {
    render(
      <Wrapper>
        <LandingHeader />
      </Wrapper>,
    );
    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.getByText('Criar conta')).toBeInTheDocument();
  });
});
