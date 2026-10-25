# T02 · Anker beim Bau, Caches, Heimat-Anlegestelle (S1, R3–R6)

Umsetzer `tech-sim-engineer` · ≈ 50 Tools · AK-HF-04, -05, -06, -07, -08; Gate-Randfall «Abriss, während ein Schiff dorthin fährt» · blocked-by: T01 · Worktree
`.worktrees/hafen-s1` · Spec §3.1, §4

## Dateien

- ändern: `src/sim/build.ts` (`placeBuilding` Zweig `kontor2`), `src/sim/types.ts` (Kommentar `Island.anchor`: veränderlich), `src/render/ship.ts` (**nur** `shipTile`),
  `src/ui/homeTravel.ts` (**nur** Cache-Schlüssel von `createLaneCache`), `tests/sim/seaHelpers.ts` (`foundKontor2Literal` spiegelt R3)
- Tests: `tests/sim/dock.test.ts`, `tests/render/ship.test.ts` (neu oder ergänzen), `tests/ui/homeTravel.test.ts` (nur AK-F2-Cache)
- Ausnahme Persona-Grenze (Index, Ownership): Render/UI nur die zwei genannten Stellen.

## Verhalten

- **R3/P-2:** Nach erfolgreichem Bau von `kontor2` auf Insel `i`:
  `isl.anchor = dockFor(isl.tiles.map(t => t.terrain), isl.width, isl.height, { x, y })` und danach `world.islands = world.islands.slice()` (neues Array → `seaRoute`-,
  `shipLane`- und UI-Caches fallen). Kein weiterer Zustand, kein Versionszähler.
- **R4:** `demolish` ändert den Anker nicht; `shipNeedsIsland` unverändert («Erst Route auflösen»).
- **R6:** `shipTile(world)` = `world.order === null ? null : home(world).anchor` (Kopie `{ x, y }`); Kommentar D-18 ersetzen. Heimat-Anker ist heute schon
  `homeAnchor(kontorSite)`; AK-HF-07 belegt, dass das bisherige «vordere Wasserfeld» auf Seeds 1–40 abweichen darf (Wechsel ist gewollt, R6).
- **UI-Cache:** `createLaneCache` keyt auf `world.islands` (`WeakMap<readonly Island[], Lane[]>`), Test AK-F2 «je Welt genau einmal» bleibt sinngemäss («je Inselliste»).
- **Test-Helfer:** `foundKontor2Literal(w, i)` setzt zusätzlich den Anker wie R3 und ersetzt `w.islands` (sonst weichen Literal- und Bauweg-Tests ab).

## Steps

- [ ] **Tests rot** in `tests/sim/dock.test.ts`, `describe('HAFEN S1 Anker folgt Kontor')`:
  - AK-HF-04: Seeds 1, 2, 3, 37, jede Fremdinsel, jeder `seaCoast`-gültige 2×2-Platz (`canPlace` ok; Geld per `w.money` hoch genug setzen ist erlaubt, nur im Test):
    nach `placeBuilding` gilt `anchor` = `dockFor(...)` und `hypot(anchor + 0,5 − (x + 1), anchor + 0,5 − (y + 1)) ≤ 2,2`. Laufzeit beachten: Welt je Seed einmal, Bau auf
    `structuredClone` (Zeit im Bericht, **Messung Last ≤ 4 nötig**, sonst «offen, Last x» melden; > 3 s → Plätze je Insel auf jeden dritten ausdünnen und begründen;
    neuer Test ≤ 500 ms nach R905, sonst ausdünnen; ab L2 kommen 4 × K2-Weltaufbau dazu, dafür steht der Test in der K2-Zeitliste, N-Datei §3).
  - AK-HF-05: Platz P bauen, abreissen → Anker unverändert; Platz Q ≠ P bauen → Anker = `dockFor(Q)`; ein gekauftes Schiff ohne Route mit `port = i`: `shipPose`
    (`src/render/shipLane.ts`, nur lesen) liegt danach am neuen Anker + 0,5.
  - AK-HF-06: `seaRoute(w.islands, 0, i)`, `lanePoints(w, 0, i)`, `laneTicks(w.islands, 0, i)` aufrufen (Caches gefüllt), Kontor II an einem Platz ≠ `kontorSite` bauen:
    letzter Punkt von `seaRoute(w.islands, 0, i)` und `lanePoints(w, 0, i)` = neuer Anker + 0,5; `laneTicks` = Wert einer frisch geladenen Kopie (`deserialize(serialize(w))`).
  - AK-HF-08: zwei Welten gleicher Seed, gleiche Baufolge → `JSON.stringify(w.islands.map(i => i.anchor))` und alle `seaRoute`-Punkte gleich.
  - Randfall (Gate 5): Schiff mit `to = i` unterwegs, Kontor II auf `i` abreissen → «Erst Route auflösen», Anker und Kontor bleiben.
- [ ] **Test rot** in `tests/render/ship.test.ts`, `describe('AK-HF-07 Heimat-Anlegestelle')`: Seeds 1–40 mit gesetztem `world.order` (aus einem Tick-Lauf bis
      `ORDER_FIRST_TICK` oder per Szenario-Helfer): `shipTile(w)` = Heimatanker; ohne Auftrag `null`. Rot-Beleg: Seeds, bei denen das alte Feld abweicht (Zahl im Bericht; ist
      sie 0, Rot-Beleg über Welt mit verschobenem Anker per Test-Terrain).
- [ ] **Lauf rot:** `npx vitest run tests/sim/dock.test.ts tests/render/ship.test.ts tests/ui/homeTravel.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten.
- [ ] **Lauf grün** plus Kandidatenliste (T00). Erwartete Rotstellen: Tests, die Kontor II per `placeBuilding` am `kontorSite` bauen und Fahrzeiten pinnen, wo
      `dockFor(kontorSite) ≠ homeAnchor(kontorSite)` (Index, Risiken). Je Rotstelle: Testname, alter/neuer Wert, Ursache; Neu-Pin nur mit Kommentar «HAFEN S1 R3, E4/R913».
- [ ] Teilbeleg laut Index.
- [ ] **Commits:** `feat: Anker folgt Kontor II, Caches per neuem Inselarray (HAFEN S1, AK-HF-04..08)`; Neu-Pins als eigener Commit `test: …` mit Begründung je Test.

## Bericht

Exit-Codes; Rot-Ausgaben; Liste der Neu-Pins (Name, alt → neu); Laufzeit `dock.test.ts` (ms je Test, **Last ≤ 4 nötig**, Lastwert dazu); Seeds mit `shipTile`-Wechsel. Danach D1 per `SendMessage` (Datei `D-doku.md`).
