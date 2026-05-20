'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupForm() {
  const t = useTranslations('auth.signup');
  const [state, setState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    setErrorMsg(null);
    const data = new FormData(e.currentTarget);
    const payload = {
      email: String(data.get('email') ?? ''),
      name: String(data.get('name') ?? ''),
      password: String(data.get('password') ?? ''),
    };
    setEmail(payload.email);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setState('submitted');
      return;
    }
    if (res.status === 409) {
      setState('error');
      setErrorMsg('Esse email já está em uso.');
      return;
    }
    setState('error');
    setErrorMsg('Não conseguimos criar sua conta. Tente de novo.');
  }

  if (state === 'submitted') {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">{t('success_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('success_body', { email })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t('name_label')}</Label>
        <Input id="name" name="name" type="text" required minLength={2} maxLength={80} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t('email_label')}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t('password_label')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={128}
        />
        <p className="text-muted-foreground text-xs">{t('password_hint')}</p>
      </div>
      {errorMsg ? <p className="text-sm text-[var(--destructive)]">{errorMsg}</p> : null}
      <Button type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? '…' : t('submit')}
      </Button>
      <p className="text-muted-foreground text-sm">
        {t('already_have_account')}{' '}
        <Link href="/login" className="underline">
          {t('go_to_login')}
        </Link>
      </p>
    </form>
  );
}
