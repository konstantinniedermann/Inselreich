# T15 · Browser-Lauf 1: Bauen, Panel, Bildstufen, Bestätigung

Rolle `qa-playtester` (sonnet) · gestartet vom UI-Controller (D) · AK-M13E2-40, -41, -42, -45, -46, -48 (Spec §10.4)
· blocked-by T12 (UI-Baum enthält Sim ≥ T06 und ART T09) · ein Lauf

**Gegenstand:** `.worktrees/m13-e2-ui` am Stand nach T12 (Hash im Ledger). Headless-Chrome, 1280×720 und 1920×1080;
Screenshots `.studio/qa/m13-e2/<ak>-<breite>x<höhe>.png`, AK-46: `46-s<n>-<licht>-<b>x<h>.png`. Ausgangsstände aus
Anhang 08 D (Seed 3, erzeugt in T06, geladen wie die übrigen Browser-Szenarien).

## Schritt 0 (QA-B2, vom Controller D vor dem Start)

Im UI-Baum `git merge main` (bringt I-049-Sim, falls schon gemergt), dann die Szenarien neu schreiben
(`writeScenarios` und `writeExtraSaves`, Befehl aus dem Kopf von `tests/sim/scenarios.ts`), Commit-Hash und Dateiliste
im Ledger notieren; der Playtester prüft genau diesen Stand. **Nie gleichzeitig mit dem Browser-Lauf I-048-T04**
(Prod-B7). Dieselbe Regel gilt für die Browser-Läufe der Folgestränge (I-049-UI, I-048-UI).

## Prüfschritte

| AK  | Stand                                | Schritte und Erwartung                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 40  | `m13e2-vor-ziel2`, `m13e2-ziel2`     | vorher «Öffentlich» ohne Denkmal; danach Denkmal mit Tooltip «Wahlziel in drei Abschnitten: Stein, Werkzeug, Glas, Gewürz»; Vorschau 3×3 mit Bild Stufe 4 (grün frei; rot auf einer Fremdinsel mit Grund); Bau → Bauplatz, Geld −500                                                     |
| 41  | `m13e2-bauplatz`                     | Panel: vier Gut-Zeilen mit Reserve und Schalter, Knopf «Abschnitt 1 beginnen (4000)»; Klick → Geld −4000, Bild Sockel mit Gerüst, Balken füllen sich, «frühestens fertig in …» zählt; «Bau pausieren» → «Bau pausiert»; kein waagrechtes Scrollen (Messwert `scrollWidth ≤ clientWidth`) |
| 42  | `m13e2-bauplatz` (Stein auf Reserve) | Abschnitt starten, «zukaufen» Stein an → Geld −15 je Sekunde, Balken steigt; Weg abreissen → «Nicht angebunden»                                                                                                                                                                          |
| 45  | `m13e2-abschnitt1`, `m13e2-bauplatz` | erster Klick «Abreissen», `Entf` bzw. `Backspace` → «Wirklich abreissen? Fortschritt geht verloren»; `Esc` setzt zurück; zweiter reisst ab; Abriss-Werkzeug → Meldung «Denkmal nur im Panel abreissen»; ein Haus per `Entf` sofort weg; im Bauplatz-Stand Denkmal per `Entf` sofort weg  |
| 46  | `m13e2-bild-0` … `-4`                | je Stufe bei Standard-Zoom: Tag, Nacht, Regen; Stufe 4 als höchstes Bauwerk der Heimat erkennbar (höher als die Amtsstube daneben), nachts Leuchtfeuer                                                                                                                                   |
| 48  | `m13e2-abschnitt1`, 800×600          | Denkmal-Panel offen: keine Überlappung, keine Konsolenfehler                                                                                                                                                                                                                             |

Je AK: Konsole ohne Fehler (Liste im Report). Unklare Bildwirkung (AK-46) als Befund mit Screenshot an den Controller,
der `lead-art` fragt; Urteil Bild gehört `lead-art`, nicht dem Playtester.

## Ausgabe

Playtest-Report als Schlussbericht: je AK bestanden/nicht bestanden mit Screenshot-Pfaden und Messwerten, Befunde mit
Schweregrad. Keinen Code ändern. Fixes laufen als Fix-Runde im UI-Baum (bzw. ART-Baum für Bild), danach Teil-
Wiederholung der betroffenen AK per SendMessage an denselben Playtester.
