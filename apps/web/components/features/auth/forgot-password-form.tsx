'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot');
  const [state, setState] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [email, setEmail] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    const data = new FormData(e.currentTarget);
    const value = String(data.get('email') ?? '');
    setEmail(value);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: value }),
    });
    setState('submitted');
  }

  if (state === 'submitted') {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">{t('submitted_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('submitted_body', { email })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t('email_label')}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <Button type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? '…' : t('submit')}
      </Button>
    </form>
  );
}
