'use client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Slice {
  key: string;
  value: number;
  color: string;
}

interface Props {
  data: Slice[];
  innerRadius?: number;
  outerRadius?: number;
}

export function Donut({ data, innerRadius = 56, outerRadius = 78 }: Props) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          stroke="hsl(var(--background))"
          strokeWidth={2}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
