import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

// Logo neutro do template. Substitua pelo logo do seu projeto antes do deploy.
export function Logo({ className, size = 22 }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="border-border bg-primary text-primary-foreground grid place-items-center rounded-md font-semibold tracking-tight"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.55,
          letterSpacing: '-0.04em',
        }}
        aria-hidden
      >
        K
      </span>
      <span className="text-sm font-medium tracking-tight sm:text-base">Kainos</span>
    </div>
  );
}
