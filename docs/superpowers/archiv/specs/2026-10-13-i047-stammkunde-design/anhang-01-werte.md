# Anhang 01 · Werte und Rechnung I-047 Stammkunde (Option 3)

Stand: 2026-10-13 · Paket `design-I-047` · Autor: design-economy-designer · Bezug: Spec Teil A (A.4 Option 3, A.5
L1–L6, A.6 AN-1…AN-8). Alle Werte sind **Vorschläge** für `src/sim/defs/`; gerechnet, nicht simuliert.

## Konventionen

- 1 min = 600 Ticks; Periode `ORDER_PERIOD` 900 Ticks = **1,5 min** (`timing.ts:29`), eine Lieferung je Periode.
- `b`/`s` = `buy`/`sell` (`goods.ts:4–13`); Auftragsprämie `a = floor(0,75 · b)` (`goods.ts:25`, `orders.ts:22–24`);
  Vertrag: Stückpreis `p`, Menge `m`, Wert je Lieferung `V = m · p`.
- Mehrwert MW = Erlös − Wert der Ware bei freiem Verkauf. **Drei Basen:** **F** = `s` (Überschuss ≤ 6/min, Erholung
  1 Punkt je 10 Ticks, `timing.ts:18`) · **S** = `0,3 · s` (Überschuss > 6/min am Boden, `SELL_FLOOR` 30,
  `goods.ts:17`) · **0** = Grenzwert 0 (wer > 6/min hat, drosselt auf 6/min; Rest liegt bis `STORAGE_CAP` 100,
  `goods.ts:26`). Basis 0 ist die obere Schranke des Vertragsvorteils.
- Bilanzen (a) 2310, (b) 3180, (c) 5040 Geld/min: Spätspiel-Anhang 01 A.1 (Sp-A.1).

## W.1 Wertetabelle und Def-Form

`p = floor(b · CONTRACT_PREMIUM)`, **`CONTRACT_PREMIUM = 0,68`**; `m` je Gut so, dass `V = 135–140` (L1).

| Gut        | b / s   | a   | p   | p ÷ s | m   | V   | Menge/min |
| ---------- | ------- | --- | --- | ----- | --- | --- | --------- |
| Holz       | 10 / 4  | 7   | 6   | 1,50  | 23  | 138 | 15,3      |
| Nahrung    | 8 / 3   | 6   | 5   | 1,67  | 28  | 140 | 18,7      |
| Stein      | 15 / 6  | 11  | 10  | 1,67  | 14  | 140 | 9,3       |
| Wolle      | 12 / 5  | 9   | 8   | 1,60  | 17  | 136 | 11,3      |
| Stoff      | 30 / 12 | 22  | 20  | 1,67  | 7   | 140 | 4,7       |
| Zuckerrohr | 12 / 5  | 9   | 8   | 1,60  | 17  | 136 | 11,3      |
| Rum        | 40 / 18 | 30  | 27  | 1,50  | 5   | 135 | 3,3       |
| Glas       | 50 / 20 | 37  | 34  | 1,70  | 4   | 136 | 2,7       |

Beispiel Rum: `floor(40 · 0,68) = 27`; `V = 5 · 27 = 135`; `5 ÷ 1,5 = 3,3`/min.

**Def-Form (Vorschlag):**

- `src/sim/defs/goods.ts`: `CONTRACT_PREMIUM = 0.68` (neben `ORDER_PREMIUM`), `CONTRACT_PENALTY_PCT = 100` (W.5),
  `CONTRACT_MIN_TIER = 3` (W.6). Kein neuer Takt: `ORDER_FIRST_TICK`/`ORDER_PERIOD` gelten.
- Menge als Pflichtfeld im bestehenden Auftragseintrag: `order: { tier, min, max, contract: 23 }` (Typ `OrderDef`,
  `src/sim/types.ts:87`). Den Vertrag gibt es nur für Güter mit `order` (A.3); so kann kein Auftragsgut ohne Menge
  sein, und ein zweites optionales Feld im `GoodDef` entfällt.

**Reicht ein Faktor plus Menge je Gut? Ja.** Der Faktor wirkt auf `b`, nicht auf `s`: Aus `0,68 < ORDER_PREMIUM 0,75
< 0,8` folgen L3 und «unter der Prämie» schon aus der Bauart (W.3). `p ÷ s` streut nur 1,50–1,70, also halten L1 und
L2 mit einer Menge je Gut. Preise je Gut (`contract: { amount, price }`) helfen nicht: Der einzige Konflikt
(L4-Untergrenze, W.4) hängt an der Menge, nicht am Preis.

## W.2 Zufallsauftrag gegen Vertrag (L2), Break-even

Auftrag: Gut und Menge gleichverteilt (`orders.ts:45–47`), Mittel `ā = (min + max) ÷ 2`: Holz 30, Nahrung 15,
Stein 15, Wolle 15, Stoff 9, Rohr 15, Rum 9, Glas 6. Pool Stufe 3 = 7 Güter (ohne Glas), Stufe 4 = 8
(`orders.ts:27–32`). Wer **jeden** Auftrag liefert, bekommt einen je Periode (Verfall nach 600 Ticks, neuer zu jedem
Periodenbeginn, `orders.ts:54–66`). Auftrags-MW = `ā · (a − Basis)`, Vertrags-MW = `m · (p − Basis)`, je Periode.

| Gut          | Auftrag F / S / 0    | Vertrag F / S / 0    | Quote ÷ E3 (F / S / 0) | Quote ÷ E4 (F / S / 0) |
| ------------ | -------------------- | -------------------- | ---------------------- | ---------------------- |
| Holz         | 90 / 174 / 210       | 46 / 110 / 138       | 61 / 77 / 80 %         | 58 / 74 / 77 %         |
| Nahrung      | 45 / 77 / 90         | 56 / 115 / 140       | 74 / 80 / 81 %         | 71 / 77 / 79 %         |
| Stein        | 75 / 138 / 165       | 56 / 115 / 140       | 74 / 80 / 81 %         | 71 / 77 / 79 %         |
| Wolle        | 60 / 113 / 135       | 51 / 111 / 136       | 68 / 77 / 79 %         | 65 / 75 / 76 %         |
| Stoff        | 90 / 166 / 198       | 56 / 115 / 140       | 74 / 80 / 81 %         | 71 / 77 / 79 %         |
| Zuckerrohr   | 60 / 113 / 135       | 51 / 111 / 136       | 68 / 77 / 79 %         | 65 / 75 / 76 %         |
| Rum          | 108 / 221 / 270      | 45 / 108 / 135       | 60 / 76 / 79 %         | 57 / 73 / 76 %         |
| Glas         | 102 / 186 / 222      | 56 / 112 / 136       | –                      | 71 / 76 / 76 %         |
| **E3** (÷ 7) | 75,4 / 142,9 / 171,9 | je min 50 / 95 / 115 |                        |                        |
| **E4** (÷ 8) | 78,8 / 148,3 / 178,1 | je min 53 / 99 / 119 |                        |                        |

- **Relevante Basis:** Bei `m/min > 6` (Holz, Nahrung, Stein, Wolle, Rohr) liefert nur, wer > 6/min Überschuss hat,
  also gilt S–0: **74–81 %**. Bei Stoff, Rum, Glas (≤ 4,7/min) ist auch F möglich.
- **Nie dominant:** Maximum über alle Basen und Stufen 81 % < 90 %. **Rum unter F 57–60 %** liegt bewusst unter dem
  Band: Der Rum-Vertrag lohnt erst bei grossem Rum-Überschuss (L1, A.7 Punkt 2).
- **Break-even-Lieferquote** `q* = MW_Vertrag ÷ E`: F 0,57–0,74 · S 0,73–0,80 · 0 0,76–0,81. Wer 4 von 5 Aufträgen
  liefert, bleibt bei Aufträgen; wer höchstens 3 von 4 schafft oder einen Klick je 1,5 min sparen will, nimmt den
  Vertrag.

## W.3 Kein Kauf-und-Liefern-Gewinn (L3), Boom

Der Kaufpreis mit Edikt Handel (`buyFactorPct` 80, `edicts.ts:20`) wird über die Gesamtmenge aufgerundet
(`trade.ts:50`), je Stück also ≥ `0,8 · b`. Geprüft wird darum gegen `0,8 · b` (strenger als `ceil(0,8 · b)`).

- `p` gegen `0,8 · b`: Holz 6 < 8 · Nahrung 5 < 6,4 · Stein 10 < 12 · Wolle 8 < 9,6 · Stoff 20 < 24 · Rohr 8 < 9,6 ·
  Rum 27 < 32 · Glas 34 < 40. Knappster Abstand Nahrung 1,4 je Stück.
- Verlust bei Kauf von m Stück mit Edikt und Lieferung: `ceil(m · 0,8 · b) − V` = Holz 184 − 138 = 46, Nahrung 180 −
  140 = 40, Stein/Stoff 168 − 140 = 28, Wolle/Rohr 164 − 136 = 28, Rum 160 − 135 = 25, Glas 160 − 136 = 24.
- Bauart: `floor(0,68 · b) < 0,8 · b` für jedes `b > 0`. I-048 (`BUY_RISE` > 0) hebt nur Kaufpreise, bleibt sicher.
- **Boom (AN-7 bestätigt):** Mit `BOOM_PCT` 150 (`crises.ts:18`) wären Rum `1,5 · 27 = 40,5 > 32` und Glas
  `51 > 40` ein Kauf-und-Liefern-Gewinn. Der Vertragspreis liest den Boom **nie**.
- Die Lieferung ändert `sellPct` nicht (A.4 «sättigt nicht»).

## W.4 Pflichtbau-Grenze (L4), Feste, Versorgung

Ausstoss = 600 ÷ `cycle` (Stufe 1, `buildings.ts`). Kette = Referenzkolonie der Phase, ab der es den Vertrag gibt:
(a), bei Glas (b) (M14-Anhang 01 A.1). Stein: Referenz kauft zu, darum Ausbau R mit 3 Steinbrüchen (Sp-A.3).

| Gut        | Menge/min | 1 Betrieb/min (cycle) | Anteil Betrieb | Kette/min        | Anteil Kette (≤ 40 %) |
| ---------- | --------- | --------------------- | -------------- | ---------------- | --------------------- |
| Holz       | 15,3      | Holzfäller 20 (30)    | 77 %           | 2 Fäller 40      | 38 %                  |
| Nahrung    | 18,7      | Fischer 15 (40)       | 124 %          | 10 Fischer 150   | 12 %                  |
| Stein      | 9,3       | Steinbruch 10 (60)    | 93 %           | R: 3 Brüche 30   | 31 %                  |
| Wolle      | 11,3      | Schäferei 12 (50)     | 94 %           | 5 Schäfereien 60 | 19 %                  |
| Stoff      | 4,7       | Weberei 12 (50)       | 39 %           | 5 Webereien 60   | 8 %                   |
| Zuckerrohr | 11,3      | Plantage 12 (50)      | 94 %           | 3 Plantagen 36   | 31 %                  |
| Rum        | 3,3       | Brennerei 12 (50)     | 28 %           | 3 Brennereien 36 | 9 %                   |
| Glas       | 2,7       | Glashütte 12 (50)     | 22 %           | 3 Hütten 36 (b)  | 7 %                   |

- **Obergrenze 40 % hält überall** (Holz knapp, 38 %).
- **Untergrenze «≥ 1 Betrieb» ist für Stoff, Rum, Glas mit keinem Preis erreichbar.** 1 Betrieb = 18 Stück je
  Periode. Unter Basis 0 ist MW = 18 · p, mit `p ≥ s` (sonst unter F schlechter als freier Verkauf): Stoff ≥ 216,
  Rum ≥ 324, Glas ≥ 360 gegen E 172–178 = **121–210 %**, der Vertrag dominiert (L2 verletzt).
- Die Bindung entsteht trotzdem: Die Referenzkolonie hat Überschuss 0 (Sp-A.3), Betriebe sind unteilbar, also
  braucht jeder Vertrag ohne Überschuss 1 Zusatzbetrieb bzw. 1 Paar. Vorschlag: Untergrenze **≥ 20 % eines
  Betriebs** (Minimum Glas 22 %).
- **Kein Bauanreiz:** Ein Rum-Paar kostet `(20 + 10) · 6 = 180`/min Unterhalt. Ohne Vertrag bringt es 6/min frei zu
  18 = 108/min, also −72/min. Mit Vertrag 90 + 108 = 198/min, also +18/min: knapp kostendeckend, keine Geldquelle.
- **Feste:** 10 Rum je 1800 Ticks und Kapelle (`timing.ts:55, 59`) = 3,3/min, mit Vertrag 6,7/min = 56 % einer
  Brennerei. Vor einem Fest müssen ≥ 15 Rum liegen, sonst Bruch oder kein Fest. Das ist die gewollte Wahl.
- **Versorgung:** Nahrung 18,7/min = Bedarf von 6 Einwohnern (3 je Einwohner/min, M14-Anhang 01 B.1). Wolle und Rohr
  (11,3/min) entsprechen fast dem Eingang einer Weberei bzw. Brennerei (12/min) und stehen gegen Stoff bzw. Rum. Holz
  steht in (b) gegen 3 Glashütten (36 Holz/min bei 40 Ausstoss).

## W.5 Strafe (L5)

Vorschlag **`CONTRACT_PENALTY_PCT = 100`**: Strafe `P = ceil(V · 100 ÷ 100) = V` = 135–140 («eine Lieferung Ersatz»).

1. **Annehmen und Verfallen gegen Ablehnen:** n Lieferungen, Bruch in Periode n + 1: `n · MW − P`. Kündigen nach n:
   `n · MW`. Ablehnen: `(n + 1) · q · E ≥ 0`. Bei n = 0: `−P − q · E < 0 ≤` Ablehnen, **für jedes P ≥ 1**.
   Verfallen ist stets Kündigen minus P. L5 hält.
2. **Getilgt nach** `n* = P ÷ MW` = 2,4–3,0 Perioden (F) bzw. 1,2–1,3 (S): Ein Bruch kostet 2–4,5 min Vorteil.
   140 Geld sind 3,6 s Einkommen in (a): spürbar, nicht ruinös.
3. **Zukauf statt Bruch:** Fehlende Gesamtmenge zum Listenpreis `m · (b − p)` = 64–92, mit Edikt 24–46, beides < P.
   Wer aufpasst, kauft nach; ein Bruch trifft Unaufmerksamkeit, Geldmangel, Kontorsperre. P < 64 machte den Bruch
   billiger als den Zukauf (niemand hielte Ware), P = 3 · V bestrafte Krisenpech zu hart.
4. **Anteil statt fest:** Bei V ≈ 138 gleich wirksam; der Anteil skaliert mit, wenn Mengen nachgestellt werden.

## W.6 Mindeststufe (AN-1 bestätigt: Stufe 3)

- Stufe 2: Aufträge ab U3 (README «Freischaltung Schritt für Schritt»), Pool 5 Güter. Eine Siedler-Kolonie mit
  4 Häusern hat ≈ 4 · 168 = 670 Geld/min (M14-Anhang 01 A.2). 93/min Vertrag wären **14 %**: Geldquelle im Frühspiel.
- Stufe 3: in (a) höchstens 93/min = 4,0 % (Basis 0), 3,2 % (S), 1,6 % (F); gegen «liefert alles» (115/min)
  negativ. Erst ab Stufe 4 verfehlte das Ziel Mittelspiel (A.2).
- `CONTRACT_MIN_TIER = 3`, geprüft beim Angebot über `maxHouseTier` (`orders.ts:13–19`).

## W.7 Gesamtwirkung (L6) und Controller

| Vergleich (je min)                                   | Wert      | (b) 3180 | (c) 5040 |
| ---------------------------------------------------- | --------- | -------- | -------- |
| gegen «kein Handel», Basis 0 (Maximum)               | +90 … +93 | ≤ 2,9 %  | ≤ 1,9 %  |
| gegen freien Verkauf, Basis S                        | +72 … +77 | ≤ 2,4 %  | ≤ 1,5 %  |
| gegen «liefert alle Aufträge», Basis 0               | −21 … −29 | −0,9 %   | −0,6 %   |
| Zusatzbetriebe nur für den Vertrag (netto Unterhalt) | +13 … +69 | ≤ 2,2 %  | ≤ 1,4 %  |

Letzte Zeile: `Menge/min · (p − Stückkosten)`, Stückkosten = Unterhalt/min ÷ Ausstoss: Holz 1,5, Nahrung 2, Stein 6,
Wolle/Rohr 5, Stoff 12,5, Rum 15, Glas 20 (eigener Stein) bzw. 29 (gekauft). Holz 15,3 · 4,5 = 69; Glas mit
gekauftem Stein 2,7 · 5 = 13. **L6 hält** in (b) und (c).

**Controller:** `deliverOrder` wird nur aus `src/ui/app.ts` aufgerufen (`app.ts:552`); `src/ui/hud.ts:166` ist nur die
Schnittstelle (Nachtrag R584). Nie vom Controller. Er bekommt kein Angebot und nimmt nie an; der Vertragszustand bleibt `null`, `tickOrders` unverändert,
Baseline **bitgleich**, `tests/sim/balance.test.ts` unberührt, kein Ruling nötig. Bedingung für Teil B: Angebot nur in
`deliverOrder`, ein offenes Angebot sperrt keinen Auftrag, neue Felder mit `null` vorbelegt (Save-Version, AN-8).

## W.8 Entartete Strategien und Randfälle

1. **Kündigen kurz vor Fälligkeit:** kostenlos, der Vertrag ist eine freie Option; die Strafe trifft nur
   Unaufmerksamkeit und Krisen. Gewollt (A.4). Nach der Kündigung kommt der nächste Auftrag erst zur nächsten Periode
   (`nextOrderTick`, `orders.ts:90–94`), kein «Auftrag sehen und wählen». Kündigen am Fälligkeitstick wirkt vor der
   Abbuchung (Teil B).
2. **Vertrag nur zum Blockieren:** Aufträge verfallen still ohne Strafe (`orders.ts:54`), Blockieren bringt 0. Der
   Boom hat einen eigenen Zufallsstrom (`CRISIS_SALT`).
3. **Fremdinsel ohne Kette:** Lieferinsel = Auftragsinsel (AN-2). Schiff 1,5–2,4 Geld/Stück (M14-Anhang 01 B.1)
   gegen Marge über F je Stück: Holz/Nahrung 2, Wolle/Rohr 3, Stein 4, Stoff 8, Rum 9, Glas 14. Bei Holz und Nahrung
   frisst der Transport die Marge (2 − 1,65 = 0,35). `sellPct` ist global (`trade.ts:147`): keine Insel-Arbitrage.
4. **Kauf und Lieferung mit Edikt Handel:** Verlust 24–46 je Lieferung (W.3).
5. **Boom auf das Vertragsgut:** frei `1,5 · s`, Rum 27 = p, Holz 6 = p, Glas 30 < 34. Kündigen für die Boomdauer
   bringt nur den Boom-Erlös, den es ohnehin gibt: harmlos.
6. **Annehmen-Kündigen-Schleife:** Angebote nur nach einer Auftragslieferung, kein Zugewinn.
7. **Aufstieg 3 → 4 mit laufendem Vertrag:** Glas kommt in den Pool, E steigt um 4 %, der Vertrag wird relativ
   schwächer: harmlos.
8. **Brand oder Sturm trifft die Kette:** Puffer 2 · m (≤ 56 < 100) deckt eine Periode Ausfall; Zukauf (W.5) wendet
   jeden Bruch ab.

## Offene Punkte für lead-design

1. **L4-Untergrenze ändern:** «≥ 1 Betrieb» ist für Stoff, Rum, Glas unerfüllbar, ohne L2 zu brechen (W.4).
   Empfehlung: «≥ 20 % eines Betriebs; Bindung über den Überschuss 0 der Referenzkolonie».
2. **Rum-Menge 5 oder 6:** 5 gibt unter F 57–60 % (unter dem Band); 6 gibt F 72 %, aber Basis 0 94 % und V 162
   (L1 +17 %). Empfehlung 5 (L1, Rum-Dominanz).
3. **Strafe als Anteil (100 % von V) statt fest 140:** gleich wirksam, robuster beim Nachstellen. Empfehlung Anteil.
4. **Def-Form:** Menge als Pflichtfeld `order.contract` statt eigenem `GoodDef.contract`. Empfehlung `order.contract`,
   dazu Invarianten-Test: `p < a`, `p < 0,8 · b`, V im Band ±5 %, `m ≤ STORAGE_CAP`.
5. **Phase (a) 4,0 % (Basis 0):** über 3 %, aber L6 gilt nur für (b)/(c), und gegen «liefert alles» ist der Wert
   negativ. Empfehlung: hinnehmen und in Teil B als bekannte Grösse nennen.
