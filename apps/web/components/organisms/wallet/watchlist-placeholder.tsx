'use client';
import { useTranslations } from 'next-intl';

export function WatchlistPlaceholder() {
  const t = useTranslations('dashboard.watchlist');
  return (
    <div className="bg-card rounded-2xl border p-6">
      <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        {t('title')}
      </h3>
      <div className="mt-3 flex flex-col items-start gap-2">
        <p className="font-serif text-xl italic">{t('headline')}</p>
        <p className="text-muted-foreground text-sm">{t('body')}</p>
      </div>
    </div>
  );
}
