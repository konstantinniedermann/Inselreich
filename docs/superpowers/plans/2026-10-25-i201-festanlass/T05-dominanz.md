# T05 Dominanz-Welten und Nicht-Dominanz (AK-FE1)

Persona `tech-sim-engineer` · Strang B · Tools ≈ 80 · AK-FE1 · blocked-by T03.

**Worktree:** `.worktrees/i201-fe1`, Branch `feat/i201-fe1` vom T03-Hash auf `feat/i201` (`git worktree list` zuerst). Nur die zwei neuen Dateien; Rückführung nach `feat/i201` per Merge durch den Controller.

**Files:** Create `tests/sim/feastWorlds.ts` (Helfer, P-2: nicht `helpers.ts`, die läge über 30 KB), `tests/sim/feastDominance.test.ts`. Kein `src/`-Diff. **Werte in `src/sim/defs/feast.ts` nicht ändern;** wird die Rangfolge trotz korrekter Welt nicht erreicht, ist das ein Befund an den Controller (R553-Rückfall nur per L0-Ruling), keine Verstellung.

**Interfaces:**

- Consumes: `holdFeast(world, id, kind)` (T02), `FEAST_KIND_IDS`, `FeastKind`, `FEAST_KINDS` (T01), `cycleOf`, `sell(world, good, n, island)`, `step(world)` (`src/sim/tick.ts`), `upgradeStatus` (`src/sim/population.ts`), `putBuilding`, `placeService`, `setHouse`, `forceRect` (`./helpers`), `GOODS`, `STORAGE_CAP`, `FEAST_DURATION`.
- Produces (nur für diesen Test):

```ts
export type FeastLage = 'A' | 'B' | 'C' | 'C2';
export type FeastRun = 'none' | FeastKind;
export const FEAST_SEEDS = [3, 7] as const; // P-6
export interface FeastScene {
  w: World;
  chapel: Building;
  houses: Building[]; // im Kapellen-Radius
  producers: Building[]; // Betriebe mit Zyklus im Radius
  sales: Partial<Record<GoodId, number>>; // A {}, B {rum: 30, cloth: 30, glass: 20}, C/C2 {rum: 60, cloth: 60, glass: 40}
}
export function feastScene(lage: FeastLage, seed: number): FeastScene;
export interface RunLog {
  holdOk: boolean;
  sellOk: boolean;
  capHit: GoodId[]; // Fertiggüter der producers, die im Fenster STORAGE_CAP erreicht haben
  zeroHit: GoodId[]; // von Häusern verbrauchte Güter, die im Fenster 0 erreicht haben
  workshopUnits: number; // im Fenster gefertigte Einheiten der producers
  housesRisen: number; // Häuser in `houses` mit höherer Stufe als bei T0
  incident: boolean; // Krise oder Brand (`w.crisis !== null` oder ein `outageUntil`) in irgendeinem Tick
  value: number; // w.money + Σ_g stock_g × GOODS[g].sell bei T0 + FEAST_DURATION
}
export function runFeast(lage: FeastLage, seed: number, run: FeastRun): RunLog;
```

`runFeast`: frische Szene; bei `run !== 'none'` `holdFeast(w, chapel.id, run)`; dann in **allen vier** Läufen im selben Tick T0 `sell` je Eintrag von `sales` (Heimat); dann `FEAST_DURATION` × `step`, je Tick die Logwerte nachführen. Nettowert `net(run) = value(run) − value('none')` (Festpreis enthalten, Mass «Wahl und Nische»: alle Waren zu `GOODS[g].sell`, ohne Sättigung).

## Welten (Spec AK-FE1; Aufbau relativ zum Heimatkontor, alles per `putBuilding`/`placeService`)

Gemeinsam: `createWorld(seed, { unlockAll: true, crisisLevel: 'off' })`, `w.tick` auf einen festen T0 (z. B. 1000), Kapelle angebunden, Steuer «normal» (keine Amtsstube), alle Gebäude `connected = true` nach dem Aufbau (kein `demolish`, kein `placeBuilding` nach dem Setzen, sonst rechnet `recomputeConnectivity` die Anbindung neu). Lager für Nahrung und Gewürz so hoch, dass Häuser im Fenster versorgt bleiben.

- **A Wachstum:** ≥ 5 Häuser Stufe 3 im Radius, bei T0 aufstiegsbereit für Stufe 4: `upgradeStatus(w, h).reasons` enthält bei T0 nur noch den Wartegrund (Muster `tests/sim/feast.test.ts`, AK-I007-02: `satisfiedSince = T0`, Dienste, Güter, Baukosten). Ohne Fest steigen sie bei T0 + 300, mit Aufstiegsfest bei T0 + 150. Ein Betrieb mit Zyklus im Radius ohne Eingänge. `sales = {}`.
- **B Plateau:** Häuser im Radius Stufe 4; Lager Rum, Stoff, Glas je 50; Eingänge der Werkstätten vorrätig; 2 `weaver`, 3 `distillery`, 1 `glassworks`, 1 `toolmaker`, alle `level = 3`, im Radius. Kalibrierhilfe (tiers.ts: Bedarf Stufe 4 je Einwohner und 100 Ticks Stoff 0,2, Rum 0,2, Glas 0,1, Gewürz 0,1, Nahrung 0,5): Mit Lager 50 und Verkauf 30 tragen etwa 40 bis 60 Einwohner das Fenster, ohne dass Stoff im Lauf ohne Fest auf 0 fällt und ohne dass Rum im Ernte-Lauf 100 erreicht.
- **C Plateau voll, Rohstoffe knapp:** wie B, aber Lager Rum, Stoff, Glas je 100 (≥ 90), Eingänge der Werkstätten 0, kein Rohstoffbetrieb auf der Insel; Kalibrierhilfe: mit Verkauf 60/60/40 trägt der Lauf ohne Fest höchstens etwa 30 Einwohner.
- **C2:** wie C, aber Eingänge vorrätig wie in B.

Kalibriert werden nur Hauszahl, Einwohner je Haus (`setHouse`) und Startlager innerhalb der Spec-Vorgaben; Erwartungen nie.

## Erwartungen (je Lage und Seed, `describe.each(FEAST_SEEDS)`)

- **Vorbedingungen (Pflicht, eigene `expect` vor der Rangfolge):** in jedem Lauf `holdOk` und `sellOk`; `incident === false`; A: im Lauf `none` `housesRisen === houses.length` (≥ 5); B: im `harvest`-Lauf `capHit` leer; C: im `harvest`-Lauf `workshopUnits === 0`; B, C, C2 (P-5): im Lauf `none` `zeroHit` leer. Fällt ein Gut nur in einem Festlauf auf 0, ist das Teil des Festpreises; im Bericht nennen.
- **Rangfolge:** `best(lage) = argmax_kind net(kind)` über `FEAST_KIND_IDS`: A → `ascension`, B → `harvest`, C → `market`; daraus folgt: jede Art in genau einer der Lagen A, B, C beste (zusätzlich als `expect` über die Menge `{best(A), best(B), best(C)}` mit Grösse 3).
- **C2-Band:** `0 < net(harvest) − net(market) ≤ 800`.
- Keine Beträge als Erwartung. Die Nettowerte je Lage, Seed und Art gehen als Tabelle in den Bericht (nicht in `console`), Risiko R553.

## Schritte

- [ ] **Helfer und Test schreiben** (`feastWorlds.ts`, `feastDominance.test.ts`).
- [ ] **Welten kalibrieren**, bis alle Vorbedingungen mit den echten Werten grün sind (Lauf: `npx vitest run tests/sim/feastDominance.test.ts; echo EXIT=$?`). Laufzeit im Ledger (Ziel ≤ 10 s; 4 Welten × 2 Seeds × 4 Läufe × 600 Ticks).
- [ ] **Rot-Beleg per Stub (P-3):** lokal `FEAST_KINDS.harvest.cyclePct` und `FEAST_KINDS.market.sellPct` auf `100`; Lauf → Exit ≠ 0, und zwar an der Rangfolge B oder C (nicht an einer Vorbedingung; Ausgabe im Ledger). Stub zurücksetzen, `git diff --quiet -- src/sim/defs/feast.ts; echo EXIT=$?` → 0.
- [ ] **Grün:** `npx vitest run tests/sim/feastDominance.test.ts; echo EXIT=$?` → 0.
- [ ] **Determinismus des Tests:** Lauf zweimal, identische Nettowerte (Ledger).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `git add tests/sim/feastWorlds.ts tests/sim/feastDominance.test.ts` · `test: Nicht-Dominanz der Festarten, vier Welten und zwei Seeds (I-201 T05)`.
