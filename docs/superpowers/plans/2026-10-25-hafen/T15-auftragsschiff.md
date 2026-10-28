# T15 · Auftragsschiff: Anfahrt, Liegen, Abfahrt (S6, R26–R30)

Umsetzer `art-rendering-engineer` · ≈ 55 Tools · AK-HF-41, -42, -43, -44, -45 · blocked-by: T14 · Worktree `.worktrees/hafen-render` · Spec §3.6, §4, O-4, O-5, Anhang 02 §H, **Art-Brief §7** (R943)

## Dateien

- neu: `src/render/orderShip.ts`, `tests/render/orderShip.test.ts`
- ändern: `src/render/renderer.ts` (Auftragsschiff aus `orderShip` statt `shipTile`), `src/render/ship.ts` (`shipTile` entfällt), `src/ui/app.ts` (**nur** der Hover-Aufruf
  `shipTile` → Pose aus `orderShip`, Kachel-Vergleich gleich)
- nicht ändern: `src/sim/` (keine Liefersperre, kein Save-Feld, R30), Flotten-Pose (T14)

## Interfaces

```ts
export const ORDER_SHIP_TILES = 12; // Darstellungswert (Spec §3.9)
export const ORDER_SHIP_TICKS = Math.ceil(ORDER_SHIP_TILES * SHIP_TICKS_PER_ROUTE_TILE); // 35, fest, auch mit Seerecht (O-4)
export const ORDER_SHIP_FADE_TICKS = 5; // Ein-/Ausblenden (O-5, Art-Brief §7): 0,5 s bei x1, ≈ 1,7 Kacheln Weg
/** Render-Zustand ausserhalb der Welt: beobachtete Annahme eines Fernauftrags, Ende (Tick, Anteil f). Nie gespeichert. */
export interface OrderShipMemo {
  seenFar: { island: number; tick: number } | null;
  ended: { tick: number; f: number; island: number } | null;
  lastOrderKey: string | null;
}
export function createOrderShipMemo(): OrderShipMemo;
/** Beobachtet world.order (einmal je Frame vor dem Zeichnen); schreibt nur den Memo. */
export function observeOrder(memo: OrderShipMemo, world: World): void;
export interface OrderShipPose {
  x: number;
  y: number;
  heading: Heading;
  furled: boolean;
  alpha: number;
  island: number;
}
export function orderShipPose(
  world: World,
  memo: OrderShipMemo,
  frac: number,
): OrderShipPose | null;
/** Anfahrtsweg: letzte 12 Kacheln der Fahrlinie von der nächsten anderen Insel (kürzeste Lane nach laneTicks) zum Anker; ohne Lane Gerade aus Richtung Inselmitte → Anker. */
export function approachPath(world: World, island: number): Pt[];
```

## Verhalten

- `t_A = ORDER_FIRST_TICK + order.period · ORDER_PERIOD`; Anteil `u = (tick + frac − t_A) / ORDER_SHIP_TICKS`, geklemmt auf [0, 1]; Pose `pointAt(approachPath, u)`; liegend
  (Rang 0, `berths(…)[0]`) für `u ≥ 1`, solange `world.order !== null` (R27). Vor `t_A` kein Schiff.
- **Ende (R28):** `observeOrder` merkt den Tick, an dem `world.order` null wird bzw. der Auftrag wechselt, und den Anteil `f` (1 = lag am Anker); Abfahrt rückwärts über
  denselben Weg, Dauer `ceil(f · 35)` Ticks, dann weg. Nach dem Laden eines Stands ist der Memo leer → keine Abfahrt nachgespielt.
- **Fernauftrag (R29):** Wechsel `order.island` null → i beobachtet: Heimat-Schiff fährt ab (wie Ende), ein Schiff fährt den Anker von i an (Start = beobachteter Tick).
  Frisch geladener Stand mit laufendem Fernauftrag: liegt sofort an i, keines an der Heimat.
- **Ein-/Ausblenden (Brief §7):** `alpha` linear 0 → 1 über die ersten `ORDER_SHIP_FADE_TICKS` der 35 Anfahrtsticks und 1 → 0 über die letzten
  `min(ORDER_SHIP_FADE_TICKS, Abfahrtsdauer)` Ticks der Abfahrt, aus `tick + frac`; nach dem Laden liegt das Schiff ohne Einblenden (`alpha` 1, R29). Der Renderer setzt
  `ctx.globalAlpha` um den `drawShip`-Aufruf; `drawShip` braucht dafür nichts.
- Pause: gleicher `tick` und `frac` → gleiche Pose (rein). Nicht anklickbar (nicht in `world.ships`). Zeichnen mit `look = { heading, furled, livery: 'auftrag' }`;
  `heading` fahrend nach der Sehnenregel aus T14, liegend nach `dockedHeading` (längsseits, R943).

## Steps

- [ ] **Tests rot** `tests/render/orderShip.test.ts`:
  - AK-HF-41: `t_A − 1` kein Schiff; `t_A` 12 Kacheln vor dem Anker (Weglänge ±0,01), nicht am Steg; `t_A + 35` am Anker; dazwischen Abstand monoton fallend, Schritte je Tick
    gleich lang (±1 %); gleicher Tick und `frac` → gleiche Pose. Rot heute (Schiff liegt ab `t_A`).
  - AK-HF-42: Insel ohne Nachbar-Lane (synthetisch) → Start = Anker + 12 · Einheitsvektor(Inselmitte → Anker).
  - AK-HF-43: Lieferung bei f = 0,4 → Abfahrt ab aktueller Pose, nach `ceil(0,4 · 35)` = 14 Ticks weg.
  - AK-HF-44: Annahme beobachtet → Heimat-Schiff legt ab, Schiff am Ziel nach 35 Ticks am Anker; neuer Memo mit laufendem Fernauftrag → liegt sofort am Ziel.
  - AK-HF-45: Stand bei `t_A + 10` per `deserialize(serialize(w))`, neuer Memo → Pose gleich der ohne Laden.
  - Ausblenden (Brief §7): `alpha` bei `t_A` = 0, `t_A + 2,5` = 0,5, `t_A + 5` = 1; letzter Abfahrtstick → `alpha` ≤ 0,2; neuer Memo mit liegendem Schiff → `alpha` 1;
    Farbsatz im Fake-Kontext `roofTerracotta` (Segel).
- [ ] **Lauf rot → Umsetzen → Lauf grün** plus `tests/render/{renderer,ship,shipLane}.test.ts`, `tests/ui/hover.test.ts`; Pins per Name.
- [ ] Teilbeleg laut Index.
- [ ] **Commit:** `feat: Auftragsschiff fährt an und ab (HAFEN S6, AK-HF-41..45)`.

## Bericht

Exit-Codes; Rot-Ausgabe; Pin-Liste. Danach D4 per `SendMessage`.
