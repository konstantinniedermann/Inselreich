# I-221 Konzessions-Auktion — Rechnung Kostenleiter neben dem Stadtrecht

Rechnung `design-economy-designer`, Paket design-IDEEN20-FOLGEN. Werte sind Vorschläge, `src/sim/defs/` bleibt unverändert.

## Frage

Wann ist die Kasse für eine Auktion frei, wenn der Spieler Stadtrecht-Sitzungen gierig kauft (Stadtrecht-Spec §4.1)?
Welche Kostenleiter je Partieminute und welche Konzessionen machen die Auktion zu einer echten Wahl, ohne dass «immer
gewinnen» oder «nie bieten» dominiert, die Kasse in den Bankrott läuft oder danach endloser Überschuss bleibt?

## Annahmen

1. Referenzen B, K, G und ihre Kaufzeiten aus der Stadtrecht-Spec §4/§4.1: B Netto +2538/min, K +3180/min, G ≈ +10 100/min;
   K kauft Sitzung 1–6 bei min 21,5 / 23,9 / 27,9 / 34,2 / 44,4 / 60,9, B bei 15,3 … 68,3, Alles-A danach K +4465/min.
2. K hat 60 Kaufleute (Ziel 2). Bedarf je Einwohner und 100 Ticks; Gewürz 0,1 → 36/min.
3. **Importeur K** kauft alles Gewürz zu: 36/min × 40 = 1440 Geld/min. **Eigenversorger K** kauft 200 Geld/min zu.
4. **Exporteur K** verkauft 40 Einheiten/min in Schüben zu 100 Stück, mittlerer Listenpreis 15. B kauft 600/min zu und
   verkauft ≈ 25/min.
5. **Fern-Spieler** hat ein Kontor auf einer Fremdinsel und liefert jedes Fernangebot.
6. Werte von G = 2 × K (Steuer 20 000 / 9180 ≈ 2,2).
7. Unterhalt K ≈ Steuer − Netto = 9180 − 3180 ≈ 6000/min.
8. Freischaltung mit `won` wie Stadtrecht; erster Ausruf bei B min 18, bei K min 24. Partie 90–150 min.
9. Gebote ohne Streuung gerechnet. Die Streuung ±10 % verschiebt jeden Break-even um ≈ ±8 min.

## Zahlen aus `src/sim/defs/` und Regeln

Pfade relativ zu `src/sim/`.

| Wert                                    | Zahl                                    | Fundstelle                                    |
| --------------------------------------- | --------------------------------------- | --------------------------------------------- |
| Ticks je Minute (1×)                    | 600 (100 ms je Tick)                    | `defs/timing.ts:2`                            |
| Bedarf je Einwohner                     | `inhabitants × rate / 100` je Tick      | `population.ts:100`                           |
| Gewürz, Glas Zukauf                     | 40, 50                                  | `defs/goods.ts:61`, `:57`                     |
| Verkaufspreis / Zukauf, höchstes Gut    | Rum 18 / 40 = 0,45                      | `defs/goods.ts:50-51`                         |
| Sättigung beim Verkauf                  | −1 Punkt je Stück, Boden 30 %           | `defs/goods.ts:65,67`, `trade.ts:163`         |
| Erholung Verkaufsanteil                 | +1 Punkt je 10 Ticks = 60 Punkte/min    | `defs/timing.ts:18`, `trade.ts:174`           |
| Boom, Vorliebe                          | 150 %, 130 % (nicht stapelnd)           | `defs/crises.ts:18`, `defs/sea.ts:35`         |
| Auftragsprämie, Vertragspreis           | ⌊0,75 × Zukauf⌋, ⌊0,68 × Zukauf⌋        | `defs/goods.ts:73,75`                         |
| Fernmengen Stoff / Rum / Glas           | 20 / 15 / 12 → Prämie 440 / 450 / 444   | `defs/goods.ts:38,52,59`, `orders.ts:100-104` |
| Auftragsperiode; Fern sperrt Folge      | 900 Ticks (1,5 min); `farSkip`          | `defs/timing.ts:29`, `orders.ts:217`          |
| Fernangebot nur mit Kontor auf Fremdins | `kontorId !== null`                     | `orders.ts:88-97`                             |
| Edikt Handel                            | Kaufpreis 80 %, Kosten 600, Sperre 3000 | `defs/edicts.ts:20,36`, `defs/timing.ts:66`   |
| Edikt Sparen                            | Unterhalt 80 %, −7 Steuerpunkte         | `defs/edicts.ts:9-10`                         |
| Zufall je Periode ohne Zustand          | neue RNG-Instanz aus Seed und Periode   | `orders.ts:57`                                |

## Ersatz der Konzessionen (nur was ohne Inselbesitz wirkt)

- **Vorkaufsrecht** braucht R-A (Besitzer je Fremdinsel), Ersatz **Zollpacht:** «Kaufpreise am Kontor −20 %, wie das Edikt Handel; beides zusammen gibt nicht mehr.»
- **Kontorplatz** braucht Inselbesitz, Ersatz **Absatzprivileg:** «Deine Verkäufe drücken den Preis nicht.»
- **Fernangebot** braucht nur ein Kontor auf einer Fremdinsel (gibt es heute), bleibt als **Fernprivileg:** «Jede Periode ein Fernangebot, Prämie +25 %.»

Die Zollpacht darf **nicht** mit dem Edikt stapeln: 0,8 × 0,8 = 0,64 × Zukauf läge unter der Auftragsprämie 0,75 und dem
Vertragspreis 0,68. Zukauf und Auftrag wären eine Geldpumpe.

## Regeln (Vorschlag, je ein Satz)

1. **Ausruf:** Ab dem ersten Ziel ruft das Handelshaus alle 6 Minuten ein Recht aus, fest im Wechsel Zollpacht,
   Absatzprivileg, Fernprivileg (Ausruf n bei Tick 3600 n, Recht n mod 3).
2. **Ansage:** «Haus Brandt bietet 2700 für die Zollpacht, Zuschlag in 3 min.» Das Gebot ändert sich bis zum Zuschlag nicht.
3. **Gebot:** `G = rund100(Satz × (t + 25) × (1 + 0,5 h) × s)`. Dabei ist t die Partieminute des Ausrufs, h die Zahl der
   anderen Rechte, die der Spieler gerade hält, und s = 0,90 … 1,10 aus eigenem Strom. Spielertext: «Das Haus bietet mehr,
   je später die Partie und je mehr Rechte du schon hältst.»
4. **Überbieten:** Der Spieler zahlt sofort Gebot + 10 % (aufgerundet auf 100, mindestens 100), nur wenn die Kasse reicht.
   Das Haus bietet nicht nach.
5. **Frist:** Das Recht gilt ab dem Zuschlag 18 Minuten, bis zum nächsten Zuschlag desselben Rechts. Verliert der
   Spieler, hält es das Haus ebenso lang; eine weitere Strafe gibt es nicht.
6. **Rivalen aus:** keine Ausrufe und kein Schreibzugriff auf die Welt, also bitgleich (R965 E-2). Die Streuung s kommt
   aus einer neuen RNG-Instanz je Ausruf (Seed, n) wie `orderForPeriod`, nie aus dem Hauptstrom (R965 E-3).

## Rechnung

### 1 Wert je Recht (Geld/min)

| Profil           | Zollpacht      | Absatzprivileg  | Fernprivileg        |
| ---------------- | -------------- | --------------- | ------------------- |
| K Importeur      | **288** ¹      | 0               | 0 ohne Fremd-Kontor |
| K Exporteur      | 40             | **200** ²       | 0 ohne Fremd-Kontor |
| K Fern-Spieler   | je nach Zukauf | je nach Verkauf | **142** ³           |
| B Bürger-Spieler | 120            | 120             | 142 (Rum, Stufe 3)  |
| G grosse Stadt   | 576            | 400             | 284                 |

¹ 0,2 × 1440 Zukauf. Wer schon Edikt Handel fährt, gewinnt mit der Pacht den Platz für Sparen: bei K 0,2 × 6000 −
0,07 × 9180 = +557/min; gerechnet ist der kleinere Wert. ² Schub zu 100 Stück verkauft im Mittel zu 54,9 % statt
100 % → 271/min, Schub zu 50 → 147. ³ (555 ÷ 1,5 − 444 ÷ 3) − 6,7 Stück/min × 12 Verkaufswert. Zukauf B 0,2 × 600, Eigenversorger 0,2 × 200.

### 2 Kostenleiter (Zahlbetrag = Gebot + 10 %, s = 1)

| Ausruf-Minute t | Zollpacht h = 0 / 1 / 2 | Absatzprivileg h = 0 / 1 / 2 | Fernprivileg h = 0 / 1 / 2 |
| --------------- | ----------------------- | ---------------------------- | -------------------------- |
| 24              | 2200 / 3200 / 4300      | 1700 / 2500 / 3200           | 1100 / 1700 / 2200         |
| 36              | 2700 / 4100 / 5400      | 2000 / 3000 / 4100           | 1400 / 2000 / 2700         |
| 48              | 3200 / 4900 / 6400      | 2500 / 3700 / 4900           | 1700 / 2500 / 3200         |
| 60              | 3800 / 5700 / 7500      | 2900 / 4200 / 5700           | 1900 / 2900 / 3800         |
| 90              | 5100 / 7600 / 10 200    | 3800 / 5800 / 7600           | 2600 / 3800 / 5100         |
| 120             | 6400 / 9600 / 12 800    | 4900 / 7200 / 9600           | 3200 / 4900 / 6400         |

### 3 Amortisation (Zahlbetrag ÷ Wert, min; lohnt, solange < 18)

| Profil / Recht       | t = 24  | t = 36  | t = 60  | t = 90 | t = 120 | Break-even t (h = 0) |
| -------------------- | ------- | ------- | ------- | ------ | ------- | -------------------- |
| K Importeur Zoll     | 7,6     | 9,4     | 13,2    | 17,7   | 22,2    | 93                   |
| K Exporteur Absatz   | 8,5     | 10,0    | 14,5    | 19,0   | 24,5    | 84                   |
| K Fern-Spieler Fern  | 7,7     | 9,9     | 13,4    | 18,3   | 22,5    | 91                   |
| K, zweites Recht h=1 | —       | 14,2    | 19,8    | —      | —       | ≈ 50                 |
| B Zoll / Absatz      | 18 / 14 | 23 / 17 | 32 / 24 | —      | —       | 24 / 40              |
| G Zoll, h = 2        | —       | 9,4     | 13,0    | 17,7   | 22,2    | ≈ 92                 |
| Eigenversorger Zoll  | 55      | 68      | 95      | —      | —       | nie                  |

### 4 Zwei Senken auf einer Kasse (Stadtrecht gierig, Rechte nur bei Amortisation < 18 min)

| Lauf                           | ersteigert (t, Recht, h, Zahlbetrag)                                    | bezahlt | Wert bis Sitzung 6 | Verschiebung Sitzung 6 |
| ------------------------------ | ----------------------------------------------------------------------- | ------- | ------------------ | ---------------------- |
| K Import + Export (bis 60,9)   | 24 Absatz 0 1700 · 36 Zoll 1 4100 · 42 Absatz 1 3300 · 60 Absatz 0 2900 | 12 000  | 11 964             | ± 0,0 min              |
| K alle drei passend (bis 60,9) | 24 Absatz · 30 Fern · 42 Absatz · 48 Fern                               | 9300    | 10 742             | 0,5 min früher         |
| B nur Fern (bis 68,3)          | 30 · 48 · 66 Fern, je h = 0                                             | 5000    | 5013               | ± 0,0 min              |

Ein einzelner Zuschlag bindet P ÷ Netto = 0,5–1,3 min Überschuss (K) bzw. 0,5–0,8 min (B). Er kommt innerhalb der
Frist zurück. **Die Kasse ist also bei jedem Ausruf frei:** Im 3-min-Fenster bis zum Zuschlag fallen bei K mindestens
3 × 3180 = 9540 Netto an, bei B 3 × 2538 = 7614. Das ist mehr als jeder Zahlbetrag mit h = 0 bis t = 90 (höchstens 5100).
Der Zuschlag schiebt nur die nächste Sitzung um P ÷ Netto. Passende Rechte verschieben das Stadtrecht netto nicht, ein
unpassendes verschiebt es um den vollen Zahlbetrag.

### 5 Nach dem Stadtrecht

K (Alles-A, +4465/min ab min 61) zahlt für zwei passende Rechte bei t = 66 … 120 zusammen 389 … 628/min. Das sind
9–14 % des Überschusses, und der Wert kommt zurück. Ab t ≈ 85–93 hört K auf zu bieten. **I-221 ist eine Wahl mit
Gegenüber, keine Dauer-Senke.** Die Geldschwemme bleibt, die Dauer-Senke bleibt E1 «Wartung» (Stadtrecht-Spec §4.1).
G zahlt von min 18 bis 150 insgesamt 102 700 (≈ 8 % von 10 100/min) und erhält 133 800 Wert.

## Prüfung auf dominante Wahl (R722) und Entartungen

- **E1 Immer gewinnen:** Je Profil passt genau ein Recht; unpassende amortisieren nie (Eigenversorger-Zoll 55 min). Zweites Recht ab t ≈ 50 zu teuer. → nein.
- **E2 Nie bieten:** Jedes Recht hat ein Profil mit Amortisation 7–10 min bei t = 24–36; B hat das Fernprivileg bis min 91. → nein.
- **E3 Bankrott durch zwei Senken:** Beide Käufe nur bei Kasse ≥ Preis, nie unter 0 (Stadtrecht §3.2.3); Verzicht kostet nichts ausser dem Recht. → nein.
- **E4 Endloser Überschuss danach:** bleibt (Abschnitt 5); Auktion bindet 8–14 % → offen.
- **E5 Zollpacht + Edikt stapelt:** 0,64 × Zukauf < Auftragsprämie 0,75 → Pumpe; daher nicht stapeln → Regel.
- **E6 Zollpacht + Absatz als Kreis:** Zukauf 0,8 gegen Verkauf höchstens 0,45 × 1,5 (Boom) = 0,675 → kein Kreis → nein.
- **E7 Absatz + Boom + volles Lager:** 100 Rum im Boom: 2700 statt ≈ 1480; einmal je Boom, Lager 100 deckelt (`goods.ts:84`) → gewollt.
- **E8 Grosse Stadt kauft alles:** ohne h-Aufschlag amortisiert G jedes Recht bis t ≈ 200 (Scheinwahl); mit 1 + 0,5 h ab t ≈ 90 nur noch zwei → Regel.
- **E9 Bieten in letzter Sekunde:** kostet gleich, das Haus bietet nicht nach → nein.
- **E10 Gebot liest die Kasse:** nein, nur t und h (Q7) → nein.

**Zwei lohnende Pfade bleiben:** Importeur (Zollpacht und Sparen) und Exporteur (Absatz). Dazu kommt der Fernpfad, auch
für B. Kein Recht ist für alle Profile vorn.

## Vorschlag Def-Werte (`src/sim/defs/auction.ts`, neu)

- `AUCTION_UNLOCK`: `'won'` — Weltflagge (wie `EDICT_UNLOCK`)
- `AUCTION_PERIOD`: 3600 — Ticks zwischen Ausrufen (6 min)
- `AUCTION_NOTICE`: 1800 — Ticks Ausruf bis Zuschlag (3 min)
- `AUCTION_TERM`: 10 800 — Ticks Frist (18 min = 3 Perioden)
- `AUCTION_ORDER`: zollpacht, absatz, fern — feste Folge
- `AUCTION_RATE`: zollpacht 40, absatz 30, fern 20 — Geld je Partieminute
- `AUCTION_OFFSET_MIN`: 25 — Minuten (Gebot bei t = 0)
- `AUCTION_HOLD_PCT`: 50 — % Aufschlag je anderem gehaltenem Recht
- `AUCTION_SPREAD_PCT`: 10 — ± % Streuung aus eigenem Strom
- `AUCTION_STEP_PCT`: 10 — % Überbiet-Schritt
- `AUCTION_ROUND`: 100 — Geld, Rundung Gebot und Schritt
- `CONCESSION_BUY_PCT`: 80 — % Kaufpreis (Zollpacht, min mit Edikt)
- `CONCESSION_SELL_DROP`: 0 — Punkte je Stück (Absatz, statt 1)
- `CONCESSION_FAR_PCT`: 125 — % Fernprämie, ohne `farSkip`

Save-Version +1 (Besitz und Fristende je Recht, laufender Ausruf); älterer Stand wird mit Hinweis abgewiesen, Test.
Der Balancing-Test bleibt unberührt, solange «Rivalen aus» der Standard der Testläufe ist.

## Ergebnis: **anpassen**

Die Kostenleiter trägt. Jedes Recht amortisiert für sein Profil in 7–15 min bis zur Partiemitte, für die übrigen
nie. Die Auktion verschiebt das gierige Stadtrecht netto um weniger als 1 min. Anpassen heisst drei Dinge: die
Ideen-Konzessionen Vorkaufsrecht und Kontorplatz ersetzen (Zollpacht, Absatzprivileg), Zollpacht nicht mit dem Edikt
stapeln (sonst Pumpe) und den Aufschlag je gehaltenem Recht einführen (sonst Scheinwahl für G). Den Überschuss
senkt I-221 nicht, es ist eine Wahl mit Gegenüber, keine Senke.

## Offene Fragen an L0

1. **Senke oder Wahl?** I-221 bindet 8–14 % des Spätspiel-Überschusses und gibt den Wert zurück. Empfehlung: als Wahl
   annehmen, die Senke bleibt E1 «Wartung». Kein Ruf-Wert (Rang, Chronik) zusätzlich: Er würde unrentable Gebote nach
   min 90 erzwingen.
2. **Ersatz-Konzessionen** statt Vorkaufsrecht und Kontorplatz. Empfehlung: annehmen. Das Vorkaufsrecht kommt als
   viertes Recht mit R-A zurück, dann `AUCTION_ORDER` erweitern und neu rechnen.
3. **Ruling-Entwurf:** «Zollpacht stapelt nicht mit Edikt Handel — 0,64 × Zukauf läge unter Auftragsprämie (0,75) und
   Vertragspreis (0,68), Zukauf plus Auftrag wäre eine Geldpumpe — Kosten bei Irrtum: Geld-Exploit im Spätspiel,
   Hotfix in `defs` und Save-Prüfung.»
4. **Ruling-Entwurf:** «Gebot steigt um 50 % je anderem gehaltenem Recht — sonst gewinnt die grosse Stadt jedes Recht bis
   min ≈ 200 ohne Abwägung — Kosten bei Irrtum: kleine Städte zahlen für ein zweites Recht zu viel (Wert 1 statt 2
   Rechte ab min 50).»
5. Abgleich mit K5 «Ratsbank» (Erweiterung 1): gleiche Kasse, gleiche Zeit. Empfehlung: Rechnung erneut, sobald K5 Werte
   hat. Bis dahin I-221 nicht vor K5 einplanen.
