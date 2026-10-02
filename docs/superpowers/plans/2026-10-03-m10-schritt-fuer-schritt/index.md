# M10 „Schritt für Schritt" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freischaltbaum U0–U6 in der Sim (gespeichert, monoton, bitgleich zum Referenzlauf), Amtsstube mit wirksamer
Steuer und Ausgabesperre, Werkzeugmacher mit Schulbedingung, Wald roden und aufforsten, Save v5 — und in der
Bedienung nur Freigeschaltetes, Freischalt-Meldung, Hilfe-Karte, Mouse-over und ein erster Symbolsatz.

**Architecture:** Die Regel liegt in der Sim: `src/sim/unlocks.ts` (Freischaltung, rein bis auf `tickUnlocks`),
`src/sim/townhall.ts` (Blatt-Modul: Amtsstube wirkt, wirksame Steuer, wirksame Sperren), `src/sim/forest.ts`
(Forst-Aktionen). Alle Werte und Texte stehen in `src/sim/defs/` (`unlocks.ts`, `forest.ts`, `buildings.ts`). Die UI
liest nur über reine Sim-Abfragen (`buildingShown`, `goodUnlocked`, `functionLock`, `nextUnlocks`,
`effectiveTaxLevel`) und reine UI-Helfer (`unlockNoticeText`, `helpSections`, `hoverInfo`, `iconSvg`); DOM-Aufbau
bleibt daneben im selben Modul (Muster M7-UX). `tickUnlocks` ist der letzte Aufruf in `step` — daran hängt die
Bitgleichheit.

**Tech Stack:** TypeScript, Vite, Vitest (`node`), Canvas 2D, SVG-Pfade für Symbole. Keine neue Abhängigkeit
(ADR-001), auch keine Dev-Abhängigkeit.

**Status:** Gate Plan **bestanden mit Auflagen (R164)**; Auflagen QA 1–4 und Production B1, B3–B5 sind eingearbeitet
(Abschnitt „Auflagen Gate Plan (R164)"), Budget gestuft (B2). Prozessstufe voll.

**Spec:** `docs/superpowers/specs/2026-10-03-m10-schritt-fuer-schritt-spec.md` @ `0797218` (Branch
`docs/m10-design`; Gate Spec bestanden mit Auflagen R163, Delta eingearbeitet; **98 AK**; im Plan „Spec §n",
„AK-…"). Rulings: R148 (Programm), R150–R152 (M8 S11), R155 (Gate Brainstorming, H-S1 in M10), R159 (`renderer.ts`
seriell H-R2 → H-R3/H-R4 → M10-U2), R161/R162 (M8-B1-Baseline), R163 (Gate Spec, B9/B11 an den Plan).
Formvorlage: M8-Plan `docs/superpowers/plans/2026-10-02-m8-kaufleute.md`.

**Testnamen:** Jeder neue Test beginnt mit der AK-Nummer bzw. `RF-<n>` / `PLAN-B9` und steht in einem
`describe('M10 …')` (M5–M8 nutzen dieselben Kennungen). Abdeckungs-Grep der Reviews:

```bash
npx vitest run --reporter=verbose 2>&1 | grep -oE "M10[^>]*> (AK-[A-Z0-9]+-[0-9]+|RF-[0-9]|PLAN-B9)" | sed -E 's/.*> //' | sort -u
```

## Global Constraints

- **Basis:** `<BASIS>` = `main` nach dem **Gate Merge M8** (M8-UI, M8-Render, M8-Balance, M8-Scen gemergt). Der
  Controller notiert den SHA im Ledger `.superpowers/sdd/m10/ledger.md`, bevor der erste Sim-Worktree entsteht.
  Ausnahme: Paket A1 (lead-art) startet schon nach dem Gate Plan auf dem dann aktuellen `main` (nur neue Dateien).
- `src/sim/` bleibt DOM-frei und deterministisch: kein `Date`, kein `Math.random`, Zufall nur über `src/sim/rng.ts`
  (M10 braucht keinen Zufall; `forest.ts`, `unlocks.ts`, `townhall.ts` importieren `rng.ts` nicht).
- Sim-Aktionen werfen nie; sie liefern `{ ok, reason }`. `deserialize` wirft nie.
- **Spielwerte und Texte nur in `src/sim/defs/`:** `UNLOCKS` (Spec 4.2, 4.5), U1 `trigger.min` **20**, Amtsstube
  (5.1), `toolmaker.requiresService`, `CLEAR_FOREST_COST` / `PLANT_FOREST_COST` (6). Kein Schwellwert im Code; Texte
  mit Zahlen über Platzhalter (`{min}`, `{max}`, `{WIN_CITIZENS}`).
- **Unverändert gegen `<BASIS>`** (`git diff <BASIS> -- <Pfad>` leer): `tests/sim/balance.test.ts`,
  `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, `tests/sim/balance-merchants.test.ts`,
  `src/sim/defs/tiers.ts`, `src/sim/defs/goods.ts`, `src/sim/defs/timing.ts`, `package.json`, `package-lock.json`.
  `tests/sim/balance-crises.test.ts` ändert nur `normalized()` (Spec 9.2).
- **Bitgleich:** Sieg **6050**, `minMoney` **57** (Krisen aus); Krisen „normal" Sieg **7050**, `minMoney` **56**;
  `OFF_REFERENCE` und `OFF_FINGERPRINT` (`0xbfeac8c6`) unverändert; M8-B1 nach R162: `winTick` wie gemessen,
  erster Kaufmann **8550**, zweites Ziel **10 100**, Bürger-Endzustand **7300 / 1490**. Messung nach Abschnitt
  „Bitgleich-Messung".
- **Save:** `SAVE_VERSION = 5`; Kette v1 → v2 → v3 → v4 → v5; Speicherschlüssel `inselreich.save.v1` und
  `inselreich.save.auto` bleiben.
- **Importrichtung `src/sim/` (Entscheid B9, unten):** `townhall.ts` importiert nur `./types` und `./defs/*`;
  `population.ts` importiert nie `unlocks.ts`; `src/sim/` bleibt ohne Importkreis (Test `PLAN-B9`).
- Kein sichtbarer Text, kein `title`, kein `aria-label` enthält „Tick" (M7:AK-UX-13). Kosten im Format `costLine`,
  Raten „/ min".
- `src/render/` schreibt nie in die Welt; `src/audio/` ändert nur U1 (Ereignis `'unlock'`).
- Desktop-first ab 1280 px; unter 1280 px nur „stürzt nicht ab" (R78).
- **Kein Test fällt weg:** je Testdatei Zahl der `it(`/`test(` nachher ≥ vorher. Zählbefehl je Task:
  `for f in $(git diff --name-only <BASIS> -- tests); do a=$(git show <BASIS>:$f 2>/dev/null | grep -cE "^\s*(it|test)(\.\w+)?\(" ); b=$(grep -cE "^\s*(it|test)(\.\w+)?\(" $f); echo "$f $a -> $b"; done`.
  Geänderte Zeilen in bestehenden Tests nur nach Abschnitt „Bewusst geänderte Tests".
- Commits mit Präfix `feat:`, `fix:`, `test:`, `refactor:`, `docs:`; je Task mindestens ein Commit.
- **Push-Pflicht (R107, R143 B5):** nach jedem abgenommenen Commit und nach jedem grünen Integrations-Merge sofort
  `git -C .worktrees/<strang> push -u origin <branch>`. Kein Pull Request für Zwischenstände.
- **Nie rebasen** (Verfassung §6.3), auch nicht in Worktrees. Integration nur per `git merge --no-edit <geprüfter SHA>`;
  im Hauptcheckout nur `git pull --ff-only`.

## Review Focus

Eingaben und Zustände, die die Spec impliziert, aber kein AK direkt prüft (jede Zeile hat einen `RF-`Test im
genannten Task):

1. **Gespeicherte Freischaltung schlägt Live-Prädikat:** Ein v5-Stand mit `unlocked ['U0', 'U6']` und `won false`
   lädt `ok`; `buildLock(w, 'bathhouse')` ist `null`, U6 bleibt nach einem Schritt drin, U2–U5 werden **nicht**
   nachgezogen (Kette nur über Auslöser). → `RF-1` in Task 1.
2. **Brennende Amtsstube mit Sperre:** Solange `outageUntil` gesetzt ist, entnimmt ein Siedlerhaus trotz Sperre
   `(2, 'cloth')` Stoff und die Steuer wirkt „normal"; nach dem Brand wirken Sperre und Stufe wieder,
   `goodLocks` und `taxLevel` sind unverändert. → `RF-2` in Task 4.
3. **Forst-Aktion auf einer Nicht-Ursprungskachel eines 2×2-Gebäudes und mit `NaN`:** `'Bereits bebaut'` bzw.
   `'Ausserhalb der Karte'`, Welt unverändert, kein Wurf. → `RF-3` in Task 3.
4. **Zwei Freischaltungen in verschiedenen Ticks desselben Frames (4×):** genau eine Meldung mit beiden Einträgen und
   genau ein Ton `unlock`, Basis ist der Stand am Frame-Anfang. → `RF-4` in Task 6.
5. **Sperr-Matrix nach Schrumpfen einer Stufe auf 0 Einwohner:** Zeile verschwindet, Sperre bleibt gespeichert;
   kommt die Stufe zurück, ist die Zelle wieder `aria-pressed="true"`. → `RF-5` in Task 7.

## Organisation

## Task-Tabelle (Einstieg für Controller und Arbeiter: nur die eigene Datei lesen)

| Task | Titel                                                                                               | Datei                                                                                                                                                                                                                                                                                      | AK-IDs                                                                                                                               | Strang | blocked-by                                                                  | Modell                                 |
| ---- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------- | -------------------------------------- |
| T01  | S1a — Vorlauf Fixture v4, Freischalt-Modell, Save v5                                                | [T01a-freischalt-modell.md](T01a-freischalt-modell.md) · [T01b-freischalt-modell.md](T01b-freischalt-modell.md) · [T01c-freischalt-modell.md](T01c-freischalt-modell.md) · [T01d-freischalt-modell.md](T01d-freischalt-modell.md) · [T01e-freischalt-modell.md](T01e-freischalt-modell.md) | AK-S1-01, -02, -03, -04, -05 (a, b, Strukturteil c), -10, -11, -12, -13, -14 (a, b, c1, d–g), -15, -16 (BG-1), -20 (Fixture), `RF-1` | sim    | Gate Plan, Gate Merge M8                                                    | sonnet                                 |
| T02  | S1b — Sperren in Bau, Handel und Aufträgen, „Alles frei" in Tests, `nextStep`-Filter                | [T02a-sperren.md](T02a-sperren.md) · [T02b-sperren.md](T02b-sperren.md)                                                                                                                                                                                                                    | AK-S1-06, -07, -08, -09, -16 (BG-1), -17, -18, -19                                                                                   | sim    | Task 1 (Review OK)                                                          | sonnet                                 |
| T03  | F1 — Wald roden und aufforsten (Sim), `layoutKey` mit Geländeart                                    | [T03a-wald-roden.md](T03a-wald-roden.md) · [T03b-wald-roden.md](T03b-wald-roden.md) · [T03c-wald-roden.md](T03c-wald-roden.md)                                                                                                                                                             | AK-F1-01 … -08, -09 (a), -10, `RF-3`, BG-1                                                                                           | forest | Task 1 (Review OK)                                                          | sonnet                                 |
| T04  | S2 — Amtsstube, wirksame Steuer, Ausgabesperre, Werkzeugmacher `noService`, Aufstiegsstopp, Taste I | [T04a-amtsstube.md](T04a-amtsstube.md) · [T04b-amtsstube.md](T04b-amtsstube.md) · [T04c-amtsstube.md](T04c-amtsstube.md)                                                                                                                                                                   | AK-S2-01 … -17, AK-S1-14 (c2), AK-F1-09 (b), `RF-2`, `PLAN-B9`, BG-1                                                                 | sim    | Task 2, Task 3                                                              | sonnet                                 |
| T05  | B1 — Freischalt-Messung, M8-B1-Messung, Szenarien `m10-*` mit Prüfpunkten                           | [T05a-messung-szenarien.md](T05a-messung-szenarien.md) · [T05b-messung-szenarien.md](T05b-messung-szenarien.md) · [T05c-messung-szenarien.md](T05c-messung-szenarien.md)                                                                                                                   | AK-B1-01, -02 (BG-2), -03, -04 (Messwerte im Bericht)                                                                                | scen   | Task 4                                                                      | sonnet                                 |
| T06  | U1 — Bedienung zeigt nur Freigeschaltetes, Meldung, Ton, „Alles frei", Kopfzeile, Dev-Sonde         | [T06a-bedienung-freigeschaltet.md](T06a-bedienung-freigeschaltet.md) · [T06b-bedienung-freigeschaltet.md](T06b-bedienung-freigeschaltet.md) · [T06c-bedienung-freigeschaltet.md](T06c-bedienung-freigeschaltet.md)                                                                         | Vitest-Teile von AK-U1-01 … -13 (Browser-Teile in QA-U1), `RF-4`                                                                     | ui     | Task 4                                                                      | sonnet                                 |
| T07  | U2 — Hilfe-Karte, `nextStep`, Forst-Bedienung, Amtsstuben-Panel, Tooltips, Gründe, K4, K5           | [T07a-hilfe-forst-amtsstube.md](T07a-hilfe-forst-amtsstube.md) · [T07b-hilfe-forst-amtsstube.md](T07b-hilfe-forst-amtsstube.md) · [T07c-hilfe-forst-amtsstube.md](T07c-hilfe-forst-amtsstube.md)                                                                                           | Vitest-Teile AK-U2-01, -02, -07, -10, -11, -12 (Browser-Teile in QA-U2), `RF-5`                                                      | ui     | QA-U1 (OK), R1 (Review OK, gemergt), **M9 H-R3 und H-R4 auf `main`** (R159) | sonnet                                 |
| T08  | U3 — Mouse-over                                                                                     | [T08a-mouse-over.md](T08a-mouse-over.md) · [T08b-mouse-over.md](T08b-mouse-over.md)                                                                                                                                                                                                        | AK-U3-01, -02, -03, -06 (Vitest); AK-U3-04, -05 in QA-U3                                                                             | ui     | Task 7 (Review OK)                                                          | sonnet                                 |
| T09  | U4 — Symbole im Einbau, Kann K2 und K3                                                              | [T09-symbole-einbau.md](T09-symbole-einbau.md)                                                                                                                                                                                                                                             | Vitest-Teile AK-U4-01, -04; Browser AK-U4-01 … -05 in QA-U4                                                                          | ui     | Task 8 (Review OK), A1 (Review OK)                                          | sonnet                                 |
| A1   | Symbolsatz `icons.ts` (lead-art)                                                                    | [A1-symbolsatz.md](A1-symbolsatz.md)                                                                                                                                                                                                                                                       | AK-A1-01 … -03                                                                                                                       | icons  | Gate Plan                                                                   | art-rendering-engineer (siehe orga-01) |
| R1   | Amtsstube-Silhouette, Terrain-Teil-Neuzeichnung, Cache-Kommentare (lead-art)                        | [R1-amtsstube-terrain.md](R1-amtsstube-terrain.md)                                                                                                                                                                                                                                         | AK-R1-01 … -05                                                                                                                       | render | Task 4                                                                      | art-rendering-engineer (siehe orga-01) |
| QA   | QA-U1 … QA-U4, QA-ART (Browser-Checks)                                                              | [qa-checks.md](qa-checks.md)                                                                                                                                                                                                                                                               | Browser-Teile der AK                                                                                                                 | qa     | je Task-SHA (siehe orga-14)                                                 | sonnet                                 |
| D1   | Abschluss, Final-Review, Gate Merge, Doku D1                                                        | [abschluss.md](abschluss.md)                                                                                                                                                                                                                                                               | AK-D1-01 … -03, AK-B1-04                                                                                                             | ui     | QA-U2, QA-U3, QA-U4                                                         | lead-tech                              |

**Organisation** (aus dem alten Abschnitt „Organisation" nach `###` geteilt):

- [orga-01-tasks-pakete-rollen.md](orga-01-tasks-pakete-rollen.md)
- [orga-02-entscheide.md](orga-02-entscheide.md)
- [orga-03-abweichungen.md](orga-03-abweichungen.md)
- [orga-04-auflagen-gate-plan.md](orga-04-auflagen-gate-plan.md)
- [orga-05-plan-abweichungen.md](orga-05-plan-abweichungen.md)
- [orga-06-schnittstellen.md](orga-06-schnittstellen.md)
- [orga-07-datei-ownership.md](orga-07-datei-ownership.md)
- [orga-08-abhaengigkeiten-extern.md](orga-08-abhaengigkeiten-extern.md)
- [orga-09-wellen-merges.md](orga-09-wellen-merges.md)
- [orga-10-ablauf-je-task.md](orga-10-ablauf-je-task.md)
- [orga-11-bitgleich.md](orga-11-bitgleich.md)
- [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
- [orga-13-e010-controller-wechsel.md](orga-13-e010-controller-wechsel.md)
- [orga-14-qa-uebersicht.md](orga-14-qa-uebersicht.md)
- [orga-15-streichvariante.md](orga-15-streichvariante.md)
- [orga-16-budgetantrag.md](orga-16-budgetantrag.md)
- [abdeckung.md](abdeckung.md) — Abdeckung AK → Task
