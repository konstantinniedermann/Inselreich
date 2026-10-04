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

### I-005 · geparkt · Arbeitsgeräusche der Betriebe

- Bereich: Ton · Säule: Produktionsketten · Quelle: Genre-Mechanik: Betriebe klingen hörbar nach ihrer Arbeit, wenn die Kamera nah ist; Pfad `README.md` („Umgebung folgt dem Bildausschnitt", Effekte nur für Bauen, Münzen, Krisen) und `src/audio/`
- Spielerwirkung: „Der Spieler hört beim Heranzoomen Sägen am Holzfäller, Hämmern am Werkzeugmacher und Wellen am Fischer und erkennt an Stille, welcher Betrieb gerade steht."
- Grösse: M · Risiko: Perf (zunächst synthetisch aus Rauschen und Filtern, keine fremden Dateien; offen lizenzierte Klänge nur über `art-license-checker`)
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Bewertung lead-design: bestätigt, unter der Pitch-Schwelle. Kleinere Fassung möglich: ein kurzer synthetischer Ton je abgeschlossenem Produktionszyklus der Betriebe im Bild, mit Obergrenze je Sekunde (S, lead-art). Parken bis zum nächsten Ton-Anlass.
- Entscheid: R210 → geparkt; kleine Fassung (Ton je Produktionszyklus, S) bei freiem Studio-Platz
