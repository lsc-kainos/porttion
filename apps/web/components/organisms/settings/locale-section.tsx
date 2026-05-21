'use client';
import { useTranslations } from 'next-intl';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';

export function LocaleSection() {
  const t = useTranslations('settings.locale');
  return (
    <section className="space-y-6">
      <EditorialSectionHeader eyebrow={t('eyebrow')} title={t('title')} align="left" />
      <div className="bg-card rounded-2xl border p-6">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('language')}
            </dt>
            <dd className="mt-0.5 font-medium">pt-BR</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('timezone')}
            </dt>
            <dd className="mt-0.5 font-medium">America/Sao_Paulo</dd>
          </div>
        </dl>
        <p className="text-muted-foreground mt-3 text-sm">{t('note')}</p>
      </div>
    </section>
  );
}
