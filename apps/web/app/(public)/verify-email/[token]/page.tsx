import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  params: Promise<{ token: string }>;
}

async function verify(token: string): Promise<'ok' | 'error'> {
  const url = process.env.API_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!url) return 'error';
  const res = await fetch(`${url}/api/v1/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  });
  return res.ok ? 'ok' : 'error';
}

export default async function VerifyEmailPage({ params }: PageProps) {
  const { token } = await params;
  const t = await getTranslations('auth.verify');
  const status = await verify(token);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Logo href="/" />
      {status === 'ok' ? (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-medium">{t('success_title')}</h1>
          <p className="text-muted-foreground text-sm">{t('success_body')}</p>
          <Button asChild>
            <Link href="/login">{t('go_to_login')}</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-medium">{t('error_title')}</h1>
          <p className="text-muted-foreground text-sm">{t('error_body')}</p>
          <Button variant="outline" asChild>
            <Link href="/login">{t('go_to_login')}</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
