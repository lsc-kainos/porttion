'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Candle } from '@kainos/shared-types';

interface Props {
  candles: Candle[];
  width?: number;
  height?: number;
}

// Tailwind v4 CSS variables — resolve to actual color in browser, contain name for test assertions
const GREEN = 'var(--color-emerald-500)'; // matches /(emerald|green)/i
const RED = 'var(--color-red-500)'; // matches /(red|destructive|rose)/i

export function CandleChart({ candles, width = 720, height = 320 }: Props) {
  const t = useTranslations('asset.chart');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const scales = useMemo(() => {
    if (candles.length === 0) return null;
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const yMax = Math.max(...highs);
    const yMin = Math.min(...lows);
    const yPad = (yMax - yMin) * 0.05 || 1;
    const padding = { top: 16, right: 8, bottom: 56, left: 48 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const candleWidth = Math.max(2, (innerW / candles.length) * 0.7);
    const slot = innerW / candles.length;
    const xOf = (i: number): number => padding.left + slot * i + (slot - candleWidth) / 2;
    const yOf = (v: number): number =>
      padding.top + (1 - (v - (yMin - yPad)) / (yMax + yPad - (yMin - yPad))) * innerH;
    const volMax = Math.max(...candles.map((c) => c.volume), 1);
    const volH = 36;
    const volYOf = (v: number): number => height - padding.bottom + (1 - v / volMax) * volH;
    return {
      padding,
      innerW,
      innerH,
      candleWidth,
      slot,
      xOf,
      yOf,
      volYOf,
      yMin: yMin - yPad,
      yMax: yMax + yPad,
    };
  }, [candles, width, height]);

  if (candles.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border p-12 text-center text-sm">
        {t('empty')}
      </p>
    );
  }
  if (!scales) return null;

  const aria = `${candles.length} candles de ${candles[0].date} a ${candles[candles.length - 1].date}`;

  return (
    <div className="relative">
      <svg
        role="img"
        aria-label={aria}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        onPointerMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const xRel = ((e.clientX - rect.left) / rect.width) * width;
          const idx = Math.floor((xRel - scales.padding.left) / scales.slot);
          setHoverIndex(idx >= 0 && idx < candles.length ? idx : null);
        }}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {candles.map((c, i) => {
          const up = c.close >= c.open;
          const x = scales.xOf(i);
          const yHigh = scales.yOf(c.high);
          const yLow = scales.yOf(c.low);
          const yOpen = scales.yOf(c.open);
          const yClose = scales.yOf(c.close);
          const bodyY = Math.min(yOpen, yClose);
          const bodyH = Math.max(1, Math.abs(yClose - yOpen));
          const color = up ? GREEN : RED;
          return (
            <g key={c.date} data-index={i} tabIndex={0} aria-label={`${c.date} close ${c.close}`}>
              <line
                data-role="wick"
                x1={x + scales.candleWidth / 2}
                x2={x + scales.candleWidth / 2}
                y1={yHigh}
                y2={yLow}
                stroke={color}
                strokeWidth={1}
              />
              <rect
                data-role="body"
                x={x}
                y={bodyY}
                width={scales.candleWidth}
                height={bodyH}
                fill={color}
                opacity={0.95}
              />
              <rect
                data-role="vol"
                x={x}
                y={scales.volYOf(c.volume)}
                width={scales.candleWidth}
                height={height - scales.padding.bottom - scales.volYOf(c.volume)}
                fill={color}
                opacity={0.5}
              />
            </g>
          );
        })}
        {hoverIndex !== null ? (
          <line
            x1={scales.xOf(hoverIndex) + scales.candleWidth / 2}
            x2={scales.xOf(hoverIndex) + scales.candleWidth / 2}
            y1={scales.padding.top}
            y2={height - scales.padding.bottom}
            stroke="currentColor"
            strokeDasharray="2 2"
            opacity={0.3}
          />
        ) : null}
      </svg>
      {hoverIndex !== null ? (
        <div className="bg-popover pointer-events-none absolute top-2 left-2 rounded-md border px-3 py-2 text-xs shadow">
          <div className="font-mono">{candles[hoverIndex].date}</div>
          <div>O: {candles[hoverIndex].open}</div>
          <div>H: {candles[hoverIndex].high}</div>
          <div>L: {candles[hoverIndex].low}</div>
          <div>C: {candles[hoverIndex].close}</div>
        </div>
      ) : null}
    </div>
  );
}
