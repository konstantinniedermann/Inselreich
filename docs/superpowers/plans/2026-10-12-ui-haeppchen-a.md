# Plan UI-HAEPPCHEN-A · Unterhalt lesbar, Wege ziehen, Tastenhinweis (Kurzplan, Stufe leicht)

Owner `lead-tech` · Quelle: `docs/ideen.md` I-062, I-063, I-083 (R529, IDEEN-08); R566, R571 (I-048 Schritt B verworfen).
Umsetzung **erst nach Merge M14-E1 und nach UI-AUFRAEUM-2** (`2026-10-11-ui-aufraeum-2.md`).
Spielerwirkung: Der Spieler findet den Verlustbringer in der Bilanz, zieht Strassenraster ohne Zickzack und erfährt, was eine unbelegte Zifferntaste tut.
**Kein Sim-Eingriff** (nur lesend und über die bestehende Aktion `placeRoad`), **kein Save-Sprung**, keine neue Abhängigkeit (ADR-001), Spielwerte unberührt, Baseline bitgleich.

## Lücke für das Gate (E-061)

Zu I-062, I-063, I-083 und zum Ausblenden gibt es **keine Spec mit AK**; die AK stehen unten im Plan. Das Gate bestätigt sie. Zwei Abweichungen von den Ideen-Texten, vom Gate zu entscheiden:

1. **I-062 «Stillgelegte … kostet nichts» ist falsch:** `buildingUpkeep` (`src/sim/levels.ts:18`) rechnet Stillgelegte mit `PAUSED_UPKEEP_PCT = 50`. Plan: Stillgelegte stehen **nach ihrem tatsächlichen Wert** in der Rangliste, Marke «stillgelegt», kein «kostet nichts».
2. **«Kauf n %»-Anzeige:** Gemeint ist die Zeile `buy-pct-<gut>` im Handelsfenster (`trade.ts:205`). Plan: **ganz entfernen** (nicht nur bei 100 %), weil `buyPct` auf main inaktiv ist. Der Knopftitel «… im Mittel n %» (`buyTitleText`) bleibt, damit ein späteres Aktivieren sichtbar bleibt.

## Architektur (Kurzdesign)

- **I-062:** reiner Helfer `src/ui/upkeepRank.ts`: `upkeepRanking(world)` liefert Einträge `{ id, island, defId, upkeep, util, paused }`, sortiert nach `buildingUpkeep(b)` absteigend, dann Auslastung aufsteigend (`utilization`), dann ID. Ausgenommen: Häuser (`b.house`) ohne Unterhalt. Der Bilanz-Chip wird zum Knopf und öffnet eine Karte (`modal.ts`) mit Zeilen als Knöpfe, die per bestehendem Sprungpfad (wie `goodFocus`/`problems`: `jumpTarget`, `spot`) zum Gebäude springen. Fusszeile: Summe = `world.stats.upkeep` (kein zweiter Rechenweg), Schiffe als eine Zeile. Darstellung: die ersten 20 Zeilen, danach «und n weitere»; Karte scrollt.
- **I-063:** reiner Helfer `src/ui/roadLine.ts`: `linePath(a, b)` (Kacheln beider Enden inklusive; gerade bei gleicher Achse, sonst L: **längerer Schenkel zuerst**, bei Gleichstand x zuerst) und `linePlan(world, island, path)` mit `{ tiles: {x,y,state:'new'|'exists'|'blocked'}, newCount, cost, affordable, stopReason }`. `Umschalt` wird **beim Aufsetzen** mit Werkzeug «Weg» erfasst (nicht mitten im Zug): Zug im Linienmodus setzt nichts, zeigt Vorschau und baut beim Loslassen in Pfadreihenfolge mit `placeRoad`; Bau endet an der ersten nicht bezahlbaren Kachel, Grund über `showMessage`. Vorhandene Wege kosten nichts, blockierte werden übersprungen.
- **I-083:** `unboundDigitHint(key, mods, inFormField, modalOpen)` in `hotkeys.ts`: für `4`–`8` ohne Modifier den Text aus `SPEED_KEYS` («Tempo: 1, 2, 3»); `9`/`0` ohne Seefahrt bleiben stumm (wie heute). Ausgabe über `showMessage`.
- **Kauf-Anzeige:** `buy-pct`-Element, `setField`-Zeile und `buyPctText` aus `trade.ts` entfernen; Test AK-ZK-19 in `trade.test.ts` entfällt. `world.buyPct`, `buyPrice`, Sim bleiben.

## Tasks (Test-first, Umsetzer `tech-ui-engineer`, ein Strang, sequenziell)

| Task | Titel                                | AK-IDs          | blocked-by            |
| ---- | ------------------------------------ | --------------- | --------------------- |
| T01  | Beipack: Zifferntaste + Kauf-Anzeige | AK-1 bis AK-4   | UI-AUFRAEUM-2 gemergt |
| T02  | Betriebsrangliste nach Unterhalt     | AK-5 bis AK-9   | T01                   |
| T03  | Weg mit Winkel ziehen (Umschalt)     | AK-10 bis AK-15 | T02                   |
| T04  | Doku (Lead)                          | AK-16           | T03                   |

**T01.** Rot zuerst: (a) `unboundDigitHint('4'…'8')` liefert den Text, `'1'`–`'3'`, `'9'`/`'0'` ohne Seefahrt, Modifier, Formularfeld, offener Dialog liefern `null`; (b) Rot-Beleg für das Entfernen: Test, dass das Handelsfenster kein Feld `buy-pct-*` rendert (DOM-Fake nach `tests/ui/fakeDom.ts`, falls UI-AUFRAEUM-2 es angelegt hat). Dateien: `hotkeys.ts`, `input.ts` (Aufruf), `trade.ts`, `tests/ui/hotkeys.test.ts`, `trade.test.ts`.

**T02.** Rot zuerst: Reihenfolge, Gleichstand, Stilllegen, Häuser ausgeschlossen, Summenabgleich; dann Karte und Chip-Knopf in `hud.ts`/`app.ts`. Dateien: `upkeepRank.ts` (neu), `hud.ts`, `app.ts` (Öffnen und Sprung), `style.css`, `tests/ui/upkeepRank.test.ts`, `hud.test.ts`.

**T03.** Rot zuerst: reine Tests für `linePath`/`linePlan`; dann `input.ts` (Zugmodus, neue Aktion `roadLine`), `app.ts` (Vorschau und Bau), Vorschau über den vorhandenen Pfad-Overlay (`previewConnect`-Mechanik, `src/render/overlays.ts`); blockierte Kacheln rot. Fallback, falls der Overlay keine Rotfärbung kennt: nur Zählung und erster Grund in der Hover-Zeile (im Report melden, kein eigener Render-Umbau).
Dateien: `roadLine.ts` (neu), `input.ts`, `app.ts`, `hotkeys.ts` (`NAV_KEYS`-Eintrag «Umschalt + Weg ziehen»), `tests/ui/roadLine.test.ts`, `input.test.ts`, `hotkeys.test.ts`.

**T04 (Lead).** `README.md` (Bedienung: Rangliste, Umschalt-Weg, Hinweis), `docs/arc42.md` (neue Dateien `upkeepRank.ts`, `roadLine.ts`), `docs/ideen.md` I-062/I-063/I-083 auf `live`, I-048 unverändert. D1 erlaubt (E-017).

## Abnahmekriterien

- **AK-1** `4`–`8` zeigen «Tempo: 1, 2, 3», Text aus `SPEED_KEYS` abgeleitet.
- **AK-2** Kein Hinweis bei `1`–`3`, `9`/`0` ohne Seefahrt, Modifier, Formularfeld, offenem Dialog.
- **AK-3** Handelsfenster ohne Zeile «Kauf n %»; Knopftitel mit «im Mittel n %» unverändert.
- **AK-4** `buyPct`, `buyPrice` und Save unberührt (`git diff` auf `src/sim/` leer, Balancing grün).
- **AK-5** Rangliste sortiert nach `buildingUpkeep` absteigend, Gleichstand Auslastung aufsteigend, dann ID.
- **AK-6** Stillgelegte stehen mit ihrem tatsächlichen Wert und Marke «stillgelegt»; Häuser fehlen.
- **AK-7** Fusszeile = `stats.upkeep` je Minute; Schiffe als eine Zeile; kein zweiter Rechenweg.
- **AK-8** Klick oder `Enter` auf eine Zeile springt zum Gebäude (auch auf fernen Inseln); `Esc` schliesst; Tastaturbedienung per Tab.
- **AK-9** Mehr als 20 Betriebe: «und n weitere», Karte scrollt, kein Absturz bei 0 Betrieben (Hinweistext).
- **AK-10** `linePath` gerade bei gleicher Achse, sonst L mit längerem Schenkel zuerst; beide Enden enthalten.
- **AK-11** `linePlan` zählt neue Kacheln und Kosten (`ROAD_COST` je neue Kachel); vorhandene Wege kosten nichts; blockierte werden markiert und übersprungen.
- **AK-12** Mit `Umschalt` beim Aufsetzen: Vorschau mit Gesamtkosten, gebaut wird beim Loslassen; ohne `Umschalt` unverändertes Verhalten (bestehende Input-Tests grün).
- **AK-13** Zu wenig Geld: Bau bis zur letzten bezahlbaren Kachel, Meldung mit Grund aus der Sim.
- **AK-14** `Umschalt` löst keine Taste aus: `Umschalt+U` (Ausbau) bleibt unverändert, Loslassen von `Umschalt` mitten im Zug ändert den Modus nicht.
- **AK-15** Eintrag im Menü «Tastenkürzel» (`NAV_KEYS`), keine Doppelbelegung gegen `TOOL_HOTKEYS`, `SPEED_KEYS`, Inselwechsel, Problem-Sprung.
- **AK-16** README, arc42, `ideen.md` nachgeführt.

## Überschneidung mit M14-E1 und UI-AUFRAEUM-2 (Stand `feat/m14-e1` gelesen)

- M14-E1 T06 änderte `hover.ts`, `inspect.ts`, `buildMenu.ts`, `islandCard.ts`, `panelView.ts`, `goal.ts`: **Wir ändern keine davon**; `inspect.ts` nur lesend (`utilizationText`/`levelText` importieren).
- UI-AUFRAEUM-2 ändert `hotkeys.ts` (`isSaveChord` nach `saveChord.ts`), `input.ts`, `modal.ts`, `app.ts` (Banner ~1437, Denkmalkosten ~721–730), `texts.ts`, `inspect.ts`: **T01 und T03 berühren `hotkeys.ts`/`input.ts`, T02 und T03 `app.ts`** → harte Reihenfolge (`blocked-by`), Worktree erst nach Merge beider, main per Merge holen. Zeilennummern oben sind dann veraltet; der Umsetzer sucht per Symbol.
- Neue Dateien (`upkeepRank.ts`, `roadLine.ts`) kollidieren mit nichts.

## Datei-Ownership (Worktree `.worktrees/ui-haeppchen-a`, Branch `feat/ui-haeppchen-a`)

| Dateien                                                                                         | Task                                         |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `src/ui/hotkeys.ts`, `trade.ts`, `tests/ui/hotkeys.test.ts`, `trade.test.ts`                    | T01                                          |
| `src/ui/upkeepRank.ts`, `hud.ts`, `src/style.css`, `tests/ui/upkeepRank.test.ts`, `hud.test.ts` | T02                                          |
| `src/ui/roadLine.ts`, `input.ts`, `tests/ui/roadLine.test.ts`, `input.test.ts`                  | T03                                          |
| `src/ui/app.ts`                                                                                 | T01 (Aufruf Hinweis), T02, T03, nacheinander |
| `README.md`, `docs/arc42.md`, `docs/ideen.md`                                                   | T04                                          |

Nicht anfassen: `src/sim/`, `src/audio/`, Spielwerte, `docs/studio/rulings.md`. `src/render/overlays.ts` nur mit Meldung im Report (T03-Fallback).

## Pflichtpunkte

- Rot-Beleg je neuem Test (R395, R410); Exit-Codes (`…; echo EXIT=$?`): `npx tsc --noEmit`, `make lint`, `make test`, `make conflicts`, `make docs-check` alle 0; Balancing grün.
- **Browser-Check** `qa-playtester`, 1 Lauf nach T03 (`.studio/qa/ui-haeppchen-a/`): Bilanz anklicken, Sprung, Umschalt-Weg (gerade, L, zu wenig Geld, blockierte Kachel), Tasten `4`/`5`, Handelsfenster ohne «Kauf n %», Fenster 1280 px.
- Review je Task `qa-code-reviewer`; **Final-Review `opus`**; nach ZURÜCK Delta-Review per SendMessage (R553).

## Budgetantrag

3 Umsetzer-Tasks (T01–T03) × 2 = 6; Playtester 1; Final-Review 1; Summe 8; + 30 % = 10,4, aufgerundet **11 Starts**. T04 macht der Lead. Fix-Runden per SendMessage. Parallelität 1 (gemeinsame Dateien `input.ts`, `hotkeys.ts`, `app.ts`). Aufwand ≈ 250 Tools (Ideen-Schätzung 80 + 70 + 10, dazu Reviews und Browser-Check). Modelle: Umsetzer, Reviewer, Playtester `sonnet`; Final `opus`. Ein Umsetzer: L0 kann direkt briefen (E-037).

## Risiken

(1) Pfad-Overlay kennt keine Rotfärbung → Fallback in T03. (2) `Umschalt`-Erfassung beim Aufsetzen: Pointer-Events tragen `shiftKey`, getestet über `input.test.ts`. (3) Bilanz-Chip heute ohne Knopf-Semantik: Tastaturbedienung und Fokus müssen ergänzt werden (AK-8). (4) Reihenfolge-Abhängigkeit von UI-AUFRAEUM-2 verschiebt den Start.
