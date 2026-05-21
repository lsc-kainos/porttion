'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveDialog } from '@/components/molecules/responsive-dialog';
import { FormField } from '@/components/molecules/form-field';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { useMutatePosition } from '@/hooks/wallet/use-mutate-position';
import type { PositionWithQuote } from '@kainos/shared-types';

interface Props {
  walletId: string;
  position: PositionWithQuote;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated?: () => void;
}

export function EditPositionDialog({ walletId, position, open, onOpenChange, onUpdated }: Props) {
  const t = useTranslations('position.edit');
  const [qty, setQty] = useState(String(position.qty));
  const [price, setPrice] = useState(String(position.avgPrice));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { update } = useMutatePosition();

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await update(walletId, position.id, { qty: Number(qty), avgPrice: Number(price) });
      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      const body = err as { statusCode?: number };
      setError(body.statusCode === 422 ? t('errors.invalid') : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t('title')}>
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <FormField id="edit-ticker" label={t('ticker.label')}>
          <Input id="edit-ticker" value={position.ticker} disabled readOnly />
        </FormField>
        <FormField id="edit-qty" label={t('qty.label')} required>
          <Input
            id="edit-qty"
            type="number"
            step="any"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
        </FormField>
        <FormField id="edit-price" label={t('price.label')} required>
          <Input
            id="edit-price"
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
          <Button type="submit" disabled={!qty || !price || submitting}>
            {t(submitting ? 'submitting' : 'submit')}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
