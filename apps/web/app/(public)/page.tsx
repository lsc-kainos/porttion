import Link from 'next/link';
import { Logo } from '@/components/atoms/icons/brand/logo';
import { Button } from '@/components/atoms/ui/button';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Começar grátis</Link>
          </Button>
        </div>
      </header>
      <section className="flex max-w-2xl flex-col gap-6">
        <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
          01 ─── Análise de ativos com IA
        </p>
        <h1 className="text-4xl font-medium tracking-tight md:text-6xl">
          Entenda o que está <span className="font-serif italic">acontecendo</span> com a sua
          carteira.
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Landing completa virá na F1d. Esta é uma versão placeholder enquanto a fundação é
          construída.
        </p>
      </section>
    </main>
  );
}
