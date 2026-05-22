import { env } from './env';

// Códigos reportados pelo undici/Node ao falhar conexão. Vêm em
// `error.cause.code` (TypeError: fetch failed) ou em
// `error.cause.errors[].code` quando AggregateError (dual-stack).
const NETWORK_ERROR_CODES = new Set([
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);

function describeCause(err: unknown): { code?: string; address?: string; message: string } {
  if (!(err instanceof Error)) return { message: String(err) };
  const cause = (err as { cause?: unknown }).cause as
    | { code?: string; address?: string; errors?: Array<{ code?: string; address?: string }> }
    | undefined;
  if (!cause) return { message: err.message };
  if (cause.code) return { code: cause.code, address: cause.address, message: err.message };
  const inner = cause.errors?.[0];
  if (inner?.code) return { code: inner.code, address: inner.address, message: err.message };
  return { message: err.message };
}

function isNetworkError(err: unknown): boolean {
  const { code } = describeCause(err);
  if (code && NETWORK_ERROR_CODES.has(code)) return true;
  // undici embrulha qualquer falha de socket em `TypeError: fetch failed`.
  // Sem code identificável, tratamos como falha de rede pra disparar o
  // fallback — falso-positivo aqui só causa um retry, não corrompe dado.
  return err instanceof TypeError && err.message === 'fetch failed';
}

function buildInit(init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
      'x-internal-token': env.INTERNAL_SERVICE_TOKEN,
    },
  };
}

export async function internalFetch(path: string, init?: RequestInit): Promise<Response> {
  const requestInit = buildInit(init);
  try {
    return await fetch(`${env.API_URL}${path}`, requestInit);
  } catch (err) {
    if (!isNetworkError(err)) throw err;

    // Fallback: a rede privada do Railway pode falhar (DNS IPv6-only
    // em envs legados, propagação lenta no boot, dispatcher dual-stack
    // abortando). Reenviamos a request pela URL pública — mesmo token
    // interno, mesmo destino, hop a mais pelo proxy externo. Sem isso
    // o callback do NextAuth derruba todo o fluxo OAuth com
    // `OAUTH_CALLBACK_HANDLER_ERROR: fetch failed`.
    const fallbackBase = env.NEXT_PUBLIC_API_URL;
    if (!fallbackBase || fallbackBase === env.API_URL) throw err;

    const { code, address, message } = describeCause(err);
    console.warn('[internal-api] internal fetch failed, retrying via public URL', {
      from: env.API_URL,
      to: fallbackBase,
      path,
      code,
      address,
      message,
    });

    return fetch(`${fallbackBase}${path}`, requestInit);
  }
}
