# Anhang 01 · Werte, Fristrechnung und Wirkung (Handel 2 · Fernangebot)

Stand: 2026-10-14 · Paket `design-handel-2` · Autor: design-spec-author · Grundlage: Designvorschlag
`2026-10-14-handel-2-brainstorming.md` §3 V1, R629, I-092 Anhang 01 (Bilanzen). Alle Werte sind gerechnet, nicht
simuliert. Code-Stellen beziehen sich auf `main` zum Datum dieser Spec.

## Konventionen

- 1 min = 600 Ticks (`TICK_MS` 100). Fahrzeit einer Strecke: `laneTicks = SHIP_TICKS_PER_SEA_TILE × d` = 10 × d
  (`islands.ts:73–82`, `sea.ts`). Die Fahrlinie (SEE-F1, `seaRoute.ts`) ist reine Darstellung und ändert `d` nicht.
- **Keine Liegezeit:** Ein Schiff auf Route kommt im Schritt t an, entlädt, lädt und fährt im **selben** Schritt t
  wieder ab (`ships.ts`, `tickShips` → `handleDocked`). Abfahrt im Schritt t mit `left = L` heisst Ankunft im Schritt
  t + L. Eine Rundfahrt Heimat → Insel → Heimat dauert genau 2 L.
- Laden: `load` nimmt `stock − reserve` je Gut, im ersten Durchgang höchstens `⌊capacity ÷ k⌋` je Gut (k Güter in
  dieser Richtung, höchstens `ROUTE_GOODS_PER_DIRECTION` 2), also mindestens 25 Stück je Gut.
- Auftragstakt (`timing.ts`): Periodenbeginn P = 600 + 900 k; Zufallsauftrag bis `due = P + 600`; Verfall erst bei
  `tick > due` (`orders.ts`, `tickOrders`). Spieleraktionen laufen zwischen zwei Schritten.
- Bilanzen (I-092 Anhang 01): (a) 2310, (b) 3180, (c) 5040 Geld/min; Netto je Einwohner (b) 7,07, (c) 10,50 je
  100 Ticks; Einwohner (b) 75, (c) 80. Schiff: Unterhalt 15 je 100 Ticks = 90 Geld/min.

## W.1 Werte je Gut

Stückprämie `u = floor(buy × ORDER_PREMIUM 0,75)` (`orderUnitReward`, unverändert). Kaufpreis mit Edikt Handel bei
`buyPct` 100: `ceil(buy × n × 0,8)` über die Gesamtmenge (`trade.ts`, `buyQuote`).

| Gut   | Insel (`prefers`) | `order.tier` | `order.far` | u   | Wert `far × u` | 0,8 × buy | Kauf n = far (Edikt) | ≤ 25 |
| ----- | ----------------- | ------------ | ----------- | --- | -------------- | --------- | -------------------- | ---- |
| Stoff | Möweninsel        | 2 Siedler    | 20          | 22  | 440            | 24        | 480                  | ja   |
| Rum   | Felsbucht         | 3 Bürger     | 15          | 30  | 450            | 32        | 480                  | ja   |
| Glas  | Weidenau          | 4 Kaufleute  | 12          | 37  | 444            | 40        | 480                  | ja   |

- Invarianten erfüllt: u < 0,8 × buy; 440 ≤ Wert ≤ 450; `far ≤ ⌊SHIP.capacity ÷ ROUTE_GOODS_PER_DIRECTION⌋` = 25
  (eine Fahrt genügt auch mit zwei Gütern je Richtung) und ≤ `STORAGE_CAP` 100.
- Kaufen und liefern: 450 − 480 = −30 (Rum), 440 − 480 = −40 (Stoff), 444 − 480 = −36 (Glas). Nie Gewinn.

## W.2 Fristrechnung (Pflichtpunkt R629 c)

**Seeweg je Fremdinsel.** Für Seed 3 meldet `generateForeignIslands` für alle drei Inseln Stufe 1 oder 2
(`tests/sim/islands-c.test.ts`, «Stufen 1 oder 2» für Seeds 1, 3, 7, 13, 42). Stufe 1 und 2 nehmen nur Lagen mit
`dMin ≤ d ≤ dMax` an (`layoutValid`). Daraus folgt für Seed 3, ohne Lauf:

| Insel (Index) | dMin–dMax | L = 10 × d | 2 L (Rundfahrt) | 3 L       |
| ------------- | --------- | ---------- | --------------- | --------- |
| Möweninsel 1  | 25–30     | 250–300    | 500–600         | 750–900   |
| Felsbucht 2   | 35–40     | 350–400    | 700–800         | 1050–1200 |
| Weidenau 3    | 30–35     | 300–350    | 600–700         | 900–1050  |

Zum Vergleich (gepinnt, `tests/sim/seaGolden.test.ts`): Seed 13 L = 290 / 370 / 330, Seed 7 270 / 360 / 320,
Seed 42 280 / 390 / 310. Den genauen Seed-3-Wert pinnt AK-H2-27.

Gemessen (Plan T01, Seed 3): Möweninsel L = 260, Felsbucht L = 390, Weidenau L = 310 (gepinnt in `tests/sim/farOrder-defs.test.ts`).

**Fälle.** Annehmen im Schritt-Zwischenraum A ≤ P + 600 (Ende des Angebotsfensters), Ware im Heimatlager, Route
Heimat ↔ Fern-Insel mit dem Gut in Richtung Heimat → Insel:

- **Fall A** «Schiff hat die Fern-Insel gerade verlassen» (Rückweg, ohne die Ware): Ankunft Heimat A + L, Laden,
  Ankunft Fern-Insel **A + 2 L**.
- **Fall B** «Schiff hat die Heimat gerade ohne die Ware verlassen» (Gut erst beim Annehmen in die Route genommen):
  Ankunft Insel A + L, zurück A + 2 L, mit Ware an der Insel **A + 3 L**.
- Freies Schiff in der Heimat (Route beim Annehmen gesetzt): A + 1 + L (günstigster Fall, ohne Bedeutung).

Reserve = `P + FAR_ORDER_DURATION − Ankunft`; die Lieferung geht bis einschliesslich Tick `due`.

| Insel      | Fall A, D 1500 | Fall A, D 1700 | Fall B, D 1500 | Fall B, D 1700        |
| ---------- | -------------- | -------------- | -------------- | --------------------- |
| Möweninsel | 300–400        | 500–600        | 0–150          | 200–350               |
| Weidenau   | 200–300        | 400–500        | −150–0         | 50–200                |
| Felsbucht  | 100–200        | 300–400        | −300 – −150    | −100–50 (d ≤ 36 hält) |

**Ergebnis.**

- Mit D = 1500 (Vorschlag 2:30) hält Fall A auf jeder Seed-3-Lage, bei Felsbucht d = 40 aber nur mit 100 Ticks = 10 s
  Reserve (bei 1×). Fall B scheitert für Weidenau ab d 31 und für Felsbucht immer, wenn spät angenommen wird.
- **Spec-Wert D = 1700 (2:50):** Fall A hält überall mit ≥ 300 Ticks (30 s bei 1×). Fall B hält für Möweninsel und
  Weidenau immer und für Felsbucht bis d 36; bei d 37–40 genügt Annehmen bis P + 1700 − 3 L (d 40: P + 500).
- Obergrenze: Der Fernauftrag muss vor dem übernächsten Periodenbeginn P + 1800 verfallen, also D ≤ 1799. Fall B für
  Felsbucht d 40 bei Annehmen P + 600 braucht 1800: Er ist mit dem Angebotsfenster aus R629 nie ganz garantierbar.
- Untergrenze (Invariante, Rückfall «Frist kürzen»): `D ≥ ORDER_DURATION + 2 × 10 × max(dMax)` = 600 + 800 = 1400.
- Nicht abgedeckt: Lagen der Stufe 3 (Ersatzregel, d > dMax, auf keinem geprüften Seed) und Routen zwischen zwei
  Fremdinseln (Seed 13: Weidenau ↔ Felsbucht 600 Ticks). Beides bleibt ohne Strafe; der Spieler sieht die Frist.

**Auflage K4 (Sturm, Piraten).** Bringt K4 einen Halt H (Ticks, längster zusätzlicher Aufenthalt eines Schiffs auf
Hin- und Rückweg zusammen, etwa durch die Sturm-Anweisung), gilt Fall A nur, wenn
`ORDER_DURATION + 2 × SHIP_TICKS_PER_SEA_TILE × max(dMax) + H ≤ FAR_ORDER_DURATION ≤ 2 × ORDER_PERIOD − 1`.
Mit D 1700 heisst das H ≤ 300; mit D 1799 (Höchstwert) H ≤ 399. Piraten (ab Seeweg 35, 50 % Ladungsverlust) treffen
Felsbucht immer und Weidenau bei d 35; ein Überfall halbiert die Fernware (15 Rum → 7 oder 8) und verfehlt den
Auftrag. Das ist ohne Strafe; das Geleit aus K4 ist die Antwort.

## W.3 Wirkung

**Je Fernauftrag gegen andere Verwendung derselben Ware** (`sellPct` 100, −1 je Stück):

| Gut   | Fernauftrag | Verkauf daheim (Σ pct) | Δ    | Verkauf mit Vorliebe ×1,30 | Δ    |
| ----- | ----------- | ---------------------- | ---- | -------------------------- | ---- |
| Stoff | 440         | 12 × 18,10 = 217       | +223 | floor(217,2 × 1,3) = 282   | +158 |
| Rum   | 450         | 18 × 13,95 = 251       | +199 | floor(251,1 × 1,3) = 326   | +124 |
| Glas  | 444         | 20 × 11,34 = 226       | +218 | floor(226,8 × 1,3) = 294   | +150 |

(Der Vorschlag nannte für Glas daheim 227; mit `floor` sind es 226.)

**Gegen den Auftragspfad.** Ø-Zufallsauftrag Stufe 3 = 1203 ÷ 7 ≈ 172, Stufe 4 = 1425 ÷ 8 ≈ 178. Ein Fernauftrag
belegt zwei Perioden (R7 der Spec, auch bei früher Lieferung), also 1800 Ticks = 3 min. Auftragspfad mit Lieferquote
P: 2 × 172 × P.

| Lieferquote P des Auftragspfads | Δ je Fernauftrag | Δ je min | (b) 3180 | (c) 5040 |
| ------------------------------- | ---------------- | -------- | -------- | -------- |
| 1,0                             | +106             | +35      | 1,1 %    | 0,7 %    |
| 0,6                             | +244             | +81      | 2,6 %    | 1,6 %    |

- **Je Einwohner:** (b) 35 … 81 ÷ 75 = 0,47 … 1,08/min = **0,08 … 0,18 je 100 Ticks** gegen Netto 7,07;
  (c) 35 … 81 ÷ 80 = 0,07 … 0,17 je 100 Ticks gegen 10,50.
- **Phase (a):** keine Wirkung. Ein Fernangebot braucht einen Fremdkontor, also Seefahrt nach dem Bürger-Ziel.
- **Obergrenze brutto:** ein Fernauftrag je 1800 Ticks = 150/min, (b) 4,7 %, (c) 3,0 %. Netto gegen den Auftragspfad
  ≤ 81/min. Band wie I-047 und I-092 (≤ 3 % realistisch in (b)).
- **Zusammen mit I-047 und I-092:** Vertrag und Fernauftrag schliessen sich je Periode aus (ein Platz). Summe mit
  I-092 R1 (+72): ≤ +153/min = 4,8 % von (b).

**Entartungen.**

1. **Frühe Lieferung ohne Sperre** (Befund dieser Spec): Ohne Regel R7 würde ein sofort gelieferter Fernauftrag die
   nächste Periode **nicht** kosten (`tickOrders` bietet bei `order === null` neu an). Mit Ware auf allen Fern-Inseln
   brächte jede Periode 450 statt ≈ 172: +278 je 900 Ticks ≈ **+185/min = 5,8 % von (b)**, ausserhalb des Bands.
   Deshalb sperrt das Annehmen die Folgeperiode unabhängig vom Liefertick (`farSkip`).
2. **Eigenes Schiff nur für Fernaufträge:** +35 … +81 − 90 = −55 … −9/min. Lohnt nicht.
3. **Kaufen und liefern:** −30 … −40 je Auftrag (W.1), auch am Fremdkontor.
4. **Ware liegt schon auf der Fern-Insel:** 450 je 1800 Ticks, wie oben; die Folgeperiode entfällt trotzdem.

## W.4 Rückfall (nur `src/sim/defs/`, per Ruling)

1. Fernmengen auf Wert ≈ 360: Stoff 16 (352), Rum 12 (360), Glas 10 (370); Band im Invarianten-Test auf 350–370.
   Wirkung (b) dann +0,1 … +1,6 % (P 1,0 … 0,6).
2. `FAR_ORDER_DURATION` kürzen, nicht unter 1400 (Invariante). Unter 1700 sinkt die Fall-A-Reserve unter 30 s.

Keine der beiden Änderungen braucht eine Save-Migration: Die Save-Prüfung liest `order.far` nicht und prüft die
Frist eines Fernauftrags nur gegen die Takt-Grenzen (Spec R15).
