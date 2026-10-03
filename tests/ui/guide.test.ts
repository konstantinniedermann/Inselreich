import { describe, expect, it } from 'vitest';
import { PALETTE } from '../../src/render/palette';
import type { Building, BuildingDefId, World } from '../../src/sim/types';
import { TIERS } from '../../src/sim/defs/tiers';
import { deriveUnlocks } from '../../src/sim/unlocks';
import { idx } from '../../src/sim/world';
import { MAP_SIGNS, nextStep, remedyText, taxEffect } from '../../src/ui/guide';
import { createWorld } from '../../src/sim/world';
import { houseFar } from '../sim/helpers';
import { build, connectAll, setHouse, uxWorld } from './worlds';

type Extra = 'chapel' | 'weaver' | 'sheepfarm';

/**
 * Testwelt aus `ux-anbindung`: Haus (Stufe, Einwohner, Nahrung erfüllt), wahlweise Kapelle, Weberei, Schäferei;
 * alles angebunden (connectAll nach dem letzten build), Geld 1000, Steuer normal, Steuern ≥ Unterhalt.
 */
function world(tier: 1 | 2, inhabitants: number, extras: Extra[]): World {
  const { w, kx, ky, house } = uxWorld();
  const at: Record<Extra, [number, number]> = {
    chapel: [kx + 3, ky + 1],
    weaver: [kx + 8, ky + 2],
    sheepfarm: [kx + 12, ky + 2],
  };
  for (const e of extras) build(w, e, ...at[e]);
  connectAll(w);
  setHouse(house, tier, inhabitants, ['food']);
  w.stock.food = 50;
  w.money = 1000;
  w.taxLevel = 'normal';
  w.stats = { taxes: 10, upkeep: 5 };
  return w;
}

/** Jede Testwelt k: die Regeln davor greifen nicht (AK-UX-08). */
function expectStep(w: World, sentence: string): void {
  const s = nextStep(w);
  expect(s).toBe(sentence);
  expect(s).not.toContain('Tick');
}

describe('nextStep (AK-UX-08)', () => {
  it('AK-UX-08 R0 gewonnen', () => {
    const w = world(2, 4, ['chapel']);
    w.won = true;
    w.wonMerchants = true;
    expectStep(w, 'Handelsstadt erreicht — spiel frei weiter');
  });
  it('AK-UX-08 R1 nur Kontor', () => {
    const { w, house, fisher } = uxWorld();
    delete w.buildings[house.id];
    delete w.buildings[fisher.id];
    expectStep(w, 'Baue ein Wohnhaus (H) nahe dem Kontor');
  });
  it('AK-UX-08 R2 ux-anbindung (ein Wohnhaus vorhanden)', () => {
    expectStep(uxWorld().w, 'Verbinde Fischerhütte per Weg (R) mit dem Kontor');
  });
  it('AK-UX-08 R3a Siedlerhaus nicht voll, Stoff fehlt, Weberei und Schäferei fehlen', () => {
    expectStep(
      world(2, 4, ['chapel']),
      'Deine Siedler brauchen Stoff: baue Weberei (V) und Schäferei (G) für Wolle',
    );
  });
  it('AK-UX-08 R3b Weberei steht, Schäferei fehlt', () => {
    expectStep(world(2, 4, ['chapel', 'weaver']), 'Weberei braucht Wolle: baue Schäferei (G)');
  });
  it('AK-UX-08 R3c Erzeuger und Vorstufe stehen → Regel 3 schaltet weiter bis Regel 7', () => {
    expectStep(
      world(2, 4, ['chapel', 'weaver', 'sheepfarm']),
      'Baue weitere Wohnhäuser und versorge sie',
    );
  });
  it('AK-UX-08 R4 volles Pionierhaus, Stoffkette steht, keine Kapelle', () => {
    expectStep(
      world(1, TIERS[1].maxInhabitants, ['weaver', 'sheepfarm']),
      'Deine Siedler brauchen Kapelle: baue Kapelle (K) in ihrer Nähe',
    );
  });
  it('AK-UX-08 R5 Kasse im Minus', () => {
    const w = world(1, 2, []);
    w.money = -1;
    expect(nextStep(w)).toMatch(/^Deine Kasse schrumpft: /);
  });
  it('AK-UX-08 R6 Steuer hoch', () => {
    const w = world(1, 2, []);
    w.taxLevel = 'high';
    expect(nextStep(w)).toMatch(/^Steuer ‚hoch' verhindert den Aufstieg: /);
  });
  it('AK-UX-08 R7 sonst', () => {
    expectStep(world(1, 2, []), 'Baue weitere Wohnhäuser und versorge sie');
  });
});

describe('taxEffect und remedyText (AK-UX-10)', () => {
  it('AK-UX-10 taxEffect', () => {
    expect(taxEffect('high')).toBe(
      'hoch: 130 % Steuer · kein Aufstieg · Häuser nur zu 75 % belegt',
    );
    expect(taxEffect('low')).toBe(
      'niedrig: 70 % Steuer · Aufstieg nach 15 s Zufriedenheit · Häuser voll belegt',
    );
  });
  it('AK-UX-10 remedyText je Lage', () => {
    const { w, kx, ky, fisher, house } = uxWorld();
    expect(remedyText(w, fisher)).toBe('Baue einen Weg (R) von hier zum Kontor');
    const weaver = build(w, 'weaver', kx + 8, ky + 2);
    weaver.connected = true;
    weaver.state = 'waitingInput';
    expect(remedyText(w, weaver)).toBe('Baue Schäferei (G) oder kaufe Wolle am Kontor');
    w.tiles[idx(w, kx + 4, ky + 2)]!.terrain = 'forest'; // Testgelände: Wald im Radius 2
    const lj = build(w, 'lumberjack', kx + 3, ky + 1); // grenzt an den Weg (kx+3, ky): angebunden
    lj.state = 'storageFull';
    expect(remedyText(w, lj)).toBe('Verkaufe Holz am Kontor oder baue Werkzeugmacher (T)');
    lj.outageUntil = w.tick + 10;
    expect(remedyText(w, lj)).toBe(
      'Läuft nach dem Brand von selbst wieder; eine Feuerwache (E) in der Nähe schützt',
    );
    delete lj.outageUntil;
    lj.state = 'ok';
    expect(remedyText(w, lj)).toBeNull();
    setHouse(house, 1, 2, []);
    expect(remedyText(w, house)).toBe(
      'Nahrung fehlt: baue mehr Fischerhütte oder kaufe Nahrung am Kontor',
    );
  });
});

describe('remedyText, übrige Tabellenzeilen (AK-UX-10)', () => {
  it('AK-UX-10 Wohnhaus supply', () => {
    const { w, kx, house } = uxWorld();
    house.x = kx + 40; // Zustandssetzung: weit ausserhalb jeder Versorgung
    expect(remedyText(w, house)).toBe('Baue einen Marktplatz (M) in der Nähe');
  });
  it('AK-UX-10 Wohnhaus service', () => {
    const { w, house } = uxWorld();
    setHouse(house, 2, 4, ['food', 'cloth']);
    expect(remedyText(w, house)).toBe('Kapelle fehlt: baue Kapelle (K) in Reichweite');
  });
  it('AK-UX-10 Wohnhaus good ohne vorhandenen Erzeuger', () => {
    const { w, house, fisher } = uxWorld();
    delete w.buildings[fisher.id];
    setHouse(house, 1, 2, []);
    expect(remedyText(w, house)).toBe('Nahrung fehlt: baue Fischerhütte (F)');
  });
  it('AK-UX-10 storageFull ohne Abnehmer, Stufe braucht das Gut', () => {
    const { w, fisher } = uxWorld();
    fisher.connected = true;
    fisher.state = 'storageFull';
    expect(remedyText(w, fisher)).toBe('Verkaufe Nahrung am Kontor oder baue weitere Wohnhäuser');
  });
  it('AK-UX-10 storageFull ohne Abnehmer, kein Bedarf: nur Verkauf', () => {
    const { w, fisher } = uxWorld();
    fisher.defId = 'quarry'; // Zustandssetzung: Steinbruch (Stein: kein Abnehmer, keine Stufe braucht ihn)
    fisher.connected = true;
    fisher.state = 'storageFull';
    expect(remedyText(w, fisher)).toBe('Verkaufe Stein am Kontor');
  });
});

describe('MAP_SIGNS (AK-UX-11)', () => {
  it('AK-UX-11 elf Zeilen mit Bedeutung, Signalfarben aus PALETTE', () => {
    expect(MAP_SIGNS).toHaveLength(11);
    for (const s of MAP_SIGNS) expect(s.meaning.length).toBeGreaterThan(0);
    expect(MAP_SIGNS[0]!.color).toBe(PALETTE.signalRed);
    expect(MAP_SIGNS.find((s) => s.renderer.includes('drawWarnRing'))!.color).toBe(
      PALETTE.signalWarn,
    );
    expect(MAP_SIGNS.find((s) => s.renderer === 'Auswahl')!.color).toBe(PALETTE.signalYellow);
  });
});

/**
 * M8-Testwelt aus `ux-anbindung`: drei volle Bürgerhäuser (alle Güter der Stufe 3 erfüllt), Kapelle und Schule
 * angebunden in Reichweite, Geld 1000, Steuer normal, Steuern ≥ Unterhalt. `won` false.
 */
function citizenWorld(): World {
  const { w, kx, ky, house } = uxWorld();
  const more = [build(w, 'house', kx + 4, ky - 2), build(w, 'house', kx + 5, ky - 2)];
  build(w, 'chapel', kx + 3, ky + 1);
  build(w, 'school', kx + 8, ky + 2);
  connectAll(w);
  for (const h of [house, ...more])
    setHouse(h, 3, TIERS[3].maxInhabitants, ['food', 'cloth', 'rum']);
  w.money = 1000;
  w.taxLevel = 'normal';
  w.stats = { taxes: 10, upkeep: 5 };
  return w;
}

describe('M8 nextStep vor dem Sieg (AK-S1-19)', () => {
  it('AK-S1-19 (a) drei volle Bürgerhäuser, alles versorgt, won false → kein Kaufleute-Satz', () => {
    const w = citizenWorld();
    expect(w.won).toBe(false);
    expectStep(w, 'Baue weitere Wohnhäuser und versorge sie');
  });
  it('AK-S1-19 (e) Steuer hoch, nur Bürgerhäuser, won false → nicht der Steuer-Satz', () => {
    const w = citizenWorld();
    w.taxLevel = 'high';
    expectStep(w, 'Baue weitere Wohnhäuser und versorge sie');
  });
});

/** Betrieb direkt eingefügt, angebunden (Zustandssetzung; `nextStep` liest nur, ob der Typ gebaut ist). */
function addDirect(w: World, defId: BuildingDefId): Building {
  const b: Building = {
    id: w.nextBuildingId++,
    defId,
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
  };
  w.buildings[b.id] = b;
  return b;
}

describe('M8 nextStep nach dem Sieg (AK-U2-08)', () => {
  it('AK-U2-08 (b) won, Steinbruch und Holzfäller, keine Glashütte → Glashütte bauen', () => {
    const w = citizenWorld();
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    addDirect(w, 'quarry');
    addDirect(w, 'lumberjack');
    expectStep(w, 'Deine Kaufleute brauchen Glas: baue Glashütte (O)');
  });
  it('AK-U2-08 (c) wie (b) ohne Steinbruch → Glashütte und Steinbruch für Stein', () => {
    const w = citizenWorld();
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    addDirect(w, 'lumberjack');
    expectStep(w, 'Deine Kaufleute brauchen Glas: baue Glashütte (O) und Steinbruch (B) für Stein');
  });
  it('AK-U2-08 (d) won, Glas-Kette steht, kein Badehaus → Badehaus bauen', () => {
    const w = citizenWorld();
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    for (const id of ['glassworks', 'quarry', 'lumberjack'] as const) addDirect(w, id);
    expectStep(w, 'Deine Kaufleute brauchen Badehaus: baue Badehaus (J) in ihrer Nähe');
  });
  it('AK-U2-08 (f) Hebel 40, won false, 45 Bürger, sonst wie (b) → Satz aus (b)', () => {
    const w = citizenWorld();
    addDirect(w, 'quarry');
    addDirect(w, 'lumberjack');
    let s: string;
    try {
      TIERS[4].unlockCitizens = 40;
      w.unlocked = deriveUnlocks(w);
      s = nextStep(w);
    } finally {
      TIERS[4].unlockCitizens = null;
    }
    expect(w.won).toBe(false);
    expect(s).toBe('Deine Kaufleute brauchen Glas: baue Glashütte (O)');
  });
  it('AK-U2-08 (g) wonMerchants → Handelsstadt erreicht', () => {
    const w = citizenWorld();
    w.won = true;
    w.wonMerchants = true;
    expectStep(w, 'Handelsstadt erreicht — spiel frei weiter');
  });
  it('AK-U2-08 (h) won, Glashütte steht, Steinbruch fehlt → Steinbruch bauen', () => {
    const w = citizenWorld();
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    addDirect(w, 'glassworks');
    addDirect(w, 'lumberjack');
    expectStep(w, 'Glashütte braucht Stein: baue Steinbruch (B)');
  });
});

describe('M8 remedyText mit mehreren Inputs (AK-U2-09)', () => {
  it('AK-U2-09 Glashütte wartet: fehlendes Gut zuerst; leer → erstes aus consumes; Abnehmer bei vollem Lager', () => {
    const { w } = uxWorld();
    const gw = addDirect(w, 'glassworks');
    gw.state = 'waitingInput';
    w.stock.stone = 5;
    w.stock.wood = 0;
    expect(remedyText(w, gw)).toBe('Baue Holzfäller (L) oder kaufe Holz am Kontor');
    w.stock.stone = 0;
    expect(remedyText(w, gw)).toBe('Baue Steinbruch (B) oder kaufe Stein am Kontor');
    w.stock.stone = 5;
    w.stock.wood = 5;
    expect(remedyText(w, gw)).toBe('Baue Steinbruch (B) oder kaufe Stein am Kontor');
    const quarry = addDirect(w, 'quarry');
    quarry.state = 'storageFull';
    expect(w.won).toBe(false);
    expect(remedyText(w, quarry)).toBe('Verkaufe Stein am Kontor'); // R151 W9: Glashütte gesperrt, kein Zusatz
    const beforeGoal = w.unlocked;
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    expect(remedyText(w, quarry)).toBe('Verkaufe Stein am Kontor oder baue Glashütte (O)'); // freigeschaltet
    w.won = false;
    w.unlocked = beforeGoal;
    const lj = addDirect(w, 'lumberjack');
    lj.state = 'storageFull';
    expect(remedyText(w, lj)).toBe('Verkaufe Holz am Kontor oder baue Werkzeugmacher (T)');
    const weaver = addDirect(w, 'weaver');
    weaver.state = 'waitingInput';
    w.stock.wool = 0;
    expect(remedyText(w, weaver)).toBe('Baue Schäferei (G) oder kaufe Wolle am Kontor');
  });
});

describe('M8 U2 Kartenzeichen (P3)', () => {
  it('AK-R1-03 MAP_SIGNS: Dienstzeile nennt das Bad-Symbol, Bedeutung mit Badehaus, 11 Zeilen', () => {
    expect(MAP_SIGNS).toHaveLength(11);
    const row = MAP_SIGNS.find((s) => s.renderer.includes('bell'))!;
    expect(row.renderer).toBe('bell, book bzw. bath');
    expect(row.meaning).toBe('Kapelle, Schule bzw. Badehaus fehlt in Reichweite');
    expect(row.sign).not.toBe('Abzeichen mit gelber Glocke bzw. blauem Buch');
    expect(row.sign).toMatch(/Glocke/);
    expect(row.sign).toMatch(/Buch/);
    expect(row.color).toBeNull();
  });
});

describe('M10 nextStep-Filter (Spec 12.3)', () => {
  it('AK-S1-19 gesperrter Marktplatz: „Marktplatz kommt, …"; mit U1 wörtlich wie heute', () => {
    const w = createWorld(3);
    const far = houseFar(w); // Haus ausserhalb der Versorgung, roh gesetzt (tests/sim/helpers.ts)
    expect(far.house).toBeDefined();
    expect(nextStep(w)).toBe('Marktplatz kommt, sobald 20 Wohnhäuser stehen');
    w.unlocked = ['U0', 'U1'];
    expect(nextStep(w)).toBe(
      'Ein Wohnhaus liegt ausserhalb der Versorgung: baue einen Marktplatz (M)',
    );
  });
});
