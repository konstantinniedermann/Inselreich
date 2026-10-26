# Anhang 01 · Rechenweg Rückfracht (Formeln, Mengengerüst, Bilanz, Randfälle)

Zur Rechnung [2026-10-25-rueckfracht-rechnung.md](../2026-10-25-rueckfracht-rechnung.md). Alle Zahlen sind
**gerechnet, nicht gemessen**. Def-Stellen beziehen sich auf main `9ba7d79b`. «gerechnet I-144» bezeichnet Werte aus
der Zukaufpreis-Rechnung (Commit `528ac9f5`, §2 und Anhang A.2).

## A.0 Quellen der Eingangswerte

| Grösse                                                               | Wert                                                            | Herkunft                                          |
| -------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| Tick, Takt der Raten                                                 | 100 ms; Bedarf und Unterhalt je 100 T                           | `timing.ts:2,4`                                   |
| Bedarf je Einwohner wird verbraucht                                  | Einwohner × `needs[g]` je 100 T                                 | `flow.ts:40–42`                                   |
| Steuer                                                               | Einwohner × `tax` je 100 T, erfüllt; halb, wenn nicht           | `population.ts:247,266`, `tiers.ts:5–7`           |
| Schrumpfen                                                           | −1 Einwohner je 50 T bei unerfülltem Bedarf, kein Stufenabstieg | `population.ts:229–233`, `timing.ts:6`            |
| Schiff                                                               | Kapazität 50, Unterhalt 15 je 100 T, Preis 1200                 | `sea.ts:5–9`, `economy.ts:65`                     |
| Flottengrenze                                                        | 4 (main); 6 mit Werft (Erweiterung 1)                           | `sea.ts:4`; Skizze §2.3                           |
| Fahrzeit                                                             | 10 T je Kachel                                                  | `sea.ts:94`, `islands.ts:73`                      |
| Umschlag                                                             | Entladen und Laden beim Anlegen, ohne Liegezeit                 | `ships.ts:198–212`                                |
| Seeweg der Fremdinseln                                               | A 25–30, C 30–35, B 35–40                                       | `sea.ts:43–70`                                    |
| Kauf auf jeder Kontor-Insel zum Listenpreis                          | `buy(…, island)`                                                | `trade.ts:106`                                    |
| Preise Werkzeug / Nahrung / Stoff / Rum                              | Kauf 40/8/30/40, Verkauf 15/3/12/18                             | `goods.ts:11,22–23,36–37,50–51`                   |
| Verkaufs-Sättigung                                                   | −1 Punkt je Stück, +1 je 10 T, Boden 30 %                       | `goods.ts:65–67`, `timing.ts:18`                  |
| Lagergrenze je Insel                                                 | 100                                                             | `goods.ts:84`                                     |
| Ausstoss                                                             | 1 Stück je `cycle` T, Eingang 1 je Zyklus                       | `production.ts:53–71`                             |
| Kaufleute Ziel 3                                                     | 80 Einwohner, 20 je Haus, Steuer 22, Gewürz 0,1                 | `tiers.ts:42–45,57`                               |
| Spätspiel-Überschuss                                                 | ≈ 4400 Geld/min; Bürger-Plateau 2538                            | gerechnet I-144 bzw. gemessen I-144               |
| Nordleute St. 2: Steuer 7, 8 Einwohner je Haus                       | wie Siedler                                                     | **Annahme** (`tiers.ts:24–27`)                    |
| Wärme 0,2 Holz je E und 100 T, Holzfäller im Norden halb so schnell  | –                                                               | **Annahme** (Skizze: «Holz wächst langsam»)       |
| Lampenöl-Kette wie Rum: 2 Betriebe, 30 je 100 T für 2 Stück je 100 T | c_L = 15                                                        | **Annahme**                                       |
| Seeweg Nordinsel d_N                                                 | 60 (Bereich 45–80)                                              | **Annahme** (jenseits B mit dMax 40, Nebelgürtel) |

## A.1 Formeln

- Umlauf R = 2 · 10 · d T = 20 d T = d ÷ 30 min (d 60 → 1200 T = 2 min).
- Fluss eines Bedarfs: F = q · E je 100 T = 6 · q · E je min.
- Menge je Umlauf: F · R = 6 q E · d ÷ 30 = q E d ÷ 5. **Schiffe je Richtung:** n = q E d ÷ 250.
- Fracht je Stück, wenn nur diese Richtung lädt und das Schiff voll ist: u = 15 · (20 d ÷ 100) ÷ 50 = **0,06 d**
  (d 60 → 3,6). Ist das Schiff nur teilweise beladen: u = 90 ÷ F_min.
- Eigenproduktion je Stück: c = Σ (Unterhalt ÷ Ausstoss je 100 T) entlang der Kette.
- Zukauf je Stück: f · `buy`.
- Bilanz je Einwohner (Spec 2026-09-30): Netto = Steuer − Σ (Unterhalt der Kette ÷ versorgte Einwohner), je 100 T.

## A.2 Mengengerüst je Heimatgut-Kandidat (E 40 Nordleute St. 2)

| Kandidat (q)     | je min | n bei d 45 | n bei d 60 | n bei d 80 | Eigen je Stück                  | Eigen/min | Zukauf/min | Urteil                    |
| ---------------- | ------ | ---------- | ---------- | ---------- | ------------------------------- | --------- | ---------- | ------------------------- |
| Werkzeug 0,05    | 12     | 0,36       | 0,48       | 0,64       | 21,5                            | 258       | 480        | trägt, Puffer 8,3 min     |
| **Werkzeug 0,1** | 24     | 0,72       | **0,96**   | 1,28       | 21,5 = (3,2 × 25 + 1,2 × 5) ÷ 4 | 516       | 960        | **trägt**                 |
| Werkzeug 0,15    | 36     | 1,08       | 1,44       | 1,92       | 21,5                            | 774       | 1440       | Zukauf-Pfad < 0 (A.3)     |
| Stoff 0,2        | 48     | 1,44       | 1,92       | 2,56       | 12,5 = (4 × 10 + 4 × 15) ÷ 8    | 600       | 1440       | möglich, bindet 2 Schiffe |
| Nahrung 0,5      | 120    | 3,6        | 4,8        | 6,4        | 2,0 = 8 × 5 ÷ 20                | 240       | 960        | **trägt nicht** (Flotte)  |

Werkzeugmacher: 1 Stück je 80 T = 1,25 je 100 T, Unterhalt 25, braucht Schule (`buildings.ts:167–180`). Holzfäller:
1 je 30 T = 3,33 je 100 T, Unterhalt 5 (`buildings.ts:84–96`). Fischer: 1 je 40 T, Unterhalt 5 (`buildings.ts:43–55`).
Schäferei und Weberei: je 1 je 50 T, Unterhalt 10 bzw. 15 (`buildings.ts:111–137`).

**Lampenöl (ℓ 0,1):**

| E_L                           | je min | n bei d 45 | n bei d 60 | n bei d 80 | Bemerkung                        |
| ----------------------------- | ------ | ---------- | ---------- | ---------- | -------------------------------- |
| 40                            | 24     | 0,72       | 0,96       | 1,28       | unteres Ende                     |
| **60**                        | 36     | 1,08       | **1,44**   | 1,92       | Empfehlung; ≤ 2 Schiffe bis d 83 |
| 80 (Ziel 3)                   | 48     | 1,44       | 1,92       | 2,56       | ≤ 2 Schiffe bis d 62             |
| 1200 (Skizze: 60 Häuser × 20) | 720    | 21,6       | 28,8       | 38,4       | unmöglich                        |

**Gewürz** (80 Kaufleute, 0,1): 48/min; n = 0,1 · 80 · d ÷ 250 = 0,8 (d 25) bis 1,28 (d 40). Ein Schiff reicht bis
d 31.

**Bedingung «Heimatgut fährt gratis»:** n_H ≤ n_L ⇔ q · E ≤ ℓ · E_L ⇔ q ≤ 0,1 · 60 ÷ 40 = 0,15.

## A.3 Bilanz je Einwohner und 100 T (Endzustand Ziel «Zwei Reiche»)

Nordleute St. 2, E 40, q 0,1, d 60, 2 Schiffe:

| Posten                         | Rechnung                                         | je E und 100 T |
| ------------------------------ | ------------------------------------------------ | -------------- |
| Steuer (Annahme)               | 7                                                | +7,00          |
| Schiffe (voll angerechnet)     | 2 × 15 ÷ 40                                      | −0,75          |
| Werkzeug eigen                 | 86 ÷ 40                                          | −2,15          |
| Wärme (Annahme)                | 8 Holz je 100 T ÷ 1,67 = 4,8 Holzfäller × 5 ÷ 40 | −0,60          |
| Nordkontor                     | 10 ÷ 40 (`buildings.ts:253`)                     | −0,25          |
| **Netto, Werkzeug eigen**      |                                                  | **+3,25**      |
| Werkzeug zugekauft statt eigen | 4 × 40 ÷ 40 = 4,00 statt 2,15                    | **+1,40**      |

Endzustand: 40 × 3,25 = +130 je 100 T (+780/min); Zukauf 40 × 1,40 = +56 je 100 T (+336/min).

**Randwerte q:** Netto eigen = 5,4 − 21,5 q, Netto Zukauf = 5,4 − 40 q.

| q    | Netto eigen | Netto Zukauf |
| ---- | ----------- | ------------ |
| 0,05 | +4,33       | +3,40        |
| 0,10 | +3,25       | +1,40        |
| 0,13 | +2,61       | +0,20        |
| 0,15 | +2,18       | −0,60        |

Beide Pfade ≥ 0 bis q 0,135.

**Zukauf-Faktor f an der Nordküste (q 0,1):** Netto Zukauf = 5,4 − 4 f ≥ 0 bis f 1,35. Der Gesamtüberschuss
wird negativ, wenn 24 · 40 · f > 4400, also ab f 4,58. Unter 1,35 kauft der Spieler am Nordkontor, darüber daheim
(f = 1) und lädt auf das Lampenöl-Schiff. Der Faktor ändert also höchstens den Ladeort.

**Kaufleute mit Licht:** Lampenöl 6 je 100 T (E_L 60) → 3 Kettenpaare × 30 = 90 je 100 T, also 1,50 je E. Fehlt das
Lampenöl als Muss-Bedürfnis, sinkt die Steuer von 22 auf 11 je E. Bei E_L 60 sind das −660 je 100 T (−3960/min, 90 %
von 4400), bei 80 Kaufleuten −880 je 100 T (−5280/min, 120 %).

## A.4 Randfälle (Rechenweg)

- **Leer zurück:** 24/min auf einem Schiff mit 90/min Unterhalt → 3,75 je Stück → 21,5 + 3,75 = 25,25 < 40.
- **Gleichstand Zukauf/Rückfracht in Geld:** 21,5 + 0,06 d = 40 → d = 308. Das liegt weit über dem Bereich 45–80.
- **Puffer im Nordlager:** 100 ÷ (6 q E): q 0,05 → 8,3 min; q 0,1 → 4,2 min; q 0,15 → 2,8 min. Mit vollem Heimlager
  kommen bei q 0,1 weitere 4,2 min dazu (8,3 min gesamt).
- **Schrumpfen:** Ein Haus mit 8 Einwohnern erreicht 1 Einwohner nach 7 × 50 = 350 T (35 s). Die Steuer halbiert sich
  ab dem ersten unerfüllten Takt.
- **Lampenöl-Puffer daheim:** 100 ÷ 36 = 2,8 min (E_L 60), 100 ÷ 48 = 2,1 min (E_L 80).
- **Verkaufskreis Lampenöl:** Gewinn je min ≤ (sell − c_L − u) × 60, wobei 60/min das Sättigungsknie ist (1 Punkt
  Erholung je 10 T). Bei c_L 15 und u 3,6 (d 60, nur eine Richtung) ist die Grenze sell ≤ 18,6. Bei sell 25 ergeben
  sich ≤ 384/min. Lädt das Schiff in beide Richtungen, gilt u = 1,8, also sell ≤ 16,8.
- **Flotte 4:** Nord 2 (A.2, d ≤ 83) + Gewürz 1 (d ≤ 31) bzw. 2 → 3 bzw. 4. Eine Expedition (N1) braucht ein freies
  Schiff. Bei Gewürz-Seeweg > 31 kostet sie eine Route.
