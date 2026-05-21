'use client';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { Card } from '@/components/atoms/ui/card';
import type { WalletSummary } from '@kainos/shared-types';

interface Props {
  wallet: WalletSummary;
}

export function WalletCardLarge({ wallet }: Props) {
  const t = useTranslations('wallet.card');
  const fmt = useFormatter();

  function brl(v: number | null): string {
    if (v == null) return '—';
    return fmt.number(v, { style: 'currency', currency: wallet.baseCurrency });
  }

  return (
    <Link href={`/carteiras/${wallet.id}`}>
      <Card className="cursor-pointer rounded-2xl p-6 transition-shadow hover:shadow-md">
        <header className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold">{wallet.name}</h3>
          {wallet.stale ? <span className="text-xs text-amber-600">{t('stale')}</span> : null}
        </header>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('patrimonio')}
            </p>
            <p className="font-serif text-2xl">{brl(wallet.patrimonio)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">{t('pl')}</p>
            <p className="font-serif text-2xl">{brl(wallet.plTotal)}</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-sm">
          {t('positions', { count: wallet.positionsCount })}
        </p>
      </Card>
    </Link>
  );
}
