# T04 · UI-Helfer `titheView.ts`, Bau-Vorschau

Strang B · Persona `tech-ui-engineer` · Modell sonnet · ≈ 45 Tools · blocked-by: T02 (Review OK) · AK-ZE-09, -10, -21, -23 · Spec «Bedienung», Tech 4; R982 Auflagen 2, 3

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`. Läuft parallel zu T03: höchstens 2 gleichzeitige Testläufe.

**Worktree:** `git worktree add -b feat/i223-ui .worktrees/i223-ui feat/i223-zehnt; echo EXIT=$?` (Stand A nach T02-Review OK). Rückführung nach A per Merge durch den Controller nach T04-Review OK.

**Files:** Create `src/ui/titheView.ts`, `tests/ui/titheView.test.ts`; Modify `src/ui/balancePreview.ts` (nur Z. 3 und 20). Kein Eingriff in `src/sim/` (Strang A besitzt es) und in `inspect.ts`/`app.ts` (T05).

## Interfaces

- Consumes (T01): `TITHE_GOOD`, `TITHE_UNITS_PER_100`, `TITHE_CARRY_DIVISOR`, `TITHE_SWITCH_LOCK`, `TitheTier`, `TitheGood`, `TitheLoss`, Welt-Felder. (T02): `titheSplit`, `titheActive`, `moneyTaxes`, `StepReport.titheLost`. Bestand: `cashReach` (`cashReach.ts`), `formatGameTime`, `perMinute`, `signedNum` (`time.ts`), `townhallActive`, `townhallReason`, `GOODS`, `UPKEEP_INTERVAL`.
- Produces (`titheView.ts`, DOM-frei):
  ```ts
  export const TITHE_TEXT: Record<TitheTier, string>; // Spielertext je Stufe (Spec, wörtlich)
  export const TITHE_LOCK_NOTE: string; // «Nach dem Umschalten bleibt der Zehnt 3 Minuten, wie er ist.»
  export const TITHE_OVERFLOW_NOTE: string; // «Ist das Lager voll, verfällt der Rest.»
  export function titheTooltip(tier: TitheTier): string; // TITHE_TEXT[tier] + ' ' + TITHE_OVERFLOW_NOTE
  export function titheLockText(w: World, tier: TitheTier): string; // «wieder änderbar in m:ss» oder ''
  export function titheFlowText(w: World, tier: TitheTier): string; // Steuerzeile bei Zehnt, sonst ''
  export function titheConfirmLines(w: World, tier: TitheTier): string[]; // Dialoginhalt
  export interface TitheLossState {
    sum: Record<TitheGood, number>;
  }
  export function newTitheLossState(): TitheLossState;
  export function collectTitheLoss(
    s: TitheLossState,
    r: Pick<StepReport, 'titheLost'>,
    tick: number,
  ): string[];
  ```

## Inhalt

1. `titheLockText` wie `taxLockText` (`taxView.ts:45`) mit `titheLockedUntil`, gleicher Wortlaut.
2. `titheFlowText`: `titheOn[tier]` false → `''`. An, aber `!townhallActive` → `` `Zehnt ruht: ${townhallReason(w)}` ``. Sonst `` `${geld} / min · ${ware} ${GOODS[g].name} / min` `` mit `geld = Math.floor(split.money[tier] × 3 / 100)` (gleich `tierTaxPerMinute`), Ware je Minute = zₜ × 600 × `TITHE_UNITS_PER_100[g]` ÷ `TITHE_CARRY_DIVISOR`, auf eine Nachkommastelle **abgerundet**, Komma als Dezimalzeichen. zₜ der Stufe = `split.tithe[g]` (je Gut genau eine Stufe). 48 Pioniere erfüllt, normal → «0 / min · 17,2 Werkzeug / min».
3. `titheConfirmLines`: [`TITHE_TEXT[tier]`, `TITHE_LOCK_NOTE`, Kassensatz, ggf. Zusatzzeile, ggf. Auflagenzeile]. taxes′ = `moneyTaxes({ ...w, titheOn: { ...w.titheOn, [tier]: true } })`; `reach = cashReach(w.money, taxes′, w.stats.upkeep)`. `reach` ≠ null → `reach.text` als Kassensatz, dann «Im Minus kannst du nicht bauen und nicht zukaufen.»; sonst «Kasse bleibt im Plus (`signedNum(perMinute(taxes′ − upkeep, UPKEEP_INTERVAL))` / min).» Die Kassenzeile beginnt mit «Nach dem Umschalten: » vor dem `cashReach`-Text (Spec Bedienung). `w.trial.active !== null` → zusätzlich «Auflage läuft: kein Zukauf. Mit leerer Kasse kannst du auch nicht bauen.»
4. `collectTitheLoss`: addiert `r.titheLost[g] ?? 0` auf `s.sum[g]`; bei `tick % UPKEEP_INTERVAL === 0` je Gut mit Summe > 0 eine Meldung `` `Lager voll: ${n} ${GOODS[g].name} verfallen` `` (Reihenfolge `TITHE_GOODS`), danach alle Summen 0; sonst `[]`.
5. `balancePreview.ts`: `balanceOf = (w) => moneyTaxes(w) − totalUpkeep(w)`; Import `totalTaxes` entfällt. Doc-Zeile «Geldanteil der Steuer (I-223: ohne Zehnt)».

## Tests (`tests/ui/titheView.test.ts`)

Weltbau über `tests/sim/helpers.ts` (`village`, `placeTownhall`, `setHouse`) mit lokalem `fulfil(b)`; `stats` direkt setzen, wo die Spec es vorgibt.

- **AK-ZE-09:** 48 Pioniere erfüllt, `stats.taxes` 96, `stats.upkeep` 70, `money` 3000, Stufe 1 → Kassenzeile = «Nach dem Umschalten: » + `cashReach(3000, 0, 70)!.text`, enthält «−420 / min», gefolgt von der Minus-Zeile. 120 Siedler erfüllt (`stats.taxes` 840, `upkeep` 400), Stufe 2 → enthält «Kasse bleibt im Plus (+2136 / min).», keine Minus-Zeile. `money = −50`, Stufe 1 → Kassenzeile enthält «Kasse ist leer bei».
- **AK-ZE-10:** Siedler-Welt aus 09 (Kasse bleibt im Plus), Stufe 2, mit `trial.active = 'selfSupply'` → Auflagenzeile enthalten; `trial.active = null` → nicht enthalten.
- **AK-ZE-21:** `s = newTitheLossState()`; Fake-Reports `{ titheLost: { tools: 1 } }` bei Tick 35 und 70, `{}` sonst: Ticks 1…99 → je `[]`; Tick 100 → `['Lager voll: 2 Werkzeug verfallen']`; danach Summe 0. Werkzeug und Stein im selben Intervall → zwei Meldungen, Werkzeug zuerst. Intervall ohne Verlust → `[]`. Neuer Zustand nach «Laden» (`newTitheLossState()`) beginnt bei 0.
- **AK-ZE-23:** 48 Pioniere (Zehnt Stufe 1, Amtsstube) und 120 Siedler (`Geld`), erfüllt, normal; ein `step(w)`: `balanceAfterBuild(w, 'road').before` = `w.stats.taxes − w.stats.upkeep` = 840 − `w.stats.upkeep`; `totalTaxes(w)` = 936. `balanceAfterBuild(w, 'house')`: `after` und `afterMax` ≤ `before` (Pionierhaus zahlt in den Zehnt).
- **Strom:** 48 Pioniere, Zehnt an → `titheFlowText(w, 1)` = «0 / min · 17,2 Werkzeug / min»; Amtsstube `outageUntil` → «Zehnt ruht: Amtsstube wirkt nicht»; Zehnt aus → `''`.
- **Sperre:** nach `setTithe` bei Tick T (Welt direkt: `titheLockedUntil[1] = T + TITHE_SWITCH_LOCK`) → `titheLockText` = «wieder änderbar in 3:00»; nach Ablauf `''`.

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/ui/titheView.test.ts tests/ui/balancePreview.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen (Inhalt 1–5).
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/ui/buildMenu.test.ts tests/ui/panelView.test.ts tests/ui/cashReach.test.ts tests/ui/taxView.test.ts tests/ui/hud.test.ts; echo EXIT=$?` → 0 (Verbraucher der Vorschau und von `stats.taxes`).
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-223 titheView und Vorschau mit Geldanteil (T04)`.
