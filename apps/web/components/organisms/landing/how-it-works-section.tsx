'use client';
import { useTranslations } from 'next-intl';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';

const STEPS = ['wallet', 'positions', 'kpis', 'ai'] as const;

export function HowItWorksSection() {
  const t = useTranslations('landing.how');
  return (
    <section id="como" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <EditorialSectionHeader eyebrow={t('eyebrow')} title={t('title')} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((k, idx) => (
            <div key={k} className="bg-card rounded-2xl border p-6">
              <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-serif text-xl italic">{t(`steps.${k}.title`)}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{t(`steps.${k}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
