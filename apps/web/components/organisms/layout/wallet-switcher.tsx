'use client';
import { useTranslations } from 'next-intl';
import { ChevronsUpDown, Plus, Check } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/atoms/ui/popover';
import { useWalletSwitcher } from '@/components/providers/wallet-switcher-provider';
import { cn } from '@/lib/utils';

export function WalletSwitcher() {
  const t = useTranslations('sidebar');
  const { wallets, activeWallet, switchWallet } = useWalletSwitcher();

  if (wallets.length === 0) {
    return (
      <Button variant="outline" className="w-full justify-start" disabled>
        <Plus className="mr-2 size-4" />
        {t('createFirstWallet')}
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">{activeWallet?.name ?? '—'}</span>
          <ChevronsUpDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        {wallets.map((w) => (
          <button
            key={w.id}
            onClick={() => switchWallet(w.id)}
            className={cn(
              'hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-sm',
              activeWallet?.id === w.id && 'bg-accent/50',
            )}
          >
            <span className="truncate">{w.name}</span>
            {activeWallet?.id === w.id ? <Check className="size-4" /> : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
