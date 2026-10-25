# T06 AL-2b Messungen: M-15 neu, Abwärtsspirale

Persona `tech-sim-engineer` · Strang B · Tools ≈ 70 · AK-AL-32b, AK-AL-48 · blocked-by T05 · **Last ≤ 4 nötig** (R920 V1).

Spec: «Balancing-Test», E9 (R908), Anhang 02 N2 (32b), N6, AK-AL-48; Rechnung (d) Spirale, (g); Plan P-9.

**Worktree:** `.worktrees/ausbau-mess`, Branch `feat/ausbau-mess` von `feat/ausbau-logik` @ T05 (Hash vom Controller). Dateien disjunkt zu Strang C und T08.

**Files:** Modify `tests/sim/balance-upgrade.test.ts` (nur Pin-Werte und, nach Ruling, die Variante); Create `tests/sim/balance-ausbau.test.ts`. `tests/sim/controller.ts` **nur** nach L0-Ruling (Rückfall unten) und nur so, dass `tests/sim/balance.test.ts` und die Baselines bitgleich grün bleiben. Keine Datei unter `src/`.

## Teil 1 · AK-AL-32b M-15 neu messen (E9)

- [ ] `make messfenster; echo EXIT=$?`; Last ≤ 4, sonst `waiting`.
- [ ] Ist-Lauf: `npx vitest run tests/sim/balance-upgrade.test.ts; echo EXIT=$?`. Messwerte der Variante (Sieg-Tick, Zahl der Fischer Stufe 2, Zahl mit k = 2) ins Ledger; dafür vorübergehend `console.log` nur lokal, **nicht** committen.
- [ ] **Greift die Variante noch?** (AK-M11B-01: «greift + siegt»). Ja → neuer Pin = gemessene Werte; Abweichung zu 8250 / 11 mit Ursache (welche Fischer scheitern an Fachkräften oder Fischgrund) in den Bericht. **Kein Commit des Pins vor dem Ruling.** Bericht an den Controller mit Ruling-Entwurf «M-15 neu: winTick …, Fischer Stufe 2 …, Ursache …» (R471); `waiting` bis Ruling.
- [ ] Greift sie nicht mehr (keine Ausbauten oder kein Vorteil): **Rückfall nach N2**, Entwurf an den Controller mit beiden Optionen: (a) Variante baut zuerst ein Siedlerhaus im Arbeitsweg der Fischer dazu (Änderung nur im Varianten-Zweig des Controllers, `balance.test.ts` bitgleich), (b) Greift-Bedingung per Ruling anpassen. Den Test nie abschwächen (keine grösseren Toleranzen, kein `skip`).
- [ ] Nach Ruling: Pin bzw. Variante umsetzen; `npx vitest run tests/sim/balance-upgrade.test.ts tests/sim/balance.test.ts <Baseline-Liste T00>; echo EXIT=$?` → 0. Commit `test: M-15 nach Ausbau-Bedingungen neu gepinnt (AUSBAU-LOGIK T06, Ruling R…)`.

## Teil 2 · AK-AL-48 Spiral-Messung (≥ 2 Seeds, R553)

Aufbau je Seed (feste Seeds `[3, 7]`, im Test verdrahtet; Muster `tests/sim/feastWorlds.ts` falls auf main, sonst eigene Helfer in der Testdatei): Heimatinsel, Bürgerviertel mit ≥ 6 Bürgerhäusern (Rum-Bedarf), eine Brennerei g 3 mit Feuerwache, Zuckerrohr-Zulieferung, genau **ein** Bürgerhaus im Arbeitsweg 8 der Brennerei, Lager ohne Rum-Puffer über 20 Einheiten. Zu T0 wird dieses Bürgerhaus abgerissen. Lauf `SPIRAL_TICKS = 3000` (Konstante im Test, Plan-Vorschlag aus N6).

- **Lauf L:** Regeln wie gebaut (k folgt). **Kontrolle K:** dieselbe Welt und derselbe Abriss, aber k = g fest. Umsetzung nur im Test: `vi.mock('../../src/sim/levelRules', async (orig) => { const m = await orig(); return { ...m, runningLevel: (w, b) => (state.fixK ? (b.level ?? 1) : m.runningLevel(w, b)) }; })` mit einem modulweiten `state.fixK`, das nur K setzt (wirkt über `levels.ts` auf Zyklus und Unterhalt). Keine Hintertür in `src/`.
- **Kennzahlen je Seed:** Zahl der Bürgerhäuser am Ende (L gegen K), Rum-Bestand am Ende, Tick des ersten Bürger-Abstiegs (falls einer).
- **Pin:** Erwartung im Test = gemessene Kennzahl, Schwelle Vorschlag «höchstens 1 Bürgerhaus Unterschied» (N6). Kein Commit der Schwelle vor dem Ruling: Bericht an den Controller mit Ruling-Entwurf (Kennzahl, Schwelle, Werte je Seed, Abstand zur Schwelle). Weicht die Messung über die Schwelle ab → Rückfall N6 als Entwurf (`THROTTLED_UPKEEP_PCT` senken bzw. `WORKFORCE_RADIUS` 8 → 10), **kein** neues Design.

## Schritte (Teil 2)

- [ ] **Test zuerst** mit vorläufiger Erwartung `toBeLessThanOrEqual(0)` für die Differenz → Rot-Lauf `npx vitest run tests/sim/balance-ausbau.test.ts; echo EXIT=$?` ≠ 0 (belegt, dass der Aufbau Wirkung misst; ist die Differenz schon 0, ist der Aufbau zu schwach: Hauszahl/Rum-Bedarf erhöhen, nie die Erwartung).
- [ ] Messen (Last ≤ 4), Werte ins Ledger, Ruling-Entwurf an den Controller, `waiting`.
- [ ] Nach Ruling: Erwartung setzen, grün; Dauer der Datei ≤ 500 ms je Seed-Fall angestrebt, sonst Wert im Bericht (R905).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `test: Spiral-Messung Ausbau-Logik (AUSBAU-LOGIK T06, Ruling R…)`. Rückführung nach A per Merge macht der Controller vor T09.
