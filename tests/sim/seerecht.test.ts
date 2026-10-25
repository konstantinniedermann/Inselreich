import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COUNCIL } from '../../src/sim/defs/council';
import { ROUTE_RESERVE, SHIP, SHIP_TICKS_PER_SEA_TILE } from '../../src/sim/defs/sea';
import { TIERS } from '../../src/sim/defs/tiers';
import { decree } from '../../src/sim/council';
import { buyShip, setRoute } from '../../src/sim/ships';
import { step } from '../../src/sim/tick';
import { laneWorld } from './seaHelpers';

interface Run {
  firstIsland: number;
  firstHome: number;
  homeGaps: number[];
  delivered: number;
}

/** Gewürzroute Insel -> Heimat auf Seeweg 35; Insellager wird vor jedem Tick aufgefüllt. */
function spiceRun(seerecht: boolean, ticks: number): Run {
  const { w, island } = laneWorld(35);
  const home = w.islands[0]!.stock;
  const isle = w.islands[island]!.stock;
  home.wood = 500;
  home.tools = 500;
  w.council[4] = 'open';
  if (seerecht) decree(w, 4, 'C');
  expect(buyShip(w).ok).toBe(true);
  const ship = w.ships[0]!;
  const route = {
    a: 0,
    b: island,
    ab: [],
    ba: [{ good: 'spice' as const, reserve: ROUTE_RESERVE.default }],
  };
  expect(setRoute(w, ship.id, route).ok).toBe(true);
  const run: Run = { firstIsland: 0, firstHome: 0, homeGaps: [], delivered: 0 };
  let departAt = 0;
  let lastHome = 0;
  for (let t = 1; t <= ticks; t++) {
    isle.spice = ROUTE_RESERVE.default + SHIP.capacity;
    home.spice = 0;
    const port = ship.port;
    step(w);
    if (departAt === 0 && ship.to !== null) departAt = t;
    if (ship.port === port) continue;
    const at = t - departAt;
    if (ship.port === island) run.firstIsland ||= at;
    else {
      if (run.firstHome === 0) run.firstHome = at;
      else run.homeGaps.push(at - lastHome);
      lastHome = at;
      run.delivered += home.spice;
    }
  }
  return run;
}

describe('I-153 Seerecht Szenario', () => {
  it('AK-SR-7 Gewinnlage: Umlauf 700 ohne, 560 mit Seerecht; 400 gegen 500 Gewürz', () => {
    const plain = spiceRun(false, 5650);
    expect([plain.firstIsland, plain.firstHome]).toEqual([350, 700]);
    expect(new Set(plain.homeGaps)).toEqual(new Set([700]));
    expect(plain.delivered).toBe(8 * SHIP.capacity);
    const sea = spiceRun(true, 5650);
    expect([sea.firstIsland, sea.firstHome]).toEqual([280, 560]);
    expect(new Set(sea.homeGaps)).toEqual(new Set([560]));
    expect(sea.delivered).toBe(10 * SHIP.capacity);
  });
});

describe('I-153 Seerecht Wertewächter', () => {
  it('AK-SR-8 Def-Werte tragen die Gewinnlage. Fällt dieser Test, Seerecht-Wert neu prüfen (R805).', () => {
    const cap = SHIP.capacity;
    const need = TIERS[4].needs.spice! * 80;
    const c = COUNCIL[4].C!.lever.value;
    const t = SHIP_TICKS_PER_SEA_TILE;
    expect((cap * 100) / (2 * c * 35)).toBeGreaterThanOrEqual(need);
    expect((cap * 100) / (2 * t * 35)).toBeLessThan(need);
    expect((cap * 100) / (2 * t * 30)).toBeGreaterThanOrEqual(need);
  });
});

const KEYWORD = /(?<![a-z])(?:lane|travel|ticks?)|Lane|Travel|Ticks/;
const FACTOR = /(?<![\w.])(?:8|10)(?![\w.])\s*[*/]|[*/]\s*(?:8|10)(?![\w.])/;
const READER = /\b(travelTicks|laneTicks)\(/;
const READER_FILES = ['src/sim/islands.ts', 'src/sim/council.ts', 'src/sim/save.ts'];

/** Ausnahmen vom Faktor-Muster; jeder Eintrag braucht eine Begründung. */
const ALLOW: { file: string; line: string; why: string }[] = [
  {
    file: 'src/ui/time.ts',
    line: '(perTicks * TICK_MS)) * 10) / 10',
    why: 'Rundung auf eine Nachkommastelle (* 10) / 10, kein Fahrzeit-Bezug; Schlüsselwort nur über perTicks',
  },
];

function factorHit(line: string): boolean {
  return KEYWORD.test(line) && FACTOR.test(line);
}

function tsFiles(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = `${dir}/${name}`;
      if (statSync(path).isDirectory()) return path === 'src/sim/defs' ? [] : tsFiles(path);
      return name.endsWith('.ts') ? [path] : [];
    });
}

function scan(test: (file: string, line: string) => boolean): string[] {
  const hits: string[] = [];
  for (const file of ['src/sim', 'src/render', 'src/ui'].flatMap(tsFiles)) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (test(file, line)) hits.push(`${file}:${i + 1}: ${line.trim()}`);
      });
  }
  return hits;
}

function linesMatching(file: string, re: RegExp): number {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => re.test(l)).length;
}

describe('I-153 Seerecht Fahrzeit-Wächter', () => {
  it('factorHit trifft Fahrzeit-Faktoren, nicht Dezimalzahlen', () => {
    expect(factorHit('ship.left = 10 * lane.d')).toBe(true);
    expect(factorHit('travel * 8')).toBe(true);
    expect(factorHit('const t = cycleTicks / 10')).toBe(true);
    expect(factorHit('R(0.2, 0.4, 0.35 * 0.5 * h, 0.8 * 0.5 * h), plane: 0.56')).toBe(false);
    expect(factorHit('ticks * 100')).toBe(false);
    expect(factorHit('lane.d * 1000')).toBe(false);
  });

  it('AK-SR-21 Fahrzeit nur über den Helfer, 8 und 10 nur in den Defs', () => {
    const factor = scan(
      (file, line) =>
        factorHit(line) && !ALLOW.some((a) => a.file === file && line.includes(a.line)),
    );
    expect(factor, `Fahrzeit-Faktor ausserhalb der Defs:\n${factor.join('\n')}`).toEqual([]);
    const readers = scan((file, line) => READER.test(line) && !READER_FILES.includes(file));
    expect(readers, `Fahrzeit-Leser ausserhalb des Helfers:\n${readers.join('\n')}`).toEqual([]);
    expect([
      linesMatching('src/sim/defs/council.ts', /kind: 'seaTileTicks', value: 8\b/),
      linesMatching('src/sim/defs/sea.ts', /SHIP_TICKS_PER_SEA_TILE\s*=\s*10\b/),
    ]).toEqual([1, 1]);
  });
});
