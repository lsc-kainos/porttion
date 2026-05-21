import { cn } from '@/lib/utils';

const KNOWN_GRADIENTS: Record<string, string> = {
  PETR4: 'from-amber-500 to-rose-500',
  VALE3: 'from-emerald-500 to-cyan-500',
  ITUB4: 'from-orange-500 to-red-500',
  BBDC4: 'from-rose-500 to-fuchsia-500',
  BOVA11: 'from-blue-500 to-violet-500',
  IVVB11: 'from-sky-500 to-blue-700',
  BTC: 'from-amber-400 to-orange-600',
  ETH: 'from-indigo-500 to-violet-600',
  USD: 'from-emerald-600 to-teal-700',
  AAPL: 'from-zinc-500 to-zinc-800',
};

interface Props {
  ticker: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AssetIcon({ ticker, size = 'md' }: Props) {
  const grad = KNOWN_GRADIENTS[ticker.toUpperCase()] ?? 'from-slate-400 to-slate-700';
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-mono font-semibold text-white shadow-inner',
        `bg-gradient-to-br ${grad}`,
        size === 'sm' && 'size-7 text-[10px]',
        size === 'md' && 'size-10 text-xs',
        size === 'lg' && 'size-16 text-base',
      )}
      aria-hidden
    >
      {ticker.slice(0, 4)}
    </div>
  );
}
