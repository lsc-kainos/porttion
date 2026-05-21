'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';

export function HeroSection() {
  const t = useTranslations('landing.hero');
  return (
    <section className="px-4 py-20 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="font-serif text-[clamp(2rem,8vw,3.5rem)] leading-[1.05]">
          {t.rich('headline', {
            italic: (chunks) => <span className="italic">{chunks}</span>,
          })}
        </h1>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">{t('subhead')}</p>
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
