'use client';
import { Label } from '@/components/atoms/ui/label';
import { cn } from '@/lib/utils';

interface Props {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ id, label, error, hint, required, children }: Props) {
  const describedById = error || hint ? `${id}-desc` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive ml-1">*</span> : null}
      </Label>
      <div aria-describedby={describedById}>{children}</div>
      {error ? (
        <p id={`${id}-desc`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-desc`} className={cn('text-muted-foreground text-sm')}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
