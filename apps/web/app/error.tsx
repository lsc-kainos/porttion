'use client';
import Link from 'next/link';
import { Button } from '@/components/atoms/ui/button';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html>
      <body>
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
          <h1 className="font-serif text-4xl italic">Algo deu errado</h1>
          <p className="text-muted-foreground mt-4">
            Você pode recarregar a página ou voltar pro início.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={reset}>Recarregar</Button>
            <Button asChild variant="ghost">
              <Link href="/">Início</Link>
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
