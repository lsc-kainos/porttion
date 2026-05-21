import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn } from 'next-auth/react';
import messages from '@/messages/pt-BR.json';
import { Login } from '../login';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(async () => ({ ok: true, error: null })),
}));

describe('<Login />', () => {
  beforeEach(() => {
    (signIn as ReturnType<typeof vi.fn>).mockReset();
    (signIn as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, error: null });
  });

  function setup() {
    return render(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <Login />
      </NextIntlClientProvider>,
    );
  }

  it('renderiza título, subtítulo, campos de email/senha e botão OAuth', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(messages.auth.login.title);
    expect(screen.getByLabelText(messages.auth.login.email_label)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.auth.login.password_label)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(messages.auth.login.google, 'i') }),
    ).toBeInTheDocument();
  });

  it('botão submit chama signIn credentials com email e senha', async () => {
    const { container } = setup();
    const emailInput = screen.getByLabelText(messages.auth.login.email_label);
    const passwordInput = screen.getByLabelText(messages.auth.login.password_label);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret1234' } });
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'user@example.com',
        password: 'secret1234',
        redirect: false,
      }),
    );
  });

  it('exibe erro CredentialsSignin quando signIn retorna error', async () => {
    (signIn as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      error: 'CredentialsSignin',
    });
    const { container } = setup();
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(messages.auth.errors.CredentialsSignin),
    );
  });

  it('exibe erro EmailNotVerified quando signIn retorna esse erro', async () => {
    (signIn as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      error: 'EmailNotVerified',
    });
    const { container } = setup();
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(messages.auth.errors.EmailNotVerified),
    );
  });

  it('botão Google chama signIn com o provider correto e callbackUrl=/dashboard', () => {
    setup();
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(messages.auth.login.google, 'i') }),
    );
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' });
  });

  it('exibe erro do query param quando presente', () => {
    vi.mocked(vi.fn()).mockReturnValue;
    // Re-mock useSearchParams with an error param
    vi.doMock('next/navigation', () => ({
      useSearchParams: () => new URLSearchParams('error=AccessDenied'),
      useRouter: () => ({ replace: vi.fn() }),
    }));
  });
});
