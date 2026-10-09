import { describe, expect, it } from 'vitest';
import { lightAt, type Weather } from '../../src/render/daynight';
import { wildlifeEnvOf, type RenderFx, type Tool } from '../../src/render/renderer';
import { pickWeather } from '../../src/render/weather';
import { wildlifeAt } from '../../src/render/wildlife';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { newHouseState } from '../../src/sim/population';
import { home, createWorld, idx } from '../../src/sim/world';
import type { Building, BuildingDefId, BuildingState, Order, World } from '../../src/sim/types';
import { friendlyReason } from '../../src/ui/hints';
import { deriveUnlocks } from '../../src/sim/unlocks';
import {
  foreignHoverTitle,
  hoverInfo,
  hoverPosition,
  hoverVisible,
  type HoverState,
} from '../../src/ui/hover';
import { protectedCount } from '../../src/ui/inspect';
import { diagnosisText } from '../../src/ui/texts';
import { houseDiagnosis } from '../../src/sim/queries';
import {
  forceGrass,
  forceRect,
  houseFar,
  placeService,
  placeTownhall,
  setHouse,
  village,
} from '../sim/helpers';

const rainWeather = (): Weather => ({ kind: 'rain', w: 1 });

/** Volles, versorgtes Pionierhaus, dessen Bedürfnisse lange erfüllt sind: Aufstieg bereit (wie AK-S2-09). */
function readyPioneer(w: World, h: Building): void {
  setHouse(h, 1, 4);
  h.house!.supplied = true;
  h.house!.satisfied = { food: true };
  const k = w.buildings[home(w).kontorId]!;
  placeService(w, 'chapel', k.x + 2, k.y + 4); // Aufstieg zu Stufe 2 verlangt eine Kapelle in Reichweite
  w.tick = 100_000;
  h.house!.satisfiedSince = 0;
  w.money = 100_000;
  const stock = home(w).stock;
  for (const g of Object.keys(stock) as (keyof typeof stock)[]) stock[g] = 100;
}

/** Erste Gebirgskachel der Karte (Seed 3). */
function mountainTile(w: World): { x: number; y: number } {
  for (let y = 0; y < home(w).height; y++)
    for (let x = 0; x < home(w).width; x++)
      if (home(w).tiles[idx(home(w), x, y)]!.terrain === 'mountain') return { x, y };
  throw new Error('kein Gebirge');
}

const orderFixture = (w: World): Order => ({
  period: 1,
  good: 'wood',
  amount: 20,
  reward: 300,
  due: w.tick + 600,
});

describe('M10 Mouse-over (Spec 13)', () => {
  const none = { ship: false, animal: null };
  it('AK-U3-01 Wohnhaus: Titel je Stufe, Einwohner, erste Diagnose oder zufrieden, Aufstieg', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    setHouse(h, 2, 6);
    h.house!.supplied = true;
    h.house!.satisfied = { food: true, cloth: false };
    const a = hoverInfo(w, h, 0, none)!;
    expect(a.title).toBe('Siedlerhaus');
    expect(a.lines).toEqual([
      'Einwohner 6 / 8',
      'Stoff fehlt',
      `Aufstieg: ${friendlyReason(w, 'Haus nicht voll belegt')}`,
    ]);
    const { w: w2, houses: h2 } = village(1, { unlockAll: true });
    readyPioneer(w2, h2[0]!);
    const b = hoverInfo(w2, h2[0]!, 0, none)!;
    expect(b.title).toBe('Pionierhaus');
    expect(b.lines[1]).toBe('zufrieden');
    expect(b.lines[2]).toBe('Aufstieg bereit');
  });
  /** Gebäude roh einsetzen (ohne Standortregel): Mouse-over liest nur Zustand und Welt. */
  function raw(
    w: World,
    defId: BuildingDefId,
    x: number,
    y: number,
    state: BuildingState = 'ok',
  ): Building {
    const id = w.nextBuildingId++;
    const d = BUILDING_DEFS[defId];
    const b: Building = { id, defId, x, y, connected: true, progress: 0, state, island: 0 };
    w.buildings[id] = b;
    for (let dy = 0; dy < d.h; dy++)
      for (let dx = 0; dx < d.w; dx++) {
        forceGrass(w, x + dx, y + dy);
        home(w).tiles[idx(home(w), x + dx, y + dy)]!.buildingId = id;
      }
    return b;
  }
  it('AK-U3-02 Betrieb, Dienst, Amtsstube: Zustandszeilen wörtlich (10 Fälle) (M11 S3)', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    const p = (dx: number, dy: number): [number, number] => [k.x + dx, k.y + dy];
    const first = (b: Building): string => hoverInfo(w, b, 0, none)!.lines[0]!;
    forceRect(w, k.x + 2, k.y + 4, 6, 5, 'grass'); // Holzfäller ohne Wald im Radius 2
    const lj = raw(w, 'lumberjack', ...p(4, 6), 'noForest');
    expect(first(raw(w, 'fisher', ...p(4, -6)))).toBe('arbeitet — 15 Nahrung / min');
    expect(first(raw(w, 'weaver', ...p(6, -6), 'waitingInput'))).toBe('wartet auf Wolle'); // Wolle 0 im Startlager
    expect(first(raw(w, 'weaver', ...p(8, -6), 'storageFull'))).toBe('Lager voll');
    expect(first(raw(w, 'toolmaker', ...p(10, -6), 'noService'))).toBe(
      'braucht eine Schule in Reichweite',
    );
    const burning = raw(w, 'weaver', ...p(12, -6), 'burning');
    burning.outageUntil = 500;
    expect(first(burning)).toBe('brennt');
    const unc = raw(w, 'weaver', ...p(14, -6), 'notConnected');
    unc.connected = false;
    expect(first(unc)).toBe('nicht angebunden');
    expect(hoverInfo(w, lj, 0, none)!.lines).toContain('Kein freier Wald in der Nähe');
    const chapel = raw(w, 'chapel', ...p(4, 10));
    for (const dx of [6, 7, 8]) raw(w, 'house', ...p(dx, 10)).house = newHouseState(w);
    expect(first(chapel)).toBe('versorgt 3 Häuser');
    const fs = raw(w, 'firestation', ...p(10, 10));
    expect(first(fs)).toBe(`schützt ${protectedCount(w, fs)} Gebäude`);
    expect(hoverInfo(w, raw(w, 'townhall', ...p(14, 10)), 0, none)!.lines).toEqual([
      'Steuer: normal',
      'Sperren: 0',
      'Klicken zum Einstellen',
    ]);
  });
  it('AK-T33 (QA-d) Haus: Steuerzeile der Stufe nur mit aktiver Amtsstube; Amtsstube gemischt', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    setHouse(h, 3, 6);
    h.house!.supplied = true;
    const lines = (): string[] => hoverInfo(w, h, 0, none)!.lines;
    const before = lines();
    expect(before.some((l) => l.startsWith('Steuer:'))).toBe(false);
    const hall = placeTownhall(w);
    expect(lines()).toEqual([...before, 'Steuer: normal']);
    w.taxLevels[3] = 'high';
    expect(lines().at(-1)).toBe('Steuer: hoch');
    w.taxLevels[1] = 'low';
    expect(hoverInfo(w, hall, 0, none)!.lines[0]).toBe('Steuer: gemischt');
    w.taxLevels = { 1: 'high', 2: 'high', 3: 'high', 4: 'high' };
    expect(hoverInfo(w, hall, 0, none)!.lines[0]).toBe('Steuer: hoch');
  });
  it('AK-U3-03 Gelände, Schiff, Tier', () => {
    const w = createWorld(3);
    const k = w.buildings[home(w).kontorId]!;
    forceRect(w, k.x + 6, k.y + 2, 1, 1, 'forest');
    forceRect(w, k.x + 7, k.y + 2, 1, 1, 'grass');
    const wald = { x: k.x + 6, y: k.y + 2 };
    const weide = { x: k.x + 7, y: k.y + 2 };
    expect(hoverInfo(w, wald, 0, none)).toEqual({ title: 'Wald', lines: ['Gut für Holzfäller'] });
    expect(hoverInfo(w, weide, 0, none)).toEqual({ title: 'Weide', lines: ['Gut für Wohnhaus'] });
    w.unlocked = ['U0', 'U2'];
    expect(hoverInfo(w, wald, 0, none)!.lines).toEqual(['Gut für Holzfäller', 'Roden: 10 Geld']);
    expect(hoverInfo(w, weide, 0, none)!.lines).toEqual([
      'Gut für Wohnhaus, Schäferei',
      'Aufforsten: 20 Geld',
    ]);
    const far = { x: k.x + 20, y: k.y };
    forceRect(w, far.x, far.y, 1, 1, 'grass');
    expect(hoverInfo(w, far, 0, none)!.lines.at(-1)).toBe('Ausserhalb der Versorgung');
    const m = mountainTile(w);
    expect(hoverInfo(w, m, 0, none)!.lines[0]).toBe('Gut für Steinbruch daneben');
    expect(hoverInfo(w, { x: 0, y: 0 }, 0, { ship: true, animal: null })).toEqual({
      title: 'Händlerschiff',
      lines: ['Kauft und verkauft am Kontor'],
    });
    w.unlocked = ['U0', 'U2', 'U3'];
    w.order = orderFixture(w);
    expect(hoverInfo(w, { x: 0, y: 0 }, 0, { ship: true, animal: null })!.lines[1]).toMatch(
      /^Auftrag: \d+ .+, noch /,
    );
    expect(hoverInfo(w, k, 0, { ship: false, animal: 'Wal' })).toEqual({ title: 'Wal', lines: [] });
    for (const t of [wald, weide, far, m, k]) {
      const i = hoverInfo(w, t, 0, none);
      expect(i === null || i.lines.length <= 3).toBe(true);
      expect(JSON.stringify(i)).not.toMatch(/Tick/);
    }
  });
  // Der erste Teil ist absichtlich tautologisch (gleiche Funktion, gleiche Argumente); die echte Absicherung der
  // Umgebung liegt in tests/render/renderer.test.ts (wildlifeEnvOf). Hier zählt: hoverInfo bricht ohne Treffer nicht.
  it('AK-U3-06 Tiere: ohne Abfrage-Treffer bricht nichts; gleiche env wie der Renderer (Regen, reduziert)', () => {
    const w = createWorld(3);
    const range = { x0: 0, y0: 0, x1: home(w).width - 1, y1: home(w).height - 1 };
    for (const fx of [
      { timeMs: 5000 },
      { timeMs: 5000, weather: rainWeather(), reduceMotion: true },
    ] as RenderFx[]) {
      const env = wildlifeEnvOf(w, fx);
      expect(env).toEqual({
        phase: lightAt(w.tick).phase,
        weather: pickWeather(fx.weather, null).kind,
        reduce: fx.reduceMotion === true,
      });
      expect(wildlifeAt(w, range, fx.timeMs, env)).toEqual(
        wildlifeAt(w, range, fx.timeMs, wildlifeEnvOf(w, fx)),
      );
    }
    expect(hoverInfo(w, { x: 0, y: 0 }, 0, { ship: false, animal: null })).not.toBeNull();
  });
  it('Spec 13.2 Dienst: Einzahl, Schule und Badehaus, nicht angebunden und brennend', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    const at = (dx: number, dy: number): [number, number] => [k.x + dx, k.y + dy];
    const chapel = raw(w, 'chapel', ...at(4, 10));
    raw(w, 'house', ...at(6, 10)).house = newHouseState(w);
    expect(hoverInfo(w, chapel, 0, none)!.lines).toEqual(['versorgt 1 Haus']); // Abweichung von Spec 13.2 (Einzahl)
    const w2 = createWorld(3, { crisisLevel: 'off', unlockAll: true }); // ohne Haus in Reichweite
    const k2 = w2.buildings[home(w2).kontorId]!;
    const school = raw(w2, 'school', k2.x + 4, k2.y + 14);
    expect(hoverInfo(w2, school, 0, none)).toEqual({
      title: 'Schule',
      lines: ['versorgt 0 Häuser'],
    });
    school.connected = false;
    expect(hoverInfo(w2, school, 0, none)!.lines).toEqual([
      'versorgt 0 Häuser',
      'nicht angebunden',
    ]);
    const bath = raw(w2, 'bathhouse', k2.x + 8, k2.y + 14);
    bath.outageUntil = 500;
    expect(hoverInfo(w2, bath, 0, none)!.lines).toEqual(['versorgt 0 Häuser', 'brennt']);
  });
  it('Spec 13.2 Amtsstube wirkt nicht: nicht angebunden, brennend', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    const t = raw(w, 'townhall', k.x + 4, k.y + 10);
    t.connected = false;
    expect(hoverInfo(w, t, 0, none)!.lines[2]).toBe('Wirkt nicht: nicht angebunden');
    t.connected = true;
    t.outageUntil = 500;
    expect(hoverInfo(w, t, 0, none)!.lines[2]).toBe('Wirkt nicht: brennt');
  });
  it('Spec 13.2 Kontor, Marktplatz, Weg', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    expect(hoverInfo(w, k, 0, none)).toEqual({
      title: 'Kontor',
      lines: ['Versorgung im Radius 8', 'Handel: klicken'],
    });
    const m = raw(w, 'market', k.x + 4, k.y + 10);
    expect(hoverInfo(w, m, 0, none)).toEqual({
      title: 'Marktplatz',
      lines: ['Versorgung im Radius 8'],
    });
    forceGrass(w, k.x + 8, k.y + 10);
    home(w).tiles[idx(home(w), k.x + 8, k.y + 10)]!.road = true;
    expect(hoverInfo(w, { x: k.x + 8, y: k.y + 10 }, 0, none)).toEqual({
      title: 'Weg',
      lines: ['Verbindet Betriebe mit dem Kontor'],
    });
  });
  it('Spec 13.2 Gelände: Sand, Wasser, Fischerhütte neben Wasser', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    const sand = { x: k.x + 6, y: k.y + 3 };
    forceGrass(w, sand.x, sand.y);
    home(w).tiles[idx(home(w), sand.x, sand.y)]!.terrain = 'sand';
    expect(hoverInfo(w, sand, 0, none)).toEqual({ title: 'Sand', lines: ['Gut für Wohnhaus'] });
    const sea = { x: k.x + 6, y: k.y + 12 };
    forceRect(w, sea.x, sea.y, 1, 1, 'water');
    expect(hoverInfo(w, sea, 0, none)).toEqual({
      title: 'Wasser',
      lines: ['Gut für Fischerhütte an der Küste'],
    });
    forceGrass(w, sea.x, sea.y - 1);
    expect(hoverInfo(w, { x: sea.x, y: sea.y - 1 }, 0, none)!.lines[0]).toMatch(/Fischerhütte/);
  });
  it('Spec 13.2 Haus-Diagnose: Ausserhalb der Versorgung, Dienst fehlt (gleich wie Inspektor)', () => {
    const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const far = houseFar(w);
    expect(hoverInfo(w, far, 0, none)!.lines[1]).toBe('Ausserhalb der Versorgung');
    expect(hoverInfo(w, far, 0, none)!.lines[1]).toBe(
      cap(diagnosisText(houseDiagnosis(w, far)[0]!)),
    );
    const { w: w2, houses } = village(1, { unlockAll: true });
    setHouse(houses[0]!, 2, 8);
    houses[0]!.house!.satisfied = { food: true, cloth: true };
    expect(hoverInfo(w2, houses[0]!, 0, none)!.lines[1]).toBe('Kapelle fehlt');
    const h = houses[0]!;
    expect(hoverInfo(w2, h, 0, none)!.lines[1]).toBe(cap(diagnosisText(houseDiagnosis(w2, h)[0]!)));
  });
  it('Spec 13.1 Vorrang: Schiff vor Gebäude, Tier vor Schiff', () => {
    const w = createWorld(3);
    const k = w.buildings[home(w).kontorId]!;
    expect(hoverInfo(w, k, 0, { ship: true, animal: null })!.title).toBe('Händlerschiff');
    expect(hoverInfo(w, k, 0, { ship: true, animal: 'Wal' })!.title).toBe('Wal');
  });
  it('AK-U3-04 (Vitest-Teil) hoverVisible und hoverPosition', () => {
    const base: HoverState = {
      restMs: 400,
      sameTile: true,
      dragging: false,
      modalOpen: false,
      tool: { kind: 'select' },
    };
    expect(hoverVisible(base)).toBe(true);
    expect(hoverVisible({ ...base, restMs: 399 })).toBe(false);
    for (const k of [
      { sameTile: false },
      { dragging: true },
      { modalOpen: true },
      { tool: { kind: 'road' } as Tool },
    ])
      expect(hoverVisible({ ...base, ...k })).toBe(false);
    const p = hoverPosition({ x: 1270, y: 790 }, { w: 220, h: 90 }, { w: 1280, h: 800 });
    expect(p.x + 220).toBeLessThanOrEqual(1280);
    expect(p.y + 90).toBeLessThanOrEqual(800);
  });
});

describe('M11 Mouse-over Betrieb (Spec 7)', () => {
  const none = { ship: false, animal: null };
  it('AK-UI-08 Fischer Stufe 2: Titel „Fischerhütte, Stufe 2 · Auslastung 100 %"; Kapelle ohne Stufe', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[home(w).kontorId]!;
    const put = (
      defId: BuildingDefId,
      x: number,
      y: number,
      extra: Partial<Building> = {},
    ): Building => {
      const b: Building = {
        id: w.nextBuildingId++,
        defId,
        x,
        y,
        connected: true,
        progress: 0,
        state: 'ok',
        island: 0,
        ...extra,
      };
      w.buildings[b.id] = b;
      forceGrass(w, x, y);
      home(w).tiles[idx(home(w), x, y)]!.buildingId = b.id;
      return b;
    };
    const f = put('fisher', k.x + 4, k.y - 6, { level: 2 });
    expect(hoverInfo(w, f, 0, none)!.title).toBe('Fischerhütte, Stufe 2 · Auslastung 100 %');
    expect(hoverInfo(w, f, 0, none)!.lines[0]).toBe('arbeitet — 25 Nahrung / min');
    const half = put('fisher', k.x + 6, k.y - 6, { eff: 128_000 });
    expect(hoverInfo(w, half, 0, none)!.title).toBe('Fischerhütte, Stufe 1 · Auslastung 50 %');
    expect(hoverInfo(w, put('chapel', k.x + 8, k.y - 6), 0, none)!.title).toBe('Kapelle');
  });
});

describe('M12 E2 UI Inseln: Fremdinsel vor seafaring', () => {
  it('Inselkartentitel nennt vor seafaring die Seefahrt, danach nicht', () => {
    const w = createWorld(3);
    expect(foreignHoverTitle(w, 'Möweninsel · 24 × 24')).toBe(
      'Möweninsel · 24 × 24 · Seefahrt mit den Kaufleuten',
    );
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    expect(foreignHoverTitle(w, 'Möweninsel · 24 × 24')).toBe('Möweninsel · 24 × 24');
  });
});
