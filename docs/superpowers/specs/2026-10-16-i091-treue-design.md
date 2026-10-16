# I-091 Treue beim Stammkunden — Kurz-Spec

Stand 2026-10-16 · Paket `design-I-091-I-094` · Prozessstufe leicht · Auftrag R663 · Rechnung:
[2026-10-16-i091-i094-rechnung.md](2026-10-16-i091-i094-rechnung.md) (Teil B) · Grundlage: I-047
[Stammkunde](2026-10-13-i047-stammkunde-design.md) (Regeln R1–R12), Handel 2 [Fernangebot](2026-10-14-handel-2-fernangebot.md) (R15).

## 1 Spielerzweck in einem Satz

Wer seinen Stammkunden fünfmal beliefert hat, bekommt einen Puffer: Der Kunde verzeiht einen Fehlbestand einmal,
statt abzuspringen und Strafe zu verlangen, und der Spieler entscheidet, ob er den Puffer verbraucht oder
nachkauft.

Säule: Wirtschaft über Steuern und Handel (Bindung wird belohnt statt nur bestraft). Misslingt die Regel, leidet
dieselbe Säule: Ein Vertrag ohne Risiko wäre ein Selbstläufer. Das verhindert der Deckel (Abschnitt 3, R-T4).

## 2 Ausgangslage und Befund der Rechnung

- Heute hat der Vertrag nur eine Strafe (Bruch kostet P = V = 135–140) und keine Belohnung für Treue.
- **Ein Geldbonus trägt kaum** (Rechnung B1, B2): Zwischen Vertragspreis und Auftragsprämie liegt bei fünf Gütern
  keine ganze Zahl, ein Stückpreis-Bonus ist also +0. Auf den Lieferwert gerechnet sind höchstens 108 % möglich
  (bei 109 % erreicht Glas die Auftragsprämie). Das bringt +10 bis +11 je Lieferung, höchstens 7,3 / min, unter
  0,35 % der Bilanz. Dazu verletzt er bei Basis 0 in Phase (b) die Grenze L6 aus I-047 (3,17 % statt ≤ 3 %).
- **Die Boom-Wahl aus der Idee gibt es nicht** (Rechnung B3): Der Boom-Stückpreis liegt bei allen acht Gütern unter
  dem Bonuspreis. «Im Boom kündigen» ist also nie eine Frage.
- Folge: Die Spec empfiehlt **V-A Kulanz** (Treue als Puffer) und führt **V-B Wertbonus 108 %** als Alternative mit
  eigenen AK. L0 wählt eine der beiden (Abschnitt 8, Entwurf E-2).

## 3 Regeln (V-A Kulanz, Empfehlung)

Begriffe wie I-047 B.2. `n` = Zähler `contract.deliveries`.

- **R-T1 Zähler.** `acceptContract` setzt `deliveries = 0`. Jede Lieferung nach I-047 R6 Punkt 5 setzt danach
  `deliveries = min(deliveries + 1, CONTRACT_LOYAL_AFTER)`. Lieferwert, Preis und Menge bleiben wie in I-047
  (V-A ändert kein Geld).
- **R-T2 Treu.** Ein Vertrag ist **treu**, wenn `deliveries ≥ CONTRACT_LOYAL_AFTER` (5), also ab der Abrechnung nach
  der 5. Lieferung.
- **R-T3 Kulanz.** Ergibt I-047 R6 am Periodenbeginn den Bruchgrund `stock` oder `kontor` und ist der Vertrag treu,
  gilt statt R7 die Kulanz: kein Abbuchen, keine Zahlung, keine Strafe; der Vertrag bleibt mit
  `deliveries = 0`. Wie bei einer Lieferung gibt es in dieser Periode weder Zufallsauftrag noch Fernangebot
  (`order` und `farOffer` bleiben `null`), und `contractOffer` bleibt `null`.
- **R-T4 Deckel.** Nach einer Kulanz ist der Vertrag nicht mehr treu; erst fünf weitere Lieferungen machen ihn wieder
  treu. Höchstens eine Kulanz je fünf Lieferungen, ohne weiteren Zustand.
- **R-T5 Kein Puffer bei Sperre.** Die Bruchgründe `lock` und `island` brechen immer nach I-047 R7, auch wenn der
  Vertrag treu ist. Begründung: `island` ist nur über manipulierte Stände erreichbar, `lock` liegt nicht beim
  Spieler.
- **R-T6 Kündigen und neu Annehmen.** Kündigen (I-047 R5) verwirft den Zähler mit dem Vertrag. Ein später
  angenommener Vertrag beginnt bei 0, auch mit demselben Gut und derselben Insel.
- **R-T7 Unabhängigkeiten.** Der Zähler liest weder Boom, Edikt, Stufe noch `sellPct`. Ein Stufenabstieg unter
  `CONTRACT_MIN_TIER` lässt Vertrag und Zähler weiterlaufen (I-047 R9).
- **R-T8 Bericht.** `StepReport.contract` erhält die vierte Form `{ kind: 'excused', good, reason, island }` mit
  `reason` aus `'stock'`, `'kontor'`. `delivered` bekommt zusätzlich `loyal: boolean` (Vertrag nach dieser Lieferung
  treu), damit die UI den Moment «jetzt treu» melden kann.
- **R-T9 Determinismus.** Kein Zufall, kein neuer Strom (ADR-010). Zwei Läufe mit gleichem Seed und gleichen
  Aktionen sind bitgleich.

**Entartung geprüft** (Rechnung B3, L5 aus I-047): Absichtlich eine Lieferung auslassen, um die Ware frei zu verkaufen,
bringt höchstens `m · s` und kostet V. Der Verkaufspreis je Stück liegt nie über dem Vertragspreis, auch im Boom
nicht (Boom ×1,5: Holz 6 = 6, Rum 27 = 27, Glas 30 < 34; Rechnung B1), die Sättigung drückt ihn weiter, und der Puffer
ist danach verbraucht. Annehmen und brechen kostet weiter P, weil die Kulanz erst nach fünf Lieferungen greift.
Nachkaufen mit Edikt Handel bleibt verlustreich (14–35 je Lieferung) und ist die richtige Antwort ohne Puffer.

## 4 V-B Wertbonus (Alternative)

Statt R-T3 bis R-T5 (dann bricht jeder Fehlbestand wie in I-047 R7):

- **R-B1** Ist der Vertrag vor der Lieferung treu, zahlt sie `floor(amount · price · CONTRACT_LOYAL_PCT ÷ 100)` statt
  `amount · price`; `CONTRACT_LOYAL_PCT = 108`. Werte je Gut: Rechnung B1 (Rum 145 statt 135, Glas 146 statt 136).
- **R-B2** Die Strafe bleibt `P = ceil(amount · price · CONTRACT_PENALTY_PCT ÷ 100)`, ohne Bonus.
- **R-B3** Eine Stufe, kein weiterer Bonus (109 % bricht die Grenze «unter der Auftragsprämie» bei Glas).
- Folge: L0 muss L6 in Phase (b) mit 3,17 % statt ≤ 3 % hinnehmen (Rechnung B2, Entwurf E-2 dort).

## 5 Zustand, Defs und Save

- **`Contract`** (`src/sim/types.ts`) erhält `deliveries: number` (ganzzahlig, 0 bis `CONTRACT_LOYAL_AFTER`).
- **Defs** (`src/sim/defs/goods.ts`, neben `CONTRACT_*`): `CONTRACT_LOYAL_AFTER = 5`. Nur V-B zusätzlich
  `CONTRACT_LOYAL_PCT = 108`. Keine Zahl im Code.
- **Save:** neue Version, **Nummer offen** (Gate Plan vergibt die nächste freie beim Merge, R663). Neues Feld
  `contract.deliveries`. Migration als nächstes Glied der Kette: `contract ≠ null` → `deliveries = 0`; `null` bleibt
  `null`. Prüfung in `isValidContractFields` nur strukturell: `deliveries` ganzzahlig ≥ 0; nicht gegen
  `CONTRACT_LOYAL_AFTER`, damit ein späterer Def-Wechsel keine Stände bricht. Verstoss → `'Beschädigter Spielstand'`;
  unbekannte höhere Version → `'Unbekannte Version'`, nie eine Ausnahme.

## 6 Bedienung (desktop-first)

Texte in reinen Helfern (`src/ui/order.ts`), testbar unter `tests/ui/`. Kein neuer Knopf, kein Klang, kein Asset.

| Zustand / Ereignis        | Text (Wortlaut, Beispiel Rum)                                               | Darstellung             |
| ------------------------- | --------------------------------------------------------------------------- | ----------------------- |
| Vertrag aktiv, nicht treu | «Stammkunde: 5 Rum · nächste Lieferung m:ss · Lager x/5 · Treue n/5»        | wie heute               |
| Vertrag aktiv, treu (V-A) | «… · Lager x/5 · treu: verzeiht einmal»                                     | wie heute               |
| Meldung jetzt treu (V-A)  | «Stammkunde: 5 Rum geliefert, +135 · treu: verzeiht einen Fehlbestand»      | Info, Klang `orderDone` |
| Meldung Kulanz `stock`    | «Stammkunde wartet: zu wenig Rum, diesmal ohne Strafe»                      | Warnung, Klang `error`  |
| Meldung Kulanz `kontor`   | «Stammkunde wartet: kein Kontor auf <Insel>, diesmal ohne Strafe»           | Warnung, Klang `error`  |
| V-B treu                  | Karte «… · Treue +8 %», Meldung «Stammkunde: 5 Rum geliefert, +145 (Treue)» | wie heute               |

Die Warnfarbe «knapp» (I-047 B.4) bleibt; bei treuem Vertrag gilt sie unverändert, weil der Puffer verbraucht würde.

## 7 Balancing und Abgrenzung

- **Balancing-Test unverändert:** Der Controller liefert keinen Auftrag, bekommt kein Angebot und keinen Vertrag
  (Rechnung Teil C, grep). `tests/sim/balance.test.ts` bleibt bitgleich; kein Ruling nötig.
- **V-A** ändert keinen Geldfluss einer Lieferung; L2 (Vertrag 74–81 % von «jeder Auftrag geliefert») und L6 bleiben
  wie in I-047. Erwartete Wirkung: höchstens eine Strafe (135–140) je fünf Lieferungen gespart.
- **Handel 2:** Ein treuer Vertrag bleibt länger bestehen und schliesst das Fernangebot länger aus (R15). Der Vertrag
  erreicht gegen das Fernangebot höchstens 77 % (Rechnung B2); wer Fernaufträge will, kündigt weiter kostenlos.
- **Nicht im Umfang:** mehrere Treuestufen; Treue über Kündigen hinweg; Treue für Zufalls- oder Fernaufträge; ein
  neuer Klang; Änderung an Menge, Preis oder Strafe; Darlehen und Vorschuss (I-094, eigene Vorlage).
- **Überschneidung I-102 (Auftragsvorschau, parallel):** Beide ändern Texte der Auftragskarte in `src/ui/order.ts`.
  Der Plan sollte die UI-Tasks seriell legen oder einen gemeinsamen Helfer festlegen.
- **Doku-Folgen:** README und `docs/spielwerte.md` «Stammkunde» (ein Absatz Treue), arc42 (Save-Feld).

## 8 Abnahmekriterien

Vitest unter `tests/sim/` (Sim, Save, Defs) und `tests/ui/` (reine Helfer); Browser-Check durch qa-playtester.
Testwelten wie I-047 B.7 (Beispiel Rum: m 5, p 27, V 135, P 135; `unlockAll`). «Treu» = `deliveries = 5`.

**Zähler (V-A und V-B)**

- **AK-TR-01** `acceptContract` mit Angebot → `contract.deliveries === 0`.
- **AK-TR-02** Lieferungen eins bis sechs: `deliveries` nach jeder Lieferung 1, 2, 3, 4, 5, 5 (sättigt bei
  `CONTRACT_LOYAL_AFTER`); `StepReport.contract.loyal` ist bei der 5. und 6. Lieferung `true`, davor `false`.
- **AK-TR-03** Kündigen bei `deliveries = 5`, danach neues Angebot desselben Guts annehmen → `deliveries === 0`.
- **AK-TR-04** Boom auf Rum, Edikt Handel aktiv, Stufenabstieg unter 3: Zähler zählt wie in AK-TR-02 weiter.

**Kulanz (nur V-A)**

- **AK-TR-05** Treu, Lager Rum 3, Periodenbeginn → Geld gleich einem Vergleichslauf ohne Vertrag (keine Strafe, keine
  Zahlung), Lager 3, Vertrag besteht mit `deliveries = 0`, `order`, `farOffer`, `contractOffer` je `null`,
  `StepReport.contract = { kind: 'excused', good: 'rum', reason: 'stock', island: HOME }`.
- **AK-TR-06** Treu, Lieferinsel ohne Kontor (Fremdinsel) → Kulanz mit `reason: 'kontor'`, sonst wie AK-TR-05.
- **AK-TR-07** `deliveries = 4`, Lager 3 → Bruch wie I-047 R7: Geld −135, `contract` `null`, Zufallsauftrag der Periode
  aktiv.
- **AK-TR-08** Deckel: nach Kulanz (AK-TR-05) bleibt das Lager knapp; nächster Periodenbeginn → Bruch mit Strafe 135.
- **AK-TR-09** Treu und Bruchgrund `lock` (Funktion `orders` gesperrt) → Bruch mit Strafe; ebenso `island`
  (konstruierter Stand).
- **AK-TR-10** Nach Kulanz und fünf weiteren Lieferungen ist der Vertrag wieder treu; ein weiterer Fehlbestand ergibt
  die zweite Kulanz.

**Wertbonus (nur V-B, ersetzt AK-TR-05 bis 10)**

- **AK-TR-B1** Treu, Lager reicht → Zahlung `floor(135 · 108 ÷ 100) = 145`; vor der Treue 135. Für jedes Auftragsgut
  gilt die Tabelle Rechnung B1.
- **AK-TR-B2** Treu und Fehlbestand → Bruch mit Strafe 135 (aus V, nicht aus dem Bonuswert).
- **AK-TR-B3** Def-Invarianten je Gut mit `order` (Rechnung B4 Punkte 1–5), u. a. `W < contract · floor(buy ·
ORDER_PREMIUM)` und `5 · W < 4 · contract · buy`.

**Defs, Determinismus, Save, Balancing**

- **AK-TR-11** Def-Test: `CONTRACT_LOYAL_AFTER` ganzzahlig ≥ 1; der bestehende I-047-Invarianten-Test bleibt grün.
- **AK-TR-12** Zwei Läufe gleicher Seed, gleiche Aktionen inklusive einer Kulanz (V-A) bzw. Bonuslieferung (V-B) →
  `serialize` bitgleich.
- **AK-TR-13** Speichern und Laden mit `deliveries = 3` → gleicher Wert, gleiches Verhalten bei der nächsten
  Lieferung.
- **AK-TR-14** Migration vom Vorgänger der neuen Version: Vertrag ohne `deliveries` → `deliveries = 0`; `contract`
  `null` bleibt `null`. Tests prüfen gegen `SAVE_VERSION`, nicht gegen eine Zahl.
- **AK-TR-15** In der neuen Version `deliveries` fehlt, ist −1, 2,5 oder `'3'` → `{ ok: false, reason: 'Beschädigter
Spielstand' }`, keine Ausnahme; Version `SAVE_VERSION + 1` → `'Unbekannte Version'`.
- **AK-TR-16** `tests/sim/balance.test.ts` unverändert grün; grep: Controller ruft weder `deliverOrder` noch
  `acceptContract`.

**UI**

- **AK-TR-17** Helfer der Karte (V-A): nicht treu → Text endet auf «· Treue n/5»; treu → «· treu: verzeiht einmal»
  (V-B: «· Treue +8 %»).
- **AK-TR-18** Helfer der Meldungen: `excused` mit `stock` und `kontor` ergibt die Wortlaute aus Abschnitt 6 mit Klang
  `error`; `delivered` mit `loyal` beim Übergang auf treu ergibt die Meldung «treu: …», sonst die I-047-Meldung.
- **AK-TR-19** Browser-Check (qa-playtester, Testwelt mit `unlockAll`): Vertrag annehmen, fünf Lieferungen abwarten,
  Lager leeren, Periodenbeginn → Meldung «Stammkunde wartet …», Kasse ohne Strafe, Karte zeigt «Treue 0/5».

Anzahl: 19 AK für V-A (AK-TR-01 bis 19), für V-B 16 (ohne 05 bis 10, mit B1 bis B3).

## 9 Paketschnitt-Vorschlag und offene Punkte

| Paket    | Inhalt                                                                                              | AK    | Schätzung  |
| -------- | --------------------------------------------------------------------------------------------------- | ----- | ---------- |
| I091-SIM | `types.ts`, `defs/goods.ts`, `orders.ts` (R-T1–R-T9), `tick.ts` (`StepReport`), `save.ts`, Tests    | 01–16 | ≈ 35 Tools |
| I091-UI  | `src/ui/order.ts` (Karte, Meldungen), `app.ts`, `tests/ui/`, README, `spielwerte.md`, Browser-Check | 17–19 | ≈ 25 Tools |

- **O-1 Variante (Entwurf E-2):** V-A Kulanz empfohlen; V-B nur, wenn L0 ausdrücklich einen sichtbaren Geldbonus
  will und L6 (b) 3,17 % hinnimmt.
- **O-2 Spielerwirkung der Idee berichtigen (E-3):** «kündigt im Boom» entfällt; neu: «Der Spieler hat fünfmal
  geliefert, sieht das Lager knapp und entscheidet, ob er Rum nachkauft oder den Puffer des Stammkunden verbraucht.»
- **O-3 Save-Nummer:** offen, Gate Plan (R663); Handel 2 hat v15 belegt, Erweiterung 1 braucht ebenfalls eine.
