import { describe, expect, it } from 'vitest';
import { levelChecks, levelChipDetail, levelChipText } from '../../src/sim/levelChecks';
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
import { upgradeBuilding } from '../../src/sim/upgrade';
import { putBuilding, twoIslandWorld } from './helpers';

/** Heimat leer räumen: alles Wasser ausser Gebäuden; gebaut wird nur, was der Test setzt. */
function emptyWorld(crisisLevel: CrisisLevel = 'off'): World {
  const w = createWorld(3, { unlockAll: true, crisisLevel });
  drain(home(w));
  w.money = 812;
  Object.assign(home(w).stock, { wood: 10, tools: 5, stone: 5, cloth: 14 });
  return w;
}
function drain(isl: Island): void {
  for (const t of isl.tiles) {
    if (t.buildingId !== null) continue;
    t.terrain = 'water';
    t.road = false;
  }
}
const setTerrain = (w: World, pos: [number, number][], terrain: Terrain): void => {
  for (const [x, y] of pos) home(w).tiles[idx(home(w), x, y)]!.terrain = terrain;
};
const houseAt = (w: World, x: number, y: number, tier: Tier, island = 0): Building => {
  const h = putBuilding(w, island, 'house', x, y);
  h.house!.tier = tier;
  return h;
};
const shop = (
  w: World,
  defId: BuildingDefId,
  x: number,
  y: number,
  level: 1 | 2 | 3 = 1,
): Building => {
  const b = putBuilding(w, 0, defId, x, y);
  if (level !== 1) b.level = level;
  return b;
};
const line = (w: World, b: Building, level: number, id: string) =>
  levelChecks(w, b, level).find((c) => c.id === id)!;
const firstFail = (w: World, b: Building, level: number): string | undefined =>
  levelChecks(w, b, level).find((c) => !c.ok)?.text;

describe('AK-AL-24 Zeilen, Reihenfolge, Zahlen (Fischer g 2 -> 3)', () => {
  function fischerWelt() {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20, 2);
    shop(w, 'fisher', 21, 20);
    shop(w, 'fisher', 22, 20);
    houseAt(w, 26, 20, 3);
    home(w).stock.stone = 0;
    return { w, f };
  }
  it('Zeilen-IDs in N3-Ordnung, ok/have/need wie das Beispielbild', () => {
    const { w, f } = fischerWelt();
    const rows = levelChecks(w, f, 3);
    expect(rows.map((r) => r.id)).toEqual([
      'knowledge',
      'workforce',
      'site',
      'money',
      'wood',
      'tools',
      'stone',
      'extra',
    ]);
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(by.workforce).toMatchObject({ ok: true, have: 6, need: 8 });
    expect(by.workforce!.text).toBe('Meister im Umkreis 8: Bürgerhaus, nächstes 6 Felder');
    expect(by.site).toMatchObject({ ok: false, have: 2, need: 1 });
    expect(by.money).toMatchObject({ ok: true, have: 812, need: 65 });
    expect(by.money!.text).toBe('Geld 65 (Kasse 812)');
    expect(by.stone).toMatchObject({ ok: false, have: 0, need: 2 });
    expect(by.stone!.text).toBe('Zu wenig Stein (0 / 2)');
    expect(by.extra!.text).toBe('Stoff 2 (Lager 14)');
    expect(firstFail(w, f, 3)).toBe(
      'Fischgrund überfischt: 2 andere Fischerhütten im Umkreis 3 (erlaubt 1)',
    );
  });
  it('Brandzeile nur bei brennendem Gebäude, direkt nach Wissen', () => {
    const { w, f } = fischerWelt();
    f.outageUntil = 99;
    const rows = levelChecks(w, f, 3);
    expect(rows.map((r) => r.id).slice(0, 3)).toEqual(['knowledge', 'burning', 'workforce']);
    expect(rows[1]).toMatchObject({ ok: false, text: 'Gebäude brennt' });
  });
  it('Geld zu knapp: «Zu wenig Geld (40 / 65)»', () => {
    const { w, f } = fischerWelt();
    w.money = 40;
    expect(line(w, f, 3, 'money').text).toBe('Zu wenig Geld (40 / 65)');
  });
  it('Wissen fehlt: Text der Freischaltung', () => {
    const { w, f } = fischerWelt();
    w.unlocked = [];
    const k = line(w, f, 3, 'knowledge');
    expect(k.ok).toBe(false);
    expect(k.text).not.toBe('');
  });
  it('Stoff knapp: «Zu wenig Stoff (1 / 2)»', () => {
    const { w, f } = fischerWelt();
    home(w).stock.cloth = 1;
    expect(line(w, f, 3, 'extra').text).toBe('Zu wenig Stoff (1 / 2)');
  });
  it('reine Abfrage: Welt bleibt gleich', () => {
    const { w, f } = fischerWelt();
    const before = JSON.stringify(w);
    levelChecks(w, f, 3);
    levelChipText(w, f);
    levelChipDetail(w, f);
    expect(JSON.stringify(w)).toBe(before);
  });
});

describe('Baustoffzeilen nur bei Bedarf, Grenzen', () => {
  it('Holzfäller Stufe 2: keine Holzzeile', () => {
    const w = emptyWorld();
    const b = shop(w, 'lumberjack', 20, 20);
    const ids = levelChecks(w, b, 2).map((r) => r.id);
    expect(ids).not.toContain('wood');
    expect(ids).toContain('tools');
    expect(ids).not.toContain('extra');
  });
  it('kein LEVELS-Eintrag (Wohnhaus) und Höchststufe: leere Liste', () => {
    const w = emptyWorld();
    const h = houseAt(w, 20, 20, 1);
    expect(levelChecks(w, h, 2)).toEqual([]);
    const j = shop(w, 'hunter', 30, 20, 3);
    expect(levelChecks(w, j, 4)).toEqual([]);
  });
});

describe('Fachkräfte-Zeile (N5)', () => {
  const setup = () => {
    const w = emptyWorld();
    return { w, b: shop(w, 'lumberjack', 20, 20) };
  };
  it('Stufe 2 mit Siedlerhaus im Abstand 6 ist erfüllt', () => {
    const { w, b } = setup();
    houseAt(w, 26, 20, 2);
    expect(line(w, b, 2, 'workforce')).toMatchObject({
      ok: true,
      text: 'Handwerker im Umkreis 8: Siedlerhaus, nächstes 6 Felder',
    });
  });
  it('Abstand 11 ist verletzt', () => {
    const { w, b } = setup();
    houseAt(w, 31, 20, 2);
    expect(line(w, b, 2, 'workforce')).toMatchObject({
      ok: false,
      text: 'Keine Handwerker im Umkreis 8 (Siedlerhaus nötig, nächstes 11 Felder)',
    });
  });
  it('ohne Haus auf der Insel', () => {
    const { w, b } = setup();
    expect(line(w, b, 2, 'workforce').text).toBe(
      'Keine Handwerker im Umkreis 8 (kein Siedlerhaus auf dieser Insel)',
    );
  });
  it('Haus nur auf anderer Insel', () => {
    const w = twoIslandWorld();
    drain(home(w));
    const b = putBuilding(w, 0, 'lumberjack', 20, 20);
    houseAt(w, 24, 20, 2, 1);
    expect(line(w, b, 2, 'workforce').text).toBe(
      'Keine Handwerker im Umkreis 8 (Siedlerhaus nur auf anderer Insel)',
    );
  });
  it('Stufe 3 Meister und Bürgerhaus', () => {
    const { w, b } = setup();
    expect(line(w, b, 3, 'workforce').text).toBe(
      'Keine Meister im Umkreis 8 (kein Bürgerhaus auf dieser Insel)',
    );
  });
});

describe('Standortzeilen (N5)', () => {
  const ring = (n: number): [number, number][] =>
    [
      [19, 19],
      [20, 19],
      [21, 19],
      [19, 20],
      [21, 20],
      [19, 21],
      [20, 21],
      [21, 21],
    ].slice(0, n) as [number, number][];
  it('Wald ✗ und ✓ (Holzfäller, nötig 4)', () => {
    const w = emptyWorld();
    const b = shop(w, 'lumberjack', 20, 20);
    setTerrain(w, ring(3), 'forest');
    expect(line(w, b, 2, 'site')).toMatchObject({
      ok: false,
      have: 3,
      need: 4,
      text: 'Zu wenig Wald: 3 freie Waldfelder im Umkreis 2 (nötig 4)',
    });
    setTerrain(w, ring(6), 'forest');
    expect(line(w, b, 2, 'site').text).toBe('Wald: 6 freie Waldfelder im Umkreis 2 (nötig 4)');
  });
  it('Gebirge ✗ und ✓ (Steinbruch, nötig 3)', () => {
    const w = emptyWorld();
    const b = shop(w, 'quarry', 20, 20);
    setTerrain(w, ring(2), 'mountain');
    expect(line(w, b, 2, 'site').text).toBe(
      'Zu wenig Fels: 2 Gebirgsfelder im Umkreis 2 (nötig 3)',
    );
    setTerrain(w, ring(4), 'mountain');
    expect(line(w, b, 2, 'site').text).toBe('Fels: 4 Gebirgsfelder im Umkreis 2 (nötig 3)');
  });
  it('Gras ✗ und ✓ (Schäferei, nötig 8)', () => {
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
    expect(line(w, b, 2, 'site').text).toBe(
      'Zu wenig Weide: 7 freie Grasfelder im Umkreis 3 (nötig 8)',
    );
    setTerrain(w, pos, 'grass');
    expect(line(w, b, 2, 'site').text).toBe('Weide: 9 freie Grasfelder im Umkreis 3 (nötig 8)');
  });
  it('Fischgrund ✓ mit einer, ✗ mit zwei anderen Hütten (Stufe 2, Umkreis 2)', () => {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20);
    shop(w, 'fisher', 21, 20);
    expect(line(w, f, 2, 'site').text).toBe(
      'Fischgrund: 1 andere Fischerhütte im Umkreis 2 (erlaubt 1)',
    );
    shop(w, 'fisher', 22, 20);
    expect(line(w, f, 2, 'site').text).toBe(
      'Fischgrund überfischt: 2 andere Fischerhütten im Umkreis 2 (erlaubt 1)',
    );
  });
  it.each([
    ['distillery', 'Brennofen'],
    ['toolmaker', 'Esse'],
    ['glassworks', 'Schmelzofen'],
  ] as const)('Feuerwache %s: ✗ ohne, ✓ mit Wache, Krisen aus', (defId, ofen) => {
    const w = emptyWorld('normal');
    const b = shop(w, defId, 20, 20, 2);
    expect(line(w, b, 3, 'site')).toMatchObject({
      ok: false,
      text: `Keine Feuerwache in Reichweite 8 (${ofen})`,
    });
    shop(w, 'firestation', 24, 20);
    expect(line(w, b, 3, 'site')).toMatchObject({ ok: true, text: 'Feuerwache in Reichweite 8' });
    w.crisisLevel = 'off';
    expect(line(w, b, 3, 'site').text).toBe('Feuerwache: nicht nötig (Krisen aus)');
  });
  it('Webstube ohne Standortregel hat keine Standortzeile', () => {
    const w = emptyWorld();
    const b = shop(w, 'weaver', 20, 20);
    expect(levelChecks(w, b, 2).map((r) => r.id)).not.toContain('site');
  });
});

describe('Chip und Tooltip', () => {
  function chipWelt() {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20, 3);
    houseAt(w, 26, 20, 2);
    houseAt(w, 31, 20, 3);
    return { w, f };
  }
  it('Fischer g 3 mit Siedlerhaus statt Bürgerhaus: Läuft wie Stufe 2', () => {
    const { w, f } = chipWelt();
    expect(levelChipText(w, f)).toBe(
      'Läuft wie Stufe 2: Keine Meister im Umkreis 8 (Bürgerhaus nötig, nächstes 11 Felder)',
    );
  });
  it('nur niedrigeres Haus: Chip nennt «kein Bürgerhaus auf dieser Insel»', () => {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20, 3);
    houseAt(w, 26, 20, 2);
    expect(levelChipText(w, f)).toBe(
      'Läuft wie Stufe 2: Keine Meister im Umkreis 8 (kein Bürgerhaus auf dieser Insel)',
    );
  });
  it('kein Chip bei k = g, paused oder brennend', () => {
    const { w, f } = chipWelt();
    houseAt(w, 24, 21, 3);
    expect(levelChipText(w, f)).toBeNull();
    const w2 = chipWelt();
    w2.f.paused = true;
    expect(levelChipText(w2.w, w2.f)).toBeNull();
    const w3 = chipWelt();
    w3.f.outageUntil = 50;
    expect(levelChipText(w3.w, w3.f)).toBeNull();
  });
  it('Detail bei g 3, k 1: verletzte Dauerzeilen der Stufen 2 und 3', () => {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20, 3);
    expect(levelChipDetail(w, f)).toEqual([
      'Keine Handwerker im Umkreis 8 (kein Siedlerhaus auf dieser Insel)',
      'Keine Meister im Umkreis 8 (kein Bürgerhaus auf dieser Insel)',
      'Unterhalt 42 statt 54 (gedrosselt)',
    ]);
  });
  it('Detail leer ohne Chip', () => {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20);
    expect(levelChipDetail(w, f)).toEqual([]);
  });
});

describe('AK-AL-24 Vergleich: jede Zeile gleich dem Grund des Ausbaus', () => {
  function okWelt() {
    const w = emptyWorld();
    const f = shop(w, 'fisher', 20, 20, 2);
    shop(w, 'fisher', 21, 20);
    houseAt(w, 26, 20, 3);
    return { w, f };
  }
  const stoerungen: [string, (w: World, f: Building) => void][] = [
    ['knowledge', (w) => (w.unlocked = ['U0', 'U2', 'U3'])],
    ['burning', (_w, f) => (f.outageUntil = 99)],
    [
      'workforce',
      (w) => {
        for (const b of Object.values(w.buildings)) if (b.house !== undefined) b.house.tier = 2;
      },
    ],
    ['site', (w) => void shop(w, 'fisher', 22, 20)],
    ['money', (w) => (w.money = 10)],
    ['wood', (w) => (home(w).stock.wood = 0)],
    ['tools', (w) => (home(w).stock.tools = 0)],
    ['stone', (w) => (home(w).stock.stone = 0)],
    ['extra', (w) => (home(w).stock.cloth = 1)],
  ];
  it.each(stoerungen)('nur Zeile %s ✗: Ausbau scheitert mit genau diesem Text', (id, setze) => {
    const { w, f } = okWelt();
    setze(w, f);
    const bad = levelChecks(w, f, 3).filter((c) => !c.ok);
    expect(bad.map((c) => c.id)).toEqual([id]);
    expect(upgradeBuilding(w, f.id)).toEqual({ ok: false, reason: bad[0]!.text });
  });
  it('alle Zeilen ✓: Ausbau gelingt', () => {
    const { w, f } = okWelt();
    expect(levelChecks(w, f, 3).every((c) => c.ok)).toBe(true);
    expect(upgradeBuilding(w, f.id)).toEqual({ ok: true });
    expect(f.level).toBe(3);
  });
});
