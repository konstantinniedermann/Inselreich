# T03 · UI-Helfer: Karte und Meldungen, Union `excused`

Plan: [Index](../2026-10-16-i091-treue.md) · Spec §5 (Tabelle), R-T8 (Form `excused`), A1, A4, §6 «Überschneidung I-102» ·
AK-TR-17, 18 · Umsetzer `tech-ui-engineer` · Modell sonnet · ≈ 35 Tools · blocked-by: T02

**Files:**

- Modify: `src/sim/types.ts` — **nur** die `ContractEvent`-Union um eine Zeile und der Typ `ContractExcuseReason` (reine
  Typänderung; T04 erzeugt das Ereignis). Begründung: die neue Form bricht `contractNotice` beim Kompilieren; Typ und
  vollständiger `switch` gehören in denselben Task, damit `tsc` je Task grün bleibt.
- Modify: `src/ui/order.ts` (`loyaltyText` neu, Vertragszweig von `orderCardText`, `contractNotice`)
- Create: `tests/ui/loyalty.test.ts` · Modify: `tests/ui/order.test.ts` (nur Vertragszweig-Erwartungen, Schritt 5)
- **Nicht:** `src/ui/app.ts` (`announceContract` reicht das Ereignis durch), `orders.ts`, `save.ts`, Zweige «kein Auftrag»,
  Normalauftrag, Fernauftrag, Angebot (I-102/Handel 2)

**Interfaces:**

```ts
// types.ts
export type ContractExcuseReason = 'stock' | 'kontor';
// ContractEvent erhält:  | { kind: 'excused'; good: GoodId; reason: ContractExcuseReason; island: number }
// order.ts
/** Baustein der Vertragszeile (I-091): «Treue n/N» bzw. «treu: verzeiht einmal»; N aus CONTRACT_LOYAL_AFTER. */
export function loyaltyText(c: Contract): string;
```

## Gemeinsamer Helfer mit I-102 (Spec §6)

Jeder Wortlaut-Baustein der Karte wird in **genau einem** Test wörtlich geprüft: I-102s Vorschau in den UI-E-Tests,
die Treue in `loyaltyText`-Tests. Kartentests des Vertragszweigs erwarten `toBe(<bestehender Text> + \` · ${loyaltyText(c)}\`)`oder`endsWith(\` · ${loyaltyText(c)}\`)`, nie «Treue 0/5» als Literal. Hat UI-E einen Baustein-Helfer eingeführt (T00 meldet
den Stand), nutzt der Vertragszweig ihn; sonst reicht die Verkettung mit `' · '` wie in den Nachbarzweigen. Kein Umbau der
I-102-Zweige.

## Schritte

- [ ] **1 Konsumenten prüfen:** `grep -rn "ContractEvent\|r\.contract\|ev\.kind" src/ui src/audio` (Liste aus T00); jeder
      Treffer mit Fallunterscheidung über `kind` kommt in Schritt 4 auf `switch` mit `never`. `src/ui/autoLog.ts` (`contractLogEntries`) reicht nur
      `contractNotice` durch: kein Umbau, `excused` erscheint damit auch im Log; `tests/ui/autoLog.test.ts` läuft in Schritt 6 mit.
- [ ] **2 Test zuerst (`tests/ui/loyalty.test.ts`):** `N = CONTRACT_LOYAL_AFTER` importiert; Vertrag `c = { good: 'rum',
amount: 5, price: 27, island: HOME, deliveries: n }`.
  - **AK-TR-17a:** `loyaltyText({ …c, deliveries: 0 })` `toBe(\`Treue 0/${N}\`)`; `deliveries: N − 1` → `` `Treue ${N - 1}/${N}` ``; `deliveries: N`→`'treu: verzeiht einmal'`; `deliveries: 99`→`'treu: verzeiht einmal'`.
  - **AK-TR-17b:** Welt mit Vertrag (`createWorld(3, { unlockAll: true })`, `w.order = null`, `w.contract = c`) →
    `orderCardText(w)` `endsWith(\` · ${loyaltyText(c)}\`)`, für nicht treu und treu; der Text enthält «Lager x/5» weiter mit
`amount` (nicht N).
  - **AK-TR-17c Grep-Wächter:** `readFileSync('src/ui/order.ts', 'utf8')`, Rumpf von `loyaltyText` (von `export function
loyaltyText` bis zur ersten Zeile `}`) enthält keine Ziffer (`not.toMatch(/\d/)`).
  - **AK-TR-18a:** `contractNotice({ kind: 'excused', good: 'rum', reason: 'stock', island: HOME }, w)` `toEqual` `{ text:
'Stammkunde wartet: zu wenig Rum, diesmal ohne Strafe', kind: 'warn', sound: 'error' }` (Gutname über
    `GOODS.rum.name`).
  - **AK-TR-18b:** `reason: 'kontor'`, `island: 1` → `text` `` `Stammkunde wartet: kein Kontor auf ${islandName(w, 1)}, diesmal ohne Strafe` ``,
    `kind: 'warn'`, `sound: 'error'`.
  - **AK-TR-18c:** `delivered` mit `loyal: true, becameLoyal: true`, `amount: 5`, `pay: 135` → `text` `` `Stammkunde: 5
${name} geliefert, +135 · treu: verzeiht einen Fehlbestand` ``, `kind: 'info'`, `sound: 'orderDone'`.
  - **AK-TR-18d:** `delivered` mit `loyal: true, becameLoyal: false` (die (N + 1)-te) → genau der I-047-Text
    `` `Stammkunde: 5 ${name} geliefert, +135` `` (ohne «treu»); ebenso `loyal: false, becameLoyal: false`.
  - **AK-TR-18e:** `announceContract` mit einem `excused`-Bericht → `show` einmal mit Warnung, `play('error')` einmal
    (Fake-`out` wie in `order.test.ts`).
- [ ] **3 Rot-Beleg:** `npx vitest run tests/ui/loyalty.test.ts; echo EXIT=$?` → `EXIT=1` (fehlender Export bzw. falscher
      Text je `it`; ggf. zweiter Lauf mit leerem Rumpf wie T02 Schritt 3).
- [ ] **4 Umsetzen:**
  - `types.ts`: `ContractExcuseReason` neben `ContractBreakReason`; Union-Zeile `excused` nach `broken`; JSDoc der Union um
    «`excused` = Kulanz (I-091)» ergänzen.
  - `order.ts` `loyaltyText`: `c.deliveries >= CONTRACT_LOYAL_AFTER ? 'treu: verzeiht einmal' :
\`Treue ${c.deliveries}/${CONTRACT_LOYAL_AFTER}\``. Import aus `../sim/defs/goods`.
  - `orderCardText`, Vertragszweig: an `· Lager ${stock}/${c.amount}` anhängen `` ` · ${loyaltyText(c)}` ``.
  - `contractNotice` als `switch (ev.kind)` mit `case 'delivered'`, `case 'broken'`, `case 'excused'` und
    `default: { const never: never = ev; return never; }` (oder bestehendes Projektmuster für `never`, per `grep -rn
": never" src/ui` suchen). `delivered`: Basistext wie bisher, bei `ev.becameLoyal` Zusatz
    `' · treu: verzeiht einen Fehlbestand'`. `excused`: `stock` → `` `Stammkunde wartet: zu wenig ${name}, diesmal ohne Strafe` ``,
    `kontor` → `` `Stammkunde wartet: kein Kontor auf ${islandName(world, ev.island)}, diesmal ohne Strafe` ``, `warn`,
    `error`. Innerer `switch (ev.reason)` ebenfalls vollständig. `broken` unverändert.
  - Warnfarbe `contractWarn` unverändert (Spec §5: gilt auch bei treuem Vertrag).
- [ ] **5 Mitzieh `tests/ui/order.test.ts`:** Erwartungen des **Vertragszweigs** von `orderCardText`, die die ganze Zeile
      mit `toBe` prüfen, um `` ` · ${loyaltyText(w.contract!)}` `` ergänzen (Helferaufruf, kein Literal). Jede Stelle im Bericht. Bewusster Verzicht auf das Literal «Treue 0/5» in der Ganzzeilen-
      Prüfung (Spec §6: ein Baustein, ein Wortlaut-Test); den Wortlaut sichert AK-TR-17a, die Stellung AK-TR-17b.
- [ ] **6 Grün:** `npx vitest run tests/ui/loyalty.test.ts tests/ui/order.test.ts tests/ui/contractJump.test.ts tests/ui/autoLog.test.ts
tests/ui/farOrder.test.ts; echo EXIT=$?` → 0; neue Tests × 3 grün.
- [ ] **7 Pflichtläufe:** `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?` → 0.
- [ ] **8 Commits:** `test: Treue-Texte rot (I-091 T03)`, `feat: Treue auf Karte und in Meldungen (I-091 T03)`.

## Prüfschritte / Task-Review

Reviewer prüft: kein `if/else` über `ev.kind` mehr in `src/ui/` (`grep -rn "ev.kind ===" src/ui` leer oder vollständig),
`never`-Zweig vorhanden, Wortlaute zeichengenau aus Spec §5 (Mittelpunkt «·», Komma, «diesmal ohne Strafe»), keine Ziffer
in `loyaltyText`, `types.ts`-Diff nur Union und Typalias, I-102-Zweige ohne Diff; `tsc`, `make lint` Exit 0.
