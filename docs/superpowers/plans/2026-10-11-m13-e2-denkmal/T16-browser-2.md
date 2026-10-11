# T16 · Browser-Lauf 2: Abschnitt fertig, Wahlziel, Version 13

Rolle `qa-playtester` (sonnet) · gestartet vom UI-Controller (E) · AK-M13E2-43, -44, -47 (Spec §10.4) · blocked-by
T14 · ein Lauf

**Gegenstand:** `.worktrees/m13-e2-ui` am Kandidaten nach T14 (Hash im Ledger), Headless-Chrome, 1280×720 und
1920×1080, Screenshots `.studio/qa/m13-e2/<ak>-<breite>x<höhe>.png`; Stände aus Anhang 08 D.

## Prüfschritte

| AK  | Stand                   | Schritte und Erwartung                                                                                                                                                                                                                                                |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 43  | `m13e2-abschnitt1-rest` | Zeitraffer, Vollzukauf: Meldung «Denkmal: Abschnitt 1 fertig», Bild Terrassen, Ziel-Chip «Denkmal 1/3», Chronik-Zeile «Denkmal: 1/3 fertig»                                                                                                                           |
| 44  | `m13e2-abschnitt3-rest` | nach dem Laden der letzte Zug: Banner «Wahlziel erreicht: Das Denkmal steht!», Aufflammen und Glocke **einmal** (Audio-Debugzustand bzw. Ereignisprotokoll), Bild Stufe 4, Chip «Wahlziel erreicht»; danach speichern und laden: kein Banner, kein Effekt, kein Klang |
| 47  | Slot mit `m13e2-v13`    | Laden → Hinweis «Unbekannte Version», Spiel läuft weiter, keine Konsolenfehler                                                                                                                                                                                        |

Zusätzlich Regression aus T15 (Kurzprobe, je ein Screenshot): Panel `m13e2-abschnitt1` bei 1280×720, `Entf` auf ein
Haus sofort weg.

## Ausgabe

Playtest-Report als Schlussbericht wie T15. Keinen Code ändern.
