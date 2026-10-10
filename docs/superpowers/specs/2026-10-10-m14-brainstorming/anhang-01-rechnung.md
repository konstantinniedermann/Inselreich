# Anhang 01 · Machbarkeitsrechnung M14 (Arbeitskräfte, Archipel, Handel)

Überschlag zu `2026-10-10-m14-brainstorming.md`. 1 min = 600 Ticks; Unterhalt in Defs je 100 Ticks (× 6 = je min).
Phasen (a)/(b)/(c), Steuer und Kasse aus `2026-10-10-spaetspiel-vorschlag/anhang-01-rechnung.md` (Sp-A.1). Ausstoss =
600 ÷ `cycle` je min. Keine Simulation; alle Zahlen gerechnet.

## A Arbeitskräfte (I-050)

### A.1 Referenz-Kolonie

- (a) 50 Bürger: Betriebe aus `balance-crises.test.ts` (`OFF_REFERENCE`): 2 Holzfäller, 10 Fischer, 5 Schäfereien,
  5 Webereien, 3 Zuckerrohr, 3 Brennereien = **28**; Kapelle, Schule. Probe Unterhalt: 10+50+50+75+30+60+15+25 = 315 ✓.
- (b) 60 Kaufleute + 15 Bürger: Formel `ceil(Σ maxInh × need ÷ (100/cycle))` (Controller) für 3 K- + 1 B-Haus: Nahrung
  37,5 ÷ 2,5 = 15 Fischer; Stoff 15 ÷ 2 = 8 Paare; Rum 8 Paare; Glas 3 Hütten → 2+15+16+16+3 = **52**; + Bad. Probe:
  10+75+80+120+80+160+75+15+25+30 = 670 ✓.
- (c) 80 Kaufleute: (b) + 1 Fischer + 1 Glashütte = **54** daheim, 4 Gewürzplantagen auf der Fremdinsel (Sp-A.1).

### A.2 Arbeiter-Regel

**Briefing-Beispiel (2–6 je Betrieb, P 1,0 … K 0,25) verworfen:** schon mit 2 (Rohstoff) / 3 (Verarbeiter) braucht (a)
2 × 20 + 3 × 8 = 64 Arbeiter, 50 Bürger × 0,5 liefern 25 → 39 % belegt. Die Kolonie hat ≈ 1 Betrieb je 1–1,5 Einwohner;
mehr als 1 Platz je Betrieb erzwingt eine zweite Stadt.

**Regel W (Vorschlag):** 1 Arbeitsplatz je Betrieb, 2 für Glashütte/Werkzeugmacher; öffentliche Gebäude, Kontor,
Markt 0. Arbeiter je Einwohner: P 1,0 · S 0,8 · B 0,6 · K 0,4. Unbesetzter Betrieb läuft mit **Boden 50 %** (kein
Stillstand). Zuordnung nach Abstand, dann ID.

| Punkt | Arbeitsplätze              | Arbeiter                 | belegt    |
| ----- | -------------------------- | ------------------------ | --------- |
| (a)   | 28                         | 50 × 0,6 = 30            | **100 %** |
| (b)   | 49 + 3 × 2 = 55            | 60 × 0,4 + 15 × 0,6 = 33 | **60 %**  |
| (c)   | 50 + 4 × 2 = 58 (+4 fremd) | 80 × 0,4 = 32            | **55 %**  |

Netto-Arbeiter je volles Haus (eigener Bedarf in Arbeitsplätzen abgezogen):

- Pionier: 4 − 0,8 Fischer (2 Nahrung ÷ 2,5) = **+3,2**; Geld 8 − 4 = +4 je 100 Ticks = **+24/min**.
- Siedler: 6,4 − 1,6 Fischer − 0,8 − 0,8 (Stoff 1,6 ÷ 2) = **+3,2**; Geld 56 − 8 − 20 = **+168/min**.
- Bürger: 9 − 3 − 1,5 − 1,5 − 1,5 − 1,5 = **0**. Kaufmann: 8 − 4 − 4 − 4 − 2 (Glas) = **−6**.

**Aufstieg gegen Arbeitskraft (ein Haus B → K):** Steuer +230 je 100 Ticks (440 − 210); Versorgung +120 (Fischer 5,
Stoff 12,5, Rum 15, Glashütte 25 + Stein 2 × 15 = 30, Plantage 15 + Route 10, Bad 7,5) → **+660/min**. Arbeiter −1
(9 → 8), Arbeitsplätze +5 daheim → −6. Ein fehlender Arbeiter kostet 50 % Ausstoss, als Zukauf ersetzt ≈ 80/min
(Mittel der Wiederbeschaffung: Fischer 120, Schäferei 144, Weberei-Mehrwert 216, Brennerei 336, Glas je Platz 150;
Hälfte davon) → −480/min. **Aufstieg bleibt knapp vorn: +180/min** (mit Edikt H2 +276). Ohne Zukauf kippt der Mangel
die Häuser auf halbe Steuer (K-Haus −1320/min): dann verliert der Aufstieg. Echte Konkurrenz: ja, aber nur bis der
Spieler 2 Siedlerhäuser (2 × 3,2 ≥ 6) baut: je 50 Haus + 1,6 × 100 Fischer + 0,8 × 350 Stoffpaar = 490, zusammen ≈ 980 Geld.

**Zweiter Pfad Ausbaustufen** (`levels.ts`, Stufe 3 = Zyklus × 0,4): (c) mit allen Ketten auf Stufe 3: 2 + 7 Fischer
(16 ÷ 2,5) + 4 × 4 Paare + 2 Glas × 2 = 29 Plätze ≤ 32 → 100 % ohne neues Haus. Unterhalt 525 statt 620 je 100 Ticks
(Fischer 7 × 9, Schaf/Rohr 4 × 17, Weberei 4 × 26, Brennerei 4 × 34, Glas 2 × 43), Einmalkosten ≈ 5400 Geld + Gebühren.

### A.3 Henne-Ei und Entartung

- **Start:** Haus startet mit 1 Pionier, voll nach 150 Ticks (3 × `GROWTH_INTERVAL`). Erster Holzfäller ohne Haus läuft
  mit Boden 50 % = 10 Holz/min; Verlust bis 4 Häuser stehen ≈ 15 s × 10/min = 2,5 Holz. Zusätzlich: **Kontor stellt
  4 Grundarbeiter** (deckt 2 Holzfäller + 2 Fischer). Henne-Ei gelöst, 5000 Geld unberührt.
- **Reines Pionierviertel:** +3,2 Arbeiter und +24/min je Haus; ein Siedlerhaus liefert dieselben +3,2 und **7× das
  Geld** (+168/min). Pioniere dominieren nicht. Das Muster ist «2 Siedlerhäuser je Kaufmannshaus» (Bedarf (c): −24 ÷
  3,2 = 8 Siedlerhäuser) gegen «Ausbaustufen». Beide tragen; Stufen sind je Ausstoss schon heute billiger (−15 %
  Unterhalt), mit W werden sie Standard im Spätspiel, Siedlerviertel im Mittelspiel.
- **Gefahr Pflichtbau:** Geld ist kein Engpass (8 Siedlerhäuser mit Ketten 8 × 490 ≈ 3900 Geld = 46 s Einkommen (c)). Spürbar wird W
  nur über **Platz**: Arbeiter-Reichweite (Vorschlag 10 Kacheln Haus → Betrieb, wie `serviceRadius`) macht Wohn- und
  Gewerbeviertel zur Lagefrage. Ohne Reichweite ist W Mehrarbeit.
- **Fremdinsel:** 4 Plantagen ohne Häuser → Kontor II stellt ebenfalls 4 Grundarbeiter, sonst Henne-Ei je Insel.

### A.4 Def-Aufwand und Ziele

- Bestehende Werte zwingend geändert: **0**. Neue Werte ≈ 23: `workers` je Produktionsbetrieb (16), Quote je Stufe
  (4), Boden, Reichweite, Grundarbeiter.
- Ziel 1: Delle beim Aufstieg S → B (4 × 8 × 0,6 = 19 Arbeiter gegen 28 Plätze = 69 % bis zu 350 Ticks Füllzeit) →
  geschätzt **6750 → 6900–7100** (Grenze 7500 hält). Ziel 2: Controller braucht +8 Siedlerhäuser und neues Layout;
  11 500 ± 5 % erreichbar (Kosten ≈ 3900, Schätzung). **Baseline nicht bitgleich**: alle Pins und Fingerprints
  neu (`balance`, `-merchants`, `-crises` `OFF_REFERENCE`, `-upgrade`).

## B Archipel (I-055, I-038, I-014)

### B.1 Fischreiche Insel

- Seeweg (`sea.ts`, 10 Ticks je Kachel = 1 s): A 25–30 → Rundreise 50–60 s → **50–60 Stück/min** je Schiff (50 ÷ Fahrt);
  B 35–40 → 70–80 s → **37,5–43/min**.
- Transport je Stück: 90/min Schiff ÷ Durchsatz = **A 1,5–1,8; B 2,1–2,4 Geld**, dazu Kontor II 60/min.
- Heimat: Fischer 30/min ÷ 15 = **2,0 Geld/Nahrung**; Rinderfarm 60 ÷ 30 = 2,0; Jäger 30 ÷ 12 = 2,5.
- Fischinsel ×2: 1,0 + 1,65 (A) = **2,65 > 2,0**. Je Schiff A 55 × (−0,65) = −36/min, plus Kontor −60. Auch ×∞:
  (2,0 − 1,65) × 55 = +19/min je Schiff, Kontor erst ab 3 Schiffen gedeckt. Mit Sparen (Schiff 72/min): 1,0 + 1,3 = 2,3,
  kippt nicht. **In Geld bei keiner Einwohnerzahl lohnend.**
- Reichweite: 1 Schiff = 55 ÷ 3 (Nahrung je Einwohner/min) = 18 Einwohner; 2 freie Schiffe (`SHIP_MAX` 4, 2 für Gewürz)
  = 36 Einwohner, kostet 2 × 90 + 60 + 3,6 × 30 = 348/min statt 7,2 × 30 = 216 → **Mehrkosten 132/min** für 7 freie Küstenkacheln.
- Frei wird nur Küste; Küste nutzen nur Fischer und Kontor (`site: coast`). **Freier Heimatplatz ohne Gegenwert.**
  Trägt erst als Nahrungsbasis einer Siedlung **auf** der Fischinsel (Steuer dort, kein Transport) oder mit A (W)
  bei Arbeitermangel.

### B.2 Zweite Insel-Eigenschaft

- **Gebirge+ (Steinbruch ×2, 3 Plätze statt 1 auf der Felsbucht):** Steinbedarf (c) 48/min, heute gekauft 48 × 15 =
  720/min (Sp-A.1). Fremd: 3 Steinbrüche × 20/min = 60 ≥ 48, Unterhalt 3 × 60 = 180; Transport auf B 48 ÷ 40 = 1,2
  Schiffe → mit Gewürz-Schiffen geteilt +1 Schiff = 90. **Netto +450/min** (9 % von (c)); mit H2 (Stein 12) +306; ohne
  ×2 (5 Brüche, 300) +330. Kein Pflichtbau: Stein bleibt am Kontor kaufbar. Hat die Heimat Gebirge (Steinbruch 6
  Geld/Stück → 288/min), fällt der Gewinn auf ≈ 0: Wert hängt an der Heimatkarte.
- **Fruchtbar (Zuckerrohr und Schafe ×2):** Rohstoff daheim 60 ÷ 12 = 5 Geld/Stück, fremd 2,5. Eigene Route (Rum 96/min
  = 1,75 Schiffe A): 4 Plantagen gespart 240/min gegen 2 × 90 + 60 = 240 → **±0**, belegt 2 von 4 Schiffen. Geteilt mit
  Gewürz (gleiche Insel, 2 Güter je Richtung): Restladung 2 × 55 − 48 = 62 Rum/min = 5,2 Rohrfarmen → **+156/min** ohne
  Zusatzschiff, 5 Farmen (≥ 20 Kacheln) frei. Entlastet, keine Pflicht.
- Verworfen: Erz → Werkzeug (kein Dauerverbrauch, Route stünde leer).
- Lehrsatz: Transport 1,5–2,4 Geld/Stück trägt nur Güter ab ≈ 5 Geld Erzeugung/Stück; Nahrung (2,0) nicht.

### B.3 Routenverlust (Sturm/Piraten als Daueranweisung)

- Weiterfahren: −0,2 L je Sturm. Anlegen: 30 s (= `STORM_DURATION` 300) Pause; verliert Ware nur, wenn die Route
  ausgelastet ist: dann 30 s × L ÷ T = **0,55 L** (A, T = 55 s) bzw. 0,4 L (B).
- Beide ∝ L: **die Ladungsgrösse entscheidet nichts**, nur die Höhe (Gewürz voll: 10 × 40 = 400 Geld je Sturm ≈
  100/min bei 1 Sturm je 4 min, 2 % von (c)).
- Entscheidend ist Auslastung u: 30 s Pause je ≥ 240 s kostet 12,5 % Kapazität; **u ≤ 87,5 % → Anlegen kostenlos**,
  u → 100 % → Weiterfahren besser (0,2 L < 0,4–0,55 L).
- (c): 2 Gewürzschiffe, 48 ÷ (2 × 40…55) = **u 44–60 %** → Anlegen immer besser. Echte Wahl erst, wenn `SHIP_MAX` bindet
  (≥ 3 Routen, alle 4 Schiffe, z. B. Gewürz + Stein + Rum aus B.2). Allein: tote Option.

## C Handel (I-047; I-029/I-006 nur über dieselbe Stelle)

### C.1 Stammkunde gegen freien Verkauf

- Vertrag: 12 Rum je 3 min zu 18 × 1,3 = 23,4 → 4 Rum/min, **93,6/min**.
- Frei (Sp-B.2, `SELL_FLOOR` 30, `SELL_DROP` 1, Erholung 6 Punkte/min): r ≤ 6: 18 r; r > 6 dauerhaft am Boden:
  0,18 × (30 r + 18).
- Auftrag: `floor(40 × 0,75)` = 30 je Rum, Menge 6–12 je 900 Ticks; Rum bei Gleichverteilung über 8 Auftragsgüter
  (Annahme) ≈ 9 × 30 ÷ 8 ÷ 1,5 = **22/min** Erwartung, zufällig.

| Überschuss r/min | frei  | Vertrag + Rest frei | Vorteil Vertrag |
| ---------------- | ----- | ------------------- | --------------- |
| < 4              | 18 r  | nicht erfüllbar     | – (100 Strafe)  |
| 4                | 72    | 93,6                | +21,6           |
| 6                | 108   | 93,6 + 36 = 129,6   | +21,6           |
| 10               | 57,2  | 93,6 + 108 = 201,6  | +144            |
| 12               | 68,0  | 93,6 + 46,4 = 140,0 | +72             |
| 20               | 111,2 | 93,6 + 89,6 = 183,2 | +72             |

- **Dominanz ab r ≥ 4:** 4 Stück zu 23,4 schlagen jede freie Einheit (≤ 18). Der Vertrag verschiebt nur die Sättigung
  von 6 auf 10 Stück/min.
- Gewicht: Rum kostet 180/min ÷ 12 = 15 Geld/Stück (Brennerei + Rohr). Gewinn durch Vertrag (23,4 − 15) × 4 = **+34/min**
  = 0,7 % von (c), 1,5 % von (a). Echte Wahl entsteht nur gegen Feste (`FEAST_RUM` 10) bei knappem Rum.
- Variante mit Gewicht: Menge ≈ 25 % der Erzeugung (c: 24/min) zu 120 % = 21,6 → (21,6 − 15) × 24 = +158/min, verlangt
  2 Zusatzbrennereien: Bauanreiz statt Klick. Pflichtbau-Grenze 40 % (I-047) hält.

### C.2 Kein Kauf-und-Liefern-Gewinn

- Höchster Verkaufsanteil sell ÷ buy = 0,45 (Rum 18/40) → Vertrag 130 % = 0,585 × buy < buy für alle Güter.
- Gegen H2 (`ceil(0,8 · buy)`): Grenze Vertragsfaktor = min(H2 ÷ sell) = Rum 32 ÷ 18 = **1,77**. 130 % sicher; Boom
  150 % auf Vertrag nicht stapeln (1,3 × 1,5 = 1,95 > 1,77).
- Auftragsprämie 0,75 × buy < H2 (Marge ≥ 1, Sp-B.5). Alle Preise bleiben unter `buy`.

## Schluss

| Ansatz          | echte Wahl                | Gefahr                   | Def-Änderung | bitgleich        |
| --------------- | ------------------------- | ------------------------ | ------------ | ---------------- |
| A Arbeiter (W)  | bedingt (nur mit Radius)  | Pflichtbau, Ziel-1-Delle | 0 (≈ 23 neu) | nein             |
| B.1 Fischinsel  | nein (2,65 > 2,0/Nahrung) | tote Option              | 0 (+ Trait)  | ja¹              |
| B.2 Stein/Rohr  | ja (+450 / +156/min)      | hängt an Heimatkarte     | quarries 1→3 | ja¹              |
| B.3 Routenverl. | nein bis u 87,5 %         | Anlegen dominant         | 0            | ja (ohne Schiff) |
| C Stammkunde    | nein ab r ≥ 4 (+34/min)   | Klick ohne Gewicht       | 0            | ja               |

¹ Wenn Trait und Inselform keine neuen Zufallszüge brauchen.

Kopplung: B.3 wird erst durch B.2 (volle Schiffe) zur Wahl; A gibt Ausbaustufen und Fremdsiedlungen einen Zweck.
