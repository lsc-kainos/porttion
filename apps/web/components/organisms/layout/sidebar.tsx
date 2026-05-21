'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/atoms/icons/brand/logo';
import { WalletSwitcher } from './wallet-switcher';
import { LayoutDashboard, Wallet, Settings } from 'lucide-react';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/carteiras', icon: Wallet, key: 'carteiras' },
  { href: '/configuracoes', icon: Settings, key: 'configuracoes' },
] as const;

export function Sidebar() {
  const t = useTranslations('sidebar');
  const pathname = usePathname();
  return (
    <aside className="bg-background hidden h-screen w-64 shrink-0 flex-col border-r md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Logo showWordmark={false} />
        <span className="font-semibold">Porttion</span>
      </div>
      <div className="border-b p-3">
        <WalletSwitcher />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, icon: Icon, key }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
