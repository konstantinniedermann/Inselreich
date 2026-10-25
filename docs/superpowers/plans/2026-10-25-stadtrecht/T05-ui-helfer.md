# T05 · UI-Helfer: Stadtrecht-Ansicht, Marke, Hinweis, Steuer-Anzeige (B7)

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK-ST-13, AK-ST-14, AK-ST-15, AK-ST-06 (Prognose `taxView`) · blocked-by: T04 · Worktree `.worktrees/stadtrecht` · Spec §3.3 · Plan P-5 bis P-8

## Dateien

- neu: `src/ui/charter.ts` (DOM-frei, Kopfkommentar «DOM-freie Helfer für das Stadtrecht (Spec §3.3). Keine Spielwerte hier.»)
- ändern: `src/ui/council.ts` (`councilBadge`, `councilBadgeActive`), `src/ui/taxView.ts` (`tierTaxTooltip`, Aufrufe von `taxEffect`), `src/ui/guide.ts` (`taxEffect`), `src/ui/inspect.ts` (nur der `taxEffect`-Aufruf ≈ Z. 684), `tests/ui/council.test.ts` (neue Blöcke am Ende), `tests/ui/taxView.test.ts` (neue Blöcke am Ende)
- nicht ändern: `src/ui/councilCard.ts`, `src/ui/app.ts` (T06), `src/ui/hud.ts` (`taxTooltip(level)` hat keine Welt; bleibt, Befund als Beobachtung in T08), `src/sim/`

## Interfaces

- Consumes: `charterUnlocked`, `charterRank`, `nextCharter`, `buyCharterReason` (`src/sim/charter.ts`), `charterTaxPoints` (`src/sim/council.ts`), `CHARTER_SESSIONS`, `CHARTER_NOTE` (`defs/charter.ts`), `charterFixture` (`tests/sim/charterFixtures.ts`), bestehendes Geld-Format der Kopfzeile (per `rg -n "function format" src/ui/hud.ts src/ui/*.ts` finden und wiederverwenden, nicht neu bauen).
- Produces (`src/ui/charter.ts`):
  - `type CharterCost = 'money' | 'stone' | 'glass'`
  - `interface CharterCard { side: CharterSide; name: string; text: string }`
  - `interface CharterView { rank: number; total: number; next: { name: string; cost: string; missing: CharterCost[]; cards: CharterCard[]; reason: string | null } | null; decided: string[]; note: string }`
  - `charterView(world): CharterView | null` → `null` vor `charterUnlocked`; `next = null` ab Rang `total`.
  - `charterAffordable(world): boolean` → `charterUnlocked && buyCharterReason(world, 'A') === null`
  - `charterBecameAffordable(prev: boolean | null, next: boolean): boolean` → `prev !== null && !prev && next`
- Produces (`guide.ts`): `taxEffect(level: TaxLevel, charterPts = 0): string`.

## Verhalten

1. `charterView`: `rank = charterRank`, `total = CHARTER_SESSIONS.length`; `next.name` = Name der nächsten Sitzung; `cost` = Posten mit Wert > 0 in der Reihenfolge Geld, Stein, Glas, Format `${fmt(money)} Geld · ${stone} Stein · ${glass} Glas` (P-5); `missing` = Posten, die Kasse bzw. Heimatlager nicht decken; `cards` = A, B mit `a.name`/`a.text` bzw. `b.name`/`b.text`; `reason` = `buyCharterReason(world, 'A')`; `decided` = je gekaufter Sitzung `${name}: ${seite.name}` (P-5, «Marktrecht: Steuer +2 %»); `note = CHARTER_NOTE`.
2. `councilBadge` (P-6): `open > 0` → `Rat · ${open}`; sonst `charterAffordable` → `'Rat · Stadtrecht'`; sonst Rat je offen gewesen oder `charterUnlocked` → `'Rat'`; sonst `null`. `councilBadgeActive` = offene Beschlüsse **oder** `charterAffordable`. `councilToggleAllowed` bleibt `councilBadge(world) !== null`.
3. B7 (P-8): `tierTaxTooltip`: `${taxPct(level, tier) + charterTaxPoints(world)} %`. `taxEffect(level, charterPts)`: Hauptsatz `${t.pct + charterPts} %` und Stufen-Zusätze `${taxPct(level, tier) + charterPts} %`; die Abfrage `taxPct(level, tier) !== t.pct` bleibt ohne Punkte. `taxStatusLine`, `taxButtonTitle` und `inspect.ts:684` reichen `charterTaxPoints(w)` durch. `tierTaxPerMinute` unverändert (liest `effectiveTaxPct`).

## Steps

- [ ] **Tests rot**, `tests/ui/council.test.ts`, Block `describe('Stadtrecht (AK-ST-13 bis 15)')`, Stand nach Seerecht (Karte Stufe 4 mit drei Seiten):
  - **AK-ST-13:** `charterView(createWorld(3))` → `null`. `charterFixture('glas0')`: `rank 0`, `total === CHARTER_SESSIONS.length`, `next.name === CHARTER_SESSIONS[0].name`, `cost` aus den Defs zusammengesetzt (Erwartung im Test mit denselben Def-Werten und demselben Formatierer gebaut, kein Literal), `cards.map(c => c.text)` = Def-Texte, `reason === null`; nach `buyCharter(w, 'A')`: `rank 1`, `missing` enthält `'glass'`, `reason === 'Zu wenig Glas'`, `decided` = `[`${CHARTER_SESSIONS[0].name}: ${CHARTER_SESSIONS[0].a.name}`]`. `charterFixture('rang6')`: `next === null`, `decided.length === total`. Dreiseitige Ratskarte unberührt: `councilCards(w)` für Stufe 4 offen liefert weiter drei Karten.
  - **AK-ST-14:** offene Stufe plus leistbare Sitzung → `Rat · 1` (Vorrang); kein Beschluss offen, Sitzung leistbar → `Rat · Stadtrecht`, `councilBadgeActive` wahr; nicht leistbar → `Rat`, aktiv falsch; `rang6` → `Rat`; vor `won` und ohne je offenen Beschluss → `null`; `won` ohne je offenen Beschluss und nicht leistbar → `Rat` (`councilToggleAllowed` wahr).
  - **AK-ST-15:** `charterBecameAffordable(null, true)` falsch; `(false, true)` wahr; Folge `false, true, true, false, true` liefert genau zweimal wahr (an Position 2 und 5).
  - `tests/ui/taxView.test.ts`, Block `describe('Stadtrecht-Punkte (AK-ST-06 Prognose, AK-ST-13 Satz)')`: Welt mit Amtsstube und Bevölkerung (bestehende Testwelt der Datei), einmal `charter = []`, einmal `['A', 'A']`: `tierTaxPerMinute` steigt um `Math.floor(s × (pct + P) × 3 / 100) − Math.floor(s × pct × 3 / 100)` mit `P = charterTaxPoints(w)`; `tierTaxTooltip` beginnt mit `${taxPct(level, tier) + P} %`; `taxEffect('normal', P)` enthält `${TAX_LEVELS.normal.pct + P} %`; `taxEffect('high')` unverändert (Bestand).
- [ ] **Lauf rot:** `npx vitest run tests/ui/council.test.ts tests/ui/taxView.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–3.
- [ ] **Teilbeleg:** `npx vitest run tests/ui/council.test.ts tests/ui/taxView.test.ts tests/ui/guide.test.ts tests/ui/inspect.test.ts tests/ui/time.test.ts tests/ui/councilCard.test.ts tests/sim/charter-levers.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?` → je 0. Wächter aus T04 bleibt grün (`.charter` in `src/ui/` nur in `charter.ts`).
- [ ] **Commit:** `feat: Stadtrecht-Ansicht, Marke und Steuer-Anzeige (AK-ST-13 bis 15)`.

## Task-Review

Keine Zahl und kein Text ausser aus den Defs; `cost`-Erwartung im Test nicht als Literal; Marke-Vorrang «Rat · n»; Bestandstests `taxEffect`/`tierTaxTooltip` unverändert grün; `hud.ts` ohne Diff; `src/sim/` ohne Diff in diesem Task.
