# T00 · Zeitmessung berührter Tests vorher (R392, E-052)

Plan: [Index](../2026-10-16-i091-treue.md) · Controller selbst, kein Umsetzer · ≈ 8 Tools · blocked-by: UI-HAEPPCHEN-E auf
main gemergt

## Schritte

- [ ] **1 Worktree:** `git worktree add .worktrees/i091 -b feat/i091 plan/i091`, dann `git merge main` (kein Rebase);
      `node_modules` prüfen (`ls node_modules/.bin/vitest`).
- [ ] **2 Ausgangslage festhalten (Ledger):**
  - `grep -n "SAVE_VERSION =" src/sim/save.ts` → Wert `M`; Arbeitsannahme `S = M + 1` an T02 weitergeben.
  - `grep -n "export function orderCardText" -A 40 src/ui/order.ts` → Stand nach UI-E (Zweige mit «voraussichtlich»)
    an T03 weitergeben; Vertragszweig muss unverändert sein, sonst Befund an lead-tech.
  - `grep -rn "ContractEvent\|r\.contract\|ev\.kind" src/ui src/audio` → Liste aller Konsumenten von `ContractEvent`
    an T03 (heute nur `contractNotice`/`announceContract` in `src/ui/order.ts`).
- [ ] **3 Last:** `uptime`; 1-min-Load ≤ 4 (Testsperre R380), sonst `waiting` melden und nicht messen.
- [ ] **4 Messung** (Hintergrund-Bash nach E-037, Abfrage spätestens alle 4 min):

```bash
mkdir -p .studio/qa/i091
npx vitest related --run src/sim/types.ts src/sim/defs/goods.ts src/sim/orders.ts src/sim/save.ts src/sim/world.ts \
  src/ui/order.ts --reporter=json --outputFile=.studio/qa/i091/zeit-vor.json; echo EXIT=$?
```

- [ ] **5 Ledger:** Exit-Code, Anzahl Testdateien, die zehn langsamsten Dateien mit Dauer. Kein Code, kein Commit.

## Prüfschritte

`zeit-vor.json` existiert und enthält mindestens `tests/sim/contract.test.ts`, `tests/sim/save-contract.test.ts`,
`tests/sim/farOrder-save.test.ts` und `tests/ui/order.test.ts`; sonst Befehl wiederholen. `EXIT` ≠ 0 auf main → Befund
an lead-tech (Ausgangslage rot), nicht weiter.

T06 Schritt 6 nutzt **denselben** Befehl mit `zeit-nach.json`.
