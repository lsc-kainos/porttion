import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/pt-BR.json';
import { Topbar } from '../topbar';

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

const user = {
  id: 'u',
  name: 'L',
  email: 'l@x.com',
  image: null,
  role: 'USER' as const,
};

function renderTopbar(role: 'USER' | 'ADMIN' = 'USER') {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <Topbar user={{ ...user, role }} />
    </NextIntlClientProvider>,
  );
}

describe('<Topbar />', () => {
  it('Desktop nav: Início aparece como link ativo apontando para /dashboard', () => {
    renderTopbar();
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(within(nav).getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/dashboard');
  });

  it('Desktop nav só aparece em lg+ (hidden lg:flex)', () => {
    renderTopbar();
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(nav.className).toMatch(/hidden/);
    expect(nav.className).toMatch(/lg:flex/);
  });

  it('Mobile hamburger trigger existe (lg:hidden) com aria-label', () => {
    renderTopbar();
    const trigger = screen.getByRole('button', {
      name: messages.topbar.nav.menu_label,
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger.className).toMatch(/lg:hidden/);
  });

  it('renderiza UserMenu trigger com aria-label', () => {
    renderTopbar();
    expect(
      screen.getByRole('button', { name: messages.topbar.user_menu_label }),
    ).toBeInTheDocument();
  });

  it('Role USER NÃO vê o item Admin na nav principal', () => {
    renderTopbar('USER');
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(within(nav).queryByRole('link', { name: /Admin/i })).toBeNull();
  });

  it('Role ADMIN vê o item Admin na nav principal apontando para /admin', () => {
    renderTopbar('ADMIN');
    const nav = screen.getByRole('navigation', { name: /primary/i });
    const adminLink = within(nav).getByRole('link', { name: /Admin/i });
    expect(adminLink).toHaveAttribute('href', '/admin');
  });
});
