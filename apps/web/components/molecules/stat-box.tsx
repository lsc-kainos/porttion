import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'negative';
}

export function StatBox({ label, value, tone = 'neutral' }: Props) {
  return (
    <div className="bg-card rounded-md border px-4 py-2">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-sm font-medium tabular-nums',
          tone === 'positive' && 'text-emerald-700',
          tone === 'negative' && 'text-destructive',
        )}
      >
        {value}
      </p>
    </div>
  );
}
