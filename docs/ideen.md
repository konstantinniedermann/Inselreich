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

## Rangliste IDEEN-11 (Ruling L0: R692)

Breite Runde (R445, R653-Folge), Scouts A (erste Stunde und Mittelspiel), B (Handel und Seefahrt nach Handel 2, Stammkunde,
Kulanz) und C (Lebendigkeit: Klang, Licht, Bewohner, ohne Ortsrand ORT-A/ORT-B): 12 Vorschläge, eingetragen als I-110–I-121.
Keine Idee ändert Kernsäule, Genre oder Titel (§5.3). Erweiterung 1 berühren I-115 (Rivalen teilen die Sättigung) und I-117
(Routenregeln K3); beide parken. Sortiert nach Raster-Summe, bei Gleichstand nach Nutzen je Aufwand. Pool danach: 25 von 40 offen.

| Rang | ID    | Name                            | Grösse | Summe | Save / Baseline | Nutzen/Aufwand                             | Empfehlung                                      |
| ---- | ----- | ------------------------------- | ------ | ----- | --------------- | ------------------------------------------ | ----------------------------------------------- |
| 1    | I-112 | Ratsbeschluss je Stufe          | M      | 13    | ja / nein       | Weichenstellung im Mittelspiel, ≈ 2 Pakete | Top 3: Kurzdesign Stufe voll mit Werte-Rechnung |
| 2    | I-114 | Fernangebot zur Wahl            | S      | 12    | nein / nein     | Wahl über Fahrzeit und Lager, ≈ 60 Tools   | gemergt (R707)                                  |
| 3    | I-120 | Wohlstandsklang der Stadt       | S      | 12    | nein / nein     | Versorgung hörbar, ≈ 40 Tools              | gemergt (R707)                                  |
| 4    | I-118 | Aufstiegs-Funkeln am Haus       | S      | 12    | nein / nein     | Fortschritt sichtbar, ≈ 50 Tools           | gemergt (R707)                                  |
| 5    | I-110 | Startpaket zur Wahl             | S      | 12    | nein / nein     | Wahl in Minute 0, verblasst, ≈ 80 Tools    | Pool; Werte neu rechnen vor Einplanung          |
| 6    | I-111 | Etappenwunsch mit Wahlbelohnung | M      | 12    | ja / ja         | Ziel in U1–U3, Dominanzgefahr, ≈ 2 Pakete  | Baustein nächstes Meilenstein-Brainstorming     |
| 7    | I-115 | Eigene Sättigung je Kontor      | M      | 11    | ja / nein       | Verkaufszweck für Schiffe, ≈ 2 Pakete      | parken: Baustein Erweiterung 1 (Rivalen)        |
| 8    | I-117 | Route verkauft statt lagert     | M      | 11    | ja / nein       | Komfort Route, ≈ 2 Pakete                  | parken bis K3 (Erweiterung 1) geklärt           |
| 9    | I-116 | Inselgunst                      | M      | 11    | ja / nein       | zweite Treue-Mechanik, ≈ 1–2 Pakete        | parken bis I-114 live                           |
| 10   | I-119 | Bewohner reagieren auf Krisen   | M      | 10    | nein / nein     | Krisen fühlbarer, ≈ 2 Pakete               | Pool; mit I-121 als ein Paket                   |
| 11   | I-121 | Wartende vor der Tür            | M      | 10    | nein / nein     | doppelt Bedarfssymbole, ≈ 2 Pakete         | Pool; mit I-119 als ein Paket                   |
| 12   | I-113 | Gemeindeprojekt                 | M      | 9     | ja / ja         | Geldsenke ohne Wahl                        | verwerfen (Denkmal, I-079; I-112 deckt ab)      |

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

### I-092 · live · Inselmarkt-Vorliebe (Verkaufsbonus je Fremdinsel)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-09 Scout B; Genre-Mechanik regionale Nachfrage (nur Mechanik); `docs/spielwerte.md` Kontor II (Handel läuft über das Kontor der jeweiligen Insel, Preise global), `src/sim/defs/sea.ts` (`ISLANDS`) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest auf der Seekarte «Weidenau zahlt Holz und Werkzeug +30 %» und schickt ein Schiff mit Überschuss dorthin, statt alles daheim zu verkaufen."
- Grösse: S–M · Save nein (feste Tabelle in `defs`) · Baseline nein (Controller verkauft nur in der Heimat, Faktor 1,0); Balancing-Test bleibt grün · Abhängigkeiten: Seefahrt und Fremdkontor; Anzeige in Seekarte und Handelsdialog
- Startwerte (Scout, mit `design-economy-designer` nachrechnen): je Fremdinsel zwei Güter ×1,30 (Möweninsel Rum, Stoff; Felsbucht Nahrung, Holz; Weidenau Holz, Werkzeug); Sättigung global und multiplikativ; Verkauf bleibt unter `buy` (Rum 23,4 < 40), kein Kauf-und-Verkauf-Gewinn.
- Randfälle und Entartung: Fremdkontor ohne Lager → kein Effekt; «immer zur besten Insel» bremsen Frachtraum 50, zwei Güter je Richtung und Schiffsunterhalt 15; bei billigen Gütern (Holz +1,2 je Stück) trägt der Bonus kaum, also Güter nach Wert wählen.
- Doppelung: keine (I-029 Zeitnachfrage, I-006 Kaufseite, I-072 verworfen); Erweiterung 1 schliesst Preisänderungen aus, berührt also nicht.
- Raster (Scout): Spass 3 · Passung 3 · Aufwand 2 · Risiko 3 = 14 · Raster (lead-design): Spass 2 · Passung 3 · Aufwand 2 · Risiko 3 = 12
- Bewertung lead-design: Spass 3 → 2, weil Seefahrt erst nach dem Bürger-Ziel kommt. Stärkste Wirtschaftsidee der Runde: gibt den drei Inseln neben dem Inselcharakter (Erzeugung) eine Rolle im Absatz und den Routen einen Grund ausser Gewürz. Neue Spielwerte → Design-Paket mit Rechnung (opus), Werte so, dass nur Konsumgüter (Rum, Stoff, Glas) spürbar lohnen.
- Nutzen/Aufwand: Handel wird eine Ortsfrage · S–M · Rechnung ≈ 40 Tools, Sim+UI ≈ 1 Paket
- Status 2026-10-16: live (R692, Pool-Pflege)
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

### I-101 · live (REL-25) · Fernauftrag-Marke auf der Seekarte

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout A; Handel-2-Spec §1 «nicht im Umfang» (Marke auf der Seekarte, AN-7 «optional»); `world.order.island` (nach Handel 2) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht auf der Seekarte an der Felsbucht eine Münzmarke «15 Rum · 1:20» und lenkt das Schiff dorthin, statt in der Auftragskarte nach dem Ziel zu suchen."
- Grösse: S · Risiko: keins (reine Anzeige; setzt Handel 2 live voraus)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: nur bei laufendem Fernauftrag; Marke ohne Mausfang; bei Verfall oder Lieferung weg.
- Nutzen/Aufwand: Fernauftrag auf einen Blick planbar · S · ≈ 50 Tools
- Entscheid: eingeplant (IDEEN-10); Stand: Kurzdesign `docs/superpowers/specs/2026-10-16-i101-i103-fernmarke-routenbilanz.md` (R676)
- Status 2026-10-16: gemergt (R691), umgesetzt in UI-HAEPPCHEN-F (Marke an der Fern-Insel, hohl beim Angebot, gefüllt beim Auftrag)

### I-103 · bewertet · Routen-Bilanz (lohnt dieses Schiff?)

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout A; `docs/spielwerte.md` Handelsschiff (Unterhalt 90 / min), Warenbilanz nominal · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest im Schiff-Panel «Route Felsbucht: +310 / min Warenwert, Unterhalt 90 → +220» und streicht die Route, die nur 40 trägt."
- Grösse: S–M · Risiko: Perf gering (nur bei offenem Panel); Save nein, Baseline nein
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 3 = 12
- Randfälle: nominal wie die Lagerleiste (Handel, Aufträge, Vorliebe nicht eingerechnet, das Panel sagt es); Gewürz mit gespartem Kaufpreis; Schiff ohne Route zeigt nichts.
- Doppelung: I-067 (Verlaufskurve, geparkt), I-078/I-089 (live) berühren keine Routen.
- Nutzen/Aufwand: Schiffsentscheidung statt Bauchgefühl · S–M · ≈ 1 Paket
- Entscheid: offen (IDEEN-10); Stand: Kurzdesign `docs/superpowers/specs/2026-10-16-i101-i103-fernmarke-routenbilanz.md` (R676), Variante B ohne Save
- Status 2026-10-16: gemergt (R691), umgesetzt in UI-HAEPPCHEN-F (Variante B, Zeile mit «nominal»); Variante C (gemessene Bilanz, Save) erst nach I-091 und nur bei Bedarf

### I-104 · geparkt · Ausschreibung (grosse Sammelbestellung)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout A; Genre-Mechanik Sammelbestellung mit Frist; `docs/spielwerte.md` Handelsaufträge (`ORDER_PREMIUM` 0,75, Lager 100, Reserve I-049 live); Handel-2-Spec R3/R7 · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht ab Stufe 4 alle 12 min «Ausschreibung: 60 Holz, 30 Stein, 20 Stoff · 4000 · noch 6:00», baut Vorrat auf, stellt die Reserve hoch und entscheidet, ob er dafür den Verkauf auslässt."
- Grösse: M · Risiko: Save (Ausschreibungszustand neben dem Auftrag); Baseline nein, solange der Controller nicht annimmt
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13
- Randfälle: Stückprämie unter 0,8 × `buy` (Edikt Handel); Mengen je Gut ≤ 80; Teillieferung mit Abschlag erwägen; Verfall ohne Strafe. Entartung: reiner Überschuss ohne Wahl; Menge muss über dem Lager-Normalstand liegen (Rechnung `design-economy-designer`).
- Doppelung: I-017 (Lernpfad, geparkt), I-047 (Dauerabnahme). Nach Handel 2 prüfen, nicht davor.
- Nutzen/Aufwand: Spätspiel-Ziel «Vorrat statt Verkauf» · M · ≈ 2 Pakete (Rechnung ≈ 40 Tools)
- Entscheid: geparkt: Baustein Handels-Brainstorming (IDEEN-10, Pool-Pflege R692)

### I-105 · geparkt · Abfahrtsregel der Route (Warten bis halbvoll)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout A; Genre-Mechanik Abfahrtsbedingung; `docs/spielwerte.md` Route (Schiff fährt sofort, Frachtraum 50) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler stellt die Gewürzroute auf «wartet bis halbvoll» und nimmt längere Wartezeit im Hafen in Kauf, statt fast leer zu fahren."
- Grösse: M · Risiko: Save (Regel je Route, Standard «sofort», Migration keine); Baseline nein
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: Wartedeckel 0:30; zwei Güter je Richtung zählen gemeinsam; «wartet» im Panel sichtbar; Fernauftrag-Fracht darf nicht verklemmen.
- Doppelung: I-015 (Leitsätze) ging in Erweiterung 1 K3 auf; vorher prüfen, ob K3 eine Abfahrtsregel enthält, sonst zusammenfassen.
- Nutzen/Aufwand: Takt gegen Auslastung als echte Wahl · M · ≈ 2 Pakete
- Entscheid: geparkt: K3-Spec klären (I-015) (IDEEN-10, Pool-Pflege R692)

### I-106 · bewertet · «Neu»-Karte schlank und schliessbar

- Bereich: Bedienung · Säule: Bedienung · Quelle: IDEEN-10 Scout B; Playtest `.studio/qa/rel-18/report.md` (Ärgernis 2: «Neu: …»-Karte bleibt über 25 s, verdeckt oben links) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler schliesst die «Neu: …»-Karte mit einem Klick oder sieht bei mehreren Freischaltungen nur «Neu: 3 Gebäude»."
- Grösse: S · Risiko: keins (UI-Zustand)
- Raster: Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Hinweis: vor Einplanung gegen UI-AUFRAEUM-3 (I-099, Kartenstapel) und UI-HAEPPCHEN-D prüfen; falls dort gelöst, verwerfen.
- Nutzen/Aufwand: Sicht auf die Karte in der ersten Stunde · S · ≈ 50 Tools
- Entscheid: offen (IDEEN-10)

### I-107 · geparkt · Tempo-Tasten + und − (statt Ziffern)

- Bereich: Bedienung · Säule: Bedienung · Quelle: IDEEN-10 Scout B; Playtest rel-18; `src/ui/hotkeys.ts`; Hinweis bei `4`–`8` ist schon live (I-083) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler drückt `+` bzw. `-` für schneller bzw. langsamer."
- Grösse: S · Risiko: keins
- Raster: Spass 1 · Passung 2 · Aufwand 3 · Risiko 3 = 10
- Randfälle: Pause bleibt auf `P`/Leertaste; `+` in der Pause: Entscheid im Kurzdesign. Mit I-083 teilweise gelöst, Lückenfüller.
- Nutzen/Aufwand: Tastatur-Konsistenz · S · ≈ 40 Tools
- Entscheid: geparkt (I-083 deckt den Kern) (IDEEN-10, Pool-Pflege R692)

### I-108 · bewertet · Kopfzeile zeigt Einnahmen und Unterhalt getrennt

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-10 Scout B; Playtest rel-18; Screenshot `.studio/qa/REL-22/05-unterhalt.png`; `src/ui/hud.ts`, `src/ui/upkeepCard.ts` · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler liest «+540 / −780» statt «−240», sieht, ob Einnahmen schwach oder Unterhalt zu hoch ist, und öffnet per Klick die Unterhaltskarte."
- Grösse: S · Risiko: keins (abgeleitete Anzeige; Kopfzeilenbreite bei 1280 px prüfen)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Doppelung: I-089 (live) und I-067 (geparkt) liegen daneben; ändert nur die Zahl in der Kopfzeile.
- Nutzen/Aufwand: Wirtschaftslage auf einen Blick · S · ≈ 60 Tools
- Entscheid: Kurzdesign `docs/superpowers/specs/2026-10-16-i108-einnahmen-unterhalt-design.md` (R676), Gate OK
- Status 2026-10-16: gemergt (R691), umgesetzt in UI-HAEPPCHEN-F (Chip «+Einnahmen / −Unterhalt», `src/ui/balanceFlow.ts`)

### I-110 · bewertet · Startpaket zur Wahl

- Bereich: Inhalt · Säule: Insel besiedeln · Quelle: IDEEN-11 Scout A; Genre-Mechanik Startbonus mit Preis; `docs/spielwerte.md` Start (5000 Geld, 40 Holz, 20 Werkzeug, 10 Stein, 20 Nahrung) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler wählt bei «Neue Insel» zwischen «Standard», «Zimmerleute» (mehr Holz, weniger Geld), «Fischer» (zweite Fischerhütte steht, weniger Werkzeug) und «Kassenwart» (mehr Geld, weniger Holz) und spielt die ersten 15 Minuten anders."
- Mechanik: Das Paket setzt nur Start-Lager und Start-Gebäude der Heimat; danach gelten die normalen Regeln. Werte als Tabelle in `src/sim/defs/`. Die Scout-Werte (±150 Geld) sind bei 5000 Startgeld wirkungslos und werden im Kurzdesign neu gerechnet (Grössenordnung ±1000 Geld bzw. ±20 Holz).
- Grösse: S · Risiko: keins, solange «Standard» der Vorgabewert ist (Balancing-Test startet mit Standard; das Paket muss nicht im Save stehen)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: «Alles frei» kombinierbar; Geld nach dem Start nie negativ; Paket wird in der Kopfzeile oder im Menü nicht mehr gebraucht, nur beim Start. Entartung: ein Paket, das immer gewinnt (Geld ist ab Minute 10 kein Engpass), deshalb muss jeder Vorteil in einem Engpass der ersten 15 Minuten liegen (Holz, Werkzeug, Nahrung).
- Doppelung: keine Start-Idee in Pool und Archiv; I-070 (verworfen) war ein selbst gesetztes Ziel, kein Startzustand.
- Nutzen/Aufwand: Wiederspielwert und eine Wahl in Minute 0, Wirkung verblasst aber nach etwa 15 min · S · ≈ 60 Tools (plus Rechnung ≈ 20)
- Entscheid: offen (IDEEN-11)

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

### I-112 · bewertet · Ratsbeschluss je Stufe (einmalige Wahl)

- Bereich: Inhalt · Säule: Bevölkerung · Quelle: IDEEN-11 Scout A; Genre-Mechanik Weichenstellung mit Ausschluss; Edikte I-031 (live, wechselbar) als Abgrenzung · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler wählt beim ersten Bürgerhaus einmalig «Zunftrecht» (Aufstieg kostet 2 Stein weniger) oder «Marktrecht» (Marktplatz-Reichweite +2) und baut danach dichter oder weiter."
- Mechanik: Beim ersten Haus der Stufe 2, 3 und 4 erscheint eine Karte mit zwei dauerhaften Beschlüssen ohne Unterhalt; der andere verfällt für diese Partie. 3 × 2 Beschlüsse in `src/sim/defs/`, je ein Hebel auf Bauweise, Kette oder Kasse. Unentschieden bleibt die Karte offen und nichts wirkt.
- Grösse: M · Risiko: Save (drei Wahlfelder, Migration «keine Wahl»); Baseline bitgleich, solange der Controller nicht wählt
- Raster: Spass 3 · Passung 3 · Aufwand 2 · Risiko 2 = 13
- Randfälle: Abriss des ersten Hauses nimmt nichts zurück; «Neue Insel» setzt zurück; Beschluss ohne Wirkungsfeld (kein Marktplatz) ist schwächer, nicht kaputt; Abstieg einer Stufe behält den Beschluss. Entartung: ein Beschluss, der immer gewinnt; je Paar muss jede Seite einen anderen Siedlungsstil belohnen (Rechnung `design-economy-designer`).
- Doppelung: I-077 Spezialisierung (geparkt) wählt je Betrieb, I-064 «Bauherr» (geparkt) ist ein Edikt; I-031 Edikte sind wechselbar und einzeln aktiv. Neu: einmalig, dauerhaft, je Stufe.
- Nutzen/Aufwand: echte Weichenstellung im Mittelspiel, prägt den Stadtplan · M · ≈ 2 Pakete (Werte-Rechnung ≈ 40 Tools)
- Entscheid: offen (IDEEN-11)

### I-113 · verworfen · Gemeindeprojekt (Überschuss in die Stadt stecken)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-11 Scout A; Genre-Mechanik Sammelprojekt · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler steckt in der Amtsstube 700 Geld in «Pflasterung» (Marktplatz-Reichweite +1) oder 500 in «Zisterne» (Brandschaden −30 %)."
- Mechanik: Ein Projekt zur Zeit, vier Projekte je einmal, Kosten beim Start, dauerhaft nach Bauzeit.
- Grösse: M · Risiko: Save, Baseline, Krisen-Balancing (Brand)
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 1 = 9
- Randfälle: Amtsstube abgerissen: Projekt ruht. Entartung: alle vier werden ohnehin gekauft (reine Geldsenke ohne Wahl).
- Doppelung: Denkmal (live, Spätspiel-Geldsenke), I-079 Bauhof und I-080 Brunnen (beide verworfen); I-112 deckt die Wahl «Reichweite gegen Kosten» mit Ausschluss besser ab.
- Nutzen/Aufwand: Geldsenke ohne echte Wahl · M · ≈ 2 Pakete
- Entscheid: verworfen (R692): Geldsenke ohne Wahl

### I-114 · bewertet · Fernangebot zur Wahl (zwei Inseln)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-11 Scout B; `docs/spielwerte.md` «Fernangebot» (bei mehreren Inseln reihum nach Periode, ohne Zufall, also ohne Wahl) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht zwei Fernkarten, etwa «Möweninsel: 20 Stoff · 440» und «Felsbucht: 15 Rum · 450», und nimmt die mit der kürzeren Fahrt oder dem volleren Lager."
- Mechanik: Ab Kontoren auf zwei Fremdinseln zeigt der Auftragstakt die zwei nächsten Angebote der heutigen Reihe; höchstens eines annehmbar, Frist 2:50, Menge und Prämie wie heute, der nächste Auftrag entfällt weiter.
- Grösse: S · Risiko: vermutlich keins: beide Angebote sind aus der Periode ableitbar, gespeichert wird wie heute nur das angenommene (im Kurzdesign prüfen); Baseline bitgleich ohne Fremdkontor
- Raster: Spass 2 · Passung 3 · Aufwand 3 · Risiko 2 = 12
- Randfälle: ein Fremdkontor: wie heute; Gut über der Stufe fällt aus, dann eine Karte; laufender Stammkunde: kein Fernangebot (wie heute); zwei Karten plus Auftragskarte: Platz im Kartenstapel bei 1280 px prüfen.
- Doppelung: I-095 (erledigt, Handel 2) liefert das Angebot ohne Wahl; I-093 (verworfen) tauschte nach dem Annehmen; I-101 (Fernauftrag-Marke Seekarte) zeigt die Lage.
- Nutzen/Aufwand: aus «nimm, was kommt» wird eine Wahl über Fahrzeit und Lager · S · ≈ 60 Tools
- Entscheid: offen (IDEEN-11)

### I-115 · geparkt · Eigene Sättigung je Kontor

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-11 Scout B; `docs/spielwerte.md` «Preise sind global» und «Sättigung bleibt global» (Inselmarkt) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler merkt, dass 40 Rum daheim den Preis drücken, und fährt die Hälfte nach Felsbucht, wo der Preis noch frisch ist."
- Mechanik: `sellPct` je Kontor statt global, Erholung wie heute; der Handelsdialog zeigt die Sättigung des eigenen Kontors.
- Grösse: M · Risiko: Save (Sättigung je Insel); Baseline vermutlich bitgleich (Controller verkauft nur daheim); Arbitrage-Rechnung nötig
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: ohne Schiff nichts Neues; Entartung: Kleinmengen auf vier Märkte streuen vervierfacht den Vollpreis-Absatz; Frachtraum 50 und Unterhalt 90 / min müssen das deckeln (Rechnung `design-economy-designer`).
- Doppelung: Handel 2 hat «global» bewusst gesetzt; Erweiterung 1 plant Rivalen, die die Verkaufssättigung teilen (Brainstorming auf `design/erweiterung-1`, Rivalen). Gehört damit in die Nutzer-Session, nicht ins Studio.
- Nutzen/Aufwand: Schiffe bekommen einen Verkaufszweck · M · ≈ 2 Pakete
- Entscheid: geparkt (R692): als Baustein für Erweiterung 1 (Rivalen und Sättigung)

### I-116 · geparkt · Inselgunst (Pünktlichkeit hebt die Vorliebe)

- Bereich: Inhalt · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-11 Scout B; `PREFER_PCT` 130 % (`src/sim/defs/sea.ts`), Treue I-091 als Vorbild · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler hat Weidenau dreimal pünktlich beliefert, dort zahlt das Vorliebe-Gut jetzt 140 statt 130 %, und er bleibt bei dieser Insel."
- Mechanik: Jeder erfüllte Fernauftrag gibt der Insel einen Gunstpunkt (Deckel 5); ab 3 Punkten `PREFER_PCT` 140 %; ein verpasster Fernauftrag setzt die Insel auf 0; Anzeige in der Seekarte.
- Grösse: M · Risiko: Save (Zähler je Insel); Baseline bitgleich
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: Kontor abgerissen: Gunst weg; ohne Wahl der Insel (I-114) reine Belohnung ohne Entscheidung.
- Doppelung: I-091 Treue (Stammkunde, gemergt R686, REL-25) belohnt Bindung schon; I-073 ging in I-047 auf. Sinnvoll nur nach I-114.
- Nutzen/Aufwand: zweite Treue-Mechanik, Wirkung +10 Punkte auf einem Gut · M · ≈ 1–2 Pakete
- Entscheid: geparkt (R692): bis I-114 live

### I-117 · geparkt · Route verkauft statt zu lagern

- Bereich: Bedienung · Säule: Wirtschaft, Steuern und Handel · Quelle: IDEEN-11 Scout B; `docs/spielwerte.md` Route («Bringen» lädt ins Lager der Zielinsel) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler stellt bei «Bringen» auf «Verkaufen», und das Schiff setzt Rum in Felsbucht zum Vorliebe-Preis ab, ohne dass er jedes Mal dorthin klickt."
- Mechanik: Schalter «Lagern | Verkaufen» je Bringen-Gut; beim Anlegen wird der Bestand über der Reserve zum Preis des Zielkontors mit Sättigung verkauft.
- Grösse: M · Risiko: Save (Feld je Route, Migration «Lagern»); Baseline bitgleich
- Raster: Spass 2 · Passung 3 · Aufwand 2 · Risiko 2 = 11
- Randfälle: Zielkontor abgerissen: Ware bleibt an Bord; Verkauf unter Kaufpreis erlaubt (keine Arbitrage, Kauf ist teurer); leere Ladung: nichts.
- Doppelung: Routenregeln gehören zu Erweiterung 1 K3 (Seefahrt-Leitsätze I-015, Nutzer-Session); wie I-105 vor Einplanung gegen K3 prüfen. I-103 zeigt die Bilanz, ändert die Route nicht.
- Nutzen/Aufwand: Komfort für Handelsrouten, Wahl Lager gegen Kasse · M · ≈ 2 Pakete
- Entscheid: geparkt (R692): bis K3 (Erweiterung 1) geklärt

### I-118 · bewertet · Aufstiegs-Funkeln am Haus

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; README «Effekte» (Aufstieg nur als Ton), `src/render/fx.ts` (nur Krisen-Effekte) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht beim Aufstieg das Haus kurz aufglänzen und weiss, welches Haus gewachsen ist, ohne den Ton zuzuordnen."
- Mechanik: Der Renderer vergleicht die Stufe je Haus mit dem Vorframe und zeichnet 1,5 s einen warmen Lichtkranz mit 6–8 Funken (grösser ab Stufe 3); nur im Bildausschnitt, höchstens 6 gleichzeitig, bei «Bewegung reduzieren» nur der Kranz. Prozedural, keine Assets.
- Grösse: S · Risiko: keins (kein Save, keine Sim-Änderung)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: hohe Geschwindigkeit: Deckel, älteste zuerst; Pause friert ein; nach dem Laden kein Effekt (erster Frame merkt nur den Stand); Abstieg zeigt nichts.
- Doppelung: I-007 Fest und I-009 Hörbarer Mangel (live) sind andere Anlässe; ORT-A/ORT-B betreffen statische Gestalt.
- Nutzen/Aufwand: Fortschritt in der ersten Stunde sichtbar · S · ≈ 50 Tools
- Entscheid: gemergt (R707)

### I-119 · bewertet · Bewohner reagieren auf Krisen

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; `src/render/life.ts` und `src/render/errands.ts` (keine Krisenreaktion) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht beim Brand Bewohner als Eimerkette zum Feuer laufen und bei Sturmwarnung heimgehen."
- Mechanik: Brand: bis 6 Spaziergänger im Umkreis 6 laufen hin, Feuerwache in Reichweite schickt 2 Löscher; Sturmwarnung: Figuren gehen ins nächste Haus; Boom: Figuren winken. Nutzt den Weggraph aus `errands.ts`, gedeckelt über die Figurenobergrenze.
- Grösse: M · Risiko: Perf (zusätzliche Pfade, gedeckelt); kein Save
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: Brand unter 5 s: keine Läufer; Pause: Stillstand; «Bewegung reduzieren»: keine Läufer.
- Doppelung: I-034 Seuche, I-058 Pause bei Krise (geparkt) sind andere Fragen; mit I-120 ein gemeinsames Paket «Bewohner reagieren» möglich.
- Nutzen/Aufwand: Krisen fühlbarer, ohne Entscheidung · M · ≈ 2 Pakete
- Entscheid: offen (IDEEN-11)

### I-120 · bewertet · Wohlstandsklang der Stadt

- Bereich: Ton · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; `src/audio/ambience.ts`, `src/audio/mix.ts` (Schicht `town` hängt nur an der Einwohnerzahl im Bild) · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler hört eine gut versorgte Stadt lebhaft und eine darbende still, ohne auf Zahlen zu schauen."
- Mechanik: Die Umgebungs-Mischung bekommt als Eingang den Anteil voll versorgter Häuser im Bild (gemittelt über ≈ 10 s): ab 80 % voller Pegel der Schicht `town`, unter 40 % halber Pegel, unter 20 % Wind statt Stadt; Gleiten mit `GLIDE_S`. Der Anteil kommt als Zahl über die UI-Verdrahtung; `src/audio/` importiert nichts aus `src/sim/`.
- Grösse: S · Risiko: keins (reine Mix-Funktion, keine Assets)
- Raster: Spass 2 · Passung 2 · Aufwand 3 · Risiko 3 = 12
- Randfälle: hohe Geschwindigkeit: Mittelung; Pause: Klang bleibt; Ton aus: ohne Wirkung; keine Häuser im Bild: Schicht aus wie heute.
- Doppelung: I-009 (live) meldet einen einzelnen Mangel als Signal; dies ist die Dauerstimmung.
- Nutzen/Aufwand: Versorgung hörbar, sehr günstig · S · ≈ 40 Tools
- Entscheid: gemergt (R707)

### I-121 · bewertet · Wartende vor der Tür

- Bereich: Grafik · Säule: Bevölkerung · Quelle: IDEEN-11 Scout C; Nutzerfeedback 2026-10-02 G9 (weniger Text, mehr Bilder) und S4 · Herkunft: vom Studio vorgeschlagen
- Spielerwirkung: „Der Spieler sieht nah gezoomt 1–2 Bewohner mit hängendem Kopf vor einem Haus mit Mangel stehen."
- Mechanik: Ab Zoom 1,0 stehen bei Mangel 1–2 Figuren vor der Tür (Farbe nach wichtigstem Mangel), nach 60 s eine dritte; gesamt höchstens 12, zählen zur Figurenobergrenze; voll versorgte Häuser schicken öfter Spaziergänger los.
- Grösse: M · Risiko: Perf (gedeckelt); kein Save
- Raster: Spass 2 · Passung 2 · Aufwand 2 · Risiko 2 = 10
- Randfälle: 3 s Verzögerung gegen Flackern bei hoher Geschwindigkeit; «Bewegung reduzieren»: höchstens 4.
- Doppelung: Bedarfssymbole am Haus (live, ab Zoom 0,75) zeigen denselben Mangel; mit I-119 ein gemeinsames Paket möglich.
- Nutzen/Aufwand: doppelt die Bedarfssymbole in Nahansicht · M · ≈ 2 Pakete
- Entscheid: offen (IDEEN-11)
