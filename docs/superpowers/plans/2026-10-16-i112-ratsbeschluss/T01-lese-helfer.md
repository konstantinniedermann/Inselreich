# T01 · Lese-Helfer und Umstellung aller Leser (reiner Umbau, bitgleich)

`tech-sim-engineer` · ≈ 55 Tools · Auflage R706 (a), AK 10 (Wächter-Teil) · blocked-by: T00 · Test zuerst (rot vor Umsetzung)
Ownership-Ausnahme (R711 R-5; genau die 7 Dateien der Dateimatrix, `balancePreview.ts` und `texts.ts` gehören nicht dazu; findet T00 weitere UI-Leser, nicht selbst erweitern, sondern zurück an den Controller): die genannten Leser-Zeilen in `src/ui/` gehören in diesem Task dem Sim-Umsetzer, damit `tsc` grün bleibt.

## Ziel

Jeder Lesezugriff auf einen Hebel-Wert läuft über genau einen Helfer. In T01 liefern die Helfer exakt den Def-Wert (kein `council` nötig);
T04 ändert nur ihre Rümpfe. Spielverhalten, Texte und Balancing bleiben bitgleich.

## Helfer (neu, `src/sim/council.ts`, Blatt: importiert nur `./types`, `./defs/buildings`, `./defs/tiers`)

- `serviceRadiusOf(world: World, defId: BuildingDefId): number | undefined` → `BUILDING_DEFS[defId].serviceRadius`
- `maxInhabitantsOf(world: World, tier: Tier): number` → `TIERS[tier].maxInhabitants`
- `councilCycle(world: World, defId: BuildingDefId, cycle: number): number` → `cycle`
- `levels.ts`: `effectiveCycle(world, island, defId, cycle) = islandCycle(world, island, defId, councilCycle(world, defId, cycle))`;
  `cycleOf` ruft `effectiveCycle`. `islandCycle` bleibt exportiert (nur noch von `effectiveCycle` und Tests genutzt).
- `world` ist in T01 ungenutzt: Parameter `_world` oder ESLint-konform verwendet; Doc-Kommentar «Einziger Leseort (R706 a)».

## Fundstellen (main `21f37b82`; T00 aktualisiert die Zeilen)

`maxInhabitants` (Wert-Leser):

| Fundstelle                                                     | Umstellung                                                                                                                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/sim/flow.ts:66` `upgradeDelta(house)`                     | Signatur `upgradeDelta(world, house)`; Aufrufer `population.ts:181`, `flow.ts:91`, `flow.ts:107`, `tests/sim/flow.test.ts:104–108`                           |
| `src/sim/population.ts:140` `upgradeStatus`                    | `maxInhabitantsOf(world, house.tier)`                                                                                                                        |
| `src/sim/population.ts:200` `tierCap(tier, level)`             | `tierCap(world, tier, level)`; Aufrufer `houseCap`, `src/ui/taxView.ts:35`, `tests/sim/save.test.ts:1896–1898`                                               |
| `src/sim/unlocks.ts:46` `unlockText(def, field)`               | `unlockText(world, def, field)`; Aufrufer `unlocks.ts:77/78/181`, `src/ui/guide.ts:46`, `tests/sim/upgrade.test.ts:145/152`, `tests/sim/unlocks.test.ts:121` |
| `src/sim/unlocks.ts:60` `fulfilled` (tierWish)                 | Helfer                                                                                                                                                       |
| `src/sim/unlocks.ts:153` `progress` (tierWish)                 | Helfer                                                                                                                                                       |
| `src/ui/inspect.ts:499` `deficitLine`                          | Helfer                                                                                                                                                       |
| `src/ui/guide.ts:147` volle Häuser                             | Helfer                                                                                                                                                       |
| `src/ui/hover.ts:95` `houseInfo`                               | Helfer                                                                                                                                                       |
| `src/ui/panelView.ts:202` `houseTiles(b)`                      | `houseTiles(world, b)`; Aufrufer `inspect.ts:520`, `tests/ui/panelView.test.ts:214/222/233`                                                                  |
| `src/ui/panelView.ts:291` `riseCard` (jetzt und nächste Stufe) | Helfer (`_world` wird `world`)                                                                                                                               |
| `src/ui/taxView.ts:35` über `tierCap`                          | `tierTaxTooltip(world, tier, level)`; Aufrufer `inspect.ts:681`, `tests/ui/taxView.test.ts:109`                                                              |
| `src/ui/balancePreview.ts:56` über `houseCap`                  | bereits richtig (nach `tierCap`-Umstellung)                                                                                                                  |

`serviceRadius` (Wert-Leser):

| Fundstelle                                            | Umstellung                                                                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/sim/population.ts:68` `serviceAvailable`         | `serviceRadiusOf(world, b.defId) ?? 0`                                                                   |
| `src/sim/feast.ts:87` `inChapelRadius(chapel, house)` | `inChapelRadius(world, chapel, house)`; Aufrufer `feast.ts:45/95`                                        |
| `src/sim/crises.ts:181` `isProtected` (Wache)         | Helfer (einheitlich, obwohl kein Hebel)                                                                  |
| `src/sim/queries.ts:157` `coverageSources`            | Helfer (nur `serviceRadius`-Zweig)                                                                       |
| `src/sim/queries.ts:189` `placementZone`              | `def.supplyRadius ?? serviceRadiusOf(world, defId)`                                                      |
| `src/ui/hover.ts:160` Dienst-Zählung                  | Helfer                                                                                                   |
| `src/ui/buildMenu.ts:92` `crisisTooltipLines(defId)`  | `crisisTooltipLines(defId, world?)`; ohne Welt Def-Wert über `serviceRadiusOf` mit Def-Fallback nur dort |
| `src/ui/buildMenu.ts:153` Werkzeug-Tooltip            | `world !== undefined ? serviceRadiusOf(world, def.id) : def.serviceRadius`, `?? def.supplyRadius`        |

Takt (`cycle`, Wert-Leser): `levels.ts:32–35` (`cycleOf`, s. oben) · `src/ui/islandCard.ts:65` und `src/ui/panelView.ts:237/331` → `effectiveCycle`
· `src/ui/buildMenu.ts:138–149` (Erzeugt, Ausstoss je Stufe, Braucht) → `councilCycle(world, def.id, c)` wenn `world` vorhanden
· `src/ui/texts.ts:36` Default `def.cycle`: Aufrufer übergeben `cycleOf` (bereits so in `inspect`); Default bleibt für Tests.

Keine Wert-Leser, bleiben (im Wächter erlaubt): `roads.ts:59`, `render/overlays.ts:128`, `panelView.ts:144` (nur `!== undefined`),
`levels.ts:33` (Grundtakt-Existenz in `cycleOf`), `defs/*`. Test-Helfer (`tests/sim/controller.ts`, `merchantsController.ts`, `scenarios.ts`,
`helpers.ts:656`) lesen Defs als Orakel bzw. Startzustand; sie bleiben, weil der Controller nie beschliesst (R-1).

## Wächter-Test `tests/sim/leverReads.test.ts` (neu, zuerst, rot belegen)

Scannt rekursiv `src/**/*.ts` (Vorbild `tests/sim/imports.test.ts`, `readFileSync`) nach `\.maxInhabitants\b`, `\.serviceRadius\b`,
`islandCycle\(` und `\bdef\.cycle\b` bzw. `\.cycle\b` auf Defs. Erlaubt: `src/sim/council.ts`, `src/sim/levels.ts` (nur `effectiveCycle`,
`cycleOf`, `islandCycle`-Definition), `src/sim/defs/**`, `src/sim/types.ts` und die Existenz-Prüfungen oben als explizite Liste
`{ datei, muster }`. Meldung nennt Datei:Zeile. Rot vor dem Umbau (Ausgabe mit der Zahl der Treffer in den Bericht).
Allowlist als explizite `{ datei, muster, grund }`-Liste, je Eintrag mit Begründung (B-8). Negativtest: eine Probe-Zeichenkette mit `def.cycle` bzw. `.maxInhabitants` wird vom Scanner tatsächlich gemeldet (Schutz gegen ein totes Muster); Scanner auf `src/` begrenzt.

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index (tsc, lint, zeittests, conflicts) · `npx vitest run tests/sim tests/ui; echo EXIT=$?` ·
`npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` (bitgleich, keine Zahl geändert) · `git diff --stat main -- src/sim/defs src/sim/save.ts src/sim/types.ts` leer.
Commit `refactor: Lese-Helfer für Takt, Dienst-Reichweite und Hausgrösse (I-112)`.
