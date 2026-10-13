# T02 — Save v14: Felder, Migration, Validierung, Rückfaltung, arc42 Persistenz (AK-SK-21, -22, -23)

Paket I047-SIM, Task (c) aus R584 Tech 2. Persona `tech-sim-engineer`, Fortsetzung nach T01. Schätzung ≈ 20 Tools.
**Warum vor den Regeln:** Die Regeln (T03) brauchen `World.contract`/`contractOffer`; die Felder lassen sich nur mit
Version, Migration und Rückfaltung zusammen einführen, ohne dass bestehende Save-Tests rot werden.

Dateien: `src/sim/types.ts` (Felder, Literal), `src/sim/world.ts` (`createWorld`), `src/sim/save.ts`,
`tests/sim/helpers.ts`, `tests/sim/save-contract.test.ts` (neu), nachzuziehende Tests (Liste unten),
`docs/arc42.md` Abschnitt «Persistenz» (D1, E-017).

## Kontext (nur das)

- `save.ts:54` `SAVE_VERSION = 13`; Kette `deserialize` Zeilen 858–871, letztes Glied `migrateV12ToV13` (Z. 220);
  `isValidOrder` (Z. 84), `isWellFormed` (Z. 819; letzte Teilprüfung `isValidV12Fields`).
- `types.ts:253` `version: 13;`, `world.ts:122` `version: 13,`, letzter Schlüssel in `createWorld` ist `buyPct` (Z. 153).
- `tests/sim/helpers.ts:269–345`: `V12_WORLD_KEYS`, `foldBackToV12` (wirft bei unbekanntem Schlüssel), `dropIslandC`,
  `foldBackToV11` (Dispatcher `input.version === 13`), `foldBackToV10` (`>= 12`).

## Tests zuerst (Rot-Beleg)

Neue Datei `tests/sim/save-contract.test.ts` (Thema, nicht Versionsnummer). Nur gegen `SAVE_VERSION`:

- [ ] **AK-SK-22a** `createWorld(3).version === SAVE_VERSION`; `createWorld(3).contract === null`,
      `.contractOffer === null`; die letzten zwei Schlüssel von `Object.keys(JSON.parse(serialize(createWorld(3))))`
      sind `['contract', 'contractOffer']`.
- [ ] **AK-SK-22b Migration:** `w = createWorld(3, { unlockAll: true })` (ohne Vertrag), `old =
foldBackToV13(JSON.parse(serialize(w)))`; `old.version === SAVE_VERSION - 1`, `'contract' in old === false`;
      `deserialize(JSON.stringify(old))` → `ok`, Felder `null`, `serialize` gleich `serialize(w)`; danach beide Welten
      10 × `ORDER_PERIOD` Schritte, `serialize` bitgleich.
- [ ] **AK-SK-22c** `{ ...raw, version: SAVE_VERSION + 1 }` → `{ ok: false, reason: 'Unbekannte Version' }`, kein Wurf.
- [ ] **AK-SK-21 Roundtrip:** Welt A mit `contract = { good: 'rum', amount: 5, price: 27, island: 1 }` (Insel 1 mit
      Kontor, z. B. `foundKontor2Literal` aus `seaHelpers.ts`, `order = null`), Welt B mit `contractOffer = { good:
'rum', island: 0 }`, `order = null`. Je `deserialize(serialize(w))` ok, `serialize` gleich, dann 2 ×
      `ORDER_PERIOD` Schritte auf Original und Kopie → `serialize` gleich (nach T03 deckt das Lieferung bzw.
      Verfall mit ab).
- [ ] **AK-SK-23 Validierung** (`'Beschädigter Spielstand'`, je ein `it`): `contract.good = 'tools'`;
      `contract.amount = 0`; `contract.island = islands.length`; `contract` und `order` zugleich gesetzt (gültiger
      Auftrag); `contractOffer` und `order` zugleich gesetzt; zusätzlich `contract` und `contractOffer` zugleich;
      `contractOffer.good = 'spice'`; `contract.price = -1`; `contract` kein Objekt (`5`).
- [ ] **Rückfaltung** (`tests/sim/helpers.test.ts` oder in `save-contract.test.ts`): `foldBackToV13` wirft bei
      `contract !== null` («foldBackToV13: Vertrag nicht rückfaltbar») und bei `contractOffer !== null`; bei
      unbekanntem Schlüssel `foo` («foldBackToV13: unbekannter Schlüssel foo»); `foldBackToV12(createWorld(3) als JSON)`
      ergibt weiter den Pin aus `helpers.test.ts` (AK-M14E1-24a, Hash 2274015653, Länge 306608).
- [ ] `npx vitest run tests/sim/save-contract.test.ts; echo EXIT=$?` → `EXIT=1`, Beleg.

## Umsetzung

- [ ] `types.ts`: am **Ende** von `World` `contract: Contract | null;` und `contractOffer: ContractOffer | null;` (JSDoc
      I-047); Literal `version: 14;`.
- [ ] `world.ts` `createWorld`: `version: 14`, nach `buyPct` als **letzte** Schlüssel `contract: null,
contractOffer: null`.
- [ ] `save.ts`: `SAVE_VERSION = 14`. Neues letztes Kettenglied (nach `migrateV12ToV13`):

```ts
/** v13 → v14 (I-047): Stammkunde. Neue Schlüssel am Ende, verlustfrei; wirft nie. */
export function migrateV13ToV14(raw: Record<string, unknown>): void {
  if (!('contract' in raw)) raw.contract = null;
  if (!('contractOffer' in raw)) raw.contractOffer = null;
  raw.version = 14;
}
```

- [ ] In `deserialize`: `if (raw.version === 13) migrateV13ToV14(raw);` direkt vor der Prüfung auf `SAVE_VERSION`.

- [ ] `isValidContractFields(raw)` (nur strukturell, wie `isValidOrder`), in `isWellFormed` nach `isValidV12Fields`:
      `contract` ist `null` oder Objekt mit `good` ∈ `GOODS` **mit** `order`, `amount` ganzzahlig ≥ 1, `price`
      ganzzahlig ≥ 0, `island` ganzzahlig `0 ≤ island < raw.islands.length`; `contractOffer` ist `null` oder Objekt
      mit Gut mit `order` und gültiger Insel. Invarianten: `contract ≠ null ⇒ order === null && contractOffer ===
null`; `contractOffer ≠ null ⇒ order === null`. Gemeinsamer Helfer für «Gut mit `order`» und «gültige Insel»,
      kein Doppelcode.
- [ ] `tests/sim/helpers.ts` (R584 Tech 1):
  - `export const V13_WORLD_KEYS = V12_WORLD_KEYS` mit JSDoc «Stand v13, nicht erweitern» (v13 fügte keinen
    Weltschlüssel hinzu).
  - `export function foldBackToV13(x)`: Schlüssel ausserhalb `[...V13_WORLD_KEYS, 'contract', 'contractOffer']` →
    Fehler; `contract`/`contractOffer` müssen `null` sein, sonst Fehler; beide **entfallen ohne Umordnen** (neues
    Objekt, Schleife über `Object.keys(x)`), `version = 13`.
  - `foldBackToV12`: `const v13 = (x.version as number) >= 14 ? foldBackToV13(x) : x;` dann wie bisher.
  - `foldBackToV11`: zuerst `>= 14 → foldBackToV13`, dann `=== 13 → dropIslandC`. `foldBackToV10` bleibt (`>= 12`
    ruft `foldBackToV11`).
- [ ] Nachziehen (keine Zahl mehr, wo möglich gegen `SAVE_VERSION`), per `grep -rn "toBe(13)\|version = 14\|'buyPct')" tests`:
  - `tests/sim/save.test.ts:137` `expect(SAVE_VERSION).toBe(13)` → Test entfernen oder auf `createWorld(3).version`
    gegen `SAVE_VERSION` umstellen (Titel «uses version 5» mit).
  - `tests/sim/save-v13.test.ts:46–47` (Titel «Version 13 …») → `migrateV12ToV13` setzt 13, Ende der Kette
    `SAVE_VERSION`; `:69` und `:122` → `SAVE_VERSION`; `:256` `j.version = 14` → `SAVE_VERSION + 1`.
  - `tests/sim/buyPct.test.ts:50–51` «letzter Schlüssel `buyPct`» → `buyPct` ist letzter Schlüssel von
    `V13_WORLD_KEYS` bzw. steht direkt vor `contract`.
  - Weitere Treffer, die `foldBackToV12`/`V11`/`V9` auf aktuelle Welten anwenden, laufen über die Dispatcher und
    bleiben unverändert grün; nicht anfassen.
- [ ] `docs/arc42.md` Abschnitt «Persistenz» (Z. ~940): `version: 14`, Kette bis `migrateV13ToV14`, neue Felder
      `contract`, `contractOffer` (je `null` oder Objekt, Invarianten), Validierung; Rückfaltung `foldBackToV13`.
- [ ] Grün: `npx vitest run tests/sim/save-contract.test.ts tests/sim/save.test.ts tests/sim/save-v13.test.ts
tests/sim/save-v12.test.ts tests/sim/save-v11.test.ts tests/sim/buyPct.test.ts tests/sim/helpers.test.ts
tests/sim/reserve-bitgleich.test.ts tests/sim/scenario-saves.test.ts tests/sim/balance-crises.test.ts
tests/sim/seaGolden.test.ts tests/sim/goal3.test.ts tests/ui/storage.test.ts; echo EXIT=$?` → `EXIT=0`;
      `npx tsc --noEmit; echo EXIT=$?` → `EXIT=0`.
- [ ] Commit `feat: Save v14 mit Vertrag und Angebot, Migration und Rückfaltung (AK-SK-21/22/23)`.

## Hinweise

- Sechs Versionsstellen (für «Version festlegen», Index): `SAVE_VERSION`, `World.version`, `createWorld`,
  `migrateV13ToV14`, `foldBackToV13`, arc42. Nichts anderes darf die Zahl 14 tragen.
- Bei Konflikt mit einem v14 aus Erweiterung 1: nicht selbst lösen, an den Controller melden.
