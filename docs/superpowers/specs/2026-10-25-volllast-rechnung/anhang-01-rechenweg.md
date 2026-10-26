# Anhang 01 · Rechenweg Volllast (Formeln, Kettentabelle, Wertebereich)

Gehört zu [Rechnung Volllast](../2026-10-25-volllast-rechnung.md). **Gerechnet, nicht gemessen.** Ganzzahlige Ticks,
Ausstoss als Erwartungswert (± 1 Einheit Rundung je Fenster).

## A.1 Formeln

Variablen je Betrieb: Zyklus `c` (nach Stufe, Rat, Inselvorteil, `src/sim/levels.ts:40-44`), Unterhalt `u` je 100 T
(`src/sim/levels.ts:46-47`), Listenpreis `p` und Verkaufspreis `s` des Ausstosses (`src/sim/defs/goods.ts`).
Parameter: `k` = `OVERTIME_CYCLE_PCT`, `m` = `OVERTIME_UPKEEP_PCT`, `OT` = `OVERTIME_TICKS`, `RT` = `OVERTIME_REST_TICKS`,
`r` = Unterhalt in der Ruhe in % (Empfehlung: `PAUSED_UPKEEP_PCT` = 50, `src/sim/defs/buildings.ts:303`).

- Zyklus in Volllast: `c' = max(1, ceil(c × k / 100))` (Aufrunden: Gewinnfaktor `c / c'` ≤ 100 / k).
- Unterhalt: Volllast `u' = ceil(u × m / 100)`, Ruhe `uR = ceil(u × r / 100)` (wie `buildingUpkeep`, `levels.ts:49-50`).
- Vorgezogene Menge in der Volllast: `E = OT / c' − OT / c`.
- In der Ruhe entgangene Menge: `R = RT / c`. Netto über ein Fenster `OT + RT`: `E − R` (negativ, solange `D > 1`).
- Rückzahlquote `D = R / E` (Einheiten, die man für eine vorgezogene Einheit später verliert).
- Mehr-Unterhalt je Fenster: `ΔU = (OT × (u' − u) + RT × (uR − u)) / 100`.
- Kostenquote `ρ = ΔU / (E × p)` (Mehr-Unterhalt gemessen am Zukaufwert der vorgezogenen Menge).
- Schwelle Volllast gegen Zukauf: Volllast ist billiger, wenn `ΔU + R × v < E × p`, also wenn der Wert `v` einer
  später entgangenen Einheit unter `v* = p × (1 − ρ) / D` liegt. `v = p` (Kette am Anschlag, Ausfall wird
  zugekauft), `v = s` (Überschuss wäre verkauft worden), `v = 0` (Lager wäre voll gelaufen, `production.ts:67-70`).
- Dauer-Volllast, Ausstoss relativ zum Normalbetrieb: `a = (OT / c') / ((OT + RT) / c)`; Unterhalt relativ:
  `b = (OT × u' + RT × uR) / ((OT + RT) × u)`.

Werte mit Empfehlung `k` 75, `m` 150, `OT` 1800, `RT` 1200, `r` 50: bei `c` 50 ist `c'` 38, `E` 47,4 − 36 = 11,4,
`R` 24, `D` 2,1; Dauer-Volllast `a` = 47,4 / 60 = 0,79, `b` = (1800 × 23 + 1200 × 8) / (3000 × 15) = 1,13 (Weberei).

## A.2 Kettentabelle (Empfehlung, je Betrieb und Stufe, ein Fenster 3000 T)

Quellen: Zyklus und Unterhalt Stufe 1 `src/sim/defs/buildings.ts` (Feld `cycle`/`upkeep` des Betriebs), Stufe 2/3
`src/sim/defs/levels.ts:25-35`; Preise `src/sim/defs/goods.ts:4-61`.

«eng» = Volllast + Ausfall später zugekauft (`ΔU + R × p`), «Überschuss» = `ΔU + R × s`, «Lager voll» = `ΔU`.
Zukauf = `E × p`.

| Betrieb      | St. | c   | c'  | E    | R     | u → u' / uR  | ΔU  | ρ    | v*/p | s/p  | Zukauf | eng  | Überschuss | Lager voll |
| ------------ | --- | --- | --- | ---- | ----- | ------------ | --- | ---- | ---- | ---- | ------ | ---- | ---------- | ---------- |
| Fischer      | 1   | 40  | 30  | 15,0 | 30,0  | 5 → 8 / 3    | 30  | 0,25 | 0,38 | 0,38 | 120    | 270  | 120        | 30         |
| Fischer      | 3   | 16  | 12  | 37,5 | 75,0  | 9 → 14 / 5   | 42  | 0,14 | 0,43 | 0,38 | 300    | 642  | 267        | 42         |
| Jagdhütte    | 1   | 50  | 38  | 11,4 | 24,0  | 5 → 8 / 3    | 30  | 0,33 | 0,32 | 0,38 | 91     | 222  | 102        | 30         |
| Rinderfarm   | 3   | 8   | 6   | 75,0 | 150,0 | 17 → 26 / 9  | 66  | 0,11 | 0,45 | 0,38 | 600    | 1266 | 516        | 66         |
| Holzfäller   | 1   | 30  | 23  | 18,3 | 40,0  | 5 → 8 / 3    | 30  | 0,16 | 0,38 | 0,40 | 183    | 430  | 190        | 30         |
| Steinbruch   | 1   | 60  | 45  | 10,0 | 20,0  | 10 → 15 / 5  | 30  | 0,20 | 0,40 | 0,40 | 150    | 330  | 150        | 30         |
| Schäferei    | 1   | 50  | 38  | 11,4 | 24,0  | 10 → 15 / 5  | 30  | 0,22 | 0,37 | 0,42 | 136    | 318  | 150        | 30         |
| Schäferei    | 2   | 30  | 23  | 18,3 | 40,0  | 13 → 20 / 7  | 54  | 0,25 | 0,34 | 0,42 | 219    | 534  | 254        | 54         |
| Weberei      | 1   | 50  | 38  | 11,4 | 24,0  | 15 → 23 / 8  | 60  | 0,18 | 0,39 | 0,40 | 341    | 780  | 348        | 60         |
| Weberei      | 3   | 20  | 15  | 30,0 | 60,0  | 26 → 39 / 13 | 78  | 0,09 | 0,46 | 0,40 | 900    | 1878 | 798        | 78         |
| Brennerei    | 1   | 50  | 38  | 11,4 | 24,0  | 20 → 30 / 10 | 60  | 0,13 | 0,41 | 0,45 | 455    | 1020 | 492        | 60         |
| Brennerei    | 3   | 20  | 15  | 30,0 | 60,0  | 34 → 51 / 17 | 102 | 0,09 | 0,46 | 0,45 | 1200   | 2502 | 1182       | 102        |
| Werkzeugm.   | 1   | 80  | 60  | 7,5  | 15,0  | 25 → 38 / 13 | 90  | 0,30 | 0,35 | 0,38 | 300    | 690  | 315        | 90         |
| Werkzeugm.   | 3   | 32  | 24  | 18,8 | 37,5  | 43 → 65 / 22 | 144 | 0,19 | 0,40 | 0,38 | 750    | 1644 | 706        | 144        |
| Glashütte    | 1   | 50  | 38  | 11,4 | 24,0  | 25 → 38 / 13 | 90  | 0,16 | 0,40 | 0,40 | 568    | 1290 | 570        | 90         |
| Glashütte    | 3   | 20  | 15  | 30,0 | 60,0  | 43 → 65 / 22 | 144 | 0,10 | 0,45 | 0,40 | 1500   | 3144 | 1344       | 144        |
| Gewürzplant. | 1   | 50  | 38  | 11,4 | 24,0  | 15 → 23 / 8  | 60  | 0,13 | 0,41 | 0,30 | 455    | 1020 | 348        | 60         |

Alle 34 Kombinationen (12 Betriebe, Stufen 1–3) liegen in: `D` 2,00–2,33, `ρ` 0,08–0,33, `v*/p` 0,32–0,46. Die
Spalte «eng» liegt bei 2,08–2,46 × Zukauf, «Lager voll» bei 0,08–0,33 × Zukauf, «Überschuss» bei 0,77–1,16 ×
Zukauf (Messerkante, gewollt: dort entscheiden Frist und Kasse). Dauer-Volllast: `a` 0,77–0,80, `b` 1,10–1,20.

## A.3 Fristfenster (zusätzliche Einheiten je Betrieb in Volllast innerhalb `T` ≤ `OT`)

`ΔE(T) = T / c' − T / c`. Fristen aus `src/sim/defs/timing.ts`: Auftrag 600 T (`:31`), Fernauftrag 1700 T (`:36`),
Vertragsperiode 900 T (`:29`), Warnfenster 300 T (`src/sim/defs/goods.ts:83`).

| c → c'          | 300 T (Warnung) | 600 T (Auftrag) | 900 T (Periode) | 1700 T (Fern) |
| --------------- | --------------- | --------------- | --------------- | ------------- |
| 50 → 38 (St. 1) | 1,9             | 3,8             | 5,7             | 10,7          |
| 30 → 23 (St. 2) | 3,0             | 6,1             | 9,1             | 17,2          |
| 20 → 15 (St. 3) | 5,0             | 10,0            | 15,0            | 28,3          |

## A.4 Wertebereich (Schranken und Durchlauf)

Schranken (alle müssen für alle 34 Kombinationen halten):

- **S0 Mehr-Unterhalt positiv:** `OT × (m − 100) > RT × (100 − r)`. Sonst ist Dauer-Volllast auf einem gedrosselten
  Betrieb billiger als Normalbetrieb (Entartung). Mit `r` 50, `OT` 1800, `RT` 1200: `m` > 133.
- **S1 Rückzahlquote:** 1,5 ≤ `D` ≤ 3. Unter 1,5 kippt Dauer-Volllast bei Rundung und Sturm nahe an Normalbetrieb;
  über 3 lohnt Volllast nur noch bei vollem Lager (Knopf wird tot).
- **S2 Kostenquote:** `ρ` ≤ 0,5. Sonst schlägt Zukauf die Volllast auch bei vollem Lager knapp.
- **S3 Messerkante:** 0,25 ≤ `v*/p` ≤ 0,6. Die Verkaufsquoten `s/p` liegen bei 0,30–0,45; die Schwelle soll dort liegen.
- **S4 Spürbar:** `E` ≥ 8 bei `c` 50 (Auftrag Stoff/Rum mindestens 6, `goods.ts:38,52`).
- **S5 Struktur:** Mit `ceil` gilt `c / c'` ≤ 100 / k für jedes `c`; mit `floor` wäre bei `c` 2 der Faktor 2 und
  Dauer-Volllast besser als Normalbetrieb (`a` = 1,2). Kleinster Zyklus heute: Rinderfarm Stufe 3, `c` 8 (`levels.ts:27`).

Durchlauf `k` ∈ {67, 70, 75, 80}, `m` ∈ {125, 150, 175, 200}, `OT` ∈ {1200, 1500, 1800, 2400}, `RT` ∈ {600 … 2400}
(Skript im Scratchpad, nicht eingecheckt). Bei `k` 75 und `m` 150 bestehen S1–S4 nur:

| OT   | RT   | D         | ρ max | v*/p      | E (c 50) |
| ---- | ---- | --------- | ----- | --------- | -------- |
| 1500 | 900  | 1,80–2,10 | 0,36  | 0,34–0,50 | 9,5      |
| 1500 | 1200 | 2,40–2,80 | 0,28  | 0,29–0,40 | 9,5      |
| 1800 | 1200 | 2,00–2,33 | 0,33  | 0,32–0,46 | 11,4     |
| 1800 | 1500 | 2,50–2,92 | 0,26  | 0,28–0,38 | 11,4     |
| 2400 | 1500 | 1,87–2,19 | 0,35  | 0,33–0,49 | 15,2     |
| 2400 | 1800 | 2,25–2,63 | 0,30  | 0,30–0,42 | 15,2     |

Ausgefallen bei `k` 75 / `m` 150: `RT` 600 (`D` ≈ 1), `RT` ≥ `OT` (`v*/p` < 0,33 im Mittel, Knopf nur bei vollem
Lager), `OT` 1200 (`E` 7,6). `m` 125 verletzt S0 (`ΔU` < 0). Faustregel für die Paare: `RT ≈ 2 × OT × (100 − k) / k`.
