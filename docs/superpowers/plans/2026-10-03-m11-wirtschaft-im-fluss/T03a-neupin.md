> **Task-ID:** T03 (Paket M11-P1c) — Teil 1 von 2
> **AK-IDs:** AK-BAS-01, -02, -03, -04, -07; AK-SAV-03; (AK-BAS-06 Review `lead-qa`)
> **blocked-by:** T02 (Review OK)
> **Strang:** `feat/m11-sim` · Worktree `.worktrees/m11-sim` · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-11-bitgleich-neupin.md](orga-11-bitgleich-neupin.md) · Spec 6, 14, Anhang 02 C/D, Anhang 03 D
> **Teile:** **T03a-neupin.md** (diese: Vorgehen, Messung, rote Tests) · [T03b-neupin.md](T03b-neupin.md) (neue Tests, Pins, Doku, Commit)

## T03: Umschreiben roter Tests, Neupin Baseline

**Ziel:** Nach S10 (T01) und Dämpfung (T02) einmal messen, die Haupt-Pins gegen Spec 14 prüfen und neu pinnen, alle
dadurch roten Tests nach festem Muster umschreiben (kein Test fällt weg) und `make check` wieder grün machen.

**Code-Fakten (Stand nach T02):**

- `tests/sim/balance-crises.test.ts:29-45` `normalized()` (M10-Fassung); `:47-67` `OFF_REFERENCE`; `:68`
  `OFF_FINGERPRINT = 0xbfeac8c6`; `:70` `CRISIS_WIN_STOP = 8000`; `:101` M6:AK-B1-02; `:150` M6:AK-B2-06 (Laden bei
  2601, **keine** Änderung, AK-SAV-03); `:160-171` M8:AK-S1-15 (6050/57).
- `tests/sim/balance-merchants.test.ts:15` `WIN_TICK = 6050`; `:32` M8:AK-B1-01; `minMoneyAfterWin` ist heute nicht
  gepinnt. `MERCHANT_TICK_LIMIT = 12_000` (`merchantsController.ts:18`).
- `tests/sim/unlock-timeline.test.ts:33-36` Fälle `off` (U5 3850, U6 6050, Schule 3700) und `normal` (4750, 7050,
  4600); `timeline(level, fireStation)` ist eine lokale Funktion.
- Controller: `buildColony`, `startColony`, `runColony`, `WIN_TICK_LIMIT = 7500` (`controller.ts:17`).

**Erwartete Dateien:**

- `tests/sim/`: `balance-crises.test.ts`, `balance-merchants.test.ts`, `unlock-timeline.test.ts`, `economy.test.ts`,
  `taxes.test.ts`, `merchants.test.ts`, `population.test.ts`, `crises.test.ts`, `tick.test.ts`, `townhall.test.ts`,
  `scenario-saves.test.ts`, `unlocks.test.ts`; `tests/ui/goal.test.ts` (nur M10:AK-U1-08)
- Doku: `README.md` („Unterhalt und Geld", „Aufstieg"); `docs/beobachtungen.md` nur bei Befund
- **Nicht anfassen:** `src/` (T03 ändert keinen Produktivcode; Mutationsproben werden zurückgenommen),
  `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, Fixtures

## Schritt 0: Rotliste und Messung (vor jeder Teständerung)

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/m11-sim
SCRATCH=<Scratchpad-Verzeichnis der Session>   # nicht /tmp; alternativ .superpowers/sdd/m11/ (Ledger)
git log -1 --format=%h                                   # = <T02-SHA>, ins Ledger
npx vitest run 2>&1 | grep -E "^ FAIL" | sort > $SCRATCH/m11-t03-rot.txt; wc -l $SCRATCH/m11-t03-rot.txt   # erwartet 34
VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance.test.ts tests/sim/balance-crises.test.ts \
  tests/sim/balance-merchants.test.ts tests/sim/unlock-timeline.test.ts --silent=false 2>&1 | tee $SCRATCH/m11-t03-mess.log
```

**Vergleich mit Spec 14** (Haupt-Pins). Plan-Prototyp (Scratchpad, M10-Code + S10 + Dämpfung nach Spec 3.2) ergab
genau die Sollwerte; das ist die Erwartung:

| Grösse                                | Soll (Spec 14)                                                    | Prototyp                                      |
| ------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| M-01/02/03 Ref `off`                  | Sieg 6750, `minMoney` 117, `endMoney` 339                         | gleich                                        |
| M-04 erste Siedler / Bürger           | 350 / 4150                                                        | gleich                                        |
| M-07 normal + FW / mild               | 7850 / 7850 (normal `minMoney` 83, mild 44)                       | gleich                                        |
| M-08, M-10 Kaufleute                  | Sieg 6750, Ziel 2 11 200, `minMoneyAfterWin` 320                  | gleich (Endgeld 2448)                         |
| M-11 Freischalt-Ticks                 | `off` 150/350/550/4150/6750; normal …/5150/7850; mild …/4250/7850 | gleich                                        |
| M-05 Gebäudezahlen (mit Beleg)        | Ist 3 Brennereien (A13)                                           | unverändert zu M10                            |
| M-06 Fingerabdruck (mit Beleg)        | Richtwert `0x701c6da5`                                            | `0x701c6da5` (mit erweitertem `normalized()`) |
| Bautick Schule/Rumkette (kein M-Wert) | —                                                                 | `off` 4000, normal 5000                       |

**Weicht ein Haupt-Pin ab** (M-01 … M-04, M-07, M-08, M-10, M-11): nicht nachstellen, nichts pinnen, Stopp und
Meldung an L0 über den Controller (R74) mit Messlog. M-05, M-06 und die Schul-Bauticks sind „Neupin mit Beleg".

## Rote Tests und Umschreib-Muster

Die endgültige Liste ist die Datei aus Schritt 0. Kandidaten (Plan-Prototyp, Grep-geprüft) — 16 aus T01, 18 aus T02:

| Gruppe                      | Test (Datei :: Zeile)                                                                                                                                                                                                                                                      | Muster |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Pins                        | `balance-crises` :: 101 M6:AK-B1-02, :: 161 M8:AK-S1-15; `balance-merchants` :: 32 M8:AK-B1-01; `unlock-timeline` :: 38 (off, normal)                                                                                                                                      | P-D    |
| Buchungstakt (S10)          | `economy` :: 94; `taxes` :: 76, 90, 280 (RF-2)                                                                                                                                                                                                                             | P-A    |
| Geld in einem Schritt (S10) | `merchants` :: 96 AK-S1-04, 109 AK-S1-05, 247 AK-S1-10; `scenario-saves` :: 238, 258 (AK-B2-04 krise-brand, -geschuetzt)                                                                                                                                                   | P-B    |
| Dämpfung (Defizitwelt)      | `population` :: 161, 199, 217, 229, 274, 294, 304, 316, 329; `merchants` :: 135 AK-S1-06, 166 AK-S1-07, 204 AK-S1-09 (auch AK-S1-04/-05/-10); `taxes` :: 221 AK-S1-05, 233 AK-S1-06, 258 AK-S1-09; `crises` :: 171 RF-2; `tick` :: 90 AK-S2-13; `townhall` :: 301 AK-S2-13 | P-C    |
| Freischaltung (Spec 4)      | `unlocks` :: 35 M10:AK-S1-01; `tests/ui/goal.test.ts` :: 158 M10:AK-U1-08                                                                                                                                                                                                  | P-E    |

Jeder umgeschriebene Test erhält im Namen „(M11 S10)"; kein Test wird gelöscht oder auf `skip` gesetzt.

- **P-A „bucht je Schritt":** Statt „erst bei Tick 100" gilt nach `n` Aufrufen bei festem Zustand
  `money = m0 + floor((n · taxUnits + c0) / 20 000) − floor((n · upkeep + u0) / 100)` (Anhang 02 D); `w.tick` ist
  für die Buchung egal. Beispiel `economy` :: 94: nach 1 Aufruf `m0`, nach 100 Aufrufen `m0 − 15`, Übertrag 0.
  `taxes` :: 90: die Zeile „nach 99 Schritten `m0`" wird zur Formel mit `n = 99`.
- **P-B „Geld in einem Schritt":** Überträge `c0 = w.taxCarry`, `u0 = w.upkeepCarry` **vor** dem Schritt merken;
  erwartetes Geld = altes Soll + `floor((c0 + taxUnits(w)) / TAX_CARRY_DIVISOR) − floor((u0 + totalUpkeep(w)) /
UPKEEP_INTERVAL)` mit `taxUnits`/`totalUpkeep` **nach** dem Schritt (Muster RF-2 in T01). Alternativ Zwilling ohne
  die Aktion (Muster `fire` M6:AK-S2-12). `merchants` AK-S1-05 „Steuer 300 (ohne Aufstieg 210)" vergleicht
  `stats.taxes` und bleibt so.
- **P-C „Defizitwelt":** Testwelten ohne Erzeuger haben für jedes Zielgut ein Defizit → Wartezeit × 2. Setzungen
  `satisfiedSince = w.tick − UPGRADE_WAIT` (bzw. `− 300`, `= 47`, `: 0`) werden um `(UPGRADE_DEFICIT_WAIT_FACTOR − 1) ×
UPGRADE_WAIT` früher gesetzt (negativ ist zulässig) oder der Start-Tick entsprechend später; erwartete Gründe
  `Bedürfnisse noch nicht ${UPGRADE_WAIT * UPGRADE_DEFICIT_WAIT_FACTOR} Ticks erfüllt`; Laufzeiten „300"/„150"
  werden 600/300. Helfer zuerst: `merchants.test.ts:71` (`setHouse`), `population.test.ts:156` (`readyPioneer`),
  `townhall.test.ts:29`; danach Einzelzeilen (`population` :: 201, 307, 319, 329-356; `merchants` :: 410;
  `crises` :: 178; `tick` :: 103; `taxes` AK-S1-05/-06/-09). Der Testgedanke (Grund, Reihenfolge, Takt) bleibt.
- **P-D Pins:** siehe T03b, Schritt 3.
- **P-E Freischaltung:** `unlocks` :: 87 Schleife um `'upgrade2', 'upgrade3'` erweitern; :: 90 `FUNCTION_ENTRY` +
  `upgrade2: 'U3', upgrade3: 'U5'`; :: 91-95 `FUNCTION_LABELS` + `upgrade2: ['Ausbau Stufe 2'], upgrade3: ['Ausbau
Stufe 3']` (ebenso ein `functions`-Erwartungswert für U3/U5, falls vorhanden). `goal.test.ts` :: 171, 177, 186:
  „Handelsaufträge" → „Handelsaufträge, Ausbau Stufe 2"; „Ausgabesperre" → „Ausgabesperre, Ausbau Stufe 3".

Weiter mit [T03b-neupin.md](T03b-neupin.md).
