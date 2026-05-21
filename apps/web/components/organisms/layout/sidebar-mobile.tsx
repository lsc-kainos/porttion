'use client';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/atoms/ui/sheet';
import { Sidebar } from './sidebar';

export function SidebarMobile() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menu" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div onClick={() => setOpen(false)} className="contents">
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
}
