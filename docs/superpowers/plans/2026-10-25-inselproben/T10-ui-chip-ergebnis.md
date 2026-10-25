# T10 · Uhr-Chip, Ergebnis-Karte, Ablage-Anbindung, Dev-Spielstand

Umsetzer `tech-ui-engineer` · ≈ 55 Tools · AK-IP-20, -21, -23, -29 (Anbindung) · blocked-by: T09 · Worktree `.worktrees/inselproben-ui` (`feat/inselproben-ui`) ·
Spec §4.2, §4.3, §6.2, §6.3; Anhang 02 F

## Dateien

- neu: `src/ui/challengeResult.ts`
- ändern: `src/ui/hud.ts` (Chip), `src/ui/app.ts` (Wache in der Schleife, Ergebnis, «Nochmal»), `src/ui/challengeView.ts` (Modelle), `src/style.css`,
  `tests/ui/challenge.test.ts`, `tests/ui/hud.test.ts`, `tests/sim/scenarios.ts` (Dev-Spielstand, P-4)
- nicht ändern: `src/sim/`, `src/ui/devProbes.ts`, `src/ui/challengeStore.ts` (nur nutzen)

## Interfaces

- Consumes (T08/T09): `createResultWatch`, `recordResult`, `writeStore`, `rerun`, `shareText`, `chipText`, `UNLOCK_NOTE`, `challengeStartPrompt`, Start-Ablauf
  aus T09; `goalReached`, `goalView` (Sim).
- Produces:
  - `challengeView.ts`: `goalProgress(world: World, c: ChallengeState): string` («Bürger 34 / 50», «Kaufleute 41 / 60», «Gewürz-Kaufleute 12 / 80»,
    «Denkmal Abschnitt 2 / 3», Schuldbrief «Bürger 34 / 50 · Schuld 1500»); `chipCard(world, c, store): string[]`;
    `resultModel(c: ChallengeState, before: ProbeStore, after: ProbeStore): { title: string; lines: string[] }`.
  - `challengeResult.ts`: `openChallengeResult(host, o: { model; share: string | null; onCopy(): void; onAgain(): void; onContinue(): void }): () => void`.
  - `hud.ts`: Chip `challenge` (nur bei `world.challenge !== null`), Text `chipText(c, world.tick)`, Klick öffnet die kleine Karte (`chipCard`).

## Verhalten

1. Uhr = `world.tick` (Spielzeit): Pause hält sie an, Tempo 4× läuft vierfach; keine Echtzeit.
2. `chipCard`: Zeilen `goalProgress`, «Bestzeit {…|–}», «Krisen {crisisText}», `UNLOCK_NOTE`.
3. Wache: in der Spielschleife **nach jedem `step`** `watch.observe(world)` (neben dem Ehrenbuch-Tracker, P-7); Treffer → `after = recordResult(before, c,
{ today: todayNumber(new Date()), launchDay })`, `writeStore`, Ergebnis-Karte. `watch.reset(world)` bei jedem Start und jedem Laden; `launchDay` setzt nur der Start.
4. `resultModel`: Titel «Probe bestanden · 38:12» / «Tagesinsel bestanden · 31:40» / «Schuldbrief bestanden · 24:10» / «Schuldbrief verloren · Schuld offen
   {debt}»; Zeilen «Bestzeit 41:50 → 38:12» oder «erste Zeit», «Rang {n} der besten 5» (nur Probe, wenn in der Liste), Schuldbrief «Zins gezahlt {interestPaid}».
5. Knöpfe: «Ergebnis kopieren» → `navigator.clipboard.writeText(share)`, ohne Zwischenablage ein markiertes Textfeld mit dem Text; «Nochmal» → Bestätigung
   (`challengeStartPrompt`), dann `rerun(c, today, store.daily).start` über den T09-Start-Ablauf (bei `book === false` ohne `noteLaunch` und ohne spätere
   Buchung); «Weiterspielen» schliesst, Chip zeigt danach «… · bestanden mm:ss».
6. Dev-Spielstand `ip-probe1-kurz-vor-ziel` in `SCENARIOS` (`tests/sim/scenarios.ts`): `startChallenge({ kind: 'probe', id: 'p1' })`, `startColony`,
   `runColony` mit `stop = w => citizens(w) >= 46`; `result === null`. Prüfpunkte wie die übrigen Szenarien, falls die Strecke sie verlangt. Nie in der Startkarte.

## Steps

- [ ] **Tests rot:**
  - `tests/ui/challenge.test.ts`: `goalProgress` je Ziel-Art (Welten per Sim-Helfer) und Schuldbrief; `chipCard` enthält `UNLOCK_NOTE`; `resultModel` für erste
    Zeit, Verbesserung, keine Verbesserung (Rang fehlt), Tagesinsel, Schuldbrief bestanden/verloren — Texte wörtlich; **AK-IP-29 Anbindung:** Ablauf-Helfer
    `onWorldSwitch(watch, w)` (Laden/anderer Start) → nachfolgendes `observe` `null`.
  - `tests/ui/hud.test.ts`: Chip fehlt ohne Probe, erscheint mit Probe, Text gleich `chipText`; nach `world.tick += 600` (ohne Echtzeit) «… · 1:00».
  - `tests/sim/scenario-saves.test.ts` (bestehend): neues Szenario lädt (läuft automatisch über `SCENARIOS`).
- [ ] **Lauf rot:** `npx vitest run tests/ui/challenge.test.ts tests/ui/hud.test.ts tests/sim/scenario-saves.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–6.
- [ ] **Lauf grün:** dieselben Dateien plus `tests/ui/startCard.test.ts tests/ui/menu.test.ts`; `echo EXIT=$?` → 0.
- [ ] **Sichtprüfung lokal:** Dev-Spielstand laden, Ziel erreichen, Ergebnis-Karte bei 1280 px; Screenshot `.studio/qa/INSELPROBEN/t10/`.
- [ ] **Teilbeleg** (Index).
- [ ] **Commit:** `feat: Uhr-Chip und Ergebnis-Karte der Inselproben (Inselproben T10)`.

## Task-Review

Prüfen: `observe` nach jedem `step`, nicht je Frame; Buchung nur über die Wache; `reset` an allen Lade- und Startpfaden; Uhr ohne Echtzeit; Zwischenablage mit
Rückfall ohne Wurf; Dev-Szenario nicht erreichbar aus Startkarte/Menü.
