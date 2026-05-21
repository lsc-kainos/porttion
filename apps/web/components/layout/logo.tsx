import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
  showWordmark?: boolean;
  /** @deprecated size is no longer used — the logo has a fixed 32 px mark */
  size?: number;
}

export function Logo({ href = '/', className, showWordmark = true }: LogoProps) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-md bg-[oklch(0.62_0.19_260)] text-sm font-semibold text-white"
      >
        P
      </span>
      {showWordmark ? <span className="text-base font-medium tracking-tight">Porttion</span> : null}
    </Link>
  );
}
