import { describe, expect, it } from 'vitest';
import { canPlace, canPlaceRoad } from '../../src/sim/placement';
import { checkAfford } from '../../src/sim/economy';
import { demolish, placeRoad, removeRoad } from '../../src/sim/build';
import { upgradeBuilding } from '../../src/sim/upgrade';
import { setTaxLevel } from '../../src/sim/tax';
import { buy, sell } from '../../src/sim/trade';
import { deliverOrder } from '../../src/sim/orders';
import { upgradeStatus } from '../../src/sim/population';
import { SAVE_VERSION, deserialize } from '../../src/sim/save';
import {
  BUILDING_DEFS,
  BUILDING_IDS,
  ROAD_COST,
  ROAD_COST_OBJ,
} from '../../src/sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../../src/sim/defs/goods';
import { TAX_LEVELS, TIERS } from '../../src/sim/defs/tiers';
import { TAX_SWITCH_LOCK, UPGRADE_WAIT } from '../../src/sim/defs/timing';
import { createRng } from '../../src/sim/rng';
import type { Building, BuildingDefId, GoodId, TaxLevel, World } from '../../src/sim/types';
import { home, createWorld, idx } from '../../src/sim/world';
import type { Tool } from '../../src/render/renderer';
import {
  REASON_TABLE,
  friendlyReason,
  glassStoneHint,
  hintPosition,
  newlyConnected,
  placementHint,
  unconnectedIds,
  type ReasonCtx,
} from '../../src/ui/hints';
import { formatGameTime } from '../../src/ui/time';
import { SCENARIOS } from '../sim/scenarios';
import { tooltipLines } from '../../src/ui/buildMenu';
import { build, setHouse, uxWorld } from './worlds';
import {
  houseFar,
  placeTownhall,
  setAllTax,
  setHouse as setSimHouse,
  village,
} from '../sim/helpers';
import { houseDiagnosis } from '../../src/sim/queries';
import { perfBudget } from '../helpers/perfBudget';

declare const process: { env: Record<string, string | undefined> };

describe('friendlyReason (AK-UX-03)', () => {
  it('AK-UX-03 Pflichtfälle aus der Spec', () => {
    const { w } = uxWorld();
    home(w).stock.wood = 1;
    expect(friendlyReason(w, 'Zu wenig Holz', { defId: 'house' })).toBe(
      'Zu wenig Holz: 3 nötig, 1 vorhanden · kaufbar am Kontor',
    );
    expect(
      friendlyReason(w, 'Zu wenig Geld', { defId: 'house', cost: TIERS[1].upgradeCost! }),
    ).toBe(`Zu wenig Geld: ${TIERS[1].upgradeCost!.money} nötig, ${w.money} vorhanden`);
    expect(friendlyReason(w, 'Zu wenig Geld')).toBe('Zu wenig Geld');
    expect(friendlyReason(w, 'Zu wenig Geld', { cost: ROAD_COST_OBJ })).toBe(
      `Zu wenig Geld: ${ROAD_COST} nötig, ${w.money} vorhanden`,
    );
    home(w).stock.wood = 5;
    expect(friendlyReason(w, 'Nicht genug Ware', { good: 'wood', amount: 20 })).toBe(
      'Nicht genug Holz: 20 nötig, 5 vorhanden',
    );
    expect(friendlyReason(w, 'Nicht genug Ware')).toBe('Nicht genug Ware');
    expect(friendlyReason(w, `Bedürfnisse noch nicht ${UPGRADE_WAIT} Ticks erfüllt`)).toBe(
      `Bedürfnisse noch nicht ${formatGameTime(UPGRADE_WAIT)} erfüllt`,
    );
    expect(friendlyReason(w, 'Völlig unbekannt')).toBe('Völlig unbekannt');
  });

  it('AK-UX-03 jede Tabellenzeile: Anzeigetext bzw. unverändert', () => {
    const { w } = uxWorld();
    w.taxLockedUntil[1] = w.tick + TAX_SWITCH_LOCK;
    const d = BUILDING_DEFS;
    const site = (id: BuildingDefId) =>
      d[id].site.find((r) => r.kind === 'radius')! as { min: number; radius: number };
    const SAME = Symbol('unverändert');
    const rows: [string, ReasonCtx, string | typeof SAME][] = [
      ['Ausserhalb der Karte', {}, 'Reicht über den Kartenrand hinaus'],
      ['Kein Bauland', {}, 'Kein Bauland — nur auf Land bauen'],
      ['Bereits bebaut', {}, 'Hier steht schon ein Gebäude oder Weg'],
      [
        'Braucht Wasser angrenzend',
        { defId: 'fisher' },
        `${d.fisher.name} muss direkt am Wasser stehen`,
      ],
      [
        'Braucht Gebirge angrenzend',
        { defId: 'quarry' },
        `${d.quarry.name} muss direkt am Gebirge stehen`,
      ],
      ['Braucht Wasser angrenzend', {}, SAME],
      [
        'Zu wenig Wald in der Nähe',
        { defId: 'lumberjack' },
        `Zu wenig Wald in der Nähe: mindestens ${site('lumberjack').min} ${site('lumberjack').min === 1 ? 'Feld' : 'Felder'} im Umkreis ${site('lumberjack').radius}`,
      ],
      [
        'Zu wenig Weide in der Nähe',
        { defId: 'sheepfarm' },
        `Zu wenig Weide in der Nähe: mindestens ${site('sheepfarm').min} ${site('sheepfarm').min === 1 ? 'Feld' : 'Felder'} im Umkreis ${site('sheepfarm').radius}`,
      ],
      ['Zu wenig Weide in der Nähe', {}, SAME],
      [
        'Ausserhalb der Versorgung',
        {},
        'Zu weit vom Kontor oder Marktplatz — Wohnhäuser brauchen Versorgung im Umkreis',
      ],
      ['Kein Weg', {}, 'Hier liegt kein Weg'],
      ['Gebäude nicht gefunden', {}, SAME],
      ['Kontor kann nicht abgerissen werden', {}, SAME],
      ['Kein Geld', {}, 'Kein Geld — die Kasse ist im Minus; verkaufe Waren am Kontor'],
      [
        'Zu wenig Geld',
        { defId: 'house' },
        `Zu wenig Geld: ${d.house.cost.money} nötig, ${w.money} vorhanden`,
      ],
      [
        'Zu wenig Werkzeug',
        { defId: 'chapel' },
        `Zu wenig Werkzeug: ${d.chapel.cost.tools} nötig, ${home(w).stock.tools} vorhanden · kaufbar am Kontor`,
      ],
      [
        'Zu wenig Stein',
        { defId: 'chapel' },
        `Zu wenig Stein: ${d.chapel.cost.stone} nötig, ${home(w).stock.stone} vorhanden · kaufbar am Kontor`,
      ],
      ['Zu wenig Stein', {}, SAME],
      ['Ungültige Stufe', {}, SAME],
      ['Stufe bereits aktiv', {}, 'Diese Steuerstufe gilt bereits'],
      [
        'Sperrzeit',
        { tier: 1 },
        `Steuer für ${TIERS[1].name} erst in ${formatGameTime(TAX_SWITCH_LOCK)} wieder änderbar`,
      ],
      ['Kein Auftrag', {}, 'Gerade gibt es keinen Auftrag'],
      ['Ungültige Menge', {}, SAME],
      ['Lager voll', { good: 'wood' }, `Lager voll: höchstens ${STORAGE_CAP} ${GOODS.wood.name}`],
      ['Lager voll', {}, SAME],
      ['Kein Wohnhaus', {}, SAME],
      ['Höchste Stufe erreicht', {}, SAME],
      ['Haus nicht voll belegt', {}, SAME],
      ['Steuer zu hoch', {}, `Steuer ‚${TAX_LEVELS.high.name}' verhindert den Aufstieg`],
      [`${d.chapel.name} fehlt in Reichweite`, {}, SAME],
      [`Kein ${GOODS.cloth.name} im Lager`, {}, SAME],
      ['Ungültiges Format', {}, SAME],
      ['Unbekannte Version', {}, SAME],
      ['Beschädigter Spielstand', {}, SAME],
      ['Es gibt schon eine Amtsstube', {}, 'Es gibt schon eine Amtsstube — höchstens eine wirkt'],
      ['Braucht eine Amtsstube', {}, 'Baue zuerst eine Amtsstube (I)'],
    ];
    for (const [input, ctx, want] of rows) {
      expect(friendlyReason(w, input, ctx), input).toBe(want === SAME ? input : want);
    }
  });

  it('AK-UX-03 Vollständigkeit: provozierte Sim-Gründe deckt REASON_TABLE ab', () => {
    const covered = (r: string): boolean => REASON_TABLE.some((row) => row.pattern.test(r));
    const reasons: string[] = [];
    const push = (r: { ok: boolean; reason?: string } | { ok: false; reason: string }): void => {
      if (!r.ok && 'reason' in r && r.reason) reasons.push(r.reason);
    };
    const { w, kx, ky, fisher, house } = uxWorld();
    push(canPlace(w, 'house', -5, -5)); // Ausserhalb der Karte
    push(canPlace(w, 'lumberjack', kx + 7, ky)); // Kein Bauland (Wasser)
    push(canPlace(w, 'house', fisher.x, fisher.y)); // Bereits bebaut
    push(canPlace(w, 'fisher', kx + 10, ky - 6)); // Braucht Wasser angrenzend
    push(canPlace(w, 'quarry', kx + 10, ky - 6)); // Braucht Gebirge angrenzend
    push(canPlace(w, 'lumberjack', kx + 10, ky - 6)); // Zu wenig Wald in der Nähe
    // Zu wenig Weide: Waldblock 7 × 7 (Testgelände), Schäferei in der Mitte
    for (let y = ky + 3; y <= ky + 9; y++)
      for (let x = kx + 12; x <= kx + 18; x++)
        home(w).tiles[idx(home(w), x, y)]!.terrain = 'forest';
    push(canPlace(w, 'sheepfarm', kx + 14, ky + 5));
    push(canPlaceRoad(w, -1, -1));
    push(canPlace(w, 'house', kx + 12, ky - 8)); // Ausserhalb der Versorgung (wie Szenario `bedarf`)
    w.money = -1;
    push(checkAfford(w, home(w), { money: 1, wood: 0, tools: 0, stone: 0 }));
    w.money = 0;
    push(checkAfford(w, home(w), { money: 1, wood: 0, tools: 0, stone: 0 }));
    w.money = 1000;
    for (const g of ['wood', 'tools', 'stone'] as const) {
      const s = { ...home(w).stock };
      home(w).stock[g] = 0;
      push(
        checkAfford(w, home(w), {
          money: 0,
          wood: g === 'wood' ? 1 : 0,
          tools: g === 'tools' ? 1 : 0,
          stone: g === 'stone' ? 1 : 0,
        }),
      );
      home(w).stock = s;
    }
    push(removeRoad(w, kx + 10, ky + 5));
    push(demolish(w, 99999));
    push(demolish(w, home(w).kontorId));
    push(setTaxLevel(w, 'x' as TaxLevel));
    push(setTaxLevel(w, w.taxLevels[1]));
    push(setTaxLevel(w, 'high'));
    push(setTaxLevel(w, 'low')); // Sperrzeit
    reasons.push('Es gibt schon eine Amtsstube', 'Braucht eine Amtsstube');
    push(buy(w, 'wood', 0));
    home(w).stock.wood = 100;
    push(buy(w, 'wood', 1)); // Lager voll
    home(w).stock.wood = 0;
    w.money = 0;
    push(buy(w, 'rum', 1)); // Zu wenig Geld
    w.money = -1;
    push(buy(w, 'rum', 1)); // Kein Geld
    push(sell(w, 'wood', 0));
    push(sell(w, 'rum', 5)); // Nicht genug Ware
    push(deliverOrder(w)); // Kein Auftrag
    w.order = { period: 0, good: 'rum', amount: 5, reward: 10, due: w.tick + 10 };
    push(deliverOrder(w)); // Nicht genug Ware
    reasons.push(...upgradeStatus(w, fisher).reasons); // Kein Wohnhaus
    reasons.push(...upgradeStatus(w, house).reasons); // Haus nicht voll, Steuer zu hoch, Kein Geld …
    setAllTax(w, 'normal'); // direkt gesetzt: Sperrzeit läuft noch
    for (const tier of [1, 2, 3, 4] as const) {
      setHouse(house, tier, TIERS[tier].maxInhabitants, []);
      reasons.push(...upgradeStatus(w, house).reasons); // Bedürfnisse noch nicht …, Kapelle fehlt …, Kein … im Lager, Höchste Stufe
    }
    for (const json of [
      '{',
      '[]',
      JSON.stringify({ version: 999 }),
      JSON.stringify({ version: SAVE_VERSION }),
    ]) {
      const r = deserialize(json);
      if (!r.ok) reasons.push(r.reason);
    }
    expect(reasons.length).toBeGreaterThan(20);
    for (const r of reasons) expect(covered(r), r).toBe(true);
    for (const r of reasons)
      expect(friendlyReason(w, r, { defId: 'house' }), r).not.toMatch(
        /(Geld|Holz|Werkzeug|Stein) \d/,
      );
  });
});

describe('placementHint (AK-UX-04)', () => {
  it('AK-UX-04 Bauen, Weg, Abriss, Auswahl', () => {
    const { w, kx, ky, fisher } = uxWorld();
    expect(placementHint(w, { kind: 'build', defId: 'lumberjack' }, kx + 7, ky)).toEqual({
      tone: 'bad',
      text: 'Kein Bauland — nur auf Land bauen',
    });
    expect(placementHint(w, { kind: 'select' }, fisher.x, fisher.y)).toEqual({
      tone: 'info',
      text: 'Fischerhütte · Nicht an Kontor angebunden',
    });
    expect(placementHint(w, { kind: 'demolish' }, fisher.x, fisher.y)?.text).toBe(
      'Abreissen: Fischerhütte · zurück 50 Geld · 2 Holz · 1 Werkzeug',
    );
    expect(
      placementHint(
        w,
        { kind: 'demolish' },
        w.buildings[home(w).kontorId]!.x,
        w.buildings[home(w).kontorId]!.y,
      )?.tone,
    ).toBe('info');
    expect(placementHint(w, { kind: 'demolish' }, kx + 12, ky + 6)).toBeNull();
    expect(placementHint(w, { kind: 'select' }, kx + 12, ky + 6)).toBeNull();
    expect(placementHint(w, { kind: 'road' }, kx + 5, ky)?.text).toBe(
      'Weg · 5 Geld · verbunden mit dem Kontor',
    );
    expect(placementHint(w, { kind: 'road' }, kx + 12, ky + 6)?.text).toBe(
      'Weg · 5 Geld · noch nicht mit dem Kontor verbunden',
    );
    w.money = 0;
    expect(placementHint(w, { kind: 'build', defId: 'house' }, kx + 3, ky + 1)?.text).toBe(
      'Zu wenig Geld: 50 nötig, 0 vorhanden',
    );
  });
  it('AK-UX-04 Fischerhütte mit bzw. ohne erreichbaren Nachbarweg', () => {
    const { w, kx, ky, fisher } = uxWorld();
    demolish(w, fisher.id);
    expect(placementHint(w, { kind: 'build', defId: 'fisher' }, kx + 6, ky)?.text).toBe(
      'Baubar · danach mit Weg (R) zum Kontor verbinden',
    );
    w.money = 1000;
    placeRoad(w, kx + 5, ky);
    expect(placementHint(w, { kind: 'build', defId: 'fisher' }, kx + 6, ky)?.text).toBe(
      'Baubar · wird an den Kontor angebunden',
    );
  });
  it('AK-UX-04 Weberei bei vollem Holzlager nennt den Verfall', () => {
    const { w, kx, ky } = uxWorld();
    const weaver = build(w, 'weaver', kx + 10, ky + 2);
    home(w).stock.wood = 100;
    expect(placementHint(w, { kind: 'demolish' }, weaver.x, weaver.y)?.text).toContain(
      'verfallen – Lager voll)',
    );
  });
  it('RF-4 Rand: halb ausserhalb → Kartenrand; Schild bleibt im Fenster', () => {
    const { w } = uxWorld();
    expect(
      placementHint(w, { kind: 'build', defId: 'weaver' }, home(w).width - 1, home(w).height - 1)
        ?.text,
    ).toBe('Reicht über den Kartenrand hinaus');
    expect(hintPosition(1270, 790, 200, 30, 1280, 800)).toEqual({ left: 1076, top: 766 });
    expect(hintPosition(0, 0, 200, 30, 1280, 800)).toEqual({ left: 16, top: 16 });
    expect(hintPosition(-50, -50, 200, 30, 1280, 800)).toEqual({ left: 4, top: 4 });
  });
});

describe('Anbindung (AK-UX-05, RF-5)', () => {
  it('AK-UX-05 Weg in die Lücke bindet die Fischerhütte an; Weg ohne Wirkung → []', () => {
    const { w, kx, ky } = uxWorld();
    const before = unconnectedIds(w);
    placeRoad(w, kx + 12, ky + 6);
    expect(newlyConnected(before, w)).toEqual([]);
    placeRoad(w, kx + 5, ky);
    expect(newlyConnected(before, w)).toEqual(['Fischerhütte']);
  });
  it('AK-UX-05 neu gebaut und sofort angebunden zählt nicht', () => {
    const { w, kx, ky } = uxWorld();
    const before = unconnectedIds(w);
    build(w, 'firestation', kx + 3, ky + 1); // grenzt an den Weg (kx+3, ky)
    expect(newlyConnected(before, w)).toEqual([]);
  });
  it('RF-5 ein Weg bindet zwei Betriebe an: beide, nach id', () => {
    const { w, kx, ky } = uxWorld();
    const second = build(w, 'firestation', kx + 5, ky + 1); // an der Lücke, unangebunden
    expect(second.connected).toBe(false);
    const before = unconnectedIds(w);
    placeRoad(w, kx + 5, ky);
    expect(newlyConnected(before, w)).toEqual(['Fischerhütte', 'Feuerwache']);
  });
});

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
}

it('AK-UX-31 placementHint in leistung-50, ungünstigster Fall: Median je Aufruf ≤ 0,5 ms (5 Läufe nach Aufwärmen)', () => {
  const w = SCENARIOS['leistung-50']!();
  // Ungünstigster Fall (R125 a): Land, Platzierung ok, Kosten gedeckt → placementHint läuft bis zum BFS
  // über reachableRoads (Bau- und Weg-Werkzeug), ohne Cache.
  w.money = 1_000_000;
  for (const g of Object.keys(home(w).stock) as GoodId[]) home(w).stock[g] = 100;
  const tools: Tool[] = [
    { kind: 'road' },
    ...BUILDING_IDS.filter((id) => id !== 'kontor' && id !== 'house').map((defId) => ({
      kind: 'build' as const,
      defId,
    })),
  ];
  const ok = (tool: Tool, x: number, y: number): boolean =>
    tool.kind === 'road'
      ? canPlaceRoad(w, x, y).ok
      : tool.kind === 'build' && canPlace(w, tool.defId, x, y).ok;
  const rng = createRng(31);
  const pairs: { tool: Tool; x: number; y: number }[] = [];
  for (let guard = 0; pairs.length < 500 && guard < 200_000; guard++) {
    const x = Math.floor(rng() * home(w).width);
    const y = Math.floor(rng() * home(w).height);
    const tool = tools[Math.floor(rng() * tools.length)]!;
    if (ok(tool, x, y)) pairs.push({ tool, x, y });
  }
  expect(pairs.length).toBe(500);
  for (const p of pairs) expect(placementHint(w, p.tool, p.x, p.y)?.tone).toBe('ok'); // wirklich der Bau-Pfad
  const run = (): number => {
    const times: number[] = [];
    for (const p of pairs) {
      const t0 = performance.now();
      placementHint(w, p.tool, p.x, p.y); // reachableRoads je Aufruf neu, kein Cache-Treffer
      times.push(performance.now() - t0);
    }
    return median(times);
  };
  run(); // Aufwärmen (JIT)
  const medians = Array.from({ length: 5 }, run);
  const m = median(medians);
  const report = `Median ${m.toFixed(4)} ms, Läufe ${medians.map((x) => x.toFixed(4)).join(', ')}`;
  if (process.env.PERF_LOG) console.info(`AK-UX-31 ${report}`);
  expect(m, report).toBeLessThanOrEqual(perfBudget(0.5));
}, 60_000);

describe('friendlyReason Mehrzahl (Fix Task 6)', () => {
  it('AK-UX-03 Singular „1 Feld" und Plural „N Felder" im Umkreis-Grund', () => {
    const { w } = uxWorld();
    expect(friendlyReason(w, 'Zu wenig Wald in der Nähe', { defId: 'lumberjack' })).toBe(
      'Zu wenig Wald in der Nähe: mindestens 1 Feld im Umkreis 2',
    );
    expect(friendlyReason(w, 'Zu wenig Weide in der Nähe', { defId: 'sheepfarm' })).toBe(
      'Zu wenig Weide in der Nähe: mindestens 4 Felder im Umkreis 2',
    );
  });
});

describe('M8 Sperrgründe (AK-S1-18)', () => {
  it('AK-S1-18 friendlyReason: „Erst nach dem Ziel (50 Bürger)“, Hebel-Grund unverändert, beide von upgradeStatus provoziert', () => {
    const { w, house } = uxWorld();
    expect(friendlyReason(w, 'Erst nach dem Ziel')).toBe('Erst nach dem Ziel (50 Bürger)');
    expect(friendlyReason(w, 'Erst ab 40 Bürgern (jetzt 39)')).toBe(
      'Erst ab 40 Bürgern (jetzt 39)',
    );
    setHouse(house, 3, TIERS[3].maxInhabitants, []);
    const locked = upgradeStatus(w, house).reasons[0]!;
    expect(locked).toBe('Erst nach dem Ziel');
    let lever: string;
    try {
      TIERS[4].unlockCitizens = 40;
      lever = upgradeStatus(w, house).reasons[0]!;
    } finally {
      TIERS[4].unlockCitizens = null;
    }
    expect(lever).toBe('Erst ab 40 Bürgern (jetzt 15)');
    for (const r of [locked, lever]) {
      expect(
        REASON_TABLE.filter((row) => row.pattern.test(r)),
        r,
      ).toHaveLength(1);
      expect(friendlyReason(w, r)).not.toContain('Tick');
    }
    expect(tooltipLines({ kind: 'build', defId: 'bathhouse' })).toContain('Dienst: Hygiene');
  });
});

describe('M10 Gründe Amtsstube', () => {
  it('AK-S2-17 friendlyReason Amtsstube', () => {
    const { w } = uxWorld();
    expect(friendlyReason(w, 'Es gibt schon eine Amtsstube')).toBe(
      'Es gibt schon eine Amtsstube — höchstens eine wirkt',
    );
    expect(friendlyReason(w, 'Braucht eine Amtsstube')).toBe('Baue zuerst eine Amtsstube (I)');
  });
});

describe('M11 Ausbau-Gründe (Spec 3.6)', () => {
  it('AK-UI-04 jeder Grund von upgradeBuilding steht in REASON_TABLE, „Zu wenig Stoff" bleibt wörtlich', () => {
    const w = createWorld(3, { unlockAll: true });
    const add = (defId: BuildingDefId, extra: Partial<Building> = {}) => {
      const b = {
        id: w.nextBuildingId++,
        defId,
        x: 0,
        y: 0,
        connected: true,
        progress: 0,
        state: 'ok',
        island: 0,
        ...extra,
      } as Building;
      w.buildings[b.id] = b;
      return b.id;
    };
    const reasons = [
      upgradeBuilding(w, 99_999), // Gebäude nicht gefunden
      upgradeBuilding(w, add('chapel')), // Kann nicht ausgebaut werden
      upgradeBuilding(w, add('fisher', { level: 3 })), // Höchste Stufe erreicht
      upgradeBuilding(w, add('fisher', { outageUntil: w.tick + 200 })), // Gebäude brennt
    ].map((r) => (r.ok ? '' : r.reason));
    home(w).stock.cloth = 0;
    const r = upgradeBuilding(w, add('fisher'));
    reasons.push(r.ok ? '' : r.reason); // Zu wenig Stoff
    for (const x of reasons)
      expect(
        REASON_TABLE.some((row) => row.pattern.test(x)),
        x,
      ).toBe(true);
    expect(
      friendlyReason(w, 'Zu wenig Stoff', { cost: { money: 50, wood: 3, tools: 1, stone: 0 } }),
    ).toBe('Zu wenig Stoff');
  });
  it('Abriss-Vorschau erstattet die Hälfte der tatsächlich bezahlten Kosten (Stufe 2)', () => {
    const { w, fisher } = uxWorld();
    fisher.level = 2;
    expect(placementHint(w, { kind: 'demolish' }, fisher.x, fisher.y)?.text).toBe(
      // bezahlt: Bau 100/5/2 + Stufe 2 50/3/1 = 150/8/3; zurück die Hälfte, abgerundet
      'Abreissen: Fischerhütte · zurück 75 Geld · 4 Holz · 1 Werkzeug',
    );
  });
});

describe('M11 R161 Stein-Hinweis (Spec 3.7)', () => {
  it('AK-R161-01 „Zu wenig Stein" mit 1 Glashütte → Zusatzzeile; ohne Glashütte oder anderer Grund: keine', () => {
    const w = createWorld(3, { unlockAll: true });
    const text = 'Die Glashütte verbraucht ebenfalls Stein — baue weitere Steinbrüche.';
    expect(glassStoneHint(w, ['Zu wenig Stein'])).toBeNull();
    const id = w.nextBuildingId++;
    w.buildings[id] = {
      id,
      defId: 'glassworks',
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'waitingInput',
      island: 0,
    };
    expect(glassStoneHint(w, ['Haus nicht voll belegt', 'Zu wenig Stein'])).toBe(text);
    expect(glassStoneHint(w, ['Zu wenig Holz'])).toBeNull();
  });
});

describe('AK-T31/T32 Zusatz (P-2): Stufe im Grund', () => {
  const lockedWorld = (): World => {
    const w = createWorld(3);
    w.tick = 1000;
    w.taxLockedUntil = { 1: 0, 2: 1200, 3: 1150, 4: 0 };
    return w;
  };
  it('Sperrzeit mit tier nennt die Gruppe', () => {
    expect(friendlyReason(lockedWorld(), 'Sperrzeit', { tier: 2 })).toBe(
      'Steuer für Siedler erst in 20 s wieder änderbar',
    );
  });
  it('Sperrzeit ohne tier: kleinste gesperrte Stufe', () => {
    expect(friendlyReason(lockedWorld(), 'Sperrzeit')).toBe(
      'Steuer für Siedler erst in 20 s wieder änderbar',
    );
  });
  it('Sperrzeit ohne gesperrte Stufe und ohne tier bleibt wörtlich', () => {
    const w = lockedWorld();
    w.taxLockedUntil = { 1: 0, 2: 1000, 3: 900, 4: 0 };
    expect(friendlyReason(w, 'Sperrzeit')).toBe('Sperrzeit');
  });
  it('Steuer zu hoch mit tier nennt die Gruppe, ohne tier wie heute', () => {
    const w = createWorld(3);
    expect(friendlyReason(w, 'Steuer zu hoch', { tier: 3 })).toBe(
      "Steuer ‚hoch' für Bürger verhindert den Aufstieg",
    );
    expect(friendlyReason(w, 'Steuer zu hoch')).toBe("Steuer ‚hoch' verhindert den Aufstieg");
  });
  it('upgradeStatus eines Bürger-Hauses unter hoch liefert genau «Steuer zu hoch»', () => {
    const { w, house } = uxWorld();
    placeTownhall(w);
    setHouse(house, 3, TIERS[3].maxInhabitants, []);
    setAllTax(w, 'high');
    expect(upgradeStatus(w, house).reasons.filter((r) => r.startsWith('Steuer'))).toEqual([
      'Steuer zu hoch',
    ]);
  });
});

describe('REL-14 Haus-Hinweis ohne „versorgt“ (A6)', () => {
  it('ohne Mangel „zufrieden“, ausserhalb „ausserhalb der Versorgung“', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    setSimHouse(h, 1, 4);
    h.house!.supplied = true;
    h.house!.satisfied = { food: true };
    expect(houseDiagnosis(w, h)).toEqual([]); // Vorbedingung
    expect(placementHint(w, { kind: 'select' }, h.x, h.y)?.text).toMatch(/ · zufrieden$/);
    const far = houseFar(w);
    expect(placementHint(w, { kind: 'select' }, far.x, far.y)?.text).toMatch(
      / · ausserhalb der Versorgung$/,
    );
  });
});
