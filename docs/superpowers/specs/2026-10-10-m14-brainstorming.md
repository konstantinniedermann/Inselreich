# Richtungsvorschlag: Meilenstein M14 (nach M13 „Spätspiel mit Richtung“)

Stand: 2026-10-10 · Autor: lead-design (Rechnung: design-economy-designer) · Paket design-m14-richtung · Auftrag
R475 · Prozessstufe voll · Gate: Brainstorming (L0) · **nur Vorschlag, keine Spec** · Rechnung:
[Anhang 01](2026-10-10-m14-brainstorming/anhang-01-rechnung.md) (Abschnitte A–C, alle Zahlen mit Herleitung) ·
Grundlage: `docs/ideen.md` (Rangliste IDEEN-06, R474), M12-Design (Annahmen A-01…A-08, Anhang 01 «Erz streichen»),
M13-Vorschlag (`2026-10-10-spaetspiel-vorschlag.md`, Referenz-Kolonie und Phasen a/b/c), README. Recherche: keine;
alle Mechaniken (Arbeitskraft aus Wohnraum, Inselcharakter, Werft, Routenrisiko, Liefervertrag) sind
Genre-Gemeingut, Namen und Inhalte eigen (ADR-006).

## 1. Ausgangslage: Welche Säule trägt am wenigsten?

| Säule                             | Stand nach M13                                                                                                                       | Lücke                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Insel besiedeln                   | Heimat 64×64, zwei feste Fremdinseln (Möweninsel: Gewürz; Felsbucht: Gewürz und Gebirge), Kontor II, bis 4 Schiffe, Routen, Seekarte | **Ein einziger Grund zu kolonisieren** (Gewürz). Welche Insel wofür, ist keine Frage; die dritte Insel aus M12 A-02 fehlt. |
| Produktionsketten                 | 4 Stufen, Ausbau, Stilllegen (M13-E1), Gut-Chip (I-043); Sperrbestand (I-049) mit Save v12 vorgesehen                                | Ketten laufen unabhängig von der Bevölkerung; Grenzen sind nur Platz und Unterhalt                                         |
| Bevölkerung versorgen, aufsteigen | Bedarf, Dienste, Steuer je Stufe (v10), Fest, Edikt Wohlfahrt                                                                        | Stufen unterscheiden sich nur in Bedarf und Steuer; ein Aufstieg kostet nur Baustoffe und mehr Ware                        |
| Wirtschaft, Steuern, Handel       | Edikte (M13-E1), Denkmal als Senke (M13-E2, Spec läuft), Zukauf-Aufschlag I-048 als Nächstes (R474), Befund Verkaufssättigung        | Handel ist Kauf/Verkauf auf Knopfdruck plus einmalige Aufträge; wird mit I-048 bereits bearbeitet                          |

M11, M13 und der nächste Baustein I-048 arbeiten an der Säule Wirtschaft. Die Säule **Insel besiedeln** ist seit
M12 nicht gewachsen, und die Playtest-Wünsche aus REL-05 («kein freies Schiff … keine Hilfe», «oder eine werft?»,
«gibts eine questreihe?», I-015 bis I-019) sind offen. Die Säule **Bevölkerung** hat die tiefste ungenutzte Mechanik
(I-050), die aber die Kernschleife umbaut.

## 2. Spielerzweck je Ansatz in einem Satz

- **A Hände und Häuser:** Der Spieler plant Wohnviertel als Arbeitskraft in Reichweite seiner Betriebe und
  entscheidet zwischen Aufstieg (mehr Steuer), Arbeiterhäusern (mehr Hände) und Ausbaustufen (weniger Plätze).
- **B Archipel mit Wert:** Der Spieler wählt, welche Insel er wofür besiedelt (Gewürz, Stein, Zuckerrohr und Wolle),
  verteilt seine vier Schiffe auf die Routen, baut sie in einer Werft und legt fest, wie volle Routen mit Sturm
  umgehen.
- **C Markt mit Gedächtnis:** Der Spieler plant Produktion für Abnehmer statt fürs Lager: wechselnde Nachfrage,
  Sonderangebote und Lieferverträge belohnen Voraussicht.

## 3. Ansätze

### Ansatz A · „Hände und Häuser“ (Säule Bevölkerung, stärkt Produktionsketten)

- **Spielerwirkung:** Jeder Produktionsbetrieb hat einen Arbeitsplatz (Glashütte und Werkzeugmacher zwei); Häuser
  in 10 Kacheln Reichweite stellen Arbeiter (je Einwohner Pioniere 1,0, Siedler 0,8, Bürger 0,6, Kaufleute 0,4).
  Ein unbesetzter Betrieb läuft mit 50 %. Kontor und Kontor II stellen je 4 Grundarbeiter (kein Henne-Ei am Start).
  Der Spieler legt Wohn- und Gewerbeviertel gegeneinander an und entscheidet bei jedem Aufstieg zu Kaufleuten,
  ob er Arbeiter durch Siedlerhäuser oder Ausbaustufen ersetzt (Regel W, Anhang A.2). Spürbar ab Minute 1.
- **Ideen:** I-050 Arbeitskräfte (Kern), I-032 Dienstkapazität (gleiche Zuordnung Haus → Gebäude, optional),
  I-052 Einwandererschiff als Antwort auf Arbeitermangel (bekommt hier die fehlende Wahl: aufnehmen bringt Arbeiter,
  erhöht aber den Versorgungsdruck); I-055 Fischinsel trägt nur hier (Nahrungsbasis bei Arbeitermangel, B.1).
- **Grösse:** L, drei Epics: E1 Sim-Kern Arbeit (Zuordnung, Auslastung, ≈ 23 neue Def-Werte, Controller,
  Neumessung) · E2 UI (Arbeiter-Chip, Panel «Arbeiter 1 / 1», Einzugsbereich-Overlay) · E3 Einwanderer oder
  Dienstkapazität. ≈ 7–9 Pakete, ≈ 700–900 Tools.
- **Save / Baseline:** Save nur, falls die Zuordnung nicht abgeleitet wird (Ziel: abgeleitet, kein Feld). Baseline
  **nicht** bitgleich: Der Controller braucht ≈ 8 Siedlerhäuser mehr und ein neues Layout; alle Pins und
  Fingerabdrücke (`balance`, `-merchants`, `-crises` `OFF_REFERENCE`, `-upgrade`, `-edicts`) neu per Ruling. Ziel 1
  geschätzt 6750 → 6900–7100 Ticks (Grenze 7500), **nur geschätzt, nicht simuliert**. Perf: Zuordnung je
  Wachstumstakt, nicht je Tick.
- **Gefahr:** Ohne Reichweite ist Regel W reine Mehrarbeit, weil Geld kein Engpass ist (8 Siedlerhäuser ≈ 46 s
  Einkommen in Phase c). Die Konkurrenz «Aufstieg gegen Arbeitskraft» ist knapp (+180 / min für den Aufstieg) und
  mit ≈ 980 Geld für zwei Siedlerhäuser aufgelöst; die Wahl lebt also vom **Platz**, nicht vom Geld. Grösste
  Änderung des Spielgefühls seit M1, aber kein Säulenwechsel (vertieft Bevölkerung).

### Ansatz B · „Archipel mit Wert“ (Säule Insel besiedeln, stärkt Handel und Ketten) — Empfehlung

- **Spielerwirkung:** Fremdinseln bekommen Charakter, der sich lohnt, weil der Transport (1,5–2,4 Geld je Stück,
  B.1) nur Güter ab ≈ 5 Geld Erzeugungskosten trägt. Die Felsbucht wird **Gebirge+** (3 Steinbruch-Plätze statt 1,
  Ausstoss ×2): Stein für Glas und Denkmal kommt per Schiff statt vom Kontor, **+450 / min** (9 % des Einkommens in
  Phase c). Eine dritte Fremdinsel (M12 A-02, Abstandsband «fern») ist **fruchtbar** (Zuckerrohr und Schafe ×2):
  auf einer geteilten Gewürzroute **+156 / min** und ≥ 20 Heimatkacheln frei. Damit binden drei Routen alle vier
  Schiffe, und erst dann wird Sturm auf See eine echte Wahl (B.3): «bei Sturm anlegen» kostet bis 87,5 %
  Auslastung nichts, auf vollen Routen verliert man 40–55 % einer Ladung an Zeit statt 20 % an Ware. Schiffe
  entstehen in einer Werft; die Seefahrt-Führung aus dem Playtest REL-05 erklärt den Weg dorthin.
- **Ideen:** I-038 in Teilfassung (dritte Insel, aber sichtbar ab Seefahrt statt erkundet), neue Inselcharaktere
  statt I-055 (Fischinsel ist rechnerisch tot, B.1), I-016 Werft, I-014 Sturm auf See als Daueranweisung je Route
  (I-054 Piraten nur als Variante ohne Kampf, O5), Seefahrt-Führung I-015 (Leitsätze) und I-019 (Schiffsangebot am
  Kontor); optional I-036 Wrackbergung (Beute als knappes Gut).
- **Grösse:** L, drei Epics: E1 Inselcharakter (Traits Gebirge+ und fruchtbar, dritte Insel, Seekarte nennt Traits)
  · E2 Werft und Seefahrt-Führung · E3 Routenrisiko (nur zusammen mit oder nach E1). ≈ 6–8 Pakete, ≈ 550–750 Tools;
  E1 und E2 sind je allein lieferbar.
- **Save / Baseline:** Save ja (v13 nach M13-E2 = v12: Trait-Daten der Inseln, dritte Insel, Werft-Auftrag,
  Routen-Anweisung). Heimat bitgleich (M12 A-01); neue Insel im eigenen Strom `ISLANDS_SALT` (ADR-010), Krisen- und
  Auftragsströme unberührt; bitgleich nur, wenn Traits und Inselform keine neuen Zufallszüge vor den bestehenden
  brauchen (Anhang, Fussnote 1; Prüfauftrag lead-tech: schliessen Hash-Pins die Fremdinseln ein?). Der Controller
  kauft weiter am Kontor (Werft ergänzt, O4) und fährt keine Stein- oder Rohrroute, also bleiben die Sieg-Zeiten.
  Sturm auf See nutzt den vorhandenen Sturm; die Krisenverteilung 50 / 25 / 25 bleibt.
- **Gefahr:** Der Wert von Gebirge+ hängt an der Heimatkarte: Hat die Heimat selbst Gebirge, fällt der Gewinn auf
  ≈ 0 (Stein daheim 6 Geld / Stück). Fruchtbar trägt nur auf einer geteilten Route (eigene Route ±0). Die Werft darf
  kein Pflichtumweg sein. Routenrisiko allein (ohne E1) ist eine tote Option.

### Ansatz C · „Markt mit Gedächtnis“ (Säule Wirtschaft und Handel)

- **Spielerwirkung:** Händler bekommen Gedächtnis: Ein Gut ist zeitweise gefragt (I-029, Verkaufsseite), ein
  Händler bietet Ware billiger an (I-006, Kaufseite), und nach einem erfüllten Auftrag lässt sich ein Stammkunde
  binden (I-047: feste Menge in festem Takt zu festem Preis, Strafe bei Ausfall).
- **Ideen:** I-047, I-029, I-006; setzt auf I-048 Zukauf-Aufschlag und den Befund Verkaufssättigung auf, die laut
  R474 ohnehin als Nächstes kommen; I-004 Lagerhaus optional.
- **Grösse:** M, zwei Epics (E1 Nachfrage und Angebot im eigenen Händler-Strom, E2 Lieferverträge), ≈ 4 Pakete,
  ≈ 350–450 Tools.
- **Save / Baseline:** Save ja (aktives Gut, Angebot, Vertrag). Baseline bitgleich, solange der Controller weder nach
  Nachfrage verkauft noch Verträge annimmt; die Ziehung braucht einen neuen Strom (ADR-010).
- **Gefahr:** Die Ideen-Fassung von I-047 ist ab 4 Rum / min Überschuss immer besser als der freie Markt, bringt aber
  nur **+34 / min** (0,7 % von Phase c): Dominanz ohne Gewicht, also ein Klick ohne Entscheidung (C.1). Gewicht
  bekommt der Vertrag erst als Bauanreiz (25 % der Erzeugung zu 120 %, +158 / min, zwei Zusatzbrennereien). Mehr
  Einkommen verschärft «Geld ohne Senke»; vierte Wirtschafts-Runde in Folge; kaum sichtbar auf der Insel.

## 4. Kernzahlen der Rechnung

| Frage                                      | Ergebnis (Anhang)                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Belegung Arbeitsplätze mit Regel W         | Ziel 1 100 % · Ziel 2 60 % · Ziel 3 55 % ohne Gegenmassnahme (A.2); mit 2-bis-6-Plätzen je Betrieb nur 39 % an Ziel 1 |
| Aufstieg Bürger → Kaufleute gegen Arbeiter | +660 / min Steuer und Versorgung gegen −480 / min Ausstoss = **+180 / min** (A.2)                                     |
| Reines Pionierviertel                      | dominiert nicht: Siedlerhaus bringt dieselben +3,2 Arbeiter und 7× das Geld (A.3)                                     |
| Bestehende Def-Werte in A                  | 0 geändert, ≈ 23 neu; Baseline nicht bitgleich (A.4)                                                                  |
| Fischinsel                                 | 2,65 Geld je Nahrung gegen 2,0 daheim, bei keiner Einwohnerzahl lohnend: **tote Option** (B.1)                        |
| Gebirge+ auf der Felsbucht                 | **+450 / min**, mit Edikt Handel +306; ≈ 0, wenn die Heimat Gebirge hat (B.2)                                         |
| Fruchtbare Insel                           | +156 / min auf geteilter Gewürzroute, eigene Route ±0 (B.2)                                                           |
| Erz → Werkzeug                             | weiter verworfen (M12 Anhang 01, B.2)                                                                                 |
| Sturm auf See mit Daueranweisung           | Anlegen kostenlos bis 87,5 % Auslastung; heute 44–60 % → **tot allein**, Wahl erst mit ≥ 3 Routen (B.3)               |
| Stammkunde (I-047)                         | ab 4 Rum / min dominant, nur +34 / min; Variante 25 % zu 120 % +158 / min (C.1)                                       |
| Arbitrage                                  | alle Preise unter `buy`; mit Edikt Handel Vertragsfaktor ≤ 1,77, Boom und Vertrag nicht stapeln (C.2)                 |

## 5. Vergleich und Empfehlung

| Kriterium                       | A Hände und Häuser                       | B Archipel mit Wert                       | C Markt mit Gedächtnis          |
| ------------------------------- | ---------------------------------------- | ----------------------------------------- | ------------------------------- |
| Säule direkt                    | Bevölkerung                              | Insel besiedeln                           | Wirtschaft (vierte Runde)       |
| Spürbar ab                      | Minute 1                                 | Ziel 1 (≈ 11 min), Seefahrt               | Mittelspiel (erster Überschuss) |
| Neue echte Wahl (Rechnung)      | bedingt: nur mit Reichweite (Platz)      | ja: Stein +450, Rohr +156, Schiffe binden | nein in der Ideen-Fassung       |
| Sichtbar auf der Insel          | Viertel, Einzugsbereiche                 | dritte Insel, Werft, Schiffe, Sturm       | kaum (Handelsdialog)            |
| Grösse                          | L, ≈ 700–900 Tools                       | L, ≈ 550–750 Tools                        | M, ≈ 350–450 Tools              |
| Save                            | evtl. keins (abgeleitet)                 | ja (v13)                                  | ja                              |
| Baseline                        | **Neumessung aller Pins**                | Heimat bitgleich, Inselpins prüfen        | bitgleich                       |
| Bedient offene Playtest-Wünsche | nein                                     | **ja** (Schiff, Werft, Führung, REL-05)   | nein                            |
| Grösstes Risiko                 | Pflichtbau ohne Reichweite, Ziel-1-Delle | Wert hängt an der Heimatkarte             | Klick ohne Gewicht              |

**Empfehlung B «Archipel mit Wert».** B stärkt die Säule, die seit M12 still steht, bietet nach der Rechnung als
einziger Ansatz ohne Zusatzregel eine echte Wahl (welche Insel für welches teure Gut, welches Schiff auf welche
Route), nutzt die vorhandene Seefahrt-Technik (ADR-013, Routen, Seekarte), beantwortet die offenen Playtest-Wünsche
und lässt die Heimat-Baseline bitgleich. Die Rechnung hat den Ansatz gegenüber der Ideen-Lage geändert: Fischinsel
und Routenrisiko allein fallen weg, Routenrisiko kommt nur gekoppelt an volle Schiffe.

**A** ist die tiefere Mechanik und die einzige mit Wirkung ab Minute 1, aber ihre Wahl entsteht nur über Platz, die
Ziel-1-Delle ist geschätzt, und alle Pins müssen neu. Vorschlag: A als M15-Kandidat, vor dessen Brainstorming eine
Simulation der Regel W mit Reichweite im Controller-Lauf (Spike, Entscheid L0) und ein Playtest von M13.
**C** ist kein Meilenstein: I-047 nur in der Fassung mit Gewicht (25 % zu 120 %) als Paket nach I-048; I-029 und
I-006 sind nicht eigens gerechnet und bleiben geparkt bis zum Handels-Baustein.

**Parallel zu M14, unabhängig von der Richtung** (Bedienung, kein Save, keine Baseline): I-058 Pause bei Krise und
I-059 Sammelausbau als Studio-Platz-Häppchen, sobald ein Playtest den Anlass zeigt (R474 unverändert).

## 6. Etappen des empfohlenen Ansatzes B

| Epic                     | Inhalt                                                                                                                                                                   | Grösse                   | Abhängig von                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ----------------------------- |
| **E1 Inselcharakter**    | Traits `mountainRich` (Steinbruch-Plätze 3, Ausstoss ×2) und `fertile` (Zuckerrohr, Schafe ×2) in `src/sim/defs/sea.ts`, dritte Fremdinsel «fern», Seekarte nennt Traits | M, ≈ 2–3 Pakete          | M13-E2 (Save v12)             |
| **E2 Werft und Führung** | Werft (Küste, Auftrag mit Bauzeit, ergänzt den Kauf am Kontor), Leitsätze I-015, Angebotsmarke I-019                                                                     | M, ≈ 2–3 Pakete + Sprite | nur Save-Schnitt mit E1       |
| **E3 Routenrisiko**      | Daueranweisung je Route «bei Sturm anlegen / weiterfahren», Verlust 20 % über den bestehenden Sturm, Meldung                                                             | S–M, ≈ 1–2 Pakete        | E1 (sonst tote Option)        |
| E4 (optional)            | I-036 Wrack mit knapper Beute; I-038 Erkundung als Aufdecken                                                                                                             | M                        | E1, Ruling zu M12 A-03 / A-05 |

- **Erstes spielbares Release = E1:** setzt am Freischaltpunkt der Seefahrt an, trägt die Kernfrage «welche Insel
  wofür» allein, braucht ausser Trait-Marken und der dritten Insel keine neue Grafik.
- **Parallelität (R67):** E2-ART (Werft-Sprite, prozedural) hängt nur an der Spec und läuft neben E1; E2-UI
  (Leitsätze I-015) ist reine UI und kann neben E1-SIM laufen; E3 folgt E1.
- **Save-Schnitt:** E1 und E3 in einem Sprung (v13); E2 mit E1 oder mit eigenem Sprung, je nach Reihenfolge.
- **Spec-Auflage:** Anteil der Seeds, deren Heimat Gebirge trägt, messen; liegt er hoch, Gebirge+ an ein Gut binden,
  das die Heimat nie hat (z. B. ein Rohstoff, der nur auf Fremdinseln vorkommt), sonst ist der Wert zufällig.

## 7. Nicht im Umfang (für alle Ansätze)

Seekampf, Gegenspieler, Krieg; Nebel des Unerforschten über die ganze Karte; grössere Heimatinsel; Fischinsel als
Trait (B.1, ausser in A); Erz und Schmiede; neue Bevölkerungsstufe; Änderungen an Zielen 1–3; Änderungen an Edikten
und Denkmal (M13); Story-Rahmen (I-018); Handel H1. **Kein Säulen-, Genre- oder Titelwechsel** in A, B oder C; ein
Seekampf (I-054 mit Kampf) wäre einer und gehört dann als Nutzer-Vorbehalt in die Warteschlange (Verfassung §5.3).

## 8. Offene Entscheide mit Empfehlung

| Nr. | Frage                                                                                                              | Empfehlung                                                                                                    | Entscheider |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ----------- |
| O1  | Richtung A, B oder C?                                                                                              | **B** «Archipel mit Wert»                                                                                     | L0          |
| O2  | A als M15-Kandidat, vorher Spike «Regel W mit Reichweite im Controller-Lauf»?                                      | ja; Spike erst nach M13-Playtest                                                                              | L0          |
| O3  | C als Meilenstein oder als Paket nach I-048?                                                                       | Paket: I-047 nur in der Fassung 25 % zu 120 %; I-029 / I-006 geparkt                                          | L0          |
| O4  | Werft ersetzt den Schiffskauf am Kontor oder ergänzt ihn?                                                          | ergänzt (Werft billiger mit Bauzeit, Kontor sofort); Controller und Baseline bleiben unberührt                | L0          |
| O5  | Routenrisiko: nur Sturm auf See oder auch Piraten (ohne Kampf)?                                                    | nur Sturm (bestehende Krise, Verteilung bleibt); Piraten als neue Krisenart weichen von M12 A-03 ab           | L0          |
| O6  | Dritte Insel sichtbar ab Seefahrt oder per Erkundung (I-038)?                                                      | sichtbar (M12 A-05), gleiche Wahl mit weniger Regeln; Erkundung höchstens E4                                  | L0          |
| O7  | Inselcharaktere Gebirge+ (Felsbucht) und fruchtbar (dritte Insel)                                                  | ja, Werte in der Spec mit design-economy-designer; Auflage Heimat-Gebirge (Abschnitt 6)                       | L0          |
| O8  | Reihenfolge gegenüber I-048 (R474: nach M13-E2)                                                                    | I-048 zuerst (schon in Spec); M14-E1 danach, M14-E2-ART parallel                                              | L0          |
| O9  | Ruling-Entwurf aus der Rechnung: Fischinsel (I-055) und Routenrisiko allein (I-014) als eigene Bausteine streichen | annehmen; I-055 bleibt nur als Teil von A, I-014 nur gekoppelt an E1 · Kosten bei Irrtum: spätere Neurechnung | L0          |

Kein Entscheid gehört dem Nutzer, solange O5 ohne Kampf bleibt (§5.3 nicht berührt).

## 9. Selbstprüfung Gate Brainstorming

Urteil: **OK mit Bedenken** (B1–B3).

1. **Säulen:** B stärkt Insel besiedeln direkt, Handel und Ketten indirekt (Stein für Glas und Denkmal, Rum-Kette).
   Gefährdet wäre Produktionsketten, falls Fremdinseln die Heimat-Ketten überflüssig machen; das verhindern die
   kleinen Beträge (9 % bzw. 3 % des Einkommens) und der Kontor-Zukauf als Alternative (kein Pflichtbau).
2. **Echte Wahl:** ja, rechnerisch belegt (B.2): zwei Inselcharaktere mit unterschiedlichem Wert, vier Schiffe für
   bis zu drei Routen; Routenrisiko wird erst mit vollen Schiffen eine Entscheidung (B.3) und ist deshalb an E1
   gekoppelt. Fischinsel und Erz sind als tote Optionen ausgeschlossen.
3. **Rückkopplungen:** Wachstumsmotor (Stein und Rum billiger → schneller Glas und Denkmal) bleibt klein; Bremse ist
   der Schiffsdeckel `SHIP_MAX` 4 und der Sturmverlust. Kein endloser Überschuss: Ware über dem Bedarf fällt in die
   Verkaufssättigung (Boden 30 %).
4. **Spielerzweck in einem Satz:** ja (Abschnitt 2). Im ersten Spiel von 15 Minuten nur am Rand spürbar (Seefahrt ab
   ≈ 11 min); E2-Führung verbessert gerade diesen Einstieg.
5. **Einfachere Variante:** nur E1 (zwei Traits plus dritte Insel) trägt die Kernwahl allein; Werft und Routenrisiko
   sind Erweiterungen, Erkundung bleibt draussen. ADR-006: nur Mechaniken, eigene Namen.

Bedenken:

- **B1 Wert hängt an der Heimatkarte.** Gebirge+ bringt ≈ 0, wenn die Heimat Gebirge hat. Auflage für die Spec:
  Seed-Anteil messen und den Trait gegebenenfalls an ein Gut binden, das die Heimat nicht erzeugt.
- **B2 Kleine Beträge.** +450 und +156 / min sind 9 % bzw. 3 % des Einkommens in Phase c; spürbar wird B über Platz
  (≥ 20 Heimatkacheln frei) und über das Schiffs-Puzzle, weniger über Geld. Playtest-Frage unten.
- **B3 A bleibt offen.** Die tiefste Mechanik (A) wird nicht abgelehnt, nur vertagt; ohne Simulation der Regel W ist
  die Ziel-1-Delle eine Schätzung.

**Playtest-Frage (ab Spielstand Ziel 1):** Gründet der Spieler ohne Erklärung ein Kontor auf der Felsbucht für
Stein, und kann er sagen, warum diese Insel? Verteilt er die vier Schiffe bewusst, und stellt er eine volle Route
auf «weiterfahren»?
