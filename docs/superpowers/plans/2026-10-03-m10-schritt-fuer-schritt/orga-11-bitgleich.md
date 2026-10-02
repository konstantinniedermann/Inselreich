> Teil des Plans M10, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Bitgleich-Messung (BG)

**BG-1** (am Ende von Tasks 1, 2, 3, 4; der Implementierer führt sie aus und kopiert die Ausgabe in den Bericht):

```bash
git diff <BASIS> -- tests/sim/balance.test.ts tests/sim/controller.ts src/sim/defs/tiers.ts src/sim/defs/goods.ts \
  src/sim/defs/timing.ts package.json package-lock.json            # leer
VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance.test.ts --silent=false 2>&1 | grep -E "winTick|minMoney"
#   erwartet: winTick: 6050, minMoney: 57
npx vitest run tests/sim/balance-crises.test.ts                     # alle grün (OFF_REFERENCE, OFF_FINGERPRINT 0xbfeac8c6,
#   normal: Sieg 7050, minMoney 56; Laden mitten im Brand und im Sturm)
npx vitest run tests/sim/unlocks.test.ts -t "AK-S1-17"              # ab Task 2: buildColony mit unlockAll gleich
```

**BG-2** (Task 5): `npx vitest run tests/sim/unlock-timeline.test.ts --silent=false` mit den Sollwerten Spec 9.3 und
`VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-merchants.test.ts --silent=false` (ohne Änderung an der Datei) mit
den Werten aus R162 (erster Kaufmann 8550, zweites Ziel 10 100, Bürger-Endzustand 7300 / 1490, `minMoneyAfterWin`
212). **Weicht ein Wert ab: nicht nachstellen**, Messwerte an den Controller, Meldung an L0 (R74).

**BG-3** (vor dem Final-Review, Controller auf `feat/m10-ui` nach dem Merge von `main`): BG-1 und BG-2 vollständig;
zusätzlich Determinismus ad hoc in einer temporären Testdatei (nicht committen, R164 QA 1):

```ts
// tests/sim/zz-bg3.test.ts — TEMPORÄR, nach dem Lauf löschen
import { expect, it } from 'vitest';
import { deserialize, serialize } from '../../src/sim/save';
import { createWorld } from '../../src/sim/world';
import { buildColony, runColony, startColony } from './controller';

const end = (unlockAll: boolean): string => {
  const w = createWorld(3, { crisisLevel: 'normal', unlockAll });
  buildColony(w, { fireStation: true });
  return serialize(w);
};
it('BG-3 buildColony normal, mit und ohne unlockAll, je zweimal gleich', () => {
  for (const all of [false, true]) expect(end(all)).toBe(end(all));
});
it('BG-3 Laden zwischen U4 und U5 (Tick 2000) ändert den Endstand nicht', () => {
  const w = createWorld(3, { crisisLevel: 'normal' });
  const { layout, t } = startColony(w);
  expect(runColony(w, layout, t, { fireStation: true }, (x) => x.tick >= 2000)).toBe(true);
  expect(w.unlocked).toEqual(['U0', 'U2', 'U3', 'U4']);
  const r = deserialize(serialize(w));
  if (!r.ok) throw new Error(r.reason);
  runColony(r.world, layout, t, { fireStation: true });
  expect(serialize(r.world)).toBe(end(false));
});
```

`npx vitest run tests/sim/zz-bg3.test.ts` → 2 passed; Ausgabe ins Ledger; Datei löschen (`git status` sauber).
