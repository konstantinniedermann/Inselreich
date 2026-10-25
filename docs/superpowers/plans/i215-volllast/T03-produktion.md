# T03 · Produktion: Ruhe, Löschen, Uhr, Exaktwerte

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 55 Tools · blocked-by: T02 · AK-VL-05, -06, -07, -08, -09, -13, -14, -19, -21 (`production`-Teil)

**Files:** Modify `src/sim/production.ts`, (falls nötig) `src/sim/overtime.ts`; Test `tests/sim/overtime.test.ts`, `tests/sim/overtime-source.test.ts`.

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`. Läuft parallel zu Strang B: höchstens zwei gleichzeitige Testläufe.

## Inhalt

1. **`tickProduction`:** in der Schleife nach dem `produces`-Filter und **vor** `advance`: `clearExpiredOvertime(world, b)`.
   Damit erreicht die Löschung auch stillgelegte und brennende Betriebe (Gate-Auflage 7).
2. **`advance`:** nach dem `paused`-Zweig, vor `!b.connected`:
   `if (overtimeState(world, b).phase === 'rest') { b.state = 'resting'; return false; }` — kein Fortschritt, keine
   Entnahme, `progress` bleibt; `eff` zählt 0 über den bestehenden Rückgabewert.
3. Sonst nichts: Volllast wirkt nur über `cycleOf` (T02). Sturm, Eingang, Lager unverändert.

## Tests (`tests/sim/overtime.test.ts`, Welten Spec Anhang 02 A; Start immer über `startOvertime`)

- **AK-VL-05:** Weberei St. 1 in Volllast, `setPaused(true)`: `buildingUpkeep` 8, `progress` und Lager unverändert über 100 `step`, `overtimeState.remaining` −100 exakt. In der Ruhe stillgelegt: `buildingUpkeep` 8 (nicht 4), Zustand `'paused'`; `setPaused(false)` → nach dem nächsten `step` `'resting'` (Review-Fokus 2).
- **AK-VL-06:** `startOvertime` bei Tick T → `ok`, `overtimeAt` T, `overtime`/1800. Nach 1800 `step`: `rest`/1200. Nach 1199 weiteren: `rest`/1. Nach einem weiteren: Feld fehlt, `normal`/0, `startOvertime` wieder `ok`.
- **AK-VL-07:** Weberei St. 1 ohne Wolle (`waitingInput` die ganze Volllast): Phasenwechsel bei denselben Schritten wie AK-VL-06, keine Wolle entnommen, kein Stoff, Feld nach 3000 `step` gelöscht. Dasselbe mit Brand während der Volllast (`outageUntil` gesetzt, `state = 'burning'`) und mit Strasse nach dem Start abgerissen (`notConnected`). Zusätzlich `paused` und `burning` bei `d ≥ OVERTIME_TICKS + OVERTIME_REST_TICKS` (Feld direkt gesetzt): nach einem `step` fehlt das Feld.
- **AK-VL-08:** `progress` 13 bei Ruhebeginn (aus dem Lauf AK-VL-19 B oder direkt gesetzt): über alle 1200 Ruhe-Schritte `progress` 13, Lager Wolle und Stoff unverändert, Zustand `'resting'`, `eff` sinkt in jedem Schritt (bis 0 oder streng fallend, solange > 0). Nach der Ruhe: `progress` 14.
- **AK-VL-09:** Weberei St. 1 `progress` 40, Wolle vorhanden, `startOvertime` → nach einem `step` Stoff +1, `progress` 0, Wolle unverändert (keine zweite Entnahme). Review-Fokus 3: dasselbe ohne Wolle im Lager → Stoff +1, Wolle bleibt 0.
- **AK-VL-13:** Weberei in Volllast bzw. in der Ruhe `demolish` → `ok`; Geld- und Lagerzugang gleich dem Abriss derselben Weberei ohne Volllast in einer Vergleichswelt (gleicher Seed, gleiche Schritte); Gebäude fehlt in `world.buildings`.
- **AK-VL-14 (P-9):** Fischer St. 1 (`stormAffected`, `c` 40, `c'` 30), Sturm wirkt (`world.crisis = { kind: 'storm', from ≤ tick, until ≥ tick + 100, … }`, Form der bestehenden Sturm-Tests, kein Zufall). `world.tick` vor dem Start gerade (Vorbedingung `expect(w.tick % 2).toBe(0)`, notfalls einen `step` vorab). Zähle `j` bis zum ersten Fisch: mit Volllast **exakt 60**, ohne Volllast (Vergleichswelt) **exakt 80**. Gegenprobe Lesart: Start bei ungeradem Tick → **59**. Drei Zahlen ins Ledger (Rot und Grün).
- **AK-VL-19 (P-9):** Weberei St. 1, Wolle = `STORAGE_CAP`, Stoff 0, keine Verbraucher (keine Häuser, kein Vertrag, kein Auftrag), `progress` 0, `upkeepCarry` 0, Weberei einziger Posten mit Unterhalt (Kontor 0; Vorbedingung `totalUpkeep(w) === 15`). Lauf A: 3000 `step` → Stoff **60**. Lauf B (gleicher Seed): `startOvertime`, 3000 `step` → Stoff **47**, `startOvertime` danach `ok`. `moneyA − moneyB` = **59** exakt. Zusätzlich `formatGameTime(OVERTIME_TICKS)` «3:00», `formatGameTime(OVERTIME_REST_TICKS)` «2:00» (`src/ui/time.ts`, rein).
- **Review-Fokus 5:** zwei Webereien derselben Insel, Start mit 500 Schritten Abstand → Phasen je Betrieb unabhängig.

## Quellscan (AK-VL-21 `production`-Teil)

`src/sim/production.ts` importiert `overtimeState` und `clearExpiredOvertime` aus `./overtime`, ruft beide auf, enthält keinen Namen `OVERTIME_`; `clearExpiredOvertime(` steht im Rumpf von `tickProduction` vor `advance(`.

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/overtime.test.ts tests/sim/overtime-source.test.ts; echo EXIT=$?` → ≠ 0. Ins Ledger die Ist-Werte der Rot-Läufe für AK-VL-19 (Stoff B, Geld-Differenz) und AK-VL-14 (`j` gerade/ungerade, mit und ohne Volllast), z. B. per `expect(...).toBe(...)`-Meldung.
- [ ] Umsetzen (Inhalt 1–2).
- [ ] **Grün:** derselbe Befehl → 0; Ist-Werte 47 / 59 / 60 / 80 / 59 ins Ledger. **Weicht ein Wert ab: Stopp, Befund an den Controller, Erwartung nicht anpassen.**
- [ ] Regression: `npx vitest run tests/sim/pause.test.ts tests/sim/production*.test.ts tests/sim/crises*.test.ts tests/sim/tick.test.ts; echo EXIT=$?` → 0; **Balancing** `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` → 0 und `git diff main -- tests/sim/balance.test.ts` leer.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-215 Ruhe und Löschen im Produktionsschritt (T03)`.
