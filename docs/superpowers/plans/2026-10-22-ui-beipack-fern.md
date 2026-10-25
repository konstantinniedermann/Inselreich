# Plan UI-BEIPACK-FERN · Fernauftrag-Karte, Fahrzeit-Format, Rats-Taste, Meisterprüfung-Text (Stufe leicht, Grösse S)

Owner `lead-tech` · Quelle: Kurzdesign `docs/superpowers/specs/2026-10-22-ui-beipack-fern-design.md` (`design/ui-beipack-fern` @ `651f0520`, AK-BF1 bis BF17), Gate OK R835 (F1 bis F4). Plan ohne Testläufe (Testsperre). Task-Dateien in [`2026-10-22-ui-beipack-fern/`](2026-10-22-ui-beipack-fern/).
Spielerwirkung: Auftragskarte zeigt rote Lagerzahl und «· zu spät» wie die Fernkarte; Fahrzeit überall «27 s»/«1:05»; `Umschalt+R` öffnet ohne Marke keine leere Rats-Karte; Meisterprüfung «bestanden (bei Spielzeit 12:34)», Ziel-Chip kein toter Tab-Stopp.
**Kein Save** (`SAVE_VERSION` unberührt), **kein Spielwert**, keine Abhängigkeit (ADR-001), kein ADR. **Kein `src/sim/`-Diff ausser dem Kopfkommentar in `src/sim/trial.ts`.**

## Entscheide des Plans

- **P-1 Ein Strang, ein Branch** `feat/ui-beipack-fern`, Worktree `.worktrees/ui-beipack-fern`, ab `plan/ui-beipack-fern`; vor Start `git merge main` (nie Rebase). Ein Umsetzer `tech-ui-engineer` für T01 bis T03 und T05 (Fortsetzung per `SendMessage`).
- **P-2 `farOrderParts` ist die einzige Quelle** (`farOrder.ts`); `farOrderText` und `order.ts` bauen darauf, `resumeCard.ts` verliert Anhang und lokale `farLate`-Rechnung (Spec Regeln 1 bis 3). `textContent` der Karte bleibt gleich `farOrderText`. Spans nur bei Fernauftrag, sonst Klartext; beim Wechsel keine Rest-Spans (AK-BF4).
- **P-3 Fahrzeit:** `islandCard.ts` ruft `formatGameTime(travelTicks(d))`, `clock` und `TICK_MS`-Umrechnung entfallen; Signatur unverändert (Seerecht T04 ändert sie später, Nachtrag laut R835).
- **P-4 Rats-Taste:** reiner, DOM-freier Helfer `councilToggleAllowed(world)` in `council.ts` (`councilBadge(world) !== null`); `app.ts` im Zweig `council` eine Zeile Rückkehr. `hotkeyAction` bleibt unverändert.
- **P-5 Meisterprüfung:** Texte in `trial.ts` (Chronik, Kartenstatus), `syncGoalChip` setzt `tabIndex` nur bei Änderung; Kommentar `sim/trial.ts` (AK-BF11 per `rg`).
- **P-6 Browser-Check** (T04) braucht eine lauffähige Branch; Fernauftrag mit Lager unter Menge per Konsole/Testwelt vorbereiten.

## Konflikt- und Merge-Reihenfolge

| Paket                       | Datei                                                 | Befund                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-HAEPPCHEN-I              | `src/ui/hud.ts`, `tests/ui/hud.test.ts`               | Disjunkte Stellen: I `updateMoney`/Chips, Beipack nur `syncGoalChip` und Testzeilen ≈ 601/665. Lösung per `git merge main`, kein Rebase                           |
| Seerecht                    | `src/ui/islandCard.ts`, `tests/ui/islandCard.test.ts` | **Beipack läuft vor Seerecht T04** und vereinheitlicht auf `formatGameTime`; Seerecht T04 ersetzt danach nur das Argument; AK-SR-16 «30 s»/«24 s» (Nachtrag R835) |
| Stadtplanung                | `src/ui/app.ts`                                       | Beipack: eine Zeile im Zweig `council` (≈ 1118); Stadtplanung 7 Hunks, automatischer Merge zu erwarten; wer später mergt, löst per `git merge main`               |
| UI-HAEPPCHEN-H P1/P2, LEBEN | –                                                     | keine gemeinsamen Dateien (H: `menu`, `startCard`, `storage`, `overlays`, `renderer`)                                                                             |

Der Umsetzer hält den `app.ts`-Diff in einem **eigenen Commit**.

## Dateimatrix (Ownership)

| Datei                                                                                                                                                 | T01 | T02 | T03 | T05 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | --- |
| `src/ui/farOrder.ts`, `order.ts`, `resumeCard.ts`, `src/style.css` (ein Selektor)                                                                     | ja  |     |     |     |
| `tests/ui/farOrder.test.ts`, `order.test.ts`, `resumeCard.test.ts`                                                                                    | ja  |     |     |     |
| `src/ui/islandCard.ts`, `tests/ui/islandCard.test.ts`                                                                                                 |     | ja  |     |     |
| `tests/ui/hud.test.ts` (Zeilen ≈ 601/665 + Pin-Test)                                                                                                  |     | ja  |     |     |
| `src/ui/council.ts`, `src/ui/app.ts` (eigener Commit), `tests/ui/council.test.ts`                                                                     |     |     | ja  |     |
| `src/ui/trial.ts`, `src/ui/hud.ts` (`syncGoalChip`), `src/sim/trial.ts` (Kommentar), `tests/ui/trial.test.ts`, `tests/ui/hud.test.ts` (tabIndex-Test) |     |     | ja  |     |
| `README.md`                                                                                                                                           |     |     |     | ja  |

Nicht angefasst: `src/render/`, `src/audio/`, `src/sim/` ausser Kommentar, `docs/studio/`, Specs. `hud.test.ts` hat zwei Task-Eigner (T02 Tooltip-Zeilen, T03 neuer tabIndex-Test); sie laufen seriell, derselbe Umsetzer.

## Tasks

| Task | Titel                                                       | Datei                        | AK-IDs        | Strang | blocked-by | Modell      | Tools | Persona                             |
| ---- | ----------------------------------------------------------- | ---------------------------- | ------------- | ------ | ---------- | ----------- | ----- | ----------------------------------- |
| T01  | Fernauftrag: `farOrderParts`, Spans, `resumeCard`, CSS      | `T01-fernauftrag.md`         | BF1 bis BF5   | 1      | –          | sonnet      | 40    | `tech-ui-engineer`                  |
| T02  | Fahrzeit-Format Inselkarte, `FAR_TRAVEL_TIP`-Test           | `T02-fahrzeit.md`            | BF6, BF7      | 1      | T01        | sonnet      | 20    | `tech-ui-engineer`                  |
| T03  | Rats-Taste, Meisterprüfung-Texte, Ziel-Chip, Kommentar      | `T03-rat-meisterpruefung.md` | BF8 bis BF11  | 1      | T02        | sonnet      | 30    | `tech-ui-engineer`                  |
| T04  | Task-Review (opus, gilt als Final-Review) und Browser-Check | `T04-review-playtest.md`     | BF12 bis BF17 | 1      | T03        | opus/sonnet | 30    | `qa-code-reviewer`, `qa-playtester` |
| T05  | Doku: README (Regel 8), Lauf AK-BF12                        | `T05-doku.md`                | BF12          | 1      | T04        | sonnet      | 10    | `tech-ui-engineer`                  |

## Budget (Vorschlag für das Gate Plan)

**Gesamt 4 Starts, Parallelität 1** (ein Strang). Geplant **3**: T01-Umsetzer (1, Fortsetzung für T02, T03, T05 per `SendMessage`, zählt nicht), Review `qa-code-reviewer` auf **opus** über die ganze Branch (2, ersetzt bei Grösse S das Final-Review), Browser-Check `qa-playtester` (3). **Reserve 1** für eine Fix-Runde ohne `SendMessage`-Weg; Delta-Review (R553) per `SendMessage` zählt nicht. Rechnung: 3 × 1,3 aufgerundet = 4. Controller: Lead `sonnet`, 12 Tools Steuerung.

## Test- und Prüfpflichten (für das Umsetzer-Briefing wörtlich)

- **Testsperre (R380):** Tests erst bei freier Sperre (`uptime`: 1-min-Load ≤ 4, kein anderer `vitest`/`make check`-Lauf; sonst `waiting` melden).
- **Gezielt, nie `make check` je Task:** T01 `npx vitest run tests/ui/farOrder.test.ts tests/ui/order.test.ts tests/ui/resumeCard.test.ts; echo EXIT=$?`. T02 `npx vitest run tests/ui/islandCard.test.ts tests/ui/hud.test.ts; echo EXIT=$?`. T03 `npx vitest run tests/ui/council.test.ts tests/ui/trial.test.ts tests/ui/hud.test.ts; echo EXIT=$?`. Je Task `npx tsc --noEmit; echo EXIT=$?` und `npx eslint <Dateien> && npx prettier --check <Dateien>; echo EXIT=$?`.
- **Rot zuerst:** Test vor der Umsetzung laufen lassen, rote Ausgabe im Bericht.
- **Zeittests (R270):** keine Uhr in neuen Tests; Zeiten über `formatGameTime`/`formatClock`, daneben feste Texte laut Spec.
- **Abschluss (Controller, einmal):** `make check; echo EXIT=$?` bei freier Sperre, `tests/sim/balance.test.ts` grün, `git diff main -- src/sim` nur Kommentar in `trial.ts`, `SAVE_VERSION` unberührt.
- Keine `Contract`-Literale in neuen Tests (R679-2).

## AK-Zuordnung (17 AK)

| AK            | Beleg                                                    | Task |
| ------------- | -------------------------------------------------------- | ---- |
| BF1, BF2      | `tests/ui/farOrder.test.ts`                              | T01  |
| BF3, BF4      | `tests/ui/order.test.ts`                                 | T01  |
| BF5           | `tests/ui/resumeCard.test.ts`                            | T01  |
| BF6           | `tests/ui/islandCard.test.ts`                            | T02  |
| BF7           | `tests/ui/hud.test.ts`                                   | T02  |
| BF8           | `tests/ui/council.test.ts`                               | T03  |
| BF9           | `tests/ui/trial.test.ts`                                 | T03  |
| BF10          | `tests/ui/hud.test.ts`                                   | T03  |
| BF11          | `rg "Start" src/sim/trial.ts` (Zeile 1) im Review        | T03  |
| BF12          | Lauf: Sim-Diff, `SAVE_VERSION`, `balance.test.ts`        | T05  |
| BF13 bis BF17 | Browser-Check, Screenshots `.studio/qa/ui-beipack-fern/` | T04  |

## Ruling-Entwürfe (für `docs/studio/rulings.md`, L0 entscheidet)

- **R836-E (Gate Plan UI-BEIPACK-FERN):** Plan freigegeben: ein Strang `feat/ui-beipack-fern`, ein Umsetzer; Budget 4 Starts (3 geplant, 1 Reserve), Parallelität 1; opus-Review über die Branch ersetzt das Final-Review (Grösse S); kein Save, kein Spielwert, kein ADR.
- **R837-E (Merge-Reihenfolge):** Beipack vor Seerecht T04 (Fahrzeit-Format); UI-HAEPPCHEN-I und Stadtplanung unabhängig, wer später mergt löst per `git merge main`, kein Rebase; `app.ts`-Diff in eigenem Commit.
- **R838-E (`farOrderParts` als Quelle):** `farOrderText` = `lead + stock + «· zu spät»` aus `farOrderParts`; `resumeCard` hängt «zu spät» nicht mehr selbst an; die Karte trägt `far-stock--low` wie die Fernkarte.
- **R839-E (Seerecht-Nachtrag zugestellt):** AK-SR-16 «Fahrzeit 30 s»/«24 s», T04 ersetzt nur das Argument von `formatGameTime`; Zustellung an den Seerecht-Lead durch L0.
