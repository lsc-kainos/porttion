import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { Activity, ExternalLink, ShieldCheck, ListChecks } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

// Hub administrativo. Cada projeto adiciona seus próprios cards conforme
// criar features admin (configs, métricas de domínio, billing, etc.).
export default async function AdminHubPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');
  const t = await getTranslations('admin.hub');

  const bullUrl = process.env.BULL_DASHBOARD_URL;

  const cards = [
    {
      href: '/admin/queues',
      icon: ListChecks,
      title: t('queues.title'),
      description: t('queues.description'),
      external: false,
    },
    {
      href: '/admin/metrics',
      icon: Activity,
      title: t('metrics.title'),
      description: t('metrics.description'),
      external: false,
      disabled: true,
    },
    ...(bullUrl
      ? [
          {
            href: bullUrl,
            icon: ExternalLink,
            title: t('bull.title'),
            description: t('bull.description'),
            external: true,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const disabled = 'disabled' in card && card.disabled;
          const content = (
            <div
              className={
                'border-border/60 bg-card group flex flex-col gap-3 rounded-xl border p-5 transition-all duration-200 ' +
                (disabled ? 'opacity-50' : 'hover:border-primary/30 hover:bg-primary/5')
              }
            >
              <div className="bg-primary/10 text-primary/80 group-hover:text-primary flex h-9 w-9 items-center justify-center rounded-lg transition-colors">
                <Icon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {card.title}
                  {card.external && <ExternalLink size={11} className="text-muted-foreground" />}
                </div>
                <p className="text-muted-foreground mt-0.5 text-[12px] leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          );

          if (disabled)
            return (
              <div key={card.href} aria-disabled="true">
                {content}
              </div>
            );

          return card.external ? (
            <a key={card.href} href={card.href} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          ) : (
            <Link key={card.href} href={card.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
