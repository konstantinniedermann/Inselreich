# REL-17 · Abnahmekriterien AK-R17-01…20

Quelle: Kurzdesign im Handoff `.studio/handoffs/2026-10-10-lead-design-UI-PROBLEM-SPRUNG.md`, R449. In Klammern: der Punkt des Kurzdesigns, den die AK abdeckt, und der Beleg. Jeder Punkt des Kurzdesigns hat mindestens eine AK (Zuordnung unten).

## I-042 Nächstes Problem anspringen

- **AK-R17-01** `problemList` ordnet zu: Klasse 1 = Gebäude mit `needsConnection(defId) && !connected` (E4) und Haus mit Diagnose `supply`; Klasse 2 = Betrieb mit `state` `waitingInput`, `noForest` oder `noService`; Klasse 3 = Haus mit ≥ 1 Diagnose `service`, **ein** Eintrag je Haus; Klasse 4 = Diagnose `good`, **ein** Eintrag je Gut und Insel mit Hauszahl (R449 (1)). (Problem-Klassen · T01 Vitest)
- **AK-R17-02** Nicht in der Liste: `storageFull` (R449 (2)); brennende Gebäude (`outageUntil` gesetzt oder `state === 'burning'`, auch wenn zugleich nicht angebunden); Kontor und `kontor2`; Amtsstube ohne Weg (`needsConnection` falsch); Häuser ohne Diagnose. (Nicht dabei · T01 Vitest)
- **AK-R17-03** Sortierung: Klasse, dann Anker-Insel, dann übrige Inseln nach Index, dann Abstand des Sprungpunkts zu `jumpTarget(world, insel)`, dann Gebäude-ID. Kein Kamera-Parameter; zwei Aufrufe mit gleicher Welt und gleichem Anker liefern dieselbe Liste. (Reihenfolge · T01 Vitest)
- **AK-R17-04** `problemStep`: `+1` nimmt den Nachfolger des Cursor-Schlüssels, `-1` den Vorgänger, Umlauf an beiden Enden; ist der Schlüssel verschwunden, den nächsten bzw. vorigen nach gemerktem Sortierschlüssel; ohne Cursor `+1` → erstes, `-1` → letztes; weicht `activeIsland` von `cursor.landed` ab, neuer Umlauf mit Anker = `activeIsland` (E3); 0 Probleme → `null`. Bei Problemen auf zwei Inseln besucht `+1` alle m Einträge genau einmal je Umlauf. (Zustand, Umlauf · T01 Vitest)
- **AK-R17-05** Texte (E2): „Problem n von m: “ + Eintragstext (Tabelle unten); 0 Probleme: „Alles versorgt, kein Problem offen“. (Rückmeldung · T01 Vitest)
- **AK-R17-06** Sprungpunkt = Footprint-Mitte in Archipel-Kacheln (`isl.ox + c.cx`, `isl.oy + c.cy` mit `center(def, x, y)`); Panel-ID = Gebäude, bei Klasse 4 das erste Haus nach Abstand und ID. (Sprung · T01 Vitest)
- **AK-R17-07** `problems.ts` verändert die Welt nicht (`JSON.stringify` vor/nach gleich), importiert kein DOM; `tests/ui/imports.test.ts` grün. (Baustein · T01 Vitest)
- **AK-R17-08** `hotkeyAction('.')` → `{ kind: 'problemNext' }`, `','` → `{ kind: 'problemPrev' }`; stumm bei Formularfeld/Modal, Strg, Cmd, Alt; unabhängig von der Seefahrt. `e.repeat` ignoriert `input.ts` schon (Z. 505). (Tasten · T02 Vitest)
- **AK-R17-09** `hotkeyList` nennt `.` „Nächstes Problem anspringen“ und `,` „Voriges Problem anspringen“ je genau einmal, direkt nach `?`; der Test AK-U1-03 in `hotkeys.test.ts` wird bewusst angepasst. (Menü-Liste · T02 Vitest)
- **AK-R17-10** Sprung (`runProblemJump` in `problems.ts`, verdrahtet in `app.ts`): laufende Zeigeraktion endet (E6); Kamera zentriert, Zoom bleibt; Info-Panel des Gebäudes offen; aktives Werkzeug bleibt (E1); aktive Insel folgt der Kamera; 0 Probleme: Meldung, Kamera und Panel unverändert. (Sprung, 0 Probleme · T01 Vitest über protokollierende Fakes (B1, R453), T02 Verdrahtung, T05 Browser, T06 Review)
- **AK-R17-11** Die Problem-Meldung ersetzt die vorige: höchstens **ein** Toast mit `data-slot="problem"`, gleicher Text wird nicht verschluckt (E7). (ersetzende Meldung · T05 Browser, T06 Review)

**Eintragstexte (E2).** `{Name}` = `BUILDING_DEFS[defId].name`; `{Haus}` = `HOUSE_TITLES[tier]` (z. B. „Siedlerhaus“); auf Fremdinseln hängt jeder Text ` ({Inselname})` an (`islandName`).

- nicht angebunden: `{Name} nicht angebunden` (Hover-Zeile `troubleLine`)
- Haus ohne Versorgung: `{Haus} ausserhalb der Versorgung` (`diagnosisText`)
- `waitingInput`: `{Name} wartet auf {goodList(missingInputs, sonst consumes)}` (Hover-Zeile)
- `noService`: `{Name} braucht eine {Dienstgebäude} in Reichweite` (Hover-Zeile)
- `noForest`: `{Name}: kein freier Wald in der Nähe` (Zustands-Chip)
- Haus ohne Dienst: `Kapelle fehlt am {Haus}`, mehrere: `Kapelle und Schule fehlen am {Haus}` (`diagnosisText`, `goodList`-Muster mit Gebäudenamen)
- Gut fehlt: `{Gut} fehlt in {n} Häusern`, bei n = 1 `{Gut} fehlt in 1 Haus` (Design-Beispiel)

## I-041 Wege abreissen durch Ziehen

- **AK-R17-12** `isDragPaintTool({ kind: 'demolish' })` ist `true`; `demolishStroke(world, tile)` ist `false`, wenn die Drück-Kachel (Hüllen-Pick) ein Gebäude trägt, sonst `true` (auch `null` = ausserhalb der Karte); `strokePickTool({ kind: 'demolish' })` = `{ kind: 'road' }` (Bodenkachel), andere Werkzeuge unverändert. (Nur Wege, Bodenkachel · T03 Vitest)
- **AK-R17-13** Im Zug wirkt je Kachel nur `removeRoad`; Kacheln mit Gebäude oder ohne Weg werden still übersprungen; Erstattung wie Einzelabriss (Sim unverändert, 2 Geld bei `ROAD_COST` 5); je entfernter Kachel `sound.play('demolish')` (80 ms gedrosselt), keine Sammelmeldung. (Nur Wege, Kosten, Meldungen, Klang · T03 Quelltext-Test, T05 Browser)
- **AK-R17-14** Druck auf eine Gebäudehülle: Einzelabriss wie heute (Meldung `demolishText`), kein Zug, kein `dragEnd`. (Start auf Gebäude · T03 Vitest über `demolishStroke`, T05 Browser)
- **AK-R17-15** Trenn-Warnung: `strokeEndNotice(cut, removed, tiles)` liefert bei `cut > 0` `{ kind: 'warn', text: 'Abriss trennt {cut} Gebäude vom Kontor' }`, sonst bei `removed === 0 && tiles === 1` `{ kind: 'error', reason: 'Kein Weg' }` (E5, Anzeige wie heute „Hier liegt kein Weg“), sonst `null`. `cut` = `newlyCut(before, world)` (T01). Gilt für Zug und Einzelklick auf einen Weg; `Esc`, Rechtsklick und `.` mitten im Zug beenden ihn mit derselben Auswertung, Abgerissenes bleibt. (Schutz, Abbruch, R449 (4) · T01/T03 Vitest, T05 Browser)
- **AK-R17-16** Vorschau im Zug: Bodenkachel unter dem Zeiger, grün nur auf einer Wegkachel (`tile.road`), kein Hüllen-Rot über Gebäuden. Leertaste-Halten beim Druck schwenkt (Vorrang); Touch-Schwelle wie Weg. (Vorschau, Abbruch · T03 Review, T05 Browser)

## Querschnitt

- **AK-R17-17** README: Tastentabelle mit `.` / `,`; Bullet „Abriss“ und „Wann eine Aktion wirkt“ mit Zug; Abschnitt „### Abriss“ mit Trenn-Warnung; arc42 Ebene 2 (`problems.ts`, `input.ts`) und „Ziel je Werkzeug“. (T04, T06)
- **AK-R17-18** Konsole ohne Fehler und Warnungen aus `src/` im ganzen Browser-Lauf; Fenster 1280 × 720 und 1920 × 1080. (T05)
- **AK-R17-19** `git diff main -- src/sim/ src/render/ src/audio/ tests/sim/` leer; keine `SAVE_VERSION`-Änderung; Balancing-Test grün. (T06)
- **AK-R17-20** `make check` Exit 0 auf der Branch nach `git merge main`; `git merge-tree --write-tree main <branch>` Exit 0. (Controller, T06)

## Zuordnung Kurzdesign → AK

| Kurzdesign-Punkt                                   | AK         | Task          |
| -------------------------------------------------- | ---------- | ------------- |
| I-042 Tasten `.`/`,`, `hotkeyAction`, `hotkeyList` | 08, 09     | T02           |
| I-042 Problem-Klassen, „Nicht dabei“               | 01, 02     | T01           |
| I-042 Reihenfolge, Zustand, Umlauf                 | 03, 04     | T01           |
| I-042 Sprung (`centerOn`, Panel, Werkzeug bleibt)  | 06, 10     | T01, T02, T05 |
| I-042 Rückmeldung, 0 Probleme                      | 05, 10, 11 | T01, T02, T05 |
| I-042 Baustein `problems.ts`                       | 07         | T01           |
| I-041 Nur Wege, Bodenkachel                        | 12, 13     | T03           |
| I-041 Start auf Gebäude                            | 14         | T03           |
| I-041 Kosten, Meldungen, Klang                     | 13         | T03, T05      |
| I-041 Vorschau, Abbruch                            | 15, 16     | T03, T05      |
| I-041 Schutz, Trenn-Warnung (R449 (4))             | 15         | T01, T03, T05 |
| Doku, Konsole, kein Sim-Code, `make check`         | 17–20      | T04–T06       |
