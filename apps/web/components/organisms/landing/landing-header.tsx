'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/atoms/icons/brand/logo';
import { Button } from '@/components/atoms/ui/button';
import { cn } from '@/lib/utils';

export function LandingHeader() {
  const t = useTranslations('landing.header');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors',
        scrolled ? 'bg-background/80 border-b backdrop-blur' : 'bg-transparent',
      )}
      data-scrolled={scrolled ? 'true' : 'false'}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Logo />
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <a
            href="#valor"
            className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm"
          >
            {t('nav.value')}
          </a>
          <a href="#como" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">
            {t('nav.how')}
          </a>
          <a href="#ia" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">
            {t('nav.ai')}
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm">
            {t('nav.faq')}
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button asChild variant="ghost">
            <Link href="/login">{t('login')}</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">{t('signup')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
