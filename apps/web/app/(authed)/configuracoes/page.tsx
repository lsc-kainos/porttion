import { AccountSection } from '@/components/organisms/settings/account-section';
import { LocaleSection } from '@/components/organisms/settings/locale-section';

export default function ConfiguracoesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <AccountSection />
      <LocaleSection />
    </div>
  );
}
