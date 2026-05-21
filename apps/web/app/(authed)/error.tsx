'use client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ErrorShell } from '@/components/templates/error-shell';
import { Button } from '@/components/atoms/ui/button';

export default function AuthedError({ reset }: { reset: () => void }) {
  const t = useTranslations('error.500');
  return (
    <ErrorShell
      eyebrow={t('eyebrow')}
      title={t('title')}
      body={t('body')}
      actions={
        <>
          <Button onClick={reset}>{t('retry')}</Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">{t('dashboard')}</Link>
          </Button>
        </>
      }
    />
  );
}
