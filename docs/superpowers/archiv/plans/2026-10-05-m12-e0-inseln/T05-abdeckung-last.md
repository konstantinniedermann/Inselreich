> **Task-ID:** T05 · **AK-IDs:** AK-E0-12, AK-E0-13, AK-E0-15
> **blocked-by:** T04 · **Strang:** `feat/m12-e0`, Worktree `.worktrees/m12-e0` · `tech-sim-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints, Entscheide P-6, P-7, P-8, P-10 · Spec §4.4, Anhang 01 D

## T05: Dienst-Abdeckung als Filter je Insel und Dienst, Lasttest

**Ziel:** Die Abdeckung liefert für jedes Haus, jeden Dienst und jeden Zeitpunkt dasselbe wie die naive Referenz,
aber ohne O(Häuser × Gebäude) im Tick. **Kein Zwischenspeicher über Ticks, nichts im Save, keine Invalidierung.**

**Code-Fakten (nach T04):** `serviceAvailable(world, house, service)` durchsucht `Object.values(world.buildings)` je
Aufruf (D1: 484 Häuser × 3 Dienste × 548 Gebäude ≈ 800 000 Abstände je Schritt, ≈ 17 ms von ≈ 19 ms).
`isSupplied` → `inSupplyRange` → `supplyBuildings` ebenso je Haus. Aufrufer: `tickPopulation` (je Haus),
`upgradeStatus` (je Haus am Wachstumstakt, aus `tryUpgrade`), `production.ts:35` (`requiresService`, Werkzeugmacher
→ `school`), `queries.ts` (`houseDiagnosis`, `coverageSources`), `controller.ts:164`, UI (`inspect.ts`, `hover.ts`).
In `tickPopulation` ändern sich weder Gebäudemenge noch `connected` noch `outageUntil` (nur Haus-Felder, Lager, Geld).

**Dateien:** neu `src/sim/coverage.ts`; `population.ts`, `supply.ts`, `flow.ts`, `queries.ts`, `production.ts`
(nur Aufruf); `tests/sim/helpers.ts` (`serviceAvailableNaive`, `isSuppliedNaive`, `denseScene`),
`tests/sim/population.test.ts`, neu `tests/sim/perf.test.ts`; `tests/sim/imports.test.ts` grün halten.

## Form (verbindlich, P-6)

```ts
// coverage.ts — importiert nur ./types, ./defs/*, ./world
export function distance(a: Building, b: Building): number; // aus population.ts verschoben, Rechenweg identisch
export function serviceBuildings(world: World, island: number, service: ServiceId): Building[]; // def.service === service && connected && outageUntil === undefined && b.island === island, Id-Reihenfolge
export interface Coverage {
  supply: Building[][];
  service: Record<ServiceId, Building[]>[];
} // je Inselindex
export function buildCoverage(world: World): Coverage; // ein Durchlauf über alle Gebäude
```

- `serviceAvailable(world, house, service, cov?)`: Quellen = `cov?.service[house.island]![service]` sonst
  `serviceBuildings(world, house.island, service)`; Ergebnis `sources.some(b => distance(house, b) <= radius)`.
- `isSupplied(world, house, cov?)`, `inSupplyRange(world, island, cx, cy, sources?)` analog mit `supplyBuildings`.
- `tickPopulation`: `const cov = buildCoverage(world)` einmal am Anfang; an `isSupplied`, `serviceAvailable`,
  `tryUpgrade(world, b, budget, cov)` → `upgradeStatus(world, b, budget, cov)` und `goodsBalance(world, cov)`.
- Alle übrigen Aufrufer (UI, `queries.ts`, `production.ts`, `controller.ts`) ohne `cov` → filtern je Aufruf und sind
  damit ohne Tick aktuell (AK-E0-13). `coverageSources` in `queries.ts` nutzt `serviceBuildings`/`supplyBuildings`.
- Naive Referenz (Code vor T05 inkl. Inselfilter aus T04) wandert nach `tests/sim/helpers.ts`; im Spielcode kein
  Aufruf mehr.

## Schritte

- [ ] **1 Helfer** `denseScene()` nach Anhang 01 D (direkt in `buildings`, `island 0`, Ids ab `nextBuildingId`,
      `nextBuildingId` nachführen); Option `{ toolmakers: true }` legt zusätzlich 4 Werkzeugmacher ab
      `(2 + 16i, 2)`, `i = 0 … 3` (direkt geschrieben wie D1, Überlappung egal); prüfen, dass mindestens einer
      innerhalb und einer ausserhalb eines Schulradius liegt.
- [ ] **2 Tests zuerst** (`population.test.ts`, `describe('M12 E0 Abdeckung')`):
  - **AK-E0-12** (a) D1, `it(…, 120_000)` (R229 qa-B2): 1000 × `step`, alle 100 Schritte für jedes Haus × 3 Dienste `serviceAvailable` mit und ohne
    `buildCoverage` gleich `serviceAvailableNaive`; `isSupplied` gleich `isSuppliedNaive`; `houseDiagnosis`-Dienste
    gleich der aus der Referenz abgeleiteten Liste. (b) dasselbe im `off`-Referenzlauf (`buildColony`, Stopp-Funktion
    alle 100 Ticks). (c) `denseScene({ toolmakers: true })`: je Werkzeugmacher `serviceAvailable(w, b, 'school')`
    gleich Referenz und `tickProduction` setzt `noService` genau dort. (d) Grenzfall: Kapelle und 1×1-Haus mit
    Mittenabstand **genau** `serviceRadius` (waagrecht) → true, ein Viertel weiter → false; je gleich Referenz.
  - **AK-E0-13** Kapelle bauen (`placeBuilding` + Weg), abreissen (`demolish`), Weg zur Kapelle entfernen
    (`removeRoad`), Brand beginnen (`beginCrisis(w, k, { kind: 'fire', tile: { x, y } })` auf die Kapellenkachel,
    keine Wache), Brand enden (`w.tick = chapel.outageUntil!; tickCrises(w)`) — nach jeder Aktion ohne `step`
    Abdeckung aller Häuser gleich Referenz; `serialize(w)` vor und nach `serviceAvailable`/`buildCoverage` gleich.
  - **Lasttest vor der Umsetzung** (R229 qa-B3) `tests/sim/perf.test.ts`, `describe('M12 E0 Last')`,
    `it(…, 120_000)` (P-8), mit **Platzhalter `PERF_PIN = 6`**: AK-E0-15a und -15b wie in Schritt 4; Rot-Beleg auf
    dem naiven Code (Mittel ≈ 19 ms > 6, Verhältnis ≈ 1).
  - Rot-Beleg (Import `coverage.ts` fehlt; Lasttest rot) → Commit `test: M12 E0 Abdeckung und Last (rot)`.
- [ ] **3 Umsetzung** nach „Form"; `tests/sim/imports.test.ts` grün (kein Importkreis).
- [ ] **4 Lasttest messen und pinnen** (Test aus Schritt 2, P-8):
  - **AK-E0-15a** `denseScene()`, 1000 × `step`, Mittel ms/Schritt ≤ `perfBudget(PERF_PIN)`.
  - **AK-E0-15b** je 100 Runden „alle Häuser × 3 Dienste": naiv vs. `buildCoverage` + Abfragen mit `cov`; je Seite
    Minimum aus 3 Läufen; `naiv / index ≥ 5`.
  - `PERF_PIN` = `min(6, aufrunden auf 0,5(1,5 × lokales Mittel))`; Messbefehl, Rechner, Messwert und Datum im
    Kommentar. Liegt das lokale Mittel über 4 ms: anhalten, Meldung an Controller (6 ms nicht erreichbar).
- [ ] **5 Prüfen:** `make check` und `CI=true make check` grün (auch `perf.test.ts` mit Faktor 1,5); bitgleich
      unverändert. Commit `feat: M12 E0 Dienst-Abdeckung als Filter je Insel und Dienst`.

**Review-Fokus:** gleicher Rechenweg wie die Referenz (`distance`, `≤`, Bedingungen); `Coverage` lebt nur innerhalb
eines `tickPopulation`-Aufrufs; kein Modul-Zustand; nichts im Save; Zeitmessung nach P-8; Pin mit Beleg ≤ 6.
