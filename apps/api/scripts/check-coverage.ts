#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface FileSummary {
  statements: { pct: number };
}

interface Summary {
  [path: string]: FileSummary;
}

const ROOT = resolve(__dirname, '..');
const summary = JSON.parse(
  readFileSync(resolve(ROOT, 'coverage/coverage-summary.json'), 'utf-8'),
) as Summary;
const config = JSON.parse(
  readFileSync(resolve(ROOT, 'coverage.config.json'), 'utf-8'),
) as {
  thresholds: Record<string, { statements: number }>;
};

const failures: string[] = [];
for (const [pattern, threshold] of Object.entries(config.thresholds)) {
  const regex = new RegExp(
    pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'),
  );
  const matches = Object.entries(summary).filter(
    ([k]) => regex.test(k) && k !== 'total',
  );
  if (matches.length === 0) {
    failures.push(`${pattern}: nenhum arquivo casou`);
    continue;
  }
  for (const [file, sum] of matches) {
    if (sum.statements.pct < threshold.statements) {
      failures.push(
        `${file}: ${sum.statements.pct}% < ${threshold.statements}%`,
      );
    }
  }
}
if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    '[coverage-gate] FAILED:\n' + failures.map((f) => '  - ' + f).join('\n'),
  );
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log('[coverage-gate] all thresholds met');
