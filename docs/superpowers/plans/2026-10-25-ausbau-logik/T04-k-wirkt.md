# T04 AL-2b k wirkt: Zyklus, Drossel-Unterhalt, Determinismus, Laufzeit

Persona `tech-sim-engineer` · Strang A · Tools ≈ 75 · AK-AL-10, 11, 12 (je ohne Teil 4), 13, 14, 15, 16, 17, 44, 45, 46 (Unterhalt-Teil), Review Focus 1 und 5 · blocked-by T03 · **Messschritt: Last ≤ 4 nötig.**

Spec: R5, R6, Randfälle, Anhang 02 N4, AK-AL-10 … 17, 44, 45; Plan P-3, P-4, P-9.

**Files:** Modify `src/sim/levels.ts`, `src/sim/defs/buildings.ts` (`THROTTLED_UPKEEP_PCT = 50` neben `PAUSED_UPKEEP_PCT`), `src/sim/economy.ts` (Aufruf `buildingUpkeep(world, b)`), `src/sim/levelChecks.ts` (Unterhaltszeile in `levelChipDetail`: «Unterhalt 7 statt 9 (gedrosselt)», Werte je Minute wie das Panel heute), `src/ui/upkeepRank.ts`, `src/ui/panelView.ts`, `src/ui/inspect.ts` (nur Signatur-Anpassung `buildingUpkeep(world, b)`), Tests `tests/sim/levelRules.test.ts`, `tests/sim/levels.test.ts`, `tests/sim/pause.test.ts`, `tests/sim/levelDefsMock.test.ts`, `tests/ui/upkeepRank.test.ts`, `tests/ui/panelView.test.ts`; Create `tests/sim/levelStress.test.ts`.

**Interfaces:**

```ts
// levels.ts
export function cycleOf(world: World, b: Building): number | undefined; // Stufenzyklus von k, dann effectiveCycle (Rat, Inselvorteil) wie heute
export const upkeepOf = (b: Building): number;                          // bleibt u(g)
export const buildingUpkeep = (world: World, b: Building): number;       // R6: paused → ceil(u(g)·PAUSED/100); k < g → u(k) + ceil((u(g) − u(k))·THROTTLED/100); sonst u(g)
```

`cycleOf` ändert nur die Eingabe von `effectiveCycle`: `levelCycle(b, k)` statt `levelDef(b)?.cycle` (I-201/I-210 setzen auf das Ergebnis auf, Konflikt nach Symbol). Ein brennender Betrieb mit k < g zahlt Drossel (Brand ≠ Pause, Review Focus 5). Produktionsschritt in `production.ts` bleibt unverändert; N4 ist heute schon erfüllt (`progress >= cycle` → 1 Einheit, `progress = 0`) und wird nur getestet.

## Schritte

- [ ] **Tests zuerst** (`levelRules.test.ts`, ausser genannt):
  - **AK-AL-10** k = 1 … 3 (Fischer 40/24/16 ohne Vorteil), `b.level` bleibt g. **AK-AL-11** Glashütte g 3, k 2 auf Glas-Vorteilsinsel → `cycleOf` = `effectiveCycle(w, isl, 'glassworks', 30)`; mit Ratsbeschluss (Muster `tests/sim/council*.test.ts`) gleich `effectiveCycle` mit Rat.
  - **AK-AL-12** Fischer g 3, k 1 → 7; Brennerei g 3, k 2 → 30; k = g → 9 / 34. **AK-AL-13** Fischer g 3, k 1, `paused` → 5; `levelChipText` null. **Review Focus 5:** brennender Fischer g 3, k 1 → 7.
  - **AK-AL-14** Bürgerhaus bei Tick t abgerissen → ab `t + LEVEL_RECHECK_TICKS` (aus Defs gelesen) `runningLevel` 2; neues Bürgerhaus → spätestens nach N wieder 3. **Review Focus 1:** brennendes Bürgerhaus hält k 3; im selben Tick abgerissen → k 2 sofort.
  - **AK-AL-15** zwei gleiche Läufe mit Abriss (1 800 Ticks) → gleiches `serialize`; Lauf mit `serialize`/`deserialize` nach 300 Ticks + 900 → gleiches `serialize` **und** je Tick gleiches `runningLevel` je Betrieb; serialisierter Betrieb hat dieselben Schlüssel wie vor der Änderung (kein k-Feld).
  - **AK-AL-16** Abriss und alternativ `house.tier` 3 → 2 des einzigen Bürgerhauses: k 3 → 2, Chiptext «Läuft wie Stufe 2: Keine Meister im Umkreis 8 …», `level` 3. **AK-AL-17** Nachbarhütten B (Abstand 2) und C (Abstand 3) zu A (g 3): beide Bauten `ok`, A k 2, B k 1 ohne Chip; Abriss C → A k 3.
  - **AK-AL-44** beide Fälle aus Anhang 02 und Summe der Einheiten über das Fenster. **AK-AL-45** Brennerei g 3 ohne Wache: `'normal'` k 2 → `'off'` k 3 → zurück k 2; zwei Läufe gleich; Save/Load im Tick des Wechsels + 600 Ticks gleich.
  - **AK-AL-46 (Unterhalt)** in `levelDefsMock.test.ts`: `THROTTLED_UPKEEP_PCT` 100 per `vi.mock` der Defs → `buildingUpkeep` = u(g).
  - **Stress-Szene** `levelStress.test.ts` (P-3 b, nur API, die auch auf main existiert): Heimatinsel, ≈ 300 Gebäude, davon ≈ 60 Betriebe mit `level` 3 (per Feld gesetzt), Häuser gemischt; 1 800 × `step`; Assertion: zwei Läufe gleiches `serialize`. Muss auf main **und** Branch laufen.
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/levelRules.test.ts tests/sim/levelDefsMock.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen** (`levels.ts`, `economy.ts`, Signatur in UI; `levelChipDetail`-Unterhaltszeile).
- [ ] **Grün:** `npx vitest run tests/sim/levelRules.test.ts tests/sim/levelChecks.test.ts tests/sim/levelDefsMock.test.ts tests/sim/levels.test.ts tests/sim/pause.test.ts tests/sim/levelStress.test.ts; echo EXIT=$?` → 0; `npx vitest related --run src/sim/levels.ts src/sim/economy.ts src/ui/upkeepRank.ts src/ui/panelView.ts --reporter=json --outputFile=.studio/qa/ausbau-logik/rot-T04.json; echo EXIT=$?` → 0 bis auf `balance-upgrade.test.ts` (P-9: Ergebnis und Abweichung ins Ledger, nicht anfassen).
- [ ] **Rot-Menge belegen (P-9, R942):** `node -e "const r=require('./.studio/qa/ausbau-logik/rot-T04.json');console.log(r.testResults.filter(t=>t.status==='failed').map(t=>t.name).join('\n')||'(keine)')"; echo EXIT=$?` → genau eine Zeile `…/tests/sim/balance-upgrade.test.ts` (oder `(keine)`). Liste und Messwert (erwartete/gemessene Ausbauzahl aus der Fehlermeldung) ins Ledger. Mehr als diese Datei rot → **Stopp**, an den Controller.
- [ ] **Balancing:** `npx vitest run tests/sim/balance.test.ts <Baseline-Liste T00>; echo EXIT=$?` → 0 (Controller baut nie aus).
- [ ] **Messschritt Laufzeit (P-3, Last ≤ 4 nötig, `make messfenster` vorher):** Worktree `.worktrees/ausbau-base` detached auf `git merge-base main HEAD`, `tests/sim/levelStress.test.ts` dorthin kopieren (nicht committen). Wand an Wand abwechselnd base/Branch je 3 Läufe: (a) `npx vitest run tests/sim/balance-upgrade.test.ts --reporter=json --outputFile=…`, (b) `npx vitest run tests/sim/levelStress.test.ts --reporter=json --outputFile=…`. Median je Seite und Last je Lauf ins Ledger. Schwelle (a) ≤ +10 %, (b) ≤ +50 %. **Vorbehalt (a):** auf der Branch ist `balance-upgrade.test.ts` hier rot (geänderte Ausbauzahl, P-9), die Laufzeit also nicht gleichwertig zur Basis. (a) nur zusammen mit (b) werten: Rückfall-Entscheid stützt sich auf (b); (a) > +10 % allein → Vorbehalt ins Ledger, gültige (a)-Messung grün in T10. Darüber: Rückfall 1 (Häuser/Wachen je Insel einmal je `step` sammeln, lebt nur im Aufruf) umsetzen und neu messen; reicht das nicht → Stopp, Befund an den Controller (Rückfall 2 nur mit ADR). `levelStress.test.ts` selbst ≤ 500 ms, sonst Tickzahl senken (Wert im Bericht).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`. Worktree `ausbau-base` danach entfernen.
- [ ] **Commit:** `feat: laufende Stufe wirkt auf Zyklus und Unterhalt (AUSBAU-LOGIK T04)`.
