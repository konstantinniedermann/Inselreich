# Anhang 01 · Werte und Messung M14-E1 Inselcharakter

design-economy-designer, Paket design-m14-e1; Grundlage Brainstorming M14 (B), Anhang B.1–B.3, Spätspiel A.1–A.3.
1 min = 600 Ticks. **[M]** gemessen, **[R]** gerechnet.

## Kurzfazit

1. **Befund des Leads bestätigt [M]:** 300 von 300 Heimatkarten haben Gebirge (≥ 12 Kacheln), mindestens 15
   Steinbruch-Plätze. «Gebirge+ = Steinbruch ×2» bringt gegen Heimat-Steinbrüche −96 … +108 / min, also ≈ 0.
2. **Umbinden:** Gebirge+ = **Steinbruch und Glashütte ×2** (V-B, ohne neues Gut): +333 / min in (b), +354 / min in
   (c) = **+0,74 je Einwohner und 100 Ticks**.
3. **Fruchtbar** (Zuckerrohr, Schäferei ×2) ist ein **Platz-Trait**: Geldwert +107 … +155 / min nur auf einer
   geteilten Gewürzroute, eigene Route ≈ 0. Darum C **mit Gewürz** und **nah (30–35)** statt «fern»: Ab d ≈ 42 wird
   jedes eigene Schiff negativ.
4. **Bitgleich [M]:** `quarries` 1 → 3 ändert B nie (0 / 300); C am Ende von `ISLANDS` lässt A und B bitgleich.
5. **C kann werfen [M]:** auch im besten Band 1 / 1000 Seeds (Seed 963), «fern» 45–50: 24 / 1000. Für lead-tech gilt
   die Auflage: C braucht eine Ersatzregel, die nie wirft.

## A Messung

**Skript:** temporär `tests/sim/_scratch-m14.test.ts` plus eine Kopie von `islands.ts` im Scratchpad mit Zählern für
Ersatzform/-lage und austauschbarem `ISLANDS` (Gegenprobe: 300 / 300 gleich wie das Original). Seeds 1…300 bzw.
1…1000, gepinnte Seeds 1, 3, 7, 13, 42 enthalten. Beide Dateien gelöscht, `src/` unverändert.

### A1 Heimat [M]

| Grösse                                                   | Min | p10 | Median | Max |
| -------------------------------------------------------- | --- | --- | ------ | --- |
| Gebirgskacheln                                           | 15  | 61  | 202    | 571 |
| Steinbruch-Plätze (`canPlace(w,'quarry',x,y,0)`, frisch) | 15  | 32  | 73     | 123 |

300 Seeds (275 Karten): 100 % mit Gebirge, keiner unter 5 Plätzen. **Die Heimat reicht immer für 5 Steinbrüche** (48 Stein / min in (c) = 4,8 Brüche auf Stufe 1).

### A2 Felsbucht B [M]

- Plätze, auf denen `quarry` nach dem Kontor gültig ist: Min 13, p10 18, Median 36, Max 62; ≥ 3: 300 / 300.
- `quarries` 2…5 statt 1: Lage, Anker und Gelände von B ändern sich in **0 / 300** Seeds (auch gepinnte), keine
  Ersatzform; `buildShape` scheitert bei ≥ 13 Plätzen nie am Steinbruch. **`quarries: 3` ist bitgleich.**

### A3 Dritte Insel C [M]

C als drittes Element an `ISLANDS` angehängt, Garantie `plantations` = Regel `PLANTATION_SITE`. Variante «Cg» =
Gebirge wird wie bei A zu Gras (`clipRim`).

| Grösse | Band  | Seeds | wirft      | Ersatzlage | Ersatzform | A/B anders¹ | d A–C Median (p10) |
| ------ | ----- | ----- | ---------- | ---------- | ---------- | ----------- | ------------------ |
| 24     | 25–30 | 300   | 3 (1,0 %)  | 4          | 0          | 0           | 46 (16)            |
| 24     | 28–33 | 1000  | 1 (0,1 %)  | 19         | 0          | –           | 51 (17)            |
| 24     | 30–35 | 1000  | 1 (0,1 %)  | 9          | 0          | 0           | 52 (18)            |
| 24     | 35–40 | 1000  | 1 (0,1 %)  | 7          | 0          | 0           | 58 (18)            |
| 24     | 40–45 | 1000  | 12 (1,2 %) | 11         | 0          | 0           | 61 (18)            |
| 24     | 45–50 | 1000  | 24 (2,4 %) | 14         | 0          | 0           | 60 (19)            |
| 27     | 30–35 | 1000  | 2 (0,2 %)  | 11         | 0          | –           | 53 (18)            |
| 30     | 30–35 | 300   | 5 (1,7 %)  | 7          | 0          | 0           | 55 (17)            |
| 30     | 45–50 | 300   | 22 (7,3 %) | 2          | 0          | 0           | 69 (19)            |

- ¹ A/B-Vergleich über Seeds 1…300 (in den 300er-Läufen dieser Bänder, auch mit Gebirge statt Cg); «–» nicht geprüft.
  Über 1…300 warfen im Band 30–35 (Grösse 24) 0 Seeds, 35–40: 1, 40–45: 3, 45–50: 9.
- Kein gepinnter Seed wirft. Geworfen wird in `place` (keine gültige Lage), nie in der Form.
- **Garantie-Plätze ohne Ersatzform (Grösse 24, 30–35, 1000 Seeds):** Garantie 4, 6, 8 und 10 erreicht jede
  Insel ohne Ersatzform (`makeShape` zieht bis zu 50 Formen). Ohne Garantie passen gierig Median 21, p10 9, Min 4.
- Gras (Grösse 24): Median 102 (mit Gebirge) bzw. 130 (Cg). Bei ≈ 6 % der Seeds liegt C nahe bei A (d A–C < 15).

## B Rechnung

**Bedarf je min (Spätspiel-Anhang A.1, `tiers.ts` needs × Einwohner × 6):** (a) 50 Bürger: Rum 60, Stoff 60.
(b) 60 Kaufleute + 15 Bürger: Glas 36, Gewürz 36, Rum 90, Stoff 90. (c) 80 Kaufleute: Glas 48, Gewürz 48, Rum 96,
Stoff 96; Glas braucht 1 Stein + 1 Holz je Stück.

**Stückkosten = Unterhalt je min ÷ Ausstoss je min** (Zyklus aus `buildings.ts` / `levels.ts`):

| Betrieb          | Stufe 1 Heimat  | Trait ×2 (Zyklus × 0,5) | Stufe 3 Heimat  | Stufe 3 + Trait |
| ---------------- | --------------- | ----------------------- | --------------- | --------------- |
| Steinbruch       | 60 ÷ 10 = 6,0   | 60 ÷ 20 = 3,0           | 102 ÷ 25 = 4,08 | 102 ÷ 50 = 2,04 |
| Glashütte (nur)  | 150 ÷ 12 = 12,5 | 150 ÷ 24 = 6,25         | 258 ÷ 30 = 8,6  | 258 ÷ 60 = 4,3  |
| Holzfäller       | 30 ÷ 20 = 1,5   | –                       | 54 ÷ 50 = 1,08  | –               |
| Rohr / Schäferei | 60 ÷ 12 = 5,0   | 60 ÷ 24 = 2,5           | 102 ÷ 30 = 3,4  | 102 ÷ 60 = 1,7  |

Glas ab Heimat 12,5 + 6,0 + 1,5 = **20,0**; Glas auf B mit V-B 6,25 + 3,0 + 1,5 = **10,75**.

**Transport:** Rundreise 2 · d · 10 Ticks, Ladung 50 → Durchsatz T(d) = 1500 ÷ d Stück / min je Schiff, Kosten
90 ÷ T = **0,06 · d je Stück**. A (d 27,5) 54,5 / min; C (33) 45,5 / min; B (37,5) 40 / min. Kontor II 60 / min.
Liegezeit wird wie im Brainstorming nicht gerechnet. Referenz wie Spätspiel (c): 2 Gewürzschiffe.

### B1 Gebirge+

**Stein ×2 gegen Heimat-Steinbrüche [R]:** Ersparnis 48 × (6,0 − 3,0) = 144 / min in (c).

- Auf der Gewürzroute von B (2 Schiffe, 80 / min, Gewürz 48): Stein 48 braucht +1 Schiff → 144 − 90 = **+54**;
  in (b) 36 × 3 = 108, passt in die 2 Schiffe → **+108**.
- Eigene Route: 2 Schiffe + Kontor → 144 − 240 = **−96**. Obergrenze bei beliebigem Faktor: (6,0 − 2,25) × 48 = 180.
- Die +450 des Brainstormings gelten nur gegen den Kontor-Zukauf (720 / min), den es nach A1 nie braucht.
  **Gebirge+ als reiner Stein-Trait ist eine tote Option.**

**V-B Steinbruch und Glashütte ×2 auf B (empfohlen) [R]:** Glas entsteht auf B und fährt heim; dasselbe Volumen wie
Stein (1 : 1). Holz vom Holzfäller auf B oder auf der leeren Hinfahrt Heimat → B (Grenzkosten 0). Ersparnis 20,0 −
10,75 = 9,25 je Glas.

| Phase | Glas / min | Ersparnis | Zusatzschiffe (Route B mit Gewürz) | Netto / min | je Einw. und 100 Ticks |
| ----- | ---------- | --------- | ---------------------------------- | ----------- | ---------------------- |
| (a)   | 0          | 0         | –                                  | 0           | 0                      |
| (b)   | 36         | 333       | 0 (36 + 36 ≤ 80)                   | **+333**    | **+0,74**              |
| (c)   | 48         | 444       | 1 (96 ≤ 120)                       | **+354**    | **+0,74**              |

Gewürz von A, Glas allein von B (eigene Schiffe und Kontor): (b) 333 − 150 = +183 (+0,41), (c) 444 − 240 = +204
(+0,43). Dazu frei in der Heimat: 4 Glashütten (16 Kacheln), 5 Steinbrüche, 3 Holzfäller (≈ 24 Kacheln).

**V-C (eigene, ohne neues Gut):** nur Glashütte ×2, Steinbruch normal: Glas auf B 6,25 + 6,0 + 1,5 = 13,75 →
(c) 48 × 6,25 − 90 = **+210**. Halber Wert von V-B, ein Trait-Betrieb weniger zu erklären. Rückfall, falls L0
«Gebirge» nicht mit Glas verbinden will.

**V-D (neues Gut, qualitativ):** Lager-, `sellPct`- und Save-Schlüssel je Insel, Migration, Sprite, UI; braucht
einen Dauerverbraucher (sonst tot wie Erz). Grösser als E1; nur, wenn V-B im Playtest nicht trägt.

### B2 Fruchtbar auf C

Ersparnis vor Transport 5,0 − 2,5 = 2,5 je Rohr oder Wolle. Eigenes Schiff: T(d) · 2,5 − 90 = 3750 ÷ d − 90.

| Band (d)     | eigenes Schiff | Restladung 2 Gewürzschiffe in (c) | Wert geteilt (c) | Wert geteilt (b) |
| ------------ | -------------- | --------------------------------- | ---------------- | ---------------- |
| 25–30 (27,5) | +46            | 61                                | +153             | +183             |
| 30–35 (33)   | +24            | 43                                | **+107** (+0,22) | **+137** (+0,30) |
| 35–40 (37,5) | +10            | 32                                | +80              | +110             |
| 45–50 (47,5) | **−11**        | 15                                | +38              | +68              |

- Eigene Route ohne Gewürz in (c), 3 Schiffe: 3 × 24 − 60 (Kontor) = **+11 ≈ 0**; in (a) (kein Gewürzbedarf)
  Rohr und Wolle 120 / min: −30 (−0,10 je Einw.). **Ohne Gewürz auf C ist fruchtbar tot.**
- Mit Gewürz auf C und 4 Schiffen: 182 − 48 = 134 Rohr / Wolle → +335 − 180 = **+155** (+0,32), 11 Farmen
  (≈ 44 Kacheln plus Weide) frei.
- Vergleich der Gewürzinsel: A mit 1 Schiff (u 88 %) kostet 150 / min; C mit 2 Schiffen 240 − 107 = 133 / min. C ist
  die bessere Gewürzinsel, sobald man zwei Schiffe fährt; A bleibt der billigste Einstieg.
- **Empfehlung C:** Band **30–35**, Grösse **24**, Traits **Gewürz und fruchtbar**, Garantie **6** Plätze
  (Gewürz 2 + Rohr / Wolle 4), Gebirge zu Gras wie A. Das «fern» aus dem Brainstorming verwerfe ich: Es macht
  fruchtbar negativ und wirft 24-mal öfter (A3).
- «fruchtbar+» (auch Brennerei ×2): Rum auf C 7,5 statt 15,0, Muster P2 → 1860 > P1 1674; C dominiert, nicht
  empfohlen.

### B3 Echte Wahl (SHIP_MAX 4, Phase c, Stufe 1)

Wert gegen Gewürz-Zukauf (48 × 40) und Heimat-Erzeugung; Gewürzplantage 90 ÷ 12 = 7,5 je Stück → 1560 / min.

| Muster                             | Schiffe | Invest (Kontor + Schiffe) | Netto / min | Heimat frei |
| ---------------------------------- | ------- | ------------------------- | ----------- | ----------- |
| P1 Felsbucht: Gewürz + Glas        | 3       | 800 + 3600                | **1674**    | ≈ 24 Kach.  |
| P2 Weidenau: Gewürz + Rohr / Wolle | 4       | 800 + 4800                | 1475        | ≈ 44 Kach.  |
| P3 Möweninsel: nur Gewürz          | 1       | 800 + 1200                | 1410        | –           |
| P5 A Gewürz, B Glas, C Rohr        | 4       | 2400 + 4800               | 1578        | ≈ 39 Kach.  |

Keine Kombination gewinnt auf allen Achsen: P1 bringt das meiste Geld, P2 den meisten Platz und bindet alle Schiffe
(damit wird E3 Routenrisiko eine Wahl), P3 kostet am wenigsten Einstieg (P1 holt die +2400 in ≈ 9 min herein).
**Mindestens zwei sinnvolle Muster: P1 und P2.**

### B4 Trait × Ausbaustufe

- Stapel: Stufe 3 (Zyklus × 0,4) × Trait 0,5 = **0,2 → Ausstoss ×5**: Steinbruch 50 / min, Glashütte 60,
  Rohr / Schäferei 60. Alle Zyklen bleiben ganzzahlig (60→30/18/12, 50→25/15/10).
- Bremsen sind schon da: `STORAGE_CAP` 100 je Insel (`addStock` kappt), Schiffsdurchsatz 40 / min auf B,
  Verkaufssättigung: −1 Prozentpunkt je Stück, +1 je 10 Ticks = **60 Stück / min je Gut zum vollen Preis**, darüber
  Abfall bis 30 %.
- Erzeugen und Verkaufen (Verkauf direkt am Kontor II von B): Glas Stufe 3 + Trait 4,3 + 2,04 + 1,5 = 7,84 gegen
  `sell` 20 → höchstens 60 × 12,16 = **+730 / min**. Vergleich ohne Trait in der Heimat: Glas Stufe 3 (8,6 + 4,08 +
  1,08 = 13,76) → +374; Rum Stufe 3 (204 ÷ 30 = 6,8 + Rohr 3,4) → 60 × 7,8 = +468. Der Trait hebt die beste
  Verkaufsmarge um +356 / min (≈ 7 % der Bilanz in (c)); sie bleibt durch die Sättigung je Gut gedeckelt und lässt sich
  nicht vervielfachen. **Keine zusätzliche Kappung nötig**; Playtest-Frage: Wird Glas von B zur Geldquelle Nr. 1?
- Kauf-und-Verkauf: `buy` ≥ 2,5 × `sell` bei allen betroffenen Gütern (Stein 15 / 6, Glas 50 / 20, Rohr und Wolle
  12 / 5), und der Trait ändert keine Preise. Ein Kauf-und-Verkauf-Gewinn ist ausgeschlossen. Aufträge
  (`ORDER_PREMIUM`) sind mengengedeckelt (Glas 4–8).

### B5 Altstand (Laden eines v12-Spielstands)

- Traits hängen an `kind` (kein Save-Feld). Betriebe auf B arbeiten sofort doppelt so schnell: Gewinn, kein Verlust;
  `progress` über dem neuen Zyklus liefert im nächsten Tick ein Stück; Glashütten können öfter auf Stein warten.
- C nachträglich aus `seed` (A/B bitgleich [M]; `lanesClear` prüft alle Paare). Wegen 0,1 % Wurf nur mit
  Ersatzregel, sonst abweisen mit Hinweis. Migration oder Abweisen entscheidet lead-tech; wirtschaftlich unkritisch.
- Balancing-Test: Der Controller (Seed 3) gründet weder auf B noch auf C ein Kontor. Heimat, A und B bleiben
  bitgleich, die Sieg-Zeiten bleiben gleich. Betroffen ist `seaGolden` (vergleicht alle Lanes und den Welt-Hash):
  Es kommen die Lanes 0-3, 1-3 und 2-3 hinzu, und der Hash ändert sich (siehe Ruling-Entwurf R-c).

## C Werte für `src/sim/defs/sea.ts`

Ist → Soll, mit Begründung:

- `TRAIT_CYCLE_PCT` (neu): `50`. Ganzzahlig über `cycle × 50 / 100`, weil alle betroffenen Zyklen gerade sind.
- `IslandTrait`: `spice`, `mountain` → zusätzlich `mountainRich`, `fertile`. `TRAIT_LABELS` «Gebirge+», «Fruchtbar».
- `TRAIT_BUILDINGS` (neu): `mountainRich: ['quarry', 'glassworks']`, `fertile: ['canefarm', 'sheepfarm']`. Wirkt nur
  auf Betriebe der eigenen Insel.
- `ISLANDS[1]` Felsbucht: `quarries` 1 → **3**, Traits zusätzlich `mountainRich`. 3 × 20 = 60 Stein / min ≥ 48;
  bitgleich 0 / 300 [M]. Das ist die einzige Änderung an einem bestehenden Wert.
- `ISLANDS[2]` (neu): `kind 'C'`, «Weidenau», `dMin 30`, `dMax 35`, `size 24`, `traits ['spice', 'fertile']`,
  `plantations 6`, `quarries 0` (B2, B3; Wurf 0,1 % [M]).
- `IslandKind` `'A' | 'B'` → `'A' | 'B' | 'C'`; `clipRim` macht Gebirge auch für C zu Gras (Code, lead-tech).
- Unverändert: `SHIP_MAX`, alle Preise, `LEVELS`, `BUILDING_DEFS`.

«Weidenau» (Weide + Au): allgemeiner Flurname, keine Marke bekannt; Ersatz bei Bedenken «Weideland».

## Ruling-Entwürfe für L0

- **R-a** Gebirge+ = Steinbruch und Glashütte ×2 statt Stein allein — Die Heimat hat immer Gebirge (300 / 300), Stein
  allein bringt ≈ 0 — Kosten bei Irrtum: Glas von B um ≈ 0,7 je Einw. zu stark; dann `TRAIT_BUILDINGS` kürzen (V-C).
- **R-b** Insel C im Band 30–35, Grösse 24, mit Gewürz statt «fern» — fern macht fruchtbar negativ und wirft 2,4 % —
  Kosten bei Irrtum: C liegt näher als im Brainstorming, die Spec muss den Text anpassen.
- **R-c** `seaGolden` um C-Lanes und neuen Hash erweitern, alte Lane-Einträge bitgleich — C ändert den Welt-Hash
  bewusst — Kosten bei Irrtum: eine Lageänderung von A/B bliebe verdeckt.
- **R-d** Die Erzeugung von C darf nie werfen (Auflage an lead-tech, gemessen 1 / 1000) — sonst stürzt `createWorld`
  bei Einzel-Seeds ab — Kosten bei Irrtum: Absturz beim Spielstart.
