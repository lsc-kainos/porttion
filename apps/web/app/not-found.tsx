import Link from 'next/link';
import { ErrorShell } from '@/components/templates/error-shell';
import { Button } from '@/components/atoms/ui/button';

export default function NotFound() {
  return (
    <ErrorShell
      eyebrow="404"
      title="Página não encontrada"
      body="O caminho que você abriu não existe (ou ainda não)."
      actions={
        <>
          <Button asChild>
            <Link href="/">Início</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </>
      }
    />
  );
}
