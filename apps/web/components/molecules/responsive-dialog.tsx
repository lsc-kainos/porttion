'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/atoms/ui/sheet';
import { useMediaQuery } from '@/hooks/shared/use-media-query';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ResponsiveDialog({ open, onOpenChange, title, description, children }: Props) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
