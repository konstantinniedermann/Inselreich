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

## Rangliste IDEEN-10 (Vorschlag lead-design, Ruling L0 offen)

Breite Runde nach REL-22 (R445), Scouts A (Spätspiel und Handel nach Handel 2) und B (Komfort und Übersicht): 9 Vorschläge,
eingetragen als I-101–I-109. Keine Idee ändert Kernsäule, Genre oder Titel (§5.3); keine doppelt Erweiterung 1 oder
Handel 2 (I-101 und I-102 setzen Handel 2 live voraus, I-104 und I-105 nach Handel 2 bzw. K3 prüfen). Pool danach: 19 von 40 offen.

| Rang | ID    | Name                                | Grösse | Summe | Save / Baseline | Nutzen/Aufwand                                | Empfehlung                                           |
| ---- | ----- | ----------------------------------- | ------ | ----- | --------------- | --------------------------------------------- | ---------------------------------------------------- |
| 1    | I-102 | Auftragsvorschau                    | S      | 13    | nein / nein     | Auftrag planbar, ≈ 60 Tools                   | live mit UI-HAEPPCHEN-E (siehe Archiv)               |
| 2    | I-104 | Ausschreibung                       | M      | 13    | ja / nein       | echte Spätspiel-Wahl «Vorrat statt Verkauf»   | parken: Baustein Handels-Brainstorming nach Handel 2 |
| 3    | I-109 | Reichweite am Gut-Chip              | S–M    | 12    | nein / nein     | Mangel vorausplanen, ≈ 1 Paket                | live mit UI-HAEPPCHEN-D (siehe Archiv)               |
| 4    | I-108 | Einnahmen und Unterhalt getrennt    | S      | 12    | nein / nein     | Wirtschaftslage auf einen Blick, ≈ 60 Tools   | einplanen Häppchen                                   |
| 5    | I-103 | Routen-Bilanz                       | S–M    | 12    | nein / nein     | Schiffsentscheid statt Bauchgefühl, ≈ 1 Paket | einplanen nach Handel 2 (mit I-101)                  |
| 6    | I-101 | Fernauftrag-Marke Seekarte          | S      | 12    | nein / nein     | Fernauftrag auf einen Blick, ≈ 50 Tools       | einplanen mit Handel 2 als Beipack                   |
| 7    | I-105 | Abfahrtsregel der Route             | M      | 11    | ja / nein       | Takt gegen Auslastung, ≈ 2 Pakete             | parken: K3-Spec klären (I-015)                       |
| 8    | I-106 | «Neu»-Karte schlank und schliessbar | S      | 10    | nein / nein     | Sicht frei, ≈ 50 Tools                        | prüfen gegen UI-AUFRAEUM-3/-D, sonst verwerfen       |
| 9    | I-107 | Tempo-Tasten + und −                | S      | 10    | nein / nein     | Lückenfüller, ≈ 40 Tools                      | parken (I-083 deckt den Kern)                        |

## Rangliste IDEEN-09 (Vorschlag lead-design, Ruling L0 offen)

Breite Runde nach REL-21 (R604, R445), Scouts A (Playtests REL-20/21), B (Genre Aufbau und Handel), C (Bedienung Desktop)
parallel: 14 Vorschläge, 13 eingetragen als I-088–I-100. Scout-Idee A2 «Inselvorteil im Betriebs-Panel» entfällt (schon live:
`src/ui/inspect.ts` zeigt `traitLine`). Keine Idee ändert Kernsäule, Genre oder Titel (§5.3); keine gehört in Erweiterung 1, I-096
grenzt an K2 «Stand halten». Sortiert nach Raster-Summe, bei Gleichstand nach Nutzen je Aufwand.

**Bereinigung nach R599 (Bestätigung im Runden-Ruling):** ins Archiv als `geparkt` I-029, I-051, I-058, I-059 (R474) und I-077,
I-081, I-082, I-084, I-086 (R566), dazu I-048 (R571 Verzicht, Mechanik inaktiv); Rangliste IDEEN-08 ins Archiv. I-047 bleibt
`eingeplant` bis REL-21 live ist. Pool danach: 15 von 40.

Nach UI-AUFRAEUM-3: I-089, I-098, I-099 live und im Archiv; die Ränge sind neu durchnummeriert (bisherige Ränge 2 und 7 = I-088/I-090, Zeilen im Archiv).

| Rang | ID    | Name                         | Grösse | Summe | Save / Baseline | Nutzen/Aufwand                                    | Empfehlung                                        |
| ---- | ----- | ---------------------------- | ------ | ----- | --------------- | ------------------------------------------------- | ------------------------------------------------- |
| 1    | I-092 | Inselmarkt-Vorliebe          | S–M    | 12    | nein / nein     | jede Fremdinsel bekommt eine Handelsrolle, 1 Pkt. | einplanen: Design-Paket mit Rechnung, dann 1 Pkt. |
| 2    | I-100 | «Neu»-Zähler am Ereignis-Log | S–M    | 11    | nein / nein     | verpasste Krisen bei 4× lesbar, ≈ 70 Tools        | einplanen Häppchen danach; ersetzt I-058          |
| 4    | I-091 | Treuebonus beim Stammkunden  | M      | 11    | ja / nein       | Bindung belohnt (Kulanz statt Geld), ≈ 60 Tools   | Spec OK R671, Plan Stufe voll (lead-tech)         |
| 7    | I-097 | Pause sichtbar auf der Karte | S      | 9     | nein / nein     | Orientierung, kein Playtest-Befund                | live mit UI-HAEPPCHEN-E (siehe Archiv)            |
| —    | I-096 | Steuerstufe je Insel         | S–M    | 8     | ja / nein       | Stellschraube ohne neue Abwägung                  | verwerfen                                         |

I-093 (verworfen) und I-095 (erledigt) sind nach Handel 2 (R658, R664) ins Archiv verschoben; die Ränge 3 und 6 entfallen.

## Ideen

### I-047 · eingeplant (auf main mit R596, live mit dem Push REL-21) · Stammkunde (Liefervertrag)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik (Dauerabnahme gegen Festpreis, nur Mechanik, ADR-006); IDEEN-06 Scout A; Pfade `src/sim/orders.ts` (Aufträge einmalig), `src/sim/defs/goods.ts` (`ORDER_PREMIUM`, Sättigung)
- Spielerwirkung: „Der Spieler nimmt nach einem erfüllten Auftrag das Angebot «Stammkunde: 12 Rum alle 3 min zu 130 %» an und wägt feste Abnahme gegen Verkauf am freien Markt ab."
- Grösse: M · Risiko: Save (Vertragszustand im Weltzustand, Migration „keiner"); Baseline bitgleich, solange der Controller keinen Vertrag annimmt
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: höchstens ein Vertrag; nur für Güter mit Erzeuger; verpasste Lieferung beendet ihn mit 100 Geld Strafe, Kündigen kostenlos; Preis bleibt unter `buy` (Rum 23,4 < 40, kein Kauf-und-Verkauf-Gewinn); Menge < 40 % der gemessenen Erzeugung, damit kein Pflichtbau entsteht.
- Doppelung: keine im Mechanismus; I-029 (Spotnachfrage) und I-006 (Kaufseite) teilen dieselbe Stelle (Handel am Kontor).
- Bewertung lead-design (IDEEN-06): Spass 3 → 2: Die Bindung trägt erst für Fortgeschrittene, die Rum im Überschuss haben; im ersten Spiel bleibt sie unsichtbar. Mit I-006 und I-029 als ein Handels-Baustein denken, nicht einzeln einplanen.
- Nutzen/Aufwand: mittlerer Nutzen (Planbarkeit im Mittelspiel) · M · ≈ 2 Pakete (Rechnung `design-economy-designer` ≈ 40 Tools, Sim+Panel ≈ 150 Tools)
- Entscheid: Empfehlung parken bis Handels-Brainstorming (mit I-006, I-029); R474 bestätigt
- Entscheid: R486 (O3) → eingeplant als Paket nach I-048, nur in der Fassung mit Gewicht (≈ 25 % der Erzeugung zu 120 %, M14-Anhang 01 C.1); I-029 und I-006 bleiben geparkt; Stand: wartet auf den Entscheid I-048 Schritt B (bei Verzicht sofort frei)
- Verweis IDEEN-08: bleibt hinter I-048 Schritt B (R551) eingereiht; Erweiterung 1 ändert daran nichts

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

### I-091 · gemergt (R686, REL-25) · Treue beim Stammkunden (Kulanz)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-09 Scout A; Genre-Mechanik Treue bei Dauerabnahme (nur Mechanik, ADR-006); I-047 (heute nur Strafe 100 Geld nach unten) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler bekommt nach 5 pünktlichen Lieferungen +10 % und überlegt, ob er den Vertrag im Boom trotzdem kündigt."
- Grösse: M · Save ja (Zähler je Vertrag) · Baseline nein (Controller nimmt keinen Vertrag) · Abhängigkeiten: I-047; Rechnung `design-economy-designer` (Preis bleibt unter `buy`)
- Randfälle: verpasste Lieferung setzt den Zähler zurück; Deckel; Kündigen und neu Annehmen setzt nicht fort.
- Doppelung: kleine Fassung von I-073 (in I-047 zusammengefasst, ohne Hafenfigur).
- Raster (Scout und lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Bewertung lead-design: Vertieft eine Funktion, die noch kein Spieler gespielt hat. Erst der Playtest zeigt, ob Verträge gehalten oder gemieden werden; vorher ist ein Bonus geraten.
- Nutzen/Aufwand: Bindung belohnt statt nur bestraft · M · ≈ 2 Pakete
- Entscheid: IDEEN-09 Empfehlung parken bis Playtest I-047 nach REL-21
- Stand R663 (design-I-091-I-094, 2026-10-16): Parken aufgehoben; Kurz-Spec `docs/superpowers/specs/2026-10-16-i091-treue-design.md` mit Rechnung `2026-10-16-i091-i094-rechnung.md`. Empfehlung V-A Kulanz (nach 5 Lieferungen verzeiht der Kunde einen Fehlbestand einmal); V-B Wertbonus 108 % als Alternative (Geldbonus höchstens 7,3 / min, L6 (b) 3,17 %). Spielerwirkung berichtigt: «im Boom kündigen» entfällt (Boom-Preis nie über Vertragspreis); neu «sieht das Lager knapp und entscheidet: nachkaufen oder den Puffer des Stammkunden verbrauchen». Gate Spec offen.
- Stand R670/R671 (2026-10-16): V-A Kulanz gewählt, V-B Wertbonus verworfen (R670); Gate Spec OK mit Auflagen A1–A4, umgesetzt auf `design/i091-i094` (R671). Plan durch lead-tech (Stufe voll), Save-Nummer im Gate Plan, Umsetzung nach UI-HAEPPCHEN-E.

### I-092 · bewertet · Inselmarkt-Vorliebe (Verkaufsbonus je Fremdinsel)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-09 Scout B; Genre-Mechanik regionale Nachfrage (nur Mechanik); `docs/spielwerte.md` Kontor II (Handel läuft über das Kontor der jeweiligen Insel, Preise global), `src/sim/defs/sea.ts` (`ISLANDS`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest auf der Seekarte «Weidenau zahlt Holz und Werkzeug +30 %» und schickt ein Schiff mit Überschuss dorthin, statt alles daheim zu verkaufen."
- Grösse: S–M · Save nein (feste Tabelle in `defs`) · Baseline nein (Controller verkauft nur in der Heimat, Faktor 1,0); Balancing-Test bleibt grün · Abhängigkeiten: Seefahrt und Fremdkontor; Anzeige in Seekarte und Handelsdialog
- Startwerte (Scout, mit `design-economy-designer` nachrechnen): je Fremdinsel zwei Güter ×1,30 (Möweninsel Rum, Stoff; Felsbucht Nahrung, Holz; Weidenau Holz, Werkzeug); Sättigung global und multiplikativ; Verkauf bleibt unter `buy` (Rum 23,4 < 40), kein Kauf-und-Verkauf-Gewinn.
- Randfälle und Entartung: Fremdkontor ohne Lager → kein Effekt; «immer zur besten Insel» bremsen Frachtraum 50, zwei Güter je Richtung und Schiffsunterhalt 15; bei billigen Gütern (Holz +1,2 je Stück) trägt der Bonus kaum, also Güter nach Wert wählen.
- Doppelung: keine (I-029 Zeitnachfrage, I-006 Kaufseite, I-072 verworfen); Erweiterung 1 schliesst Preisänderungen aus, berührt also nicht.
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 3 = 14 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 3 = 12
- Bewertung lead-design: Spass 3 → 2, weil Seefahrt erst nach dem Bürger-Ziel kommt. Stärkste Wirtschaftsidee der Runde: gibt den drei Inseln neben dem Inselcharakter (Erzeugung) eine Rolle im Absatz und den Routen einen Grund ausser Gewürz. Neue Spielwerte → Design-Paket mit Rechnung (opus), Werte so, dass nur Konsumgüter (Rum, Stoff, Glas) spürbar lohnen.
- Nutzen/Aufwand: Handel wird eine Ortsfrage · S–M · Rechnung ≈ 40 Tools, Sim+UI ≈ 1 Paket
- Entscheid: IDEEN-09 Empfehlung einplanen als Handels-Baustein: Design-Paket (Spec klein mit Rechnung), danach 1 Paket; I-095 im selben Brainstorming prüfen

### I-096 · bewertet · Steuerstufe je Insel

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-09 Scout B; Genre-Mechanik regionale Steuer; I-028 (Steuer je Stufe, live) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler stellt die Felsbucht auf «hoch» und die Heimat auf «niedrig»."
- Grösse: S–M · Save ja · Baseline nein · Abhängigkeiten: Verweis Erweiterung 1 K2 («Stand halten» je Haus)
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 2 · Risiko 2 = 8
- Bewertung lead-design: vermehrt eine Stellschraube ohne neue Abwägung (Scout nennt das selbst); «jede Insel nach Aufgabe» deckt K2 mit «Stand halten» besser.
- Entscheid: IDEEN-09 Empfehlung verwerfen

### I-100 · bewertet · «Neu»-Zähler am Ereignis-Log

- Bereich: Bedienung · Säule: Bedienung (Krisen) · Quelle: IDEEN-09 Scout C; `src/ui/eventLogView.ts` (eingeklappt nur der neueste Eintrag); Playtest `.studio/qa/rel-18/report.md` (Krisen bei 4× verpasst); Genre-Mechanik Ungelesen-Zähler · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest «Ereignisse ▸ (3 neu)», weiss, dass er einen Brand und einen Sturm verpasst hat, und klappt das Log auf."
- Grösse: S–M · Save nein · Baseline nein · Abhängigkeiten: `src/ui/eventLogView.ts`, `src/ui/crisisLog.ts`
- Randfälle: Zähler nur im Lauf, nach Laden und Neue Insel 0; Aufklappen setzt 0; Deckel «9+».
- Doppelung: I-058 (Pause bei Krise, geparkt) ist der teurere Gegenpol; I-100 ersetzt ihn für den Playtest-Befund.
- Raster (Scout und lead-design): Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 11
- Bewertung lead-design: bestätigt (11). Billigste Antwort auf «verpasste Krisen bei 4×», ohne den Spielfluss anzuhalten.
- Nutzen/Aufwand: verpasste Krisen lesbar · S–M · ≈ 70 Tools
- Entscheid: IDEEN-09 Empfehlung einplanen als Häppchen nach I-088/I-090
- Status 2026-10-14: Kurzdesign `docs/superpowers/archiv/specs/2026-10-14-i100-neu-zaehler.md` (Zähler nur für Meldungs-Einträge, UI-Zustand, kein Save)

### I-101 · bewertet · Fernauftrag-Marke auf der Seekarte

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout A; Handel-2-Spec §1 «nicht im Umfang» (Marke auf der Seekarte, AN-7 «optional»); `world.order.island` (nach Handel 2) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht auf der Seekarte an der Felsbucht eine Münzmarke «15 Rum · 1:20» und lenkt das Schiff dorthin, statt in der Auftragskarte nach dem Ziel zu suchen."
- Grösse: S · Risiko: keins (reine Anzeige; setzt Handel 2 live voraus)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: nur bei laufendem Fernauftrag; Marke ohne Mausfang; bei Verfall oder Lieferung weg.
- Nutzen/Aufwand: Fernauftrag auf einen Blick planbar · S · ≈ 50 Tools
- Entscheid: offen (IDEEN-10); Stand: Kurzdesign `docs/superpowers/specs/2026-10-16-i101-i103-fernmarke-routenbilanz.md` (R676)
- Status 2026-10-16: umgesetzt in UI-HAEPPCHEN-F, Branch `feat/ui-haeppchen-f` (Marke an der Fern-Insel, hohl beim Angebot, gefüllt beim Auftrag)

### I-103 · bewertet · Routen-Bilanz (lohnt dieses Schiff?)

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout A; `docs/spielwerte.md` Handelsschiff (Unterhalt 90 / min), Warenbilanz nominal · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest im Schiff-Panel «Route Felsbucht: +310 / min Warenwert, Unterhalt 90 → +220» und streicht die Route, die nur 40 trägt."
- Grösse: S–M · Risiko: Perf gering (nur bei offenem Panel); Save nein, Baseline nein
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 3 = 12
- Randfälle: nominal wie die Lagerleiste (Handel, Aufträge, Vorliebe nicht eingerechnet, das Panel sagt es); Gewürz mit gespartem Kaufpreis; Schiff ohne Route zeigt nichts.
- Doppelung: I-067 (Verlaufskurve, geparkt), I-078/I-089 (live) berühren keine Routen.
- Nutzen/Aufwand: Schiffsentscheidung statt Bauchgefühl · S–M · ≈ 1 Paket
- Entscheid: offen (IDEEN-10); Stand: Kurzdesign `docs/superpowers/specs/2026-10-16-i101-i103-fernmarke-routenbilanz.md` (R676), Variante B ohne Save
- Status 2026-10-16: umgesetzt in UI-HAEPPCHEN-F, Branch `feat/ui-haeppchen-f` (Variante B, Zeile mit «nominal»); Variante C (gemessene Bilanz, Save) erst nach I-091 und nur bei Bedarf

### I-104 · bewertet · Ausschreibung (grosse Sammelbestellung)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout A; Genre-Mechanik Sammelbestellung mit Frist; `docs/spielwerte.md` Handelsaufträge (`ORDER_PREMIUM` 0,75, Lager 100, Reserve I-049 live); Handel-2-Spec R3/R7 · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht ab Stufe 4 alle 12 min «Ausschreibung: 60 Holz, 30 Stein, 20 Stoff · 4000 · noch 6:00», baut Vorrat auf, stellt die Reserve hoch und entscheidet, ob er dafür den Verkauf auslässt."
- Grösse: M · Risiko: Save (Ausschreibungszustand neben dem Auftrag); Baseline nein, solange der Controller nicht annimmt
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13
- Randfälle: Stückprämie unter 0,8 × `buy` (Edikt Handel); Mengen je Gut ≤ 80; Teillieferung mit Abschlag erwägen; Verfall ohne Strafe. Entartung: reiner Überschuss ohne Wahl; Menge muss über dem Lager-Normalstand liegen (Rechnung `design-economy-designer`).
- Doppelung: I-017 (Lernpfad, geparkt), I-047 (Dauerabnahme). Nach Handel 2 prüfen, nicht davor.
- Nutzen/Aufwand: Spätspiel-Ziel «Vorrat statt Verkauf» · M · ≈ 2 Pakete (Rechnung ≈ 40 Tools)
- Entscheid: offen (IDEEN-10)

### I-105 · bewertet · Abfahrtsregel der Route (Warten bis halbvoll)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout A; Genre-Mechanik Abfahrtsbedingung; `docs/spielwerte.md` Route (Schiff fährt sofort, Frachtraum 50) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler stellt die Gewürzroute auf «wartet bis halbvoll» und nimmt längere Wartezeit im Hafen in Kauf, statt fast leer zu fahren."
- Grösse: M · Risiko: Save (Regel je Route, Standard «sofort», Migration keine); Baseline nein
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: Wartedeckel 0:30; zwei Güter je Richtung zählen gemeinsam; «wartet» im Panel sichtbar; Fernauftrag-Fracht darf nicht verklemmen.
- Doppelung: I-015 (Leitsätze) ging in Erweiterung 1 K3 auf; vorher prüfen, ob K3 eine Abfahrtsregel enthält, sonst zusammenfassen.
- Nutzen/Aufwand: Takt gegen Auslastung als echte Wahl · M · ≈ 2 Pakete
- Entscheid: offen (IDEEN-10)

### I-106 · bewertet · «Neu»-Karte schlank und schliessbar

- Bereich: Bedienung · Säule: Bedienung · Quelle: IDEEN-10 Scout B; Playtest `.studio/qa/rel-18/report.md` (Ärgernis 2: «Neu: …»-Karte bleibt über 25 s, verdeckt oben links) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler schliesst die «Neu: …»-Karte mit einem Klick oder sieht bei mehreren Freischaltungen nur «Neu: 3 Gebäude»."
- Grösse: S · Risiko: keins (UI-Zustand)
- Raster: Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Hinweis: vor Einplanung gegen UI-AUFRAEUM-3 (I-099, Kartenstapel) und UI-HAEPPCHEN-D prüfen; falls dort gelöst, verwerfen.
- Nutzen/Aufwand: Sicht auf die Karte in der ersten Stunde · S · ≈ 50 Tools
- Entscheid: offen (IDEEN-10)

### I-107 · bewertet · Tempo-Tasten + und − (statt Ziffern)

- Bereich: Bedienung · Säule: Bedienung · Quelle: IDEEN-10 Scout B; Playtest rel-18; `src/ui/hotkeys.ts`; Hinweis bei `4`–`8` ist schon live (I-083) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler drückt `+` bzw. `-` für schneller bzw. langsamer."
- Grösse: S · Risiko: keins
- Raster: Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Randfälle: Pause bleibt auf `P`/Leertaste; `+` in der Pause: Entscheid im Kurzdesign. Mit I-083 teilweise gelöst, Lückenfüller.
- Nutzen/Aufwand: Tastatur-Konsistenz · S · ≈ 40 Tools
- Entscheid: offen (IDEEN-10)

### I-108 · bewertet · Kopfzeile zeigt Einnahmen und Unterhalt getrennt

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout B; Playtest rel-18; Screenshot `.studio/qa/REL-22/05-unterhalt.png`; `src/ui/hud.ts`, `src/ui/upkeepCard.ts` · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest «+540 / −780» statt «−240», sieht, ob Einnahmen schwach oder Unterhalt zu hoch ist, und öffnet per Klick die Unterhaltskarte."
- Grösse: S · Risiko: keins (abgeleitete Anzeige; Kopfzeilenbreite bei 1280 px prüfen)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Doppelung: I-089 (live) und I-067 (geparkt) liegen daneben; ändert nur die Zahl in der Kopfzeile.
- Nutzen/Aufwand: Wirtschaftslage auf einen Blick · S · ≈ 60 Tools
- Entscheid: Kurzdesign `docs/superpowers/specs/2026-10-16-i108-einnahmen-unterhalt-design.md` (R676), Gate offen
- Status 2026-10-16: umgesetzt in UI-HAEPPCHEN-F, Branch `feat/ui-haeppchen-f` (Chip «+Einnahmen / −Unterhalt», `src/ui/balanceFlow.ts`)
