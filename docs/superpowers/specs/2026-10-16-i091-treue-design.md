# I-091 Treue beim Stammkunden (Kulanz) — Spec

Stand 2026-10-16 · Paket `design-I-091-I-094` · Prozessstufe voll (R670) · Auftrag R663 · Variante V-A Kulanz (R670) ·
Gate Spec OK mit Auflagen A1–A4, eingearbeitet (R671) · Rechnung:
[2026-10-16-i091-i094-rechnung.md](2026-10-16-i091-i094-rechnung.md) (Teil B) · Grundlage: I-047
[Stammkunde](2026-10-13-i047-stammkunde-design.md) (Regeln R1–R12), Handel 2 [Fernangebot](2026-10-14-handel-2-fernangebot.md) (R15).

## 1 Spielerzweck in einem Satz

Wer seinen Stammkunden `CONTRACT_LOYAL_AFTER`-mal (5) beliefert hat, bekommt einen Puffer: Der Kunde verzeiht einen
Fehlbestand einmal, statt abzuspringen und Strafe zu verlangen, und der Spieler entscheidet, ob er den Puffer
verbraucht oder nachkauft.

Säule: Wirtschaft über Steuern und Handel (Bindung wird belohnt statt nur bestraft). Misslingt die Regel, leidet
dieselbe Säule: Ein Vertrag ohne Risiko wäre ein Selbstläufer. Das verhindert der Deckel (Abschnitt 3, R-T4).

## 2 Ausgangslage und Befund der Rechnung

- Heute hat der Vertrag nur eine Strafe (Bruch kostet P = V = 135–140) und keine Belohnung für Treue.
- **Ein Geldbonus trägt kaum** (Rechnung B1, B2): Unter der Auftragsprämie sind höchstens 108 % des Lieferwerts
  möglich, also höchstens 7,3 / min (unter 0,35 % der Bilanz), und L6 aus I-047 riss in Phase (b). Die Variante
  «Wertbonus» (V-B) ist deshalb **verworfen (R670)**; Rechnung B1/B2 bleibt nur als Begründung stehen.
- **Die Boom-Wahl aus der Idee gibt es nicht** (Rechnung B3): Der Boom-Stückpreis liegt bei keinem Gut über dem
  Vertragspreis.

## 3 Regeln

Begriffe wie I-047 B.2. `N = CONTRACT_LOYAL_AFTER`, Zähler `n = contract.deliveries`.

- **R-T1 Zähler.** `acceptContract` setzt `deliveries = 0`. Jede Lieferung nach I-047 R6 Punkt 5 setzt danach
  `deliveries = min(deliveries + 1, N)`. Lieferwert, Preis und Menge bleiben wie in I-047; die Treue ändert kein
  Geld einer Lieferung.
- **R-T2 Treu.** Ein Vertrag ist **treu**, wenn `deliveries ≥ N`, also ab der Abrechnung nach der N-ten Lieferung.
- **R-T3 Kulanz.** Ergibt I-047 R6 am Periodenbeginn den Bruchgrund `stock` oder `kontor` und ist der Vertrag treu,
  gilt statt R7 die Kulanz: kein Abbuchen, keine Zahlung, keine Strafe; der Vertrag bleibt mit `deliveries = 0`. Wie
  bei einer Lieferung kehrt `tickOrders` danach sofort zurück: In dieser Periode gibt es weder Zufallsauftrag noch
  Fernangebot (`order` und `farOffer` bleiben `null`), `contractOffer` bleibt `null`. Eine gesetzte Fernsperre
  `farSkip` wird wie heute vor der Abrechnung verbraucht (`farSkip = null`).
- **R-T4 Deckel.** Nach einer Kulanz ist der Vertrag nicht mehr treu; erst N weitere Lieferungen machen ihn wieder
  treu. Höchstens eine Kulanz je N Lieferungen, ohne weiteren Zustand.
- **R-T5 Kein Puffer bei Sperre.** Die Bruchgründe `lock` und `island` brechen immer nach I-047 R7, auch wenn der
  Vertrag treu ist. Begründung: `island` ist nur über manipulierte Stände erreichbar, `lock` liegt nicht beim
  Spieler.
- **R-T6 Kündigen und neu Annehmen.** Kündigen (I-047 R5) verwirft den Zähler mit dem Vertrag, kostenlos, auch direkt
  nach einer Kulanz. Ein später angenommener Vertrag beginnt bei 0, auch mit demselben Gut und derselben Insel.
- **R-T7 Unabhängigkeiten.** Der Zähler liest weder Boom, Edikt, Stufe noch `sellPct`. Ein Stufenabstieg unter
  `CONTRACT_MIN_TIER` lässt Vertrag und Zähler weiterlaufen (I-047 R9).
- **R-T8 Bericht.** `StepReport.contract` erhält die vierte Form `{ kind: 'excused', good, reason, island }` mit
  `reason` aus `'stock'`, `'kontor'`. Die Form `delivered` bekommt zwei Felder:
  - `loyal: boolean` — Dauerzustand: Vertrag ist nach dieser Lieferung treu (`deliveries ≥ N`); für die Anzeige.
  - `becameLoyal: boolean` — nur bei der Lieferung wahr, die den Vertrag treu macht (`deliveries` war `N − 1` und ist
    jetzt `N`); bei jeder weiteren Lieferung `false`. Nur dieses Feld löst die Meldung «jetzt treu» aus (A1, R671).
- **R-T9 Determinismus.** Kein Zufall, kein neuer Strom (ADR-010). Zwei Läufe mit gleichem Seed und gleichen
  Aktionen sind bitgleich.

**Entartung geprüft** (Rechnung B3, L5 aus I-047): Absichtlich eine Lieferung auslassen, um die Ware frei zu verkaufen,
bringt höchstens `m · s` und kostet V. Der Verkaufspreis je Stück liegt nie über dem Vertragspreis, auch im Boom
nicht (Boom ×1,5: Holz 6 = 6, Rum 27 = 27, Glas 30 < 34; Rechnung B1), die Sättigung drückt ihn weiter, und der Puffer
ist danach verbraucht. Annehmen und brechen kostet weiter P, weil die Kulanz erst nach N Lieferungen greift.
Nachkaufen mit Edikt Handel bleibt verlustreich (14–35 je Lieferung) und ist die richtige Antwort ohne Puffer.

## 4 Zustand, Defs und Save

- **`Contract`** (`src/sim/types.ts`) erhält das Pflichtfeld `deliveries: number` (ganzzahlig, im Spiel 0 bis N).
- **Defs** (`src/sim/defs/goods.ts`, neben `CONTRACT_*`): `CONTRACT_LOYAL_AFTER = 5`. Keine Zahl im Code, auch nicht in
  den UI-Texten.
- **Save:** neue Version, **Nummer offen** (Gate Plan vergibt die nächste freie beim Merge, R663). Neues Feld
  `contract.deliveries`. Migration als nächstes Glied der Kette: `contract ≠ null` → `deliveries = 0`; `null` bleibt
  `null`. Prüfung in `isValidContractFields` nur strukturell und nur bei `contract ≠ null`: `deliveries` ganzzahlig
  ≥ 0; **keine Obergrenze** gegen N, damit ein späterer Def-Wechsel keine Stände bricht (ein Wert über N gilt als
  treu). Verstoss → `'Beschädigter Spielstand'`; unbekannte höhere Version → `'Unbekannte Version'`, nie eine
  Ausnahme.

## 5 Bedienung (desktop-first)

Texte in reinen Helfern (`src/ui/order.ts`), testbar unter `tests/ui/`. Kein neuer Knopf, kein Klang, kein Asset.
`N` wird aus `CONTRACT_LOYAL_AFTER` formatiert, nie als Literal (A4, R671). Wortlaute mit N = 5, Beispiel Rum:

| Zustand / Ereignis        | Text (Wortlaut)                                                        | Darstellung             |
| ------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| Vertrag aktiv, nicht treu | «Stammkunde: 5 Rum · nächste Lieferung m:ss · Lager x/5 · Treue n/N»   | wie heute               |
| Vertrag aktiv, treu       | «… · Lager x/5 · treu: verzeiht einmal»                                | wie heute               |
| Meldung jetzt treu        | «Stammkunde: 5 Rum geliefert, +135 · treu: verzeiht einen Fehlbestand» | Info, Klang `orderDone` |
| Meldung Lieferung, sonst  | wie I-047 («Stammkunde: 5 Rum geliefert, +135»)                        | Info, Klang `orderDone` |
| Meldung Kulanz `stock`    | «Stammkunde wartet: zu wenig Rum, diesmal ohne Strafe»                 | Warnung, Klang `error`  |
| Meldung Kulanz `kontor`   | «Stammkunde wartet: kein Kontor auf <Insel>, diesmal ohne Strafe»      | Warnung, Klang `error`  |

Die Warnfarbe «knapp» (I-047 B.4) bleibt; bei treuem Vertrag gilt sie unverändert, weil der Puffer verbraucht würde.
«Lager x/5» ist die Vertragsmenge `amount` (I-047), nicht N.

## 6 Balancing und Abgrenzung

- **Balancing-Test unverändert:** Der Controller liefert keinen Auftrag, bekommt kein Angebot und keinen Vertrag
  (Rechnung Teil C, grep). `tests/sim/balance.test.ts` bleibt bitgleich; kein Ruling nötig.
- Die Kulanz ändert keinen Geldfluss einer Lieferung; L2 (Vertrag 74–81 % von «jeder Auftrag geliefert») und L6
  bleiben wie in I-047. Erwartete Wirkung: höchstens eine Strafe (135–140) je N Lieferungen gespart.
- **Handel 2:** Ein treuer Vertrag bleibt länger bestehen und schliesst das Fernangebot länger aus (R15). Der Vertrag
  erreicht gegen das Fernangebot höchstens 77 % (Rechnung B2); wer Fernaufträge will, kündigt weiter kostenlos.
- **Nicht im Umfang:** Geldbonus (V-B, verworfen R670); mehrere Treuestufen; Treue über Kündigen hinweg; Treue für
  Zufalls- oder Fernaufträge; ein neuer Klang; Änderung an Menge, Preis oder Strafe; Darlehen und Vorschuss (I-094,
  verworfen R670).
- **Überschneidung I-102 (Auftragsvorschau):** Beide ändern Texte der Auftragskarte in `src/ui/order.ts`. Umsetzung
  nach UI-HAEPPCHEN-E (R670); Textbausteine der Karte in einem gemeinsamen Helfer, damit keine zwei Wortlaut-Tests
  dieselbe Zeile prüfen.
- **Doku-Folgen:** README und `docs/spielwerte.md` «Stammkunde» (ein Absatz Treue), arc42 (Save-Feld).

## 7 Abnahmekriterien

Vitest unter `tests/sim/` (Sim, Save, Defs) und `tests/ui/` (reine Helfer); Browser-Check durch qa-playtester.
Testwelten wie I-047 B.7 (Beispiel Rum: m 5, p 27, V 135, P 135; `unlockAll`). «Treu» = `deliveries = N`.

**Zähler**

- **AK-TR-01** `acceptContract` mit Angebot → `contract.deliveries === 0`.
- **AK-TR-02** Lieferungen eins bis N + 1: `deliveries` nach jeder Lieferung 1 … N, dann N (sättigt).
  `StepReport.contract.loyal` ist ab der N-ten Lieferung `true`, davor `false`; `becameLoyal` ist **nur** bei der
  N-ten Lieferung `true`, bei allen anderen (auch der (N + 1)-ten) `false`.
- **AK-TR-03** Kündigen bei `deliveries = N`, danach neues Angebot desselben Guts annehmen → `deliveries === 0`.
- **AK-TR-04** Boom auf Rum, Edikt Handel aktiv, Stufenabstieg unter 3 (konstruierter Stand): Zähler zählt wie in
  AK-TR-02 weiter.

**Kulanz**

- **AK-TR-05** Testwelt ohne Unterhalt und ohne Steuer im Schritt (keine Häuser und Betriebe, `upkeepCarry = 0`),
  Vertrag treu, Lager Rum 3, Schritt auf den Periodenbeginn → `money` vor und nach dem Schritt **identisch**, Lager 3,
  Vertrag besteht mit `deliveries = 0`, `order`, `farOffer`, `contractOffer` je `null`,
  `StepReport.contract = { kind: 'excused', good: 'rum', reason: 'stock', island: HOME }`.
- **AK-TR-06** Treu, Lieferinsel ohne Kontor (Fremdinsel) → Kulanz mit `reason: 'kontor'`, sonst wie AK-TR-05.
- **AK-TR-07** `deliveries = N − 1`, Lager 3 → Bruch wie I-047 R7: Geld −135, `contract` `null`, Zufallsauftrag der
  Periode aktiv.
- **AK-TR-08** Deckel: nach Kulanz (AK-TR-05) bleibt das Lager knapp; nächster Periodenbeginn → Bruch mit Strafe 135.
- **AK-TR-09** Treu und Bruchgrund `lock` (Funktion `orders` gesperrt) → Bruch mit Strafe; ebenso `island`
  (konstruierter Stand).
- **AK-TR-10** Nach Kulanz und N weiteren Lieferungen ist der Vertrag wieder treu; ein weiterer Fehlbestand ergibt die
  zweite Kulanz.
- **AK-TR-20** Nach Kulanz wird das Lager vor dem nächsten Periodenbeginn aufgefüllt (Rum ≥ 5) → Lieferung, Zahlung
  135, `deliveries = 1`, `loyal = false`, `becameLoyal = false`.
- **AK-TR-21** Kulanz in einer Periode mit gesetzter Fernsperre (`farSkip` = aktuelle Periode) → nach dem Schritt
  `farSkip === null`, `order === null`, `farOffer === null`, `excused` gemeldet.
- **AK-TR-22** `cancelContract` im Tick direkt nach einer Kulanz → `ok`, `contract === null`, Geld unverändert
  (keine Strafe); ein später angenommener Vertrag beginnt bei `deliveries = 0`.

**Defs, Determinismus, Save, Balancing**

- **AK-TR-11** Def-Test: `CONTRACT_LOYAL_AFTER` ganzzahlig ≥ 1; der bestehende I-047-Invarianten-Test bleibt grün.
- **AK-TR-12** Zwei Läufe gleicher Seed, gleiche Aktionen inklusive einer Kulanz → `serialize` bitgleich.
- **AK-TR-13** Speichern und Laden mit `deliveries = 3` → gleicher Wert, gleiches Verhalten bei der nächsten
  Lieferung; Laden mitten in der Periode vor einer Kulanz (treu, Lager knapp) → dieselbe Kulanz wie ohne Laden.
- **AK-TR-14** Migration vom Vorgänger der neuen Version (Test über `SAVE_VERSION − 1` und die exportierte
  Migrationsfunktion, nicht über eine Zahl): Vertrag ohne `deliveries` → `deliveries = 0`; `contract` `null` bleibt
  `null`. Ein altes v14-Fixture mit Vertrag lädt durch die ganze Kette mit `deliveries = 0`.
- **AK-TR-15** In der neuen Version `deliveries` fehlt, ist `null`, −1, 2,5 oder `'3'` → `{ ok: false, reason:
'Beschädigter Spielstand' }`, keine Ausnahme; Version `SAVE_VERSION + 1` → `'Unbekannte Version'`.
  `deliveries = 99` lädt bewusst (gilt als treu), damit niemand eine Obergrenze nachrüstet.
- **AK-TR-16** `tests/sim/balance.test.ts` unverändert grün; grep: Controller ruft weder `deliverOrder` noch
  `acceptContract`.

**UI**

- **AK-TR-17** Helfer der Karte: nicht treu → Text endet auf «· Treue n/N» mit N aus `CONTRACT_LOYAL_AFTER`; treu →
  «· treu: verzeiht einmal». Grep-Wächter: kein Literal `/5` für die Treue im Helfer.
- **AK-TR-18** Helfer der Meldungen: `excused` mit `stock` und `kontor` ergibt die Wortlaute aus Abschnitt 5 mit Klang
  `error`; `delivered` mit `becameLoyal = true` ergibt die Meldung «… · treu: verzeiht einen Fehlbestand»;
  `delivered` mit `loyal = true`, `becameLoyal = false` (die (N + 1)-te Lieferung) ergibt die I-047-Meldung ohne
  «treu».
- **AK-TR-19** Browser-Check (qa-playtester): präparierter Stand mit treuem Vertrag (`deliveries = N`), Lager leer,
  kurz vor dem Periodenbeginn laden → Meldung «Stammkunde wartet …», Kasse ohne Strafe, Karte zeigt «Treue 0/N».
  Den Weg zum Stand (Fixture oder Entwicklerwerkzeug) legt der Plan fest.

Anzahl: 22 AK (AK-TR-01 bis 22).

## 8 Hinweise für den Plan

| Paket    | Inhalt                                                                                              | AK           | Schätzung  |
| -------- | --------------------------------------------------------------------------------------------------- | ------------ | ---------- |
| I091-SIM | `types.ts`, `defs/goods.ts`, `orders.ts` (R-T1–R-T9), `tick.ts` (`StepReport`), `save.ts`, Tests    | 01–16, 20–22 | ≈ 40 Tools |
| I091-UI  | `src/ui/order.ts` (Karte, Meldungen), `app.ts`, `tests/ui/`, README, `spielwerte.md`, Browser-Check | 17–19        | ≈ 25 Tools |

- `tickOrders` kehrt bei `excused` früh zurück wie bei `delivered` (sonst entstehen Angebote, verletzt AK-TR-05).
- `ContractEvent` bekommt eine vierte Form: alle Switches in `src/ui/` auf Vollständigkeit prüfen (`never`-Prüfung).
- Bestehende Tests und Fixtures, die `Contract`-Literale bauen oder Golden-JSON vergleichen, brechen durch das
  Pflichtfeld: als eigener Mitzieh-Schritt im Plan, nichts abschwächen.
- Save-Nummer im Gate Plan (R663); Handel 2 hält v15, Erweiterung 1 braucht ebenfalls eine.
