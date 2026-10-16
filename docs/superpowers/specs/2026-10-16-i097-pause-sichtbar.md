# I-097 «Pause sichtbar auf der Karte» (Kurzdesign, Stufe leicht)

Stand 2026-10-16 · Paket design-I-097 · Quelle: R663, I-097 (IDEEN-09 Scout C) · Save: nein · neuer Spielwert: nein · Sim-Änderung: nein

## Spielerzweck

Der Spieler sieht bei angehaltenem Spiel einen getönten Kartenrand mit dem Hinweis «Pause» und hält das stehende Bild nicht für einen Hänger. Säule: Bedienung (alle Säulen profitieren, weil der Spieler Zustand und Zeit richtig liest). Heute zeigt nur der gedrückte ⏸-Knopf in der Kopfzeile die Pause (`src/ui/hud.ts`); beim Laden erscheint nur ein kurzer Toast («Pausiert — P oder 1× setzt fort»).

## Regeln

1. **Auslöser.** Die Pause gilt genau dann, wenn `state.speed === 0` (`src/ui/app.ts`). Knopf ⏸, P, Leertaste (antippen) und Laden setzen alle diesen einen Zustand; es gibt keinen zweiten Pause-Merker. Die Anzeige leitet sich nur davon ab.
2. **Reiner Helfer.** `pauseOverlayView(speed, modalOpen)` in neuer Datei `src/ui/pauseOverlay.ts` (DOM-frei, Muster `spaceTap.ts`/`hotkeys.ts`), Ergebnis `{ visible: boolean }`; `visible = speed === 0 && !modalOpen`. Konstante `PAUSE_LABEL = 'Pause'` im selben Modul.
3. **Darstellung.** Ein festes Element `<div class="pause-overlay" hidden>` im `#game`-Bereich (Karte), nicht in der Kopfzeile: getönter Rand als `box-shadow: inset 0 0 0 4px` plus weicher Innenschatten in einem vorhandenen Farbwert (kein neuer Farbwert nötig; Entscheid Tech/Art), darin mittig oben ein Banner «Pause» mit Zusatz «P oder 1× setzt fort». Der Hinweistext nutzt das Wording von `PAUSE_TOOLTIP`/Lade-Toast. Der Rand ist nur Tönung; keine Animation (keine Bewegung bei `prefers-reduced-motion`-Fragen nötig).
4. **Keine Eingabe-Interferenz.** `pointer-events: none` auf Overlay und Banner; Klicks, Ziehen, Mausrad, Rechtsklick und Pipette erreichen die Karte unverändert. Das Overlay nimmt keinen Fokus (kein `tabindex`), Tab-Reihenfolge unverändert. Zugänglich: `role="status"` mit Text «Pause» (einmaliges Ansagen beim Eintritt).
5. **Schichtung.** `z-index` unter Modalen, Menü und Toasts (Toasts 10, Cursor-Hinweis/Modale 20+), über Canvas. Kopfzeile und Bauleiste liegen ausserhalb von `#game` und werden nicht getönt.
6. **Kein Doppelhinweis.** Ist ein Menü oder Dialog offen (`isModalOpen()` aus `src/ui/modal.ts`), ist das Overlay verborgen; das Modal selbst dunkelt schon ab. Schliesst das Modal und `speed` ist weiter 0, erscheint das Overlay wieder. Das Menü gilt nicht als Pause: Öffnen des Menüs ändert `state.speed` nicht (heutiges Verhalten, unverändert).
7. **Aktualisierung.** Ein Aufruf `syncPauseOverlay()` in `app.ts` an den Stellen, an denen sich `speed` oder der Modalzustand ändert: `setSpeed` (Zeile ~1025, deckt Knopf, P, Leertaste, Tempo-Tasten ab), `restart(...)` (Laden/Neue Insel) und nach Öffnen/Schliessen von Modalen. Alternativ ein Aufruf in `refresh()`; Schreiben nur bei geändertem Wert (`el.hidden !== !visible`), Muster `chip.title !== tip`. Die Wahl trifft der Plan.
8. **Tempo-Wechsel.** 1×/2×/4× blenden das Overlay aus, ⏸ ein; Wechsel von 2× auf 4× ändert nichts. Der Lade-Toast «Pausiert — …» bleibt (kurzlebig, ergänzt); keine Doppelung, weil der Toast verschwindet und das Overlay bleibt.
9. **Laden im Pausezustand.** `loadSlotPaused` startet mit `speed: 0`; das Overlay ist sofort sichtbar, ohne dass der Spieler etwas drücken muss. Zusätzlich gilt: Ein Spielstand speichert die Pause nicht (Save unverändert, `speed` ist UI-Zustand).
10. **Desktop-first.** Gestaltet für ≥ 1280 px; bei schmaleren Fenstern bricht das Banner nicht um (`white-space: nowrap`) und überdeckt keine Bedienelemente; mehr nicht (keine Mobil-Optimierung).

## Abgrenzung

- **UI-HAEPPCHEN-D** berührt `src/ui/app.ts` und `src/style.css` (Ereignis-Log, Bündelung I-109); Überschneidung in beiden Dateien. Umsetzung von I-097 folgt nach dessen Merge (R663); das Kurzdesign selbst ändert keinen Code. Konfliktarm halten: neue Logik im neuen Modul `pauseOverlay.ts`, in `app.ts` nur Einhängen, in `style.css` ein abgeschlossener Block am Dateiende.
- **I-109** (Reichweite am Gut-Chip) friert in der Pause ein; keine Wechselwirkung.
- **I-058** (Pause bei Krise, geparkt): würde dieselbe Anzeige nutzen; nicht Teil von I-097.
- **Erweiterung 1** (Nutzer-Session): nicht berührt.
- Nicht dazugehörig: Ton oder Musikdämpfung in der Pause, Pause-Menü, Pause beim Fensterwechsel (Tab im Hintergrund), Bildschirm-Entsättigung der Karte, Uhr- oder Tageszeit-Anzeige, Änderung der Tastenbelegung.

## Abnahmekriterien

| ID    | Prüfung                                                                                                                                                                                                         | Art                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AK-1  | `pauseOverlayView(0, false)` sichtbar; `(1\|2\|4, false)` verborgen                                                                                                                                             | Vitest `tests/ui/pauseOverlay.test.ts` |
| AK-2  | `pauseOverlayView(0, true)` verborgen (kein Doppelhinweis bei Menü/Dialog); `(0, false)` danach wieder sichtbar                                                                                                 | Vitest                                 |
| AK-3  | Gleichheit Knopf und Taste: `afterPause(1, 1)` → Tempo 0 und `afterPause(0, 2)` → Tempo 2 liefern über `pauseOverlayView` sichtbar bzw. verborgen; Knopf ⏸ nutzt denselben `setSpeed`-Weg (kein zweiter Merker) | Vitest + Diff                          |
| AK-4  | Tempo-Folge 0 → 1 → 2 → 4 → 0: Sichtbarkeit nur bei 0; nach Wechsel 4 → 0 → `afterPause` bleibt gemerktes Tempo (bestehende `hotkeys.test.ts` bleibt grün)                                                      | Vitest                                 |
| AK-5  | Overlay-Element hat `pointer-events: none` (Stil-Regel vorhanden), kein `tabindex`, `role="status"`, Text enthält «Pause»                                                                                       | Vitest (DOM-Fake) oder Stil-Prüfung    |
| AK-6  | Browser (1280 px): ⏸-Knopf, P und Leertaste zeigen jeweils denselben Rand und dasselbe Banner; Weiterspielen blendet beides aus                                                                                 | Browser-Check                          |
| AK-7  | Browser: In der Pause Bauen, Karte ziehen, Mausrad-Zoom, Rechtsklick funktionieren durch das Overlay hindurch                                                                                                   | Browser-Check                          |
| AK-8  | Browser: Menü oder Dialog öffnen während Pause → nur ein Hinweis (Modal); Schliessen → Overlay wieder da; Menü bei laufendem Spiel zeigt kein Overlay                                                           | Browser-Check                          |
| AK-9  | Browser: Spielstand laden → Overlay sofort sichtbar (Pausezustand), Toast «Pausiert — …» erscheint zusätzlich und verschwindet, Overlay bleibt                                                                  | Browser-Check                          |
| AK-10 | Browser: Banner umbricht bei 1280 px nicht, überdeckt weder Kopfzeile noch Bauleiste noch Ereignis-Log                                                                                                          | Browser-Check                          |
| AK-11 | Spielstand ohne neues Feld; `src/sim/` und `src/sim/defs/` ohne Diff; `make check` grün, Balancing-Test unberührt; README-Spielanleitung um einen Satz ergänzt                                                  | Diff / `make check`                    |

## Randfälle

- Neustart «Neue Insel» (`restart`): Startet mit `speed` laut Aufruf; Overlay folgt dem Zustand ohne Sonderfall.
- Pause während Start-/Titelkarte: nur sichtbar, wenn `speed === 0` und die Karte sichtbar ist; liegt die Startkarte als Modal darüber, gilt Regel 6.
- Schnelles Umschalten (Leertaste mehrfach): Schreiben nur bei Wertänderung; kein Flackern, keine Animation.
- Pause beim Schiff-/Kamera-Schwenk: Kamera bewegt sich weiter (UI), das Overlay bleibt am Rand der Karte fixiert (nicht mit der Karte verschoben).
- Fenstergrösse ändert sich: Overlay füllt `#game`, folgt über CSS.
- Weitere Hinweise (Toasts) und Overlay gleichzeitig: erlaubt; Toast liegt darüber (z-index).

## Selbstprüfung (Gate Brainstorming)

1. Säule: Bedienung/Lesbarkeit des Zustands; ohne Hinweis wirkt Pause im Playtest wie ein Hänger.
2. Echte Wahl: unverändert; reine Anzeige.
3. Rückkopplung: keine; erwünscht ist nur, dass Spieler Pause bewusster ein- und ausschalten.
4. Randfälle oben (Modal, Mausereignisse, Laden, Tempo, Fenster).
5. Einfachere Variante (nur Rand ohne Text) verliert die Erklärung; (nur Text ohne Rand) fällt auf. Rand plus kleines Banner ist die kleinste Fassung. Fallback: Banner streichen, Rand behalten.

Urteil: OK.

## Offene Fragen

- O-1: Farbton und Breite des Rands (Vorschlag 4 px plus weicher Schatten, bestehender Akzentwert); Entscheid im Plan, kein Spielwert.
- O-2: `syncPauseOverlay()` an `setSpeed`/`restart`/Modal oder in `refresh()` (Regel 7); Tech entscheidet nach dem Merge von UI-HAEPPCHEN-D.
