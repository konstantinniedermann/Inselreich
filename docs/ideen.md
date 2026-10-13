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

## Rangliste IDEEN-08 (Vorschlag lead-design, Ruling L0 offen)

Breite Runde nach Release M13 (R445), Scouts A, B, C nacheinander: 13 neue Ideen I-075–I-087. Keine ändert Kernsäule,
Genre oder Titel (§5.3). Sortiert nach Raster-Summe, bei Gleichstand nach Nutzen je Aufwand.

**Bereinigung (Bestätigung im Runden-Ruling):** live gesetzt I-031, I-035, I-039, I-043, I-049, I-056, I-057; in
Erweiterung 1 «Stände und Segel» aufgegangen (Verweis, Statuspflege nach Gate RE-2 A5 beim Merge) I-014 (K4), I-015,
I-016, I-019 (K3), Teilfassungen von I-038 (K1) und I-050 (K2) mit Verweis; gestrichen I-011, I-018, I-020, I-021 alt
sowie I-075, I-076, I-079, I-080 neu; zusammengefasst I-087 → I-045. I-017 geparkt, I-062 und I-063 auf `eingeplant`
(R529). Offene Ideen danach: 35 von 40.

| Rang | ID    | Name                                | Grösse | Summe | Save / Baseline  | Nutzen/Aufwand                                     | Empfehlung                                    |
| ---- | ----- | ----------------------------------- | ------ | ----- | ---------------- | -------------------------------------------------- | --------------------------------------------- |
| 1    | I-085 | «Lager voll» als Problem mit Sprung | S      | 13    | nein / nein      | Überschuss wird Entscheidung, ≈ 60–80 Tools        | einplanen UI-Häppchen nach M13 (mit I-062/63) |
| 2    | I-078 | Bilanz-Vorschau bei Bau und Ausbau  | S      | 12    | nein / nein      | Pleite-Fehler vermeiden, ≈ 70 Tools                | einplanen ins selbe Häppchen                  |
| 3    | I-077 | Spezialisierung ab Stufe 3          | M      | 11    | ja / nein        | Ausrichtung je Kette, ≈ 2 Pakete; Spar-Fassung neu | parken (Wirtschaft nach Erweiterung 1 K2)     |
| 4    | I-086 | Häuserzeile ziehen                  | M      | 11    | nein / nein      | weniger Klicks ab ≈ 20 Häusern, ≈ 2 Pakete         | parken (Playtest-Anlass, mit I-059)           |
| 5    | I-084 | Letztes Werkzeug mit Enter          | S      | 10    | nein / nein      | ein Tastendruck weniger, ≈ 40 Tools                | parken (Lückenfüller)                         |
| 6    | I-082 | Sägewerk und Bretter                | M      | 10    | ja / ja          | längere Holzkette, ≈ 3 Pakete mit Neumessung       | parken (Wirtschaft nach Erweiterung 1 K2)     |
| 7    | I-083 | Hinweis bei unbelegter Zifferntaste | S      | 9     | nein / nein      | Playtest-Reibung weg, ≈ 10 Tools                   | Beipack zum UI-Häppchen                       |
| 8    | I-081 | Fischschwarm                        | S–M    | 9     | ja / ja (Krisen) | erstes positives Ereignis, Wahl klein              | parken (Krisen-Überarbeitung, mit I-034)      |
| —    | I-075 | Verkaufsgrenze im Handelsdialog     | S      | 10    | nein / nein      | Komfort ohne Entscheidung                          | verwerfen                                     |
| —    | I-080 | Brunnen                             | S      | 9     | nein / ja        | tote Option neben der Feuerwache (150 / 10)        | verwerfen                                     |
| —    | I-079 | Bauhof                              | S–M    | 8     | ja / nein        | senkt eine Geldsenke, Abriss-Kreislauf             | verwerfen                                     |
| —    | I-076 | Missernte                           | S–M    | 7     | ja / ja          | doppelt den Sturm                                  | verwerfen                                     |
| —    | I-087 | Betriebszustand-Ebene               | M      | 10    | nein / nein      | gleicher Mechanismus wie I-045                     | zusammengefasst in I-045                      |

## Ideen

### I-029 · bewertet · Gefragte Ware

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: Genre-Mechanik (nur Mechanik, ADR-006): wechselnde Nachfrage nach einem Handelsgut; Pfade `src/sim/defs/goods.ts` (`sell` fest, `SELL_FLOOR`/`SELL_DROP` Sättigung), `src/sim/defs/crises.ts` (`BOOM_PCT` 150 gilt für alle Güter), `README.md` („Handel" mit Verkaufssättigung)
- Spielerwirkung: „Der Spieler sieht am Kontor-Chip «Gefragt: Rum +40 % · noch 3:00» und entscheidet, ob er Rum aus dem Lager jetzt verkauft oder die Brennerei hochfährt, statt immer das Gut mit dem besten Grundpreis zu liefern."
- Grösse: S–M · Risiko: Save und Baseline (aktives Gut mit Ablauf im Weltzustand; Ziehung über eigenen seeded Strom nach ADR-010, nicht in Aufträge oder Krisen; Controller verkauft nicht nach Nachfrage → Baseline bitgleich)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10
- Randfälle: Aufschlag so klein, dass „Gefragt" nie über den Kaufpreis führt (Verkauf bleibt unter `buy`, kein Kauf-und-Verkauf-Gewinn); fällt mit Boom zusammen → nur der höhere Satz, nicht multipliziert; Gut noch nicht freigeschaltet → nicht ziehbar; Lager leer → Chip bleibt, Hinweis «Kein Bestand».
- Doppelung: keine; Boom hebt alle Preise gleichzeitig, I-006 betrifft Zukauf (Kaufseite), Handelsaufträge sind Fixmengen mit Prämie. Gefragte Ware ist die Verkaufsseite je Gut.
- Bewertung lead-design (IDEEN-04): Verkaufsseite je Gut ist neu, aber Boom (alle Güter 150 %) und Sättigung decken schon einen Teil; der Mehrwert gegen heute ist eine kleine Umlenkung des Verkaufs. Gleicher Eingriffstyp (Weltzustand, eigener Strom, Krisen-Test) wie I-006; beide gemeinsam im Handels-Brainstorming denken (Kaufseite I-006 ≤ −20 %, Verkaufsseite hier ≤ Kaufpreis ohne Kauf-und-Verkauf-Gewinn). Nicht gepitcht.
- Entscheid: Empfehlung parken bis Handels-Brainstorming (mit I-006); Ruling IDEEN-04 offen

### I-047 · eingeplant (Spec `2026-10-13-i047-stammkunde-design.md`, Option 3 Stammkunde im Auftragsplatz, Gate Spec offen) · Stammkunde (Liefervertrag)

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

### I-048 · eingeplant (Schritt A auf main inaktiv; Schritt B: Last-Probe → Option 1 Verzicht, Ruling offen) · Zukauf-Aufschlag (Kaufsättigung)

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
- Entscheid: Empfehlung einplanen als Wirtschafts-Baustein (M13-Rest oder nächstes Meilenstein-Brainstorming); R474 bestätigt
- Stand: Schritt A (Mechanik, `BUY_RISE` 0) auf main, inaktiv (R549); Schritt B ohne Werte zurück ins Design (R551). Designfrage `docs/superpowers/specs/2026-10-11-i048-b-designfrage.md`: Empfehlung Kontingent-Staffel (Controller bitgleich, Biss per Szenario-Test), sonst Verzicht; wartet auf Design-Gate L0 und Ensemble-Messung (plan-TOOL-GATE-ENSEMBLE)
- Stand 2026-10-12: R555 nahm Option 2 an. Die Last-Probe erfüllt das Abbruchkriterium R555 (c): Holz 71–90/min im Basis-Controller, 292/min im reichen Lauf `balance-edicts`; `balance-merchants` Gewürz ≤ 28/min ([Anhang 02](superpowers/specs/2026-10-10-i048-zukauf-aufschlag-design/anhang-02-last-probe.md)). Damit gilt Option 1 (Verzicht), sobald L0 ein Ruling fasst: Mechanik bleibt inaktiv, I-047 wird frei (R486 O3).
- Hinweis für später, nicht gepitcht: eine Staffel nur für Konsumgüter (Stoff, Rum, Glas, Gewürz) bliebe gegen den Controller bitgleich, weil er sie kaum kauft. Sie wäre eine neue Regel und bräuchte ein eigenes Gate Brainstorming.

### I-051 · bewertet · Park als Wohnwert

- Bereich: Inhalt · Säule: Bevölkerung versorgen und aufsteigen lassen · Quelle: Genre-Mechanik (Dekor mit Wirkung); IDEEN-06 Scout B; Lücke in `src/sim/defs/buildings.ts` (kein Wohnumfeld-Gebäude)
- Spielerwirkung: „Der Spieler setzt einen Park zwischen Wohnhäuser und sieht sie schneller aufsteigen, also plant er Viertel statt Reihen."
- Grösse: M · Risiko: Balancing-Test, neues Sprite (lead-art, ADR-011); Save nur, falls der Gebäudetyp ein Feld braucht; Baseline bitgleich, solange der Controller ihn nicht baut
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: braucht Unterhalt und Wegeanbindung; Wirkkreis wie Kapelle.
- Doppelung: I-008 (Standortgüte für Betriebe), I-011 (Hauswunsch) grenzen daran.
- Bewertung lead-design (IDEEN-06): Aufwand 3 → 2 (Sprite plus Sim plus Balancing). **Bedenken:** Als vierter Aufstiegs-Beschleuniger neben Fest, Steuer «niedrig» und Edikt Wohlfahrt läuft er in die Stapelregel (nie unter 15 s) und ist dann wirkungslos. Trägt nur mit eigener Wirkung (z. B. Bedingung für Kaufleute oder Steuer-Plus im Kreis).
- Nutzen/Aufwand: kleiner Nutzen in heutiger Form · M · ≈ 2 Pakete plus Sprite
- Entscheid: Empfehlung parken bis Stadtplanungs-Brainstorming (mit I-011, I-032); R474 bestätigt

### I-058 · bewertet · Pause bei Krise

- Bereich: Bedienung · Säule: Bedienung · Quelle: Code (`src/ui/settings.ts`, `src/ui/crisis.ts`: keine Pause-Option; Brand und Sturm laufen bei 2× und 4× weiter); Genre-Mechanik; IDEEN-06 Scout C
- Spielerwirkung: „Der Spieler schaltet «Bei Krise pausieren» ein und bekommt bei Brand oder Sturm ein stehendes Bild mit Meldung, statt bei 4× zu spät zu reagieren."
- Grösse: S–M · Risiko: keins beim Save (Einstellung im Browser-Speicher); Zusammenspiel mit Tempo-Gedächtnis (`P`) und Leertaste-Pause
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 3 = 11
- Randfälle: Krisenstufe «aus» löst nichts aus; mehrere Ereignisse kurz hintereinander pausieren einmal; Fortsetzen nimmt das letzte Tempo; Standard aus.
- Doppelung: keine; I-014 ist Inhalt.
- Bewertung lead-design (IDEEN-06): bestätigt (11). Nützlich ab Tempo 4×, aber nur für einen Teil der Spieler; nach dem Tasten-Häppchen.
- Nutzen/Aufwand: kleiner bis mittlerer Nutzen · S–M · ≈ 1 Häppchen (≈ 80 Tools)
- Entscheid: Empfehlung parken bis ein Playtest verpasste Krisen bei hohem Tempo meldet, sonst Lückenfüller; R474 bestätigt
- Verweis IDEEN-08: Playtest REL-18 (`.studio/qa/rel-18/report.md`) «mässig vermisst», Sturm und Boom bei 4× ohne Folgen; bleibt geparkt bis ein Brand bei 4× belegt ist; billige Variante: Krisenmeldung bei 4× länger stehen lassen

### I-059 · bewertet · Sammelausbau gleicher Betriebe (mit I-024)

- Bereich: Bedienung · Säule: Produktionsketten · Quelle: Genre-Mechanik (Massenaufwertung); Ausbau heute einzeln über «Ausbauen» oder `Umschalt+U` (README Z. 298); IDEEN-06 Scout C; nimmt I-024 (Direkt als Stufe 2 bauen) auf
- Spielerwirkung: „Der Spieler sieht im Panel «Alle 6 Holzfäller ausbauen» mit Gesamtkosten und Gebühr und rüstet eine Kette mit einer Entscheidung auf."
- Grösse: S–M · Risiko: keins bei Save und Baseline, wenn die UI die bestehende Aktion `upgradeBuilding` je Betrieb aufruft (keine neue Sim-Regel, Kosten unverändert); Regel bei zu wenig Geld nötig
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 3 = 11
- Randfälle: so viele wie bezahlbar, Reihenfolge nach Abstand zum Kontor, dann ID; Brand, gesperrte Stufe, nicht angebunden → übersprungen und genannt; eine Sammelmeldung.
- Doppelung: I-024 (Stufe 2 beim Bauen) zielt auf dasselbe Ärgernis „Nachrüsten nervt"; hier zusammengefasst, die I-024-Variante «Bauen und gleich ausbauen» als zwei Sim-Aktionen ist ein Unterfall.
- Bewertung lead-design (IDEEN-06): Risiko 2 → 3, weil die Sim unberührt bleibt (n Einzelaktionen wie I-041); Passung 3 → 2 (Bedienung, Kette nur indirekt). Spürbar erst ab dem Mittelspiel.
- Nutzen/Aufwand: mittlerer Nutzen (Mittelspiel weniger Klicks) · S–M · ≈ 1 Häppchen (≈ 90 Tools)
- Entscheid: Empfehlung parken bis Playtest „Nachrüsten nervt" (Anlass aus I-024); R474 bestätigt

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

### I-077 · bewertet · Spezialisierung ab Stufe 3

- Bereich: Inhalt · Säule: Produktionsketten · Quelle: IDEEN-08 Scout A; Genre-Mechanik Betriebsausrichtung (nur Mechanik); `README.md` Ausbau Stufe 1–3 (nur «mehr vom Gleichen»), `src/sim/defs/buildings.ts` (Unterhalt 5–30 / min)
- Spielerwirkung: „Der Spieler gibt einem Betrieb auf Stufe 3 einmalig eine Ausrichtung, «Massenfertigung» (Ausstoss +20 %, Unterhalt +50 %) oder «Sparbetrieb», und richtet so seine Kette auf Knappheit oder Kosten aus."
- Grösse: M · Risiko: Save (Wahl je Betrieb, Migration «keine»); Baseline bitgleich, solange der Controller nichts wählt
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13
- Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Bewertung lead-design: Spass 3 → 2, weil Stufe 3 erst im Mittelspiel kommt (Fortgeschrittene). **Entartung in der Scout-Fassung:** «Sparbetrieb» (Eingang −25 %, Unterhalt −30 %, Ausstoss gleich) ist besser als der Standard in jeder Lage; der Standard wird tote Option, die Wahl schrumpft auf 300 Geld für einen Dauerrabatt. Tragfähig nur mit Preis: Sparbetrieb Unterhalt −40 % bei Ausstoss −25 % (liegt zwischen «voll» und «Stilllegen»), Massenfertigung wie vorgeschlagen; die Masse verfällt bei Lager 100 und Verkaufsboden 30 %, darum keine Geldquelle. Werte erst nach dem Controller-Lauf «Ziel 4» (Erweiterung 1 K2, Auflage A1), weil die neuen Manufakturen dieselbe Bilanz teilen. Randfälle: Abriss löscht die Wahl, Sperrzeit 3 min, Betriebe ohne Eingang nur mit Unterhaltsteil.
- Nutzen/Aufwand: jede Kette bekommt im Mittel- und Spätspiel eine Ausrichtung · M · ≈ 2 Pakete (Rechnung ≈ 40 Tools, Sim und Panel ≈ 150 Tools)
- Entscheid: IDEEN-08 Empfehlung parken als Baustein des Wirtschafts-Brainstormings nach Erweiterung 1 K2 (mit I-008, I-033)

### I-081 · bewertet · Fischschwarm (befristetes Küstenereignis)

- Bereich: Inhalt · Säule: Produktionsketten · Quelle: IDEEN-08 Scout B; Genre-Mechanik befristete Fundstelle; `src/sim/defs/crises.ts` (nur Brand, Sturm, Boom), `src/sim/defs/buildings.ts` (`fisher`: Küste, 100 Geld, Unterhalt 5)
- Spielerwirkung: „Der Spieler sieht eine Möwenwolke über einem Küstenstück und entscheidet binnen drei Minuten, ob sich dort eine weitere Fischerhütte lohnt."
- Grösse: S–M · Risiko: Save (Ereignis mit Ort und Restzeit) und Baseline der Krisen-Pins (eigener Zufallsstrom nach ADR-010 nötig, sonst verschiebt sich die Krisenziehung)
- Raster (Scout): Spass 3 · Passung 2 · Aufwand 2 · Risiko 2 = 12
- Raster (lead-design): Spass 2 · Passung 2 · Aufwand 2 · Risiko 1 = 9
- Bewertung lead-design: Gut ist der Ton: das erste **positive** Zufallsereignis neben dem Boom, belohnt Aufmerksamkeit. Aber Spass 3 → 2: Nahrung ist billig, eine Hütte für 100 Geld plus Abriss mit halber Erstattung bringt in 3 min ≈ 45 Nahrung; die Wahl ist im Frühspiel klein, im Spätspiel belanglos. Risiko 2 → 1 (Save und Baseline). Stärker in einer Krisen-Überarbeitung, die Strafe und Chance mischt (mit I-034); dort mit Ware höheren Werts (z. B. Fundstelle Stein auf Gebirge+, Erweiterung 1 K1) prüfen. Randfall: keine freie Küste → fällt still aus; Krisenstufe «aus» → kein Ereignis.
- Nutzen/Aufwand: sichtbares, positives Ereignis in der ersten Stunde · S–M · ≈ 1–2 Pakete
- Entscheid: IDEEN-08 Empfehlung parken bis Krisen-Überarbeitung (mit I-034)

### I-082 · bewertet · Sägewerk und Bretter (Zwischenprodukt aus Holz)

- Bereich: Inhalt · Säule: Produktionsketten · Quelle: IDEEN-08 Scout B; `docs/beobachtungen.md` 2026-10-10 (Dauerverkauf Holz nahe Vollpreis), `src/sim/defs/goods.ts` (Holz Kauf 10, Verkauf 4)
- Spielerwirkung: „Der Spieler sieht, dass Badehaus, Glashütte und Denkmal Bretter statt Holz verlangen, und entscheidet, ob er Holz roh verkauft oder ins Sägewerk steckt."
- Grösse: M · Risiko: Save, Baseline, Balancing-Test (Baukosten bestehender Gebäude ändern sich, alle Pins ab Stufe 2 neu)
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 1 = 10 (Scout und lead-design gleich)
- Bewertung lead-design: Längere Kette ist Genre-Kern, aber «Bretter statt Holz» ersetzt nur einen Kostenposten, es entsteht keine neue Abwägung (Holz roh verkaufen bringt 4 je Stück, das Sägewerk immer mehr). Der Holz-Dauerverkauf ist das Thema von I-048 Schritt B, nicht einer neuen Kette. Erweiterung 1 K2 bringt drei neue Güter; eine vierte Kette davor überlastet die Neumessung. Startwerte des Scouts (Sägewerk 300 Geld, 2 Holz → 1 Brett, Brett Kauf 20 / Verkauf 12) brauchen `design-economy-designer`.
- Nutzen/Aufwand: längere Holzkette, Mittelspiel · M · ≈ 3 Pakete mit Neumessung
- Entscheid: IDEEN-08 Empfehlung parken bis Wirtschafts-Brainstorming nach Erweiterung 1 K2

### I-084 · bewertet · Letztes Werkzeug mit Enter wieder aufnehmen

- Bereich: Bedienung · Säule: Insel besiedeln (Bauen in Folge) · Quelle: IDEEN-08 Scout C; Genre-Mechanik Werkzeug-Rückgriff; README «Tastatur und Maus» (`Esc`/Rechtsklick legt das Werkzeug ab, die Pipette braucht ein Gebäude unter dem Zeiger); `Enter` ist in `hotkeys.ts` und `input.ts` frei
- Spielerwirkung: „Der Spieler legt das Werkzeug mit `Esc` ab, schaut ins Panel und hat mit `Enter` dasselbe Gebäude wieder in der Hand."
- Grösse: S · Risiko: keins
- Raster: Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10 (Scout: Spass 2 = 12)
- Bewertung lead-design: Spass 2 → 1: Werkzeugtasten und Pipette decken den Rückgriff fast immer in einem Druck oder Klick ab; der Gewinn ist ein Tastendruck. Randfälle: Fokus-`Enter` auf Bauleisten-Einträgen bleibt unberührt; Typ inzwischen gesperrt (Freischaltung, «Nur einmal je Insel», Denkmal) → Meldung mit Grund; nach «Neue Insel» und «Laden» leer.
- Nutzen/Aufwand: ein Tastendruck weniger im Dauerbau · S · ≈ 40 Tools
- Entscheid: IDEEN-08 Empfehlung parken (Lückenfüller für ein Tasten-Häppchen)

### I-086 · bewertet · Häuserzeile ziehen (Wohnhaus-Werkzeug)

- Bereich: Bedienung · Säule: Insel besiedeln · Quelle: IDEEN-08 Scout C; Genre-Mechanik Reihenbau; README: Weg, Abriss über Wege, Weide und Wald lassen sich ziehen, Gebäude nur einzeln
- Spielerwirkung: „Der Spieler zieht mit dem Wohnhaus-Werkzeug entlang eines Wegs und setzt eine Häuserzeile in einem Zug statt zehn Klicks."
- Grösse: M · Risiko: Save keins, Baseline keins; Perf gering (Vorschau je Kachel)
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 3 = 11 (Scout: Passung 3 = 12)
- Bewertung lead-design: Passung 3 → 2 (spart Klicks, ändert keine Säule). Spürbar ab ≈ 20 Häusern, also Mittelspiel; mit Erweiterung 1 («Stand halten», Inseldorf) wächst die Häuserzahl. Randfälle: zu wenig Geld baut bis zur letzten bezahlbaren Stelle mit Grund; rote Kacheln werden übersprungen; jedes Haus ist eine eigene Sim-Aktion mit `{ ok, reason }`.
- Nutzen/Aufwand: Bauen im Mittelspiel schneller · M · ≈ 2 Pakete (UI, Vorschau)
- Entscheid: IDEEN-08 Empfehlung parken bis Playtest-Anlass «Häuser setzen nervt» (mit I-059 Sammelausbau als Bündel «Sammelaktionen»)
