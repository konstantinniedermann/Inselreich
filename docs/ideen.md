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

## Rangliste IDEEN-12 (Vorschlag lead-design, Ruling L0 offen)

Breite Runde (R445, R731), Scouts A (Spieler-Rückmeldungen und Playtests seit REL-20), B (fehlende Genre-Mechaniken) und
C (Spätspiel nach dem Denkmal): 14 Vorschläge, eingetragen als I-122–I-135. Keine Idee ändert Kernsäule, Genre oder Titel
(§5.3); keine berührt Erweiterung 1. Leitbefund für die Bewertung: Bei festen, unbegrenzten Kaufpreisen ist Geld nur in den
ersten 15 min knapp (R722); Ideen, die Geld geben, sparen oder Startboni verteilen, tragen deshalb nicht. Sortiert nach
Raster-Summe, bei Gleichstand nach Nutzen je Aufwand. Pool-Pflege nach R599 in derselben Runde (16 Einträge und die Rangliste
IDEEN-11 ins Archiv). Pool danach: 23 von 40 offen, nach dem Runden-Ruling wie empfohlen 13.

| Rang | ID    | Name                                     | Grösse | Summe | Save / Baseline | Nutzen/Aufwand                                   | Empfehlung                                                   |
| ---- | ----- | ---------------------------------------- | ------ | ----- | --------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| 1    | I-122 | Vorwarnung vor der Stammkunden-Lieferung | S      | 13    | nein / nein     | Kulanz wird Entscheidung, ≈ 50 Tools             | Top 1: Häppchen mit I-123, Kurzdesign Stufe leicht           |
| 2    | I-132 | Selbstauflage «Meisterprüfung»           | M      | 11    | ja / nein       | Ziel nach dem Denkmal, Ketten zählen, ≈ 2 Pakete | Top 2: Kurzdesign Stufe voll mit Rechnung, I-133 als Auflage |
| 3    | I-133 | Krisenstufe «stürmisch»                  | S      | 11    | ja / nein       | Schwierigkeit ohne Ziel, ≈ 50 Tools              | zusammenfassen in I-132 (Auflage «Sturmjahr»)                |
| 4    | I-123 | Reichweite rechnet den Stammkunden mit   | S      | 11    | nein / nein     | Anzeige stimmt, ≈ 30 Tools als Beipack           | Beipack zu I-122                                             |
| 5    | I-128 | Lärm und Rauch                           | M      | 10    | nein / ja       | räumliche Wahl, Regeländerung, ≈ 2 Pakete        | Top 3: Baustein Stadtplanung (mit I-061, I-051, I-045)       |
| 6    | I-125 | Ereignis-Log im Spielstand               | S      | 9     | ja / nein       | nur nach dem Laden, UI-Zustand im Save           | verwerfen (Trigger offen, Trennung I-100)                    |
| 7    | I-124 | Fernmarke anklicken                      | M      | 8     | nein / nein     | Komfort, Konflikt ORT-A                          | parken bis Playtest-Trigger und ORT-A gemergt                |
| 8    | I-127 | Marktplatz-Ausbau mit zwei Zweigen       | S–M    | 8     | ja / nein       | «Weite» tot (Rechnung I-112)                     | verwerfen                                                    |
| 9    | I-129 | Mindestbestand (Dauer-Zukauf)            | S–M    | 8     | ja / nein       | Ketten werden optional (K.O. Passung)            | verwerfen                                                    |
| 10   | I-130 | Inselpreisgefälle beim Einkauf           | M      | 8     | nein / nein     | Rabatt ohne Geldengpass wirkungslos              | parken bis `BUY_RISE` > 0                                    |
| 11   | I-131 | Amtsstube-Ausbau (zweiter Platz)         | S–M    | 8     | ja / nein       | Pflichtkauf, «welches lasse ich weg»             | parken bis I-112 live und Edikt-Überarbeitung (mit I-064)    |
| 12   | I-134 | Vermächtnis für die nächste Insel        | M      | 7     | ja / nein       | Startbonus ohne Strategie (R722)                 | parken mit I-110 bis `BUY_RISE` > 0                          |
| 13   | I-126 | Nebenauftrag neben dem Stammkunden       | M      | 6     | ja / ja         | nimmt dem Stammkunden seinen Preis               | verwerfen                                                    |
| 14   | I-135 | Feuerschale und Nachtglanz               | S      | —     | nein / ja       | schon live (Leuchtfeuer Stufe 4)                 | verwerfen (Doppelung)                                        |

## Ideen

### I-061 · bewertet · Marktplatz-Reichweite über Wege

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

### I-111 · bewertet · Etappenwunsch mit Wahlbelohnung

- Bereich: Inhalt · Säule: Bevölkerung · Quelle: IDEEN-11 Scout A; Nutzerfeedback 2026-10-02 S1 (mehr Spielziele); Freischaltung U0–U6 in `docs/spielwerte.md` (bis U3 kein Auftrag, kein Ziel ausser der nächsten Freischaltung) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler bekommt zwischen U1 und dem Bürger-Ziel etwa vier Etappen wie «12 Siedler 60 s versorgt» und wählt beim Erfüllen zwischen Geld und Baustoff, je nachdem, was sein Lager gerade braucht."
- Mechanik: Etappe = «n Einwohner einer Stufe t s versorgt» oder «n Betriebe einer Art»; Karte im Kartenstapel; bei Erfüllung Wahl aus zwei Belohnungen (z. B. Geld oder Stein), dann die nächste Etappe. Werte in `src/sim/defs/`.
- Grösse: M · Risiko: Save (Etappenstand), Baseline (Belohnung ist Zufluss, sobald der Controller eine Etappe erfüllt)
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 1 = 12
- Randfälle: Abriss setzt nur den Zeitzähler zurück; Belohnung bei vollem Lager wird nicht verschenkt (Wahl fällt auf das andere Gut); kein Überspringen. Entartung wie bei I-011: Geld dominiert, wenn Geld nie knapp ist; Belohnungen müssen Baustoff-Engpässe treffen (Stein vor dem Bürger-Aufstieg: 5 je Haus).
- Doppelung: I-011 Hauswunsch (verworfen: Geld dominiert), I-017 Auftragsreihe Seefahrt (geparkt, Seefahrt-Lernpfad), Handelsaufträge ab U3. Neu ist die Lücke U1–U3 und die Wahl zwischen zwei Gütern.
- Nutzen/Aufwand: Rhythmus und Ziel in der ersten Stunde, aber Dominanzgefahr wie I-011 · M · ≈ 2 Pakete (Rechnung ≈ 30 Tools)
- Entscheid: offen (IDEEN-11)

### I-112 · gemergt (R742) · Ratsbeschluss je Stufe (einmalige Wahl)

- Bereich: Inhalt · Säule: Bevölkerung · Quelle: IDEEN-11 Scout A; Genre-Mechanik Weichenstellung mit Ausschluss; Edikte I-031 (live, wechselbar) als Abgrenzung · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler wählt beim ersten Bürgerhaus einmalig «Zunftrecht» (Aufstieg kostet 2 Stein weniger) oder «Marktrecht» (Marktplatz-Reichweite +2) und baut danach dichter oder weiter."
- Mechanik: Beim ersten Haus der Stufe 2, 3 und 4 erscheint eine Karte mit zwei dauerhaften Beschlüssen ohne Unterhalt; der andere verfällt für diese Partie. 3 × 2 Beschlüsse in `src/sim/defs/`, je ein Hebel auf Bauweise, Kette oder Kasse. Unentschieden bleibt die Karte offen und nichts wirkt.
- Grösse: M · Risiko: Save (drei Wahlfelder, Migration «keine Wahl»); Baseline bitgleich, solange der Controller nicht wählt
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13
- Randfälle: Abriss des ersten Hauses nimmt nichts zurück; «Neue Insel» setzt zurück; Beschluss ohne Wirkungsfeld (kein Marktplatz) ist schwächer, nicht kaputt; Abstieg einer Stufe behält den Beschluss. Entartung: ein Beschluss, der immer gewinnt; je Paar muss jede Seite einen anderen Siedlungsstil belohnen (Rechnung `design-economy-designer`).
- Doppelung: I-077 Spezialisierung (geparkt) wählt je Betrieb, I-064 «Bauherr» (geparkt) ist ein Edikt; I-031 Edikte sind wechselbar und einzeln aktiv. Neu: einmalig, dauerhaft, je Stufe.
- Nutzen/Aufwand: echte Weichenstellung im Mittelspiel, prägt den Stadtplan · M · ≈ 2 Pakete (Werte-Rechnung ≈ 40 Tools)
- Entscheid: offen (IDEEN-11)

### I-114 · eingeplant (gemergt R720, live mit REL-26) · Fernangebot zur Wahl (zwei Inseln)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-11 Scout B; `docs/spielwerte.md` «Fernangebot» (bei mehreren Inseln reihum nach Periode, ohne Zufall, also ohne Wahl) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht zwei Fernkarten, etwa «Möweninsel: 20 Stoff · 440» und «Felsbucht: 15 Rum · 450», und nimmt die mit der kürzeren Fahrt oder dem volleren Lager."
- Mechanik: Ab Kontoren auf zwei Fremdinseln zeigt der Auftragstakt die zwei nächsten Angebote der heutigen Reihe; höchstens eines annehmbar, Frist 2:50, Menge und Prämie wie heute, der nächste Auftrag entfällt weiter.
- Grösse: S · Risiko: vermutlich keins: beide Angebote sind aus der Periode ableitbar, gespeichert wird wie heute nur das angenommene (im Kurzdesign prüfen); Baseline bitgleich ohne Fremdkontor
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12
- Randfälle: ein Fremdkontor: wie heute; Gut über der Stufe fällt aus, dann eine Karte; laufender Stammkunde: kein Fernangebot (wie heute); zwei Karten plus Auftragskarte: Platz im Kartenstapel bei 1280 px prüfen.
- Doppelung: I-095 (erledigt, Handel 2) liefert das Angebot ohne Wahl; I-093 (verworfen) tauschte nach dem Annehmen; I-101 (Fernauftrag-Marke Seekarte) zeigt die Lage.
- Nutzen/Aufwand: aus «nimm, was kommt» wird eine Wahl über Fahrzeit und Lager · S · ≈ 60 Tools
- Umsetzung: umgesetzt (REL-26-Kandidat); Spec `docs/superpowers/specs/2026-10-16-i114-fernangebot-wahl.md`, Plan `docs/superpowers/plans/2026-10-16-i114-fernangebot-wahl.md`
- Entscheid: gemergt (R720)

### I-118 · eingeplant (gemergt R707, live mit REL-26) · Aufstiegs-Funkeln am Haus

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; README «Effekte» (Aufstieg nur als Ton), `src/render/fx.ts` (nur Krisen-Effekte) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht beim Aufstieg das Haus kurz aufglänzen und weiss, welches Haus gewachsen ist, ohne den Ton zuzuordnen."
- Mechanik: Der Renderer vergleicht die Stufe je Haus mit dem Vorframe und zeichnet 1,5 s einen warmen Lichtkranz mit 6–8 Funken (grösser ab Stufe 3); nur im Bildausschnitt, höchstens 6 gleichzeitig, bei «Bewegung reduzieren» nur der Kranz. Prozedural, keine Assets.
- Grösse: S · Risiko: keins (kein Save, keine Sim-Änderung)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: hohe Geschwindigkeit: Deckel, älteste zuerst; Pause friert ein; nach dem Laden kein Effekt (erster Frame merkt nur den Stand); Abstieg zeigt nichts.
- Doppelung: I-007 Fest und I-009 Hörbarer Mangel (live) sind andere Anlässe; ORT-A/ORT-B betreffen statische Gestalt.
- Nutzen/Aufwand: Fortschritt in der ersten Stunde sichtbar · S · ≈ 50 Tools
- Entscheid: gemergt (R707)

### I-119 · Gate Spec (R715) · Bewohner reagieren auf Krisen

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; `src/render/life.ts` und `src/render/errands.ts` (keine Krisenreaktion) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht beim Brand Bewohner als Eimerkette zum Feuer laufen und bei Sturmwarnung heimgehen."
- Mechanik: Brand: bis 6 Spaziergänger im Umkreis 6 laufen hin, Feuerwache in Reichweite schickt 2 Löscher; Sturmwarnung: Figuren gehen ins nächste Haus; Boom: Figuren winken. Nutzt den Weggraph aus `errands.ts`, gedeckelt über die Figurenobergrenze.
- Grösse: M · Risiko: Perf (zusätzliche Pfade, gedeckelt); kein Save
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: Brand unter 5 s: keine Läufer; Pause: Stillstand; «Bewegung reduzieren»: keine Läufer.
- Doppelung: I-034 Seuche, I-058 Pause bei Krise (geparkt) sind andere Fragen; mit I-120 ein gemeinsames Paket «Bewohner reagieren» möglich.
- Nutzen/Aufwand: Krisen fühlbarer, ohne Entscheidung · M · ≈ 2 Pakete
- Entscheid: offen (IDEEN-11)

### I-120 · eingeplant (gemergt R707, live mit REL-26) · Wohlstandsklang der Stadt

- Bereich: Ton · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; `src/audio/ambience.ts`, `src/audio/mix.ts` (Schicht `town` hängt nur an der Einwohnerzahl im Bild) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler hört eine gut versorgte Stadt lebhaft und eine darbende still, ohne auf Zahlen zu schauen."
- Mechanik: Die Umgebungs-Mischung bekommt als Eingang den Anteil voll versorgter Häuser im Bild (gemittelt über ≈ 10 s): ab 80 % voller Pegel der Schicht `town`, unter 40 % halber Pegel, unter 20 % Wind statt Stadt; Gleiten mit `GLIDE_S`. Der Anteil kommt als Zahl über die UI-Verdrahtung; `src/audio/` importiert nichts aus `src/sim/`.
- Grösse: S · Risiko: keins (reine Mix-Funktion, keine Assets)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: hohe Geschwindigkeit: Mittelung; Pause: Klang bleibt; Ton aus: ohne Wirkung; keine Häuser im Bild: Schicht aus wie heute.
- Doppelung: I-009 (live) meldet einen einzelnen Mangel als Signal; dies ist die Dauerstimmung.
- Nutzen/Aufwand: Versorgung hörbar, sehr günstig · S · ≈ 40 Tools
- Entscheid: gemergt (R707)

### I-121 · Gate Spec (R715) · Wartende vor der Tür

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; Nutzerfeedback 2026-10-02 G9 (weniger Text, mehr Bilder) und S4 · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht nah gezoomt 1–2 Bewohner mit hängendem Kopf vor einem Haus mit Mangel stehen."
- Mechanik: Ab Zoom 1,0 stehen bei Mangel 1–2 Figuren vor der Tür (Farbe nach wichtigstem Mangel), nach 60 s eine dritte; gesamt höchstens 12, zählen zur Figurenobergrenze; voll versorgte Häuser schicken öfter Spaziergänger los.
- Grösse: M · Risiko: Perf (gedeckelt); kein Save
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: 3 s Verzögerung gegen Flackern bei hoher Geschwindigkeit; «Bewegung reduzieren»: höchstens 4.
- Doppelung: Bedarfssymbole am Haus (live, ab Zoom 0,75) zeigen denselben Mangel; mit I-119 ein gemeinsames Paket möglich.
- Nutzen/Aufwand: doppelt die Bedarfssymbole in Nahansicht · M · ≈ 2 Pakete
- Entscheid: offen (IDEEN-11)

### I-122 · gemergt (R747) · Vorwarnung vor der Stammkunden-Lieferung

- Bereich: Ton · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-12 Scout A; Playtest `.studio/qa/REL-24-25/i091/report.md` Schritte 2 und 6 (Toast und Fehlerton erst zum Periodenbeginn, die Karte zeigt vorher still «nächste Lieferung 5 s · Lager 0/5») · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler hört 20 s vor der Lieferung einen leisen Hinweiston, sieht die Vertragskarte kurz aufleuchten und kauft noch 3 Rum nach, statt die Kulanz zu verbrauchen."
- Mechanik: Ist das Lager unter der Vertragsmenge und die Restzeit der Periode ≤ `CONTRACT_WARN_S` (20 s, Wert in `src/sim/defs/` bei den Vertragswerten), hebt die UI die Karte einmal je Periode hervor und spielt einen Info-Klang über den bestehenden Vertragsklang-Pfad. Kein Toast, kein Log-Eintrag; reine Ableitung aus Lager, Vertrag und Periode.
- Grösse: S · Risiko: keins (kein Save, Baseline unberührt; `src/audio/` bekommt nur ein Signal)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13
- Randfälle: Lager füllt sich in der Warnzeit → keine Wiederholung, Hervorhebung endet; Pause friert die Restzeit ein; hohe Geschwindigkeit: 20 Spielsekunden sind bei 4× nur 5 s, Wert in Spielzeit prüfen; Kulanz noch offen: Warnung trotzdem, Text nennt «Kulanz wird verbraucht».
- Doppelung: I-091 (live) meldet den Fehlbestand erst beim Periodenwechsel; I-009 (live) ist Dauermangel der Häuser, kein Termin; I-109 (live) zeigt Reichweite ohne Vertrag (siehe I-123).
- Bewertung lead-design: bestätigt (13). Einzige Idee der Runde mit echtem Playtest-Beleg; macht aus «Kulanz passiert mir» eine Entscheidung (nachkaufen oder Puffer verbrauchen), die I-091 laut Spec R663 gerade erzeugen wollte. Ideal als Häppchen mit I-123.
- Nutzen/Aufwand: Stammkunde wird rechtzeitig entscheidbar · S · ≈ 50 Tools
- Entscheid: gemergt (R747)

### I-123 · gemergt (R747) · Reichweite rechnet den Stammkunden mit

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-12 Scout A; `docs/beobachtungen.md` «10-16 · Reichweite ignoriert Handel und Aufträge» (abgehakt, Trigger: Spieler liest die Zeile als falsch); `src/ui/hud.ts:124–127` (`reachLine` «ohne Handel und Aufträge») · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht am Rum-Chip «leer in 3:20» und die Zahl stimmt auch dann, wenn der Stammkunde alle 90 s 5 Rum abholt."
- Mechanik: `reachLine` zieht die Vertragsmenge je Periode als zusätzlichen Verbrauch ab (Menge ÷ Periode), nur für das Vertragsgut der Heimat; Zufallsauftrag und Handel bleiben draussen, der Zusatz lautet dann «(ohne Handel)». Periode und Menge stehen schon in `src/sim/defs/`.
- Grösse: S · Risiko: keins (reine Anzeige)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13 · Raster (lead-design): Spass 1 · Passung 3 · Aufwand 3 · Risiko 3 = 11
- Randfälle: Vertrag gekündigt oder gebrochen → sofort ohne Abzug; Vertragsgut im Überschuss (Bilanz trotz Vertrag positiv) → «voll in …» mit Abzug; andere Insel angezeigt → kein Abzug.
- Doppelung: I-109 (live) nennt die Grenze selbst; die Beobachtung ist abgehakt mit Spieler-Trigger, der noch nicht eingetreten ist.
- Bewertung lead-design: Spass 2 → 1: Korrektur einer Anzeige ohne neue Entscheidung, und der Trigger (Spieler liest die Zeile falsch) ist nicht eingetreten. Als Beipack zu I-122 sinnvoll (gleiche Stelle, gleicher Moment), allein nicht.
- Nutzen/Aufwand: Reichweite stimmt mit Vertrag · S · ≈ 30 Tools als Beipack
- Entscheid: gemergt (R747)

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

### I-132 · eingeplant (R737) · Selbstauflage «Meisterprüfung»

- Bereich: Inhalt · Säule: Produktionsketten (Wirtschaft) · Quelle: IDEEN-12 Scout C; Genre-Mechanik freiwillige Verzichts-Herausforderung; `docs/spielwerte.md` «Denkmal» (nach «Wahlziel erreicht» kein weiteres Ziel) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler wählt nach dem Denkmal die Auflage «Eigenversorgung» (Zukauf gesperrt) und hält seine Stadt 15 Minuten versorgt, um ein Abzeichen in der Inselchronik zu bekommen."
- Mechanik: Nach dem Wahlziel bietet der Chip «Ziel» bis zu drei Auflagen, höchstens eine aktiv: «Eigenversorgung» (Zukauf am Kontor gesperrt, Sim lehnt mit `{ ok: false, reason }` ab), «Genügsam» (Steuer aller Stufen fest auf niedrig), «Sturmjahr» (Krisen doppelt so oft, siehe I-133). Erfüllt: 15 min (9000 Ticks) alle Häuser ohne Abstieg und Kasse ≥ 0; Lohn nur ein Abzeichen in der Inselchronik, kein Geld, keine Spielwert-Wirkung. Werte in `src/sim/defs/`.
- Grösse: M (S in der Fassung nur «Eigenversorgung») · Risiko: Save (Auflage, Zähler, Abzeichen; Migration «keine»); Baseline bitgleich (Controller wählt nie)
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: Abbruch jederzeit ohne Kosten, Zähler neu; Pause hält den Zähler an; Abzeichen je Auflage einmal je Partie; Krise während der Auflage zählt mit (das ist die Prüfung); Denkmal abgerissen: Auflagen bleiben wählbar (Wahlziel bleibt erreicht).
- Doppelung: I-070 (verworfen, Anzeige ohne Regel), I-069 (verworfen, Lohn am Denkmal), I-113 (verworfen, Geldsenke). Neu: die Auflage ändert eine Regel, die Sim prüft sie, und der Lohn ist ehrenhalber.
- Bewertung lead-design: Spass 3 → 2 (erst nach dem Denkmal, also für Fortgeschrittene). Stärkste Spätspiel-Idee der Runde, weil sie das Kernproblem der Spätphase nicht mit einer Senke, sondern mit einem freiwilligen Engpass beantwortet: «Eigenversorgung» macht die Ketten wieder zur Aufgabe, ohne den Geldüberschuss zu verändern. Kurzdesign Stufe voll (Save); Rechnung `design-economy-designer`, ob 15 min Eigenversorgung mit allen Stufen machbar und nicht trivial ist.
- Nutzen/Aufwand: Ziel nach dem Denkmal, Ketten zählen wieder · M (S-Fassung möglich) · ≈ 2 Pakete
- Entscheid: eingeplant (R737): Kurzdesign Stufe voll mit Rechnung beim nächsten freien Platz

### I-133 · eingeplant (R737) · Krisenstufe «stürmisch» im Spiel wählbar

- Bereich: Bedienung · Säule: Insel besiedeln (Krisen) · Quelle: IDEEN-12 Scout C; `src/sim/defs/crises.ts` (Stufen aus/mild/normal, `period` 1200/600, Wahl nur bei «Neue Insel» über `src/ui/settings.ts`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler stellt im Spätspiel auf «stürmisch», weil seine Stadt gut geschützt ist, und erlebt doppelt so viele Brände und Stürme."
- Mechanik: Vierte Stufe «stürmisch» mit `period` 300, Gewichte fire 40 / storm 30 / boom 30; ab dem Wahlziel im Spiel umschaltbar, ohne Kosten. Werte in `src/sim/defs/crises.ts`.
- Grösse: S · Risiko: Save (neuer Wert im Feld der Krisenstufe), `balance-crises.test.ts` erweitern; Baseline keins
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12 · Raster (lead-design): Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11
- Randfälle: Umschalten während einer Krise wirkt erst auf den nächsten Zeitpunkt; der Boom-Ausgleich (150 %) ist im Geldüberschuss wertlos, also ist die Stufe reine Schwierigkeit; ohne Feuerwache dieselbe Wahl ohne Schutz.
- Doppelung: I-058 (geparkt), I-076 (verworfen, vierte Krisenart). Neu ist die Stufe, keine neue Krise.
- Bewertung lead-design: Als freie Einstellung ist «stürmisch» Schwierigkeit ohne Ziel (der Boom-Lohn zählt im Spätspiel nicht). Mit Ziel wird es eine Prüfung: Empfehlung zusammenfassen in I-132 als Auflage «Sturmjahr»; nur falls I-132 nicht kommt, als Einstellung allein.
- Nutzen/Aufwand: Spätspiel-Herausforderung · S · ≈ 50 Tools (in I-132 enthalten)
- Entscheid: eingeplant (R737): als Auflage «Sturmjahr» in I-132
