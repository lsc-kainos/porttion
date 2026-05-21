import { useTranslations } from 'next-intl';

export function AiDisclaimer({
  promptKey,
  promptVersion,
  generatedAt,
  model = 'gpt-4o-mini',
}: {
  promptKey: string;
  promptVersion: number;
  generatedAt: string;
  model?: string;
}) {
  const t = useTranslations('ai.analysis');
  return (
    <p className="text-muted-foreground mt-4 font-mono text-[11px]">
      {t('disclaimer')}
      <span className="mx-2">·</span>
      {model} · {promptKey} v{promptVersion} · {new Date(generatedAt).toLocaleString('pt-BR')}
    </p>
  );
}
