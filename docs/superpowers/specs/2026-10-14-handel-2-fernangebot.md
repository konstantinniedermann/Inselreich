# Handel 2 · Fernangebot — Spec

Stand: 2026-10-14 (Nachtrag R633/R634) · Paket `design-handel-2` · Autor: design-spec-author · Grundlage: Designvorschlag
[`2026-10-14-handel-2-brainstorming.md`](../archiv/specs/2026-10-14-handel-2-brainstorming.md) §3 V1, §5, §7; R629 (Gate
Brainstorming OK V1) · Prozessstufe voll · Anhänge: [01 Werte und Fristrechnung](2026-10-14-handel-2-fernangebot/anhang-01-werte.md),
[02 UI-Texte](2026-10-14-handel-2-fernangebot/anhang-02-ui-texte.md), [03 Nachtrag-AK](2026-10-14-handel-2-fernangebot/anhang-03-nachtrag-ak.md). Code-Stellen beziehen sich auf `main` zum Datum
dieser Spec (`SAVE_VERSION` 14).

**Abweichungen vom Designvorschlag** (Begründung in den genannten Abschnitten, Entscheid in §8):

- **P-1 Frist 1700 statt 1500** (2:50 statt 2:30): Die Seed-3-Rechnung lässt bei 1500 nur 10 s Reserve für Felsbucht
  (§5, Anhang 01 W.2).
- **P-2 Folgeperiode immer gesperrt** (`farSkip`): Ohne Sperre kostet ein sofort gelieferter Fernauftrag die nächste
  Periode nicht; das wäre +185/min = 5,8 % von (b) (Anhang 01 W.3, Entartung 1). Der Vorschlag setzte die Sperre
  voraus («kostet trotzdem die nächste Periode»), der Code liefert sie nicht von selbst.
- **P-3 Frist eines Fernauftrags im Save nur gegen Takt-Grenzen geprüft**, damit der Rückfall «Frist kürzen» ohne
  Migration bleibt (R15).

**Nachtrag R633/R634** (Gate Spec, Playtest I-047): A2 Ersatzlage und Fremdinsel↔Fremdinsel (§1, §5, AK-H2-31);
eigene Fernkarte statt zweiter Zeile (§4, Anhang 02 T.5, AK-H2-30); Ereignis-Log für Verfall und Lieferung
(R14, Anhang 02 T.2, AK-H2-33); Vertrag schliesst Fernangebot aus (R3, AK-H2-32); K4-Auflage erfüllt (§7).
Keine neuen Spielwerte, keine neue Sim-Regel, keine Save-Änderung.

## 1 Ziel und Nicht im Umfang

**Ziel.** Hat der Spieler einen Fremdkontor, steht am Periodenbeginn neben dem Zufallsauftrag ein **Fernangebot**: das
Vorliebe-Gut einer Fremdinsel (I-092) in grosser Menge, lieferbar nur an deren Kontor. **Annehmen** ersetzt den
Zufallsauftrag durch den Fernauftrag mit langer Frist und lässt die nächste Periode aus. Spielerzweck: Bestehende
Routen bekommen einen zweiten Zweck, und am Auftrag entsteht eine Wahl zwischen klein, schnell und zufällig und gross,
geplant und mit Schiff.

**Zulässig (A2, R633):** Das Fernangebot gilt für jede Fremdinsel mit Kontor, auch für eine Insel in **Ersatzlage**
(Stufe 3 der Inselplatzierung, `d > dMax`, `FALLBACK_*` in `defs/sea.ts`), und die Ware darf auf jeder Route
ankommen, auch **Fremdinsel↔Fremdinsel**: Ware hat keine Herkunft, R6 prüft nur den Lieferort. Die Regeln R1–R15
ändern sich dafür nicht; die Frist-Garantie (§5) gilt nur für `d ≤ dMax` und eine Route Heimat↔Fern-Insel. AK-H2-31.

**Ausdrücklich nicht im Umfang:**

- Stückpreis über `ORDER_PREMIUM` 0,75; der Fernauftrag nutzt `orderUnitReward` unverändert;
- Strafe für einen verfallenen Fernauftrag; Gebühr-Tausch (I-093 in der Fassung mit 60 Geld);
- mehrere Fernangebote gleichzeitig; Fernangebote für Rohgüter, Werkzeug, Gewürz oder die Güter aus Erweiterung 1;
- jede Änderung an Zufallsaufträgen (Gut, Menge, Prämie, Takt, `ORDER_DURATION`, `orderForPeriod`), am Stammkunden
  (I-047), an der Vorliebe (I-092), an Preisen, Sättigung, Booms, Edikten, Schiffen und Routen;
- Marke auf der Seekarte (Vorschlag AN-7 «optional»: nicht in dieser Spec), Tastenkürzel, neues Panel, neuer Klang;
- Treuebonus (I-091), Kaufseite (I-006), Zeitnachfrage (I-029);
- Controller-Strategie für Fernaufträge (der Controller baut keinen Fremdkontor, §4);
- eine Frist-Garantie für Ersatzlage und Routen zwischen Fremdinseln (§5, bekannte Grenze, keine Strafe);
- ein sichtbares Ereignis-Log ohne Krisen und Log-Einträge für Zufallsaufträge oder Stammkunde (Beobachtungen
  2026-10-14).

## 2 Regeln

**Begriffe.** Periodenbeginn P = Tick `t ≥ ORDER_FIRST_TICK` mit `(t − ORDER_FIRST_TICK) % ORDER_PERIOD = 0`,
Periodenindex `k = (t − ORDER_FIRST_TICK) ÷ ORDER_PERIOD` (600 bzw. 900, `defs/timing.ts`), also
`P(k) = ORDER_FIRST_TICK + k × ORDER_PERIOD`. Fremdinsel = Index `i ≥ 1` in `world.islands`. `HOME` = 0.

### 2.1 Werte (alle in `src/sim/defs/`)

| Ort                            | Feld / Konstante     | Wert                                                         |
| ------------------------------ | -------------------- | ------------------------------------------------------------ |
| `defs/timing.ts`               | `FAR_ORDER_DURATION` | `1700` (Ticks ab Periodenbeginn, 2:50 bei 1×; P-1)           |
| `types.ts`, `OrderDef`         | `far?: number`       | optionales Feld: Menge eines Fernauftrags                    |
| `defs/goods.ts`, `GOODS.cloth` | `order.far`          | `20` (Wert 20 × 22 = 440)                                    |
| `defs/goods.ts`, `GOODS.rum`   | `order.far`          | `15` (Wert 15 × 30 = 450)                                    |
| `defs/goods.ts`, `GOODS.glass` | `order.far`          | `12` (Wert 12 × 37 = 444)                                    |
| `defs/sea.ts`, `ISLANDS`       | `prefers`            | unverändert (Möweninsel Stoff, Felsbucht Rum, Weidenau Glas) |

`FAR_ORDER_DURATION` steht im Block der Auftragstakte mit einem Kommentar wie bei `ORDER_DURATION`: Die Save-Prüfung
liest den Wert **nicht** (R15), eine Änderung braucht keine Migration. Kein weiteres Gut erhält `order.far`.

### 2.2 Angebot

- **R1 Wählbare Inseln.** `farEligible(world): number[]` (rein, in `orders.ts`) liefert in aufsteigender
  Indexreihenfolge jede Fremdinsel `i`, für die gilt: (1) `world.islands[i].kontorId !== null`; (2) der `IslandDef`
  mit `kind === world.islands[i].kind` hat in `prefers` ein Gut `g` mit `GOODS[g].order?.far !== undefined` (das
  erste solche Gut in `prefers`-Reihenfolge ist «das Gut der Insel»); (3) `GOODS[g].order.tier ≤ maxHouseTier(world)`.
  Die Heimat ist nie wählbar.
- **R2 Rotation ohne Zufall.** Ist `e = farEligible(world)` nicht leer, ist die Insel der Periode k `e[k mod e.length]`.
  Kein Zufallszug, kein neuer Zufallsstrom (ADR-010). Die Abfolge hängt nur von k, Kontoren und Höchststufe ab.
- **R3 Wann ein Angebot entsteht.** Ein Fernangebot entsteht nur in `tickOrders` am Periodenbeginn k, **unmittelbar
  nachdem** in diesem Tick der Zufallsauftrag der Periode angeboten wurde (`offerRandomOrder`), und nur wenn zugleich
  `world.contract === null` (nach der Abrechnung des Tick, I-047 R6/R7), `functionLock(world, 'orders') === null` und
  `farEligible(world)` nicht leer ist. Dann gilt
  `world.farOffer = { island: i, good: g, amount: GOODS[g].order.far, reward: amount × orderUnitReward(g) }`.
  Folgerungen: Bei gelieferter Vertragsmenge, bei laufendem Fernauftrag und in der gesperrten Folgeperiode (R7) gibt es
  weder Zufallsauftrag noch Fernangebot; nach einem Vertragsbruch im selben Tick (I-047 R7) gibt es beides.
  **Vertrag (ausdrücklich, R634 (2d)):** Solange `world.contract !== null` (alle Perioden des Vertrags, I-047 R6),
  entsteht an keinem Periodenbeginn ein Zufallsauftrag (I-047) und damit **kein** Fernangebot; ein Fernangebot hängt
  immer an einem Zufallsauftrag derselben Periode. Das ist keine neue Regel, sondern Folge von R3 und I-047; AK-H2-32
  belegt es über mehrere Perioden.
- **R4 Ende des Angebots.** `world.farOffer` wird `null` (a) beim Verfall des Zufallsauftrags in `tickOrders`
  (`t > order.due`, derselbe Schritt, der `order` löscht), (b) bei erfolgreichem `deliverOrder` des Zufallsauftrags,
  (c) bei erfolgreichem `acceptFarOrder`. Sonst bleibt es unverändert; insbesondere prüft kein Schritt den Kontor nach
  (Abriss nach dem Angebot: Annehmen scheitert nach R5).

### 2.3 Annehmen und Liefern

- **R5 Annehmen.** Neue Sim-Aktion `acceptFarOrder(world: World): Result` in `orders.ts`. Prüfreihenfolge, jeweils
  `fail(<Grund>)` ohne jede Änderung der Welt:
  1. `functionLock(world, 'orders') !== null` → Sperrgrund;
  2. `world.farOffer === null` → `'Kein Fernangebot'`;
  3. `world.contract !== null` → `'Vertrag läuft'` (nur über konstruierte Stände erreichbar, R15 verbietet die
     Kombination im Save);
  4. `noKontorTrade(world, farOffer.island) !== null` → dessen Grund `'Kein Kontor auf <Insel>'`.

  Bei Erfolg, mit `o = world.order` (der Zufallsauftrag der Periode, Invariante R15) und `P = P(o.period)`:
  `world.order = { period: o.period, good, amount, reward, due: P + FAR_ORDER_DURATION, island }` aus dem Angebot,
  `world.farOffer = null`, `world.farSkip = o.period + 1`. Gut, Menge, Wert und Frist sind damit festgeschrieben;
  Stufenwechsel, Edikt, Boom oder Abriss ändern sie nicht. Annehmen kostet nichts und ändert weder Lager noch Geld.

- **R6 Liefern.** `deliverOrder(world, island)` bekommt eine Prüfung: Ist `world.order.island !== undefined` und
  `island !== world.order.island`, dann `fail('Nur auf <Insel>')` mit dem Namen der Fern-Insel, ohne Änderung. Sie
  steht **nach** `'Kein Auftrag'` und **vor** `'Unbekannte Insel'`. Alle übrigen Prüfungen und Gründe bleiben
  (Sperre, Kontor, «Nicht genug Ware auf <Insel>»). Bei Erfolg wie heute: Lager −Menge, Geld +Wert (auch bei
  negativem Geld), `order = null`, zusätzlich `farOffer = null`. Ein Zufallsauftrag (ohne `island`) bleibt von jedem
  Kontor lieferbar.
- **R7 Folgeperiode gesperrt.** `world.farSkip: number | null` hält den Index der Periode, deren Zufallsauftrag nach
  einem angenommenen Fernauftrag entfällt. Am Periodenbeginn k gilt: Ist `farSkip === k`, wird in diesem Tick **kein**
  Zufallsauftrag und **kein** Fernangebot angeboten, auch wenn `order === null` ist (Fernauftrag früh geliefert) oder
  ein Vertrag im selben Tick bricht; danach `farSkip = null`. Ein Vertrag rechnet in dieser Periode wie in I-047
  ab (Lieferung oder Bruch mit Strafe). Ein Fernauftrag belegt damit stets die Perioden k und k + 1.
- **R8 Verfall ohne Strafe.** Ein Fernauftrag verfällt wie jeder Auftrag im ersten Schritt mit `t > due`, also bei
  `P + FAR_ORDER_DURATION + 1`. Kein Geldabzug, kein Vertragsangebot; die UI meldet den Verfall aus dem Zustandsvergleich (T-17, R14). Weil
  `FAR_ORDER_DURATION < 2 × ORDER_PERIOD`, ist er am Beginn der Periode k + 2 stets verfallen, und dort kommt der
  Zufallsauftrag `orderForPeriod(seed, k + 2, maxHouseTier)`.
- **R9 Stammkunde nach Lieferung.** Eine erfolgreiche Lieferung eines Fernauftrags setzt das Vertragsangebot genau wie
  I-047 R1: `contractOffer = { good, island }` mit der Fern-Insel, wenn `maxHouseTier ≥ CONTRACT_MIN_TIER` und
  `contract === null`. Nichts Neues; die Vertragsmenge ist `order.contract`, nicht `order.far`.
- **R10 Unabhängigkeiten.** Fernangebot und Fernauftrag lesen nie `PREFER_PCT`, `sell`, `sellPct`, `buyPct`, Boom
  oder Edikte (Vorschlag AN-2, AN-3; I-092 R6 bleibt wahr). Die Lieferung ändert `sellPct` nicht. Ausgabesperren
  (`goodLocks`) gelten wie bei `deliverOrder` heute nicht. Ein Stufenabstieg ändert einen angenommenen Fernauftrag
  nicht; die Rotation liest die Stufe nur beim Anbieten (R3).
- **R11 Nächster Auftrag.** `nextOrderTick(world)` überspringt die gesperrte Periode: Ist der berechnete nächste
  Periodenbeginn der von `farSkip`, liefert es den Beginn danach (`+ ORDER_PERIOD`). Die Karte «Nächster Auftrag in
  m:ss» stimmt damit nach früher Lieferung.

### 2.4 Tick-Reihenfolge und Determinismus

- **R12 Ablauf von `tickOrders`** (Stelle in `step` unverändert: nach `tickMarket`, vor `tickCrises`):
  1. Verfall: `order !== null && t > order.due` → `order = null`, `farOffer = null`;
  2. kein Periodenbeginn → Ende (`null`);
  3. `contractOffer = null` (I-047 R2);
  4. `skip = (farSkip === k)`; ist `farSkip !== null`, dann `farSkip = null`;
  5. Vertrag abrechnen (I-047 R6/R7); bei Lieferung Ende mit dem Ereignis;
  6. ist `order === null` und nicht `skip`: Zufallsauftrag anbieten, danach Fernangebot nach R3;
  7. Ende mit dem Ereignis (oder `null`).

  Spieleraktionen (`acceptFarOrder`, `deliverOrder`) laufen zwischen zwei Schritten. Annehmen bei `world.tick = P + 600`
  ist erlaubt (der Zufallsauftrag verfällt erst im Schritt P + 601).

- **R13 Determinismus.** Kein neuer Zufallszug, kein gespeicherter RNG-Zustand. `orderForPeriod` bleibt zustandslos:
  Der Zufallsauftrag der Periode k ist mit und ohne Fernangebot derselbe. Zwei Läufe mit gleichem Seed und gleicher
  Aktionsfolge sind bitgleich.
- **R14 Bericht an die UI.** `StepReport` bleibt unverändert, die Sim bekommt kein Verfallsereignis (R634 (2c)). Die UI
  liest `farOffer` und `order.island` aus dem Zustand und vergleicht den Auftrag vor und nach jedem Schritt
  (`orderMessageFor`-Muster): Meldungen aus Spieleraktionen und aus diesem Vergleich; Log-Einträge T-16 bis T-18
  (Anhang 02 T.2). Der Verfall eines Zufallsauftrags bleibt ohne Meldung und Eintrag.

## 3 Zustand und Save

**Weltzustand** (`src/sim/types.ts`):

| Ort     | Feld       | Typ                                                                        | Start (`createWorld`) |
| ------- | ---------- | -------------------------------------------------------------------------- | --------------------- |
| `World` | `farOffer` | `{ island: number; good: GoodId; amount: number; reward: number } \| null` | `null`                |
| `World` | `farSkip`  | `number \| null`                                                           | `null`                |
| `Order` | `island?`  | `number` — nur bei Fernaufträgen vorhanden, sonst fehlt der Schlüssel      | —                     |

**Save.** Neue Version, **nächste freie Nummer beim Merge** (R583-Muster, R629 (3)): `main` steht auf v14, Erweiterung 1
plant eigene Sprünge (K2–K4). Wer zuerst merged, nimmt die nächste Nummer; das andere Paket hängt seine Migration
dahinter. Tests prüfen gegen `SAVE_VERSION`, nie gegen eine Zahl.

- Migration `SAVE_VERSION − 1 → SAVE_VERSION` als nächstes Glied der Kette (`save.ts`, nach `migrateV13ToV14`): neue
  Schlüssel am Ende, `farOffer = null`, `farSkip = null`, kein `island` an `order`. Verlustfrei, wirft nie. Ein
  migrierter Stand verhält sich bis zum ersten Fernangebot wie vorher.
- Abweisen mit Hinweis für alles ausserhalb der Kette: `{ ok: false, reason: 'Unbekannte Version' }`, nie eine
  Ausnahme; Test (AK-H2-21).
- Golden-Hashes über `serialize` (z. B. `seaGolden.test.ts` mit `foldBackToV9`) brauchen einen Rückfaltschritt, der
  `farOffer` und `farSkip` entfernt (Muster I-047 «`foldBackToV13`», R584 Tech (1)). **[Tech: bestätigen]**

- **R15 Validierung** in `isWellFormed`, nur strukturell (nicht gegen aktuelle Spielwerte), sonst
  `'Beschädigter Spielstand'`:
  1. `farOffer` ist `null` oder ein Objekt mit `island` ganzzahlig, `1 ≤ island < islands.length`; `good` aus `GOODS`
     mit `order`; `amount` ganzzahlig ≥ 1; `reward` ganzzahlig ≥ 0.
  2. `farOffer ≠ null` ⇒ `order ≠ null`, `order.island` fehlt, `contract = null`, `contractOffer = null`.
  3. `order.island` fehlt oder ist ganzzahlig mit `1 ≤ island < islands.length`. `isValidOrder` erhält dafür die
     Inselzahl.
  4. Frist: ohne `island` wie heute `due = P(period) + ORDER_DURATION`; mit `island`
     `P(period) + ORDER_DURATION < due ≤ P(period) + 2 × ORDER_PERIOD − 1` (P-3: liest `FAR_ORDER_DURATION` nicht).
     `P(period) ≤ tick ≤ due` gilt für beide.
  5. `farSkip` ist `null` oder ganzzahlig mit `tick ≥ ORDER_FIRST_TICK` und
     `farSkip = floor((tick − ORDER_FIRST_TICK) ÷ ORDER_PERIOD) + 1`.

  Ein Kontor auf `farOffer.island` oder `order.island` wird beim Laden **nicht** verlangt: Ein Abriss nach dem Angebot
  ist ein gültiger Spielzustand; Annehmen bzw. Liefern meldet dann den Grund (R5, R6).

## 4 Bedienung und UI (desktop-first)

Das Fernangebot bekommt eine **eigene Karte** (R634 (2b)) im Slot oben rechts, unter der Auftragskarte und über der
Krisenkarte; die Auftragskarte (`src/ui/order.ts`) bekommt nur den Fernauftrag-Zustand. Texte bilden reine, DOM-freie
Helfer (testbar unter `tests/ui/`); Wortlaut, Lage, Reihenfolge und Höhen in Anhang 02 (T.1, T.5).

- **U1 Fernkarte.** Mit `farOffer ≠ null` zeigt eine eigene Karte T-02 «Fernangebot <Insel>: <Menge> <Gut> · <Wert> ·
  Frist m:ss · Lager x/<Menge>» mit Knopf **Annehmen** (Tooltip T-03); Höhe ≤ 110 px bei 300 px Breite. Die
  Auftragskarte mit **Liefern** bleibt unverändert. Nach dem Annehmen verschwindet die Fernkarte, der Fernauftrag
  steht in der Auftragskarte (U2). Reihenfolge von oben: Auftragskarte (oder Stammkunde-Karte), Fernkarte,
  Krisenkarte; nie mehr als drei Karten (Stammkunde und Fernangebot schliessen sich aus, R15); Höchststapel 315 px.
- **U2 Fernauftrag.** Mit `order.island` zeigt die Auftragskarte T-04 mit Knopf **Liefern**; der Knopf ruft
  `deliverOrder(world, order.island)`, liefert also von der Fern-Insel unabhängig von der aktiven Insel. Warnfarbe ohne
  Kontor auf der Fern-Insel (T-05).
- **U3 Lager** in T-02 und T-04 liest das Lager der Fern-Insel.
- **U4 Meldungen** T-07, T-08; Fehlgründe aus `Result` mit Klang `error` (T-09). Klänge `orderDone` und `error`
  bestehen; kein neues Asset.
- **U5 Ohne Fernangebot** ist die Karte bitgleich zu heute. «Nächster Auftrag in m:ss» nutzt `nextOrderTick` (R11).
- **U6 Ereignis-Log.** T-16 bis T-18 (Anhang 02 T.2): Lieferung und Verfall eines angenommenen Fernauftrags tragen eine
  Meldung (`info`), der Verfall eines nur angebotenen Fernangebots nur den Log-Eintrag (`toast` `null`). Das Log ist
  heute nur bei Krisen sichtbar; das bleibt in diesem Paket so (Grenze, Beobachtung).
- Bei 1280×720 überdecken sich Auftrags-, Fern- und Krisenkarte (auch bei Sturmwarnung) nicht, und kein Karteninhalt
  ist abgeschnitten (AK-H2-30).

## 5 Fristbeleg gegen die Seed-3-Karte (R629 Pflichtpunkt c)

Herleitung in Anhang 01 W.2; Kurzfassung:

- Fahrzeit `L = SHIP_TICKS_PER_SEA_TILE × d` = 10 × d; keine Liegezeit (Ankunft, Umschlag und Abfahrt im selben
  Schritt, `ships.ts` `handleDocked`). Für Seed 3 liegen alle drei Inseln in Stufe 1 oder 2 (`islands-c.test.ts`),
  also `dMin ≤ d ≤ dMax`: Möweninsel L 250–300, Weidenau 300–350, Felsbucht 350–400.
- Schlechtester Fall nach R629 «Annehmen bei P + 600, Schiff gerade abgefahren»:
  - **Fall A**, Schiff hat die Fern-Insel gerade verlassen: Ware dort bei P + 600 + 2 L ≤ P + 1400. Mit 1700 bleiben
    ≥ 300 Ticks (30 s), mit 1500 bei Felsbucht d 40 nur 100 Ticks (10 s).
  - **Fall B**, Schiff hat die Heimat gerade ohne die Ware verlassen: P + 600 + 3 L. Mit 1700 hält das für Möweninsel
    und Weidenau immer, für Felsbucht bis d 36; bei d 37–40 genügt Annehmen bis P + 1700 − 3 L (d 40: P + 500).
    Ganz garantierbar wäre Fall B für Felsbucht d 40 erst mit 1800, und das sperrte die übernächste Periode.
- **Entscheid der Spec: `FAR_ORDER_DURATION` = 1700** (P-1; Alternative 1500 in §8 O-1). Garantie: Fall A auf jeder
  Lage mit `d ≤ dMax`, Fall B für zwei von drei Inseln.
- **Bekannte Grenze (A2):** Liegt eine Insel in Ersatzlage (Stufe 3), ist `d` bis `dMax + FALLBACK_FAR_STEPS ×
FALLBACK_FAR_STEP` = `dMax + 40` (Weidenau bis 75, Felsbucht bis 80), also `L` bis 800; Fall A (`P + 600 + 2 L`)
  kann dort die Frist überschreiten, ab `L > 550` schon bei Annehmen in `P + 600`. Das ist hinzunehmen: keine Strafe,
  die Karte zeigt die Frist, frühes Annehmen genügt (wie O-4). Gleiches gilt für Routen Fremdinsel↔Fremdinsel
  (Fahrzeit `10 × d` zwischen den Inseln, nicht garantiert). Die Frist ist ein Spielwert, kein Sim-Eingriff je Lage.
  AK-H2-31 belegt nur, dass Angebot, Annehmen, Liefern und Verfall dort unverändert gelten.
- Die echte Seed-3-Länge pinnt AK-H2-27 (Lauf im Paket H2-SIM, nicht durch diese Spec).

## 6 Balancing-Auswirkung

- **Baseline bitgleich [Tech: bestätigen].** Der Controller (`tests/sim/controller.ts`) liest nur `home(w).kontorId`
  (grep «kontor»: Z. 105, 116), baut keinen Fremdkontor und ruft `deliverOrder` nie auf (grep «deliverOrder»: kein
  Treffer; Aufruf nur aus `src/ui/app.ts`). Damit ist `farEligible` stets leer, `farOffer` und `farSkip` bleiben
  `null`, kein Auftrag trägt `island`, und `tickOrders` bietet wie heute an. Kein neuer Zufallszug (R2, R13).
  `tests/sim/balance.test.ts` bleibt unverändert und grün; kein Balancing-Ruling nötig. Prüfpunkt für Gate Spec:
  lead-tech bestätigt dies, und der Plan führt den Nachweis als eigenen Test (AK-H2-24).
- **Wirkung im Spiel** (Anhang 01 W.3): Phase (a) keine; gegen den Auftragspfad +35 … +81/min = 1,1 … 2,6 % von (b),
  0,7 … 1,6 % von (c); je Einwohner 0,08 … 0,18 je 100 Ticks (b). Obergrenze ein Fernauftrag je 1800 Ticks = 150/min
  brutto. Gegen Verkauf mit Vorliebe am selben Kontor +124 … +158 je Fernauftrag.
- **Entartungen ausgeschlossen:** frühe Lieferung durch R7; Kaufen und Liefern −30 … −40 je Auftrag mit Edikt Handel;
  eigenes Schiff nur für Fernaufträge −9 … −55/min.
- **Invarianten-Test der Defs** (neu, z. B. `tests/sim/farOrder.test.ts`), für jedes Gut `g` mit `order.far`:
  `orderUnitReward(g) < 0,8 × GOODS[g].buy`; `440 ≤ far × orderUnitReward(g) ≤ 450`; `far` ganzzahlig, ≥ 1,
  `≤ ⌊SHIP.capacity ÷ ROUTE_GOODS_PER_DIRECTION⌋` (25) und `≤ STORAGE_CAP`. Ferner: jedes Gut in `prefers` einer
  `ISLANDS`-Def hat `order.far`; `ORDER_DURATION + 2 × SHIP_TICKS_PER_SEA_TILE × max(dMax) ≤ FAR_ORDER_DURATION
≤ 2 × ORDER_PERIOD − 1`.
- **Rückfall** (nur `src/sim/defs/`, per Ruling, Anhang 01 W.4): (1) Fernmengen auf Wert ≈ 360 (Stoff 16, Rum 12,
  Glas 10; Band im Test 350–370); (2) `FAR_ORDER_DURATION` kürzen, nicht unter die Invariante (1400). Beides ohne
  Save-Folge (R15). Prüfung im Playtest nach H2-UI: Verdrängen Fernaufträge den Stammkunden oder liefert der Spieler
  fast jeden Fernauftrag ohne Routenänderung?

## 7 Abgrenzung und Doku-Folgen

- **I-093 geht in V1 auf** (R629 (1)): Die «Wahl unter Bestellungen» ist das Fernangebot. Die Fassung mit 60 Geld
  Gebühr und anderem Gut ist verworfen (bei leerem Lager immer gewählt, IDEEN-09). I-095 ist mit V1 umgesetzt.
- **I-047 Stammkunde:** Vertrag und Fernangebot schliessen sich aus (R3, R15); Vertragsangebot nach Lieferung wie
  I-047 R1 (R9). Keine Änderung an I-047-Regeln, ausser dass R7 hier in der gesperrten Periode den Zufallsauftrag nach
  einem Bruch unterdrückt (I-047 R7 gilt sonst unverändert).
- **I-092 Vorliebe:** liefert nur die Zuordnung Insel → Gut; `PREFER_PCT` wird nicht gelesen (R10).
- **Erweiterung 1 «Stände und Segel»** (nur gelesen, Vorschlag §7): eigenständiges Handels-Paket ausserhalb E1.
  Porzellan und Konfekt haben kein `order` und damit kein `order.far`; ein E1-`prefers` ohne `order.far` macht die
  Insel nicht wählbar (R1), bricht aber den Invarianten-Test, der dann per Ruling anzupassen ist. K3 (Flotte 4 → 6)
  ist Synergie ohne Regeländerung. Save-Nummer: §3.
- **Auflage K4 Gefahren der See** (R629 (2)): **erfüllt (R634 (2e))**. Im Spiel gibt es keine Piraten (`src/sim/ships.ts`
  kennt nur Ladungsverlust bei Heimkehr über die Lagergrenze); der Sturm halbiert nur Betriebe und ändert Fahrzeiten
  nicht (Playtest I-047, Lauf mit Krisen «normal»: Fahrzeiten gleich wie ohne Sturm). Beleg: Hin-und-Rück-Fahrzeiten
  52 s (Möweninsel), 62 s (Weidenau), 78 s (Felsbucht); schlechtester Fall «Schiff gerade abgefahren» ≈ 117 s
  (Felsbucht) < Frist 2:50 = 170 s. Die folgende Regel bleibt als **Hinweis für einen künftigen K4-Autor**:
  - Bringt K4 einen Halt H (Ticks; längster zusätzlicher Aufenthalt eines Schiffs auf Hin- und Rückweg zusammen, etwa
    durch die Sturm-Anweisung), muss gelten
    `ORDER_DURATION + 2 × SHIP_TICKS_PER_SEA_TILE × max(dMax) + H ≤ FAR_ORDER_DURATION ≤ 2 × ORDER_PERIOD − 1`.
    Mit 1700 heisst das H ≤ 300, mit dem Höchstwert 1799 H ≤ 399. H steht als Def-Wert in `src/sim/defs/`; K4 nimmt
    ihn in den Invarianten-Test dieser Spec auf.
  - Ist H > 399, entscheidet die K4-Spec ausdrücklich, ob ein Sturmhalt einen Fernauftrag verfehlen lassen darf (ohne
    Strafe), und nennt es in der Spielanleitung.
  - Piraten (nur falls K4 sie einführt, ab Seeweg 35) treffen Felsbucht immer und Weidenau bei d 35; ein Überfall mit 50 % Ladungsverlust
    verfehlt den Fernauftrag. Empfehlung an K4: hinnehmen (keine Strafe, das Geleit ist die Antwort), keine Änderung
    an den Fernauftrag-Regeln.
- **Doku-Folgen** (im Umsetzungspaket, nicht in dieser Spec geändert):
  - `README.md`, Spielanleitung «Handelsaufträge»: Unterabschnitt Fernangebot (Vorlage Anhang 02 T.4).
  - `docs/spielwerte.md`, Abschnitt «### Handelsaufträge»: Unterabschnitt «Fernangebot» mit Tabelle Insel, Gut,
    ab Stufe, Menge, Wert (W.1), Frist 2:50 ab Auftragsbeginn, Rotation, nächster Auftrag entfällt.
  - `docs/arc42.md`: Persistenz (neue Version, `farOffer`, `farSkip`, `Order.island`) und Tick-Ablauf (R12).
  - `docs/ideen.md`: I-095 und I-093 auf den Stand dieser Spec setzen (lead-design).

## 8 Abnahmekriterien

Vitest unter `tests/sim/` (Sim, Save, Defs) und `tests/ui/` (reine Helfer); Browser-Check durch qa-playtester.
Testwelten setzen Stufe, Lager, Kontore und Tick direkt; Funktion `orders` freigeschaltet, sofern nicht anders
genannt. Inselindizes: 1 Möweninsel, 2 Felsbucht, 3 Weidenau (Reihenfolge `ISLANDS`; im Test über `kind` bestimmen,
nicht als Zahl). Beispiel Felsbucht, Rum 15, Wert 450, `P = P(k)`.

**Angebot**

- **AK-H2-01** Kontor auf Felsbucht, Höchststufe 3, Schritt auf Periodenbeginn k → `order` gleich
  `orderForPeriod(seed, k, 3)` mit `due = P + 600`, `farOffer = { island: 2, good: 'rum', amount: 15, reward: 450 }`.
- **AK-H2-02** Kein Fremdkontor (nur Heimatkontor) → am Periodenbeginn `farOffer` bleibt `null`, `order` wie ohne
  diese Spec. Gleiches bei gesperrter Funktion `orders` (konstruierter Stand mit Fremdkontor).
- **AK-H2-03** Stufe: nur Kontor auf Weidenau, Höchststufe 3 → `farOffer` `null`; Höchststufe 4 →
  `{ island: 3, good: 'glass', amount: 12, reward: 444 }`. Nur Kontor auf Möweninsel, Höchststufe 2 → Stoff 20, 440.
- **AK-H2-04** Rotation: Kontore auf allen drei Fremdinseln. Höchststufe 4, Perioden k = 0 … 5 → Inseln
  `e[k mod 3]` mit `e = [1, 2, 3]`; Höchststufe 3 → `e = [1, 2]`, Inseln 1, 2, 1, 2, …; Höchststufe 2 → stets 1.
  Zwischen den Perioden keine Aktion ausser `step`.
- **AK-H2-05** Vertrag: Mit laufendem Vertrag, der am Periodenbeginn liefert → `order` und `farOffer` `null`. Vertrag
  bricht im Tick (Lager 0) → Zufallsauftrag und Fernangebot beide gesetzt.
- **AK-H2-06** Ende des Angebots: (a) `deliverOrder` des Zufallsauftrags → `farOffer` `null`; (b) Schritt auf
  `P + 601` ohne Lieferung → `order` und `farOffer` `null`; (c) bei `world.tick = P + 600` besteht das Angebot noch.
- **AK-H2-07** Abriss des Fremdkontors nach dem Angebot → `farOffer` bleibt bis zu seinem Ende (R4) unverändert;
  `acceptFarOrder` → `fail('Kein Kontor auf Felsbucht')`, `serialize` unverändert.

**Annehmen**

- **AK-H2-08** `acceptFarOrder` mit Angebot → `ok`; `order = { period: k, good: 'rum', amount: 15, reward: 450,
due: P + FAR_ORDER_DURATION, island: 2 }`, `farOffer` `null`, `farSkip = k + 1`; Geld und Lager unverändert.
- **AK-H2-09** Prüfreihenfolge, je ohne Änderung (`serialize` gleich): Sperre und kein Angebot zugleich → Sperrgrund;
  kein Angebot → `'Kein Fernangebot'`; Angebot und Vertrag zugleich (konstruiert) → `'Vertrag läuft'`; Angebot ohne
  Kontor → `'Kein Kontor auf <Insel>'`.
- **AK-H2-10** Nach dem Annehmen Höchststufe auf 1 senken (Häuser abreissen oder Stufe setzen) → `order` unverändert,
  Lieferung zahlt weiter 450.

**Liefern**

- **AK-H2-11** Fernauftrag Rum, Felsbucht-Lager 20 → `deliverOrder(world, 2)` → `ok`, Felsbucht-Lager 5, Geld +450,
  `order` `null`; bei Höchststufe ≥ 3 `contractOffer = { good: 'rum', island: 2 }`; `sellPct.rum` unverändert.
- **AK-H2-12** Ortsprüfung: Fernauftrag auf Felsbucht, Heimatlager Rum 50 → `deliverOrder(world, HOME)` →
  `fail('Nur auf Felsbucht')`; ebenso mit Insel 1 und mit unbekannter Insel 9; jeweils `serialize` unverändert.
- **AK-H2-13** Abriss des Felsbucht-Kontors nach dem Annehmen → `deliverOrder(world, 2)` →
  `fail('Kein Kontor auf Felsbucht')`; Schritt auf `P + FAR_ORDER_DURATION + 1` → `order` `null`; die Geldänderung
  dieses Schritts ist gleich der eines Vergleichslaufs, in dem `order` vor dem Schritt auf `null` gesetzt wurde (keine
  Strafe).
- **AK-H2-14** Felsbucht-Lager 14 → `fail('Nicht genug Ware auf Felsbucht')`, Lager bleibt 14 (keine Teillieferung).
- **AK-H2-15** Unabhängigkeit: Boom auf Rum, Edikt Handel aktiv und Ausgabesperre auf Rum zugleich → Lieferung zahlt 450. Ein Zufallsauftrag (ohne `island`) ist weiter mit `deliverOrder(world, 1)` vom Kontor der Möweninsel lieferbar.

**Periodenfolge**

- **AK-H2-16** Fernauftrag in k angenommen, nicht geliefert: Schritt auf P(k + 1) → `order` ist weiter der
  Fernauftrag, `farOffer` `null`, `farSkip` `null`; bei `world.tick = P + 1700` ist `deliverOrder` noch möglich
  (Gegenprobe mit Lager); ohne Lieferung nach Schritt `P + 1701` `order` `null`; Schritt auf P(k + 2) → `order` gleich
  `orderForPeriod(seed, k + 2, maxHouseTier)`, Fernangebot nach R3.
- **AK-H2-17** Frühe Lieferung: annehmen und bei `P + 100` liefern → `nextOrderTick` = P(k + 2); Schritt auf P(k + 1)
  → `order` und `farOffer` `null`, `farSkip` `null`; Schritt auf P(k + 2) → Zufallsauftrag.
- **AK-H2-18** Gesperrte Periode mit Vertrag: Fernauftrag früh geliefert, Vertrag angenommen (R9), Lager 0 → bei
  P(k + 1) Bruch mit Strafe wie I-047, **kein** Zufallsauftrag (R7); bei P(k + 2) Zufallsauftrag. Mit ausreichendem
  Lager → Lieferung des Vertrags bei P(k + 1) wie I-047.

**Save und Determinismus**

- **AK-H2-19** Rundreise: je eine Welt mit offenem Fernangebot, mit laufendem Fernauftrag und mit gesetztem `farSkip`
  → `deserialize(serialize(w))` ok, `serialize` gleich, danach 3 Perioden gleicher Verlauf wie das Original.
- **AK-H2-20** Frist im Save (P-3): laufender Fernauftrag mit `due = P + 1500` (statt 1700) lädt (`ok`); mit
  `due = P + 600`, mit `due = P + 1800` und mit `island` bei `due = P + 600` → `'Beschädigter Spielstand'`.
- **AK-H2-21** Version: `createWorld(3).version === SAVE_VERSION`. Aus einer Welt der aktuellen Version ohne
  Fernangebot einen Stand `SAVE_VERSION − 1` bauen (`version − 1`, `farOffer` und `farSkip` entfernt), laden →
  migriert, `farOffer` und `farSkip` `null`, `serialize` gleich dem Original, danach 10 Perioden bitgleich. Stand mit
  `SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }`, keine Ausnahme.
- **AK-H2-22** Validierung → `'Beschädigter Spielstand'` je Fall: `farOffer.island` 0; `farOffer.island` =
  `islands.length`; `farOffer.good` `'tools'`; `farOffer.amount` 0; `farOffer` bei `order` `null`; `farOffer` bei
  Fernauftrag; `farOffer` bei `contract ≠ null`; `order.island` 0; `farSkip` ≠ aktuelle Periode + 1; `farSkip` 1,5.
  Gegenprobe: Stand mit `farOffer` und Fremdkontor abgerissen lädt (`ok`).
- **AK-H2-23** Determinismus: zwei Läufe, gleicher Seed, gleiche Folge (Angebot, Annehmen, Liefern auf Fern-Insel,
  6 Perioden, Verfall eines zweiten Fernauftrags) → bitgleiches `serialize`.
- **AK-H2-24** Baseline **[Tech: bestätigen]**: `tests/sim/balance.test.ts` unverändert (keine Änderung an der Datei)
  und grün. Eigener Test: Lauf mit dem Controller (`buildColony`) bis zum Ende; in jedem Schritt `farOffer` und
  `farSkip` `null` und kein `order.island`. Golden-Hashes grün über die Rückfaltung (§3).

**Werte und Fristen**

- **AK-H2-25** Invarianten-Test der Defs nach §6 grün; Werte `FAR_ORDER_DURATION` 1700 und `order.far` Stoff 20,
  Rum 15, Glas 12; kein anderes Gut hat `order.far`.
- **AK-H2-26** Kaufen und Liefern nie Gewinn: je Fern-Gut mit Edikt Handel `buy(w, g, far, i)` am Kontor der Fern-Insel
  und anschliessende Lieferung → Geld danach < Geld davor (−40, −30, −36 bei `buyPct` 100).
- **AK-H2-27** Seed-3-Rundfahrt (Fristbeleg R629 c, Lauf in H2-SIM): `createWorld(3)`; je Fremdinsel i gilt
  `dMin ≤ d(0, i) ≤ dMax`, und die drei Werte `laneTicks(w.islands, 0, i)` werden im Test als Konstanten gepinnt
  (gemessen in H2-SIM, Nachtrag in Anhang 01 W.2). Sim-Lauf je i mit Höchststufe 4, Kontor nur auf i (also
  `farEligible = [i]`), Gut der Insel 50 im Heimatlager, Schritt bis `world.tick = P + 600`:
  - **Fall A:** Route `{ a: 0, b: i, ab: [{ good, reserve: 0 }], ba: [] }`, Schiff konstruiert mit `port: i`, `to: 0`,
    `left: laneTicks(0, i)` (hat i im Schritt P + 600 verlassen); `acceptFarOrder` → `ok`. Erster Tick mit Lager auf
    i ≥ Menge ist genau `P + 600 + 2 × laneTicks(0, i)` und `≤ P + FAR_ORDER_DURATION`; `deliverOrder(world, i)` → `ok`.
  - **Fall B:** Route `{ a: 0, b: i, ab: [], ba: [{ good: 'spice', reserve: 0 }] }`, Schiff mit `port: 0`, `to: i`,
    `left: laneTicks(0, i)`; `acceptFarOrder`, dann `updateRoute` mit `ab: [{ good, reserve: 0 }]` → erster Tick mit
    Lager auf i ≥ Menge ist `P + 600 + 3 × laneTicks(0, i)`; der Test hält fest, ob er `≤ P + FAR_ORDER_DURATION`
    ist, und erwartet `true` für Möweninsel und Weidenau.

**UI**

- **AK-H2-28** Kartentext-Helfer (`tests/ui/`): T-02 (mit Frist bei `world.tick = P` «Frist 2:50» und Lager der
  Fern-Insel, auch wenn die aktive Insel die Heimat ist), T-03, T-04, Warnzustand T-05, Meldungen T-07, T-08, Log-Texte T-16 bis T-18 liefern
  genau den Wortlaut aus Anhang 02; ohne Fernangebot ist der Kartentext gleich dem heutigen.
- **AK-H2-29** UI-Helfer für den Liefern-Knopf: Fernauftrag → Zielinsel `order.island`; Zufallsauftrag → aktive Insel.
  «Nächster Auftrag in m:ss» nach früher Lieferung zeigt die Zeit bis P(k + 2).
- **AK-H2-30** Browser-Check (qa-playtester), Fenster 1280×720. Aufbau: präparierter Spielstand (aktuelle
  `SAVE_VERSION`) per Sim-Skript aus Seed 3 mit `buildColony` bis Höchststufe 3, dann Kontor auf Felsbucht, Rum 20 im
  Felsbucht-Lager, Schritt auf einen Periodenbeginn; über «Laden» eingespielt, Ablage unter `.studio/qa/<paket>/`.
  Ablauf: zwei Karten, Auftragskarte (T-01) und darunter **eigene Fernkarte** (T-02) → **Annehmen** → Fernkarte
  verschwindet, Auftragskarte zeigt T-04 mit «Lager 20/15» bei aktiver Heimat, T-07 → **Liefern** → T-08, Klang-Aufruf
  `orderDone` (Spy auf die Klang-Schnittstelle) → Karte «Nächster Auftrag in m:ss» mit der Zeit bis P(k + 2).
  Messung per `getBoundingClientRect` und `scrollWidth <= clientWidth` (A5, R633): (a) für Auftrags-, Fern- und
  Krisenkarte gilt `scrollWidth <= clientWidth`; (b) Reihenfolge von oben Auftrags-, Fern-, Krisenkarte, Fernkarte
  Breite 300 px ± 2 und Höhe ≤ 110 px; (c) **keine Überdeckung bei Sturm**: Krisen «normal», Sturmwarnung aktiv
  (Krisenkarte 6 Zeilen) bei sichtbarer Fernkarte → Rechtecke der drei Karten paarweise schnittfrei, Unterkante des
  Stapels ≤ 420 px (Fenster-y), Screenshot `fernkarte-sturm-1280x720.png`.

**Nachtrag R633 A2, R634** (Wortlaut und Aufbau in
[Anhang 03](2026-10-14-handel-2-fernangebot/anhang-03-nachtrag-ak.md), verbindlich wie §8)

- **AK-H2-31** Ersatzlage und Fremd↔Fremd (A2): Seed 963 (Weidenau in Stufe 3): Angebot, Annehmen, Liefern und Verfall
  ohne Strafe wie in der Regel; Seed 3 mit Route Möweninsel↔Felsbucht: Lieferung nur am Lieferort (R6).
- **AK-H2-32** Vertrag schliesst Fernangebot aus: über mehrere Vertragsperioden `farOffer` und `order` `null`.
- **AK-H2-33** Ereignis-Log (reine UI-Helfer): T-16 (Lieferung, Meldung), T-17 (Verfall angenommen, Meldung), T-18
  (Verfall unangenommen, nur Log); kein Eintrag bei Zufallsauftrag, Lieferung im Tick `due`, Annehmen.

## 9 Paketschnitt und offene Punkte

| Paket  | Inhalt                                                                                                                                                              | AK            | Schätzung       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------- |
| H2-SIM | `types.ts` (`farOffer`, `farSkip`, `Order.island`, `OrderDef.far`), `defs/goods.ts`, `defs/timing.ts`, `orders.ts` (R1–R14), `save.ts` (R15), Tests, arc42          | 01–27, 31, 32 | ≈ 120–150 Tools |
| H2-UI  | `src/ui/order.ts` (Fernkarte, Fernauftrag, Helfer), `app.ts` (Annehmen, Liefern, Meldungen, Log-Einträge), `tests/ui/`, README, `docs/spielwerte.md`, Browser-Check | 28–30, 33     | ≈ 100–130 Tools |

H2-UI setzt H2-SIM voraus. Die Umsetzung wartet auf PLAYTEST-I047 (R629 (5)).

**Offene Punkte (Entscheid L0 bzw. lead-design):**

- **O-1 Frist 1700 statt 1500** (P-1). Empfehlung 1700: Fall A hält überall mit 30 s Reserve, Fall B für zwei Inseln,
  Puffer für K4; die Wirkung ändert sich nicht, weil R7 die Rate begrenzt, nicht die Frist. Alternative 1500: Fall A
  bei Felsbucht nur 10 s Reserve, Fall B nur für Möweninsel; dann Invariante und AK-H2-25/27 auf 1500.
- **O-2 Sperre der Folgeperiode** (P-2, R7, neues Feld `farSkip`). Empfehlung annehmen: ohne sie +5,8 % von (b).
  Alternative ohne neues Feld wäre «Fernauftrag erst ab P(k + 1) lieferbar»; schlechter lesbar.
- **O-3 Save-Nummer** mit Erweiterung 1 K2–K4: Merge-Reihenfolge (R583-Muster); im Plan als Merge-Schritt «Version
  festlegen».
- **O-5 Ereignis-Log nur bei Krisen sichtbar** (R634 (2c)). Empfehlung: in diesem Paket nicht lösen; T-16 und T-17
  tragen eine Meldung und sind auch ohne Log lesbar, T-18 ist ohne Krisen unsichtbar (hingenommen). I-100 «Neu»
  zählt nur Einträge mit Meldung; ob I-100 oder ein späteres Paket das Log ohne Krisen zeigt, entscheidet L0
  (Beobachtung 2026-10-14).
- **O-6 Wortlaut T-17** `info` ohne Klang; Alternative `warn` mit Klang `error`: Empfehlung `info`, weil der Verfall
  keine Strafe kostet.
- **O-4 Fall B Felsbucht d 37–40** ist mit dem Angebotsfenster aus R629 nicht ganz garantierbar (bräuchte 1800).
  Empfehlung hinnehmen: keine Strafe, die Karte zeigt die Frist, frühes Annehmen genügt.

## 10 Selbstprüfung

- **Nachtrag R633/R634:** A2 (AK-H2-31), A5 (AK-H2-30 messbar), eigene Karte (U1, Anhang 02 T.5), Log (U6, R14, AK-H2-33),
  Vertrag (R3, AK-H2-32), K4 (§7) abgedeckt. AK-Zahl 33. Neue Zahlen sind nur UI-Masse (110 px, 315 px, 420 px), aus
  den Screenshots in Anhang 02 T.5 hergeleitet; sie liegen nicht in `src/sim/defs/`, sondern als Prüfwerte im Test.
  Keine Sim-Regel, keine Save-Änderung, Baseline (§6) unberührt.
- **Platzhalter:** keine offenen Werte. Die Seed-3-Lanes sind als Spanne hergeleitet und werden in AK-H2-27 gemessen
  und gepinnt; die Save-Nummer folgt bewusst der Merge-Reihenfolge (O-3). `[Tech: bestätigen]` steht an Baseline und
  Rückfaltung als Prüfpunkt für Gate Spec.
- **Widersprüche:** Zu R629 nur die ausgewiesenen Abweichungen P-1 bis P-3 (O-1, O-2). I-047 R7 wird nur in der
  gesperrten Periode überlagert (§7). I-092 R6 bleibt wahr (R10). ADR-010: kein neuer Strom.
- **Mehrdeutigkeit:** Prüfreihenfolgen (R5, R6), Tick-Ablauf (R12), Annehmen am letzten Tick (R12), Verfallstick
  (R8) und Lagerquelle der UI (U3) sind festgelegt.
- **Scope:** zwei Pakete, Liste «Nicht im Umfang» in §1; keine Änderung an bestehenden Spielwerten, nur neue
  Def-Einträge.
