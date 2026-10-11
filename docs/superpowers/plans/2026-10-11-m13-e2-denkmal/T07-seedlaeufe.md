# T07 · Seed-Läufe B3 und Baseline (Pflicht-Stopp)

Strang sim · Worktree `.worktrees/m13-e2-sim` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M13E2-12, -18, -19,
-20, -21 (Spec §6, §6.1; Anhang 03 A–E; Anhang 01 C, D) · blocked-by T06 · Grösse M (≈ 35 Tools) · Auflage A4,
qa B3, R455 T-B2/T-B3

**Files:**

- Create: `tests/sim/balance-monument.test.ts`
- Lesen: Anhang 03 vollständig; `tests/sim/balance-edicts.test.ts` (Phase 1/2, `K_ARM`, T0, `beforeAll`-Muster),
  `runMerchants`, `newMerchantTrajectory` (`tests/sim/merchantsController.ts`), `placeTownhall`,
  `monumentHelpers.ts`. **Nicht ändern:** jede bestehende `tests/sim/balance*.test.ts`, `controller.ts`,
  `merchantsController.ts`, `e0Pins.ts`, `e1Pins.ts`, `seePins.ts`, `src/`.

## Pflicht-Stopp (Anhang 03 A)

Reihenfolge **messen → prüfen → pinnen**. Weicht `wonMerchantsTick` von `K_ARM = 11 800` oder T0 von 11 800 ab,
verfehlt Lauf A einen Festwert aus Anhang 01 C oder liegt Lauf C ausserhalb 4704 ≤ t₁ − t_s ≤ 8736: **nicht pinnen,
nicht anpassen, stoppen** und dem Controller melden (Messwerte, Log-Zeilen). Der Controller meldet an `lead-design`
und L0 (Pflicht-Rulingpunkt); Grenzen und Festwerte ändert nur ein Ruling.

## Läufe

- **Gemeinsam:** Phase 1 und 2 (K′-arm-Stand) **einmal je Datei** in `beforeAll` (Timeout 15 000 ms), genau wie
  `balance-edicts.test.ts`; jeder Lauf startet aus `deserialize(serialize(stand))`. Timeouts je Lauf 10 000 ms.
  Versorgung ohne Controller: `feed(w)` alle 10 Ticks setzt Nahrung, Stoff, Rum, Holz im Heimatlager auf 100, **nicht**
  die vier Denkmal-Güter, ohne Geld. Denkmal roh einsetzen (`placeMonument`, Kosten neutralisiert, 4000 vor
  `startMonumentStage` gutgeschrieben, ausser Lauf A).
- **Lauf A (AK-12, Anhang 03 B), synthetisch, Krisen aus (A4):** Lager 20 je Gut, `money 100 000`, alle `buy` an,
  Tick 1000; Zwilling ohne Start und ohne `buy`. Abschnitte im Abschluss-Tick sofort neu starten. Erwartung: fertig
  bei 3000, 5000, 7000; `money(Zwilling) − money(Lauf)` = 64 200; Variante Handel (`won`, Amtsstube, `setEdict(w,
'trade')` vor 1000 in beiden) = 54 960; Lager der vier Güter am Ende 20. Kaufanteil 100 (R489).
- **Lauf B (AK-18, Anhang 03 C):** K′-Stand bei T0, Abschnitt 1, kein Zukauf, **ab T0 kein Controller** (nur `feed`
  und `step`), 6000 Ticks. Festwerte: `delivered[g]`, Endbestand der vier Güter, Kaufleute bei T0 und am Ende.
  Hochrechnung `max_g (Soll_g / r_g)` berechnen und mit `console.info` loggen, nicht pinnen; `r_g = 0` → «ohne
  zusätzliche Betriebe nicht fertig». Messwert und README-Satz (Vorlage Anhang 03 C) in den Bericht für T14.
- **AK-20 (Anhang 03 C, Reserve-Prüfung):** eigene Kopie des K′-Stands, Glas und Gewürz auf `monumentReserve + 10`,
  1000 Ticks, alle `buy` aus; nach jedem Schritt mit gestiegenem `delivered[g]` (Glas, Gewürz) gilt `stock[g] ≥
monumentReserve(w, g)`; Zahl der geprüften Fälle je Gut > 0, nach der Messung als Festwert.
- **Lauf C (AK-19, Anhang 03 D), synthetische R-Welt, Krisen aus (A4):** 3 Steinbrüche, Werkzeugmacher mit Schule,
  Glashütte, Gewürz +1 je 50 Ticks, Holz alle 10 Ticks auf 100, Lager der vier Güter bei t_s auf 20, Start bei t_s
  (Vielfaches von 10), kein Zukauf, bis Abschluss oder t_s + 8736. Abnahme 4704 ≤ t₁ − t_s ≤ 8736, Festwert t₁;
  bindendes Gut loggen. Plätze als Konstanten (einmal bestimmen, im Kommentar die Herleitung).

## Schritte

- [ ] **Schritt 0:** `grep -n "K_ARM\|T0\|beforeAll\|SAVING_ARM" tests/sim/balance-edicts.test.ts`.
- [ ] **Schritt 1: Test zuerst (rot):** Datei mit allen `it` und den Grenzen, Festwerte als `const … = NaN` (rot).

```bash
npx vitest run tests/sim/balance-monument.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Messen.** Läufe ausführen, Werte ablesen, gegen Grenzen prüfen (Pflicht-Stopp oben).
- [ ] **Schritt 3: Pinnen** (nur innerhalb der Grenzen) als `const` mit `toBe`, Kommentar «Messwert, Änderung nur per
      Ruling».
- [ ] **Schritt 4: Zeitreserve.** Unter `CI=true` braucht jeder Test und der `beforeAll` ≤ 50 % seines Timeouts:

```bash
CI=true npx vitest run tests/sim/balance-monument.test.ts; echo EXIT=$?
```

Sonst Datei teilen (z. B. `balance-monument-c.test.ts` für Lauf C), **nie** das Timeout erhöhen. Kein Eintrag in
`ZEITTESTS` (keine Wandzeit-Messung).

- [ ] **Schritt 5: Baseline (AK-21)**, wörtlich:

```bash
npx vitest run tests/sim/balance.test.ts tests/sim/balance-merchants.test.ts tests/sim/balance-edicts.test.ts; echo EXIT=$?
git diff --stat main...HEAD -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts; echo EXIT=$?
```

Erwartung: Tests grün; der Diff nennt **nur** `tests/sim/balance-monument.test.ts` (bzw. die geteilten neuen Dateien).

- [ ] **Schritt 6: Commit.** `test: Seed-Läufe Denkmal A, B, C und Reserve im Referenzstand (M13-E2 T07)`.

## Bericht

Messwerte je Lauf (Tabelle Ist/Erwartung/Grenze), Laufzeiten unter `CI=true`, Hochrechnung Lauf B mit README-Satz,
Exit-Codes, Ausgabe des Baseline-Diffs. Danach: Controller B fährt `git merge main` und `make check` im Sim-Baum und
meldet «bereit fürs Final-Review SIM» (T17).
