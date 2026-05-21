'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { useWalletSwitcher } from '@/components/providers/wallet-switcher-provider';
import { WalletCardLarge } from '@/components/organisms/wallet/wallet-card-large';
import { WalletEmptyState } from '@/components/organisms/wallet/wallet-empty-state';
import { CreateWalletDialog } from '@/components/organisms/wallet/create-wallet-dialog';

export default function CarteirasPage() {
  const t = useTranslations('wallet.list');
  const { wallets } = useWalletSwitcher();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="font-serif text-3xl italic">{t('title')}</h1>
        {wallets.length > 0 ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('newCta')}
          </Button>
        ) : null}
      </header>

      {wallets.length === 0 ? (
        <WalletEmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {wallets.map((w) => (
            <WalletCardLarge key={w.id} wallet={w} />
          ))}
        </div>
      )}

      <CreateWalletDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
