# I-210 Bittschrift — Dominanz-Rechnung

## Ergebnis

**In der Ideenform gibt es keine echte Wahl.** Allerdings gewinnt nicht «Ja», sondern meist «Nein», und im
Spätspiel wird die Karte zum Ritual:

- «Zuzug +15 Bürger» in freie Plätze bringt in **jeder** Phase ≈ 0. Ein Haus wächst um 1 Einwohner je 50
  Ticks, jede Lücke ist also nach ≤ 350 Ticks geschlossen. Das Nachspiel kommt erst nach 4800 Ticks.
- «Nein: Kapellen-Fest −1» kostet nur, solange Häuser aufsteigen (bis 690 Geld). Auf dem Plateau kostet es 0.
  Wo es kostet, wird «Ja» zum Lösegeld, und das passt nicht zum Ton.
- Im Spätspiel ist «Ja» billig: 1,3 % der 10-min-Produktion. Ohne Wirkung ist «Nein» aber genauso billig.

**Mit Gegenzug wird die Wahl echt.** Ich empfehle die Kombination **H3 + H4**, ergänzt um H1 für den Lohn
und H2 für die Kosten:

- Der Zuzug wird zur **befristeten Überbelegung**: +15 % Einwohner für 6000 Ticks, mit vollem Verbrauch.
  «Ja» lohnt dann nur mit ≥ 15 % Überkapazität in den Bedarfsketten, sonst droht Mangel oder ein
  Zukauf mit Verlust.
- «Nein» bringt einen eigenen Lohn, **Genügsamkeit**: −10 % Bedarf der erbetenen Ware für 1800 Ticks. Er
  lohnt genau dann, wenn die Kette knapp ist, also gegenläufig zu «Ja».

Von den 10 Bitten des Vorschlags (§6) hat jede eine realistische Lage für «Ja» und eine für «Nein».

## 1 Ist-Werte

| Wert                                | Ist                                                       | Fundstelle                                                     |
| ----------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| Tick bei 1×                         | 100 ms → 10 min = 6000 T, 8 min = 4800 T, 2 min = 1200 T  | `defs/timing.ts:2`                                             |
| Wachstum je Haus                    | ±1 Einw. je 50 T; über Kapazität −1 je 50 T               | `timing.ts:6`; `population.ts:230-234`                         |
| Kapazität je Haus St. 1–4           | 4 / 8 / 15 / 20                                           | `defs/tiers.ts:15,24,33,42`                                    |
| Bedarf je Einw. und 100 T           | Nahrung 0,5 · Stoff 0,2 · Rum 0,2 · Glas 0,1 · Gewürz 0,1 | `tiers.ts:16,25,34,43`; `population.ts:81-110`                 |
| Steuer je Einw. und 100 T (erfüllt) | 2 / 7 / 14 / 22; unerfüllt die Hälfte                     | `tiers.ts:5,7,18,27,36,45`                                     |
| Lagergrenze je Ware                 | 100; ein Überschuss verfällt                              | `defs/goods.ts:84`; `production.ts:67-69`                      |
| Kaufpreis (fest, kein Anstieg)      | Nahrung 8 · Stoff 30 · Rum 40 · Glas 50 · Gewürz 40       | `goods.ts:19-61`; `BUY_RISE = 0` `goods.ts:69`                 |
| Takt St. 1 (Einheiten je 100 T)     | Fischer 40 (2,5) · Weberei, Brennerei, Glashütte 50 (2)   | `defs/buildings.ts:54,136,164,244`                             |
| Unterhalt je Kette St. 1 / 100 T    | Stoff 15+10 · Rum 20+10 · Fischer 5                       | `buildings.ts:48,118,129,145,159`                              |
| Fest                                | 10 Rum; Wirkung 600 T, Abklingzeit 1800 T                 | `timing.ts:60,62,64`                                           |
| Fest-Wert G_A (I-201)               | 72 bis 1150 im Aufstieg, 0 auf dem Plateau                | `2026-10-25-i201-festanlass-rechnung.md:40-45`                 |
| Sturm                               | 300 T halber Takt, 6 Betriebsarten betroffen              | `timing.ts:48`; `crises.ts:20`; `buildings.ts` `stormAffected` |
| Krisen, Welt-Standard               | `off`, eigener Salt                                       | `defs/crises.ts:10,22`                                         |
| Ziele                               | 50 Bürger · 60 Kaufleute · 80 Kaufleute 600 T gehalten    | `tiers.ts:53-58`                                               |
| Save-Version                        | 18                                                        | `save.ts:55`                                                   |

**Abgeleitete Kennzahl: Versorgung je Einwohner und 100 T** (Bedarf × Preis):

| Stufe | Steuer | Zukauf zum Kaufpreis | Eigene Kette (Unterhalt ÷ Ausstoss) | Netto bei Zukauf | Netto bei eigener Kette |
| ----- | ------ | -------------------- | ----------------------------------- | ---------------- | ----------------------- |
| 3     | 14     | 4 + 6 + 8 = 18       | 1 + 2,5 + 3 = 6,5                   | **−4**           | +7,5                    |
| 4     | 22     | 18 + 5 + 4 = 27      | 6,5 + 2 + 0,75 = 9,25               | **−5**           | +12,75                  |

Herleitung der eigenen Kette:

- Stoff: (15 + 10) / 2 = 12,5 je Einheit.
- Rum: (20 + 10) / 2 = 15 je Einheit.
- Nahrung: 5 / 2,5 = 2 je Einheit.
- Glas: 25 / 2 + Stein 10 / (100/60) + Holz 5 / (100/30) = 20 je Einheit.
- Gewürz: 15 / 2 = 7,5 je Einheit, ohne Schiff.

Diese Kennzahl ist der Kern von H3. **Ein zusätzlicher Einwohner rechnet sich nur, wenn eine eigene Kette ihn
versorgt.** Muss der Spieler für ihn zukaufen, verliert er 4 bis 5 Geld je 100 T.

## 2 Drei Spielphasen

**Messung:** Seed 3, Krisen aus, Referenz-Controller `tests/sim/merchantsController.ts:272`. Gemessen
wurde mit einem Stop-Callback (Lager der Heimatinsel, Häuser, `stats`), die Laufdaten mit
`VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-merchants.test.ts --silent=false`. Der Controller baut
Ketten genau auf den Bedarf aus (`tests/sim/controller.ts:167-182`), die Reserve liegt darum bei ≈ 0.

**P3b** ist hergeleitet und nicht gemessen. Der Controller endet bei Ziel 2 (`merchantsController.ts:278`).
Für P3b gilt das Spätspiel-Beispiel aus I-201 (6 Kaufmannshäuser) mit 10 % Überkapazität und vollem
Lager.

| Phase                                | Tick   | Einwohner                | Geld / netto je 100 T | Lager St · Ru · Gl · Gw · Na | Produktion − Bedarf je 100 T (St · Ru · Gl · Gw · Na)  |
| ------------------------------------ | ------ | ------------------------ | --------------------- | ---------------------------- | ------------------------------------------------------ |
| P1 Ziel 1 (frühes Mittelspiel)       | 6750   | 50 Bürger (15/15/12/8)   | 339 / +385            | 31 · 0 · – · – · 38          | 10−10 · 6−10 · – · – · 25−25                           |
| P2 Mitte (Bürger-Endzustand)         | 8200   | 60 Bürger (4 × 15)       | 1148 / +400           | 32 · 5 · – · – · 39          | ≈ 0 · ≈ 0 · – · – · ≈ 0 (Lager seit P1 konstant)       |
| P3a Ziel 2 (Spätspiel, Ziel 3 offen) | 11 500 | 60 Kaufleute + 15 Bürger | 2657 / +860           | 32 · 37 · 26 · 0 · 39        | 16−15 · 16−15 · 6−6 · 0−6 · 37,5−37,5                  |
| P3b stabile Stadt                    | –      | 120 Kaufleute (6 × 20)   | reich / ≈ +2000       | 100 · 100 · 100 · 100 · 100  | +2,4 · +2,4 · +1,2 · +1,2 · +6 (Bedarf 24/24/12/12/60) |

Herleitung je Phase:

- **P1:** Betriebe aus dem Lauf: 10 Fischer, 5 Webereien, 3 Brennereien, alle Stufe 1. Der Bedarf ist
  50 × Rate. Rum ist der Engpass, der Ausbau läuft noch (`controller.ts:331`).
- **P3a:** 15 Fischer, 8 Webereien, 8 Brennereien und 3 Glashütten. Gewürz kommt nur per Schiff oder
  Zukauf.
- **P3b:** Die Steuer beträgt 120 × 22 = 2640. Der Unterhalt ist ≈ 640, hochgerechnet aus 670 in P3a.

**Versorgungsreserve als Reichweite** (Lager ÷ Bedarf): Stoff reicht in P1 310 T, in P3a 213 T und in P3b 417 T.
Auch ein volles Lager deckt im Spätspiel also nur 42 s Stoffbedarf. **Was puffert, ist die Rate, nicht das
Lager.**

**Je 10 min** (× 60):

- Stoffbedarf: P1 600, P2 720, P3a 900, P3b 1440.
- Netto-Geld: P1 23 100, P3a 51 600.

## 3 Beispielbitte der Idee je Phase

Die Bitte: «Ja: −20 Stoff jetzt · in ≈ 8 min +15 Bürger» oder «Nein: nichts · Kapellen-Fest −1 für 10 min».
Den Zuzug rechne ich in zwei Lesarten:

- **Z-frei:** Die neuen Einwohner gehen in freie Plätze bis zur Kapazität, heutige Regel `population.ts:230-234`.
- **Z-über:** +15 Einwohner über der Kapazität, befristet auf 6000 T. Das braucht eine neue Regel, sonst
  baut die Schrumpfregel sie mit −1 je 50 T ab.

### Kosten «Ja»

| Phase | Anteil Lager  | Anteil 10-min-Produktion | Rest-Reichweite Stoff | Zukauf 600 Geld gegen Kasse |
| ----- | ------------- | ------------------------ | --------------------- | --------------------------- |
| P1    | 20/31 = 65 %  | 20/600 = 3,3 %           | 11 → 110 T            | 177 % (nicht bezahlbar)     |
| P2    | 20/32 = 63 %  | 20/720 = 2,8 %           | 12 → 100 T            | 52 %                        |
| P3a   | 20/32 = 63 %  | 20/960 = 2,1 %           | 12 → 80 T             | 23 % (70 T Nettoertrag)     |
| P3b   | 20/100 = 20 % | 20/1584 = 1,3 %          | 80 → 333 T            | 23 T Steuer                 |

### Nutzen «Ja»

**Z-frei, in allen Phasen ≈ 0.** Nach 4800 T sind die Häuser ohnehin voll. P1 erreicht den Endzustand schon bei
Tick 8200, also 1450 T nach dem Ziel.

Im besten Fall kommt der Zuzug genau nach einem Aufstieg von Stufe 3 auf 4 an. Dann sind 5 Plätze frei,
und sie wären in 250 T ohnehin gefüllt. Der Gewinn beträgt 5 × 250 / 2 = 625 Einwohner-Ticks × 22 / 100 =
**137 Geld**, also reiner Geldlohn (R722).

**Z-über:** 15 Einwohner über 6000 T. Folgelast je 100 T: Nahrung 7,5, Stoff 3, Rum 3, bei Kaufleuten
zusätzlich Glas 1,5 und Gewürz 1,5.

| Phase | Steuer +     | Reserve deckt Folgelast?              | Zukauf der Lücke                           | Netto «Ja»                                   |
| ----- | ------------ | ------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| P1/P2 | 210 → 12 600 | nein (Reserve 0)                      | 15 × 18 = 270/100 T → 16 200               | **−3 600 −20 Stoff**, oder Mangel nach 370 T |
| P3a   | 330 → 19 800 | Stoff/Rum +1, sonst nein              | 405 − 70 = 335/100 T → 20 100              | ≈ −300; Ziel 3: 75 < 80                      |
| P3b   | 330 → 19 800 | fast: Lücke Stoff 0,6 · Na 1,5 /100 T | Lager 100 fängt 36 St / 90 Na in 6000 T ab | **+19 800 Geld, ohne Risiko**                |

Die Mangel-Rechnung für P1: Nach dem «Ja» liegen 11 Stoff im Lager, die Lücke beträgt 3 je 100 T. Nach
≈ 370 T findet das erste Haus keinen Stoff mehr. Es zahlt dann die halbe Steuer (−105 je 100 T bei
15 Bürgern), schrumpft um −1 je 50 T, und seine Aufstiegsuhr springt zurück (`population.ts:228-229`).

### Kosten «Nein» (Fest −1)

Gerechnet ist ein entgangenes Aufstiegsfest:

- **P1/P2:** 0. Alle Häuser sind auf Stufe 3, der Aufstieg auf Stufe 4 wartet auf Badehaus, Glas und
  Gewürz. Das erste Kaufmannshaus kommt bei Tick 9650.
- **P3a** und der Übergang vor P3a, Tick 9650 bis 11 500: 3 Häuser × 230 ΔSteuer × Δt Ø 1,0 = **690**.
  ΔSteuer = 20 · 22 − 15 · 14, der Rechenweg folgt I-201 §2.
- **P3b:** 0, denn das Plateau ist erreicht.

### Urteil je Phase (Ideenform)

| Phase | Lesart Z-frei                            | Lesart Z-über                                                |
| ----- | ---------------------------------------- | ------------------------------------------------------------ |
| P1    | **Nein dominiert** (Ja −20 St, Nutzen 0) | **Nein dominiert** (Ja −3 600 oder Mangel)                   |
| P2    | **Nein dominiert**                       | **Nein dominiert**                                           |
| P3a   | Ja als Lösegeld (20 St gegen 690 Fest)   | Ja ≈ 0 netto; das Fest-Lösegeld entscheidet                  |
| P3b   | beides 0: **Ritual**                     | **Ja dominiert** (nur Geld, R722), Nein kostet 0: **Ritual** |

## 4 Leitfrage: Wird «Ja» im Spätspiel trivial?

**Ja.** Das liegt nicht am Lager allein, es wirken drei Dinge zusammen:

1. **Die Kosten sind billig.** 20 Stoff sind 1,3 % der 10-min-Produktion und füllen sich bei 10 %
   Überkapazität in 20 / 2,4 × 100 = 833 T wieder auf.
2. **Alle Kosten lassen sich in Geld umrechnen.** Mit `BUY_RISE = 0` (`goods.ts:69`) ist jede Ware unbegrenzt
   zum Festpreis zu haben, und Geld ist ab P3a kein Engpass. Daraus folgt eine harte Grenze: Keine
   Warenkosten bleiben im Spätspiel spürbar, solange der Zukauf nicht teurer wird. Das ist dieselbe Lage wie
   bei I-110 und I-183 (R722).
3. **Der Lohn ist wertlos.** Z-frei bringt 0, und die Steuer aus Z-über ist ab P3a Geld, also keine Wahl
   (R722).

Eine Ausnahme gibt es: **mit Krisen**. Eine Sturmperiode kommt alle 600 T mit 25 % Gewicht
(`crises.ts:7,14`), im Mittel also alle 2400 T. In P3b kostet ein Sturm

- 0,5 × 66 × 3 = **99 Nahrung**,
- ≈ 40 Wolle, also ≈ 40 Stoff,
- und ebenso ≈ 40 Rum.

Ein volles Lager mit 100 Einheiten ist also genau eine Sturmreserve. Ein «Ja», das 20 Stoff kostet und
die Folgelast obendrauf legt, frisst diese Reserve an. Der Schalter «Krisen normal» macht das Spätspiel
also schon heute weniger trivial. Mit «Krisen aus» bleibt nur die Folgelast als Gegengewicht.

### Hebel

**H1: Kosten wachsen mit Lager oder Einwohnern.** Formel: K(E) = clamp(⌈E/5⌉, 10, 40), dabei ist E die Zahl
der Einwohner ab Stufe 2.

- P1: E = 50 → K = 10, das sind 32 % des Lagers.
- P3b: E = 120 → K = 24, das sind 24 % des Lagers und 1,5 % der Produktion.

Die Lagergrenze 100 deckelt K, und der Zukauf rechnet K in ≤ 1200 Geld um, das sind 45 T Steuer in P3b.
**Allein reicht H1 nicht.** Als Formel für den **Lohn** ist H1 dagegen nützlich: Ein Zuzug von p % der
Einwohner hält die Folgelast im Verhältnis zur Stadt konstant.

**H2: Die Bitte fordert die knappste Ware.** Engpass = kleinste Reichweite Lager ÷ (Bedarf − Produktion) unter
den Waren, die die Insel selbst herstellt.

- P1: Rum mit 0 Lager. Die Bitte wäre gesperrt, also wäre «Nein» erzwungen und die Karte ein Ritual. Darum
  muss der Generator nur Bitten ziehen, deren Kosten ≤ Lager sind (§7).
- P3a: Glas, 26 auf 6 je 100 T. 10 Glas sind 38 % des Lagers, der Zukauf kostet 500.
- P3b: Stoff und Rum, je 417 T Reichweite.

Ergebnis: H2 bringt **Abwechslung und Biss in P1 bis P3a**, aber gegen Punkt 2 hilft es nicht.

**H3: Die Folgelast entscheidet.** Mit Z-über wird die Wahl eine Frage der Überkapazität ü je Kette. Bei
p = 15 % und D = 6000 T:

| Lage                                    | Lücke je 100 T (St) | Wirkung über D                                                                      | Bessere Antwort |
| --------------------------------------- | ------------------- | ----------------------------------------------------------------------------------- | --------------- |
| schlank (ü = 0, P1–P3a, Controller-Bau) | 0,15 × Bedarf       | Mangel nach Lager ÷ Lücke, oder Zukauf −4 bis −5 je Einw./100 T                     | **Nein**        |
| ü = 10 %, Lager voll (P3b)              | 0,05 × 24 = 1,2     | 72 St aus 80 → knapp; Nahrung 180 > 100 → Mangel nach 3333 T, ausser 2 Fischer mehr | Lageabhängig    |
| ü ≥ 15 % in allen 5 Ketten              | 0                   | +15 % Steuer und Einwohner, kein Risiko                                             | **Ja**          |
| ü = 10 %, Krisen normal                 | 1,2 + Sturm 40      | Sturm plus Folgelast leeren das Stofflager                                          | **Nein**        |

**Ergebnis:** Mit H3 hängt die Antwort am Versorgungspuffer, und den baut der Spieler bewusst auf oder
nicht. Das sind zwei Ausbaupfade: schlank, also billig im Unterhalt, oder mit Puffer, also teurer, dafür
nimmt der Spieler Bitten an. Keiner dominiert:

- 15 % Überkapazität in P3b kosten ≈ 0,15 × 640 ≈ 96 Unterhalt je 100 T.
- Eine angenommene Bitte bringt 330 je 100 T, aber nur während D, also in ≤ 50 % der Zeit.

**H4: «Nein» bringt einen eigenen Lohn.** Ich schlage **Genügsamkeit** vor: Der Bedarf der erbetenen Ware sinkt
für 1800 T um 10 %.

- P1: 10 × 0,1 × 18 = **18 Stoff**, gespart genau dort, wo das Lager knapp ist.
- P3b: 24 × 0,1 × 18 = 43 Stoff. Bei vollem Lager verfällt die gesparte Menge (`production.ts:67-69`),
  der Wert ist dann ≈ 0.

H4 lohnt also bei knapper Kette und ist wertlos bei vollem Lager. Das ist **gegenläufig zu H3**, und
genau das schafft die Wahl.

Der Lohn ist eine Ware, kein Geld (R722). Er hat einen Gegenpreis, denn der Spieler verzichtet auf den Lohn
von «Ja». Und eine Strafe ist er nicht, was zum Ton passt.

### Empfehlung

| Hebel | Rolle                                          | Empfehlung              |
| ----- | ---------------------------------------------- | ----------------------- |
| H3    | trägt die Wahl (Puffer gegen Wachstum)         | **ja**                  |
| H4    | gegenläufiger Lohn, ersetzt «Fest −1»          | **ja**                  |
| H1    | nur für den Lohn: Zuzug = p % der Einwohner    | ja                      |
| H2    | Kostenware aus dem Engpass, nur wenn bezahlbar | ja, bei 3 von 10 Bitten |

«Kapellen-Fest −1» als Folge von «Nein» **streichen**. Es macht «Ja» zum Lösegeld, und auf dem Plateau ist
es wertlos.

**Grenze:** Nach Ziel 3 gibt es im Sandkasten ohne Krisen keinen knappen Wert mehr ausser Geld. Dort bleibt
die Bitte eine leichte Wahl. Eine echte Wahl tragen dort nur «Krisen normal» und die Lager-Bitte B9.

## 5 Urteil je Phase mit der Empfehlung

Beispielbitte neu:

- «Ja: −⌈E/5⌉ Stoff · nach 4800 T für 6000 T +15 % Einwohner»
- «Nein: Stoffbedarf −10 % für 1800 T»

| Phase | Ja                                                          | Nein             | Wer wählt was                                                                                                    |
| ----- | ----------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| P1    | −10 St; +8 Bürger: +112/100 T, Lücke 4 Na · 1,6 St · 1,6 Ru | +18 St           | schlank → Nein; mit +1 Weberei, +1 Brennerei, +2 Fischern (65 Unterhalt) → Ja, netto +47/100 T → +2 820          |
| P2    | −12 St; +9 Bürger                                           | +22 St           | wie P1                                                                                                           |
| P3a   | −15 St; +12 (10 K + 2 B), Ziel 3 rückt um 12 näher          | +27 St           | Gewürz −6 und Nahrung 0 → Nein; 4. Haus kurz vor Stufe 4 → Ja (Ziel), falls Überbelegung zählt (offene Frage F1) |
| P3b   | −24 St; +18 K (+396/100 T)                                  | ≈ 0 (Lager voll) | ü ≥ 15 % und Krisen aus → Ja; ü ≈ 10 % oder Krisen normal → Nein                                                 |

**Keine Phase hat eine dominante Antwort.**

## 6 Bitten-Tabelle (Vorschlag `src/sim/defs/petitions.ts`, `PETITIONS`)

Felder:

- `cost`: Waren, bei «Ja» sofort fällig.
- `reward`: Art, Wert und Dauer.
- `delay`: Ticks bis zum Nachspiel.
- `when`: Bedingung beim Ziehen.
- `no`: Lohn von «Nein».

Für alle Bitten gelten gemeinsame Konstanten:

- `PETITION_PERIOD` 6000
- `PETITION_ANSWER` 1200
- `PETITION_MAX_OPEN` 2
- `PETITION_SALT` als eigener Strom (ADR-010)
- `OVERCROWD_PCT` 15
- `FRUGAL_PCT` 10
- `FRUGAL_TICKS` 1800

| #   | Name            | cost (Ja)                 | reward (Ja), delay                                             | when                                | no (H4)       | Ja wählt …                                                           | Nein wählt …                                  |
| --- | --------------- | ------------------------- | -------------------------------------------------------------- | ----------------------------------- | ------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| B1  | Weberfamilien   | Stoff ⌈E/5⌉ (10–40)       | Überbelegung 15 %, 6000 T; delay 4800                          | Haus ≥ St. 2, Ziel offen            | Stoff −10 %   | ü ≥ 15 % in allen Ketten                                             | schlanke Ketten (P1–P3a)                      |
| B2  | Schankrecht     | Rum ⌈E/5⌉                 | Überbelegung 15 % nur Stufe 3, 6000 T; 4800                    | Haus St. 3                          | Rum −10 %     | Rum-Überschuss, Bürgerhäuser                                         | Rum-Engpass (P1: Rum 6 gegen 10)              |
| B3  | Glaserbitte     | Glas ⌈E/10⌉ (H2-Kandidat) | Überbelegung 15 % nur Stufe 4, 6000 T; 4800                    | Haus St. 4                          | Glas −10 %    | Glas-Überschuss                                                      | Glas knapp (P3a: 6 gegen 6, Lager 26)         |
| B4  | Glockenweihe    | Rum 10 + Stein 10         | Aufstiegs-Wartezeit 150 im Kapellen-Radius, 1800 T; 600        | Kapelle, Haus nicht auf Höchststufe | Rum −10 %     | Häuser steigen auf: bis 690 (§3)                                     | Plateau: Lohn 0                               |
| B5  | Erntedank       | Zuckerrohr 20             | nächstes Fest einer Kapelle ohne Rum und ohne Abklingzeit; 600 | Kapelle                             | Rum −10 %     | Aufstiegswelle naht (Fest-Wert bis 1150)                             | Plateau oder Rohr knapp                       |
| B6  | Gewürzsaat      | Gewürz 10                 | Gewürzplantagen Takt 40, 6000 T; 1200                          | Gewürz ≥ 10                         | Gewürz −10 %  | eigene Plantagen (+25 % Gewürz)                                      | keine Plantage: Lohn 0                        |
| B7  | Wollmarkt       | Wolle 20                  | Webereien Takt 40, 3000 T; 600                                 | Weberei vorhanden                   | Stoff −10 %   | Wolle-Überschuss, Stoff knapp: +15 St je Weberei                     | Wolle knapp: Webereien warten                 |
| B8  | Heimkehrer      | **keine** (reines H3)     | Überbelegung 10 %, 6000 T; 2400                                | Ziel offen                          | Nahrung −10 % | Nahrung ≥ 10 % Überschuss                                            | Nahrung 0 (P1–P3a): Mangel nach Lager ÷ Lücke |
| B9  | Speicherbau     | Holz 20 + Stein 10        | Lagergrenze +20 für Stoff, Rum, Nahrung, 6000 T; 600           | Lager einer Ware ≥ 90               | Nahrung −10 % | Krisen normal, Lager voll: +20 % Sturmreserve                        | Krisen aus oder Lager leer: Lohn 0            |
| B10 | Baumeistergilde | Werkzeug 10 + Holz 20     | Hausaufstiege ohne Materialkosten (Geld bleibt), 1800 T; 600   | Haus vor Aufstieg                   | Nahrung −10 % | Aufstiegswelle St. 2/3 (spart 15 Holz, 8 Werkzeug, 10 Stein je Haus) | Plateau: Lohn 0                               |

**Prüfung der Mindestquote:** Alle 10 von 10 Bitten haben eine realistische Lage, in der «Nein» besser ist. Das
erfüllt die Vorgabe von zwei Dritteln. Alle 10 haben auch eine «Ja»-Lage.

Was die Bitten auszeichnet:

- **Eigene Ja-Lage:** B4, B5 und B10 gelten im Aufstieg, B9 nur mit Krisen.
- **Wohnraum gegen Folgelast:** B1, B2, B3 und B8 spielen dieses Spiel.
- **Takt-Lohn:** B6 und B7 lohnen nur, wenn die Eingänge bereitliegen.

**Befund zu B10:** Der Lohn ist ein Rabatt auf Material. Einen Gegenpreis hat er durch Werkzeug und Holz,
der Wert liegt aber nahe an Geld. Bei Zweifel an R722 lässt sich B10 streichen, dann bleiben 9 Bitten.

Der **H2-Kandidat** ist B3: Die Kostenware wird zur Ware mit der kleinsten Reichweite unter Stoff, Rum und
Glas, sofern das Lager sie deckt.

## 7 Baseline und Save

**Baseline:** Es gibt den Welt-Standard `petitionsOn: false` in `createWorld`, mit demselben Muster wie
`DEFAULT_WORLD_CRISIS_LEVEL` (`crises.ts:10`). Ist der Schalter aus, wird keine Bitte gezogen und der Strom
nicht befragt. Der Balancing-Lauf bleibt damit **bitgleich**, auch mit H4. An `tests/sim/balance.test.ts`
ändert sich nichts, ein Ruling zum Test entfällt.

**Schalter an, Controller antwortet nie:** Nach 1200 T gilt «Nein». Mit H4 hat das eine Wirkung, die
Genügsamkeit senkt den Verbrauch. Darum:

- Der Schalter bleibt im Welt-Standard aus.
- Als zusätzlicher Test (nicht als Gate) läuft der Controller mit `petitionsOn: true`. Er muss Ziel 1 bis
  zum `WIN_TICK_LIMIT` erreichen.

Die Genügsamkeit senkt nur den Bedarf, der Lauf kann dadurch nicht schlechter werden. Nur der Sieg-Tick
kann sich leicht verschieben. Neue Partien starten in der UI mit «an», nach dem Muster von
`DEFAULT_NEW_GAME_CRISIS_LEVEL`.

**Save:** `SAVE_VERSION` steigt von 18 auf 19 (`save.ts:55`). Neues Weltfeld:

```text
petitions: {
  on: boolean,
  next: number,
  open: { id, drawnAt, answer?: 'yes' | 'no', dueTick?, anchor?: buildingId }[],
  effects: { kind, until, good? }[]
}
```

Prüfregeln:

- `open.length` ≤ 2.
- `id ∈ PETITION_IDS`.
- `until` > `tick` − Höchstdauer.

Ein unbekannter Eintrag wird mit Hinweis abgewiesen, dafür braucht es einen Test. Alte Stände (v18) werden
abgewiesen, nach der festen Regel.

## 8 Randfälle mit Zahlen

- **Leeres Lager beim «Ja»:** Die Prüfung `{ ok: false, reason: 'Zu wenig Rum (0 / 10)' }` läuft vor jeder
  Abbuchung, nichts wird teilweise abgebucht. Beispiel P1: Rum 0, B2 wäre gesperrt. Der Generator zieht
  darum nur Bitten mit Kosten ≤ Lager. Fällt das Lager innerhalb der 1200 T darunter, bleibt die Sperre mit
  Grund bestehen und «Nein» ist noch möglich.
- **Zwei offene Marken:**
  - Im Normalfall ist höchstens eine offen. Der Abstand beträgt 6000 T, das längste delay 4800 T, und eine
    Marke schliesst mit dem Nachspiel.
  - Zwei offene Marken entstehen, wenn eine Bitte während des Nachspiels der vorigen kommt. Eine dritte wird
    nicht gezogen, der nächste Versuch kommt nach `PETITION_PERIOD`.
  - Gleiche Lohnarten **stapeln nicht**, es gilt das Maximum. So bleiben es höchstens +15 % Überbelegung,
    nicht +30 %.
- **Abriss vor dem Nachspiel:** `anchor` ist die Kapelle bei B4 und B5, eine Plantage bei B6, eine Weberei
  bei B7. Fehlt der Anker beim Nachspiel, verfällt die Marke ohne Folge. Die Kosten werden nicht erstattet,
  das steht in der Chronik. Bei der Überbelegung wird die Zahl der Häuser erst beim Nachspiel ermittelt. Ein
  abgerissenes Haus zählt dann einfach nicht mit.
- **Endloser Überschuss:**
  - Überbelegung ist befristet und stapelt nicht. Selbst wenn jede Bitte ein «Ja»-Zuzug ist, liegt die
    Bevölkerung dauerhaft höchstens 15 % über der Kapazität.
  - Steuer und Folgelast steigen dabei im selben Verhältnis. Die Netto-Bilanz je Einwohner bleibt so, wie
    §1 sie angibt.
  - Ein Zuzug ohne Frist würde dagegen wachsen: 6 Bitten je Stunde × 15 = +90 Einwohner ohne Hausbau.
    **Darum ist die Frist Pflicht.**
  - Lagerlohn (B9) und Taktlohn (B6, B7) sind ebenfalls befristet. Die Lagergrenze fällt nach Ablauf auf
    100 zurück, ein Überschuss verfällt wie heute.
- **Ablehnung löst nie eine Krise aus:** «Nein» hat nur Genügsamkeit als Wirkung, also weniger Verbrauch. Es
  greift nicht auf Krisen, Brand oder Häuser zu. Die Ideenfolge «Fest −1» fällt weg, die Klage in der
  Chronik ist reiner Text. Eine Ablehnung kann also keinen Mangel auslösen. Mangel ist nur über die
  Folgelast eines «Ja» möglich, und die steht auf der Karte.
- **Pause:** Die Frist rechnet in Ticks, und in der Pause laufen keine Ticks. Die 1200 T stehen also still.

## 9 Schlussurteil

**Echte Wahl belegt, aber erst mit Änderung.** In der Ideenform dominiert in P1 und P2 «Nein». Der Zuzug in
freie Plätze ist wertlos, weil ein Haus jede Lücke in ≤ 350 T füllt. In P3a wird «Ja» zum Fest-Lösegeld, in
P3b ist die Karte ein Ritual. Die Ursache ist doppelt: Mit `BUY_RISE = 0` lässt sich jede Warenforderung in
Geld umrechnen, und Geld ist ab Ziel 2 kein Engpass.

Die Wahl wird echt durch drei Änderungen:

- **H3:** Der Zuzug wird zur befristeten Überbelegung von 15 % mit voller Folgelast. Sie rechnet sich nur
  mit ≥ 15 % Überkapazität, Zukauf kostet 4 bis 5 je Einwohner und 100 T.
- **H4:** Genügsamkeit −10 % ist der gegenläufige Lohn von «Nein».
- **H1** bestimmt die Höhe des Lohns, **H2** die Kostenware bei B3.

Dann wählt eine schlanke Stadt «Nein» und eine Stadt mit Puffer «Ja», in allen Phasen und bei allen 10
Bitten. Eine Grenze bleibt: Im Sandkasten nach Ziel 3 mit «Krisen aus» ist keine Wahl stark, weil dort
nichts ausser Geld knapp ist. Alle Werte sind Vorschläge, `src/` bleibt unverändert.

## 10 Entscheidungsbedarf (Entwürfe für L0)

- **R-A:** I-210 geht mit H3 + H4 in die Spec. «Zuzug» wird befristete Überbelegung, und «Nein» bringt
  Genügsamkeit statt «Fest −1». — In der Ideenform dominiert «Nein» oder die Karte ist ein Ritual (§3). —
  Bei Irrtum werden Bitten selten angenommen. Die Werte (`OVERCROWD_PCT`, `FRUGAL_PCT`) lassen sich in den
  Defs nachstellen.
- **R-B:** Der Welt-Standard ist `petitionsOn: false`, neue Partien in der UI starten mit «an». Save 18 → 19.
  — Damit bleibt die Baseline bitgleich und der Balancing-Test unberührt. — Bei Irrtum braucht es eine
  Save-Version mehr.
- **F1 (offen):** Zählt Überbelegung für die Siegziele? Wenn ja, ist der Lohn «Wachstum» und kein Geld,
  das stützt die Wahl in P3a. Dafür kann der 600-T-Halt von Ziel 3 mit +12 Einwohnern früher fallen,
  geschätzt ≤ 550 T. Meine Empfehlung: **zählt**, denn sonst ist der Lohn ab P3a nur Geld (R722).
