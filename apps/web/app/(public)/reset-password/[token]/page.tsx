import { getTranslations } from 'next-intl/server';
import { Logo } from '@/components/atoms/icons/brand/logo';
import { ResetPasswordForm } from '@/components/organisms/auth/reset-password-form';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;
  const t = await getTranslations('auth.reset');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Logo href="/" />
      <h1 className="text-2xl font-medium">{t('title')}</h1>
      <ResetPasswordForm token={token} />
    </main>
  );
}
