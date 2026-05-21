'use client';
import { useTranslations } from 'next-intl';
import { useMediaQuery } from '@/hooks/shared/use-media-query';
import { Table, TableHead, TableBody, TableHeader, TableRow } from '@/components/atoms/ui/table';
import { PositionRow } from './position-row';
import { PositionCard } from './position-card';
import type { WalletDetail } from '@kainos/shared-types';

interface Props {
  wallet: WalletDetail;
}

export function PositionsTable({ wallet }: Props) {
  const t = useTranslations('wallet.positions');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (wallet.positions.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border p-6 text-center text-sm">
        {t('empty')}
      </p>
    );
  }

  if (!isDesktop) {
    return (
      <div className="space-y-2">
        {wallet.positions.map((p) => (
          <PositionCard key={p.id} position={p} baseCurrency={wallet.baseCurrency} />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('ticker')}</TableHead>
          <TableHead className="text-right">{t('qty')}</TableHead>
          <TableHead className="text-right">{t('avgPrice')}</TableHead>
          <TableHead className="text-right">{t('quote')}</TableHead>
          <TableHead className="text-right">{t('valor')}</TableHead>
          <TableHead className="text-right">{t('pl')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {wallet.positions.map((p) => (
          <PositionRow key={p.id} position={p} baseCurrency={wallet.baseCurrency} />
        ))}
      </TableBody>
    </Table>
  );
}
