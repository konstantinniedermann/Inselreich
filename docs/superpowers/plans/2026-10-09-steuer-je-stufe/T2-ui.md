# T2 UI: Helfer, Raster, Kopfzeile, Hinweise, Doku (`tech-ui-engineer`)

Plan-Index: [../2026-10-09-steuer-je-stufe.md](../2026-10-09-steuer-je-stufe.md) (Global Constraints, DoD). AK-IDs: AK-T26–T28, T29 (+ QA-c), T30 (+ QA-e), T31 (+ P-2-Zusatz), T32 (+ P-2-Zusatz), T33 (+ QA-d), T42 (UI-Teil) — Wortlaut Spec §7, §8.4 und Anhang 02 (geht vor). Spec §9 für die Doku.

## Interfaces

**Consumes (T1a/T1b):** `TIER_IDS`; `effectiveTaxLevel(w, tier)`, `taxPct` (`townhall.ts`); `taxTarget`, `taxChangeSet`, `taxLocked`, `noRiseReason`, `canRiseTier`, `setTierTaxLevel`, `setTaxLevel` (`tax.ts`); `tierCap`, `taxBaseByTier` (`population.ts`); `setAllTax` (`tests/sim/helpers.ts`).

**Produces** `src/ui/taxView.ts` (rein, DOM-frei; alle Zahlen aus Defs und Sim-Abfragen):

```ts
export type TaxSummary = TaxLevel | 'mixed';
/** P-2: L genau dann, wenn taxChangeSet(w, L) leer ist; sonst 'mixed'. Liest den gespeicherten Stand. */
export const taxSummary = (w: World): TaxSummary =>
  (Object.keys(TAX_LEVELS) as TaxLevel[]).find((l) => taxChangeSet(w, l).length === 0) ?? 'mixed';
export function taxSummaryText(w: World): string; // TAX_LEVELS[L].name | 'gemischt'
export function taxMixList(w: World): string; // 'P niedrig · S normal · B normal · K hoch'
export function tierTaxTooltip(tier: Tier, level: TaxLevel): string;
export function tierTaxPerMinute(w: World, tier: Tier): number; // ⌊S × taxPct(effectiveTaxLevel(w, t), t) × 3 / 100⌋
export function taxLockText(w: World, tier: Tier): string; // 'wieder änderbar in 20 s' | ''
export function taxStatusLine(w: World): string; // aktiv: taxEffect(L) | 'Steuer gemischt: ' + taxMixList; inaktiv: taxEffect('normal')
export function taxButtonTitle(w: World): string; // L → taxEffect(L); mixed → taxMixList
export const lockedTierFor = (w: World, level: TaxLevel): Tier | undefined =>
  taxChangeSet(w, level).find((t) => taxLocked(w, t));
```

`tierTaxTooltip`: `taxTarget(level, tier) !== level` → `noRiseReason(tier)`; sonst `` `${taxPct} % · ${auf} · ${tierCap(tier, level)} Einwohner` `` mit `auf` = «Aufstieg nach {formatGameTime(upgradeWait)}» / «kein Aufstieg»; ohne `canRiseTier(tier)` entfällt der Aufstiegsteil.

`taxEffect(level)` (`guide.ts`, bleibt ohne Stufen-Parameter; `tierTaxTooltip` deckt die Stufe ab, YAGNI): nach dem Prozentteil je Stufe mit `taxPct(L, t) !== TAX_LEVELS[L].pct` der Zusatz `` ` (${TIERS[t].name} ${taxPct(L, t)} %)` `` und je Stufe mit `taxTarget(L, t) !== L` der Zusatz `` ` (${TIERS[t].name} ${TAX_LEVELS.normal.name})` ``.

## Schritt 1 — Tests zuerst (rot)

- [ ] **1.1 `tests/ui/taxView.test.ts` (neu), AK-T26/T27 + AK-T42 (UI):** Stände aus AK-T26 → `taxSummary` `'normal'`, `'low'`, `'high'`, `'mixed'`; `taxSummaryText` «gemischt»; `taxButtonText(w)` «Steuer gemischt»; `taxMixList` → «P niedrig · S normal · B normal · K hoch». Für jeden dieser Stände und jedes L: `(taxSummary(w) === L) === (taxChangeSet(w, L).length === 0)`.
- [ ] **1.2 AK-T28:** alle 12 Zellen Anhang 01 C per `it.each` (u. a. `(4,'high')` → «115 % · 15 Einwohner», `(4,'low')` → «Kaufleute steigen nicht auf», `(1,'low')` → «70 % · Aufstieg nach 15 s · 4 Einwohner», `(3,'high')` → «130 % · kein Aufstieg · 11 Einwohner»).
- [ ] **1.3 AK-T29 + QA-c:** `taxEffect('high')` → «hoch: 130 % Steuer (Kaufleute 115 %) · kein Aufstieg · Häuser nur zu 75 % belegt»; `taxEffect('low')` → «niedrig: 70 % Steuer (Kaufleute normal) · Aufstieg nach 15 s Zufriedenheit · Häuser voll belegt»; `taxEffect('normal')` unverändert.
- [ ] **1.4 AK-T30 + QA-e:** Welt Anhang 01 A → `[33, 504, 1201, 2277]`; Amtsstube `outageUntil > tick` → `[48, 504, 924, 1980]` und `taxLevels` weiter `{1:'low',2:'normal',3:'high',4:'high'}`.
- [ ] **1.5 AK-T31 Grundfall:** `taxLockedUntil[2] = tick + 200` → `taxLockText(w, 2)` «wieder änderbar in 20 s», Stufe 1 `''`; Pioniere und Bürger gesperrt → `lockedTierFor(w, 'high') === 1`; Pioniere schon «hoch» und gesperrt, Bürger gesperrt → `lockedTierFor(w, 'high') === 3` (Review Focus 5).
- [ ] **1.6 `tests/ui/hints.test.ts`, AK-T31-Zusatz (B-3), drei Fälle:** Tick 1000, `taxLockedUntil = {1:0,2:1200,3:1150,4:0}`: `friendlyReason(w, 'Sperrzeit', { tier: 2 })` → «Steuer für Siedler erst in 20 s wieder änderbar»; ohne `tier` → kleinste gesperrte Stufe: «Steuer für Siedler erst in 20 s wieder änderbar»; alle Sperren ≤ 1000, ohne `tier` → `'Sperrzeit'`. **AK-T32-Zusatz:** `'Steuer zu hoch'` mit `{ tier: 3 }` → «Steuer ‚hoch' für Bürger verhindert den Aufstieg»; ohne `tier` → heutiger Text; `upgradeStatus` eines Bürger-Hauses unter «hoch» enthält genau `'Steuer zu hoch'`.
- [ ] **1.7 `tests/ui/guide.test.ts`, AK-T32 Leitfaden:** volles Siedler-Haus, `w.taxLevels[2] = 'high'`, sonst «normal» → `nextStep` «Steuer ‚hoch' für Siedler verhindert den Aufstieg: stelle sie auf ‚normal' oder ‚niedrig'».
- [ ] **1.8 AK-T33 + QA-d (H-3):** `tests/ui/hover.test.ts` (nur T2 besitzt diese Datei): Bürger-Haus, aktive Amtsstube, Bürger «hoch» → letzte Zeile «Steuer: hoch»; ohne aktive Amtsstube Zeilen wie heute (keine Steuerzeile); Amtsstube bei gemischtem Stand → «Steuer: gemischt». `tests/ui/inspect.test.ts`, `restView(world).tax` exakt:
  - aktiv, `{1:'low',2:'normal',3:'normal',4:'high'}` → «Steuer gemischt: P niedrig · S normal · B normal · K hoch»;
  - aktiv, alle «hoch» → «hoch: 130 % Steuer (Kaufleute 115 %) · kein Aufstieg · Häuser nur zu 75 % belegt»;
  - ohne aktive Amtsstube, gemischt wie oben → «normal: 100 % Steuer · Aufstieg nach 30 s Zufriedenheit · Häuser voll belegt (keine Amtsstube)».
- [ ] **1.9 Rot:** `npx vitest run tests/ui/taxView.test.ts tests/ui/hints.test.ts tests/ui/guide.test.ts tests/ui/hover.test.ts tests/ui/inspect.test.ts; echo EXIT=$?` → FAIL, Auszug je Fall. Commit `test: I-028 T2 UI-Helfer (rot)`.

## Schritt 2 — Umsetzung

- [ ] **2.1 `src/ui/taxView.ts`** nach «Produces».
- [ ] **2.2 `hints.ts`:** `ReasonCtx.tier?: Tier`. Zeile `/^Sperrzeit$/`: `const t = c.tier ?? TIER_IDS.find((x) => taxLocked(w, x)); return t === undefined ? null : \`Steuer für ${TIERS[t].name} erst in ${formatGameTime(w.taxLockedUntil[t] - w.tick)} wieder änderbar\``. Zeile `/^Steuer zu hoch$/`: mit `c.tier` «Steuer ‚hoch' für {Gruppe} verhindert den Aufstieg», sonst heutiger Text. Muster bleiben wörtlich.
- [ ] **2.3 Stufe an die Aufrufer:** `hover.ts:107` und `inspect.ts:167` → `{ …, tier: house.tier }`.
- [ ] **2.4 `app.ts`:** `setTax(level)` → `const tier = lockedTierFor(world, level); const r = setTaxLevel(world, level); if (!r.ok) showError(friendlyReason(world, r.reason, { tier }))`; neue Aktion `setTierTax(tier, level)` → `setTierTaxLevel` mit `{ tier }`; `InspectActions` um `setTierTax(tier: Tier, level: TaxLevel): void` erweitern.
- [ ] **2.5 `inspect.ts` Amtsstube (U-1…U-6):** `renderTownhall` baut einmal die Zeile «alle Stufen» (`data-tax-all=L`) und je `TIER_LIST`-Stufe eine Zeile (Name, Knöpfe `data-tax-tier=t data-tax=L`, `data-field="tax-min-${t}"`, `data-field="tax-lock-${t}"`) — insgesamt 15 Knöpfe; die Zeile `tax-lock` entfällt. `updateTownhall` setzt nur `active`, `aria-pressed`, `disabled` (Kaufleute «niedrig»), `title` (`taxEffect` bzw. `tierTaxTooltip`), Texte und `hidden`; keine Knoten neu (U-6). Hervorhebung «alle Stufen»: `taxSummary === L`; Raster: `taxLevels[t] === L`. `tax-effect` ← `taxStatusLine`. Ruhe-Ansicht `restView` ← `taxStatusLine(world) + (aktiv ? '' : ' (keine Amtsstube)')`.
- [ ] **2.6 `hud.ts`:** `taxView.text` ← `taxSummaryText`; `taxButtonText` ← `` `Steuer ${taxSummaryText(world)}` `` (nur aktiv); nach `setChip(header, 'tax', tax)` `title` des Steuer-Knopfs auf `taxButtonTitle(world)`, nur bei Änderung; `balanceTooltip` ohne Amtsstube → `TAX_LEVELS.normal.name`.
- [ ] **2.7 `hover.ts`:** `townhallInfo` → `` `Steuer: ${taxSummaryText(world)}` ``; `houseInfo` mit `townhallActive` → letzte Zeile `` `Steuer: ${TAX_LEVELS[effectiveTaxLevel(world, house.tier)].name}` ``.
- [ ] **2.8 `guide.ts` (U-12):** kleinste `t ∈ TIER_IDS` mit `TAX_LEVELS[effectiveTaxLevel(w, t)].upgradeWait === null` und `houses.some((h) => h.house!.tier === t && canRise(h))` → Satz mit `TIERS[t].name`.
- [ ] **2.9 `src/style.css`:** `.tax-grid { display: grid; grid-template-columns: minmax(0, 5.5em) repeat(3, minmax(0, 1fr)) minmax(0, auto); gap: 4px; }`; kein `min-width` über 280 px; `.tax-lock` weiterverwenden.
- [ ] **2.10 Spec-gewollte Bestandsänderungen:** `format.test.ts:41` (`taxTooltip('low')` mit «(Kaufleute normal)», `('high')` mit «(Kaufleute 115 %)»), `hints.test.ts` AK-UX-03-Zeile `Sperrzeit` mit `{ tier: 1 }` und Text «Steuer für Pioniere …», `hud.test.ts`/`inspect.test.ts`/`hover.test.ts`/`startCard.test.ts`/`guide.test.ts` an Raster, Hauszeile und Leitfaden; jede Änderung mit Spec-Verweis im Bericht.
- [ ] **2.11 Doku (D1):** README «Steuern und Steuerregler» nach Spec §9 (Tabelle wörtlich, Kaufleute-Satz), mitführen Z. 58, 114, 240–241, 411, 426, 433 (am Stand prüfen); `docs/arc42.md`: Baustein `save.ts` (v10, `migrateV9ToV10`), Steuerstufe (`taxLevels`, `effectiveTaxLevel(world, tier)`, `pctByTier`, `taxTarget`/`taxChangeSet`), Persistenz («Gespeichert wird immer Version 10», Kette v1 … v10, Prüfung je Stufe), UI-Baustein `taxView.ts`. `make docs-check; echo EXIT=$?` → 0.
- [ ] **2.12 Prüfen, committen:** schnelle Make-Prüfungen, `make check; echo EXIT=$?` → alle Tests grün, R392-Vergleich. Commits `feat: I-028 Amtsstube mit Steuer je Stufe`, `docs: I-028 README und arc42 Steuer je Stufe`.
