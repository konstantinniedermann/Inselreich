# T08 · Browser-Check (qa-playtester, Headless-Chrome)

Prüfer `qa-playtester` (sonnet) als Controller-Start · AK-M14E1-34 … -41 · blocked-by T07 (Stand nach Merge UI in
SIM) · ≈ 35 Tools · Spec §10.4 · Stände aus T05

**Ablage:** Screenshots `.studio/qa/m14-e1/<ak>-<breite>x<höhe>.png`, 1280×720 und 1920×1080; AK-41 zusätzlich
800×600. Playtest-Report als Schlussbericht an den Controller.

## Prüfpunkte

| AK  | Stand                      | Prüfung                                                                                                                          |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 34  | `m14e1-start`, Zoom 1/8    | drei Fremdinseln sichtbar, Weidenau ohne Gebirge; Hover je Fremdinsel = Anhang 03 A                                              |
| 35  | `m13-vor-ziel`             | Hover Weidenau mit «Seefahrt mit den Kaufleuten»; Zeitraffer bis Ziel → U6 mit Satz Anhang 03 B, vollständig lesbar bei 1280×720 |
| 36  | `m14e1-felsbucht`          | Inspektor Steinbruch: «Inselvorteil ×2 (Gebirge+)», «20 Stein / min»; nach 1 min Spielzeit Stein auf der Felsbucht gestiegen     |
| 37  | `m14e1-weidenau`           | Inspektor Schäferei «Inselvorteil ×2 (Fruchtbar)»; Bauleiste Steinbruch ohne, Zuckerrohrplantage mit Zeile Anhang 03 C           |
| 38  | `m14e1-start`              | Knopf «Inseln» → vier Silhouetten, Tooltip Weidenau nach Anhang 03 A; Klick springt dorthin; Taste `9` über alle vier            |
| 39  | `m14e1-altstand` (v12)     | Laden → 4 Inseln, Weidenau ohne Kontor, Felsbucht-Betriebe mit «×2», keine Konsolenfehler                                        |
| 40  | Slot mit `version` 14      | Hinweis «Unbekannte Version», Spiel läuft weiter, keine Konsolenfehler                                                           |
| 41  | `m14e1-felsbucht`, 800×600 | Seekarte und Inspektor offen: kein Absturz, keine Konsolenfehler                                                                 |

## Playtest-Fragen (QA-B2, Spec §12, nur beobachten)

Gründet ein Spieler ohne Erklärung ein Kontor auf Felsbucht oder Weidenau, und kann der Report sagen, warum? Ist die
Rangfolge P1 > P2 > P3 (Anhang 01 B3) im Spiel spürbar? Kippt sie, Befund «Entwurf an L0» (E8), kein Fix im Paket.

Befunde gehen an den Controller; Fix-Runde per SendMessage an `tech-ui-engineer` (T06) bzw. `tech-sim-engineer`,
danach Nachprüfung per SendMessage an denselben Playtester.
