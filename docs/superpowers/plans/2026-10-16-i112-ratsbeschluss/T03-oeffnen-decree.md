# T03 · Öffnen und `decree`

`tech-sim-engineer` · ≈ 35 Tools · AK 1, 2, 3, 4 · blocked-by: T02 · Test zuerst (rot vor Umsetzung)

Dateien: `src/sim/council.ts`, `src/sim/tick.ts`, `tests/sim/council.test.ts`.

## Umsetzung

1. `tickCouncil(world)`: früher Ausstieg, wenn kein Eintrag `null` ist; sonst höchste Hausstufe `max` über `world.buildings`
   (alle Inseln, Id-Reihenfolge, kein RNG) und für jedes `n ∈ {2, 3, 4}` mit `n ≤ max` und `council[n] === null` → `'open'`.
   Nie zurück auf `null` (Abriss und Abstieg schliessen nicht, Spec §3.2.1).
2. `step` (`tick.ts`): Aufruf direkt nach `tickPopulation(world)` (Aufstieg passiert dort); Doc-Kommentar von `step` ergänzen.
3. `decreeReason(world, tier: unknown, side: unknown): string | null` (Prüfreihenfolge, ändert nichts):
   ungültige Stufe (nicht 2/3/4, auch Nicht-Zahl) → `'Ungültige Stufe'`; ungültige Seite → `'Ungültige Seite'`;
   `council[tier] === null` → `'Beschluss nicht offen'`; `'A' | 'B'` → `'Schon beschlossen'`.
4. `decree(world, tier: unknown, side: unknown): Result`: Grund → `fail(reason)`, Welt unverändert; sonst `council[tier] = side`, `ok`.
   Kein Geld, keine Amtsstube, keine Tempo-Prüfung (Pause erlaubt, P-4 wie `setEdict`). Wirft nie.
5. `openCouncilTiers(world): CouncilTier[]` (aufsteigend) als Lesefunktion für UI und Tests.

## Tests (`council.test.ts`, Testnamen mit AK-Nummer)

- «AK-1 decree auf neue Welt»: je Stufe `{ ok: false, reason: 'Beschluss nicht offen' }`, `JSON.stringify(world)` vorher = nachher.
- «AK-2»: Szenario mit gesetztem Haus (`tests/sim/helpers.ts`/`scenarios.ts`, z. B. `settledHouse`) Stufe 2, ein `step` → `{2: 'open', 3: null, 4: null}`;
  Stufe 3 → `{2: 'open', 3: 'open', 4: null}`; Stufe 4 → alle `'open'`; Haus auf zweiter Insel zählt.
- «AK-3»: einziges Stufe-2-Haus abreissen (`demolish`) → `council[2]` bleibt `'open'`; nach `decree(w, 2, 'A')` Abstieg auf 1 (Haus-Stufe setzen,
  `step`) → bleibt `'A'`.
- «AK-4»: `decree(w, 2, 'A')` ok, `council[2] === 'A'`; `decree(w, 2, 'B')` → `'Schon beschlossen'`, Wert `'A'`; Stufen `1`, `5`, `'2'`, `NaN` und
  Seiten `'C'`, `undefined`, `null` → `ok: false`, `expect(() => …).not.toThrow()`.
- Zwei offene Stufen: `openCouncilTiers` = `[2, 3]`, Reihenfolge nach Stufe (Spec §7).

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/sim/council.test.ts tests/sim/tick.test.ts; echo EXIT=$?` ·
`npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` (Zahlen gleich; `council` wird nur geschrieben). Commit `feat: Rat öffnen und decree (I-112)`.
Nach Task-Review OK: Controller zweigt Strang U ab (`git worktree add .worktrees/i112-ui -b feat/i112-ui feat/i112`).
