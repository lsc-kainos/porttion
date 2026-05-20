'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('auth.reset');
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    const data = new FormData(e.currentTarget);
    const newPassword = String(data.get('password') ?? '');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    setState(res.ok ? 'success' : 'error');
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">{t('success_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('success_body')}</p>
        <Button asChild>
          <Link href="/login">{t('go_to_login')}</Link>
        </Button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">{t('error_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('error_body')}</p>
        <Button variant="outline" asChild>
          <Link href="/forgot-password">{t('request_new_link')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
      <Button type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? '…' : t('submit')}
      </Button>
    </form>
  );
}
