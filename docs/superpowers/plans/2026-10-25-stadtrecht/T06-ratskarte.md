# T06 · Rats-Karte: Abschnitt «Stadtrecht · Rang k von 6», Kauf, Meldung

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · Vorarbeit für AK-ST-16/17 (Fake-DOM), Review Focus 3, 4 · blocked-by: T05; vor Start `git merge main` (kein Rebase; `app.ts` ist Konflikt-Hotspot) · Worktree `.worktrees/stadtrecht` · Spec §3.3 · Plan P-6, P-7

## Dateien

- ändern: `src/ui/councilCard.ts`, `src/ui/app.ts` (nur: Callback an `createCouncilCard` ≈ Z. 633, Meldung neben `councilOpened` ≈ Z. 1002, Import-Zeilen), `src/style.css` (nur Block `.council-*`, neue Klassen `.charter-*`), `tests/ui/councilCard.test.ts` (neue Blöcke am Ende)
- nicht ändern: `src/ui/council.ts`, `src/ui/charter.ts` (T05), `src/ui/hud.ts` (die Marke kommt schon aus `councilBadge`), `src/sim/`

## Interfaces

- Consumes: `charterView`, `charterAffordable`, `charterBecameAffordable` (T05), `buyCharter` (T03), `CHARTER_AFFORDABLE_MESSAGE` (T01), bestehende `createCouncilCard`-Struktur nach Seerecht (`view.open[].cards`, `council-grid`, `council-option`, `council-go`, `council-decided`).
- Produces: `createCouncilCard(…, onBuyCharter: (side: CharterSide) => void)` — zusätzlicher Parameter **am Ende** der bestehenden Liste (Signatur vor dem Ändern lesen; bestehende Tests rufen ohne ihn nur, wenn er optional ist → optional mit No-op-Standard, damit Bestandstests unverändert bleiben).

## Verhalten

1. Unter den Ratsstufen und vor der Liste: ist `charterView(world)` nicht `null`, ein Abschnitt `section.charter` mit Überschrift `Stadtrecht · Rang ${rank} von ${total}`. Mit `next`: Name, Kostenzeile (`p.charter-cost`; je fehlender Posten der Teil in `span.charter-missing`), `div.council-grid` mit zwei `button.council-option[data-side]` (Name `strong`, Text `span`, wie die Ratskarten), `p.council-note` mit `note`, `button.btn.charter-go` «Sitzung einberufen», daneben `span.charter-reason` mit `next.reason`, falls nicht `null`.
2. Auswahl markiert eine Seite (`aria-pressed`, gleiche Klasse wie bei den Ratskarten); «Sitzung einberufen» ist gesperrt (`disabled`), solange keine Seite gewählt ist oder `reason !== null`. Klick ruft `onBuyCharter(side)`; danach ist keine Seite mehr markiert (Review Focus 4). Die Auswahl übersteht `update(world)` ohne Rangwechsel.
3. Ab Rang 6 (`next === null`): nur Überschrift, keine Kaufflächen. Die Liste `ul.council-decided` enthält zuerst die Ratsbeschlüsse, danach `view.decided` des Stadtrechts. Ist `councilCards(world).open` leer und ein Stadtrecht-Abschnitt sichtbar, bleibt «Kein Beschluss offen.» stehen (es betrifft nur den Rat).
4. `app.ts`: `onBuyCharter = (side) => { const r = buyCharter(world, side); if (!r.ok) showMessage(r.reason); councilCard.update(world); <HUD-Refresh wie nach `decree`> }` (Muster des bestehenden `onDecree` übernehmen; Kauf in der Pause wirkt sofort sichtbar, Review Focus 3). Je Tick neben `councilOpened`: `const aff = charterAffordable(world); if (charterBecameAffordable(prevCharterAffordable, aff)) showMessage(CHARTER_AFFORDABLE_MESSAGE); prevCharterAffordable = aff;` mit `let prevCharterAffordable: boolean | null = null` in derselben Closure wie `prevCouncil` (Laden/«Neue Insel» starten neu, P-7).
5. CSS: Kopfzeilen-Marke einzeilig auch mit «Rat · Stadtrecht» (`white-space: nowrap` am Marken-Selektor, falls nicht schon da; Selektor per `rg -n "council" src/style.css`). `.charter-missing` hervorgehoben mit vorhandener Warnfarbe-Variable; keine Mobil-Regeln.

## Steps

- [ ] **Tests rot** in `tests/ui/councilCard.test.ts` (Fake-DOM wie Bestand):
  - `charterFixture('glas0')`: Abschnitt da, Überschrift `Stadtrecht · Rang 0 von ${CHARTER_SESSIONS.length}`, zwei Optionen, «Sitzung einberufen» gesperrt; Klick auf Option A → entsperrt, **kein** `onBuyCharter`; Klick «Sitzung einberufen» → `onBuyCharter('A')` genau einmal.
  - Auswahl B, `update(world)` ohne Kauf → B bleibt markiert; nach Kauf (`buyCharter` + `update`) ist nichts markiert, Überschrift «Rang 1», Kostenzeile mit `span.charter-missing`, Knopf gesperrt, `charter-reason` = «Zu wenig Glas».
  - `charterFixture('rang6')`: keine `council-option` im Abschnitt, kein `charter-go`, Liste enthält alle sechs Rechte nach den Ratszeilen.
  - `createWorld(3)` (vor `won`): kein Abschnitt.
- [ ] **Lauf rot:** `npx vitest run tests/ui/councilCard.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–5.
- [ ] **Teilbeleg:** `npx vitest run tests/ui/councilCard.test.ts tests/ui/council.test.ts tests/ui/hud.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?` → je 0; `npm run build; echo EXIT=$?` (Import-Pfade in `app.ts`) → 0.
- [ ] **Commit:** `feat: Rats-Karte mit Stadtrecht-Abschnitt (Stadtrecht T06)`.

## Task-Review

Seerecht-Karten (Stufe 4, drei Seiten) unverändert; `app.ts`-Diff nur an den genannten Stellen; Meldung nicht beim Laden; Knopf-Sperre doppelt (Auswahl, Grund); keine Texte ausser aus Defs/`charterView`; `hud.ts` ohne Diff.
