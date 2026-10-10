# T03 · `src/sim/edicts.ts`: Abfrage, Prüfung, `setEdict`, Abriss (TDD)

Strang sim · Worktree `.worktrees/m13-e1-sim` · Umsetzer `tech-sim-engineer` (sonnet, Fortsetzung) · AK-M13E1-03, 04, 05, 14, 15, PLAN-M13-02, PLAN-M13-03 · Spec R1, R2, R6, §5 · blocked-by T02 · Grösse M (≈ 25 Tools)

**Files:**

- Create: `src/sim/edicts.ts`, `tests/sim/edicts.test.ts`
- Modify: `src/sim/build.ts` (`demolish`: Amtsstube → `world.edict = null`)
- Lesen: `src/sim/townhall.ts` (`townhallActive`, `townhallReason`), `src/sim/tax.ts` (Muster `setTierTaxLevel`), `tests/sim/helpers.ts` (`placeTownhall`, `foldBackToV10`), `tests/sim/townhall.test.ts` (Testwelt mit Amtsstube, Brand über `outageUntil`)

## Schnittstelle

```ts
// src/sim/edicts.ts — Edikte der Amtsstube (M13-E1, Spec §3). Kein Zufall, wirft nie.
// Importiert nur './townhall', './types', './defs/*' (townhall.ts bleibt Blatt, PLAN-B9).
export function activeEdict(w: World): EdictId | null; // townhallActive(w) ? w.edict : null (R1.2)
export function activeEdictDef(w: World): EdictDef | null; // EDICTS[activeEdict(w)] oder null
/** Grund, den setEdict liefern würde (Schritte 1–6 aus R2), oder null; ändert nichts. Auch für die UI (T09). */
export function edictReason(w: World, id: unknown): string | null;
export function setEdict(w: World, id: unknown): Result; // R2 Schritt 7 bei edictReason === null
```

**Prüfreihenfolge `edictReason`** (Spec R2, wörtlich):

1. `id !== null` und nicht (`typeof id === 'string' && Object.hasOwn(EDICTS, id)`) → `'Ungültiges Edikt'` (auch `undefined`, `''`, `0`, `NaN`, `[]`, `{}`);
2. `w[EDICT_UNLOCK] !== true` → `'Erst nach dem Bürger-Ziel'`;
3. `!townhallActive(w)` → `townhallReason(w)`;
4. `id === w.edict` → `id === null ? 'Kein Edikt aktiv' : 'Edikt bereits aktiv'`;
5. `w.tick < w.edictLockedUntil` → `'Edikt-Sperrzeit'`;
6. `id !== null && w.money < EDICT_COST` → `'Zu wenig Geld'`.

**`setEdict` Schritt 7:** `id !== null` → `money −= EDICT_COST`; `edict = id`; `edictLockedUntil = tick + EDICT_LOCK`; `ok`. Aufheben kostet nichts und sperrt ebenfalls.

**Abriss (R6.1):** in `demolish` nach dem Löschen: `if (b.defId === 'townhall') world.edict = null;` — `edictLockedUntil` bleibt; Erstattung unverändert. Kein Import von `edicts.ts` in `build.ts` nötig.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** `tests/sim/edicts.test.ts`, `describe('M13-E1 Edikte: Aktion')`. Testwelt (Spec §10): `createWorld(3, { unlockAll: true })`, `won = true`, `placeTownhall(w)`, `money = 1000`, `tick = 1000`; als `beforeEach`-Fabrik `edictWorld()` exportieren, T05/T06 nutzen sie weiter.
  1. `AK-M13E1-03` Ablauf: Werte und Ticks genau wie in der Spec (Sperre 4000, 7000, 10 000; `money` 400 / 0).
  2. `AK-M13E1-04` Gründe: alle Fälle der Spec; «ohne Amtsstube» = Welt ohne `placeTownhall`; «brennt» = `townhall.outageUntil = tick + 100`; Reihenfolge: `won = false` ohne Amtsstube → `'Erst nach dem Bürger-Ziel'`; gleiches Edikt in der Sperre → `'Edikt bereits aktiv'`; `money −50`: `'trade'` → `'Zu wenig Geld'`, Aufheben nach Sperrende → ok.
  3. `AK-M13E1-05` wirft nie: `id` ∈ {`null`, `undefined`, `''`, `'saving'`, `'trade'`, `'welfare'`, `'x'`, `0`, `NaN`, `[]`} × Welt {mit/ohne `won`} × {mit/ohne Amtsstube}: Ergebnis hat `ok`; bei `ok: false` `serialize(w)` vorher = nachher; `edictReason` ändert nie etwas (gleiche Probe). **PLAN-M13-03:** `readFileSync('src/sim/edicts.ts')` enthält weder `'./rng'` noch `Math.random` (die Welt trägt keinen RNG-Zustand, `rng.ts` ist zustandslos).
  4. `AK-M13E1-14` Abriss: Werte der Spec; Geld nach Abriss = vorher + `refundCost(paidCost(townhall)).money`; neue Amtsstube bei 2500 über `placeTownhall`.
  5. `AK-M13E1-15` Freischaltung: `won = false` → abgelehnt, dann `won = true` → ok; v10-Stand: `deserialize(JSON.stringify(foldBackToV10(JSON.parse(serialize(w)))))` einer Welt mit `won` und Amtsstube (ohne Edikt) → ok, danach `setEdict(loaded, 'saving')` ok.
  6. `activeEdict`: erlassen + Amtsstube brennt → `null`, `w.edict` bleibt; nicht angebunden (Weg entfernen, `recomputeConnectivity`) → `null`; Ausfall vorbei → wieder das Edikt (Teil von R1.2/R6.2; Wirkungen prüfen T04–T06).

```bash
npx vitest run tests/sim/edicts.test.ts; echo EXIT=$?   # rot: Modul fehlt
```

- [ ] **Schritt 2: Umsetzen.** `edicts.ts` mit Kopfkommentar, `build.ts` eine Zeile. `setEdict` ruft `edictReason` und schreibt nur bei `null`.

```bash
npx vitest run tests/sim/edicts.test.ts tests/sim/imports.test.ts tests/sim/townhall.test.ts tests/sim/save-v11.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Edikte erlassen, wechseln, aufheben (M13-E1 T03)`.

## Bericht

Je AK Testname und Rot-Zeile, Exit-Codes, Zeilenzahl `edicts.ts`, `git diff --stat main...HEAD`. Danach meldet der Controller dem UI-Controller: Sim-Stand T03 bereit (`git merge --no-ff feat/m13-e1-sim`).
