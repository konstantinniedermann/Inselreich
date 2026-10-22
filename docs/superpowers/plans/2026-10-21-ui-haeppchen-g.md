# Plan UI-HAEPPCHEN-G · I-155 «Zu spät» an der Fern-Marke + I-148 «Wo war ich?»-Karte (Stufe leicht)

Owner `lead-tech` · Quelle: Kurzdesign `docs/superpowers/specs/2026-10-21-ui-haeppchen-g-design.md` (Branch `design/ui-haeppchen-g` @ `bee6ee20`, AK-G1 bis G21), Gate OK R798. Plan gegen main `1c5bc18e`, ohne Testläufe (Testsperre ORT-A). Task-Dateien in [`2026-10-21-ui-haeppchen-g/`](2026-10-21-ui-haeppchen-g/).
Spielerwirkung: Der Spieler sieht an der Fern-Marke «zu spät», bevor er Ware vergeblich schickt; beim Laden zeigt «Wo war ich?» die laufenden Fristen und die Problemzahl.
**Kein Save** (`SAVE_VERSION`, `types.ts` ohne Diff), **kein Spielwert** (`defs/`, `balance.test.ts` ohne Diff; nur eine Darstellungsfarbe `COLORS.markLate`), keine Abhängigkeit (ADR-001), kein ADR. **Kein `src/sim/`-Diff** (alles lesend aus `src/ui/`).

## Entscheide des Plans

- **P-1 Reihenfolge P1 (I-155) → P2 (I-148), ein Strang, seriell** (R798). Grund: P2 liest `farLate` aus P1 (echte Abhängigkeit) und beide Pakete sind S; ein zweiter Worktree kostet mehr Merge als er spart. Parallelität 1.
- **P-2 Ladungszählung `ship.to`/`ship.left` (Prüfung gegen `src/sim/ships.ts`):** `to` ist die Zielinsel einer laufenden Fahrt, sonst `null` (angedockt). `left` zählt die Rest-Ticks der Fahrt (`depart`: `left = laneTicks(port, to)`; `tickShips`: `left -= 1`, bei `0` Ankunft `port = to`, `to = null`, im selben Schritt entlädt `handleDocked`). Also gilt: Ware «unterwegs zur Insel I» = `ship.to === I` und `ship.cargo[good]`; `ship.left` ist die Restfahrt in Ticks, direkt mit `Rest` vergleichbar; `left ≥ 1`, solange `to !== null` (`save.ts` Z. 715 prüft das). Angedockte Schiffe (`to === null`) zählen **nie** (ihre Bordware ist entweder schon im Lager oder Rückladung). Schiffe mit `to === HOME` (Rückfahrt) zählen nie, weil `island ≠ HOME`. Bewusste Grenze: `unload` löscht nur bis zur Lagergrenze; die Zählung kann also bei vollem Lager überschätzen (kein Fehlalarm, nur ein unterlassener Hinweis; Spec: «sicher zu spät, nie vielleicht»). Genau auf der Grenze: `left === Rest` zählt (Ankunft in dem Tick, in dem `Rest` 0 wird, Spec `left ≤ Rest`); AK-G2 deckt `left = Rest` und `Rest + 1` ab.
- **P-3 `farLate` bekommt eine Eingabeform statt Welt-Zugriff auf Auftrag/Angebot:** `farLate(world, x: {island, amount, good}, rest, lanes?)`; `farMark` ruft es mit den Daten des Auftrags bzw. Angebots, `resumeCardView` (P2) mit denen des Fernauftrags. Eine Quelle für die Regel (Spec Regel 1 bis 3).
- **P-4 `MapMark.tip` trägt den Fahrzeit-Satz, `seaMapTip` hängt ihn als letzten Abschnitt an** (Trenner « · »). **Bestandstests ziehen mit:** `tests/ui/farMark.test.ts` (AK-M5 prüft heute das Tooltip-Ende) und `tests/render/seaMapDraw.test.ts` (Literal `mk()` braucht `late: false, tip: null`); neue Erwartungen mit genauem Wert, nie aufgeweicht. `farMark.text` bleibt ohne `late` zeichengleich (Z2 von F).
- **P-5 Karte nur beim Laden, nur über `loadSlotPaused`:** neue Datei `src/ui/resumeCard.ts` (reine `resumeCardView` + DOM-Aufbau `openResumeCard`, Muster `upkeepCard.ts`); `app.ts` bekommt einen Aufruf. Der Modal-Weg (`openModal`, `closeAllModals` davor, `restoreFocus: 'body'`) setzt kein Tempo; das Pause-Overlay ist schon an `modalOpen` gekoppelt.
- **P-6 Zufallsauftrag-Zeile:** kein vorhandener Text eignet sich (`orderCardText` ist lang); `resumeCardView` baut die kurze Form selbst aus `GOODS[...].name`, `o.reward`, `formatGameTime(o.due − tick)`; Fernauftrag nutzt `farOrderText` unverändert (Spec Regel 2). Stammkunde: eigener Kurztext (nicht `orderCardText`).

## Konflikt- und Merge-Reihenfolge (gegen `feat/stadtplanung`, geprüft mit `git diff main...feat/stadtplanung`)

| Datei                                                                              | Stadtplanung                                                                                                           | UI-G                                                | Befund                                                                                                   |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/ui/app.ts`                                                                    | 7 Hunks; **einer (Z. ≈ 496) hängt direkt hinter `loadNotice` in `loadSlotPaused` zwei Zeilen an** (`loadSupplyNotice`) | ein Aufruf am Ende von `loadSlotPaused`, ein Import | **echter Konflikt** (beide hängen an derselben Stelle an), trivial: beide Zeilen behalten, Karte zuletzt |
| `src/style.css`                                                                    | **kein Diff** auf dem heutigen Branch (Spec erwartete T08)                                                             | ein Block am Dateiende                              | kein Konflikt heute; Textkonflikt am Dateiende möglich, falls Stadtplanung später CSS anhängt            |
| `src/ui/farOrder.ts`, `seaMapView.ts`, `src/render/seaMap.ts`, Tests Fern/Seekarte | ohne Diff                                                                                                              | P1                                                  | keiner                                                                                                   |

**Empfehlung:** P1 (T01) darf **sofort** laufen und vor oder nach Stadtplanung mergen. P2 (T02) ist ebenfalls unabhängig lauffähig; der `app.ts`-Konflikt ist eine Zeile. **Wer später nach `main` geht, löst ihn per `git merge main`** (kein Rebase). Damit er klein bleibt: T02 legt den `app.ts`-Diff in einen **eigenen Commit** (Import + ein Aufruf `openResumeCard(...)` als letzte Anweisung von `loadSlotPaused`, kein Umbau), der Rest steckt in `resumeCard.ts`. Merge-Reihenfolge-Vorschlag: **Stadtplanung zuerst** (113 Dateien, lange Laufzeit, Save-nah), UI-G danach; ist UI-G früher fertig, mergt UI-G zuerst und Stadtplanung löst die Zeile (L0 entscheidet nach Stand).

## Dateimatrix (Ownership, ein Strang, Worktree `.worktrees/ui-haeppchen-g-impl` ab `plan/ui-haeppchen-g`, Branch `feat/ui-haeppchen-g`)

| Datei                                                                                                                          | T01 | T02 | T04 |
| ------------------------------------------------------------------------------------------------------------------------------ | --- | --- | --- |
| `src/ui/farOrder.ts`, `src/ui/seaMapView.ts`, `src/render/seaMap.ts`                                                           | ja  |     |     |
| `tests/ui/farLate.test.ts` (neu), `tests/ui/farMark.test.ts`, `tests/ui/seaMapView.test.ts`, `tests/render/seaMapDraw.test.ts` | ja  |     |     |
| `src/ui/resumeCard.ts` (neu), `tests/ui/resumeCard.test.ts` (neu)                                                              |     | ja  |     |
| `src/ui/app.ts` (Import + ein Aufruf), `src/style.css` (ein Block am Ende)                                                     |     | ja  |     |
| `README.md`, `docs/arc42.md`, `docs/ideen.md`, `docs/beobachtungen.md`                                                         |     |     | ja  |

Nicht angefasst: `src/sim/`, `src/audio/`, `src/render/` ausser `seaMap.ts`, `src/ui/hud.ts` (ruft `farMark`, Signatur gleich), `docs/studio/`, Specs. T03 (Browser-Check) ändert keine Datei.

## Tasks

| Task | Titel                                                       | Datei               | AK-IDs             | Strang | blocked-by | Modell | Tools | Persona            |
| ---- | ----------------------------------------------------------- | ------------------- | ------------------ | ------ | ---------- | ------ | ----- | ------------------ |
| T01  | P1: `farLate`, `farMark`, Schlüssel, Tooltip, Farbe (I-155) | `T01-zu-spaet.md`   | G1 bis G9          | 1      | –          | sonnet | 45    | `tech-ui-engineer` |
| T02  | P2: `resumeCardView`, Modal, `app.ts`-Aufruf, CSS (I-148)   | `T02-wo-war-ich.md` | G11 bis G18        | 1      | T01        | sonnet | 45    | `tech-ui-engineer` |
| T03  | Browser-Check beider Pakete (`qa-playtester`)               | `T03-playtest.md`   | G10, G19, G20, G21 | 1      | T02        | sonnet | 30    | `qa-playtester`    |
| T04  | Doku (D1, E-017): README, arc42, ideen, beobachtungen       | `T04-doku.md`       | –                  | 1      | T03        | sonnet | 20    | `tech-ui-engineer` |

`art-rendering-engineer` wäre für den Render-Anteil von T01 (`seaMap.ts`, 3 Zeilen) möglich; Empfehlung: `tech-ui-engineer` macht ganz T01, weil der Render-Diff nur ein Feld, eine Farbe und eine Zeile Auswahl umfasst (Spec Zuschnitt nennt `tech-ui-engineer` für P1 inklusive `seaMap.ts`); ein zweiter Start für drei Zeilen kostet mehr. T04 setzt die Umsetzer-Instanz von T02 per `SendMessage` fort (kein neuer Start; D1-Dateien im Briefing ausdrücklich erlaubt).

## Budget (R798: Gesamtbudget 8 Starts, Parallelität 1)

Geplant 6 Starts: T01-Umsetzer (1), T01-Review `qa-code-reviewer` sonnet (2), T02-Umsetzer (3), T02-Review (4), T03 `qa-playtester` (5), Final-Review `qa-code-reviewer` **opus**, frischer Start über die ganze Branch (6; er gilt als Final-Review, Stufe leicht). **Reserve 2** für Fix-Runden, die nicht per `SendMessage` gehen, und ein Delta-Review (R553, per `SendMessage` an dieselbe opus-Instanz, zählt nicht). T04 und alle Fix-Runden per `SendMessage` (zählen nicht). Controller: der Lead selbst auf `sonnet`, ≈ 8 Tools Steuerung je Start.

## Test- und Prüfpflichten (für jedes Umsetzer-Briefing wörtlich)

- **Testsperre (R380):** Tests erst bei freier Sperre (`uptime`: 1-min-Load ≤ 4, kein anderer `vitest`/`make check`-Lauf; sonst `waiting` melden). Ohne Sperre nur lesen und schreiben.
- **Gezielt testen, nie `make check` je Task:** T01: `npx vitest run tests/ui/farLate.test.ts tests/ui/farMark.test.ts tests/ui/seaMapView.test.ts tests/render/seaMapDraw.test.ts; echo EXIT=$?`. T02: `npx vitest run tests/ui/resumeCard.test.ts tests/ui/farLate.test.ts tests/ui/modal.test.ts; echo EXIT=$?`. Zusätzlich je Task `npx tsc --noEmit; echo EXIT=$?` (R398, `tsc` ist Teil von `npm run build`, Vitest prüft keine Typen) und `npx eslint <geänderte Dateien> && npx prettier --check <geänderte Dateien>; echo EXIT=$?`.
- **Rot zuerst:** je Task den Test vor der Umsetzung laufen lassen und die rote Ausgabe im Bericht nennen (Exit-Code ≠ 0), erst dann umsetzen.
- **Zeittests (R270):** keine der berührten Dateien steht in `ZEITTESTS` (`vite.config.ts`); neue Tests nutzen keinen `performance.now`/`Date.now`/Timer (sonst Eintrag in `ZEITTESTS` und `make zeittests`). Zeiten in Erwartungen nie als Literal, immer `formatGameTime(…)`/`formatClock(…)`.
- **Vor dem Branch-Abschluss (Controller, einmal):** `make check; echo EXIT=$?` bei freier Sperre, `tests/sim/balance.test.ts` grün, `git diff main -- src/sim` leer (AK-G9, G18).
- **Keine `Contract`-Literale** in neuen Tests (R679-2): Stammkunde über die Sim-Funktion, die Verträge anlegt (Helfer in `tests/sim/` suchen, z. B. `acceptContract`), nicht als Objekt mit `Contract`-Form.
- Testwelten: `farWorld`, `periodStart`, `stepAt`, `islandOf`, `dropKontor` aus `tests/sim/farHelpers.ts`; Schiffe über `world.ships.push({ id, port: 0, to, left, cargo, route: null, homing: false })` (Form `Ship`, `src/sim/types.ts` Z. 288), Lager über `world.islands[i].stock[good]`.

## AK-Zuordnung (21 AK, je Testfall oder benannter Beleg)

| AK                 | Beleg                                                                         | Task           |
| ------------------ | ----------------------------------------------------------------------------- | -------------- |
| G1 bis G5, G7, G8  | `tests/ui/farLate.test.ts` (neu) und `tests/ui/farMark.test.ts`               | T01            |
| G6                 | `tests/render/seaMapDraw.test.ts` (M6a erweitert: markLate/markWarn/markFill) | T01            |
| G9                 | `git diff main -- src/sim` leer; `balance.test.ts` grün (Lauf)                | T01, Abschluss |
| G11 bis G17        | `tests/ui/resumeCard.test.ts` (neu)                                           | T02            |
| G18                | wie G9                                                                        | T02, Abschluss |
| G10, G19, G20, G21 | Browser-Check, Screenshots `.studio/qa/ui-haeppchen-g/`                       | T03            |

## Ruling-Entwürfe (für `docs/studio/rulings.md`, L0 entscheidet)

- **R799-E (Gate Plan UI-HAEPPCHEN-G):** Plan nach Gate OK R798 freigegeben: ein Strang seriell P1 → P2, Budget 8 Starts (6 geplant, 2 Reserve), Parallelität 1, kein Save, kein Spielwert, kein ADR.
- **R800-E (Ladungszählung):** `farLate` zählt Ware auf Schiffen mit `ship.to === Fern-Insel` und `ship.left ≤ Rest` zum Lager; angedockte Schiffe und Rückfahrten nie; Überschätzung bei vollem Fern-Lager bleibt unbehandelt (nur unterlassener Hinweis).
- **R801-E (Merge-Reihenfolge):** Stadtplanung vor UI-G, wenn beide bereit sind; der `app.ts`-Konflikt in `loadSlotPaused` (eine Zeile) wird vom später Mergenden per `git merge main` gelöst; UI-G hält den `app.ts`-Diff in einem eigenen Commit.
- **R802-E (Bestandstests):** `tests/ui/farMark.test.ts` (AK-M5) und `tests/render/seaMapDraw.test.ts` (`mk()`-Literal) werden in T01 mit genauen Werten angepasst; das ist Folge von P-4, keine Aufweichung.
