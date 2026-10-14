# T07 · UI-Helfer: Texte, Lieferziel, Ereignis-Log

Plan: [Index](../2026-10-14-handel-2.md) · AK-H2-28, 29, 33 · Review Focus 1–3 · Modell sonnet · ≈ 40 Tools

**Vorbedingung:** `feat/ui-aufraeum-3` und `feat/i100` sind auf `main`; Controller hat `git merge main` im Branch ausgeführt
und `make check` grün (sonst `waiting`). `orderCardText` und `LogEntry` ändern sich in diesen Branches — Stand nach dem Merge
ist massgeblich, **T-01 bleibt der dann gültige Text** (Anhang 02: «unverändert»).

**Files:**

- Create: `src/ui/farOrder.ts`, `tests/ui/farOrder.test.ts`
- Modify: `src/ui/order.ts` (`orderCardText` Zweig T-04, `orderMessage` ohne Verfallsmeldung für Fernaufträge),
  `tests/ui/order.test.ts` (nur ergänzen)

**Interfaces:**

- Consumes: `World.farOffer`, `Order.island`, `acceptFarOrder`, `deliverOrder`, `nextOrderTick` (T03–T06); `LogEntry`
  (`src/ui/crisisLog.ts`), `formatGameTime` (`src/ui/time.ts`), `islandName`, `GOODS`, `FAR_ORDER_DURATION`.
- Produces (DOM-frei, `src/ui/farOrder.ts` importiert **nicht** `./order`; T08 nutzt genau diese Namen):

```ts
export function farOfferText(world: World): string | null; // T-02 oder null ohne Angebot
export function farAcceptTooltip(world: World): string; // T-03 (leer ohne Angebot)
export function farOrderText(world: World, o: Order): string; // T-04
export function farOrderWarn(world: World): boolean; // T-05: Fernauftrag ohne Kontor auf der Fern-Insel
export function farAcceptedMessage(world: World, o: Order): string; // T-07
export function farDeliveredEntry(o: Order, tick: number): LogEntry; // T-16 = T-08, toast 'info'
export function deliverTarget(world: World, active: number): number; // AK-29
export interface FarSnap {
  offer: FarOffer | null;
  order: Order | null;
}
export function farSnap(world: World): FarSnap; // Kopien, keine Referenzen
export function farLogEntries(prev: FarSnap, world: World): LogEntry[]; // T-17, T-18
```

## Wortlaut (Anhang 02, wörtlich; `<Insel>` = `islandName(world, i)`, Zeiten über `formatGameTime`)

- T-02 `Fernangebot ${insel}: ${amount} ${gut} · ${reward} · Frist ${m:ss} · Lager ${x}/${amount}` — Frist =
  `ORDER_FIRST_TICK + order.period * ORDER_PERIOD + FAR_ORDER_DURATION − world.tick` (Periode des Zufallsauftrags, R15.2).
- T-03 `Ersetzt den Auftrag. Liefern nur am Kontor ${insel}. Der nächste Auftrag entfällt.`
- T-04 `Fernauftrag ${insel}: ${amount} ${gut} · ${reward} · noch ${m:ss} · Lager ${x}/${amount}` (noch = `due − tick`).
- T-07 `Fernauftrag angenommen: ${amount} ${gut} nach ${insel}` · T-08/T-16 `Fernauftrag geliefert: ${amount} ${gut}, +${reward}`
- T-17 `Fernauftrag verfallen: ${amount} ${gut} nach ${insel}` (`toast: 'info'`) · T-18 `Fernangebot verfallen: ${amount}
${gut} nach ${insel}` (`toast: null`)
- `x` = Lager der **Fern-Insel** (`world.islands[i].stock[good]`), unabhängig von der aktiven Insel (U3).

## Schritte

- [ ] **Step 1: Failing tests** — `tests/ui/farOrder.test.ts`, Welten aus `tests/sim/farHelpers.ts` (`farWorld`, `stepAt`,
      `periodStart`, `islandOf`) — Import aus `../sim/farHelpers` ist erlaubt.

- **AK-H2-28:** bei `w.tick = P` → `farOfferText(w)` `'Fernangebot Felsbucht: 15 Rum · 450 · Frist 2:50 · Lager 0/15'`;
  mit Rum 7 auf B und Heimatlager Rum 99 → `Lager 7/15`. `farAcceptTooltip(w)` wörtlich T-03. Nach `acceptFarOrder`:
  `orderCardText(w)` und `orderCardText(w, islandOf(w,'A'))` beide `'Fernauftrag Felsbucht: 15 Rum · 450 · noch 2:50 · Lager 7/15'`
  (Zeit über `formatGameTime(1700)` bilden, nicht hart). `farOrderWarn` false; nach `dropKontor(w, B)` true.
  `farAcceptedMessage` T-07, `farDeliveredEntry(o, t)` `{ text: T-08, toast: 'info', tick: t }`. Ohne Fernangebot:
  `farOfferText(w)` `null` und `orderCardText(w)` gleich einer Welt `farWorld(3, [])` (gleicher Tick, gleicher Auftrag).
- **AK-H2-29:** `deliverTarget(w, HOME)` und `deliverTarget(w, A)` → `B` beim Fernauftrag; beim Zufallsauftrag → die aktive
  Insel; ohne Auftrag → die aktive Insel. Früh geliefert → `orderCardText(w)` = `Nächster Auftrag in ${formatGameTime(periodStart(k + 2) − w.tick)}`.
- **AK-H2-33** (Eingabe `prev = farSnap(vorher)`, dann Welt nachher):
  (a) Fernauftrag, `stepAt(w, due + 1)` → genau ein Eintrag T-17, `toast 'info'`, `tick = due + 1`;
  (b) Lieferung bei `tick ≤ due` (`deliverOrder` ok; Aufrufer setzt `prev = farSnap(w)` danach) → `farLogEntries` `[]`,
  `farDeliveredEntry` liefert genau **einen** Eintrag (T-16); (c) Angebot vorher, `stepAt(w, P + 601)` ohne Annehmen →
  T-18 mit `toast: null`; nach `deliverOrder` des Zufallsauftrags bzw. nach `acceptFarOrder` (je mit neuem `prev`) → `[]`;
  (d) Zufallsauftrag verfällt ohne Angebot → `[]` und `orderMessage(prev.order, w.order)` ist die heutige Meldung;
  (e) `step` liefert denselben `StepReport` und dasselbe `serialize` wie eine Kopie, auf der die Helfer nicht liefen.
- **Review Focus 1:** `prev` bei `due − 5`, dann 20 Schritte am Stück → genau ein T-17, und `orderMessage(prev.order, null)`
  für einen Fernauftrag `null` (keine zweite Meldung «Auftrag verfallen»).
- **Review Focus 2:** frisch geladene Welt (`deserialize(serialize(w))`) mit offenem Angebot bzw. Fernauftrag:
  `farLogEntries(farSnap(x), x)` → `[]`.
- **Review Focus 3:** Angebot offen, `dropKontor(w, B)` → `farOfferText` liefert weiter T-02 mit Lager; `farAcceptTooltip` T-03.

- [ ] **Step 2: Rot-Beleg** — `npx vitest run tests/ui/farOrder.test.ts; echo EXIT=$?` → `EXIT=1`.

- [ ] **Step 3: Umsetzen** — `src/ui/farOrder.ts` nach Wortlaut oben. Erkennung im Log (Anhang 02 T.2):

```ts
export function farLogEntries(prev: FarSnap, world: World): LogEntry[] {
  const out: LogEntry[] = [];
  const o = prev.order;
  const gone = (p: Order): boolean => world.order === null || world.order.period !== p.period;
  if (o !== null && o.island !== undefined && world.tick > o.due && gone(o))
    out.push({ text: `Fernauftrag verfallen: ${line(world, o)}`, toast: 'info', tick: world.tick });
  const f = prev.offer;
  if (
    f !== null &&
    world.farOffer === null &&
    o !== null &&
    o.island === undefined &&
    world.tick > o.due
  )
    out.push({ text: `Fernangebot verfallen: ${line(world, f)}`, toast: null, tick: world.tick });
  return out;
}
// line(world, x) = `${x.amount} ${GOODS[x.good].name} nach ${islandName(world, x.island!)}`
```

`src/ui/order.ts`: in `orderCardText` vor dem Zufallsauftrag-Text `if (o.island !== undefined) return farOrderText(world, o);`;
in `orderMessage` beim Verfall `if (prev.island !== undefined) return null;` (T-17 übernimmt). Kein weiterer Diff in `order.ts`.

- [ ] **Step 4: Grün** — `npx vitest run tests/ui/farOrder.test.ts tests/ui/order.test.ts tests/ui/crisisLog.test.ts
tests/ui/hud.test.ts; echo EXIT=$?` → 0; `npx tsc --noEmit; echo EXIT=$?` → 0; `npx eslint src/ui/farOrder.ts src/ui/order.ts; echo EXIT=$?` → 0.

- [ ] **Step 5: Commit** — `git commit -m "feat: Texte, Lieferziel und Log-Einträge zum Fernangebot (Handel 2 T07)"`.

## Abnahme

- Alle Texte aus dem Zustand gebildet; keine Zahl 15/450/2:50 im Produktivcode.
- `tests/ui/order.test.ts` bestehende Fälle unverändert grün (nur ergänzt).
