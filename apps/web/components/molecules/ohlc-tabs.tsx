'use client';
import { Tabs, TabsList, TabsTrigger } from '@/components/atoms/ui/tabs';
import type { OhlcPeriod } from '@kainos/shared-types';

const OPTIONS: OhlcPeriod[] = ['7d', '30d', '6m', '1a', '5a'];

interface Props {
  value: OhlcPeriod;
  onChange: (p: OhlcPeriod) => void;
}

export function OhlcTabs({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as OhlcPeriod)}>
      <TabsList>
        {OPTIONS.map((p) => (
          <TabsTrigger key={p} value={p}>
            {p}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
