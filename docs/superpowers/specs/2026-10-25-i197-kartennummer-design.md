# I-197 Kartennummer wählen (Kurzdesign, Stufe leicht)

Datum 2026-10-25 · Paket design-I-197-I-201 · Quelle: `docs/ideen.md` I-197 (Branch `docs/ideen-17`, IDEEN-17 Rang 1). Kein Save, kein neuer Spielwert.

## Spielerzweck

Der Spieler tippt bei «Neue Insel» eine Kartennummer ein und spielt dieselbe Insel wie ein Freund oder wie in der letzten Partie, nur mit
anderer Krisenstufe oder Freischaltung. Leer heisst Zufall wie bisher. Säule: Insel besiedeln. Spürbar im ersten Spiel: die Zahl
«Karte 4711» im Menü lässt sich weitergeben und wieder eintippen.

## Regeln

1. **Feld** «Karte (Nummer, leer = Zufall)» im Neue-Insel-Block des Menüs (`src/ui/menu.ts`, neben «Krisen» und «Freischaltung»).
   Textfeld mit `inputmode="numeric"`, Platzhalter «zufällig». Es wird nie gespeichert (nicht in `inselreich.settings`, nicht im Spielstand) und
   ist beim Öffnen des Menüs immer leer.
2. **Gültig:** nach `trim()` leer (Zufall) oder 1–8 ASCII-Ziffern (`/^\d{1,8}$/`, also 0 … 99 999 999; führende Nullen erlaubt, `00042` = 42).
   Alles andere (Minus, Komma, Buchstaben, Exponent, Volltext-Ziffern, 9+ Ziffern) ist ungültig.
   **Bereich weiter als die Idee (0 … 99 999):** Das Zufallsspiel zieht weiter nur 0 … 99 999 (`Date.now() % 100000`, `src/ui/app.ts:331`). Die
   Obergrenze 8 Stellen deckt die Tageszahl der Tagesinsel (`JJJJMMTT`, Spec Inselproben §5.3) und `seed + i` aus `generateMap` ab
   (`src/sim/mapgen.ts:186`, bis +49): Eine angezeigte Nummer wie 100 012 lässt sich so wieder eintippen. Gilt nur, wenn AK-K3 grün ist; sonst fällt die
   Grenze auf 99 999 zurück (dann zeigt das Menü weiter die genutzte Nummer, die Eingabe weist grössere ab).
3. **Ungültig:** Beim Klick auf «Neue Insel» (und Enter im Feld) erscheint unter dem Feld ein Hinweis «Kartennummer: ganze Zahl von 0 bis
   99999999, oder leer für Zufall.» (`role="alert"`), die Bestätigung öffnet nicht, die laufende Partie bleibt unberührt, der Fokus geht ins Feld.
4. **Gültig und nicht leer:** die Bestätigung nennt die Nummer («Neue Insel (Karte 4711) beginnen? …», sonst der heutige Text aus
   `newIslandPrompt`). Nach Bestätigung startet `createWorld(nummer, { crisisLevel, unlockAll })` statt `createWorld(Date.now() % 100000, …)`.
5. **Genutzte Nummer:** `generateMap` probiert `seed + i`; weicht `world.seed` von der Eingabe ab, zeigt eine Info-Meldung «Karte 4711 nicht
   bebaubar, genutzt: 4712». Das Menü zeigt weiter `Karte ${world.seed}`. Die genutzte Nummer ergibt beim Eintippen wieder dieselbe Karte
   (Fixpunkt, AK-K2); der Teilen-Weg ist also «Zahl aus dem Menü abschreiben».
6. **Gleiche Karte, anderes Spiel:** Karte, Wild, Fremdinseln und Krisenzeitpunkte hängen am Seed (`rollCrisis`, ADR-010); Krisenstufe und
   Freischaltung ändern nur diese Optionen. Gleiche Nummer plus gleiche Optionen ergibt eine bitgleiche Startwelt.
7. **Technik (Vorgabe, kein Plan):** reine Funktion `parseSeedInput(raw): { ok: true; seed: number | null } | { ok: false; reason: string }` in
   `src/ui/seedInput.ts` (DOM-frei); `MenuActions.newIsland` bekommt einen dritten Parameter `seed?: number`; `StartOptions.seed?: number`
   (Prüfung mit `!== undefined`, nie mit `||`, weil Karte 0 gültig ist); `launch` nutzt `opts?.seed ?? Date.now() % 100000`; geladene Welten
   ignorieren `opts.seed`. Die Sim bleibt unberührt (`createWorld` nimmt die Nummer schon an, `src/sim/world.ts:102`).

## Wechselwirkung mit Inselproben (Spec `design/modus-inselproben` @ a7e5fff2)

- **Dateien:** `menu.ts` und `app.ts` werden von beiden berührt (Inselproben: Knopf «Inselproben …» unter «Neue Insel», §4.1). I-197 wird nach dem
  Inselproben-UI-Task umgesetzt; es ändert nur den Neue-Insel-Block und die Signatur von `newIsland`, nicht die Proben-Knöpfe.
- **§13 der Inselproben-Spec** («keine Änderung an Neue Insel») verbietet I-197 nicht: Sie begrenzt den Schnitt jener Spec; I-197 ist ein eigenes Paket.
- **Proben bleiben fest:** Probe und Tagesinsel setzen ihre Nummer aus der Def bzw. dem Datum; das Feld wirkt nur auf «Neue Insel». Eine freie Nummer
  ergibt nie eine Probe: kein `challenge`-Zustand, keine Bestzeit. Läuft eine Probe, ist «Neue Insel» (auch mit Nummer) wie bisher ein Abbruch ohne
  Eintrag (Inselproben §4.2).
- **Tageszahl:** Tippt der Spieler 20261025 ein, spielt er die Karte der Tagesinsel als freie Partie (Freischaltung und Krisen frei wählbar). Das ist
  gewollt (Üben); der Tageswert bleibt davon unberührt, da er nur über den Proben-Weg entsteht.
- **Startkarte** (`startCard.ts`, «Neue Insel» mit Krisenwahl) bekommt kein Feld: nicht dazugehört, Zufall bleibt der Einstieg.
- **Anzeige-Konflikt:** Die Proben-Spec ändert die Zeile `Karte N` nicht; I-197 auch nicht. Beim Merge keine inhaltliche Überschneidung ausser den Zeilen
  um `menu.ts:125` und `app.ts:522`.

## Nicht dazugehört

Kein Speichern der letzten Nummer, keine Liste «zuletzt gespielt», kein Teilen-Knopf oder Zwischenablage, kein Feld auf der Startkarte, keine
Zufallsnummer-Würfelknopf, keine Karteneinstellungen (Grösse, Inselzahl), keine Änderung am Kartengenerator, an Spielwerten, am Save (`SAVE_VERSION`
bleibt), am Balancing-Test oder an der Baseline.

## Randfälle

- Karte 0 (falsy-Falle), 99 999, 100 000 und 99 999 999 laden ohne Fehler.
- Feld mit Leerzeichen/Zeilenumbruch/Einfügen von «4711\n»: wird getrimmt, `4711`.
- Ungültige Eingabe bei laufender Partie: kein Autosave-Verlust, keine Bestätigung.
- Doppelklick auf «Neue Insel» mit Nummer startet nur einmal (bestehende Bestätigung).
- Eingabe, die `generateMap` nach 50 Versuchen nicht erfüllt: Der Start wirft nie (bestehender sticky Toast aus `startGame`, laufender Stand
  geht dabei aber verloren wie heute bei jedem Fehlstart). Praktisch unerreichbar, nur beobachten.
- Spielstand-Laden wird nie von `opts.seed` beeinflusst.

## Abnahmekriterien

Vitest (DOM-frei, `tests/ui/seedInput.test.ts`, `tests/sim/mapgenSeed.test.ts`):

- **AK-K1** `parseSeedInput`: `''` und `'  '` → `{ok:true, seed:null}`; `'0'` → 0; `'00042'` → 42; `' 4711\n'` → 4711; `'99999999'` → 99999999.
  Ungültig (mit nicht leerem `reason`): `'100000000'`, `'-1'`, `'1.5'`, `'12a'`, `'1e3'`, `'１２'`, `'9'.repeat(30)`.
- **AK-K2** Fixpunkt: für die Nummern 0, 1, 21, 345, 4711, 99999 gilt `generateMap(generateMap(n).seedUsed).seedUsed === generateMap(n).seedUsed`
  und gleiches `terrain`. Dazu `createWorld(n)` zweimal: `serialize` gleich (gleiche Nummer, gleiche Optionen, gleiche Welt); mit
  `crisisLevel` `off` gegen `normal`: gleiches Terrain, andere Krisenfolge.
- **AK-K3** Grenzfälle gültig: `generateMap` für 100000, 20261025 und 99999999 liefert eine Karte (wirft nicht, `seedUsed >= n`). Schlägt das fehl,
  gilt Regel 2 zurück auf 99 999 und AK-K1 ändert die Obergrenze entsprechend.
- **AK-K4** `newIslandPrompt(hasAutosave, seed?)`: ohne Nummer die beiden heutigen Texte unverändert (bestehende Tests grün); mit Nummer enthält
  der Text `Karte 4711`.
- **AK-K5** `StartOptions.seed = 0` wird nicht als «fehlt» behandelt (Funktion `pickSeed(opts, now)` oder gleichwertig: `0` bleibt `0`, `undefined`
  → `now % 100000`).
- **AK-K6** Keine Save-Folge: `SAVE_VERSION`, Replay-Hash/Baseline und `tests/sim/balance.test.ts` unverändert grün.

Browser-Check (`qa-playtester`, Headless):

- **AK-K7** Menü → Neue Insel: Feld sichtbar, leer; «4711» eintippen, bestätigen: Menü zeigt `Karte 4711` (oder die Info-Meldung mit der genutzten
  Nummer). Zweimal wiederholt: gleiche Karte (gleiche Kontor-Lage, Screenshot-Vergleich der Seekarte).
- **AK-K8** Leeres Feld: Karte ist zufällig und weicht von der letzten ab (zwei Starts, zwei Nummern).
- **AK-K9** «12a» oder «1.5»: Hinweis unter dem Feld, keine Bestätigung, Partie läuft weiter (Tick läuft, Gebäude stehen noch), Fokus im Feld.
- **AK-K10** Enter im Feld wirkt wie der Knopf; Seite neu laden: Feld wieder leer.
- **AK-K11** Mit Inselproben (erst nach deren Merge): Probe läuft, «Neue Insel» mit Nummer bricht die Probe ab, kein Proben-Eintrag, keine Bestzeit;
  Tageszahl 20261025 als freie Nummer startet eine normale Partie ohne `challenge`.

## Zuschnitt

Ein Häppchen (S, ≈ 40 Tools): `src/ui/seedInput.ts` (neu), `src/ui/menu.ts`, `src/ui/app.ts`, README-Spielanleitung (ein Satz zur Kartennummer),
Tests oben. Reihenfolge: nach dem Inselproben-UI-Task (gleiche Dateien). Prozess: Stufe leicht, ein Umsetzer auf sonnet; Gate Spec durch L0.

## Selbstprüfung (Gate Brainstorming)

1. Säule Insel besiedeln; leidet nichts, wenn es misslingt (Feld optional).
2. Echte Wahl: Zufall oder bekannte Karte; keine dominante Option, da beides erhalten bleibt.
3. Rückkopplung: Wiederholbarkeit; Gefahr «Lieblingskarte immer» ist spielerische Freiheit, kein Bonus (kein Wert hängt an der Nummer).
4. Randfälle oben (Karte 0, Obergrenze, Fixpunkt, Probe-Abbruch).
5. Einfachere Variante: Nur Anzeige (heute) oder nur Würfelknopf; beide geben keinen Teilen-Weg. Urteil: OK.
