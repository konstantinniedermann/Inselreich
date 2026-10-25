# T03 Wirkungen an den Leseorten

Persona `tech-sim-engineer` · Strang A · Tools ≈ 70 · AK-BS-10 (ohne Erntefest), AK-BS-11 (Haus), AK-BS-13, AK-BS-14 · blocked-by T02. **Last ≤ 4 nötig** (Wand-an-Wand-Messung).

**Files:** Modify `src/sim/population.ts`, `src/sim/flow.ts`, `src/sim/levels.ts`, `src/sim/economy.ts`, `src/sim/production.ts`, `src/sim/trade.ts`, `src/sim/ships.ts`, `src/sim/queries.ts`, `src/sim/petitions.ts` (Kappung bei Ablauf), `src/sim/petitionEffect.ts` (nur falls nötig), `tests/sim/petitions.test.ts`, `tests/sim/petitionsRuns.test.ts`. Create `tests/sim/petitionsHarmless.test.ts`.

## Interfaces

- Consumes (T01): `overcrowdCap`, `needRate`, `petitionCycle`, `storageCap`; (T02) `tickPetitions`, `answerPetition`, `PetitionEvent`.
- Produces: Signatur `addStock(isl: Island, good: GoodId, n: number, cap: number = STORAGE_CAP): number` (P-5); sonst keine neue API.

## Leseorte (je genau einer, Spec §3.5, P-3 bis P-5)

| Wirkung     | Ort                                                                                                      | Einbau                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `overcrowd` | `tickPopulation`, Wachstumsschritt                                                                       | `const cap = overcrowdCap(world, b.island, house.tier, houseCap(world, house))`; `houseCap` bleibt (P-3)                |
| `frugal`    | `consume` und `goodsBalance` (Häuser)                                                                    | Rate `needRate(world, b.island, good, rate)` statt `rate` (P-4)                                                         |
| `cycle`     | `cycleOf` in `levels.ts`                                                                                 | `petitionCycle(world, b.island, b.defId, effectiveCycle(…))`; `effectiveCycle` bleibt unverändert                       |
| `storage`   | `addStock` (Produktion), `trade.ts` Kauf (Prüfung und Einlagern), `ships.ts` `unload`, `queries.ts` Raum | Grenze `storageCap(world, island, good)` statt `STORAGE_CAP`                                                            |
| Ablauf B9   | `tickPetitions` (a)                                                                                      | nach Entfernen der Wirkung: Bestand jeder `goods`-Ware auf HOME über `storageCap` (neu) abschneiden, Menge in `spoiled` |

Keine weiteren Stellen. `tests/sim/imports.test.ts` (Kreisfreiheit, PLAN-NAHT für `cycle`) bleibt grün; meldet PLAN-NAHT `petitionEffect.ts` als direkten Leser von `cycle`, nimm die Datei in die Ausnahmeliste dort auf (gleiches Muster wie `levels.ts`) und nenne es im Bericht.

## Schritte

- [ ] **Tests zuerst** (`tests/sim/petitions.test.ts`, Wirkungen als Einträge in `effects` gesetzt oder über `answerPetition` erzeugt):
  - `AK-BS-10 Stapeln`: zwei B1-Wirkungen überlappend → Haus Stufe 4 wächst bis 23, nicht 26 (versorgtes Haus, Wachstumstakte laufen lassen). B1 und B8 zugleich → 15 % (23). Zwei Taktlöhne B7 → `cycleOf` = ⌊c × 80 / 100⌋, nicht × 64. Nach `until` gilt wieder cap, das Haus gibt −1 je Wachstumstakt ab. B9: Stoff 117 bei Ablauf → 100, Ereignis `ended` mit `spoiled.cloth === 17`.
  - `Zuwachs`: versorgtes Haus Stufe 4 mit 20 → 23 in 3 Wachstumstakten; unversorgtes wächst nicht (Spec §3.5).
  - `Fremdinsel (Review Focus 1)`: Haus auf Insel 1 mit B1-Wirkung bleibt bei cap; Genügsamkeit auf Stoff ändert den Verbrauch auf Insel 1 nicht; `storageCap(w, 1, 'cloth') === STORAGE_CAP`. B6 (`spicefarm`, `homeOnly: false`) wirkt auf Insel 1.
  - `Genügsamkeit`: «Nein» auf B1 → Stoff-Verbrauch eines Hauses über 1800 T ist 90 % (± 1 Einheit, ganzzahlige Entnahme) des Referenzlaufs; `goodsBalance(w).cloth.consumed` sinkt auf 90 % (P-4).
  - `Lager 120`: mit B9 nimmt Produktion, Kauf (`buy` liefert nicht «Lager voll» bei 110) und Entladen bis 120 auf; ohne Wirkung bleibt alles bei 100.
  - `AK-BS-11 Haus`: überbelegtes Haus abgerissen → übrige Häuser unverändert, kein Wurf, nächster Wachstumstakt zählt es nicht.
  - `AK-BS-14`: Haus Stufe 4 mit 23 Bewohnern unter Überbelegung zählt 23 in `merchants` und `spiceMerchants`; konstruierte Welt mit 3 × 23 + 11 = 80 versorgten Kaufleuten (`wonMerchants` gesetzt, Gewürzschleife wie in den bestehenden `goal3`-Tests) setzt nach 600 T Haltezeit `wonSpice`.
- [ ] **Langlauf** in `tests/sim/petitionsRuns.test.ts`: `AK-BS-10 60 000 T`: Welt mit Ketten auf ü ≈ 20 % (Aufbau wie T02-Folge), jede Karte mit «Ja», wenn `ok`; jeder Tick: kein Haus über `houseCap + ⌊(houseCap × 15 + 50) / 100⌋`.
- [ ] **`tests/sim/petitionsHarmless.test.ts` `AK-BS-13`** (Spec, Volltext Anhang 03 §5): zwei feste Welten ohne Controller nach Ziel 1 (`won` gesetzt), (a) versorgt (ü ≥ 0), (b) knapp (eine Kette ü < 0); je Lauf «an, nie Antwort» gegen «aus», 60 000 T, je Fenster 6000 T. (a) Einwohner je Tick gleich, Geld am Fensterende ≥ Referenz, Krisenfolge gleich; (b) Σ Einwohner-Ticks und Geld je Fenster ≥ 99 % der Referenz, über alle Fenster ≥ Referenz. Ereignisse nur `drawn`, `timeout`, `lament`, `ended`. Dauer < 30 s.
- [ ] Rot: `npx vitest run tests/sim/petitions.test.ts tests/sim/petitionsRuns.test.ts tests/sim/petitionsHarmless.test.ts; echo EXIT=$?`.
- [ ] Umsetzen (Tabelle oben).
- [ ] **Baseline bitgleich:** `npx vitest run tests/sim/balance.test.ts tests/sim/balance-crises.test.ts tests/sim/balance-merchants.test.ts <weitere aus T00-Liste>; echo EXIT=$?`, ohne Änderung an Test, Controller oder Baseline.
- [ ] **Leistung, Wand an Wand (Muster I-201 P-7):** Base-Worktree `.worktrees/i210-base` (detached auf `git merge-base main HEAD`). Abwechselnd je 3 Läufe `npx vitest run tests/sim/balance.test.ts` auf Base und Branch, jeder Lauf nach `make messfenster; echo EXIT=$?` = 0. Ins Ledger: Median je Seite und Last je Lauf. **Schwelle +10 %** → prüfen, ob jede Abfrage bei leeren `effects` vor jeder Schleife zurückkehrt (T01-Regel), dann erneut messen; bleibt es darüber, Befund an den Controller.
- [ ] Teilbeleg: obige Dateien, `npx vitest run tests/sim/imports.test.ts tests/sim/population.test.ts tests/sim/trade.test.ts tests/sim/ships.test.ts; echo EXIT=$?` (vorhandene Dateien), `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] Commit `feat: I-210 Wirkungen Überbelegung, Genügsamkeit, Takt und Lager`.
