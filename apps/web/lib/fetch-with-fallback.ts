// Helpers compartilhados pra detectar falha de rede no fetch e re-tentar
// numa URL pública quando a rede privada do Railway falha
// (DNS IPv6-only em envs legados, propagação lenta no boot, dispatcher
// dual-stack abortando, etc.). Usado por `internal-api.ts` (S2S) e
// `api.ts` (proxy de rotas de usuário).

const NETWORK_ERROR_CODES = new Set([
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);

export interface CauseInfo {
  code?: string;
  address?: string;
  message: string;
}

export function describeCause(err: unknown): CauseInfo {
  if (!(err instanceof Error)) return { message: String(err) };
  const cause = (err as { cause?: unknown }).cause as
    | {
        code?: string;
        address?: string;
        errors?: Array<{ code?: string; address?: string }>;
      }
    | undefined;
  if (!cause) return { message: err.message };
  if (cause.code) return { code: cause.code, address: cause.address, message: err.message };
  const inner = cause.errors?.[0];
  if (inner?.code) return { code: inner.code, address: inner.address, message: err.message };
  return { message: err.message };
}

export function isNetworkError(err: unknown): boolean {
  const { code } = describeCause(err);
  if (code && NETWORK_ERROR_CODES.has(code)) return true;
  // undici embrulha qualquer falha de socket em `TypeError: fetch failed`.
  // Sem code identificável, tratamos como falha de rede pra disparar o
  // fallback — falso-positivo aqui só causa um retry, não corrompe dado.
  return err instanceof TypeError && err.message === 'fetch failed';
}

interface FallbackOptions {
  primary: string;
  fallback: string | null | undefined;
  path: string;
  init: RequestInit;
  label: string;
}

export async function fetchWithFallback({
  primary,
  fallback,
  path,
  init,
  label,
}: FallbackOptions): Promise<Response> {
  try {
    return await fetch(`${primary}${path}`, init);
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    if (!fallback || fallback === primary) throw err;

    const { code, address, message } = describeCause(err);
    console.warn(`[${label}] primary fetch failed, retrying via fallback URL`, {
      from: primary,
      to: fallback,
      path,
      code,
      address,
      message,
    });

    return fetch(`${fallback}${path}`, init);
  }
}
