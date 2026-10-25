# T11 · Schuldbrief-UI: Schuld-Chip, Tilgen, Zins in der Bilanz, Erstattungs-Anzeigen

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK-IP-22, AK-IP-05 d (Anzeige) · blocked-by: T10 · Worktree `.worktrees/inselproben-ui` (`feat/inselproben-ui`) ·
Spec §4.2, §5.4; Anhang 02 F

## Dateien

- neu: `src/ui/debtCard.ts`
- ändern: `src/ui/hud.ts` (Chip `debt`), `src/ui/app.ts` (Aktionen Tilgen), `src/ui/balanceFlow.ts`, `src/ui/hints.ts` (Z. ≈ 361/365), `src/ui/texts.ts`
  (Z. ≈ 130), `src/ui/inspect.ts` (Z. ≈ 182), `src/ui/challengeView.ts`, `src/style.css`, `tests/ui/challenge.test.ts`, `tests/ui/balanceFlow.test.ts`,
  `tests/ui/hints.test.ts`, `tests/ui/texts.test.ts`, `tests/ui/inspect.test.ts`
- nicht ändern: `src/sim/`

## Interfaces

- Consumes (T03): `canRepay`, `repayDebt`, `repayAll`, `interestDue`, `demolishRefund`; `SCENARIOS.debt.repayStep`; `perMinute`, `UPKEEP_INTERVAL`.
- Produces:
  - `challengeView.ts`: `debtChipText(c: ChallengeState): string` («Schuld 3000»); `debtCardModel(world: World): { head: string; step: { label: string;
enabled: boolean; title: string }; all: { label: string; enabled: boolean; title: string } }`.
  - `debtCard.ts`: `openDebtCard(host, o: { model; onStep(): void; onAll(): void }, opener: HTMLElement): () => void`.
  - `balanceFlow.ts`: `flowLabel(stats, interest = 0)`, `flowTitle(stats, interest = 0)` — `interest` je 100 Ticks; Netto zieht ihn ab.

## Verhalten

1. Chip `debt` nur im Schuldbrief mit `debt > 0`; nach `result` bleibt er als Anzeige (Spec §5.4). Klick öffnet die Schuld-Karte.
2. `debtCardModel.head`: «Schuld {debt} · Zins {perMinute(interestDue, UPKEEP_INTERVAL)}/min» (bei 3000: «Schuld 3000 · Zins 90/min»).
   `step.label` «Tilgen {repayStep}» (bei Rest < Schritt «Tilgen {Rest}»), `enabled = canRepay(world, betrag).ok`, `title` = Grund aus `canRepay` (z. B. «Zu wenig
   Geld») bzw. leer. `all.label` «Tilgen (alles, was die Kasse trägt)», `enabled` wie `step`. Blass = `enabled === false` (CSS-Klasse wie gesperrte Bau-Knöpfe).
3. `onStep` → `repayDebt`; `onAll` → `repayAll`; `ok: false` → Meldung mit Grund. Nach `result`: Knöpfe blass mit «Schuldbrief beendet».
4. Bilanz: `flowLabel`/`flowTitle` mit `interestDue(world)`; Zeile/Teil «Zins −{n} / min» nur bei `interest > 0`; ohne Schuldbrief Text unverändert.
5. Erstattungs-Anzeigen: `hints.ts`, `texts.ts`, `inspect.ts` rechnen den Nennwert mit `demolishRefund(world, cost)` statt `refundCost(cost)`; im laufenden
   Schuldbrief mit Schuld zeigen sie damit 0, sonst unverändert.

## Steps

- [ ] **Tests rot:**
  - `tests/ui/challenge.test.ts`: `debtChipText`; `debtCardModel` bei Kasse 499 (Schritt blass, `title` «Zu wenig Geld»), 600 (klickbar), Schuld 200 («Tilgen 200»),
    nach `result` («Schuldbrief beendet»), Kopfzeile «Schuld 3000 · Zins 90/min».
  - `tests/ui/balanceFlow.test.ts`: mit `interest` 15 enthält `flowTitle` «Zins −90 / min», Netto um 90 kleiner; mit 0 Text gleich heute.
  - `tests/ui/hints.test.ts`, `texts.test.ts`, `inspect.test.ts`: Schuldbrief-Welt mit Schuld → Abriss-Hinweis, Abriss-Meldung und Rückerstattungszeile zeigen
    die Null-Form von `refundText`; Grundspiel-Welt → Texte wie heute (bestehende Tests grün).
- [ ] **Lauf rot:** `npx vitest run tests/ui/challenge.test.ts tests/ui/balanceFlow.test.ts tests/ui/hints.test.ts tests/ui/texts.test.ts tests/ui/inspect.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–5.
- [ ] **Lauf grün:** dieselben Dateien plus `tests/ui/hud.test.ts`; `echo EXIT=$?` → 0.
- [ ] **Sichtprüfung lokal:** Schuldbrief starten, Chip, Karte, Tilgen bei Kasse < 500 und ≥ 500, Bilanz-Tooltip; Screenshot `.studio/qa/INSELPROBEN/t11/`.
- [ ] **Teilbeleg** (Index).
- [ ] **Commit:** `feat: Schuldbrief-Bedienung mit Tilgen und Zins in der Bilanz (Inselproben T11)`.

## Task-Review

Prüfen: Blässe und Tooltip kommen aus `canRepay` (kein UI-eigener Geldvergleich); `refundCost(` in `src/ui` nur noch dort, wo kein Abriss gemeint ist
(`rg -n "refundCost\(" src/ui`); Bilanz ohne Schuldbrief bitgleich im Text; Zins je Minute über `perMinute`, kein Literal 90.
