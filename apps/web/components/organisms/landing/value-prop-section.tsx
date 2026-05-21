'use client';
import { useTranslations } from 'next-intl';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';

export function ValuePropSection() {
  const t = useTranslations('landing.value');
  const items = ['privacy', 'noPromises', 'tech'] as const;
  return (
    <section id="valor" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <EditorialSectionHeader
          eyebrow={t('eyebrow')}
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((k) => (
            <div key={k} className="bg-card rounded-2xl border p-6">
              <h3 className="font-serif text-xl italic">{t(`items.${k}.title`)}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{t(`items.${k}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
