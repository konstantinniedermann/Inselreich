# Anhang 01 — Wirtschaft „Weite Welt" (Startwerte, Dominanzprüfung)

Brainstorming M12. Rechenweg wie Balancing-Spec 2026-09-30: je Einwohner pro 100 Ticks (10 s; × 6 = / min). **A** = Annahme, sonst hergeleitet.

## 1 Wertetabelle (vorgesehene Einträge in `src/sim/defs/`)

Datei kurz: `goods`, `tiers`, `buildings`, `unlocks` = bestehende Dateien, `sea` = neu (`src/sim/defs/sea.ts`).

| Eintrag                                  | Wert                   | Herleitung                               |
| ---------------------------------------- | ---------------------- | ---------------------------------------- |
| `goods` `GOODS.spice` (Arbeitsname)      | Kauf 40, Verkauf 12    | Kauf wie Rum; Verkauf 30 % (3.4)         |
| `goods` `GOODS.spice.order`              | keins (M12)            | Auftragspool unverändert (5)             |
| `goods` `START_STOCK.spice`              | 0                      | Bedarf erst ab Stufe 4                   |
| `tiers` `TIERS[4].needs.spice`           | 0.1                    | wie Glas: 1 Plantage je Haus (20 × 0.1)  |
| `tiers` `TIERS[4].tax`                   | 20 → **22**            | Zukauf bleibt über Bürgern (2)           |
| `buildings` `spicefarm.cost`             | 200 / 12 / 3 / 0       | Zuckerrohrplantage + ⅓ (Fremdinsel)      |
| `buildings` `spicefarm` cycle / upkeep   | 50 / 15                | 2 je 100 Ticks, 7.5 je Einheit (3.4)     |
| `buildings` `spicefarm.site`             | Gras r2 min4 + Gewürz  | Inselmerkmal ersetzt I-008               |
| `buildings` `kontor2.cost` (Heimatlager) | 800 / 20 / 8 / 10      | über Badehaus; Amortisation (2)          |
| `buildings` `kontor2` upkeep / Radius    | 10 (60/min) / 8        | wie Marktplatz                           |
| `sea` `SHIP.cost`                        | 1200 / 25 / 10 / 0     | Kauf am Heimatkontor                     |
| `sea` `SHIP.upkeep` / `SHIP.capacity`    | 15 (90/min) / 50       | 1 Schiff trägt 60 Kaufleute ab B (1b)    |
| `sea` `SHIP_MAX`                         | 4                      | Deckel Endlos-Lager (3.5)                |
| `sea` `SHIP_TICKS_PER_SEA_TILE`          | 10                     | **A**; `T = 10 × d`, ganzzahlig          |
| `sea` `ROUTE_GOODS_PER_DIRECTION`, R     | 2, R Standard 10       | Routenregel (3R)                         |
| `sea` `ISLANDS`                          | Tabelle 1b             | **A** Bänder; Lage per Seed im Band      |
| `unlocks` U6                             | `seafaring`, `kontor2` | Seefahrt mit Stufe 4 (lead-design, F-04) |
| `unlocks` U6                             | `spicefarm`, `spice`   | vor Stufe 4 kein Verbraucher, keine Farm |

**1b Inseln.** Schiffsdurchsatz `q = C × 100 / (2T)` je 100 Ticks; versorgte Kaufleute `M = q / 0.1 = 500 C / T`.

| Insel    | d     | T (Ticks) | Grösse  | Merkmale                         | q (C = 50) | M      |
| -------- | ----- | --------- | ------- | -------------------------------- | ---------- | ------ |
| A nah    | 25–30 | 250–300   | ≤ 24×24 | Gewürz, Platz für 2 Plantagen    | 10.0–8.3   | 100–83 |
| B mittel | 35–40 | 350–400   | ≤ 36×36 | Gewürz, Gebirge (Stein)          | 7.1–6.3    | 71–62  |
| C fern   | 55–65 | 550–650   | ≤ 48×48 | Gras, Wald, Gebirge, kein Gewürz | 4.5–3.8    | 45–38  |

Be- und Entladen 0 Ticks (**A**, YAGNI).

## 2 Bilanz je Einwohner (pro 100 Ticks)

Ketten wie heute: Nahrung 5 ÷ 5 = 1.0 · Stoff 25 × 0.2 ÷ 2 = 2.5 · Rum 30 × 0.2 ÷ 2 = 3.0 · Glas
(25 + 2 Stein × 6 + 2 Holz × 1.5) ÷ 20 = 2.0 (Steinbruch 10 ÷ 1.67 = 6 je Stein; Stein zugekauft 15 → 2.9).

| Stufe / Pfad                                   | Steuer | Ketten    | Gewürz | Netto              |
| ---------------------------------------------- | ------ | --------- | ------ | ------------------ |
| Pioniere / Siedler / Bürger (unverändert)      | 2/7/14 | 1/3.5/6.5 | —      | +1.0 / +3.5 / +7.5 |
| Kaufleute heute                                | 20     | 8.5       | —      | **+11.5**          |
| Kaufleute M12, Zukauf (0.1 × 40)               | 22     | 8.5       | 4.0    | **+9.5**           |
| Kaufleute M12, Route B (3 Plantagen, 1 Schiff) | 22     | 8.5       | 1.17   | **+12.3**          |
| Kaufleute M12, Insel A (2 Pl.) + Zukauf Rest   | 22     | 8.5       | 2.25   | **+11.3**          |

Gewürz Route B: (3 × 15 + Schiff 15 + Kontor 10) ÷ 60 = 1.17. A + Zukauf: (2 × 15 + 25 + 20 × 0.1 × 40) ÷ 60 = 2.25.
Mit Steuer 20 läge Zukauf bei 7.5 = Bürger; mit 22 lohnt Stufe 4 in jedem Pfad mehr.

**Endzustand-Beispiel** 60 Kaufleute, Dienste Kapelle 15 + Schule 25 + Bad 30 = 70:
heute 60 × 11.5 − 70 = **+620** · Zukauf 60 × 9.5 − 70 = **+500** · Route B 60 × 12.3 − 70 = **+670** je 100 Ticks.
Kein Pfad negativ; Route nur 8 % über heute.

**Route gegen Zukauf je Minute** (Fixkosten Route `F = (15 + 10) × 6 = 150/min`, Plantage 90/min = 12 Gewürz/min):

| Kaufleute | Zukauf / min | Route / min     | Ersparnis / min | Investition (Geld + Material) | Amortisation |
| --------- | ------------ | --------------- | --------------- | ----------------------------- | ------------ |
| 20        | 480          | 150 + 90 = 240  | 240             | 2250 + 1560 = 3810            | ≈ 16 min     |
| 60        | 1440         | 150 + 270 = 420 | 1020            | 2650 + 2040 = 4690            | ≈ 4.6 min    |

Break-even laufend: 25 ÷ (4 − 0.75) ≈ 8 Kaufleute. Ein Kaufmannshaus allein: Zukauf ist in normaler
Spiellänge besser; ab zwei bis drei Häusern lohnt die Route → echte Wahl, keine Pflicht.

## 3 Dominanz- und Randfallprüfung

1. **Route vs. Zukauf:** Zukauf +9.5, Route +12.3; Route erst ab ≈ 8 Kaufleuten und
   nach 5–16 min Amortisation besser → zwei lohnende Pfade, kein Gegenmittel nötig.
2. **Siedlung auf Fremdinsel vs. nur Plantage:** Siedlung braucht eigene Dienste (+70 fix) und
   Schiffe für 4 weitere Güter, also teurer → erlaubt, nicht dominant; Wert nur bei Platzmangel (C).
3. **Kauf-und-Verkauf zwischen Kontoren:** Preise überall gleich, Verkauf ≤ 45 % des Kaufs → kein
   Gewinn. **Sättigung je Gut global (Welt), nicht je Kontor**; sonst 4 × 10 Einheiten / 10 s zum
   Vollpreis.
4. **Exportfarm Gewürz:** Plantage 7.5 je Einheit, Verkauf 12 → +4.5 je Einheit; die Sättigung deckelt
   bei ≈ 10 Einheiten / 100 Ticks → ≤ 45 / 100 Ticks (Rum heute ≈ 30) → Verkauf 12 (30 %), Plantage erst ab U6.
5. **Schiff als Endlos-Lager:** höchstens 50 × `SHIP_MAX` 4 = 200 Einheiten, Unterhalt läuft, Ladung
   nicht verkaufbar → `SHIP_MAX` genügt.
6. **Abriss Kontor II, Schiff unterwegs:** Abriss gesperrt, solange eine Route es nutzt („Erst Route
   auflösen"); Route auflösen → Schiff fährt heim, entlädt bis 100, Rest verfällt mit Meldung.
7. **Leeres Quelllager:** Warten auf volle Ladung kann ewig dauern → **nie warten**, abfahren mit dem,
   was da ist (auch leer); Unterhalt ist je Zeit, eine Leerfahrt kostet nichts extra.
8. **Volles Ziellager:** Rest bleibt an Bord, wird bei der nächsten Ankunft zuerst geliefert; Laden
   füllt nur freie Ladung.
9. **Negatives Geld:** Gründen und Kaufen gesperrt (Regel heute), Route und Unterhalt laufen weiter.
   Fixkosten M12 25 + 15 je Plantage ≪ Steuer eines Kaufmannshauses (440) → kein Zwangsbankrott.
10. **Gleiches Gut in beiden Richtungen:** Kreisverkehr ohne Nutzen → Validierung, ein Gut je Route
    nur in einer Richtung.
11. **Sonderangebot Gewürz (I-006, −20 %):** 32 liegt über Verkauf 12 und Routenkosten (≈ 11.7 je
    Einheit) → Rabatt ≤ 20 % hält alle Spannen (Prämie 75 %, Verkauf ≤ 45 %).

**Routenregel (3R).** Reicht, mit drei Festlegungen: (a) bei Ankunft erst entladen, dann laden;
(b) bei zwei Gütern je Richtung erhält jedes zuerst `C / 2` = 25, Rest an das erste Gut der Liste;
(c) „liefere bis Ziellager 100" ist kein Parameter, sondern die Lagergrenze. Einziger Regler je Gut:
Reserve R (0–90 in Zehnern, Standard 10). Einfacher geht es nicht ohne Heimat-Aushungern: ohne R
räumt die Fahrt Heim → Insel das Heimlager leer. Routenschritt nach Produktion, vor Verbrauch und
Steuer, ohne RNG-Ziehung (**A**, für die Spec).

**Bauen auf Fremdinseln (A):** Waren aus dem Inselkontor, Geld gemeinsam; Handel an jedem Kontor
(Fall 3), erste Plantage also auch ohne Schiff (Zukauf 240).

## 4 Empfehlungen

- **Erz streichen (YAGNI):** je Werkzeug (Mine 7.5 + Schmiede 25) ÷ 1.25 = 26 gegen Werkzeugmacher
  (25 + 1.9) ÷ 1.25 = 21.5, dazu ein Schiff; Holz fehlt nie → nie die bessere Wahl. Gebirge auf
  Fremdinseln trägt Steinbrüche (Glas braucht Stein; zweites Gut der Gewürzroute).
- **Inseln: 2 Pflicht, 3 empfohlen.** A (nah, nur 40 Kaufleute) gegen B (teurer, voll) ist die Wahl;
  C (fern, Land ohne Gewürz) ist der Platz-Pfad und die erste Streichung bei Engpass.
- **Gewürz ohne Verarbeitung:** ein zweiter Betrieb brächte nur Fläche, keine Entscheidung.
- **I-004 Lagerhaus:** nicht in M12; „Lager je Insel" (100 je Gut je Kontor) deckt den räumlichen Teil.
- **I-006 Sonderangebot:** optional, nicht Kern; wenn, dann −20 %, ≤ 20 Einheiten, eigener RNG-Strom.
- **I-008 Standortgüte:** ersetzt durch Inselmerkmale; bleibt geparkt.

## 5 Risiken für die Balancing-Tests

- **`balance.test.ts` (niedrig):** Gewürz, Steuer 22 und Spicefarm (U6) wirken erst nach dem Sieg; auch
  Seefahrt und Kontor II hängen an U6 → Sieg 6750 erwartbar bitgleich. Bedingung: `spice` am Ende von
  `GOODS` anhängen (Reihenfolge `GOOD_IDS` stabil), kein Auftrag für Gewürz.
- **`balance-merchants.test.ts` (hoch):** Ohne Gewürz zahlen Kaufleute halbe Steuer und schrumpfen →
  Ziel 2 unerreichbar. Gegenmittel: Controller erhält `feedSpice` (Zukauf wie `feedGlassworks`) und
  kauft 1 Gewürz vor dem Aufstieg — Testhelfer-Erweiterung, keine Abschwächung.
- **Dito, Zeit:** Zukauf zählt nominal als Defizit → Aufstieg 3 → 4 wartet 600 statt 300 Ticks; dazu
  ≈ 2 Mehrkosten je Kaufmann / 100 Ticks. Neumessung von 11 200 / 320 nötig; Rand bis `MERCHANT_TICK_LIMIT`
  12 000 nur 800. Eskalation: Stufe 1 Steuer Kaufleute 24 (Zukauf
  = heute +11.5, kostenneutral); Stufe 2 Limit 13 000.
- **Save:** neues Gut, Inseln, Schiffe, Routen → Save-Version und Migration (`stock.spice = 0`,
  keine Inseln), Test mit altem Stand.

Ruling-Vorschlag: _Kaufleute brauchen Gewürz 0.1, Steuer 20 → 22, Merchant-Controller kauft Gewürz zu,
Baseline Ziel 2 und minMoneyAfterWin neu gemessen — Zukauf-Pfad muss über Bürgern bleiben und der
Controller nutzt keine Inseln — bei Irrtum Steuer 24 bzw. Limit 13 000, je eine Neumessung._

Ausserhalb Scope (an lead-design): Unversorgte Pionierhäuser zahlen 1 / 100 Ticks bei 80 Baukosten
(Amortisation ≈ 13 min); auf grossen Fremdinseln wird Häuserstreuen ohne Ware zur Steuerfarm.
