# Anhang 01 — Werte je Zieldatei, Typen, Tick-Ablauf (Spec M11)

Gehört zu [Spec M11](../2026-10-03-m11-wirtschaft-im-fluss-spec.md). Werte aus dem Vorschlag (Anhang 01 Bilanzen,
`design-economy-designer`) und dem S12-Design; hier nicht neu gerechnet. **Setzung Spec** und **M10-Schnittstelle**
wie in der Hauptdatei. Raten je 100 Ticks, 1 min = 600 Ticks bei 1×.

## A. `src/sim/defs/` — Werte je Datei

### A.1 `defs/timing.ts` (P1, P2)

| Konstante                     | Wert | Bedeutung                                                                     | Paket |
| ----------------------------- | ---- | ----------------------------------------------------------------------------- | ----- |
| `UPKEEP_INTERVAL` (bestehend) | 100  | Teiler des Unterhalts-Übertrags; Takt des `coin`-Tons (UI, unverändert)       | —     |
| `UPGRADE_DEFICIT_WAIT_FACTOR` | 2    | Faktor auf `upgradeWait` bei prospektivem Defizit (Rückfall: 1 = heute)       | P1    |
| `EFF_WINDOW`                  | 256  | Glättungsfenster der Auslastung (Ticks, Zeitkonstante)                        | P1    |
| `EFF_MAX`                     | 1000 | Auslastung voll (Promille); gespeicherter Höchstwert = `EFF_WINDOW × EFF_MAX` | P1    |

### A.2 `defs/tiers.ts` (P1)

| Konstante                 | Wert                                        | Bedeutung                                                    |
| ------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| `TAX_UNIT` (neu)          | 2                                           | Nenner der Halbierung bei unerfüllten Bedürfnissen           |
| `UNSATISFIED_TAX_FACTOR`  | `1 / TAX_UNIT` (= 0,5, Wert wie heute)      | bleibt Leseort für UI und `totalTaxes`                       |
| `TAX_CARRY_DIVISOR` (neu) | `UPKEEP_INTERVAL × 100 × TAX_UNIT` = 20 000 | Teiler des Steuer-Übertrags (100 = Prozent-Nenner von `pct`) |

**Abweichung** Vorschlag 3 (Ort `defs/timing.ts`): `tiers.ts` importiert `timing.ts` schon (`UPGRADE_WAIT`); der
Divisor in `timing.ts` bräuchte `UNSATISFIED_TAX_FACTOR` aus `tiers.ts` (Importzyklus der Defs). Wert unverändert.

### A.3 `defs/buildings.ts` (P2)

| Feld            | `hunter` (Jagdhütte)                                                      | `cattlefarm` (Rinderfarm)                                                |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `name`          | `'Jagdhütte'`                                                             | `'Rinderfarm'`                                                           |
| `w × h`         | 1 × 1                                                                     | 2 × 2                                                                    |
| `cost`          | `{ money: 50, wood: 2, tools: 1, stone: 0 }`                              | `{ money: 250, wood: 15, tools: 3, stone: 0 }`                           |
| `upkeep`        | 5                                                                         | 10                                                                       |
| `category`      | `'production'`                                                            | `'production'`                                                           |
| `produces`      | `'food'`                                                                  | `'food'`                                                                 |
| `consumes`      | —                                                                         | —                                                                        |
| `cycle`         | 50 (2,0 Nahrung je 100 Ticks)                                             | 20 (5,0)                                                                 |
| `stormAffected` | fehlt (sturmfest)                                                         | `true`                                                                   |
| `flammable`     | `true` (**Setzung Spec**: wie jeder Betrieb)                              | `true`                                                                   |
| `site`          | `[{ kind: 'radius', terrain: 'forest', radius: 3, min: 10, free: true }]` | `[{ kind: 'radius', terrain: 'grass', radius: 3, min: 16, free: true }]` |

- Reihenfolge in `BUILDING_DEFS` (**Setzung Spec**, bestimmt die Bauleiste): `hunter`, `cattlefarm` direkt nach
  `fisher`. `BuildingDefId` erhält beide am Ende der Union (nach M10 `townhall`).
- **Holzfäller** (S3, Variante A): `lumberjack.site` = `[{ kind: 'radius', terrain: 'forest', radius: 2, min: 1,
free: true }]` — A9 ist belegt (Anhang 03 B); Rückfall Variante C
  (`lumberjack.site` unverändert ohne `free`; die Live-Prüfung zählt bei jeder Wald-Regel nur freie Kacheln;
  M-09).
- Kennzahlen (Prüfwerte für AK-P2S2-01): Einwohner je Bau = (100 / `cycle`) / 0,5 → 5 / 4 / 10;
  Geld je Einwohner über 6000 Ticks = `cost.money` / EW + `upkeep` × 60 / EW → Fischer 80, Jagdhütte 87,5,
  Rinderfarm 85.

### A.4 `defs/levels.ts` (neu; P1 leer, P3 füllt; **Abweichung** S12 3.1, R185)

```ts
export interface LevelDef {
  cycle: number; // ganzzahlig
  upkeep: number; // ganzzahlig, je 100 Ticks
  cost: Cost; // Geld, Holz, Werkzeug, Stein (sofort bezahlt)
  fee: { good: GoodId; amount: number }; // Gebührenware, nicht erstattet
}
/** Index 0 = Stufe 2, Index 1 = Stufe 3. Fehlt ein Eintrag: Betrieb nicht ausbaubar. */
export const LEVELS: Readonly<Partial<Record<BuildingDefId, readonly [LevelDef, LevelDef]>>>;
```

| `defId`      | Basis Zyklus / Unterhalt | Stufe 2: `cycle`, `upkeep`, `cost` (G/H/W/S), `fee` | Stufe 3: `cycle`, `upkeep`, `cost`, `fee` |
| ------------ | ------------------------ | --------------------------------------------------- | ----------------------------------------- |
| `fisher`     | 40 / 5                   | 24, 7, 50/3/1/0, 2 `cloth`                          | 16, 9, 75/4/2/0, 2 `rum`                  |
| `hunter`     | 50 / 5                   | 30, 7, 25/1/1/0, 2 `cloth`                          | 20, 9, 38/2/1/0, 2 `rum`                  |
| `cattlefarm` | 20 / 10                  | 12, 13, 125/8/2/0, 3 `cloth`                        | 8, 17, 188/12/3/0, 3 `rum`                |
| `lumberjack` | 30 / 5                   | 18, 7, 25/0/1/0, 2 `cloth`                          | 12, 9, 38/0/1/0, 2 `rum`                  |
| `quarry`     | 60 / 10                  | 36, 13, 75/5/2/0, 2 `cloth`                         | 24, 17, 113/8/3/0, 2 `rum`                |
| `sheepfarm`  | 50 / 10                  | 30, 13, 75/5/1/0, 3 `cloth`                         | 20, 17, 113/8/2/0, 3 `rum`                |
| `canefarm`   | 50 / 10                  | 30, 13, 75/5/1/0, 3 `cloth`                         | 20, 17, 113/8/2/0, 3 `rum`                |
| `weaver`     | 50 / 15                  | 30, 20, 100/8/2/0, 3 `cloth`                        | 20, 26, 150/12/3/0, 3 `rum`               |
| `toolmaker`  | 80 / 25                  | 48, 33, 100/8/2/0, 3 `cloth`                        | 32, 43, 150/12/3/0, 3 `rum`               |
| `distillery` | 50 / 20                  | 30, 26, 125/8/2/3, 3 `cloth`                        | 20, 34, 188/12/3/4, 3 `rum`               |
| `glassworks` | 50 / 25                  | 30, 33, 150/10/3/5, 3 `cloth`                       | 20, 43, 225/15/5/8, 3 `rum`               |

Rückfall Jagdhütte (nur nach Playtest, Ruling): `fee.amount` 1 / 1 statt 2 / 2.

### A.5 `defs/unlocks.ts` (M10-Schnittstelle; P1 Funktionen, P2 Gebäude)

| Eintrag | Änderung                                                 | Paket   |
| ------- | -------------------------------------------------------- | ------- |
| U2      | `buildings` + `hunter` (Reihenfolge wie `BUILDING_DEFS`) | P2      |
| U3      | `buildings` + `cattlefarm`; `functions` + `upgrade2`     | P2 / P1 |
| U5      | `functions` + `upgrade3`                                 | P1      |

- `UnlockFunction` (types) + `'upgrade2' | 'upgrade3'` (P1). `FUNCTION_LABELS`: `upgrade2: ['Ausbau Stufe 2']`,
  `upgrade3: ['Ausbau Stufe 3']` (P1). `FUNCTION_ENTRY` folgt automatisch (U3, U5).
- `tip` (**Setzung Spec**, je ein Satz angehängt, ohne „Tick"): U2 „Die Jagdhütte liefert Nahrung aus dem Wald; sie
  braucht 10 freie Waldfelder im Umkreis." (P2) · U3 „Die Rinderfarm braucht viel freie Weide." (P2) und „Betriebe
  lassen sich jetzt gegen Stoff ausbauen." (P1) · U5 „Ausbau Stufe 3 kostet Rum." (P1).
- `deriveUnlocks` (`src/sim/unlocks.ts`, P3, **Setzung Spec**): zusätzlich U3, wenn ein Betrieb `level ≥ 2` hat, und
  U5, wenn einer `level 3` hat (ohne Kette, wie Gebäude, M10 4.2).

## B. Typen (`src/sim/types.ts`, P1 ausser `BuildingDefId`)

```ts
export type BuildingState = /* bestehend inkl. M10 'noService' */ 'noForest';
export type SiteRule = /* bestehend */ {
  kind: 'radius';
  terrain: Terrain;
  radius: number;
  min: number;
  free?: true;
};
export interface Building {
  /* bestehend */
  eff?: number; // nur Betriebe mit `produces`; Ganzzahl 0 … EFF_WINDOW × EFF_MAX (256 000); fehlt = 256 000
  level?: 2 | 3; // nur Betriebe mit LEVELS-Eintrag; fehlt = Stufe 1
}
export interface World {
  version: 6; // war 5 (M10)
  /* bestehend */
  taxCarry: number; // Ganzzahl 0 … TAX_CARRY_DIVISOR − 1 nach jeder Buchung
  upkeepCarry: number; // Ganzzahl 0 … UPKEEP_INTERVAL − 1 nach jeder Buchung
}
```

`BuildingDefId` + `'hunter' | 'cattlefarm'` (P2). `createWorld`: `version 6`, `taxCarry 0`, `upkeepCarry 0`.

## C. Neue und geänderte Funktionen

| Funktion (Datei)                                         | Paket | Vertrag                                                                                                                                                        |
| -------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cycleOf(b)`, `upkeepOf(b)` (`src/sim/levels.ts`, neu)   | P1    | Stufe 1: `def.cycle` / `def.upkeep`; sonst `LEVELS[defId][level − 2]`. Einziger Leseort für Zyklus und Unterhalt in `src/sim/` und `src/render/`               |
| `utilization(b)` (`src/sim/levels.ts`)                   | P1    | `Math.floor((b.eff ?? 256 000) / EFF_WINDOW)` in Promille 0 … 1000; `null` ohne `produces`                                                                     |
| `taxUnits(world)` (`population.ts`)                      | P1    | Σ über Häuser `EW × tier.tax × (allNeedsMet ? TAX_UNIT : 1)`, dann × `TAX_LEVELS[taxLevel].pct`; ganzzahlig                                                    |
| `tickTaxes(world)` (`population.ts`)                     | P1    | `stats.taxes = totalTaxes(world)` (wie heute, Anzeige); `taxCarry += taxUnits`; bucht `floor(taxCarry / 20 000)`, zieht das × 20 000 ab                        |
| `totalUpkeep(world)` (`economy.ts`)                      | P1    | Σ `upkeepOf(b)`                                                                                                                                                |
| `tickEconomy(world)` (`economy.ts`)                      | P1    | `stats.upkeep = totalUpkeep`; `upkeepCarry += stats.upkeep`; bucht `floor(upkeepCarry / 100)`, zieht das × 100 ab                                              |
| `goodsBalance(world)` (nach `src/sim/flow.ts`)           | P1    | Inhalt wie heute, aber `cycleOf`; `queries.ts` re-exportiert unverändert; Versorgung über `inSupplyRange` (`supply.ts`) statt `isSupplied` (kein Importzyklus) |
| `upgradeDelta(house)` (`flow.ts`)                        | P1    | je Gut der Zielstufe `maxEW(Ziel) × rate_Ziel − EW × rate_jetzt` (rate_jetzt 0, wenn nicht Bedarf)                                                             |
| `deficitGood(budget, house)` (`flow.ts`)                 | P1    | erstes Gut in `GOOD_IDS`-Reihenfolge mit `budget[g] − Δ[g] < −1e-9`, sonst `null`                                                                              |
| `upgradeDeficit(world, b)` (`flow.ts`)                   | P1    | für UI: `{ good, net }` mit `net = goodsBalance − Δ` oder `null`                                                                                               |
| `upgradeStatus`, `tryUpgrade` (`population.ts`)          | P1    | Wartezeit `wait × (deficitGood ? UPGRADE_DEFICIT_WAIT_FACTOR : 1)`; Grund wie heute mit der wirksamen Zahl                                                     |
| `siteRuleOk(world, defId, x, y, rule)` (`placement.ts`)  | P2    | bisher `checkRule`, exportiert; `free` zählt nur Kacheln mit `buildingId === null && !road` ausserhalb des eigenen Grundrisses                                 |
| `upgradeBuilding(world, id)` (`src/sim/upgrade.ts`, neu) | P3    | `{ ok, reason }`, wirft nie; Reihenfolge und Texte Hauptdatei 3.6                                                                                              |
| `paidCost(b)` (`upgrade.ts`)                             | P3    | `def.cost` + Summe der `cost` der bezahlten Stufen (ohne `fee`); `demolish` erstattet `refundCost(paidCost(b))`                                                |

## D. Tick-Ablauf `step` nach M11 (Reihenfolge unverändert, nur Inhalt)

1. `tick += 1`.
2. `tickProduction`: je Betrieb mit `produces` in Objektreihenfolge: Ausfall → `burning`; nicht angebunden →
   `notConnected`; M10 `requiresService` → `noService`; **neu** Standortregel mit `terrain: 'forest'` verletzt →
   `noForest` (kein Fortschritt, keine Entnahme, `progress` bleibt); Sturm-Aussetzer (Zustand bleibt); Input →
   `waitingInput`; Fortschritt mit `cycleOf(b)`; Ausstoss. **Danach in jedem Zweig:** `eff = eff − floor(eff / 256)
   - Ziel`, Ziel 1000, wenn in diesem Tick `progress`gestiegen ist und`state === 'ok'`, sonst 0.
3. `tickPopulation`: Ist `tick % GROWTH_INTERVAL === 0`, rechnet sie **einmal vor der Häuserschleife** `budget =
goodsBalance(world)` (net je Gut). Je Haus wie heute; `tryUpgrade` nutzt `deficitGood(budget, house)`; ein
   **erfolgreicher** Aufstieg zieht sein Δ von `budget` ab (Gebäudereihenfolge, deterministisch).
4. `tickTaxes` (Übertrag), 5. `tickEconomy` (Übertrag), 6. `tickMarket`, 7. `tickOrders`, 8. `tickCrises`, 9. `checkWin`, 10. `tickUnlocks` (M10-Schnittstelle, letzter Aufruf).

Buchung heute nur bei `tick % 100 === 0`; neu in jedem Schritt. `stats.taxes` und `stats.upkeep` bleiben Nominalwerte
je 100 Ticks (HUD-Bilanz).

## E. Texte (Setzung Spec, deutsch, ohne „Tick" in UI-Texten)

| Stelle                                          | Text                                                                                                                                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `radiusReason` mit `free`                       | „Zu wenig freier Wald in der Nähe" / „Zu wenig freie Weide in der Nähe"                                                                                                      |
| `stateInfo` `noForest`                          | „Kein freier Wald in der Nähe"                                                                                                                                               |
| Panel Auslastung                                | „Auslastung {p} %", p = `floor(utilization / 10)`                                                                                                                            |
| Panel Stufe                                     | „Stufe {n}" (n = `level ?? 1`), nur bei `LEVELS`-Eintrag                                                                                                                     |
| Ausbau-Abschnitt                                | „Ausbau zu Stufe {n}"; „Ausstoss {a} → {b} / min · Unterhalt {c} → {d} / min"                                                                                                |
| Ausbau-Gründe (`upgradeBuilding`)               | „Höchste Stufe erreicht", „Kann nicht ausgebaut werden", „Gebäude brennt", „Zu wenig Stoff", „Zu wenig Rum", übrige aus `checkAfford`                                        |
| Dämpfung im Haus-Panel                          | „{Gut}-Bilanz negativ — Aufstieg verzögert; Vorrat reicht noch {X} Minuten" (X ≥ 60: „über 60 Minuten"; X = 0 bei Lager > 0: „weniger als 1 Minute"; Lager 0: „Vorrat leer") |
| R161 im Haus-Panel                              | bei Grund „Zu wenig Stein" und ≥ 1 Glashütte zusätzlich: „Die Glashütte verbraucht ebenfalls Stein — baue weitere Steinbrüche."                                              |
| Mouse-over Betrieb (M10 §13, M10-Schnittstelle) | „{Name}, Stufe {n} · Auslastung {p} %"                                                                                                                                       |

X = `floor(stock[g] / (−net) / 6)` mit `net` je 100 Ticks aus `upgradeDeficit` (600 Ticks = 1 min).
