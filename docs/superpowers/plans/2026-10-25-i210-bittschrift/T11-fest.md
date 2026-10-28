# T11 B4/B5 nach I-201: Glockenweihe, Festtrunk, Erntefest-Takt

Persona `tech-sim-engineer` · Strang A · Tools ≈ 55 · AK-BS-10 (Erntefest-Teil), AK-BS-11 (B4-Brand), Regeln B4/B5 aus Spec §3.5 · blocked-by **I-201 in `main`** (P-2) und T05.

**Vorlauf:** `git log --oneline -1 main -- src/sim/feastEffect.ts` muss einen Treffer liefern, sonst `waiting` (P-2). Dann `git merge main` in `feat/i210` (kein Rebase); Konflikte nur in Dateien der T03-Matrix nach Symbolen lösen. Danach `npx vitest run tests/sim/petitions*.test.ts; echo EXIT=$?` grün **vor** dem ersten neuen Test. Drift: `git log --oneline <T05-Hash>..main -- src/sim/feast.ts src/sim/feastEffect.ts src/sim/levels.ts src/sim/population.ts src/sim/defs/feast.ts`. Gilt der Festindex aus R921 bereits, nutzt du seine Abfragen und baust keine eigene Gebäudesuche.

**Files:** Modify `src/sim/petitionEffect.ts` (Import `./feastEffect` erlaubt, Blatt-Test in `tests/sim/petitions.test.ts` entsprechend erweitern), `src/sim/population.ts` (`upgradeStatus`), `src/sim/feast.ts` (`holdFeast`, `feastBlockReason`), `src/sim/levels.ts` (nur Kombination mit dem Erntefest), `src/sim/petitions.ts` (falls der Anker-Radius auf `feastEffect` umgestellt wird), `tests/sim/petitions.test.ts`. `tests/sim/imports.test.ts` nur, falls die I-201-Wächterliste `feastEffect`-Importeure aufzählt (`petitionEffect.ts` dann ergänzen, Präzedenz R921).

## Interfaces

- Consumes (I-201): `chapelWorks(chapel)`, `inChapelRadius(world, chapel, target)`, `feastActive(world, house)`, `harvestActive`, `harvestCycle`, `FEAST_KINDS[kind].cost` (Rum-Anteil `cost.rum`), Abklingzeit aus `feastState`.
- Produces (`petitionEffect.ts`):

```ts
export function bellActive(world: World, house: Building): boolean; // B4-«Ja»-Wirkung läuft, Ankerkapelle steht und arbeitet (chapelWorks), Haus im Radius
export function voucherAt(world: World, chapelId: number): boolean; // B5-«Ja»-Wirkung mit anchor === chapelId läuft
export function useVoucher(world: World, chapelId: number): void; // entfernt genau diese Wirkung (einzige Schreibstelle im Blatt, Doc-Kommentar)
```

## Einbau

- `upgradeStatus`: `festive = base !== null && (feastActive(world, b) || bellActive(world, b))`. Wartezeit `TAX_LEVELS.low.upgradeWait` wie beim Aufstiegsfest; die Uhr läuft im Brand weiter, die Wirkung pausiert (`chapelWorks`, Spec §3.5).
- `holdFeast(world, id, kind)`: Mit `voucherAt(world, id)` entfällt der Rum-Anteil der Kosten der gewählten Art (Ernte- und Markttag inklusive), und die eigene Abklingzeit dieser Kapelle sperrt nicht. Inselsperre (I-201 Regel 3), «Fest läuft», «Kapelle brennt» und «nicht angebunden» gelten weiter. Nach erfolgreichem Fest folgt `useVoucher`. `feastBlockReason` spiegelt dieselbe Regel (Anzeige).
- `cycleOf` mit Erntefest und Taktlohn: Es gilt der kleinere Zyklus, `min(harvestCycle(c), petitionCycle(…, c))` auf das Ergebnis von `effectiveCycle`, nie beide nacheinander (AK-BS-10). Wie I-201 `cycleOf` heute zusammensetzt, liest du nach dem Merge per `rg -n "harvest" src/sim/levels.ts`.
- Gutschein läuft höchstens `duration` (= `PETITION_PERIOD`) und endet über (a) in `tickPetitions` mit `ended`.

## Schritte

- [ ] **Tests zuerst** (`tests/sim/petitions.test.ts`):
  - `B4`: «Ja» auf B4, nach `delay` 600: Haus im Radius mit erfüllten Bedürfnissen steigt nach 150 T auf (wie Aufstiegsfest); Haus ausserhalb nach der Normalzeit; nach `duration` 1800 wieder Normalzeit.
  - `AK-BS-11 Brand`: Ankerkapelle brennt → `bellActive` false, nach Brandende wieder true, `until` unverändert.
  - `B5`: «Ja» auf B5, nach dem Nachspiel: `holdFeast(w, chapel, 'ascension')` in der Abklingzeit `ok`, Rum unverändert; für `harvest` fällt nur der Rum-Anteil weg, Stoff wird abgebucht. Danach ist die Wirkung weg, ein zweites Fest sperrt wieder mit «Abklingzeit». Inselsperre (zweite Kapelle mit Erntefest) gilt weiter.
  - `AK-BS-10 Erntefest`: Betrieb im Erntefest-Radius (Zyklus 75 %) mit B7-Taktlohn (80 %) → Zyklus ⌊c × 75 / 100⌋, nicht ⌊c × 60 / 100⌋.
  - `Bitgleich`: ohne Wirkung bleiben `feastBlockReason`, `holdFeast` und `cycleOf` gleich (bestehende Tests `tests/sim/feast*.test.ts` grün).
- [ ] Rot: `npx vitest run tests/sim/petitions.test.ts; echo EXIT=$?`.
- [ ] Umsetzen.
- [ ] Grün plus Teilbeleg: `npx vitest run tests/sim/petitions.test.ts tests/sim/petitionsRuns.test.ts tests/sim/petitionsSave.test.ts tests/sim/imports.test.ts; echo EXIT=$?`, `npx vitest related --run src/sim/feast.ts src/sim/feastEffect.ts src/sim/levels.ts src/sim/population.ts; echo EXIT=$?`, Baseline-Liste (T00), `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`. Rundlauf in `petitionsSave.test.ts` um B4- und B5-Wirkungen erweitern (Anhang 04 deckt sie schon ab).
- [ ] Commit `feat: I-210 Glockenweihe und Festtrunk über feastEffect`.
