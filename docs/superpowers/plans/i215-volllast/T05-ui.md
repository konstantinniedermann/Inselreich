# T05 · UI: Helfer, Knopf, Zustand, Unterhaltszeile

Strang B (`.worktrees/i215-ui`, Branch `feat/volllast-ui` von A @ T02) · Persona `tech-ui-engineer` · Modell sonnet · ≈ 65 Tools · blocked-by: T02 · AK-VL-20, -21 (UI-Teil), -22 (Vitest-Teil)

**Files:** Create `src/ui/overtime.ts`, `tests/ui/overtime.test.ts`, `tests/ui/overtime-source.test.ts`. Modify `src/ui/inspect.ts` (45 KB: nur abschnittsweise, `renderBetrieb` ab Zeile ≈ 766, Aktualisierung ab ≈ 1058), `src/ui/app.ts` (Aktion neben `setPaused`, ≈ 931), `src/ui/texts.ts` (`stateInfo`, Fall `'resting'`), `src/ui/panelView.ts` (Unterhaltszeile ≈ 191), `src/ui/hover.ts` (`troubleLine`/`workshopInfo`), `src/style.css`; bestehende `tests/ui/panelView*.test.ts`, `tests/ui/upkeepRank.test.ts` nur bei geänderten Zeilen. Kein `src/sim/`.

Texte, Formeln und Beispiele: **Spec Anhang 01** (A Sperrgründe, B Tooltip, C Zustand und Unterhaltszeile, D Warnungen) — exakt übernehmen. Zahlen nur aus `cycleOf`, `buildingUpkeep`, `upkeepOf`, `overtimeCycle`, `overtimeState` und den Defs; nie Literale. Zeiten `formatGameTime`, Raten `perMinute`, Vorzeichen `signedNum` (`src/ui/time.ts`).

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`. Läuft parallel zu Strang A: höchstens zwei gleichzeitige Testläufe.

## Inhalt

1. **`src/ui/overtime.ts`** (DOM-frei, importiert nur `../sim/*` und `./time`, `./texts`):
   - `overtimeTooltip(world, b): string[]` — Zeilen B1–B5 plus Warnungen (D) als Zeile 6 ff. `c` = `cycleOf` ohne Phase:
     für den Tooltip des **freien** Knopfs ist die Phase `normal`, also `cycleOf(world, b)` direkt; `c'` = `overtimeCycle(c)`;
     `u` = `upkeepOf(b)`, `u'` = `ceil(u × OVERTIME_UPKEEP_PCT / 100)`, `uR` = `ceil(u × PAUSED_UPKEEP_PCT / 100)`;
     `p = Math.round((c / c' − 1) × 100)`.
   - `overtimeLockText(world, b): string | null` — Sperrtext nach A (Phase `overtime`/`rest` mit Restzeit, sonst der Sim-Text aus `overtimeBlockReason`), `null` bei frei.
   - `overtimeWarnings(world, b): string[]` — Tabelle D; Ruhefenster `[tick + OVERTIME_TICKS, tick + OVERTIME_TICKS + OVERTIME_REST_TICKS)`; Vertrag nur mit Ausstossgut **und** Insel, erste Abrechnung `≥ tick + OVERTIME_TICKS` (Rechenweg wie `nextSettleTick`, `orders.ts`), Auftrag nur Gut (`world.order.due`).
   - `overtimeStatusSuffix(world, b): string | null` — «Volllast ‹Restzeit›» bzw. « · Volllast ‹Restzeit›» / « · Ruht ‹Restzeit›» nach C.
   - `overtimeUpkeepNote(world, b): string | null` — «(+48 / min durch Volllast)» bzw. «(−42 / min in der Ruhe)», `null` bei stillgelegt oder normal.
2. **Knopf** in `renderBetrieb` direkt nach dem Stilllegen-Knopf: `node('button', 'btn overtime-btn', 'overtime')`, Text «Volllast», `title` = Tooltip (Zeilen mit `\n`), gesperrt (`disabled`) mit sichtbarem Sperrtext (`data-field="overtime-reason"`) nach A; nur für Betriebe mit Zyklus (Gründe 1 und 2 → kein Knopf). Aktualisierung im bestehenden Refresh-Block wie `pause` (nur bei Änderung schreiben). Klick → `actions.startOvertime(id)`.
3. **Aktion** im Interface neben `setPaused(id, paused)`: `startOvertime(id: number): void`; in `app.ts` `startOvertime(world, id)` aus `../sim/overtime`, bei `!r.ok` `showError(friendlyReason(world, r.reason))`, danach `refresh()`.
4. **Zustand:** `stateInfo` Fall `'resting'` → «Ruht ‹Restzeit›» (`ok: false`), Volllast-Zusatz nach C; Hover `'resting'` → «Ruht noch ‹Restzeit›». `stateInfo` hat nur `tick`: `overtimeState` nimmt `Pick<World, 'tick'>` (T01), Aufruf `overtimeState({ tick }, b)`.
5. **Unterhaltszeile** `panelView.ts`: bestehender Wert, dahinter `overtimeUpkeepNote`. `upkeepRank.ts` unverändert (Zeilenwert enthält die Phase).
6. **CSS:** `.overtime-btn` wie `.pause-btn`; Sperrtext wie `feast-reason` (`negative`).

## Tests

- **`tests/ui/overtime.test.ts` (AK-VL-20, AK-VL-22 Vitest-Teil):** `overtimeTooltip` Weberei St. 1 (Heimat, ohne Rat und Vorteil) liefert exakt die fünf Zeilen aus Anhang 01 B (Zahlformat über `perMinute`/bestehende Formatierung, nicht als hart codierter String erzeugt, aber gegen den Beispieltext geprüft); Rinderfarm St. 3 Zeilen Ausstoss/Unterhalt/Ruhe. `overtimeLockText`: `remaining` 1330 → «Volllast läuft noch 2:13», 650 → «Ruht noch 1:05», 590 → «Ruht noch 59 s»; stillgelegt, brennend, ohne Strasse → Sim-Text. `overtimeWarnings`: je eine Zeile für `waitingInput`, `storageFull`, Vertrag des Stoffs auf derselben Insel (Beispiel Tick 4000 → «Ruhe überdeckt die Vertragsabrechnung in 3:30»), Auftragsfrist im Fenster; **keine** Warnung ohne Vertrag und Auftrag, für einen Vertrag eines anderen Guts, einer anderen Insel, eine Frist ausserhalb des Fensters. `overtimeStatusSuffix` und `overtimeUpkeepNote`: «Volllast 2:13», «Wartet auf Wolle · Volllast 2:13» (über `stateInfo`), «(+48 / min durch Volllast)», «(−42 / min in der Ruhe)», stillgelegt → `null`. Welten: `createWorld(seed, { unlockAll: true, crisisLevel: 'off' })`, `putBuilding` aus `tests/sim/helpers.ts` (nur importieren), Vertrag/Auftrag als Objektform der bestehenden UI-Tests (keine `Contract`-Literale neu erfinden: vorhandene Fabrik bzw. Typ verwenden).
- **`tests/ui/overtime-source.test.ts` (AK-VL-21 UI-Teil):** `src/ui/overtime.ts` importiert `OVERTIME_*` bzw. `PAUSED_UPKEEP_PCT` aus `../sim/defs/…` und `overtimeCycle`/`overtimeState` aus `../sim/overtime`; enthält keine Zahlenliterale ausser `0`, `1`, `100` (ohne Kommentare und Strings).

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/ui/overtime.test.ts tests/ui/overtime-source.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen (Inhalt 1–6).
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/ui/panelView.test.ts tests/ui/inspect.test.ts tests/ui/upkeepRank.test.ts tests/ui/levelReads.test.ts; echo EXIT=$?` → 0.
- [ ] Sichtprobe (kein Ersatz für T06): `npm run build; echo EXIT=$?` → 0.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-215 Volllast-Knopf, Tooltip und Zustandszeilen (T05)`. Nach Review OK merged der Controller `feat/volllast-ui` in `feat/volllast` (`git merge --no-ff`, kein Rebase); Konflikte nur in mechanisch berührten Zeilen (P-3) erwartet.
