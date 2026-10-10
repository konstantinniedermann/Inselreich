# Ideen-Pool

Zweck: Sammelstelle für Funktionsideen des Studios (Discovery-Strang, E-027). Der Pool ist ein
Produktdokument neben `docs/beobachtungen.md`. Eigentümerin ist `lead-design`; `design-idea-scout` trägt
neue Ideen ein. Regeln des Ablaufs: Handbuch `docs/studio/STUDIO.md`.

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

## Rangliste IDEEN-06 (Vorschlag lead-design, Ruling L0 offen)

IDEEN-05 ist mit R448 entschieden. Sortiert nach Raster-Summe, bei Gleichstand nach Nutzen je Aufwand. Keine Idee ändert
Kernsäule, Genre oder Titel (§5.3). Gestrichen (Bestätigung im Runden-Ruling): I-046, I-053, I-060 neu; I-037, I-040 alt.
Zusammengefasst: I-054 → I-014, I-024 → I-059. Offene Ideen danach: 37 von 40.

| Rang | ID    | Name                              | Grösse | Summe | Save / Baseline           | Nutzen/Aufwand                                       | Empfehlung                       |
| ---- | ----- | --------------------------------- | ------ | ----- | ------------------------- | ---------------------------------------------------- | -------------------------------- |
| 1    | I-056 | Entf-Taste reisst Markiertes ab   | S      | 13    | nein / nein               | jeder Umbau kürzer, risikofrei, ≈ 70 Tools mit I-057 | einplanen nächstes Release       |
| 2    | I-048 | Zukauf-Aufschlag (Kaufsättigung)  | S–M    | 12    | ja / ja (Neumessung)      | Bauen statt Kaufen wird Wahl, ≈ 1–2 Pakete           | einplanen Wirtschafts-Baustein   |
| 3    | I-057 | Schnellspeichern `Strg`/`Cmd`+`S` | S      | 12    | nein / nein               | Genre-Standard, im Häppchen mit I-056                | einplanen mit I-056              |
| 4    | I-049 | Sperrbestand (Reserve je Gut)     | S      | 12    | ja / nein (Standard 0)    | Holz bleibt zum Bauen, ≈ 90 Tools                    | mit nächster Save-Änderung (v12) |
| 5    | I-050 | Arbeitskräfte                     | L      | 12    | ja / ja                   | tiefste Wahl, aber Meilenstein                       | parken (Brainstorming nach M13)  |
| 6    | I-047 | Stammkunde (Liefervertrag)        | M      | 11    | ja / nein                 | Planbarkeit für Fortgeschrittene, ≈ 2 Pakete         | parken (Handels-Brainstorming)   |
| 7    | I-059 | Sammelausbau gleicher Betriebe    | S–M    | 11    | nein / nein               | Mittelspiel weniger Klicks, ≈ 90 Tools               | parken (Playtest-Anlass)         |
| 8    | I-058 | Pause bei Krise                   | S–M    | 11    | nein / nein               | Entlastung bei 4×, ≈ 80 Tools                        | parken (Playtest-Anlass)         |
| 9    | I-055 | Fischreiche Insel                 | S–M    | 10    | ja / ja (Weltgenerierung) | Grund für zweite Kolonie, trägt erst mit mehr Inseln | parken (Archipel)                |
| 10   | I-051 | Park als Wohnwert                 | M      | 10    | evtl. / nein              | läuft in die Stapelregel, heute wirkungslos          | parken (Stadtplanung)            |
| 11   | I-052 | Einwandererschiff                 | M      | 9     | ja / ja (eigener Strom)   | Atmosphäre ohne Wahl                                 | parken (Krisen-Überarbeitung)    |

## Ideen

### I-001 · live · Anbinden auf Knopfdruck — R210 → H-U1, live mit REL-03 (R232)

### I-002 · live · Meldung führt zum Ort — R210 → H-U2, live mit REL-01 (R216)

### I-003 · geparkt · Baustelle statt Sofort-Gebäude

- Bereich: Grafik · Säule: Insel besiedeln · Quelle: Genre-Mechanik: Neue Gebäude erscheinen kurz als Baustelle mit Gerüst und Staub, bevor sie fertig stehen; reine Darstellung, die Sim baut weiter sofort (Pfad `src/render/`, Programm Nutzerfeedback G6/G7 Richtung „lebendige Insel", nicht doppelt)
- Spielerwirkung: „Der Spieler sieht jedes neue Gebäude etwa anderthalb Sekunden als Baustelle mit Staubwolke aufwachsen und bekommt so zu jedem Klick eine sichtbare Antwort."
- Grösse: S · Risiko: Perf (Zeichner merkt sich je Gebäude den Erstkontakt; Obergrenze in `CAPS`, kein Schreiben in die Welt, Picking unverändert)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11
- Bewertung lead-design: bestätigt, nicht gepitcht (Deckel 2 je Runde). Randfälle: nach Laden und „Neue Insel" darf keine Baustelle erscheinen; Zusammenspiel mit Sprite-Cache (H-R6) und `bodyPolygons`. Kandidat für den Studio-Platz eines späteren Release oder den M9-Rest (lead-art).
- Entscheid: R210 → geparkt bis Stilrahmen ART-STIL-01 (Grafik-Strang lead-art)

### I-004 · geparkt · Lagerhaus

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik: Ein Lagergebäude hebt die Lagerobergrenze; Pfad `README.md` („Lager: höchstens 100 je Gut, Zustand «Lager voll»")
- Spielerwirkung: „Der Spieler entscheidet, ob er überschüssige Ware sofort billig verkauft oder mit einem Lagerhaus (Geld und Unterhalt) auf Aufträge, Boom oder den nächsten Aufstieg aufspart."
- Grösse: M · Risiko: Save und Baseline (Lagergrenze wird aus Gebäuden abgeleitet, Controller baut es nicht; Abstimmung mit „Lager je Insel" in M12 nötig)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Bewertung lead-design: Risiko 2 → 1, weil Save und Baseline zugleich berührt sind (Raster: mehrere = 1). Wahl-Bedenken: Aufträge verlangen höchstens 40, die Sättigung erholt sich 1 %/s; ein reines Grenz-Plus wäre ab mittlerem Spiel eine dominante Pflichtinvestition. Stärker als räumliches Lager (zweiter Sammelpunkt, Anbindung im Inland) — das gehört zu „Lager je Insel" und mehreren Startpunkten in M12. Baustein fürs M12-Brainstorming.
- Entscheid: R210 → geparkt bis M12-Brainstorming (Lager je Insel)

### I-005 · live · Arbeitsgeräusche der Betriebe — R219 → kleine Fassung in H-A2, live mit REL-02 (R222); volle Fassung (M) nicht weiter verfolgt

### I-006 · geparkt · Händler-Sonderangebot

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik: Ein durchreisender Händler bietet zeitlich begrenzt ein Gut unter dem Kaufpreis an; Pfad `README.md` („Kaufpreise sind fest", „Waren dafür zuzukaufen lohnt sich nie": Zukaufen ist heute nie eine Entscheidung)
- Spielerwirkung: „Der Spieler sieht auf der Auftragskarte ein befristetes Angebot («Werkzeug −30 % · noch 0:40 · höchstens 10») und entscheidet, ob er Geld jetzt in Vorrat steckt, statt es zu bauen."
- Grösse: M · Risiko: Save und Baseline (Angebot als Weltzustand mit Ablauf; Ziehung über den seeded RNG, Controller nutzt es nicht; Strom darf die Auftragsziehung nicht verschieben)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Angebotspreis liegt über dem Verkaufspreis → Kaufen-und-Verkaufen darf nie Gewinn bringen (Rabatt höchstens −30 %, Verkauf bleibt 40 % des Kaufpreises, Höchstmenge je Angebot); Lager voll oder Geld negativ → Knopf blass mit Grund; Angebot und Auftrag laufen zugleich → beide Karten bleiben lesbar.
- Doppelung: keine; Aufträge (Verkauf an Händler) und Boom (Verkaufspreis) existieren, die Kaufseite ist unberührt. Handelsrouten (M12) sind Schiffsverkehr, nicht dieses Zufallsangebot.
- Bewertung lead-design: Spass 3 → 2: Billig-Vorrat ist eine kleine Abwägung, die Lagergrenze 100 deckelt sie. **Entartung:** −30 % bricht die Regel „Zukaufen für Aufträge lohnt nie“ (Stoff 21 < Prämie 22, Rum 28 < 30, Glas 35 < 37, Stein 10,5 < 11); sicher ist höchstens −20 % (engste Spanne Nahrung, Wolle, Zuckerrohr, Rum: Prämie = 75 % des Kaufpreises). Einfachere Variante: vierte Krisenart „Schnäppchen“ im vorhandenen Krisen-Pool (Karte, Ziehung, Restzeit vorhanden) — ändert aber die Krisenverteilung und damit `balance-crises.test.ts`. Baustein fürs M12-Brainstorming (Handel), nicht gepitcht.
- Entscheid: R219 → geparkt fürs M12-Brainstorming (Handel; Rabatt ≤ 20 %)
- Nachtrag IDEEN-04 (E6 aus R352): bleibt geparkt; Spec-Fassung E6 (`anhang-03`, Save v10) ist ein Händlerschiff mit Angebot, Wirkung wie oben bewertet; gemeinsam mit I-029 im Handels-Brainstorming denken.

### I-007 · live · Fest in der Kapelle — R219 → Studio-Platz REL-04, live mit REL-04 (R244)

### I-008 · geparkt · Standortgüte der Betriebe

- Bereich: Inhalt · Säule: Produktionsketten · Quelle: Genre-Mechanik: Die Lage eines Betriebs bestimmt seine Ausbeute; Pfad `README.md` (Standortregeln der Tabelle „Produktionsketten" sind heute nur Mindestwerte: «mind. 16 freie Graskacheln»), `src/sim/defs/buildings.ts`
- Spielerwirkung: „Der Spieler sieht beim Platzieren einer Rinderfarm, Schäferei oder Jagdhütte «Standort: gut / mittel» (zusätzliche freie Kacheln über dem Minimum geben bis +25 % Ausstoss) und sucht die beste Stelle, statt die erstbeste zu nehmen."
- Grösse: S · Risiko: Baseline (Controller baut diese Betriebe → Fingerabdruck und Sieg-Zeit ändern sich; Neumessung per Ruling nötig); ersatzweise nur Vorschau ohne Bonus (risikofrei)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: Betrieb mit Bonus in dichter Stadt → Bonus sinkt, wenn Nachbarn die Kacheln bebauen (Anzeige im Panel muss mitgehen, sonst Fehlinformation); Roden/Aufforsten verändert die Güte → gewollt, aber im Panel erklären; Dauer-Optimierer baut nur auf Maximalgüte → Obergrenze +25 % hält die Wirkung klein.
- Doppelung: keine; G7 Wildlife und S3 Roden ändern nicht den Ausstoss; „Kein freier Wald in der Nähe" ist ein Stillstand, keine Abstufung.
- Bewertung lead-design: Aufwand 3 → 2: Bonus heisst Balancing-Neumessung, Anpassung des Controllers, Platzier-Vorschau und Panel-Anzeige (2 Pakete, nicht 1 Häppchen). Die Wahl Fläche gegen Ausstoss ist gut, aber der Bonus von +25 % auf Nahrung und Wolle verschiebt die Bilanz je Einwohner — gehört in ein Balancing-Paket mit `design-economy-designer`. Die Vorschau ohne Bonus allein ist Bedienung ohne Entscheidung. Baustein für ein späteres Wirtschafts-Brainstorming (M12 verteilt Betriebe auf neue Inseln, dort wird Standortwahl ohnehin neu gedacht), nicht gepitcht (Deckel 2).
- Entscheid: R219 → geparkt fürs M12-/Wirtschafts-Brainstorming (Balancing-Neumessung)

### I-009 · live · Hörbarer Mangel — R219 → H-A2 „Hörbare Wirtschaft“, live mit REL-02 (R222)

### I-010 · live · Drittes Ziel «Gewürzstadt» — R238/R239 → Zusatz zum M12-Seefahrt-Bündel (80 Kaufleute, 60 s gehalten), live mit Save v9

### I-011 · geparkt · Hauswunsch

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik: Einzelne Bewohner äussern Sonderwünsche, deren Erfüllung belohnt (Gespür für «Persönlichkeit»); Pfad `README.md` (Häuser sind austauschbar, Info-Panel zeigt nur Bedürfnisse)
- Spielerwirkung: „Der Spieler sieht über einem vollen Haus der Stufe Bürger oder höher ein Sprechblasen-Symbol («Möchte 5 Glas · noch 2:00»), liefert die Ware aus dem Lager mit einem Klick und bekommt dafür 120 Geld und 5 Minuten lang +20 % Steuer von diesem Haus; er entscheidet, ob Glas für Kaufleute-Bedarf, Verkauf oder Wunsch bestimmt ist."
- Grösse: M · Risiko: Save und Baseline (Wunsch mit Ablauf am Haus, Ziehung über den seeded RNG nur je höchstens 1 Haus zugleich; Controller erfüllt keine Wünsche → Steuer-Fingerabdruck bleibt gleich, solange die Ziehung den RNG-Strom der Krisen und Aufträge nicht verschiebt, eigener Strom nötig)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Ware fehlt im Lager → Knopf blass mit Grund, Wunsch verfällt ohne Strafe; Haus wird abgerissen oder steigt auf → Wunsch endet, kein Bonus; Spieler lässt Wünsche immer verfallen → keine Strafe, nur entgangener Gewinn; Wunschware billiger zuzukaufen als der Bonus wert → Zukaufspreis (5 Glas = 250) muss über Belohnung plus Steuerbonus liegen, sonst Dauer-Zukauf (Werte mit `design-economy-designer`).
- Doppelung: keine; Handelsaufträge sind global und kommen vom Händler, dies ist lokal und kommt vom Haus. I-007 (Fest) belohnt Aufstieg per Rum, hier gibt es Einzelwünsche; beide dürfen nicht zugleich dasselbe Haus beschleunigen (Reihenfolge klären).
- Bewertung lead-design: Spass 3 → 2, weil die Belohnung in der Scout-Fassung dominiert: +20 % Steuer eines vollen
  Kaufleute-Hauses (20 × 20 je 10 s) bringen 480 Geld/min, über 5 min 2400 plus 120 — Zukauf von 5 Glas kostet 250.
  Jeder Wunsch würde immer erfüllt, notfalls zugekauft; keine Entscheidung. Geld ist im späten Spiel ohnehin
  reichlich, eine Geldbelohnung trägt dort nicht. Tragfähiger wäre eine nicht-monetäre Belohnung (Haus überspringt die
  Aufstiegs-Wartezeit), die aber I-007 (Fest) doppelt. Erst nach dem Spielurteil zu I-007 (REL-04) neu fassen.
- Entscheid: R238 → geparkt bis Spielurteil I-007 (REL-04); nicht-monetäre Belohnung neu fassen

### I-012 · geparkt · Endliche Vorkommen

- Bereich: Inhalt · Säule: Produktionsketten · Quelle: Genre-Mechanik: Rohstoffvorkommen erschöpfen sich und zwingen zum Umziehen oder Expandieren; **M12-Baustein E1/E2** (Fremdinseln mit eigenem Gebirge geben dem Erschöpfen einen Grund zum Kontor II); Pfad `README.md` (Steinbruch, Fisch und Wald sind unerschöpflich)
- Spielerwirkung: „Der Spieler sieht im Panel des Steinbruchs «Vorkommen 600 / 600 Stein» sinken und entscheidet zwischen einem zweiten Steinbruch, Zukauf (15 je Stein) oder dem Weg auf eine Fremdinsel, wenn das Gebirge an der Heimatinsel leer ist."
- Grösse: M · Risiko: Save und Baseline (Restmenge je Vorkommen im Weltzustand; Controller baut Steinbrüche → Fingerabdruck und Sieg-Zeit ändern sich, Neumessung per Ruling); nur Stein, nicht Fisch und Wald, damit der Umfang klein bleibt
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Vorkommen leer → Betrieb steht still mit klarem Grund und bleibt abreissbar, Unterhalt läuft weiter (Warnung vorab ab 20 %); Abriss und Neubau darf das Vorkommen nicht auffüllen (Rest gehört zur Kachel, nicht zum Gebäude); alle Steinvorkommen der Heimat reichen nicht für die Aufstiegsziele → Mindestmenge so wählen, dass das Siegziel ohne Fremdinsel erreichbar bleibt, sonst wird M12 Pflicht.
- Doppelung: keine; I-008 (Standortgüte) ändert Ausstoss nach Lage, dies die Menge. M12 §10 schliesst «Erz und Minen» aus, Stein im bestehenden Gebirge ist nicht davon betroffen. Bei einer Aufnahme in M12 mit E1 abstimmen.
- Bewertung lead-design: starke Rückkopplung im Sinne von M12 (Bremse daheim, Zug zur Fremdinsel), Zukauf zu 15 hält
  sie weich. Spass 3 → 2: Die Erschöpfung greift erst mit Glashütte und Aufstiegen zu Bürgern und Kaufleuten, also im
  späten Spiel. Nicht in M12 nachschieben: Die Spec ist durch die Gates (R227–R231), und es braucht Rest je Vorkommen
  im Weltzustand, Controller-Anpassung und Neumessung der Pins. Vereinfachung prüfen: Rest je Steinbruch-Standort
  (Gebirgskacheln im Umkreis), nicht je Kachel. Baustein für das Brainstorming nach M12, mit `design-economy-designer`.
- Entscheid: R238 → geparkt bis Brainstorming nach M12 (Wirtschaft)

### I-013 · verworfen · Verschleiss und Instandhaltung — R238 (Pflegen dominiert immer, reine Werkzeug-Senke; das Problem „Werkzeug ohne Entscheidung" geht ins nächste Wirtschafts-Brainstorming)

### I-014 · geparkt · Sturm auf See

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik: Wetter wirkt auf Seewege und verlangt eine Abwägung; **M12-Baustein E4** (Schiffe und Routen); Pfad `README.md` (Sturm betrifft nur Fischer, Holzfäller, Schäferei, Zuckerrohr)
- Spielerwirkung: „Der Spieler sieht bei einer Sturmwarnung am Schiff auf der Route «Hafen anlaufen» (Fahrt pausiert 30 s, Ladung sicher) und entscheidet zwischen Zeitverlust und dem Risiko, 20 % der Ladung (z. B. 2 von 10 Gewürz) zu verlieren."
- Grösse: M · Risiko: Save und Baseline (Schiffszustand «Hafen angelaufen» erst nach E4; Verlust über den seeded RNG, nicht über Zufall in der UI; Krisenverteilung bleibt unberührt, wenn der Seesturm den vorhandenen Sturm mitnutzt statt eine vierte Krisenart einzuführen, sonst `balance-crises.test.ts`)
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 1 = 9
- Randfälle: Spieler läuft immer den Hafen an → Zeitverlust 30 s je Sturm macht es zur gleichwertigen sicheren Wahl, aber nie Gewinn (kein Dominanz-Pfad, da Sturm höchstens alle 4 Minuten); Schiff ohne Ladung oder bei leerem Lager am Ziel → kein Verlust, kein Knopf; Abriss des Kontors II während der Fahrt → Schiff kehrt zurück, Ladung bleibt (Regel aus E4 übernehmen).
- Doppelung: keine; M12 enthält Schiffe und Routen, aber keinen Wettereinfluss (Piraten, Kampf, Nebel sind ausdrücklich ausgeschlossen, §10). Setzt E4 voraus; nicht vorher einplanbar.
- Bewertung lead-design: Passung 3 → 2 (stärkt Handel nur indirekt). Routen laufen automatisch, der Spieler schaut
  beim Sturm meist woanders hin; eine Abfrage je Sturm wird verpasst. Einfachere Fassung: Daueranweisung je Route
  («bei Sturm anlegen / weiterfahren»). Bei 2 von 10 Gewürz (≈ 80 Geld) gegen 30 s ist die Wahl im späten Spiel
  belanglos; trägt erst mit grösseren Ladungen. Baustein nach E4, nicht gepitcht.
- Entscheid: R238 → geparkt bis nach dem v9-Merge (E4 Schiffe und Routen); Fassung als Daueranweisung je Route prüfen
- Zusammengefasst (IDEEN-06): I-054 «Piraten bedrohen Routen» (Scout B) — Überfall statt Sturm als Routenverlust mit Gegenmittel (Route umlegen, Ladung klein halten, Begleitschiff); gleiche Stelle im Code und gleiche Abwägung, darum hier. Ohne Kampf; ein Seekampf wäre eine eigene Frage an L0 (M12 §10 schliesst Piraten und Kampf aus).

### I-015 · neu · Seefahrt-Leitsätze

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: Playtest 2026-10-06 (REL-05, wörtlich: „kein freies schiff für den transport von gewürzen zur hauptinsel. keine hilfe wie ich ein schiff bauen/kaufen/bekommen könnte“); Pfade `src/ui/guide.ts` (C.11, Z. 158–160: Leitsatz endet bei „Gründe ein Kontor auf einer Insel mit Gewürz“), `src/ui/ships.ts:118` und `src/ui/app.ts:507` (Grund „Kein freies Schiff“ ohne Weg), `src/ui/ships.ts` `buyShipView`, `README.md` Z. 368–379; Folgepaket (2) aus R274b (state.md) enthält schon „Heimatkontor-Klick → Schiffe direkt“
- Spielerwirkung: „Der Spieler liest nach Kontor II im Leitsatz «Kaufe ein Handelsschiff im Heimatkontor», danach «Lege eine Route: Gewürz von <Insel> heim», und der Grund «Kein freies Schiff» nennt den Weg (kaufen oder Route lösen)."
- Grösse: S · Risiko: keins (nur Texte und Schrittbedingungen in `src/ui/`; mit Folgepaket (2) R274b abstimmen, nicht doppeln)
- Raster: offen
- Verwandt: I-019
- Entscheid: offen

### I-016 · geparkt · Werft

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik (nur Mechanik, ADR-006): Schiffe entstehen in einem Küstengebäude statt per Knopf; Playtest 2026-10-06 („oder eine werft?“); heute Kauf im Kontor-Panel der Heimat (`src/ui/ships.ts` `buyShipView`)
- Spielerwirkung: „Der Spieler baut eine Werft an der Küste, bestellt dort ein Schiff, sieht es nach einer Bauzeit vom Stapel laufen und weiss damit, wo Schiffe herkommen."
- Grösse: M · Risiko: Save (neues Gebäude, Auftrag mit Restzeit im Weltzustand, Migration mit Standardwert); Baseline prüfen, falls der Controller Schiffe kauft
- Raster: offen
- Entscheid: R448 → geparkt bis Archipel-Brainstorming (mit I-036, I-038)

### I-017 · neu · Auftragsreihe Seefahrt

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Playtest 2026-10-06 („gibts eine questreihe? Auftrag dafür?“); Pfade `src/sim/orders.ts` (bestehende Händleraufträge, Anschluss prüfen), drittes Ziel I-010 (Gewürzstadt); Genre-Mechanik: geführte Einstiegsaufträge mit kleiner Belohnung
- Spielerwirkung: „Der Spieler bekommt geführte Aufträge («Erstes Schiff», «Erste Route», «Erstes Gewürz daheim») mit kleiner Belohnung und lernt so die Seefahrt-Schleife in der Reihenfolge, in der er sie braucht."
- Grösse: M · Risiko: Save (Fortschritt der Reihe als Flaggen im Weltzustand); Baseline bleibt bitgleich, solange der Controller sie nicht erfüllt; Belohnung klein halten (keine Dominanz, Werte nur in `src/sim/defs/`)
- Raster: offen
- Doppelung: I-015 (Leitsätze, S) deckt die Führung ohne Belohnung ab; diese Idee setzt erst darauf auf, nicht gemeinsam einplanen. I-010 bleibt das Endziel, die Reihe wäre sein Vorlauf.
- Entscheid: offen

### I-018 · neu · Story-Rahmen

- Bereich: Inhalt · Säule: **berührt möglicherweise eine Kernsäule** (Erzählung gehört nicht zu den heutigen Säulen; bei Bestätigung Verfassung §5.3, Warteschlange) · Quelle: Playtest 2026-10-06 („eine storyline?“); Genre-Mechanik: leichte Kapitel um die Ziele herum
- Spielerwirkung: „Der Spieler liest zu jedem Ziel (Siedlung, Handelsstadt, Gewürzstadt) ein kurzes Kapitel und erlebt die Ziele als Geschichte statt als Zahlenmarken."
- Grösse: L · Risiko: Save und Lizenz (Kapitelstand im Weltzustand; Texte, Namen und Figuren müssen eigen sein, ADR-006)
- Raster: offen
- Doppelung: keine; stärkere Fassung von I-017. Nur als Frage an L0, ob Erzählung zum Spiel passt, nicht als Richtungswechsel.
- Entscheid: offen

### I-019 · neu · Schiffsangebot am Kontor

- Bereich: Bedienung/Grafik · Säule: Wirtschaft, Steuern und Handel · Quelle: Playtest 2026-10-06 (REL-05, wörtlich: „ist aber schlecht versteckt im menu. -> wie wärs wenn ein schiff auftaucht vor meinem kontor welches mit einem gelben "!" markiert ist als hinweis das man es anklicken kann. dieses könnte man dann kaufen.“); Pfade `src/render/ship.ts` (`shipTile`, `drawShip`), `src/render/shipLane.ts`, `src/ui/ships.ts` `buyShipView`; Genre-Mechanik: Hinweismarke am Objekt statt Menüeintrag
- Spielerwirkung: „Der Spieler sieht, sobald Seefahrt frei ist und ein Schiff kaufbar wäre, ein Angebotsschiff mit gelbem «!» vor dem Heimatkontor, klickt es an und landet direkt im Kauf."
- Grösse: S–M · Risiko: keins beim Save, wenn die Marke rein aus dem Zustand abgeleitet wird (Seefahrt frei, kein freies Schiff, Kauf bezahlbar); Render-Marke plus UI-Klick, Picking für das Angebotsschiff nötig; Liegeplatz: Befund H-R14 (beobachtungen.md, 2026-10-04) — das Schiff kann hinter dem Kontor verdeckt liegen, das Angebotsschiff braucht einen sichtbaren Platz (Seite vor dem Kontor oder Marke über dem Kontor); Marke nicht mit der roten Kontor-Marke verwechseln
- Raster: offen
- Doppelung: I-015 (Leitsätze) führt per Text, diese Idee per Bild; zusammen lesbar, nicht doppeln. I-016 (Werft) würde den Kaufort verlegen; dann zöge die Marke zur Werft. Folgepaket (2) R274b („Heimatkontor-Klick → Schiffe direkt“) ist die Klick-Hälfte; Abstimmung nötig.
- Verwandt: I-015, I-016
- Entscheid: offen

### I-020 · neu · Berge und Klippen mit Höhe

- Bereich: Grafik · Säule: Atmosphäre und Optik (Anno-Look) · Quelle: `docs/beobachtungen.md` (Auswertung 2026-10-06, Iso-Folgethema M7-ISO); Genre-Mechanik: Höhenstaffelung im Gelände
- Spielerwirkung: „Der Spieler sieht Berge und Klippen mit Höhe statt flacher Felstextur und erlebt die Insel als Landschaft."
- Grösse: L · Risiko: Perf und Render-Baseline; die Sim hat keine Höhen (D-08), die Höhe bliebe rein darstellend; Gebirge ist nicht bebaubar
- Raster: offen
- Doppelung: RENDER-LOOK-01 (Felsmassiv-Feinschliff) deckt nur den Feinschliff; Berührung mit ART-STIL-02 L2 (Gebirge)
- Entscheid: offen

### I-021 · neu · Durchsichtige Vordergebäude

- Bereich: Bedienung/Grafik · Säule: Bedienung · Quelle: `docs/beobachtungen.md` (Auswertung 2026-10-06, Iso-Folgethema M7-ISO, AK-ISO-15)
- Spielerwirkung: „Der Spieler sieht, was hinter hohen Gebäuden steht, ohne die Kamera zu drehen."
- Grösse: M · Risiko: Perf (zweiter Zeichenpfad), Picking und Verdeckung (`iso.ts`)
- Raster: offen
- Doppelung: keine; M7 deckt Höhenhülle und Signale in der obersten Ebene ab
- Entscheid: offen

### I-022 · live · Leertaste pausiert — R323 → TASTEN-KOMFORT, live mit REL-08 (R339, R346)

### I-023 · live · Pipette für Gebäude — R323 → TASTEN-KOMFORT, live mit REL-08 (R339, R346)

### I-024 · zusammengefasst · Direkt als Stufe 2 bauen — IDEEN-06 in I-059 (Sammelausbau) aufgegangen; die UI-Variante «Bauen und gleich ausbauen» ist dort ein Unterfall

### I-025 · live · Ausbau-Taste (`Umschalt+U`) — R323 → TASTEN-KOMFORT, live mit REL-08 (R339, R346)

### I-026 · live · Übersichtliches Gebäude-Panel — R323 → PANEL-UEBERSICHT, live mit REL-08 (R343, R346)

### I-027 · live · Seekarte (nur Karte) — R405 → UI-SEEKARTE, live mit REL-12 (R413); Gründungsfahrt (AK-E5-02) bleibt Kür, nicht weiter verfolgt

### I-028 · live · Steuer je Stufe — R405 → Wirtschafts-Brainstorming, live mit REL-13 (R425, Save v10)

### I-029 · bewertet · Gefragte Ware

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik (nur Mechanik, ADR-006): wechselnde Nachfrage nach einem Handelsgut; Pfade `src/sim/defs/goods.ts` (`sell` fest, `SELL_FLOOR`/`SELL_DROP` Sättigung), `src/sim/defs/crises.ts` (`BOOM_PCT` 150 gilt für alle Güter), `README.md` („Handel" mit Verkaufssättigung)
- Spielerwirkung: „Der Spieler sieht am Kontor-Chip «Gefragt: Rum +40 % · noch 3:00» und entscheidet, ob er Rum aus dem Lager jetzt verkauft oder die Brennerei hochfährt, statt immer das Gut mit dem besten Grundpreis zu liefern."
- Grösse: S–M · Risiko: Save und Baseline (aktives Gut mit Ablauf im Weltzustand; Ziehung über eigenen seeded Strom nach ADR-010, nicht in Aufträge oder Krisen; Controller verkauft nicht nach Nachfrage → Baseline bitgleich)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Aufschlag so klein, dass „Gefragt" nie über den Kaufpreis führt (Verkauf bleibt unter `buy`, kein Kauf-und-Verkauf-Gewinn); fällt mit Boom zusammen → nur der höhere Satz, nicht multipliziert; Gut noch nicht freigeschaltet → nicht ziehbar; Lager leer → Chip bleibt, Hinweis «Kein Bestand».
- Doppelung: keine; Boom hebt alle Preise gleichzeitig, I-006 betrifft Zukauf (Kaufseite), Handelsaufträge sind Fixmengen mit Prämie. Gefragte Ware ist die Verkaufsseite je Gut.
- Bewertung lead-design (IDEEN-04): Verkaufsseite je Gut ist neu, aber Boom (alle Güter 150 %) und Sättigung decken schon einen Teil; der Mehrwert gegen heute ist eine kleine Umlenkung des Verkaufs. Gleicher Eingriffstyp (Weltzustand, eigener Strom, Krisen-Test) wie I-006; beide gemeinsam im Handels-Brainstorming denken (Kaufseite I-006 ≤ −20 %, Verkaufsseite hier ≤ Kaufpreis ohne Kauf-und-Verkauf-Gewinn). Nicht gepitcht.
- Entscheid: Empfehlung parken bis Handels-Brainstorming (mit I-006); Ruling IDEEN-04 offen

### I-030 · zusammengefasst · Wahlziele nach der Gewürzstadt — IDEEN-05 in I-039 aufgegangen (Denkmal als planbares Wahlziel; die Zielwerte-Frage aus IDEEN-04 gilt dort weiter)

### I-031 · eingeplant · Edikte der Amtsstube

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik (ein wählbarer Erlass, nur Mechanik, ADR-006); IDEEN-05 Scout A; Pfade `README.md` (Amtsstube, Steuer je Stufe), `src/sim/defs/tiers.ts`; Anlass: Geld ist nach der ersten Stunde reichlich und hat keine Richtung (Entartung I-010)
- Spielerwirkung: „Der Spieler wählt in der Amtsstube genau ein Edikt aus drei (Sparen: Unterhalt −20 %, Steuer −5 % · Handel: Verkaufssättigung erholt sich doppelt so schnell · Wohlfahrt: Aufstiegs-Wartezeit −25 %, Steuer −10 %), zahlt 600 Geld und gibt seiner Insel damit eine Richtung; ein Wechsel kostet erneut und ist 5 Minuten gesperrt."
- Grösse: M · Risiko: Save (aktives Edikt im Weltzustand, Migration „keins"); Baseline bitgleich, solange der Controller kein Edikt wählt
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13
- Randfälle: Edikt wirkt nur bei angebundener Amtsstube; Abriss beendet es ohne Erstattung; Wohlfahrt unterschreitet nie die Wartezeit der Stufe «niedrig» (15 s, Regel wie I-007); Wechsel während der Sperre → Knopf blass mit Restzeit.
- Entartung (Scout): Wohlfahrt dominiert, solange der Aufstieg die Engstelle ist; Steuerabzug und Mindestwartezeit halten dagegen. Sparen lohnt im Mittelspiel (≈ 240/min gespart gegen ≈ 126/min Steuer bei 60 Siedlern), im Spätspiel nicht: Die Wahl wandert mit der Phase, das ist gewollt.
- Doppelung: keine; I-028 (live) teilt die Steuer je Stufe, I-007 (live) beschleunigt lokal mit Ware. Edikte sind ein globaler Modus mit Ausschluss.
- Bewertung lead-design: Risiko 1 → 2 (nur Save, Baseline bleibt bitgleich). Stärkste neue Entscheidung der Runde, weil sie ausschliesst (eins von drei) und mit der Spielphase kippt. **Bedenken:** Wohlfahrt ist der dritte Aufstiegs-Beschleuniger neben Steuer «niedrig» und Fest; die drei dürfen sich nicht stapeln (nur der stärkste wirkt, Untergrenze 15 s). Handel ist schwach (Sättigung trifft nur Dauer-Verkäufer); `design-economy-designer` muss alle drei gegen die Bilanz je Einwohner rechnen, sonst gibt es ein Pflicht-Edikt. Einfachere Variante: zwei Edikte statt drei.
- Nutzen/Aufwand: hoher Nutzen (Richtung fürs Geld ab Stunde 1, echte Ausschluss-Wahl) · M · ≈ 2 Pakete (Wirtschafts-Kurzdesign mit Rechnung ≈ 40 Tools, Umsetzung Sim+Panel ≈ 150 Tools)
- Entscheid: R448 → eingeplant M13 «Spätspiel mit Richtung» (Baustein mit I-039); umgesetzt in M13-E1 (R467), live mit REL-18 (R472, Push läuft)

### I-032 · geparkt · Dienstkapazität

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik (begrenzte Dienstleistung); IDEEN-05 Scout A; Pfade `README.md` Z. 423 („Dienste wirken im Radius 10", ohne Limit), `src/sim/defs/buildings.ts`
- Spielerwirkung: „Der Spieler sieht im Kapellen-Panel «versorgt 112 / 120 Einwohner» und plant für dichte Viertel weitere Kapellen und Schulen."
- Grösse: M · Risiko: Baseline (Controller baut Dienste → Fingerabdruck und Sieg-Zeit ändern sich, Neumessung per Ruling) und Perf (Zuordnung Haus → Dienst deterministisch nach Abstand, dann ID, nicht je Tick neu); Save nicht, wenn die Zuordnung abgeleitet wird
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Haus über der Kapazität → eigener Mangeltext «Kapelle voll» mit Abhilfe; Zuordnung darf nicht flackern; Wachstum eines Hauses darf ein anderes nicht aus der Versorgung drängen, ohne dass das Panel es nennt.
- Doppelung: keine; Dienste haben heute Radius, keine Menge.
- Bewertung lead-design: Spass 3 → 2: Die Kapelle kostet 90/min gegen 84/min Steuer **eines** Bürgers; mehr Kapellen sind damit fast kostenlos, die „Wahl" ist ein weiterer Pflichtbau ohne Abwägung (der Scout nennt es selbst). Trägt erst, wenn Dienste Fläche im Zentrum kosten — das ist eine Stadtplanungs-Frage für ein Wirtschafts-Brainstorming, kein Häppchen. Risiko 1 (Baseline und Perf).
- Nutzen/Aufwand: mittlerer Nutzen (Dichteplanung), aber Gefahr einer Pflichtsenke · M · ≈ 2 Pakete plus Balancing-Neumessung (≈ 200 Tools)
- Entscheid: R448 → geparkt bis Anlass: Wirtschafts-Brainstorming zur Stadtplanung (trägt erst, wenn Dienste Fläche im Zentrum kosten)

### I-033 · geparkt · Ersatzware Wolle statt Stoff

- Bereich: Inhalt · Säule: Produktionsketten · Quelle: Genre-Mechanik (Alternativbedarf); IDEEN-05 Scout A; Pfade `README.md` (Siedler brauchen Stoff), `src/sim/defs/tiers.ts`, `goods.ts`
- Spielerwirkung: „Der Spieler erlaubt in der Not, Siedler mit Rohwolle statt Stoff zu versorgen (Haus-Panel «Ersatz: Wolle · Steuer 50 %, kein Aufstieg»), und spart die Weberei, verliert aber Steuer und Aufstieg."
- Grösse: M · Risiko: Save (Schalter im Weltzustand) und Baseline (greift Ersatz automatisch bei Stoffmangel, ändert sich der Verbrauch im Controller-Lauf → Fingerabdruck)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Ersatz zählt nie als Erfüllung für den Aufstieg; Wolle und Stoff knapp → beide Gründe; Bedarf 0,4 Wolle je Einwohner und 10 s (Scout-Wert) darf die Wolle der Weberei nicht leerziehen, sonst kippt die Kette.
- Entartung: Dauer-Wolle spart die Weberei; −50 % Steuer und Aufstiegsverbot machen das ab ≈ 20 Siedlern teurer als eine Weberei (Unterhalt 90/min) — mit `design-economy-designer` nachrechnen.
- Doppelung: keine.
- Bewertung lead-design: In der Scout-Fassung greift der Ersatz **automatisch** bei Stoff 0 — dann ist es ein Weichmacher der Bremse, keine Entscheidung, und er ändert die Baseline. Nur als Schalter (Amtsstube oder Haus, Standard aus) wird es eine Wahl. Schwächt die Säule Produktionsketten leicht (Kette wird überspringbar), daher kein Pitch.
- Nutzen/Aufwand: kleiner Nutzen (Notbehelf für Anfänger) · M · ≈ 2 Pakete (≈ 150 Tools)
- Entscheid: R448 → geparkt bis Anlass: Wirtschafts-Brainstorming; nur als Schalter (Standard aus), nie automatisch

### I-034 · geparkt · Seuche und Badehaus

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik (Krankheit als Dichte-Risiko); IDEEN-05 Scout A; Pfade `README.md` Z. 491 (Brand 50 %, Sturm 25 %, Boom 25 %), `src/sim/defs/crises.ts`
- Spielerwirkung: „Der Spieler sieht eine Seuchenwarnung für das dichteste Viertel und verliert ohne Badehaus im Radius 30 s lang je 5 s einen Einwohner pro Haus."
- Grösse: M · Risiko: Save, Baseline und `balance-crises.test.ts` (vierte Krisenart verschiebt die Verteilung, Vorschlag 40/20/20/20; Ziehung im Krisen-Strom, ADR-010)
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 1 = 9
- Randfälle: Krisen «aus» → keine Seuche; Badehaus erst nach dem Bürger-Ziel → vorher nicht ziehbar; mindestens ein Einwohner bleibt; nie zwei Krisen zugleich.
- Doppelung: Muster der Feuerwache (Schutzradius gegen Krise), nur für Wohnviertel.
- Bewertung lead-design: Passung 3 → 2: straft eher, als dass es eine neue Wahl gibt; das Badehaus wird für Kaufleute ohnehin gebaut, die Seuche greift erst danach — also keine Vorbau-Entscheidung. Zweite Versicherungspflicht neben der Feuerwache. Kein Pitch.
- Nutzen/Aufwand: kleiner Nutzen, Krisen-Pins ändern sich · M · ≈ 2 Pakete (≈ 150 Tools)
- Entscheid: R448 → geparkt bis Anlass: Überarbeitung der Krisen (braucht eine Vorbau-Entscheidung statt Strafe)

### I-035 · eingeplant · Betrieb stilllegen

- Bereich: Inhalt/Bedienung · Säule: Produktionsketten · Quelle: Genre-Mechanik (Betrieb pausieren); IDEEN-05 Scout A; Pfade `README.md` Z. 255 („Lager voll", neue Ware verfällt) und Z. 166 (volle Betriebe stehen still, Unterhalt läuft weiter)
- Spielerwirkung: „Der Spieler legt bei vollem Lager einen Betrieb im Panel still, zahlt dann nur halben Unterhalt und stellt ihn mit einem Klick wieder an, wenn die Ware gebraucht wird."
- Grösse: S · Risiko: Save (Flagge je Gebäude, Migration „an"); Baseline bitgleich, solange der Controller nicht stilllegt
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12
- Randfälle: Stillgelegt zählt nicht in die Warenbilanz der Kopfzeile (sonst falscher Trend); Brand während Stilllegung → Zustand bleibt; Kette: stillgelegte Schäferei lässt die Weberei mit Grund «Wolle fehlt» stehen; Abriss wie sonst; Kapelle/Schule nicht stilllegbar (Dienste sind keine Betriebe).
- Entartung: Bei vollem Lager ist Stilllegen immer richtig — Mikromanagement, aber keine Dominanz, weil der Wiederanlauf die Lücke in der Kette erzeugt. Kein Gewinn möglich (Ersparnis höchstens halber Unterhalt).
- Doppelung: keine; I-013 (verworfen) war eine Senke, dies ist eine Option. Abgrenzung zu Abriss: Abriss erstattet die Hälfte und kostet Neubau.
- Bewertung lead-design: bestätigt (12). Erste Wirtschafts-Entscheidung, die ein S-Häppchen bleibt: Unterhalt sparen gegen Bereitschaft der Kette. Einfachere Variante geprüft: automatisch halber Unterhalt bei «Lager voll» — nimmt die Wahl weg, verworfen. Save-Version steigt (v11); mit anderen Save-Änderungen bündeln.
- Nutzen/Aufwand: mittlerer Nutzen (sichtbare Kontrolle über Unterhalt, hilft Anfängern bei negativer Bilanz) · S · ≈ 1 Häppchen (≈ 80–100 Tools)
- Entscheid: R448 → geparkt bis zur nächsten Save-Änderung (v11); R452 → eingeplant M13-E1 (Save v11), umgesetzt (R467), live mit REL-18 (R472, Push läuft)

### I-036 · geparkt · Wrackbergung

- Bereich: Inhalt · Säule: Insel besiedeln (Archipel entdecken) · Quelle: Genre-Mechanik (Entdecken per Schiff); IDEEN-05 Scout B; Ist-Stand: Wracks sind reine Kulisse (`src/render/decor.ts`, `decorStamps.ts`, `water.ts`), die Sim kennt sie nicht
- Spielerwirkung: „Der Spieler schickt ein freies Schiff zu einem Wrack auf der Seekarte, wartet 30 s und bekommt einmalig eine kleine Beute (z. B. 8 Werkzeug oder 300 Geld)."
- Grösse: M · Risiko: Save (geborgene Wracks als Flaggen) und Baseline (Wracks müssen in die Sim; ihre Ziehung darf den RNG-Strom der Weltgenerierung nicht verschieben)
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 1 = 9
- Randfälle: Schiff mit Route → Route pausiert und läuft danach weiter; Wrack ohne Seeweg nicht bergbar; Laden während Bergung → nicht begonnen; Beute einmalig, keine Dauerquelle.
- Entscheidung (Scout): Schiff zeitweise vom Gewürzhandel abziehen.
- Doppelung: keine.
- Bewertung lead-design: Spass 3 → 2 (Seefahrt erst nach dem Bürger-Ziel, also Fortgeschrittene), Risiko 2 → 1 (Wracks aus dem Render in die Sim heben berührt Weltgenerierung und Baseline). **Entartung umgekehrt:** 300 Geld bei ≈ 12 000/min im Spätspiel ist bedeutungslos; die Beute müsste ein knappes Gut sein (Gewürz, Glas) oder etwas freischalten, sonst ist es Kulisse. Kandidat für dasselbe Brainstorming wie I-038.
- Nutzen/Aufwand: kleiner Nutzen in dieser Fassung · M · ≈ 2 Pakete (≈ 150 Tools)
- Entscheid: R448 → geparkt bis Archipel-Brainstorming (mit I-038, I-016; Beute als knappes Gut fassen)

### I-037 · verworfen · Leuchtturm gegen Sturm — IDEEN-06 Streichung lead-design (Bestätigung im Runden-Ruling): tote Option (≈ 6 % Sturmverlust), nur Kulisse; Pool-Obergrenze 40 (R445)

### I-038 · geparkt · Erkundungsfahrt

- Bereich: Inhalt · Säule: Insel besiedeln (Archipel) · Quelle: Genre-Mechanik (Entdeckung per Schiff); IDEEN-05 Scout B; Pfade `README.md` Z. 355 (zwei feste Fremdinseln), `src/sim/defs/sea.ts` (`ISLANDS`)
- Spielerwirkung: „Der Spieler schickt ein Schiff auf Erkundung und entdeckt nach der Fahrt eine dritte Fremdinsel mit eigenem Merkmal, die vorher auf der Seekarte fehlt."
- Grösse: L (Teilfassung M: Aufdecken einer schon erzeugten dritten Insel) · Risiko: Save (Entdeckt-Flagge, Inselliste), Perf (Generierung, Silhouette), Baseline (Inselzahl ändert die Weltgenerierung)
- Raster: Spass 2 · Passung 3 · Aufwand 1 · Risiko 1 = 9 (Teilfassung M: Aufwand 2 = 10)
- Randfälle: Siegziele hängen nie von der Entdeckung ab; Spielstand ohne Entdeckung bleibt gültig; Fahrrinnen und Wracks beachten (REL-10).
- Entscheidung (Scout): Schiff vom Handel abziehen; welche Richtung zuerst.
- Doppelung: keine; I-027 (live) ist Übersicht, I-036 Beute.
- Bewertung lead-design: Spass 3 → 2 (spätes Spiel). Grösster Inhalts-Hebel der Runde für die Säule „Insel besiedeln", aber Meilenstein-Grösse. Lohnt nur, wenn die neue Insel etwas bietet, das es heute nicht gibt (neues Gut oder Merkmal); sonst ist es „mehr Insel". Baustein für ein Archipel-Meilenstein-Brainstorming zusammen mit I-036 und I-016 (Werft).
- Nutzen/Aufwand: hoher Nutzen für Langzeitspieler · L (M-Teil möglich) · Meilenstein, ≈ 4–6 Pakete
- Entscheid: R448 → geparkt bis Archipel-Brainstorming (mit I-036, I-016)

### I-039 · eingeplant · Denkmal als Wahlziel (Ausbau von I-030)

- Bereich: Inhalt · Säule: Insel besiedeln (Langzeitmotivation) · Quelle: Genre-Mechanik (Prestigebau als Spätziel); IDEEN-05 Scout B; **Ausbau und Zusammenfassung von I-030** (Wahlziele nach der Gewürzstadt); Pfad `README.md` Z. 28–33 („danach spielst du frei weiter")
- Spielerwirkung: „Der Spieler errichtet nach der Gewürzstadt ein grosses Denkmal (3×3, z. B. 300 Stein, 80 Glas, 40 Gewürz in Teillieferungen) und sieht sein Wahrzeichen wachsen."
- Grösse: M · Risiko: Save (Baufortschritt, Flagge); Baseline bitgleich (Controller läuft nach Ziel 3 nicht weiter); Grafik eigen (ADR-006)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: höchstens ein Denkmal; Teillieferungen aus dem Lager der Insel, auf der es steht; Abriss ohne Erstattung (kein Geldtrick); Spielstand mit Ziel 3 → sofort baubar; Meldung «Wahlziel erreicht» einmal.
- Entscheidung (Scout): Rohstoffe und Gewürzschiffe ins Denkmal statt ins Wachstum, und wann.
- Doppelung: fasst I-030 zusammen; I-030s Beispielziele trugen nicht (Bilanz-Ziel in Minuten erreicht), ein Bauziel mit Warenmengen verlangt dagegen Planung über Kolonie und Route.
- Bewertung lead-design: bestätigt (11). Löst das Problem „endloser Überschuss im Spätspiel" als Warensenke mit sichtbarem Ergebnis — Geld allein reicht nicht, weil Gewürz und Glas die Engstelle sind. Mengen mit `design-economy-designer` gegen Gewürz-Erzeugung und Lagergrenze 100 rechnen (Teillieferung nötig). Passt mit I-031 in ein Spätspiel-Brainstorming.
- Nutzen/Aufwand: mittlerer Nutzen (Ziel nach Stunde 2, Senke) · M · ≈ 2 Pakete inkl. Sprite (≈ 150 Tools plus lead-art)
- Entscheid: R448 → eingeplant M13 «Spätspiel mit Richtung» (Baustein mit I-031; Mengen mit design-economy-designer)

### I-040 · verworfen · Inseln taufen — IDEEN-06 Streichung lead-design (Bestätigung im Runden-Ruling): reine Bindung ohne Wahl, nur Lückenfüller mit Save-Änderung; Pool-Obergrenze 40 (R445)

### I-041 · live · Wege abreissen durch Ziehen — R448 → UI-PROBLEM-SPRUNG, live mit REL-17 (R463)

### I-042 · live · Nächstes Problem anspringen — R448 → UI-PROBLEM-SPRUNG, live mit REL-17 (R463)

### I-043 · eingeplant · Gut-Chip zeigt Erzeuger und Verbraucher

- Bereich: Bedienung · Säule: Produktionsketten · Quelle: Genre-Mechanik (Statistik führt zur Quelle); IDEEN-05 Scout C; Ist-Stand: Lager-Chip nennt Bilanz nur im Tooltip, Rolle `img`, nicht klickbar (`src/ui/hud.ts` `chipView`, `chipRole`)
- Spielerwirkung: „Der Spieler klickt bei rotem Holz-Pfeil auf den Holz-Chip, sieht alle Holzfäller und Verbraucher kurz hervorgehoben und springt zum nächsten."
- Grösse: S · Risiko: Perf (Hervorhebung nur sichtbarer Gebäude) und Zugänglichkeit (Chip wird Knopf, Tastaturbedienung); Sim und Save unberührt
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: kein Erzeuger → «Noch kein Erzeuger, baue …»; zweiter Klick, `Esc` oder Inselwechsel löscht; Fremdinsel hebt dort hervor.
- Doppelung: Nähe zu I-042 (Sprung); hier nach Gut, dort nach Problem — gemeinsam denken, ein Sprung-Mechanismus.
- Bewertung lead-design: Aufwand bleibt 2 (Render-Hervorhebung plus Chip-Umbau, zwei Stränge). Gute Antwort auf „warum fehlt Holz?", aber nach I-042; teilt dessen Sprung-Logik.
- Nutzen/Aufwand: mittlerer Nutzen (Ketten lesbar) · S–M · ≈ 1–2 Pakete (≈ 100 Tools)
- Entscheid: R448 → eingeplant nach REL-17; umgesetzt UI-GUT-CHIP (R470), live mit REL-18 (R472, Push läuft)

### I-044 · geparkt · Kamera-Lesezeichen

- Bereich: Bedienung · Säule: Bedienung · Quelle: Genre-Mechanik (gemerkte Kamerapositionen); IDEEN-05 Scout C; Ist-Stand: nur `0` (Heimat), `9` (nächste Insel) und die Seekarte (`src/ui/islandJump.ts`)
- Spielerwirkung: „Der Spieler legt drei Kameraplätze fest und springt per Taste zwischen Altstadt, Hafen und Kolonie."
- Grösse: S · Risiko: keins beim Save, wenn die Plätze im Browser-Speicher liegen (`src/ui/storage.ts`); Tastenkonflikt mit dem Browser (F3 = Suchen, F5 = Neuladen)
- Raster: Spass 1 · Passung 2 · Aufwand 3 · Risiko 2 = 9
- Randfälle: Lesezeichen nach «Neue Insel» oder Laden ungültig → Meldung statt Sprung; Kamera-Klemmung gilt weiter; `1`–`3` sind Tempo, Strg+Ziffer schluckt der Browser.
- Doppelung: Seekarte (I-027, live) und `9`/`0` decken den Inselwechsel schon ab.
- Bewertung lead-design: Spass 2 → 1, Passung 3 → 2: Mit drei Inseln und Seekarte bleibt wenig Mehrwert, und die Tastenwahl ist im Browser heikel. Erst bei mehr Inseln (I-038) neu prüfen.
- Nutzen/Aufwand: kleiner Nutzen · S · ≈ 1 Häppchen (≈ 60 Tools)
- Entscheid: R448 → geparkt bis Anlass: mehr Inseln (I-038)

### I-045 · geparkt · Versorgungsebene

- Bereich: Bedienung/Grafik · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik (Reichweiten-Overlay); IDEEN-05 Scout C; Ist-Stand korrigiert (lead-design): Beim **Platzieren** von Marktplatz, Kapelle, Schule und Feuerwache zeigt das Spiel schon den Wirkkreis und die schon abgedeckte Fläche (`README.md` Z. 106–110); es fehlt nur eine Ansicht ohne Bauwerkzeug und die Einfärbung unversorgter Häuser
- Spielerwirkung: „Der Spieler schaltet eine Ebene an, die Dienstradien und unversorgte Häuser einfärbt, und sieht auch herausgezoomt, wo die nächste Kapelle hinmuss."
- Grösse: M · Risiko: Perf (Ebene als Cache wie `src/render/overlays.ts`, `CAPS`); kein Sim-Zustand, nicht im Save
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: nicht angebundene Dienste zählen nicht; Bauvorschau hat Vorrang; Auswahl je Dienst statt Überlagerung; nur die Insel der Kamera.
- Doppelung: teilweise vorhanden (Radius beim Platzieren); I-042 springt zum unversorgten Haus.
- Bewertung lead-design: Passung 3 → 2, weil der Kern (abgedeckte Fläche) beim Platzieren schon da ist; der Rest überschneidet sich mit I-042. Nach I-042 neu prüfen.
- Nutzen/Aufwand: kleiner bis mittlerer Nutzen · M · ≈ 2 Pakete (≈ 120 Tools)
- Entscheid: R448 → geparkt bis Anlass: nach I-042 live neu prüfen. IDEEN-06 geprüft: `.`/`,` führt im Alltag zum unversorgten Haus; bleibt geparkt bis Stadtplanungs-Brainstorming (mit I-032, I-051)

### I-046 · verworfen · Überlauf-Ausfuhr — IDEEN-06 Scout A; Streichung lead-design (Bestätigung im Runden-Ruling): Ware, die bei vollem Lager verfiele, ginge automatisch zum halben Preis ans Kontor. Entartet zur passiven Einnahme (Holzfäller ≈ 40 Geld/min Überlauf gegen 30 Unterhalt) und nimmt dem Zustand «Lager voll» die Entscheidung; die Antwort auf Überschuss ist Stilllegen (I-035) oder Verkauf von Hand.

### I-047 · bewertet · Stammkunde (Liefervertrag)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik (Dauerabnahme gegen Festpreis, nur Mechanik, ADR-006); IDEEN-06 Scout A; Pfade `src/sim/orders.ts` (Aufträge einmalig), `src/sim/defs/goods.ts` (`ORDER_PREMIUM`, Sättigung)
- Spielerwirkung: „Der Spieler nimmt nach einem erfüllten Auftrag das Angebot «Stammkunde: 12 Rum alle 3 min zu 130 %» an und wägt feste Abnahme gegen Verkauf am freien Markt ab."
- Grösse: M · Risiko: Save (Vertragszustand im Weltzustand, Migration „keiner"); Baseline bitgleich, solange der Controller keinen Vertrag annimmt
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: höchstens ein Vertrag; nur für Güter mit Erzeuger; verpasste Lieferung beendet ihn mit 100 Geld Strafe, Kündigen kostenlos; Preis bleibt unter `buy` (Rum 23,4 < 40, kein Kauf-und-Verkauf-Gewinn); Menge < 40 % der gemessenen Erzeugung, damit kein Pflichtbau entsteht.
- Doppelung: keine im Mechanismus; I-029 (Spotnachfrage) und I-006 (Kaufseite) teilen dieselbe Stelle (Handel am Kontor).
- Bewertung lead-design (IDEEN-06): Spass 3 → 2: Die Bindung trägt erst für Fortgeschrittene, die Rum im Überschuss haben; im ersten Spiel bleibt sie unsichtbar. Mit I-006 und I-029 als ein Handels-Baustein denken, nicht einzeln einplanen.
- Nutzen/Aufwand: mittlerer Nutzen (Planbarkeit im Mittelspiel) · M · ≈ 2 Pakete (Rechnung `design-economy-designer` ≈ 40 Tools, Sim+Panel ≈ 150 Tools)
- Entscheid: Empfehlung parken bis Handels-Brainstorming (mit I-006, I-029); Ruling IDEEN-06 offen

### I-048 · bewertet · Zukauf-Aufschlag (Kaufsättigung)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Beobachtung (Kaufpreise fest, `src/sim/defs/goods.ts` `buy`; jeder Mangel lässt sich mit Geld beheben, README „Handel"); Genre-Mechanik Nachfragepreis; IDEEN-06 Scout A
- Spielerwirkung: „Der Spieler merkt, dass Dauer-Zukauf teurer wird («Preis 140 %»), und baut die Kette selbst aus, statt jeden Engpass mit Geld zu beheben."
- Grösse: S–M · Risiko: Save (Aufschlag je Gut im Weltzustand, Spiegel der Verkaufssättigung) und Baseline (der Controller kauft Werkzeug → Neumessung per Ruling); Balancing-Test
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 1 = 12
- Startwerte (Scout, mit `design-economy-designer` nachrechnen): +2 Punkte je gekaufte Einheit, Deckel +60 %, Erholung 1 Punkt/s wie beim Verkauf; bis ≈ 30 Einheiten/min praktisch ohne Aufschlag, 100 Stück am Stück im Mittel ≈ 151 %.
- Randfälle: Handelsdialog zeigt «Preis … %» und den Preis je Knopf; gilt nur für den Kauf am Kontor, nicht für Bau- und Ausbaukosten; Edikt Handel (Kaufpreise −20 %) wirkt multiplikativ auf den Aufschlag.
- Entartung: zu hart → Zukauf nutzlos, Frühspiel mit Werkzeugmangel wird zäh; zu weich → alles bleibt wie heute. Kein Pflichtbau, weil Kaufen weiter geht, nur teurer.
- Doppelung: I-006 (Sonderangebot, Preis runter) ist der Gegenpol; nicht gleichzeitig einplanen.
- Bewertung lead-design (IDEEN-06): bestätigt (12). Stärkster Wirtschaftsbeitrag der Runde: schliesst die Lücke „Geld löst jeden Mangel" (Befund Scout A) und gibt dem Edikt Handel Gewicht, das laut README im späten Spiel nur Feinsteuerung ist. Gehört in die Richtung von M13 „Spätspiel mit Richtung". Risiko: die Baseline-Neumessung braucht ein eigenes Ruling.
- Nutzen/Aufwand: hoher Nutzen (Bauen statt Kaufen wird eine Entscheidung) · S–M · ≈ 1–2 Pakete (Rechnung ≈ 40 Tools, Sim+Handelsdialog ≈ 120 Tools)
- Entscheid: Empfehlung einplanen als Wirtschafts-Baustein (M13-Rest oder nächstes Meilenstein-Brainstorming); Ruling IDEEN-06 offen

### I-049 · bewertet · Sperrbestand (Reserve je Gut)

- Bereich: Inhalt · Säule: Produktionsketten · Quelle: Beobachtung (Werkzeugmacher und Glashütte ziehen Holz und Stein, die zum Bauen fehlen); Genre-Mechanik Lager-Priorität; IDEEN-06 Scout A
- Spielerwirkung: „Der Spieler legt für Holz «Reserve 20» fest, und Betriebe ziehen Holz nur, wenn mehr als 20 im Lager liegen; so bleibt Holz zum Bauen übrig."
- Grösse: S · Risiko: Save (Reserve je Gut, Migration 0); Baseline bitgleich bei Reserve 0
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12
- Randfälle: Haushaltsbedarf (Nahrung, Stoff, Rum) kennt keine Reserve, Häuser hungern nie wegen des Schalters; Betrieb zeigt «Wartet auf Holz (Reserve)»; Stufen 0/20/40/60; die Problemliste (`.`) zählt «Reserve» nicht als Problem oder nennt den Grund.
- Entartung: Reserve 60 legt die Kette lahm; dominiert nicht, weil sie nur in Mangelphasen wirkt.
- Doppelung: keine; I-035 legt ganze Betriebe still, I-043 zeigt Verbraucher. **Bedienort:** Der Gut-Chip ist seit I-043 mit dem Fokus-Klick belegt; die Einstellung gehört ins Handels- oder Kontor-Panel.
- Bewertung lead-design (IDEEN-06): bestätigt (12). Echte kleine Wahl (Bauen gegen Produzieren) mit sauberem Standard. Nur Save-Risiko; wie I-035 am besten mit der nächsten Save-Änderung mitnehmen.
- Nutzen/Aufwand: mittlerer Nutzen (Frühspiel-Engpass Holz lösbar ohne Abriss) · S · ≈ 1 Häppchen (≈ 90 Tools, Sim + Panel)
- Entscheid: Empfehlung einplanen mit der nächsten Save-Änderung (v12); Ruling IDEEN-06 offen

### I-050 · bewertet · Arbeitskräfte

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik (Wohnraum liefert Arbeit, nur Mechanik); IDEEN-06 Scout A; Beobachtung: Betriebe laufen unabhängig von der Bevölkerung, die Stufen haben ausser Steuer keine Rolle
- Spielerwirkung: „Der Spieler plant Wohn- und Gewerbeviertel gegeneinander: Jeder Betrieb braucht Arbeiter aus Häusern in Reichweite, und ein aufgestiegenes Haus liefert weniger Arbeiter als ein Pionierhaus."
- Grösse: L · Risiko: Save, Baseline, Perf und alle Balancing-Werte
- Raster: Spass 3 · Passung 3 · Aufwand 1 · Risiko 1 = 12
- Randfälle: Henne-Ei am Spielstart (erster Betrieb ohne Haus), Zuordnung deterministisch nach Abstand, dann ID; Busywork-Gefahr („Haus für 4 Arbeiter" als Pflichtbau).
- Doppelung: I-032 (Dienstkapazität) teilt die Zuordnung Haus → Gebäude; beide im selben Brainstorming denken.
- Bewertung lead-design (IDEEN-06): **kein Säulenwechsel** (vertieft die Säule Bevölkerung, ändert weder Genre noch Titel), aber ein Umbau der Kernschleife im Umfang eines Meilensteins. Trägt nur, wenn Aufstieg und Arbeit echt konkurrieren; sonst reine Mehrarbeit.
- Nutzen/Aufwand: hoher Nutzen, sehr hoher Aufwand · L · Meilenstein (≥ 5 Pakete, Baseline-Neumessung)
- Entscheid: Empfehlung parken bis Meilenstein-Brainstorming nach M13 (mit I-032); Ruling IDEEN-06 offen

### I-051 · bewertet · Park als Wohnwert

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik (Dekor mit Wirkung); IDEEN-06 Scout B; Lücke in `src/sim/defs/buildings.ts` (kein Wohnumfeld-Gebäude)
- Spielerwirkung: „Der Spieler setzt einen Park zwischen Wohnhäuser und sieht sie schneller aufsteigen, also plant er Viertel statt Reihen."
- Grösse: M · Risiko: Balancing-Test, neues Sprite (lead-art, ADR-011); Save nur, falls der Gebäudetyp ein Feld braucht; Baseline bitgleich, solange der Controller ihn nicht baut
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: braucht Unterhalt und Wegeanbindung; Wirkkreis wie Kapelle.
- Doppelung: I-008 (Standortgüte für Betriebe), I-011 (Hauswunsch) grenzen daran.
- Bewertung lead-design (IDEEN-06): Aufwand 3 → 2 (Sprite plus Sim plus Balancing). **Bedenken:** Als vierter Aufstiegs-Beschleuniger neben Fest, Steuer «niedrig» und Edikt Wohlfahrt läuft er in die Stapelregel (nie unter 15 s) und ist dann wirkungslos. Trägt nur mit eigener Wirkung (z. B. Bedingung für Kaufleute oder Steuer-Plus im Kreis).
- Nutzen/Aufwand: kleiner Nutzen in heutiger Form · M · ≈ 2 Pakete plus Sprite
- Entscheid: Empfehlung parken bis Stadtplanungs-Brainstorming (mit I-011, I-032); Ruling IDEEN-06 offen

### I-052 · bewertet · Einwandererschiff

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik (Zuzug als Ereignis); IDEEN-06 Scout B; positives Gegenstück zu den Krisen in `src/sim/crises.ts`
- Spielerwirkung: „Der Spieler sieht ab und zu ein Schiff mit Siedlern anlegen und erlebt Wachstum als Belohnung für freie, versorgte Wohnhäuser."
- Grösse: M · Risiko: Save (Ereigniszustand), Baseline (eigener seeded Strom nach ADR-010 nötig), Schiffsfigur im Render-Strang
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 1 = 9
- Randfälle: ohne freien Wohnraum «Siedler warten»; Obergrenze je Ereignis, nur in versorgte Häuser; darf Ziele nicht kurzschliessen.
- Doppelung: keine im Pool; Wachstum aus freiem Wohnraum läuft heute schon stetig.
- Bewertung lead-design (IDEEN-06): Spass 3 → 2: Das Ereignis belohnt, was der Spieler ohnehin tut, und verlangt keine Entscheidung; es ist Atmosphäre. Erst mit einer Wahl (Aufnehmen gegen Versorgungsdruck) ein Kandidat.
- Nutzen/Aufwand: kleiner Nutzen · M · ≈ 2 Pakete
- Entscheid: Empfehlung parken bis Überarbeitung der Krisen (mit I-034); Ruling IDEEN-06 offen

### I-053 · verworfen · Taverne als Rum-Verbraucher — IDEEN-06 Scout B; Streichung lead-design (Bestätigung im Runden-Ruling): Annahme falsch, Rum ist schon Bedarf von Bürgern und Kaufleuten (README Z. 445–446), die Brennerei hat Abnehmer.

### I-054 · zusammengefasst · Piraten bedrohen Routen — IDEEN-06 Scout B, in I-014 (Sturm auf See) aufgegangen (gleiche Stelle: Verlust auf der Route mit Gegenmittel; ohne Kampf)

### I-055 · bewertet · Fischreiche Insel

- Bereich: Inhalt · Säule: Insel besiedeln · Quelle: Genre-Mechanik (Inselcharakter); IDEEN-06 Scout B; Lücke in `src/sim/defs/sea.ts` (`IslandTrait` kennt nur `spice` und `mountain`)
- Spielerwirkung: „Der Spieler sieht auf der Seekarte, dass eine Insel fischreich ist, und gründet dort ein Kontor, um Nahrung für die Heimat zu holen."
- Grösse: S–M · Risiko: Save (Trait im Weltzustand) und Baseline (Inselgenerierung ändert die Zufallsfolge)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Gewürzinsel nicht zugleich fischreich; Wirkung nur auf der Fremdinsel; Nahrung muss per Route heim, sonst kein Grund für die Kolonie.
- Doppelung: I-012 (Endliche Vorkommen) betrifft die Menge; Archipel-Bausteine I-038, I-036, I-016.
- Bewertung lead-design (IDEEN-06): Passung 2 → 3 (Säule Insel besiedeln direkt), Aufwand 3 → 2 (Weltgenerierung plus Baseline-Neumessung). Trägt erst mit mehr Inseln, sonst eine Variante der Gewürzinsel.
- Nutzen/Aufwand: mittlerer Nutzen (Grund für eine zweite Kolonie) · S–M · ≈ 1–2 Pakete
- Entscheid: Empfehlung parken bis Archipel-Brainstorming (mit I-038, I-036, I-016); Ruling IDEEN-06 offen

### I-056 · bewertet · Entf-Taste reisst Markiertes ab

- Bereich: Bedienung · Säule: Bedienung · Quelle: Code (`src/ui/hotkeys.ts`, `src/ui/input.ts`: keine Entf-/Backspace-Belegung; Abriss nur über Werkzeug und Klick); Genre-Mechanik; IDEEN-06 Scout C
- Spielerwirkung: „Der Spieler markiert ein Gebäude und reisst es mit `Entf` ab, statt Werkzeug zu wechseln, zu klicken und zur Auswahl zurückzukehren."
- Grösse: S · Risiko: keins bei Save, Baseline, Perf (bestehende Abriss-Aktion mit `{ ok, reason }`); Fehlbedienung → Warnung «Abriss trennt N Gebäude» wie beim Abriss-Zug
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13
- Randfälle: stumm bei offener Karte und in Eingabefeldern; ohne Markierung nichts; Heimatkontor meldet seinen Grund; Mac: `Backspace` als Alternative; Erstattung wie beim Abriss-Werkzeug.
- Doppelung: keine; I-041 räumt nur Wege.
- Bewertung lead-design (IDEEN-06): bestätigt (13). Bester Nutzen je Aufwand der Runde, risikofrei, mit I-057 als ein Tasten-Häppchen bündelbar (gleiche Dateien).
- Nutzen/Aufwand: mittlerer Nutzen (jeder Umbau einen Werkzeugwechsel kürzer) · S · ≈ 1 Häppchen mit I-057 (≈ 70 Tools zusammen)
- Entscheid: Empfehlung einplanen nächstes Release (Studio-Platz, mit I-057); Ruling IDEEN-06 offen

### I-057 · bewertet · Schnellspeichern mit `Strg`/`Cmd` + `S`

- Bereich: Bedienung · Säule: Bedienung · Quelle: Code (`src/ui/input.ts:571` verwirft alle Strg/Cmd-Tasten; Speichern nur über das Menü, Autosave alle 2 min, README Z. 575); IDEEN-06 Scout C
- Spielerwirkung: „Der Spieler sichert vor einem riskanten Umbau oder einer Seefahrt mit einem Tastendruck und liest «Gespeichert»."
- Grösse: S · Risiko: Browser-Konflikt (Seite speichern; `preventDefault` nötig); sonst keins, der Speicherweg (`src/ui/storage.ts`) existiert
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: Speicher voll oder gesperrt → vorhandener Fehlertext; stumm bei offener Karte und in Eingabefeldern; während Brand erlaubt.
- Doppelung: keine; Menü-Speichern und Autosave sind live, die Taste fehlt.
- Bewertung lead-design (IDEEN-06): bestätigt (12). Klein, erwartbar (Genre-Standard), mit I-056 bündeln.
- Nutzen/Aufwand: kleiner bis mittlerer Nutzen (Sicherheit vor Experimenten) · S · im Häppchen mit I-056
- Entscheid: Empfehlung einplanen nächstes Release (mit I-056); Ruling IDEEN-06 offen

### I-058 · bewertet · Pause bei Krise

- Bereich: Bedienung · Säule: Bedienung · Quelle: Code (`src/ui/settings.ts`, `src/ui/crisis.ts`: keine Pause-Option; Brand und Sturm laufen bei 2× und 4× weiter); Genre-Mechanik; IDEEN-06 Scout C
- Spielerwirkung: „Der Spieler schaltet «Bei Krise pausieren» ein und bekommt bei Brand oder Sturm ein stehendes Bild mit Meldung, statt bei 4× zu spät zu reagieren."
- Grösse: S–M · Risiko: keins beim Save (Einstellung im Browser-Speicher); Zusammenspiel mit Tempo-Gedächtnis (`P`) und Leertaste-Pause
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 3 = 11
- Randfälle: Krisenstufe «aus» löst nichts aus; mehrere Ereignisse kurz hintereinander pausieren einmal; Fortsetzen nimmt das letzte Tempo; Standard aus.
- Doppelung: keine; I-014 ist Inhalt.
- Bewertung lead-design (IDEEN-06): bestätigt (11). Nützlich ab Tempo 4×, aber nur für einen Teil der Spieler; nach dem Tasten-Häppchen.
- Nutzen/Aufwand: kleiner bis mittlerer Nutzen · S–M · ≈ 1 Häppchen (≈ 80 Tools)
- Entscheid: Empfehlung parken bis ein Playtest verpasste Krisen bei hohem Tempo meldet, sonst Lückenfüller; Ruling IDEEN-06 offen

### I-059 · bewertet · Sammelausbau gleicher Betriebe (mit I-024)

- Bereich: Bedienung · Säule: Produktionsketten · Quelle: Genre-Mechanik (Massenaufwertung); Ausbau heute einzeln über «Ausbauen» oder `Umschalt+U` (README Z. 298); IDEEN-06 Scout C; nimmt I-024 (Direkt als Stufe 2 bauen) auf
- Spielerwirkung: „Der Spieler sieht im Panel «Alle 6 Holzfäller ausbauen» mit Gesamtkosten und Gebühr und rüstet eine Kette mit einer Entscheidung auf."
- Grösse: S–M · Risiko: keins bei Save und Baseline, wenn die UI die bestehende Aktion `upgradeBuilding` je Betrieb aufruft (keine neue Sim-Regel, Kosten unverändert); Regel bei zu wenig Geld nötig
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 3 = 11
- Randfälle: so viele wie bezahlbar, Reihenfolge nach Abstand zum Kontor, dann ID; Brand, gesperrte Stufe, nicht angebunden → übersprungen und genannt; eine Sammelmeldung.
- Doppelung: I-024 (Stufe 2 beim Bauen) zielt auf dasselbe Ärgernis „Nachrüsten nervt"; hier zusammengefasst, die I-024-Variante «Bauen und gleich ausbauen» als zwei Sim-Aktionen ist ein Unterfall.
- Bewertung lead-design (IDEEN-06): Risiko 2 → 3, weil die Sim unberührt bleibt (n Einzelaktionen wie I-041); Passung 3 → 2 (Bedienung, Kette nur indirekt). Spürbar erst ab dem Mittelspiel.
- Nutzen/Aufwand: mittlerer Nutzen (Mittelspiel weniger Klicks) · S–M · ≈ 1 Häppchen (≈ 90 Tools)
- Entscheid: Empfehlung parken bis Playtest „Nachrüsten nervt" (Anlass aus I-024); Ruling IDEEN-06 offen

### I-060 · verworfen · Gleichartige Betriebe durchblättern — IDEEN-06 Scout C; Streichung lead-design (Bestätigung im Runden-Ruling): durch I-043 gedeckt (Gut-Chip plus `.`/`,` geht die Erzeuger eines Guts durch, je Gut fast immer genau ein Gebäudetyp); eine zweite Sprung-Taste kostet Tastenplatz ohne neuen Nutzen.
