'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveDialog } from './responsive-dialog';
import { Input } from '@/components/atoms/ui/input';
import { Button } from '@/components/atoms/ui/button';
import { FormField } from './form-field';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => Promise<void> | void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmText,
  onConfirm,
}: Props) {
  const t = useTranslations('common');
  const [typed, setTyped] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const matches = typed.trim().toLowerCase() === confirmText.toLowerCase();

  async function handleConfirm(): Promise<void> {
    if (!matches) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
      setTyped('');
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={title}>
      <div className="space-y-4 pt-2">
        <p className="text-sm">{message}</p>
        <FormField id="confirm-text" label={t('typeToConfirm', { text: confirmText })}>
          <Input
            id="confirm-text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!matches || submitting}
            onClick={handleConfirm}
          >
            {t(submitting ? 'deleting' : 'delete')}
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
