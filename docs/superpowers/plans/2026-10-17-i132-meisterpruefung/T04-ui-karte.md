# T04 · Auflagen-Karte, Ziel-Chip, Handel, Chronik, Meldungen

`tech-ui-engineer` · ≈ 50 Tools · AK 17 (Abgleich), 18–20 (Code) · blocked-by: T02, T03 (vorher `git merge feat/i132-ui` in `feat/i132`) · Test zuerst

Dateien: `src/ui/trialCard.ts` (neu), `tests/ui/trialCard.test.ts` (neu), `src/ui/hud.ts`, `src/ui/app.ts`, `src/ui/inspect.ts`, `src/ui/trade.ts`,
`src/ui/monumentView.ts`, `src/style.css`, `tests/ui/trial.test.ts` (ein Abgleichtest), betroffene `tests/ui/*` (z. B. `hud.test.ts`, `monumentView.test.ts`).
Muster: `src/ui/councilCard.ts` und seine Verdrahtung in `app.ts` (`createCouncilCard`, Frame-Update, Esc-Kette, `dispose`).

## Schnittstellen

- Consumes: `startTrial`, `abortTrial` (T02), `trialBuyBlock` (T01), alle Helfer aus `src/ui/trial.ts` (T03).
- Produces: `createTrialCard(host: HTMLElement, onStart: () => void, onAbort: () => void, onClose: () => void, preview: (w: World) => DeficitLine[] = selfSupplyPreview): TrialCardHandle` mit
  `{ readonly isOpen: boolean; setOpen(want: boolean): void; update(world: World): void; dispose(): void }`; `HudActions.toggleTrial(): void`.

## Schritte

- [ ] 1. **Tests zuerst** (unten), `npx vitest run tests/ui/trialCard.test.ts tests/ui/trial.test.ts; echo EXIT=$?` → rot; FAIL-Zeile ins Ledger.
- [ ] 2. `trialCard.ts`: `<section class="card trial-card" aria-label="Meisterprüfung">`, kein Modal, keine Pause. Kopf «Meisterprüfung» + «Schliessen»;
      darunter `name`, `rule`, `condition`, «Ohne Zukauf fehlen: » + `preview`, `fireHint`, `status` (falls nicht `null`), Aktionsknopf aus `action`:
      `start` → «Auflage beginnen», bei `reason !== null` Klasse `unaffordable` und `title = reason` (Klick ruft trotzdem `onStart`, der Handler zeigt den Grund);
      `abort` → «Abbrechen», erster Klick setzt `armed` und Text «Wirklich abbrechen?», zweiter Klick `onAbort()`; `none` → kein Knopf.
      **Vorschau gedrosselt (P-5):** `preview(world)` beim Öffnen und danach nur, wenn `world.tick − previewTick ≥ GOODS_BALANCE_TICKS`; geschlossen nie.
      Neu aufbauen nur bei geänderter Signatur (`JSON.stringify(view)` + `armed`). `armed` fällt zurück bei Schliessen, `dispose` und jedem Wechsel von
      `action.kind` (Review Focus 4). Nach `dispose` wirkungslos (wie Rats-Karte).
- [ ] 3. `hud.ts`: das Ziel-Element wird `<button type="button" class="chip goal-chip" data-field="goal">` (P-4); Klick → `actions.toggleTrial()` (mit
      `blurAfterClick`). Im Update `const tc = trialChip(world)`, `goalTexts(goalView(world), tc ?? monumentChip(world))`, Klasse `goal-chip--action`
      genau bei `tc !== null`. `HudActions.toggleTrial` ergänzen.
- [ ] 4. `app.ts` (neben der Rats-Karte): `let prevTrial: TrialState | null = cloneTrial(world.trial)` beim Start bzw. Laden (keine Meldung für Geladenes);
      `createTrialCard(gameEl, onStart, onAbort, onClose)`. `onStart`: `startTrial(world, 'selfSupply')`; ok → `showMessage(trialStartMessage())`, sonst
      `showError(friendlyReason(world, r.reason))`; danach `prevTrial = cloneTrial(world.trial)`, `refresh()`. `onAbort`: `abortTrial`; ok →
      `showMessage(TRIAL_ABORT_MESSAGE)`; `prevTrial` abgleichen, `refresh()`. Je Frame nach dem Rats-Block: `const msg = trialTransition(prevTrial, world.trial)`;
      bei Text `showMessage(msg, 'info', true, true)` (Weg der Zielbanner); `prevTrial = cloneTrial(world.trial)`; `trialCard.update(world)`.
      `toggleTrial`: nur bei `trialChip(world) !== null`, öffnet bzw. schliesst; Öffnen schliesst die Rats-Karte und umgekehrt (`toggleCouncil` und
      Taste `Umschalt + R` schliessen die Auflagen-Karte). Esc-Kette: offene Auflagen-Karte zuerst schliessen, dann Rats-Karte, dann Bisheriges.
      `trialCard.dispose()` neben `councilCard.dispose()`. `cloneTrial = (t) => ({ ...t, passed: [...t.passed] })` lokal.
- [ ] 5. `inspect.ts`: Zeile `addLine(panel, '', 'rest-trial')` direkt nach `rest-monument`; in `updateRest` Text `trialChronicleLine(world)`, `hidden` bei `null`
      (Muster `rest-monument`).
- [ ] 6. `ui/trade.ts` `updateTrade`: für `op === 'buy'` `const block = trialBuyBlock(world)`; Klasse `unaffordable` zusätzlich bei `block !== null`; `title = block ?? buyTitle(…)`.
      Klick bleibt (`buy` liefert den Grund, `actions.changed` zeigt ihn).
- [ ] 7. `monumentView.ts`: `monumentStallReason` liefert vor der Zeile «Kein Kontor» `trialBuyBlock(w)`, wenn er gesetzt ist und `buying.length > 0`;
      `monumentRows`: `buyText` bei gesetzter Sperre `` `zukaufen — ${block}` ``.
- [ ] 8. `style.css`: `.trial-card` wie `.council-card` (Lage, Breite, Ebene über Hinweisen). `.goal-chip` erbt das Chip-Aussehen
      (Schrift, Farbe, Rand und Hintergrund wie `.chip`, Knopf-Standardstil zurückgesetzt) mit `cursor: default`; `.goal-chip--action` mit
      `cursor: pointer`. Kopfzeile bleibt bei 1280 px einzeilig.
- [ ] 9. Prüfschritte grün, `make check; echo EXIT=$?` (Strangende), Commit `feat: Auflagen-Karte und Anzeigen Meisterprüfung (I-132)`.

## Tests

`tests/ui/trialCard.test.ts` (Muster `councilCard.test.ts`, `FakeElement` aus `fakeDom.ts`, `document` per `vi.stubGlobal`):

- «AK-18 Aufbau»: Welt mit `monumentDone` und drei Kaufmannshäusern, `setOpen(true)`, `update(w)` → Text enthält Name, Bedingung
  «15 Minuten, Einwohner nicht unter 70 % des Starts», «Ohne Zukauf fehlen», «Gewürz», Feuerwachen-Hinweis und «Auflage beginnen»; `setOpen(false)` → `hidden`.
- «AK-18 blass»: Welt mit 59 Kaufleuten → Knopf hat `unaffordable` und `title` «Erst ab 60 Kaufleuten (jetzt 59)»; Klick ruft `onStart` einmal.
- «AK-20 Abbruch zweiter Klick»: aktive Auflage → erster Klick ruft `onAbort` nicht, Text «Wirklich abbrechen?»; zweiter Klick ruft `onAbort` einmal.
- «Review Focus 4»: bewaffnen, dann `trial.active = null` und `update` (Auflage zu Ende), dann neu `active = 'selfSupply'` und `update` → ein Klick ruft `onAbort` **nicht**.
- «Vorschau gedrosselt»: Fake `preview` (`vi.fn(() => [])`) als 5. Argument — geschlossen 0 Aufrufe nach `update`; offen: ein Aufruf beim Öffnen,
  kein neuer bei `tick + 50`, ein neuer bei `tick + 100`.
- «dispose»: danach ruft kein Klick mehr `onStart`/`onAbort`; Karte aus dem Host entfernt.

`tests/ui/trial.test.ts` (ergänzen): «AK-17 Abgleich mit startTrial»: je Grundfall aus T01 `trialStartReason(w)` gleich `startTrial(structuredClone(w), 'selfSupply')`
(Grund bzw. `null` bei `ok`).

`tests/ui/hud.test.ts` / `monumentView.test.ts`: bestehende Erwartungen an `data-field="goal"` bleiben; neu: `monumentStallReason` mit Auflage und Zukauf-Bedarf
liefert «Auflage Eigenversorgung: kein Zukauf». Falls `ui/trade.ts` einen DOM-Test hat: Kauf-Knopf mit Auflage `unaffordable` und `title` = Grund.

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/ui/; echo EXIT=$?` · `make build; echo EXIT=$?` · `make check; echo EXIT=$?`.
Danach Übergabe an T05 (Browser) mit Spielständen: (a) `monumentDone`, Gewürz-Defizit; (b) aktive Auflage ohne Gewürz für «nicht bestanden» bei 4×.
