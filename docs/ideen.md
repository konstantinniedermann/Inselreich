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

## Status-Fluss

neu → bewertet → gepitcht → eingeplant | geparkt | verworfen → live

## Obergrenze

Höchstens rund 30 offene Ideen (alles ausser verworfen und live). Verworfene und live gegangene Ideen
bleiben einzeilig stehen.

## Format je Idee

```markdown
### I-001 · neu · <Kurzname>

- Bereich: Inhalt | Grafik | Ton | Bedienung | Technik · Säule: <Säule> · Quelle: <Pfad, Playtest, Nutzer, Genre-Mechanik>
- Spielerwirkung: „Der Spieler …" (ein Satz)
- Grösse: S | M | L · Risiko: <Save, Baseline, Perf, Lizenz oder keins>
- Raster: Spass x · Passung x · Aufwand x · Risiko x = Summe
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

### I-007 · eingeplant · Fest in der Kapelle

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik: Die Bevölkerung wird mit einem Fest belohnt, das Waren verbraucht und Wohlstand beschleunigt; Pfad `README.md` („Aufstieg: Bedürfnisse seit mindestens 30 Sekunden erfüllt", Rum wird erst ab Bürgern verbraucht und sonst nur verkauft)
- Spielerwirkung: „Der Spieler klickt im Panel einer angebundenen Kapelle auf «Fest feiern (10 Rum)» und sieht die Häuser im Umkreis eine Minute lang schneller aufsteigen; er entscheidet, ob Rum Geld bringt oder Wachstum."
- Grösse: S · Risiko: Save und Baseline (Fest-Ende als Feld an der Kapelle; Controller löst kein Fest aus → Baseline bitgleich; Save-Migration mit Standardwert)
- Raster: Spass 3 · Passung 3 · Aufwand 3 · Risiko 2 = 14
- Randfälle: Dauerfeiern → Abklingzeit 3:00 je Kapelle, und das Fest ersetzt nie eine fehlende Ware (Wartezeit sinkt höchstens auf die Hälfte, nie unter die Zeit der Steuerstufe «niedrig»); mehrere Kapellen überdecken ein Haus → Wirkung zählt einmal; Steuerstufe «hoch» → Aufstieg bleibt gesperrt, das Panel nennt den Grund.
- Doppelung: keine; Programm Nutzerfeedback S5/S10 ändern Gütersperren und Steuerfluss, nicht Kapelle-Aktionen.
- Bewertung lead-design: bestätigt (14). Regel vereinfacht: Ein Fest setzt für Häuser im Kapellen-Radius (10) 60 s lang die Aufstiegs-Wartezeit auf den Wert der Stufe «niedrig» (15 s, bei Defizit 30 s); unter «niedrig» wirkt es nicht zusätzlich, bei «hoch» gar nicht. Echte Wahl: 10 Rum ≈ 180 Geld Verkauf (gesättigt weniger) gegen ≈ 30 % Steuerverlust von «niedrig» für die ganze Insel (bei 100 Siedlern ≈ 126 Geld/min) — lokal und warenbasiert statt global und geldbasiert; ab Bürgern konkurriert das Fest mit dem eigenen Rum-Bedarf. Zukauf (40/Rum = 400 je Fest) ist teurer als «niedrig», also keine Dominanz. Werte (Rum-Menge, Dauer, Abklingzeit 3:00) in `src/sim/defs/`. Sichtbares Fest (Fahnen, Laternen) nur als spätere lead-art-Kür, nicht im S-Umfang.
- Entscheid: R219 → eingeplant Studio-Platz REL-04

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

### I-010 · eingeplant · Drittes Ziel «Gewürzstadt»

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Playtest-Beobachtung des Studios: Nach «Handelsstadt» (60 Kaufleute) gibt es nur freies Weiterspielen ohne Ziel (Pfad `README.md`, Abschnitt „Ziel"); Genre-Mechanik: Aufbauspiele geben nach dem Hauptziel eine Kette weiterer Meilensteine; **M12-Baustein E3/E4** (Fassung lead-design)
- Spielerwirkung: „Der Spieler sieht nach der Handelsstadt im Ziel-Chip «Gewürzstadt n / 80 Kaufleute mit Gewürz» und hat erstmals ein Ziel, das ihn über Kontor II, Plantage und Route auf die Fremdinseln führt."
- Grösse: S · Risiko: Save (erreichtes Ziel als Flagge im Weltzustand, Migration mit Standardwert «offen»; Ziele stehen als Daten in `src/sim/defs/`); Baseline bleibt bitgleich, solange der Controller nach dem zweiten Ziel nicht weiterläuft
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12
- Randfälle: Geld ist beim Erreichen kurz hoch und fällt (Aufstiegskosten) → Ziel zählt «einmal erreicht, bleibt erreicht», nie rückgängig; Steuerstufe «hoch» wird zur Abkürzung → die Kaufleute-Zahl muss zugleich gehalten sein (Stand beim Prüfen, nicht Spitzenwert früher); Abriss danach ändert nichts; Spielstand, der schon über der Marke liegt → Meldung beim Laden nur einmal, kein Rückwirkend-Spam.
- Doppelung: keine; I-001 bis I-009 berühren Ziele nicht; M12 verlangt kein neues Ziel (Kapitel 3: U6 «Seefahrt» ist Freischaltung, kein Ziel). Wenn M12 ein eigenes Archipel-Ziel einführt, ersetzt es diese Fassung.
- Bewertung lead-design: Lücke bestätigt, Fassung umgebaut. **Entartung der Scout-Fassung:** 100 Kaufleute zahlen
  brutto 100 × 20 je 10 s = 12 000 Geld/min; «12 000 Geld angespart» ist damit eine Minute Warten, keine Planung, und
  «100 statt 60 Kaufleute» ist mehr vom Gleichen. Neue Fassung als **M12-Baustein E3/E4**: M12 hat kein Ziel, obwohl
  Gewürz «der Grund zur Expansion» ist (Spec Kap. 7). Drittes Ziel «Gewürzstadt»: n Kaufleute (Vorschlag 80) in
  Häusern, die seit 60 s voll versorgt sind, **einschliesslich Gewürz**. Das verlangt die ganze M12-Schleife
  (Fremdinsel, Kontor II, Plantage, Route) und gibt dem Archipel einen Spannungsbogen; Zukauf (40 je Gewürz) bleibt als
  teurer Notweg, also kein zwingender Bankrott. Erreichtes Ziel ist eine Flagge, «einmal erreicht, bleibt erreicht»,
  Meldung beim Laden nur einmal; Flagge reitet auf der Save-Migration v9 des Seefahrt-Bündels mit (keine eigene
  Version). Controller läuft nach dem zweiten Ziel nicht weiter → Baseline bitgleich. Spass bleibt 2 (spätes Spiel,
  nicht erste Stunde). Wert n mit `design-economy-designer` gegen die Gewürz-Erzeugung rechnen.
- Entscheid: R238 → eingeplant als Zusatz zum M12-Seefahrt-Bündel E2+E3+E4 (Spec-Nachtrag M12, Anhang 05; Flagge mit Save v9)

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

### I-015 · neu · Seefahrt-Leitsätze

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: Playtest 2026-10-06 (REL-05, wörtlich: „kein freies schiff für den transport von gewürzen zur hauptinsel. keine hilfe wie ich ein schiff bauen/kaufen/bekommen könnte“); Pfade `src/ui/guide.ts` (C.11, Z. 158–160: Leitsatz endet bei „Gründe ein Kontor auf einer Insel mit Gewürz“), `src/ui/ships.ts:118` und `src/ui/app.ts:507` (Grund „Kein freies Schiff“ ohne Weg), `src/ui/ships.ts` `buyShipView`, `README.md` Z. 368–379; Folgepaket (2) aus R274b (state.md) enthält schon „Heimatkontor-Klick → Schiffe direkt“
- Spielerwirkung: „Der Spieler liest nach Kontor II im Leitsatz «Kaufe ein Handelsschiff im Heimatkontor», danach «Lege eine Route: Gewürz von <Insel> heim», und der Grund «Kein freies Schiff» nennt den Weg (kaufen oder Route lösen)."
- Grösse: S · Risiko: keins (nur Texte und Schrittbedingungen in `src/ui/`; mit Folgepaket (2) R274b abstimmen, nicht doppeln)
- Raster: offen
- Verwandt: I-019
- Entscheid: offen

### I-016 · neu · Werft

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik (nur Mechanik, ADR-006): Schiffe entstehen in einem Küstengebäude statt per Knopf; Playtest 2026-10-06 („oder eine werft?“); heute Kauf im Kontor-Panel der Heimat (`src/ui/ships.ts` `buyShipView`)
- Spielerwirkung: „Der Spieler baut eine Werft an der Küste, bestellt dort ein Schiff, sieht es nach einer Bauzeit vom Stapel laufen und weiss damit, wo Schiffe herkommen."
- Grösse: M · Risiko: Save (neues Gebäude, Auftrag mit Restzeit im Weltzustand, Migration mit Standardwert); Baseline prüfen, falls der Controller Schiffe kauft
- Raster: offen
- Entscheid: offen

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

### I-022 · gepitcht · Leertaste pausiert

- Bereich: Bedienung · Säule: Bedienung · Quelle: Nutzer 2026-10-08 (R323, wörtlich: „Leertaste für Pause/Unpause“)
- Ist-Stand: Pause liegt heute auf `P` (README „Tastatur und Maus“, Z. 132); die Leertaste ist belegt als „halten + linke Maustaste = Karte verschieben“ und aktiviert auf fokussierten Knöpfen den Knopf (`src/ui/input.ts` Z. 444–449, `hotkeyAction`).
- Spielerwirkung: „Der Spieler hält das Spiel mit der grössten Taste der Tastatur an und setzt es fort, ohne die Hand von der Maus-Tastatur-Haltung zu lösen.“
- Grösse: S · Risiko: Tastenkonflikt mit Leertaste-Halten zum Verschieben (Antippen = Pause, Halten + Ziehen = Verschieben müsste unterscheidbar sein, z. B. Pause erst beim Loslassen ohne Mausbewegung) und mit der Knopf-Aktivierung (R121 Punkt 3); `P` bleibt als zweiter Weg; Save, Baseline, Perf unberührt
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12
- Doppelung: keine (Pause per `P` existiert, Leertaste nicht)
- Bewertung IDEEN-03: Lösung des Konflikts: Antippen (Taste unten und oben ohne Mausdruck, unter 300 ms) = Pause, Halten + Ziehen = Verschieben; Pause erst beim Loslassen. Auf fokussierten Knöpfen bleibt die Leertaste Knopf-Aktivierung. `P` bleibt.
- Entscheid: Empfehlung einplanen, Bündel TASTEN-KOMFORT (R323-Folge, Reihenfolge 1)

### I-023 · gepitcht · Pipette für Gebäude

- Bereich: Bedienung · Säule: Bedienung · Quelle: Nutzer 2026-10-08 (R323, wörtlich: Pipettenwerkzeug zum Kopieren von Gebäuden); Genre-Mechanik: Bautyp vom Bestand übernehmen
- Ist-Stand: Nicht vorhanden; das Werkzeug wählt man über Bauleiste oder Buchstabentaste (`src/ui/buildMenu.ts`, `src/ui/input.ts` `hotkeyAction`), Anklicken im Werkzeug „Auswahl“ öffnet nur das Info-Panel (`src/ui/inspect.ts`).
- Spielerwirkung: „Der Spieler klickt ein Gebäude an (z. B. mit Mittelklick oder Taste) und hat denselben Gebäudetyp sofort als Bauauswahl, statt in Leiste oder Tastenkürzeln zu suchen.“
- Grösse: S · Risiko: Eingabekonflikt (mittlere Maustaste verschiebt die Karte, README Z. 77; Taste statt Maus wählen); gesperrte Typen (Freischaltung, Rinderfarm ohne Taste) müssen den Grund nennen; Save, Baseline, Perf unberührt
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 3 = 13
- Doppelung: keine
- Bewertung IDEEN-03: Auslöser Strg/Cmd + Linksklick auf ein Gebäude (mittlere Taste bleibt Verschieben, Buchstaben sind alle belegt) plus Knopf «Gleiches bauen» im Info-Panel (auffindbar, auch für I-026); gesperrte Typen nennen den Grund.
- Entscheid: Empfehlung einplanen, Bündel TASTEN-KOMFORT (Reihenfolge 1)

### I-024 · bewertet · Direkt als Stufe 2 bauen

- Bereich: Inhalt/Bedienung · Säule: Produktionsketten · Quelle: Nutzer 2026-10-08 (R323, wörtlich: Gebäude bereits in der höheren Stufe bauen)
- Ist-Stand: Gebäude entstehen immer auf Stufe 1; Ausbau einzeln per Knopf „Ausbauen“ (`src/sim/upgrade.ts` `upgradeBuilding`: Stufe 1 → 2 → 3, Kosten und Gebühr aus `src/sim/defs/levels.ts`, gesperrt bis U3 (Stufe 2) bzw. U5 (Stufe 3), nicht bei Brand; Abriss erstattet die Hälfte).
- Spielerwirkung: „Der Spieler wählt beim Platzieren «Stufe 2» und zahlt Bau und Ausbau in einem Zug, statt nach dem Bau zurückzukehren und einzeln aufzurüsten.“
- Grösse: M · Risiko: **berührt Sim-Regeln (nicht entschieden):** Kosten und Gebühr bei Bau (Summe oder Rabatt?), Sperren U3/U5, `build.ts`-Ergebnisse und Controller-Verhalten; Save nur, wenn ein neues Feld nötig ist; Baseline, falls der Controller es nutzt; Balancing-Test; Platzier-Vorschau und Tooltips müssten Kosten beider Stufen zeigen; Alternative ohne Sim-Änderung: UI-Knopf „Bauen und gleich ausbauen“ als zwei Sim-Aktionen
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 1 = 9
- Verwandt: I-025
- Bewertung IDEEN-03: Rabatt oder Summe der Kosten ist eine Wirtschaftsentscheidung (Dominanz: Stufe 2 direkt lässt Stufe 1 überflüssig, Sperre U3 und Gebühr müssten neu begründet werden). Mit Pipette und Umschalt+U sind es nur zwei Tastendrücke mehr; Nutzen klein.
- Entscheid: Empfehlung parken bis Pipette und Ausbau-Taste live sind und Playtest zeigt, dass Nachrüsten nervt (dann nur UI-Variante «Bauen und gleich ausbauen» als zwei Sim-Aktionen, ohne Sim-Änderung)

### I-025 · gepitcht · Ausbau-Taste

- Bereich: Bedienung · Säule: Bedienung · Quelle: Nutzer 2026-10-08 (R323, wörtlich: Taste `U` als Shortcut zum Upgraden des markierten Gebäudes)
- Ist-Stand: Ausbau nur per Knopf „Ausbauen“ im Info-Panel (`src/ui/inspect.ts` `InspectActions.upgrade`, Panel-Abschnitt „Ausbau zu Stufe n“); **`U` ist bereits Schule** (README Z. 136, `hotkeyAction` in `src/ui/input.ts`).
- Spielerwirkung: „Der Spieler wählt ein Gebäude und baut es mit einem Tastendruck aus, ohne den Knopf im Panel zu suchen.“
- Grösse: S · Risiko: **Tastenkonflikt `U`/Schule** (Taste müsste neu vergeben oder eine andere Taste gewählt werden, z. B. Strg-freie Alternative; Entscheid an lead-design/L0); Taste wirkt nur bei markiertem Gebäude und muss bei Misserfolg den Grund nennen (`upgradeBuilding` liefert `{ ok, reason }`); Wohnhäuser steigen von selbst auf (kein Ausbau); Save, Baseline, Perf unberührt
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12
- Verwandt: I-024, I-026
- Bewertung IDEEN-03: Konflikt bestätigt, und es ist kein Buchstabe mehr frei (A–Z: WASD Karte, alle übrigen Werkzeuge; `src/ui/hotkeys.ts`). Lösung: `Umschalt+U` = Ausbau des markierten Gebäudes (`U` allein bleibt Schule; README „Gross- und Kleinschreibung ist egal“ gilt für Werkzeuge, Ausbau ist die einzige Umschalt-Taste und wird dort genannt). Alternative: `+`.
- Entscheid: Empfehlung einplanen, Bündel TASTEN-KOMFORT (Reihenfolge 1); Taste per Ruling L0 festlegen

### I-026 · gepitcht · Übersichtliches Gebäude-Panel

- Bereich: Bedienung/Grafik · Säule: Bedienung · Quelle: Nutzer 2026-10-08 (R323, wörtlich: Beschrieb beim Anklicken mit Produktionsstatistik, Upgrade usw. auf einen Blick statt unformatiertem, undurchsichtigem Text)
- Ist-Stand: Panel besteht aus Textzeilen (`addLine`) mit Zustand, Stufe, Auslastung, Produktion, Fortschritt, Unterhalt und Ausbau-Abschnitt (`src/ui/inspect.ts` Z. 205–340, README Z. 265–270); Wohnhaus-Panel hat Symbol-Chips für Bedürfnisse (`needIcons`), Betriebe nicht.
- Spielerwirkung: „Der Spieler erkennt beim Anklicken eines Betriebs auf einen Blick Zustand, Ausstoss je Minute, Auslastung und den Gewinn des nächsten Ausbaus, gegliedert in Kopf, Kennzahlen und Ausbau-Karte statt in einem Textblock.“
- Grösse: M · Risiko: Layout (`src/style.css`, Desktop ab 1280 px), Panel-Tests in `tests/ui/`, Browser-Prüfung; keine Sim-Änderung; Abstimmung mit Wunsch-Taste I-025 (Ausbau-Karte zeigt die Taste) und I-015 (Texte)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 3 = 12
- Verwandt: I-025
- Bewertung IDEEN-03: eigenes Paket nach TASTEN-KOMFORT (gleiche Dateien `inspect.ts`, sonst Merge-Konflikt); Ausbau-Karte zeigt `Umschalt+U`, Knopf «Gleiches bauen».
- Entscheid: Empfehlung einplanen als eigenes M-Paket (Reihenfolge 2)

### I-027 · gepitcht · Seekarte und Gründungsfahrt

- Bereich: Bedienung/Grafik · Säule: Insel besiedeln (Archipel erlebbar machen) · Quelle: Spec-Kann-Teil E5 (`docs/superpowers/specs/2026-10-05-m12-weite-welt-spec/anhang-03-e2-e4-regeln-und-werte.md` Abschnitt G, AK-E5-01/-02 in `anhang-04-ak-liste.md`); Ist-Stand: `README.md` Z. 359 (Knopf «Inseln», Tasten `0`/`9` wechseln nur die Insel), `src/sim/defs/sea.ts` (`ISLANDS`, `dMin`/`dMax`)
- Spielerwirkung: „Der Spieler öffnet im Knopf «Inseln» eine kleine Seekarte mit allen Inseln, Fahrlinien und Schiffspunkten, springt per Klick zu einer Insel und sieht nach dem Bau eines Kontors II ein Schiff einmalig von der Heimat zur neuen Insel fahren."
- Grösse: S–M (Karte S, Gründungsfahrt M-Anteil) · Risiko: Perf (Silhouetten je Insel einmal rastern und cachen); kein Sim-Zustand, nicht im Save, Baseline unberührt
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11 (nur Karte; mit Gründungsfahrt Aufwand 2 = 10)
- Randfälle: Kontor II wird während der Fahrt abgerissen → Sprite endet ohne Meldung; Laden → keine Fahrt (AK-E5-02); Schiff ohne Route erscheint nicht als Punkt, Schiff im Hafen als Punkt am Anker; Fenster unter 1280 px nur „stürzt nicht ab".
- Doppelung: keine; I-019 (Angebotsschiff) betrifft den Kauf, nicht die Übersicht. Zusammen mit dem Seefahrt-Bündel lesbar, nicht davon abhängig.
- Bewertung lead-design (IDEEN-04): Schnitt in zwei Teile. Karte mit Silhouetten, Linien und Schiffspunkten ist S und löst echtes Orientierungsproblem (Inselwechsel heute nur per `9`/`0` und Listenknopf); die Gründungsfahrt ist reine Kür (M-Anteil, kein Sim-Wert) und kommt später. Passung 3 → 2: stärkt Archipel indirekt. Spass bleibt 2, da Übersicht ohne neue Entscheidung. Silhouetten einmal cachen (Perf, `CAPS`). Pitch als S-Häppchen nur für die Karte.
- Entscheid: Empfehlung einplanen (nur Karte, S-Platz REL-12); Ruling IDEEN-04 offen

### I-028 · gepitcht · Steuer je Stufe

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik (nur Mechanik, ADR-006): Steuersatz getrennt nach Bevölkerungsgruppe; Ist-Stand `README.md` Z. 453 („gilt für die ganze Insel", ein Regler), `src/sim/defs/tiers.ts` (`tax` 2/7/14/22), Amtsstube (`src/sim/defs/buildings.ts` `townhall`)
- Spielerwirkung: „Der Spieler stellt in der Amtsstube die Steuer für Pioniere, Siedler, Bürger und Kaufleute getrennt ein und entscheidet, ob er Pioniere niedrig hält, damit sie schnell aufsteigen, und Kaufleute stärker belastet."
- Grösse: M · Risiko: Save und Baseline (vier Stufenwerte statt eines im Weltzustand, Migration mit dem bisherigen Wert für alle; Controller stellt heute global ein → Fingerabdruck nur bitgleich, wenn alle vier gleich gesetzt bleiben)
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 1 = 12
- Randfälle: Kaufleute haben keinen Aufstieg (`upgradeCost: null`), „hoch" kostet dort nur Belegung → Dominanz möglich, Belegung oder Versorgung muss dort greifen (mit `design-economy-designer` prüfen); Sperre von 30 s nach dem Umschalten je Regler oder gemeinsam; Kopfzeilen-Knopf zeigt Mischung («gemischt»); Tooltip und Chronik müssen die Wirkung je Stufe nennen.
- Doppelung: keine; I-007 (Fest) beschleunigt Aufstieg lokal und warenbasiert, diese Idee ist global und geldbasiert je Stufe; zusammen testen, damit „niedrig" für Siedler plus Fest nicht dominiert.
- Bewertung lead-design (IDEEN-04): Stärkste neue Entscheidung der Runde und schon in der ersten Stunde spürbar (Pioniere und Siedler niedrig für schnellen Aufstieg gegen Steuer, Kaufleute ohne Aufstieg anders). Risiko 1: Save und Baseline zugleich. **Entartung:** Kaufleute ohne Aufstieg machen «hoch» dort dominant (nur Belegung als Preis); die Stufe «hoch» braucht für Kaufleute einen echten Preis (Abwanderung oder Versorgungsschwelle), sonst ist es ein versteckter Pflichtregler. Der Controller fährt global; bei vier gleichen Werten bleibt die Baseline bitgleich. Werte und Bilanz je Einwohner mit `design-economy-designer`. M (Reglerlogik, Panel, Kopfzeile, Migration, Balancing): Baustein fürs Wirtschafts-Brainstorming, nicht in den S-Platz.
- Entscheid: R405 → Baustein Wirtschafts-Brainstorming; Designvorschlag `docs/superpowers/specs/2026-10-09-steuer-je-stufe-vorschlag.md` (Kaufleute «hoch» 115 %, «niedrig» für Kaufleute gesperrt), Gate Spec-Vorschlag offen

### I-029 · bewertet · Gefragte Ware

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik (nur Mechanik, ADR-006): wechselnde Nachfrage nach einem Handelsgut; Pfade `src/sim/defs/goods.ts` (`sell` fest, `SELL_FLOOR`/`SELL_DROP` Sättigung), `src/sim/defs/crises.ts` (`BOOM_PCT` 150 gilt für alle Güter), `README.md` („Handel" mit Verkaufssättigung)
- Spielerwirkung: „Der Spieler sieht am Kontor-Chip «Gefragt: Rum +40 % · noch 3:00» und entscheidet, ob er Rum aus dem Lager jetzt verkauft oder die Brennerei hochfährt, statt immer das Gut mit dem besten Grundpreis zu liefern."
- Grösse: S–M · Risiko: Save und Baseline (aktives Gut mit Ablauf im Weltzustand; Ziehung über eigenen seeded Strom nach ADR-010, nicht in Aufträge oder Krisen; Controller verkauft nicht nach Nachfrage → Baseline bitgleich)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Aufschlag so klein, dass „Gefragt" nie über den Kaufpreis führt (Verkauf bleibt unter `buy`, kein Kauf-und-Verkauf-Gewinn); fällt mit Boom zusammen → nur der höhere Satz, nicht multipliziert; Gut noch nicht freigeschaltet → nicht ziehbar; Lager leer → Chip bleibt, Hinweis «Kein Bestand».
- Doppelung: keine; Boom hebt alle Preise gleichzeitig, I-006 betrifft Zukauf (Kaufseite), Handelsaufträge sind Fixmengen mit Prämie. Gefragte Ware ist die Verkaufsseite je Gut.
- Bewertung lead-design (IDEEN-04): Verkaufsseite je Gut ist neu, aber Boom (alle Güter 150 %) und Sättigung decken schon einen Teil; der Mehrwert gegen heute ist eine kleine Umlenkung des Verkaufs. Gleicher Eingriffstyp (Weltzustand, eigener Strom, Krisen-Test) wie I-006; beide gemeinsam im Handels-Brainstorming denken (Kaufseite I-006 ≤ −20 %, Verkaufsseite hier ≤ Kaufpreis ohne Kauf-und-Verkauf-Gewinn). Nicht gepitcht.
- Entscheid: Empfehlung parken bis Handels-Brainstorming (mit I-006); Ruling IDEEN-04 offen

### I-030 · bewertet · Wahlziele nach der Gewürzstadt

- Bereich: Inhalt · Säule: Insel besiedeln (Langzeitmotivation) · Quelle: `README.md` Z. 31–33 („danach spielst du frei weiter"; nach dem dritten Ziel gibt es kein weiteres Ziel); Genre-Mechanik: freiwillige Zusatzziele nach dem Hauptziel
- Spielerwirkung: „Der Spieler wählt nach der Gewürzstadt aus drei freiwilligen Zielen im Ziel-Chip (z. B. «Alle drei Inseln mit Kontor», «Bilanz über +500 / min», «Alle Häuser Kaufleute auf 100 Einwohner») und hat wieder eine Richtung für die Wirtschaft."
- Grösse: S · Risiko: Save (gewähltes und erreichtes Wahlziel als Flagge, Migration mit „keins"); Ziele nur als Daten in `src/sim/defs/`; Controller läuft nach Ziel 3 nicht weiter → Baseline bitgleich
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 2 = 11
- Randfälle: Wert beim Erreichen nur gehalten gültig (Bilanz kurz positiv zählt nicht, wie bei I-010: Stand beim Prüfen über 60 s); Wechsel des Wahlziels erlaubt, erreichte Ziele bleiben erreicht; Spielstand, der die Bedingung schon erfüllt → Meldung einmal; Spielende gibt es nicht.
- Doppelung: keine; I-010 (Gewürzstadt) ist das dritte Hauptziel, I-017 (Auftragsreihe) und I-018 (Story) sind Vorlauf und Erzählung, nicht Nachspiel.
- Bewertung lead-design (IDEEN-04): Lücke nach Ziel 3 echt, aber die Beispielziele tragen nicht: «Bilanz +500 / min» ist mit 100 Kaufleuten (≈ 12 000 Geld/min brutto) in Minuten erreicht, das war schon die Entartung von I-010. Brauchbar nur mit Zielen, die Planung verlangen (z. B. n Kaufleute auf zwei Inseln, alle Güter lieferbar, gehalten 60 s). Die Zielwerte brauchen `design-economy-designer`; Spass 2 (spätes Spiel). Grenzfall des Pitchs (11), aber ohne tragfähige Werte noch nicht: geparkt-Empfehlung bis Werte stehen.
- Entscheid: Empfehlung parken bis Zielwerte gerechnet sind; Ruling IDEEN-04 offen
