# T05 Save, Migration, Prüfregeln; Controller

Persona `tech-sim-engineer` · Strang A · Tools ≈ 50 · AK-BS-15, AK-BS-03 (Save-Teil), AK-BS-17 (P-11) · blocked-by T04.

**Files:** Modify `src/sim/save.ts` (41 KB, nur abschnittsweise lesen: `SAVE_VERSION`, `migrateV17ToV18`, `isValidTrial`, `isWellFormed`, `deserialize`). Create `tests/sim/petitionsSave.test.ts`, `tests/sim/petitionsController.test.ts`. `tests/sim/save.test.ts` (Zeittest, 1900 Zeilen) bleibt unberührt; Bricht ein bestehender Save-Test, weil eine Rückfalt-Hilfe (`foldBack*`, `drop*` in `tests/sim/helpers.ts`) das neue Feld nicht entfernt, ist dort genau eine Ergänzung erlaubt (`delete x.petitions`, Muster `dropTrial`). Die Datei liest du nur per `rg` und abschnittsweise; sie bleibt unter 30 KB, die Änderung kommt in den Bericht. Alles Weitere an `helpers.ts` meldest du dem Controller vorher (P-10).

## Interfaces

- Consumes: `PetitionsState` (T01), `PETITION_IDS`, `PETITION_MAX_OPEN`, `PETITION_ANSWER`, `PETITIONS[id].delay`/`.duration`, `FRUGAL_TICKS`.
- Produces in `save.ts`:
  - `export const SAVE_VERSION = <main-Wert aus T00> + 1;` (Kommentar: «main + 1 beim Merge, R909»).
  - `export function migrateV<n>ToV<n+1>(raw: Record<string, unknown>): void`; `n` ist der main-Wert. Die Funktion setzt `raw.petitions = { on: false, next: null, open: [], effects: [] }` und `raw.version = n + 1`. In `deserialize` steht sie hinter der letzten bestehenden Migration.
  - `function isValidPetitions(raw: Record<string, unknown>): boolean`: Regeln wörtlich nach Anhang 04 (unten), Aufruf in `isWellFormed`. Jede Verletzung → `{ ok: false, reason: 'Beschädigter Spielstand' }`, nie ein Wurf.

Anhang 04, zum Abhaken im Test:

- `on` boolean; `next` null oder ganze Zahl > `tick`; bei `on: false` sind `open` und `effects` leer und `next` null.
- `open.length ≤ PETITION_MAX_OPEN`; je Marke `id ∈ PETITION_IDS`, keine Id doppelt, `drawnAt` ganz und `tick − PETITION_ANSWER − max(delay) ≤ drawnAt ≤ tick`, `amount` ganz ≥ 0.
- Ohne `answer`: `drawnAt + PETITION_ANSWER > tick` und kein `dueTick`. Mit `answer ∈ {'yes','no'}`: `tick < dueTick ≤ tick + max(delay)`.
- `anchor` nur bei Bitten mit Anker, ganze Zahl (ein abgerissener Anker ist gültig).
- `effects.length ≤ 2 × PETITION_IDS.length`; je Eintrag `id` gültig, `answer` gültig, `tick < until ≤ tick + Dauer` (Dauer = `duration` bei «Ja», `FRUGAL_TICKS` bei «Nein»).

## Schritte

- [ ] **Tests zuerst** in `tests/sim/petitionsSave.test.ts` (nur `SAVE_VERSION - 1` und `SAVE_VERSION + 1`, nie eine feste Nummer, Anhang 02 B-7):
  - `AK-BS-15 Rundlauf`: Welt mit offener Marke (eine beantwortet, eine offen) und laufenden Wirkungen aller Phase-1-Arten (`overcrowd`, `frugal`, `cycle`, `storage`) → `deserialize(serialize(w))` ok und `serialize` gleich.
  - `AK-BS-15 Migration`: Stand aus `serialize(createWorld(3))` mit `version = SAVE_VERSION - 1` und ohne `petitions` → ok, `petitions` im Aus-Zustand; Weiterspielen über 2000 Schritte mit `serialize` gleich dem ungeladenen Lauf (ungeladene Welt ebenfalls aus). Review Focus 4: derselbe Stand mit `won: true` zieht in 60 000 Schritten nie (`open` bleibt leer).
  - `AK-BS-15 Abweisung` (je eigener Fall, Ergebnis `{ ok: false, reason: 'Beschädigter Spielstand' }`, kein Wurf): drei offene Marken; Id `'guild'`; doppelte Id; `answer: 'maybe'`; `dueTick` ohne `answer`; `until` über der Höchstdauer; `on: false` mit Wirkung; `next` als Text. Dazu `version = SAVE_VERSION + 1` → «Unbekannte Version».
  - `AK-BS-03 Save mitten in der Frist`: Lauf A 3000 T durch; Lauf B speichert und lädt bei `drawnAt + 600` einer offenen Marke, dann weiter bis 3000 → gleiches `serialize`.
  - `Review Focus 2`: Stand mit Stoff 117 und laufendem B9 lädt; bei Ablauf 100 und `spoiled.cloth === 17`.
- [ ] **`tests/sim/petitionsController.test.ts` `AK-BS-17`** (P-11): `w = createWorld(seed, { petitionsOn: true })`, `startColony` plus `runMerchants(w, layout, newMerchantTrajectory())` → `w.wonMerchants === true` bis `MERCHANT_TICK_LIMIT`; der Lauf zieht mindestens eine Marke (sonst prüft er nichts), keine Antwort. Seed wie `balance-merchants.test.ts`. Dauer < 30 s.
- [ ] Rot: `npx vitest run tests/sim/petitionsSave.test.ts tests/sim/petitionsController.test.ts; echo EXIT=$?`.
- [ ] Umsetzen.
- [ ] Grün plus Teilbeleg: beide Dateien, `npx vitest run tests/sim/save.test.ts; echo EXIT=$?` (bestehend, unverändert grün; Zeittest, darum einzeln), `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] Commit `feat: I-210 Save petitions mit Migration und Prüfregeln`.
