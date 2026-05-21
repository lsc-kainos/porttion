'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveDialog } from '@/components/molecules/responsive-dialog';
import { FormField } from '@/components/molecules/form-field';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { useMutateWallet } from '@/hooks/wallet/use-mutate-wallet';
import type { WalletSummary } from '@kainos/shared-types';

interface Props {
  wallet: WalletSummary;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated?: () => void;
}

const STRATEGIES = ['balanceada', 'crescimento', 'renda', 'personalizada'] as const;

export function EditWalletDialog({ wallet, open, onOpenChange, onUpdated }: Props) {
  const t = useTranslations('wallet.edit');
  const [name, setName] = useState(wallet.name);
  const [strategy, setStrategy] = useState<(typeof STRATEGIES)[number] | null>(wallet.strategy);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { update } = useMutateWallet();

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await update(wallet.id, { name, strategy });
      onOpenChange(false);
      onUpdated?.();
    } catch (err) {
      const body = err as { statusCode?: number; message?: string };
      setError(body.statusCode === 409 ? t('errors.duplicate') : t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t('title')}>
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <FormField id="edit-wallet-name" label={t('name.label')} required>
          <Input
            id="edit-wallet-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={60}
            required
          />
        </FormField>
        <FormField id="edit-wallet-strategy" label={t('strategy.label')}>
          <select
            id="edit-wallet-strategy"
            className="bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={strategy ?? ''}
            onChange={(e) => setStrategy((e.target.value || null) as typeof strategy)}
          >
            <option value="">{t('strategy.none')}</option>
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>
                {t(`strategy.options.${s}`)}
              </option>
            ))}
          </select>
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
          <Button type="submit" disabled={submitting || name.length < 2}>
            {t(submitting ? 'submitting' : 'submit')}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
