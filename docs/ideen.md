# Ideen-Pool

Zweck: Sammelstelle für Funktionsideen des Studios (Discovery-Strang, E-027). Der Pool ist ein
Produktdokument neben `docs/beobachtungen.md`. Eigentümerin ist `lead-design`; `design-idea-scout` trägt
neue Ideen ein. Regeln des Ablaufs: Handbuch `docs/studio/STUDIO.md`.
Der Pool führt nur Ideen mit Status `neu`, `bewertet` und `eingeplant` sowie die jüngste Rangliste. Geparkte, live gegangene, verworfene und zusammengefasste Ideen und ältere Ranglisten liegen im [Archiv](ideen-archiv.md) (R599); beim Statuswechsel dorthin verschieben, bei Reaktivierung zurück.

## Ablauf einer Ideen-Runde (`IDEEN-nn`)

1. `design-idea-scout` trägt höchstens 5 neue Ideen mit Status `neu` ein (Quellen: neue Beobachtungen,
   Browser-Lauf-Berichte, offene Nutzer-Punkte, Genre-Mechaniken; nur Mechaniken, ADR-006).
2. `lead-design` bewertet sie nach dem Raster und pitcht höchstens 2 im Bericht an L0, je mit Empfehlung.
3. L0 entscheidet mit einem Ruling je Runde: einplanen, parken oder verwerfen. Ändert eine Idee Kernsäule,
   Genre oder Titel, geht sie in die Warteschlange (Verfassung §5.3).
4. Eine eingeplante S-Idee wird ein Häppchen im nächsten Release (ein Platz je Release ist reserviert);
   M- und L-Ideen werden Bausteine für das nächste Meilenstein-Brainstorming.

Budget je Runde: höchstens 2 Starts und 80 Tool-Aufrufe.

**Breite Runde (R445):** Bei freier Kapazität setzt `lead-design` bis zu 3 `design-idea-scout` parallel ein, je
mit einem Schwerpunkt (Spieltiefe und Wirtschaft · neue Funktionen und Inhalte · Komfort und Bedienung) und je
höchstens 5 Ideen, zusammen ≤ 160 Tool-Aufrufe. Die Scouts liefern im Bericht, `lead-design` trägt ein, bewertet
**alle** Ideen nach dem Raster, ergänzt je Idee eine Zeile `Nutzen/Aufwand:` und liefert L0 eine vollständige
Rangliste statt höchstens 2 Pitches; L0 priorisiert im Runden-Ruling.

## Status-Fluss

neu → bewertet → gepitcht → eingeplant | geparkt | verworfen → live

Doppelte gehen als `zusammengefasst` (einzeilig, Verweis auf die aufnehmende Idee) in eine andere Idee auf.

## Obergrenze

Höchstens 40 offene Ideen (alles ausser verworfen und live; R445). Verworfene und live gegangene Ideen
bleiben einzeilig stehen. Doppelte fasst `lead-design` zusammen.

## Format je Idee

```markdown
### I-001 · neu · <Kurzname>

- Bereich: Inhalt | Grafik | Ton | Bedienung | Technik · Säule: <Säule> · Quelle: <Pfad, Playtest, Nutzer, Genre-Mechanik>
- Spielerwirkung: „Der Spieler …" (ein Satz)
- Grösse: S | M | L · Risiko: <Save, Baseline, Perf, Lizenz oder keins>
- Raster: Spass x · Passung x · Aufwand x · Risiko x = Summe
- Nutzen/Aufwand: <erwarteter Spielernutzen> · <S/M/L> · <≈ Tools oder Pakete>
- Entscheid: <Ruling> → eingeplant <H-/M-ID> | geparkt bis <Anlass> | verworfen (<Grund>)
```

## Bewertungsraster

Je 1 bis 3 Punkte. Summe = 2 × Spielspass + Passung + Aufwand + Risiko, höchstens 15. Pitch ab 11.

| Kriterium                 | 3                                                                          | 2                            | 1                                                                          |
| ------------------------- | -------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| Spielspass (×2)           | neue echte Entscheidung oder sichtbares Erlebnis in der ersten Spielstunde | spürbar für Fortgeschrittene | Kosmetik ohne Entscheidung                                                 |
| Säulen-Passung            | stärkt eine Säule direkt                                                   | stärkt eine Säule indirekt   | keine; **schwächt eine Säule = K.O.** (Warteschlange, falls Säulenwechsel) |
| Aufwand (`richtwerte.md`) | S: ≤ 1 Häppchen                                                            | M: 2–4 Pakete                | L: Meilenstein                                                             |
| Risiko                    | berührt weder Save, Baseline, Perf noch Lizenz                             | berührt eines davon          | berührt mehrere                                                            |

## Rangliste IDEEN-15 (Vorschlag lead-design, Ruling L0 offen)

Breite Runde (R445, R823) mit 3 Scouts: A Leben auf der Insel (I-156–I-160), B Mittel- und Spätspiel-Ziele (I-161–I-164, I-165 nicht vergeben),
C Bedienung und Übersicht ab 1280 px (I-166–I-170). 14 Vorschläge, keine ändert Kernsäule, Genre oder Titel (§5.3; I-164 geprüft: Wahlziel ohne
neue Säule). Alle «fehlt heute»-Annahmen haben eine Code-Fundstelle (Lehre aus Beobachtung 2026-10-22 WIRTSCHAFT-BS-1); lead-design hat sie
stichprobenartig nachgeprüft (`ship.ts`, `sound.ts`, `hud.ts`, `buildMenu.ts`, `sprites.ts:922`). Bewertung lead-design: Spätspiel-Ideen Spass 3 → 2
(erst nach dem Denkmal, Massstab I-132/R737); reine Klang- und Zierideen Spass 2 → 1 (Kosmetik ohne Entscheidung). Datei-Konflikte gegen laufende
Branches geprüft (`git diff --name-only main...<branch>`): `hud.ts`, `buildMenu.ts`, `ship.ts`, `sound.ts`, `trial.ts` frei; `sprites.ts` belegt von
ORT-A und Stadtplanung. Sortiert nach Summe, bei Gleichstand nach Nutzen je Aufwand. Pool-Pflege R599 in derselben Runde: 14 Ideen und die
Ranglisten IDEEN-13 und IDEEN-14 ins Archiv (Stand R776, R780, R797, R805, REL-27 bis REL-29). Pool danach 25 von 40 offen.

| Rang | ID    | Name                                     | Grösse | Summe | Save / Baseline | Nutzen/Aufwand                                     | Empfehlung                                                                  |
| ---- | ----- | ---------------------------------------- | ------ | ----- | --------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| 1    | I-170 | Wachstumsbremse im Einwohner-Chip        | S–M    | 12    | nein / nein     | «warum steigt nichts auf?» in einem Blick, ≈ 60 T. | **Häppchen 1** (UI-HAEPPCHEN-I mit I-168, I-167); nach Stadtplanung-Merge   |
| 2    | I-168 | Kassen-Reichweite «Kasse leer in ≈ 4:10» | S      | 12    | nein / nein     | Frühspiel-Pleite vorhersehbar, ≈ 30 Tools          | **Häppchen 1** (gleiche Datei `hud.ts`)                                     |
| 3    | I-167 | Bestand im Bau-Tooltip                   | S      | 12    | nein / nein     | Kettenverhältnis ohne Abzählen, ≈ 30 Tools         | Beipack Häppchen 1                                                          |
| 4    | I-157 | Kielwasser der Schiffe                   | S      | 11    | nein / nein     | Fahrt und Richtung lesbar, ≈ 40 Tools              | **Häppchen 2** «Leben auf See» mit I-156; `ship.ts` frei                    |
| 5    | I-159 | Kistenstapel am Kontor zeigt Füllstand   | S–M    | 11    | nein / Hashes   | Lager ohne Text lesbar, ≈ 60 Tools                 | nach ORT-A- und Stadtplanung-Merge (`sprites.ts`); Kennzahl neu fassen      |
| 6    | I-163 | Auflage «Ausfuhrmeister»                 | M      | 11    | ja / nein       | Ketten über Eigenbedarf werden Ziel, ≈ 3 Pakete    | Baustein: Kurzdesign «Auflagen-Kern» mit Rechnung (mit I-161, I-162)        |
| 7    | I-161 | Auflage «Eigenwuchs»                     | S–M    | 11    | ja / nein       | zweite Prüfung, nah an I-132, ≈ 2 Pakete           | im Auflagen-Kern als Alternative zu I-163; Zielgrösse Stufe ≥ 3             |
| 8    | I-169 | Randmarken für Brände ausser Bild        | M      | 11    | nein / nein     | Brand ausser Sicht nicht verpasst, ≈ 2 Pakete      | parken bis Playtest-Beleg (Log-Sprung und Alarm bestehen)                   |
| 9    | I-156 | Anlege-Klang am Kontor                   | S      | 10    | nein / nein     | Route hörbar, Ermüdungsgefahr, ≈ 20 Tools          | Beipack Häppchen 2                                                          |
| 10   | I-162 | Abbruchpuffer in der laufenden Auflage   | S      | 10    | nein / nein     | Scheitern vorhersehbar, ≈ 30 Tools                 | Beipack zum Auflagen-Kern (oder nächstes UI-Häppchen)                       |
| 11   | I-160 | Morgenläuten der Kapelle                 | S      | 10    | nein / nein     | Stimmung ohne Entscheidung, ≈ 15 Tools             | parken (Beipack-Kandidat für ein Ton-Paket)                                 |
| 12   | I-166 | Zoom mit `Bild↑`/`Bild↓`                 | S      | 10    | nein / nein     | Tastaturweg für bestehende Aktion, ≈ 15 Tools      | Beipack Häppchen 1, falls Platz                                             |
| 13   | I-164 | Fern-Wahlziel Leuchtfeuer oder Festhalle | M      | 10    | ja / nein       | Inselvorteil bekommt ein Ziel, ≈ 3 Pakete          | parken bis Erweiterung 1 geklärt (Ziel 4 «Seestadt», Inseldorf)             |
| 14   | I-158 | Wäscheleine ab Haus-Stufe 2              | S      | 9     | nein / Hashes   | Stufe lesbar, aber Häuser unterscheiden sich schon | verwerfen (Stufen sind im Sprite schon unterscheidbar; `sprites.ts` belegt) |

Leitbefund Spätspiel (Scout B, bestätigt): Der Auflagen-Kern ist heute auf eine Auflage festgelegt (`src/ui/trial.ts:17` `ID = 'selfSupply'`,
`src/sim/defs/trials.ts:7`, Karte und Chronik lesen nur `passed[0]`); jede weitere Auflage zahlt zuerst diese Verallgemeinerung. Darum keine
Auflage als Häppchen, sondern ein Kurzdesign «Auflagen-Kern» (Stufe voll, Save), das I-163 und I-161 mit `design-economy-designer` gegeneinander
rechnet und höchstens eine baut. Beide erfüllen R805 (4) laut Überschlag (Bedarf 4,5- bzw. 8,3-mal `STORAGE_CAP`, Zukauf gesperrt).

## Ideen

### I-061 · eingeplant (R529, Stadtplanung) · Marktplatz-Reichweite über Wege

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik (Versorgung folgt dem Wegenetz); IDEEN-07 Scout C
- Spielerwirkung: „Der Spieler legt Strassen so, dass der Marktplatz seine Häuser wirklich erreicht; ein Haus hinter einem Wasserarm oder in einer Sackgasse bleibt unversorgt."
- Grösse: M · Risiko: Baseline (Controller-Layout, Neumessung), Perf (Wegesuche); Save eher nein (abgeleitet)
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 1 = 12
- Randfälle: Wegelänge statt Luftlinie verkleinert die Reichweite, Wert in `defs` anheben; Vorschau zeigt die Wegreichweite; Altstände mit Randhäusern brauchen eine Übergangsregel. Entartung: Wegschlangen als Pflicht.
- Doppelung: I-045 (Versorgungsebene, geparkt) zeigt Radien; I-061 ändert die Regel, I-045 wird dann Teil davon.
- Bewertung lead-design (IDEEN-07): bestätigt (12). Stärkster Spielwert der Runde (Planung in der ersten Stunde), aber Regeländerung mit Baseline-Neumessung: Baustein für das nächste Meilenstein-Brainstorming, nicht Häppchen.
- Nutzen/Aufwand: hoher Nutzen · M · ≈ 3 Pakete
- Entscheid: R529: Baustein fürs nächste Meilenstein-Brainstorming (Stadtplanung, mit I-045 und I-051).

### I-106 · bewertet · «Neu»-Karte schlank und schliessbar

- Bereich: Bedienung · Säule: Bedienung · Quelle: IDEEN-10 Scout B; Playtest `.studio/qa/rel-18/report.md` (Ärgernis 2: «Neu: …»-Karte bleibt über 25 s, verdeckt oben links) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler schliesst die «Neu: …»-Karte mit einem Klick oder sieht bei mehreren Freischaltungen nur «Neu: 3 Gebäude»."
- Grösse: S · Risiko: keins (UI-Zustand)
- Raster: Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Hinweis: vor Einplanung gegen UI-AUFRAEUM-3 (I-099, Kartenstapel) und UI-HAEPPCHEN-D prüfen; falls dort gelöst, verwerfen.
- Nutzen/Aufwand: Sicht auf die Karte in der ersten Stunde · S · ≈ 50 Tools
- Entscheid: offen (IDEEN-10)

### I-119 · Gate Spec (R715) · Bewohner reagieren auf Krisen

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; `src/render/life.ts` und `src/render/errands.ts` (keine Krisenreaktion) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht beim Brand Bewohner als Eimerkette zum Feuer laufen und bei Sturmwarnung heimgehen."
- Mechanik: Brand: bis 6 Spaziergänger im Umkreis 6 laufen hin, Feuerwache in Reichweite schickt 2 Löscher; Sturmwarnung: Figuren gehen ins nächste Haus; Boom: Figuren winken. Nutzt den Weggraph aus `errands.ts`, gedeckelt über die Figurenobergrenze.
- Grösse: M · Risiko: Perf (zusätzliche Pfade, gedeckelt); kein Save
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: Brand unter 5 s: keine Läufer; Pause: Stillstand; «Bewegung reduzieren»: keine Läufer.
- Doppelung: I-034 Seuche, I-058 Pause bei Krise (geparkt) sind andere Fragen; mit I-120 ein gemeinsames Paket «Bewohner reagieren» möglich.
- Nutzen/Aufwand: Krisen fühlbarer, ohne Entscheidung · M · ≈ 2 Pakete
- Entscheid: R715 Gate Spec OK (Variante 3, gestaffelt, `design/i119-i121`); Umsetzung nach ORT-A. Hinweis IDEEN-15: LEBEN-STRASSE (R820) ändert dieselben Dateien `life.ts`/`errands.ts` und das Figurentempo; Spec vor dem Plan gegen LEBEN-STRASSE nachziehen

### I-121 · Gate Spec (R715) · Wartende vor der Tür

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; Nutzerfeedback 2026-10-02 G9 (weniger Text, mehr Bilder) und S4 · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht nah gezoomt 1–2 Bewohner mit hängendem Kopf vor einem Haus mit Mangel stehen."
- Mechanik: Ab Zoom 1,0 stehen bei Mangel 1–2 Figuren vor der Tür (Farbe nach wichtigstem Mangel), nach 60 s eine dritte; gesamt höchstens 12, zählen zur Figurenobergrenze; voll versorgte Häuser schicken öfter Spaziergänger los.
- Grösse: M · Risiko: Perf (gedeckelt); kein Save
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: 3 s Verzögerung gegen Flackern bei hoher Geschwindigkeit; «Bewegung reduzieren»: höchstens 4.
- Doppelung: Bedarfssymbole am Haus (live, ab Zoom 0,75) zeigen denselben Mangel; mit I-119 ein gemeinsames Paket möglich.
- Nutzen/Aufwand: doppelt die Bedarfssymbole in Nahansicht · M · ≈ 2 Pakete
- Entscheid: R715 Gate Spec OK (Variante 3, gestaffelt, `design/i119-i121`); Umsetzung nach ORT-A. Hinweis IDEEN-15: LEBEN-STRASSE (R820) ändert dieselben Dateien `life.ts`/`errands.ts` und das Figurentempo; Spec vor dem Plan gegen LEBEN-STRASSE nachziehen

### I-128 · eingeplant (R737) · Lärm und Rauch (Gewerbe stört das Wohnviertel)

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-12 Scout B; Genre-Mechanik Wohnen und Gewerbe trennen; `docs/spielwerte.md` «Bevölkerung» (Aufstieg hängt nur an Bedürfnissen und Diensten, 30 s Wartezeit) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler schiebt Steinbruch und Brennerei an den Rand, weil Häuser daneben langsamer aufsteigen, und wägt kurze Wege gegen ruhige Viertel ab."
- Mechanik: Brennerei, Steinbruch, Glashütte und Werkzeugmacher gelten als «laut»; ein Wohnhaus im Radius 3 um einen arbeitenden lauten Betrieb wartet 45 statt 30 s auf den Aufstieg (einmal, nicht je Betrieb); Stapelregel bleibt (nie unter 15 s). Bauvorschau zeigt den Lärmumriss, das Haus-Panel «Lärm: +15 s». Werte in `src/sim/defs/`.
- Grösse: M (Sim-Regel, Vorschau, Panel, Baseline-Neumessung) · Risiko: Baseline (Controller-Layout), Balancing-Test
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: stillgelegter oder stehender Betrieb lärmt nicht; bei Mangel verdoppelt sich die Wartezeit wie heute (ob 45 → 90 s, legt das Kurzdesign fest); Entartung: +15 s ist so klein, dass der Spieler es nicht merkt, oder so gross, dass Gewerbe nur noch am Rand steht; der Versorgungsradius 8 erzwingt Nähe und hält die Wahl offen.
- Doppelung: I-051 (Park als Wohnwert, geparkt) ist die positive Seite derselben Frage; I-061 (Wegreichweite) und I-045 (Versorgungsebene) gehören zum selben Stadtplanungs-Baustein.
- Bewertung lead-design: Aufwand 3 → 2 und Risiko 2 → 1 (Baseline und Balancing). Echte räumliche Entscheidung in der ersten Stunde (Steinbruch, Werkzeugmacher ab U2/U3), aber Regeländerung: Baustein fürs Stadtplanungs-Brainstorming mit I-061, I-051, I-045, nicht Häppchen.
- Nutzen/Aufwand: Stadtplan bekommt ein Gegengewicht zur Nähe · M · ≈ 2 Pakete
- Entscheid: eingeplant (R737): Baustein Stadtplanungs-Brainstorming

### I-137 · eingeplant (R776) · Abstiegs-Dämpfer am Haus

- Bereich: Grafik · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-13 Scout A; `docs/superpowers/specs/2026-10-16-i120-i118-wohlstand-klang-funkeln.md` AK-B1 (Abstieg liefert nichts); `.studio/handoffs/2026-10-16-lead-qa-gate-I-120-I-118.md` · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht ein Haus beim Stufenverlust kurz grau verblassen und hört einen dumpfen Ton, und merkt den Mangel in dem Moment, in dem er Einwohner kostet."
- Mechanik: Gegenstück zu `detectRises` im Render-Zustand (`detectFalls`), 1,5 s grauer Schleier ohne Funken, teilt den Deckel 6 der Aufstiegseffekte; Ton über `soundEvents` mit Mindestabstand je Haus. Prozedural, keine Assets.
- Grösse: S · Risiko: keins (kein Save, keine Sim-Änderung; Perf gedeckelt)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12 · Raster (lead-design): Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: Massenabstieg bei einer Krise → höchstens 6 Effekte, ein Ton je 2 s gesamt; Abriss und Neubau zeigen nichts; nach dem Laden kein Effekt (erster Frame merkt nur den Stand); «Bewegung reduzieren»: nur Ton. Entartung: Dauerrauschen bei schwankender Versorgung (Haus pendelt) → Mindestabstand je Haus 30 s.
- Doppelung: I-118 (live, nur Aufstieg); I-009 (live) meldet Mangel als Signal vor dem Abstieg, nicht den Abstieg; I-119 (Gate Spec) betrifft Figuren, nicht das Haus.
- Bewertung lead-design: Passung 3 → 2 (Rückmeldung, keine neue Entscheidung), Risiko 2 → 3 (gedeckelt wie I-118, das als keins galt). Symmetrie zum Funkeln macht Verlust so lesbar wie Gewinn; Render-Dateien sind während ORT-A T09/T10 belegt, darum nach I-136.
- Nutzen/Aufwand: Mangel im Moment des Schadens sichtbar · S · ≈ 50 Tools
- Entscheid: R776 eingeplant: Häppchen nach ORT-A (Render-Dateien); noch nicht gestartet

### I-138 · eingeplant (R776, Beipack) · Rats-Karte nennt die Wirkung vorab

- Bereich: Bedienung · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-13 Scout A; `src/ui/council.ts` `councilCards` (nur statischer Text aus `COUNCIL`); `docs/beobachtungen.md` «10-16 · I-112: Umschalt+R ohne Marke öffnet leere Rats-Karte» · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest unter «Marktrecht» «wirkt auf 3 Marktplätze, 41 Häuser» und unter «Zunftrecht» «12 Häuser warten auf Stein», bevor er die einmalige Wahl trifft."
- Mechanik: Je Beschluss eine Vorschau-Zeile aus Weltzustand und `COUNCIL` (reine Lesefunktion in `src/ui/`); dazu Umschalt+R ohne Marke ignoriert (Beobachtung). Die vom Scout vorgeschlagenen temporären Reichweitenkreise entfallen (Versorgungsebene gehört zur Stadtplanung).
- Grösse: S · Risiko: keins (reine Anzeige)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 2 · Risiko 3 = 12 (Zeile allein 13) · Raster (lead-design, nur Zeile): Spass 1 · Passung 3 · Aufwand 3 · Risiko 3 = 11
- Randfälle: kein Marktplatz → «wirkt noch nicht», Beschluss bleibt wählbar; kein Aufstiegskandidat → nur der Preis; Rat schon entschieden → Zeile entfällt. Entartung: die Zahlen machen eine Seite offensichtlich besser und entlarven eine Scheinwahl — dann ist das ein Balancing-Befund zu I-112 (Anhang-Rechnung), kein Fehler der Anzeige.
- Doppelung: I-112 (live, Karte ohne Vorschau); I-045 und I-051 (Stadtplanung) für die Kreise.
- Bewertung lead-design: Spass 2 → 1: Der Kartentext nennt die Wirkung schon, die Zeile macht sie konkret, erzeugt aber keine neue Entscheidung; die Wahl kommt nur dreimal je Partie. Als Beipack mit dem Umschalt+R-Befund günstig.
- Nutzen/Aufwand: Weichenstellung informiert statt geraten · S · ≈ 40 Tools als Beipack
- Entscheid: R776 eingeplant: Beipack zum nächsten UI-Häppchen (nur Textzeile, mit Umschalt+R-Befund)

### I-139 · bewertet · Ratsbeschluss und Kulanz in der Inselchronik

- Bereich: Inhalt · Säule: Insel besiedeln (Rückblick) · Quelle: IDEEN-13 Scout A; `src/ui/monumentView.ts`, `src/ui/inspect.ts` (Chronik führt Denkmalziele), `src/ui/council.ts` (Beschluss nur im Rats-Fenster sichtbar); I-132 legt Abzeichen in die Chronik · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest in der Inselchronik «Minute 7: Marktrecht gewählt» und «Minute 22: Kulanz verbraucht» und erkennt den Weg seiner Insel."
- Mechanik: Zwei weitere Chronik-Übergänge in der vorhandenen UI-Funktion (Rat von `null` auf A/B, Kulanz von bereit auf verbraucht); vor dem Paket prüfen, ob die Chronik abgeleitet oder gespeichert ist.
- Grösse: S · Risiko: keins, falls abgeleitet; sonst Save
- Raster (Scout): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Randfälle: Laden erzeugt keine Doppeleinträge; «Neue Insel» setzt zurück; Minute nur, wenn der Zeitpunkt ableitbar ist, sonst ohne Zeitangabe. Entartung: Chronik wird Ereignisflut → höchstens drei Eintragsarten.
- Doppelung: I-125 (verworfen, Log im Spielstand), I-100 (Trennung Log/Chronik), I-132 (Abzeichen).
- Bewertung lead-design: bestätigt (10). Kosmetik ohne Entscheidung; sinnvoll erst, wenn I-132 die Chronik als Ort für Abzeichen etabliert hat.
- Nutzen/Aufwand: Geschichte der Insel · S · ≈ 30 Tools
- Entscheid: R776 geparkt bis I-132 live; Anlass erreicht (REL-27), wieder offen. Neubewertung IDEEN-15: unverändert 10, Beipack-Kandidat zur Chronik

### I-146 · eingeplant (R806, UI-HAEPPCHEN-H) · Wirkkreis bei ausgewählter Kapelle, Schule und Feuerwache

- Bereich: Grafik/Bedienung · Säule: Bevölkerung versorgen · Quelle: `docs/beobachtungen.md` (2026-10-16, I-112: kein Kreis bei stehender Kapelle); README «Radiusanzeige beim Platzieren»
- Spielerwirkung: „Der Spieler klickt eine stehende Kapelle, Schule oder Feuerwache an und sieht sofort, welche Häuser sie noch versorgt." Mechanik: vorhandener Kreis-Plan (`overlayPlan`, `src/render/overlays.ts`) auch für die Auswahl; nur Darstellung.
- Grösse: S · Risiko: Perf (Cache in `overlays.ts`); `src/render/` zurzeit ORT-A
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13
- Nutzen/Aufwand: Versorgungslücken ohne Neubau lesbar · S · ≈ 40 Tools
- Entscheid: R797/R806 eingeplant: UI-HAEPPCHEN-H P2 (Gate Kurzdesign R807), Umsetzung nach ORT-A-Merge

### I-147 · eingeplant (R806, UI-HAEPPCHEN-H) · Zweiter Autosave-Platz «Davor»

- Bereich: Technik/Bedienung · Säule: Bedienung (Spielfluss) · Quelle: `src/ui/storage.ts` (nur `manual`, `auto`); README «Speichern, Laden»
- Spielerwirkung: „Der Spieler lädt nach einem Fehlklick einen Stand von vor etwa vier Minuten, statt dass der Autosave den Fehler überschreibt." Autosave wechselt zwischen zwei Plätzen; Ladeliste zeigt beide mit Spielzeit. Kein Undo in der Sim. Doppelung: I-071 (Undo, verworfen) ist anders.
- Grösse: S · Risiko: Browser-Speicher (zweiter Schlüssel, Quote); Save-Format unberührt
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11 (lead-design: Risiko 3 → 2)
- Nutzen/Aufwand: Entscheide mutig statt vorsichtig · S · ≈ 50 Tools
- Entscheid: R797/R806 eingeplant: UI-HAEPPCHEN-H P1 (Gate Kurzdesign R807)

### I-153 · eingeplant (R805, SEERECHT) · Rat: «Seerecht» als dritte Karte auf Stufe 4

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik Handelsprivileg; README «Rat» (kein Beschluss betrifft Fernhandel)
- Spielerwirkung: „Der Spieler wählt auf Stufe 4 zwischen Glasrecht, Hofrecht und Seerecht (Schiffe 25 % schneller)." Rats-Karte muss drei Karten zeigen. Doppelung: I-112 live, I-138, I-131 anders.
- Grösse: S · Risiko: Balance (`balance.test.ts`), Save nein
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11
- Nutzen/Aufwand: Fernhandel bekommt eine Weiche · S · ≈ 50 Tools
- Entscheid: R805 eingeplant: wird gebaut (8 Ticks je Seekachel); Spec SEERECHT, Plan R823

### I-156 · bewertet · Anlege-Klang am Kontor

- Bereich: Ton · Säule: Wirtschaft, Steuern und Handel (Handel hörbar) · Quelle: IDEEN-15 Scout A; `src/audio/sound.ts:38-51` (`SoundEvent` ohne Schiffsereignis, von lead-design per `rg` bestätigt), Glocke nur beim Sturm-Alarm (`src/audio/manifest.ts:123-132`); Genre-Mechanik Hafengeräusch · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler hört, dass ein Schiff angelegt oder abgelegt hat, auch wenn die Kamera woanders steht, und weiss ohne Text, dass seine Route läuft."
- Mechanik: Ereignis `shipDock` aus der vorhandenen Glockensynthese (`BELL`, `src/audio/buildSounds.ts:67`): Anlegen ein Schlag, Ablegen zwei kurze, Spitzenpegel ≤ 0,08; Auslöser ist der beobachtete Zustandswechsel des Schiffs in UI/Render (Muster `detectRises`, `src/render/aufstieg.ts:22`), Sim unberührt; Entprellung global 4 s, je Schiff 20 s. Kein Asset.
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Randfälle: mehrere Schiffe → höchstens ein Klang je 4 s; Pause und Stumm wie die übrigen Ereignisse. Entartung: mit 4 Schiffen auf kurzen Routen Dauerläuten → Pegel klein, Entprellung, im Kurzdesign gegen I-120 und Arbeitsgeräusche abmischen.
- Doppelung: I-005 Arbeitsgeräusche, I-009 hörbarer Mangel, I-120 Wohlstandsklang (live) betreffen Betriebe und Stadt, nicht Schiffe.
- Bewertung lead-design: Spass 2 → 1, Passung 3 → 2: Rückmeldung ohne Entscheidung; das Schiff-Panel und die Routen-Bilanz sagen schon, ob die Route läuft. Günstig als Beipack zu I-157 (gleiches Thema «Leben auf See»).
- Nutzen/Aufwand: Handel hörbar, Ermüdungsgefahr · S · ≈ 20 Tools
- Entscheid: offen (IDEEN-15)

### I-157 · bewertet · Kielwasser der Schiffe

- Bereich: Grafik · Säule: Wirtschaft, Steuern und Handel (Seefahrt sichtbar) · Quelle: IDEEN-15 Scout A; `src/render/ship.ts` (nur Rumpf, Neigung und Fernsicht-Saum `SAUM`, keine Spur; per `rg wake|spur|trail` bestätigt); Genre-Mechanik · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht am Hafen und auf offener See auf einen Blick, welches Schiff fährt und wohin, weil es eine helle Spur hinter sich herzieht."
- Mechanik: zwei Schaumlinien in V-Form hinter dem Heck, 3 Kacheln lang, Deckkraft 0,35 → 0, Palettenton `foam`; zustandslos aus Position, Richtung und Zeit; angelegt keine Spur (1 s Auslaufen); Sturm Breite ×1,5; Spurpunkte über Land entfallen. Deckel `wakes` [8, 8] in `src/render/limits.ts`; «Bewegung reduzieren»: feste Spur 1,5 Kacheln ohne Pulsieren. Prozedural.
- Grösse: S · Risiko: Perf (gering, ein Strichzug je Schiff)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12 · Raster (lead-design): Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11
- Randfälle: Culling wie die übrigen Schiffe; Seekarte ohne Spur (eigene Darstellung, nicht im Scope). Entartung: keine (reine Darstellung).
- Doppelung: `wildlife.ts` (Wale, Delfine), ORT-A (Terrain) und LEBEN-STRASSE (Figuren) berühren `ship.ts` nicht (Branch-Diff geprüft).
- Bewertung lead-design: Passung 3 → 2 (Lebendigkeit, indirekt). Sichtbares Leben in der ersten Stunde, sobald das erste Schiff fährt; kleinste Render-Idee ohne Datei-Konflikt.
- Nutzen/Aufwand: Seefahrt wirkt lebendig, Richtung lesbar · S · ≈ 40 Tools
- Entscheid: offen (IDEEN-15)

### I-158 · bewertet · Wäscheleine ab Haus-Stufe 2

- Bereich: Grafik · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-15 Scout A; `src/render/sprites.ts:724`, `:820`, `:2044` (Stufe über `b.house?.tier`, keine Wäsche) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler erkennt an bunter Wäsche am Haus beim Vorbeischwenken, welche Viertel aufgestiegen sind."
- Mechanik: im Haus-Sprite ab Stufe 2 eine Leine mit 2 Tüchern, ab Stufe 3 mit 4 in zwei Farben; optional ±1 px Wehen im Luft-Durchgang (`drawAir`), bei Regen nur hängend, «Bewegung reduzieren» still. Prozedural.
- Grösse: S · Risiko: Baseline der Sprite-Hashes (Neuaufnahme per Ruling); `sprites.ts` belegt von ORT-A und Stadtplanung
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 2 = 9
- Randfälle: Silhouette darf nicht wachsen (`spriteCache.ts:20`); Abstieg nimmt die Wäsche mit der Stufe. Entartung: keine.
- Doppelung: I-118 Funkeln (Moment des Aufstiegs), I-137 Abstieg; die Stufen sind im Sprite heute schon unterscheidbar.
- Bewertung lead-design: Spass 2 → 1, Passung 3 → 2: Die Haus-Sprites unterscheiden die Stufen bereits; die Wäsche ist Zier ohne neue Information und kostet eine Sprite-Hash-Neuaufnahme in einer belegten Datei.
- Nutzen/Aufwand: gering · S · ≈ 30 Tools plus Hash-Neuaufnahme
- Entscheid: offen (IDEEN-15), Empfehlung verwerfen

### I-159 · bewertet · Kistenstapel am Kontor zeigt den Füllstand

- Bereich: Grafik · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-15 Scout A; `src/render/sprites.ts:922-932` (vier Kisten fest, von lead-design gelesen); Bestand `stock` je Insel (`src/sim/types.ts:403`), Grenze `STORAGE_CAP` 100 je Gut (`src/sim/defs/goods.ts`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht am Kontor, ob sein Lager leer, gut gefüllt oder an der Grenze ist, bevor die Meldung «Lager voll» kommt."
- Mechanik: Füllstufe 0–4 (leerer Hof, 1, 2, 4 Kisten wie heute, 6 Kisten plus Fässer), Schwellen 5/30/60/90 %, Rückstufung mit 10 % Hysterese, Cache-Schlüssel mit Füllstufe (≤ 5 Varianten je Kontor). **Kennzahl (lead-design):** nicht «Gesamtbestand / Kapazität» wie vom Scout vorgeschlagen (die Grenze gilt je Gut, ein Mittel über alle Güter wäre fast immer leer), sondern der Füllgrad des vollsten Guts der Insel (`max(stock) / STORAGE_CAP`), weil «Lager voll» je Gut eintritt. Render liest nur.
- Grösse: S–M · Risiko: Sprite-Hashes, Perf (Cache); `sprites.ts` belegt von ORT-A und Stadtplanung
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: Fremdkontor (`kontor2`) zeigt den Bestand seiner Insel; mehrere Kontore je Insel zeigen dieselbe Stufe; Sperrbestand (I-049) zählt mit. Entartung: Dauerstufe 4 im Spätspiel (ein Gut steht immer an der Grenze) → dann sagt der Stapel nichts mehr; im Kurzdesign gegen Messlauf prüfen.
- Doppelung: I-085 «Lager voll» (Alarm), I-109 Reichweite (Zahl); I-142 ist verworfen (R776), nicht im Pool (Scout-Angabe korrigiert).
- Bewertung lead-design: bestätigt (11), Kennzahl neu gefasst. Wirtschaft ohne Text sichtbar; erst nach ORT-A- und Stadtplanung-Merge.
- Nutzen/Aufwand: Lagerlage auf einen Blick · S–M · ≈ 60 Tools
- Entscheid: offen (IDEEN-15)

### I-160 · bewertet · Morgenläuten der Kapelle

- Bereich: Ton · Säule: Bevölkerung (Stimmung) · Quelle: IDEEN-15 Scout A; `src/audio/ambience.ts:83-104` (Tageszeit nur als Pegel der Schichten), `phaseAt` (`src/render/daynight.ts:25`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler hört zum Tagesbeginn einen Glockenschlag und erlebt die Kapelle als Teil des Viertels."
- Mechanik: beim Wechsel Nacht → Morgen ein Schlag (`BELL`, Pegel ≤ 0,05), nur wenn eine angebundene Kapelle steht; ein Schlag je Wechsel unabhängig von der Zahl der Kapellen; kein Nachholen nach dem Laden; Krisen-Klänge haben Vorrang.
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Randfälle: Stumm, Pause; bei 4× Tempo häufiger, aber höchstens ein Schlag je Wechsel. Entartung: keine.
- Doppelung: I-007 Fest in der Kapelle, I-120 Wohlstandsklang (live).
- Bewertung lead-design: Spass 2 → 1 (Stimmung ohne Entscheidung). Parken als Beipack für ein späteres Ton-Paket.
- Nutzen/Aufwand: Stimmung · S · ≈ 15 Tools
- Entscheid: offen (IDEEN-15), Empfehlung parken

### I-161 · bewertet · Auflage «Eigenwuchs» (zweite Meisterprüfung)

- Bereich: Inhalt · Säule: Produktionsketten, Bevölkerung · Quelle: IDEEN-15 Scout B; `src/sim/defs/trials.ts:7` (nur `selfSupply`), `src/sim/trial.ts:20,44,57` (`e0`, `trialBuyBlock`, `trialPopulation`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler startet «Eigenwuchs» und muss seine Stadt in 15 Minuten ohne Zukauf um 15 % vergrössern, also die Ketten über den heutigen Bedarf hinaus ausbauen."
- Mechanik: Auflage `growth` mit den Regeln von `selfSupply` (Zukauf gesperrt, Abbruch unter 70 % von `e0`); bestanden bei ≥ 115 % (`TRIAL_GROWTH_PCT` in `defs/trials.ts`). **Zielgrösse (lead-design):** nicht alle Einwohner, sondern Einwohner der Stufen ≥ 3, sonst reichen Siedlerhäuser mit Fisch (Entartung). Lohn ehrenhalber (Chronik).
- Rechnung R805 (4) (Scout, ungemessen): bei 80 Kaufleuten Glas und Gewürz je ≈ 55/min nach +15 % → ≈ 825 in 15 min = 8,3 × `STORAGE_CAP`; Zukauf gesperrt.
- Dominanz: ehrenhalber, keine Spielwert-Wirkung; Wahl liegt in Zeitpunkt und Ausbau davor.
- Grösse: S–M (Sim S; Verallgemeinerung Auflagen-Kern in `src/ui/trial.ts`: `ID`, `passed[0]`) · Risiko: Save (`isTrialId`, `save.ts:946`), Baseline bitgleich (Controller startet keine Auflage)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: kein Bauland im Radius → Start nennt Grund; Abriss zählt gegen das Ziel; Auflagen schliessen sich aus. Entartung: Häuser erst kurz vor Ende bauen → mit Stufen-≥-3-Zielgrösse braucht das 30 s Aufstiegszeit je Stufe und die Ketten.
- Doppelung: I-132 (live, Rahmen), I-151 (verworfen R805, Bedarf unter der Lagergrenze).
- Bewertung lead-design: bestätigt (11), Zielgrösse verschärft. Nah an «Eigenversorgung» (gleiche Ketten, +15 %); als Alternative zu I-163 im Kurzdesign «Auflagen-Kern» rechnen, nicht beide bauen.
- Nutzen/Aufwand: zweite Prüfung, wenig neu gegen I-132 · S–M · ≈ 2 Pakete mit dem Kern
- Entscheid: offen (IDEEN-15)

### I-162 · bewertet · Abbruchpuffer in der laufenden Auflage

- Bereich: Bedienung · Säule: Bevölkerung versorgen · Quelle: IDEEN-15 Scout B; `src/ui/trial.ts:120` (Status «Einwohner n von e0»), `src/sim/trial.ts:71` (Abbruch bei `pop · 100 < e0 · 70`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest «Abbruch unter 280, Puffer 132» und greift früh ein, statt unvermittelt zu scheitern."
- Mechanik: Status nennt Grenze `ceil(e0 · 0,7)` und Puffer; Ziel-Chip warm unter 15 % Puffer. Reine Lesefunktion in `src/ui/`.
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Randfälle: ohne aktive Auflage nichts. Entartung: Dauerwarnung bei pendelnden Einwohnern → Schwelle 15 %, Farbe nur am Chip.
- Doppelung: I-132 (live, «n von e0»), Fehlmengen-Vorschau vor dem Start (`selfSupplyPreview`, `src/ui/trial.ts:54`).
- Bewertung lead-design: bestätigt (10). Beipack zum Auflagen-Kern oder zum nächsten UI-Häppchen.
- Nutzen/Aufwand: Scheitern vorhersehbar · S · ≈ 30 Tools
- Entscheid: offen (IDEEN-15)

### I-163 · bewertet · Auflage «Ausfuhrmeister»

- Bereich: Inhalt · Säule: Produktionsketten, Wirtschaft, Steuern und Handel · Quelle: IDEEN-15 Scout B; Leitbefund R722/R776 (Engpass ausser Geld); `src/sim/trade.ts:144` (`sell`, kein Verkaufszähler) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler wählt ein Gut und verkauft in 15 Minuten ohne Zukauf 360–450 Stück davon an die Kontore, also baut er Überschuss über den Eigenbedarf hinaus."
- Mechanik: Auflage `export` mit Zielgut (Glas 360, Rum 450, Stoff 450, Stein 300), Zukauf gesperrt, Abbruch unter 70 % wie heute; Felder `good`, `sold` in `world.trial`; `sell()` zählt nur bei aktiver Auflage und passendem Gut; ein Abzeichen je Gut, ehrenhalber. Werte in `defs/trials.ts`.
- Rechnung R805 (4) (Scout, ungemessen): Rum 450 → 30/min Überschuss ≈ 2,5 Brennereien plus 2,5 Plantagen zusätzlich; 4,5 × `STORAGE_CAP`; die Sättigung (`SELL_DROP`, Erholung 1 Punkt/s) trägt ≈ 60/min; Kauf-dann-Verkauf durch die Sperre ausgeschlossen.
- Dominanz: Zielmengen gleichen den Zusatzaufwand an (≈ 5 Betriebe je Gut; Stein an Gebirge gebunden); Erlös ≈ 8100 ist bei ≈ 2000 Überschuss je 100 Ticks kein Anreiz, die Wahl läuft über den Aufwand. Nachrechnen durch `design-economy-designer`.
- Grösse: M (Sim, Auflagen-Kern, Karte, Save, Messlauf) · Risiko: Save (Felder in `trial`), Baseline bitgleich
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: Fremdkontore zählen mit, Stammkunde und Aufträge nicht; Gutwechsel nur vor dem Start; Abbruch setzt `sold` auf 0. Entartung: Lager stauen und am Ende verkaufen → höchstens 100 Stück (25 % des Ziels) und zum Sättigungspreis.
- Doppelung: I-132, I-161 (gleicher Kern), I-046 (verworfen, Dauer-Automatik), I-104 (geparkt, Ausschreibung).
- Bewertung lead-design: Spass 3 → 2 (nach dem Denkmal, Massstab I-132). Unterscheidet sich klarer von «Eigenversorgung» als I-161: Ketten, die die Stadt nicht braucht, werden zum Ziel, und die Gutwahl gibt Wiederspielwert. Baustein für ein Kurzdesign «Auflagen-Kern» Stufe voll.
- Nutzen/Aufwand: Spätspiel-Ziel mit Kettenbau · M · ≈ 3 Pakete
- Entscheid: offen (IDEEN-15)

### I-164 · bewertet · Fern-Wahlziel «Leuchtfeuer» oder «Festhalle»

- Bereich: Inhalt · Säule: Produktionsketten, Insel besiedeln · Quelle: IDEEN-15 Scout B; `src/sim/types.ts:351` (`monument` einmalig), `src/sim/monument.ts:77,113` (nur Heimat); `docs/spielwerte.md` «Seefahrt und Gewürz» (Inselvorteil ×2) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler baut nach dem Denkmal auf einer Fremdinsel ein zweites Wahlziel nur aus deren Inselvorrat, und der Inselvorteil ×2 lohnt sich erstmals für ein Ziel."
- Mechanik: zweites Wahlziel nach `monumentDone`, 3×3, 2 Abschnitte, Ablauf wie das Denkmal, Zielgüter-Zukauf gesperrt; Leuchtfeuer (Felsbucht: Stein 300, Glas 150, Werkzeug 40) oder Festhalle (Weidenau: Stoff 110, Rum 110, Werkzeug 40); Lohn ehrenhalber.
- Rechnung R805 (4) (Scout, ungemessen): Leuchtfeuer ≈ 450 Stein-Äquivalent = 4,5 × `STORAGE_CAP`; beide Varianten ≈ 28 Betriebsminuten; Insel-Produktion schlägt Schiffszufuhr (3–4 gegen 7 Betriebe).
- Grösse: M (Sim, Panel, 2 Sprites, Save, Messlauf) · Risiko: Save, Sprites (`sprites.ts` belegt), Überlappung Erweiterung 1
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 1 = 12 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Kontor fehlt oder zerstört → Bau hält; Abriss wie beim Denkmal. Entartung: beide nacheinander bauen (gewollt, ohne Lohn).
- Doppelung: Erweiterung 1 (Ziel 4 «Seestadt», Inseldorf), I-149 (geparkt, Liegeplätze); kein §5.3-Fall (Wahlziel ohne neue Säule).
- Bewertung lead-design: Spass 3 → 2 (nach dem Denkmal). Guter Gedanke für die Fremdinseln, aber dieselbe Stelle wie Erweiterung 1; parken wie I-149.
- Nutzen/Aufwand: Fremdinseln bekommen ein Ziel · M · ≈ 3 Pakete
- Entscheid: offen (IDEEN-15), Empfehlung parken bis Erweiterung 1 geklärt

### I-166 · bewertet · Zoom mit `Bild↑`/`Bild↓`

- Bereich: Bedienung · Säule: Bedienung · Quelle: IDEEN-15 Scout C; `src/ui/hotkeys.ts:166` (nur «Mausrad: Zoomen»), kein `PageUp`/`PageDown` in `src/` (von lead-design per `rg` bestätigt) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler zoomt mit `Bild↑`/`Bild↓` stufenweise, ohne die Hand von der Tastatur zu nehmen."
- Mechanik: eine Stufe aus `ZOOM_STEPS` um die Bildmitte (`zoomAt`, `src/render/camera.ts:124`), `preventDefault`; stumm bei offener Karte und in Eingabefeldern; Eintrag in Kürzelliste und README.
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10 · Raster (lead-design): bestätigt 10
- Randfälle: Laptops ohne Mausrad profitieren. Entartung: keine.
- Doppelung: I-107 (geparkt, Tempo `+`/`−`) belegt andere Tasten.
- Bewertung lead-design: bestätigt (10). Beipack, falls im UI-Häppchen Platz bleibt.
- Nutzen/Aufwand: zweiter Weg zu bestehender Aktion · S · ≈ 15 Tools
- Entscheid: offen (IDEEN-15)

### I-167 · bewertet · Bestand im Bau-Tooltip

- Bereich: Bedienung · Säule: Produktionsketten · Quelle: IDEEN-15 Scout C; `src/ui/buildMenu.ts` (Tooltip ohne Bestandszeile, nur «Nur einmal je Insel» bei `maxCount`, `:182`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht beim Überfahren eines Bauleisten-Eintrags «Steht: 4 (1 still)» und entscheidet, ob eine weitere Fischerhütte oder Weberei sinnvoll ist, statt die Karte abzuzählen."
- Mechanik: Tooltip-Zeile aus der Welt (Insel der Kamera, Summe aller Inseln in Klammern), entfällt für Kontor und Denkmal; reine UI-Ableitung neben «Bilanz danach».
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12 · Raster (lead-design): bestätigt 12
- Randfälle: Stillgelegt (I-035) zählt als «still»; mehrere Inseln getrennt. Entartung: keine.
- Doppelung: I-043 Gut-Chip (Erzeuger je Gut), I-062 Betriebsrangliste (nach Unterhalt) — beide verlangen einen Wechsel des Blicks, der Tooltip steht im Moment der Bauentscheidung.
- Bewertung lead-design: bestätigt (12). Beipack zu Häppchen 1 (eigene Datei `buildMenu.ts`, von keinem laufenden Branch berührt).
- Nutzen/Aufwand: Kettenverhältnis im Bau-Moment · S · ≈ 30 Tools
- Entscheid: offen (IDEEN-15)

### I-168 · bewertet · Kassen-Reichweite «Kasse leer in ≈ 4:10»

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-15 Scout C; `src/ui/hud.ts:147` (`moneyView` nur `Geld n`), keine Restdauer in `src/` (per `rg kasse|reicht|bankrott` bestätigt; nur Hinweis «Deine Kasse schrumpft», `src/ui/guide.ts:123`); Muster I-109 · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht bei negativer Bilanz, wie lange die Kasse noch reicht, und entscheidet zwischen Stilllegen, Abreissen, Steuer und Warenverkauf, bevor es schiefgeht."
- Mechanik: bei negativer Netto-Bilanz und positiver Kasse Tooltip «Kasse leer in ≈ m:ss» (Kasse / Minus je Minute, Spielzeit bei 1×, gerundet auf 10 s); unter 60 s Rot-Zustand wie heute; Bilanz aus derselben Rechnung wie die Kopfzeile (I-108).
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12 · Raster (lead-design): bestätigt 12
- Randfälle: positive Bilanz → Zeile entfällt; Einmalzahlungen lassen die Zahl springen → «≈», Rundung, Mittel über das Bilanzintervall. Entartung: keine.
- Doppelung: I-067 Verlaufskurve (geparkt, Verlauf statt Zahl), I-108 (live, Einnahmen/Unterhalt getrennt).
- Bewertung lead-design: bestätigt (12). Wirkt im Frühspiel (U1–U3), wo die Kasse wirklich kippen kann; im Spätspiel bleibt die Zeile meist leer (Überschuss, R722) — das ist richtig so.
- Nutzen/Aufwand: Frühspiel-Pleite vorhersehbar · S · ≈ 30 Tools
- Entscheid: offen (IDEEN-15)

### I-169 · bewertet · Randmarken für Brände ausser Bild

- Bereich: Bedienung, Grafik · Säule: Insel besiedeln (Krisen) · Quelle: IDEEN-15 Scout C; Brand-Sprung nur über das Log (`src/ui/crisisLog.ts:64`, `logTarget.ts`), keine Randmarke in `src/ui` · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht am Bildrand einen Pfeil zu jedem Brand ausser Sicht, klickt und springt hin."
- Mechanik: DOM-Overlay in `src/ui/` aus der Kamera-Projektion, höchstens 4 Marken, nahe Brände zusammengefasst, Klick → `centerOn` (`src/render/camera.ts:139`); ruht bei offener Karte, «Bewegung reduzieren» ohne Pulsieren; entfällt bei Krisenstufe «aus».
- Grösse: M · Risiko: keins (Perf bei vielen Bränden gedeckelt)
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 2 · Risiko 3 = 11 · Raster (lead-design): bestätigt 11
- Randfälle: Brand auf anderer Insel → Marke Richtung Insel. Entartung: Pfeilsalat → Deckel 4.
- Doppelung: I-042 Problem-Sprung (live), Krisen-Log mit Sprung, Brand-Alarmklang; I-124 (geparkt, Seekarte).
- Bewertung lead-design: bestätigt (11), aber ohne Playtest-Beleg, dass Brände verpasst werden; Log, Alarm und `.`-Sprung decken den Fall heute. Parken bis ein Playtest es meldet.
- Nutzen/Aufwand: Brand ausser Sicht nicht verpasst · M · ≈ 2 Pakete
- Entscheid: offen (IDEEN-15), Empfehlung parken

### I-170 · bewertet · Wachstumsbremse im Einwohner-Chip

- Bereich: Bedienung · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-15 Scout C; `tierTooltip` (`src/ui/hud.ts:711`) nennt nur Bedarf der Stufe; Mangel je Haus nur einzeln (`houseDiagnosis`/`diagnosisText`, `src/ui/inspect.ts:542`) und in der Problemliste (`src/ui/problems.ts:57` ff.) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest im Einwohner-Chip «Stufe 2: 14 Häuser · 5 warten auf Stoff · 3 ohne Kapelle · 6 bereit» und weiss, was er als Nächstes baut, statt Häuser einzeln anzuklicken."
- Mechanik: je Haus der wichtigste Mangel nach der Rangfolge der Bedarfssymbole (ausserhalb Versorgung vor Ware vor Dienst), gezählt je Stufe über die Insel der Kamera, höchstens 3 Ursachen plus «sonstige»; Klick springt wie `.` zum ersten betroffenen Haus. Nur Anzeige; Zählung gecacht (Memo wie Routen-Bilanz), nicht je Frame. Liest `houseDiagnosis`, damit die Stadtplanung-Gründe (Lärm, Park) ohne Zusatzarbeit erscheinen.
- Grösse: S–M · Risiko: Perf (Cache Pflicht, Beobachtung 2026-10-16 «focusLine/focusList je Chip ungemessen»)
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 2 · Risiko 3 = 11 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 3 = 12
- Randfälle: Stufe ohne Häuser → Zeile entfällt; alle bereit → «alle bereit»; Spitzenstufe ohne Aufstieg → Zeile entfällt. Entartung: keine (Lesefunktion).
- Doppelung: I-045 Versorgungsebene (in Stadtplanung, Karte statt Zählung), Problemliste (einzeln), Haus-Panel (ein Haus).
- Bewertung lead-design: Passung 2 → 3 (stärkt die Aufstiegs-Säule direkt), Aufwand bleibt 2 (Cache, Klicksprung). Beste Entscheidungshilfe der Runde für die erste Stunde. Nach dem Stadtplanung-Merge, damit `houseDiagnosis` die neuen Gründe schon liefert.
- Nutzen/Aufwand: «warum steigt nichts auf?» in einem Blick · S–M · ≈ 60 Tools
- Entscheid: offen (IDEEN-15)
