# T05 · Zug, Abschluss, Tick-Platz, Randfälle (TDD)

Strang sim · Worktree `.worktrees/m13-e2-sim` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M13E2-08, -10, -11, -13,
-14 (Spec R5, R8; Anhang 01 B–C, Anhang 08 B.1) · blocked-by T04 · Grösse M (≈ 35 Tools) · qa B8, Auflage A5

**Files:**

- Modify: `src/sim/monument.ts` (`tickMonument`), `src/sim/tick.ts` (ein Aufruf), `tests/sim/monument.test.ts`,
  `tests/sim/save-v12.test.ts` (nur `it.todo` AK-25k einlösen)
- Lesen: Spec R5, R8, §5; Anhang 01 B, C; Anhang 08 B.1; `step` in `tick.ts`; `tests/sim/unlocks.test.ts` AK-S1-05 (c).

## Regeln

```ts
export function tickMonument(w: World): void;
```

1. `m = w.monument`; `m === null` oder `!m.running` → return (ohne Denkmal bitgleich).
2. **Zug** nur wenn `w.tick % MONUMENT_PULL_TICKS === 0` **und** `!m.paused` **und**
   `w.buildings[m.buildingId].connected`: Reserve einmal je Zug vor dem ersten Gut (R5.4, je Gut
   `monumentReserve(w, g)` einmal berechnen); je Gut in `MONUMENT_GOODS`-Reihenfolge mit Rest > 0, höchstens ein Stück:
   (a) `stock[g] > reserve[g]` → `stock[g] −= 1`, `delivered[g] += 1`; (b) sonst bei `buy[g]`:
   `buyMonumentUnit(w, g) === 1` → `delivered[g] += 1`; (c) sonst nichts.
3. **Abschluss** (R8.1) in **jedem** Tick mit `running`, nach dem möglichen Zug, auch bei `paused` und ohne Anbindung:
   alle Reste 0 → `running = false`, `stage += 1`, `delivered` alle 0; wird `stage` 3 und `monumentDone === false` →
   `monumentDone = true` (R8.2). `won`, `wonMerchants`, `wonSpice` unberührt.
4. **Tick-Platz (R5.1):** in `step` **direkt nach** `tickEconomy(world)`; die letzten zwei Aufrufe bleiben
   `checkWin`, `tickUnlocks`.

## Schritte

- [ ] **Schritt 0:** `sed -n '/export function step/,/^}/p' src/sim/tick.ts`.
- [ ] **Schritt 1: Test zuerst (rot)** in `tests/sim/monument.test.ts`:
  - **AK-08 Zug aus dem Lager** (Anhang 01 B): Stein 23, Start bei Tick 1000 (zwischen Schritten), `step` bis 1040:
    Stein 22/21/20 nach 1010/1020/1030, `delivered.stone` 1/2/3, bei 1040 nichts; in Zwischenticks keine Änderung an
    Lager und `delivered`; Start bei 1005 → erster Zug 1010; Geld für genau ein Stück, `buy.stone` und `buy.glass` an,
    Lager auf Reserve → Stein wird gekauft, Glas nicht (Reihenfolge).
  - **AK-10 Reserve hält** (Anhang 08 B.1): `village(4, { unlockAll: true })`, `setHouse(h, 4, 20)` je Haus vor
    **jedem** Schritt, `wonMerchants`, Denkmal an einem freien Platz neben den Häusern (Konstante in
    `monumentHelpers.ts`), Lager Stein/Werkzeug 20, Glas 80, Gewürz 64, alle `buy` aus, Start bei 1000; vorher Reserve
    Glas = Gewürz = 64; 200 Schritte; nur in Schritten mit gestiegenem `delivered[g]` gilt danach `stock[g] ≥
monumentReserve(w, g)`; Ende: Glas geliefert in 1 … 16, Gewürz 0.
  - **AK-11 Zukauf** (Vergleich statt Spy, A5): Lager auf Reserve, `buy.stone` → je Zug Geld um `buyPrice(w,
'stone', 1)` **vor dem Zug** gesunken (15), `delivered +1`; mit wirkendem Handel 12; `money 14` → kein Kauf; `buy`
    aus → nichts; Stein 25 → erst fünf Züge aus dem Lager ohne Geld, dann Kauf; `kontorId = null` → kein Kauf;
    Zukauf-Funktion direkt (Wiederholung der T04-Hilfstests als AK-Zeilen): `money = Preis` → 1, Geld 0; `money =
Preis − 1` → 0, `serialize` gleich; Lager und `sellPct` unverändert. **qa B8:** Lager unter Reserve (Stein 12) und
    `buy` an → nur Kauf, Lager bleibt 12; Handel wird mitten im Abschnitt aufgehoben bzw. die Amtsstube abgerissen →
    Preis ab dem nächsten Zug 15; Häuser wachsen von 60 auf 80 Kaufleute → Glas-Reserve 48 → 64 ab dem nächsten Zug; Häuser schrumpfen von 80 auf
    60 → Reserve 64 → 48, Glas 60 liefert ab dem nächsten Zug wieder aus dem Lager; leeres Lager (`stock = 0`) mit `buy`
    an → Kauf, Lager bleibt 0; mit `buy` aus → nichts, kein Wurf.
  - **AK-13 Abschluss:** letzter Rest im Zug-Tick → im selben Tick `running false`, `stage +1`, `delivered` 0; nach
    Abschnitt 3 `monumentDone true`, `won`/`wonMerchants`/`wonSpice` unverändert; alle Reste 0 gesetzt und `paused` →
    Abschluss im nächsten Tick (auch ohne Zug-Tick).
  - **AK-14 Kein Zug:** `paused`, ohne Weg, `!running` → 100 Schritte ohne Änderung an Lager (Denkmal-Güter),
    `delivered`, Geld ausser Unterhalt (Zwilling ohne Denkmal-Aktion als Vergleich); Fortsetzen bzw. Weg neu → Zug ab
    dem nächsten Zug-Tick. **qa B8:** Weg-Abriss zwischen Tick 1009 und 1010 → kein Zug bei 1010; Abriss des Denkmals
    bei `paused` → `monument null`, Erstattung wie AK-15, nächster `step` wirft nicht.
  - **AK-25k** (`save-v12.test.ts`, `it.todo` ersetzen): geladener Stand `running`, alle Reste 0 → nach einem `step`
    `stage +1`, `running false`.
  - **Tick-Platz:** Quelltext von `step`: `tickMonument` steht direkt nach `tickEconomy` (Muster AK-S1-05 (c)).

```bash
npx vitest run tests/sim/monument.test.ts tests/sim/save-v12.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/sim/monument.test.ts tests/sim/save-v12.test.ts tests/sim/unlocks.test.ts tests/sim/tick.test.ts \
  tests/sim/balance.test.ts tests/sim/balance-merchants.test.ts tests/sim/seaGolden.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

(`tick.test.ts` nur falls vorhanden.) Ein roter Balancing- oder Pin-Test ist **Stopp und Meldung**, nie anpassen.

- [ ] **Schritt 3: Commit.** `feat: Denkmal-Zug mit Reserve und Zukauf, Abschluss, Tick-Platz (M13-E2 T05)`.

## Bericht

Testnamen je AK und je qa-B8-Zeile, Rot-Zeile, Exit-Codes, Zeitbedarf `monument.test.ts` (aus der Vitest-Ausgabe).
