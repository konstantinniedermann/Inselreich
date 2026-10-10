# M13-E1 · Zuordnung der Abnahmekriterien zu Tasks

Quelle der AK-Texte: [Spec M13-E1](../../specs/2026-10-10-m13-e1-edikte-design.md) §8.3 und §10 (Stand `3acc7e2f`),
Erwartungswerte in den Anhängen 01–03. Hier steht nur, **welcher Task welche AK belegt** und womit. Arbeiter und
Reviewer lesen die AK-Texte in der Spec nach (nur die in ihrer Task-Datei genannten Nummern).

## Edikte AK-M13E1-01 … 41

| AK    | Kurzinhalt                                                   | Task        | Beleg                                                                              |
| ----- | ------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| 01    | `createWorld`: `edict null`, Sperre 0, letzte zwei Schlüssel | T02         | `tests/sim/save-v11.test.ts`                                                       |
| 02    | Def-Test §4, Werte 600 / 3000, Tabelle                       | T01         | `tests/sim/defs.test.ts`                                                           |
| 03    | Ablauf Erlass, Sperre, Wechsel, Aufheben                     | T03         | `tests/sim/edicts.test.ts`                                                         |
| 04    | Gründe und Prüfreihenfolge                                   | T03         | `tests/sim/edicts.test.ts`                                                         |
| 05    | wirft nie, keine Änderung bei `ok: false`, kein RNG          | T03         | `tests/sim/edicts.test.ts` + Quelltextprobe                                        |
| 06    | Steuer «gemischt» (`taxUnits`, `effectiveTaxPct`)            | T05         | `tests/sim/edicts.test.ts`                                                         |
| 07    | Steuer verbucht A.1 / A.2                                    | T05         | `tests/sim/edicts.test.ts`                                                         |
| 08    | Unterhalt mit Sparen, `stats.upkeep` wirksam                 | T05         | `tests/sim/edicts.test.ts`                                                         |
| 09    | Kaufpreis mit Handel, `buy` bucht 64, Ruhe bei Brand         | T04         | `tests/sim/edicts.test.ts`                                                         |
| 10    | Arbitrage je Gut, n ∈ {1, 10, 100}                           | T04         | `tests/sim/edicts.test.ts`                                                         |
| 11    | Takt 40 / 50, Schrumpfen, Phase, Ruhe 50                     | T06         | `tests/sim/edicts.test.ts`                                                         |
| 12    | Stapelregel, acht Zeilen Anhang 01 D                         | T06         | `tests/sim/edicts.test.ts`                                                         |
| 13    | Ruhe bei Ausfall / ohne Anbindung                            | T04/T05/T06 | je Task der eigene Teil (Kaufpreis / Steuer+Unterhalt / Takt+Wartezeit)            |
| 14    | Abriss: `edict null`, Sperre bleibt, keine Erstattung 600    | T03         | `tests/sim/edicts.test.ts`                                                         |
| 15    | Freischaltung, v10-Stand mit `won` erlaubt sofort            | T03         | `tests/sim/edicts.test.ts` (v10-Stand über `foldBackToV10`)                        |
| 16    | Pfadzeiten 3200 / 2950 / 2880 / 2800                         | T06         | `tests/sim/edicts.test.ts`                                                         |
| 17    | Seed-Lauf «reich»                                            | T08         | `tests/sim/balance-edicts.test.ts`                                                 |
| 18    | Seed-Lauf «Welle» (B1 Kern)                                  | T08         | `tests/sim/balance-edicts.test.ts`                                                 |
| 19    | Seed-Lauf «arm»                                              | T08         | `tests/sim/balance-edicts.test.ts`                                                 |
| 20    | Endzustand B2 «bewusst klein», Stein 48                      | T05         | `tests/sim/edicts.test.ts`                                                         |
| 21    | Baseline B3, Diff in `balance*` / Pins leer ausser T-B1      | T04, T08    | Prüfbefehl `git diff --diff-filter=M …` (T04, erneut T08)                          |
| 22    | Hash-Pins grün, `foldBackToV10`, Helfer-Test                 | T02         | `tests/sim/save-v11.test.ts` + bestehende Pin-Tests                                |
| 23    | Rundlauf v11                                                 | T02         | `tests/sim/save-v11.test.ts`                                                       |
| 24    | Migration v10 → v11, Kette v1 … v10                          | T02         | `tests/sim/save-v11.test.ts`                                                       |
| 25    | Ladeprüfung 25a–25h                                          | T02         | `tests/sim/save-v11.test.ts`                                                       |
| 26    | inkompatibel: Version 12, abgeschnitten                      | T02, T09    | Sim-Teil `save-v11.test.ts` (T02), `friendlyReason` `tests/ui/hints.test.ts` (T09) |
| 27    | `edictEffectText`, `edictWhenText`                           | T09         | `tests/ui/edictView.test.ts`                                                       |
| 28    | `edictCardState`                                             | T09         | `tests/ui/edictView.test.ts`                                                       |
| 29    | `edictLockText`, `friendlyReason('Edikt-Sperrzeit')`         | T09         | `tests/ui/edictView.test.ts`, `tests/ui/hints.test.ts`                             |
| 30    | `edictStatusLine`                                            | T09         | `tests/ui/edictView.test.ts`                                                       |
| 31    | Handel-Anzeige Kontor                                        | T11         | `tests/ui/trade.test.ts`                                                           |
| 32    | `taxButtonTitle`, `tierTaxPerMinute` 9820                    | T11         | `tests/ui/taxView.test.ts`                                                         |
| 33    | Haus-Text «Aufstieg in höchstens 4 s / 5 s»                  | T11         | `tests/ui/inspect.test.ts`                                                         |
| 34–40 | Browser Amtsstube, Handel, Abriss, 800 × 600                 | T14         | Playtest-Report, `.studio/qa/m13-e1/`; gebaut in T10–T11                           |
| 41    | Browser Slot `version 12`                                    | T14         | Playtest-Report (Verhalten besteht, `storage.ts`)                                  |

## Stilllegen AK-M13STL-01 … 11

| AK    | Kurzinhalt                                                                     | Task | Beleg                                                                                                                  |
| ----- | ------------------------------------------------------------------------------ | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| 01–08 | Aktion, Gründe, Produktion, Unterhalt, Bilanz, Brand, Ausbau/Abriss, Anbindung | T07  | `tests/sim/pause.test.ts`                                                                                              |
| 09    | UI-Helfer Zustand, Unterhaltszeile, Knopf, Grund, Marke                        | T12  | `tests/ui/panelView.test.ts`, `tests/ui/inspect.test.ts`, `tests/ui/hints.test.ts`, `tests/render/statusMarks.test.ts` |
| 10    | Browser Stilllegen                                                             | T14  | Playtest-Report, `.studio/qa/m13-e1/stl-10-*.png`                                                                      |
| 11    | Problemliste ohne stillgelegte Betriebe                                        | T12  | `tests/ui/problems.test.ts`                                                                                            |

## Plan-AK (Ergänzung lead-tech, Gate-Plan-Frage 3 «Determinismus»)

- **PLAN-M13-01 Determinismus mit Edikt:** Seed-Lauf Wohlfahrt «arm», Speichern/Laden bei Tick `won + 1000` →
  gleicher `wonMerchantsTick` und gleiches `serialize` am Ende wie ohne Laden; zweimal dieselbe Kopie → gleiche Werte
  (T08).
- **PLAN-M13-02 Importrichtung:** `tests/sim/imports.test.ts` und `tests/ui/imports.test.ts` grün; `townhall.ts`
  bleibt Blatt (PLAN-B9), neue Module `edicts.ts`, `pause.ts` ohne Kreis (T03, T07, T09).
- **PLAN-M13-03 Kein Zufall:** `src/sim/edicts.ts` und `src/sim/pause.ts` importieren weder `./rng` noch nutzen sie
  `Math.random` (Quelltextprobe in T03 bzw. T07).

## Spec-Regeln ohne eigene AK → Task

R1–R2 T03 · R3 T05 · R4 T04 · R5, R7 T06 · R6 T03 · §8 S1–S6 T07 · S7, R9 T02 · U-1…U-6 T09/T10 · U-7…U-10 T11 ·
U-11…U-13 T12 · §11 Doku T13 · §6 Baseline T04/T08 · Szenario-Stände für den Browser (Spec 10.4, R452) T07.
