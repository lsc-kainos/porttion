'use client';
import { useTranslations } from 'next-intl';
import { DeleteConfirmDialog } from '@/components/molecules/delete-confirm-dialog';
import { useMutateWallet } from '@/hooks/wallet/use-mutate-wallet';
import { useRouter } from 'next/navigation';
import type { WalletSummary } from '@kainos/shared-types';

interface Props {
  wallet: WalletSummary;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function DeleteWalletDialog({ wallet, open, onOpenChange }: Props) {
  const t = useTranslations('wallet.delete');
  const { remove } = useMutateWallet();
  const router = useRouter();
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title', { name: wallet.name })}
      message={t('message', { count: wallet.positionsCount })}
      confirmText={wallet.name}
      onConfirm={async () => {
        await remove(wallet.id);
        router.push('/carteiras');
      }}
    />
  );
}
