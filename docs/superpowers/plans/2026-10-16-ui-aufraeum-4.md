# Plan UI-AUFRAEUM-4 · fünf kleine Stolpersteine in Bedienung und Texten (Stufe leicht)

Owner `lead-tech` · Quellen: R690 (3), `docs/beobachtungen.md` Abschnitt «Ausgewertet 2026-10-16» (BEOB-16, Zeilen «eingeplant: UI-AUFRAEUM-4»). Plan gegen main `2f5fdb3d`, ohne Testläufe (R464).
Spielerwirkung: Das Vorratsfeld der Auftragskarte stimmt auch nach Strassenbau in der Pause; das Menü sagt «Krisen (neue Insel)»; ein Rechtsklick beendet auch Roden- und Abriss-Züge; der Ereignis-Knopf behält seinen Namen für Screenreader; ein leeres Lager zeigt nicht «Leer in 0 s».
**Kein Save** (`SAVE_VERSION`, `types.ts` ohne Diff), **kein Spielwert** (`defs/` ohne Diff, `balance.test.ts` unberührt), keine Abhängigkeit (ADR-001), kein ADR, `src/sim/` ohne Diff. **Umsetzung erst nach Merge von UI-HAEPPCHEN-F** (Überschneidung `hud.ts`, `tests/ui/hud.test.ts`).

## Entscheide des Plans

- **D-1 Cache-Schlüssel (`order.ts`).** `producedPerMinute` hängt über `producedRate` (`src/sim/flow.ts`) nur von `connected`, `paused`, `house`, `defId` und dem Zyklus ab. Schlüssel neu: `tick|island|good|Gebäudezahl|Ids der stillgelegten (Komma-Liste)|Ids der nicht angebundenen (Komma-Liste)`. Ids als Liste statt Summe: {1,4} und {2,3} kollidieren nicht mehr; `connected` ist erfasst. Kosten: derselbe eine Durchlauf über `world.buildings` wie bisher, plus zwei kurze Strings (n ≤ ca. 600 Gebäude, Zahlen aus T00). Alternative B (Cache streichen): `goodProductionPer100` ist selbst ein Durchlauf, der Cache spart nur den `cycleOf`-Teil; T01 misst vorher/nachher und meldet, falls der Cache unter 2× nichts bringt (Entscheid L0, nicht eigenmächtig). Reiner UI-Cache, nicht im Spielstand, kein Eingriff in die Sim: Determinismus bleibt (Test: Cache-Wert == frische Berechnung, Welt vor/nach als JSON gleich).
- **D-2 Rechtsklick bei gehaltener linker Taste.** Chrome meldet dann nur `contextmenu`, kein `pointerdown` b2 (Kommentar `input.ts` Z. 337). Heute beendet `onContextMenu` nur den Linienzug (`drag?.line`). Neu: jeder laufende Ein-Zeiger-Zug ausser Schwenken (`drag !== null && !drag.panning`, also Roden/Aufforsten/Weg-Strich, Abriss-Strich, Linie) ruft `cancelPointerAction()` (sendet `dragEnd` bzw. `roadLine cancel`). **Staffelung wie Esc/Linie:** der erste Rechtsklick beendet nur den Zug, das Werkzeug bleibt; erst der nächste legt es ab. Der Pfad `pointerdown` b2 (Firefox) bleibt unverändert (Tests «sendet weiter cancel» bleiben grün). Kein Doppel-cancel, wenn beide Ereignisse eintreffen. Alternative: wie b2 auch Werkzeug ablegen; verworfen, weil es den Zug und das Werkzeug mit einem Klick nimmt und von der Linien-Regel abweicht. **Entwurf an L0 (R471):** Staffelung als Ruling bestätigen.
- **D-3 Menü-Text.** Beschriftung `Krisen (neue Insel): ` (Trivial-Fix aus BEOB-16 geht hier auf); `aria-label` bleibt «Krisen für die neue Insel». «Freischaltung: » bleibt unverändert (nicht in der Beobachtung; sonst Scope-Erweiterung).
- **D-4 `aria-label` des Ereignis-Knopfs.** Heute ersetzt `«3 neue Ereignisse»` den Namen «Ereignisse». Neu `Ereignisse${unreadLabel(n)}`, also «Ereignisse (3 neu)», «Ereignisse (9+ neu)»: identisch zum sichtbaren Text (WCAG «Label in Name»), Deckel aus `unreadLabel`. Ohne Zähler weiterhin kein `aria-label`.
- **D-5 Tooltip bei Bestand 0.** `reachLine(0, net<0)` liefert `Jetzt leer bei ${rate} / min (ohne Handel und Aufträge)\n` statt «Leer in 0 s …». Alle anderen Fälle unverändert (`Leer in …`, `Voll in …`, leer bei Gleichstand/Sättigung). Stufe `alarm` bleibt (reach.ts unberührt).

## Überschneidung mit UI-HAEPPCHEN-F (`feat/ui-haeppchen-f` @ `f4da449e`, `git diff main...`)

| Datei                                                | F ändert                                                                                   | AUFRAEUM-4 ändert                | Konflikt                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------- | --------------------------------------------- |
| `src/ui/hud.ts`                                      | Imports (Z. 17, 37), `balanceView` (≈ 133), `drawSeaMap` (≈ 450), `balanceTooltip` (≈ 648) | nur `reachLine` (≈ 114 bis 120)  | keine überlappenden Zeilen; Zeilen neu suchen |
| `tests/ui/hud.test.ts`                               | +29 Zeilen (Bilanz)                                                                        | Fälle bei `reachLine` (≈ Z. 665) | keine; nach F-Merge Fundstelle neu suchen     |
| `order.ts`, `menu.ts`, `eventLogView.ts`, `input.ts` | nicht berührt                                                                              | ja                               | keine                                         |

## Dateimatrix (Ownership)

| Datei                                                                                                                                                   | T01 | T02 | T03 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- |
| `src/ui/order.ts`, `tests/ui/order.test.ts`                                                                                                             | ja  |     |     |
| `src/ui/menu.ts`, `tests/ui/menu.test.ts`; `src/ui/eventLogView.ts` + neuer/bestehender Test; `src/ui/hud.ts` (nur `reachLine`), `tests/ui/hud.test.ts` |     | ja  |     |
| `src/ui/input.ts`, `tests/ui/input.test.ts`                                                                                                             |     |     | ja  |
| `README.md`, `docs/arc42.md` (nur bei Abweichung, s. T03), `docs/beobachtungen.md`                                                                      |     |     | ja  |

Nicht angefasst: `src/sim/`, `src/render/`, `src/audio/`, `docs/studio/`, `docs/superpowers/specs/`. Ein Strang, Worktree `.worktrees/ui-aufraeum-4-impl` ab `plan/ui-aufraeum-4` (`git worktree add … -b feat/ui-aufraeum-4`), main (mit F) per Merge holen. Seriell mit einem Umsetzer (`tech-ui-engineer`), Parallelität 1: T01 bis T03 sind dateifremd, aber so klein, dass zweite Worktrees mehr kosten als sie sparen.

## Tasks

| Task | Titel                                     | Datei                | AK-IDs       | Strang | blocked-by | Modell | Tools |
| ---- | ----------------------------------------- | -------------------- | ------------ | ------ | ---------- | ------ | ----- |
| T00  | Zeitmessung vorher (Controller, R392)     | `T00-zeitmessung.md` | –            | 1      | F gemergt  | sonnet | 8     |
| T01  | Erzeugungs-Cache `order.ts`               | `T01-cache.md`       | AK-1 bis 4   | 1      | T00        | sonnet | 35    |
| T02  | Texte: Menü, `aria-label`, Tooltip «Leer» | `T02-texte.md`       | AK-5 bis 8   | 1      | T01        | sonnet | 35    |
| T03  | Rechtsklick im Zug, Browser-Check, Doku   | `T03-rechtsklick.md` | AK-9 bis 12  | 1      | T02        | sonnet | 45    |
| T04  | Browser-Check (`qa-playtester`)           | `T04-playtest.md`    | AK-8, 9b, 10 | 1      | T03        | sonnet | 25    |

Umsetzer: T01 bis T03 `tech-ui-engineer`; Review: T01 und T02 je `qa-code-reviewer` (sonnet); der letzte Review über die ganze Branch (`model: opus`, deckt T03) gilt als Final-Review; T04 `qa-playtester` (1280×720, Screenshots `.studio/qa/ui-aufraeum-4/`). Fix-Runden per SendMessage.

## Abnahmekriterien

| AK    | Inhalt                                                                                                                                                                                                                                                     | Task    | Beleg                                               |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------- |
| AK-1  | Stilllegen A+D {1,4} gegenüber B+C {2,3} (gleiche Id-Summe) ergibt einen neuen Wert, nicht den alten                                                                                                                                                       | T01     | `order.test.ts`, vorher rot                         |
| AK-2  | `connected` kippt (Strassenbau/-abriss) bei gleichem Tick: Anzeige folgt                                                                                                                                                                                   | T01     | `order.test.ts`, vorher rot                         |
| AK-3  | Ausbau/Abriss in der Pause (gleiche Zahl nach Abriss + Neubau): Wert folgt                                                                                                                                                                                 | T01     | `order.test.ts`, vorher rot                         |
| AK-4  | Determinismus: Wert == `perMinute(goodProductionPer100(…))` frisch, `JSON.stringify(world)` vor und nach den Abfragen gleich; zweiter Aufruf im selben Zustand trifft den Cache (kein zweiter `goodProductionPer100`-Aufruf, Spy)                          | T01     | `order.test.ts`                                     |
| AK-5  | Menü-Beschriftung `Krisen (neue Insel): `, `aria-label` unverändert, «Freischaltung: » unverändert                                                                                                                                                         | T02     | `menu.test.ts`, vorher rot                          |
| AK-6  | Ereignis-Knopf: mit Zähler `aria-label` = `Ereignisse (3 neu)` (enthält sichtbaren Text), «9+» gedeckelt, ohne Zähler kein Attribut                                                                                                                        | T02     | Test auf `renderEventLog`/`fakeDom`, vorher rot     |
| AK-7  | `reachLine(0, -1)` beginnt mit `Jetzt leer bei`, enthält nie «Leer in 0 s»; `reachLine(12,-1)` und `Voll` unverändert, Gleichstand `''`                                                                                                                    | T02     | `hud.test.ts`, vorher rot; bestehende AK-UR-05 grün |
| AK-8  | Stock-Tooltip eines leeren Guts im Browser lesbar                                                                                                                                                                                                          | T04     | Screenshot                                          |
| AK-9  | `contextmenu` bei laufendem Weg-/Roden-/Abriss-Zug: `dragEnd` (Abriss: `dragEnd`), danach weder `tile` bei `pointermove` noch beim `pointerup`; Werkzeug bleibt (kein `cancel`); zweiter Rechtsklick: `cancel`. 9b: im Browser mit gehaltener linker Taste | T03/T04 | `input.test.ts`, vorher rot; Browser-Check          |
| AK-10 | `contextmenu` bei Schwenk (`panning`) und ohne Zug: unverändert; `pointerdown` b2 im Strich sendet weiter `cancel`; kein Doppel-cancel bei b2 + contextmenu                                                                                                | T03     | bestehende Tests grün + neue                        |
| AK-11 | `make check` Exit 0, Balancing-Test grün, `src/sim/` und `defs/` ohne Diff                                                                                                                                                                                 | alle    | Exit-Codes im Bericht                               |
| AK-12 | Zeitvergleich (R392): kein berührter Testfall neu > 500 ms oder > +50 % gegenüber main                                                                                                                                                                     | T00/T03 | `zeit-vor.json`, `zeit-nach.json`                   |

## Schätzung Umsetzung

Starts: Umsetzer 3 (T01 bis T03) + Reviews 3 (T01, T02, Final auf opus) + Playtester 1 = 7; Puffer 30 % aufgerundet: **10 Starts, Parallelität 1**. Tools Umsetzer ≈ 115, Controller ≈ 40. Modell: `sonnet` ausser Final-Review (`opus`).
