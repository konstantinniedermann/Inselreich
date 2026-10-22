# Anhang 01 · Werte und Dominanzrechnung I-112 «Ratsbeschluss je Stufe»

Stand 2026-10-16 · Paket `design-I-112` · Rolle Wirtschaftsdesign · Kurzdesign:
[../2026-10-16-i112-ratsbeschluss.md](../2026-10-16-i112-ratsbeschluss.md). Alle Werte sind Vorschläge; nichts davon ist
gemessen (kein Controller-Lauf gemacht), Schätzungen sind mit **(Schätzung)** gekennzeichnet.

## 1 Befund zum Entwurf und Ersatz

Der Entwurf des Design-Leads wird teils verworfen:

- Stufe 2 A «Zunftrecht» −2 Stein: **verworfen**. 2 Stein × 15 = 30 Geld je Aufstieg (4 % von 675): faktisch Geld (Falle I-011).
- Stufe 2 B Marktplatz-Radius 8→10: **verworfen**. Markt (420 Geld, Unterhalt 10) ist zu billig; im Referenzlauf deckt
  Kontor + 1 Markt 32 Häuser, Ersparnis 0 (Vorgabe e).
- Bedarf −25 %: **ersetzt**. Bedarf steht in 3 `TIERS`-Feldern je Gut (Vorgabe d); gleiche Wirkung über den Takt (`cycle`)
  eines Betriebs.
- Dienst-Reichweite +2: **übernommen**, je Stufe ein teureres Gebäude (Kapelle 850, Schule 1195, Bad 1500 Geld).

Leitprinzip: **Jedes Paar tauscht «Kette» gegen «Dienstnetz».** A spart Kettengebäude und skaliert mit der Einwohnerzahl;
B spart Dienstgebäude und skaliert mit der Ausdehnung der Stadt. Ersparnis wird in Gebäuden gezählt, nicht in Geld
(ab Minute 14 ist Geld Überschuss, A1: «nichts mehr zu kaufen»).

## 2 Wertetabelle (6 Beschlüsse)

| Stufe | Beschluss        | Hebel               | Def-Feld (Datei)                              | alt → neu | Wirkung                             |
| ----- | ---------------- | ------------------- | --------------------------------------------- | --------- | ----------------------------------- |
| 2     | A «Webordnung»   | Weberei-Takt        | `BUILDING_DEFS.weaver.cycle` (`buildings.ts`) | 50 → 40   | Rate 2,0 → 2,5 je 100 Ticks (+25 %) |
| 2     | B «Glockenrecht» | Kapellen-Reichweite | `BUILDING_DEFS.chapel.serviceRadius`          | 10 → 12   | Fläche ×1,44                        |
| 3     | A «Brennrecht»   | Brennerei-Takt      | `BUILDING_DEFS.distillery.cycle`              | 50 → 40   | Rate 2,0 → 2,5 (+25 %)              |
| 3     | B «Lehrrecht»    | Schul-Reichweite    | `BUILDING_DEFS.school.serviceRadius`          | 10 → 12   | Fläche ×1,44                        |
| 4     | A «Glasrecht»    | Glashütten-Takt     | `BUILDING_DEFS.glassworks.cycle`              | 50 → 30   | Rate 2,0 → 3,33 (+67 %)             |
| 4     | B «Badrecht»     | Bad-Reichweite      | `BUILDING_DEFS.bathhouse.serviceRadius`       | 10 → 12   | Fläche ×1,44                        |

Wirkung gilt reichsweit auf alle Gebäude dieses Typs auf allen Inseln und für später gebaute. Umsetzung als Weltflag, der
`cycleOf` (`src/sim/flow.ts`) bzw. die `serviceRadius`-Leser (`population.ts:68`, `feast.ts:87`, `queries.ts:157`) ersetzt;
die Defs selbst bleiben unverändert. Takt-Hebel ändern nur den Verbrauch der Eingangsware **je Betrieb**, nicht je Ware:
Weberei braucht Wolle 1:1 wie bisher (Schäfereien bleiben), nur die Zahl der Webereien sinkt.

Takt Stufe 4 = 30, sonst 40: Gebäudezahl ist ganzzahlig; bei 60 Kaufleuten sind es 3 Glashütten, bei Takt 40 weiter `ceil(2,4) = 3`, bei Takt 30 `ceil(1,8) = 2`. **A spart im Referenz-Endzustand genau ein Gebäude.**

## 3 Rechenweg

Einheit: je 100 Ticks. Preise zum Kaufpreis (Holz 10, Werkzeug 40, Stein 15, `goods.ts`). Steuer Siedler 7, Bürger 14
(`tiers.ts`). Gebäudezahl Kette: `n = ceil(Einwohner × Bedarf ÷ Rate)`.

| Gebäude   | Bau Geld-Äquivalent          | Unterhalt | Rate/100 Ticks | Versorgt (Einw.) |
| --------- | ---------------------------- | --------- | -------------- | ---------------- |
| Weberei   | 200 + 150 + 120 = 470        | 15        | 2,0            | 10 (Bedarf 0,2)  |
| Brennerei | 250 + 150 + 160 + 75 = 635   | 20        | 2,0            | 10 (Bedarf 0,2)  |
| Glashütte | 300 + 200 + 240 + 150 = 890  | 25        | 2,0            | 20 (Bedarf 0,1)  |
| Kapelle   | 300 + 200 + 200 + 150 = 850  | 15        | –              | Radius 10        |
| Schule    | 400 + 250 + 320 + 225 = 1195 | 25        | –              | Radius 10        |
| Badehaus  | 500 + 300 + 400 + 300 = 1500 | 30        | –              | Radius 10        |

### 3.1 Stufe 2: Webordnung (A) gegen Glockenrecht (B)

**A, Kettengebäude.** Webereien `W = ceil(N × 0,2 ÷ 2,0) = ceil(N/10)`, mit A `ceil(N × 0,2 ÷ 2,5) = ceil(N/12,5)`.
N zählt alle Einwohner, die Stoff brauchen (Stufe 2 bis 4, Bedarf 0,2 überall).

Webereien ohne/mit A: N 20: 2/2, 40: 4/4, 50: 5/4, 60: 6/5, 80: 8/7, 100: 10/8, 150: 15/12 (N 30 bis 40: 0 gespart).

Wert je gespartes Gebäude: 470 Bau + 15 Unterhalt. Bilanz je Einwohner (Kette Stoff = `0,2 × (Schäferei 10 ÷ 2 +
Weberei 15 ÷ Rate)`): ohne 0,2 × (5 + 7,5) = 2,5; mit A 0,2 × (5 + 6) = **2,2**, also **+0,3 je Einwohner**. Siedler
netto (Steuer 7 − Nahrung 1,0 − Stoff 2,5 − Dienst) steigt um 0,3, bei N = 40 und Dienst Kapelle + Markt 25 ÷ 40 = 0,63 von
2,87 auf 3,17 (+10 %). Bürger (Spec Balancing, Endzustand 60 Einwohner, 6,83): 7,13.

**B, Kapellen.** Kapellen `K ≈ ceil(Fläche der Stadt ÷ (π r² · 0,6))`, Fläche der Siedlung in Kacheln. Radius 12 statt 10
spart 30 % der Kapellen. Im Referenzlauf (32 Häuser, ein Kern) genügt eine Kapelle: **Ersparnis 0**. Bei gestreckter
Stadt (Küstenstreifen, Durchmesser des Hausbands 20 bis 24 Kacheln) fällt K von 2 auf 1: 850 Bau + 15 Unterhalt, das sind
+0,15 je Einwohner bei N = 100 (15 ÷ 100). Die Kapelle zählt für alle Stufen (alle Häuser ab Stufe 2 brauchen `faith`).
Nebenwirkung: `feast.ts:87` liest `serviceRadius` der Kapelle, das Fest reicht ebenfalls 2 weiter (wünschenswert).

**Wann gewinnt wer.** A bei kompakter Stadt oder N ≥ 50 mit guter Ganzzahl (N = 50, 60, 80), sicher. B bei gestreckter
Stadt mit mindestens zwei Kapellen-Kernen (N = 30 bis 40: A spart 0, B spart 1 Kapelle). Erwartungswert (Trefferchance
von B etwa 0,5, Schätzung): A bei N = 100 ≈ 2 × 470 + 30 Unterhalt gegen B ≈ 0,5 × 850 + 15. A liegt bis etwa Faktor 2 vorn
bei grossem N. **Gegenmassnahme, falls im Spiel A zu oft gewählt wird:** B auf +3 (Fläche ×1,69); das ist ein
Ein-Zahl-Eingriff.

### 3.2 Stufe 3: Brennrecht (A) gegen Lehrrecht (B)

**A.** Brennereien `ceil(N × 0,2 ÷ 2,0)` gegen `ceil(N × 0,2 ÷ 2,5)`, N = Einwohner der Stufen 3 und 4.

Gespart: N 50: 1, 60: 1, 80: 1, 100: 2, 150: 3 (N 30 und 40: 0).

Kette Rum je Einwohner: ohne 0,2 × (10 ÷ 2 + 20 ÷ 2) = 3,0; mit A 0,2 × (5 + 8) = **2,6** (+0,4 je Einwohner). Bürger netto
im Spec-Endzustand (60 Einwohner, 6,83): mit A allein 7,23, mit Webordnung zusätzlich 7,53 (+10 %). Wert 635 Bau + 20
Unterhalt je Brennerei; bei N = 60 genau eine.

**B.** Schulen: Bürger und Kaufleute brauchen `school`; Schule 1195 Bau + 25 Unterhalt, Radius 12 spart wie bei der Kapelle
0 (kompakt) bis 1 Schule (gestreckt): +0,17 je Einwohner bei N = 150 (25 ÷ 150), +0,42 bei N = 60. Bürger-Ziel: 50 Bürger
= 4 Häuser, ein Kern, die Schule deckt alle: **Ersparnis 0 bis zum Bürger-Ziel** bei kompaktem Bau.

**Wann gewinnt wer.** A: Bürger-Aufbau, Rum-Kette als Engpass (A1: Rum-Ketten wachsen in Minute 8 bis 14, Geld bindet).
B: grosse Insel mit weitem Bürgerviertel oder zweite Schule früh nötig. Erwartungswert N = 100: A 2 × 635 + 40 Unterhalt;
B 0,5 × 1195 + 12. A liegt wieder etwa 2× vorn, B teurer je Treffer (1195 gegen 635) und wird für weite Pläne interessanter.

### 3.3 Stufe 4: Glasrecht (A) gegen Badrecht (B)

**A.** Glashütten `ceil(N × 0,1 ÷ 2,0)` gegen `ceil(N × 0,1 ÷ 3,33)`:

Gespart: N 40: 0, 60: 1, 80: 1, 100: 2, 120: 2.

Wert 890 Bau + 25 Unterhalt je Hütte. Glas ist für Kaufleute Pflicht (`needs.glass`), das Wirkungsfeld besteht immer, wenn
Glas selbst hergestellt wird. Stein und Holz der Hütte laufen je Glas wie vorher (kein Einspareffekt dort). Bilanz je
Einwohner `0,1 × (25 ÷ 2) = 1,25` gegen `0,1 × (25 ÷ 3,33) = 0,75`: **+0,5 je Einwohner** (Kaufleute Steuer 22).

**B.** Bad: 1500 Bau + 30 Unterhalt. Ein Kaufleute-Haus hat 20 Einwohner; die Ziele 60 und 80 sind 3 bis 4 Häuser, ein
Bad deckt alle: **Ersparnis 0 bis zum Handelsstadt- und Gewürzstadt-Ziel**. Gewinn erst bei mehr als etwa 6 Kaufleute-Häusern
über weite Fläche: ein Bad weniger = +1500 Bau, +0,15 je Einwohner bei N = 200 (30 ÷ 200).

**Wann gewinnt wer.** A ist hier zuverlässig stärker (Ziele 60 und 80 treffen die Ganzzahl). B hat in der Zielphase kein
Wirkungsfeld. **Das Paar ist das schwächste:** Stufe 4 liegt hinter dem Bürger-Ziel, Geld ist Überschuss (Kasse +2538/min,
A1), der Gewinn zählt in Gebäuden und Fläche. Empfehlung: B auf +4 (Fläche ×1,96, 10 → 14) heben **oder** akzeptieren,
dass B ein «Fernplaner-Beschluss» für Karten mit Kaufleuten über mehrere Inseln und lange Küsten ist. Offene Frage an L0
(Abschnitt 6).

## 4 Dominanz-Urteil

- **Kleine Insel:** A (trifft ab N ≥ 50), B hat nichts zu sparen. Alle drei Stufen.
- **Grosse Insel, weit:** B in Stufe 2 und 3 (zweiter Kern gespart), in Stufe 4 nur bei > 6 Häusern weit verstreut.
- **Mehrere Inseln:** A (Webereien, Brennereien, Hütten zählen global, Ware reist per Kontor); B wirkt je Insel nur
  an Rändern.

Urteil: **keine strikte Dominanz** in Stufe 2 und 3. Jede Seite hat eine Lage, in der die andere 0 spart (A kann bei
N < 50 oder ungünstiger Ganzzahl 0 sparen, B bei kompakter Stadt 0), und die Wirkungsfelder schliessen sich aus (Kette
gegen Dienstnetz, kein gemeinsames Feld). **Risiko in Stufe 3 und besonders 4: A ist im Mittel stärker** (skaliert mit N,
B ist durch 1 bis 2 Gebäude gedeckelt). Das Dreier-Lagen-Kriterium (c) ist in Stufe 2 und 3 erfüllt, in Stufe 4 nur mit der
Anhebung von B (+4) bzw. mit der Annahme, dass Karten mit weit verstreuten Kaufleuten spielbar sind. Eine zweite
sinnvolle Strategie bleibt: Wahl der Stufe 2 und 3 kombiniert (A+A: «Fabrikstadt», B+B: «Landstadt», gemischt).

## 5 Wechselwirkung mit Edikten und Steuerstufe

Sparen: Unterhaltsanteil −20 % (A Stufe 2: +0,24 statt +0,30), Bau unberührt. Handel: Bau 470 → 416, klein. Wohlfahrt
und Steuer niedrig: N wächst schneller, A greift früher. Steuer hoch (Belegung 75 %): N × 0,75, A später und schwächer,
B unberührt. Keine Stapelregel: Edikt-Hebel und Beschluss-Hebel liegen auf verschiedenen Feldern.

## 6 Randfälle

1. **Zeitpunkt.** Stufe 2: Tick etwa 300 bis 600 (Schätzung; Pionier-Haus plus `UPGRADE_WAIT` 300 und Bedürfniserfüllung,
   A1 Minute 1: schon 12 Siedlerhäuser). Stufe 3: erste Bürger **Tick 4150** (A1, Minute 6,9). Stufe 4: erst nach dem
   Bürger-Ziel (**Tick 6750**, A1, Minute 11:15); erstes Kaufleute-Haus frühestens kurz danach, mit Kaufleute-Paket
   (≥ 6150, A1) etwa Minute 15 bis 17, Tick 9000 bis 10 200 (Schätzung). Stufe 4 liegt hinter «Geld bindet nicht mehr».
2. **Stufe 2 fällt in die erste Minute:** der Spieler kennt die Karte noch nicht. Die Karte muss die Zahl zeigen
   («Weberei +25 %, spart bei 60 Einwohnern 1 Weberei»); sonst ist die Wahl blind.
3. **Beschluss ohne Wirkungsfeld:** B ohne zweiten Kern 0; A bei gekaufter statt selbst gebauter Ware 0 (Stoff/Rum/Glas
   per Kontor zugekauft). Bewusst, kein Rückgängig.
4. **Abstieg der Stufe:** Der Beschluss hängt am Weltflag, nicht am Haus; fällt das letzte Haus der Stufe zurück,
   bleibt er. Er entsteht beim **ersten** Haus der Stufe in dieser Partie (höchste je erreichte Stufe, kein erneutes
   Auslösen, auch nicht auf Inseln mit eigener Besiedlung).
5. **Save:** neues Weltfeld, Version erhöhen; ältere Stände gelten als inkompatibel (Abweisung mit Hinweis, Test).
6. **Balancing-Test.** Wählt der Controller nie, bleibt er grün; A,A,A spart ≈ 1100 Geld, Sieg-Tick etwa −300 bis −420 (Schätzung).

## 7 Entwurf Ruling für L0 (nicht in `rulings.md` geschrieben)

`Balancing-Controller wählt keinen Ratsbeschluss (Baseline unverändert); je Beschluss ein eigener Szenariotest mit
Erwartung «A spart N Gebäude / B spart 0 im Referenzlauf» — Regressionsschutz bleibt ohne Verschiebung der Baseline, die
Beschlüsse sind getrennt abgesichert — Kosten bei Irrtum: ein später Wechsel der Controller-Wahl verschiebt den Sieg-Tick
um etwa 300 bis 400 Ticks und braucht ein neues Baseline-Ruling.`

Offene Entscheidung für L0: Stufe 4 B (Bad +2) ist in der Zielphase wirkungslos; Abschnitt 9 ersetzt es durch B′.

## 8 Offene Annahmen

Trefferchance von B (0,5) und Packungsdichte (0,6; Hausanteil 0,35) geschätzt; Einwohnerzahl im Referenzlauf (≈ 25 bis 40)
rückgerechnet; Bau zum Kaufpreis; kein Controller-Lauf, Sieg-Tick-Wirkung ist Rechnung.

## 9 Nachrechnung B′ «Wohnordnung» (`TIERS[n].maxInhabitants` +k)

Netto je Einwohner vor Dienst (Abschnitt 3): Siedler 3,5, Bürger 7,5, Kaufleute 13,5 (22 − Nahrung 1,0 − Stoff 2,5 − Rum
3,0 − Glas 1,25 − Gewürz 0,75). Netto je Haus = Max × Netto. Fülltakt 50 Ticks je Einwohner (`GROWTH_INTERVAL`); ich
nehme an, dass Fülldauer und `UPGRADE_WAIT` 300 parallel laufen (nicht geprüft).

| Stufe | k            | Netto je Haus (alt → neu)       | Bremse (Ticks)                               | Hauszahl bis Ziel                  |
| ----- | ------------ | ------------------------------- | -------------------------------------------- | ---------------------------------- |
| 2     | 8 → 9 / 10   | 28 → 31,5 / 35 (+12 / 25 %)     | 0 (Füllen 250 / 300 ≤ Wartezeit 300)         | kein Ziel                          |
| 3     | 15 → 16 / 17 | 112,5 → 120 / 127,5 (+7 / 13 %) | +50 / +100 bis zum Aufstieg (Füllen 8 → Max) | 50 Bürger: 4 / **3 bei 17**        |
| 4     | 20 → 22 / 24 | 270 → 297 / 324 (+10 / 20 %)    | keine (oberste Stufe)                        | 60: 3 / 3; 80: 4 / 4 (kein Sprung) |

Stufe 2 mit 10 füllt die Siedler auf 10 und verkürzt dadurch das Füllen der Bürger (5 statt 7 Plätze). Stufe 3 mit 17 ist
eine Abkürzung (3 statt 4 Häuser zum Bürger-Ziel): ausgeschlossen, nur k = 1.

**Wann gewinnt wer.** B′ gewinnt bei knappem Platz oder bei Zukauf der Kettenware (mehr Einwohner je Kachel, Kette
nicht der Engpass). A gewinnt, wenn die Kette der Engpass ist (die Zusatzeinwohner bekommen keine Ware, wachsen nicht
oder zahlen halbe Steuer) und bei billigem Platz. Die Bremse ist klein; Stufe 3 trägt +50 Ticks je Haus nur auf dem Weg
zu den Kaufleuten, nach dem Ziel.

**Geld (Falle I-011).** B′ ist keine reine Geldprämie, weil jeder Zusatzeinwohner Ware braucht (Netto ist nach Kette
gerechnet), wirkt aber wie eine Steuererhöhung je Haus. Stufe 2: k = 1 (+3,5 je Haus) schlägt A (0,3 × 8 = 2,4 je Haus) in
der Phase, in der Geld bindet; **dominiert**. Stufe 3: k = 1 (+7,5) gegen A (0,4 × 15 = 6 je Haus, dazu 635 einmalig):
gleichauf. Stufe 4: +27 bis 54 je Haus, bei Kasse +2538/min Kleingeld, wirkt als Platz und Warenbedarf (+10 % Glas).

**Empfehlung.** Stufe 2: **B bleibt** (Reichweite, +3), weil B′ dort als Geldhebel A schlägt. Stufe 3: **B′ mit k = 1**
(16): gleichauf mit A, kein Zielsprung, +50 Ticks Bremse, echte Alternative zur Kette. Stufe 4: **B′ mit k = 2** (22):
Hauszahl zu den Zielen unverändert (3 und 4), Bad-Reichweite wäre dort wirkungslos; nur Kleingeld, daher als Platz-Wahl
vertretbar. Tragen tut B′ damit in zwei von drei Stufen; offen bleibt, ob Zusatzeinwohner ohne Ware wachsen (Annahme).
