'use client';
import { useTranslations } from 'next-intl';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';
import { EditorialQuote } from '@/components/atoms/typography/editorial-quote';

const ITEMS = ['one', 'two'] as const;

export function TestimonialsSection() {
  const t = useTranslations('landing.testimonials');
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <EditorialSectionHeader eyebrow={t('eyebrow')} title={t('title')} />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {ITEMS.map((k) => (
            <figure key={k} className="bg-card rounded-2xl border p-6">
              <blockquote>
                <EditorialQuote>{t(`items.${k}.quote`)}</EditorialQuote>
              </blockquote>
              <figcaption className="text-muted-foreground mt-4 text-sm">
                {t(`items.${k}.author`)}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
