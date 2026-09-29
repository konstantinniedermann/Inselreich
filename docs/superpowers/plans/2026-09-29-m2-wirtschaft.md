# M2 Wirtschaft — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lager, Baukosten, Abriss mit Rückerstattung, Wegenetz-Anbindung, Produktion mit Input/Output, Handel am Kontor, Unterhalt — sichtbar im HUD, Inspect-Panel und Handelsdialog.

**Architecture:** Neue Sim-Systeme als reine Funktionen auf `World` (`economy.ts`, `roads.ts`, `production.ts`, `trade.ts`), eingehängt in `tick.ts` (Reihenfolge Produktion → Wirtschaft). `build.ts` wird um Bezahlen/Refund und Anbindungs-Neuberechnung erweitert. UI liest nur Zustand und ruft Sim-Aktionen.

**Tech Stack:** wie M1 (TypeScript strict, Vite, Vitest, ESLint, Prettier). Keine neuen Abhängigkeiten.

**Spec:** `docs/superpowers/specs/2026-09-29-inselreich-design.md` (Abschnitte 2.3, 2.4 Kosten/Unterhalt, 2.5, 2.6, 2.8 ohne Steuern, 3.2) · GitHub-Issue #2

## Global Constraints

- Keine Laufzeit-Abhängigkeiten; keine neuen Pakete.
- `src/sim/**` DOM-frei; Welt bleibt JSON-fähig (keine Map/Set/Klassen); Aktionen werfen nicht, liefern `Result`.
- Spielwerte nur in `src/sim/defs/` (`GOODS`, `BUILDING_DEFS`, `ROAD_COST`, `STORAGE_CAP`).
- Lagerkapazität 100 je Gut; volle Lager verwerfen Produktion (Zustand `storageFull`).
- Anbindung: Wegkachel 4er-angrenzend an Footprint, per 4er-Nachbarschaft über Wegkacheln verbunden mit einer Wegkachel, die 4er-angrenzend an das Kontor liegt. Nur bei Änderungen am Wegenetz/Gebäudebestand neu berechnen.
- Produktion: angebundene Gebäude zählen `progress` je Tick; Input wird zu Zyklusbeginn entnommen (`waitingInput` wenn fehlt); bei Zyklusende 1 Output ins Lager.
- Abriss: 50 % der Geld-/Materialkosten zurück (abgerundet); Weg-Abriss 50 % von `ROAD_COST` abgerundet (= 2).
- Unterhalt: Summe der Gebäude-Unterhalte (auch nicht angebundene), abgebucht alle 100 Ticks in einem Betrag; `stats.upkeep` hält die Summe pro 100 Ticks.
- Geld darf negativ werden; bei Geld < 0 sind Bauen und Kaufen gesperrt (Grund `'Kein Geld'`), sonst `'Zu wenig Geld'` / `'Zu wenig Holz'` / `'Zu wenig Werkzeug'` / `'Zu wenig Stein'` (Prüfreihenfolge: Geld, Holz, Werkzeug, Stein).
- Handel: Kauf `n × buy`, Verkauf `n × sell`; Gründe `'Zu wenig Geld'`, `'Lager voll'`, `'Nicht genug Ware'`, `'Kein Geld'`.
- UI-Sprache Deutsch (CH, kein ß). Commit-Präfixe wie M1.

## Review Focus

1. **Weg entfernen, der die einzige Verbindung ist:** alle dahinterliegenden Gebäude werden `connected: false` und `state: 'notConnected'`; Produktion stoppt, `progress` bleibt erhalten. (Test in Task 2)
2. **Weberei ohne Wolle im Lager:** bleibt bei `progress 0` im Zustand `waitingInput`, verbraucht nichts, produziert nichts; sobald Wolle da ist, läuft sie. (Test in Task 3)
3. **Lager voll bei Zyklusende:** Einheit verfällt, Zustand `storageFull`, Zähler startet neu, Lagerstand bleibt 100. (Test in Task 3)
4. **Abriss eines Gebäudes mit teilweisem Materialrefund:** Refund `floor(cost/2)` je Komponente, Kontor nie abreissbar, Refund landet im Lager auch wenn dieses dadurch über 100 ginge → auf 100 gekappt (Überschuss verfällt). (Test in Task 2)
5. **Kauf mit negativem Kontostand:** abgelehnt mit `'Kein Geld'` auch wenn n × buy klein ist. (Test in Task 4)

---

### Task 1: Economy-Grundfunktionen (Lager, Bezahlen, Refund, Unterhalt)

**Files:**

- Create: `src/sim/economy.ts`
- Test: `tests/sim/economy.test.ts`

**Interfaces:**

- Consumes: `World`, `Cost`, `GoodId` aus `types.ts`; `STORAGE_CAP`, `GOOD_IDS` aus `defs/goods.ts`; `BUILDING_DEFS` aus `defs/buildings.ts`.
- Produces:

```ts
export const UPKEEP_INTERVAL = 100;
export function addStock(world: World, good: GoodId, n: number): number; // liefert tatsächlich eingelagerte Menge (Kappung bei STORAGE_CAP)
export function takeStock(world: World, good: GoodId, n: number): boolean; // false und keine Änderung, wenn nicht genug
export function checkAfford(world: World, cost: Cost): Result; // 'Kein Geld' (money<0) | 'Zu wenig Geld' | 'Zu wenig Holz' | 'Zu wenig Werkzeug' | 'Zu wenig Stein'
export function pay(world: World, cost: Cost): void; // ohne Prüfung, Aufrufer prüft checkAfford
export function refundCost(cost: Cost): Cost; // floor(x/2) je Komponente
export function grantRefund(world: World, cost: Cost): void; // money += cost.money; addStock je Material
export function totalUpkeep(world: World): number; // Summe upkeep aller Gebäude
export function tickEconomy(world: World): void; // wenn world.tick % UPKEEP_INTERVAL === 0 && tick > 0: money -= totalUpkeep; stats.upkeep = totalUpkeep (immer aktualisieren)
```

- [ ] **Step 1: Failing tests**

```ts
import { describe, expect, it, beforeEach } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { placeBuilding } from '../../src/sim/build';
import {
  addStock,
  takeStock,
  checkAfford,
  pay,
  refundCost,
  grantRefund,
  totalUpkeep,
  tickEconomy,
  UPKEEP_INTERVAL,
} from '../../src/sim/economy';
import type { World } from '../../src/sim/types';

let w: World;
beforeEach(() => {
  w = createWorld(3);
});

describe('stock', () => {
  it('caps at 100 and reports accepted amount', () => {
    w.stock.wood = 95;
    expect(addStock(w, 'wood', 10)).toBe(5);
    expect(w.stock.wood).toBe(100);
    expect(addStock(w, 'wood', 1)).toBe(0);
  });
  it('takes only if enough', () => {
    w.stock.food = 3;
    expect(takeStock(w, 'food', 4)).toBe(false);
    expect(w.stock.food).toBe(3);
    expect(takeStock(w, 'food', 3)).toBe(true);
    expect(w.stock.food).toBe(0);
  });
});

describe('afford/pay/refund', () => {
  const cost = { money: 100, wood: 5, tools: 2, stone: 1 };
  it('checks in order money, wood, tools, stone', () => {
    expect(checkAfford(w, cost)).toEqual({ ok: true });
    w.money = 50;
    expect(checkAfford(w, cost)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    w.money = 5000;
    w.stock.wood = 0;
    expect(checkAfford(w, cost)).toEqual({ ok: false, reason: 'Zu wenig Holz' });
    w.stock.wood = 5;
    w.stock.tools = 1;
    expect(checkAfford(w, cost)).toEqual({ ok: false, reason: 'Zu wenig Werkzeug' });
    w.stock.tools = 2;
    w.stock.stone = 0;
    expect(checkAfford(w, cost)).toEqual({ ok: false, reason: 'Zu wenig Stein' });
  });
  it('blocks everything when money is negative', () => {
    w.money = -1;
    expect(checkAfford(w, { money: 0, wood: 0, tools: 0, stone: 0 })).toEqual({
      ok: false,
      reason: 'Kein Geld',
    });
  });
  it('pays and refunds half rounded down, capped by storage', () => {
    pay(w, cost);
    expect(w.money).toBe(4900);
    expect(w.stock).toMatchObject({ wood: 35, tools: 18, stone: 9 });
    expect(refundCost({ money: 101, wood: 5, tools: 1, stone: 0 })).toEqual({
      money: 50,
      wood: 2,
      tools: 0,
      stone: 0,
    });
    w.stock.wood = 99;
    grantRefund(w, { money: 10, wood: 5, tools: 0, stone: 0 });
    expect(w.money).toBe(4910);
    expect(w.stock.wood).toBe(100);
  });
});

describe('upkeep', () => {
  it('sums building upkeep and books it every 100 ticks', () => {
    const k = w.buildings[w.kontorId]!;
    // Kapelle irgendwo auf Gras platzieren (Kosten in Task 2 — hier noch ohne)
    const spot = findGrass(w);
    expect(placeBuilding(w, 'chapel', spot.x, spot.y).ok).toBe(true);
    expect(totalUpkeep(w)).toBe(15);
    const m0 = w.money;
    w.tick = 1;
    tickEconomy(w);
    expect(w.money).toBe(m0);
    expect(w.stats.upkeep).toBe(15);
    w.tick = UPKEEP_INTERVAL;
    tickEconomy(w);
    expect(w.money).toBe(m0 - 15);
    w.tick = 0;
    tickEconomy(w);
    expect(w.money).toBe(m0 - 15); // Tick 0 bucht nicht
    void k;
  });
});

function findGrass(w: World): { x: number; y: number } {
  for (let y = 1; y < w.height - 2; y++)
    for (let x = 1; x < w.width - 2; x++) {
      let ok = true;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const t = w.tiles[(y + dy) * w.width + x + dx]!;
          if (t.terrain !== 'grass' || t.buildingId !== null || t.road) ok = false;
        }
      if (ok) return { x, y };
    }
  throw new Error('no grass');
}
```

Hinweis: Der Upkeep-Test platziert vor Task 2 kostenlos; nach Task 2 zieht `placeBuilding` Kosten ab — der Test vergleicht relativ (`m0` nach Platzierung), bleibt also gültig.

- [ ] **Step 2: Run, expect FAIL.** — [ ] **Step 3: Implementieren** (reine Funktionen; `tickEconomy` aktualisiert `stats.upkeep` bei jedem Aufruf und bucht nur bei `tick > 0 && tick % UPKEEP_INTERVAL === 0`).
- [ ] **Step 4: Run, expect PASS.** — [ ] **Step 5: Commit** `feat: Lager, Bezahlen, Refund und Unterhalt`

---

### Task 2: Anbindung (roads.ts) und Kosten in build.ts

**Files:**

- Create: `src/sim/roads.ts`
- Modify: `src/sim/build.ts`
- Test: `tests/sim/roads.test.ts`, Modify: `tests/sim/placement.test.ts` (Kosten-Fälle ergänzen)

**Interfaces:**

- Produces (roads.ts):

```ts
export function kontorRoadRoots(world: World): number[]; // Tile-Indizes: Wegkacheln 4er-angrenzend an Kontor-Footprint
export function reachableRoads(world: World): Set<number>; // BFS über Wegkacheln ab Roots (Set nur lokal, nicht im World gespeichert)
export function isBuildingConnected(world: World, b: Building, roads: Set<number>): boolean; // eine adjacentOf-Kachel ist in roads; kontor → true; house → false (Versorgung ist M3)
export function recomputeConnectivity(world: World): void; // setzt b.connected für alle; für Gebäude mit def.produces oder def.service oder market: state = connected ? (state === 'notConnected' ? 'ok' : state) : 'notConnected'
```

- Modify (build.ts):
  - `placeBuilding`: nach `canPlace` → `checkAfford(world, def.cost)`; bei Fehler zurückgeben; dann `pay`, anlegen, `recomputeConnectivity`.
  - `placeRoad`: `checkAfford(world, { money: ROAD_COST, wood: 0, tools: 0, stone: 0 })`, `pay`, setzen, `recomputeConnectivity`.
  - `removeRoad`: `grantRefund(world, refundCost(roadCost))`, `recomputeConnectivity`.
  - `demolish`: `grantRefund(world, refundCost(def.cost))`, Kacheln frei, löschen, `recomputeConnectivity`.
  - Neue Exportkonstante in `defs/buildings.ts`: `ROAD_COST_OBJ: Cost = { money: ROAD_COST, wood: 0, tools: 0, stone: 0 }`.

- [ ] **Step 1: Failing tests (roads.test.ts)** — Aufbau: `createWorld(3)`, Kontor `k`; Hilfsfunktion `landLine(w, k)` sucht eine Richtung (E/W/N/S), in der ab der Kontor-Kante 6 Kacheln in Folge Land und frei sind (setzt notfalls Terrain auf `grass`, damit der Test deterministisch ist).

```ts
it('connects a lumberjack via road to the kontor and disconnects when the road breaks', () => {
  // Weg 4 Kacheln nach Osten ab Kontor-Kante, Holzfäller angrenzend an Wegende; Wald-Kachel daneben setzen
  ... placeRoad ×4, tiles forest setzen, placeBuilding('lumberjack')
  expect(lj.connected).toBe(true); expect(lj.state).toBe('ok');
  removeRoad(w, mitte)  → expect(lj.connected).toBe(false); expect(lj.state).toBe('notConnected');
  placeRoad(w, mitte)   → wieder connected, state 'ok'
});
it('kontor is always connected, houses never via roads', ...);
it('building adjacent to kontor without any road is not connected', ...);   // Anbindung braucht mind. eine Wegkachel
it('state notConnected does not overwrite waitingInput once reconnected', ...) // state bleibt bei Reconnect 'ok' nur wenn vorher notConnected war
```

- [ ] **Step 2: Kosten-Tests in placement.test.ts ergänzen**

```ts
it('charges costs and refunds half on demolish', () => {
  const m0 = w.money,
    wood0 = w.stock.wood;
  const r = placeBuilding(w, 'weaver', o.x, o.y); // 200/15/3/0
  expect(w.money).toBe(m0 - 200);
  expect(w.stock.wood).toBe(wood0 - 15);
  expect(w.stock.tools).toBe(20 - 3);
  demolish(w, (r as { id: number }).id);
  expect(w.money).toBe(m0 - 100);
  expect(w.stock.wood).toBe(wood0 - 15 + 7);
  expect(w.stock.tools).toBe(20 - 3 + 1);
});
it('rejects unaffordable builds with the reason and leaves the map untouched', () => {
  w.money = 10;
  expect(placeBuilding(w, 'weaver', o.x, o.y)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
  expect(tileAt(w, o.x, o.y)!.buildingId).toBeNull();
  expect(placeRoad(w, o.x, o.y)).toEqual({ ok: true }); // 5 ≤ 10
  expect(placeRoad(w, o.x + 1, o.y)).toEqual({ ok: true });
  expect(placeRoad(w, o.x + 2, o.y)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
  expect(removeRoad(w, o.x, o.y).ok).toBe(true);
  expect(w.money).toBe(2);
});
```

- [ ] **Step 3: Run, expect FAIL.** — [ ] **Step 4: roads.ts + build.ts anpassen.** — [ ] **Step 5: Alle Tests grün, `make check`.**
- [ ] **Step 6: Commit** `feat: Wegenetz-Anbindung zum Kontor, Baukosten und Refund`

---

### Task 3: Produktion

**Files:**

- Create: `src/sim/production.ts`
- Modify: `src/sim/tick.ts` (Reihenfolge: `tickProduction` → `tickEconomy` → `tick++`)
- Test: `tests/sim/production.test.ts`

**Interfaces:**

- Produces: `tickProduction(world: World): void` — für jedes Building mit `def.produces`: wenn `!connected` → `state = 'notConnected'`, weiter. Wenn `progress === 0` und `def.consumes`: `takeStock(consumes, 1)` fehlgeschlagen → `state = 'waitingInput'`, weiter (kein Fortschritt). Sonst `progress++`, `state = 'ok'`. Wenn `progress >= cycle`: `addStock(produces, 1)`; `state = accepted === 1 ? 'ok' : 'storageFull'`; `progress = 0`.
- `step(world)` in tick.ts: `tickProduction(world); tickEconomy(world); world.tick += 1;`

- [ ] **Step 1: Failing tests** — Aufbau über Hilfsfunktion `connectedBuilding(w, defId)`: platziert per Test-Setup ein Gebäude, setzt `connected = true` direkt (Anbindung ist in Task 2 getestet).

```ts
it('lumberjack produces 1 wood per 30 ticks when connected', () => { for 30 ticks: tickProduction → wood +1; nach 29 Ticks noch nicht });
it('does nothing when not connected and keeps progress', ...);
it('weaver waits for wool, takes 1 wool at cycle start, outputs cloth at cycle end', () => { ohne Wolle: 10 Ticks → progress 0, state waitingInput, cloth 0; wool=1 → 1 Tick: wool 0, progress 1; nach 50 Ticks: cloth 1, progress 0 });
it('drops output when storage is full and marks storageFull', () => { stock.wood = 100; 30 Ticks → wood 100, state storageFull, progress 0 });
it('step runs production then economy and increments tick', () => { Smoke: Weg + Holzfäller angebunden (echte placeRoad/placeBuilding), 300 Ticks step → wood gestiegen, money um Unterhalt gesunken (3 Buchungen à totalUpkeep) });
```

- [ ] **Step 2: Run FAIL → Step 3: implementieren → Step 4: PASS, `make check`.** — [ ] **Step 5: Commit** `feat: Produktion mit Input, Output und Lagerlimit; Tick-Reihenfolge`

---

### Task 4: Handel

**Files:**

- Create: `src/sim/trade.ts`
- Test: `tests/sim/trade.test.ts`

**Interfaces:**

- Produces:

```ts
export function buy(world: World, good: GoodId, n: number): Result; // n ≥ 1; 'Kein Geld' | 'Zu wenig Geld' | 'Lager voll' (wenn stock + n > STORAGE_CAP); money -= n*buy; stock += n
export function sell(world: World, good: GoodId, n: number): Result; // 'Nicht genug Ware'; stock -= n; money += n*sell (auch bei negativem Geld erlaubt — Verkaufen ist der Weg aus den Schulden)
export function buyPrice(good: GoodId, n: number): number;
export function sellPrice(good: GoodId, n: number): number;
```

- [ ] **Step 1: Failing tests** — Kauf 10 Werkzeug: money −400, tools 30; Kauf bei stock 95 + 10 → 'Lager voll' ohne Änderung; money 30, buy tools ×1 → 'Zu wenig Geld'; money −5 → 'Kein Geld'; sell food 25 bei 20 → 'Nicht genug Ware'; sell food 10 → money +30, food 10; sell erlaubt bei money < 0.
- [ ] **Step 2–4: FAIL → implementieren → PASS.** — [ ] **Step 5: Commit** `feat: Handel am Kontor (Kauf und Verkauf zu Fixpreisen)`

---

### Task 5: UI — Lagerleiste, Inspect-Panel, Handelsdialog, Bauleisten-Sperren

**Files:**

- Modify: `src/ui/hud.ts` (Lagerleiste, Unterhalt-Anzeige), `src/ui/app.ts` (Auswahl → Panel-Inhalt, Aktionen `demolishSelected`, `trade`), `src/ui/buildMenu.ts` (Button `disabled`-Klasse wenn `checkAfford` fehlschlägt — Klick zeigt Grund als Toast), `src/style.css`
- Create: `src/ui/inspect.ts`, `src/ui/trade.ts`

**Interfaces:**

- `renderInspect(panel: HTMLElement, world: World, buildingId: number | null, actions: { demolish(id: number): void; openTrade(): void })` — zeigt Name, Position, Zustand (`ok` → „In Betrieb", `waitingInput` → „Wartet auf <Gutname>", `storageFull` → „Lager voll", `notConnected` → „Nicht an Kontor angebunden"), Fortschrittsbalken (`progress / cycle`), Produktion/Verbrauch, Unterhalt, Button „Abreissen (Rückerstattung G x · H y …)"; für Kontor stattdessen Button „Handeln" und Lagerübersicht; für Haus vorerst nur Name/Einwohner (M3 füllt).
- `renderTrade(panel: HTMLElement, world: World, onChange: () => void)` — Tabelle je Gut: Name, Lager, Kaufpreis, Verkaufspreis, Buttons „+1 / +10" (buy) und „−1 / −10" (sell); Ergebnis `!ok` → Toast; „Zurück" → Inspect Kontor.
- HUD: unter der Kopfzeile eine Lagerleiste (`.stock-row` mit Chips `Holz 40`), Anzeige `Unterhalt: −15 / 100 Ticks`; Geld rot wenn < 0.
- Panel-Refresh: `updateHud` (alle 10 Frames) ruft auch `refreshPanel()` wenn ein Gebäude ausgewählt oder der Handel offen ist (nur Textupdates via `textContent`, kein Neuaufbau jeder Frame — Inspect wird nur bei Auswahlwechsel neu gebaut, Zahlen per `data-field` aktualisiert).

- [ ] **Step 1: Implementieren.** — [ ] **Step 2: `make check` grün.** — [ ] **Step 3: Manuelle Prüfung** (Headless-CDP-Skript des Controllers oder Browser): Weg + Holzfäller bauen → Holz steigt; Weg trennen → roter Punkt und „Nicht angebunden"; Kontor anklicken → Handel: 10 Werkzeug kaufen → Geld −400; Abriss mit Refund; Bauleiste sperrt bei Geldmangel.
- [ ] **Step 4: README (Abschnitt Spielen: Wirtschaft) ergänzen.** — [ ] **Step 5: Commit** `feat: Lagerleiste, Inspect-Panel und Handelsdialog`

---

## Self-Review (durchgeführt)

- Spec-Abdeckung M2: 2.3 Güter/Preise/Kapazität (Task 1, 4), 2.4 Kosten/Unterhalt/Abriss (Task 1, 2), 2.5 Anbindung (Task 2), 2.6 Produktion (Task 3), 2.8 Startwerte/Unterhalt/Negativsperre (Task 1, 4), 3.2 Module (alle), UI-Teile Inspect/Trade/HUD (Task 5). Steuern und Versorgung sind M3.
- Typkonsistenz: `checkAfford/pay/grantRefund/refundCost/addStock/takeStock` in Task 1 definiert, in 2–5 verwendet; `recomputeConnectivity` in Task 2, von build.ts aufgerufen; `tickProduction`/`tickEconomy` in tick.ts (Task 3).
- Review Focus 1–5 durch Tests in Task 2, 3, 4 abgedeckt.
