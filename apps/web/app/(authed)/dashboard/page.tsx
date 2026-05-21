'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useWalletSwitcher } from '@/components/providers/wallet-switcher-provider';
import { useWalletDetail } from '@/hooks/wallet/use-wallet-detail';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { KpiGrid } from '@/components/organisms/wallet/kpi-grid';
import { PositionsTable } from '@/components/organisms/wallet/positions-table';
import { AllocationDonut } from '@/components/organisms/wallet/allocation-donut';
import { EvolutionPlaceholder } from '@/components/organisms/wallet/evolution-placeholder';
import { AiInsightPlaceholder } from '@/components/organisms/wallet/ai-insight-placeholder';
import { WatchlistPlaceholder } from '@/components/organisms/wallet/watchlist-placeholder';
import { WalletEmptyState } from '@/components/organisms/wallet/wallet-empty-state';
import { CreateWalletDialog } from '@/components/organisms/wallet/create-wallet-dialog';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { activeWallet, wallets } = useWalletSwitcher();
  const { data, isLoading } = useWalletDetail(activeWallet?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);

  if (wallets.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <WalletEmptyState onCreate={() => setCreateOpen(true)} />
        <CreateWalletDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    );
  }

  if (isLoading || !data) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-muted-foreground text-xs tracking-wide uppercase">{t('title')}</p>
        <h1 className="font-serif text-3xl italic">{data.name}</h1>
      </header>
      <KpiGrid wallet={data} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EvolutionPlaceholder />
        </div>
        <AllocationDonut wallet={data} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PositionsTable wallet={data} />
        </div>
        <AiInsightPlaceholder />
      </div>
      <WatchlistPlaceholder />
    </div>
  );
}
