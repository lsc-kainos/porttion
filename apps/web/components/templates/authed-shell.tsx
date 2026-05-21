import type React from 'react';
import type { Session } from 'next-auth';
import { Sidebar } from '@/components/organisms/layout/sidebar';
import { Topbar } from '@/components/organisms/layout/topbar';
import { SidebarMobile } from '@/components/organisms/layout/sidebar-mobile';

interface Props {
  user: NonNullable<Session['user']>;
  children: React.ReactNode;
}

export function AuthedShell({ user, children }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} leadingSlot={<SidebarMobile />} />
        <main className="flex-1 px-4 py-6 pt-20 md:px-8">{children}</main>
      </div>
    </div>
  );
}
