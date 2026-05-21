'use client';
import { useTranslations, useFormatter } from 'next-intl';
import { AssetIcon } from '@/components/atoms/icons/asset-icon';
import { Eyebrow } from '@/components/atoms/typography/eyebrow';
import { useQuote } from '@/hooks/market/use-quote';

interface Props {
  ticker: string;
  name?: string;
}

export function AssetHeader({ ticker, name }: Props) {
  const t = useTranslations('asset.header');
  const fmt = useFormatter();
  const { data, isLoading } = useQuote(ticker);
  return (
    <header className="flex flex-wrap items-end gap-4">
      <AssetIcon ticker={ticker} size="lg" />
      <div className="min-w-0">
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <h1 className="font-serif text-3xl italic">{name ?? ticker}</h1>
        <p className="text-muted-foreground font-mono text-sm">{ticker}</p>
      </div>
      <div className="ml-auto text-right">
        {isLoading || !data ? (
          <p className="text-muted-foreground text-sm">{t('loadingQuote')}</p>
        ) : (
          <>
            <p className="font-serif text-2xl tabular-nums">
              {fmt.number(data.price, { style: 'currency', currency: data.currency })}
            </p>
            <p
              className={
                data.changePct >= 0 ? 'text-sm text-emerald-700' : 'text-destructive text-sm'
              }
            >
              {fmt.number(data.changePct / 100, {
                style: 'percent',
                signDisplay: 'always',
                minimumFractionDigits: 2,
              })}
            </p>
          </>
        )}
      </div>
    </header>
  );
}
