# UI-HAEPPCHEN-H: I-147 Zweiter Autosave-Platz «Davor» und I-146 Wirkkreis bei Auswahl (Kurzdesign, Stufe leicht)

Stand 2026-10-22 · Paket UI-HAEPPCHEN-H · Quelle: R797, R798, R806, `docs/ideen.md` I-147 und I-146 (IDEEN-14, Branch `docs/ideen-14`), Vorlage `docs/superpowers/specs/2026-10-21-ui-haeppchen-g-design.md` (Branch `design/ui-haeppchen-g`) · Grösse je S · Save: **nein** (`SAVE_VERSION` unverändert, Slot-Format unverändert; ein zusätzlicher Browser-Speicherschlüssel, kein Teil des Spielstands) · Baseline/Balancing: unberührt · Spielwert in `src/sim/defs/`: keiner neu · Assets: keine

Zwei unabhängige Teile P1 (I-147) und P2 (I-146); Quelldateien überschneiden sich nicht. Beide laufen in einem Plan, zwei Pakete; P2 wartet auf den ORT-A-Merge.

## Teil P1: I-147 Zweiter Autosave-Platz «Davor»

### Spielerzweck

Der Spieler lädt nach einem Fehlklick (falsch abgerissen, falsch gebaut, Vertrag abgeschlossen) einen Stand von vor etwa zwei bis vier Minuten, weil der Autosave nicht mehr den Fehler überschreibt. Das macht Entscheide mutiger. Säule: Bedienung (Spielfluss); stützt alle vier Säulen mittelbar. Heute überschreibt jeder Autosave (alle 2 Minuten laufender Spielzeit, dazu `pagehide`) denselben Platz `inselreich.save.auto`; spätestens nach 2 Minuten ist der Fehler gespeichert.

Nicht dazu: kein Undo in der Sim (I-071 verworfen), kein dritter Platz, keine einstellbare Anzahl oder Frist, kein Zeitstempel im Spielstand, keine Änderung am manuellen Platz, keine Wiederherstellung bei beschädigtem Stand, keine Cloud, kein Export, keine Änderung des Autosave-Takts (`AUTOSAVE_MS` 120000).

### Regeln

1. **Zwei Plätze:** `AUTO_KEY` (`inselreich.save.auto`, bleibt, bestehende Spieler behalten ihren Stand) und neu `AUTO2_KEY` (`inselreich.save.auto2`). `Slot` wird `'manual' | 'auto' | 'auto2'`; die Reihenfolge `SLOTS` nimmt `auto2` auf, damit `listSavesFrom` und `storageProblem` ihn mitprüfen (kaputt, neuer: gleiche Behandlung wie `auto`).
2. **Wechsel über einen Zeiger:** ein dritter, kleiner Schlüssel `AUTO_LAST_KEY` (`inselreich.save.auto.last`) hält `'auto'` oder `'auto2'`, den zuletzt geschriebenen Platz. Das **periodische Autosave** schreibt in den anderen Platz (`otherAuto(last)`) und setzt danach den Zeiger. Fehlt oder ist der Zeiger ungültig: der Platz, der fehlt oder beschädigt ist, sonst der mit der kleineren Spielzeit, bei Gleichstand `auto2`. Schreibt der Platz nicht (Quote), bleibt der Zeiger unverändert.
3. **Neuester Platz** (`newestAuto`) = der Zeiger, sonst (kein Zeiger) der Platz mit der grösseren Spielzeit, bei Gleichstand `auto`. Der andere vorhandene Platz heisst **Davor**. Es gibt «Davor» nur, wenn beide Plätze gültig sind.
4. **`pagehide`** (`autosaveOnHide`) schreibt in den **neuesten** Platz (kein Wechsel, Zeiger bleibt), bei Tick ≤ 0 nichts wie bisher; gibt es noch keinen Autosave, in `auto`. So wechselt ein Neuladen der Seite die Plätze nie und «Davor» bleibt erhalten.
5. **Ladeliste (Menü «Laden»):** `listSaves` liefert die gültigen Plätze; `slotLabel` benennt den neuesten Platz «Autosave — Spielzeit m:ss», den anderen «Autosave davor — Spielzeit m:ss», den manuellen unverändert «Gespeichert — Spielzeit m:ss». Reihenfolge: Autosave, Autosave davor, Gespeichert. Ein Klick lädt pausiert wie heute (`loadSlotPaused`, Slot-Typ erweitert).
6. **Startkarte:** «Fortsetzen — Autosave (Spielzeit …)» lädt den neuesten Platz (`startChoices` nutzt `newestAuto`, nicht mehr `slot === 'auto'`). Gibt es «Davor», erscheint zusätzlich eine Nebenwahl «Davor laden — Autosave (Spielzeit …)» (nicht primär) zwischen «Fortsetzen» und «Gespeichertes Spiel laden». Primärknopf bleibt wie heute.
7. **«Neue Insel»-Abfrage** (`newIslandPrompt(hasAuto)`): `hasAuto` gilt, wenn irgendein Autosave-Platz vorhanden ist (bisher `slot === 'auto'`).
8. **Quote:** `write` fängt den Wurf wie bisher; der Fehler des periodischen Schreibens bleibt «Autosave fehlgeschlagen», einmal je laufendem Spiel gemeldet. Schlägt das Schreiben fehl, wird der **andere** Platz nie gelöscht oder geleert (er ist dann der einzige gültige Stand). Der Zeiger-Schlüssel ist winzig; sein Schreibfehler bleibt stumm (Rückfall auf die Spielzeit-Regel in 2./3.).
9. **Platzbedarf:** Der Bedarf des Autosave verdoppelt sich (zwei Stände); ein Stand ist heute ein JSON der Welt. Die Umsetzung misst die Grösse eines Standes einer weit fortgeschrittenen Partie (mehrere Inseln) im Browser-Check und nennt sie im Bericht; liegt ein Stand über 1 MB (zwei Autosaves plus manueller Platz nähern sich 5 MB), meldet der Umsetzer das vor dem Merge (Designfrage F4 unten).
10. **Randfälle:** nur Platz `auto` vorhanden (Bestand): kein «Davor», Label «Autosave», erstes periodisches Schreiben geht in `auto2`, danach hat jeder Platz einen Stand. Zeiger zeigt auf einen beschädigten oder fehlenden Platz: Rückfall auf Spielzeit-Regel. Beide beschädigt: wie bisher «Kein Spielstand» bzw. Speicher-Hinweis (`storageProblem`). Gesperrter Speicher (`getItem` wirft): `listSaves` leer, kein Wurf. Laden von «Davor» ändert keinen Platz; das nächste periodische Schreiben geht in den Platz, der nicht der Zeiger ist, also in den eben geladenen «Davor»-Platz; der Fehlklick-Stand bleibt bis dahin als neuester Platz erhalten (Rollback-Fenster ≈ 2 Minuten).

### Abnahmekriterien

Vitest (`tests/ui/storage.test.ts`, `tests/ui/menu.test.ts`, `tests/ui/startCard.test.ts`; Fake-`StorageLike` mit `setItem`):

- AK-H1 Wechsel: Zeiger `auto` → `saveAuto` schreibt `auto2` und setzt den Zeiger `auto2`; der nächste Aufruf schreibt `auto`; drei Aufrufe nacheinander ergeben den Wechsel `auto2, auto, auto2`.
- AK-H2 Ohne Zeiger: nur `auto` vorhanden → schreibt `auto2`; beide vorhanden, `auto` Tick 500, `auto2` Tick 300 → schreibt `auto2` (kleinere Spielzeit); beide gleich → `auto2`; Platz beschädigt → dieser zuerst.
- AK-H3 Neuester und Davor: `newestAuto` folgt dem Zeiger; ohne Zeiger der grössere Tick; mit nur einem Platz gibt es kein «Davor».
- AK-H4 `slotLabel` und Reihenfolge: «Autosave — Spielzeit 4:00», «Autosave davor — Spielzeit 2:00», «Gespeichert — Spielzeit …»; mit einem Autosave nur «Autosave — …».
- AK-H5 `autosaveOnHide`: schreibt in den neuesten Platz, lässt den Zeiger unverändert, ändert den anderen Platz nie; Tick 0 schreibt nichts; ohne Autosave schreibt es `auto`; wirft `write`, bleibt es folgenlos (bestehender Test bleibt grün).
- AK-H6 Quote: wirft `setItem` für den Zielplatz, liefert `saveAuto` `{ ok: false, reason: 'Autosave fehlgeschlagen' }`, der andere Platz und der Zeiger bleiben bitgleich; wirft nur das Zeiger-Schreiben, bleibt das Ergebnis `ok` und der Stand gültig.
- AK-H7 `startChoices`: «Fortsetzen» zeigt die Spielzeit des neuesten Platzes und `slot` des neuesten; mit «Davor» entsteht die Nebenwahl «Davor laden — Autosave (Spielzeit …)» mit dem anderen Slot, nicht primär; ohne «Davor» fehlt sie; Primärknopf-Logik (`primary`) unverändert für `manual`.
- AK-H8 `storageProblem` und `listSavesFrom` berücksichtigen `auto2` (kaputter `auto2` → `damaged`, neuerer `auto2` → `newer`, gesperrter Speicher → `unavailable`).
- AK-H9 `newIslandPrompt` fragt mit «Autosave» auch, wenn nur `auto2` besteht.
- AK-H10 Format und Sim unberührt: `serialize`-Ausgabe beider Plätze ist byte-gleich zur bisherigen für dieselbe Welt, `SAVE_VERSION` unverändert, Replay-Hash/Baseline bitgleich, `tests/sim/balance.test.ts` unverändert (kein eigener Test, nur der Lauf).

Browser-Check (`qa-playtester`, Headless): AK-H11 Spiel starten, über zwei Autosave-Takte laufen lassen (Spielzeit, Tempo 3×): Menü → «Laden» zeigt «Autosave — Spielzeit …» und «Autosave davor — Spielzeit …» mit um etwa zwei Spielminuten unterschiedlichen Zeiten; «Davor» lädt pausiert mit der kleineren Spielzeit. AK-H12 Seite neu laden: «Fortsetzen» trägt die grössere Spielzeit, «Davor laden» ist da; nach zwei Neuladen ohne Spielzeit bleiben beide Zeiten gleich (kein Wechsel durch `pagehide`). AK-H13 localStorage-Grösse beider Autosaves und des manuellen Standes in der weiten Partie wird gemessen und berichtet (Regel 9).

## Teil P2: I-146 Wirkkreis bei ausgewählter Kapelle, Schule und Feuerwache

### Spielerzweck

Der Spieler klickt eine stehende Kapelle, Schule oder Feuerwache an und sieht sofort ihren Wirkkreis, also welche Häuser sie noch versorgt und welche nicht, ohne ein Gebäude neu zu platzieren. Säule: Bevölkerung versorgen und aufsteigen lassen (Versorgungslücken lesbar). Heute zeigt nur das Bau-Werkzeug den Kreis (README «Radiusanzeige beim Platzieren»); bei einer stehenden Kapelle fehlt er (Befund I-112).

Nicht dazu: keine Sim-Änderung, kein neuer Kreis-Zeichner (die Ellipse ist die vorhandene), keine Umriss-Fläche der Gesamtabdeckung bei Auswahl (Regel 3), keine Hervorhebung einzelner Häuser, keine Kreise für Wohnhaus, Marktplatz, Bad oder Standortgebäude (Designfrage F5), kein Kreis für Gebäude auf Fremdinseln (Regel 5), keine Einstellung, kein Hotkey, kein Ton.

### Regeln

1. **Wann:** Das ausgewählte Gebäude (`selectedId`) hat einen Wirkradius (`service` mit `serviceRadius` oder `fireProtection` mit `serviceRadius`; heute Kapelle, Schule, Feuerwache und, weil gleiche Eigenschaft, das Bad: Designfrage F5) und steht auf der Heimatinsel. Dann zeichnet `render()` im Auswahl-Block (`src/render/renderer.ts`, bei der gelben Auswahlumrandung) die Ellipse des Wirkkreises.
2. **Reine Funktion** `selectionPlan(world, building): OverlayPlan | null` in `src/render/overlays.ts` (neben `overlayPlan`), liest nur die Welt: Mitte = Gebäudemitte (`center(def, b.x, b.y)`), Radius = `serviceRadiusOf(world, defId)` (folgt dem Ratsbeschluss Glockenrecht live). Antwort `{ circle, coverage: null, highlight: [] }`; sonst `null`. Sie ruft **nicht** `placementZone` (das würde je Frame `tilesInRadius` rechnen) und nicht den Abdeckungs-Cache.
3. **Nur der Kreis, keine Umriss-Fläche:** Der Umriss der Gesamtabdeckung (Platzieren) zeigt die Fläche **aller** Gebäude der Art und würde bei Auswahl den Beitrag dieses einen Gebäudes verdecken. Bei Auswahl gilt nur die gestrichelte Ellipse (`CIRCLE_COLOR`, 1,5 px, Linienstrich 6/4). Folge: `overlayCache` wird bei Auswahl nie berührt (kein neuer Cache-Eintrag, kein `layoutKey`-Lauf, kein Mehrverbrauch).
4. **Gemeinsamer Zeichner:** Der Kreis-Teil von `drawPlacementOverlay` wird zu einer kleinen Funktion `drawOverlayCircle(ctx, cam, circle)` ausgelagert, die Platzieren und Auswahl gemeinsam nutzen (DRY, gleiche Optik); Platzieren bleibt zeichengleich.
5. **Insel:** `overlayPlan`, `placementZone` und der Abdeckungs-Cache rechnen über die Heimatinsel (`HOME`). Die Auswahl zeichnet den Kreis deshalb nur, wenn `building.island === HOME`; bei Gebäuden auf Fremdinseln entfällt er ohne Fehler. (Heute baut der Spieler Kapelle, Schule und Feuerwache nur auf der Heimatinsel; die Regel ist der Schutz, falls sich das ändert.)
6. **Vorrang:** Ist ein Bau-Werkzeug aktiv (`hover.tool.kind === 'build'`), zeichnet nur das Platzieren-Overlay; die Auswahl-Ellipse entfällt, damit nie zwei Ellipsen erscheinen. Reihenfolge im Bild: Auswahl-Kreis nach den Signalen, vor der gelben Auswahlumrandung (Umrandung bleibt oben).
7. **Randfälle:** Gebäude abgerissen oder Auswahl aufgehoben → kein Kreis im nächsten Frame (Plan `null`). Gebäude im Bau: Wirkung beginnt erst nach dem Bau? Der Kreis wird trotzdem gezeigt (er zeigt, was die Wirkung sein wird; keine Bauzustands-Prüfung, einfacher). Zoom und Kamera: Ellipse folgt `cam.zoom` wie beim Platzieren. Kreis ausserhalb des Bildes: Canvas schneidet; kein Culling nötig (eine Ellipse).

### Abnahmekriterien

Vitest (`tests/render/overlays.test.ts`, `tests/render/renderer*.test.ts` mit Fake-Kontext `tests/render/fakeCtx.ts`):

- AK-H14 `selectionPlan` liefert für Kapelle, Schule und Feuerwache einen Kreis mit Mitte = Gebäudemitte und Radius = `serviceRadiusOf`; `coverage` ist `null`, `highlight` leer.
- AK-H15 Für Wohnhaus, Kontor und Standortgebäude (Holzfäller) ist das Ergebnis `null`; Marktplatz und Bad nach Entscheid F5 (Empfehlung: Marktplatz `null`, Bad Kreis).
- AK-H16 Ratsbeschluss Glockenrecht ändert den Radius: Kreis der Kapelle vor und nach dem Beschluss entspricht `serviceRadiusOf`.
- AK-H17 Fremdinsel: Gebäude mit `island !== HOME` → `null`, kein Wurf.
- AK-H18 Reine Lesefunktion: Welt vorher/nachher `serialize`-gleich; `placementZone`, `tilesInRadius` und `overlayCache` werden nicht aufgerufen (injizierte Zählung bzw. Spy: Cache-Einträge vor und nach gleich).
- AK-H19 Zeichner: bei Auswahl einer Kapelle zeichnet `render` mit dem Fake-Kontext genau eine Ellipse (`ellipse`-Aufruf) mit `CIRCLE_COLOR` und Strichmuster 6/4 zusätzlich zur gelben Umrandung; ohne Auswahl keine; bei Auswahl eines Wohnhauses keine.
- AK-H20 Vorrang: Auswahl und aktives Bau-Werkzeug zugleich → eine Ellipse (die des Werkzeugs), nicht zwei.
- AK-H21 Platzieren unverändert: `drawPlacementOverlay` erzeugt für dieselben Eingaben dieselbe Aufrufabfolge am Fake-Kontext wie vor der Auslagerung (Regressionsschutz der bestehenden Overlay-Tests).
- AK-H22 Sim unberührt: Replay-Hash/Baseline bitgleich, `tests/sim/balance.test.ts` unverändert, `SAVE_VERSION` unverändert (kein eigener Test, nur der Lauf).

Browser-Check (`qa-playtester`, Headless): AK-H23 Kapelle bauen, mit Escape das Werkzeug beenden, die Kapelle anklicken: gestrichelter Kreis um die Kapelle sichtbar, Häuser innerhalb und ausserhalb unterscheidbar; anderes Gebäude anklicken: Kreis wechselt oder verschwindet; Schule und Feuerwache ebenso; Rat «Glockenrecht» wählen und Kapelle erneut anklicken: Kreis grösser. AK-H24 Kapelle ausgewählt, dann Bau-Werkzeug Kapelle: nur die Platzieren-Anzeige.

## Überschneidungen

- **I-147 mit I-148** (UI-HAEPPCHEN-G, Branch `feat/ui-haeppchen-g`): beide berühren `src/ui/app.ts`. I-148 ergänzt am Ende von `loadSlotPaused` den Aufruf der Karte «Wo war ich?»; I-147 erweitert dessen Parametertyp (`Slot` um `auto2`, in `storage.ts`), die Imports, das periodische Autosave (um Zeile 1756) und `onPageHide`. Hunks disjunkt, Typ-Verbund über `Slot`. Reihenfolge: G zuerst nach main, danach H (oder H nach G rebasen); die Karte nutzt `loadSlotPaused` für alle Ladepfade und bekommt «Davor» damit ohne Zusatzarbeit. Ein Test in G (`tests/ui/app*.test.ts`, Slot-Typ) kann bei H nachgezogen werden. Weitere Berührung: `startCard.ts` und `menu.ts` nur in H.
- **I-146 mit ORT-A** (`src/render/`): P2 ändert `src/render/overlays.ts` und im Auswahl-Block `src/render/renderer.ts`. Umsetzung **erst nach dem ORT-A-Merge nach main** (R806, `docs/ideen.md` I-146); danach Rebase und Test auf freier Testsperre. Bis dahin ist P2 nur Design. P1 hängt nicht an ORT-A und kann sofort laufen, sobald die Testsperre frei ist.
- Stadtplanung berührt `src/ui/app.ts` und `src/style.css` (T08): P1 fügt in `app.ts` wenige Zeilen hinzu, kein CSS.

## Zuschnitt und Dateien

P1 (tech-ui-engineer): `src/ui/storage.ts` (Schlüssel, `Slot`, `newestAuto`, `otherAuto`, `saveAuto`, `autosaveOnHide`, `storageProblem`), `src/ui/menu.ts` (`slotLabel`, Liste), `src/ui/startCard.ts` (`startChoices`), `src/ui/app.ts` (Autosave-Aufruf, `newIslandPrompt`-Argument), `README.md` (Speichern, Laden: zwei Autosave-Plätze, «Autosave davor», Startkarte), Tests `tests/ui/storage.test.ts`, `menu.test.ts`, `startCard.test.ts`. P2 (art-rendering-engineer oder tech-ui-engineer): `src/render/overlays.ts` (`selectionPlan`, `drawOverlayCircle`), `src/render/renderer.ts` (Auswahl-Block), `README.md` (Radiusanzeige auch bei Auswahl), Tests `tests/render/overlays.test.ts`, `renderer*.test.ts`. Kein `src/sim/`, kein `src/audio/`, kein Save, kein CSS. Keine neue Laufzeit-Abhängigkeit.

## Designfragen für L0 (Entwürfe mit Empfehlung)

- **F1 Zeiger-Schlüssel oder Spielzeit-Rang?** Empfehlung: kleiner dritter Schlüssel `inselreich.save.auto.last` (Regel 2). Begründung: Rang nach Spielzeit allein kippt bei «Neue Insel» (die kleinere Spielzeit des neuen Spiels gälte als «Davor», «Fortsetzen» lüde für 2 Minuten das alte Spiel). Alternative ohne Zusatzschlüssel (nur Spielzeit) bleibt als Rückfall. Der Schlüssel ist kein Spielstand-Format, keine Save-Version.
- **F2 `pagehide`: wechseln oder überschreiben?** Empfehlung: in den neuesten Platz überschreiben, nie wechseln (Regel 4). Sonst entwertet jedes Neuladen kurz nach dem Fehlklick das «Davor» sofort.
- **F3 Davor auf der Startkarte?** Empfehlung: ja, als Nebenwahl (Regel 6). Der Fehlklick-und-Neuladen-Fall ist der häufigste Weg zu «Davor»; ohne die Wahl müsste der Spieler zuerst laden und dann das Menü öffnen.
- **F4 Quote-Grenze:** Empfehlung: nur messen und berichten (AK-H13), keine Komprimierung, keine Auto-Löschung des manuellen Platzes. Liegt ein Stand über 1 MB, kommt P1 zu L0 zurück (Optionen: Davor nur bei Stand unter Grenze, oder Komprimierung per ADR).
- **F5 Welche Gebäude bekommen den Kreis?** Auftrag und Idee nennen Kapelle, Schule, Feuerwache. Das Bad hat dieselbe Eigenschaft (`service` mit `serviceRadius`), der Marktplatz einen Versorgungsradius (`supplyRadius`). Empfehlung: Kapelle, Schule, Feuerwache **und Bad** (gleiche Regel «hat `serviceRadius`», ein Sonderfall weniger im Code); Marktplatz nicht (Versorgung läuft über Wohnhaus-Umriss, Spielerwirkung offen, eigene Idee). Entscheidet L0.
- **F6 Umriss der Gesamtabdeckung bei Auswahl?** Empfehlung: nein, nur der Kreis (Regel 3): zeigt den Beitrag dieses Gebäudes, braucht keinen Cache, entschärft das Perf-Risiko der Idee.
- **F7 Reihenfolge der Merges:** Empfehlung: UI-HAEPPCHEN-G vor H (gleiche Datei, Ladepfad); P2 nach dem ORT-A-Merge, P1 darf vorher.

## Selbstprüfung (Gate Brainstorming)

| Frage               | Befund                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Säule               | P1 Bedienung (Spielfluss), mittelbar alle; P2 Bevölkerung versorgen (Lücken lesbar). Bei Fehlschlag bleibt das Spiel gleich, es fehlt nur Komfort.                                                                           |
| Echte Wahl          | P1: Weiterspielen oder zwei Minuten zurück; die Wahl kostet Spielzeit (Verlust seit dem Stand), also keine dominante Option und kein Pflicht-Rückladen. P2: reine Information.                                               |
| Rückkopplung        | P1 senkt die Scheu vor riskanten Entscheiden (gewollt), kein Eingriff in die Wirtschaft; Save-Scumming bei Zufallsereignissen möglich, aber bei deterministischem Sim ohne Gewinn und auf zwei Minuten begrenzt. P2 keine.   |
| Randfälle           | Nur ein Platz, Zeiger ungültig, Platz beschädigt, Quote, gesperrter Speicher, Neue Insel, Neuladen (`pagehide`), Laden von «Davor»; Fremdinsel, Glockenrecht, Gebäude abgerissen, Bau-Werkzeug aktiv, Gebäude im Bau.        |
| Einfachere Variante | P1 ohne Zeiger-Schlüssel (nur Spielzeit-Rang) wäre kleiner, kippt aber bei «Neue Insel» (F1). P2 mit dem Gesamtumriss wäre weniger lesbar und teurer; nur-Kreis ist die einfachere Variante mit der Spielerwirkung der Idee. |

Urteil Selbstprüfung: OK.
