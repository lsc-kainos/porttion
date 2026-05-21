'use client';
import { use, useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { Skeleton } from '@/components/atoms/ui/skeleton';
import { useWalletDetail } from '@/hooks/wallet/use-wallet-detail';
import { AddPositionSheet } from '@/components/organisms/wallet/add-position-sheet';
import { EditWalletDialog } from '@/components/organisms/wallet/edit-wallet-dialog';
import { DeleteWalletDialog } from '@/components/organisms/wallet/delete-wallet-dialog';

export default function CarteiraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('carteira');
  const fmt = useFormatter();
  const { data, error, isLoading } = useWalletDetail(id);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  if ((error as { statusCode?: number } | null)?.statusCode === 404) return <p>{t('notFound')}</p>;
  if (isLoading || !data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">{t('eyebrow')}</p>
          <h1 className="font-serif text-3xl italic">{data.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('actions.addPosition')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            aria-label={t('actions.edit')}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDelOpen(true)}
            aria-label={t('actions.delete')}
          >
            <Trash2 className="text-destructive size-4" />
          </Button>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
          {t('positionsSection')}
        </h2>
        {data.positions.length === 0 ? (
          <p className="text-muted-foreground rounded-md border p-6 text-center text-sm">
            {t('noPositions')}
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {data.positions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <span className="font-mono font-medium">{p.ticker}</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {t('row.qty', { qty: p.qty })}
                  </span>
                </div>
                <div className="text-right text-sm">
                  <div>
                    {p.quote == null
                      ? '—'
                      : fmt.number(p.quote, { style: 'currency', currency: data.baseCurrency })}
                  </div>
                  {p.pl != null ? (
                    <div className={p.pl >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                      {fmt.number(p.pl, {
                        style: 'currency',
                        currency: data.baseCurrency,
                        signDisplay: 'always',
                      })}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddPositionSheet walletId={id} open={addOpen} onOpenChange={setAddOpen} />
      <EditWalletDialog wallet={data} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteWalletDialog wallet={data} open={delOpen} onOpenChange={setDelOpen} />
    </div>
  );
}
