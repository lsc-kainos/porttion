'use client';
import useSWR from 'swr';
import type { WalletSummary } from '@/types/wallet';

export function useWalletsList(initialData?: WalletSummary[]) {
  return useSWR<WalletSummary[]>('/v1/wallets', { fallbackData: initialData });
}
