'use client';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
  data: { x: string; y: number }[];
  color?: string;
}

export function AreaChartLite({ data, color = '#1d4ed8' }: Props) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data}>
        <Area dataKey="y" type="monotone" stroke={color} fill={color} fillOpacity={0.15} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
