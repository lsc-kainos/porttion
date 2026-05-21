'use client';
import { useWalletSwitcher } from '@/components/providers/wallet-switcher-provider';

export function useActiveWallet() {
  return useWalletSwitcher().activeWallet;
}
