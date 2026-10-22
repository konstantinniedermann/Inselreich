# T04 · UI-Leser (Inselkarte, Heimfahrt, Fernauftrag) und Rats-Karte mit drei Karten

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK-SR-16 bis AK-SR-19 · blocked-by: T01, UI-BEIPACK-FERN auf main (R835) · Worktree `.worktrees/seerecht-ui` (`feat/seerecht-ui` ab `feat/seerecht` nach T01, vor Start `git merge main`, damit das Beipack-Format «27 s» in `islandCard.ts` vorliegt) · Spec §3.2, §4, §6.2

## Dateien

- ändern: `src/ui/homeTravel.ts`, `src/ui/islandCard.ts`, `src/ui/council.ts`, `src/style.css` (nur `.council-card`, `.council-grid`, ≈ Z. 1456–1477), `tests/ui/homeTravel.test.ts`, `tests/ui/islandCard.test.ts`, `tests/ui/farLate.test.ts`, `tests/ui/council.test.ts`, `tests/ui/councilCard.test.ts`
- nur falls nötig: `src/ui/councilCard.ts` (baut Karten schon aus `view.open[].cards`; erwartet: kein Diff)
- nicht ändern: `src/sim/`, `src/ui/farOrder.ts` (liest `homeTravelTicks`, wird dadurch richtig), `src/ui/app.ts`, `src/ui/hud.ts`

## Interfaces

- Consumes (T01): `travelTicksOf(world, d)`, `councilSides(tier)`, `COUNCIL`, `COUNCIL_NOTE`; `laneWorld(d)` aus `tests/sim/seaHelpers.ts`; Fixture `farWorld` aus `tests/sim/farHelpers.ts`.
- Produces: `formatIslandCard(def: IslandDef, width: number, height: number, ticks: number): string` (letzter Parameter jetzt **Fahrzeit in Ticks**, nicht `d`); `homeTravelTicks` Signatur unverändert.

## Verhalten

1. `homeTravelTicks`: `travelTicksOf(world, lane.d)`; `laneCache` bleibt (Seeweg `d` ändert sich beim Beschluss nicht, `seaLanes` weiter einmal je Welt, `homeTravelFrame.test.ts`).
2. `islandCard(world, i)`: `formatIslandCard(def, w, h, travelTicksOf(world, lane.d))`; `formatIslandCard` formatiert `Fahrzeit ${formatGameTime(ticks)}` (R835; nach UI-BEIPACK-FERN steht `formatGameTime` dort schon mit `d`-Umrechnung, T04 ersetzt nur das Argument durch `ticks`). Kein eigenes `clock`/`TICK_MS` mehr. Import `travelTicks` aus `islands.ts` entfällt.
3. `councilCards`: Karten über `councilSides(tier)` (Stufe 4: A, B, C), Liste gefasster Beschlüsse für jede Seite (`s !== null && s !== 'open'`), `note: COUNCIL_NOTE`.
4. CSS: `.council-grid` mit `grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr)` statt fester `1fr 1fr` (zwei bzw. drei Spalten je Zeile); `.council-card` Breite `min(560px, 60%)`. Keine neuen Klassen.

## Steps

- [ ] **Tests rot.**
  - `tests/ui/islandCard.test.ts`: Bestandsaufrufe von `formatIslandCard` (Stand nach UI-BEIPACK-FERN) auf Ticks umstellen (d × 10, z. B. d 27 → 270; Erwartungen im Beipack-Format unverändert). `AK-SR-16` (R835): `formatIslandCard(def, 24, 24, 300)` enthält «Fahrzeit 30 s», mit 240 «Fahrzeit 24 s» (gegen `formatGameTime(300)`/`(240)` gegengeprüft); `islandCard(w, island)` bei `laneWorld(30)` enthält «Fahrzeit 30 s», nach `w.council[4] = 'C'` (ohne Tick) «Fahrzeit 24 s».
  - `tests/ui/homeTravel.test.ts` `AK-SR-17`: injizierte Lanes `() => [{ a: 0, b: 1, d: 30, points: [] }]` (Muster Z. 20): 300; mit `council[4] = 'C'` 240.
  - `tests/ui/farLate.test.ts` `AK-SR-18` (P-6): Fernauftrag auf Insel mit d 30 (`farWorld` + injizierte Lanes d 30 oder `laneWorld(30)`), Rest 260, Lager und rechtzeitige Fracht unter der Menge. Ohne Seerecht `farLate` wahr, `farMark(w).text` endet auf «· zu spät»; mit `council[4] = 'C'` `farLate` falsch, `text` ohne «zu spät», `tip` beginnt mit `Fahrzeit ≈ ${formatGameTime(240)}`. Fernangebot: `farOfferParts(w)!.travel === `≈ ${formatGameTime(240)} Fahrt``.
  - `tests/ui/council.test.ts` `AK-SR-19`: Stufe 4 offen → `cards.map(c => c.name)` = `['Glasrecht', 'Hofrecht', 'Seerecht']`, Texte = `COUNCIL[4][side].text`; Stufe 2 bzw. 3 offen → zwei Karten; Stufe 3 und 4 offen → `open.map(o => o.tier)` = `[3, 4]` mit 2 bzw. 3 Karten; nach `decree(w, 4, 'C')` enthält `decided` «Stufe 4: Seerecht»; `note` = «Gilt für die ganze Partie, die übrigen Beschlüsse der Stufe verfallen.»
  - `tests/ui/councilCard.test.ts` (Review Focus 2, Fake-DOM wie Bestand): Stufe 4 offen, Klick auf Option `data-side="C"`, `update(world)` ohne Änderung, Klick «Beschluss fassen» → `onDecree(4, 'C')`.
- [ ] **Lauf rot:** `npx vitest run tests/ui/islandCard.test.ts tests/ui/homeTravel.test.ts tests/ui/farLate.test.ts tests/ui/council.test.ts tests/ui/councilCard.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–4.
- [ ] **Lauf grün:** dieselben plus `tests/ui/farMark.test.ts tests/ui/homeTravelFrame.test.ts tests/ui/resumeCard.test.ts tests/ui/seaMapView.test.ts; echo EXIT=$?` → 0; `tsc`, eslint/prettier (inkl. `src/style.css`) → 0.
- [ ] **Commit:** `feat: Inselkarte, Fernauftrag und Rats-Karte mit Seerecht (I-153 T04)`.

## Task-Review

Keine direkte `travelTicks`-Nutzung mehr in `src/ui`; Texte nur aus Defs; Review Focus 1: `updateNoticeStack`/Fernkarte bauen den Fahrzeit-Text nicht nur bei Tick-Wechsel neu (sonst Befund an Controller, Fix im selben Task); keine Mobil-Regeln; `app.ts`/`hud.ts` ohne Diff.
