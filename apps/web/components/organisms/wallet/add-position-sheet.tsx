'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveDialog } from '@/components/molecules/responsive-dialog';
import { FormField } from '@/components/molecules/form-field';
import { TickerSearchInput } from '@/components/molecules/ticker-search-input';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { useMutatePosition } from '@/hooks/wallet/use-mutate-position';
import type { MarketAsset } from '@kainos/shared-types';

interface Props {
  walletId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AddPositionSheet({ walletId, open, onOpenChange }: Props) {
  const t = useTranslations('position.add');
  const [asset, setAsset] = useState<MarketAsset | null>(null);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { create } = useMutatePosition();

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!asset) return;
    setSubmitting(true);
    setError(null);
    try {
      await create(walletId, { ticker: asset.ticker, qty: Number(qty), avgPrice: Number(price) });
      onOpenChange(false);
      setAsset(null);
      setQty('');
      setPrice('');
    } catch (err) {
      const body = err as { statusCode?: number };
      if (body.statusCode === 409) setError(t('errors.duplicate'));
      else if (body.statusCode === 422) setError(t('errors.invalidTicker'));
      else setError(t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t('title')}>
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <FormField id="ticker" label={t('ticker.label')} required>
          <TickerSearchInput value={asset} onChange={setAsset} />
        </FormField>
        <FormField id="qty" label={t('qty.label')} required>
          <Input
            id="qty"
            type="number"
            step="any"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
        </FormField>
        <FormField id="price" label={t('price.label')} required>
          <Input
            id="price"
            type="number"
            step="any"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </FormField>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={!asset || !qty || !price || submitting}>
            {t(submitting ? 'submitting' : 'submit')}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
