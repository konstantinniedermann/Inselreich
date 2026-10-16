# T16 · Browser-Lauf 2: Abschnitt fertig, Wahlziel, Version 13

Rolle `qa-playtester` (sonnet) · gestartet vom UI-Controller (E) · AK-M13E2-43, -44, -47 (Spec §10.4) · blocked-by
T14 · ein Lauf

**Gegenstand:** `.worktrees/m13-e2-ui` am Kandidaten nach T14 (Hash im Ledger), Headless-Chrome, 1280×720 und
1920×1080, Screenshots `.studio/qa/m13-e2/<ak>-<breite>x<höhe>.png`; Stände aus Anhang 08 D.

## Schritt 0 (QA-B2, vom Controller E vor dem Start)

Im UI-Baum `git merge main`, dann die Szenarien neu schreiben (`writeScenarios` und `writeExtraSaves`, Befehl aus dem
Kopf von `tests/sim/scenarios.ts`), Commit-Hash des Baums und Liste der Dateien im Ledger notieren; der Playtester
prüft genau diesen Stand. **Nie gleichzeitig mit dem Browser-Lauf I-048-T04** (Prod-B7). Regel für Folgestränge
(I-049-UI, I-048-UI): jeder Browser-Lauf nach einem `main`-Merge schreibt die Szenarien neu.

## Prüfschritte

| AK  | Stand                   | Schritte und Erwartung                                                                                                                                                                                                                                                                                       |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 43  | `m13e2-abschnitt1-rest` | Zeitraffer, Vollzukauf: Meldung «Denkmal: Abschnitt 1 fertig», Bild Terrassen, Ziel-Chip «Denkmal 1/3», Chronik-Zeile «Denkmal: 1/3 fertig»                                                                                                                                                                  |
| 44  | `m13e2-abschnitt3-rest` | nach dem Laden der letzte Zug: Banner «Wahlziel erreicht: Das Denkmal steht!», Aufflammen und Glocke **einmal** (Dev-Zähler `window.__inselAudio.events.monumentDone` von 0 auf 1, T19/QA-B1), Bild Stufe 4, Chip «Wahlziel erreicht»; danach speichern und laden: kein Banner, kein Effekt, Zähler bleibt 1 |
| 47  | Slot mit `m13e2-v13`    | Laden → Hinweis «Unbekannte Version», Spiel läuft weiter, keine Konsolenfehler                                                                                                                                                                                                                               |

Zusätzlich Regression aus T15 (Kurzprobe, je ein Screenshot) in einem Stand mit `wonSpice true` (QA-B8,
`m13e2-abschnitt1-rest`): Panel und Ziel-Chip «Denkmal 1/3 · … %» bei 1280×720, `Entf` auf ein
Haus sofort weg.

## Ausgabe

Playtest-Report als Schlussbericht wie T15. Keinen Code ändern.
