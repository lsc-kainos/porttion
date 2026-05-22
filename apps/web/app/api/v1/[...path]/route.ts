import { NextResponse, type NextRequest } from 'next/server';
import { apiFetch } from '@/lib/api';
import { describeCause, isNetworkError } from '@/lib/fetch-with-fallback';

// Catch-all proxy do web pra API. Encaminha GET/POST/PATCH/DELETE de
// /api/v1/* mantendo o JWT no Authorization (apiFetch resolve via cookie).
// Rotas mais específicas no mesmo segmento (ex.: /api/v1/me/route.ts) têm
// precedência sobre esse catch-all.

interface Ctx {
  params: Promise<{ path: string[] }>;
}

async function proxy(req: NextRequest, ctx: Ctx, method: string): Promise<Response> {
  const { path } = await ctx.params;
  const search = req.nextUrl.search ?? '';
  const target = `/api/v1/${path.join('/')}${search}`;
  const init: RequestInit = { method };
  if (method !== 'GET' && method !== 'DELETE') {
    init.body = await req.text();
  }
  try {
    const r = await apiFetch(target, init, req);
    const body = await r.text();
    return new NextResponse(body, {
      status: r.status,
      headers: { 'Content-Type': r.headers.get('content-type') ?? 'application/json' },
    });
  } catch (err) {
    // apiFetch já tentou URL primária e fallback. Se ambas falharam por
    // rede, devolvemos 502 estruturado em vez do 500 vazio do Next.
    if (isNetworkError(err)) {
      const cause = describeCause(err);
      console.error('[api-proxy] upstream unreachable', {
        method,
        path: target,
        code: cause.code,
        address: cause.address,
        message: cause.message,
      });
      return NextResponse.json(
        {
          statusCode: 502,
          message: 'API indisponível',
          code: cause.code ?? 'UPSTREAM_UNREACHABLE',
        },
        { status: 502 },
      );
    }
    throw err;
  }
}

export const GET = (req: NextRequest, ctx: Ctx): Promise<Response> => proxy(req, ctx, 'GET');
export const POST = (req: NextRequest, ctx: Ctx): Promise<Response> => proxy(req, ctx, 'POST');
export const PATCH = (req: NextRequest, ctx: Ctx): Promise<Response> => proxy(req, ctx, 'PATCH');
export const DELETE = (req: NextRequest, ctx: Ctx): Promise<Response> => proxy(req, ctx, 'DELETE');
