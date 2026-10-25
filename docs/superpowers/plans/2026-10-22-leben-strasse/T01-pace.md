# T01 · `pace.ts`: Tempofaktor und Gehuhr (P1)

Umsetzer `art-rendering-engineer` · ≈ 30 Tools · AK-T1, AK-T2 · Strang 1 (`.worktrees/leben-strasse`) · Spec: `docs/superpowers/specs/2026-10-22-leben-strasse-design.md`, P1 Regel 1

## Dateien

- neu: `src/render/pace.ts`, `tests/render/pace.test.ts`
- nicht ändern: alles andere (`life.ts`/`errands.ts` kommen in T02/T03)

## Verhalten

1. `paceFactor(speed: number): number`: 0 → 0, 1 → 1, 2 → 1,6, 4 → 2,4; alles andere (NaN, undefiniert, 3, negativ) → 1. Tabelle als benannte Konstante `PACE`, Kommentar: absichtlich unter linear, Feinabstimmung T08.
2. Konstanten (einzige Stelle): `SPEED_WALK = 1.2` bleibt in `life.ts` (`WALK_SPEED`), hier `SPEED_CARRY = 1.5`, `SPEED_LOAD = 1.3`, `STRIDE = 0.8`, `MAX_DT_MS = 100`.
3. Gehuhr: `walkClock(world: World, timeMs: number, speed?: number): number` liefert `walkMs`; Zustand in `WeakMap<World, { at: number; walkMs: number }>`. Je Aufruf: `dt = timeMs - at`; `dt < 0` (Zeit läuft zurück) oder erster Aufruf: `walkMs` bleibt/beginnt bei `timeMs` ohne Wurf; sonst `walkMs += min(dt, MAX_DT_MS) · paceFactor(speed)`. Nicht endliches `timeMs` wie 0 behandeln. Gleicher `timeMs` zweimal: kein Zuwachs.
4. Reine Funktion `paceFactor` ohne Zustand; `walkClock` ist der einzige Zustand, schreibt nie in die Welt (`World` nur als Schlüssel).

## Testfälle (rot zuerst)

- **T1** vier Faktoren exakt; `NaN`, `undefined`, 3, -1 → 1.
- **T2** Zuwachs `min(dt,100)·f` für f = 1, 1,6, 2,4; `dt = 500` wächst nur um `100·f`; f = 0 steht; Wechsel 1 → 2 → 0 → 4: Uhr monoton, kein Sprung (Zuwachs je Schritt höchstens `100·2,4`); `timeMs` rückwärts wirft nicht und setzt neu; zwei Welten haben getrennte Uhren; `JSON.stringify(world)` vorher/nachher gleich.

## Prüfschritte / Task-Review

Gezielter Test Exit 0, `tsc`, eslint/prettier. Reviewer: kein `Date.now()`, keine Abhängigkeit von DOM, Tabellenwerte nur hier.
