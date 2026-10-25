import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { FEAST_KINDS, FEAST_KIND_IDS } from '../../src/sim/defs/feast';
import { feastKindOf, harvestCycle, isFeastKind } from '../../src/sim/feastEffect';
import type { Building } from '../../src/sim/types';

const SIM = 'src/sim';

function importsOf(path: string): string[] {
  const src = readFileSync(path, 'utf8');
  return [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]!);
}

/** Löst ein relatives Importziel gegen die Datei auf (ohne node:path, nur Segmente). */
function resolveTarget(from: string, target: string): string {
  const parts = from.split('/').slice(0, -1);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  const base = parts.join('/');
  return existsSync(`${base}.ts`) ? `${base}.ts` : `${base}/index.ts`;
}

function importClosure(path: string): Set<string> {
  const seen = new Set<string>();
  const visit = (file: string): void => {
    for (const t of importsOf(file)) {
      if (!t.startsWith('.')) continue;
      const next = resolveTarget(file, t);
      if (!next.startsWith(`${SIM}/`) || seen.has(next)) continue;
      seen.add(next);
      visit(next);
    }
  };
  visit(path);
  return seen;
}

describe('AK-FE15 Werte nur aus Defs', () => {
  it('kennt genau die drei Festarten', () => {
    expect(FEAST_KIND_IDS).toEqual(['ascension', 'harvest', 'market']);
  });

  it('Tabelle der Festarten', () => {
    expect(FEAST_KINDS.ascension.name).toBe('Aufstiegsfest');
    expect(FEAST_KINDS.harvest.name).toBe('Erntefest');
    expect(FEAST_KINDS.market.name).toBe('Markttag');
    expect(FEAST_KINDS.ascension.cost).toEqual({ rum: 10 });
    expect(FEAST_KINDS.harvest.cost).toEqual({ rum: 10, cloth: 15 });
    expect(FEAST_KINDS.market.cost).toEqual({ rum: 10, glass: 5 });
    expect(FEAST_KINDS.ascension.scope).toBe('chapel');
    expect(FEAST_KINDS.harvest.scope).toBe('island');
    expect(FEAST_KINDS.market.scope).toBe('island');
    expect(FEAST_KINDS.harvest.cyclePct).toBe(75);
    expect(FEAST_KINDS.market.sellPct).toBe(125);
  });

  it('Rum steht in jeder Art zuerst', () => {
    for (const id of FEAST_KIND_IDS) expect(Object.keys(FEAST_KINDS[id].cost)[0]).toBe('rum');
  });

  it('timing.ts exportiert kein FEAST_RUM mehr', () => {
    const src = readFileSync(`${SIM}/defs/timing.ts`, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    expect(src).not.toContain('FEAST_RUM');
  });
});

describe('AK-FE21 Importstruktur (Blatt)', () => {
  const file = `${SIM}/feastEffect.ts`;

  it('feastEffect importiert nur council, types, world und defs', () => {
    const targets = importsOf(file);
    for (const bad of ['./economy', './levels', './trade', './feast', './townhall'])
      expect(targets).not.toContain(bad);
    for (const t of targets)
      expect(
        t === './council' || t === './types' || t === './world' || t.startsWith('./defs/'),
      ).toBe(true);
  });

  it('transitive Hülle enthält keine Wirtschaftsmodule', () => {
    const closure = [...importClosure(file)].map((p) => p.slice(SIM.length + 1));
    for (const bad of [
      'feast.ts',
      'economy.ts',
      'levels.ts',
      'trade.ts',
      'townhall.ts',
      'population.ts',
    ])
      expect(closure).not.toContain(bad);
  });
});

describe('feastEffect Abfragen', () => {
  it('isFeastKind', () => {
    expect(isFeastKind('harvest')).toBe(true);
    expect(isFeastKind('harbor')).toBe(false);
    expect(isFeastKind(5)).toBe(false);
    expect(isFeastKind(undefined)).toBe(false);
  });

  it('feastKindOf ohne Feld ist Aufstiegsfest', () => {
    expect(feastKindOf({} as Building)).toBe('ascension');
    expect(feastKindOf({ feastKind: 'market' } as Building)).toBe('market');
  });

  it('harvestCycle verkürzt auf 75 % und nie unter 1', () => {
    expect(harvestCycle(20)).toBe(15);
    expect(harvestCycle(1)).toBe(1);
    expect(harvestCycle(50)).toBe(37);
    expect(harvestCycle(32)).toBe(24);
  });
});
