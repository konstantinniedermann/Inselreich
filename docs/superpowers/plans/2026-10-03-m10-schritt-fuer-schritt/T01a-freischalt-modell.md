> **Task-ID:** Task 1 (Paket M10-S1A) — Teil 1 von 5
> **AK-IDs:** AK-S1-01, -02, -03, -04, -05 (a, b, Strukturteil c), -10, -11, -12, -13, -14 (a, b, c1, d–g), -15, -16 (BG-1), -20 (Fixture), `RF-1`
> **blocked-by:** Gate Plan, Gate Merge M8
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** **T01a-freischalt-modell.md** (diese) · [T01b-freischalt-modell.md](T01b-freischalt-modell.md) · [T01c-freischalt-modell.md](T01c-freischalt-modell.md) · [T01d-freischalt-modell.md](T01d-freischalt-modell.md) · [T01e-freischalt-modell.md](T01e-freischalt-modell.md)

## Task 1: S1a — Vorlauf Fixture v4, Freischalt-Modell, Save v5

**Paket** M10-S1A · **Implementierer** `tech-sim-engineer` (sonnet; Roster-Text `tech-save-engineer` im Briefing) ·
**Worktree/Branch** `.worktrees/m10-sim` · `feat/m10-sim` (ab `<BASIS>`) · **blocked-by** Gate Plan, Gate Merge M8 ·
**AK** AK-S1-01, -02, -03, -04, -05 (a, b, Strukturteil c), -10, -11, -12, -13, -14 (a, b, c1, d–g), -15, -16 (BG-1),
-20 (Fixture), `RF-1`

**Files:**

- Create: `tests/sim/fixtures/save-v4.json` (Schritt 1), `src/sim/defs/unlocks.ts`, `src/sim/unlocks.ts`,
  `tests/sim/unlocks.test.ts`
- Modify: `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/tick.ts`, `src/sim/save.ts`
- Test: `tests/sim/unlocks.test.ts`, `tests/sim/save.test.ts`; bewusst geändert nach T-1, T-2, T-3
  (`tests/sim/save.test.ts`, `tests/sim/balance-crises.test.ts`, per Lauf weitere)

**Interfaces:**

- Consumes: `<BASIS>` (M8 gemergt: Save v4, `migrateV3ToV4`, `tierLock`, `citizens`, `wonMerchants`);
  `startColony`/`runColony`/`buildColony` aus `tests/sim/controller.ts` (unverändert).
- Produces: alles unter „Gemeinsame Schnittstellen" für `types.ts` (ohne Task-4-Teile), `defs/unlocks.ts`,
  `unlocks.ts` (mit `taxBlocks: false`), `world.ts`, `save.ts`. `canPlace`, `buy`, `deliverOrder` bleiben in diesem Task
  **unverändert** (Sperren wendet erst Task 2 an).

- [ ] **Schritt 1: Vorlauf auf `<BASIS>`, VOR jeder Code-Änderung — Fixture v4.**
      Prüfen: `git -C .worktrees/m10-sim log -1 --format=%h` = `<BASIS>`; `git diff --stat 9460ab9 <BASIS> -- src/sim`
      leer (sonst melden, Fixture trotzdem erzeugen; W1). Temporären Erzeuger anlegen:

```ts
// tests/sim/gen-save-v4.test.ts — TEMPORÄR, nach der Erzeugung löschen
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { serialize } from '../../src/sim/save';
import { setTaxLevel } from '../../src/sim/tax';
import { createWorld } from '../../src/sim/world';
import { runColony, startColony } from './controller';

it.runIf(import.meta.env.VITE_GEN_SAVE_V4)('erzeugt tests/sim/fixtures/save-v4.json', () => {
  const w = createWorld(3, { crisisLevel: 'normal' });
  const { layout, t } = startColony(w);
  if (!runColony(w, layout, t, { fireStation: true }, (x) => x.tick >= 4800))
    throw new Error('Tick 4800 verfehlt');
  if (w.version !== 4 || w.tick !== 4800 || t.firstCitizen !== 4750)
    throw new Error(`Stand ${w.tick}/${t.firstCitizen}`);
  const r = setTaxLevel(w, 'high');
  if (!r.ok) throw new Error(r.reason);
  writeFileSync('tests/sim/fixtures/save-v4.json', serialize(w));
});
```

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/m10-sim
VITE_GEN_SAVE_V4=1 npx vitest run tests/sim/gen-save-v4.test.ts      # 1 passed
rm tests/sim/gen-save-v4.test.ts
grep -o '"version":4' tests/sim/fixtures/save-v4.json && grep -o '"tick":4800' tests/sim/fixtures/save-v4.json \
  && grep -o '"taxLevel":"high"' tests/sim/fixtures/save-v4.json   # alle drei treffen
git add tests/sim/fixtures/save-v4.json
git commit -m "test: Fixture save-v4.json auf <BASIS> (Vorlauf M10-S1A, Spec 8.2)"
```

Erwartung (Spec 8.2): erster Bürger 4750, bei 4800 läuft der Auftrag der Periode 4 (angeboten 4200, fällig 4800).
Weicht der Bürger-Tick ab: Erzeuger **nicht** anpassen, Meldung an den Controller (R74). `tests/sim/fixtures/` steht
schon in `.prettierignore`.
