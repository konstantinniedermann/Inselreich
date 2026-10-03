# Anhang 02 — Baseline, rote Tests, Fixtures, Szenario-Saves (Spec M11)

Gehört zu [Spec M11](../2026-10-03-m11-wirtschaft-im-fluss-spec.md), Abschnitte 6 und 11. Sollwerte „M-nn" stehen gemessen in
Spec Abschnitt 14 (Anhang 03).

## A. Was bricht, was bleibt

| Punkt                               | Geld/Siegtick Referenz      | Fingerabdruck | Grund                                                        |
| ----------------------------------- | --------------------------- | ------------- | ------------------------------------------------------------ |
| S10 Buchung je Tick                 | **bricht**                  | bricht        | Steuer aus dem Tick-Mittel statt aus dem Stand am 100er-Tick |
| Dämpfung prospektiv                 | **bricht** (Verlauf)        | bricht        | 3 Aufstiege später [Mess]                                    |
| S2 Jagdhütte, Rinderfarm            | bleibt                      | bleibt        | Controller baut sie nie                                      |
| S3 `noForest`, `free` am Holzfäller | bleibt, wenn A9 hält (M-09) | bleibt        | Controller rodet nie; Layout hat freien Wald (zu belegen)    |
| S4 `eff`                            | bleibt                      | normalisiert  | Geld und Waren hängen nicht an `eff`                         |
| S12 `level`, Ausbau                 | bleibt                      | normalisiert  | Controller baut nie aus                                      |
| R161 Hinweis                        | bleibt                      | bleibt        | nur UI                                                       |
| U-Einträge (`hunter`, …)            | bleibt                      | normalisiert  | `unlocked` wird schon von M10 entfernt                       |

## B. Normalisierung des Fingerabdrucks (`tests/sim/balance-crises.test.ts`, `normalized()`)

Zusätzlich zu M10 (`unlocked`, `goodLocks`, `upgradeStops`, M10-Schnittstelle): `delete raw.taxCarry`,
`delete raw.upkeepCarry`, je Gebäude `delete b.eff` und `delete b.level`. `version` bleibt auf dem Referenzwert 2
gesetzt. Der neue Sollwert `OFF_FINGERPRINT` ist trotzdem neu (Geldverlauf, M-06).

## C. Neupin-Prozedur (P1, Ruling R185 trägt den Bruch)

1. Vor P1, auf `main` nach dem M10-Merge: Messung der Ist-Werte (sollen M10 9.3 entsprechen) und Erzeugung der
   Fixture `save-v5.json` (E).
2. P1 implementiert S10 und Dämpfung; `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance` gibt die Laufdaten aus.
3. Vergleich mit Anhang 03. **Gleich:** Pins übernehmen. **Abweichend:** nicht nachstellen, Meldung an L0 mit
   Messwerten (R74-Regel); Schwellen bleiben (≤ 7500, ≤ 8000, ≤ 12 000).
4. Pins im Test-Code mit Kommentar „M11 R185, gemessen auf <Commit>"; alte Werte im Kommentar.

| Pin (Datei, Konstante/Test)                                | Alt                                | Neu                                       |
| ---------------------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| `balance-crises` `OFF_REFERENCE.winTick`                   | 6050                               | 6750 (M-01)                               |
| `OFF_REFERENCE.minMoney` / `endMoney`                      | 57 / 212                           | 117 (M-02) / 339 (M-03)                   |
| `OFF_REFERENCE.firstSettler` / `firstCitizen`              | 350 / 3850                         | 350 / 4150 (M-04)                         |
| `OFF_REFERENCE.buildings` (u. a. `distillery` 3, A13)      | wie Ist                            | Messwert der Umsetzung (M-05)             |
| `OFF_FINGERPRINT`                                          | 0xbfeac8c6 (M10: neu)              | 0x701c6da5 (M-06)                         |
| `AK-S1-15` Sieg / minMoney (Stufe `off`)                   | 6050 / 57                          | = M-01 / M-02                             |
| Krisen „normal" + Feuerwache Sieg (`CRISIS_WIN_STOP` 8000) | 7050                               | 7850 (M-07)                               |
| `balance-merchants` `WIN_TICK`, Ziel 2 (≤ 12 000)          | 6050 / 10 100                      | 6750 / 11 200 (M-01, M-08)                |
| `minMoneyAfterWin` (M8 B1)                                 | Ist                                | 320 (M-10)                                |
| M10 9.3 Freischalt-Ticks U2/U3/U4/U5/U6 (off; „normal")    | 150/350/550/3850/6050; …/4750/7050 | 150/350/550/4150/6750; …/5150/7850 (M-11) |

## D. Erwartet rote Tests nach P1 und ihre Umschreibung

Messprobe: 14 von 304 Tests rot (Stand `main` 1c7d587, vor M10); nach dem M10-Merge kommen die Freischalt-Pins aus
M10 9.3 hinzu (Zahl M-12). Die P1-Tasks benennen die endgültige Liste aus dem roten Lauf.

| Gruppe                   | Tests (Kandidaten am Ist-Code)                                                                                                                                                                                                                                                                                                                                                              | Umschreibung                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Exakte Pins (4)          | `balance-crises` AK-B1-02 (`OFF_REFERENCE`, Fingerabdruck), AK-S1-15, `balance-merchants` AK-B1-01 (`WIN_TICK`)                                                                                                                                                                                                                                                                             | Neupin nach C                                                             |
| Laden im Sturm (1 der 4) | `balance-crises` AK-B2-06 (Laden bei Tick 2601)                                                                                                                                                                                                                                                                                                                                             | **keine** Umschreibung: wird mit Übertrag im Save wieder grün (AK-SAV-03) |
| Buchungstakt (≈ 10)      | `economy` „sums building upkeep and books it every 100 ticks", „pays and refunds…"; `taxes` „always updates stats but books only every UPKEEP_INTERVAL ticks", „books taxes and upkeep together at tick 100 via step", RF-2 „Umschalten bei Tick 99…"; `merchants` AK-S1-05, AK-S1-10, AK-S1-04; `fire` AK-S2-03/-04/-06/-12; `population` „upgrades pioneer house…", „settler to citizen…" | Muster unten                                                              |

**Muster der Umschreibung (Setzung Spec):**

- „bucht erst bei Tick 100" → „bucht je Tick": nach `n` Schritten mit konstantem Zustand gilt
  `money = m0 + floor((n × taxUnits + carry0) / 20 000) − floor((n × upkeep + carry0') / 100)`; für `n = 100` und
  Überträge 0: `m0 + stats.taxes − stats.upkeep` (± 0, da beide ganzzahlig teilen).
- Tests, die nur Kosten oder Erstattung prüfen und vorher `tick = 100` setzen: Überträge vor dem Aufruf auf 0 und
  Steuer/Unterhalt der Testwelt so wählen, dass ein Schritt kein Geld bucht (z. B. Testwelt ohne Häuser, Unterhalt
  < 100 → erste Buchung erst nach ≥ 2 Schritten), oder den Vergleich gegen einen Zwilling ohne die Aktion führen
  (Muster `fire` AK-S2-12).
- `merchants` AK-S1-05 „Steuer 300 (ohne Aufstieg 210)": vergleicht `stats.taxes` (bleibt Nominalwert), nicht `money`.
- Kein Test wird gelöscht; jede Umschreibung nennt im Testnamen „(M11 S10)".

## E. Fixture `tests/sim/fixtures/save-v5.json` (Setzung Spec)

Erzeugt mit dem Sim-Code von `main` **nach dem M10-Merge, vor M11-P1** (erster Task von P1): Controller Seed 3,
Krisen „normal" mit Feuerwache, angehalten bei **Tick 2650** (Sturm aktiv ab 2601, Messprobe), danach
`serialize`. Inhalt prüfbar: `version 5`, kein `taxCarry`, kein `eff`, kein `level`, `crisis.kind 'storm'`.
Testkommentar nennt Erzeugungs-Commit und -weg. `tests/sim/fixtures/` steht schon in `.prettierignore`
(M10-Schnittstelle: dort angelegt mit `save-v4.json`).

## F. Szenario-Saves für Browser-Checks (B1, `tests/sim/scenarios.ts`, Muster M10 18.1)

| Name          | Inhalt                                                                                                               | für AK                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `m11-fluss`   | Referenzlauf bis Tick 3000, Krisen „aus", Bilanz ≥ +500 je 100 Ticks, `unlocked` bis U4                              | AK-UI-01, -02, AK-RND-05 |
| `m11-wald`    | U0–U3 frei; 1 Jagdhütte mit genau 10 freien Waldkacheln, 1 Holzfäller mit 1 freier Waldkachel, Geld 1000, Roden frei | AK-UI-06, AK-RND-05      |
| `m11-ausbau`  | U0–U5 frei; je 1 Fischer Stufe 1/2/3, Weberei 2 + Schäferei 1 (`waitingInput`), Stoff 10, Rum 10, Geld 2000          | AK-UI-04, -08, AK-RND-05 |
| `m11-defizit` | 1 volles Siedlerhaus (8 EW) mit allen Diensten, 0 Brennereien, Rum 40 im Lager, U4 frei, Steuer „normal"             | AK-UI-07                 |
| `m11-stein`   | `won true`, 1 Glashütte, Stein 4, 1 volles Bürgerhaus mit erfüllten Bedürfnissen                                     | AK-R161-02               |

Jede Szene: `isWellFormed` ok, `deserialize(serialize(w))` gleich, Krisen „aus" ausser `m11-fluss`-Variante
„normal". Erzeugung ohne Zufall ausser dem Seed 3.

## G. Browser-Check-Rahmen

Wie M10 18: Chrome per CDP, 1280 × 800 und 1920 × 1080, Echtzeit höchstens 1 min plus ein Lauf bei 4×. Messbar:
`textContent` eines `data-field`, Welt-Werte per Dev-Werkzeug (wie M10 18;
Spielstand über „Speichern" exportiert und mit `deserialize` gelesen). Kein UI-Text enthält „Tick" (M7:AK-UX-13). Urteil „lesbar/erkennbar" fällt `lead-qa`
mit `lead-art` (Silhouetten).
