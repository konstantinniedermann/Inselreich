import { describe, expect, it } from 'vitest';
import { chipView, checklistView, type ChecklistView } from '../../src/ui/levelChecklist';
import { upgradeBuilding } from '../../src/sim/upgrade';
import type {
  Building,
  BuildingDefId,
  CrisisLevel,
  Island,
  Terrain,
  Tier,
  World,
} from '../../src/sim/types';
import { createWorld, home, idx } from '../../src/sim/world';
import { putBuilding, twoIslandWorld } from '../sim/helpers';

function drain(isl: Island): void {
  for (const t of isl.tiles) {
    if (t.buildingId !== null) continue;
    t.terrain = 'water';
    t.road = false;
  }
}
function emptyWorld(crisisLevel: CrisisLevel = 'off'): World {
  const w = createWorld(3, { unlockAll: true, crisisLevel });
  drain(home(w));
  w.money = 812;
  Object.assign(home(w).stock, { wood: 10, tools: 5, stone: 5, cloth: 14 });
  return w;
}
const setTerrain = (w: World, pos: [number, number][], terrain: Terrain): void => {
  for (const [x, y] of pos) home(w).tiles[idx(home(w), x, y)]!.terrain = terrain;
};
const houseAt = (w: World, x: number, y: number, tier: Tier, island = 0): Building => {
  const h = putBuilding(w, island, 'house', x, y);
  h.house!.tier = tier;
  return h;
};
const shop = (w: World, defId: BuildingDefId, x: number, y: number, level: 1 | 2 | 3 = 1) => {
  const b = putBuilding(w, 0, defId, x, y);
  if (level !== 1) b.level = level;
  return b;
};
function list(w: World, b: Building): Extract<ChecklistView, { kind: 'list' }> {
  const v = checklistView(w, b);
  if (v === null || v.kind !== 'list') throw new Error('list erwartet');
  return v;
}
const row = (w: World, b: Building, id: string) => list(w, b).rows.find((r) => r.id === id)!;

describe('AK-AL-38 Gelände-Zeilen', () => {
  const ring = (n: number): [number, number][] =>
    (
      [
        [19, 19],
        [20, 19],
        [21, 19],
        [19, 20],
        [21, 20],
        [19, 21],
      ] as [number, number][]
    ).slice(0, n);
  it('Holzfäller ✗ und ✓', () => {
    const w = emptyWorld();
    const b = shop(w, 'lumberjack', 20, 20);
    setTerrain(w, ring(3), 'forest');
    expect(row(w, b, 'site')).toEqual({
      id: 'site',
      ok: false,
      text: 'Zu wenig Wald: 3 freie Waldfelder im Umkreis 2 (nötig 4)',
    });
    setTerrain(w, ring(6), 'forest');
    expect(row(w, b, 'site')).toMatchObject({
      ok: true,
      text: 'Wald: 6 freie Waldfelder im Umkreis 2 (nötig 4)',
    });
  });
  it('Steinbruch ✗ und ✓', () => {
    const w = emptyWorld();
    const b = shop(w, 'quarry', 20, 20);
    setTerrain(w, ring(2), 'mountain');
    expect(row(w, b, 'site').text).toBe('Zu wenig Fels: 2 Gebirgsfelder im Umkreis 2 (nötig 3)');
    setTerrain(w, ring(4), 'mountain');
    expect(row(w, b, 'site')).toMatchObject({
      ok: true,
      text: 'Fels: 4 Gebirgsfelder im Umkreis 2 (nötig 3)',
    });
  });
  it('Schäferei ✗ und ✓', () => {
    const w = emptyWorld();
    const b = shop(w, 'sheepfarm', 20, 20);
    const pos: [number, number][] = [
      [19, 18],
      [20, 18],
      [21, 18],
      [22, 18],
      [19, 19],
      [20, 19],
      [21, 19],
      [22, 19],
      [23, 19],
    ];
    setTerrain(w, pos.slice(0, 7), 'grass');
    expect(row(w, b, 'site').text).toBe(
      'Zu wenig Weide: 7 freie Grasfelder im Umkreis 3 (nötig 8)',
    );
    setTerrain(w, pos, 'grass');
    expect(row(w, b, 'site')).toMatchObject({
      ok: true,
      text: 'Weide: 9 freie Grasfelder im Umkreis 3 (nötig 8)',
    });
  });
});

describe('AK-AL-39 Fischgrund', () => {
  it('eine andere Hütte ✓, zwei ✗', () => {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20);
    shop(w, 'fisher', 21, 20);
    expect(row(w, f, 'site')).toMatchObject({
      ok: true,
      text: 'Fischgrund: 1 andere Fischerhütte im Umkreis 2 (erlaubt 1)',
    });
    shop(w, 'fisher', 22, 20);
    expect(row(w, f, 'site')).toMatchObject({
      ok: false,
      text: 'Fischgrund überfischt: 2 andere Fischerhütten im Umkreis 2 (erlaubt 1)',
    });
  });
});

describe('AK-AL-40 Feuerwache', () => {
  it('Brennerei g 2: ✗ ohne Wache, ✓ mit Wache, off ✓', () => {
    const w = emptyWorld('normal');
    const b = shop(w, 'distillery', 20, 20, 2);
    expect(row(w, b, 'site')).toMatchObject({
      ok: false,
      text: 'Keine Feuerwache in Reichweite 8 (Brennofen)',
    });
    shop(w, 'firestation', 24, 20);
    expect(row(w, b, 'site')).toMatchObject({ ok: true, text: 'Feuerwache in Reichweite 8' });
    w.crisisLevel = 'off';
    expect(row(w, b, 'site')).toMatchObject({
      ok: true,
      text: 'Feuerwache: nicht nötig (Krisen aus)',
    });
  });
  it.each([
    ['toolmaker', 'Esse'],
    ['glassworks', 'Schmelzofen'],
  ] as const)('%s nennt %s', (defId, ofen) => {
    const w = emptyWorld('normal');
    const b = shop(w, defId, 20, 20, 2);
    expect(row(w, b, 'site').text).toBe(`Keine Feuerwache in Reichweite 8 (${ofen})`);
  });
});

describe('AK-AL-41 Fachkräfte', () => {
  const setup = () => {
    const w = emptyWorld();
    return { w, b: shop(w, 'lumberjack', 20, 20) };
  };
  it('Siedlerhaus Abstand 6 ✓', () => {
    const { w, b } = setup();
    houseAt(w, 26, 20, 2);
    expect(row(w, b, 'workforce')).toMatchObject({
      ok: true,
      text: 'Handwerker im Umkreis 8: Siedlerhaus, nächstes 6 Felder',
    });
  });
  it('Abstand 11 ✗', () => {
    const { w, b } = setup();
    houseAt(w, 31, 20, 2);
    expect(row(w, b, 'workforce')).toMatchObject({
      ok: false,
      text: 'Keine Handwerker im Umkreis 8 (Siedlerhaus nötig, nächstes 11 Felder)',
    });
  });
  it('ohne Haus', () => {
    const { w, b } = setup();
    expect(row(w, b, 'workforce').text).toBe(
      'Keine Handwerker im Umkreis 8 (kein Siedlerhaus auf dieser Insel)',
    );
  });
  it('Haus nur auf anderer Insel', () => {
    const w = twoIslandWorld();
    drain(home(w));
    const b = putBuilding(w, 0, 'lumberjack', 20, 20);
    houseAt(w, 24, 20, 2, 1);
    expect(row(w, b, 'workforce').text).toBe(
      'Keine Handwerker im Umkreis 8 (Siedlerhaus nur auf anderer Insel)',
    );
  });
  it('Stufe 3: Meister und Bürgerhaus', () => {
    const w = emptyWorld();
    const b = shop(w, 'lumberjack', 20, 20, 2);
    expect(row(w, b, 'workforce').text).toBe(
      'Keine Meister im Umkreis 8 (kein Bürgerhaus auf dieser Insel)',
    );
  });
});

describe('AK-AL-42 Chip', () => {
  it('Brennerei g 3 ohne Wache: Läuft wie Stufe 2', () => {
    const w = emptyWorld('normal');
    const b = shop(w, 'distillery', 20, 20, 3);
    houseAt(w, 24, 20, 3);
    const c = chipView(w, b)!;
    expect(c.text).toBe('Läuft wie Stufe 2: Keine Feuerwache in Reichweite 8 (Brennofen)');
    expect(c.tooltip).toContain('Unterhalt 180 statt 204 (gedrosselt)');
    b.paused = true;
    expect(chipView(w, b)).toBeNull();
    delete b.paused;
    b.outageUntil = 99;
    expect(chipView(w, b)).toBeNull();
  });
});

describe('AK-AL-43 Höchststufe und Wohnhaus', () => {
  it('Jagdhütte g 3: max; Wohnhaus: null', () => {
    const w = emptyWorld();
    expect(checklistView(w, shop(w, 'hunter', 30, 20, 3))).toEqual({
      kind: 'max',
      text: 'Höchste Stufe erreicht',
    });
    expect(checklistView(w, houseAt(w, 20, 20, 1))).toBeNull();
  });
});

describe('AK-AL-37 Tooltip = Grund des Ausbaus', () => {
  const stoerungen: [string, (w: World, f: Building) => void][] = [
    ['Wissen', (w) => (w.unlocked = ['U0', 'U2', 'U3'])],
    ['Brand', (_w, f) => (f.outageUntil = 99)],
    [
      'Fachkräfte',
      (w) => void [...Object.values(w.buildings)].forEach((b) => b.house && (b.house.tier = 2)),
    ],
    ['Standort', (w) => void shop(w, 'fisher', 22, 20)],
    ['Geld', (w) => (w.money = 10)],
  ];
  it.each(stoerungen)('%s', (_n, setze) => {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20, 2);
    shop(w, 'fisher', 21, 20);
    houseAt(w, 26, 20, 3);
    setze(w, f);
    const v = list(w, f);
    const r = upgradeBuilding(w, f.id);
    expect(r.ok).toBe(false);
    expect(v.canUpgrade).toBe(false);
    expect(v.tooltip).toBe(r.ok ? null : r.reason);
  });
  it('alles ✓: kein Tooltip, canUpgrade', () => {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20, 2);
    shop(w, 'fisher', 21, 20);
    houseAt(w, 26, 20, 3);
    const v = list(w, f);
    expect(v).toMatchObject({ canUpgrade: true, tooltip: null });
    expect(v.title).toBe('Ausbau auf Stufe 3 — Fischerhütte');
  });
});

describe('AK-AL-29 Szene S1', () => {
  it('Zeilen, Abriss des Nachbarn, Abriss des Bürgerhauses', () => {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20, 2);
    const n2 = shop(w, 'fisher', 22, 20);
    shop(w, 'fisher', 23, 20);
    const bh = houseAt(w, 26, 20, 3);
    home(w).stock.stone = 0;
    let v = list(w, f);
    expect(v.rows.map((r) => [r.id, r.ok])).toEqual([
      ['knowledge', true],
      ['workforce', true],
      ['site', false],
      ['money', true],
      ['wood', true],
      ['tools', true],
      ['stone', false],
      ['extra', true],
    ]);
    expect(v.rows.find((r) => r.id === 'workforce')!.text).toBe(
      'Meister im Umkreis 8: Bürgerhaus, nächstes 6 Felder',
    );
    expect(v.canUpgrade).toBe(false);
    expect(v.tooltip).toBe(
      'Fischgrund überfischt: 2 andere Fischerhütten im Umkreis 3 (erlaubt 1)',
    );
    home(w).stock.stone = 5;
    delete w.buildings[n2.id];
    for (const t of home(w).tiles) if (t.buildingId === n2.id) t.buildingId = null;
    v = list(w, f);
    expect(v.canUpgrade).toBe(true);
    delete w.buildings[bh.id];
    for (const t of home(w).tiles) if (t.buildingId === bh.id) t.buildingId = null;
    const c = chipView(w, f)!;
    expect(c.text.startsWith('Läuft wie Stufe 1: ')).toBe(true);
    expect(c.tooltip).toContain('Unterhalt 36 statt 42 (gedrosselt)');
  });
});
