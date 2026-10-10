# I-048 Zukauf-Aufschlag — Anhang 01: Werte und Bilanzen

`design-economy-designer` · Paket `design-i048-zukauf` · Abnahme `lead-design` · Basis für `design-spec-author`.
Zahlen aus Scratchpad-Skript `i048.py`. 1 Tick = 100 ms. Steuer/Bedarf (README: je Einwohner pro 10 s) und
Unterhalt (je 100 Ticks) sind ×6 auf **pro min** umgerechnet. **▶ = Empfehlung.**

## a) Regel und Werte

▶ Konstanten:

| Datei            | Konstante                | Wert        | Bedeutung                                      |
| ---------------- | ------------------------ | ----------- | ---------------------------------------------- |
| `defs/goods.ts`  | `BUY_RISE`               | 2           | Aufschlag je gekaufter Einheit (Prozentpunkte) |
| `defs/goods.ts`  | `BUY_CAP`                | 160         | Obergrenze Kaufanteil (%)                      |
| `defs/timing.ts` | `BUY_RECOVERY_INTERVAL`  | 10          | alle 10 Ticks −1 Punkt je Gut, bis 100         |
| `defs/timing.ts` | `SELL_RECOVERY_INTERVAL` | **10 → 20** | siehe e)                                       |

▶ Eigene Konstante für die Kauf-Erholung: Kauf (Grenze ohne Aufschlag) und Verkauf (Ertragsgrenze) haben
verschiedene Aufgaben und werden hier verschieden gesetzt.

**Zustand:** `world.buyPct: Record<GoodId, int>`, 100…160, Start 100 (Spiegel von `sellPct`).

**Preis** (wie `sellPrice`: Anteil vor jeder Einheit, danach Anstieg):

```
acc = Σ_{i<n} GOODS[g].buy × p_i ,  p_0 = buyPct[g],  p_{i+1} = min(BUY_CAP, p_i + BUY_RISE)
e   = activeEdictDef(world)?.buyPct ?? 100
buyPrice = floor((acc * e + 9999) / 10000)      // einmal aufrunden über die Menge
```

- Aufrunden beim Kauf ist das Gegenstück zum Abrunden beim Verkauf: Rundung nie zugunsten des Spielers.
- **Bitgleich:** Mit `buyPct` 100 und `BUY_RISE` 0 ergibt die Formel genau den heutigen Preis (`n×buy`, mit Edikt
  `floor((n×buy×80+99)/100)`). Geprüft für alle 10 Güter, n = 1…100, mit und ohne Edikt.
- Nur ein **erfolgreicher** Kauf setzt `buyPct[g] = min(BUY_CAP, buyPct[g] + n × BUY_RISE)`.
- `tickMarket`: alle `BUY_RECOVERY_INTERVAL` Ticks `buyPct[g] = max(100, buyPct[g] − 1)`, nicht bei Tick 0.
- Das Edikt Handel wirkt multiplikativ auf den Preis, das Steigen des Anteils bleibt gleich.

**Beispiel Werkzeug (40), Anteil 100 % zu Beginn:**

| Menge | heute | neu  | Mittel | heute Edikt | neu Edikt | Anteil danach |
| ----- | ----- | ---- | ------ | ----------- | --------- | ------------- |
| 1     | 40    | 40   | 100 %  | 32          | 32        | 102           |
| 10    | 400   | 436  | 109 %  | 320         | 349       | 120           |
| 30    | 1200  | 1548 | 129 %  | 960         | 1239      | 160           |
| 100   | 4000  | 6028 | 151 %  | 3200        | 4823      | 160           |

▶ **Ein Anteil je Gut für die ganze Welt** (wie `sellPct`), nicht je Insel. Gründe: (1) Je Insel liesse sich der
Aufschlag umgehen: an zwei Kontoren kaufen und die Ware verschiffen ergäbe 60 statt 30/min ohne Aufschlag.
(2) Ein Markt je Gut, für Kauf und Verkauf gleich. (3) Im Spielstand nur 10 Zahlen.

**Dauerkauf** (Brocken alle 10 s wie der Controller), mittlerer Anteil im eingeschwungenen Zustand:

| Rate/min           | 6   | 12  | 18  | 24  | 30  | 36  | 60  | 120 |
| ------------------ | --- | --- | --- | --- | --- | --- | --- | --- |
| Erholung 1 Pkt/s ▶ | 100 | 101 | 102 | 103 | 104 | 155 | 157 | 158 |
| Erholung 1 Pkt/2 s | 100 | 101 | 147 | 158 | 158 | 159 | 159 | 160 |

Es gibt eine Schwelle bei `60 / (BUY_RISE × Intervall in s)` = **30/min**. Darunter zahlt man fast den
Listenpreis, darüber steigt der Anteil bis zum Deckel. Zum Vergleich: 1 Siedlerhaus braucht 9,6 Stoff/min,
10 Häuser brauchen 96/min.

## b) Frühspiel (15 min, Startgeld 5000, Werkzeug 20)

Werkzeug gibt es bis zur Schule **nur über den Kauf**, denn der Werkzeugmacher braucht `school`. Der Bedarf liegt
bei ≈ 40–80 Stück (Betriebe 1–3, Kapelle 5, Aufstieg 2/5 je Haus). Der Controller kauft vor jedem Bau nur, was
fehlt (Brocken meist ≤ 10). Im Dialog kauft man 1 oder 10 Stück.

Mehrkosten für 60 Werkzeug, Brocken jeweils ≥ 20 s auseinander:

| Brocken | je Brocken    | gesamt | vom Startgeld |
| ------- | ------------- | ------ | ------------- |
| 5       | +8 (104 %)    | +96    | 1,9 %         |
| 10      | +36 (109 %)   | +216   | 4,3 %         |
| 30      | +348 (129 %)  | +696   | 13,9 %        |
| 60      | +1068 (145 %) | +1068  | 21,4 %        |

25 Holz am Stück kosten +60 (124 %).
▶ **Grenzwert:** Bei Brocken ≤ 10 bleiben die Mehrkosten in 15 min **≤ 5 % des Startgelds (250)**. Erwartet
sind ≈ 4 %. Wer 30 und mehr am Stück kauft, zahlt spürbar drauf, und das ist gewollt. Die Schwelle von 30/min liegt
weit über dem Werkzeugbedarf der Pioniere. Reisst die Neumessung den Grenzwert, ist der erste Hebel `BUY_RISE`
2 → 1 (10er-Brocken dann 104,5 %).

## c) Dauer-Zukauf gegen Eigenbau (volle Auslastung)

Stückkosten = Unterhalt ÷ Ausstoss + Vorprodukte zum Eigenpreis (Holz 1,5, Wolle 5, Zuckerrohr 5, Stein 6).
Break-even = Unterhalt der Kette pro min ÷ Kaufpreis.

| Gut      | Ausstoss/min | Stück eigen | Kauf 100 % | Kauf 160 % | Break-even/min     |
| -------- | ------------ | ----------- | ---------- | ---------- | ------------------ |
| Holz     | 20           | 1,5         | 10         | 16         | 3,0                |
| Werkzeug | 7,5          | 21,5        | 40         | 64         | 4,0 (+Schule: 7,5) |
| Stein    | 10           | 6           | 15         | 24         | 4,0                |
| Nahrung  | 15           | 2           | 8          | 12,8       | 3,8                |
| Stoff    | 12           | 12,5        | 30         | 48         | 5,0                |
| Rum      | 12           | 15          | 40         | 64         | 4,5                |
| Glas     | 12           | 20          | 50         | 80         | 4,8                |
| Gewürz   | 12           | 7,5         | 40         | 64         | 2,2                |

- **< 3–5/min:** Kaufen ist billiger als die Fixkosten einer Kette.
- **5–30/min:** Eigenbau ist 2–5× billiger je Stück. Kaufen spart dafür Platz, Material und Aufbauzeit. Hier
  liegt die **echte Wahl**, z. B. Stoff für 1–2 Siedlerhäuser.
- **> 30/min:** 160 %, Eigenbau ist 3–8× billiger. Dauer-Zukauf im Stadtmassstab kostet spürbar, wie gewollt.

## d) Arbitrage

- Verkauf ÷ Kauf liegt heute bei höchstens 0,45 (Rum). Der Aufschlag macht den Abstand nur grösser.
- Ungünstigster Fall: Edikt Handel und Boom (150 %) bei Rum ergeben 27 Erlös gegen 32 Kauf. Das ist ein Verlust.
- **Handelsaufträge:** Die Prämie `floor(GOODS[g].buy × 0,75)` (`src/sim/orders.ts:23`) hängt am **Grundpreis**
  und bleibt vom Aufschlag **unberührt**. Auch zum günstigsten Zukauf (Edikt, 100 %) liegt jede Prämie unter dem
  Kaufpreis: Holz 7 < 8, Nahrung 6 < 6,4, Stein 11 < 12, Wolle 9 < 9,6, Stoff 22 < 24, Zuckerrohr 9 < 9,6,
  Rum 30 < 32, Glas 37 < 40. Am knappsten ist Nahrung ×10 mit 64 gegen 60.
  ▶ **Bestätigt:** Zukauf für Aufträge bringt nie Gewinn. Der Satz im README bleibt wahr.

## e) Verkaufserholung (Befund 2026-10-10)

Verkauf hat dieselbe Schwelle: −1 Pkt je Einheit, +60 Pkt/min. Bis **60/min je Gut** verkauft man nahe 100 %,
darüber fällt der Anteil auf den Boden von 30 %. Holzfäller: 20/min, Unterhalt 30/min, Verkauf alle 10 s.

| Holzfäller | 1 Pkt/s brutto | netto    | 1 Pkt/2 s brutto | netto   |
| ---------- | -------------- | -------- | ---------------- | ------- |
| 1          | 79             | **+49**  | 79               | **+49** |
| 2          | 155            | +95      | 52*              | −8*     |
| 3          | 229            | **+139** | 76*              | −14*    |

\* Alles verkauft, Anteil am Boden. Wer klug verkauft (höchstens 30/min), kommt auf 120 brutto, **+75 netto**.

Vergleich mit der Steuer: Ein Pionier bringt netto +6/min (12 − 3 Nahrung × 2). Drei Holzfäller für den Verkauf
entsprechen damit **23 Pionieren**, kosten zusammen 150 Geld + 3 Werkzeug und haben sich nach ≈ 1 min bezahlt.
Damit verdoppelt der Holzhandel das Frühspiel-Einkommen mehr als, und das ist die „Geldquelle ohne Wahl".
Ab Bürgern spielt er keine Rolle mehr (ein Haus bringt 1260/min brutto). Dauerverkauf eigener Ware lohnt
sonst nur bei Rum (+36), Nahrung (+15) und Gewürz (+54/Plantage). Werkzeug (−49), Stoff (−6) und Glas (0) lohnen
nicht.

▶ **Entscheid: Erholung auf 1 Pkt je 2 s verlangsamen** (`SELL_RECOVERY_INTERVAL` 10 → 20).

- Der Holzhandel bringt höchstens noch +75 statt +139/min. Gewürz lohnt sich für 2,5 statt 5 Plantagen.
- Ein Holzfäller für Überschuss bleibt lohnend (+49). Bis **30/min je Gut** verkauft man weiter nahe dem
  Vollpreis. Das reicht für den Rundungsüberschuss einer Kette (Fischer 15/min, Rum-Paar 12/min).
- Die Marge pro Stück (Holz: 4 Erlös gegen 1,5 Kosten) bleibt. Wer sie ändern will, muss den Verkaufspreis
  ändern; das ist nicht empfohlen und gehört nicht zu diesem Paket.
- Baseline (`SURPLUS_AT` 50 → `SURPLUS_KEEP` 30, Brocken ≥ 20): Kommt ein Brocken alle 60 s, ändert sich nichts
  (Holz 72, Stoff 217, Rum 326/min). Kommt ein Holz-Brocken alle 30 s, sinkt der Erlös von 145 auf 58/min. Der
  Verkauf ist im Controller eine Nebenquelle. Die Wirkung auf den Sieg-Tick schätze ich auf ≤ 1 %, **nicht gemessen**.
- Ein Boom (30 s) erholt sich nur noch um 15 statt 30 Pkt und bringt etwas weniger (`balance-crises`).
- README: „10 Einheiten je Gut und 10 Sekunden" wird zu „… 20 Sekunden". Das Beispiel „100 Holz 219 statt 400"
  bleibt gültig.

Die Alternative „unverändert" ist vertretbar, wenn die Neumessung klein bleiben soll. Dann bleibt der Holzhandel
die dominante Nebenquelle im Frühspiel (+139/min).

## f) Inseln, auf denen nur der Kauf bleibt

Bilanz je Einwohner pro min (Steuer minus Bedarf, Nahrung immer selbst erzeugt zu 2):

| Stufe                           | Steuer | alles eigen | Luxusgut gekauft 100 % | 160 % |
| ------------------------------- | ------ | ----------- | ---------------------- | ----- |
| Pionier                         | 12     | +6,0        | +6,0                   | +6,0  |
| Siedler (+Stoff 1,2)            | 42     | +21,0       | 0,0                    | −21,6 |
| Bürger (+Rum 1,2)               | 84     | +45,0       | −6,0                   | −56,4 |
| Kaufmann (+Glas, Gewürz je 0,6) | 132    | +76,5       | −12,0                  | −94,8 |

Endzustand-Beispiel Kaufmann, alle Güter selbst erzeugt, nur Gewürz gekauft (die Heimat hat keins):
132 − 3·2 − 1,2·12,5 − 1,2·15 − 0,6·20 − 0,6·64 = **+42,6/min**. Mit Edikt +50,3, zum Listenpreis +57,0.

- **Gewürz** (vor Kontor II nur per Kauf): Bei 160 % bleibt die Bilanz positiv, ein Bankrott ist also nicht
  erzwungen. Es entsteht aber auch kein endloser Überschuss, weil der Kauf 44 % des Nettos frisst. Bis
  50 Kaufleute (30/min) zahlt man keinen Aufschlag. Kontor II mit eigener Plantage (7,5) wird so ein echter
  zweiter Ausbaupfad.
- **Stein** (Insel ohne Gebirge, z. B. Inseltyp A): Stein wird vor allem investiert (5–20 je Bau oder Aufstieg) und
  in kleinen Brocken zum Listenpreis gekauft. Glas mit gekauftem Stein zu 160 % kostet 38 und bleibt damit unter
  dem Kaufpreis von 50.
- **Werkzeug** vor der Schule: +4 %, siehe b).
- **Stoff, Rum oder Glas im Stadtmassstab kaufen** endet bei 160 % im Verlust. Das ist **gewollt**, denn diese
  Ketten lassen sich auf der Heimat bauen. Annahme: Die Heimat hat immer Gras (das Baseline-Layout setzt das
  voraus). Ein Seed ohne Gras wäre ein eigener Befund.

## g) Baseline und Balancing

| Szenario                             | erwartet                                                                                                                                                                                    | neu messen           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `balance.test` (Seed 3)              | kauft Holz, Werkzeug und Stein in Brocken ≤ 25. `minMoney` und `endMoney` sinken um wenige 100, der Sieg-Tick verschiebt sich um 0 bis einige 10 Ticks, das Limit 7500 hält voraussichtlich | ja                   |
| `balance-merchants`                  | `feedSpice`/`feedGlassworks` kaufen dauernd, Gewürz > 30/min läuft auf 160 %. `endMoney` und `minMoneyAfterWin` sinken deutlich                                                             | ja, grösste Wirkung  |
| `balance-crises`                     | Boom schwächer, Zukauf teurer                                                                                                                                                               | ja                   |
| `balance-edicts`                     | Edikt Handel relativ stärker                                                                                                                                                                | ja                   |
| `balance-upgrade`, `unlock-timeline` | nur betroffen, wenn der Controller läuft                                                                                                                                                    | prüfen               |
| `balance-flow`                       | ohne Handel                                                                                                                                                                                 | voraussichtlich nein |

▶ **Empfehlung: zwei Schritte, kein dauerhafter Schalter.**

1. **Mechanik-Paket:** `BUY_RISE` 0, `SELL_RECOVERY_INTERVAL` 10, dazu Formel, `buyPct`, Save v12 und Anzeige. Die
   Baseline bleibt **bitgleich** (für `buyPrice` nachgerechnet). Das zeigt, dass die Mechanik keine Drift bringt.
2. **Werte-Paket:** `BUY_RISE` 2 und `SELL_RECOVERY_INTERVAL` 20, alle balance-Szenarien in einem Zug neu
   messen, ein Ruling.

Ein Testschalter (Weltflag „ohne Aufschlag") ist nicht empfohlen: Er verstösst gegen „Spielwerte nur in defs", und
der Regressionsschutz prüfte dann ein Spiel, das niemand spielt.

**Ruling-Entwürfe für L0:**

- Kaufaufschlag je Gut weltweit, +2 Pkt/Einheit, Deckel 160 %, Erholung 1 Pkt/s, einmal aufrunden, Edikt
  multiplikativ — Zukauf über 30/min wird 1,6× teurer, kleine Zukäufe und das Frühspiel bleiben bei ≈ 100 %
  (+4 %) — Kosten bei Irrtum: ein defs-Wert und eine Neumessung.
- Verkaufserholung 1 Pkt je 2 s — halbiert den Vollpreis-Kanal (60 → 30/min je Gut), Holzhandel +139 → +75/min,
  Überschussverkauf bleibt sinnvoll — Kosten bei Irrtum: ein defs-Wert, eine README-Zeile, eine Neumessung.
- Baseline-Neumessung aller Controller-Szenarien, Grenzen bleiben (`WIN_TICK_LIMIT` 7500, `MAX_TICKS` 9000,
  Geld > 0) — Kosten bei Irrtum: Reisst eine Grenze, wird zuerst `BUY_RISE` 2 → 1 gesenkt, die Grenze bleibt.

## h) Randfälle

- **Lager voll / Zu wenig Geld / Kein Geld:** Der Kauf scheitert, `buyPct` bleibt unverändert, die Prüfreihenfolge
  wie heute.
- **Controller:** Er ruft `buyPrice` und dann `buy` auf, beide lesen denselben Anteil. Mehrere Güter in einem Aufruf
  heben nur den Anteil des jeweiligen Guts.
- **Anzeige:** Neben dem Verkaufs-«Preis … %» kommt je Gut «Kauf … %» (100…160). Jeder Kaufknopf (1/10) nennt den
  genauen Preis mit Aufschlag und Edikt. Der Kostenkontext in `src/ui/app.ts` muss `buyPrice` verwenden, nicht
  `n × buy`.
- **Bau- und Ausbaukosten** bleiben unberührt. Aufschlag fällt nur an, wenn fehlende Ware am Kontor gekauft wird.
- **Handelsaufträge:** Prämie aus `GOODS[g].buy`, ohne Aufschlag (d).
- **Save:** `buyPct` je Gut, ganzzahlig 100…160. Ein Wert ausserhalb wird mit Hinweis abgewiesen, ohne Absturz,
  dazu ein Test. **Migration v11 → v12:** alle 100. Neue Güter später mit `??= 100`.
- **Boom** wirkt nur auf den Verkauf. **I-006** (Sonderangebot, Anteil < 100) nicht gleichzeitig einplanen, sonst
  bricht der Boden 100 der Erholung.
