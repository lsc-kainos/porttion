import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthedShell } from '@/components/templates/authed-shell';
import { WalletSwitcherProvider } from '@/components/providers/wallet-switcher-provider';
import { apiFetch } from '@/lib/api';
import type { WalletSummary } from '@/types/wallet';

async function fetchWallets(): Promise<WalletSummary[]> {
  // Até o Commit 3 esse endpoint não existe — defensive guard:
  try {
    const res = await apiFetch('/v1/wallets');
    if (!res.ok) return [];
    return (await res.json()) as WalletSummary[];
  } catch {
    return [];
  }
}

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const cookieStore = await cookies();
  const activeId = cookieStore.get('porttion_active_wallet')?.value ?? null;
  const wallets = await fetchWallets();

  return (
    <WalletSwitcherProvider initialWallets={wallets} initialActiveId={activeId}>
      <AuthedShell user={session.user}>{children}</AuthedShell>
    </WalletSwitcherProvider>
  );
}
