import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  TILE_LAYOUT,
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
  type StatKey,
} from '../../src/ui/panelView';
import { upgradeView, progressPct } from '../../src/ui/panelView';
import { missingInputs, reservedInputs } from '../../src/sim/queries';
import { isSupplied } from '../../src/sim/population';
import { functionLock } from '../../src/sim/unlocks';
import { serialize } from '../../src/sim/save';
import { createWorld, home } from '../../src/sim/world';
import { BUILDING_DEFS, PAUSED_UPKEEP_PCT } from '../../src/sim/defs/buildings';
import { LEVELS } from '../../src/sim/defs/levels';
import { TIERS } from '../../src/sim/defs/tiers';
import { stateInfo } from '../../src/ui/texts';
import { setPaused } from '../../src/sim/pause';
import { pauseButton } from '../../src/ui/panelView';
import { buildingUpkeep } from '../../src/sim/levels';
import { UPKEEP_INTERVAL } from '../../src/sim/economy';
import { perMinute, signedNum } from '../../src/ui/time';
import type { Building, BuildingDefId, BuildingState, Tier, World } from '../../src/sim/types';
import { setHouse, uxWorld } from './worlds';
import { setEdict } from '../../src/sim/edicts';
import { upgradeBuilding } from '../../src/sim/upgrade';
import { totalTaxes } from '../../src/sim/population';
import { totalUpkeep } from '../../src/sim/economy';
import { balanceLine } from '../../src/ui/balancePreview';

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
  it('im Radius, ausserhalb, kein Haus (Wortfamilie Versorgung, REL-14)', () => {
    const { w, house, fisher } = uxWorld();
    expect(isSupplied(w, house)).toBe(true);
    expect(supplyChip(w, house)).toEqual({
      text: 'Im Versorgungsradius',
      tone: 'ok',
      label: 'Kontor oder Marktplatz in Reichweite: Waren kommen an',
    });
    const far = put(w, 'house', { x: 0, y: 0, house: { ...house.house! } });
    expect(isSupplied(w, far)).toBe(false);
    expect(supplyChip(w, far)).toEqual({
      text: 'Ausserhalb der Versorgung',
      tone: 'bad',
      label: 'Kein Kontor oder angebundener Marktplatz in Reichweite: keine Waren',
    });
    expect(supplyChip(w, fisher)).toBeNull();
  });
});

describe('AK-PU-06..09 Kacheln', () => {
  const w = createWorld(3, { unlockAll: true });
  const pm = (b: Building) => perMinute(1, BUILDING_DEFS[b.defId].cycle!);
  it('AK-PU-06 Fischerhütte', () => {
    expect(statTiles(w, put(w, 'fisher'))).toEqual([
      { key: 'output', label: 'Ausstoss', value: '15 / min', sub: 'Nahrung · alle 4 s' },
      { key: 'utilization', label: 'Auslastung', value: '100 %', sub: null },
      { key: 'upkeep', label: 'Unterhalt', value: '30 / min', sub: 'Geld' },
    ]);
    const t2 = statTiles(w, put(w, 'fisher', { level: 2 }));
    expect(t2[0]).toMatchObject({ value: '25 / min', sub: 'Nahrung · alle 3 s' });
    expect(t2[2]).toMatchObject({ value: '42 / min' });
    expect(statTiles(w, put(w, 'fisher', { eff: 94_208 }))[1]!.value).toBe('36 %');
  });
  it('AK-PU-07 Verbrauch', () => {
    const wv = put(w, 'weaver');
    const keys = statTiles(w, wv).map((t) => t.key);
    expect(keys).toEqual(['output', 'utilization', 'input', 'upkeep']);
    expect(statTiles(w, wv)[2]).toMatchObject({
      key: 'input',
      label: 'Verbrauch',
      value: `${pm(wv)} / min`,
      sub: 'Wolle',
    });
    const gl = put(w, 'glassworks');
    expect(statTiles(w, gl)[2]).toMatchObject({
      value: `je ${pm(gl)} / min`,
      sub: 'Stein und Holz',
    });
    expect(statTiles(w, put(w, 'spicefarm')).map((t) => t.key)).toEqual([
      'output',
      'utilization',
      'upkeep',
    ]);
  });
  it('AK-PU-08 Kapelle, Brand', () => {
    expect(statTiles(w, put(w, 'chapel')).map((t) => t.key)).toEqual(['upkeep']);
    const f = statTiles(w, put(w, 'fisher', { outageUntil: 100, state: 'burning' }))[0]!;
    expect(f.sub).toBe('Nahrung · ruht, Betrieb brennt');
    expect(f.value).toBe('15 / min');
  });
  it('AK-PU-09 houseTiles', () => {
    const h = put(w, 'house');
    setHouse(h, 1, 3, []);
    expect(houseTiles(w, h)).toEqual([
      {
        key: 'inhabitants',
        label: 'Einwohner',
        value: `3 / ${TIERS[1].maxInhabitants}`,
        sub: null,
      },
    ]);
    expect(houseTiles(w, put(w, 'fisher'))).toEqual([]);
  });
  it('TILE_LAYOUT: ein Eintrag je StatKey, Etiketten eine Quelle', () => {
    const keys: StatKey[] = ['output', 'utilization', 'input', 'upkeep', 'inhabitants'];
    expect(Object.keys(TILE_LAYOUT).sort()).toEqual([...keys].sort());
    const h = put(w, 'house');
    setHouse(h, 1, 3, []);
    const tiles = [
      ...statTiles(w, put(w, 'fisher')),
      ...statTiles(w, put(w, 'weaver')),
      ...statTiles(w, put(w, 'chapel')),
      ...houseTiles(w, h),
    ];
    expect(new Set(tiles.map((t) => t.key)).size).toBeGreaterThanOrEqual(4);
    for (const t of tiles) expect(t.label).toBe(TILE_LAYOUT[t.key].label);
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

describe('AK-15 Ausbau-Karte «Bilanz danach»', () => {
  const balance = (w: World): number => totalTaxes(w) - totalUpkeep(w);
  const rich = (edict: boolean): World => {
    const w = createWorld(3, { unlockAll: true });
    if (edict) {
      w.won = true;
      w.tick = 1000;
      w.money = 10_000;
      put(w, 'townhall');
      expect(setEdict(w, 'saving').ok).toBe(true);
    }
    w.money = 10_000;
    home(w).stock.cloth = 20;
    home(w).stock.rum = 20;
    home(w).stock.wood = 200;
    home(w).stock.tools = 200;
    home(w).stock.stone = 200;
    return w;
  };
  it('Stufe 1 -> 2 und 2 -> 3 stimmen mit dem echten upgradeBuilding überein, mit und ohne Edikt Sparen', () => {
    for (const edict of [false, true]) {
      const w = rich(edict);
      const f = put(w, 'fisher');
      for (const level of [1, 2]) {
        const c = upgradeCard(w, f)!;
        if (c.kind !== 'next') throw new Error('next erwartet');
        const before = balance(w);
        expect(upgradeBuilding(w, f.id).ok, `edict=${edict} level=${level}`).toBe(true);
        const after = balance(w);
        expect(f.level).toBe(level + 1);
        expect(c.balance, `edict=${edict} level=${level}`).toBe(balanceLine({ before, after }));
        expect(c.balance).toMatch(/^Bilanz danach: /);
      }
    }
  });
  it('Höchste Stufe und gesperrte Karte haben keine Zeile', () => {
    const w = rich(false);
    expect('balance' in upgradeCard(w, put(w, 'fisher', { level: 3 }))!).toBe(false);
    const w2 = createWorld(3);
    const c = upgradeCard(w2, put(w2, 'fisher'))!;
    expect(c.kind).toBe('locked');
    expect('balance' in c).toBe(false);
  });
});

describe('AK-PU-14 upgradeGain Rundung', () => {
  const w = createWorld(3, { unlockAll: true });
  it('Fischer 2 -> 3', () => {
    const g = upgradeGain(w, put(w, 'fisher', { level: 2 }), 3);
    expect(g[0]).toMatchObject({ key: 'output', before: 25, after: 37.5, delta: '+12.5' });
    expect(g[1]).toMatchObject({ key: 'upkeep', before: 42, after: 54, delta: '+12' });
  });
  it('Steinbruch 1 -> 2', () => {
    const g = upgradeGain(w, put(w, 'quarry'), 2);
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
    expect(progressView(w, f)).toEqual({ pct: 50, label: 'Fortschritt 50 %' });
    expect(progressView(w, f)!.pct).toBe(progressPct(w, f));
    expect(progressView(w, put(w, 'chapel'))).toBeNull();
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
                expect(statTiles(w, b).map((t) => t.key)).toEqual(statKeys(defId));
              }
    }
  });
});

describe('REL-14 Quelltext: alte Begriffe und Fehlt-Zeile entfernt', () => {
  const ui = ['panelView', 'inspect', 'texts', 'hover', 'hints', 'hud'].map((f) =>
    readFileSync(`src/ui/${f}.ts`, 'utf8'),
  );
  it('kein „Versorgt“/„Nicht versorgt“, kein first-missing, kein TIER_LIST', () => {
    for (const src of ui) {
      expect(src).not.toMatch(/\bVersorgt\b|Nicht versorgt/);
      expect(src).not.toMatch(/first-missing|setFirstMissing|TIER_LIST/);
      expect(src).not.toMatch(/const TIER_IDS/);
    }
    // A2 (R427): Rückfall des Haus-Hinweises ist „zufrieden“; „versorgt N Häuser“ (Dienstgebäude, hover.ts) bleibt.
    expect(readFileSync('src/ui/hints.ts', 'utf8')).not.toContain("'versorgt'");
    expect(readFileSync('src/style.css', 'utf8')).not.toContain('first-missing');
  });
});

const PAUSED_TEXT = `Stillgelegt — Unterhalt auf ${PAUSED_UPKEEP_PCT} % (aufgerundet)`;

describe('AK-UT-14 Kacheln stillgelegt', () => {
  const w = createWorld(3, { unlockAll: true });
  it('Ausstoss und Verbrauch ohne Rate, Unterhalt aufgerundet', () => {
    const wv = put(w, 'weaver');
    const normal = statTiles(w, wv);
    expect(normal.find((t) => t.key === 'output')!.value).toMatch(/ \/ min$/);
    wv.paused = true;
    const t = statTiles(w, wv);
    for (const key of ['output', 'input'] as const) {
      const tile = t.find((x) => x.key === key)!;
      expect(tile.value).toBe('Stillgelegt');
      expect(tile.sub).toBeNull();
    }
    expect(t.find((x) => x.key === 'upkeep')!.value).toBe(
      `${perMinute(buildingUpkeep(wv), UPKEEP_INTERVAL)} / min`,
    );
  });
});

describe('M13-E1 Stilllegen im Panel (AK-M13STL-09)', () => {
  const w = createWorld(3, { unlockAll: true });
  it('AK-M13STL-09 stateInfo und stateTone: stillgelegt mit Vorrang vor Anbindung, nach Ausfall', () => {
    const f = put(w, 'fisher', { connected: false });
    expect(setPaused(w, f.id, true).ok).toBe(true);
    expect(stateInfo(f, w.tick)).toEqual({ text: PAUSED_TEXT, ok: false });
    expect(stateTone(f)).toBe('warn');
    f.outageUntil = w.tick + 100;
    expect(stateInfo(f, w.tick).text).not.toBe(PAUSED_TEXT);
    expect(stateTone(f)).toBe('bad');
  });
  it('AK-M13STL-09 pauseButton: Betrieb ja, Wohnhaus und Kapelle nein', () => {
    const f = put(w, 'fisher');
    expect(pauseButton(f)).toEqual({
      text: 'Stilllegen',
      title: `Unterhalt auf ${PAUSED_UPKEEP_PCT} % (aufgerundet), keine Erzeugung`,
    });
    expect(setPaused(w, f.id, true).ok).toBe(true);
    expect(pauseButton(f)!.text).toBe('Wieder anfahren');
    expect(pauseButton(put(w, 'house'))).toBeNull();
    expect(pauseButton(put(w, 'chapel'))).toBeNull();
  });
  it('AK-M13STL-09 Kachel «Unterhalt» zeigt den wirksamen Unterhalt', () => {
    const g = put(w, 'glassworks');
    const tile = (): string => statTiles(w, g).find((t) => t.key === 'upkeep')!.value;
    expect(tile()).toBe(`${perMinute(buildingUpkeep(g), UPKEEP_INTERVAL)} / min`);
    const run = tile();
    expect(setPaused(w, g.id, true).ok).toBe(true);
    expect(tile()).not.toBe(run);
    expect(tile()).toBe(`${perMinute(buildingUpkeep(g), UPKEEP_INTERVAL)} / min`);
  });
});

describe('I-049 T06 waitingReserve im Panel (AK-SB-13)', () => {
  const reserved = (wood: number, stone: number) => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    home(w).reserve = { wood: wood as 0 | 20, stone: stone as 0 | 20 };
    home(w).stock.wood = wood;
    home(w).stock.stone = stone;
    return w;
  };
  it('Werkzeugmacher: «Wartet auf Holz (Reserve)», ok false, Ton warn', () => {
    const w = reserved(20, 0);
    const tm = put(w, 'toolmaker', { state: 'waitingReserve' });
    const info = stateInfo(tm, w.tick, missingInputs(w, tm), reservedInputs(w, tm));
    expect(info).toEqual({ text: 'Wartet auf Holz (Reserve)', ok: false });
    expect(stateTone(tm)).toBe('warn');
    expect(stateChip(w, tm).text).toBe('Wartet auf Holz (Reserve)');
  });
  it('Glashütte mit beiden Gütern gesperrt: «Wartet auf Stein, Holz (Reserve)»', () => {
    const w = reserved(20, 20);
    const gw = put(w, 'glassworks', { state: 'waitingReserve' });
    expect(stateChip(w, gw).text).toBe('Wartet auf Stein, Holz (Reserve)');
  });
  it('Glashütte nur Holz gesperrt: nennt nur Holz', () => {
    const w = reserved(20, 0);
    home(w).stock.stone = 15;
    const gw = put(w, 'glassworks', { state: 'waitingReserve' });
    expect(stateChip(w, gw).text).toBe('Wartet auf Holz (Reserve)');
  });
});
