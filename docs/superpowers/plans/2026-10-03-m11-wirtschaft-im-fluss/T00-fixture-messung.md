> **Task-ID:** T00 (Paket M11-P1, Stufe 0) — eine Datei
> **AK-IDs:** keine eigenen; Vorbedingung für AK-SAV-02 (Fixture) und AK-BAS-06 (Ist-Protokoll für den Neupin-Vergleich)
> **blocked-by:** Gate Plan, M10 gemergt (`<BASIS>` laut Ledger)
> **Strang:** `feat/m11-sim` · Worktree `.worktrees/m11-sim` · Implementierer `tech-sim-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-11-bitgleich-neupin.md](orga-11-bitgleich-neupin.md) · Spec Anhang 02 C/E

## T00: Fixture `save-v5.json` und Ist-Messung der M10-Basis

**Ziel:** Vor jeder Code-Änderung einen echten v5-Spielstand (Sturm aktiv) als Fixture einchecken und die Laufdaten der
M10-Basis protokollieren, damit T01 die Migration v5 → v6 an einem echten Stand prüft und T03 gegen den Ist-Stand
vergleichen kann.

**Code-Fakten (Ist `<BASIS>`, src = `801c279`):**

- `tests/sim/controller.ts:279` `startColony(w)` → `{ layout, t }`; `:296` `runColony(w, layout, t, opts, stop?)` hält nach
  dem ersten Schritt mit `stop(w) === true` und gibt `true` zurück; `minMoney`/`endMoney` in `Trajectory` (`:261`).
- `tests/sim/balance-crises.test.ts:71` `NORMAL = { fireStation: true }`; `:150` AK-B2-06 erwartet Sturm aktiv ab Tick 2601.
- `src/sim/save.ts:19` `SAVE_VERSION = 5`; `tests/sim/node-shim.d.ts` deklariert `writeFileSync` (keine `@types/node`).
- `.prettierignore` enthält `tests/sim/fixtures/` (M10).
- Vorab-Probe des Plans (Scratchpad-Kopie von `<BASIS>`, ohne Repo-Änderung): bei Tick 2650 `version 5`, `crisis =
{ period 0, kind 'storm', from 2601, until 2900 }`, `money 1059`, `unlocked ['U0','U2','U3','U4']`, Auftrag Periode 2,
  kein Gebäude `burning`, JSON ≈ 212 KB.

**Erwartete Dateien:**

- Neu: `tests/sim/fixtures/save-v5.json`
- Ändern: `tests/sim/save.test.ts` (neuer `describe` am Dateiende)
- Ledger (nicht im Repo): `.superpowers/sdd/m11/ledger.md` im Hauptcheckout (Abschnitt „T00 Ist-Messung")
- Doku: keine (reine Testdaten); `docs/beobachtungen.md` nur bei Befund
- **Nicht anfassen:** `src/`, `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, alle übrigen Fixtures

## Schritte

- [ ] **Schritt 0: Basis prüfen.** `git -C .worktrees/m11-sim log -1 --format=%h` = `<BASIS>`;
      `git diff --stat 801c279 <BASIS> -- src` leer (sonst Meldung an den Controller, nicht weiterarbeiten).

- [ ] **Schritt 1: Test zuerst** — am Ende von `tests/sim/save.test.ts` (Import `readFileSync` ist schon da, Zeile 1):

```ts
// Fixture erzeugt auf <BASIS> (= <SHA>) mit dem temporären Test tests/sim/gen-save-v5.test.ts (Plan M11 T00):
// Controller Seed 3, Krisen normal mit Feuerwache, angehalten bei Tick 2650 (Sturm aktiv ab 2601), serialize.
describe('M11 Fixture save-v5 (Anhang 02 E)', () => {
  it('T00 save-v5.json roh: version 5, ohne taxCarry/eff/level, Sturm aktiv bei Tick 2650; lädt', () => {
    const json = readFileSync('tests/sim/fixtures/save-v5.json', 'utf8');
    const raw = JSON.parse(json) as Record<string, unknown>;
    expect(raw.version).toBe(5);
    expect(raw.tick).toBe(2650);
    expect('taxCarry' in raw || 'upkeepCarry' in raw).toBe(false);
    const crisis = raw.crisis as { kind: string; from: number };
    expect(crisis.kind).toBe('storm');
    expect(crisis.from).toBeLessThanOrEqual(2650);
    for (const b of Object.values(raw.buildings as Record<string, Record<string, unknown>>))
      expect('eff' in b || 'level' in b).toBe(false);
    expect(deserialize(json).ok).toBe(true); // nach T01: lädt als v6 (AK-SAV-02)
  });
});
```

Der Test prüft bewusst nur den Rohinhalt und `ok`, nicht die geladene Version (bleibt nach T01 grün).

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/sim/save.test.ts -t "T00"` → rot mit
      `ENOENT: no such file or directory, open 'tests/sim/fixtures/save-v5.json'`.

- [ ] **Schritt 3: Fixture erzeugen** (Muster M10 `gen-save-v4`). Temporärer Erzeuger, **nicht einchecken**:

```ts
// tests/sim/gen-save-v5.test.ts — TEMPORÄR, nach der Erzeugung löschen
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { serialize } from '../../src/sim/save';
import { createWorld } from '../../src/sim/world';
import { runColony, startColony } from './controller';

it.runIf(import.meta.env.VITE_GEN_SAVE_V5)('erzeugt tests/sim/fixtures/save-v5.json', () => {
  const w = createWorld(3, { crisisLevel: 'normal' });
  const { layout, t } = startColony(w);
  if (!runColony(w, layout, t, { fireStation: true }, (x) => x.tick >= 2650))
    throw new Error('Tick 2650 verfehlt');
  const c = w.crisis;
  if (w.version !== 5 || w.tick !== 2650 || c?.kind !== 'storm' || c.from !== 2601)
    throw new Error(`Stand ${w.tick} ${JSON.stringify(c)}`);
  writeFileSync('tests/sim/fixtures/save-v5.json', serialize(w));
});
```

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/m11-sim
VITE_GEN_SAVE_V5=1 npx vitest run tests/sim/gen-save-v5.test.ts      # 1 passed
rm tests/sim/gen-save-v5.test.ts
grep -o '"version":5' tests/sim/fixtures/save-v5.json && grep -o '"tick":2650' tests/sim/fixtures/save-v5.json \
  && grep -o '"kind":"storm"' tests/sim/fixtures/save-v5.json      # alle drei treffen
git status --short   # nur save-v5.json und save.test.ts
```

Weicht der Stand ab (kein Sturm, anderer `from`): Erzeuger **nicht** anpassen, Meldung an den Controller (R74).

- [ ] **Schritt 4: Ist-Messung der Basis** (vor T01, gleicher Code). Befehle und Erwartung (Plan-Vorabmessung auf
      `<BASIS>`, Spec Anhang 03 `base`):

```bash
VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance.test.ts tests/sim/balance-crises.test.ts \
  tests/sim/balance-merchants.test.ts tests/sim/unlock-timeline.test.ts --silent=false 2>&1 | tee /tmp/m11-t00.log
```

| Lauf (Seed 3)         | Erwartet Ist (M10)                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| Ref `off`             | Sieg 6050, `minMoney` 57, `endMoney` 212, erste Siedler/Bürger 350/3850, Fingerabdruck `0xbfeac8c6`             |
| Gebäude Ref           | kontor 1, house 4, lumberjack 2, fisher 10, chapel 1, sheepfarm 5, weaver 5, school 1, canefarm 3, distillery 3 |
| „normal" + Feuerwache | Sieg 7050, `minMoney` 56, `endMoney` 211, erste Bürger 4750                                                     |
| „mild"                | Sieg 6250, `minMoney` 13, `endMoney` 40                                                                         |
| Kaufleute             | Sieg 6050, Endzustand 7300, erster Kaufmann 8550, Ziel 2 10 100, `minMoneyAfterWin` 212, Endgeld 2681           |
| Freischalt-Ticks M10  | `off` U2/U3/U4/U5/U6 150/350/550/3850/6050, Schule/Rumkette gebaut 3700; „normal" …/4750/7050, Bau 4600         |

Ins Ledger (Hauptcheckout, `.superpowers/sdd/m11/ledger.md`) als Abschnitt „T00 Ist-Messung `<BASIS>`" schreiben: SHA,
Befehl, die Werte der Tabelle (gemessen), Fixture-Kennzahlen (Tick, `money`, `crisis`, `unlocked`). Jede Abweichung von
der Tabelle → Stopp, Meldung (R74); die Tabelle nicht anpassen.

- [ ] **Schritt 5: Grün.** `npx vitest run tests/sim/save.test.ts` grün; `npx vitest run` grün (keine anderen
      Änderungen); `npx tsc --noEmit`; `make check`. Testzählbefehl (index.md) → `tests/sim/save.test.ts n -> n+1`.

- [ ] **Schritt 6: Commit und Push.**

```bash
git add tests/sim/fixtures/save-v5.json tests/sim/save.test.ts
git commit -m "test: M11-T00 Fixture save-v5.json auf <BASIS> (Sturm Tick 2650, Anhang 02 E)"
git -C .worktrees/m11-sim push -u origin feat/m11-sim
```

## Rot-Beleg-Tabelle

| Test                    | Erwartete Meldung vor der Umsetzung        |
| ----------------------- | ------------------------------------------ |
| T00 save-v5.json roh: … | `ENOENT … tests/sim/fixtures/save-v5.json` |

## Risiken/Randfälle

- Der Erzeuger muss vor jeder `src`-Änderung laufen; sonst ist die Fixture kein M10-Stand (Ledger-SHA prüfen).
- Die Fixture ist gross (≈ 212 KB); sie steht unter `.prettierignore`, Prettier nicht darauf laufen lassen.
- Der Testname trägt kein AK (T00 hat keines); der Abdeckungs-Grep zählt ihn nicht, das ist gewollt.
