#!/usr/bin/env tsx
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(__dirname, '..');
const MESSAGES_FILE = resolve(ROOT, 'messages/pt-BR.json');

// Coleta todas as chaves planas de um objeto JSON: { a: { b: "x" } } => "a.b"
function flatten(obj: unknown, prefix = ''): Set<string> {
  const out = new Set<string>();
  if (typeof obj !== 'object' || obj === null) return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      for (const child of flatten(v, key)) out.add(child);
    } else {
      out.add(key);
    }
  }
  return out;
}

// Busca recursiva de arquivos .ts/.tsx abaixo de `dir`, retornando caminhos relativos a `base`.
function collectFiles(dir: string, base: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...collectFiles(full, base));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      results.push(full.slice(base.length + 1)); // relative to base
    }
  }
  return results;
}

// Extrai pares (variável, namespace) via useTranslations('ns') ou getTranslations('ns').
// Suporta múltiplas chamadas por arquivo: each var name maps to its namespace.
// e.g. const t = useTranslations('login')  => t -> 'login'
//      const tErr = useTranslations('auth.errors') => tErr -> 'auth.errors'
const NS_REGEX =
  /const\s+(\w+)\s*=\s*(?:await\s+)?(?:use|get)Translations\(\s*['"](\s*[\w.]+\s*)['"]\s*\)/g;

// Matches varName('key') - any identifier known as a translation var
const T_CALL_REGEX = /\b(\w+)\(\s*['"](\s*[\w.]+\s*)['"]/g;

function extractFromFile(path: string): {
  varNs: Map<string, string>;
  calls: { varName: string; key: string }[];
} {
  const src = readFileSync(path, 'utf8');

  // Map from variable name -> namespace
  const varNs = new Map<string, string>();
  let m: RegExpExecArray | null;
  NS_REGEX.lastIndex = 0;
  while ((m = NS_REGEX.exec(src))) {
    varNs.set(m[1].trim(), m[2].trim());
  }

  // Only collect calls where the variable name is a known translation variable
  const calls: { varName: string; key: string }[] = [];
  T_CALL_REGEX.lastIndex = 0;
  while ((m = T_CALL_REGEX.exec(src))) {
    const varName = m[1].trim();
    if (varNs.has(varName)) {
      calls.push({ varName, key: m[2].trim() });
    }
  }

  return { varNs, calls };
}

function main(): void {
  const defined = flatten(JSON.parse(readFileSync(MESSAGES_FILE, 'utf8')));
  const dirs = ['app', 'components', 'lib'];
  const files: string[] = [];
  for (const d of dirs) {
    const full = join(ROOT, d);
    try {
      files.push(...collectFiles(full, ROOT));
    } catch {
      // directory may not exist in all projects
    }
  }

  const missing: { file: string; key: string }[] = [];

  for (const rel of files) {
    const { varNs, calls } = extractFromFile(resolve(ROOT, rel));
    if (varNs.size === 0) continue;
    for (const { varName, key } of calls) {
      const ns = varNs.get(varName)!;
      const full = `${ns}.${key}`;
      if (!defined.has(full)) missing.push({ file: rel, key: full });
    }
  }

  if (missing.length) {
    console.error(`\n✗ ${missing.length} chave(s) i18n usada(s) sem definição em pt-BR.json:\n`);
    for (const { file, key } of missing) console.error(`  ${file}: ${key}`);
    process.exit(1);
  }
  console.log(`✓ i18n-check: ${defined.size} keys, ${files.length} files scanned.`);
}

main();
