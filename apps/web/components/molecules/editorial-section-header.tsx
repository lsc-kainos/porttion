import { Eyebrow } from '@/components/atoms/typography/eyebrow';
import { cn } from '@/lib/utils';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export function EditorialSectionHeader({ eyebrow, title, subtitle, align = 'center' }: Props) {
  return (
    <header className={cn('space-y-2', align === 'center' && 'text-center')}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="font-serif text-3xl italic md:text-4xl">{title}</h2>
      {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
