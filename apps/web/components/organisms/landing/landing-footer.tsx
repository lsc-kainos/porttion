'use client';
import { useTranslations } from 'next-intl';

export function LandingFooter() {
  const t = useTranslations('landing.footer');
  return (
    <footer className="border-t px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-muted-foreground text-sm">{t('copy')}</p>
        <nav className="flex items-center gap-4">
          <a
            href="/termos"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            {t('links.terms')}
          </a>
          <a
            href="/privacidade"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            {t('links.privacy')}
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            {t('links.github')}
          </a>
        </nav>
      </div>
    </footer>
  );
}
