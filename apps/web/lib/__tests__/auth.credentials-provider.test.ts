import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/internal-api', () => ({ internalFetch: vi.fn() }));
vi.mock('@/lib/env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'g',
    GOOGLE_CLIENT_SECRET: 'g',
    NEXTAUTH_SECRET: 'a'.repeat(32),
  },
}));
vi.mock('@/lib/secret-fingerprint', () => ({ secretFingerprint: () => 'fp' }));

import { internalFetch } from '@/lib/internal-api';
import { authOptions } from '../auth';

function credentialsProvider() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = authOptions.providers.find((p: any) => p.id === 'credentials') as any;
  // NextAuth's CredentialsProvider stores the real authorize in options.authorize
  // (the top-level authorize is a stub `() => null`). Use options.authorize to
  // actually invoke the implementation.
  return {
    ...provider,
    authorize: provider.options.authorize,
  };
}

describe('Credentials provider', () => {
  beforeEach(() => vi.mocked(internalFetch).mockReset());

  it('retorna user em 200', async () => {
    vi.mocked(internalFetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'u1', email: 'a@b.com', name: 'A', avatar: null }), {
        status: 200,
      }) as unknown as Response,
    );
    const res = await credentialsProvider().authorize({ email: 'a@b.com', password: 'p' });
    expect(res).toEqual({ id: 'u1', email: 'a@b.com', name: 'A', image: null });
  });

  it('lança EmailNotVerified em 401 + mensagem "não verificado"', async () => {
    vi.mocked(internalFetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Email não verificado.' }), {
        status: 401,
      }) as unknown as Response,
    );
    await expect(
      credentialsProvider().authorize({ email: 'a@b.com', password: 'p' }),
    ).rejects.toThrow('EmailNotVerified');
  });

  it('lança CredentialsSignin em 401 genérico', async () => {
    vi.mocked(internalFetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Credenciais inválidas.' }), {
        status: 401,
      }) as unknown as Response,
    );
    await expect(
      credentialsProvider().authorize({ email: 'a@b.com', password: 'p' }),
    ).rejects.toThrow('CredentialsSignin');
  });

  it('retorna null se credenciais ausentes', async () => {
    const res = await credentialsProvider().authorize({});
    expect(res).toBeNull();
  });
});
