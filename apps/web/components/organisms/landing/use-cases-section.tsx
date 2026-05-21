'use client';
import { useTranslations } from 'next-intl';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';
import { EditorialQuote } from '@/components/atoms/typography/editorial-quote';

const ITEMS = ['beginner', 'intermediate', 'multi'] as const;

export function UseCasesSection() {
  const t = useTranslations('landing.useCases');
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <EditorialSectionHeader eyebrow={t('eyebrow')} title={t('title')} />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {ITEMS.map((k) => (
            <div key={k} className="bg-card rounded-2xl border p-6">
              <h3 className="font-serif text-xl italic">{t(`items.${k}.title`)}</h3>
              <div className="mt-4">
                <EditorialQuote>{t(`items.${k}.quote`)}</EditorialQuote>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
