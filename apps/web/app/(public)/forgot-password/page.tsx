import { useTranslations } from 'next-intl';
import { Logo } from '@/components/layout/logo';
import { ForgotPasswordForm } from '@/components/features/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgot');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Logo href="/" />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <ForgotPasswordForm />
    </main>
  );
}
