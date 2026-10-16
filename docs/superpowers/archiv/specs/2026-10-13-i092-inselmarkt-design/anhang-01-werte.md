# Anhang 01 · Werte und Rechnung I-092 Inselmarkt-Vorliebe

Stand: 2026-10-13 · Paket `design-I-092` · Autor: design-economy-designer · Bezug: Idee I-092 (`docs/ideen.md`,
IDEEN-09), Vorbild I-047-Anhang 01. Alle Werte sind **Vorschläge** für `src/sim/defs/`; gerechnet, nicht simuliert.

## Konventionen

- 1 min = 600 Ticks (`TICK_MS` 100, `timing.ts:2`). Unterhalt gilt je 100 Ticks (`UPKEEP_INTERVAL`, `timing.ts:4`):
  Schiff `SHIP.upkeep` 15 (`sea.ts:7`) = **90 Geld/min**, nicht 15/min.
- Verkauf: Erlös je Stück `s · pct · m ÷ 10 000`, `m` = 100 bzw. `BOOM_PCT` 150 (`trade.ts:71–82`, `crises.ts:18`);
  `sellPct` ist **global** und fällt 1 Punkt je Stück (`trade.ts:147`, `SELL_DROP`, `goods.ts:67`), Boden 30.
- **Erholung (Korrektur zum Briefing):** +1 Punkt je 10 Ticks (`timing.ts:18`), `tickMarket` läuft in jedem Schritt
  (`tick.ts:45`) = **60 Punkte/min**. Vollpreis-Absatz je Gut also ≤ **60 Stück/min**, nicht ≈ 6 (offener Punkt 5).
  Mit 6/min wären alle Obergrenzen 10-mal kleiner; 60 ist die sichere Seite.
- Faktor `f` (Vorliebe), Seeweg `d` in Kacheln; Umlauf `2 · d · 10` Ticks = `d ÷ 30` min (`sea.ts:86`,
  `islands.ts:73`). Schiffskosten je Fahrt = `90 · d ÷ 30` = **`3 · d`** (d 25: 75, 30: 90, 35: 105, 40: 120).
- **Ladungsverkauf** (ein Klick, 50 Stück ab `sellPct` 100): Summe der Anteile 100 + 99 + … + 51 = 3775, Mittel
  75,5 %. Nach 50 Punkten Abfall ist der Markt in 500 Ticks = 50 s wieder bei 100, also vor der nächsten Ankunft
  (Umlauf ≥ 50 s). Bonus je Fahrt `Bf = floor(s · 3775 · f) − floor(s · 3775)` (÷ 100).
- Basen wie I-047: **F** = `sellPct` ≈ 100 (Stückelung, ≤ 60/min) · **S** = Boden 30. Basis 0 entfällt: Daheim lässt
  sich immer verkaufen, der Vorteil ist stets `(f − 1) · s · pct`.
- Stückkosten (Unterhalt ÷ Ausstoss, `buildings.ts`): Holz 1,5 · Nahrung 2 · Stein 6 · Wolle/Rohr 5 · Stoff 12,5 ·
  Rum 15 · Glas 20 (eigener Stein) bzw. 29 (gekauft) · Werkzeug 21,5 (150/min ÷ 7,5 + Holz).
- Bilanzen (a) 2310, (b) 3180, (c) 5040 Geld/min; Netto je Einwohner (b) 7,07, (c) 10,50 je 100 Ticks
  (Spätspiel-Anhang 01 A.1/A.2).

## W.1 Kriterien und Faktor

| Kriterium                                                           | 1,25 | 1,30    | 1,40 |
| ------------------------------------------------------------------- | ---- | ------- | ---- |
| K1 spürbar: Netto je Fahrt ≥ 40 an der fernsten Lage jedes Guts     | nein | ja      | ja   |
| K2 Rohgut trägt nicht: Netto je Fahrt < 0 für s ≤ 6 auch bei d 25   | ja   | ja      | nein |
| K3 kein Kauf-und-Verkauf: `f · s < 0,8 · b`, ohne Boom              | ja   | ja      | ja   |
| K4 realistisch ≤ 3 % von (b) (wie I-047 L6)                         | ja   | ja      | ja   |
| Obergrenze Vorteil `(f − 1) · s · 60` für Stoff + Rum + Glas (/min) | 750  | **900** | 1200 |

- K1 an der fernsten Lage (O2, W.2): Stoff Möweninsel d 30: 1,25 → 113 − 90 = **23** (zu dünn); 1,30 → 135 − 90 =
  **45**; Rum Felsbucht d 40: 204 − 120 = 84; Glas Weidenau d 35: 226 − 105 = 121.
- K2: Stein (s 6) bei d 25 (Bonus − 75): 1,30 → 68 − 75 = **−7**; 1,40 → 91 − 75 = **+16**, Wolle/Rohr +1. Bei 1,40
  trüge ein Rohgut auf einer nahen Insel den Weg; für die Erweiterbarkeit der Tabelle ist das die Grenze `f ≤ 1,33`.
- **Empfehlung `f = 1,30`** (einziger Kandidat mit K1 und K2). Def als Prozent-Ganzzahl `PREFER_PCT = 130`.

## W.2 Mehrerlös und Transport (Pflichtnachweise a, b)

Bonus und Netto je Fahrt (`Bf − 3 · d`, dediziertes Schiff, Rückfahrt leer) und Netto je Schiff und Minute
(`÷ d/30`), `f` = 1,30, Werte aus der Formel oben:

| Gut (s)       | Bf  | d 25 Fahrt / min | d 30      | d 35      | d 40      |
| ------------- | --- | ---------------- | --------- | --------- | --------- |
| Holz (4)      | 45  | −30 / −36        | −45 / −45 | −60 / −51 | −75 / −56 |
| Nahrung (3)   | 34  | −41 / −49        | −56 / −56 | −71 / −61 | −86 / −65 |
| Stein (6)     | 68  | −7 / −8          | −22 / −22 | −37 / −32 | −52 / −39 |
| Wolle/Rohr(5) | 57  | −18 / −22        | −33 / −33 | −48 / −41 | −63 / −47 |
| Stoff (12)    | 135 | 60 / 72          | 45 / 45   | 30 / 26   | 15 / 11   |
| Werkzeug (15) | 170 | 95 / 114         | 80 / 80   | 65 / 56   | 50 / 38   |
| Rum (18)      | 204 | 129 / 155        | 114 / 114 | 99 / 85   | 84 / 63   |
| Glas (20)     | 226 | 151 / 181        | 136 / 136 | 121 / 104 | 106 / 80  |

- **Rohgüter tragen den Bonus nirgends über den Weg** (Bonus je Stück 0,9–1,8 gegen Transport 1,5–2,4 je Stück,
  M14-Anhang 01 B.1). Konsumgüter schon, Werkzeug aber auch (W.5, O1).
- **Obergrenze je Gut und Minute:** F: `(f − 1) · s · 60` = Stoff 216, Rum 324, Glas 360. S: `(f − 1) · 0,3 · s`
  je Stück = 1,1 / 1,6 / 1,8; nur für vorhandenen Überschuss, denn keine Kette kostet am Boden weniger als sie bringt
  (Rum 0,3 · 23,4 = 7 < 15). Ladungsverkauf: Bf je Umlauf, also ≤ Bf · 30 ÷ d je Schiff.
- **Lieferung von Fremdware über eine bestehende Gewürzroute:** Die Gewürzschiffe in (c) fahren hin leer
  (Spätspiel A.1: 2 Schiffe). Dort kostet der Hinweg 0, der volle Bonus bleibt. Das ist der realistische Fall (W.4).

## W.3 Zuordnung O2 und Wert gegen Weg

Regel: kein Vorliebe-Gut, dessen Kette der Trait derselben Insel verkürzt (`TRAIT_BUILDINGS`, `sea.ts:76–79`): Weidenau
`fertile` → Schäferei, Plantage, also weder Stoff noch Rum → **Weidenau muss Glas sein**. Felsbucht `mountainRich` →
Steinbruch, Glashütte → kein Glas. Gewürz nie (`spice` auf allen drei Inseln, `sea.ts:41, 51, 61`). Zulässig sind
damit nur zwei Zuordnungen:

| Zuordnung                               | Möweninsel d 25–30 | Weidenau d 30–35 | Felsbucht d 35–40 | Spanne je Schiff/min |
| --------------------------------------- | ------------------ | ---------------- | ----------------- | -------------------- |
| **A (lead-design)**: Stoff · Glas · Rum | Stoff 72 … 45      | Glas 136 … 104   | Rum 85 … 63       | 45 … 136 (× 3)       |
| B: Rum · Glas · Stoff                   | Rum 155 … 114      | Glas 136 … 104   | Stoff 26 … 11     | 11 … 155 (× 14)      |

- Nach reinem Ertrag (Umordnung: hohes s zum kurzen d) wäre B besser, aber B macht Felsbucht zur toten Option
  (Stoff 15–30 je Fahrt, K1 verfehlt) und die Möweninsel dominant. **A gleicht Wert gegen Weg aus**: das billigste Gut
  auf dem kürzesten Weg, das teuerste Gut in der Mitte, Rum fern. Die Wahl hängt am Überschuss, nicht an einer festen
  besten Insel. **Empfehlung A.**

## W.4 Gesamtwirkung (Pflichtnachweis d)

In (a) wirkt I-092 nicht (Seefahrt erst nach dem Bürger-Ziel).

| Fall (f 1,30, A, je min)                                | Wert        | (b)    | (c)    |
| ------------------------------------------------------- | ----------- | ------ | ------ |
| R1 Überschuss Glas 12/min (Sp-A.3) über Gewürzroute     | +72         | 2,3 %  | 1,4 %  |
| R2 Überschuss 12/min auf eigenem Schiff                 | 72 − 90 < 0 | 0      | 0      |
| R3 eigene Ketten daheim, Schiff, 60/min je Gut, Stückel | +492 … +546 | ≤ 17 % | ≤ 11 % |
| R4 eigene Ketten auf der Fremdinsel, 60/min, Stückel    | +570 … +750 | ≤ 24 % | ≤ 15 % |
| R4 mit Ladungsverkauf (Mittel 75,5 %)                   | +160        | 5,0 %  | 3,2 %  |
| Summe I-047 (Basis 0, +93) und R1                       | +165        | 5,2 %  | 3,3 %  |

- R1 je Einwohner: (b) 72 ÷ 75 = 0,96/min = **0,16 je 100 Ticks** gegen Netto 7,07; (c) 0,15 gegen 10,50. Wie I-047
  (≤ 2,9 % in (b)).
- R3 je Stück Vorteil gegen den besten Heimweg `max(0, s − Stückkosten)`: Stoff 15,6 − 12,5 − 1,5…1,8 = 1,3…1,6
  (daheim −0,5 → 0); Rum 23,4 − 15 − 2,1…2,4 − 3 = 3,0…3,3; Glas 26 − 20 − 1,8…2,1 = 3,9…4,2. × 60 = 78…96 + 180…198 +
  234…252.
- R4: Stoff auf Möweninsel 3,1 · 60 = 186; Rum auf Felsbucht (23,4 − 15 − 3) · 60 = 324; Glas auf Weidenau (kein
  Steinbruch, `quarries: 0`): Stein gekauft mit Edikt 12 → 0, Stein von daheim verschifft → ≈ 4 · 60 = 240; minus
  3 Kontore à 60/min, sofern nicht ohnehin vorhanden. Mit Ladungsverkauf bleibt nur Rum: 23,4 · 0,755 − 15 = 2,67 ·
  60 = 160.
- **Ist das eine neue Geldquelle?** Jeder spürbare Faktor macht eigene Konsumgut-Ketten für den Verkauf
  lohnend (mit Schiff kippt Stoff ab f ≥ 1,17, Glas ab 1,09). Aber die Verkaufswirtschaft **gibt es schon**: Daheim bringen
  Holz (4 − 1,5) · 60 = 150, Nahrung 60, Rum 180 je min; Glas auf Felsbucht mit Trait (Stückkosten 6,25 + 3 + 1,5 =
  10,75) 9,25 · 60 = **555/min** ohne I-092. I-092 vergrössert diese Obergrenze um gut die Hälfte, schafft keine neue
  Art Quelle. R3/R4 brauchen ≈ 30 Zusatzbetriebe (≈ 2760/min Unterhalt) und einen Verkaufsklick je Gut alle 10 s.
- **Keine dominante Strategie:** Rendite auf Unterhalt Rum-Paar auf Felsbucht 5,4 ÷ 15 = 36 % gegen Holzfäller daheim
  2,5 ÷ 1,5 = 167 % und Felsbucht-Glas 86 %. Ein Kaufmannshaus bringt netto 20 · 10,5 · 6 = 1260/min. Wohnen bleibt
  Pfad 1, Handel ein lohnender Pfad 2.

## W.5 Kauf-und-Verkauf und Boom (Pflichtnachweis c)

Kauf geht an jedem Kontor (`trade.ts:92`), mit Edikt Handel ≥ `0,8 · b` je Stück (`edicts.ts:20`, aufgerundet).

| Gut   | `0,8 · b` | `f · s` (1,30) | Boom gestapelt `1,5 · 1,3 · s` | Boom oder Vorliebe, das Höhere |
| ----- | --------- | -------------- | ------------------------------ | ------------------------------ |
| Stoff | 24        | 15,6 ✓         | 23,4 ✓ (Abstand 0,6)           | 18 ✓                           |
| Rum   | 32        | 23,4 ✓         | **35,1 ✗**                     | 27 ✓                           |
| Glas  | 40        | 26 ✓           | 39 ✓ (Abstand 1)               | 30 ✓                           |

- Gestapelt: Rum gewinnt 3,1 je Stück risikolos; in Stückeln (≤ 60/min bei `sellPct` ≈ 100) **+186/min** während
  jedes Rum-Booms (mit `BUY_RISE` 0, `goods.ts:69`). Stapeln wäre erst bei `f < 1,185` sicher, dann verfehlt K1.
- **Regel: Boom und Vorliebe stapeln nicht, das Höhere gilt.** `m = max(boom ? BOOM_PCT : 100, vorliebe ?
PREFER_PCT : 100)`. Ganzzahlig wie bisher (`floor(acc ÷ 10 000)`, `trade.ts:81`). Invariante: `max(BOOM_PCT,
PREFER_PCT) · s < 80 · b` für jedes Vorliebe-Gut.

## W.6 Entartete Strategien und Randfälle (Pflichtnachweis e)

1. **Produktion auf der Fremdinsel, Verkauf dort:** R4 (W.4). Begrenzt durch die globale Erholung 60/min je Gut.
2. **Trait der einen Insel, Vorliebe der anderen:** Glas von Felsbucht (10,75) nach Weidenau: 26 − 10,75 − Weg gegen
   9,25 vor Ort = **+6 − Weg** je Stück, ≤ 360/min − Schiffe. Die Trait-Regel gilt nur je Insel; der Vorteil bleibt in
   der Obergrenze `(f − 1) · s · 60`. Hinnehmbar, im Spec nennen. Fremd-Fremd-Wege gibt es (`seaLanes`,
   `islands.ts:351`), ihre Länge ist nicht durch `dMin/dMax` begrenzt.
3. **Alles an eine Insel:** Je Insel nur ein Gut; `sellPct` global, also kein Stapeln über zwei Kontore.
4. **Schiff nur fürs Verkaufen / Pendel:** W.2. Lohnt erst ab ≈ 25 Stück Konsumgut je Fahrt (Stoff d 30: 90 ÷ 3,6
   je Stück); Routen entladen nur ins Insellager (`ships.ts:148–157`), der Verkauf ist ein Klick.
5. **Aufträge und Stammkunde:** `orders.ts` liest weder `sell` noch `sellPct` (grep leer); keine Wechselwirkung.
   Dieselbe Ware kann nur einmal geliefert oder verkauft werden.
6. **Fremdkontor fehlt:** `noKontorTrade` → «Kein Kontor auf …» (`trade.ts:85–90, 131–132`): kein Effekt.
7. **Krisen:** Brand/Sturm sperren den Verkauf nicht; Boom per W.5. `sell` prüft `goodLock` nicht (nur `buy`,
   `trade.ts:97`); gilt schon heute daheim, ändert sich nicht.
8. **Rückweg:** Heimat ohne Vorliebe, kein Bonus.

## W.7 Controller und Baseline (Pflichtnachweis f)

Der Balance-Controller verkauft nur in `sellSurplus` (`tests/sim/controller.ts:264–268`):
`sell(w, g, home(w).stock[g] - SURPLUS_KEEP)` **ohne Inselargument**, also `island = HOME` (Default, `trade.ts:128`).
Die Heimat steht nicht in `ISLANDS` und hat keine Vorliebe → `m = 100`, Erlös **bitgleich**, Baseline unverändert,
`tests/sim/balance.test.ts` unberührt, kein Ruling nötig. Bedingung für die Umsetzung: `sellPrice` bekommt `island`
mit Default `HOME`, Vorliebe nur über `IslandDef` der Fremdinsel. Save: O2 nein (feste Tabelle).

## W.8 Optionen im Vergleich

- **O1 Scout-Tabelle (zwei Güter, ×1,30):** Bricht das Ziel an drei Stellen. (1) **Werkzeug** auf Weidenau 170 je
  Fahrt, netto 65–80 (56–80/min je Schiff), spürbar wie Stoff, obwohl kein Konsumgut. (2) Holz (Felsbucht,
  Weidenau) und Nahrung (Felsbucht) sind tote Einträge (−45 … −86 je Fahrt). (3) Möweninsel mit Rum und Stoff auf dem
  kürzesten Weg: Rum 114–155/min je Schiff, Felsbucht und Weidenau ohne Konsumgut. Keine Ortswahl.
- **O2 (Zuordnung A, 1,30):** alle Kriterien erfüllt (W.1–W.7). **Empfehlung.**
- **O3 gewürfelt:** Mit Trait-Regel sind nur A und B zulässig, das Würfeln ist ein Münzwurf; in 50 % der Karten B
  (Felsbucht tot, W.3). Ohne Regel kommen Felsbucht Glas (Trait: +6 · 60 = **+360/min** auf die 555 von W.4) und
  Weidenau Rum/Stoff (Rohr/Wolle 2,5 statt 5) hinzu. Eigener Strom nötig (`PREFER_SALT` ≠ `ISLANDS_SALT`
  `sea.ts:81`, ≠ `CRISIS_SALT` `crises.ts:22`, ≠ 0x9e3779b1 `orders.ts:59`). Save-Frage: aus Seed ableiten (kein Feld,
  aber jede Def-Änderung vertauscht alte Stände still) oder speichern (Save-Version, Abweisungstest).

**Def-Form (O2):** in `src/sim/defs/sea.ts` `IslandDef.prefers: readonly GoodId[]` (Möweninsel `['cloth']`, Weidenau
`['glass']`, Felsbucht `['rum']`) und `PREFER_PCT = 130`. Ein Faktor für alle reicht (W.1); die Liste bleibt für
Erweiterung 1 (Porzellan, Konfekt) offen, ohne Teil dieser Rechnung zu sein. Invarianten-Test: je Vorliebe-Gut
`max(BOOM_PCT, PREFER_PCT) · s < 80 · b`, `s > 6` (kein Rohgut), Gut nicht `spice`, Kette nicht in
`TRAIT_BUILDINGS` derselben Insel.

## Offene Punkte für lead-design

1. **Faktor 1,30 und Zuordnung A** (Möweninsel Stoff, Weidenau Glas, Felsbucht Rum). Empfehlung annehmen.
2. **Boom-Regel «das Höhere gilt»** statt Stapeln (Rum 35,1 > 32). Ohne Regel ist 1,30 nicht zulässig. Ruling-Entwurf:
   «Boom und Inselvorliebe stapeln nicht, das Höhere gilt — sonst Kauf-und-Verkauf-Gewinn bei Rum (+186/min im Boom)
   — Kosten bei Irrtum: ein Faktor im Erlös, kein Save».
3. **Obergrenze R3/R4 (≤ 17–24 % von (b))** nur mit ≈ 30 Zusatzbetrieben und Stückel-Verkauf. Empfehlung: hinnehmen
   und im Spec als bekannte Grösse nennen. Falls strenger gewünscht: Vorliebe-Verkauf senkt `sellPct` um 2 statt 1
   (halbiert die Obergrenze, R1 unverändert); kostet eine Zeile, kein Save.
4. **Cross-Insel-Trait (W.6 Punkt 2)** hinnehmen; die Trait-Regel nur je Insel prüfen.
5. **Befund ausserhalb Scope (für `docs/beobachtungen.md`):** Die Markt-Erholung beträgt 60 Punkte/min
   (`timing.ts:18`, `tick.ts:45`), nicht ≈ 6. I-047-Anhang W.2/W.4 («Überschuss ≤ 6/min») und Spätspiel B.5 rechnen mit
   dem zehnfach kleineren Wert; ihre Basis-F-Grenzen sind damit zu streng. Rum-Paar daheim ist ohne Vertrag +36/min
   (12 · 18 − 180), nicht −72.
6. **Briefing-Korrektur:** Schiff 15 je 100 Ticks = 90/min.
