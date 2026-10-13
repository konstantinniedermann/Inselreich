import { describe, expect, it, vi } from 'vitest';
import { createWorld } from '../../src/sim/world';
import type { BuildingDefId } from '../../src/sim/types';
import { lockedToolText } from '../../src/ui/goal';
import { TOOL_HOTKEYS } from '../../src/ui/hotkeys';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { cachedBalanceLine, tierPreviewLine, tooltipLines } from '../../src/ui/buildMenu';

const spy = vi.hoisted(() => ({ n: 0 }));
vi.mock('../../src/ui/balancePreview', async (orig) => {
  const m = await orig<typeof import('../../src/ui/balancePreview')>();
  return {
    ...m,
    balanceAfterBuild: (...a: Parameters<typeof m.balanceAfterBuild>) => {
      spy.n++;
      return m.balanceAfterBuild(...a);
    },
  };
});

const MONUMENT_TOOL = { kind: 'build', defId: 'monument' } as const;

describe('AK-UT-05 Höchstzahl-Zeile', () => {
  it('maxCount 1: «Nur einmal je Insel», sonst keine «Nur einmal»-Zeile, nie «Höchstens»', () => {
    for (const def of Object.values(BUILDING_DEFS)) {
      const lines = tooltipLines({ kind: 'build', defId: def.id });
      expect(
        lines.some((l) => l.includes('Höchstens')),
        def.id,
      ).toBe(false);
      if (def.maxCount?.n === 1) expect(lines).toContain('Nur einmal je Insel');
      else
        expect(
          lines.some((l) => l.startsWith('Nur einmal')),
          def.id,
        ).toBe(false);
    }
  });
});

describe('AK-M13E2-35 Bauleisten-Eintrag Denkmal', () => {
  it('tierPreviewLine liefert für das Denkmal null', () => {
    expect(tierPreviewLine('monument')).toBeNull();
  });

  it('Tooltip enthält die Zeile U-6 wörtlich', () => {
    expect(tooltipLines(MONUMENT_TOOL)).toContain(
      'Wahlziel in drei Abschnitten: Stein, Werkzeug, Glas, Gewürz',
    );
  });

  it('lockedToolText: vor Ziel 2 gesperrt, danach frei', () => {
    const w = createWorld(3, { unlockAll: true });
    w.wonMerchants = false;
    expect(lockedToolText(w, MONUMENT_TOOL)).toBe('Denkmal: Erst nach dem Kaufleute-Ziel');
    w.wonMerchants = true;
    expect(lockedToolText(w, MONUMENT_TOOL)).toBeNull();
  });

  it('kein Hotkey für das Denkmal', () => {
    const tools = Object.values(TOOL_HOTKEYS);
    expect(tools.some((t) => t?.kind === 'build' && t.defId === 'monument')).toBe(false);
  });
});

describe('M14-E1 Bauleisten-Zusatzzeile (AK-M14E1-30)', () => {
  const w = createWorld(3, { unlockAll: true });
  const lines = (defId: BuildingDefId, island: number) =>
    tooltipLines({ kind: 'build', defId }, w, island);
  const extra = (ls: string[]) => ls.filter((l) => l.startsWith('Auf '));
  it('Zeile nur, wenn die aktive Insel den Trait trägt; direkt nach «Erzeugt: …»', () => {
    expect(extra(lines('quarry', 2))).toEqual(['Auf Felsbucht: Gebirge+ ×2 — 20 Stein / min']);
    expect(extra(lines('glassworks', 2))).toEqual(['Auf Felsbucht: Gebirge+ ×2 — 24 Glas / min']);
    expect(extra(lines('canefarm', 3))).toEqual([
      'Auf Weidenau: Fruchtbar ×2 — 24 Zuckerrohr / min',
    ]);
    expect(extra(lines('sheepfarm', 3))).toEqual(['Auf Weidenau: Fruchtbar ×2 — 24 Wolle / min']);
    const ls = lines('quarry', 2);
    expect(ls[ls.findIndex((l) => l.startsWith('Erzeugt:')) + 1]).toBe(
      'Auf Felsbucht: Gebirge+ ×2 — 20 Stein / min',
    );
  });
  it('Heimat, Möweninsel, Gewürzplantage auf Weidenau und ohne Welt: keine Zusatzzeile', () => {
    expect(extra(lines('quarry', 0))).toEqual([]);
    expect(extra(lines('quarry', 1))).toEqual([]);
    expect(extra(lines('spicefarm', 3))).toEqual([]);
    expect(extra(tooltipLines({ kind: 'build', defId: 'quarry' }))).toEqual([]);
  });
});

describe('I-078 Bilanz-Zeile im Bau-Tooltip (AK-10, AK-13, AK-14)', () => {
  const w = createWorld(3, { unlockAll: true });
  const lineOf = (defId: BuildingDefId, world = w) =>
    tooltipLines({ kind: 'build', defId }, world).find((l) => l.startsWith('Bilanz danach:'));
  it('Zeile steht direkt unter «Unterhalt», auch bei gesperrtem Eintrag (Zahlen bleiben)', () => {
    const ls = tooltipLines({ kind: 'build', defId: 'fisher' }, w);
    const i = ls.findIndex((l) => l.startsWith('Unterhalt:'));
    expect(ls[i + 1]).toMatch(/^Bilanz danach: .* → .* \/ min$/);
    const locked = createWorld(3);
    expect(lineOf('fisher', locked)).toMatch(/^Bilanz danach: /);
  });
  it('ohne Welt keine Bilanz-Zeile', () => {
    const ls = tooltipLines({ kind: 'build', defId: 'fisher' });
    expect(ls.some((l) => l.startsWith('Bilanz danach:'))).toBe(false);
  });
  it('Wohnhaus: «bis zu … (Steuer bei voller Belegung)»', () => {
    expect(lineOf('house')).toMatch(/→ bis zu .* \/ min \(Steuer bei voller Belegung\)$/);
  });
  it('Betrieb mit Unterhalt zeigt einen Pfeil, kein «gleich»', () => {
    expect(BUILDING_DEFS.market.upkeep).toBeGreaterThan(0);
    expect(lineOf('market')).not.toMatch(/gleich/);
  });
});

describe('I-078 Cache der Bilanz-Zeile (AK-14: kein Neurechnen je Takt)', () => {
  it('gleicher Stand: eine Rechnung; neuer Tick, Steuerstufe oder Schiff: neue Rechnung', () => {
    const w = createWorld(3, { unlockAll: true });
    const first = cachedBalanceLine(w, 'fisher', 0);
    spy.n = 0;
    expect(cachedBalanceLine(w, 'fisher', 0)).toBe(first);
    expect(cachedBalanceLine(w, 'fisher', 0)).toBe(first);
    expect(spy.n).toBe(0);
    w.tick += 1;
    cachedBalanceLine(w, 'fisher', 0);
    expect(spy.n).toBe(1);
    cachedBalanceLine(w, 'fisher', 0);
    expect(spy.n).toBe(1);
    cachedBalanceLine(w, 'chapel', 0);
    expect(spy.n).toBe(2);
    w.taxLevels = { ...w.taxLevels, 1: 'high' };
    cachedBalanceLine(w, 'fisher', 0);
    expect(spy.n).toBe(3);
    w.ships.push({ id: 99, port: 0, to: null, left: 0, cargo: {}, route: null, homing: false });
    cachedBalanceLine(w, 'fisher', 0);
    expect(spy.n).toBe(4);
  });
});
