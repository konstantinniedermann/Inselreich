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

## Rangliste IDEEN-16 (Vorschlag lead-design, Ruling L0 offen)

Breite Runde (R445) mit 3 Scouts: A Spätspiel und Fern-Inseln nach Denkmal und Meisterprüfung (I-171–I-173, I-174/I-175 nicht vergeben), B Bedienkomfort aus
Beobachtungen und Playtest-Berichten (I-176, mit Nachrunde; I-177–I-180 nicht vergeben), C Genre-Mechaniken ohne Duplikate (I-181–I-184, I-185 nicht vergeben).
8 Vorschläge, dazu die offenen Kandidaten I-106 und I-139. Keine Idee ändert Kernsäule, Genre oder Titel (§5.3). Alle «fehlt heute»-Annahmen haben eine Code-Fundstelle;
lead-design hat sie nachgeprüft (`messages.ts:138`, `sea.ts:42-71`, `trade.ts:74-87`, `placement.ts:27-37`, `crises.ts:14`, `population.ts:230-234`, `goal.ts:184`, `app.ts:991`).
Bewertung lead-design: Geld ist nach Minute 15 kein Engpass (R722); jede Idee, deren Lohn Geld ist, verliert im Spätspiel ihre Entscheidung (I-171, I-173, I-181 Spass → 1).
I-173 widerspricht der abgenommenen Spec AUFLAGEN-KERN («kein Geld- oder Spielwert-Lohn», R839/R840). Sortiert nach Summe, bei Gleichstand nach Nutzen je Aufwand.
Pool-Pflege R599 in derselben Runde: I-158, I-160, I-161, I-164, I-166, I-169 und die Rangliste IDEEN-15 ins Archiv (Stand R827, R839). Pool danach 27 von 40 offen.

| Rang | ID    | Name                                    | Grösse | Summe | Save / Baseline | Nutzen/Aufwand                                     | Empfehlung                                                                   |
| ---- | ----- | --------------------------------------- | ------ | ----- | --------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1    | I-176 | Warn-Meldungen bleiben lange genug      | S      | 12    | nein / nein     | Krise bei 4× nicht verpasst, ≈ 25 Tools            | **Häppchen** UI-HAEPPCHEN-J (mit I-139, I-138); Kurzdesign Stufe leicht      |
| 2    | I-183 | Notration (befristete Halbration)       | M      | 11    | ja / nein       | Hunger wird Wahl statt Schrumpfen, ≈ 2 Pakete      | parken bis `BUY_RISE` > 0 oder Ration jederzeit beendbar (Rechnung IDEEN-16) |
| 3    | I-172 | Wandernde Vorliebe der Fern-Inseln      | S–M    | 10    | nein / ja       | Routen nie «gelöst», ≈ 2 Pakete                    | parken bis Balancing Erweiterung 1 (Sättigung I-115, Seerecht-Wert)          |
| 4    | I-182 | Erschliessung auf Fremdinseln           | M      | 10    | ja / ja         | Kolonie-Start als Planungsfrage, ≈ 3 Pakete        | parken bis Erweiterung 1 (Inseldorf) geklärt                                 |
| 5    | I-139 | Ratsbeschluss und Kulanz in der Chronik | S      | 10    | nein / nein     | Geschichte der Insel, ≈ 30 Tools                   | Beipack UI-HAEPPCHEN-J (Chronik-Format aus UI-BEIPACK-FERN)                  |
| 6    | I-106 | «Neu»-Karte schlank und schliessbar     | S      | 10    | nein / nein     | Kern gelöst (Meldung klebend, schliessbar)         | verwerfen (gelöst: `app.ts:991` klebend und schliessbar mit Hilfe-Knopf)     |
| 7    | I-171 | Feuerschale will Gewürz                 | M      | 9     | ja / nein       | Dauer-Grund für die Gewürzroute, Lohn Geld, ≈ 2 P. | parken als Baustein für O8/K5 (Dauer-Senke, Erweiterung 1)                   |
| 8    | I-173 | Meisterbrief zahlt                      | S      | 9     | nein / ja       | +10 % Fernauftrag nach Prüfung, Geld kein Engpass  | verwerfen (Spec AUFLAGEN-KERN: Lohn ehrenhalber, R839/R840)                  |
| 9    | I-184 | Lagerverderb für Nahrung                | S      | 9     | nein / ja       | Senke ohne Wahl, ≈ 40 Tools                        | verwerfen (wie I-013: Senke ohne Entscheidung)                               |
| 10   | I-181 | Flaute (Gegenstück zum Boom)            | M      | 8     | ja / ja         | Halten dominiert, Geld kein Engpass, ≈ 2 Pakete    | parken mit I-034 bis zu einer Krisen-Überarbeitung (Begründung wie I-076)    |

Leitbefund: Der Pool ist abgegrast. Drei Scouts brachten 8 von 15 möglichen Ideen, nur zwei erreichen 11; Scout C fand von rund 20 Genre-Kandidaten fast alle im Archiv,
Scout B fand keine Playtest-Berichte nach `rel-18` (Bedienreibung ist durch UI-HAEPPCHEN-D bis -I und UI-BEIPACK-FERN abgearbeitet). Das Spätspiel braucht einen Lohn, der
nicht Geld ist; diese Frage ist O8/K5 der Erweiterung 1 (Nutzer-Session, R519) und gehört nicht in eine Ideen-Runde. Wiedervorlage fällig: I-116 Inselgunst (geparkt «bis I-114
live», I-114 live mit REL-26); Empfehlung bleibt geparkt (Geldlohn, R722), mit I-172 zusammen ins Balancing der Erweiterung 1.

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
- Prüfung IDEEN-16: Kern gelöst; die Freischalt-Meldung ist klebend und schliessbar, mit Knopf «Hilfe» (`src/ui/app.ts:991`, `showMessage(…, true, true, …)`); offen bleibt nur die Sammelzeile «Neu: 3 Gebäude» (Kosmetik).
- Entscheid: offen (IDEEN-10), Empfehlung IDEEN-16 verwerfen (gelöst)

### I-119 · Gate Spec (R715) · Bewohner reagieren auf Krisen

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; `src/render/life.ts` und `src/render/errands.ts` (keine Krisenreaktion) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht beim Brand Bewohner als Eimerkette zum Feuer laufen und bei Sturmwarnung heimgehen."
- Mechanik: Brand: bis 6 Spaziergänger im Umkreis 6 laufen hin, Feuerwache in Reichweite schickt 2 Löscher; Sturmwarnung: Figuren gehen ins nächste Haus; Boom: Figuren winken. Nutzt den Weggraph aus `errands.ts`, gedeckelt über die Figurenobergrenze.
- Grösse: M · Risiko: Perf (zusätzliche Pfade, gedeckelt); kein Save
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: Brand unter 5 s: keine Läufer; Pause: Stillstand; «Bewegung reduzieren»: keine Läufer.
- Doppelung: I-034 Seuche, I-058 Pause bei Krise (geparkt) sind andere Fragen; mit I-120 ein gemeinsames Paket «Bewohner reagieren» möglich.
- Nutzen/Aufwand: Krisen fühlbarer, ohne Entscheidung · M · ≈ 2 Pakete
- Entscheid: R715 Gate Spec OK (Variante 3, gestaffelt, `design/i119-i121`); Umsetzung nach ORT-A. Hinweis IDEEN-15: LEBEN-STRASSE (R820) ändert dieselben Dateien `life.ts`/`errands.ts` und das Figurentempo; Spec-Nachtrag gegen LEBEN-STRASSE erledigt (R827, `design/i119-i121` @ `7c5638a0`, Bündel REL-30)

### I-121 · Gate Spec (R715) · Wartende vor der Tür

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; Nutzerfeedback 2026-10-02 G9 (weniger Text, mehr Bilder) und S4 · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht nah gezoomt 1–2 Bewohner mit hängendem Kopf vor einem Haus mit Mangel stehen."
- Mechanik: Ab Zoom 1,0 stehen bei Mangel 1–2 Figuren vor der Tür (Farbe nach wichtigstem Mangel), nach 60 s eine dritte; gesamt höchstens 12, zählen zur Figurenobergrenze; voll versorgte Häuser schicken öfter Spaziergänger los.
- Grösse: M · Risiko: Perf (gedeckelt); kein Save
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: 3 s Verzögerung gegen Flackern bei hoher Geschwindigkeit; «Bewegung reduzieren»: höchstens 4.
- Doppelung: Bedarfssymbole am Haus (live, ab Zoom 0,75) zeigen denselben Mangel; mit I-119 ein gemeinsames Paket möglich.
- Nutzen/Aufwand: doppelt die Bedarfssymbole in Nahansicht · M · ≈ 2 Pakete
- Entscheid: R715 Gate Spec OK (Variante 3, gestaffelt, `design/i119-i121`); Umsetzung nach ORT-A. Hinweis IDEEN-15: LEBEN-STRASSE (R820) ändert dieselben Dateien `life.ts`/`errands.ts` und das Figurentempo; Spec-Nachtrag gegen LEBEN-STRASSE erledigt (R827, `design/i119-i121` @ `7c5638a0`, Bündel REL-30)

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
- Entscheid: R776 geparkt bis I-132 live; Anlass erreicht (REL-27), wieder offen. Neubewertung IDEEN-15: unverändert 10, Beipack-Kandidat zur Chronik; IDEEN-16: Beipack UI-HAEPPCHEN-J mit I-176, Chronik-Format «bei Spielzeit 12:34» aus UI-BEIPACK-FERN übernehmen

### I-146 · eingeplant (R806, UI-HAEPPCHEN-H) · Wirkkreis bei ausgewählter Kapelle, Schule und Feuerwache

- Bereich: Grafik/Bedienung · Säule: Bevölkerung versorgen · Quelle: `docs/beobachtungen.md` (2026-10-16, I-112: kein Kreis bei stehender Kapelle); README «Radiusanzeige beim Platzieren»
- Spielerwirkung: „Der Spieler klickt eine stehende Kapelle, Schule oder Feuerwache an und sieht sofort, welche Häuser sie noch versorgt." Mechanik: vorhandener Kreis-Plan (`overlayPlan`, `src/render/overlays.ts`) auch für die Auswahl; nur Darstellung.
- Grösse: S · Risiko: Perf (Cache in `overlays.ts`); `src/render/` zurzeit ORT-A
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13
- Nutzen/Aufwand: Versorgungslücken ohne Neubau lesbar · S · ≈ 40 Tools
- Entscheid: R797/R806 eingeplant: UI-HAEPPCHEN-H P2 (Gate Kurzdesign R807), Umsetzung nach ORT-A-Merge

### I-147 · umgesetzt (UI-HAEPPCHEN-H P1) · Zweiter Autosave-Platz «Davor»

- Bereich: Technik/Bedienung · Säule: Bedienung (Spielfluss) · Quelle: `src/ui/storage.ts` (nur `manual`, `auto`); README «Speichern, Laden»
- Spielerwirkung: „Der Spieler lädt nach einem Fehlklick einen Stand von vor etwa vier Minuten, statt dass der Autosave den Fehler überschreibt." Autosave wechselt zwischen zwei Plätzen; Ladeliste zeigt beide mit Spielzeit. Kein Undo in der Sim. Doppelung: I-071 (Undo, verworfen) ist anders.
- Grösse: S · Risiko: Browser-Speicher (zweiter Schlüssel, Quote); Save-Format unberührt
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11 (lead-design: Risiko 3 → 2)
- Nutzen/Aufwand: Entscheide mutig statt vorsichtig · S · ≈ 50 Tools
- Entscheid: R797/R806 eingeplant: UI-HAEPPCHEN-H P1 (Gate Kurzdesign R807); P1 fertig fürs Bündel REL-30 (R852)

> > > > > > > 66c4df45

### I-153 · eingeplant (R805, SEERECHT) · Rat: «Seerecht» als dritte Karte auf Stufe 4

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik Handelsprivileg; README «Rat» (kein Beschluss betrifft Fernhandel)
- Spielerwirkung: „Der Spieler wählt auf Stufe 4 zwischen Glasrecht, Hofrecht und Seerecht (Schiffe 25 % schneller)." Rats-Karte muss drei Karten zeigen. Doppelung: I-112 live, I-138, I-131 anders.
- Grösse: S · Risiko: Balance (`balance.test.ts`), Save nein
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11
- Nutzen/Aufwand: Fernhandel bekommt eine Weiche · S · ≈ 50 Tools
- Entscheid: R805 eingeplant: wird gebaut (8 Ticks je Seekachel); Spec SEERECHT, Plan R823

### I-156 · eingeplant (R827, LEBEN-SEE) · Anlege-Klang am Kontor

- Bereich: Ton · Säule: Wirtschaft, Steuern und Handel (Handel hörbar) · Quelle: IDEEN-15 Scout A; `src/audio/sound.ts:38-51` (`SoundEvent` ohne Schiffsereignis, von lead-design per `rg` bestätigt), Glocke nur beim Sturm-Alarm (`src/audio/manifest.ts:123-132`); Genre-Mechanik Hafengeräusch · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler hört, dass ein Schiff angelegt oder abgelegt hat, auch wenn die Kamera woanders steht, und weiss ohne Text, dass seine Route läuft."
- Mechanik: Ereignis `shipDock` aus der vorhandenen Glockensynthese (`BELL`, `src/audio/buildSounds.ts:67`): Anlegen ein Schlag, Ablegen zwei kurze, Spitzenpegel ≤ 0,08; Auslöser ist der beobachtete Zustandswechsel des Schiffs in UI/Render (Muster `detectRises`, `src/render/aufstieg.ts:22`), Sim unberührt; Entprellung global 4 s, je Schiff 20 s. Kein Asset.
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Randfälle: mehrere Schiffe → höchstens ein Klang je 4 s; Pause und Stumm wie die übrigen Ereignisse. Entartung: mit 4 Schiffen auf kurzen Routen Dauerläuten → Pegel klein, Entprellung, im Kurzdesign gegen I-120 und Arbeitsgeräusche abmischen.
- Doppelung: I-005 Arbeitsgeräusche, I-009 hörbarer Mangel, I-120 Wohlstandsklang (live) betreffen Betriebe und Stadt, nicht Schiffe.
- Bewertung lead-design: Spass 2 → 1, Passung 3 → 2: Rückmeldung ohne Entscheidung; das Schiff-Panel und die Routen-Bilanz sagen schon, ob die Route läuft. Günstig als Beipack zu I-157 (gleiches Thema «Leben auf See»).
- Nutzen/Aufwand: Handel hörbar, Ermüdungsgefahr · S · ≈ 20 Tools
- Entscheid: R827 eingeplant: LEBEN-SEE Strang B (ein Klang beim Anlegen, R830); fertig fürs Bündel REL-30 (R846)

### I-157 · eingeplant (R827, LEBEN-SEE) · Kielwasser der Schiffe

- Bereich: Grafik · Säule: Wirtschaft, Steuern und Handel (Seefahrt sichtbar) · Quelle: IDEEN-15 Scout A; `src/render/ship.ts` (nur Rumpf, Neigung und Fernsicht-Saum `SAUM`, keine Spur; per `rg wake|spur|trail` bestätigt); Genre-Mechanik · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht am Hafen und auf offener See auf einen Blick, welches Schiff fährt und wohin, weil es eine helle Spur hinter sich herzieht."
- Mechanik: zwei Schaumlinien in V-Form hinter dem Heck, 3 Kacheln lang, Deckkraft 0,35 → 0, Palettenton `foam`; zustandslos aus Position, Richtung und Zeit; angelegt keine Spur (1 s Auslaufen); Sturm Breite ×1,5; Spurpunkte über Land entfallen. Deckel `wakes` [8, 8] in `src/render/limits.ts`; «Bewegung reduzieren»: feste Spur 1,5 Kacheln ohne Pulsieren. Prozedural.
- Grösse: S · Risiko: Perf (gering, ein Strichzug je Schiff)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12 · Raster (lead-design): Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11
- Randfälle: Culling wie die übrigen Schiffe; Seekarte ohne Spur (eigene Darstellung, nicht im Scope). Entartung: keine (reine Darstellung).
- Doppelung: `wildlife.ts` (Wale, Delfine), ORT-A (Terrain) und LEBEN-STRASSE (Figuren) berühren `ship.ts` nicht (Branch-Diff geprüft).
- Bewertung lead-design: Passung 3 → 2 (Lebendigkeit, indirekt). Sichtbares Leben in der ersten Stunde, sobald das erste Schiff fährt; kleinste Render-Idee ohne Datei-Konflikt.
- Nutzen/Aufwand: Seefahrt wirkt lebendig, Richtung lesbar · S · ≈ 40 Tools
- Entscheid: R827 eingeplant: LEBEN-SEE Strang A (Kurzdesign R830, Plan R832); T03 wartet auf ORT-A-Merge (R846)

### I-159 · eingeplant (R827) · Kistenstapel am Kontor zeigt den Füllstand

- Bereich: Grafik · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-15 Scout A; `src/render/sprites.ts:922-932` (vier Kisten fest, von lead-design gelesen); Bestand `stock` je Insel (`src/sim/types.ts:403`), Grenze `STORAGE_CAP` 100 je Gut (`src/sim/defs/goods.ts`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht am Kontor, ob sein Lager leer, gut gefüllt oder an der Grenze ist, bevor die Meldung «Lager voll» kommt."
- Mechanik: Füllstufe 0–4 (leerer Hof, 1, 2, 4 Kisten wie heute, 6 Kisten plus Fässer), Schwellen 5/30/60/90 %, Rückstufung mit 10 % Hysterese, Cache-Schlüssel mit Füllstufe (≤ 5 Varianten je Kontor). **Kennzahl (lead-design):** nicht «Gesamtbestand / Kapazität» wie vom Scout vorgeschlagen (die Grenze gilt je Gut, ein Mittel über alle Güter wäre fast immer leer), sondern der Füllgrad des vollsten Guts der Insel (`max(stock) / STORAGE_CAP`), weil «Lager voll» je Gut eintritt. Render liest nur.
- Grösse: S–M · Risiko: Sprite-Hashes, Perf (Cache); `sprites.ts` belegt von ORT-A und Stadtplanung
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: Fremdkontor (`kontor2`) zeigt den Bestand seiner Insel; mehrere Kontore je Insel zeigen dieselbe Stufe; Sperrbestand (I-049) zählt mit. Entartung: Dauerstufe 4 im Spätspiel (ein Gut steht immer an der Grenze) → dann sagt der Stapel nichts mehr; im Kurzdesign gegen Messlauf prüfen.
- Doppelung: I-085 «Lager voll» (Alarm), I-109 Reichweite (Zahl); I-142 ist verworfen (R776), nicht im Pool (Scout-Angabe korrigiert).
- Bewertung lead-design: bestätigt (11), Kennzahl neu gefasst. Wirtschaft ohne Text sichtbar; erst nach ORT-A- und Stadtplanung-Merge.
- Nutzen/Aufwand: Lagerlage auf einen Blick · S–M · ≈ 60 Tools
- Entscheid: R827 eingeplant: nach ORT-A- und Stadtplanung-Merge (`sprites.ts`); Kennzahl neu fassen

### I-162 · eingeplant (R827, AUFLAGEN-KERN) · Abbruchpuffer in der laufenden Auflage

- Bereich: Bedienung · Säule: Bevölkerung versorgen · Quelle: IDEEN-15 Scout B; `src/ui/trial.ts:120` (Status «Einwohner n von e0»), `src/sim/trial.ts:71` (Abbruch bei `pop · 100 < e0 · 70`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest «Abbruch unter 280, Puffer 132» und greift früh ein, statt unvermittelt zu scheitern."
- Mechanik: Status nennt Grenze `ceil(e0 · 0,7)` und Puffer; Ziel-Chip warm unter 15 % Puffer. Reine Lesefunktion in `src/ui/`.
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Randfälle: ohne aktive Auflage nichts. Entartung: Dauerwarnung bei pendelnden Einwohnern → Schwelle 15 %, Farbe nur am Chip.
- Doppelung: I-132 (live, «n von e0»), Fehlmengen-Vorschau vor dem Start (`selfSupplyPreview`, `src/ui/trial.ts:54`).
- Bewertung lead-design: bestätigt (10). Beipack zum Auflagen-Kern oder zum nächsten UI-Häppchen.
- Nutzen/Aufwand: Scheitern vorhersehbar · S · ≈ 30 Tools
- Entscheid: R827 eingeplant: Beipack AUFLAGEN-KERN (Spec abgenommen R840); Plan nach Stadtplanung- und Seerecht-Merge

### I-163 · eingeplant (R839, AUFLAGEN-KERN) · Auflage «Ausfuhrmeister»

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
- Entscheid: R827 Kurzdesign AUFLAGEN-KERN; R839 wird gebaut (Spec abgenommen R840, 26 AK `AK-AUF-*`, Save v21); Plan nach Stadtplanung- und Seerecht-Merge

### I-167 · eingeplant (R827, UI-HAEPPCHEN-I) · Bestand im Bau-Tooltip

- Bereich: Bedienung · Säule: Produktionsketten · Quelle: IDEEN-15 Scout C; `src/ui/buildMenu.ts` (Tooltip ohne Bestandszeile, nur «Nur einmal je Insel» bei `maxCount`, `:182`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht beim Überfahren eines Bauleisten-Eintrags «Steht: 4 (1 still)» und entscheidet, ob eine weitere Fischerhütte oder Weberei sinnvoll ist, statt die Karte abzuzählen."
- Mechanik: Tooltip-Zeile aus der Welt (Insel der Kamera, Summe aller Inseln in Klammern), entfällt für Kontor und Denkmal; reine UI-Ableitung neben «Bilanz danach».
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12 · Raster (lead-design): bestätigt 12
- Randfälle: Stillgelegt (I-035) zählt als «still»; mehrere Inseln getrennt. Entartung: keine.
- Doppelung: I-043 Gut-Chip (Erzeuger je Gut), I-062 Betriebsrangliste (nach Unterhalt) — beide verlangen einen Wechsel des Blicks, der Tooltip steht im Moment der Bauentscheidung.
- Bewertung lead-design: bestätigt (12). Beipack zu Häppchen 1 (eigene Datei `buildMenu.ts`, von keinem laufenden Branch berührt).
- Nutzen/Aufwand: Kettenverhältnis im Bau-Moment · S · ≈ 30 Tools
- Entscheid: R827/R831 eingeplant: UI-HAEPPCHEN-I P2; fertig fürs Bündel REL-30 (R849)

### I-168 · eingeplant (R827, UI-HAEPPCHEN-I) · Kassen-Reichweite «Kasse leer in ≈ 4:10»

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-15 Scout C; `src/ui/hud.ts:147` (`moneyView` nur `Geld n`), keine Restdauer in `src/` (per `rg kasse|reicht|bankrott` bestätigt; nur Hinweis «Deine Kasse schrumpft», `src/ui/guide.ts:123`); Muster I-109 · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht bei negativer Bilanz, wie lange die Kasse noch reicht, und entscheidet zwischen Stilllegen, Abreissen, Steuer und Warenverkauf, bevor es schiefgeht."
- Mechanik: bei negativer Netto-Bilanz und positiver Kasse Tooltip «Kasse leer in ≈ m:ss» (Kasse / Minus je Minute, Spielzeit bei 1×, gerundet auf 10 s); unter 60 s Rot-Zustand wie heute; Bilanz aus derselben Rechnung wie die Kopfzeile (I-108).
- Grösse: S · Risiko: keins
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12 · Raster (lead-design): bestätigt 12
- Randfälle: positive Bilanz → Zeile entfällt; Einmalzahlungen lassen die Zahl springen → «≈», Rundung, Mittel über das Bilanzintervall. Entartung: keine.
- Doppelung: I-067 Verlaufskurve (geparkt, Verlauf statt Zahl), I-108 (live, Einnahmen/Unterhalt getrennt).
- Bewertung lead-design: bestätigt (12). Wirkt im Frühspiel (U1–U3), wo die Kasse wirklich kippen kann; im Spätspiel bleibt die Zeile meist leer (Überschuss, R722) — das ist richtig so.
- Nutzen/Aufwand: Frühspiel-Pleite vorhersehbar · S · ≈ 30 Tools
- Entscheid: R827/R831 eingeplant: UI-HAEPPCHEN-I P1 (Geld-Chip gelb ab 3:00, rot ab 1:00); fertig fürs Bündel REL-30 (R849)

### I-170 · eingeplant (R827, UI-HAEPPCHEN-I) · Wachstumsbremse im Einwohner-Chip

- Bereich: Bedienung · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-15 Scout C; `tierTooltip` (`src/ui/hud.ts:711`) nennt nur Bedarf der Stufe; Mangel je Haus nur einzeln (`houseDiagnosis`/`diagnosisText`, `src/ui/inspect.ts:542`) und in der Problemliste (`src/ui/problems.ts:57` ff.) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest im Einwohner-Chip «Stufe 2: 14 Häuser · 5 warten auf Stoff · 3 ohne Kapelle · 6 bereit» und weiss, was er als Nächstes baut, statt Häuser einzeln anzuklicken."
- Mechanik: je Haus der wichtigste Mangel nach der Rangfolge der Bedarfssymbole (ausserhalb Versorgung vor Ware vor Dienst), gezählt je Stufe über die Insel der Kamera, höchstens 3 Ursachen plus «sonstige»; Klick springt wie `.` zum ersten betroffenen Haus. Nur Anzeige; Zählung gecacht (Memo wie Routen-Bilanz), nicht je Frame. Liest `houseDiagnosis`, damit die Stadtplanung-Gründe (Lärm, Park) ohne Zusatzarbeit erscheinen.
- Grösse: S–M · Risiko: Perf (Cache Pflicht, Beobachtung 2026-10-16 «focusLine/focusList je Chip ungemessen»)
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 2 · Risiko 3 = 11 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 3 = 12
- Randfälle: Stufe ohne Häuser → Zeile entfällt; alle bereit → «alle bereit»; Spitzenstufe ohne Aufstieg → Zeile entfällt. Entartung: keine (Lesefunktion).
- Doppelung: I-045 Versorgungsebene (in Stadtplanung, Karte statt Zählung), Problemliste (einzeln), Haus-Panel (ein Haus).
- Bewertung lead-design: Passung 2 → 3 (stärkt die Aufstiegs-Säule direkt), Aufwand bleibt 2 (Cache, Klicksprung). Beste Entscheidungshilfe der Runde für die erste Stunde. Nach dem Stadtplanung-Merge, damit `houseDiagnosis` die neuen Gründe schon liefert.
- Nutzen/Aufwand: «warum steigt nichts auf?» in einem Blick · S–M · ≈ 60 Tools
- Korrektur (R831): Lärm senkt nur die Belegung und ist kein Aufstiegsgrund; Lärm steht als eigene Zeile, Park als Hinweis (F3), eine Ursache je Haus (F2), kein Klick-Sprung (F1).
- Entscheid: R827/R831 eingeplant: UI-HAEPPCHEN-I P3, nach Stadtplanung-Merge

### I-171 · bewertet · Feuerschale will Gewürz (Dauer-Senke nach dem Denkmal)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-16 Scout A; Genre-Mechanik (Wahrzeichen mit Unterhalt) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler hält die Gewürzroute von der Fern-Insel auch nach dem Denkmal am Laufen, weil die Feuerschale sonst erlischt und der Markt langsamer erholt."
- Mechanik: Alle 600 Ticks zieht die Feuerschale 5 Gewürz aus dem Heimat-Lager (wie `pullOnce` im Denkmal). Reicht der Bestand, brennt sie, und `SELL_RECOVERY_INTERVAL` gilt halbiert (10 → 5 Ticks); sonst erlischt sie ohne Strafe und zündet beim nächsten Zug wieder. Zeile im Denkmal-Tooltip «Feuerschale brennt · Gewürz für 4:10».
- Grösse: M · Risiko: Save (Zustand «brennt bis»), Baseline nein, solange die Controller-Läufe das Denkmal nicht erreichen
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11 · Raster (lead-design): Spass 1 · Passung 3 · Aufwand 2 · Risiko 2 = 9
- Fehlt heute: `monumentDone` wirkt nur als Tor der Prüfung (`src/sim/trial.ts:33`, gesetzt in `src/sim/monument.ts:130`); keine Dauerwirkung, kein Dauerverbrauch. Markt-Erholung fest (`src/sim/trade.ts:173`, `src/sim/defs/timing.ts:18`).
- Randfälle: Gewürz-Mangel lässt die Schale ohne Abzug erlöschen; in der Auflage ist der Zukauf gesperrt (`trialBuyBlock`, `src/sim/trial.ts:46`). Entartung: Erholung ×2 ist ein Dauerbonus; Verbrauch muss deutlich unter dem Mehrerlös liegen.
- Doppelung: I-135 (verworfen R737, Feuerschale als reine Optik); Erweiterung 1 O8/K5 (Dauer-Senke nach Ziel 4, offen, L0 nach M13-E2-Playtest).
- Bewertung lead-design: Spass 2 → 1: Der Lohn ist schnellere Markterholung, also Geld, und Geld ist nach Minute 15 kein Engpass (R722); die Pflege der Route wird Pflicht ohne Wahl. Die richtige Frage (welcher Lohn nach dem Denkmal, wenn nicht Geld) ist O8/K5 der Erweiterung 1.
- Nutzen/Aufwand: Dauer-Grund für die Gewürzroute, Lohn schwach · M · ≈ 2 Pakete
- Entscheid: offen (IDEEN-16), Empfehlung parken als Baustein für O8/K5

### I-172 · bewertet · Wandernde Vorliebe der Fern-Inseln

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-16 Scout A; Genre-Mechanik (wechselnde Nachfrage je Hafen) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler stellt seine Routen alle paar Minuten um, weil die Möweninsel nicht mehr Stoff, sondern jetzt Glas mit +30 % zahlt, und die Seekarte nennt die Restzeit."
- Mechanik: Jede Fern-Insel hat in `ISLANDS` zwei Vorliebe-Güter; aktiv ist `prefers[floor(tick / 2400 + Art-Versatz) % 2]`, aus Tick und Art abgeleitet, ohne RNG und ohne Save-Feld. `prefersGood` und die Inselkarte lesen das aktive Gut; ein angenommener Fernauftrag behält sein Gut. Seekarte: «Vorliebe wechselt in 1:20».
- Grösse: S–M · Risiko: Baseline (Fern-Verkäufe und Fernangebot im Controller), Save nein
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Fehlt heute: Vorliebe statisch, ein Gut je Art (`src/sim/defs/sea.ts:49/60/71`); `prefersGood` und `sellPrice` ohne Zeitbezug (`src/sim/trade.ts:74`, `:87`); Fernauftrag nimmt das erste Gut (`src/sim/orders.ts:79-84`).
- Randfälle: Wechsel während der Fahrt (Erlös zum Verkaufszeitpunkt); «zu spät»-Marke (I-155), Fahrzeit (I-136) und Seerecht müssen den Wechsel lesen. Entartung: nur zum Hoch verkaufen; Lagergrenze `STORAGE_CAP` 100 deckelt.
- Doppelung: I-092 (live, statische Vorliebe, Grundlage), I-116 (geparkt, Inselgunst; Anlass «I-114 live» erreicht), I-115 (geparkt, Sättigung je Kontor, Erweiterung 1), I-130 (geparkt, Einkaufsseite).
- Bewertung lead-design: Spass 3 → 2 (Fern-Inseln erst ab Mittelspiel; Mehrerlös ist Geld, R722). Risiko 2 → 1: Die Vorliebe speist Fernangebot (I-114), Fernauftrag, «zu spät» und bald Seerecht; ändert die Baseline der Ziele 2/3. Gute Mechanik für das Balancing der Erweiterung 1 zusammen mit I-115 und I-116.
- Nutzen/Aufwand: Routen werden nie «gelöst», Fern-Inseln bleiben lebendig · S–M · ≈ 2 Pakete
- Entscheid: offen (IDEEN-16), Empfehlung parken bis Balancing Erweiterung 1

### I-173 · bewertet · Meisterbrief zahlt (Lohn der Meisterprüfung)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-16 Scout A; Genre-Mechanik (Meisterbrief gibt Handelsvorteil) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler besteht die Meisterprüfung und erhält danach für jeden Fernauftrag 10 % mehr."
- Mechanik: Bei `world.trial.passed.length > 0` steigt die Fernauftrag-Belohnung um `MASTER_FAR_PCT = 10` (Wert in `defs`); die Fernauftrag-Karte zeigt «Meisterbrief +10 %».
- Grösse: S · Risiko: Balancing-Test und Baseline nach der Prüfung, Save nein
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 2 = 9
- Fehlt heute: Prüfung schreibt nur `passed.push` (`src/sim/trial.ts:78`); Auszahlung `world.money += o.reward` (`src/sim/orders.ts:239`) liest `passed` nicht.
- Randfälle: Abbruch und Scheitern ändern nichts; Bonus rundet ab. Entartung: keine.
- Doppelung: keine im Pool; widerspricht der abgenommenen Spec AUFLAGEN-KERN («kein Geld- oder Spielwert-Lohn», Lohn ehrenhalber, R827, R839/R840).
- Bewertung lead-design: +10 % Geld nach bestandener Prüfung ändert keine Entscheidung (R722), und der Ehrenlohn ist eine gerade abgenommene Designregel. Verwerfen.
- Nutzen/Aufwand: gering · S · ≈ 30 Tools
- Entscheid: offen (IDEEN-16), Empfehlung verwerfen

### I-176 · bewertet · Warn-Meldungen bleiben lange genug stehen

- Bereich: Bedienung · Säule: Bedienung (Krisen lesbar) · Quelle: IDEEN-16 Scout B; Playtest `.studio/qa/rel-18/report.md` (Ärgernis 1: Sturmmeldung bei 4× nur kurz sichtbar, erst im Rückblick bemerkt) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht eine Krisen- oder Warnmeldung (Sturm, Brand) auch bei 4× noch lange genug, um zu reagieren, statt sie erst im Rückblick zu bemerken."
- Mechanik: Anzeigedauer je Meldungsart statt einheitlich 3 s: `warn` 7 s, `info` 3 s, `error` 3 s (Werte als Konstante in `src/ui/`, keine Sim-Werte); beim Zeiger über der Meldung hält der Ablauf an.
- Grösse: S · Risiko: keins (UI, kein Save, keine Baseline)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12 (lead-design bestätigt)
- Fehlt heute: `src/ui/messages.ts:138` `if (!sticky) setTimeout(() => toast.remove(), 3000)` gilt für jede Art gleich; Krisen-Toasts laufen ohne `sticky` (`src/ui/app.ts:1716`).
- Randfälle: `MAX_TOASTS = 3` (`messages.ts:10`) verdrängt weiter die älteste nicht klebende Meldung; viele Warnungen hintereinander dürfen Karten nicht zustellen; `DEDUPE_MS` bleibt; Pause hält den Ablauf nicht an (Echtzeit).
- Doppelung: I-058 (geparkt, «Pause bei Krise»; I-176 ist die billige Fassung ohne Tempo-Eingriff); I-169 (geparkt, Randmarken). Ereignis-Log mit Ungelesen-Zähler (REL-24) bleibt der Rückblick.
- Bewertung lead-design: Beleg alt (rel-18), seither Ereignis-Log und Krisen-Effekte; trotzdem der billigste Gewinn der Runde für Spieler auf 4×. Kein eigenes Paket, Häppchen mit I-139 und I-138.
- Nutzen/Aufwand: Krise bei hohem Tempo nicht verpasst · S · ≈ 25 Tools
- Entscheid: offen (IDEEN-16), Empfehlung Häppchen UI-HAEPPCHEN-J

### I-181 · bewertet · Flaute (Gegenstück zum Boom)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-16 Scout C; Genre-Mechanik (Absatzeinbruch als Marktkrise) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht die Warnung «Flaute: Rum −40 %» und entscheidet, ob er 5 Minuten lang Rum im Lager hält, die Brennerei stilllegt oder trotzdem verkauft."
- Grösse: M · Risiko: Save (`CrisisKind`), Baseline, `balance-crises.test.ts` (neue Gewichte)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10 · Raster (lead-design): Spass 1 · Passung 3 · Aufwand 2 · Risiko 1 = 8
- Fehlt heute: Krisenarten `'fire' | 'storm' | 'boom'` (`src/sim/types.ts:233`), Gewichte 50/25/25 (`src/sim/defs/crises.ts:14`), nur `BOOM_PCT` (`src/sim/trade.ts:86`).
- Randfälle: Preis nicht unter `SELL_FLOOR`; nur Güter aus `orderPool`; Krisenstufe «aus» heisst keine Flaute. Entartung: Lager vorher leeren. Dominanz: «Halten» schlägt «Verkaufen», weil das Lager bei 100 deckelt.
- Doppelung: I-076 (verworfen: vierte Krisenart verschiebt die Krisenverteilung, «wiederaufnehmbar mit einer Krisen-Überarbeitung (I-034)»), I-034 (geparkt, Seuche).
- Bewertung lead-design: Spass 2 → 1: Halten dominiert, und ein Preisabschlag trifft im Spätspiel niemanden (R722). Dieselbe Begründung wie bei I-076.
- Nutzen/Aufwand: Gegenstück zum Boom ohne echte Wahl · M · ≈ 2 Pakete
- Entscheid: offen (IDEEN-16), Empfehlung parken mit I-034 bis zu einer Krisen-Überarbeitung

### I-182 · bewertet · Erschliessung auf Fremdinseln (Bauradius)

- Bereich: Inhalt · Säule: Insel besiedeln · Quelle: IDEEN-16 Scout C; Genre-Mechanik (Bau nur im erschlossenen Umkreis des Kontors, wächst gegen Kosten) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler gründet ein Kontor auf einer Fremdinsel, darf zunächst nur im Umkreis von 8 Kacheln bauen und entscheidet, wohin er den Radius ausbaut: Küste für die Plantage oder Gebirge für den Steinbruch."
- Grösse: M · Risiko: Save (Radius je Insel), Baseline (Controller baut auf Fremdinseln)
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Fehlt heute: `checkGround` prüft nur Karte, Bauland und frei (`src/sim/placement.ts:27-37`); keine Gebietsgrenze in `src/sim/`.
- Randfälle: nur Fremdinseln, Heimat bleibt frei (Stadtplanung); Altbauten ausserhalb bleiben; Radius sinkt nie. Entartung: sofort voll ausbauen, wenn der Preis Geld ist (R722). Dominanz: immer zuerst Richtung Gewürzland.
- Doppelung: keine im Pool; nahe I-110 (geparkt, Startpaket), I-012 (geparkt, Vorkommen); Inseldorf der Erweiterung 1.
- Bewertung lead-design: Spass 3 → 2: Fremdinseln sind klein (24 bzw. 36 Kacheln, `sea.ts:45/56/67`), ein Radius 8 deckt viel ab, und Geld als Ausbaupreis ist kein Engpass; erst ein Preis in Waren oder Zeit macht die Wahl echt. Risiko 2 → 1 (Save und Baseline). Gehört in den Inseldorf-Strang der Erweiterung 1. Frage von Scout C (Bauradius nur auf Fremdinseln keine Planungsregel der Stadtplanung) beantwortet: richtig, die Heimat bleibt unberührt.
- Nutzen/Aufwand: Kolonie-Start als Planungsfrage · M · ≈ 3 Pakete
- Entscheid: offen (IDEEN-16), Empfehlung parken bis Erweiterung 1 (Inseldorf) geklärt

### I-183 · bewertet · Notration (befristete Halbration)

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-16 Scout C; Genre-Mechanik (Rationierung bei Mangel) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht «Nahrung reicht noch 1:20», schaltet 3 Minuten Halbration ein und opfert dafür Steuer und Wachstum, um die Fischerei nachzubauen, ohne dass die Häuser schrumpfen."
- Mechanik: Schalter nur bei Nahrungsmangel (Lager < 10): 3 min halber Nahrungsverbrauch, Steuer ×0,75, kein Wachstum und keine Aufstiegsprüfung; danach 6 min Sperre. Werte in `src/sim/defs/`.
- Grösse: M · Risiko: Save (Zustand und Sperrfrist), Baseline bitgleich, solange der Controller nicht schaltet
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11 (lead-design bestätigt)
- Fehlt heute: Verbrauch nur nach `rate` (`src/sim/population.ts:82-100`); bei Mangel sinken Einwohner je Wachstumsschritt um 1 (`population.ts:230-234`); keine Verbrauchsstufe in den Edikten (`src/sim/defs/edicts.ts:5-37`, Edikte erst nach Ziel).
- Randfälle: wirkt nur auf Nahrung; Ration läuft während Pause nicht ab; Sperrbestand (I-049) bleibt unberührt. Entartung: Dauer-Ration, verhindert durch Sperre und Steuerabschlag. Dominanz: Bei voller Kasse schlägt Zukauf am Kontor die Ration; die Ration ist das Mittel, wenn Geld und Ware fehlen (Frühspiel, I-168 «Kasse leer»).
- Doppelung: I-137 (eingeplant, Abstiegs-Dämpfer: automatisch, Darstellung), I-031 (live, Edikte), I-109 (live, Reichweite am Gut-Chip).
- Bewertung lead-design: Einzige neue Mechanik der Runde mit Entscheidung in der ersten Stunde. Vor dem Kurzdesign rechnen (`design-balancing-analyst`), ob die Lage «Kasse leer und Nahrung leer» im Frühspiel überhaupt vorkommt; sonst dominiert Zukauf und die Idee ist leer.
- Nutzen/Aufwand: Hunger wird Wahl statt stilles Schrumpfen · M · ≈ 2 Pakete
- Rechnung IDEEN-16 (`design-economy-designer`): «Kasse leer und Nahrung leer» entsteht im Frühspiel nur bei einem Doppelfehler (Überbau plus zu wenig Fischer); im Referenzlauf nie (Controller baut Nahrung zuerst). Ein Fischer (100 Geld, 2,5 Nahrung je 100 Ticks, Unterhalt 5) beendet den Mangel in höchstens 100 Ticks und schlägt Zukauf (8 je Einheit, 4 je Einwohner) und Ration. Ration billiger als Zukauf erst ab Defizit > Steuer ÷ 16 (Pioniere 12,5 %, Siedler 44 %, Bürger nie); die feste 3-min-Ration kostet mehr als jede Überbrückung. Echte Wahl erst, wenn die Ration jederzeit beendbar ist (Steuer ×0,85) und Zukauf mit der Menge teurer wird (`BUY_RISE` > 0, wie I-110).
- Entscheid: offen (IDEEN-16), Empfehlung parken bis `BUY_RISE` > 0 (kein Kurzdesign in dieser Form)

### I-184 · bewertet · Lagerverderb für Nahrung (kleine Fassung)

- Bereich: Inhalt · Säule: Produktionsketten · Quelle: IDEEN-16 Scout C; Genre-Mechanik (Frischware verdirbt) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht «Nahrung über 60 verdirbt» und baut Überschuss in eine Fernlieferung um, statt ihn liegen zu lassen."
- Grösse: S · Risiko: Baseline
- Raster: Spass 1 · Passung 2 · Aufwand 3 · Risiko 2 = 9 (lead-design bestätigt)
- Fehlt heute: Lager kennt nur die Kappung (`src/sim/economy.ts:11-15`, `STORAGE_CAP` in `src/sim/defs/goods.ts:84`).
- Randfälle: nur Nahrung über 60; Sperrbestand ausgenommen. Entartung: Bestand knapp unter 60 halten, Idee ohne Wirkung.
- Doppelung: I-013 (verworfen: Senke ohne Wahl), I-046 (verworfen, Überlauf-Ausfuhr).
- Bewertung lead-design: gleiche Lage wie I-013; die Schwelle wird zur Regel «nie mehr als 60», keine Entscheidung.
- Nutzen/Aufwand: gering · S · ≈ 40 Tools
- Entscheid: offen (IDEEN-16), Empfehlung verwerfen
