# T01 · Sim: Defs und reine Prüfung `newHonors`

Umsetzer `tech-sim-engineer` · ≈ 45 Tools · AK-EB-01, AK-EB-02, AK-EB-03, AK-EB-04, AK-EB-05 · blocked-by: T00 · Strang A (`.worktrees/i186-ehrenbuch`, `feat/i186-ehrenbuch`) · Spec §2.1–§2.3, §11 N7, N9

## Dateien

- neu: `src/sim/defs/honors.ts`, `src/sim/honors.ts`, `tests/sim/honors.test.ts`
- ändern: `tests/sim/balance-merchants.test.ts` (nur im Test `AK-BAS-02` zwei Erwartungen und ein Kommentar)
- nicht ändern: `src/sim/types.ts`, `save.ts`, `tick.ts`, `world.ts`, `defs/trials.ts`, alles ausserhalb `src/sim/`

## Verhalten

1. `defs/honors.ts` (Kopfkommentar: Spielwerte, Änderung nur per Ruling; R-EB-1; Schwellen hängen an den Pins 6750/11 500 in `balance-merchants.test.ts`):
   - `type HonorId = 'citizenTown' | 'swiftFound' | 'swiftTrade' | 'stormTrade' | 'spiceTown' | 'realm' | 'monument' | 'stormTrial' | \`trial:${TrialId}\``.
   - `HONOR_IDS: readonly HonorId[]` = die 8 festen in Tabellenreihenfolge (Spec §2.2), dann `TRIAL_IDS.map((id) => \`trial:${id}\`)`.
   - `HONORS: Readonly<Record<HonorId, { name: string; condition: string }>>` mit den Texten aus §2.2; für Auflagen `name: \`Meisterprüfung «${TRIALS[id].name}»\``, `condition: \`Die Auflage «${TRIALS[id].name}» bestehen\``.
   - `HONOR_SWIFT_CITIZEN_TICK = 9000`, `HONOR_SWIFT_MERCHANT_TICK = 18000`.
2. `honors.ts` (DOM-frei, keine Uhr, kein RNG, wirft nie):
   - `interface HonorRun { seed: number; unlockMode: 'stepwise' | 'all' }`.
   - `interface HonorMarks { won; wonMerchants; wonSpice; monumentDone: boolean; kontors: number; passed: Readonly<Partial<Record<TrialId, number>>> }`; `honorMarks(world)` zählt Inseln mit `kontorId !== null` und Einträge in `world.trial.passed` je Id. Keine Weltkopie.
   - `newHonors(prev: HonorMarks, world: World, run: HonorRun | null): HonorId[]` in `HONOR_IDS`-Reihenfolge. Tempo-Stücke nur bei `run !== null && run.seed === world.seed && run.unlockMode === 'stepwise'`. Sturm-Stücke nur bei `world.crisisLevel === 'normal'`. `realm`: `prev.kontors < islands.length` und jetzt `=== islands.length`. `stormTrial`: Summe der `passed` wächst. `trial:<id>`: Zähler der Id wächst. Vergleich mit `world.tick` (Tick nach dem `step`, P-3).
   - Schwellen nur über Import aus `defs/honors.ts`.

## Testfälle (rot zuerst), `tests/sim/honors.test.ts`

- **EB-01:** `HONOR_IDS` gleich der erwarteten Liste (8 fest + `trial:selfSupply`), Länge `8 + TRIAL_IDS.length`. **N9:** `readFileSync('src/sim/honors.ts')` enthält keines von `9000`, `9_000`, `18000`, `18_000`; `defs/honors.ts` exportiert die Werte 9000 und 18000.
- **EB-02:** je Stück drei Fälle mit präparierter Welt (`createWorld(S)`, Felder direkt setzen): nein→ja ergibt das Stück, ja→ja und nein→nein nicht. `prev` jeweils per `honorMarks` vor der Änderung.
- **EB-03:** `won` wechselt mit `world.tick = HONOR_SWIFT_CITIZEN_TICK` → enthält `swiftFound`; mit `+ 1` → nicht (`citizenTown` in beiden). Gleich für `swiftTrade` mit `HONOR_SWIFT_MERCHANT_TICK`. Ticks über die Konstanten, nicht als Literal.
- **EB-04:** Tempo-Stücke fehlen bei `run.unlockMode === 'all'`, `run === null`, `run.seed !== world.seed`; die übrigen Stücke sind gleich. Sturm-Stücke fehlen bei `off` und `mild`. RL-1: `createWorld(S, { unlockAll: true })` mit `run = { seed: S, unlockMode: 'stepwise' }` ergibt `swiftFound` (Kommentar: dokumentiertes Verhalten, Spec RL-1).
- Mehrere Stücke in einem Schritt: Reihenfolge wie `HONOR_IDS`.
- **EB-05:** in `balance-merchants.test.ts`, Test `AK-BAS-02`, ohne neue Simulation: `expect(t.winTick!).toBeLessThanOrEqual(HONOR_SWIFT_CITIZEN_TICK)` und `expect(t.wonMerchantsTick!).toBeLessThanOrEqual(HONOR_SWIFT_MERCHANT_TICK)`, Kommentar P-9 (Pins ändern → Schwellen mitprüfen, R-EB-1). Rot-Beleg (R874 B5, Pflicht): Die Erwartungen importieren die Konstanten, die vor der Umsetzung fehlen; der Umsetzer zeigt den roten Lauf (`npx vitest run tests/sim/balance-merchants.test.ts; echo EXIT=$?`) im Bericht, eine Begründung allein genügt nicht. Im Test-Kommentar den Abstand Pin/Schwelle nennen: 6750 gegen 9000, 11 500 gegen 18 000.

## Prüfungen (Teilbeleg)

- `npx vitest run tests/sim/honors.test.ts tests/sim/balance-merchants.test.ts; echo EXIT=$?` (rot vorher, grün nachher)
- `npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make zeittests; echo EXIT=$?` · `make conflicts; echo EXIT=$?`
- `git diff main...feat/i186-ehrenbuch -- src/sim/types.ts src/sim/save.ts src/sim/tick.ts src/sim/world.ts` leer

Commit: `feat: Meisterstücke als Defs und reine Prüfung (I-186)`
