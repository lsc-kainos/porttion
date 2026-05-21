'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';

export function ClosingCtaSection() {
  const t = useTranslations('landing.closing');
  return (
    <section className="px-4 py-20 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-serif text-[clamp(2rem,6vw,3rem)] leading-[1.05]">{t('title')}</h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl">{t('subhead')}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">{t('cta.primary')}</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/login">{t('cta.secondary')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
