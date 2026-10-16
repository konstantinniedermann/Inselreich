# T04 · Kulanz in `tickOrders`, Prüfstand für T05

Plan: [Index](../2026-10-16-i091-treue.md) · Spec R-T3, R-T4, R-T5, R-T6, R-T9 · AK-TR-05, 06, 07, 08, 09, 10, 12, 13b, 20,
21, 22 · Umsetzer `tech-sim-engineer` · Modell sonnet · ≈ 45 Tools · blocked-by: T03 (Union `excused` im Typ)

**Files:**

- Modify: `src/sim/orders.ts` (`settleContract`, `tickOrders`, JSDoc)
- Modify: `tests/sim/loyalty.test.ts` (Block «Kulanz», Generator für T05)
- **Nicht:** `types.ts`, `save.ts`, `src/ui/`, `balance.test.ts`, `controller.ts`

## Testwelten

- `loyal(island = HOME, stock)`: `base()` aus T01 (Häuser Stufe 3, damit der Zufallsauftrag bei Bruch entsteht), bei
  Fremdinsel `foundKontor2Literal(w, island)` vor dem Vertrag, `w.order = null`, `w.contract = { good: 'rum', amount: 5,
price: 27, island, deliveries: CONTRACT_LOYAL_AFTER }`, Lager Rum = `stock`, `w.money = 1000`.
- `quiet()` für AK-05/06 (Spec: ohne Unterhalt und Steuer im Schritt): `createWorld(3, { unlockAll: true })`, `order`/`contractOffer` = `null`, **ohne**
  `setHouse`, `upkeepCarry = 0`, `taxCarry = 0`; Vorbedingung im Test `expect(totalUpkeep(w)).toBe(0)` und keine Häuser
  (`Object.values(w.buildings).every((b) => b.house === undefined)`), sonst ist der Geldvergleich wertlos.
- Schritt auf den Periodenbeginn: `stepAt(w, periodStart(k))`.

## Schritte

- [ ] **1 Test zuerst (`describe('Kulanz')` in `tests/sim/loyalty.test.ts`), je AK ein `it`:**
  - **AK-TR-05:** `quiet()` + treuer Vertrag HOME, Rum 3; `m0 = w.money`; Schritt → `w.money === m0`, Rum 3,
    `w.contract` `toEqual` `{ …vertrag, deliveries: 0 }`, `order`, `farOffer`, `contractOffer` je `null`, `report.contract`
    `toEqual` `{ kind: 'excused', good: 'rum', reason: 'stock', island: HOME }`.
  - **AK-TR-06:** `quiet()` + Fremdinsel ohne Kontor (`island = 1`, **kein** `foundKontor2Literal`), Lager dort beliebig →
    wie 05 mit `reason: 'kontor'`, `island: 1`.
  - **AK-TR-07:** `loyal()` mit `deliveries: N − 1`, Rum 3 → `report.contract.kind === 'broken'`, `penalty === 135`,
    `w.money === 1000 − 135`, `w.contract === null`, `w.order` `toMatchObject(orderForPeriod(w.seed, k, maxHouseTier(w)))`
    (Muster `contract.test.ts` Z. ≈ 334).
  - **AK-TR-08:** nach 05-Schritt (Lager bleibt 3) nächster Periodenbeginn → `broken`, Strafe 135, `contract === null`.
  - **AK-TR-09:** `loyal()` Rum 3, `lockOrders(w)` (Muster `contract.test.ts`) → `broken`, `reason: 'lock'`, Strafe; zweiter
    Fall `w.contract.island = w.islands.length` (konstruierter Stand) → `broken`, `reason: 'island'`, Strafe.
  - **AK-TR-10:** Kulanz wie 05, dann N Perioden mit Rum ≥ 5 → `loyal`/`becameLoyal` bei der N-ten wahr; danach Rum 3 →
    zweite `excused`, `deliveries === 0`.
  - **AK-TR-20:** Kulanz, dann Rum 5 vor dem nächsten Periodenbeginn → `delivered`, `pay === 135`, `deliveries === 1`,
    `loyal === false`, `becameLoyal === false`.
  - **AK-TR-21:** wie 05, vor dem Schritt `w.farSkip = k` (Periode des Schritts) → `farSkip === null`, `order === null`,
    `farOffer === null`, `report.contract.kind === 'excused'`.
  - **AK-TR-22:** nach 05-Schritt `cancelContract(w)` → `ok`, `contract === null`, `money` unverändert; dann
    `w.contractOffer = { good: 'rum', island: HOME }`, `acceptContract(w)` → `deliveries === 0`.
  - **AK-TR-12:** Skript «Annehmen, N Lieferungen, eine Kulanz, eine Lieferung» zweimal mit `createWorld(7, { unlockAll:
true })` aufbauen und laufen lassen (Muster AK-SK-24 `script(w, reload)`, Lager über Setzen vor jedem Periodenbeginn) →
    `serialize` beider Welten gleich; Kulanz im Lauf per `report.contract.kind === 'excused'` belegt (Zähler im Test = 1).
  - **AK-TR-13b:** treu, Rum 3, Tick mitten in der Periode (`periodStart(k) − 100`); Welt A läuft bis zum Periodenbeginn,
    Welt B wird erst `deserialize(serialize(…))` geladen und läuft gleich weit → beide `excused`, `serialize` gleich.
- [ ] **2 Rot-Beleg:** `npx vitest run tests/sim/loyalty.test.ts; echo EXIT=$?` → `EXIT=1` mit Fehlschlag je neuem `it`
      (heute `broken` statt `excused`). AK-07, 09 dürfen vorher grün sein (Bruch ist heutiges Verhalten); sie sind
      Schutztests, im Bericht als «grün vor Umsetzung, Regressionsschutz» kennzeichnen.
- [ ] **3 Umsetzen (`orders.ts`):**
  - `settleContract`: nach `breakReason` und vor der Strafe:

```ts
if ((reason === 'stock' || reason === 'kontor') && c.deliveries >= CONTRACT_LOYAL_AFTER) {
  c.deliveries = 0;
  return { kind: 'excused', good: c.good, reason, island: c.island };
}
```

    Kein Lager-, kein Geldzugriff im Kulanzzweig. `lock`/`island` laufen wie heute in den Bruch (R-T5).

- `tickOrders`: `if (ev?.kind === 'delivered' || ev?.kind === 'excused') return ev;` — `farSkip`-Verbrauch und
  `contractOffer = null` stehen schon davor (unverändert, R-T3).
- JSDoc von `settleContract` («liefern, verzeihen oder brechen») und `tickOrders` («Lieferung oder Kulanz: weder
  Zufalls- noch Fernangebot») nachführen.
- [ ] **4 Generator für T05 (AK-TR-19):** `it.skipIf(!process.env.SCENARIO_OUT)('schreibt i091-kulanz.json', …)`:
      `quiet()` (keine Häuser: Kasse bewegt sich im Browser nur durch den Vertrag), `w.order = null`, treuer Vertrag Rum
      HOME (`deliveries: CONTRACT_LOYAL_AFTER`), Rum 0, `w.money = 5000`, `w.tick = periodStart(3) − 50` (5 s bei 1×). Prüft
      vor dem Schreiben `deserialize(serialize(w)).ok` und dass ein Lauf einer Kopie bis `periodStart(3)` genau `excused`
      meldet und `money` gleich bleibt; schreibt
      `serialize(w)` nach `$SCENARIO_OUT/i091-kulanz.json`. Pfad für T05: `.studio/qa/i091/`.
- [ ] **5 Grün:** `npx vitest run tests/sim/loyalty.test.ts tests/sim/contract.test.ts tests/sim/farOrder-period.test.ts
tests/sim/farOrder-offer.test.ts tests/sim/tick.test.ts tests/sim/balance.test.ts; echo EXIT=$?` → 0; neue Tests × 3 grün.
      Generator einmal laufen lassen: `SCENARIO_OUT=.studio/qa/i091 npx vitest run tests/sim/loyalty.test.ts -t "schreibt";
echo EXIT=$?` → 0, Datei vorhanden (nicht committen, `.studio/` ist Laufzeitablage).
- [ ] **6 Pflichtläufe:** `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?` → 0.
- [ ] **7 Commits:** `test: Kulanz rot (I-091 T04)`, `feat: Kulanz für treue Stammkunden (I-091 T04)`.

## Prüfschritte / Task-Review

Reviewer prüft: früher Rücksprung bei `excused` (AK-05 prüft alle drei Angebote `null`), kein Geldfluss im Kulanzzweig,
`lock`/`island` nie verziehen, keine neue Zufallsquelle (`git diff main -- src/sim | grep -n "rng\|Math.random"` leer),
Determinismus-Test enthält wirklich eine Kulanz, `balance.test.ts` grün und ohne Diff; `tsc`, `make lint` Exit 0.
