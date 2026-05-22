import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('@/lib/env', () => ({
  env: {
    API_URL: 'http://api:3001',
    NEXT_PUBLIC_API_URL: 'https://api.example.com',
    INTERNAL_SERVICE_TOKEN: 'test-token-32-chars-xxxxxxxxxxxx',
  },
}));

import { internalFetch } from '../internal-api';

function fetchFailed(causeCode?: string, address?: string): TypeError {
  const err = new TypeError('fetch failed');
  if (causeCode) {
    (err as { cause?: unknown }).cause = { code: causeCode, address };
  }
  return err;
}

describe('internalFetch', () => {
  beforeEach(() => mockFetch.mockReset());

  it('inclui x-internal-token e Content-Type', async () => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

    await internalFetch('/api/v1/internal/users/sync', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://api:3001/api/v1/internal/users/sync',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-internal-token': 'test-token-32-chars-xxxxxxxxxxxx',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('usa API_URL como base', async () => {
    mockFetch.mockResolvedValue(new Response('', { status: 200 }));

    await internalFetch('/api/v1/internal/users/by-email', { method: 'DELETE' });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('http://api:3001/api/v1/internal/users/by-email');
  });

  it('propaga a Response para o caller', async () => {
    const fakeResponse = new Response('{"id":"u1"}', { status: 201 });
    mockFetch.mockResolvedValue(fakeResponse);

    const res = await internalFetch('/api/v1/internal/users/sync', {
      method: 'POST',
    });

    expect(res).toBe(fakeResponse);
  });

  // Regressão: rede privada do Railway falhou em staging com
  // `TypeError: fetch failed` no callback OAuth do NextAuth. Sem
  // fallback, o login Google ficou 100% quebrado.
  it('cai para NEXT_PUBLIC_API_URL quando internal fetch falha com ENOTFOUND', async () => {
    mockFetch
      .mockRejectedValueOnce(fetchFailed('ENOTFOUND', 'api.railway.internal'))
      .mockResolvedValueOnce(new Response('{"id":"u1"}', { status: 200 }));

    const res = await internalFetch('/api/v1/internal/users/sync', {
      method: 'POST',
    });

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe('http://api:3001/api/v1/internal/users/sync');
    expect(mockFetch.mock.calls[1][0]).toBe('https://api.example.com/api/v1/internal/users/sync');
    expect((mockFetch.mock.calls[1][1] as RequestInit).headers).toMatchObject({
      'x-internal-token': 'test-token-32-chars-xxxxxxxxxxxx',
    });
  });

  it('cai para fallback em ECONNREFUSED', async () => {
    mockFetch
      .mockRejectedValueOnce(fetchFailed('ECONNREFUSED', '10.0.0.1'))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const res = await internalFetch('/api/v1/internal/users/sync', { method: 'POST' });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('cai para fallback em TypeError sem code (caso típico do undici)', async () => {
    mockFetch
      .mockRejectedValueOnce(fetchFailed())
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const res = await internalFetch('/api/v1/internal/users/sync', { method: 'POST' });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('relança erros que não são de rede (não retenta)', async () => {
    const programmingErr = new Error('boom unrelated');
    mockFetch.mockRejectedValueOnce(programmingErr);

    await expect(internalFetch('/api/v1/internal/users/sync', { method: 'POST' })).rejects.toBe(
      programmingErr,
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('propaga não-2xx do fallback (não mascara 401/500)', async () => {
    mockFetch
      .mockRejectedValueOnce(fetchFailed('ENOTFOUND'))
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));

    const res = await internalFetch('/api/v1/internal/users/sync', { method: 'POST' });
    expect(res.status).toBe(401);
  });
});
