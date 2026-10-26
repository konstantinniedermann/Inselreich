# T02 · Weltfelder, Save-Schritt, Ladeprüfung, Faltung

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 65 Tools · blocked-by: T01 · AK-NU1-23, -24, -41, -42, -43, -44, -46, -25b (Save) · Regeln R909, R979
Spec §4; Anhang 02 §8.3, §8.4.

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files:**

- Create: `src/sim/expeditionSave.ts`, `tests/sim/expedition-save.test.ts`
- Modify: `src/sim/types.ts` (`World`-Felder, `version`), `src/sim/world.ts` (Felder, `version`), `src/sim/save.ts` (42 KB: nur abschnittsweise, nach Symbolen), `tests/sim/helpers.ts` (29 KB: nur die Faltfunktionen per `rg -n`)
- Modify (Pins laut `pins.md`, T02-Zeilen): `tests/sim/scenarios.ts` (41 KB, nur `m13e2Abschnitt1Rest`/`…3Rest`), `tests/sim/council-save.test.ts`, `farOrder-save.test.ts`, `save-loyalty.test.ts`, `helpers.test.ts`, ggf. `buyPct.test.ts`

**Interfaces:**

- Consumes (T01): Typen `Expedition`, `SeaAreaId`, `FindId`; `SEA_AREAS`, `areaOf`, `poolOf`, `UNLOCK_IDS`.
- Produces:

```ts
// types.ts — World (am Ende der Felder; createWorld legt sie in dieser Reihenfolge am Ende an)
expedition: Expedition | null; seaRevealed: SeaAreaId[]; finds: FindId[];
// save.ts
export const SAVE_V_KARTENRAND = /* SAVE_VERSION auf main + 1 */;   // P-7; SAVE_VERSION = SAVE_V_KARTENRAND
// expeditionSave.ts (importiert defs, types, keine Sim-Module ausser rein lesenden Helfern)
export function isValidKartenrandFields(raw: Record<string, unknown>): boolean; // vor isValidV9Fields (Routen!)
export function isValidExpeditionField(raw: Record<string, unknown>): boolean;  // nach isValidV9Fields (Schiffe)
export function migrateKartenrand(raw: Record<string, unknown>): void;          // wirft nie
// tests/sim/helpers.ts
export function dropExpedition(x: Record<string, unknown>): Record<string, unknown>; // Startwerte, sonst Fehler; entfernt auch 'U7' aus unlocked
export function foldBackKartenrand(x: Record<string, unknown>): Record<string, unknown>; // dropExpedition + version − 1
```

## Ladeprüfung (je Regel ein Fall in AK-24/43/44/46, Ergebnis `{ ok: false, reason: 'Beschädigter Spielstand' }`, kein Wurf)

`isValidKartenrandFields`:

- K1 `seaRevealed`: Array, Ids aus `SEA_AREAS`, ohne Doppelte.
- K2 `finds`: Array, `FindId`, ohne Doppelte; **(a)** `finds` = Verkettung über `seaRevealed` (in dieser Reihenfolge) von je einem Präfix (auch leer) von `areaOf(a).finds`; kein Stück eines nicht aufgedeckten Gebiets.
- K3 `wonSpice false` ⇒ `expedition null`, beide Listen leer, kein `maphouse`.
- K4 `wonSpice true` ⇒ `'U7'` ∈ `unlocked` (AK-42).
- K5 höchstens ein `maphouse`, Insel 0.

`isValidExpeditionField` (`expedition === null` ist gültig), sonst genau die Schlüssel aus Spec §4 und:

- K6 `ship` ist Id eines Schiffs; `area` gültig und ∉ `seaRevealed`; `phase` ∈ 4 Phasen; ein `maphouse` steht.
- K7 **(d)** `cards`: Länge k = `cardsAfter.length`, Ids aus `poolOf(area)`, ohne Doppelte.
- K8 `cardIndex` ∈ 0…k; `extra` gerade, 0 ≤ `extra` ≤ 2·`cardIndex`; `finds` ∈ 0…`cardIndex`; `done` boolesch, `true` nur in `back`.
- K9 `card`: `cardIndex < k` und `leg = cardsAfter[cardIndex] + extra`, `left 0`, `wait` ≥ 0. **(b)** `leg`: `leg ≤ sections + extra`, `left` 1…`SECTION_TICKS`. `back`: `left` 1…`HOME_TICKS`. `boarding`: `leg`, `cardIndex`, `extra`, `finds`, `left` = 0. `wait` = 0 ausser in `card`.
- K10 `cargo`: Werte ganzzahlig ≥ 1, Güter ∈ `GOOD_IDS`, Summe ≤ `SHIP.capacity`, Schlüssel in `GOOD_IDS`-Reihenfolge (P-8).
- K11 Schiff: ausser `boarding` `port 0`, `to null`, `cargo` leer; in `boarding` `route` mit `a === 0 || b === 0` oder `homing`.

`isWellFormed`: `isValidKartenrandFields` **vor** `isValidV9Fields`, `isValidExpeditionField` direkt danach (Gate-Auflage 1: `finds` vor den Routen, T03 nutzt das für F2).

## Migration (`migrateKartenrand`, Kettenzeile `if (raw.version === SAVE_V_KARTENRAND - 1) migrateKartenrand(raw);` als letzte vor dem Versionsvergleich)

`expedition = null`, `seaRevealed = []`, `finds = []`; ist `wonSpice === true` und `'U7'` fehlt, wird `'U7'` an `unlocked` angehängt (U7 ist letzter in `UNLOCK_IDS`); `version = SAVE_V_KARTENRAND`. Doc-Kommentar «NU-1 Kartenrand: neue Felder leer, U7 nach wonSpice (R970 E2). Wirft nie.»

## Tests (`tests/sim/expedition-save.test.ts`)

- **AK-23:** `SAVE_VERSION === SAVE_V_KARTENRAND`; ein Stand `SAVE_VERSION − 1` (Fixture AK-41) lädt nur über `migrateKartenrand` (Spion bzw. Ergebnis `version === SAVE_VERSION` mit den neuen Feldern); `serialize` schreibt `version: SAVE_VERSION`. Stand `SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }`, `not.toThrow()`.
- **AK-41:** Fixture **nur** aus frischer Serialisierung: `foldBackKartenrand(JSON.parse(serialize(w)))`; zwei Welten: (1) `w` mit `won`, `wonMerchants`, `wonSpice` = true und `U7` (nach `tickUnlocks`) → geladen mit `'U7'`; (2) ohne `wonSpice` → ohne `'U7'`; beide `expedition null`, `seaRevealed` und `finds` `[]`. Quellscan im selben Test: Datei enthält kein Muster `version:\s*\d` und kein `toBe\(\d+\)` neben `version`.
- **AK-42:** gültiger Stand mit `wonSpice true`, `'U7'` aus `unlocked` entfernt → «Beschädigter Spielstand».
- **AK-24** (`it.each`, je K-Regel mindestens ein Fall, Basis = gültiger Stand mit Expedition in `card`, von Hand gebaut aus den Defs): Expedition ohne `wonSpice`; zwei Kartenhäuser; Kartenhaus auf Insel 1; doppelte Karte; `card` mit falschem `leg`; ungerades `extra`; `extra` > 2·`cardIndex`; Fundstück doppelt; `seaRevealed` doppelt; unbekanntes Schiff; Gebiet schon aufgedeckt; `left` 0 in `leg`; `left` 601 in `back`; `wait` > 0 in `leg`; `done true` in `leg`; Ladung 0 bzw. 1,5 bzw. Summe 51; Ladung nicht in `GOOD_IDS`-Reihenfolge; Schiff in `leg` mit `to` ≠ null; `boarding` mit Route ohne Heimat; zusätzlicher Schlüssel.
- **AK-43** (a): `finds` `['F2']` (Lücke), `['F3']` bei `seaRevealed ['wrecks']` (falsche Liste), `['F3','F1']` bei `seaRevealed ['wrecks','skerries']` (vertauscht) → abgewiesen; `['F1','F3']` dort → `ok`.
- **AK-44** (b): Phase `leg` mit `leg = sections + extra + 1` → abgewiesen.
- **AK-46** (d): `cards` mit Karte aus `poolOf('north')` bei Gebiet `wrecks` → abgewiesen.
- Alle Fälle `expect(() => deserialize(t)).not.toThrow()`.

## Schritte

- [ ] `git show main:src/sim/save.ts | rg -n "SAVE_VERSION ="` ins Ledger; `SAVE_V_KARTENRAND` = dieser Wert + 1.
- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/expedition-save.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen (Felder, Konstante, Migration, Prüfungen, Faltung). Danach Pins laut `pins.md` (T02-Zeilen).
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/sim/save*.test.ts tests/sim/scenario-saves.test.ts tests/sim/trial-save.test.ts tests/sim/council-save.test.ts tests/sim/farOrder-save.test.ts tests/sim/helpers.test.ts tests/sim/balance-crises.test.ts tests/sim/buyPct.test.ts; echo EXIT=$?` → 0.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: NU-1 Weltfelder, Save-Schritt, Ladeprüfung Expedition (T02)`.
