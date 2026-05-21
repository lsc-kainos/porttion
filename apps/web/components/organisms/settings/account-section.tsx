'use client';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/ui/avatar';
import { Button } from '@/components/atoms/ui/button';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';

export function AccountSection() {
  const { data: session } = useSession();
  const t = useTranslations('settings.account');
  if (!session?.user) return null;
  return (
    <section className="space-y-6">
      <EditorialSectionHeader eyebrow={t('eyebrow')} title={t('title')} align="left" />
      <div className="bg-card flex items-center gap-4 rounded-2xl border p-6">
        <Avatar className="size-14">
          {session.user.image ? <AvatarImage src={session.user.image} alt="" /> : null}
          <AvatarFallback>
            {(session.user.name ?? session.user.email ?? '?').slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{session.user.name ?? '—'}</p>
          <p className="text-muted-foreground text-sm">{session.user.email}</p>
        </div>
        <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
          {t('signOut')}
        </Button>
      </div>
    </section>
  );
}
