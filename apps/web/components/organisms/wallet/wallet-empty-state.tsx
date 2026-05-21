'use client';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';

interface Props {
  onCreate: () => void;
}

export function WalletEmptyState({ onCreate }: Props) {
  const t = useTranslations('wallet.list.empty');
  return (
    <div className="rounded-2xl border border-dashed p-12 text-center">
      <h2 className="font-serif text-2xl italic">{t('title')}</h2>
      <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      <Button onClick={onCreate} className="mt-6">
        <Plus className="mr-2 size-4" />
        {t('cta')}
      </Button>
    </div>
  );
}
