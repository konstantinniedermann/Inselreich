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

### I-001 · eingeplant · Anbinden auf Knopfdruck

- Bereich: Bedienung · Säule: Insel besiedeln · Quelle: Genre-Mechanik: Aufbauspiele schlagen beim Platzieren eine Wegverbindung zum Netz vor und bauen sie auf Wunsch in einem Zug; Nutzer-Startkarte (Pfad `README.md`, Abschnitt „Start": „mit einem Weg zum Kontor verbinden" ist der dritte der ersten drei Schritte)
- Spielerwirkung: „Der Spieler klickt im Info-Panel eines nicht angebundenen Betriebs auf «Anbinden (n Wege · x Geld)» und bekommt den kürzesten Weg zum Netz gebaut, statt den roten Punkt selbst aufzulösen."
- Grösse: S · Risiko: keins (reine, deterministische Wegsuche über freie Kacheln in `src/sim/`, Bau über die vorhandene Weg-Aktion; Controller nutzt sie nicht → Baseline bitgleich; kein neues Save-Feld)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Bewertung lead-design: Scout-Fassung (Vorschau beim Platzieren, M, 13) auf die S-Fassung im Panel gekürzt; Spass 3 → 2, weil es Bequemlichkeit ist, keine neue Entscheidung (Weg ziehen per Maus gibt es). Randfälle: kein Pfad (Gebirge/Wasser) → blasser Knopf mit Grund; Geld reicht nicht für alle Kacheln → Grund statt Teilbau; Pfad frisst bebaubare Fläche → Vorschau beim Überfahren des Knopfs. Die Layout-Entscheidung bleibt beim Spieler, weil der Knopf nur auf Wunsch wirkt.
- Entscheid: R210 → eingeplant H-U1 (übernächstes Release, lead-tech; Randfälle in die Kurz-Spec)

### I-002 · eingeplant · Meldung führt zum Ort

- Bereich: Bedienung · Säule: Produktionsketten · Quelle: Genre-Mechanik: Ein Klick auf eine Ereignismeldung zentriert die Kamera auf den Schauplatz; Pfad `src/ui/crisisLog.ts` (`LogEntry` ohne Ortsangabe) und `src/ui/app.ts` (`centerOn` wird nur beim Start genutzt)
- Spielerwirkung: „Der Spieler klickt auf eine Brand-, Sturm- oder Mangelmeldung und sieht sofort das betroffene Gebäude in der Bildmitte, statt es in einer wachsenden Stadt zu suchen."
- Grösse: S · Risiko: keins (Log gehört nicht zum Spielstand; `LogEntry` bekommt ein optionales Ziel)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Bewertung lead-design: Bewertung des Scouts bestätigt. Gilt für Einträge mit Ort (Brand, Anbindung, Aufstieg); Einträge ohne Ort (Boom, Auftrag) bleiben nicht klickbar und sind so erkennbar. Randfall: Gebäude inzwischen abgerissen → Kamera springt auf die Kachel, Meldung „Gebäude nicht mehr vorhanden". Wird in M12 (mehrere Inseln) wertvoller; dort nicht doppeln.
- Entscheid: R210 → eingeplant H-U2 (Studio-Platz REL-01, lead-tech/UI)

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

### I-005 · eingeplant · Arbeitsgeräusche der Betriebe

- Bereich: Ton · Säule: Produktionsketten · Quelle: Genre-Mechanik: Betriebe klingen hörbar nach ihrer Arbeit, wenn die Kamera nah ist; Pfad `README.md` („Umgebung folgt dem Bildausschnitt", Effekte nur für Bauen, Münzen, Krisen) und `src/audio/`
- Spielerwirkung: „Der Spieler hört beim Heranzoomen Sägen am Holzfäller, Hämmern am Werkzeugmacher und Wellen am Fischer und erkennt an Stille, welcher Betrieb gerade steht."
- Grösse: M · Risiko: Perf (zunächst synthetisch aus Rauschen und Filtern, keine fremden Dateien; offen lizenzierte Klänge nur über `art-license-checker`)
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Bewertung lead-design: bestätigt, unter der Pitch-Schwelle. Kleinere Fassung möglich: ein kurzer synthetischer Ton je abgeschlossenem Produktionszyklus der Betriebe im Bild, mit Obergrenze je Sekunde (S, lead-art). Parken bis zum nächsten Ton-Anlass.
- Entscheid: R219 → kleine Fassung eingeplant in H-A2 (REL-02) zusammen mit I-009

### I-006 · geparkt · Händler-Sonderangebot

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik: Ein durchreisender Händler bietet zeitlich begrenzt ein Gut unter dem Kaufpreis an; Pfad `README.md` („Kaufpreise sind fest", „Waren dafür zuzukaufen lohnt sich nie": Zukaufen ist heute nie eine Entscheidung)
- Spielerwirkung: „Der Spieler sieht auf der Auftragskarte ein befristetes Angebot («Werkzeug −30 % · noch 0:40 · höchstens 10») und entscheidet, ob er Geld jetzt in Vorrat steckt, statt es zu bauen."
- Grösse: M · Risiko: Save und Baseline (Angebot als Weltzustand mit Ablauf; Ziehung über den seeded RNG, Controller nutzt es nicht; Strom darf die Auftragsziehung nicht verschieben)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Angebotspreis liegt über dem Verkaufspreis → Kaufen-und-Verkaufen darf nie Gewinn bringen (Rabatt höchstens −30 %, Verkauf bleibt 40 % des Kaufpreises, Höchstmenge je Angebot); Lager voll oder Geld negativ → Knopf blass mit Grund; Angebot und Auftrag laufen zugleich → beide Karten bleiben lesbar.
- Doppelung: keine; Aufträge (Verkauf an Händler) und Boom (Verkaufspreis) existieren, die Kaufseite ist unberührt. Handelsrouten (M12) sind Schiffsverkehr, nicht dieses Zufallsangebot.
- Bewertung lead-design: Spass 3 → 2: Billig-Vorrat ist eine kleine Abwägung, die Lagergrenze 100 deckelt sie. **Entartung:** −30 % bricht die Regel „Zukaufen für Aufträge lohnt nie“ (Stoff 21 < Prämie 22, Rum 28 < 30, Glas 35 < 37, Stein 10,5 < 11); sicher ist höchstens −20 % (engste Spanne Nahrung, Wolle, Zuckerrohr, Rum: Prämie = 75 % des Kaufpreises). Einfachere Variante: vierte Krisenart „Schnäppchen“ im vorhandenen Krisen-Pool (Karte, Ziehung, Restzeit vorhanden) — ändert aber die Krisenverteilung und damit `balance-crises.test.ts`. Baustein fürs M12-Brainstorming (Handel), nicht gepitcht.
- Entscheid: R219 → geparkt fürs M12-Brainstorming (Handel; Rabatt ≤ 20 %)

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

### I-009 · eingeplant · Hörbarer Mangel

- Bereich: Ton · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik: Ein dezenter Warnton meldet, dass Bewohner hungern oder frieren, auch wenn der Spieler gerade woanders hinsieht; Pfad `src/audio/sound.ts` (`SoundEvent` kennt Bauen, Münzen, Aufträge, Aufstieg, Krisen, aber keinen Versorgungsmangel), `README.md` (Mangel zeigt sich nur als Kartensymbol und Text)
- Spielerwirkung: „Der Spieler hört einen kurzen, tiefen Doppelton, sobald ein Bedürfnis im Lager ausgeht (Nahrung höher, Stoff weicher), und schaut nach, noch bevor ein Haus schrumpft."
- Grösse: S · Risiko: keins (synthetisch aus Oszillator und Hüllkurve wie `buildSounds.ts`, keine fremden Dateien, keine Lizenz; Auslöser aus dem vorhandenen Mangel-Zustand, nicht im Spielstand)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: Dauer-Mangel → Ton nur beim Wechsel von „gedeckt" zu „fehlt" je Gut, mit globaler Drosselung (mind. 20 s Abstand), kein Dauerpiepen; Stumm oder Effekte-Regler 0 → nichts; Ton zugleich mit Krisenalarm → Krise hat Vorrang (Ducking der vorhandenen Signale nutzen).
- Doppelung: keine; I-005 sind Arbeitsgeräusche der Betriebe (Produktionszyklus), dies ist ein Warnsignal der Versorgung; I-002 führt zum Ort, dies meldet nur hörbar.
- Bewertung lead-design: bestätigt (12). Auslöser: Lagerbestand eines Bedürfnis-Guts fällt auf 0, während versorgte Häuser es verbrauchen (Übergang, nicht Zustand); die UI meldet das Ereignis an `src/audio/`, das nichts aus `src/sim/` importiert. Kein Ton vor dem ersten Haus mit diesem Bedürfnis, nicht nach Laden/Neue Insel für schon leere Güter. Passt mit der kleinen Fassung von I-005 (Ton je Produktionszyklus) zu einem Ton-Häppchen „hörbare Wirtschaft“ für `art-audio-engineer` (gleiche Dateien, ein Browser-Lauf).
- Entscheid: R219 → eingeplant H-A2 „Hörbare Wirtschaft“ (REL-02, Studio-Platz)
