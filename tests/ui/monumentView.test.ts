import { describe, expect, it } from 'vitest';
import { step } from '../../src/sim/tick';
import { demolish } from '../../src/sim/build';
import { setEdict } from '../../src/sim/edicts';
import { setMonumentPaused, startMonumentStage } from '../../src/sim/monument';
import type { World } from '../../src/sim/types';
import { home } from '../../src/sim/world';
import {
  monumentChip,
  monumentNeedsConfirm,
  monumentChronicleLine,
  monumentEtaText,
  monumentRows,
  monumentSectionModel,
  monumentStartedText,
  monumentStageLine,
  monumentStallReason,
  monumentStartState,
} from '../../src/ui/monumentView';
import { placeTownhall, setHouse, village } from '../sim/helpers';
import { monumentWorld, placeMonument } from '../sim/monumentHelpers';

/** Welt mit Denkmal, Abschnitt 1 (Index 0) läuft. */
function running(): World {
  const w = monumentWorld();
  placeMonument(w);
  expect(startMonumentStage(w).ok).toBe(true);
  // Anbindung gehört der Sim (Wegenetz); hier nur der Zustand, den die Ansicht liest.
  w.buildings[w.monument!.buildingId]!.connected = true;
  return w;
}

describe('AK-M13E2-27 monumentRows', () => {
  it('liefert [] ohne Denkmal und nach Abschnitt 3', () => {
    expect(monumentRows(monumentWorld())).toEqual([]);
    const w = monumentWorld();
    placeMonument(w);
    w.monument!.stage = 3;
    expect(monumentRows(w)).toEqual([]);
  });

  it('laufender Abschnitt: Beschriftung, Prozent, Reihenfolge', () => {
    const w = running();
    w.monument!.stage = 1;
    w.monument!.delivered.glass = 84;
    const rows = monumentRows(w);
    expect(rows.map((r) => r.good)).toEqual(['stone', 'tools', 'glass', 'spice']);
    const glass = rows[2]!;
    expect(glass.label).toBe('Glas 84 / 140');
    expect(glass.pct).toBe(60);
    expect(rows[0]!.label).toBe('Stein 0 / 200');
  });

  it('Reserve und Zukauftext (ohne und mit Handel)', () => {
    const { w, houses } = village(1);
    setHouse(houses[0]!, 4, 80);
    expect(monumentRows(withMonument(w))[2]!.reserveText).toBe('Reserve 64');
    const m = monumentWorld();
    placeMonument(m);
    expect(monumentRows(m)[2]!.buyText).toBe('zukaufen (50 / Stück)');
    m.won = true;
    placeTownhall(m);
    expect(setEdict(m, 'trade').ok).toBe(true);
    expect(monumentRows(m)[2]!.buyText).toBe('zukaufen (40 / Stück)');
  });

  it('buyOn folgt buy[g]', () => {
    const w = running();
    w.monument!.buy.tools = true;
    expect(monumentRows(w).map((r) => r.buyOn)).toEqual([false, true, false, false]);
  });

  it('zwischen Abschnitten: Vorschau des nächsten Abschnitts mit 0', () => {
    const w = monumentWorld();
    placeMonument(w);
    w.monument!.stage = 1;
    const glass = monumentRows(w)[2]!;
    expect(glass.label).toBe('Glas 0 / 140');
    expect(glass.pct).toBe(0);
  });
});

function withMonument(w: World): World {
  // Denkmal-Voraussetzungen auf die Dorfwelt übertragen: nur das Zustandsobjekt wird gebraucht.
  w.wonMerchants = true;
  w.monument = {
    buildingId: -1,
    stage: 0,
    running: true,
    delivered: { stone: 0, tools: 0, glass: 0, spice: 0 },
    paused: false,
    buy: { stone: false, tools: false, glass: false, spice: false },
  };
  return w;
}

describe('AK-M13E2-28 monumentStartState', () => {
  it('Abschnitt 1: Text und freigegeben', () => {
    const w = monumentWorld();
    placeMonument(w);
    expect(monumentStartState(w)).toEqual({
      visible: true,
      disabled: false,
      reason: null,
      buttonText: 'Abschnitt 1 beginnen (4000)',
    });
  });

  it('zu wenig Geld: klickbar, mit Grund', () => {
    const w = monumentWorld();
    placeMonument(w);
    w.money = 100;
    const s = monumentStartState(w);
    expect(s.disabled).toBe(false);
    expect(s.reason).toBe('Zu wenig Geld');
    expect(s.visible).toBe(true);
  });

  it('unsichtbar bei laufendem Abschnitt, Stage 3 und ohne Denkmal', () => {
    expect(monumentStartState(running()).visible).toBe(false);
    const w = monumentWorld();
    placeMonument(w);
    w.monument!.stage = 3;
    expect(monumentStartState(w).visible).toBe(false);
    expect(monumentStartState(monumentWorld()).visible).toBe(false);
  });

  it('Stage 2: Abschnitt 3 beginnen (8000)', () => {
    const w = monumentWorld();
    placeMonument(w);
    w.monument!.stage = 2;
    expect(monumentStartState(w).buttonText).toBe('Abschnitt 3 beginnen (8000)');
  });
});

describe('AK-M13E2-29 monumentEtaText', () => {
  it('frisch gestartet: grösster Rest 200 -> 3:20', () => {
    expect(monumentEtaText(running())).toBe('frühestens fertig in 3:20');
  });

  it('grösster Rest 56 -> 56 s', () => {
    const w = running();
    const m = w.monument!;
    m.delivered = { stone: 144, tools: 80, glass: 60, spice: 40 };
    expect(monumentEtaText(w)).toBe('frühestens fertig in 56 s');
  });

  it('ohne laufenden Abschnitt leer', () => {
    const w = monumentWorld();
    placeMonument(w);
    expect(monumentEtaText(w)).toBe('');
    expect(monumentEtaText(monumentWorld())).toBe('');
  });
});

describe('AK-M13E2-30 monumentStallReason', () => {
  /** Alles zugleich schlecht: pausiert, getrennt, ohne Kontor, Geld 0, Lager auf Reserve, Zukauf an. */
  function worst(): World {
    const w = running();
    const m = w.monument!;
    m.paused = true;
    w.buildings[m.buildingId]!.connected = false;
    (home(w) as { kontorId: number | null }).kontorId = null;
    w.money = 0;
    for (const g of ['stone', 'tools', 'glass', 'spice'] as const) m.buy[g] = true;
    return w;
  }

  it('1 Bau pausiert hat Vorrang', () => {
    expect(monumentStallReason(worst())).toBe('Bau pausiert');
  });

  it('2 Nicht angebunden', () => {
    const w = worst();
    w.monument!.paused = false;
    expect(monumentStallReason(w)).toBe('Nicht angebunden');
  });

  it('3 Kein Kontor', () => {
    const w = worst();
    w.monument!.paused = false;
    w.buildings[w.monument!.buildingId]!.connected = true;
    expect(monumentStallReason(w)).toBe('Kein Kontor');
  });

  it('4 Zu wenig Geld für den Zukauf', () => {
    const w = running();
    w.money = 0;
    for (const g of ['stone', 'tools', 'glass', 'spice'] as const) w.monument!.buy[g] = true;
    expect(monumentStallReason(w)).toBe('Zu wenig Geld für den Zukauf');
  });

  it('5 Lager auf Reserve', () => {
    const w = running();
    expect(monumentStallReason(w)).toBe('Lager auf Reserve');
  });

  it('null bei lieferbarem Gut, mit Zukauf und ohne laufenden Abschnitt', () => {
    const w = running();
    home(w).stock.stone = 21;
    expect(monumentStallReason(w)).toBeNull();
    const k = running();
    k.monument!.buy.glass = true;
    expect(monumentStallReason(k)).toBeNull();
    const n = monumentWorld();
    placeMonument(n);
    expect(monumentStallReason(n)).toBeNull();
  });
});

describe('AK-M13E2-32 Texte', () => {
  it('monumentStageLine', () => {
    const w = monumentWorld();
    expect(monumentStageLine(w)).toBeNull();
    placeMonument(w);
    expect(monumentStageLine(w)).toBe('Bauplatz · nächster: Sockel');
    w.monument!.stage = 1;
    expect(monumentStageLine(w)).toBe('1 / 3 fertig · nächster: Terrassen');
    w.monument!.running = true;
    expect(monumentStageLine(w)).toBe('Abschnitt 2 / 3 · Terrassen');
    w.monument!.running = false;
    w.monument!.stage = 3;
    expect(monumentStageLine(w)).toBe('Denkmal fertig');
  });

  it('monumentChronicleLine', () => {
    const w = monumentWorld();
    w.wonMerchants = false;
    expect(monumentChronicleLine(w)).toBeNull();
    w.wonMerchants = true;
    expect(monumentChronicleLine(w)).toBe('Wahlziel: Denkmal bauen (Öffentlich)');
    placeMonument(w);
    w.monument!.stage = 1;
    expect(monumentChronicleLine(w)).toBe('Denkmal: 1/3 fertig');
    w.monument!.running = true;
    w.monument!.delivered = { stone: 100, tools: 40, glass: 70, spice: 50 };
    expect(monumentChronicleLine(w)).toBe('Denkmal: Abschnitt 2/3 · 50 %');
    w.monument!.delivered = { stone: 200, tools: 80, glass: 84, spice: 50 };
    expect(monumentChronicleLine(w)).toBe('Denkmal: Abschnitt 2/3 · 79 %');
  });

  it('monumentDone hat Vorrang, auch nach Abriss und Neubau', () => {
    const w = monumentWorld();
    w.monumentDone = true;
    expect(monumentChronicleLine(w)).toBe('Wahlziel erreicht: Das Denkmal steht');
    const id = placeMonument(w);
    expect(demolish(w, id).ok).toBe(true);
    placeMonument(w);
    expect(monumentChronicleLine(w)).toBe('Wahlziel erreicht: Das Denkmal steht');
  });
});

describe('monumentChip (Hilfstests U-8)', () => {
  it('null, solange wonSpice false', () => {
    const w = monumentWorld();
    expect(monumentChip(w)).toBeNull();
  });

  it('ohne Denkmal, laufend, zwischen Abschnitten, erreicht', () => {
    const w = monumentWorld();
    w.wonSpice = true;
    expect(monumentChip(w)).toEqual({
      chip: 'Wahlziel: Denkmal bauen',
      title: 'Denkmal in der Bauleiste unter Öffentlich',
      fillPct: 0,
    });
    placeMonument(w);
    w.monument!.stage = 1;
    expect(monumentChip(w)).toMatchObject({ chip: 'Denkmal 1/3', fillPct: 33 });
    w.monument!.running = true;
    w.monument!.delivered = { stone: 200, tools: 80, glass: 84, spice: 50 };
    expect(monumentChip(w)).toEqual({
      chip: 'Denkmal 2/3 · 79 %',
      title: 'Wahlziel Denkmal: Abschnitt 2 / 3 · Terrassen',
      fillPct: 79,
    });
    w.monumentDone = true;
    expect(monumentChip(w)).toEqual({
      chip: 'Wahlziel erreicht',
      title: 'Wahlziel Denkmal erreicht — freies Spiel',
      fillPct: 100,
    });
  });
});

describe('AK-M13E2-34 monumentNeedsConfirm (U-14)', () => {
  it('Stufe 0 ohne Lauf false, laufend true, Stufe 1 nicht laufend true, anderes Gebäude false', () => {
    const w = monumentWorld();
    const id = placeMonument(w);
    expect(monumentNeedsConfirm(w, id)).toBe(false);
    expect(startMonumentStage(w).ok).toBe(true);
    expect(monumentNeedsConfirm(w, id)).toBe(true);
    w.monument!.running = false;
    w.monument!.stage = 1;
    expect(monumentNeedsConfirm(w, id)).toBe(true);
    expect(monumentNeedsConfirm(w, id + 999)).toBe(false);
    w.monument = null;
    expect(monumentNeedsConfirm(w, id)).toBe(false);
  });
});

describe('AK-M13E2-35 monumentSectionModel (U-1 bis U-5)', () => {
  it('Schlüssel und Reihenfolge bleiben über 50 Ticks gleich, nur Werte ändern sich', () => {
    const w = running();
    const keys = monumentSectionModel(w).entries.map((e) => e.key);
    expect(keys).toEqual([
      'stage',
      'reason',
      'eta',
      'row:stone',
      'row:tools',
      'row:glass',
      'row:spice',
      'pause',
      'start',
    ]);
    for (let i = 0; i < 50; i++) {
      step(w);
      expect(monumentSectionModel(w).entries.map((e) => e.key)).toEqual(keys);
    }
  });

  it('Pause-Knopf: Text wechselt, bei Abschnitt 3 verborgen', () => {
    const w = running();
    const pause = (): { text: string; hidden: boolean } => {
      const e = monumentSectionModel(w).entries.find((x) => x.key === 'pause')!;
      if (e.kind !== 'pause') throw new Error('Typ');
      return e;
    };
    expect(pause()).toMatchObject({ text: 'Bau pausieren', hidden: false });
    expect(setMonumentPaused(w, true).ok).toBe(true);
    expect(pause().text).toBe('Bau fortsetzen');
    w.monument!.stage = 3;
    expect(pause().hidden).toBe(true);
  });

  it('Grund- und ETA-Zeile verborgen, wenn leer', () => {
    const w = running();
    const m = monumentSectionModel(w);
    const eta = m.entries.find((e) => e.key === 'eta')!;
    expect(eta).toMatchObject({ hidden: false });
    const idle = monumentSectionModel(monumentWorld());
    expect(idle.entries.find((e) => e.key === 'eta')).toMatchObject({ hidden: true, text: '' });
    expect(idle.entries.find((e) => e.key === 'reason')).toMatchObject({ hidden: true });
  });

  it('Start-Knopf unaffordable bei «Zu wenig Geld», klickbar, mit Titel', () => {
    const w = monumentWorld();
    placeMonument(w);
    w.money = 10;
    const e = monumentSectionModel(w).entries.find((x) => x.key === 'start')!;
    if (e.kind !== 'start') throw new Error('Typ');
    expect(e).toMatchObject({ hidden: false, disabled: false, unaffordable: true });
    expect(e.title).toBe('Zu wenig Geld: 4000 nötig, 10 vorhanden');
    expect(e.text).toBe('Abschnitt 1 beginnen (4000)');
  });

  it('Start-Knopf bei laufendem Abschnitt verborgen', () => {
    const e = monumentSectionModel(running()).entries.find((x) => x.key === 'start')!;
    expect(e).toMatchObject({ hidden: true });
  });

  it('Meldungstext nach Start', () => {
    expect(monumentStartedText(0)).toBe('Abschnitt 1 begonnen: Sockel');
  });
});
