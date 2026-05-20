'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';
import { GoogleLogo } from './google-logo';
import { GithubLogo } from './github-logo';

const ERROR_KEYS = [
  'Configuration',
  'AccessDenied',
  'Verification',
  'OAuthAccountNotLinked',
  'CredentialsSignin',
  'EmailNotVerified',
  'Default',
] as const;
type ErrorKey = (typeof ERROR_KEYS)[number];

export function Login() {
  const t = useTranslations('auth.login');
  const tErr = useTranslations('auth.errors');
  const params = useSearchParams();
  const router = useRouter();
  const errorParam = params.get('error');
  const errorKey: ErrorKey | null = errorParam
    ? (ERROR_KEYS as readonly string[]).includes(errorParam)
      ? (errorParam as ErrorKey)
      : 'Default'
    : null;

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<ErrorKey | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    const data = new FormData(e.currentTarget);
    const res = await signIn('credentials', {
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
      redirect: false,
    });
    setSubmitting(false);
    if (!res || res.error) {
      const key: ErrorKey =
        res?.error === 'EmailNotVerified' ? 'EmailNotVerified' : 'CredentialsSignin';
      setLocalError(key);
      return;
    }
    router.replace('/dashboard');
  }

  const visibleError: ErrorKey | null = localError ?? errorKey;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Logo href="/" />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t('email_label')}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t('password_label')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        {visibleError ? (
          <p className="text-sm text-[var(--destructive)]" role="alert">
            {tErr(visibleError)}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? '…' : t('submit')}
        </Button>
        <Link href="/forgot-password" className="text-muted-foreground text-sm underline">
          {t('forgot')}
        </Link>
      </form>

      <div className="text-muted-foreground flex items-center gap-3 text-xs tracking-[0.14em] uppercase">
        <span className="h-px flex-1 bg-[var(--border)]" />
        {t('or')}
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="outline" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
          <GoogleLogo /> {t('google')}
        </Button>
        <Button variant="outline" onClick={() => signIn('github', { callbackUrl: '/dashboard' })}>
          <GithubLogo /> {t('github')}
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        {t('no_account')}{' '}
        <Link href="/signup" className="underline">
          {t('go_to_signup')}
        </Link>
      </p>
    </main>
  );
}
