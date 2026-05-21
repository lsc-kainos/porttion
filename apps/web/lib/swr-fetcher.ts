import type { ApiError } from '@kainos/shared-types';

// Fetcher genérico do SWR para chamadas à API autenticada.
// Cookie de sessão (NextAuth) é enviado automaticamente. Erros HTTP
// viram exception com payload { statusCode, message } pra UI poder ler.
export async function swrFetcher<T>(path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `/api${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
    }));
    throw Object.assign(new Error(Array.isArray(body.message) ? body.message[0] : body.message), {
      statusCode: body.statusCode,
      body,
    });
  }
  return res.json() as Promise<T>;
}
