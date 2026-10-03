> **Task-ID:** T01 (Paket M11-P1a) — Teil 3 von 3
> **AK-IDs / blocked-by / Strang:** siehe [T01a-fluss-save.md](T01a-fluss-save.md)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints)
> **Teile:** [T01a-fluss-save.md](T01a-fluss-save.md) · [T01b-fluss-save.md](T01b-fluss-save.md) · **T01c-fluss-save.md** (diese: Umsetzung, Doku, Commit)

## Schritt 3: Umsetzung

- [ ] **Defs.** `defs/timing.ts`: Kommentar `UPKEEP_INTERVAL` → „Raten je 100 Ticks; Teiler des Unterhalts-Übertrags;
      Takt des Tons `coin`"; neu `UPGRADE_DEFICIT_WAIT_FACTOR = 2`, `EFF_WINDOW = 256`, `EFF_MAX = 1000` (je mit
      Doc-Kommentar, Anhang 01 A.1). `defs/tiers.ts`: `import { UPGRADE_WAIT, UPKEEP_INTERVAL } from './timing'`;
      `export const TAX_UNIT = 2;` `UNSATISFIED_TAX_FACTOR = 1 / TAX_UNIT;`
      `export const TAX_CARRY_DIVISOR = UPKEEP_INTERVAL * 100 * TAX_UNIT;` (Abweichung 13-1: Ort `tiers.ts`).
- [ ] **`defs/levels.ts` (neu):** `LevelDef` und `LEVELS` genau wie Anhang 01 A.4, Wert `{}` (P3/T07 füllt). Importe nur
      `import type { BuildingDefId, Cost, GoodId } from '../types'`.
- [ ] **`types.ts`** (Anhang 01 B): `BuildingState` + `'noForest'`; `SiteRule` `radius` + `free?: true`; `Building` +
      `eff?: number` und `level?: 2 | 3` (je Doc-Kommentar); `UnlockFunction` + `'upgrade2' | 'upgrade3'`;
      `World.version: 6`, nach `upgradeStops` neu `taxCarry: number; upkeepCarry: number;`. `BuildingDefId` **nicht**
      (T04).
- [ ] **`world.ts`:** `version: 6`; nach `upgradeStops: []` die Felder `taxCarry: 0, upkeepCarry: 0` (Reihenfolge = Typ;
      migrierte Stände hängen sie ebenfalls ans Ende).
- [ ] **`src/sim/levels.ts` (neu)** — importiert nur `./types`, `./defs/buildings`, `./defs/levels`, `./defs/timing`:

```ts
const levelDef = (b: Building): LevelDef | undefined =>
  b.level === undefined ? undefined : LEVELS[b.defId]?.[b.level - 2];
/** Zyklus (Ticks) des stehenden Betriebs; `undefined` ohne Zyklus. Einziger Leseort (Spec 3.1). */
export const cycleOf = (b: Building): number | undefined =>
  BUILDING_DEFS[b.defId].cycle === undefined
    ? undefined
    : (levelDef(b)?.cycle ?? BUILDING_DEFS[b.defId].cycle);
/** Unterhalt je 100 Ticks des stehenden Gebäudes. */
export const upkeepOf = (b: Building): number =>
  levelDef(b)?.upkeep ?? BUILDING_DEFS[b.defId].upkeep;
/** Auslastung in Promille 0 … 1000; `null` ohne `produces` (Spec 3.5). */
export const utilization = (b: Building): number | null =>
  BUILDING_DEFS[b.defId].produces === undefined
    ? null
    : Math.floor((b.eff ?? EFF_WINDOW * EFF_MAX) / EFF_WINDOW);
```

- [ ] **`population.ts`:** neu `taxUnits(world)` (Anhang 01 C, ganzzahlig: Σ EW × `tier.tax` × (`allNeedsMet` ?
      `TAX_UNIT` : 1), dann × `TAX_LEVELS[effectiveTaxLevel(world)].pct`). `totalTaxes` =
      `Math.floor(taxUnits(world) / (TAX_UNIT * 100))` (identisch zum Ist: alte Summe = `taxUnits / (2 · pct)`).
      `tickTaxes`: `const u = taxUnits(world); world.stats.taxes = Math.floor(u / (TAX_UNIT * 100));
world.taxCarry += u; const n = Math.floor(world.taxCarry / TAX_CARRY_DIVISOR); world.money += n;
world.taxCarry -= n * TAX_CARRY_DIVISOR;`. Import `UPKEEP_INTERVAL` entfernen, falls unbenutzt; Doc-Kommentare
      „je Buchungstakt" → „Nominalwert je 100 Ticks, Buchung je Schritt mit Übertrag".
- [ ] **`economy.ts`:** `totalUpkeep` summiert `upkeepOf(b)`; `tickEconomy`: `stats.upkeep = totalUpkeep(world);
upkeepCarry += stats.upkeep; n = floor(upkeepCarry / UPKEEP_INTERVAL); money -= n; upkeepCarry -= n × UPKEEP_INTERVAL`.
      Der Re-Export `UPKEEP_INTERVAL` bleibt (UI, Tests).
- [ ] **Zugriffsersatz:** `production.ts:20` → `const cycle = cycleOf(b); if (!def.produces || cycle === undefined)
continue;` und `:45` `b.progress >= cycle`; `queries.ts:78-80` `goodsBalance` mit `cycleOf(b)` (Umzug erst T02);
      `src/render/errands.ts:255,333` `cycleOf(b) === undefined`, `:351` `/ cycleOf(b)!`. Bitgleich, solange `level`
      fehlt.
- [ ] **`save.ts`:** `SAVE_VERSION = 6`; `export function migrateV5ToV6(raw)` setzt `taxCarry = 0`, `upkeepCarry = 0`,
      `version = 6` (Doc: „`eff`/`level` fehlen = 256 000 bzw. Stufe 1"). In `deserialize` nach dem v4-Schritt
      `if (raw.version === 5) migrateV5ToV6(raw);` (`fromV4` und `deriveUnlocks` nach `isWellFormed` bleiben wie M10).
      Neu `isValidV6Fields(raw)` hinter `isValidV5Fields` in `isWellFormed`: `taxCarry` Ganzzahl 0 … `TAX_CARRY_DIVISOR − 1`,
      `upkeepCarry` 0 … `UPKEEP_INTERVAL − 1`; je Gebäude `state` ∈ `BUILDING_STATES` (lokale Liste
      `readonly BuildingState[]` mit allen 7 Werten, Setzung 13-7); `eff` nur bei `def.produces`, Ganzzahl
      0 … `EFF_WINDOW × EFF_MAX`; `level` nur bei `LEVELS[defId] !== undefined` und ∈ {2, 3} (mit leerem `LEVELS` ist
      jedes `level` ungültig, bis T07 füllt).
- [ ] **`defs/unlocks.ts`** (Spec 4, Anhang 01 A.5, nur P1-Teile): U3 `functions: ['orders', 'upgrade2']`, U5
      `functions: ['goodLocks', 'upgrade3']`; `FUNCTION_LABELS` + `upgrade2: ['Ausbau Stufe 2']`,
      `upgrade3: ['Ausbau Stufe 3']`; Tipp U3 + „ Betriebe lassen sich jetzt gegen Stoff ausbauen.", Tipp U5 + „ Ausbau
      Stufe 3 kostet Rum." (U2/U3-Gebäude und deren Sätze: T04). `FUNCTION_ENTRY` folgt von selbst.
- [ ] **`src/ui/texts.ts`** (nur `tsc`): in `stateInfo` vor `case 'noService'`:
      `case 'noForest': return { text: 'Kein freier Wald in der Nähe', ok: false };` (Text Anhang 01 E; sonst nichts in
      `src/ui/`).

## Schritt 4: Grün

```bash
npx vitest run tests/sim/defs.test.ts tests/sim/taxes.test.ts tests/sim/economy.test.ts tests/sim/balance-flow.test.ts \
  tests/sim/levels.test.ts tests/sim/imports.test.ts tests/sim/save.test.ts -t "M11"     # alle neuen grün
npx tsc --noEmit && npm run lint && npm run build
npx vitest run 2>&1 | grep -E "^ FAIL" | sort    # muss genau der Rotliste unten entsprechen
```

`make check` ist erst nach T03 grün (orga-11: Pins nach T01 rot, nur Protokoll). Testzählbefehl (index.md) ausführen:
jede Datei `nachher ≥ vorher`. Messung für das Ledger (Protokoll, kein Pin):
`VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-crises.test.ts --silent=false` (erwartet ohne Dämpfung: Ref Sieg
7250, `minMoney` 61, `endMoney` 250; Anhang 03 C Zeile `B`).

**Erwartete Rotliste nach T01 (16, alle für T03):** `balance-crises` M6:AK-B1-02, M8:AK-S1-15; `balance-merchants`
M8:AK-B1-01; `unlock-timeline` AK-B1-01 off und normal; `economy` „sums building upkeep and books it every 100 ticks";
`taxes` „always updates stats…", „books taxes and upkeep together…", RF-2 „Umschalten bei Tick 99…"; `merchants`
M8:AK-S1-04, -05, -10; `scenario-saves` AK-B2-04 krise-brand, krise-brand-geschuetzt; `unlocks` M10:AK-S1-01;
`tests/ui/goal.test.ts` M10:AK-U1-08 (Meldungstexte U3/U5). Jeder weitere rote Test: Stopp, Meldung an den Controller.

## Geänderte bestehende Tests (mechanisch, Save v6; Name bleibt)

| Datei :: Zeile                                                                 | Änderung                                                        |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `save.test.ts` :: 41, 46, 62, 283, 302, 323, 441, 463, 484, 505, 583, 605, 609 | `toBe(5)` → `toBe(6)` (Version)                                 |
| `save.test.ts` :: 100, 181, 406, 532, 685                                      | unbekannte Version `6` → `7`                                    |
| `save.test.ts` :: 289, 447                                                     | `slice(-5, -3)` → `slice(-7, -5)` (zwei neue Schlüssel am Ende) |
| `unlocks.test.ts` :: 112; `scenario-saves.test.ts` :: 480                      | `toBe(5)` → `toBe(6)`                                           |

Rot-Beleg dieser Zeilen: sie werden mit `SAVE_VERSION = 6` rot und mit der Änderung grün (kein Umschreiben der Aussage).
Alle übrigen roten Tests schreibt T03 um.

## Schritt 5: Doku

- [ ] `docs/arc42.md`: §5 Ebene 2 neue Zeile `levels.ts` („`cycleOf`, `upkeepOf`, `utilization`: einziger Leseort für
      Zyklus und Unterhalt"), Zeile `save.ts` „Version 6 … → v6 (`migrateV5ToV6`: Überträge 0)", Zeilen `population.ts`/
      `economy.ts` „Buchung je Schritt mit Übertrag"; §6 Tabelle `step` (Zeile „`tickTaxes`, `tickEconomy`") → „je Tick mit
      Übertrag `taxCarry`/`upkeepCarry`; `stats` bleiben Nominalwerte je 100 Ticks"; §8 „Persistenz" Kette bis v6,
      Prüfungen `taxCarry`, `upkeepCarry`, `eff`, `level`, `state`, Fixture `save-v5.json`; §12 „Bilanz" → „Rate je 100
      Ticks, Buchung je Tick".

## Schritt 6: Commit und Push

```bash
git add src tests docs/arc42.md
git commit -m "feat: M11-T01 Buchung je Tick mit Übertrag, Save v6, Naht cycleOf/upkeepOf (Spec 3.1, 5)"
git -C .worktrees/m11-sim push -u origin feat/m11-sim
```

## Risiken/Randfälle

- `cycleOf` gibt `number | undefined` zurück (wie `def.cycle`); Verbraucher in R1/T10/T11 prüfen auf `undefined`.
- `migrateV5ToV6` überschreibt `taxCarry`/`upkeepCarry` auch bei einem nachgebauten v4-Stand (`asV4` in `save.test.ts`
  löscht sie nicht): gewollt, Wert 0.
- RF-2 setzt `satisfiedSince = 0`, damit T02 (Wartezeit bis 600) den Test nicht rot macht.
- Die Rotliste ist im Plan-Prototyp (Scratchpad, M10-Code + S10) gemessen; weicht sie ab, zuerst Ursache klären.
