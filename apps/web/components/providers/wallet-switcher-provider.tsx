'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WalletSummary } from '@kainos/shared-types';
import { useWalletsList } from '@/hooks/shared/use-wallets-list';

interface Ctx {
  wallets: WalletSummary[];
  activeWallet: WalletSummary | null;
  switchWallet: (id: string) => void;
  refresh: () => Promise<unknown>;
}

const WalletSwitcherContext = createContext<Ctx | null>(null);

const COOKIE_KEY = 'porttion_active_wallet';

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
}

interface Props {
  initialWallets: WalletSummary[];
  initialActiveId: string | null;
  children: React.ReactNode;
}

export function WalletSwitcherProvider({ initialWallets, initialActiveId, children }: Props) {
  const { data, mutate } = useWalletsList(initialWallets);
  const wallets = useMemo<WalletSummary[]>(() => data ?? [], [data]);
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);
  const router = useRouter();

  // Recompute active sempre que wallets ou activeId mudarem.
  const activeWallet = useMemo<WalletSummary | null>(() => {
    if (wallets.length === 0) return null;
    if (activeId) {
      const found = wallets.find((w) => w.id === activeId);
      if (found) return found;
    }
    return wallets[0];
  }, [wallets, activeId]);

  const switchWallet = useCallback(
    (id: string) => {
      writeCookie(COOKIE_KEY, id);
      setActiveId(id);
      router.refresh();
    },
    [router],
  );

  // Listener cross-tab.
  useEffect(() => {
    function onStorage(e: StorageEvent): void {
      if (e.key === COOKIE_KEY && e.newValue) setActiveId(e.newValue);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ wallets, activeWallet, switchWallet, refresh: () => mutate() }),
    [wallets, activeWallet, switchWallet, mutate],
  );

  return <WalletSwitcherContext.Provider value={value}>{children}</WalletSwitcherContext.Provider>;
}

export function useWalletSwitcher(): Ctx {
  const ctx = useContext(WalletSwitcherContext);
  if (!ctx) throw new Error('useWalletSwitcher fora de WalletSwitcherProvider');
  return ctx;
}
