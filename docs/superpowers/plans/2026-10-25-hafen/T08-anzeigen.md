# T08 · Anzeigen aus derselben Quelle (S3, R14)

Umsetzer `tech-ui-engineer` · ≈ 30 Tools · AK-HF-21 · blocked-by: T07 · Worktree `.worktrees/hafen-route` · Spec §3.3 R14

## Dateien

- ändern: `src/ui/homeTravel.ts`, `src/ui/islandCard.ts`, `src/ui/farOrder.ts` (nur Aufrufe, falls die Signatur sich ändert), `src/sim/islands.ts` (**nur** Entfernen von
  `travelTicks`/`travelTicksOf`, nachdem kein Leser mehr übrig ist)
- Tests: `tests/ui/homeTravel.test.ts`, `tests/ui/islandCard.test.ts`, `tests/ui/farLate.test.ts` (falls rot)
- nicht ändern: Sim-Regeln, `src/render/seaMap.ts` (liest nur `lanePoints`/`shipPose`, keine Fahrzeit — geprüft beim Plan)

## Verhalten

- `homeTravelTicks(world, island)` = `island === HOME || !world.islands[island] ? null : laneTicksOf(world, HOME, island)`; `null`, wenn `laneTicksOf` 0 liefert.
- `islandCard`: Fahrzeit aus `homeTravelTicks` (eine Quelle, DRY); `formatGameTime` wie heute.
- `createLaneCache`/`homeLane`: bleiben nur, solange ein Leser `Lane.d` braucht; sonst entfernen. Der Zähler-Test AK-F2 («seaLanes je Welt genau einmal») wird auf die neue
  Quelle umgestellt: zweiter Aufruf derselben Inselliste rechnet keine Route neu (Zähler über injizierbaren Rechner oder `seaRoute`-Cache-Wächter) — Absicht des Tests bleibt.
- `travelTicks`, `travelTicksOf` entfallen (`rg "travelTicks" src tests` danach leer).

## Steps

- [ ] **Tests rot** AK-HF-21 in `tests/ui/homeTravel.test.ts` und `tests/ui/islandCard.test.ts`: Seeds 1, 2, 3, jede Fremdinsel, ohne und mit Seerecht (`world.council[4] = 'C'`):
      `homeTravelTicks` = `laneTicksOf(world, 0, i)` = Sim-Fahrzeit eines Schiffs nach `depart` (`setRoute` und ein `tickShips`, `left + 1`); Inselkarte enthält
      `formatGameTime(laneTicksOf(...))`.
- [ ] **Neu-Pins (per Name, AK-HF-22 UI-Teil):** `homeTravel` «Golden: Lane mit d = 25 ergibt 250 Ticks» → Golden auf eine L-Lane (Wert aus `seaRoute`, Kommentar R10/E4);
      `islandCard` «formatiert Name, Groesse, Merkmale, Fahrzeit», «BF6 ein Fahrzeit-Format wie überall», «Weidenau: Fruchtbar-Abschnitt, Fahrzeit aus dem Seeweg».
- [ ] **Lauf rot → Umsetzen → Lauf grün:** `npx vitest run tests/ui/homeTravel.test.ts tests/ui/islandCard.test.ts tests/ui/farLate.test.ts tests/ui/order.test.ts; echo EXIT=$?`.
- [ ] Kandidatenliste grün; Teilbeleg laut Index.
- [ ] **Commit:** `feat: Inselkarte und Fernauftrag lesen die Sim-Fahrzeit (HAFEN S3, AK-HF-21)`.

## Bericht

Exit-Codes; Rot-Ausgabe; Pin-Liste; ob `createLaneCache` entfallen ist.
