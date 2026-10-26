# T10 · Liegezeit (S4, R15–R22)

Umsetzer `tech-sim-engineer` · ≈ 60 Tools · AK-HF-18 (Liegezeit-Teil), -23 … -31, AK-HF-22 (Liegezeit-Pins); Gate-Randfälle «leere Ladeliste/leeres Lager» und «Abriss
bei Fahrt dorthin» · blocked-by: L2 auf main · Worktree `.worktrees/hafen-dwell` (`feat/hafen-dwell` ab main) · Spec §3.4, §4 · Index P-10

## Dateien

- ändern: `src/sim/ships.ts` (`tickShips`, `handleDocked`, `clearRoute`, `buyShip`), `src/sim/types.ts` (`Ship.dwell`), `src/sim/routeBalance.ts` (`cycleTicks`),
  `src/sim/defs/sea.ts` (`SHIP_DOCK_TICKS` existiert seit T07; nur Kommentar «wirkt»), `src/sim/world.ts`/Test-Helfer, wo Schiffe literal gebaut werden (`dwell: 0`)
- Tests: `tests/sim/ships.test.ts`, `tests/sim/routeBalance.test.ts`, `tests/sim/council.test.ts` (AK-HF-18 Liegezeit), Pins laut Kandidatenliste
- nicht ändern: Save-Prüfung (T11; bis dahin lädt nur der eigene Stand ohne `dwell`-Prüfung — Branch-intern, Merge erst nach T11)

## Verhalten (P-10)

```ts
interface Ship {
  /* … */ dwell: number;
} // 0 … SHIP_DOCK_TICKS: verbleibende Liegeticks
```

Je Schiff in `id`-Reihenfolge:

1. `to !== null`: `left -= 1`; bei 0 → `port = to`, `to = null`. **Mit Route:** liegt `port` in der Route → `unload(keep = Güter der Ladeliste dieses Hafens)`;
   `dwell = SHIP_DOCK_TICKS`; **Ende für dieses Schiff in diesem Tick** (kein Laden, keine Abfahrt, R17). **Ohne Route** (`homing` oder frei): `handleDocked` wie heute.
2. sonst `to === null` und `dwell > 0`: `dwell -= 1`; bei 0 im selben Tick: Route vorhanden → `port` in Route: `load` nach der **aktuellen** Ladeliste, `depart` zum
   anderen Hafen; sonst `depart(route.a)` (R18). Route inzwischen `null` (nur via `clearRoute`, das `dwell` schon 0 setzt) kommt hier nicht vor.
3. sonst (`to === null`, `dwell === 0`): `handleDocked` wie heute (R19, R21: `setRoute` auf liegendes Schiff fährt im nächsten Tick ohne Liegezeit).

`clearRoute` setzt `dwell = 0` (R20); `updateRoute` ändert `dwell` nicht. `buyShip` legt `dwell: 0` an. `routeBalance.cycleTicks = T(a,b) + T(b,a) + 2 · SHIP_DOCK_TICKS` (R22).
Seerecht-Beschluss (`rescaleVoyages`) rührt `dwell` nicht an.

## Steps

- [ ] **Tests rot** `tests/sim/ships.test.ts`, `describe('HAFEN S4 Liegezeit')` (Tick-Konvention: Werte nach `tickShips`; Grenzen t0 + 29 / t0 + 30 / t0 + 31):
  - AK-HF-23: Ankunft t0: Lager steigt in t0, `dwell = 30`, `to === null`; t0 + 29 noch liegend; t0 + 30 geladen, `to` gesetzt, `left = T`. Rot heute.
  - AK-HF-24 (`M12:AK-E4-03` neu): Rundreise = `2 T + 2 · SHIP_DOCK_TICKS`.
  - AK-HF-25: `updateRoute` bei `dwell` 15 mit neuer Ladeliste → beim Ablegen nach der neuen Liste geladen.
  - AK-HF-26: `clearRoute` in der Liegezeit am Fremdhafen → `dwell` 0, `homing`, Abfahrt Richtung Heimat im nächsten Durchlauf; am Heimathafen `unloadAtHome` wie heute.
  - AK-HF-27: Ziellager `STORAGE_CAP − 5`, Schiff bringt 20 → 5 entladen in t0, 15 bleiben an Bord und fahren mit (kein zweiter Versuch, O-1).
  - AK-HF-28: gekauftes Schiff ohne Route: `dwell` bleibt 0 über 100 Ticks; Heimkehr entlädt bei Ankunft im selben Tick, Verlustmeldung wie heute.
  - AK-HF-30: `setRoute` auf liegendes Schiff ohne Route → Abfahrt im nächsten Tick, keine Liegezeit.
  - AK-HF-31: Kontor II, an dem ein Schiff mit Route liegt (`dwell > 0`) → `demolish` «Erst Route auflösen».
  - Randfall leere Ladeliste und leeres Lager: liegt 30 Ticks, lädt nichts, legt in t0 + 30 leer ab (beide Fälle).
  - Randfall Abriss bei Fahrt dorthin (mit Liegezeit-Regel): weiterhin «Erst Route auflösen».
  - AK-HF-18 (Liegezeit): Seerecht-Beschluss bei `dwell` 12 → `dwell` bleibt 12; nächste Fahrt `left = ceil(L · 2.32)`.
- [ ] **Test rot** `tests/sim/routeBalance.test.ts` AK-HF-29: `cycleTicks = T(a,b) + T(b,a) + 2 · SHIP_DOCK_TICKS`.
- [ ] **Lauf rot → Umsetzen → Lauf grün.**
- [ ] **Neu-Pins (per Name):** Kandidatenliste laufen; erwartet rot: `ships.test.ts` AK-E4-03/-05/-08/-17, `farOrder-sea.test.ts` AK-H2-27 Fall A/B («Ware nach 2·L/3·L»
      → plus Liegezeit), `routeBalance`, `ships-rng`, `seerecht` AK-SR-7, `trade`/`contract`-Tests mit Schiffslieferung, INSELPROBEN `challenge-solvable` (Probe 4).
      Je Test Name, alt → neu, Begründung «Liegezeit R17/R18, E4 R913». **INSELPROBEN-Pins** («Messwert, nur per Ruling») nicht selbst ändern: Werte melden (E-HF-3), Test
      bleibt bis zum Ruling rot markiert im Bericht; Lösbarkeit (`outcome === 'passed'`) muss halten, sonst Stopp.
- [ ] Teilbeleg laut Index; `balance*` grün; `git diff main -- tests/sim/balance.test.ts` leer.
- [ ] **Commit:** `feat: Liegezeit am Hafen (HAFEN S4, AK-HF-23..31)`; Pins als eigene `test:`-Commits.

## Bericht

Exit-Codes; Rot-Ausgaben; Pin-Liste; INSELPROBEN-Messwerte alt/neu (Ruling-Entwurf); Umlauf Seed 3 Heimat–B vorher/nachher.
