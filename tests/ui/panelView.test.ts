import { describe, expect, it } from 'vitest';
import {
  TONE_SYMBOL,
  UPGRADE_KEY_LABEL,
  houseTiles,
  levelPips,
  progressView,
  riseCard,
  statKeys,
  statTiles,
  stateChip,
  stateTone,
  supplyChip,
  tierPips,
  upgradeCard,
  upgradeGain,
} from '../../src/ui/panelView';
import { upgradeView, progressPct } from '../../src/ui/inspect';
import { missingInputs } from '../../src/sim/queries';
import { isSupplied } from '../../src/sim/population';
import { functionLock } from '../../src/sim/unlocks';
import { serialize } from '../../src/sim/save';
import { createWorld, home } from '../../src/sim/world';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { LEVELS } from '../../src/sim/defs/levels';
import { TIERS } from '../../src/sim/defs/tiers';
import { stateInfo } from '../../src/ui/texts';
import { perMinute, signedNum } from '../../src/ui/time';
import type { Building, BuildingDefId, BuildingState, Tier, World } from '../../src/sim/types';
import { setHouse, uxWorld } from './worlds';

/** Betrieb roh einsetzen (ohne Kachel); die Helfer lesen nur Gebäude und Welt. */
const put = (w: World, defId: BuildingDefId, extra: Partial<Building> = {}): Building => {
  const b: Building = {
    id: w.nextBuildingId++,
    defId,
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    island: 0,
    ...extra,
  };
  w.buildings[b.id] = b;
  return b;
};

const STATES: BuildingState[] = [
  'ok',
  'waitingInput',
  'storageFull',
  'notConnected',
  'burning',
  'noService',
  'noForest',
];
const NOT_A: BuildingDefId[] = ['kontor', 'kontor2', 'townhall', 'house'];
const PANEL_A = (Object.keys(BUILDING_DEFS) as BuildingDefId[]).filter((d) => !NOT_A.includes(d));

describe('AK-PU-01 stateTone', () => {
  const w = createWorld(3, { unlockAll: true });
  it('Zeilen aus Anhang 01 A.1', () => {
    expect(stateTone(put(w, 'fisher', { outageUntil: 100 }))).toBe('bad');
    expect(stateTone(put(w, 'fisher', { connected: false }))).toBe('bad');
    expect(stateTone(put(w, 'chapel'))).toBe('ok');
    expect(stateTone(put(w, 'fisher', { state: 'ok' }))).toBe('ok');
    expect(stateTone(put(w, 'fisher', { state: 'notConnected' }))).toBe('ok');
    expect(stateTone(put(w, 'weaver', { state: 'waitingInput' }))).toBe('warn');
    expect(stateTone(put(w, 'fisher', { state: 'storageFull' }))).toBe('warn');
    expect(stateTone(put(w, 'fisher', { state: 'burning' }))).toBe('bad');
    expect(stateTone(put(w, 'lumberjack', { state: 'noForest' }))).toBe('bad');
    expect(stateTone(put(w, 'toolmaker', { state: 'noService' }))).toBe('bad');
  });
});

describe('AK-PU-02 Invariante Ton ok <=> stateInfo.ok', () => {
  it('über alle Typen, Zustände, Anbindung, Brand', () => {
    const w = createWorld(3, { unlockAll: true });
    let n = 0;
    for (const defId of PANEL_A)
      for (const state of STATES) {
        if (state === 'noService' && BUILDING_DEFS[defId].requiresService === undefined) continue;
        for (const connected of [true, false])
          for (const burning of [true, false]) {
            const b = put(w, defId, {
              state,
              connected,
              ...(burning ? { outageUntil: 50 } : {}),
            });
            expect(stateTone(b) === 'ok', `${defId} ${state} ${connected} ${burning}`).toBe(
              stateInfo(b, 0).ok,
            );
            n++;
          }
      }
    expect(n).toBeGreaterThan(100);
  });
});

describe('AK-PU-03 stateChip', () => {
  it('Text aus stateInfo, label mit Präfix, Symbole', () => {
    const w = createWorld(3, { unlockAll: true });
    home(w).stock.wood = 5;
    home(w).stock.stone = 0;
    const g = put(w, 'glassworks', { state: 'waitingInput' });
    const chip = stateChip(w, g);
    expect(chip.text).toBe(stateInfo(g, w.tick, missingInputs(w, g)).text);
    expect(chip.text).toBe('Wartet auf Stein');
    expect(chip.tone).toBe('warn');
    expect(chip.label).toBe('Zustand: Wartet auf Stein');
    expect(TONE_SYMBOL).toEqual({ ok: '✓', warn: '!', bad: '✗' });
  });
});

describe('AK-PU-04 Pips', () => {
  const w = createWorld(3, { unlockAll: true });
  it('levelPips', () => {
    expect(levelPips(put(w, 'fisher'))).toEqual({ level: 1, max: 3, label: 'Stufe 1 von 3' });
    expect(levelPips(put(w, 'fisher', { level: 3 }))!.level).toBe(3);
    expect(levelPips(put(w, 'chapel'))).toBeNull();
    expect(levelPips(put(w, 'spicefarm'))).toBeNull();
    expect(levelPips(put(w, 'house'))).toBeNull();
  });
  it('tierPips', () => {
    const h = put(w, 'house');
    setHouse(h, 2, 1, []);
    const max = Object.keys(TIERS).length;
    expect(tierPips(h)).toEqual({
      level: 2,
      max,
      label: `${TIERS[2].name}, Stufe 2 von ${max}`,
    });
    expect(tierPips(put(w, 'fisher'))).toBeNull();
  });
});

describe('AK-PU-05 supplyChip', () => {
  it('versorgt, unversorgt, kein Haus', () => {
    const { w, house, fisher } = uxWorld();
    expect(isSupplied(w, house)).toBe(true);
    expect(supplyChip(w, house)).toEqual({
      text: 'Versorgt',
      tone: 'ok',
      label: 'Versorgung: ✓ im Radius',
    });
    const far = put(w, 'house', { x: 0, y: 0, house: { ...house.house! } });
    expect(isSupplied(w, far)).toBe(false);
    expect(supplyChip(w, far)).toEqual({
      text: 'Nicht versorgt',
      tone: 'bad',
      label: 'Versorgung: ✗ ausserhalb von Kontor/Markt',
    });
    expect(supplyChip(w, fisher)).toBeNull();
  });
});

describe('AK-PU-06..09 Kacheln', () => {
  const w = createWorld(3, { unlockAll: true });
  const pm = (b: Building) => perMinute(1, BUILDING_DEFS[b.defId].cycle!);
  it('AK-PU-06 Fischerhütte', () => {
    expect(statTiles(put(w, 'fisher'))).toEqual([
      { key: 'output', label: 'Ausstoss', value: '15 / min', sub: 'Nahrung · alle 4 s' },
      { key: 'utilization', label: 'Auslastung', value: '100 %', sub: null },
      { key: 'upkeep', label: 'Unterhalt', value: '30 / min', sub: 'Geld' },
    ]);
    const t2 = statTiles(put(w, 'fisher', { level: 2 }));
    expect(t2[0]).toMatchObject({ value: '25 / min', sub: 'Nahrung · alle 3 s' });
    expect(t2[2]).toMatchObject({ value: '42 / min' });
    expect(statTiles(put(w, 'fisher', { eff: 94_208 }))[1]!.value).toBe('36 %');
  });
  it('AK-PU-07 Verbrauch', () => {
    const wv = put(w, 'weaver');
    const keys = statTiles(wv).map((t) => t.key);
    expect(keys).toEqual(['output', 'utilization', 'input', 'upkeep']);
    expect(statTiles(wv)[2]).toMatchObject({
      key: 'input',
      label: 'Verbrauch',
      value: `${pm(wv)} / min`,
      sub: 'Wolle',
    });
    const gl = put(w, 'glassworks');
    expect(statTiles(gl)[2]).toMatchObject({
      value: `je ${pm(gl)} / min`,
      sub: 'Stein und Holz',
    });
    expect(statTiles(put(w, 'spicefarm')).map((t) => t.key)).toEqual([
      'output',
      'utilization',
      'upkeep',
    ]);
  });
  it('AK-PU-08 Kapelle, Brand', () => {
    expect(statTiles(put(w, 'chapel')).map((t) => t.key)).toEqual(['upkeep']);
    const f = statTiles(put(w, 'fisher', { outageUntil: 100, state: 'burning' }))[0]!;
    expect(f.sub).toBe('Nahrung · ruht, Betrieb brennt');
    expect(f.value).toBe('15 / min');
  });
  it('AK-PU-09 houseTiles', () => {
    const h = put(w, 'house');
    setHouse(h, 1, 3, []);
    expect(houseTiles(h)).toEqual([
      {
        key: 'inhabitants',
        label: 'Einwohner',
        value: `3 / ${TIERS[1].maxInhabitants}`,
        sub: null,
      },
    ]);
    expect(houseTiles(put(w, 'fisher'))).toEqual([]);
  });
});

describe('AK-PU-10..13 upgradeCard', () => {
  const rich = (): World => {
    const w = createWorld(3, { unlockAll: true });
    w.money = 1000;
    home(w).stock.cloth = 2;
    home(w).stock.rum = 2;
    home(w).stock.wood = 50;
    home(w).stock.tools = 50;
    return w;
  };
  it('AK-PU-10 next', () => {
    const w = rich();
    const f = put(w, 'fisher');
    const before = serialize(w);
    const c = upgradeCard(w, f)!;
    const v = upgradeView(w, f)!;
    expect(c).toMatchObject({
      kind: 'next',
      title: v.title,
      cost: v.cost,
      fee: v.fee,
      reasons: v.reasons,
      ok: v.ok,
      key: UPGRADE_KEY_LABEL,
    });
    expect(UPGRADE_KEY_LABEL).toBe('Umschalt+U');
    if (c.kind !== 'next') throw new Error('next erwartet');
    expect(c.gains.map((g) => [g.key, g.before, g.after, g.delta])).toEqual([
      ['output', 15, 25, '+10'],
      ['upkeep', 30, 42, '+12'],
    ]);
    expect(serialize(w)).toBe(before);
  });
  it('AK-PU-11 Gründe', () => {
    const w = rich();
    home(w).stock.cloth = 0;
    const c = upgradeCard(w, put(w, 'fisher'))!;
    expect(c).toMatchObject({ kind: 'next', reasons: ['✗ Zu wenig Stoff'], ok: false });
    const b = upgradeCard(w, put(w, 'fisher', { outageUntil: 99, state: 'burning' }))!;
    if (b.kind !== 'next') throw new Error('next erwartet');
    expect(b.ok).toBe(false);
    expect(b.reasons.join(' ')).toContain('brennt');
  });
  it('AK-PU-12 gesperrt', () => {
    const w = createWorld(3);
    const c = upgradeCard(w, put(w, 'fisher'))!;
    expect(c.kind).toBe('locked');
    if (c.kind !== 'locked') throw new Error('locked erwartet');
    expect(c.title).toBe('Ausbau zu Stufe 2');
    expect(c.lock).toBe(functionLock(w, 'upgrade2'));
    expect(c.gains.map((g) => g.key)).toEqual(['output', 'upkeep']);
    expect('cost' in c).toBe(false);
    expect('fee' in c).toBe(false);
    const w2 = createWorld(3, { unlockAll: true });
    w2.unlocked = w2.unlocked.filter((u) => u !== 'U5' && u !== 'U6');
    const c3 = upgradeCard(w2, put(w2, 'fisher', { level: 2 }))!;
    expect(c3.kind).toBe('locked');
    if (c3.kind !== 'locked') throw new Error('locked erwartet');
    expect(c3.title).toBe('Ausbau zu Stufe 3');
    expect(c3.lock).toBe(functionLock(w2, 'upgrade3'));
  });
  it('AK-PU-13 max und null', () => {
    const w = rich();
    expect(upgradeCard(w, put(w, 'fisher', { level: 3 }))).toEqual({
      kind: 'max',
      title: 'Höchste Stufe',
    });
    expect(upgradeCard(w, put(w, 'chapel'))).toBeNull();
    expect(upgradeCard(w, put(w, 'spicefarm'))).toBeNull();
    expect(upgradeCard(w, put(w, 'house'))).toBeNull();
  });
});

describe('AK-PU-14 upgradeGain Rundung', () => {
  const w = createWorld(3, { unlockAll: true });
  it('Fischer 2 -> 3', () => {
    const g = upgradeGain(put(w, 'fisher', { level: 2 }), 3);
    expect(g[0]).toMatchObject({ key: 'output', before: 25, after: 37.5, delta: '+12.5' });
    expect(g[1]).toMatchObject({ key: 'upkeep', before: 42, after: 54, delta: '+12' });
  });
  it('Steinbruch 1 -> 2', () => {
    const g = upgradeGain(put(w, 'quarry'), 2);
    expect(g[0]).toMatchObject({ before: 10, after: 16.7, delta: '+6.7' });
    expect(g[0]!.text).toBe('10 → 16.7 / min');
    expect(g[0]!.label).toBe('Ausstoss');
    expect(g[1]).toMatchObject({ before: 60, after: 78, delta: '+18' });
  });
});

describe('AK-PU-15 riseCard', () => {
  const w = createWorld(3, { unlockAll: true });
  it('Pioniere und höchste Stufe', () => {
    const h = put(w, 'house');
    setHouse(h, 1, 1, []);
    const a = TIERS[1].maxInhabitants;
    const b = TIERS[2].maxInhabitants;
    expect(riseCard(w, h)).toEqual({
      title: `Aufstieg zu ${TIERS[2].name}`,
      gain: {
        key: 'inhabitants',
        label: 'Einwohner höchstens',
        before: a,
        after: b,
        delta: signedNum(b - a),
        text: `${a} → ${b}`,
      },
    });
    const top = put(w, 'house');
    setHouse(top, Object.keys(TIERS).length as Tier, 1, []);
    expect(riseCard(w, top)).toEqual({ title: 'Höchste Stufe', gain: null });
  });
});

describe('AK-PU-16 progressView', () => {
  const w = createWorld(3, { unlockAll: true });
  it('Fischer halber Zyklus, Kapelle null', () => {
    const f = put(w, 'fisher', { progress: BUILDING_DEFS.fisher.cycle! / 2 });
    expect(progressView(f)).toEqual({ pct: 50, label: 'Fortschritt 50 %' });
    expect(progressView(f)!.pct).toBe(progressPct(f));
    expect(progressView(put(w, 'chapel'))).toBeNull();
  });
});

describe('AK-PU-17 Struktur-Stabilität', () => {
  it('statTiles-Schlüssel gleich statKeys für alle Variationen', () => {
    const w = createWorld(3, { unlockAll: true });
    for (const defId of PANEL_A) {
      const levels: (2 | 3 | undefined)[] = LEVELS[defId] ? [undefined, 2, 3] : [undefined];
      for (const level of levels)
        for (const state of STATES)
          for (const connected of [true, false])
            for (const eff of [undefined, 94_208, 0])
              for (const burning of [true, false]) {
                const b = put(w, defId, {
                  state,
                  connected,
                  ...(level ? { level } : {}),
                  ...(eff === undefined ? {} : { eff }),
                  ...(burning ? { outageUntil: 10 } : {}),
                });
                expect(statTiles(b).map((t) => t.key)).toEqual(statKeys(defId));
              }
    }
  });
});
