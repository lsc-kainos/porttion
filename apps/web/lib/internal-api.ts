import { env } from './env';
import { fetchWithFallback } from './fetch-with-fallback';

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

export function internalFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetchWithFallback({
    primary: env.API_URL,
    fallback: env.NEXT_PUBLIC_API_URL,
    path,
    init: buildInit(init),
    label: 'internal-api',
  });
}
