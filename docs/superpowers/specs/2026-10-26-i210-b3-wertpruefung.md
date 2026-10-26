# I-210 · Wertprüfung B3 «Glaserbitte» und B9 «Speicherbau»

Stand: 2026-10-26 · Paket `design-POOL-B3` · Auftrag: R988, R996 (2), R997 (B9) · Autor: `lead-design`
Art: Rechnung, an Messwerten geeicht, **kein neuer Messlauf** (R862). Spec I-210: `design/i210-bittschrift`
@ `74f3b181`; Lagen und Defs: `feat/i210-mess` @ `ea911575` (Fundstellen unten beziehen sich darauf).

## 1 Ergebnis

- **B3: Werte lassen.** Die wörtliche Nein-Lage (nur Glas knapp, übrige Ketten mit Puffer) verlangt «Ja»:
  Ein Kaufmann zahlt 220 Geld je verbrauchtem Glas, und eine einzelne knappe Kette halbiert die Überbelegung
  nur. Kein bezahlbarer Kosten- und kein Lohnwert dreht diese Lage. Korrigiert wird Anhang 01.
- **B9: Werte lassen.** Die Ja-Lage ist ein Patt, weil der Sturm in der Genügsamkeits-Frist liegt: «Nein»
  spart dort je 100 T genau so viel Nahrung, wie «Ja» zusätzlich einlagert. Der Sturm gehört hinter die Frist.

## 2 Messwerte (Quelle, nicht neu gemessen)

Mass AK-BS-04: ΔGeld + Σ ΔLager × `GOODS[g].sell` im Fenster [Antwort, Antwort + delay + duration + 300]
(Spec §12). Abstand = Wert der erwarteten Antwort minus Wert der anderen.

| Bitte | Ja-Lage: Ja − Nein        | Nein-Lage (Test): Nein − Ja | Wörtlich nach Anhang 01                  |
| ----- | ------------------------- | --------------------------- | ---------------------------------------- |
| B1    | +22 566                   | +797                        | wie Test (P1 = 60, R988)                 |
| B2    | +6 706                    | +3 264                      | Nein-Lage: Ja +610 (28 149 gegen 27 539) |
| B3    | +11 259                   | +1 777                      | Nein-Lage: Ja +6 511                     |
| B9    | −74 (83 430 gegen 83 504) | nicht gemessen              | Ja-Lage «nicht baubar»                   |

Quellen: Bericht I-210 (Briefing `design-POOL-B3`); `tests/sim/petitionsDominance-b1b3.test.ts:10-16` (Seed 3);
`tests/sim/petitionsDominance-b6b9.test.ts:11-22`; `docs/beobachtungen.md` «I-210: Glaser-Bitte (B3)»;
R988; R997 mit Handoff `.studio/handoffs/2026-10-26-lead-tech-I-210-s4.md` (D-I210-B9).

## 3 Werte und Regeln

| Grösse                        | Wert                                                                                                                | Fundstelle                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Steuer je Einwohner und 100 T | Bürger 14, Kaufleute 22; unerfüllt halb                                                                             | `defs/tiers.ts:36,45`; `population.ts:250`                       |
| Bedarf je Einwohner und 100 T | Nahrung 0,5 · Stoff 0,2 · Rum 0,2 · Glas 0,1 · Gewürz 0,1                                                           | `defs/tiers.ts:34,43`                                            |
| Verkaufspreis                 | Holz 4 · Stein 6 · Nahrung 3 · Stoff 12 · Rum 18 · Glas 20 · Gewürz 12                                              | `defs/goods.ts:3-61`                                             |
| B3                            | Kosten Glas clamp(⌈E/10⌉, 5, 20) = 6 bei E = 60; Lohn `overcrowd` 15 % Stufe 4 (+3 je Haus); delay 4800, Dauer 6000 | `defs/petitions.ts:94-100`                                       |
| B9                            | Kosten Holz 20 + Stein 10 (= 140); Lohn Grenze +20 für Stoff, Rum, Nahrung; delay 600, Dauer 6000; Nein: Nahrung    | `defs/petitions.ts:188-200`                                      |
| Genügsamkeit («Nein»)         | −10 % der Ware für 1800 T                                                                                           | `defs/petitions.ts:12-13`                                        |
| Lagergrenze; Ablauf B9        | 100; Bestand darüber verfällt bei Ablauf                                                                            | `defs/goods.ts:84`; `petitions.ts:208-221`                       |
| Fehlbedarf                    | wird nicht nachgeholt (`demand` ≤ 1)                                                                                | `population.ts:109`                                              |
| Haus im Wachstumstakt (50 T)  | unerfüllt −1, erfüllt +1 bis Grenze                                                                                 | `population.ts:235-237`                                          |
| Sturm                         | 300 T, halber Takt für Fischer, Schaf, Zuckerrohr u. a.                                                             | `defs/timing.ts:48`; `defs/crises.ts:20`; `defs/buildings.ts:45` |

## 4 B3 Glaserbitte

**4.1 Wert eines Glases.** Ein Zusatz-Kaufmann zahlt 22 und isst 0,1 Glas je 100 T: Solange Glas im Lager
liegt, wird **ein Glas zu 220 Geld Steuer** (Verkauf 20, Kauf 50). Stufe 3: Stoff und Rum je 14 / 0,2 = 70.
Das ist Grundwirtschaft; die Überbelegung macht den Bestand nur zugänglich.

**4.2 Ja-Lage (Kontrolle).** 9 Kaufleute × 22 × 60 = 11 880; Kosten 6 × 20 = 120; Mehrverbrauch aus
Überschuss, der an der Grenze 100 sonst verfiele, Rest Anlauf ≈ 500. Erwartung ≈ 11 260, gemessen +11 259.

**4.3 Wörtliche Nein-Lage, Ja +6511 zerlegt.** Glas 26 − 6 = 20; im delay Erzeugung = Bedarf. Ab Wirkbeginn
fehlen 0,9 Glas je 100 T, das Lager ist nach ≈ 2220 T leer, danach fehlen 0,9 von 6,9 (13 %).

| Posten                              | Rechenweg                                    | Ja − Nein |
| ----------------------------------- | -------------------------------------------- | --------- |
| (a) Steuer bis Lager leer           | 20 Glas × 220                                | +4 400    |
| (b) Glas am Ende                    | Ja 0, Nein 26 + 10,8 gespart → −36,8 × 20    | −736      |
| (c) Gewürz (ü = 0, Lager 60)        | 0,9 je 100 T × 60 × 12                       | −648      |
| (d) Nahrung, Stoff, Rum (ü = 20 %)  | Überschuss > Mehrbedarf, Lager an der Grenze | ≈ 0       |
| (e) Nachlauf ≈ 3800 T (geeicht, A2) | 6511 − 3016                                  | +3 495    |

(e) ≈ +92 je 100 T passt zur Grobformel: unerfüllt d ≈ 13 %, Verlust d × ½ × 69 × 22 ≈ 99, Lohn 198 → netto
≈ +99. **Eine knappe Kette nimmt der Überbelegung die Hälfte, nicht mehr.** In der Test-Lage fehlen vier
Waren zugleich (Nahrung reicht 60 / 4,5 × 100 ≈ 1330 T), und «Nein» gewinnt (+1777).

**4.4 Hebel.** Ein Glas mehr Kosten: −220 aus (a), +102 aus längerem (e) → **−118 je Glas**. Ein kleinerer Lohn
ändert (a) nicht (220 je Glas, gleich wie schnell verbraucht), er kürzt nur (e).

| Variante                      | Ja − Nein wörtlich                 | Ja-Lage   |
| ----------------------------- | ---------------------------------- | --------- |
| heute (6 Glas, 15 %)          | +6 511                             | +11 259   |
| Kosten ⌈E/5⌉ → 12             | ≈ +5 800                           | ≈ +11 140 |
| Kosten 20 (Obergrenze)        | ≈ +4 860                           | ≈ +10 980 |
| Lohn 10 % (+2 je Haus)        | 4400 − 736 − 432 + ≈ 1650 ≈ +4 880 | ≈ +7 400  |
| Lohn 5 % (+1, Lager nie leer) | 3 × 22 × 60 − 696 − 216 ≈ +3 050   | ≈ +3 800  |

Kein Wert dreht die Lage; jeder schwächt B3 dort, wo «Ja» richtig ist.

**4.5 Ursache.** (1) 220 je Glas gegen 20 Verkauf. (2) Mangel wird nicht nachgeholt, das Haus schrumpft nur
auf das, was die Kette trägt. (3) Die Tabelle der Rechnung I-210 §4 («schlank ü = 0, P1–P3a → Nein») rechnet
mit gleichem ü in allen Ketten; die gemischte Lage gehört zur «vorbereiteten Stadt» (R-BS-4, Spec §10).
P3a ist in Rechnung §2 schlank in allen Ketten (Stoff 16−15, Rum 16−15, Glas 6−6, Gewürz 0−6, Nahrung
37,5−37,5); Anhang 01 hat das nicht ausgeschrieben. B2 wörtlich (+610, 2 %) zeigt dasselbe schwächer (70 je Rum).

## 5 B9 Speicherbau

**Lage im Test** (`petitionWorlds.ts:525-584`): 11 Bürgerhäuser × 15 = 165 Bürger, ü 10 % in Nahrung, Stoff,
Rum, Lager je 100, Krisen aus, Sturm ab Antwort + 600 + 300 = **900** für 300 T, in beiden Zweigen.

**5.1 Patt in der Frist.** Bedarf je 100 T: Nahrung 82,5, Stoff 33, Rum 33.

| Zeitraum (ab Antwort)      | «Ja» (Grenze 120)                                       | «Nein» (Grenze 100, Nahrung −10 % bis 1800) |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| 600–900                    | Überschuss 7,5–8,25 Nahrung je 100 T → 100 + ≈ 24 → 120 | Lager voll, Ersparnis verfällt              |
| 900–1200 Sturm             | Fischer halb: 3 × (82,5 − 45) ≈ −112 → Rest ≈ 8         | −112 + 3 × 8,25 gespart → Rest ≈ 13         |
| bis 6600, Ablauf, bis 6900 | füllt auf 120, Ablauf schneidet auf 100                 | füllt auf 100                               |

Keiner der beiden Zweige läuft leer (Stoff und Rum verlieren im Sturm ≤ 45). Am Fensterende stehen beide bei 100. Ja − Nein = −140 Kosten + ≈ 66 Rest (Zwischenware, Takte; nicht zerlegt) = **−74**. Strukturgrund:
**Ersparnis «Nein» (10 % des Bedarfs, 8,25) ≈ Einlagerung «Ja» bei ü ≈ 10 % (7,5–8,25).** Liegt der Sturm in den 1800 T der
Genügsamkeit, gleicht «Nein» den Speicher Stück für Stück aus; jede Sturmtiefe, die «Nein» leert, leert auch «Ja».

**5.2 Hebel.**

| Variante                                  | Wirkung in der Test-Lage                                                                    | Urteil   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| Lohn +20 → +40                            | Füllung bis Sturm bleibt ≈ 24 (Rate, nicht Grenze); −74                                     | nein     |
| Kosten 140 → 0                            | +66: dreht knapp, macht B9 kostenlos; Nein-Lage dann ≈ +30 für Nein                         | nein     |
| **Sturm nach der Frist (Antwort + 2400)** | Ja 120, Nein 100 zu Sturmbeginn; Abfluss ≈ 112: Nein leer ≈ 30 T vor Sturmende, Ja Rest ≈ 8 | **ja**   |
| Zusatzmass Lagerwert bei Wirkungsende     | +20 × (3 + 12 + 18) = +660 − 140 ≈ +520 für Ja                                              | Rückfall |

**5.3 Sturm nach der Frist, Rechenweg.** Bis 2400 füllt «Ja» Nahrung (8,25 × 18 = 148), Stoff und Rum (3,3 × 18
= 59) jeweils bis 120; «Nein» steht bei 100, die Frist endet bei 1800. Abfluss Nahrung im Sturm 3 × (82,5 −
½ × 90) ≈ 112 (36 Fischer zu 2,5; bei 37: 109). «Nein» ist nach ≈ 270 T leer und fehlt ≈ 12 Nahrung; «Ja»
behält ≈ 8. Der Mangel trifft «Nein» über Steuer halb (11 × 15 × 14 / 2 = 1155 je 100 T bei allen Häusern
unerfüllt) und −1 je Haus im Wachstumstakt, danach Auffüllen von 0 mit nur +8,25 je 100 T. Erwartung «Ja»
≈ +200 bis +500 Steuer gegen 140 Kosten → **Ja > Nein, schmal (≈ +100 bis +350)**. Bedingung: Abfluss
zwischen 100 und 120; mit 11 Häusern und ü 9–12 % erfüllt.

**5.4 Zum Zusatzmass.** Der Lagerwert bei Wirkungsende (vor dem Abschneiden) misst den zweiten Weg, den die
Karte nennt («hilft, wenn etwas gelagert wird, das sonst verfällt»): Wer vor Ablauf verkauft, hat +20 je Ware.
Er ist ehrlich, aber er macht «Ja» in **jeder** Lage mit Überschuss besser, ohne Sturm; die Sturm-Lage prüft
das Versprechen «vor einem Sturm» selbst. Darum nur als Rückfall, wenn 5.3 im Test unter +50 bleibt.

## 6 Empfehlung (Auflagen Gate Merge I-210)

**B3 und B9: Werte lassen** (`OVERCROWD_PCT` 15, B3 clamp(⌈E/10⌉, 5, 20); B9 Holz 20 + Stein 10, +20).

1. **Anhang 01 nachführen** (Spec-Nachtrag `design/i210-bittschrift`, `sonnet`): B3-Nein «P3a: alle Ketten
   ü = 0 (Rechnung §2), Glas 26, 6 gegen 6»; B2-Nein «Rum 12, Erzeugung 0,6 × Bedarf»; P1 mit 60 Bewohnern;
   **B9-Ja «Sturm ab Antwort + `FRUGAL_TICKS` + 600 (= 2400), 11 Bürgerhäuser, ü ≈ 10 %, Lager 100»**.
2. **B9 im Test** (`petitionsDominance-b6b9.test.ts`, `lead-tech`): Lage nach Punkt 1; Vorbedingung «Nein-Lauf
   mit Nahrungsmangel im Sturm, Ja-Lauf ohne». Bleibt Ja − Nein < +50: Zusatzmass 5.4 in beiden Lagen.
3. **Spec §10 R-BS-5:** «Eine einzelne knappe Kette macht ‹Ja› nicht falsch (B3: 220 je Glas). ‹Nein› ist
   besser, wenn zwei oder mehr Ketten schlank sind.» **R-BS-6:** «B9 wirkt nur gegen Stürme nach der
   Genügsamkeits-Frist oder durch Verkauf vor Ablauf.»
4. **Playtest-Frage** an R-BS-4: «Sagt ein Spieler mit knappem Glas, aber vollen übrigen Ketten zu Recht
   ‹Ja›, und versteht er warum?»

**Rückfall** bei «B3 immer Ja» im Playtest: Mangelregel (Steuer unerfüllter Häuser, Schrumpfen) oder
`BUY_RISE` (R899), nicht B3. Beides berührt Grundspiel und Balancing-Test, eigene Rechnung.

## 7 Annahmen

- **A1** Vorbedingungen AK-BS-04: versorgt, kein Brand, Krise nur wo gesetzt.
- **A2** B3 (e) aus der Messung zurückgerechnet, Grobformel bestätigt Vorzeichen und Grösse; für 4.4 linear
  in Dauer und Zusatz-Kaufleuten skaliert.
- **A3** B3 wörtlich: Nahrung, Stoff, Rum zu Wirkbeginn an der Grenze 100 (4800 T delay ab Lager 60).
- **A4** Seed 3 aus dem Testkopf; Seeds 3 und 7 zeigen dieselbe Lage (Handoff s4).
- **A5** B9: Stoff und Rum laufen im Sturm nicht leer (Wolle- und Zuckerrohrpuffer 20, Weberei und Brennerei
  nicht sturmanfällig); entscheidend ist Nahrung. Der Rest +66 in 5.1 ist nicht zerlegt.
- **A6** B9-Steuerverlust in 5.3 geschätzt (Anteil unerfüllter Takte 50–100 % über ≈ 30 T plus Nachlauf); die
  Rangfolge prüft der Test.
