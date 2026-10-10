# REL-15 — AK-Entwürfe (Arbeitskennungen A/B/C/D; Nummern AK-R15-nn vergeben in R437)

Zuordnung (R437): A1–A4 = AK-R15-01…04, B1–B6 = AK-R15-05…10, C1–C7 = AK-R15-11…17, D1–D4 = AK-R15-18…21. Quelle: AK-Vorschläge des Kurzdesigns (R435), ergänzt um UI-SEEKARTE-NACHZUG, die Trivial-Fixes aus R435 und die Gate-Entscheide E1–E6 im Index.

## A · UI-INSPEKTOR-ABHILFE

- **A1** `remedyText` liefert für Wohnhäuser wörtlich: Ware ohne Erzeuger „Baue Fischerhütte (F)“; Ware mit Erzeuger „Baue mehr Fischerhütte oder kaufe Nahrung am Kontor“; Dienst „Baue Kapelle (K) in Reichweite“; Fremdgut „Kaufe Gewürz am Kontor oder gründe ein Kontor auf einer Gewürzinsel“ (Vitest `tests/ui/guide.test.ts`, die Erwartungen Z. 150, 165, 171, 294 vorher rot).
- **A2** Kein Abhilfe-Text eines Wohnhauses enthält „fehlt:“, geprüft über alle Diagnose-Arten (Versorgung, Dienst, Ware mit und ohne Erzeuger, Fremdgut); jeder beginnt mit einem Grossbuchstaben (Vitest, vorher rot).
- **A3** Unverändert: Wohnhaus ausserhalb der Versorgung „Baue einen Marktplatz (M) in der Nähe“; Inselchronik „Deine Kaufleute brauchen Gewürz: kaufe es am Kontor oder gründe ein Kontor auf einer Gewürzinsel“ (bestehende Tests grün).
- **A4** Browser-Check: Im Haus-Panel eines Siedlerhauses ohne Kapelle steht „Mangel: Kapelle fehlt“ genau einmal (DOM-`textContent`), darunter die Abhilfe „Baue Kapelle (K) in Reichweite“; kein „fehlt:“ im Panel.

## B · UI-HOVER-SCHILD

- **B1** `cursorHintVisible(hasHint, cardShown)` (`src/ui/hover.ts`, rein) ist genau dann wahr, wenn ein Hinweis da ist und keine Karte offen ist (Vitest `tests/ui/hover.test.ts`, vorher rot).
- **B2** Ablauf mit `hoverVisible`: Ruhe < 400 ms → Schild; ≥ 400 ms auf derselben Kachel → kein Schild; Kachelwechsel, Ziehen oder anderes Werkzeug → Schild (Vitest).
- **B3** Bauen, Weg, Abriss, Roden, Pflanzen: auch nach beliebiger Ruhe keine Karte, Schild sichtbar (Vitest).
- **B4** README Abschnitt „Cursor-Hinweis“ nennt: Bei der Auswahl ersetzt die Mouse-over-Karte das Schild, sobald sie erscheint; Kachelwechsel, Ziehen oder ein anderes Werkzeug bringen es sofort zurück.
- **B5** Browser-Check bei 1280 × 720 und 1920 × 1080: über einem Wohnhaus zuerst nur das Schild, nach ≥ 400 ms nur die Karte (Schild `hidden`), nach einem Kachelwechsel wieder das Schild; je Grösse drei Screenshots.
- **B6** Browser-Check: mit dem Bauwerkzeug über einem Haus ≥ 1 s Ruhe: keine Karte, Schild sichtbar; nach dem Schliessen eines Dialogs erscheint zuerst das Schild (Entscheid E5).

## C · UI-SEEKARTE-NACHZUG

- **C1** `drawSeaMap` zeichnet mit `ui.dpr`: Kontor-Marke `MARK × dpr` breit und hoch, Schiffspunkt-Radius `DOT_R × dpr`, Fahrlinie und Punktrand `1 × dpr`, Hover-Rahmen `2 × dpr` (Vitest `tests/render/seaMapDraw.test.ts`, dpr 1 und 2, vorher rot).
- **C2** Kontor-Marke und Schiffspunkt eines Hafenschiffs derselben Insel überlappen nicht (Hüllrechtecke disjunkt, dpr 1 und 2); die Marke liegt über dem Anker (Vitest, vorher rot).
- **C3** `hud.ts` übergibt an `drawSeaMap` die dpr, mit der die Leinwand beim Öffnen angelegt wurde; die `document`-Listener des Inselmenüs hängen an einem `AbortController`, der beim nächsten Binden derselben Kopfzeile abbricht (Review; Beleg im Browser C7).
- **C4** `tests/render/seaMap.test.ts` enthält kein `performance.now`; der Ersatztest prüft `rasterCount === Inselzahl` und genau ein `fillRect` je Landstreifen (Zähler statt Uhr).
- **C5** `node tools/render-qa/seekarte.mjs --help` Exit 0; ohne `--help` baut das Skript die Szene (Kontor auf Insel 1, zwei Schiffe, Route 0↔1, ein Schiff im Hafen), öffnet die Seekarte je `--size` und `--dpr`, legt Screenshots unter `--out` ab und meldet mit `--leck` die Listener-Zahl vor und nach zwei Neustarts; Exit 0 bestanden, 1 Prüfung fehlgeschlagen, 2 Aufruffehler. Zeile in `tools/render-qa/README.md`.
- **C6** Browser-Check: Seekarte offen bei 1280 × 720 und 1920 × 1080, dpr 1 und 2: Kontor-Marken auf Heimat und Insel 1 sichtbar, nicht vom Hafenpunkt verdeckt, Punktgrösse bei dpr 2 optisch gleich wie bei dpr 1.
- **C7** Browser-Check: nach zweimal „Neue Insel“ genau ein Inselmenü-`pointerdown`-Listener am `document` (Gegenprobe in T04: auf `main`-Stand ohne T03 sind es 3, Ports 5491/5591); Konsole ohne Fehler.

## D · Trivial-Fixes und Doku

- **D1** `tests/render/decorSea.test.ts:259`: Titel „Zoomschwellen: Meeresfels ab 0,25; Wrack, Eiland und Palme ab 0,5 (REL-07)“, Testkörper unverändert.
- **D2** `docs/beobachtungen.md`: Einträge „UI-INSPEKTOR-HILFSZEILE“, „Testtitel «ab 0,25»“ und „Hover-Karte verdeckt Cursor-Hinweis“ als erledigt durch REL-15; „Dienst-Mangel «fehlt in Reichweite»“ abgehakt mit Trigger aus R435; neuer Eintrag zu E6 mit Trigger.
- **D3** `docs/arc42.md`: Zeile `hover.ts` nennt `cursorHintVisible`; Zeile `seaMap.ts` nennt `MapUi.dpr` und die Marke über dem Anker; Zeile `hud.ts` die Abmeldung der Inselmenü-Listener.
- **D4** README Abschnitt „Inseln wechseln“: Inseln mit Kontor tragen auf der Seekarte eine helle Marke über dem Anker.
