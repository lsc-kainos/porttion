'use client';
import useSWR from 'swr';
import type { WalletSummary } from '@kainos/shared-types';

export function useWalletsList(initialData?: WalletSummary[]) {
  return useSWR<WalletSummary[]>('/v1/wallets', { fallbackData: initialData });
}
