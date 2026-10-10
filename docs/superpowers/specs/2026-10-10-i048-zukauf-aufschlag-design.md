# I-048 «Zukauf-Aufschlag» (Kaufsättigung) und langsamere Verkaufserholung — Design-Spec

Datum: 2026-10-10 · Paket design-i048-zukauf · Meilenstein: ohne · Status: **Entwurf, Abnahme lead-design, danach
Gate Spec (lead-tech, lead-qa), Plan (lead-tech)** · Prozessstufe voll

Grundlage: [Anhang 01 Werte und Bilanzen](2026-10-10-i048-zukauf-aufschlag-design/anhang-01-werte-bilanzen.md)
(`design-economy-designer`, abgenommen von lead-design; **massgeblich für alle Zahlen**); `docs/ideen.md` I-048;
[Hauptspec](2026-09-29-inselreich-design.md); Muster: [Spec M13-E1 Edikte](2026-10-10-m13-e1-edikte-design.md) (R4
Kaufpreis mit Edikt Handel). Code-Stand der Prüfung: `main` 8b6d4759 (`src/sim/trade.ts`, `defs/goods.ts`,
`defs/timing.ts`, `src/ui/trade.ts`, `src/ui/app.ts` `tradeCtx`, `src/sim/save.ts` `isValidV2Fields`).

Kennzeichnung: **Setzung Spec** (hier ergänzt, im Anhang nicht festgelegt), **[Tech]** (Umsetzungsdetail; lead-tech
entscheidet im Plan, die Spec legt nur das prüfbare Verhalten fest). Verweise «Anhang a) … h)» meinen die Abschnitte
von Anhang 01.

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

- Sim: Zustand `world.buyPct` je Gut; neue Preisformel `buyPrice`; Anstieg bei erfolgreichem `buy`; Erholung in
  `tickMarket`; `SELL_RECOVERY_INTERVAL` 10 → 20.
- Save: Feld `buyPct`, nächste freie Save-Version nach v11, Migration, Ladeprüfung, Abweisen mit Hinweis.
- UI Handelsdialog: Spalte «Kauf … %», Kaufknöpfe mit genauem Preis; reine Helfer mit Vitest.
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

Begriffe: **Kaufanteil** = `world.buyPct[g]` (ganzzahlig, %). **Listenpreis** = `GOODS[g].buy`. **Edikt-Faktor**
`e` = `activeEdictDef(world)?.buyPct ?? 100` (80 bei wirkendem Edikt Handel, sonst 100; Spec M13-E1 R4).

### Z1 Zustand

- `world.buyPct: Record<GoodId, number>`, je Gut **ein Wert für die ganze Welt** (alle Kontore, alle Inseln), wie
  `sellPct`.
- Wertebereich ganzzahlig 100 … `BUY_CAP` (160). Start in `createWorld`: alle 100.
- Kein RNG-Zugriff, keine Abhängigkeit von Insel, Kontor oder Krise.

### Z2 Preisformel

Wie `sellPrice`: Der Anteil gilt **vor** jeder Einheit, danach steigt er; einmal aufrunden über die ganze Menge.

```
p_0 = buyPct[g]
p_{i+1} = min(BUY_CAP, p_i + BUY_RISE)
acc = Σ_{i=0}^{n−1} GOODS[g].buy × p_i
buyPrice(world, g, n) = floor((acc × e + 9999) / 10000)
```

- Aufrunden beim Kauf ist das Gegenstück zum Abrunden beim Verkauf: Rundung nie zugunsten des Spielers.
- Das Edikt Handel wirkt **multiplikativ** auf den Preis; der Anstieg des Anteils bleibt gleich (Z3).
- **Bitgleich:** Mit `buyPct` 100 und `BUY_RISE` 0 ergibt die Formel genau den heutigen Preis: `n × buy`, mit Edikt
  `floor((n × buy × 80 + 99) / 100)` (nachgerechnet für alle 10 Güter, n = 1 … 100, mit und ohne Edikt).
- `buyPrice` bleibt rein (liest, schreibt nicht). [Tech: Schleife bis zum Deckel, danach geschlossene Form; alle
  Zwischenwerte ganzzahlig, höchstens 100 × 50 × 160 × 100 < 2³¹.]

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
| `src/sim/save.ts`        | `SAVE_VERSION`, Migration, Prüfung | nächste freie Version nach v11 (§8)                |

- Spielwerte **nur** in `src/sim/defs/`; der Boden 100 der Kauf-Erholung ist der Listenpreis (kein Spielwert, sondern
  Definition «ohne Aufschlag»). Eine eigene Konstante `BUY_RECOVERY_INTERVAL` statt `SELL_RECOVERY_INTERVAL`, weil
  beide Erholungen verschiedene Aufgaben haben (Anhang a).
- Geänderte Sim-Funktionen: `createWorld` (`world.ts`), `buyPrice`, `buy`, `tickMarket` (`trade.ts`). Keine neue
  Laufzeit-Abhängigkeit, kein RNG, `src/sim/` bleibt DOM-frei.
- [Tech] Neuer Weltschlüssel am Ende der bestehenden Schlüssel; Reihenfolge gegenüber parallelen Save-Erweiterungen
  (M13-E2) legt der Plan fest.

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
  `buyPct` 100 mit Edikt, und den deckt AK-M13E1-10 heute schon ab (Rum mit Edikt und Boom: 27 Erlös gegen 32 Kauf;
  Nahrung ×10 Auftrag 60 gegen Kauf 64). Zukauf für Aufträge bringt nie Gewinn; der README-Satz bleibt wahr.
- **Edikt Handel wird erlassen, aufgehoben oder ruht:** ändert nur `e`, nie `buyPct`.
- **Boom:** wirkt nur auf den Verkauf; ein Boom-Gut hat einen normalen Kaufanteil. Mit Z5 erholt sich der
  Verkaufsanteil im Boom (30 s) nur um 15 statt 30 Punkte (Anhang e).
- **Gesperrtes Gut** (`goodLock`): Kauf scheitert, Anteil bleibt 100; die Erholung läuft trotzdem für alle Güter.
- **Inseln ohne eigene Kette** (Gewürz vor Kontor II, Stein ohne Gebirge): kein Bankrott erzwungen, Bilanz bleibt
  positiv, aber kleiner (Anhang f).
- **Alter Spielstand** (v11 und älter): lädt über die Migration, alle Anteile 100, `sellPct` unverändert (§8).
- **Spielstand mit `buyPct` ausserhalb 100 … `BUY_CAP`** oder nicht ganzzahlig: Abweisen mit Hinweis (§8). Achtung
  wie bei `ORDER_*`: Die Ladeprüfung liest `BUY_CAP`; wer `BUY_CAP` später senkt, braucht eine Migration.

## 6. Baseline und Balancing

Zwei Schritte **im selben Umsetzungs-Paket**, kein dauerhafter Schalter (Anhang g):

**Schritt A — Mechanik, Baseline bitgleich.** `BUY_RISE` 0, `SELL_RECOVERY_INTERVAL` 10, dazu Formel, `buyPct`,
Erholung, Save und Anzeige. Beleg:

- alle balance-Szenarien (`balance.test`, `balance-merchants`, `balance-crises`, `balance-edicts`, `balance-upgrade`,
  `unlock-timeline`, `balance-flow`) grün **ohne** Änderung an Pins oder Erwartungswerten;
- Hash-Pins grün ohne Pin-Änderung [Tech: Rückfaltung des neuen Felds wie `foldBackToV10` in M13-E1, solange alle
  Anteile 100 sind].

**Schritt B — Werte setzen und neu messen.** `BUY_RISE` 2, `SELL_RECOVERY_INTERVAL` 20; alle Controller-Szenarien in
einem Zug neu messen (Tabelle Anhang g; grösste Wirkung `balance-merchants`, Gewürz läuft auf 160 %). Grenzen bleiben:

- `WIN_TICK_LIMIT` 7500, `MAX_TICKS` 9000, Geld > 0 in jedem Szenario;
- **Frühspiel-Grenzwert:** Mehrkosten Zukauf in den ersten 15 min (Ticks 0 … 9000 bzw. bis Lauf-Ende) im
  Baseline-Controller (`balance.test`, Seed 3) **≤ 250 Geld** (5 % des Startgelds 5000); erwartet ≈ 4 % (Anhang b).
  Mehrkosten = Σ über alle erfolgreichen Käufe (bezahlter Preis − Preis desselben Kaufs bei Anteil 100). [Tech:
  Messung im Test über den Controller-Aufruf, ohne Sim-Schalter.]
- Reisst eine Grenze, wird zuerst `BUY_RISE` 2 → 1 gesenkt (10er-Brocken dann 104,5 %); die Grenze bleibt.

**Offener Entscheid an L0 (nicht beschlossen):** Die Neumessung in Schritt B ändert Erwartungswerte des
Balancing-Tests und braucht ein **Ruling** (Ruling-Entwürfe Anhang g; §11 P-1, P-2). Ohne Ruling endet das Paket nach
Schritt A.

Wirkung auf den Sieg-Tick: geschätzt 0 bis einige 10 Ticks (`balance.test`), Verkaufserholung ≤ 1 % — **nicht
gemessen** (Anhang e, g).

## 7. UI Handelsdialog

Desktop-first ab 1280 px; schmale Fenster «stürzt nicht ab».

### 7.1 Reine Helfer (DOM-frei, Vitest unter `tests/ui/`, in `src/ui/trade.ts` oder eigener Datei [Tech])

- `buyPctText(w, g)` → `«Kauf ${w.buyPct[g]} %»`, z. B. «Kauf 109 %». (Setzung Spec)
- `sellPctText(w, g)` → heute `«Preis ${w.sellPct[g]} %»`; **Empfehlung** «Verkauf ${…} %» (offener Punkt P-3).
- `buyUnitText(w, g)` (bestehend): Stückpreis der **nächsten** Einheit = `buyPrice(w, g, 1)` inkl. Aufschlag und
  Edikt; bei Anteil 120 Werkzeug «48 Geld».
- `buyTitle(w, g, n)` (bestehend): «10 Werkzeug kaufen für 436 Geld»; nennt den genauen Preis mit Aufschlag und
  Edikt. Setzung Spec: Liegt das Mittel der Anteile über 100, folgt « · im Mittel 109 %» (Mittel =
  `round(Σ p_i / n)` aus Z2, ohne Edikt). Bei Mittel 100 bleibt der Text wie heute — in Schritt A also unverändert.
- `buyHeadNote` (Edikt-Hinweis im Spaltenkopf): unverändert.

### 7.2 Handelsdialog

- Je Gut zusätzlich das Feld «Kauf … %» (100 … 160) neben dem bestehenden Verkaufs-«Preis … %»; beide werden in
  `updateTrade` laufend nachgeführt (wie `price-<g>`). [Tech: Feld-Id, Anordnung in der Zeile.]
- Kaufknöpfe 1 und 10: Titel über `buyTitle`; die Dämpfung «unaffordable» prüft weiter `buyPrice(world, g, n)`.
- Kostenkontext `tradeCtx` in `src/ui/app.ts`: nutzt weiter `buyPrice`; keine Änderung nötig ausser Test.
- Kein waagrechtes Scrollen bei 1280 × 720 mit allen 10 Gütern.

## 8. Save

- **Version:** nächste freie Save-Version nach v11. M13-E2 (Denkmal) plant evtl. parallel v12; Nummer und
  Reihenfolge der Migrationen legt der Plan fest (P-4).
- **Feld:** `buyPct` je Gut, ganzzahlig 100 … `BUY_CAP`; alle `GOOD_IDS` vorhanden.
- **Migration** aus der Vorversion: `buyPct` = alle 100; `sellPct` unverändert übernehmen; Kette v1 … v11 bleibt
  ladbar. Neue Güter später mit `??= 100` (Anhang h).
- **Ladeprüfung** nach dem Muster `isValidV2Fields` für `sellPct`: kein Objekt, Gut fehlt, nicht ganzzahlig, < 100
  oder > `BUY_CAP` → Abweisen mit `'Beschädigter Spielstand'` [Tech: Wortlaut wie bestehende Prüfungen].
- **Inkompatible Stände** werden **mit Hinweis abgewiesen, nie ein Absturz**: Version grösser als die neue →
  `'Unbekannte Version'`; das laufende Spiel bleibt unverändert, die UI zeigt den Grund über `friendlyReason`.
- Z5 ändert keinen Save-Inhalt (`sellPct` behält Bereich 30 … 100); keine eigene Migration dafür.
- `docs/arc42.md` Persistenz: neues Feld und Version mitführen.

## 9. Abnahmekriterien

Testwelt, sofern nicht anders genannt: `createWorld(3, { unlockAll: true })`, Kontor auf der Heimat, `money` 10 000,
Lager leer für das geprüfte Gut, Tick 1000, kein Edikt, keine Krise. Werte mit `BUY_RISE` 2,
`SELL_RECOVERY_INTERVAL` 20 (Schritt B), ausser bei AK-ZK-08 und AK-ZK-13. Datei `tests/sim/trade.test.ts` bzw. neue
`tests/sim/buyPct.test.ts` [Tech].

### 9.1 Vitest Sim

- **AK-ZK-01** `createWorld`: `buyPct` hat genau die Schlüssel `GOOD_IDS`, alle 100; `version` = neue Save-Version.
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
- **AK-ZK-08** Bitgleichheit mit `BUY_RISE` 0 (Def-Wert im Test über eine reine Hilfsfunktion oder Modul-Mock
  [Tech]): für alle `GOOD_IDS`, n = 1 … 100, Anteil 100, ohne Edikt `buyPrice` = `n × buy`, mit Edikt Handel
  `floor((n × buy × 80 + 99) / 100)`; nach `buy` bleibt der Anteil 100.
- **AK-ZK-09** Auftragsprämie unverändert: bei `buyPct` 160 für alle Güter mit Auftrag liefert die Prämie je
  Einheit weiter `floor(GOODS[g].buy × ORDER_PREMIUM)` (Holz 7, Rum 30, Glas 37); AK-M13E1-10 (Arbitrage) bleibt grün
  und läuft zusätzlich mit `buyPct` 160 für alle Güter.
- **AK-ZK-10** Verkaufserholung 20: `sellPct.wood` 80, Tick 1000; `tickMarket` für Tick 1001 … 1380 → 99, bis 1400 →
  100; Kauf- und Verkaufserholung bei Tick 1020 beide ausgeführt, bei Tick 1010 nur die Kauf-Erholung.
- **AK-ZK-11** Konsistenz: Für jedes Gut und n ∈ {1, 10} ist die Geldänderung von `buy(w, g, n)` gleich dem zuvor
  gelesenen `buyPrice(w, g, n)`, auch bei Anteil 133 und mit Edikt.
- **AK-ZK-12** Werfen nie: `buy` mit `n` ∈ {0, −1, 1.5, `NaN`, 101} und gültigen Gütern liefert ein `Result`; RNG-Zustand
  unverändert.

### 9.2 Vitest Baseline und Save

- **AK-ZK-13** Schritt A bitgleich: mit `BUY_RISE` 0 und `SELL_RECOVERY_INTERVAL` 10 laufen alle balance-Szenarien
  (§6) und Hash-Pins grün; `git diff main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts`
  leer. Beleg im Bericht des Umsetzungs-Pakets (Commit von Schritt A).
- **AK-ZK-14** Schritt B Grenzen (nach Ruling): alle Controller-Szenarien neu gemessen, Pins als Festwerte in den
  Testdateien; jeder Lauf erreicht den Sieg bis `WIN_TICK_LIMIT` 7500, keiner überschreitet `MAX_TICKS` 9000, Geld
  bleibt > 0; Tabelle «vorher/nachher» je Szenario im Bericht.
- **AK-ZK-15** Frühspiel-Grenzwert: Mehrkosten Zukauf im `balance.test`-Controller (Seed 3) in Ticks 0 … 9000 bzw.
  bis Lauf-Ende ≤ 250 Geld (Definition §6); der Messwert steht im Test als Festwert mit Toleranz 0.
- **AK-ZK-16** Save-Rundlauf: Welt mit `buyPct` {tools 137, spice 160, sonst 100} → `deserialize(serialize(w))` ok
  und tief gleich.
- **AK-ZK-17** Migration: ein v11-Stand (Fixture) mit `sellPct.wood` 55 lädt → ok, neue Version, `buyPct` alle 100,
  `sellPct.wood` 55; die Kette v1 … v10 lädt weiter.
- **AK-ZK-18** Abweisen ungültiger `buyPct`: Fälle 99, 161, 120.5, `'120'`, Gut fehlt, `buyPct` fehlt, `buyPct` `null`
  → je `ok false` mit `'Beschädigter Spielstand'`, kein Wurf; Version grösser als die neue → `'Unbekannte Version'`;
  `friendlyReason` liefert für beide einen nicht leeren Hinweistext.

### 9.3 Vitest UI (reine Helfer, `tests/ui/`)

- **AK-ZK-19** `buyPctText`: Anteil 109 → «Kauf 109 %», Anteil 100 → «Kauf 100 %».
- **AK-ZK-20** Knopfpreis: Werkzeug ab 100 → `buyTitle(w, 'tools', 10)` = «10 Werkzeug kaufen für 436 Geld · im
  Mittel 109 %», `buyTitle(w, 'tools', 1)` = «1 Werkzeug kaufen für 40 Geld» (Mittel 100, kein Zusatz); mit Edikt
  Handel «… für 349 Geld · im Mittel 109 %»; `buyUnitText` bei Anteil 120 → «48 Geld», mit Edikt «39 Geld».
- **AK-ZK-21** Mit `BUY_RISE` 0 sind `buyTitle` und `buyUnitText` für alle Güter, n ∈ {1, 10}, mit und ohne Edikt
  wortgleich zum heutigen Text (Schritt A ohne sichtbare Änderung ausser der Spalte «Kauf 100 %»).
- **AK-ZK-22** Kostenkontext: `tradeCtx('buy', 'tools', 10, HOME)` bei Anteil 120 liefert `cost.money` 516 (nicht 400);
  der Meldungstext «Zu wenig Geld» nennt diesen Betrag [Tech: Helfer aus `app.ts` herauslösen oder über
  `friendlyReason` prüfen].

### 9.4 Browser (qa-playtester, Headless-Chrome)

Screenshots unter `.studio/qa/i048/`, Dateiname `<ak>-<breite>x<höhe>.png`, 1280 × 720 und 1920 × 1080. Testwelt:
neues Spiel (Startgeld 5000), Geschwindigkeit 1×.

- **AK-ZK-23** Handelsdialog öffnen: je Gut «Kauf 100 %» und der Verkaufsanteil sichtbar; kein waagrechtes Scrollen
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
  neben dem Verkaufsanteil (Beschriftung nach P-3). Satz zu Handelsaufträgen («zuzukaufen lohnt sich nie») bleibt.
- **`docs/arc42.md`:** Persistenz (neues Feld `buyPct`, Save-Version, Migration); Tick-Ablauf `tickMarket` mit zwei
  Erholungen.
- **`docs/ideen.md` I-048:** Status führt lead-design (Eigentum lead-design, hier nicht geändert).
- Kein ADR nötig (keine Architekturentscheidung, keine Abhängigkeit).

## 11. Offene Punkte (mit Empfehlung)

- **P-1 Baseline-Neumessung Schritt B per Ruling.** Empfehlung **ja**: ein Ruling für `BUY_RISE` 2, `BUY_CAP` 160,
  Erholung 1 Pkt/s und die Neumessung aller Controller-Szenarien mit festen Grenzen (Entwürfe Anhang g). Kosten bei
  Irrtum: ein defs-Wert und eine Neumessung.
- **P-2 Verkaufserholung 10 → 20 mitnehmen.** Empfehlung **ja** (Anhang e). Alternative «unverändert» ist vertretbar,
  wenn die Neumessung klein bleiben soll; Folge: Holzhandel bleibt mit +139/min die dominante Nebenquelle im
  Frühspiel, AK-ZK-10 entfällt, README-Zeile bleibt.
- **P-3 Beschriftung «Preis … %» → «Verkauf … %».** Empfehlung **ja**: Mit zwei Anteilen je Zeile ist «Preis»
  mehrdeutig; Kosten ein Helfer-Text, README-Zeile, Screenshot. Alternative: «Preis» lassen und nur «Kauf … %»
  ergänzen.
- **P-4 Save-Nummer.** Empfehlung: Der Plan legt fest, ob I-048 und M13-E2 je eine eigene Version erhalten oder einen
  gemeinsamen Sprung teilen; die Spec gilt für beide Fälle (nächste freie Version nach v11, Migration aus der direkten
  Vorversion).
- **P-5 Feinwerte nach Playtest:** `BUY_RISE`, `BUY_CAP`, Intervalle stehen in `defs/`; jede Änderung braucht ein
  Ruling und lässt den Balancing-Test grün. Erster Hebel bei zu hartem Frühspiel: `BUY_RISE` 2 → 1.

**Playtest-Frage:** Baut der Spieler im zweiten Spiel eine Kette früher, nachdem er «Kauf 160 %» gesehen hat? Merkt
er beim Kauf von 10 Werkzeug einen Unterschied?

## 12. Grössenschätzung

**S–M, ein Umsetzungs-Paket mit Tasks A (Mechanik, bitgleich) und B (Werte, Neumessung nach Ruling).**

| Teil                         | Wer           | Tools     |
| ---------------------------- | ------------- | --------- |
| Plan                         | lead-tech     | ≈ 40      |
| Sim + Save (Task A)          | Umsetzung     | ≈ 60      |
| UI Handelsdialog + Helfer    | Umsetzung     | ≈ 35      |
| Neumessung Baseline (Task B) | Umsetzung     | ≈ 30      |
| Browser-Checks               | qa-playtester | ≈ 20      |
| **Umsetzung gesamt**         |               | ≈ 130–160 |

Risiko mittel: Save-Version parallel zu M13-E2 (P-4), Neumessung `balance-merchants` (grösste Wirkung, Anhang g).
