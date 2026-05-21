'use client';
import useSWR from 'swr';
import type { WalletDetail } from '@kainos/shared-types';

export function useWalletDetail(walletId: string | null) {
  return useSWR<WalletDetail>(walletId ? `/v1/wallets/${walletId}` : null);
}
