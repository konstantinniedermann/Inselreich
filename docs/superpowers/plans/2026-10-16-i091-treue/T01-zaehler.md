# T01 · Wert, Zähler, Bericht `delivered`, Mitzieh-Literale

Plan: [Index](../2026-10-16-i091-treue.md) · Spec R-T1, R-T2, R-T6, R-T7, R-T8 (nur `delivered`) · AK-TR-01, 02, 03, 04,
11 · Umsetzer `tech-sim-engineer` · Modell sonnet · ≈ 40 Tools · blocked-by: T00

**Files:**

- Modify: `src/sim/defs/goods.ts` (neben `CONTRACT_MIN_TIER`), `src/sim/types.ts` (`Contract`, `ContractEvent.delivered`),
  `src/sim/orders.ts` (`acceptContract`, `settleContract`)
- Create: `tests/sim/loyalty.test.ts` · Modify: `tests/sim/defs.test.ts`
- Mitzieh (nur Literale/Erwartungen, siehe Schritt 5): `tests/sim/contract.test.ts`, `tests/sim/save-contract.test.ts`,
  `tests/sim/farOrder-offer.test.ts`, `tests/sim/farOrder-accept.test.ts`, `tests/ui/order.test.ts`,
  `tests/ui/contractJump.test.ts`, `tests/ui/autoLog.test.ts` (Helfer `contract(good)` Z. ≈ 21, R675 P1)
- **Nicht:** `save.ts`, `SAVE_VERSION`, `tickOrders`, `src/ui/`, `balance.test.ts`, `controller.ts`

**Interfaces (Produces):**

```ts
// defs/goods.ts
/** Lieferungen, nach denen ein Vertrag treu ist und einen Fehlbestand einmal verzeiht (I-091 R-T2). */
export const CONTRACT_LOYAL_AFTER = 5;
// types.ts
export interface Contract {
  good: GoodId;
  amount: number;
  price: number;
  island: number;
  /** Lieferungen seit Annahme bzw. letzter Kulanz, sättigt bei CONTRACT_LOYAL_AFTER (I-091 R-T1). */
  deliveries: number;
}
// ContractEvent, Form delivered:
{
  kind: 'delivered';
  good: GoodId;
  amount: number;
  pay: number;
  island: number;
  loyal: boolean;
  becameLoyal: boolean;
}
```

## Schritte

- [ ] **1 Test zuerst (`tests/sim/loyalty.test.ts`):** Testwelt wie `contract.test.ts` (`base()`: `createWorld(3,
{ unlockAll: true })` + `setHouse(houseNearKontor(w), tier, 1)`; `periodStart(k)`, `stepAt(w, t)` lokal nachbauen oder
      aus einem gemeinsamen Helfer importieren, nicht aus der Testdatei). `N` immer als `CONTRACT_LOYAL_AFTER` importieren.
  - **AK-TR-01:** `w.contractOffer = { good: 'rum', island: HOME }`, `acceptContract(w)` → `ok`, `w.contract.deliveries === 0`
    und `w.contract` `toEqual` `{ good: 'rum', amount: 5, price: contractUnitPrice('rum'), island: HOME, deliveries: 0 }`.
  - **AK-TR-02:** Vertrag Rum mit `deliveries: 0`, Lager Rum gross genug; für `i = 1 … N + 1` je `stepAt(w,
periodStart(i + 1))` (Periode 0/1 sind frei wählbar, der Test nennt sie über `periodStart`). Je Lieferung:
    `report.contract` `toEqual` `{ kind: 'delivered', good: 'rum', amount: 5, pay: 135, island: HOME, loyal: i >= N,
becameLoyal: i === N }` und `w.contract.deliveries === Math.min(i, N)`.
  - **AK-TR-03:** Zähler auf `N` gebracht (über Lieferungen wie 02, nicht gesetzt), `cancelContract` → `ok`, Geld unverändert;
    danach `contractOffer` Rum setzen, `acceptContract` → `deliveries === 0`.
  - **AK-TR-04:** wie 02, aber `base(2)` (Häuser Stufe 2 < `CONTRACT_MIN_TIER`), `w.crisis = { period: 0, kind: 'boom',
from: 0, until: 99999, good: 'rum' }`, `w.edict = 'trade'` (Muster `contract.test.ts` Z. ≈ 314) → gleiche Folge von
    `deliveries`, `loyal`, `becameLoyal` wie 02.
- [ ] **2 Test zuerst (`tests/sim/defs.test.ts`):** `describe('AK-TR-11 …')`: `Number.isInteger(CONTRACT_LOYAL_AFTER)` und
      `CONTRACT_LOYAL_AFTER >= 1`. Bestehender Block AK-SK-26 bleibt unverändert.
- [ ] **3 Rot-Beleg:** `npx vitest run tests/sim/loyalty.test.ts tests/sim/defs.test.ts; echo EXIT=$?` → `EXIT=1`, Ausgabe
      (Fehlschlag je neuem `it`) in den Bericht.
- [ ] **4 Umsetzen:**
  - `defs/goods.ts`: Konstante wie oben, direkt nach `CONTRACT_MIN_TIER`.
  - `types.ts`: `deliveries` als **letztes** Feld von `Contract`; `delivered` erhält `loyal`, `becameLoyal` am Ende.
  - `orders.ts` `acceptContract`: Literal um `deliveries: 0` ergänzen (letzter Schlüssel).
  - `orders.ts` `settleContract`, Lieferzweig (nach Geldbuchung): `const before = c.deliveries; c.deliveries =
Math.min(before + 1, CONTRACT_LOYAL_AFTER);` und im Ereignis `loyal: c.deliveries >= CONTRACT_LOYAL_AFTER,
becameLoyal: before < CONTRACT_LOYAL_AFTER && c.deliveries >= CONTRACT_LOYAL_AFTER`. Kein weiteres Lesen von Boom, Edikt,
    Stufe oder `sellPct` (R-T7). Bruchzweig unverändert.
  - JSDoc von `settleContract` um «zählt Lieferungen (I-091 R-T1)» ergänzen.
- [ ] **5 Mitzieh (Spec §8, nichts abschwächen):** `npx tsc --noEmit` listet jede Stelle.
  - `Contract`-Literale: `deliveries: 0` als letzter Schlüssel (z. B. `rumContract`, `RUM`-Spread, `withContract`,
    `contractJump.test.ts`). Helfer `rumContract` liefert dann `deliveries: 0`.
  - `delivered`-Literale in Erwartungen: `loyal: false, becameLoyal: false` (ein frischer Vertrag liefert zum ersten Mal).
  - `toEqual`-Erwartungen auf `w.contract` **nach** einer Lieferung (z. B. `contract.test.ts` AK-SK-09: `expect(w.contract)
.toEqual(rumContract())`) → genauer neuer Wert `{ ...rumContract(), deliveries: 1 }`. Nie `toMatchObject`.
  - `as never`-Literale (`farOrder-save.test.ts`) zieht T02 Schritt 6 nach (Datei gehört T02).
  - Bekannte Stellen (Plan-Review): `contract.test.ts` Z. ≈ 134 (`RUM`), ≈ 227 (AK-SK-07), ≈ 275 (Erwartung nach Lieferung
    → `{ ...rumContract(), deliveries: 1 }`), ≈ 418, ≈ 565/567 (AK-SK-27); `farOrder-period.test.ts` hat nur
    `toMatchObject` ohne Literal (kein Handlungsbedarf, im Bericht nennen).
  - Jede geänderte Datei mit Anzahl Stellen im Bericht nennen.
- [ ] **6 Grün:** `npx vitest run tests/sim/loyalty.test.ts tests/sim/defs.test.ts tests/sim/contract.test.ts
tests/sim/save-contract.test.ts tests/sim/farOrder-offer.test.ts tests/sim/farOrder-accept.test.ts tests/ui/order.test.ts
tests/ui/contractJump.test.ts tests/ui/autoLog.test.ts tests/sim/balance.test.ts; echo EXIT=$?` → 0; neue Tests × 3 grün.
- [ ] **7 Pflichtläufe:** `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?` → 0.
- [ ] **8 Commits:** `test: Treue-Zähler rot (I-091 T01)`, `feat: Treue-Zähler und Bericht delivered (I-091 T01)`,
      `test: Vertrags-Literale mit deliveries (I-091 T01)`.

## Hinweis

Zwischenstand bis T02: Ein v15-Stand mit Vertrag hätte nach dem Laden kein `deliveries` (`NaN` bei der nächsten Lieferung).
Das schliesst T02 (Migration); kein Zwischenrelease von `feat/i091`.

## Prüfschritte / Task-Review

Reviewer prüft: `becameLoyal` nur beim Übergang (AK-02 deckt die (N+1)-te Lieferung), kein Literal `5` für N in Code oder
Test, `deliveries` letzter Schlüssel, Mitzieh ohne Abschwächen (`git diff main -- tests | grep -n "toMatchObject"` ohne neue
Zeile), `git diff main -- tests/sim/balance.test.ts tests/sim/controller.ts` leer; `tsc`, `make lint` Exit 0.
