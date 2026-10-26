# T02 · Buchung: `titheSplit`, `tickTaxes`, `step`

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 55 Tools · blocked-by: T01 · AK-ZE-01, -02, -03, -04, -06, -11, -12, -13, -22, -25 · Spec Regeln 2–5, 7, 9

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files:** Modify `src/sim/population.ts` (Z. ≈ 240–278), `src/sim/tick.ts`, `tests/sim/tick.test.ts` (nur das `StepReport`-Literal); Modify `tests/sim/tithe.test.ts`.

## Interfaces

- Consumes (T01): Defs `TITHE_*`, `TITHE_TIERS`, `TITHE_GOODS`, Typen `TitheTier`, `TitheGood`, `TitheLoss`, Welt-Felder.
- Produces (`population.ts`):
  ```ts
  export interface TitheSplit {
    money: Record<Tier, number>; // cₜ je Stufe (Steuereinheiten × %), Stufen 3/4 = uₜ
    tithe: Record<TitheGood, number>; // Σ zₜ je Gut (Einheiten × %), ohne Kurs
  }
  export function titheActive(world: World, tier: TitheTier): boolean; // titheOn[tier] && townhallActive(world)
  export function titheSplit(world: World): TitheSplit; // Regel 3 und 7, reine Funktion
  export function moneyTaxes(world: World): number; // ⌊Σₜ cₜ ÷ (TAX_UNIT × 100)⌋
  export function tickTaxes(world: World): TitheLoss; // bisher void
  ```
- Produces (`tick.ts`): `StepReport.titheLost: TitheLoss` (Pflichtfeld, `{}` ohne Verfall), Doc «Zehnt-Ware über der Lagergrenze in diesem Schritt (I-223); nie im Save».

## Inhalt

1. `titheSplit`: uₜ = `taxBaseByTier(world)[t] × effectiveTaxPct(world, t)`; für t in `TITHE_TIERS` mit `titheActive`: pₜ = `TITHE_PCT[t]`, cₜ = ⌊uₜ × (100 − pₜ) ÷ 100⌋, zₜ = uₜ − cₜ, `tithe[TITHE_GOOD[t]] += zₜ`; sonst cₜ = uₜ. Ganzzahlig, keine Gleitkomma-Zwischenwerte ausser der einen Division mit `Math.floor`.
2. `taxUnits` bleibt (Nennsteuer), `totalTaxes` bleibt. `moneyTaxes` aus `titheSplit`.
3. `tickTaxes`: `split = titheSplit(world)`; Geld: `stats.taxes = ⌊Σ money ÷ (TAX_UNIT × 100)⌋`, `taxCarry += Σ money`, Buchung mit `TAX_CARRY_DIVISOR` exakt wie heute. Ware je g in `TITHE_GOODS` **nur wenn `split.tithe[g] > 0`** (sonst `titheCarry` unberührt, Regel 3 letzter Punkt und Regel 9): `titheCarry[g] += split.tithe[g] × TITHE_UNITS_PER_100[g]`; n = ⌊`titheCarry[g]` ÷ `TITHE_CARRY_DIVISOR`⌋; `titheCarry[g] −= n × TITHE_CARRY_DIVISOR`; `got = addStock(home(world), g, n)`; `n − got > 0` → `loss[g] = n − got`. Rückgabe `loss`. Kein `STORAGE_CAP` im Code (P-6).
4. `step`: `const titheLost = tickTaxes(world);` an der bestehenden Stelle (nach `tickPopulation`/`tickCouncil`), Rückgabe `{ lost, contract, titheLost }`; Doc-Zeile von `step` um «Steuern und Zehnt» ergänzen.
5. Importzyklus prüfen: `population.ts` importiert `addStock` aus `./economy` und `home` aus `./world`; `npx madge` gibt es nicht → `rg -n "from './population'" src/sim/economy.ts src/sim/world.ts; echo EXIT=$?` → Exit 1 (kein Rückimport).

## Tests (`tests/sim/tithe.test.ts`)

Testwelt: `village(n, { unlockAll: true })` + `placeTownhall(w)` + `setHouse(b, tier, k)`; «erfüllt» = `supplied`, alle `satisfied`, alle `services` true (Helfer `fulfil(b)` lokal in der Testdatei). Exakte Mengen per direktem `tickTaxes` (kein `step`), ausser AK-ZE-22. Erwartungen gegen Spec-Zahlen; Defs-Werte nur über Importe.

- **AK-ZE-01/25 Pin (vor Inhalt 3 grün laufen, P-9):** 12 Häuser à 4 Pioniere (48, `TIERS[1].maxInhabitants` 4) und 15 Häuser à 8 Siedler (120), also `village(27, …)`, erfüllt, normal, beide `Geld`, `money` M, `taxCarry` 0: nach 600 × `tickTaxes` `money` = M + **5616**, `taxCarry` 0, `stats.taxes` 936; Lager, `titheCarry` unverändert (`toEqual` vorher).
- **AK-ZE-02:** 12 Häuser à 4 Pioniere, Werkzeug 20, `titheOn[1] = true`: nach 100 Aufrufen Werkzeug 22, `titheCarry.tools` 1 760 000, `money` unverändert; nach 600 (ab Start) Werkzeug 37, Übertrag 560 000.
- **AK-ZE-03:** 15 Häuser à 8 Siedler, Stein 10, nur `titheOn[2]`: nach 100 Aufrufen `money` K + 756 (Gegenprobe ohne Zehnt K + 840), Stein 16, `titheCarry.stone` 1 440 000, `stats.taxes` 756.
- **AK-ZE-04:** Fall 02 mit `taxLevels[1] = 'high'` → Werkzeug 23, Übertrag 1 488 000; `'low'` → 22, 32 000.
- **AK-ZE-06:** Fall 02 mit Werkzeug 99 → nach 100 Aufrufen 100, Σ `titheLost.tools` 1; mit 100 → 100, Σ 2; Übertrag beide 1 760 000.
- **AK-ZE-11:** keine Häuser, beide Schalter an, 600 × `step` → Lager, `titheCarry`, Geld aus Steuer unverändert, kein Wurf. Häuser auf 0 mitten im Zehnt (Haus-Einwohner 0 setzen) → `titheCarry` bleibt stehen.
- **AK-ZE-12:** Zehnt Stufe 1, Stufe 2 Geld; ein Haus `setHouse(b, 2, 4)` → nächster `tickTaxes`: `split.tithe.tools` sinkt um dessen Anteil, `split.money[2]` steigt (über `titheSplit` geprüft).
- **AK-ZE-13:** Zehnt Stufe 1, Amtsstube `outageUntil = tick + 500` → Buchung wie ohne Zehnt (alles Geld, `titheCarry` unberührt), `titheOn[1]` bleibt `true`; `outageUntil` entfernen → wieder Werkzeug.
- **AK-ZE-22 (a):** Fall 02, Werkzeug 100, kein Werkzeugmacher, 100 × `step`: Bestand 100; jeder Bericht mit Fälligkeit hat `titheLost.tools > 0`; Σ `titheLost.tools` × `TITHE_CARRY_DIVISOR` + Übertrag Ende − Übertrag Anfang = Σ (`titheSplit(w).tithe.tools` vor jedem Schritt) × `TITHE_UNITS_PER_100.tools`. **(b):** Werkzeug 99, ein Werkzeugmacher mit `progress` einen Schritt vor Fertigung (Aufbau aus vorhandenen Helfern, `rg -n "toolmaker" tests/sim`), `titheCarry.tools = TITHE_CARRY_DIVISOR − 1` → nach einem `step` Bestand 100 aus der Produktion, `titheLost.tools` 1.
- **Review Focus 2:** Edikt mit Steuerpunkten aktiv (`rg -n "taxPoints" src/sim/defs/edicts.ts`) → `titheSplit(w).tithe.tools` = Σ Basis × (100 − Punkte) für Stufe 1.
- **Review Focus 3:** Werkzeug und Stein 100, beide Schalter an, genug Übertrag für je ein Stück → ein `tickTaxes` liefert `{ tools: ≥1, stone: ≥1 }`.
- **Review Focus 4:** ein Pionierhaus auf einer Fremdinsel (`rg -n "export function .*[Ff]ar|colony" tests/sim/helpers.ts tests/sim/farHelpers.ts`), Zehnt Stufe 1 → Werkzeug der Heimat steigt, Fremdlager unverändert.

## Schritte

- [ ] AK-ZE-01/25-Pin schreiben, **gegen den unveränderten Code** laufen: `npx vitest run tests/sim/tithe.test.ts -t "AK-ZE-01"; echo EXIT=$?` → 0; Ist-Wert 5616 und Commit ins Ledger. Abweichung → Stopp, Befund.
- [ ] Übrige Tests schreiben; **Rot:** `npx vitest run tests/sim/tithe.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen (Inhalt 1–5); `tests/sim/tick.test.ts`-Literal um `titheLost: {}` ergänzen.
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/sim/taxes.test.ts tests/sim/taxTiers.test.ts tests/sim/townhall.test.ts tests/sim/population.test.ts tests/sim/tick.test.ts; echo EXIT=$?` → 0.
- [ ] **Balancing:** `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` → 0; `npx vitest run tests/sim/seaGolden.test.ts; echo EXIT=$?` → 0.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-223 Zehnt-Buchung titheSplit, tickTaxes, StepReport (T02)`.
