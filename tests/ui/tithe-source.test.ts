import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const src = (f: string): string => readFileSync(`src/ui/${f}`, 'utf8');

describe('Zehnt-UI Quelltext (I-223 T05)', () => {
  it('titheDialog: Knöpfe, keine Sim-Werte', () => {
    const s = src('titheDialog.ts');
    expect(s).toContain('Zehnt einschalten');
    expect(s).toContain('Abbrechen');
    expect(s).not.toMatch(/TITHE_SWITCH_LOCK|STORAGE_CAP/);
    const imports = s.split('\n').filter((l) => /^import .*sim\//.test(l));
    for (const l of imports) expect(l).toMatch(/^import type /);
  });
  it('inspect/app: keine Sperrzeit-Konstanten, keine direkte Weltänderung', () => {
    for (const f of ['inspect.ts', 'app.ts']) {
      expect(src(f)).not.toMatch(/TITHE_SWITCH_LOCK/);
      expect(src(f)).not.toMatch(/titheOn\[.*\]\s*=[^=]/);
    }
  });
  it('app: aktiver Schalter öffnet keinen Dialog', () => {
    expect(src('app.ts')).toMatch(/!titheClickChangesState\(world, tier, on\)\) return/);
  });
  it('app: ruft collectTitheLoss und setTithe auf', () => {
    const s = src('app.ts');
    expect(s.match(/collectTitheLoss\(/g)).toHaveLength(1);
    expect(s.match(/\bsetTithe\(world/g)).toHaveLength(1);
  });
});
