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

describe('M11 Naht Zyklus und Unterhalt (Prüfhilfe AK-P1-14)', () => {
  it('PLAN-NAHT src/sim (ausser levels.ts, defs/) und render/errands.ts lesen cycle/upkeep nie direkt', () => {
    const read = /\b(def|BUILDING_DEFS\[[^\]]+\])\.(cycle|upkeep)\b/;
    const paths = files.filter((m) => m !== 'levels').map((m) => `${SIM}/${m}.ts`);
    for (const f of [...paths, 'src/render/errands.ts'])
      expect(read.test(readFileSync(f, 'utf8')), f).toBe(false);
    expect(importsOf('levels').every((m) => m === 'types' || m.startsWith('defs/'))).toBe(true);
  });
  it('PLAN-FLOW flow.ts importiert weder population noch queries; queries re-exportiert goodsBalance', () => {
    expect(importsOf('flow')).not.toContain('population');
    expect(importsOf('flow')).not.toContain('queries');
    expect(readFileSync(`${SIM}/queries.ts`, 'utf8')).toMatch(
      /export \{[^}]*goodsBalance[^}]*\} from '\.\/flow'/,
    );
  });
});
