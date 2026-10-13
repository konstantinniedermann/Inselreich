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

## Rangliste IDEEN-09 (Vorschlag lead-design, Ruling L0 offen)

Breite Runde nach REL-21 (R604, R445), Scouts A (Playtests REL-20/21), B (Genre Aufbau und Handel), C (Bedienung Desktop)
parallel: 14 Vorschläge, 13 eingetragen als I-088–I-100. Scout-Idee A2 «Inselvorteil im Betriebs-Panel» entfällt (schon live:
`src/ui/inspect.ts` zeigt `traitLine`). Keine Idee ändert Kernsäule, Genre oder Titel (§5.3); keine gehört in Erweiterung 1, I-096
grenzt an K2 «Stand halten». Sortiert nach Raster-Summe, bei Gleichstand nach Nutzen je Aufwand.

**Bereinigung nach R599 (Bestätigung im Runden-Ruling):** ins Archiv als `geparkt` I-029, I-051, I-058, I-059 (R474) und I-077,
I-081, I-082, I-084, I-086 (R566), dazu I-048 (R571 Verzicht, Mechanik inaktiv); Rangliste IDEEN-08 ins Archiv. I-047 bleibt
`eingeplant` bis REL-21 live ist. Pool danach: 15 von 40.

| Rang | ID    | Name                             | Grösse | Summe | Save / Baseline | Nutzen/Aufwand                                    | Empfehlung                                        |
| ---- | ----- | -------------------------------- | ------ | ----- | --------------- | ------------------------------------------------- | ------------------------------------------------- |
| 1    | I-092 | Inselmarkt-Vorliebe              | S–M    | 12    | nein / nein     | jede Fremdinsel bekommt eine Handelsrolle, 1 Pkt. | einplanen: Design-Paket mit Rechnung, dann 1 Pkt. |
| 3    | I-100 | «Neu»-Zähler am Ereignis-Log     | S–M    | 11    | nein / nein     | verpasste Krisen bei 4× lesbar, ≈ 70 Tools        | einplanen Häppchen danach; ersetzt I-058          |
| 4    | I-095 | Fernauftrag an einem Fremdkontor | M      | 11    | ja / nein       | Routen bekommen einen zweiten Zweck, ≈ 2 Pakete   | parken: Handels-Brainstorming (mit I-092)         |
| 5    | I-094 | Darlehen beim Händler            | S–M    | 11    | ja / nein       | Vorziehen gegen Dauerlast, Entartung offen        | parken: Wirtschafts-Brainstorming                 |
| 6    | I-091 | Treuebonus beim Stammkunden      | M      | 11    | ja / nein       | Bindung belohnt, vor Playtest I-047 verfrüht      | parken: Playtest I-047                            |
| 8    | I-089 | Unterhalt je Insel in Rangliste  | S      | 10    | nein / nein     | ferne Insel durchschauen, ≈ 60 Tools              | Beipack Sammelpaket UI-Aufräumen                  |
| 9    | I-093 | Auftrag umtauschen               | S      | 10    | ja / nein       | Reroll gegen Geld, Wahl dünn                      | parken: Handels-Brainstorming                     |
| 10   | I-098 | Rechtsklick staffelt wie Esc     | S      | 9     | nein / nein     | Designfrage REL-21 gelöst, ≈ 30 Tools             | einplanen Beipack UI-Aufräumen (Ruling Verhalten) |
| 11   | I-099 | Kartenstapel oben rechts ordnen  | S      | 9     | nein / nein     | Befund 6 px gelöst, ≈ 50 Tools                    | Beipack Sammelpaket UI-Aufräumen                  |
| 12   | I-097 | Pause sichtbar auf der Karte     | S      | 9     | nein / nein     | Orientierung, kein Playtest-Befund                | parken (Lückenfüller)                             |
| —    | I-096 | Steuerstufe je Insel             | S–M    | 8     | ja / nein       | Stellschraube ohne neue Abwägung                  | verwerfen                                         |

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

### I-089 · bewertet · Unterhalt je Insel in der Rangliste

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-09 Scout A; `docs/beobachtungen.md` 2026-10-13 «Heimat-Kontor fehlt in der Unterhalt-Rangliste»; `src/ui/upkeepRank.ts` (Zeilen tragen `island`, keine Summe je Insel) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht in der Unterhalt-Karte «Felsbucht · 3 Gebäude · 140 / min» und erkennt, was ihn eine ferne Insel kostet."
- Grösse: S · Save nein · Baseline nein · Abhängigkeiten: I-062 (live); `src/ui/upkeepRank.ts`
- Randfälle: Insel ohne Gebäude fehlt; Stillgelegte mit halbem Wert; Inselsummen und Fusszeile aus derselben Quelle (vgl. Beobachtung Fusszeile bei Pause); Heimat-Kontor mit 0 als Zeile klärt den Befund mit.
- Doppelung: keine (I-062 je Betrieb, I-067 Verlauf, geparkt).
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Bewertung lead-design: Spass 2 → 1: Die Karte zeigt nur Kosten, nicht den Ertrag einer Insel; «kostet mehr, als sie bringt» bleibt ungesagt. Billig und räumt zwei Beobachtungen ab.
- Nutzen/Aufwand: Lesbarkeit ab der zweiten Insel · S · ≈ 60 Tools
- Entscheid: IDEEN-09 Empfehlung Beipack zum Sammelpaket UI-Aufräumen (mit Heimat-Kontor- und Fusszeilen-Befund)

### I-091 · bewertet · Treuebonus beim Stammkunden

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-09 Scout A; Genre-Mechanik Treue bei Dauerabnahme (nur Mechanik, ADR-006); I-047 (heute nur Strafe 100 Geld nach unten) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler bekommt nach 5 pünktlichen Lieferungen +10 % und überlegt, ob er den Vertrag im Boom trotzdem kündigt."
- Grösse: M · Save ja (Zähler je Vertrag) · Baseline nein (Controller nimmt keinen Vertrag) · Abhängigkeiten: I-047; Rechnung `design-economy-designer` (Preis bleibt unter `buy`)
- Randfälle: verpasste Lieferung setzt den Zähler zurück; Deckel; Kündigen und neu Annehmen setzt nicht fort.
- Doppelung: kleine Fassung von I-073 (in I-047 zusammengefasst, ohne Hafenfigur).
- Raster (Scout und lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Bewertung lead-design: Vertieft eine Funktion, die noch kein Spieler gespielt hat. Erst der Playtest zeigt, ob Verträge gehalten oder gemieden werden; vorher ist ein Bonus geraten.
- Nutzen/Aufwand: Bindung belohnt statt nur bestraft · M · ≈ 2 Pakete
- Entscheid: IDEEN-09 Empfehlung parken bis Playtest I-047 nach REL-21

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

### I-093 · bewertet · Auftrag umtauschen (Händler rufen)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-09 Scout B; Genre-Mechanik Wahl unter Bestellungen; `src/sim/orders.ts` (ein Auftrag, Verfall ohne Strafe) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht «Auftrag: 12 Rum» bei leerem Lager und ruft für 60 Geld einen anderen Händler."
- Grösse: S · Save ja (Sperrzeit) · Baseline nein, solange der Controller nicht tauscht; eigener Zufallsstrom (ADR-010) · Abhängigkeiten: keine
- Startwerte (Scout): 60 Geld, Sperre 3:00, ein Tausch je Auftrag, anderes Gut.
- Randfälle: kein Auftrag oder Stammkunde aktiv → kein Knopf; zu wenig Geld → blass mit Grund.
- Doppelung: keine.
- Raster (Scout): Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12 · Raster (lead-design): Spass 1 · Passung 3 · Aufwand 3 · Risiko 2 = 10
- Bewertung lead-design: Spass 2 → 1: Bei 60 Geld gegen Prämien ab ≈ 130 tauscht man immer, wenn das Lager leer ist; die Wahl schrumpft auf eine Gebühr. Ein verfallener Auftrag kostet heute nichts, der Schmerz ist klein.
- Nutzen/Aufwand: kleiner Nutzen · S · ≈ 70 Tools
- Entscheid: IDEEN-09 Empfehlung parken bis Handels-Brainstorming

### I-094 · bewertet · Darlehen beim Händler

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-09 Scout B; Genre-Mechanik Kredit mit Tilgung; `docs/spielwerte.md` (Geld darf negativ werden, dann Bauen und Kaufen gesperrt) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler nimmt 2000 Geld auf, zahlt 2400 in zehn Raten und zieht einen Ausbau vor, mit einer Dauerlast in der Bilanz."
- Grösse: S–M · Save ja (Restschuld, Rate) · Baseline nein (Controller nimmt nichts auf) · Abhängigkeiten: Freischaltung mit dem Bürger-Ziel; Rechnung `design-economy-designer`
- Startwerte (Scout): eine Stufe 2000, Aufschlag 20 %, 240 / min über 10 min, höchstens ein Darlehen, vorzeitige Tilgung frei.
- Randfälle und Entartung: Rate läuft wie Unterhalt, ins Minus gerutscht sperrt Bauen. **Entartung:** Bringt ein Ausbau mehr als 40 / min, ist das Darlehen immer richtig; dann ist es Pflicht statt Wahl. Ab Spätspiel (Überschuss Tausende / min) wirkungslos.
- Doppelung: keine; Gegenstück zu den fehlenden Senken (Erweiterung 1 K5 ist Senke, nicht Quelle).
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Bewertung lead-design: Spass 3 → 2: Die Wahl trägt nur im schmalen Fenster Bürger-Ziel bis Mittelspiel, und ihre Härte hängt an einer Rechnung, die heute fehlt. Das Spiel leidet eher an zu viel als an zu wenig Geld (Erweiterung 1 §1); eine Geldquelle verschärft das.
- Nutzen/Aufwand: mittlerer Nutzen, Entartungsrisiko · S–M · ≈ 1–2 Pakete
- Entscheid: IDEEN-09 Empfehlung parken bis Wirtschafts-Brainstorming nach Erweiterung 1 K2

### I-095 · bewertet · Fernauftrag an einem Fremdkontor

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-09 Scout B; Genre-Mechanik ortsgebundener Lieferauftrag; `docs/spielwerte.md` Handelsaufträge (`ORDER_PREMIUM` 0,75), Kontor II · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht «Fernauftrag Felsbucht: 12 Rum zu 38 · noch 3:00» und richtet eine Route ein, um die Ware dorthin zu fahren."
- Grösse: M · Save ja (Ort im Auftrag) · Baseline nein (Controller ohne Fremdkontor) · Abhängigkeiten: Fremdkontor und Route; I-092 (nicht multiplizieren)
- Startwerte (Scout): jeder dritte Auftrag ab Seefahrt, Prämie `floor(buy × 0,95)`, Frist 3:00, kein Strafgeld.
- Randfälle: Ware muss im Lager der Fremdinsel liegen; liegt sie schon dort, keine Dominanz; mit Stammkunde im Auftragsplatz abstimmen.
- Doppelung: I-017 (geführte Seefahrt-Aufträge, geparkt) ist Lernpfad, kein Zufallsauftrag.
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Bewertung lead-design: Spass 3 → 2 (Seefahrt, Mittelspiel). Gleiche Stossrichtung wie I-092, aber teurer und mit Save; im Handels-Brainstorming gegen I-092 abwägen, nicht beide.
- Nutzen/Aufwand: Routen mit zweitem Zweck · M · ≈ 2 Pakete
- Entscheid: IDEEN-09 Empfehlung parken bis Handels-Brainstorming (mit I-092, I-029, I-006)

### I-096 · bewertet · Steuerstufe je Insel

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: IDEEN-09 Scout B; Genre-Mechanik regionale Steuer; I-028 (Steuer je Stufe, live) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler stellt die Felsbucht auf «hoch» und die Heimat auf «niedrig»."
- Grösse: S–M · Save ja · Baseline nein · Abhängigkeiten: Verweis Erweiterung 1 K2 («Stand halten» je Haus)
- Raster (Scout): Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10 · Raster (lead-design): Spass 1 · Passung 2 · Aufwand 2 · Risiko 2 = 8
- Bewertung lead-design: vermehrt eine Stellschraube ohne neue Abwägung (Scout nennt das selbst); «jede Insel nach Aufgabe» deckt K2 mit «Stand halten» besser.
- Entscheid: IDEEN-09 Empfehlung verwerfen

### I-097 · bewertet · Pause sichtbar auf der Karte

- Bereich: Grafik · Säule: Bedienung · Quelle: IDEEN-09 Scout C; `src/ui/hud.ts` (Pause nur am gedrückten Knopf) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht bei Pause einen getönten Rand mit «Pause» und hält das stehende Bild nicht für einen Hänger."
- Grösse: S · Save nein · Baseline nein · Abhängigkeiten: `src/ui/app.ts`, `src/style.css`
- Randfälle: kein Doppelhinweis bei offenem Menü; Banner fängt keine Mausereignisse.
- Raster (Scout und lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 9
- Bewertung lead-design: Genre-Standard, aber kein Playtest-Befund; Lückenfüller.
- Nutzen/Aufwand: Orientierung · S · ≈ 40 Tools
- Entscheid: IDEEN-09 Empfehlung parken (Lückenfüller)

### I-098 · bewertet · Rechtsklick im Linienzug staffelt wie Esc

- Bereich: Bedienung · Säule: Insel besiedeln · Quelle: IDEEN-09 Scout C; `docs/beobachtungen.md` 2026-10-13 (Release-Check REL-21: Esc und Rechtsklick wirken im Linienzug verschieden); `src/ui/input.ts` (Esc beendet im Zug nur den Zug, Rechtsklick zusätzlich das Werkzeug) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler bricht einen angefangenen Wegzug mit Rechtsklick ab und hat das Weg-Werkzeug noch in der Hand; erst der zweite Rechtsklick legt es ab."
- Grösse: S · Save nein · Baseline nein · Abhängigkeiten: `src/ui/input.ts`, README «Tastatur und Maus»
- Randfälle: ohne laufenden Zug altes Verhalten; Abriss- und Weide-Zug gleich behandeln; Test für beide Wege.
- Raster (Scout und lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 9
- Bewertung lead-design: Beantwortet die offene Designfrage: Rechtsklick folgt Esc (erst den Zug, dann das Werkzeug), weil ein misslungener Zug meist sofort neu gezogen wird. README angleichen.
- Nutzen/Aufwand: ein Bedienfehler und ein Doku-Widerspruch weniger · S · ≈ 30 Tools
- Entscheid: IDEEN-09 Empfehlung einplanen als Beipack zum Sammelpaket UI-Aufräumen (Verhalten im Runden-Ruling festhalten)

### I-099 · bewertet · Kartenstapel oben rechts ordnen

- Bereich: Bedienung · Säule: Bedienung · Quelle: IDEEN-09 Scout C; `docs/beobachtungen.md` Kleinbefunde REL-21 (Vertragskarte 6 px neben der Krisenkarte, R589); `src/ui/crisis.ts` («Krisen: aus» als Dauerkarte) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht Auftrags-, Vertrags- und Krisenkarte in einer Spalte mit festem Abstand, und «Krisen: aus» belegt keinen Platz mehr."
- Grösse: S · Save nein · Baseline nein · Abhängigkeiten: `src/style.css`, `src/ui/order.ts`, `src/ui/crisis.ts`
- Randfälle: Krisenstufe bleibt im Menü lesbar; ab 1280 × 720 keine Verdeckung der Bauleiste.
- Raster (Scout und lead-design): Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 9
- Bewertung lead-design: löst einen Release-Befund an der Wurzel (fester Stapel statt Pixelabstand).
- Nutzen/Aufwand: mehr freie Karte · S · ≈ 50 Tools
- Entscheid: IDEEN-09 Empfehlung Beipack zum Sammelpaket UI-Aufräumen

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
