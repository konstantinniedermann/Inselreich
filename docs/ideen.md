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

## Rangliste IDEEN-13 (Vorschlag lead-design, Ruling L0 offen)

Breite Runde (R445), Scouts A (Rückmeldungen und Playtests REL-24 bis REL-27: Rat, Vorwarnung, Fernangebot, Funkeln) und
B (Geld-Senken im Mittel- und Spätspiel): 9 Vorschläge, eingetragen als I-136–I-139 und I-141–I-145 (I-140 nicht vergeben,
Scout A lieferte 4). Keine Idee ändert Kernsäule, Genre oder Titel (§5.3); keine berührt Erweiterung 1, Stadtplanung, ORT-A,
I-119 oder I-121. Leitbefund bestätigt: Bei ≈ 2000 Überschuss je 100 Ticks im Spätspiel (Überschlag Scout B; gemessen
«Kasse nie unter 2454» unter Eigenversorgung, R745) trägt **keine reine Geld-Senke** (I-141, I-142, I-143, I-145): Jede ist
entweder trivial bezahlbar und damit immer gekauft oder nie spürbar. Was trägt, ist ein **Engpass ausser Geld** (I-144: Zukauf
begrenzt) — das ist der offene Zielsatz von I-048 («wer jeden Engpass mit Geld löst, zahlt drauf», R571) und der gemeinsame
Anlass der vier geparkten Ideen I-110, I-130, I-134 und I-111. Sortiert nach Raster-Summe, bei Gleichstand nach Nutzen je
Aufwand. Pool-Pflege nach R599 in derselben Runde (I-112, I-114, I-118, I-120, I-122, I-123 live mit REL-26, I-133 verworfen
R745, Rangliste IDEEN-12 ins Archiv). Pool danach: 16 von 40 offen, nach dem Runden-Ruling wie empfohlen 10.

| Rang | ID    | Name                                       | Grösse | Summe | Save / Baseline | Nutzen/Aufwand                                      | Empfehlung                                                        |
| ---- | ----- | ------------------------------------------ | ------ | ----- | --------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| 1    | I-136 | Fernkarte mit Fahrzeit und roter Lagerzahl | S      | 13    | nein / nein     | I-114 wird lesbare Wahl, ≈ 40 Tools                 | Top 1: Häppchen, Kurzdesign Stufe leicht (Fahrzeit-Quelle prüfen) |
| 2    | I-144 | Zukauf-Ordnung (begrenzte Einkaufsgüter)   | M      | 12    | ja / ja         | Geld löst nicht mehr alles, öffnet 4 geparkte Ideen | Top 2: Wirtschafts-Brainstorming Stufe voll mit Rechnung          |
| 3    | I-137 | Abstiegs-Dämpfer am Haus                   | S      | 12    | nein / nein     | Mangel im Moment sichtbar, ≈ 50 Tools               | Top 3: Häppchen nach I-136, Render-Strang nach ORT-A T09/T10      |
| 4    | I-138 | Rats-Karte nennt die Wirkung vorab         | S      | 11    | nein / nein     | Weichenstellung informiert, ≈ 40 Tools (nur Zeile)  | Beipack UI-Häppchen, mit Umschalt+R-Befund; Kreise streichen      |
| 5    | I-139 | Rat und Kulanz in der Inselchronik         | S      | 10    | nein / nein     | Rückblick ohne Entscheidung, ≈ 30 Tools             | parken bis I-132 live (REL-27), dann Beipack zur Chronik          |
| 6    | I-145 | Edikt-Wechsel nach Stadtgrösse             | S      | 9     | nein / ja       | Gebühr trivial gegen Überschuss, Sparen dominiert   | verwerfen (Geld nicht knapp; Edikt-Frage liegt bei I-064)         |
| 7    | I-141 | Festbetrieb für Dienstgebäude              | S–M    | 7     | ja / ja         | +60 je Intervall gegen ≈ 2000: immer an             | verwerfen (dominant; Warenfassung wäre Stadtplanung-Frage)        |
| 8    | I-142 | Speicheranbau am Kontor                    | S–M    | 7     | ja / ja         | grösseres Lager schadet nie: Pflichtkauf            | verwerfen (dominant, Nutzen ungemessen)                           |
| 9    | I-143 | Verwaltungsaufschlag mit Zunfthaus         | M      | 7     | ja / ja         | Strafsteuer ohne Biss, Ballung doppelt Stadtplanung | verwerfen                                                         |

Altbestand ohne Ruling (keine neue Bewertung nötig, Empfehlung zur Bereinigung): **I-111** Etappenwunsch (12) parken bis zur
Zukauf-Ordnung (I-144), weil Geld- und Steinbelohnung bei festen Kaufpreisen nichts wiegen (R722); **I-106** «Neu»-Karte (10)
bleibt Beipack-Kandidat für das nächste UI-Häppchen (die Karte besteht weiter, `src/ui/goal.ts` `unlockNoticeText`).

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

### I-136 · bewertet · Fernkarte mit Fahrzeit und roter Lagerzahl

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-13 Scout A; `docs/superpowers/specs/2026-10-16-i114-fernangebot-wahl.md` (Spielerwirkung nennt «kürzere Fahrt», die Karte zeigt keine Fahrzeit, Regel 6 schliesst sie als Sim-Wert aus); `docs/beobachtungen.md` «10-16 · I-114: Lagerzahl der Fernkarte ohne Rotfärbung bei Mangel» · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht auf beiden Fernkarten «≈ 40 s Fahrt» und eine rote Lagerzahl, wenn das Gut fehlt, und wählt wirklich nach Fahrzeit und Lager."
- Mechanik: Reine Lesefunktion in `src/ui/` (Muster `farAlternative`) schätzt die Fahrzeit aus Seeweg und Schiffstempo der Heimat zur Fremdinsel; Kennzeichnung «≈»; Lagerzahl rot unter der Auftragsmenge. Schreibt nicht in die Welt.
- Grösse: S · Risiko: keins (kein Save, Baseline unberührt); offen, ob die Wegschätzung aus vorhandener Routen-Mathematik (I-103 Routen-Bilanz, `src/sim/defs/sea.ts`) ableitbar ist, sonst M
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13
- Randfälle: kein Schiff oder kein Seeweg → «–»; Schätzung weicht vom echten Schiff ab (Ladezeit, Umweg) → «≈», Abweichung im Kurzdesign begrenzen; nur ein Fremdkontor → eine Karte wie heute, Fahrzeit trotzdem. Entartung: bei gleicher Prämie gewinnt immer die kürzere Fahrt — gewollt, die Prämie unterscheidet sich je Gut und Menge.
- Doppelung: I-114 (live) liefert die Wahl ohne Fahrzeit; I-101 (live) zeigt nur die Lage; I-124 (geparkt, Fernmarke anklicken) ist Navigation, nicht Information.
- Bewertung lead-design: bestätigt (13). Schliesst die Lücke zwischen der Spielerwirkung von I-114 und dem, was die Karte zeigt; ohne Fahrzeit ist die Wahl teils geraten. Kleinstes Häppchen der Runde mit Playtest-naher Quelle.
- Nutzen/Aufwand: aus «Lage raten» wird eine lesbare Wahl · S · ≈ 40 Tools
- Entscheid: offen (IDEEN-13)

### I-137 · bewertet · Abstiegs-Dämpfer am Haus

- Bereich: Grafik · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-13 Scout A; `docs/superpowers/specs/2026-10-16-i120-i118-wohlstand-klang-funkeln.md` AK-B1 (Abstieg liefert nichts); `.studio/handoffs/2026-10-16-lead-qa-gate-I-120-I-118.md` · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht ein Haus beim Stufenverlust kurz grau verblassen und hört einen dumpfen Ton, und merkt den Mangel in dem Moment, in dem er Einwohner kostet."
- Mechanik: Gegenstück zu `detectRises` im Render-Zustand (`detectFalls`), 1,5 s grauer Schleier ohne Funken, teilt den Deckel 6 der Aufstiegseffekte; Ton über `soundEvents` mit Mindestabstand je Haus. Prozedural, keine Assets.
- Grösse: S · Risiko: keins (kein Save, keine Sim-Änderung; Perf gedeckelt)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12 · Raster (lead-design): Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: Massenabstieg bei einer Krise → höchstens 6 Effekte, ein Ton je 2 s gesamt; Abriss und Neubau zeigen nichts; nach dem Laden kein Effekt (erster Frame merkt nur den Stand); «Bewegung reduzieren»: nur Ton. Entartung: Dauerrauschen bei schwankender Versorgung (Haus pendelt) → Mindestabstand je Haus 30 s.
- Doppelung: I-118 (live, nur Aufstieg); I-009 (live) meldet Mangel als Signal vor dem Abstieg, nicht den Abstieg; I-119 (Gate Spec) betrifft Figuren, nicht das Haus.
- Bewertung lead-design: Passung 3 → 2 (Rückmeldung, keine neue Entscheidung), Risiko 2 → 3 (gedeckelt wie I-118, das als keins galt). Symmetrie zum Funkeln macht Verlust so lesbar wie Gewinn; Render-Dateien sind während ORT-A T09/T10 belegt, darum nach I-136.
- Nutzen/Aufwand: Mangel im Moment des Schadens sichtbar · S · ≈ 50 Tools
- Entscheid: offen (IDEEN-13)

### I-138 · bewertet · Rats-Karte nennt die Wirkung vorab

- Bereich: Bedienung · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-13 Scout A; `src/ui/council.ts` `councilCards` (nur statischer Text aus `COUNCIL`); `docs/beobachtungen.md` «10-16 · I-112: Umschalt+R ohne Marke öffnet leere Rats-Karte» · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest unter «Marktrecht» «wirkt auf 3 Marktplätze, 41 Häuser» und unter «Zunftrecht» «12 Häuser warten auf Stein», bevor er die einmalige Wahl trifft."
- Mechanik: Je Beschluss eine Vorschau-Zeile aus Weltzustand und `COUNCIL` (reine Lesefunktion in `src/ui/`); dazu Umschalt+R ohne Marke ignoriert (Beobachtung). Die vom Scout vorgeschlagenen temporären Reichweitenkreise entfallen (Versorgungsebene gehört zur Stadtplanung).
- Grösse: S · Risiko: keins (reine Anzeige)
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 2 · Risiko 3 = 12 (Zeile allein 13) · Raster (lead-design, nur Zeile): Spass 1 · Passung 3 · Aufwand 3 · Risiko 3 = 11
- Randfälle: kein Marktplatz → «wirkt noch nicht», Beschluss bleibt wählbar; kein Aufstiegskandidat → nur der Preis; Rat schon entschieden → Zeile entfällt. Entartung: die Zahlen machen eine Seite offensichtlich besser und entlarven eine Scheinwahl — dann ist das ein Balancing-Befund zu I-112 (Anhang-Rechnung), kein Fehler der Anzeige.
- Doppelung: I-112 (live, Karte ohne Vorschau); I-045 und I-051 (Stadtplanung) für die Kreise.
- Bewertung lead-design: Spass 2 → 1: Der Kartentext nennt die Wirkung schon, die Zeile macht sie konkret, erzeugt aber keine neue Entscheidung; die Wahl kommt nur dreimal je Partie. Als Beipack mit dem Umschalt+R-Befund günstig.
- Nutzen/Aufwand: Weichenstellung informiert statt geraten · S · ≈ 40 Tools als Beipack
- Entscheid: offen (IDEEN-13)

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
- Entscheid: offen (IDEEN-13)

### I-141 · bewertet · Festbetrieb für Dienstgebäude

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-13 Scout B; Genre-Mechanik Betrieb hochfahren gegen Dauerkosten; `src/sim/defs/buildings.ts` (`serviceRadius` 10, Unterhalt Kapelle 15, Schule 25, Badehaus 30) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler schaltet ein Badehaus auf Festbetrieb (Radius +3, Unterhalt ×3), statt ein zweites zu bauen."
- Grösse: S–M · Risiko: Save (Schalter je Gebäude), Baseline (Controller, Balancing-Test)
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 1 = 12 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 2 · Risiko 1 = 7
- Rechnung (Scout, ungemessen): +60 je 100 Ticks gegen ≈ 2000 Überschuss (3 %); zweites Badehaus 500 einmalig + 30 je Intervall.
- Randfälle: Brand oder Pause schaltet ab; Radius 13 mit Rats-Beschluss nicht stapeln; Radius öffnet keine Versorgung über Wasser (I-061). Entartung: bei 3 % des Überschusses ist der Schalter überall an, wo Radius fehlt — eine Pflicht, keine Wahl.
- Doppelung: I-112 (live, Radius als einmaliger Beschluss), I-061/I-045 (Stadtplanung, Reichweite).
- Bewertung lead-design: Spass 3 → 1, Passung 3 → 2: die Wahl «Platz gegen Dauerkosten» trägt nur, wenn Dauerkosten zählen; bei R722 tun sie das nicht. Eine Fassung mit Warenverbrauch statt Geld wäre eine Reichweiten-Frage und gehört dann ins Stadtplanungs-Brainstorming, nicht in den Pool.
- Nutzen/Aufwand: geringer Nutzen (dominant) · S–M · ≈ 50 Tools plus Messlauf
- Entscheid: offen (IDEEN-13), Empfehlung verwerfen

### I-142 · bewertet · Speicheranbau am Kontor

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-13 Scout B; `src/sim/defs/goods.ts` (`STORAGE_CAP` 100 je Gut und Insel); Genre-Mechanik Lagerstufen · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler baut den Kontorspeicher in drei Stufen aus (+50 je Gut) und puffert Stein und Glas fürs Denkmal gegen Dauerkosten."
- Grösse: S–M · Risiko: Save (Ausbaustufe), Baseline (Lagergrenze ändert Controller-Verlauf)
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 3 · Risiko 1 = 10 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 2 · Risiko 1 = 7
- Rechnung (Scout, ungemessen): Stufe 1 600 + 20 Stein, +20 je Intervall; Stufe 3 2000, +60; Gegenwert nur weniger Produktionsstillstand.
- Randfälle: Kontorverlust → Stufe verfällt; Altstände Stufe 0. Entartung: ein grösseres Lager schadet nie und kostet einen Bruchteil des Überschusses → Pflichtkauf; ob 100 je Gut überhaupt oft voll ist, ist ungemessen.
- Doppelung: I-049 (live, Sperrbestand), I-130 (geparkt).
- Bewertung lead-design: Spass 2 → 1, Aufwand 3 → 2 (Save und Baseline): Ausbau ohne Gegenseite; reine Senke im Sinn von R722.
- Nutzen/Aufwand: geringer Nutzen · S–M · ≈ 40 Tools plus Messlauf
- Entscheid: offen (IDEEN-13), Empfehlung verwerfen

### I-143 · bewertet · Verwaltungsaufschlag mit Zunfthaus

- Bereich: Inhalt · Säule: Insel besiedeln · Quelle: IDEEN-13 Scout B; Genre-Mechanik Wachstumskosten mit Gegengebäude; `src/sim/defs/buildings.ts` (Unterhalt 5–25 je Betrieb) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler zahlt ab 20 Betrieben je Insel 2 % Unterhaltsaufschlag je weiteren Betrieb und ballt Betriebe um ein Zunfthaus, das den Aufschlag in seinem Umkreis halbiert."
- Grösse: M · Risiko: Save (Zunfthaus), Baseline und Balancing-Test (Unterhalt ändert sich für den Controller)
- Raster (Scout): Spass 3 · Passung 2 · Aufwand 2 · Risiko 1 = 11 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 2 · Risiko 1 = 7
- Rechnung (Scout, ungemessen): 40 Betriebe → ≈ 240 je Intervall Aufschlag (12 % des Überschusses); Zunfthaus lohnt erst ab ≈ 14 Betrieben im Radius.
- Randfälle: Frühspiel unter der Schwelle; Controller muss Zunfthaus nachbilden. Entartung: 240 gegen 2000 ist kein Biss → Zunfthaus lohnt sich nie spürbar; mit Biss wäre es eine Strafsteuer aufs Wachstum ohne Wahl.
- Doppelung: Ballung als räumliche Wahl gehört zum Stadtplanungs-Baustein (I-128, I-061, I-051); I-079 Bauhof (verworfen).
- Bewertung lead-design: Spass 3 → 1: Geldstrafe ohne Biss (R722); die räumliche Hälfte doppelt die Stadtplanung, die laut Briefing nicht angefasst wird.
- Nutzen/Aufwand: geringer Nutzen · M · ≈ 3 Pakete
- Entscheid: offen (IDEEN-13), Empfehlung verwerfen

### I-144 · bewertet · Zukauf-Ordnung (begrenzte Einkaufsgüter)

- Bereich: Inhalt · Säule: Produktionsketten (Wirtschaft, Steuern und Handel) · Quelle: IDEEN-13 Scout B («Einkaufslizenz je Gut»); Genre-Mechanik Handelsprivilegien; `src/sim/defs/goods.ts` (`BUY_RISE` 0, feste Preise); offener Zielsatz I-048 «wer jeden Engpass mit Geld löst, zahlt drauf» (R571, Archiv) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler darf am Kontor nur zwei Güter dauerhaft einkaufen und entscheidet, ob er Werkzeug oder Gewürz zukauft und die andere Kette selbst baut oder per Schiff holt."
- Mechanik (Scout, roh): zwei Einkaufsplätze je Insel, je Gut belegbar, Wechsel gegen Gebühr; Verträge und Aufträge bleiben unberührt. Die Designfrage im Brainstorming: harte Plätze (diese Idee) gegen weiche Staffel nur für Konsumgüter (Hinweis I-048: Stoff, Rum, Glas, Gewürz, vom Controller kaum gekauft, daher Baseline-nah) gegen `BUY_RISE` > 0 (R571 verworfen, Last-Probe Holz 71–90/min).
- Grösse: M (Brainstorming mit Rechnung, Sim-Regel, Handelsdialog, Baseline-Messung) · Risiko: Save (Plätze), Baseline (Controller kauft Werkzeug und Gewürz), Balancing-Test; Ruling nötig
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 1 = 12 · Raster (lead-design): Spass 3 · Passung 3 · Aufwand 2 · Risiko 1 = 12
- Randfälle: Frühspiel mit Werkzeugmangel darf nicht festlaufen (Plätze ab Start frei belegt, Werkzeug als Vorgabe); Gut ohne Platz bleibt verkaufbar; Stammkunde und Fernangebot unberührt; «Eigenversorgung» (I-132) sperrt weiter alle Plätze. Entartung: «immer dieselben zwei» ist erlaubt, solange die übrigen Ketten dafür gebaut werden müssen — die Wahl liegt im Weglassen; zu viele Plätze → alles wie heute.
- Doppelung: I-048 (Archiv, Schritt B verworfen R571, Zielsatz offen), I-129 (verworfen, Dauer-Zukauf), I-130/I-110/I-134 (geparkt bis `BUY_RISE` > 0), I-111 (Belohnung wiegt nichts). Kein §5.3-Fall: Regel innerhalb der Säule Wirtschaft, kein Wechsel von Säule, Genre oder Titel.
- Bewertung lead-design: bestätigt (12), umbenannt. Einzige Idee der Runde, die das Kernproblem nicht mit einer Senke, sondern mit einem Engpass ausser Geld beantwortet: Geld kauft nicht mehr jede Kette frei, also zählt Produktion wieder im Mittel- und Spätspiel. Gleicher Ansatz wie I-132 «Eigenversorgung», aber dauerhaft und teilweise. Als Wirtschafts-Brainstorming Stufe voll mit `design-economy-designer`, das die drei Fassungen gegeneinander rechnet; ein Ergebnis entparkt I-110, I-130, I-134 und I-111.
- Nutzen/Aufwand: hoher Nutzen (Bauen statt Kaufen wird eine Entscheidung) · M · Brainstorming ≈ 80 Tools, danach ≈ 2 Pakete
- Entscheid: offen (IDEEN-13)

### I-145 · bewertet · Edikt-Wechsel nach Stadtgrösse

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-13 Scout B; `src/sim/defs/edicts.ts` (`EDICT_COST` 600 fest) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler zahlt für einen Edikt-Wechsel 600 plus 1 je Einwohner und wägt ab, wann sich der Wechsel lohnt."
- Grösse: S · Risiko: Baseline (Wert, falls der Controller wechselt); kein Save
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11 (im Bericht als 9 addiert) · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 2 = 9
- Randfälle: Wechsel auf «kein Edikt» bleibt kostenlos; Altstände behalten ihr Edikt. Entartung: 1000 gegen ≈ 2000 Überschuss je Intervall ist keine Abwägung; laut Scout dominiert «Sparen» ohnehin, dann wechselt niemand.
- Doppelung: I-064 (geparkt, Edikt-Überarbeitung), I-131 (geparkt, zweiter Platz).
- Bewertung lead-design: Spass 2 → 1 (Scout-Summe richtig 11, nicht 9). Reine Geld-Senke; die eigentliche Frage ist die Dominanz unter den Edikten (I-064).
- Nutzen/Aufwand: geringer Nutzen · S · ≈ 30 Tools
- Entscheid: offen (IDEEN-13), Empfehlung verwerfen
