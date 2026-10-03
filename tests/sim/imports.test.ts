import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

const SIM = 'src/sim';
const files = readdirSync(SIM)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => f.replace(/\.ts$/, ''));
const importsOf = (m: string): string[] =>
  [...readFileSync(`${SIM}/${m}.ts`, 'utf8').matchAll(/from '\.\/([\w/]+)'/g)].map((x) => x[1]!);

describe('M10 Importrichtung src/sim (Entscheid B9)', () => {
  it('PLAN-B9 townhall.ts ist ein Blatt; src/sim ohne Importkreis', () => {
    expect(importsOf('townhall').every((m) => m === 'types' || m.startsWith('defs/'))).toBe(true);
    expect(importsOf('population')).not.toContain('unlocks');
    const state = new Map<string, 'open' | 'done'>();
    const visit = (m: string, path: string[]): void => {
      if (state.get(m) === 'done') return;
      if (state.get(m) === 'open') throw new Error(`Importkreis: ${[...path, m].join(' → ')}`);
      state.set(m, 'open');
      for (const n of importsOf(m)) if (!n.startsWith('defs/')) visit(n, [...path, m]);
      state.set(m, 'done');
    };
    for (const f of files) expect(() => visit(f, [])).not.toThrow();
  });
});
