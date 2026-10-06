> **Task-ID:** T00 · **AK-IDs:** Vorbedingung AK-E1-05, AK-M12-B5 (Fixture v7), AK-M12-B2 (v7-Formen)
> **blocked-by:** Gate Plan, **E0-T03** (Form v7 in `feat/m12-e0`) · **Strang:** sim, `feat/m12-e1`, Worktree
> `.worktrees/m12-e1` · `tech-sim-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints · Spec Anhang 03 B (Fixture je Version als erster Commit),
> Anhang 04 „lead-qa Teil B" (Fixture je Version, Kette, „Unbekannte Version" je Teil)

## T00: Schritt 0 — Fixture `save-v7.json` und v7-Pins auf unverändertem v7-Code

**Ziel:** Bevor E1 eine Zeile `src/` ändert, liegen ein echter v7-Spielstand und die Pins der v7-Formen von
`createWorld` im Repo. Sie beweisen später: v7 lädt in v8, und die Heimat bleibt bitgleich.

**Code-Fakten:** Nach E0-T03 hat `createWorld` die v7-Form (`islands: [Heimat]`, `Building.island`).
`tests/sim/fixtureV6.ts` enthält `fixtureV6Run()` (Lauf „normal" bis Tick 3000 mit Brand und Auftrag, dann Käufe,
Amtsstube, Aufstiegsstopp, Holzfäller-Ausbau) — reine Sim-Aktionen, auf v7-Code gleich lauffähig.
`tests/sim/helpers.ts` hat `fnv1a32`, `sortedJson`. `tests/sim/e0Pins.ts` ist das Muster für Pin-Dateien.

**Dateien:** neu `tests/sim/fixtureV7.ts`, `tests/sim/fixtures/save-v7.json`, `tests/sim/e1Pins.ts`;
`tests/sim/save.test.ts` (neuer `describe`). **Kein** `src/`.

## Schritte

- [ ] **0 Basis:** `git merge feat/m12-e0` in `feat/m12-e1` (nur Merge), bis E0-T03 enthalten ist.
      `npx vitest run tests/sim/save.test.ts` grün, `grep -n "SAVE_VERSION = 7" src/sim/save.ts` trifft.
- [ ] **1 Rezept** `tests/sim/fixtureV7.ts`:

```ts
// Rezept für save-v7.json (M12 E1 Schritt 0, Anhang 03 B): gleicher Lauf wie save-v6.json, auf v7-Code.
import type { World } from '../../src/sim/types';
import { fixtureV6Run } from './fixtureV6';

/** Stand save-v7.json: Rezept von save-v6.json (Tick 3000, Brand, Auftrag, Sperren) auf dem v7-Code. */
export function fixtureV7Run(): World {
  return fixtureV6Run().w;
}
```

- [ ] **2 Fixture schreiben** (einmalig, Scratch-Test im Scratchpad oder `node -e` über Vitest, nicht eingecheckt):
      `writeFileSync('tests/sim/fixtures/save-v7.json', serialize(fixtureV7Run()))`. Danach Datei prüfen:
      `"version":7`, `"islands":[{` vorhanden, kein `"width"` auf oberster Ebene.
- [ ] **3 Pins** `tests/sim/e1Pins.ts` — Hash und Länge von `serialize(createWorld(…))` der vier Varianten auf
      v7-Code (Werte aus dem Lauf eintragen, nicht schätzen):

```ts
// Pins M12 E1 Schritt 0: v7-Formen von createWorld vor E1 (fnv1a32 + Länge der exakten Zeichenkette).
export const V7_FORMS: Record<string, { hash: number; length: number }> = {
  off: { hash: 0x00000000, length: 0 }, // T00: Wert aus dem Lauf
  unlockAll: { hash: 0x00000000, length: 0 },
  mild: { hash: 0x00000000, length: 0 },
  normal: { hash: 0x00000000, length: 0 },
};
```

      Die Nullwerte sind **nur** das Format; Schritt 4 läuft erst rot, dann werden die gemessenen Werte eingetragen
      und der Test ist grün. Kein Nullwert darf im Commit stehen.

- [ ] **4 Tests** in `save.test.ts`, `describe('M12 E1 Schritt 0 (Anhang 03 B)')`:

```ts
const FIX7 = 'tests/sim/fixtures/save-v7.json';
it('T00 save-v7.json roh', () => {
  const json = readFileSync(FIX7, 'utf8');
  const r = JSON.parse(json);
  expect(r.version).toBe(7);
  expect(r.tick).toBe(3000);
  expect(r.islands).toHaveLength(1);
  expect(r.width).toBeUndefined();
  expect(Object.values(r.buildings).every((b: any) => b.island === 0)).toBe(true); // eslint-disable-line @typescript-eslint/no-explicit-any
  expect(r.crisis.kind).toBe('fire');
  expect(r.upgradeStops).toEqual([1]);
  expect(deserialize(json).ok).toBe(true);
});
it('T00 Rezept = Fixture v7', () => {
  expect(serialize(fixtureV7Run())).toBe(readFileSync(FIX7, 'utf8'));
});
it('T00 v7-Formen', () => {
  const forms = {
    off: createWorld(3),
    unlockAll: createWorld(3, { unlockAll: true }),
    mild: createWorld(3, { crisisLevel: 'mild' }),
    normal: createWorld(3, { crisisLevel: 'normal' }),
  };
  for (const [k, w] of Object.entries(forms)) {
    const s = serialize(w);
    expect({ hash: fnv1a32(s), length: s.length }, k).toEqual(V7_FORMS[k]);
  }
});
```

- [ ] **5 Rot → grün:** `npx vitest run tests/sim/save.test.ts -t "M12 E1 Schritt 0"` zuerst mit Null-Pins rot
      (Rot-Beleg in den Commit-Text), dann Pins eintragen, grün.
- [ ] **6 Prüfen und Commit:** `make check` grün; `git diff --stat` zeigt nur die vier Testdateien.
      Commit `test: M12 E1 Schritt 0 Fixture save-v7 und v7-Pins` (ein Commit; T00 hat keinen Umsetzungsteil).

**Wiederholung (Risiko R-2):** Ändert E0 nach diesem Commit die v7-Form, wiederholt der Controller Schritte 2–5
nach dem nächsten E0-Merge; das Rezept bleibt.

**Review-Fokus:** Fixture entsteht nur aus dem Rezept auf v7-Code; keine Null-Pins; kein `src/`-Diff; Merge statt
Rebase.
