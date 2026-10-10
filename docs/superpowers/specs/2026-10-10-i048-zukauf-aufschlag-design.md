# I-048 «Zukauf-Aufschlag» (Kaufsättigung) und langsamere Verkaufserholung — Design-Spec

Datum: 2026-10-10 · Paket design-i048-zukauf, Nachtrag design-i048-nachtrag · Meilenstein: ohne · Status: **Gate Spec
BEDENKEN (R490), Nachtrag eingearbeitet; nächster Schritt Plan (lead-tech), kein Zweit-Gate** · Prozessstufe voll

Grundlage: [Anhang 01 Werte und Bilanzen](2026-10-10-i048-zukauf-aufschlag-design/anhang-01-werte-bilanzen.md)
(`design-economy-designer`, abgenommen von lead-design; **massgeblich für alle Zahlen**); `docs/ideen.md` I-048;
[Hauptspec](2026-09-29-inselreich-design.md); Muster: [Spec M13-E1 Edikte](2026-10-10-m13-e1-edikte-design.md) (R4
Kaufpreis mit Edikt Handel). Code-Stand der Prüfung: `main` 8b6d4759 (`src/sim/trade.ts`, `defs/goods.ts`,
`defs/timing.ts`, `src/ui/trade.ts`, `src/ui/app.ts` `tradeCtx`, `src/sim/save.ts` `isValidV2Fields`).

Kennzeichnung: **Setzung Spec** (hier ergänzt, im Anhang nicht festgelegt), **[Tech]** (Umsetzungsdetail; lead-tech
entscheidet im Plan, die Spec legt nur das prüfbare Verhalten fest). Verweise «Anhang a) … i)» meinen die Abschnitte
von Anhang 01.

**Nachtrag R490** (Gate-Urteile `.studio/handoffs/2026-10-10-lead-qa-GATE-SPEC-I048.md`,
`…-lead-tech-GATE-SPEC-I048.md`; Rulings R487, R489, R490):

- Denkmal-Zukauf zahlt den gültigen Aufschlag, hebt `buyPct` nicht (Z3, §5, AK-ZK-29, README; qa B1, tech B1).
- Reiner Preiskern `buyQuote` mit `rise`/`cap` als Parameter; AK-ZK-08/-21 prüfen ihn ohne Mock (Z2; qa B3).
- §6: `balance-monument.test.ts` in der Liste; Klassenregel für jeden roten Test in Schritt B (tech B2, R490 B2).
- Determinismus über Speichern/Laden (AK-ZK-30), «kein Kauf-Verkauf-Gewinn» als eigener AK (AK-ZK-31), «Verkauf … %»
  als neuer Helfer mit AK (AK-ZK-32), Rückfaltung `buyPct` (AK-ZK-33) (qa B2, B6, B9; tech B4b).
- Namen: Edikt-Faktor heisst `EdictDef.buyFactorPct` (bisher `EdictDef.buyPct`), lokal `edictPct` (tech B4a).
- Save-Weiche v12/v13 nach R490 B3 (§8). Verweis `M13:AK-M13E1-10` mit Meilenstein-Präfix (qa R136).
- Ohne geschlossene Form in Z2 (tech B4c); AK-ZK-01/-17 gegen `SAVE_VERSION` (qa B7).

## 1. Ziel

**Spielerzweck:** «Wer jeden Engpass mit Geld löst, zahlt bis 60 % drauf; wer klein zukauft, merkt nichts.»

Säule **Wirtschaft, Steuern und Handel**. Heute sind die Kaufpreise fest (README «Handel»): Jeder Mangel lässt sich
mit Geld beheben, und Bauen statt Kaufen ist keine Entscheidung. Umgekehrt ist Dauerverkauf von Holz im Frühspiel eine
Geldquelle ohne Wahl (drei Holzfäller für den Verkauf bringen +139/min, so viel wie 23 Pioniere; Anhang e).

I-048 spiegelt die bestehende Verkaufssättigung auf die Kaufseite: Jede gekaufte Einheit hebt den Kaufpreis dieses
Guts um 2 Prozentpunkte, höchstens auf 160 %; der Anteil erholt sich um 1 Punkt je Sekunde. Bis ≈ 30 Einheiten je
Minute und Gut zahlt man fast den Listenpreis, darüber steigt der Preis bis zum Deckel (Anhang a). Gleichzeitig erholt
sich der Verkaufsanteil nur noch um 1 Punkt je 2 Sekunden.

**Im ersten 15-min-Spiel spürbar:** Werkzeug gibt es vor der Schule nur über den Kauf. 10 Werkzeug am Stück kosten
436 statt 400 Geld (im Mittel 109 %), die Spalte zeigt danach «Kauf 120 %» und sinkt in 20 s zurück auf 100 %. Wer
in Zehnerbrocken kauft, zahlt in 15 min ≈ 4 % des Startgelds drauf; wer 30 am Stück kauft, zahlt 29 % drauf
(Anhang b).

## 2. Umfang und ausdrücklich nicht

**Im Umfang:**

- Sim: Zustand `world.buyPct` je Gut; reiner Preiskern `buyQuote`, neue Preisformel `buyPrice`; Anstieg bei
  erfolgreichem `buy`; Erholung in `tickMarket`; `SELL_RECOVERY_INTERVAL` 10 → 20.
- Denkmal-Zukauf (M13-E2 R7): zahlt den Preis mit Aufschlag über `buyPrice`, hebt den Anteil nicht (Z3, R489).
- Umbenennung `EdictDef.buyPct` → `EdictDef.buyFactorPct` (reine Umbenennung, kein Wert, kein Save-Inhalt).
- Save: Feld `buyPct`, Save-Version v12 (geteilt mit M13-E2) oder v13 nach der Weiche in §8, Migration,
  Ladeprüfung, Rückfaltung, Abweisen mit Hinweis.
- UI Handelsdialog: Spalte «Kauf … %», Beschriftung «Preis … %» → «Verkauf … %» (R487 P-3), Kaufknöpfe mit genauem
  Preis; reine Helfer mit Vitest.
- Baseline in zwei Schritten (A bitgleich, B Neumessung) im selben Umsetzungs-Paket; README, arc42.

**Ausdrücklich nicht:**

- Bau- und Ausbaukosten (Holz, Werkzeug, Stein aus dem Lager): kein Aufschlag. Er fällt nur an, wenn fehlende Ware
  am Kontor gekauft wird (Anhang h).
- Verkaufspreise selbst (`GOODS[g].sell`), `SELL_DROP`, `SELL_FLOOR`; die Marge je Stück bleibt (Anhang e).
- Auftragsprämien: bleiben `floor(GOODS[g].buy × ORDER_PREMIUM)` am **Grundpreis**, ohne Aufschlag (Anhang d).
- Boom auf der Kaufseite: Der Boom wirkt weiter nur auf den Verkauf.
- I-006 «Sonderangebot» (Anteil < 100): nicht im selben Zug, sonst bricht der Boden 100 der Erholung (Anhang h).
- Märkte je Insel: ein Anteil je Gut für die ganze Welt (Anhang a, drei Gründe).
- Kontor-Kopf-Trenner aus der Beobachtung M13-E1 (2): eigenes Thema.
- Controller-Strategie: unverändert (kein «klügeres» Kaufen); nur die Neumessung in Schritt B.
- Testschalter «ohne Aufschlag» als Weltflag (Anhang g: verstösst gegen «Spielwerte nur in defs»).
- Mobil-Optimierung (Desktop-first ab 1280 px).

## 3. Regeln

Begriffe und Namen (eindeutig, Nachtrag R490 / tech B4a):

| Begriff      | Name im Code                                                    | Bedeutung                                          |
| ------------ | --------------------------------------------------------------- | -------------------------------------------------- |
| Kaufanteil   | `World.buyPct[g]` (Save-Schlüssel, Spiegel von `sellPct`)       | Marktanteil je Gut, ganzzahlig 100 … `BUY_CAP`     |
| Edikt-Faktor | `EdictDef.buyFactorPct` (bisher `EdictDef.buyPct`)              | 80 bei Edikt Handel, sonst 100 (Spec M13-E1 R4)    |
| wirkend      | lokal `edictPct` = `activeEdictDef(world)?.buyFactorPct ?? 100` | Faktor in Z2; nie unter dem Namen `buyPct` geführt |
| Listenpreis  | `GOODS[g].buy`                                                  | Preis je Stück ohne Aufschlag und Edikt            |

- Die Umbenennung `EdictDef.buyPct` → `buyFactorPct` ist reine Umbenennung (Fundstellen heute: `defs/edicts.ts`,
  `types.ts`, `sim/trade.ts`, `ui/edictView.ts`, `ui/trade.ts`, `tests/sim/defs.test.ts`); Werte, Texte und
  Save-Inhalt bleiben (Defs werden nicht gespeichert). In Texten heisst `buyPct` nur noch der Kaufanteil.

### Z1 Zustand

- `world.buyPct: Record<GoodId, number>`, je Gut **ein Wert für die ganze Welt** (alle Kontore, alle Inseln), wie
  `sellPct`.
- Wertebereich ganzzahlig 100 … `BUY_CAP` (160). Start in `createWorld`: alle 100.
- Kein RNG-Zugriff, keine Abhängigkeit von Insel, Kontor oder Krise.

### Z2 Preisformel

Wie `sellPrice`: Der Anteil gilt **vor** jeder Einheit, danach steigt er; einmal aufrunden über die ganze Menge.

**Reiner Preiskern (Setzung Spec, qa B3):** `buyQuote(list, startPct, n, rise, cap, edictPct)` in `src/sim/trade.ts`,
exportiert, ohne Welt-Zugriff, alle Werte ganzzahlig [Tech: Name]. Er liefert `{ price, meanPct, endPct }`:

```
p_0 = startPct
p_{i+1} = min(cap, p_i + rise)
acc = Σ_{i=0}^{n−1} list × p_i
price   = floor((acc × edictPct + 9999) / 10000)
meanPct = Math.round(Σ_{i=0}^{n−1} p_i / n)        (ohne Edikt)
endPct  = min(cap, startPct + n × rise)
```

- `buyPrice(world, g, n)` = `buyQuote(GOODS[g].buy, world.buyPct[g], n, BUY_RISE, BUY_CAP, edictPct).price`.
- `buy` setzt den neuen Anteil aus `endPct` desselben Aufrufs; die UI liest `meanPct` (§7.1). Damit hängen Preis,
  Anstieg und Text an einer Rechnung, und die Bitgleichheit ist ohne Modul-Mock prüfbar (AK-ZK-08, -21).

- Aufrunden beim Kauf ist das Gegenstück zum Abrunden beim Verkauf: Rundung nie zugunsten des Spielers.
- Das Edikt Handel wirkt **multiplikativ** auf den Preis; der Anstieg des Anteils bleibt gleich (Z3).
- **Bitgleich:** Mit `buyPct` 100 und `BUY_RISE` 0 ergibt die Formel genau den heutigen Preis: `n × buy`, mit Edikt
  `floor((n × buy × 80 + 99) / 100)` (nachgerechnet für alle 10 Güter, n = 1 … 100, mit und ohne Edikt).
- `buyPrice` und `buyQuote` bleiben rein (lesen, schreiben nicht). Eine Schleife über n genügt (n ≤ `STORAGE_CAP`
  100 in `buy`, UI n ∈ {1, 10}); keine geschlossene Form (tech B4c). Zwischenwerte höchstens
  100 × 50 × 160 × 100 < 2³¹.

**Rechenbeispiel Werkzeug (Listenpreis 40), Anteil 100 % zu Beginn** (Anhang a):

| Menge | heute | neu  | Mittel | heute Edikt | neu Edikt | Anteil danach |
| ----- | ----- | ---- | ------ | ----------- | --------- | ------------- |
| 1     | 40    | 40   | 100 %  | 32          | 32        | 102           |
| 10    | 400   | 436  | 109 %  | 320         | 349       | 120           |
| 30    | 1200  | 1548 | 129 %  | 960         | 1239      | 160           |
| 100   | 4000  | 6028 | 151 %  | 3200        | 4823      | 160           |

Weitere Werte für Tests (Setzung Spec, nachgerechnet): Werkzeug 10 bei Anteil 160 → 640 (Edikt 512); Werkzeug 10 bei
Anteil 109 → 472; Nahrung 10 mit Edikt ab 100 → 70 (heute 64); Holz 25 ab 100 → 310 (+60, Mittel 124 %).

### Z3 Anstieg nur bei erfolgreichem Kauf

- Nach einem **erfolgreichen** `buy(world, g, n, island)`: Geld wird um `buyPrice(world, g, n)` gesenkt (Preis mit dem
  Anteil **vor** dem Kauf), danach `buyPct[g] = min(BUY_CAP, buyPct[g] + n × BUY_RISE)`.
- Jeder Fehlschlag (`'Unbekannte Insel'`, `'Kein Kontor auf …'`, Freischalt-Sperre, `'Ungültige Menge'`,
  `'Kein Geld'`, `'Lager voll'`, `'Zu wenig Geld'`) lässt `buyPct` unverändert; die Prüfreihenfolge bleibt wie heute.
- Nur das Gut `g` wird gehoben; die Anteile anderer Güter bleiben.
- Beispiel: 10 Werkzeug ab 100 → Geld −436, `buyPct.tools` 120; danach weitere 10 → Geld −516, Anteil 140.
- **Ausnahme Denkmal-Zukauf (R489, R490 B1):** Der Zukauf des Denkmal-Zugs (M13-E2 R5.2/R7.3, eine einzige
  Zukauf-Funktion in `trade.ts`) **zahlt** je Stück `buyPrice(w, g, 1)` zum gültigen Anteil und Edikt, **hebt
  `buyPct` aber nicht**. Nur `buy` (Handelsdialog, Controller) hebt den Anteil.
  - Begründung: Die Denkmal-Summen bleiben rechenbar (64 200 / 54 960 Geld bei Kaufanteil 100, M13-E2 AK-11/-12 auf
    Anteil 100 festgelegt); der gerade gegatete Lauf `balance-monument` verschiebt sich nicht um ≈ 30 % (Variante
    «hebt», tech B1 A); keine Rückkopplung des Denkmals auf normale Bauten.
  - Kein Ausnutzen: Denkmal-Ware ist nicht verkäuflich, sie verlässt den Markt.
  - Bewusste Kosten (R490): Während eigene Handkäufe den Anteil hochhalten, zahlt das Denkmal mit; ohne Handkauf kauft
    es dauerhaft zum Listenpreis, auch über 30 Stück je Minute (Anhang i).
  - Beispiel: `buyPct.stone` 120 nach `buy(w, 'stone', 10)` → nächster Denkmal-Zug Stein kostet 18 (mit Edikt 15)
    statt 15; Anteil danach weiter 120 (bis zur nächsten Erholung).

### Z4 Kauf-Erholung

- In `tickMarket`: wenn `tick ≠ 0` und `tick % BUY_RECOVERY_INTERVAL = 0`, für jedes Gut
  `buyPct[g] = max(100, buyPct[g] − 1)`.
- Bei Tick 0 keine Erholung (wie beim Verkauf).
- Beispiel: Anteil 120 bei Tick 1000 → Tick 1190: 101, Tick 1200: 100 (20 Schritte = 200 Ticks = 20 s bei 1×).
- Schwelle des eingeschwungenen Zustands: `60 / (BUY_RISE × Intervall in s)` = **30 Einheiten je min und Gut**;
  darunter bleibt das Mittel bei ≤ 104 %, darüber läuft es auf 155–160 % (Anhang a, Tabelle «Dauerkauf»).

### Z5 Verkaufserholung verlangsamt

- `SELL_RECOVERY_INTERVAL` 10 → **20**: der Verkaufsanteil erholt sich um 1 Punkt je 2 s statt je 1 s; Formel und
  Grenzen (`SELL_DROP` 1, `SELL_FLOOR` 30, Höchstwert 100) unverändert.
- Beispiel: `sellPct.wood` 80 bei Tick 1000 → Tick 1380: 99, Tick 1400: 100.
- Kauf- und Verkaufserholung prüfen ihr Intervall **getrennt**: das heutige frühe `return` in `tickMarket` wird
  aufgeteilt, eine Erholung darf die andere nicht auslassen.
- Folge (Anhang e): Vollpreis-Kanal halbiert (60 → 30/min je Gut), Holzhandel mit drei Holzfällern +139 → höchstens
  +75/min; ein Holzfäller für Überschuss bleibt lohnend (+49/min). Das Beispiel «100 Holz bringen 219 statt 400»
  bleibt gültig (es hängt nur an `SELL_DROP`).

## 4. Datenmodell und Def-Einträge

| Ort                      | Eintrag                            | Wert / Typ                                         |
| ------------------------ | ---------------------------------- | -------------------------------------------------- |
| `src/sim/defs/goods.ts`  | `BUY_RISE`                         | 2 (Prozentpunkte je gekaufter Einheit)             |
| `src/sim/defs/goods.ts`  | `BUY_CAP`                          | 160 (Obergrenze Kaufanteil, %)                     |
| `src/sim/defs/timing.ts` | `BUY_RECOVERY_INTERVAL`            | 10 Ticks (−1 Punkt je Gut, bis 100)                |
| `src/sim/defs/timing.ts` | `SELL_RECOVERY_INTERVAL`           | **10 → 20** Ticks (Schritt B; Kommentar mitführen) |
| `src/sim/types.ts`       | `World.buyPct`                     | `Record<GoodId, number>`, neu; `World.version` neu |
| `src/sim/types.ts`       | `EdictDef.buyFactorPct`            | Umbenennung von `EdictDef.buyPct`, Werte gleich    |
| `src/sim/save.ts`        | `SAVE_VERSION`, Migration, Prüfung | v12 geteilt oder v13 (Weiche §8)                   |

- Spielwerte **nur** in `src/sim/defs/`; der Boden 100 der Kauf-Erholung ist der Listenpreis (kein Spielwert, sondern
  Definition «ohne Aufschlag»). Eine eigene Konstante `BUY_RECOVERY_INTERVAL` statt `SELL_RECOVERY_INTERVAL`, weil
  beide Erholungen verschiedene Aufgaben haben (Anhang a).
- Geänderte Sim-Funktionen: `createWorld` (`world.ts`), neu `buyQuote`, `buyPrice`, `buy`, `tickMarket`
  (`trade.ts`); der Denkmal-Zukauf (M13-E2) bleibt bei `buyPrice(w, g, 1)` ohne Anteil-Anstieg (Z3). Keine neue
  Laufzeit-Abhängigkeit, kein RNG, `src/sim/` bleibt DOM-frei.
- Neuer Weltschlüssel `buyPct` am Ende der bestehenden Schlüssel, also nach `monument`, `monumentDone` (M13-E2);
  Rückfaltung §8.

**Def-Test** (`tests/sim/defs.test.ts`): `BUY_RISE` ganzzahlig ≥ 0; `BUY_CAP` ganzzahlig > 100;
`BUY_RECOVERY_INTERVAL` und `SELL_RECOVERY_INTERVAL` ganzzahlig ≥ 1.

## 5. Randfälle

- **Lager voll / Zu wenig Geld / Kein Geld** (negatives Geld): Kauf scheitert mit dem heutigen Grund, `buyPct` und
  Geld bleiben unverändert (Anhang h).
- **Mehrere Güter:** Ein Kauf hebt nur den Anteil des gekauften Guts; die Erholung läuft für alle Güter gleichzeitig.
- **Deckel:** Bei `buyPct` 160 kostet jede Einheit 160 % (Werkzeug 10 → 640); ein weiterer Kauf lässt den Anteil
  bei 160.
- **Tick 0:** keine Erholung (auch nicht bei Anteil > 100 aus einem geladenen Stand mit `tick` 0).
- **Anteil wächst über mehrere Kontore:** Ein Kauf am Kontor II hebt denselben weltweiten Anteil wie am Heimatkontor;
  Kaufen an zwei Kontoren umgeht den Aufschlag nicht (Anhang a, Grund 1).
- **Controller und UI konsistent:** Wer `buyPrice(world, g, n)` und danach `buy(world, g, n)` im selben Tick aufruft,
  zahlt genau den gelesenen Preis; beide lesen denselben Anteil (Anhang h).
- **Kostenkontext der Meldung** (`tradeCtx` in `src/ui/app.ts`): nutzt weiter `buyPrice`, nie `n × buy`; damit nennt
  «Zu wenig Geld» den Preis mit Aufschlag.
- **Arbitrage ausgeschlossen** (Anhang d): Der Aufschlag hebt den Kaufpreis nur an; der ungünstigste Fall bleibt
  `buyPct` 100 mit Edikt (Rum mit Edikt und Boom: 27 Erlös gegen 32 Kauf; Nahrung ×10 Auftrag 60 gegen Kauf 64).
  Eigener AK ohne Auftrag: AK-ZK-31; mit Auftrag: `M13:AK-M13E1-10`. Zukauf für Aufträge bringt nie Gewinn; der
  README-Satz bleibt wahr.
- **Denkmal-Zukauf** (Z3): zahlt `buyPrice(w, g, 1)` mit Aufschlag und Edikt, hebt `buyPct` nicht; die Erholung läuft
  unabhängig davon. Ruht der Zukauf (`money` < Preis, M13-E2), bleibt `buyPct` ebenfalls unverändert. Reihenfolge
  `tickMonument` gegen `tickMarket` am selben Tick (beide bei `% 10`) legt der Plan fest [Tech]; sie ist in beiden
  Fällen deterministisch und für den Anteil ohne Folge, nur für den Preis des Zugs.
- **Edikt Handel wird erlassen, aufgehoben oder ruht:** ändert nur `edictPct`, nie `buyPct`.
- **Boom:** wirkt nur auf den Verkauf; ein Boom-Gut hat einen normalen Kaufanteil. Mit Z5 erholt sich der
  Verkaufsanteil im Boom (30 s) nur um 15 statt 30 Punkte (Anhang e).
- **Gesperrtes Gut** (`goodLock`): Kauf scheitert, Anteil bleibt 100; die Erholung läuft trotzdem für alle Güter.
- **Inseln ohne eigene Kette** (Gewürz vor Kontor II, Stein ohne Gebirge): kein Bankrott erzwungen, Bilanz bleibt
  positiv, aber kleiner (Anhang f).
- **Alter Spielstand** (v11 und älter, im Fall v13 auch v12): lädt über die Migration, alle Anteile 100, `sellPct`
  unverändert (§8).
- **Spielstand mit `buyPct` ausserhalb 100 … `BUY_CAP`** oder nicht ganzzahlig: Abweisen mit Hinweis (§8). Achtung
  wie bei `ORDER_*`: Die Ladeprüfung liest `BUY_CAP`; wer `BUY_CAP` später senkt, braucht eine Migration.

## 6. Baseline und Balancing

Zwei Schritte **im selben Umsetzungs-Paket**, kein dauerhafter Schalter (Anhang g). Ruling R487 P-1 (erweitert durch
R490 B2) erlaubt die Neumessung in Schritt B.

**Liste der Balancing-Tests** (massgeblich für Schritt A und B): `balance.test`, `balance-merchants`,
`balance-crises`, `balance-edicts`, `balance-upgrade`, `balance-monument` (aus M13-E2, R490 B1), `unlock-timeline`,
`balance-flow`.

**Schritt A — Mechanik, Baseline bitgleich.** `BUY_RISE` 0, `SELL_RECOVERY_INTERVAL` 10, dazu `buyQuote`, Formel,
`buyPct`, Erholung, Denkmal-Anbindung (Z3), Umbenennung `buyFactorPct`, Save, Rückfaltung und Anzeige. Beleg:

- alle Tests der Liste grün **ohne** Änderung an Pins oder Erwartungswerten;
- Hash-Pins und Rezept-Tests in `tests/sim/save.test.ts` grün ohne Pin- oder Fixture-Änderung (Rückfaltung §8,
  alle Anteile 100);
- Prozessbeleg am Commit A (Plan, qa B4): `make check` grün und leerer Diff gegen `main` für
  `tests/sim/balance*.test.ts`, `tests/sim/e0Pins.ts`, `tests/sim/e1Pins.ts`, `tests/sim/save.test.ts` und die
  Fixture-Dateien; Ausgabe im Bericht (AK-ZK-13).

**Schritt B — Werte setzen und neu messen.** `BUY_RISE` 2, `SELL_RECOVERY_INTERVAL` 20; Grenzen bleiben:

- `WIN_TICK_LIMIT` 7500, `MAX_TICKS` 9000, Geld > 0 in jedem Szenario;
- **Frühspiel-Grenzwert:** Mehrkosten Zukauf im Baseline-Controller (`balance.test`, Seed 3) bis Lauf-Ende,
  höchstens Tick 9000, **≤ 250 Geld** (5 % des Startgelds 5000); erwartet ≈ 4 % (Anhang b). Mehrkosten = Σ über alle
  erfolgreichen Käufe (bezahlter Preis − `buyQuote(…, startPct 100, …).price` desselben Kaufs). [Tech: Messweg im
  Plan, ohne Sim-Schalter.]
- Reisst eine Grenze, wird zuerst `BUY_RISE` 2 → 1 gesenkt (10er-Brocken dann 104,5 %); reisst sie weiter, Stopp an
  L0 (R487 P-1).

**Klassenregel für rote Tests in Schritt B (R490 B2).** Jeder Test, der nach dem Setzen der Werte rot wird, gehört
genau einer Klasse an; der Bericht des Umsetzungs-Pakets führt die Liste «Test → Klasse → vorher/nachher»:

- **Klasse N — neu messen:** Festwert eines Laufs mit aktueller Ökonomie: die Tests der Liste oben und jeder andere
  Controller-Festwert (z. B. `population.test`, `unlocks.test`, `goal3.test`, `RANDOM_SEQUENCE` in `e0Pins`).
  Festwert in einem Zug neu messen, Grenzen bleiben; Tabelle vorher/nachher.
- **Klasse R — alte Werte per `vi.mock`:** Vergleich gegen eine **historische** Datei oder einen historischen Hash:
  Rezept-Tests v6, v6-locks, v7, v8 in `save.test.ts` (`fixtureV6Run`, `locksV6Run`, `fixtureV8Run`) und Hash-Pins,
  die nur über die Rückfaltung mit Anteil 100 gelten. Der Test zieht in eine **eigene Datei** (z. B.
  `tests/sim/fixture-recipes.test.ts`) und läuft dort mit den alten Werten per `vi.mock` von `defs/goods`
  (`BUY_RISE` 0) und `defs/timing` (`SELL_RECOVERY_INTERVAL` 10), Muster `tests/ui/levelReads.test.ts`;
  Fixture-Dateien und Pins bleiben unverändert.

- Andere Änderungen an roten Tests gibt es nicht. Passt ein Test in keine Klasse, endet das Paket mit Stopp an L0.
- Eine historische Fixture wird nie aus der neuen Ökonomie neu erzeugt (sie verlöre ihren Zweck).
- `vi.mock` ist nur für Klasse R erlaubt; die Bitgleichheit der Mechanik prüft der reine Kern ohne Mock (AK-ZK-08,
  -21).
- Die Zuordnung zu A oder B je AK legt der Plan fest (tech-Hinweis: AK-ZK-03…05, 09…11, 15, 20, 29 werden erst in B
  grün, ausser sie rufen `buyQuote` mit `rise` 2 direkt).

Wirkung auf den Sieg-Tick: geschätzt 0 bis einige 10 Ticks (`balance.test`), Verkaufserholung ≤ 1 % — **nicht
gemessen** (Anhang e, g). `balance-monument`: verschiebt sich nur über Handkäufe und Verkäufe des Controllers im selben
Lauf, nicht über den Denkmal-Zukauf selbst (Anhang i); Klasse N.

## 7. UI Handelsdialog

Desktop-first ab 1280 px; schmale Fenster «stürzt nicht ab».

### 7.1 Reine Helfer (DOM-frei, Vitest unter `tests/ui/`, in `src/ui/trade.ts` oder eigener Datei [Tech])

- `buyPctText(w, g)` → `«Kauf ${w.buyPct[g]} %»`, z. B. «Kauf 109 %». (Setzung Spec)
- `sellPctText(w, g)` → `«Verkauf ${w.sellPct[g]} %»`, z. B. «Verkauf 80 %» (R487 P-3). **Neuer Helfer:** Heute steht
  der Text inline in `updateTrade` (`src/ui/trade.ts:167`, `Preis ${world.sellPct[good]} %`); er wird herausgelöst,
  `updateTrade` nutzt ihn für das Feld `price-<g>` (tech B4b, qa B9).
- `buyTitleText(name, n, quote)` (neu, rein [Tech: Name]): formatiert aus `{ price, meanPct }` von `buyQuote`
  «${n} ${name} kaufen für ${price} Geld»; liegt `meanPct` über 100, folgt « · im Mittel ${meanPct} %». Bei `meanPct`
  100 bleibt der Text wortgleich zu heute — in Schritt A also unverändert.
- `buyTitle(w, g, n)` (bestehend) = `buyTitleText(GOODS[g].name, n, buyQuote(… aus der Welt …))`; z. B. «10 Werkzeug
  kaufen für 436 Geld · im Mittel 109 %».
- `buyUnitText(w, g)` (bestehend): Stückpreis der **nächsten** Einheit = `«${buyPrice(w, g, 1)} Geld»` inkl.
  Aufschlag und Edikt; bei Anteil 120 Werkzeug «48 Geld».
- `buyHeadNote` (Edikt-Hinweis im Spaltenkopf): Text unverändert, liest `buyFactorPct`.

### 7.2 Handelsdialog

- Je Gut zusätzlich das Feld «Kauf … %» (100 … 160) neben dem Verkaufsanteil «Verkauf … %» (bisher «Preis … %»);
  beide werden in `updateTrade` laufend nachgeführt. [Tech: Feld-Id, Anordnung in der Zeile.]
- Kaufknöpfe 1 und 10: Titel über `buyTitle`; die Dämpfung «unaffordable» prüft weiter `buyPrice(world, g, n)`.
- Kostenkontext `tradeCtx` in `src/ui/app.ts`: nutzt weiter `buyPrice`; keine Änderung nötig ausser Test.
- Kein waagrechtes Scrollen bei 1280 × 720 mit allen 10 Gütern.
- Denkmal-Panel (M13-E2, Zukauf-Preis «(50 / Stück)» über `buyPrice(w, g, 1)`): zeigt den Preis mit Aufschlag ohne
  eigene Änderung.

## 8. Save

- **Save-Weiche (R487 P-4, präzisiert R490 B3):**
  - **Fall v12 geteilt:** Zwischen dem Merge von M13-E2-SIM und dem Merge von I-048 liegt **kein Release**
    (Pages-Deploy, `workflow_dispatch`). Dann erweitert I-048 den v12-Sprung von M13-E2: `migrateV11ToV12` setzt
    zusätzlich `buyPct`, die v12-Ladeprüfung prüft zusätzlich `buyPct`. Lokale oder QA-v12-Stände ohne `buyPct` gelten
    als beschädigt (vertretbar ohne Release; QA-Szenarien werden neu erzeugt).
  - **Fall v13:** Liegt ein Release dazwischen, wird `SAVE_VERSION` 13: neue Migration v12 → v13, eigene
    v13-Ladeprüfung, Kette v1 … v12 bleibt ladbar.
  - Der Plan prüft das Kriterium beim Start, L0 erneut im Merge-Gate. [Tech: Funktionsnamen.]
- **Feld:** `buyPct` je Gut, ganzzahlig 100 … `BUY_CAP`; alle `GOOD_IDS` vorhanden; Weltschlüssel am Ende
  (`…, monument, monumentDone, buyPct`).
- **Migration** aus der Vorversion: `buyPct` = alle 100; `sellPct` und alle M13-E2-Felder unverändert übernehmen.
  Neue Güter später mit `??= 100` (Anhang h).
- **Ladeprüfung** nach dem Muster `isValidV2Fields` für `sellPct`: kein Objekt, Gut fehlt, nicht ganzzahlig, < 100
  oder > `BUY_CAP` → Abweisen mit `'Beschädigter Spielstand'` [Tech: Wortlaut wie bestehende Prüfungen].
- **Rückfaltung für Hash-Pins und Rezepte** (`tests/sim/helpers.ts`, in beiden Fällen, R490 B3, R489): Die
  Rückfaltung auf die Vorversion kennt `buyPct`. Sind alle Anteile 100, wird der Schlüssel entfernt, ohne die
  Reihenfolge der übrigen Schlüssel zu ändern; sonst wirft sie `'Kaufanteil nicht rückfaltbar'` (Testhelfer, kein
  Sim-Code). Fall v12: Erweiterung der Rückfaltung v12 → v11 aus M13-E2 (Positivliste + diese Regel); Fall v13: neue
  Rückfaltung v13 → v12 mit derselben Regel, ältere Rückfaltungen mit Kettenbedingung `>=` [Tech].
- **Inkompatible Stände** werden **mit Hinweis abgewiesen, nie ein Absturz**: Version grösser als `SAVE_VERSION` →
  `'Unbekannte Version'`; das laufende Spiel bleibt unverändert, die UI zeigt den Grund über `friendlyReason`.
- Z5 ändert keinen Save-Inhalt (`sellPct` behält Bereich 30 … 100); keine eigene Migration dafür.
- `docs/arc42.md` Persistenz: neues Feld und Version mitführen.

## 9. Abnahmekriterien

Testwelt, sofern nicht anders genannt: `createWorld(3, { unlockAll: true })`, Kontor auf der Heimat, `money` 10 000,
Lager leer für das geprüfte Gut, Tick 1000, kein Edikt, keine Krise. Werte mit `BUY_RISE` 2,
`SELL_RECOVERY_INTERVAL` 20 (Schritt B), ausser bei AK-ZK-08, AK-ZK-13 und AK-ZK-21. Datei `tests/sim/trade.test.ts` bzw. neue
`tests/sim/buyPct.test.ts` [Tech].

### 9.1 Vitest Sim

- **AK-ZK-01** `createWorld`: `buyPct` hat genau die Schlüssel `GOOD_IDS`, alle 100; `version` = `SAVE_VERSION`
  (Prüfung gegen die Konstante, nicht gegen eine Zahl; §8 Weiche).
- **AK-ZK-02** Def-Test nach §4 und Werte `BUY_RISE` 2, `BUY_CAP` 160, `BUY_RECOVERY_INTERVAL` 10,
  `SELL_RECOVERY_INTERVAL` 20.
- **AK-ZK-03** Formel Werkzeug ab Anteil 100: `buyPrice(w, 'tools', n)` für n = 1/10/30/100 → 40/436/1548/6028; mit
  wirkendem Edikt Handel → 32/349/1239/4823 (Tabelle Z2).
- **AK-ZK-04** Rundung und Startanteil: Werkzeug 10 bei Anteil 109 → 472; bei 160 → 640, mit Edikt 512; Nahrung 10
  mit Edikt ab 100 → 70; Holz 25 ab 100 → 310. `buyPrice` ändert `serialize(w)` nicht.
- **AK-ZK-05** Anstieg: `buy(w, 'tools', 10)` → ok, `money` −436, `buyPct.tools` 120, alle anderen Güter 100; zweites
  `buy(w, 'tools', 10)` → `money` weitere −516, Anteil 140; `buy(w, 'tools', 30)` ab 100 → Anteil 160 (Deckel), ein
  weiteres `buy(w, 'tools', 1)` → 160, Preis 64.
- **AK-ZK-06** Fehlschlag ändert nichts: je ein Fall `'Lager voll'` (Lager 95, n 10), `'Zu wenig Geld'` (`money`
  435, n 10), `'Kein Geld'` (`money` −1), `'Ungültige Menge'` (n 0, 1.5), `'Kein Kontor auf …'`, gesperrtes Gut ohne
  `unlockAll` → `ok false` mit dem Grund, `serialize(w)` vor und nach dem Aufruf gleich.
- **AK-ZK-07** Kauf-Erholung: `buyPct.tools` 120, `buyPct.wood` 101, Tick 1000; `tickMarket` für Tick 1001 … 1190
  einzeln → Werkzeug 101, Holz 100; bis 1200 → beide 100; bis 1300 → beide 100 (Boden). Bei `tick` 0 und Anteil 120:
  `tickMarket` → unverändert 120.
- **AK-ZK-08** Bitgleichheit über den reinen Kern, **ohne Mock** (R490 B2, qa B3): für alle `GOOD_IDS`, n = 1 … 100
  und `edictPct` ∈ {100, 80} gilt `buyQuote(GOODS[g].buy, 100, n, 0, BUY_CAP, edictPct)` →
  `price` = `n × buy` (100) bzw. `floor((n × buy × 80 + 99) / 100)` (80), `meanPct` 100, `endPct` 100. Dazu mit
  `rise` 2: `buyQuote(40, 100, 10, 2, 160, 100)` → `{ price 436, meanPct 109, endPct 120 }`,
  `buyQuote(40, 150, 10, 2, 160, 100)` → `endPct` 160 (Deckel), und `buyPrice(w, g, n)` = `buyQuote(…, BUY_RISE,
BUY_CAP, …).price` für Werkzeug n ∈ {1, 10} bei Anteil 133 mit und ohne Edikt.
- **AK-ZK-09** Auftragsprämie unverändert: bei `buyPct` 160 für alle Güter mit Auftrag liefert die Prämie je
  Einheit weiter `floor(GOODS[g].buy × ORDER_PREMIUM)` (Holz 7, Rum 30, Glas 37); `M13:AK-M13E1-10` (Arbitrage mit
  Auftrag) bleibt grün und läuft zusätzlich mit `buyPct` 160 für alle Güter.
- **AK-ZK-10** Verkaufserholung 20: `sellPct.wood` 80, Tick 1000; `tickMarket` für Tick 1001 … 1380 → 99, bis 1400 →
  100; Kauf- und Verkaufserholung bei Tick 1020 beide ausgeführt, bei Tick 1010 nur die Kauf-Erholung.
- **AK-ZK-11** Konsistenz: Für jedes Gut und n ∈ {1, 10} ist die Geldänderung von `buy(w, g, n)` gleich dem zuvor
  gelesenen `buyPrice(w, g, n)`, auch bei Anteil 133 und mit Edikt.
- **AK-ZK-12** Werfen nie: `buy` mit `n` ∈ {0, −1, 1.5, `NaN`, 101} und gültigen Gütern liefert ein `Result`; RNG-Zustand
  unverändert.
- **AK-ZK-29** Denkmal-Zukauf zahlt, hebt nicht (Z3, R489, R490 B1). Welt mit Denkmal im Bau (M13-E2), Lager Stein auf
  Reserve, Zukauf Stein an, `buyPct.stone` 120: ein Denkmal-Zug (Aufruf der Zukauf-Funktion bzw. des Zugs ohne
  `tickMarket` [Tech]) → Geld −18, geliefert +1, `buyPct.stone` 120; mit wirkendem Edikt Handel −15. Bei Anteil 100:
  −15 bzw. −12 (wie M13-E2 AK-11). Bei `money` 17 und Anteil 120: kein Zukauf, Geld und `buyPct` unverändert.
  Zwillingslauf: zwei gleiche Welten, eine mit Zukauf Stein an, eine aus, je 600 Ticks über `step` → `buyPct` beider
  Welten nach jedem Tick gleich (der Zukauf ändert den Anteil nie). Der Zug ruft genau `buyPrice(w, g, 1)` (Spy oder
  Vergleich).
- **AK-ZK-31** Kein Kauf-Verkauf-Gewinn ohne Auftrag (qa B6): für alle `GOOD_IDS` und n ∈ {1, 10, 100}, Edikt Handel
  wirkt, Welt w′ mit Boom auf g und `sellPct[g]` 100: `buyPrice(w, g, n)` > `sellPrice(w′, g, n)` bei `buyPct[g]` 100
  und bei 160. Rückfahrt im selben Tick (Lager g leer, Boom auf g, Edikt Handel): `buy(w, g, n)` und danach
  `sell(w, g, n)` → beide ok, `money` danach < `money` davor.

### 9.2 Vitest Baseline und Save

- **AK-ZK-13** Schritt A bitgleich (**Prozessbeleg** am Commit A, qa B4; dauerhaft sichert AK-ZK-08): mit `BUY_RISE`
  0 und `SELL_RECOVERY_INTERVAL` 10 laufen alle Tests der Liste §6 (inkl. `balance-monument`), Hash-Pins und
  Rezept-Tests grün; `git diff main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts
tests/sim/save.test.ts tests/sim/fixtures/` leer. Beleg (Ausgabe `make check` und Diff) im Bericht des
  Umsetzungs-Pakets.
- **AK-ZK-14** Schritt B Grenzen (R487 P-1, R490 B2): alle Tests der Klasse N (§6, inkl. `balance-monument`) neu
  gemessen, Pins als Festwerte in den Testdateien; jeder Lauf erreicht den Sieg bis `WIN_TICK_LIMIT` 7500, keiner
  überschreitet `MAX_TICKS` 9000, Geld bleibt > 0. Klasse-R-Tests laufen in eigener Datei mit `vi.mock` der alten
  Werte grün, Fixture-Dateien unverändert. Tabelle «Test → Klasse → vorher/nachher» im Bericht.
- **AK-ZK-15** Frühspiel-Grenzwert: Mehrkosten Zukauf im `balance.test`-Controller (Seed 3) bis Lauf-Ende, höchstens
  Tick 9000 (Definition §6). Zwei getrennte Asserts: Messwert = Festwert (Toleranz 0) und Messwert ≤ 250 Geld.
- **AK-ZK-16** Save-Rundlauf: Welt mit `buyPct` {tools 137, spice 160, sonst 100} → `deserialize(serialize(w))` ok
  und tief gleich.
- **AK-ZK-17** Migration: ein v11-Stand (Fixture, im Task neu erzeugt; `tests/sim/fixtures/` endet heute bei v9) mit
  `sellPct.wood` 55 lädt → ok, `version` = `SAVE_VERSION`, `buyPct` alle 100, `sellPct.wood` 55; Fall v13 zusätzlich
  ein v12-Stand mit Denkmal; die Kette ab v1 lädt weiter.
- **AK-ZK-18** Abweisen ungültiger `buyPct`: Fälle 99, 161, 120.5, `'120'`, Gut fehlt, `buyPct` fehlt, `buyPct` `null`
  → je `ok false` mit `'Beschädigter Spielstand'`, kein Wurf; Version grösser als die neue → `'Unbekannte Version'`;
  `friendlyReason` liefert für beide einen nicht leeren Hinweistext.
- **AK-ZK-30** Determinismus über Speichern/Laden bei teilerholtem Aufschlag (qa B2): Testwelt, `buy(w, 'tools', 30)`
  bei Tick 1000 (Anteil 160), dann 155 Ticks über `step` (Ladepunkt kein Vielfaches von 10, Anteil teilerholt
  zwischen 101 und 159). Lauf 1: `deserialize(serialize(w))`, weitere 200 Ticks. Lauf 2: dieselbe Welt durchgehend
  355 Ticks. `serialize` beider Welten JSON-gleich; der Erholungstakt über `tick % BUY_RECOVERY_INTERVAL` läuft nach
  dem Laden ohne Versatz. Zweilauf (Schritt B): `balance.test`-Controller Seed 3 zweimal → `serialize` am Lauf-Ende
  gleich.
- **AK-ZK-33** Rückfaltung `buyPct` (§8): Stand der neuen Version mit allen Anteilen 100 → Rückfaltung entfernt
  `buyPct`, übrige Schlüssel in gleicher Reihenfolge, Ergebnis gleich dem Stand der Vorversion; ein Anteil 101 →
  Fehler `'Kaufanteil nicht rückfaltbar'`.

### 9.3 Vitest UI (reine Helfer, `tests/ui/`)

- **AK-ZK-19** `buyPctText`: Anteil 109 → «Kauf 109 %», Anteil 100 → «Kauf 100 %».
- **AK-ZK-20** Knopfpreis: Werkzeug ab 100 → `buyTitle(w, 'tools', 10)` = «10 Werkzeug kaufen für 436 Geld · im
  Mittel 109 %», `buyTitle(w, 'tools', 1)` = «1 Werkzeug kaufen für 40 Geld» (Mittel 100, kein Zusatz); mit Edikt
  Handel «… für 349 Geld · im Mittel 109 %»; `buyUnitText` bei Anteil 120 → «48 Geld», mit Edikt «39 Geld».
- **AK-ZK-21** Wortgleich bei `rise` 0, über den reinen Kern **ohne Mock** (qa B3): für alle `GOOD_IDS`, n ∈ {1, 10},
  `edictPct` ∈ {100, 80}: `buyTitleText(GOODS[g].name, n, buyQuote(GOODS[g].buy, 100, n, 0, BUY_CAP, edictPct))`
  = `«${n} ${name} kaufen für ${heutiger Preis} Geld»` mit heutigem Preis `n × buy` bzw.
  `floor((n × buy × 80 + 99) / 100)`, ohne Zusatz « · im Mittel»; der Stückpreis-Text bei n 1 = `«${heutiger Preis}
Geld»`. (Schritt A ohne sichtbare Änderung ausser «Kauf 100 %» und «Verkauf … %».)
- **AK-ZK-22** Kostenkontext: `tradeCtx('buy', 'tools', 10, HOME)` bei Anteil 120 liefert `cost.money` 516 (nicht 400);
  der Meldungstext «Zu wenig Geld» nennt diesen Betrag [Tech: Helfer aus `app.ts` herauslösen oder über
  `friendlyReason` prüfen].
- **AK-ZK-32** Verkaufsbeschriftung (R487 P-3, qa B9, tech B4b): `sellPctText(w, 'wood')` bei `sellPct.wood` 80 →
  «Verkauf 80 %», bei 100 → «Verkauf 100 %»; `updateTrade` setzt das Feld `price-<g>` über diesen Helfer (kein
  Text «Preis … %» mehr in `src/ui/trade.ts`, Grep-Prüfung im Review).

### 9.4 Browser (qa-playtester, Headless-Chrome)

Screenshots unter `.studio/qa/i048/`, Dateiname `<ak>-<breite>x<höhe>.png`, 1280 × 720 und 1920 × 1080. Testwelt:
neues Spiel (Startgeld 5000), Geschwindigkeit 1×.

- **AK-ZK-23** Handelsdialog öffnen: je Gut «Kauf 100 %» und «Verkauf 100 %» sichtbar; kein waagrechtes Scrollen
  (`scrollWidth ≤ clientWidth`); keine Konsolenfehler.
- **AK-ZK-24** 10 Werkzeug kaufen: Geld sinkt um 436, Werkzeug-Zeile zeigt «Kauf 120 %», Stückpreis «48 Geld»; ohne
  weiteren Kauf zeigt sie nach 10 s ≈ «Kauf 110 %» und nach 20 s «Kauf 100 %».
- **AK-ZK-25** Knopftitel (Hover) Werkzeug 10 vor dem Kauf: «10 Werkzeug kaufen für 436 Geld · im Mittel 109 %».
- **AK-ZK-26** Edikt Handel aktiv (Spielstand mit Ziel 1 und Amtsstube): Werkzeug 10 bei Anteil 100 → Knopf nennt 349,
  Kauf senkt das Geld um 349; Anzeige «Kauf 120 %» danach wie ohne Edikt.
- **AK-ZK-27** Laden eines alten v11-Spielstands: lädt ohne Hinweis, alle Güter «Kauf 100 %», Verkaufsanteile wie im
  Stand.
- **AK-ZK-28** Fenster 800 × 600: Dialog ohne Überlappung, keine Konsolenfehler («stürzt nicht ab»).

## 10. Doku-Folgen

- **README «Handel»:** Satz «Kaufpreise sind fest.» ersetzen durch die Regel mit Zahlen: «Jede gekaufte Einheit hebt
  den Kaufpreis dieses Guts um 2 Prozentpunkte, höchstens auf 160 %; jede Sekunde sinkt er um 1 Punkt, bis 100 %. Bis
  rund 30 Einheiten je Minute zahlt man fast den Listenpreis; 10 Werkzeug am Stück kosten 436 statt 400.» Edikt
  Handel wirkt zusätzlich −20 %. Verkaufssättigung: «Jede Sekunde» → «Alle 2 Sekunden»; «Rund 10 Einheiten je Gut und
  10 Sekunden» → «… und 20 Sekunden»; das Beispiel «100 Holz bringen 219 statt 400» bleibt; Dialog zeigt «Kauf … %»
  neben «Verkauf … %» (R487 P-3, bisher «Preis … %»). Satz zu Handelsaufträgen («zuzukaufen lohnt sich nie») bleibt.
- **README «Denkmal» (Doku-Auflage R490 B1):** Hinweis «Der Zukauf für das Denkmal zahlt den aktuellen Kaufpreis
  samt Aufschlag, hebt ihn aber nicht.» Die Summen «64 200» und «≈ 1100 Geld je Minute» gelten bei Kaufanteil 100
  und bleiben stehen.
- **`docs/arc42.md`:** Persistenz (neues Feld `buyPct`, Save-Version nach der Weiche §8, Migration, Rückfaltung);
  Tick-Ablauf `tickMarket` mit zwei Erholungen.
- **`docs/ideen.md` I-048:** Status führt lead-design.
- Kein ADR nötig (keine Architekturentscheidung, keine Abhängigkeit).

## 11. Entschiedene Punkte

- **P-1** Neumessung Schritt B erlaubt (R487), erweitert um Klasse R «alte Werte per `vi.mock`» (R490 B2); Rückfall
  `BUY_RISE` 2 → 1, sonst Stopp an L0.
- **P-2** Verkaufserholung 10 → 20 mitnehmen (R487).
- **P-3** Beschriftung «Preis» → «Verkauf» (R487); AK-ZK-32.
- **P-4** Save-Weiche v12 geteilt / v13 (R487, präzisiert R490 B3); §8.
- **P-5 Feinwerte nach Playtest:** `BUY_RISE`, `BUY_CAP`, Intervalle stehen in `defs/`; jede Änderung braucht ein
  Ruling und lässt den Balancing-Test grün. Erster Hebel bei zu hartem Frühspiel: `BUY_RISE` 2 → 1.
- **Denkmal-Zukauf** zahlt, hebt nicht (R489, R490 B1); Variante «hebt» (tech B1 A) verworfen.

**Für den Plan (lead-tech, R490):** qa B4 (Prozessbeleg Commit A), B5 (Messweg AK-ZK-15), B7 (Fixtures), B8
(Browser-Ausgangsstände, Toleranz AK-ZK-24 ±2 Punkte), tech B3 (Weiche prüfen beim Start); Reihenfolge `tickMonument`
gegen `tickMarket`; Zuordnung jedes AK zu Schritt A oder B; Inventar der roten Tests nach Klassen.

**Playtest-Frage:** Baut der Spieler im zweiten Spiel eine Kette früher, nachdem er «Kauf 160 %» gesehen hat? Merkt
er beim Kauf von 10 Werkzeug einen Unterschied?

## 12. Grössenschätzung

**M, ein Umsetzungs-Paket mit Schritten A (Mechanik, bitgleich) und B (Werte, Neumessung).** Voraussetzung:
M13-E2-SIM auf `main` (R486 O8, R489).

| Teil                                             | Wer           | Tools     |
| ------------------------------------------------ | ------------- | --------- |
| Plan                                             | lead-tech     | ≈ 40      |
| Sim + Save + Denkmal-Anbindung (Schritt A)       | Umsetzung     | ≈ 70      |
| UI Handelsdialog + Helfer                        | Umsetzung     | ≈ 35      |
| Neumessung, Klasse-R-Datei, AK-ZK-15 (Schritt B) | Umsetzung     | ≈ 50      |
| Browser-Checks                                   | qa-playtester | ≈ 20      |
| **Umsetzung gesamt**                             |               | ≈ 160–190 |

Risiko mittel: Save-Weiche (§8), Neumessung `balance-merchants` (grösste Wirkung, Anhang g), Inventar Klasse R.
