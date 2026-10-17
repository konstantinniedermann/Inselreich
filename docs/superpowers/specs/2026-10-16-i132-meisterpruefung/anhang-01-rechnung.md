# Anhang 01 · Rechnung I-132 «Meisterprüfung» (drei freiwillige Auflagen nach dem Denkmal)

Stand 2026-10-16 · Paket `design-I-132-I-133` · Rolle Wirtschaftsdesign · Zuarbeit für die Spec des Design-Leads.
Messläufe: temporäre Testdatei im Worktree (`tests/sim/zz-i132-mess.test.ts`, nicht committet), Seed 3, Ausgangsstand
K'-arm (Tick 11 800, 60 Kaufleute, `balance-monument.test.ts`), unverändertes `src/`. **Messwert** = aus dem Lauf,
**(Schätzung)** = gerechnet. Einheit überall «je 100 Ticks» (= 10 s bei 1×; 600 Ticks = 1 min; 9000 Ticks = 15 min).

## 0 Kurzurteil

| Auflage            | schaffbar              | trivial                                  | tragender Engpass                                 | Urteil                                 |
| ------------------ | ---------------------- | ---------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| A1 Eigenversorgung | ja (bis ca. 150 Kauf.) | nein (nur mit Vorbereitung)              | Logistik: Gewürz und Stein per Schiff, nicht Geld | **behalten**                           |
| A2 Genügsam        | ja                     | **ja**, Kasse nie negativ                | keiner (Geld ist Überschuss)                      | **streichen** (Ersatz nur optional, 6) |
| A3 Sturmjahr       | ja                     | **ja** mit 3 Feuerwachen (ca. 1000 Geld) | Feuerwache auf Dienstgebäuden, nicht der Sturm    | **streichen oder neues Kriterium** (5) |

Empfehlung: **Variante S (nur A1)**, Schwelle 70 % statt 90 %, Abriss von Wohnhäusern während der Auflage gesperrt (Abschnitt 7).

## 1 Referenz-Spätzustand (a)

Gemessen am Stand K'-arm, Tick 11 800 (der Controller hat nur die Heimat ausgebaut; Heimatkontor, keine Fremdinsel). Er ist
der **Minimalfall** eines Spätspiels: gerade 60 Kaufleute, keine Überkapazität, keine Feuerwache.

| Gebäude                            | Zahl | Gebäude                          | Zahl |
| ---------------------------------- | ---: | -------------------------------- | ---: |
| Wohnhäuser (1 Bürger, 3 Kaufleute) |    4 | Brennerei / Zuckerrohr           |  8/8 |
| Fischerhütte                       |   15 | Glashütte                        |    3 |
| Schäferei / Weberei                |  8/8 | Holzfäller                       |    2 |
| Kapelle, Schule, Bad, Amtsstube    | 1 je | Steinbruch, Plantage, Feuerwache |    0 |

Einwohner 75 (15 Bürger + 60 Kaufleute). Kasse 2775. Lager: Holz 14, Werkzeug 0, Stein 6, Nahrung 47, Stoff 35, Rum 39,
Glas 27, Gewürz 0.

### 1.1 Güterbilanz je 100 Ticks

Erzeugung `P = 100 ÷ cycle` je Betrieb; Verbrauch `V = Einwohner × Bedarf` bzw. `100 ÷ cycle` je Verarbeiter.

| Gut         | Erzeugung | Verbrauch | Saldo    | hängt am Zukauf?                      |
| ----------- | --------: | --------: | -------- | ------------------------------------- |
| Nahrung     |      37,5 |      37,5 | 0        | nein, aber **null Reserve**           |
| Wolle→Stoff |   16 → 16 |   16 → 15 | +1 Stoff | nein                                  |
| Zucker→Rum  |   16 → 16 |   16 → 15 | +1 Rum   | nein                                  |
| Holz        |      6,67 |         6 | +0,67    | nein (nur Glashütte frisst Holz)      |
| **Stein**   |     **0** |     **6** | **−6**   | **ja, 100 %** (Glashütte 3 × 2)       |
| Glas        |         6 |         6 | 0        | nein, solange Stein da ist            |
| **Gewürz**  |     **0** |     **6** | **−6**   | **ja, 100 %** (60 × 0,1)              |
| Werkzeug    |         0 |         0 | 0        | nur einmalig (Bau, Aufstieg, Schiffe) |

Im Spätspiel hängen nur **Gewürz und Stein** am Zukauf (Werkzeug und Glas nicht). Zukauf: `6 × 40 + 6 × 15 = 330` Geld je 100
Ticks (Messwert 29 700 in 9000 Ticks, `BUY_RISE` = 0, Preis fest).

### 1.2 Kasse und Bilanz je Einwohner (Rechenweg wie `balancing-design`)

```
Steuer        = Σ Einwohner × Satz   = 15 × 14 + 60 × 22          = 1530
Unterhalt     = Σ upkeep der 52 Gebäude                            =  690
Zukauf        = 6 × 40 (Gewürz) + 6 × 15 (Stein)                   =  330
Netto         = 1530 − 690 − 330                                   = +510   (Messwert: 45 900 in 9000 Ticks)
```

| Stufe     | Einw. | Steuer je Einw. | Unterhalt je Einw. (690 ÷ 75 = 9,2) | Zukauf je Einw. | Netto je Einw. |
| --------- | ----: | --------------: | ----------------------------------: | --------------: | -------------: |
| Bürger    |    15 |            14,0 |                                 9,2 |               0 |       **+4,8** |
| Kaufleute |    60 |            22,0 |                                 9,2 |  330 ÷ 60 = 5,5 |       **+7,3** |
| gesamt    |    75 |            20,4 |                                 9,2 |             4,4 |       **+6,8** |

Kassenverlauf Messwert (Krisen aus, Zukauf wie Controller): 2454 (nach erstem Kauf) → 10 104 (1500) → 48 675 (9000).
**Kasse und Geld sind Überschuss** (Befund R722 bestätigt): Netto +3060 je Minute.

## 2 A1 «Eigenversorgung» (b)

### 2.1 Passivlauf ab Referenzstand (Messwert)

9000 Ticks, kein Zukauf, kein Eingriff, Krisen aus. E0 = 75.

| Tick | Einwohner | Kaufleute |   Kasse | Glas | Gewürz | Stein |
| ---: | --------: | --------: | ------: | ---: | -----: | ----: |
|    0 |        75 |        60 |    2775 |   27 |      0 |     6 |
|  300 |        57 |        42 |    3156 |   18 |      0 |     0 |
|  600 |        39 |        24 |    2852 |    9 |      0 |     0 |
|  900 |        21 |         6 |    1955 |    3 |      0 |     0 |
| 1200 |        18 |         3 |     630 |    3 |      0 |     0 |
| 9000 |        18 |         3 | −34 236 |    0 |      0 |     0 |

Scheitern nach Entwurfsregel (< 90 % E0 = 67,5): **Tick 150** (15 s). Gewürz fehlt schon bei Start; jedes Kaufmannshaus
schrumpft um 1 je 50 Ticks. Bei 70 % (52,5): Tick ≈ 375 (interpoliert); bei 75 % (56,25): ≈ 312. Kasse < 0 ab Tick ≈ 1300
(Folge des Einbruchs, kein eigenes Kriterium).

### 2.2 Welches Gut trägt wie lange (Messwert, je Variante 9000 Ticks, Schwelle 90 % / 85 %)

| Start und Zufuhr                                   | Scheitern 90 % | 85 % | Ergebnis                                    |
| -------------------------------------------------- | -------------: | ---: | ------------------------------------------- |
| Gewürz 100, Stein 100, keine Zufuhr (volles Lager) |       **1799** | 1899 | Gewürz leer bei 1652, Glas leer bei 2312    |
| Gewürz 100, Stein 0, nur Gewürz-Zufuhr 6/100       |            599 |  649 | Glas leer bei 439 (Stein fehlt)             |
| Gewürz 0, Stein 0, nur Gewürz-Zufuhr 6/100         |            599 |  649 | Glas leer bei 442                           |
| Gewürz 0, Stein 0, nur Stein-Zufuhr 6/100          |            149 |  199 | Gewürz fehlt sofort                         |
| Gewürz 0, Stein 0, beides 6/100 (**Soll**)         |              — |    — | min 72 Einw. (96 %), Ende 75, Kasse +78 103 |

Folgen: **Beide** Güter sind nötig; fehlt eins, ist die Auflage in 1 bis 3 min verloren. Der Soll-Fluss `6 + 6` je 100 Ticks
hält die Stadt stabil (min 72 ist der Anlaufeffekt des Stein-/Glaslaufs, kein Einbruch).

### 2.3 Was der Spieler ergänzen muss (Schätzung aus Defs, nicht gebaut)

Kleinste Lösung: **eine** Fremdinsel mit Gewürz **und** Gebirge = **Felsbucht** (`sea.ts`: Gewürz, Gebirge+, 3 Plantagen- und
3 Steinbruch-Plätze, Seeweg 35 bis 40 Kacheln, ×2 beim Steinbruch):

| Posten                          | Rechnung                                       |     Geld |    Holz | Werkzeug |  Stein | Unterhalt/100 |
| ------------------------------- | ---------------------------------------------- | -------: | ------: | -------: | -----: | ------------: |
| Kontor II                       | `kontor2`                                      |      800 |      20 |        8 |     10 |            10 |
| 4 Gewürzplantagen               | je 200/12/3; Rate `100 ÷ 50 = 2,0` je Plantage |      800 |      48 |       12 |      0 |            60 |
| 2 Steinbrüche (Gebirge+, ×2)    | je 150/10/3; Rate `100 ÷ (60 ÷ 2) = 3,33`      |      300 |      20 |        6 |      0 |            20 |
| 2 Handelsschiffe                | `SHIP`: 1200/25/10                             |     2400 |      50 |       20 |      0 |            30 |
| Wege (Schätzung ca. 20 Kacheln) | `ROAD_COST` 5                                  |      100 |       0 |        0 |      0 |             0 |
| **Summe**                       |                                                | **4400** | **138** |   **46** | **10** |       **120** |

Materialwert zu Listenpreis (Holz 10, Werkzeug 40, Stein 15; Preis fest): `1380 + 1840 + 150 = 3370`. **Gesamt ca. 7800 Geld**
(Schätzung), das sind `7800 ÷ 510 ≈ 15` Netto-Blöcke zu 100 Ticks = **rund 1500 Ticks (2,5 min)** des Referenz-Nettos. Geld
ist also **nicht** der Engpass.

Tragende Engpässe in dieser Reihenfolge:

1. **Schiffskapazität.** Ein Schiff trägt 50 Stück; zwei Güter je Richtung teilen sich 25/25. Umlauf `U = 2 × d × 10` Ticks
   (`d` = 35…40 Kacheln, `SHIP_TICKS_PER_SEA_TILE` = 10), ohne Ladezeit: 700…800. Zwei Schiffe liefern je Gut
   `2 × 25 ÷ U × 100 = 7,1 … 6,25` je 100 Ticks gegen Bedarf 6: **Reserve +19 % bis +4 %**. Ein drittes Schiff (1200 Geld)
   gibt Luft (9,4…10,7).
2. **Gewürz-Plätze.** Bedarf `0,1 × Kaufleute`; 60 Kaufleute = 6,0 = genau 3 Plantagen (0 % Reserve). 4 Plantagen = 8,0 (+33 %)
   brauchen einen vierten Platz (Felsbucht nennt 3; ein Platz nach `min: 4 Gras im Radius 2` ist nicht belegt (Schätzung)).
   Sonst Möweninsel (2) oder Weidenau (6) mit eigenem Kontor und Schiff.
3. **Sturm** (`stormAffected`): Plantagen arbeiten im Sturm mit halber Leistung, Defizit je Sturm `1,5 × 8 = 12` Gewürz,
   Lager 100 trägt das.

Skalierung: Bedarf Gewürz + Stein `= 0,2 × Kaufleute` je 100 Ticks (Stein 1 je Glas; Gewürz 0,1). Vier Schiffe tragen höchstens
`4 × 50 ÷ 650 × 100 ≈ 30,8` je 100 Ticks (Umlauf Mittel 650). Daraus `K_max = 30,8 ÷ 0,2 ≈ 154 Kaufleute` bei vollem Import
(Schätzung). **Darüber ist A1 mit dieser Logistik nicht schaffbar** (Gewürz-Plätze insgesamt 11 → höchstens 220 Kaufleute).
Hat die Heimat Gebirge, entfällt der Steinanteil, dann `K_max ≈ 308`.

### 2.4 Bilanz je Einwohner unter A1 mit Plan 2.3 (gerechnet)

Zukauf `330` entfällt, Unterhalt `690 + 120 = 810`: Netto `1530 − 810 = +720` (+210 gegen Referenz), je Einwohner `9,6` statt
`6,8`. **A1 ist keine Geldsenke**, sie verlagert Zukauf in Betriebe und Schiffe (Senke Unterhalt 120, Quelle +330 gespart).

**Urteil A1:** schaffbar ja; trivial nein (ohne Vorbereitung Scheitern bei Tick 150, mit Ausbau 10 Gebäude + 2 Schiffe);
Engpass Logistik (Schiffe, Gewürz-Plätze, zwei Güter nötig). Ein Spieler, der das Gewürz-Ziel (80 Kaufleute) schon über
Plantagen und Schiff versorgt, braucht nur den Stein: dann leichter. Das ist gewollt (Prüfung dessen, was er gebaut hat).

## 3 A2 «Genügsam» (c)

Gemessen: 9000 Ticks, Reglerstufen 1 bis 3 «niedrig» (`setTaxLevel(w,'low')`; Kaufleute bleiben «normal», `taxTarget`),
Zukauf wie Controller, Krisen aus.

| Regler                                   | Kasse Start | Kasse Ende | Δ in 9000 | min Kasse | Einwohner Ende |
| ---------------------------------------- | ----------: | ---------: | --------: | --------: | -------------: |
| alle «normal»                            |        2775 |     48 675 |   +45 900 |      2454 |             75 |
| Stufe 1 bis 3 «niedrig», Kaufl. «normal» |        2775 |     43 005 |   +40 230 |      2454 |             75 |

Rechnung: nur das eine Bürgerhaus ist betroffen, `15 × 14 × 0,3 = 63` je 100 Ticks, `63 × 90 = 5670` Verlust (= Messwert
45 900 − 40 230). Netto je Einwohner `6,8 → 5,96`. Kaufleute (80 % der Stadt) haben **kein** «niedrig» → die Auflage trifft
sie nicht. Selbst eine reine Bürgerstadt mit 75 Einw. (Steuer `75 × 9,8 = 735` gegen Unterhalt ca. 585 ohne Glashütte und
Bad) bliebe im Plus (+150) (Schätzung).

**Urteil A2:** schaffbar ja; trivial **ja** (Kasse nie unter 2454, kein Engpass). **Streichen.** Der Engpass wäre Geld; im
Spätspiel ist Geld Überschuss.

Ersatz (optional, nur Rechnung, nicht gemessen): **A2' «Wachstum»**, E ≥ 120 % E0 am Ende der 9000 Ticks. Tragender
Engpass sind Ketten und Platz, nicht Geld: ein zusätzliches Kaufmannshaus (+20 Einw.) braucht 4 Fischer (`10 ÷ 2,5`),
2 Weber + 2 Schäfer, 2 Brenner + 2 Zuckerrohr, 1 Glashütte, 0,4 Plantage = ca. 13 Gebäude (Schätzung). Risiko: Das Ziel
hängt an der Bauplatzzahl der Heimat und an A1-Logistik; ohne Messung nicht freigeben.

## 4 Krisenrechnung (d, Grundlage)

`tickCrises` startet jede `P` Ticks eine Krise, die eine laufende **überschreibt**. Fenster (`crisisWindow`): Brand 200,
Boom 300, Sturm **500** (200 Warnung + 300 Wirkung, wirkt ab Start+201). Bei `P = 600` läuft nie eine Krise in den
nächsten Start (max. 500). Bei `P = 300` überschreibt der nächste Start jeden Sturm nach 300 Ticks, **bevor** er wirkt
(Wirkfenster wäre bis Start+500): ohne Ausfall-Regel sinkt die Sturmzeit unter die Basis.

Reine Rechnung über `rollCrisis` (Seeds 1…2000, 9000 Ticks, erster Start nach einer Periode):

| Periode / Gewichte (F/S/B) | Regel                           | Krisen | Brände | Stürme | Booms | Sturmzeit | Anteil |
| -------------------------- | ------------------------------- | -----: | -----: | -----: | ----: | --------: | -----: |
| 600 / 50/25/25 (Basis)     | —                               |   15,0 |    7,4 |    3,7 |   3,9 |       955 | 10,6 % |
| 300 / 40/30/30             | **ohne** Ausfall (überschreibt) |   30,0 |   11,9 |    8,9 |   9,2 |       673 |  7,5 % |
| 300 / 40/30/30             | **mit** Ausfall                 |   22,5 |    9,0 |    6,7 |   6,8 |      2009 | 22,3 % |
| 300 / 40/40/20             | mit Ausfall                     |   21,6 |    8,5 |    8,6 |   4,5 |      2399 | 26,7 % |
| 500 / 40/30/30             | nicht nötig (Fenster 500 ≤ P)   |   18,0 |    7,1 |    5,4 |   5,5 |      1482 | 16,5 % |
| 500 / 40/40/20             | nicht nötig                     |   18,0 |    7,1 |    7,2 |   3,7 |      1985 | 22,1 % |

Formel (Markov, Sturm blockiert den nächsten Start): mittlerer Abstand `P × (1 + q)` mit `q` = Sturmanteil; Krisen
`= 9000 ÷ (P (1+q))`; `P = 300`, `q = 0,3`: `9000 ÷ 390 = 23,1` (Messwert Seeds 1…2000: 22,5; Seeds 1…16: Sturm 5,4, also
Stichprobenrauschen bei kleinen Seeds, nicht ungewöhnlich).

**Die Ausfall-Regel ist nötig** (Befund des Leads bestätigt) und lässt `P = 600` bitgleich (Fenster ≤ 500 < 600; nur Stürme
reichen über die Periode 300 hinaus, Brand 200 und Boom 300 enden vor dem nächsten Start, weil das Ende vor dem Start geprüft
wird). **Alternative `P = 500`** braucht keine neue Regel, liefert aber nur 16,5 % Sturm (Basis 10,6 %): zu wenig Unterschied.

## 5 A3 «Sturmjahr» (d)

### 5.1 Messung: Einwohner unter Krisen (je 16 Seeds, 9000 Ticks, Gewürz/Stein zugekauft)

«Vorbereitet» = Lager Nahrung/Stoff/Rum/Wolle/Zucker/Holz auf 100 **und** 3 Feuerwachen (greedy neben den ungeschützten
brennbaren Gebäuden; Deckung 73 % der Brandtreffer). «Min» = niedrigster Stand der Einwohner im Lauf gegen E0 = 75.

| Szenario                                    |   min | Seeds < 90 % | Seeds < 85 % | Ø Brandkosten | Ø Brände | Ø Stürme | Ø Sturmzeit |
| ------------------------------------------- | ----: | -----------: | -----------: | ------------: | -------: | -------: | ----------: |
| Basis 600, unvorbereitet (= Normalspiel K') | 0,787 |      11 / 16 |      10 / 16 |          1469 |      7,8 |      3,2 |         934 |
| Basis 600, Lager 100 + Wachen               | 0,947 |       0 / 16 |       0 / 16 |           306 |      7,8 |      3,2 |         934 |
| Sturmjahr 300 40/30/30, unvorbereitet       | 0,787 |      13 / 16 |      13 / 16 |          1903 |     10,4 |      5,6 |        1588 |
| Sturmjahr 300 40/30/30, Lager 100 + Wachen  | 0,947 |       0 / 16 |       0 / 16 |           431 |     10,4 |      5,6 |        1588 |
| Periode 500 40/30/30, unvorbereitet         | 0,733 |      11 / 16 |      11 / 16 |          1478 |      7,9 |      4,0 |        1140 |
| Sturmjahr 300 0/70/30, Lager + Wachen       | 0,933 |       0 / 16 |       0 / 16 |             0 |        0 |     12,3 |        3469 |

(Ø Sturmzeit der 16 Seeds liegt unter der 2000-Seed-Rechnung aus Abschnitt 4, weil Seeds 1…16 wenig Stürme ziehen.)

### 5.2 Befunde

1. **Nicht der Sturm trägt A3, sondern die Feuerwache.** Die Einbrüche auf 0,79 (−16 Einw. = −21 %) stammen aus Bränden auf
   **Kapelle, Schule oder Bad** (12 Seeds untersucht: Kapelle/Schule/Bad brennt ⇒ 0,79 bis 0,84; nur Produktionsbrände ⇒
   0,92 bis 0,95). Der Dienst fällt 200 Ticks aus, alle Häuser der Stufe schrumpfen, die Erholung (+1 je Haus und 50 Ticks)
   dauert 800 Ticks. Mit Wachen auf den Dienstgebäuden: kein Seed unter 0,933.
2. **Der Sturm kostet höchstens 7 Einwohner.** Auch mit 41 % Sturmzeit (0/70/30, 12,3 Stürme) fällt die Stadt nur auf
   0,907 bis 0,947. Nahrung geht in jedem Lauf auf 0 (Erzeugung = Verbrauch, kein Puffer), aber das Schrumpfen je Haus ist
   an die 50-Ticks-Takte gebunden und die halbe Leistung deckt einen Teil.
3. **Lager 100 hilft nicht**: Läufe «nur Lager 100» liefern dieselben Zahlen wie «unvorbereitet» (Basis 0,787; Sturmjahr 0,787, 13 von 16 unter 90 %), «nur 3 Wachen» dieselben wie «Lager + Wachen» (Basis 0,947; Sturmjahr 0,933). Der Einbruch kommt aus den Diensten. Ohne Krisen: 1,000 (16 Seeds).

### 5.3 Sturmdefizit gegen Lagerpuffer (Rechnung)

Defizit je Sturm `D = 0,5 × P × 3 = 1,5 × P` (300 Ticks halbe Leistung), Puffer `B = STORAGE_CAP = 100`, Stürme ohne Erholung
`B ÷ D`:

Nahrung (P 37,5): D 56,3, Puffer reicht für 1,8 Stürme. Wolle und Zucker (P 16): D 24, 4,2 Stürme. Holz (P 6,67): D 10, 10 Stürme.

Zwei Stürme in Folge (Lücke 300 Ticks, Erholung nur mit Überkapazität `m`: `3 × m × V`) leeren die Nahrung. Der Defizit
trifft aber nur wenige Einwohner (5.2 Nr. 2).

### 5.4 Brandkosten (Messwert, 2019 Brandwürfe auf dem Referenzstand)

| Zustand                 | Ø Kosten je Brand | Fehlwurf | geschützt | Brände in 9000 (Basis 7,4; Sturmjahr 9,0) |      Kosten in 9000 |
| ----------------------- | ----------------: | -------: | --------: | ----------------------------------------- | ------------------: |
| ohne Feuerwache         |        191,7 Geld |      2 % |       0 % | 9,0                                       |            ca. 1730 |
| 3 Wachen (73 % Deckung) |         41,5 Geld |      2 % |      73 % | 9,0                                       | ca. 375 (Lauf: 431) |
| volle Deckung           |                 0 |        – |     100 % | 9,0                                       |                   0 |

Feuerwache: 150 Geld, 10 Holz, 2 Werkzeug (`firestation`), Unterhalt 10 je 100 Ticks; 3 Stück ca. 990 Geld-Wert, 30 Unterhalt.
Brandkosten ohne Wache = 3,8 % des Netto (45 900): **keine Geldsenke**, nur der Dienstausfall wirkt.

**Urteil A3:** schaffbar ja; trivial **ja** (3 bis 4 Feuerwachen, ca. 1000 Geld, schon in der Frühphase üblich); der Sturm
trägt nichts. Mit dem Kriterium «Einwohner ≥ X % E0» scheitert A3 nie am Sturm, nur am fehlenden Brandschutz, und der
Brandschutz ist auch in Basis 600 nötig. **Empfehlung: A3 nicht in S; in M nur mit neuem Kriterium**, das den Sturm misst
(z. B. «Nahrungslager der Heimat nie 0»: gemessen 16 von 16 Seeds verletzt ohne Überkapazität, 14 von 16 mit emulierten +20 %,
also tragend; ob echte Überkapazität es besteht, braucht einen eigenen Lauf mit gebauten Fischern). Ausfall-Regel und 300er-Periode dann wie in Abschnitt 4; Gewichte 40/40/20
(Boom ist im Spätspiel wertlos: Sturmzeit 26,7 % statt 22,3 %).

## 6 Schwelle (e)

Im Normalspiel ohne Auflage (K'-Referenz, Krisen normal, 16 Seeds): **11 von 16 Seeds fallen unter 90 %, 10 unter 85 %,
Minimum 78,7 %** (Brand auf Dienstgebäude, Abschnitt 5.2); bei Periode 500 sogar 73,3 % (zwei Dienstbrände hintereinander).
Mit 3 Wachen: 0 von 16, Minimum 94,7 %.

| Schwelle | Normalspiel unvorbereitet (Seeds < Schwelle) | A1-Passivlauf Scheitern (Tick) | A1 ohne Stein (Tick) |
| -------: | -------------------------------------------: | -----------------------------: | -------------------: |
|     90 % |                                      11 / 16 |                            150 |                  599 |
|     85 % |                                      10 / 16 |                            199 |                  649 |
|     75 % |                 0 / 16 (Periode 500: 1 / 16) |                          ≈ 312 |    ≈ 790 (Schätzung) |
|     70 % |                                       0 / 16 |                          ≈ 375 |    ≈ 850 (Schätzung) |

**Empfehlung 70 %.** Die Schwelle verschiebt das Scheitern von A1 nur um Sekunden (225 Ticks = 22 s), reisst aber nicht an
einem einzelnen Dienstbrand. Der Preis: Wer Dienstgebäude ohne Wache hat, besteht A1 auch mit einem Brandschaden, was die
Auflage nicht prüft. Zusätzlich im Startdialog der Hinweis «Feuerwachen empfohlen» (Texte liegen beim Design-Lead).
Das Kriterium «Kasse < 0» ist **redundant**: Im Normalspiel nie unter 2454, bei Kollaps erst ab Tick ≈ 1300, also nach
dem Einwohner-Kriterium; es bestraft nur einen Start mit Minus. **Streichen**, dafür Startbedingung «Kasse ≥ 0».

## 7 Entartete Strategien (f)

| Auflage | Strategie                             | Wirkung (Messwert / Schätzung)                                                                                                                                                             | Gegenmittel                                                                                                           |
| ------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| A1      | Lager vor dem Start per Zukauf füllen | Heimat Gewürz 100 + Stein 100 trägt **1799 Ticks = 3,0 min = 20 %** (Messwert). Mit Fremdlager 100 und Schiff 50: ca. 250 Gewürz ⇒ ca. 4100 Ticks, 46 % (Schätzung). Rest bleibt ungedeckt | keines nötig: `STORAGE_CAP` 100 je Insel und Gut deckelt; ein Lager allein besteht A1 nicht                           |
| A1      | Wohnhäuser nach dem Start abreissen   | Schwelle 70 % erlaubt −30 % Einwohner. Bei ≥ 5 Kaufmannshäusern 1 Haus weg = −20 % Bedarf (Schätzung)                                                                                      | **Abriss von Wohnhäusern während der Auflage sperren** (`reason`) oder Schwelle 80 % (dann Normalspiel-Risiko steigt) |
| A1      | Aufträge als Warenquelle              | Aufträge zahlen nur Geld (`orders.ts`: `world.money += reward`)                                                                                                                            | nötig nicht                                                                                                           |
| A1      | sehr grosse Stadt                     | über ca. 154 Kaufleute nicht schaffbar (2.3)                                                                                                                                               | Start nur bei Kaufleute ≤ `TRIAL_MAX_MERCHANTS` oder A1 sperrt nur Gewürz und Stein (Ruling)                          |
| A3      | Krisenstufe «aus» vor dem Start       | wirkt nicht, wenn die Auflage eigene Periode und Gewichte setzt, unabhängig von `world.crisisLevel`                                                                                        | Auflage überschreibt die Stufe vollständig                                                                            |
| A3      | 3 Feuerwachen bauen                   | senkt Brandkosten von 1903 auf 431 und hebt das Minimum von 0,787 auf 0,947                                                                                                                | gewollt, falls Brandschutz Prüfgegenstand sein soll; sonst A3 streichen                                               |
| A3      | Überkapazität statt Lager             | Lager 100 wirkungslos (5.1)                                                                                                                                                                | –                                                                                                                     |

## 8 Wertetabelle für `src/sim/defs/trials.ts` (g)

Neue Datei (Vorschlag, nichts in `src/` geändert). Alle Werte Zahlen, keine Logik.

| Konstante                      | Wert                                | Begründung                                                                                                               |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `TRIAL_DURATION_TICKS`         | 9000                                | 15 min Sim-Zeit; A1 trägt ein volles Lager nur 20 %, Rest muss Betrieb liefern                                           |
| `TRIAL_MIN_MERCHANTS`          | `WIN_MERCHANTS` (60)                | aus `tiers.ts` lesen, kein zweiter Wert                                                                                  |
| `TRIAL_MAX_MERCHANTS_A1`       | 150 (Schätzung 154)                 | Schiffskapazität 4 × 50 je Umlauf 650; darüber unschaffbar. Alternativ Ruling «A1 sperrt nur Gewürz und Stein»           |
| `TRIAL_FAIL_POP_PCT`           | **70** (Entwurf 90)                 | 11 von 16 Seeds im Normalspiel unter 90 %; 70 % reisst nie (min 73,3 %); A1-Scheitern nur +225 Ticks später              |
| `TRIAL_FAIL_MONEY`             | entfällt (Entwurf: Kasse < 0)       | redundant (Abschnitt 6); stattdessen Startbedingung Kasse ≥ 0                                                            |
| `TRIAL_LOCK_DEMOLISH_HOUSE`    | `true` (A1)                         | verhindert Trimmen der Einwohnerzahl nach dem Start                                                                      |
| `TRIAL_STORM_PERIOD`           | 300 (nur falls A3 bleibt)           | 22,5 Krisen, 22 % Sturmzeit; 500 ginge ohne Ausfall-Regel, liefert aber nur 16,5 %                                       |
| `TRIAL_STORM_WEIGHTS`          | `{ fire: 40, storm: 40, boom: 20 }` | Boom im Spätspiel wertlos; Sturmzeit 26,7 % gegen 22,3 % bei 40/30/30                                                    |
| Regel `skipPeriodDuringCrisis` | in `tickCrises` nur für Auflage A3  | bei Periode 600 nie wirksam (Fenster ≤ 500), Basis bleibt bitgleich; Balancing-Test (`balance-crises.test.ts`) unberührt |

Auswirkung auf den Balancing-Test: Die Auflagen sind additiv (neue Datei, Flags in der Welt); ohne aktive Auflage ändert sich
kein Wert in `src/sim/defs/`. Ein Ruling ist nötig für (1) Schwelle 70 % statt 90 %, (2) Abriss-Sperre, (3) Ausfall-Regel in
`tickCrises` (nur falls A3 bleibt).

## 9 Empfehlung S gegen M und Entwurf für L0

- **Variante S (nur A1) empfohlen.** A1 ist die einzige Auflage, deren Engpass Ketten und Logistik ist; sie wird von keinem
  Geldfluss getragen und lässt zwei Ausbaupfade offen (Felsbucht-Kombi oder Gewürzinsel + Heimat-Stein).
- **Variante M** erst mit A2' und/oder A3' (neues Kriterium); beide sind bisher nur gerechnet, nicht gemessen.

Ruling-Entwurf für L0 (Format `<was> — <warum> — <Kosten bei Irrtum>`):

1. «Auflagen-Schwelle 70 % E0 statt 90 %» — im Normalspiel reissen 11 von 16 Seeds die 90 % durch einen Dienstbrand — Irrtum
   kostet: Auflage wird zu leicht (Scheitern ca. 22 s später), umkehrbar per Konstante.
2. «Abriss von Wohnhäusern während einer Auflage gesperrt» — sonst lässt sich der Bedarf um bis zu 30 % trimmen — Irrtum
   kostet einen Reason-Text und einen Test.
3. «A2 «Genügsam» gestrichen» — Kasse nie unter 2454, Δ −12 % bei einer Kaufmannsstadt — Irrtum kostet: verlorene
   Auflage, keine Balance-Folge.

## 10 Messgrenzen

- Gemessen nur der K'-arm-Stand (Heimat, 75 Einwohner); grössere Städte und Fremdinseln sind gerechnet.
- Der A1-Plan (2.3) ist nicht gebaut; gemessen sind nur der Sollfluss 6 + 6 und die Lagerdauer.
- Sturm-Überkapazität ist als Lager-Zuschlag emuliert; «volle Deckung» (Brandkosten 0) ist die Grenze, nicht gemessen.
- Krisenläufe: Seeds 1 bis 16 (Insel Seed 3 fest); 2000-Seed-Zahlen stammen aus `rollCrisis` allein.
