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

## Rangliste IDEEN-18 (Vorschlag lead-design, Ruling L0 offen)

Runde mit Schwerpunkt TIEFE-2 (R881, T2-2): K1 «Seegang» = I-209 und K3 «Bittschrift» = I-210 von lead-design aus dem Recherchebericht eingetragen, dazu ein Scout
(Spieltiefe, Modi, Erweiterungs-Bausteine, mit WebSearch) mit I-211–I-213. Keine Playtests als Quelle (R862). Keine Idee ändert Kernsäule, Genre oder Titel (§5.3).
Massstab R722: Lohn aus Geld oder Rabatt ohne Gegenpreis ist keine Wahl. Pool-Pflege R599 in derselben Runde: R878-Entscheide zu IDEEN-17 (I-199, I-200, I-203,
I-206, I-207 geparkt, I-205 verworfen), I-198 in I-209 aufgegangen (R881), mit REL-32 live gegangene Ideen (I-138, I-139, I-176 gekürzt nach F1–F4, I-186) und die
Rangliste IDEEN-17 ins Archiv; I-197 und I-201 auf `eingeplant` nachgeführt. Pool danach 30 von 40 offen.

| Rang | ID    | Gruppe    | Name                  | Grösse | Summe | Save / Baseline | Nutzen/Aufwand                                  | Empfehlung                                                                  |
| ---- | ----- | --------- | --------------------- | ------ | ----- | --------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| 1    | I-210 | Spätspiel | Bittschrift           | M      | 12    | ja / nein       | stabile Stadt entscheidet wieder, ≈ 3 Pakete    | **Pitch:** Dominanz-Rechnung `design-economy-designer`, dann Spec (voll)    |
| 2    | I-209 | Modus     | Seegang (Härteleiter) | M      | 11    | ja / nein       | Partien 2–5 mit eigenem Ziel, ≈ 3 Pakete        | **Pitch:** Lösbarkeitsrechnung je Stufe, dann Spec (voll), nach Inselproben |
| 3    | I-211 | Tiefe     | Funkenflug            | S      | 12    | nein / nein     | Brand als Planungsfrage, ≈ 40 Tools; keine Wahl | parken als Baustein Krisen-Überarbeitung, Paar mit I-212                    |
| 4    | I-212 | Tiefe     | Werkstattreihe        | M      | 10    | nein / ja       | Platzierungsrätsel, allein Rabatt ohne Preis    | parken als Paar mit I-211 bis I-128 Lärm live                               |
| 5    | I-213 | Tiefe     | Fuhrweg               | M      | 9     | nein / ja       | Strafe ohne Ausweg                              | verwerfen (Achse durch I-061 besetzt)                                       |

Leitbefund IDEEN-18: Die Recherche-Kandidaten aus TIEFE-2 tragen die Runde; der Scout fand mit Web-Werkzeug neue Felder (Dichte, Nachbarschaft, Wege), aber
jede davon ist allein ein Bonus oder eine Strafe ohne Gegenzug. Als Trio «dicht und schnell gegen sicher und ruhig» (I-211, I-212 mit I-128) wäre es ein
Kandidat fürs Stadtplanung-Folgebrainstorming. I-211 steht trotz Summe 12 hinter I-209: Die Wache dominiert (I-133), das Raster sieht das nicht.

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

### I-146 · eingeplant (R806, UI-HAEPPCHEN-H) · Wirkkreis bei ausgewählter Kapelle, Schule und Feuerwache

- Bereich: Grafik/Bedienung · Säule: Bevölkerung versorgen · Quelle: `docs/beobachtungen.md` (2026-10-16, I-112: kein Kreis bei stehender Kapelle); README «Radiusanzeige beim Platzieren»
- Spielerwirkung: „Der Spieler klickt eine stehende Kapelle, Schule oder Feuerwache an und sieht sofort, welche Häuser sie noch versorgt." Mechanik: vorhandener Kreis-Plan (`overlayPlan`, `src/render/overlays.ts`) auch für die Auswahl; nur Darstellung.
- Grösse: S · Risiko: Perf (Cache in `overlays.ts`); `src/render/` zurzeit ORT-A
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13
- Nutzen/Aufwand: Versorgungslücken ohne Neubau lesbar · S · ≈ 40 Tools
- Entscheid: R797/R806 eingeplant: UI-HAEPPCHEN-H P2 (Gate Kurzdesign R807), Umsetzung nach ORT-A-Merge

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

### I-187 · eingeplant (R864, Baustein O8/K5) · Inselruf (zweite Währung, die Geld nicht kauft)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: TIEFE-1 Recherche R1 1.6 (Tropico «drowning in money»), R3 «neue Entscheidung statt mehr Arbeit»; Leitbefund R722 · Herkunft: vom Studio vorgeschlagen · Gruppe: **Spieltiefe**
- Spielerwirkung: „Der Spieler nimmt nach dem Denkmal wieder jeden Fernauftrag an, weil ihm noch 4 Ruf zum Privileg «Siebter Lagerplatz auf Weidenau» fehlen, und überlegt, ob er den Ruf lieber für einen zweiten Ratsbeschluss spart."
- Mechanik: Ruf entsteht nur aus Verlässlichkeit, nie aus Geld: erfüllter Handelsauftrag +1, Fernangebot +2, Stammkunde je 5 Lieferungen +2, bestandene Auflage +5, Vertragsbruch −2. In der Amtsstube stehen 5–6 Privilegien, die kein Geld kauft (z. B. verfallenen Ratsbeschluss nachholen, Lagergrenze +20 auf einer Insel, Flottengrenze +1, Edikt-Sperrzeit halbiert). Jedes ist einmalig und kostet 6–15 Ruf. Erwartung bis Ziel 3 ≈ 15–20 Ruf, also 2 von 6 Privilegien: Wahl statt Sammeln. Werte in `src/sim/defs/`, Rechnung vorab (`design-economy-designer`).
- Grösse: M · Risiko: Save (Ruf-Zähler, gekaufte Privilegien); Baseline bitgleich, solange der Controller keine Privilegien kauft (Ruf zählt nur mit)
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13
- Fehlt heute: Lohn aller Auftragsarten ist Geld (`src/sim/orders.ts`, Fernangebot I-114, Stammkunde I-047); Ratsbeschlüsse sind kostenlos und einmalig (`src/sim/defs/council.ts`); die Amtsstube kennt nur Edikte und Steuer (`src/sim/defs/edicts.ts`).
- Randfälle: Ruf darf nicht unter 0 fallen; Abriss der Amtsstube sperrt den Kauf, der Ruf bleibt; Privileg «Flottengrenze» kollidiert mit der Werft der Erweiterung 1 (dort klären). Entartung: Aufträge nur noch für Ruf annehmen und mit Verlust erfüllen; das ist gewollt, weil Geld im Spätspiel reichlich ist (R722).
- Doppelung: I-116 (geparkt, Inselgunst: Pünktlichkeit hebt die Vorliebe, Lohn Geld), I-131 (geparkt, zweiter Edikt-Platz gegen Geld), I-173 (verworfen, Meisterbrief zahlt Geld), Erweiterung 1 O8/K5 (Dauer-Senke für Geld nach Ziel 4). Beleg: `rg -n -i "Ruf |Ansehen|Prestige" docs/ideen.md docs/ideen-archiv.md` → 0 Treffer; Erweiterung 1 `grep -E "Ruf|Ansehen"` → 0 Treffer.
- Bewertung lead-design: Antwortet direkt auf den Leitbefund. Die vorhandenen Schleifen (Aufträge, Fernangebot, Stammkunde, Auflagen) behalten nach Minute 15 einen Zweck, ohne neue Ketten. Kandidat, um O8/K5 der Erweiterung 1 anders zu beantworten («Lohn ist Ruf, nicht eine Geldsenke»).
- Nutzen/Aufwand: alle Handelsschleifen bleiben im Spätspiel Entscheidungen · M · ≈ 3 Pakete (Sim, UI, Rechnung)
- Entscheid: R864 Baustein: erst mit Erweiterung 1 O8/K5 (Nutzer-Session) und Ergebnis WIRTSCHAFT-TIEFE (R865)

### I-189 · eingeplant (R864, Baustein I-194) · Expedition ins Unbekannte

- Bereich: Inhalt · Säule: Insel besiedeln (Archipel) · Quelle: TIEFE-1 Recherche R3 «Sammeln und Erkunden», «neue Region» · Herkunft: vom Studio vorgeschlagen · Gruppe: **Spieltiefe** (Baustein Erweiterung I-194)
- Spielerwirkung: „Der Spieler schickt ein Schiff mit 20 Rum und 10 Werkzeug für vier Minuten hinter den Kartenrand und muss unterwegs zwischen zwei Wegen wählen; zurück kommt ein Fundstück, das eine Regel ändert."
- Mechanik: Expedition = Schiff ausser Dienst für 3–5 min, Ladung als Einsatz. Unterwegs 2 Wahl-Karten aus einem eigenen seeded Strom (ADR-010), je mit Bedarf (Ware an Bord) und Risiko. Lohn ist ein Fundstück aus einer Sammlung von 8–10 mit kleiner Dauerwirkung (wie Ratsbeschlüsse, z. B. «Seekarte: Fahrzeit −10 %»). Kein Geldlohn. Höchstens eine Expedition zugleich.
- Grösse: M · Risiko: Save (Expedition, Fundstücke), Baseline bitgleich (eigener Strom, Controller schickt keine)
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13
- Fehlt heute: Schiffe kennen nur Routen und Reserve (`src/sim/defs/sea.ts`); keine Wirkung ausser Fracht.
- Randfälle: Ein Schiff auf Expedition fehlt der Route, die Gewürzstadt kann kippen; Speichern unterwegs; Sturm-Krise während der Fahrt (keine Wirkung, eigener Strom). Entartung: immer die sichere Karte; daher müssen die Fundstücke an den riskanten Weg gebunden sein.
- Doppelung: I-038 (geparkt, Erkundungsfahrt deckt eine schon erzeugte Insel auf), I-036 (geparkt, Wrackbergung), Erweiterung 1 §10 (Erkundung und Nebel ausdrücklich nicht im Umfang). Beleg: `rg -n -i "Expedition" docs/ideen.md docs/ideen-archiv.md` → 0 Treffer; I-038 und I-036 über `rg -n "^### I-0(36|38)" docs/ideen-archiv.md`; Erweiterung 1 Z. 282.
- Bewertung lead-design: Gibt der Flotte nach der Gewürzstadt einen Zweck und einen Lohn ausser Geld. Die Kritik «Zufallslohn, Klickarbeit» (R3) ist durch Wahl-Karten und die Grenze von einer Expedition zugleich begrenzt. Allein M, als Kern der Erweiterung «Neue Ufer» stärker.
- Nutzen/Aufwand: Flotte und Spätspiel bekommen Ziel und Geschichte · M · ≈ 3 Pakete
- Entscheid: R864 Baustein der Erweiterung «Neue Ufer» (I-194, N-104)

### I-190 · eingeplant (R864, Inselproben) · Inselprobe (feste Karte, festes Ziel, Bestzeit)

- Bereich: Inhalt · Säule: alle (Modus) · Quelle: TIEFE-1 Recherche R2 «Seed-Herausforderung mit Wertung», «Zeitlimit» · Herkunft: vom Studio vorgeschlagen · Gruppe: **Modus**
- Spielerwirkung: „Der Spieler wählt im Startmenü «Probe 3: Handelsstadt, Krisen hoch», spielt 40 Minuten und sieht danach «Bestzeit 38:12 (vorher 41:50)» und einen Text zum Teilen."
- Mechanik: 5–6 Proben als Defs: Kartennummer, Krisenstufe, Freischaltung, Ziel (vorhandene Ziele 1–3, Denkmal, Meisterprüfung) und Wertung (Spielzeit in Ticks bis zum Ziel). Die Welt trägt `probe: { id } | null`. Bestzeiten liegen lokal neben dem Spielstand (wie I-186). Teilen-Text ohne Spoiler: «Inselreich · Probe 3 · Handelsstadt 38:12 · Krisen hoch». Tempo und Pause zählen nicht, weil die Spielzeit in Ticks gemessen wird.
- Grösse: M · Risiko: Save (Probe-Feld, Sprung v18 → v19), Baseline bitgleich (normales Spiel unverändert)
- Raster: Spass 3 · Passung 2 · Aufwand 2 · Risiko 2 = 12
- Fehlt heute: Neue Insel kennt Krisenstufe und Freischaltung (`src/ui/menu.ts:82-92`), aber keine wählbare Karte und keine Wertung; die Karte ist eine Zahl im Menü (`src/ui/menu.ts:116`), `createWorld` nimmt den Seed (`src/sim/world.ts:102-123`).
- Randfälle: Kartennummer, die die Kartenerzeugung ersetzt (`seedUsed`): die Probe speichert die genutzte Nummer; Neuladen eines älteren Stands setzt die Uhr zurück (gewollt, die Zeit bleibt ehrlich); «Alles frei» nur in eigens markierten Proben. Entartung: keine, Bestzeit ist lokal.
- Doppelung: I-132 (live, Meisterprüfung = Zeitprüfung in der Partie), AUFLAGEN-KERN (Auflagen), I-186 (Ablage der Bestzeiten). Beleg: `rg -n -i "Seed|Herausforderung|Bestzeit|Wertung" docs/ideen.md` → nur Teilwort «Bewertung», keine Modus-Idee; im Archiv nur Risiko-Zeilen zu seeded Strömen; Erweiterung 1 → nur Controller-Seed (Z. 99, 251).
- Bewertung lead-design: Nutzt unseren grössten technischen Vorteil, die deterministische Sim. Messbares Ziel und Grund zum Neustart (R1 1.3, R2). Ohne Server keine globale Liste. Das ist nach R2 sogar fairer.
- Nutzen/Aufwand: Wiederspielwert mit Vergleich, Lernkurve sichtbar · M · ≈ 3 Pakete (Sim, UI, Inhalt der Proben)
- Entscheid: R864 eingeplant: Brainstorming «Modus Inselproben» (`design/modus-inselproben`)

### I-191 · eingeplant (R864, Inselproben) · Tagesinsel (Datum als Karte)

- Bereich: Inhalt · Säule: alle (Modus) · Quelle: TIEFE-1 Recherche R2 «Tages-Herausforderung» · Herkunft: vom Studio vorgeschlagen · Gruppe: **Modus**
- Spielerwirkung: „Der Spieler startet am Morgen die Tagesinsel, die heute für alle gleich ist, und vergleicht abends mit einem Freund per Teilen-Text, wer schneller 50 Bürger hatte."
- Mechanik: Aufbau auf I-190. Die Kartennummer ist das Datum (`JJJJMMTT`, Ortszeit), Ziel und Krisenstufe wechseln je Wochentag aus einer Def-Liste. Lokale Liste der letzten 14 Tage. Verpasste Tage bestrafen nicht.
- Grösse: S (auf I-190) · Risiko: keins über I-190 hinaus
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Fehlt heute: wie I-190.
- Randfälle: Zeitzonen (Ortszeit, also für zwei Spieler nicht immer gleich, im Teilen-Text steht das Datum); Spiel über Mitternacht behält die Karte des Starts.
- Doppelung: I-190 (Grundlage). Beleg: `rg -n -i "Tagesinsel|täglich|Datum als" docs/ideen.md docs/ideen-archiv.md` → 0 Treffer.
- Bewertung lead-design: Klein und nur mit I-190 sinnvoll. Spass 2, weil der Reiz erst für Wiederkehrer wirkt.
- Nutzen/Aufwand: Grund zur Rückkehr · S · ≈ 40 Tools nach I-190
- Entscheid: R864 eingeplant: Teil «Modus Inselproben»

### I-192 · eingeplant (R864, Inselproben) · Knappe Zeiten (Szenarien mit Startbedingung)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: TIEFE-1 Recherche R1 1.6 (Missionen geben Struktur), R2 «Szenarien», R3 «Szenarien nur mit Wirtschaftsbezug» · Herkunft: vom Studio vorgeschlagen · Gruppe: **Modus**
- Spielerwirkung: „Der Spieler beginnt «Schuldbrief» mit −3000 Geld und muss in 20 Minuten schuldenfrei sein; jede Münze zählt wieder, und der Zukauf am Kontor wird zur echten Abwägung."
- Mechanik: Szenario = Probe (I-190) plus Startbedingung als Def: (a) «Schuldbrief»: Startgeld negativ, Zins je Minute, Ziel schuldenfrei vor Frist; (b) «Karge Heimat»: Heimatinsel ohne Gebirge, Stein nur von der Felsbucht oder per Zukauf; (c) «Sturmjahr»: Krisen hoch, Sturm doppelt, Feuerwache erst mit Siedlern. Jede Startbedingung ist ein Schalter in `src/sim/defs/`, die Regeln des Grundspiels bleiben unverändert.
- Grösse: M (Rahmen + 1 Szenario), je weiteres Szenario S–M · Risiko: Save (Szenario-Feld), Baseline bitgleich (Grundspiel ohne Schalter)
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13
- Fehlt heute: Startbedingungen sind fest (`src/sim/world.ts:102-123`); Schulden gibt es nur als Kassenstand, ohne Zins und Frist (Darlehen I-094 verworfen, N-101).
- Randfälle: «Schuldbrief» gegen Bankrott (gilt die bestehende Regel bei leerer Kasse?), «Karge Heimat» darf das Ziel nicht unmöglich machen (Rechnung je Szenario). Entartung: Szenario mit «Alles frei» umgehen, daher feste Freischaltung je Szenario.
- Doppelung: I-094 (verworfen, Darlehen als Dauerangebot; hier nur Startlage), I-048 (Zukauf-Aufschlag), I-018 (geparkt, Story-Rahmen), I-017 (geparkt, Auftragsreihe Seefahrt). Beleg: `rg -n -i "Szenario" docs/ideen.md docs/ideen-archiv.md` → 1 Treffer (Archiv Z. 572, I-048, kein Modus); Erweiterung 1 → 0 Treffer.
- Bewertung lead-design: Der einzige Weg, Geld wieder knapp zu machen, ohne die Grundpartie umzubauen (R722). Das Muster «Szenario ohne Wirtschaft» (R3) wird vermieden, weil jede Startbedingung eine Kette oder die Kasse trifft.
- Nutzen/Aufwand: frühe, harte Entscheidungen bei jedem Neustart · M · ≈ 3 Pakete plus je Szenario eine Rechnung
- Entscheid: R864 eingeplant: Teil «Modus Inselproben» (ein Szenario als Prüfling)

### I-194 · bewertet (N-104) · Erweiterung «Neue Ufer» (Entdeckung und kalte Insel)

- Bereich: Inhalt · Säule: Insel besiedeln (Archipel) · Quelle: TIEFE-1 Recherche R3 «neue Region mit eigener Kette» (meistgelobt), «Sammeln und Erkunden» · Herkunft: vom Studio vorgeschlagen · Gruppe: **Erweiterung**
- Spielerwirkung: „Der Spieler deckt per Expedition den Nebel hinter dem Kartenrand auf, findet eine kalte Nordinsel, deren Siedler Wärme brauchen, und baut dort eine zweite kleine Stadt mit eigener Kette."
- Mechanik: Skizze in `docs/superpowers/specs/2026-10-23-tiefe-1-skizzen.md` §2: Seekarte mit Nebel, Expeditionen (I-189), Nordinsel mit Klimaregel (Wärme als Grundbedürfnis), eigene Kette (Tran, Pelz), Fundstück-Sammlung, Ziel «Zwei Reiche».
- Grösse: L (Erweiterung, 3–4 Meilensteine) · Risiko: Save, Baseline (nur hinter Ziel 3), Perf (Nebel, zweite Stadt), Art (Klima-Tönung, neue Sprites)
- Raster: Spass 3 · Passung 3 · Aufwand 1 · Risiko 1 = 11
- Fehlt heute: Inseln fest erzeugt (`src/sim/defs/sea.ts`, `src/sim/world.ts:87`), kein Klima, keine Erkundung.
- Doppelung: I-038 (geparkt, Erkundungsfahrt), I-036 (geparkt, Wrack), I-189 (Baustein), Erweiterung 1 §10 (Erkundung, Nebel, neue Inseln ausdrücklich ausgeschlossen, also kein Doppel). Beleg: `rg -n -i "Expedition|Nebel|Klima" docs/ideen.md docs/ideen-archiv.md` → 0 Treffer; I-038 über «Erkund».
- Bewertung lead-design: Das Thema, das Spieler an Erweiterungen am meisten loben. Es ruht auf Werft und Flotte der Erweiterung 1 und passt zum ruhigen Ton. Kandidat für die Erweiterung nach «Stände und Segel».
- Nutzen/Aufwand: neue Spielphase mit neuer Frage («wie versorge ich ein anderes Klima?») · L · ≈ 12–16 Pakete
- Entscheid: R864 offen: Nutzerentscheid N-104 (Reihenfolge der Erweiterungen), Empfehlung Erweiterung 2

### I-195 · bewertet (N-104) · Erweiterung «Ernte und Frost» (Jahreszeiten)

- Bereich: Inhalt · Säule: Produktionsketten · Quelle: TIEFE-1 Recherche R1 1.8 (Gleichgewicht kippen), R3 «Wetter als Zustandswechsel, kein Dauerzustand» · Herkunft: vom Studio vorgeschlagen · Gruppe: **Erweiterung**
- Spielerwirkung: „Der Spieler sieht den Herbst kommen, füllt Lager mit Fisch und Brennholz und stellt eine Route auf Weidenau um, weil im Winter die Felder daheim ruhen."
- Mechanik: Skizze §3: Jahr aus vier Zeiten zu je 6 min, Winter mit ruhenden Feldern, Fang −50 % und neuem Bedarf Brennholz; Herbst mit Ernte ×1,5; Speicher als Bau; Fremdinseln mit eigenem Klima. Schalter «Jahreszeiten an/aus» bei Neuer Insel.
- Grösse: L · Risiko: Save, Baseline (mit Schalter «an» alle Pins neu; «aus» bitgleich), Art (Tönung, Schnee)
- Raster: Spass 3 · Passung 3 · Aufwand 1 · Risiko 1 = 11
- Fehlt heute: Wetter nur als Darstellung (`src/render/weather.ts`), Erzeugung ohne Zeitbezug.
- Doppelung: I-076 (verworfen, Missernte als Krise ohne Wahl; hier vorhersehbar und planbar), I-184 (verworfen, Lagerverderb), I-049 (live, Sperrbestand als Werkzeug für Vorrat). Beleg: `rg -n -i "Jahreszeit|Winter|Brennholz" docs/ideen.md docs/ideen-archiv.md` → 0 Treffer; Erweiterung 1 → 0 Treffer.
- Bewertung lead-design: Macht das Lager und die Fremdinseln zum Werkzeug gegen einen bekannten Rhythmus statt gegen Zufall. Gefahr nach R3: Pflicht-Umbau des Bestehenden. Darum nur mit Schalter, Standard offen (Nutzerentscheid, falls «an»).
- Nutzen/Aufwand: das Plateau verschwindet, weil der Rhythmus nie ruht · L · ≈ 10–14 Pakete
- Entscheid: R864 offen: Nutzerentscheid N-104, Empfehlung dritte Erweiterung

### I-196 · bewertet (N-104) · Erweiterung «Gelehrte und Gilden» (Wissen und Erfindungen)

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: TIEFE-1 Recherche R3 «Regierung und Richtlinien», «neue Entscheidung statt mehr Arbeit»; R1 1.6 (Forschung erschöpft) · Herkunft: vom Studio vorgeschlagen · Gruppe: **Erweiterung**
- Spielerwirkung: „Der Spieler baut die Schule zur Akademie aus, sammelt Wissen aus Bürgern und Kaufleuten und muss sich zwischen der Gilde der Seefahrer und der Gilde der Glasmacher entscheiden, weil jede eine andere Regel ändert."
- Mechanik: Skizze §4: Wissen als dritte Grösse neben Geld und Ruf, Erfindungsbuch mit drei Ästen, je Ast eine Gilde mit exklusiver Regeländerung, Gelehrten-Haus als Seitenstand ohne Steuer.
- Grösse: L · Risiko: Save, Baseline (nur nach Ziel 3), Balancing (Regeländerungen)
- Raster: Spass 3 · Passung 2 · Aufwand 1 · Risiko 1 = 10
- Fehlt heute: Schule nur als Dienst (`src/sim/defs/buildings.ts`, `school`), Rat wählt einmalig je Stufe (`src/sim/defs/council.ts`).
- Doppelung: I-112 (live, Rat), I-153 (eingeplant, Seerecht), I-187 (Ruf als zweite Währung, Konkurrenz), Erweiterung 1 O8/K5. Beleg: `rg -n -i "Wissen|Forschung|Erfindung|Gelehrt|Gilde" docs/ideen.md docs/ideen-archiv.md` → 0 Treffer; `rg -n -i "Zunft"` → nur Ratsbeschluss-Entwurf «Zunftrecht» (I-112, I-138) und I-143 (Verwaltungsaufschlag); Erweiterung 1 → 0 Treffer.
- Bewertung lead-design: Gute Wahl-Mechanik, liegt aber nah am Rat (einmalige Beschlüsse). Der Eigenwert ist kleiner als bei I-194 und I-195. Ein Teil (dritte Grösse) kann auch I-187 tragen.
- Nutzen/Aufwand: Spätspiel mit Bauplan-Entscheidungen · L · ≈ 10–12 Pakete
- Entscheid: R864 offen: Nutzerentscheid N-104, dritter Kandidat

### I-197 · eingeplant (R878, Plan R878) · Kartennummer wählen (Karte eintippen)

- Bereich: Bedienung · Säule: Insel besiedeln · Quelle: IDEEN-17 Scout A; Genre-Mechanik «Karte teilen» (Recherche TIEFE-1 §3, [Q26–Q28]); `src/ui/menu.ts:125` zeigt nur `Karte ${a.seed()}`, keine Eingabe; `rg -n -i "karte.*eingeb|Seed eingeben" docs/ideen.md docs/ideen-archiv.md README.md src/ui/` kein Treffer
- Spielerwirkung: „Der Spieler tippt bei «Neue Insel» eine Kartennummer ein und spielt dieselbe Insel wie ein Freund oder wie in der letzten Partie, nur mit anderem Ziel oder anderer Krisenstufe." Leer heisst Zufall wie bisher.
- Mechanik: Zahlenfeld im Neue-Insel-Block; `createWorld(seed, opts)` nimmt die Nummer schon an (`src/sim/world.ts:102`). Weicht `seedUsed` ab, zeigt das Feld die genutzte Nummer. Gültiger Bereich wie heute 0 … 99 999 (`src/ui/app.ts:326`), Eingabe ausserhalb mit Hinweis abgewiesen. Keine Sim-Regel ändert sich.
- Grösse: S · Risiko: keins (kein Save, Baseline unberührt)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12 (lead-design: bestätigt)
- Doppelung: I-190/I-191 setzen feste Nummern bzw. das Datum; die Spec Inselproben schliesst Änderungen an «Neue Insel» ausdrücklich aus (§13, `design/modus-inselproben`). Keine freie Eingabe im Pool oder Archiv.
- Bewertung lead-design: kleinster Weg zu Wiederspielwert mit Vergleich, auch ohne die Proben nützlich. Dateinähe zu den Inselproben (`menu.ts`, `app.ts`): nach deren UI-Task bauen.
- Nutzen/Aufwand: dieselbe Karte mit anderem Ziel, Teilen unter Spielern · S · ≈ 40 Tools
- Entscheid: R878 eingeplant: Kurzdesign `design/i197-i201` (Gate Spec BEDENKEN eingearbeitet), Plan `plan/i197-kartennummer` Gate Plan OK; K4 «Partiebrief» als I-197b (R881)

### I-201 · eingeplant (R878, Plan R881) · Festanlass (drei Arten Fest, zweite Zutat)

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-17 Scout B; Genre-Mechanik Wahl mit Zweitkosten; TIEFE-1 Tabelle 1.8 (Plateau braucht wiederkehrende Entscheidung); Fest hat genau eine Wirkung (`src/sim/feast.ts:69-80`, `src/sim/population.ts:152`, Werte `src/sim/defs/timing.ts:60-64`: 10 Rum, 600 Ticks, Abklingzeit 1800); `rg -n -i "Anlass|Erntefest|Festart" docs/ideen.md docs/ideen-archiv.md` kein Treffer
- Spielerwirkung: „Der Spieler wählt beim Fest in der Kapelle zwischen «Aufstiegsfest» (wie heute), «Erntefest» (Betriebe im Wirkkreis schneller, kostet zusätzlich Tuch) und «Hafenfest» (Schiffe im Wirkkreis laden schneller) und wägt im Spätspiel alle drei Minuten ab, welches er feiert."
- Mechanik: `FEAST_KINDS` als Defs (Rum plus zweite Ware, Wirkung, Dauer); `holdFeast(world, id, kind)` prüft beide Waren, `{ ok: false, reason }` ohne Ware; Aufstiegsfest unverändert.
- Grösse: S · Risiko: Save (`feastKind`); Baseline bitgleich, solange der Controller kein Fest hält
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11 (lead-design: bestätigt)
- Doppelung: I-007 (live, Fest), I-146 (Wirkkreis sichtbar), I-141 (verworfen R776: Festbetrieb gegen Geld; hier Warenpreis statt Geld, also nicht derselbe Einwand).
- Bewertung lead-design: einzige Idee der Runde mit wiederkehrender Spätspiel-Wahl und Warenpreis statt Geld (R722). Offen ist, ob eine Art dominiert (Erntefest immer, wenn Tuch reicht); 10 Rum ist im Spätspiel kein Preis. Vor dem Kurzdesign rechnen.
- Nutzen/Aufwand: wiederkehrende Entscheidung mit Güterpreis · S · ≈ 60 Tools plus Rechnung
- Entscheid: R878 Rechnung, danach Spec I-201 (R880 nachgebessert); Plan `plan/i201-festanlass` abgenommen (R881)

### I-209 · bewertet · Seegang (Härteleiter, im Sieg freigespielt)

- Bereich: Inhalt, Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: TIEFE-2 K1 (`docs/superpowers/specs/2026-10-25-tiefe-2-recherche.md` §3, Belege A-2, A-3, A-6, Quellen [S2]–[S5]); Genre-Mechanik «gestufte Härte, Stufe n+1 erst nach Sieg auf Stufe n»; nimmt I-198 Gelübde auf (R881, T2-2); `rg -n -i "seegang|difficulty|hardness" src/` kein Treffer, Krisenstufen nur `off`/`mild`/`normal` (`src/sim/defs/crises.ts:4-8`)
- Spielerwirkung: „Der Spieler hat die Gewürzstadt auf Seegang 2 geschafft und will jetzt wissen, ob er auf Seegang 3 ohne Zukauf bis Ziel 2 durchkommt."
- Mechanik: Fünf Stufen bei «Neue Insel», jede legt **eine** lesbare Regel auf die vorige (Vorschlag, Werte als Def-Tabelle `src/sim/defs/`): 1 Zukauf am Kontor ×1,5 · 2 Lager −25 % (`STORAGE_CAP` 100 → 75, `goods.ts:84`) · 3 kein Zukauf bis Ziel 2 (Inhalt I-198) · 4 Startgeld halb · 5 Unterhalt +20 %. Stufe n+1 öffnet sich mit Ziel 3 auf Stufe n; «Frei» (eigene Regler) bleibt offen und wertet nicht. Die höchste bestandene Stufe steht im Ehrenbuch (live REL-32) und im Teilen-Text (I-197b). Keine Stufe gibt einen Vorteil (R864, T2-1).
- Grösse: M · Risiko: Save (Weltfeld `seegang: 0–5`, +1, Migration auf 0); Baseline unberührt (Stufe 0 bitgleich)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11 (lead-design; TIEFE-2 Rang 1)
- Randfälle: Lösbarkeit je Stufe ungerechnet (Stein-Engpass früh, siehe I-198); eine Stufe «Krisen hoch» fällt weg, weil I-133 «stürmisch» gerechnet trivial war (3 Feuerwachen halten ≥ 93 %, R745). Entartung: Spieler wählt nur «Frei» → wertet nicht, kein Schaden. Höchste Stufe liegt neben dem Spielstand wie die Ehrenbuch-Ablage, nicht im Save.
- Doppelung: I-198 (zusammengefasst hierher), I-192 Knappe Zeiten (feste Szenario-Startlage, eingeplant Inselproben; Seegang ist frei kombinierbar mit jeder Karte), I-133 (verworfen), I-193 Bewährung (geparkt, Endlos, bleibt getrennt), Krisenstufe (live, bleibt eigener Regler).
- Bewertung lead-design: stärkster Wiederspiel-Hebel ohne neuen Inhalt: alle Regeln sind Faktoren auf vorhandene Werte. Vor dem Kurzdesign eine Lösbarkeitsrechnung je Stufe (`design-economy-designer`), Wiederverwendung der Startbedingungs-Schalter aus Inselproben.
- Nutzen/Aufwand: zweite bis fünfte Partie mit eigenem Ziel · M · ≈ 3 Pakete (Defs und Sim-Schalter, Neue-Insel-UI, Ablage und Ehrenbuch-Anschluss) plus Rechnung
- Entscheid: offen (IDEEN-18), Empfehlung Rechnung, dann Spec (Stufe voll, neue Spielwerte), nach Inselproben-Merge

### I-210 · bewertet · Bittschrift (Bitte mit zwei Antworten und spätem Nachspiel)

- Bereich: Inhalt, Bedienung · Säule: Bevölkerung versorgen und aufsteigen lassen; Wirtschaft · Quelle: TIEFE-2 K3 (`docs/superpowers/specs/2026-10-25-tiefe-2-recherche.md` §3, Beleg B-1, Quellen [S12]–[S15]); Genre-Mechanik «Ereigniskarte mit zwei Antworten, Folge sichtbar, Nachspiel verzögert»; `rg -n -i "petition|bittschrift" src/` kein Treffer
- Spielerwirkung: „Der Spieler überlegt, ob er jetzt 20 Stoff hergibt, damit in acht Minuten 15 Bürger zuziehen, obwohl sein Lager knapp ist."
- Mechanik: Ab Ziel 1 etwa alle 10 min (seeded eigener Strom, ADR-010) eine Karte mit «Ja»/«Nein»; beide Folgen stehen auf der Karte (zum Beispiel «Ja: −20 Stoff jetzt · in ≈ 8 min Zuzug +15 Bürger», «Nein: nichts · Kapellen-Fest −1 für 10 min»). Die Antwort setzt eine Marke, ein Folgeereignis löst sie ein (Dank oder Klage, Eintrag in der Chronik). Ohne Antwort nach 2 min gilt «Nein». Lohn ist Wachstum, Zeit oder Fest, **nie Geld** (R722). 8–12 Bitten als Def-Tabelle. Schalter wie bei der Krisenstufe: Welt-Standard aus (Baseline bitgleich), neue Partie an.
- Grösse: M · Risiko: Save (Weltfeld offene Marken, +1); Baseline unberührt über den Welt-Standard «aus»
- Raster: Spass 3 · Passung 2 · Aufwand 2 · Risiko 2 = 12 (lead-design; TIEFE-2 Rang 3)
- Randfälle: Ware fehlt beim «Ja» → Antwort gesperrt mit Grund (`{ ok, reason }`), nicht teilweise; Abriss des betroffenen Gebäudes vor dem Nachspiel → Marke verfällt ohne Folge; zwei offene Marken höchstens, sonst kommt keine neue Bitte; Pause hält die 2-min-Frist an. Entartung: «Ja» dominiert immer → je Bitte eine Dominanz-Prüfung vor dem Kurzdesign; «Nein» darf nie eine Krise auslösen (Ton).
- Doppelung: Rat und Stadtrecht (einmalige Sofort-Wahl, live/geplant), Auflagen (I-162/I-163, «wie viel», befristet), I-201 Festanlass (Fest als Lohn, verträglich), I-018 Story-Rahmen (geparkt, §5.3; Bittschrift bleibt Wirtschaftsentscheid mit Kurztext), B-4 Interessengruppen (TIEFE-2 ausgeschieden, Ton).
- Bewertung lead-design: einzige neue Spätspiel-Achse ohne harte Abhängigkeit; macht die stabile Stadt wieder zur Abwägung zwischen Lager und Wachstum. Kartenformat mit «Neue Ufer» N4 teilen, Inhalt trennen.
- Nutzen/Aufwand: stabile Stadt entscheidet wieder · M · ≈ 3 Pakete (Sim-Strom und Marken, Karte und Chronik, Inhalt mit Rechnung)
- Entscheid: offen (IDEEN-18), Empfehlung Dominanz-Rechnung (`design-economy-designer`), dann Spec (Stufe voll)

### I-211 · bewertet · Funkenflug (Brand springt auf dichte Nachbarn)

- Bereich: Inhalt · Säule: Insel besiedeln (Stadtplanung); Bevölkerung versorgen · Quelle: IDEEN-18 Scout; Genre-Mechanik Brandausbreitung nach Abstand und Trennstreifen (Hintergrund Brandschutz-Forschung, nur Mechanik: https://firedoc.nist.gov/article/gngzXYQBWEcjUZEYgDd7); heute trifft ein Brand genau ein Gebäude (`src/sim/crises.ts:153` `fireTarget`, Schutz `crises.ts:176` `isProtected`); `rg -n -i "spread|ausbreit" src/sim/` kein Treffer
- Spielerwirkung: „Der Spieler lässt zwischen brennbaren Betrieben Lücken oder baut früher eine Wache, weil ein Brand sonst auf die Nachbarn überspringt."
- Mechanik: Je brennbarem, ungeschütztem Nachbarn mit Chebyshev-Abstand 1 zur Grundfläche des Ziels springt der Brand mit 50 % (seeded RNG) über, höchstens 2 Zusatztreffer je Brand; Ausfall wie bisher (`FIRE_OUTAGE`). Panel-Hinweis «2 Nachbarn gefährdet». Werte als Defs in `src/sim/defs/crises.ts`.
- Grösse: S · Risiko: keins für Save (Ausfall liegt schon im Gebäude); Baseline unberührt, weil `createWorld` ohne Krisen startet (`DEFAULT_WORLD_CRISIS_LEVEL` `off`, `crises.ts:10`)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12 (Scout 13; lead-design: Passung 3 → 2, Risiko 2 → 3 wegen Welt-Standard ohne Krisen)
- Randfälle: Kettenreaktion ausgeschlossen (Zusatztreffer springen nicht weiter); Wache in Reichweite schützt auch Nachbarn; Abriss während Brand wie heute.
- Doppelung: I-080 (verworfen, Brunnen als Teilschutz), I-133 (verworfen, R745: drei Wachen halten ≥ 93 %), I-181/I-034 (geparkt bis Krisen-Überarbeitung, R864), I-128 Lärm (andere Wirkung).
- Bewertung lead-design: billig und sauber, aber **keine echte Wahl**: Die Wache löst Brände heute schon fast vollständig (I-133), Funkenflug macht sie nur früher Pflicht. Dicht bauen wird erst eine Abwägung, wenn Dichte einen Lohn hat (I-212) oder Wachen knapp sind.
- Nutzen/Aufwand: Brand wird Planungsfrage statt Zufall · S · ≈ 40 Tools
- Entscheid: offen (IDEEN-18), Empfehlung parken als Baustein der Krisen-Überarbeitung (mit I-181, I-034), gemeinsam mit I-212 prüfen

### I-212 · bewertet · Werkstattreihe (gleiche Betriebe Seite an Seite)

- Bereich: Inhalt · Säule: Produktionsketten; Insel besiedeln · Quelle: IDEEN-18 Scout; Genre-Mechanik Nachbarbonus und Platzierungsrätsel (https://www.balancingmonkeygames.com/articles/grass-and-adjacency, nur Mechanik); `cycleOf` kennt keine Nachbarn (`src/sim/levels.ts:40`), `adjacent` nur als Standortregel (`src/sim/placement.ts:79`)
- Spielerwirkung: „Der Spieler setzt drei Webereien in eine Reihe, weil jede Nachbarin den Zyklus verkürzt, und nimmt dafür Lärm im Wohnviertel und Brandgefahr in Kauf."
- Mechanik: Je Betrieb gleichen Typs, der Seite an Seite angrenzt: Zyklus −5 %, höchstens −15 % (3 Nachbarn); nur Betriebe mit `produces`; abgeleitet bei Bau und Abriss, kein Save-Feld. Panel «Reihe 2 · Zyklus −10 %».
- Grösse: M · Risiko: Baseline und Balancing (Controller-Platzierungen ändern Zyklen, Neumessung per Ruling)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10 (Scout 13; lead-design: Spass 3 → 2, Risiko 2 → 1)
- Randfälle: Abriss eines Mittelstücks senkt beide Nachbarn sofort; Rohstoffbindung (Küste, Wald, Berg) begrenzt die Reihe von selbst; ohne Gegenpreis ist der Bonus Pflicht.
- Doppelung: I-008 Standortgüte (geparkt, Bonus sinkt mit Nachbarbebauung, Gegenrichtung), I-077 Spezialisierung (geparkt), I-128 Lärm (Gegengewicht, eingeplant Stadtplanung).
- Bewertung lead-design: Allein ein Rabatt ohne Gegenpreis (R722-Massstab). Erst mit I-128 Lärm und I-211 Funkenflug entsteht die Abwägung «dicht und schnell gegen sicher und ruhig». Gehört in ein Stadtplanung-Folgebrainstorming, nicht als Einzelpaket.
- Nutzen/Aufwand: Platzierung wird Rätsel · M · ≈ 2–3 Pakete plus Neumessung
- Entscheid: offen (IDEEN-18), Empfehlung parken als Paar mit I-211 bis I-128 Lärm live ist

### I-213 · bewertet · Fuhrweg (Weg zum Kontor kostet Zeit)

- Bereich: Inhalt · Säule: Produktionsketten; Insel besiedeln · Quelle: IDEEN-18 Scout; Genre-Mechanik Transportdistanz (Community-Berichte, unsicher: https://settlers2.net/guides/roads/); `src/sim/connect.ts:50-97` liefert nur Anbindung ja/nein, `rg -n -i "distance|dist" src/sim/production.ts` kein Treffer
- Spielerwirkung: „Der Spieler setzt Kontor und Marktplatz in die Mitte seiner Betriebe, weil weit entfernte Betriebe spürbar langsamer liefern."
- Mechanik: Strassenweg vom Betrieb zum Kontor in Kacheln: Zyklus +5 % je 8 Kacheln, höchstens +20 %; Panel «Weg 24 · +15 %»; zweites Kontor oder Marktplatz rückt die Mitte.
- Grösse: M · Risiko: Baseline und Balancing (Zyklen länger), Perf (Wegsuche bei Bau/Abriss)
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 1 = 9 (Scout 10; lead-design: Passung 3 → 2)
- Randfälle: Inseln mit Kontor am Rand bestrafen die Karte statt die Planung; Rohstoffbetriebe sind ortsgebunden und können nicht näher rücken → Strafe ohne Ausweg.
- Doppelung: I-061 Marktplatz-Reichweite über Wege (eingeplant, Stadtplanung; Wegenetz für Versorgung), I-004 Lagerhaus (geparkt), I-050 Arbeitskräfte (geparkt).
- Bewertung lead-design: reine Strafe für Kartenpech, solange Rohstoffbetriebe ortsgebunden sind; die Wegenetz-Achse besetzt I-061 schon. Kein Spielerlebnis, das nicht Stadtplanung zuerst liefert.
- Nutzen/Aufwand: Wegnetz bekommt Gewicht · M · ≈ 3 Pakete plus Neumessung
- Entscheid: offen (IDEEN-18), Empfehlung verwerfen (Strafe ohne Ausweg, Achse durch I-061 besetzt)
