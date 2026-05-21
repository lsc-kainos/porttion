'use client';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  caption?: string;
  tone?: 'neutral' | 'positive' | 'negative';
  stale?: boolean;
}

export function KpiCard({ label, value, caption, tone = 'neutral', stale }: Props) {
  return (
    <div className="bg-card rounded-2xl border p-6">
      <header className="text-muted-foreground flex items-center justify-between text-xs tracking-wide uppercase">
        <span>{label}</span>
        {stale ? (
          <AlertTriangle className="size-3.5 text-amber-600" aria-label="dados estados" />
        ) : null}
      </header>
      <p
        className={cn(
          'mt-2 font-serif text-3xl tabular-nums',
          tone === 'positive' && 'text-emerald-700',
          tone === 'negative' && 'text-destructive',
        )}
      >
        {value}
      </p>
      {caption ? (
        <p className="text-muted-foreground mt-1 text-sm tabular-nums">{caption}</p>
      ) : null}
    </div>
  );
}
