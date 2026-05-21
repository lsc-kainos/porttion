'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveDialog } from '@/components/molecules/responsive-dialog';
import { FormField } from '@/components/molecules/form-field';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { useMutateWallet } from '@/hooks/wallet/use-mutate-wallet';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (walletId: string) => void;
}

const STRATEGIES = ['balanceada', 'crescimento', 'renda', 'personalizada'] as const;

export function CreateWalletDialog({ open, onOpenChange, onCreated }: Props) {
  const t = useTranslations('wallet.create');
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL');
  const [strategy, setStrategy] = useState<(typeof STRATEGIES)[number] | null>('balanceada');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { create } = useMutateWallet();

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const wallet = await create({ name, baseCurrency, strategy });
      onOpenChange(false);
      setName('');
      onCreated?.(wallet.id);
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
        <FormField id="wallet-name" label={t('name.label')} required>
          <Input
            id="wallet-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={60}
            required
          />
        </FormField>
        <FormField id="wallet-currency" label={t('currency.label')}>
          <select
            id="wallet-currency"
            className="bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as 'BRL' | 'USD' | 'EUR')}
          >
            <option value="BRL">BRL</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </FormField>
        <FormField id="wallet-strategy" label={t('strategy.label')}>
          <select
            id="wallet-strategy"
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
