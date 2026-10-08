// Zyklus-Test für src/ui/*.ts.
// Kanten: Wert-Importe (`import … from '…'`, auch Seiteneffekt-Importe `import '…'`) und
// `export … from '…'`. `import type` zählt nicht (zur Laufzeit gelöscht, kein
// Initialisierungszyklus). Mehrzeilige Importe werden über den gesamten Dateitext erfasst.
// Nur relative Importe innerhalb von src/ui/ (`./x`); Pakete und andere Ordner sind keine Kanten.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const UI_DIR = join(process.cwd(), 'src', 'ui');

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

export function valueImports(src: string): string[] {
  const text = stripComments(src);
  const out: string[] = [];
  const re =
    /^\s*(import|export)\b(?!\s+type\b)([^;'"]*?)\bfrom\s*['"]\.\/([\w-]+)['"]|^\s*import\s*['"]\.\/([\w-]+)['"]/gm;
  for (const m of text.matchAll(re)) {
    const kind = m[1];
    // `export const x = …` o. Ä. enthält kein `from`; Treffer sind nur `export {…} from`/`export * from`.
    if (kind === 'export' && !/^\s*(\{|\*)/.test(m[2] ?? '')) continue;
    out.push((m[3] ?? m[4])!);
  }
  return out;
}

function buildGraph(): Map<string, string[]> {
  const g = new Map<string, string[]>();
  for (const f of readdirSync(UI_DIR).filter((n) => n.endsWith('.ts'))) {
    const name = f.slice(0, -3);
    g.set(name, [...new Set(valueImports(readFileSync(join(UI_DIR, f), 'utf8')))]);
  }
  return g;
}

function findCycle(g: Map<string, string[]>): string[] | null {
  const state = new Map<string, 1 | 2>();
  const stack: string[] = [];
  const visit = (n: string): string[] | null => {
    state.set(n, 1);
    stack.push(n);
    for (const m of g.get(n) ?? []) {
      if (state.get(m) === 1) return [...stack.slice(stack.indexOf(m)), m];
      if (!state.has(m)) {
        const c = visit(m);
        if (c) return c;
      }
    }
    stack.pop();
    state.set(n, 2);
    return null;
  };
  for (const n of g.keys())
    if (!state.has(n)) {
      const c = visit(n);
      if (c) return c;
    }
  return null;
}

describe('src/ui Importgraph', () => {
  it('Parser: Wert-Importe und export-from zählen, import type nicht, mehrzeilig', () => {
    const src = [
      "import type { A } from './t';",
      "import { b } from './b';",
      'import {',
      '  c,',
      '  d,',
      "} from './c';",
      "export { e } from './e';",
      "export * from './f';",
      "export type { G } from './g';",
      'export const x = 1;',
      "// import { z } from './z';",
    ].join('\n');
    expect(valueImports(src)).toEqual(['b', 'c', 'e', 'f']);
  });

  it('hat keine Importzyklen', () => {
    const cycle = findCycle(buildGraph());
    expect(cycle ? cycle.join(' -> ') : null).toBeNull();
  });
});
