> **Task-ID:** T09 · **AK-IDs:** AK-E4-03, -04, -05 (inkl. Auflage B3 `k = 0`), -06, -08, -09, -10, -17, -18, -19
> **blocked-by:** T08 · **Strang:** e4, `.worktrees/m12-see-e4` · `tech-sim-engineer` (sonnet)
> **Regeln:** Spec §8, Anhang 03 E (Schritt `tickShips` 1–4); Index P-3, P-4; Auflage J.4 (Reihenfolge)

## T09: `tickShips` — Fahrt, Entladen, Laden, Abfahrt, Auflösen

**Ziel:** Schiffe fahren ganzzahlig und ohne Zufall zwischen zwei Kontoren, entladen erst, laden dann und fahren im
selben Tick ab, nie wartend. Aufgelöste Schiffe fahren heim, entladen bis 100, der Rest verfällt mit Meldung.

**Code-Fakten:** `ships.ts` (T08) mit Gerüst `tickShips`; `tick.ts` `step` (Reihenfolge `tickProduction`,
`tickPopulation`, …); `islands.ts` `laneTicks(islands, a, b)` (T01); `GOOD_IDS`; bestehende Konstante `STORAGE_CAP` (100, Lagergrenze je Gut, `grep -rn STORAGE_CAP src/sim`);
`SEED_D37`, `D_HOME_A_AT_SEED_D37` in `tests/sim/seePins.ts`; Testwelt `seaHelpers.ts`.

**Dateien:** `src/sim/ships.ts`, `src/sim/tick.ts` (nur `step`); `tests/sim/ships.test.ts`, neu
`tests/sim/ships-rng.test.ts`, `tests/sim/tick.test.ts`.

## Ablauf (verbindlich, je Schiff in `id`-Reihenfolge)

```text
1  if to !== null: left -= 1; if left === 0: port = to; to = null; arrived = true
2  if to === null:
     if route !== null:                                  // Ankunft oder „Umschlag fällig" nach setRoute
        if port ∉ {a, b}: depart(a)                      // Anfahrt, keine Umladung
        else: Q = other(port); L = list(port → Q)        // a→b: ab, b→a: ba
              unload(port, keep = L); load(port, L); depart(Q)    // nie warten, auch leer
     else if homing:
        if port !== 0: depart(0)                         // auch wenn die Fahrt gerade in der Fremde endete
        else: unloadAll(0) → Verlust = Rest; cargo = {}; homing = false
3  depart(Q): to = Q; left = laneTicks(islands, port, Q)
```

- **Fahrt bei `clearRoute` unterwegs:** `to` bleibt, Fahrt endet ohne Umladung (Schritt 2 „homing"), dann heim.
- **`unload(P, keep)`:** jedes Gut an Bord, das **nicht** in `keep` steht, in `GOOD_IDS`-Reihenfolge:
  `n = min(cargo[g], STORAGE_CAP − stock_P[g])`; Rest bleibt an Bord (wird bei der nächsten Ankunft in `P` zuerst
  entladen, auch Güter, die aus der Route genommen wurden). Einträge mit 0 werden gelöscht.
- **`load(P, L)`** (`k = |L|`, `k = 0` → nichts laden, Auflage B3): `frei = capacity − Σ cargo`; `v_g = max(0,
stock_P[g] − reserve_g)`; Durchgang 1 je Gut in Listenfolge `x = min(v_g, ⌊frei₀ / k⌋)` (`frei₀` = frei vor dem
  Durchgang); Durchgang 2 je Gut in Listenfolge `x = min(v_g − geladen_g, frei_rest)`. Ganzzahlig.
- **`unloadAll(0)`:** je Gut in `GOOD_IDS`-Reihenfolge bis 100, Rest → `ShipLoss { ship, good, n }`.
- **`step`** (P-3): `tickProduction(world); const lost = tickShips(world); tickPopulation(world); …` — Rückgabe
  `{ lost }` als `StepReport` (Typ in `tick.ts` exportiert). Sonst keine Reihenfolgeänderung (J.4).

## Schritte

- [ ] **1 Tests zuerst** `ships.test.ts`, `describe('M12 E4 tickShips')`; Welt `seaWorld()` (`SEED_D37`, `d(0,2) = 37`),
      `foundKontor2Literal(w, 2)`, Schiff per `shipLiteral`, Route per `setRoute`, Takt per `tickShips` direkt:
  - **AK-E4-03** Route 0 ⇄ 2 (je ein Gut), nach `setRoute` im 1. `tickShips` Abfahrt (`left 370`); Ankunft genau 370
    Aufrufe später (`port 2`, im selben Aufruf wieder `to 0`); Rundreise 740.
  - **AK-E4-04** an Bord 30 Gewürz (Gut nicht in `L` der Heimat), Heimat Gewürz 80, Liste Heimat → 2 = Werkzeug,
    Heimat Werkzeug 100 → entlädt 20, 10 bleiben; lädt Werkzeug höchstens `50 − 10 = 40`.
  - **AK-E4-05** zwei Güter, je 100, Reserve 10 → 25 / 25; erstes Gut 12 verfügbar (Bestand 22) → 12 / 38; beide 0 →
    fährt leer im selben Aufruf; **B3** Liste dieser Richtung leer (`k = 0`) → lädt nichts, fährt.
  - **AK-E4-06** Quelle 15, Reserve 10 → 5; Quelle 8 → 0 und fährt; Reserve 0 → alles (bis Ladung 50).
  - **AK-E4-08** unterwegs Richtung 2 mit 40 Gewürz, `clearRoute` → Ankunft in 2 ohne Umladung (Lager 2 unverändert),
    Abfahrt heim; dort Heimat Gewürz 70 → 30 entladen, `ShipLoss { good 'spice', n 10 }`, danach `freeShipAtHome`.
  - **AK-E4-17** Route 1 ⇄ 2 für Schiff in der Heimat → Abfahrt nach 1 ohne Umladung, `left = laneTicks(0, 1)`
    (`= 10 × D_HOME_A_AT_SEED_D37`); in 1 erste Umladung.
  - **AK-E4-18** unterwegs `updateRoute` (Gut ersetzt, Reserve 30) → `cargo` gleich; nächste Umladung nach neuer Liste,
    altes Gut an Bord zuerst entladen.
  - **AK-E4-19** liegend in der Heimat mit 40 Gewürz, Heimat 70, `clearRoute` → nächster `tickShips`: 30 entladen,
    Verlust 10, frei.
  - **AK-E4-09** `tick.test.ts`: Ladung, die im selben `step` ankommt, deckt den Bedarf dieses Schritts (Heimat Nahrung
    0, Schiff kommt mit 10 Nahrung an, Haus mit Nahrungsbedarf → nach dem `step` versorgt); zwei Schiffe gleicher
    Ankunft → das mit kleinerer `id` entlädt zuerst (Lager voll nach dem ersten, Rest beim zweiten an Bord);
    `step` liefert `StepReport.lost`.
  - **AK-E4-10** zwei Läufe 5000 `step` mit 3 Schiffen auf Routen 0 ⇄ 2, 0 ⇄ 1, 1 ⇄ 2 → `serialize` gleich;
    `ships-rng.test.ts` (eigene Datei, `vi.mock('../../src/sim/rng')`): `tickShips` 5000× → `createRng` 0 Aufrufe aus
    `ships.ts`; `grep -c createRng src/sim/ships.ts` = 0.
  - Ohne Schiffe: `step` bitgleich (`OFF_FINGERPRINT`, `balance-merchants` grün).
- [ ] **2 Rot-Beleg** → Commit `test: M12 E4 tickShips (rot)`.
- [ ] **3 Umsetzung** nach „Ablauf"; `step` ruft `tickShips`.
- [ ] **4 Prüfen:** Bitgleich (AK-M12-B1…B4, `balance-merchants [6750, 11200, 320]` auf diesem Strang), `make check`,
      `CI=true make check` → Commit `feat: M12 E4 tickShips, Umschlag, Auflösen`.

**Review-Fokus:** Entladen vor Laden; zwei Durchgänge exakt; Abfahrt im selben Tick; kein Warten; Anfahrt ohne
Umladung; ganzzahlig; `id`-Reihenfolge; `laneTicks` nur bei Abfahrt.
