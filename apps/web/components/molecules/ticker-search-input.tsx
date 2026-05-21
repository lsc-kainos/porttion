'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/atoms/ui/command';
import { useTickerSearch } from '@/hooks/market/use-ticker-search';
import type { MarketAsset } from '@kainos/shared-types';

interface Props {
  value: MarketAsset | null;
  onChange: (asset: MarketAsset) => void;
}

export function TickerSearchInput({ value, onChange }: Props) {
  const t = useTranslations('asset.search');
  const [query, setQuery] = useState(value?.ticker ?? '');
  const { data, isLoading } = useTickerSearch(query);

  return (
    <Command shouldFilter={false} className="rounded-md border">
      <CommandInput
        role="combobox"
        placeholder={t('placeholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading ? <CommandEmpty>{t('loading')}</CommandEmpty> : null}
        {!isLoading && (!data || data.length === 0) ? (
          <CommandEmpty>{t('empty')}</CommandEmpty>
        ) : null}
        {data && data.length > 0 ? (
          <CommandGroup>
            {data.map((asset) => (
              <CommandItem
                key={asset.ticker}
                value={asset.ticker}
                onSelect={() => {
                  onChange(asset);
                  setQuery(asset.ticker);
                }}
              >
                <span className="font-mono font-medium">{asset.ticker}</span>
                <span className="text-muted-foreground ml-2 truncate text-sm">{asset.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </Command>
  );
}
