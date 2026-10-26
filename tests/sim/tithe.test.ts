// I-223: Zehnt (T01 Defs, T02 Buchung).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { demolish } from '../../src/sim/build';
import { BOOM_PCT } from '../../src/sim/defs/crises';
import { EDICTS } from '../../src/sim/defs/edicts';
import { GOODS, ORDER_PREMIUM, STORAGE_CAP } from '../../src/sim/defs/goods';
import {
  TAX_CARRY_DIVISOR,
  TAX_UNIT,
  TIERS,
  TITHE_CARRY_DIVISOR,
  TITHE_GOOD,
  TITHE_PCT,
  TITHE_UNITS_PER_100,
} from '../../src/sim/defs/tiers';
import { TITHE_SWITCH_LOCK } from '../../src/sim/defs/timing';
import { ISLANDS, PREFER_PCT } from '../../src/sim/defs/sea';
import { deserialize, serialize } from '../../src/sim/save';
import { setTierTaxLevel, setTithe, titheLocked } from '../../src/sim/tax';
import { sellPrice } from '../../src/sim/trade';
import { SERVICE_IDS, tickTaxes, titheSplit } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import type { Building, GoodId, TitheLoss, World } from '../../src/sim/types';
import { home } from '../../src/sim/world';
import { placeTownhall, setHouse, village } from './helpers';

/** Haus voll erfüllt: versorgt, alle Bedürfnisse und Dienste da. */
function fulfil(b: Building, w: World): void {
  const h = b.house!;
  h.supplied = true;
  for (const g of Object.keys(home(w).stock) as GoodId[]) h.satisfied[g] = true;
  for (const s of SERVICE_IDS) h.services[s] = true;
}

/** `p` Pionierhäuser (je maxInhabitants) und `s` Siedlerhäuser, erfüllt, mit Amtsstube. */
function town(p: number, s: number): { w: World; houses: Building[]; hall: Building } {
  const { w, houses } = village(p + s, { unlockAll: true });
  const hall = placeTownhall(w);
  houses.forEach((b, i) => {
    if (i < p) setHouse(b, 1, TIERS[1].maxInhabitants);
    else setHouse(b, 2, TIERS[2].maxInhabitants);
    fulfil(b, w);
  });
  return { w, houses, hall };
}

const calls = (w: World, n: number): TitheLoss[] => {
  const out: TitheLoss[] = [];
  for (let i = 0; i < n; i++) out.push(tickTaxes(w));
  return out;
};
const sumLost = (l: TitheLoss[], g: 'tools' | 'stone'): number =>
  l.reduce((a, x) => a + (x[g] ?? 0), 0);

describe('AK-ZE-01/25 Pin Geldsteuer ohne Zehnt', () => {
  it('600 Aufrufe: Geld +5616, Lager und Zehnt-Übertrag unverändert', () => {
    const { w } = town(12, 15);
    const money = w.money;
    const stock = { ...home(w).stock };
    const carry = { ...w.titheCarry };
    calls(w, 600);
    expect(w.money).toBe(money + 5616);
    expect(w.taxCarry).toBe(0);
    expect(w.stats.taxes).toBe(936);
    expect(home(w).stock).toEqual(stock);
    expect(w.titheCarry).toEqual(carry);
  });
});

describe('AK-ZE-02 Zehnt Stufe 1', () => {
  it('Werkzeug aus der Steuer, Geld unverändert', () => {
    const { w } = town(12, 0);
    home(w).stock.tools = 20;
    w.titheOn[1] = true;
    const money = w.money;
    calls(w, 100);
    expect(home(w).stock.tools).toBe(22);
    expect(w.titheCarry.tools).toBe(1_760_000);
    expect(w.money).toBe(money);
    calls(w, 500);
    expect(home(w).stock.tools).toBe(37);
    expect(w.titheCarry.tools).toBe(560_000);
  });
});

describe('AK-ZE-03 Zehnt Stufe 2', () => {
  it('Stein, Geld um den Zehntanteil geringer', () => {
    const { w } = town(0, 15);
    home(w).stock.stone = 10;
    w.titheOn[2] = true;
    const money = w.money;
    calls(w, 100);
    expect(w.money).toBe(money + 756);
    expect(w.stats.taxes).toBe(756);
    expect(home(w).stock.stone).toBe(16);
    expect(w.titheCarry.stone).toBe(1_440_000);
    const twin = town(0, 15);
    calls(twin.w, 100);
    expect(twin.w.money).toBe(money + 840);
  });
});

describe('AK-ZE-04 Steuerstufe wirkt auf den Zehnt', () => {
  it.each([
    ['high', 23, 1_488_000],
    ['low', 22, 32_000],
  ] as const)('Stufe 1 %s', (level, tools, carry) => {
    const { w } = town(12, 0);
    home(w).stock.tools = 20;
    w.titheOn[1] = true;
    w.taxLevels[1] = level;
    calls(w, 100);
    expect(home(w).stock.tools).toBe(tools);
    expect(w.titheCarry.tools).toBe(carry);
  });
});

describe('AK-ZE-06 Lagergrenze', () => {
  it.each([
    [STORAGE_CAP - 1, 1],
    [STORAGE_CAP, 2],
  ])('Werkzeug %i: Verfall %i', (start, lost) => {
    const { w } = town(12, 0);
    home(w).stock.tools = start;
    w.titheOn[1] = true;
    const l = calls(w, 100);
    expect(home(w).stock.tools).toBe(STORAGE_CAP);
    expect(sumLost(l, 'tools')).toBe(lost);
    expect(w.titheCarry.tools).toBe(1_760_000);
  });
});

describe('AK-ZE-11 ohne Häuser', () => {
  it('600 Schritte: nichts bewegt sich, kein Wurf', () => {
    const { w } = town(0, 0);
    const twin = town(0, 0).w;
    w.titheOn = { 1: true, 2: true };
    const stock = { ...home(w).stock };
    for (let i = 0; i < 600; i++) {
      step(w);
      step(twin);
    }
    expect(home(w).stock).toEqual(stock);
    expect(w.titheCarry).toEqual({ tools: 0, stone: 0 });
    expect(w.money).toBe(twin.money);
  });
  it('Häuser auf 0 Einwohner: Übertrag bleibt stehen', () => {
    const { w, houses } = town(12, 0);
    w.titheOn[1] = true;
    calls(w, 10);
    const carry = { ...w.titheCarry };
    for (const b of houses) b.house!.inhabitants = 0;
    calls(w, 10);
    expect(w.titheCarry).toEqual(carry);
  });
});

describe('AK-ZE-12 Stufenwechsel eines Hauses', () => {
  it('Anteil wandert vom Zehnt zum Geld', () => {
    const { w, houses } = town(12, 0);
    w.titheOn[1] = true;
    const before = titheSplit(w);
    setHouse(houses[0]!, 2, TIERS[2].maxInhabitants);
    fulfil(houses[0]!, w);
    const after = titheSplit(w);
    expect(after.tithe.tools).toBeLessThan(before.tithe.tools);
    expect(after.money[2]).toBeGreaterThan(before.money[2]);
  });
});

describe('AK-ZE-13 Amtsstube wirkt nicht', () => {
  it('Ausfall: alles Geld, Schalter bleibt; danach wieder Ware', () => {
    const { w, hall } = town(12, 0);
    w.titheOn[1] = true;
    hall.outageUntil = w.tick + 500;
    const twin = town(12, 0).w;
    const money = w.money;
    const stock = home(w).stock.tools;
    calls(w, 100);
    calls(twin, 100);
    expect(w.money).toBe(twin.money);
    expect(w.money).toBeGreaterThan(money);
    expect(home(w).stock.tools).toBe(stock);
    expect(w.titheCarry.tools).toBe(0);
    expect(w.titheOn[1]).toBe(true);
    delete hall.outageUntil;
    calls(w, 100);
    expect(home(w).stock.tools).toBeGreaterThan(stock);
  });
  it.each([
    ['abgerissen', (w: World, h: Building) => expect(demolish(w, h.id).ok).toBe(true)],
    ['getrennt', (_w: World, h: Building) => (h.connected = false)],
  ])('Amtsstube %s', (_n, undo) => {
    const { w, hall } = town(12, 0);
    w.titheOn[1] = true;
    undo(w, hall);
    const twin = town(12, 0);
    undo(twin.w, twin.hall);
    expect(titheSplit(w).tithe.tools).toBe(0);
    const money = w.money;
    calls(w, 1);
    calls(twin.w, 1);
    expect(w.money - money).toBe(twin.w.money - money);
    expect(w.titheCarry.tools).toBe(0);
    expect(w.titheOn[1]).toBe(true);
  });
});

describe('AK-ZE-22 Verfallsbilanz', () => {
  it('(a) jede Fälligkeit über der Grenze wird gemeldet, Bilanz geht auf', () => {
    const { w } = town(12, 0);
    home(w).stock.tools = STORAGE_CAP;
    w.titheOn[1] = true;
    const carry0 = w.titheCarry.tools;
    let lost = 0;
    let units = 0;
    for (let i = 0; i < 100; i++) {
      const before = w.titheCarry.tools;
      const r = step(w);
      // Haus-Zustand ändert sich nach der Buchung im Schritt nicht mehr: Nachher-Stand = Buchungs-Stand.
      const z = titheSplit(w).tithe.tools * TITHE_UNITS_PER_100.tools;
      units += z;
      const due = Math.floor((before + z) / TITHE_CARRY_DIVISOR);
      expect(r.titheLost.tools ?? 0).toBe(due);
      lost += r.titheLost.tools ?? 0;
    }
    expect(home(w).stock.tools).toBe(STORAGE_CAP);
    expect(lost).toBeGreaterThan(0);
    expect(lost * TITHE_CARRY_DIVISOR + w.titheCarry.tools - carry0).toBe(units);
  });
  it('(b) Produktion füllt das Lager im selben Schritt, Zehnt verfällt', () => {
    const { w } = town(12, 0);
    const k = w.buildings[home(w).kontorId]!;
    const mk = (id: number, defId: 'toolmaker' | 'school'): Building =>
      (w.buildings[id] = {
        id,
        defId,
        x: k.x,
        y: k.y,
        connected: true,
        progress: 0,
        state: 'ok',
        island: 0,
      });
    mk(9001, 'school');
    const tm = mk(9002, 'toolmaker');
    tm.progress = 79;
    home(w).stock.tools = STORAGE_CAP - 1;
    w.titheOn[1] = true;
    w.titheCarry.tools = TITHE_CARRY_DIVISOR - 1;
    const r = step(w);
    expect(home(w).stock.tools).toBe(STORAGE_CAP);
    expect(r.titheLost.tools).toBe(1);
  });
});

describe('Review Focus', () => {
  it('2: Edikt mit Steuerpunkten senkt die Basis des Zehnts', () => {
    const { w } = town(12, 0);
    w.titheOn[1] = true;
    w.edict = 'saving';
    const base = 12 * TIERS[1].maxInhabitants * TIERS[1].tax * TAX_UNIT;
    expect(titheSplit(w).tithe.tools).toBe(base * (100 - EDICTS.saving.taxPoints));
  });
  it('3: beide Güter fällig in einem Aufruf', () => {
    const { w } = town(12, 15);
    w.titheOn = { 1: true, 2: true };
    w.titheCarry = { tools: TITHE_CARRY_DIVISOR - 1, stone: TITHE_CARRY_DIVISOR - 1 };
    home(w).stock.tools = 10;
    home(w).stock.stone = 10;
    calls(w, 1);
    expect(home(w).stock.tools).toBeGreaterThan(10);
    expect(home(w).stock.stone).toBeGreaterThan(10);
  });
  it('4: Pionierhaus der Fremdinsel zahlt in die Heimat', () => {
    const { w } = town(0, 0);
    const b = village(1, { unlockAll: true }).houses[0]!;
    const far: Building = { ...b, id: 9100, island: 1 };
    w.buildings[far.id] = far;
    setHouse(far, 1, TIERS[1].maxInhabitants);
    fulfil(far, w);
    w.titheOn[1] = true;
    const foreign = { ...w.islands[1]!.stock };
    const tools = home(w).stock.tools;
    calls(w, 600);
    expect(home(w).stock.tools).toBeGreaterThan(tools);
    expect(w.islands[1]!.stock).toEqual(foreign);
  });
});

const snap = (w: World): string => JSON.stringify(w);

describe('AK-ZE-05 Sperre je Stufe', () => {
  it('Sperrzeit läuft genau TITHE_SWITCH_LOCK Ticks', () => {
    const { w } = town(12, 15);
    const t0 = w.tick;
    expect(setTithe(w, 1, true)).toEqual({ ok: true });
    expect(w.titheLockedUntil[1]).toBe(t0 + TITHE_SWITCH_LOCK);
    expect(titheLocked(w, 1)).toBe(true);
    w.tick = t0 + TITHE_SWITCH_LOCK - 1;
    const before = snap(w);
    expect(setTithe(w, 1, false)).toEqual({ ok: false, reason: 'Sperrzeit' });
    expect(snap(w)).toBe(before);
    w.tick = t0 + TITHE_SWITCH_LOCK;
    expect(setTithe(w, 1, false).ok).toBe(true);
  });
  it('Stufe 2 ist unabhängig frei', () => {
    const { w } = town(12, 15);
    setTithe(w, 1, true);
    w.tick += 1;
    expect(setTithe(w, 2, true).ok).toBe(true);
  });
  it('Zehnt aus lässt den Übertrag unberührt', () => {
    const { w } = town(12, 0);
    setTithe(w, 1, true);
    calls(w, 10);
    const carry = { ...w.titheCarry };
    w.tick += TITHE_SWITCH_LOCK;
    expect(setTithe(w, 1, false).ok).toBe(true);
    expect(w.titheCarry).toEqual(carry);
  });
});

describe('AK-ZE-05 Gründe', () => {
  it.each([
    ['Stufe 3', 3, true, 'Kein Zehnt für Bürger'],
    ['Stufe 4', 4, true, 'Kein Zehnt für Kaufleute'],
    ['Stufe 7', 7, true, 'Ungültige Stufe'],
    ['Stufe x', 'x', true, 'Ungültige Stufe'],
    ['Stufe undefined', undefined, true, 'Ungültige Stufe'],
    ['Stufe 1,5', 1.5, true, 'Ungültige Stufe'],
    ['Stufe NaN', NaN, true, 'Ungültige Stufe'],
    ['Stufe "1"', '1', true, 'Ungültige Stufe'],
    ['Wert "ja"', 1, 'ja', 'Ungültiger Wert'],
    ['Wert 1', 1, 1, 'Ungültiger Wert'],
    ['Wert null', 1, null, 'Ungültiger Wert'],
    ['bereits aus', 1, false, 'Geld bereits aktiv'],
    ['Stufe 3 und Wert ungültig', 3, 'ja', 'Kein Zehnt für Bürger'],
    ['Stufe ungültig und Wert ungültig', 7, 'ja', 'Ungültige Stufe'],
  ])('%s', (_n, tier, on, reason) => {
    const { w } = town(12, 0);
    const before = snap(w);
    expect(() => setTithe(w, tier, on)).not.toThrow();
    expect(setTithe(w, tier, on)).toEqual({ ok: false, reason });
    expect(snap(w)).toBe(before);
  });
  it('bereits an: Zehnt bereits aktiv', () => {
    const { w } = town(12, 0);
    w.titheOn[1] = true;
    expect(setTithe(w, 1, true)).toEqual({ ok: false, reason: 'Zehnt bereits aktiv' });
  });
  it.each([
    ['Stufe 3 ohne Amtsstube', 3, true, 'Kein Zehnt für Bürger'],
    ['Wert ungültig ohne Amtsstube', 1, 'ja', 'Ungültiger Wert'],
  ])('%s', (_n, tier, on, reason) => {
    const w = village(3, { unlockAll: true }).w;
    const before = snap(w);
    expect(setTithe(w, tier, on)).toEqual({ ok: false, reason });
    expect(snap(w)).toBe(before);
  });
  it('ohne Amtsstube schlägt «bereits aus» (Regel 4 vor 5)', () => {
    const w = village(3, { unlockAll: true }).w;
    const before = snap(w);
    expect(setTithe(w, 1, false)).toEqual({ ok: false, reason: 'Braucht eine Amtsstube' });
    expect(snap(w)).toBe(before);
  });
  it('Amtsstube unwirksam schlägt Sperrzeit (Regel 4 vor 6)', () => {
    const { w, hall } = town(12, 0);
    expect(setTithe(w, 1, true).ok).toBe(true);
    hall.connected = false;
    const before = snap(w);
    expect(setTithe(w, 1, false)).toEqual({ ok: false, reason: 'Amtsstube wirkt nicht' });
    expect(snap(w)).toBe(before);
  });
  it('bereits aktiv schlägt Sperrzeit (Regel 5 vor 6)', () => {
    const { w } = town(12, 0);
    setTithe(w, 1, true);
    expect(setTithe(w, 1, true)).toEqual({ ok: false, reason: 'Zehnt bereits aktiv' });
  });
  it('ohne Amtsstube', () => {
    const w = village(3, { unlockAll: true }).w;
    const before = snap(w);
    expect(setTithe(w, 1, true)).toEqual({ ok: false, reason: 'Braucht eine Amtsstube' });
    expect(snap(w)).toBe(before);
  });
  it('kein Geld- und kein Auflagen-Sperrgrund', () => {
    const { w } = town(12, 0);
    w.money = -100;
    w.trial.active = 'selfSupply';
    expect(setTithe(w, 1, true).ok).toBe(true);
  });
});

describe('AK-ZE-26 Amtsstube wirkt nicht', () => {
  it.each([
    ['getrennt', (h: Building) => (h.connected = false)],
    ['Ausfall', (h: Building) => (h.outageUntil = 1_000_000)],
  ])('%s', (_n, hurt) => {
    const { w, hall } = town(12, 0);
    hurt(hall);
    const before = snap(w);
    expect(setTithe(w, 1, true)).toEqual({ ok: false, reason: 'Amtsstube wirkt nicht' });
    expect(snap(w)).toBe(before);
  });
});

describe('Zehnt-Sperre und Steuer-Sperre sind getrennt', () => {
  it('Zehnt gesperrt, Steuer frei', () => {
    const { w } = town(12, 0);
    expect(setTithe(w, 1, true).ok).toBe(true);
    expect(setTierTaxLevel(w, 1, 'high').ok).toBe(true);
    expect(setTithe(w, 1, false)).toEqual({ ok: false, reason: 'Sperrzeit' });
  });
  it('Steuer gesperrt, Zehnt frei', () => {
    const { w } = town(0, 15);
    expect(setTierTaxLevel(w, 2, 'high').ok).toBe(true);
    expect(setTithe(w, 2, true).ok).toBe(true);
  });
});

describe('AK-ZE-07 Determinismus', () => {
  const run = (w: World, from: number, to: number): void => {
    for (let t = from; t < to; t++) {
      if (w.tick === 600) setTithe(w, 1, true);
      if (w.tick === 900) setTithe(w, 2, true);
      step(w);
    }
  };
  it('gleicher Lauf, gleicher Stand, Schalter greifen', () => {
    const a = town(12, 15).w;
    const b = town(12, 15).w;
    const start = { ...home(a).stock };
    run(a, 0, 3000);
    run(b, 0, 3000);
    expect(serialize(a)).toBe(serialize(b));
    expect(a.titheOn).toEqual({ 1: true, 2: true });
    expect(a.titheLockedUntil[1]).toBe(600 + TITHE_SWITCH_LOCK);
    expect(a.titheLockedUntil[2]).toBe(900 + TITHE_SWITCH_LOCK);
    for (const g of ['tools', 'stone'] as const)
      expect(a.titheCarry[g] > 0 || home(a).stock[g] > start[g]).toBe(true);
  });
  it('Speichern und Laden mitten im Lauf ändert nichts', () => {
    const full = town(12, 15).w;
    const part = town(12, 15).w;
    full.titheOn[1] = true;
    part.titheOn[1] = true;
    for (let i = 0; i < 3000; i++) step(full);
    for (let i = 0; i < 300; i++) step(part);
    const r = deserialize(serialize(part));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (let i = 0; i < 2700; i++) step(r.world);
    expect(serialize(r.world)).toBe(serialize(full));
  });
  it('Sperre überlebt Speichern und Laden', () => {
    const { w } = town(12, 0);
    setTithe(w, 1, true);
    for (let i = 0; i < 300; i++) step(w);
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(setTithe(r.world, 1, false)).toEqual({ ok: false, reason: 'Sperrzeit' });
  });
});

describe('AK-ZE-14 Literal', () => {
  it.each(['src/sim/tax.ts', 'src/sim/population.ts'])('%s ohne Sperrzeit-Literal', (f) => {
    const code = readFileSync(new URL(`../../${f}`, import.meta.url).pathname, 'utf8').replace(
      /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
      '',
    );
    expect(/\b1800\b/.test(code)).toBe(false);
  });
});

describe('AK-ZE-15 Kursband', () => {
  it.each(Object.keys(TITHE_UNITS_PER_100) as (keyof typeof TITHE_UNITS_PER_100)[])('%s', (g) => {
    const k = 100 / TITHE_UNITS_PER_100[g];
    const top = Math.max(
      (GOODS[g].sell * Math.max(BOOM_PCT, PREFER_PCT)) / 100,
      Math.floor(GOODS[g].buy * ORDER_PREMIUM),
    );
    expect(top).toBeLessThan(k);
    expect(k).toBeLessThan(GOODS[g].buy);
    expect(k).toBeGreaterThan((GOODS[g].buy * EDICTS.trade.buyFactorPct) / 100);
  });
});

describe('AK-ZE-24 Boom und Vorliebe stapeln nicht', () => {
  it('Tuch: der höhere Faktor gilt', () => {
    const { w } = town(1, 0);
    const kind = ISLANDS.find((d) => d.prefers.includes('cloth'))!.kind;
    const i = w.islands.findIndex((x) => x.kind === kind);
    const isl = i > 0 ? i : 1;
    w.islands[isl]!.kind = kind;
    w.crisis = { period: 0, kind: 'boom', from: w.tick, until: w.tick + 1000, good: 'cloth' };
    w.sellPct.cloth = 100;
    expect(sellPrice(w, 'cloth', 1, isl)).toBe(
      Math.floor((GOODS.cloth.sell * Math.max(BOOM_PCT, PREFER_PCT)) / 100),
    );
  });
  it('Stein im Boom liegt unter dem Zehnt-Kurs', () => {
    const { w } = town(1, 0);
    w.crisis = { period: 0, kind: 'boom', from: w.tick, until: w.tick + 1000, good: 'stone' };
    w.sellPct.stone = 100;
    const p = sellPrice(w, 'stone', 1);
    expect(p).toBe(9);
    expect(p).toBeLessThan(100 / TITHE_UNITS_PER_100.stone);
  });
});

describe('AK-ZE-14 Defs', () => {
  it('Güter, Prozente, Einheiten', () => {
    expect(TITHE_GOOD).toEqual({ 1: 'tools', 2: 'stone' });
    expect(TITHE_PCT).toEqual({ 1: 100, 2: 10 });
    expect(TITHE_UNITS_PER_100).toEqual({ tools: 3, stone: 8 });
  });
  it('Übertragsteiler und Sperre', () => {
    expect(TITHE_CARRY_DIVISOR).toBe(TAX_CARRY_DIVISOR * 100);
    expect(TITHE_CARRY_DIVISOR).toBe(2_000_000);
    expect(TITHE_SWITCH_LOCK).toBe(1800);
  });
});
