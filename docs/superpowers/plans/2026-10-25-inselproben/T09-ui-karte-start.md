# T09 · Proben-Karte, Startkarte, Menü, Start-Ablauf

Umsetzer `tech-ui-engineer` · ≈ 50 Tools · AK-IP-19 (Teil), AK-IP-28 und -26 (Anbindung), Review Focus 1 und 5 · blocked-by: T08, **I-186 auf main** (P-7) ·
Worktree `.worktrees/inselproben-ui` (`feat/inselproben-ui`; vorher `git merge main`) · Spec §4.1, §5.3, §11

## Dateien

- neu: `src/ui/challengeCard.ts`
- ändern: `src/ui/startCard.ts`, `src/ui/menu.ts`, `src/ui/app.ts` (nur Start-Ablauf und Menü-Anbindung), `src/ui/challengeView.ts` (Modell-Helfer),
  `src/style.css`, `tests/ui/challenge.test.ts`, `tests/ui/startCard.test.ts`, `tests/ui/menu.test.ts`
- nicht ändern: `src/sim/`, `src/ui/challengeStore.ts` (nur nutzen), Ehrenbuch-Dateien

## Interfaces

- Consumes (T08): `readStore`, `writeStore`, `noteLaunch`, `NOTICE_TEXT`, `todayNumber`, `formatDay`, `shortDay`, `crisisText`, `launchChallenge`, `formatClock`;
  (T02–T04) `ChallengeStart`, `dailyDef`, `challengeDeadline`; `PROBES`, `SCENARIOS`, `GOAL_TEXT`; `openModal` (`modal.ts`).
- Produces:
  - `challengeView.ts`: `dailyLine(today: number, store: ProbeStore): string`; `cardModel(store: ProbeStore, today: number): CardModel` mit
    `CardModel = { daily: { title: string; lines: string[]; history: string[]; start: ChallengeStart | null }; probes: { id: string; line: string; ranks: string[];
start: ChallengeStart }[]; scenarios: { id: string; line: string; story: string; start: ChallengeStart }[] }`; `challengeStartPrompt(hasAutosave: boolean): string`.
  - `challengeCard.ts`: `openChallengeCard(host: HTMLElement, o: { model: CardModel; onStart(s: ChallengeStart): void }, opener: HTMLElement): () => void`.
  - `startCard.ts`: neue Wahl `{ kind: 'challenges'; label: 'Inselproben'; primary: false }` in `StartChoice`; Tageszeile unter den Knöpfen.
  - `menu.ts`: `MenuActions.openChallenges(opener: HTMLElement): void`; Knopf «Inselproben …» direkt unter «Neue Insel».

## Verhalten

1. `dailyLine`: «Tagesinsel {shortDay} · {GOAL_TEXT} · Bestzeit {formatClock(best) | –}» (z. B. «Tagesinsel 23.10. · 50 Bürger · Bestzeit –»); ungültiges
   Datum → «Tagesinsel nicht verfügbar».
2. `cardModel`: **Tagesinsel** Titel «Tagesinsel {formatDay}», Zeilen «Karte {date} · {Ziel} · Krisen {crisisText}», «Bestzeit heute {…|–} · Versuche {tries}»,
   Liste der letzten 14 Tage «{shortDay} · {Ziel} · {Bestzeit|–}». **Proben** je Zeile «Probe {nr} «{name}» · Karte {seed} · {Ziel} · Krisen {…} · Bestzeit
   {…|–}», `ranks` «1. 38:12» … bis 5. **Szenarien** «Schuldbrief · Frist {formatClock(deadlineTicks)} · {Stand}» mit Stand «bestanden {best}» oder «offen ·
   Versuche {tries}» (die Ablage kennt keine Niederlagen, Spec §6.2; «verloren» zeigen Chip und Ergebnis-Karte), `story` = `SCENARIOS.debt.story`.
3. Proben-Karte per `openModal`, Card-UI, drei Abschnitte, je Zeile «Starten»; Ränge in `<details>`; `Esc` schliesst (Modal-Standard); nur `textContent`.
4. Start-Ablauf in `app.ts`: `onStart(s)` → hat die laufende Partie Fortschritt (`hasProgress`), erst `confirm(challengeStartPrompt(hasAutosave))`; ohne
   Bestätigung nichts. Dann `launchChallenge(s, settings)`; `ok: false` → Meldung mit `reason`; sonst Partie mit dieser Welt starten (Weg wie «Neue Insel»,
   Welt als `loaded`), `noteLaunch(store, 'start', world.challenge, todayNumber(new Date()))`, `writeStore` (Misserfolg → einmalig `NOTICE_TEXT.unavailable`).
   Lade-, Fortsetzen- und Autosave-Pfade rufen **nie** `noteLaunch('start')`.
5. `challengeStartPrompt`: mit Autosave «Probe starten? Der bisherige Autosave wird beim nächsten Speichern ersetzt.», ohne «Probe starten? Die laufende Insel
   ist nicht gespeichert und geht verloren.»
6. Ablage-Hinweise `reset`/`older` erscheinen einmal je Seitenstart beim ersten Lesen (Startkarte oder Proben-Karte).

## Steps

- [ ] **Tests rot:**
  - `tests/ui/challenge.test.ts`: `dailyLine` leer/mit Bestzeit/ungültig; `cardModel` (5 Proben-Zeilen wörtlich für leere Ablage, Ränge sortiert, Tagesliste
    14 Einträge, Szenario «offen · Versuche 0» bzw. «bestanden 24:10»); **Review Focus 1** `challengeStartPrompt(true|false)` wörtlich und ein
    Ablauf-Helfer `shouldStart(hasProgress, confirmed)` → `false` bei Fortschritt ohne Bestätigung.
  - `tests/ui/startCard.test.ts`: `startChoices` enthält `challenges` nach «Neue Insel», bestehende Reihenfolge unverändert.
  - `tests/ui/menu.test.ts`: Knopf «Inselproben …» unter «Neue Insel» ruft `openChallenges`; **Review Focus 5** Menüzeile «Karte 20261023» bei `seed()` 20261023.
- [ ] **Lauf rot:** `npx vitest run tests/ui/challenge.test.ts tests/ui/startCard.test.ts tests/ui/menu.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–6.
- [ ] **Lauf grün:** dieselben Dateien plus Ehrenbuch-Tests (`tests/ui/honor*.test.ts`); `echo EXIT=$?` → 0.
- [ ] **Sichtprüfung lokal** (kein Playtest-Ersatz): `npm run dev`, Startkarte und Proben-Karte bei 1280 px öffnen, Screenshot in `.studio/qa/INSELPROBEN/t09/`.
- [ ] **Teilbeleg** (Index).
- [ ] **Commit:** `feat: Proben-Karte mit Start aus Startkarte und Menü (Inselproben T09)`.

## Task-Review

Prüfen: einziger `noteLaunch('start')`-Aufruf im Start-Pfad (`rg -n "noteLaunch" src/ui`); Einstellung «Alles frei» erreicht `launchChallenge` nicht; Bestätigung
vor jedem Start mit Fortschritt; `textContent` statt `innerHTML`; `app.ts`-Diff nur an Start-Ablauf und Menü-Anbindung (Ehrenbuch-Stellen unberührt).
