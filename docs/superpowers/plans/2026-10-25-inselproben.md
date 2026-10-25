# Plan INSELPROBEN · Modus «Inselproben»: Probe, Tagesinsel, Szenario «Schuldbrief» (Stufe voll, M14)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (Controller `lead-tech` auf `sonnet`). Steps in den Task-Dateien als Checkbox (`- [ ]`).

Owner `lead-tech` · **Spec:** `docs/superpowers/specs/2026-10-23-modus-inselproben-design.md` (§10 ist Index), AK-Wortlaut und Strategien in
`…-design/anhang-02-abnahmekriterien.md` (AK-IP-01 … -31), Rechnung `…-design/anhang-01-schuldbrief-rechnung.md` (`design/modus-inselproben` @ `a7e5fff2`) ·
Gate Spec R874 (BEDENKEN, Auflagen 1–4 eingearbeitet), F1–F7 wie empfohlen · Plan gegen main `ec144e82` (SAVE_VERSION 18). Task-Dateien in
[`2026-10-25-inselproben/`](2026-10-25-inselproben/).

**Gate Plan:** BEDENKEN angenommen (Handoff `.studio/handoffs/2026-10-25-lead-qa-gate-plan-INSELPROBEN.md`); Auflagen H1–H3 und N1–N5 eingearbeitet
ohne Zweitprüfung. Budget **43 Starts / Parallelität 2** genehmigt; Umsetzungsstart erst nach dem L0-Start-Briefing, T09 nach I-186 auf main, T14 nach Stadtplanung.

**Goal:** Ein Probe-Rahmen startet feste Inseln mit festem Ziel und misst Spielzeit in Ticks; darauf fünf Proben, die Tagesinsel und das Szenario
«Schuldbrief» (Zins, Tilgen, Frist, keine Abriss-Erstattung bei offener Schuld); Bestzeiten lokal in `inselreich.proben`; Grundspiel bitgleich.

**Architecture (≤ 15 Zeilen):**

- Defs `src/sim/defs/challenges.ts` (Proben, Wochenplan, `SCENARIOS.debt`, `CHALLENGE_REV`, Zieltexte); reine Kalender-Rechnung `src/sim/calendar.ts`.
- Weltfeld `challenge: ChallengeState | null` als **letztes** Feld; `createWorld` setzt `null` und bleibt sonst unverändert.
- Regeln `src/sim/challenge.ts`: `startChallenge(start)` baut die Welt über `createWorld(seed, { crisisLevel, unlockAll: false })`, `tickChallenge` ist der
  **letzte** Aufruf in `step` (hinter `checkWin`, `tickUnlocks`), ohne Probe sofortige Rückkehr. Reihenfolge darin: `result` gesetzt → Rückkehr, Zins, Bestehen, Frist.
- Erstattung: `demolishRefund(world, cost)` in `economy.ts` (null bei offener Schuld im laufenden Schuldbrief, sonst `refundCost`); `build.ts`,
  `effectiveRefund` und die UI-Anzeigen lesen nur noch diesen Helfer. `refundCost` bleibt rein.
- Save versionsneutral: `SAVE_V_CHALLENGE` in `save.ts`, `SAVE_VERSION = SAVE_V_CHALLENGE`, Migration `migrateToChallenge` (Vorgänger → `SAVE_V_CHALLENGE`),
  `isValidChallenge` in `isWellFormed`. Rückfalt-Helfer `foldBackChallenge`/`dropChallenge` in `tests/sim/helpers.ts`, `foldBackToV13` ruft `dropChallenge`.
- UI: DOM-freie Helfer `src/ui/challengeStore.ts` (Ablage, Wache `createResultWatch`) und `src/ui/challengeView.ts` (Texte, Datum); Modals
  `challengeCard.ts`, `challengeResult.ts`, `debtCard.ts`; Anbindung in `app.ts`, `hud.ts`, `startCard.ts`, `menu.ts`. Die Sim kennt die Ablage nicht.
- `formatClock` (`src/ui/time.ts`) zeigt ab 60 min «h:mm:ss» (AK-IP-15; gilt überall, P-3).

## Plan-Entscheide (P-n)

- **P-1 Save-Nummer (R874 E-A):** Auf dem Branch `SAVE_V_CHALLENGE = 19` (main 18 + 1). Steht Stadtplanung (v19) vor dem Merge-Gate auf main, setzt **T14**
  `SAVE_V_CHALLENGE = 20` und die Literale `version` in `types.ts`/`world.ts`; Tests nennen nie eine Zahl (`SAVE_VERSION + 1`, `SAVE_V_CHALLENGE − 1`). Merge-Gate erst nach T14.
- **P-2 Mess-Tasks (L0-Briefing):** T05–T07 messen Lösbarkeit mit Controllern unter `tests/sim/`; Messwerte werden als Pin mit Vermerk «Messwert, Änderung nur
  per Ruling» geschrieben und **sofort an L0 gemeldet** (Entwurf im Controller-Bericht). F7-Werte und Tickgrenzen Proben 2–5 gelten erst nach diesem Ruling.
- **P-3 `formatClock` global:** Uhr ab 60 min «1:00:00» auch in Autosave-Zeilen und Log (heute «60:00»); ein Format für alle Spielzeiten (DRY).
- **P-4 Dev-Spielstand AK-IP-21:** als Szenario `ip-probe1-kurz-vor-ziel` in `tests/sim/scenarios.ts` (bestehende Dev-Save-Strecke), nicht in `devProbes.ts`
  (die Sonde liest nur); kein Produktivcode, nie in der Startkarte. **Vermerk (N3):** Spec Anhang 02 AK-IP-21 nennt noch `devProbes.ts`; massgeblich ist
  P-4 mit E-IP-2 (L0 angenommen). Der Spec-Wortlaut wird nicht nachgezogen.
- **P-5 Controller-Mittel (AK-IP-24):** erlaubt sind Sim-Aktionen und `forceTerrain`/`prepareLayout` wie in den bestehenden Controllern; verboten sind direkte
  Schreibzugriffe auf `money`, `stock`, Einwohner, Ziel-Flaggen oder `challenge`. Ein Lauf startet immer über `startChallenge`.
- **P-6 Ein Browser-Check (T12)** für T09–T11 statt drei: alle drei Tasks teilen den Ablauf Start → Uhr → Ergebnis; Begründung nach R270.
- **P-7 Ehrenbuch zuerst (F5):** T09/T10 ändern `app.ts`, `menu.ts`, `startCard.ts`, `style.css` wie I-186 T05/T06; sie starten erst nach I-186 auf main
  (`git merge main` vorher). Die Wache steht in `app.ts` direkt neben dem Ehrenbuch-Tracker hinter `step`.

## Stränge, Worktrees, Datei-Ownership

`feat/inselproben` in `.worktrees/inselproben` ab `plan/inselproben` (T01–T04, Integration, T13, T14). Nach T03 ab `feat/inselproben`:
`feat/inselproben-mess` (`.worktrees/inselproben-mess`, T05–T07) und `feat/inselproben-ui` (`.worktrees/inselproben-ui`, T08–T11). Vor T12 merged der
Controller beide per `git merge` in `feat/inselproben` (disjunkt, kein Rebase). **Vor T09 (H1):** `git merge feat/inselproben` in `feat/inselproben-ui`
(nach T04, damit `dailyDef` und der `daily`-Start da sind). Vor jedem Worktree `git worktree list` (R329); `node_modules` als Symlink.

| Dateien                                                                                                                                                                                          | Strang | Tasks                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------- |
| `src/sim/defs/challenges.ts`                                                                                                                                                                     | sim    | T01, T02                |
| `src/sim/defs/challenges.ts` (nur Karten-Nummer als Fallback oder Probe-Zeile nach Ruling E-IP-1), dazu `tests/sim/challenge.test.ts` **nur** AK-IP-12 a und -03 (H3), zeitlich nach T04         | mess   | T06, T07                |
| `src/sim/calendar.ts`, `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/save.ts`, `tests/sim/helpers.ts`, `tests/sim/challengePins.ts`, `tests/sim/{helpers,farOrder-save,save-loyalty}.test.ts` | sim    | T01, T14                |
| `src/sim/challenge.ts`, `src/sim/tick.ts`, `tests/sim/challenge.test.ts`, `tests/sim/challenge-mirror.test.ts`                                                                                   | sim    | T02, T03, T04           |
| `src/sim/economy.ts`, `src/sim/build.ts`, `src/sim/queries.ts`; `tests/sim/{goal3,monument}.test.ts`, `tests/sim/monumentHelpers.ts` (T02: Helfer verschieben, N2)                               | sim    | T02, T03                |
| `tests/sim/challenge-daily.test.ts`                                                                                                                                                              | sim    | T04                     |
| `tests/sim/challengeControllers.ts`, `tests/sim/challenge-solvable.test.ts` (neu)                                                                                                                | mess   | T05–T07                 |
| `src/ui/time.ts`, `src/ui/challengeStore.ts`, `src/ui/challengeView.ts`, `tests/ui/challenge.test.ts`, `tests/ui/time.test.ts`                                                                   | ui     | T08 (+T09–T11 ergänzen) |
| `src/ui/challengeCard.ts`, `src/ui/startCard.ts`, `src/ui/menu.ts`, `tests/ui/{startCard,menu}.test.ts`                                                                                          | ui     | T09                     |
| `src/ui/app.ts`, `src/style.css`                                                                                                                                                                 | ui     | T09, T10, T11 (seriell) |
| `src/ui/challengeResult.ts`, `src/ui/hud.ts`, `tests/ui/hud.test.ts`, `tests/sim/scenarios.ts`, `tests/sim/scenario-saves.test.ts` (Namensliste, H2; T11 ergänzt `hud.ts`)                       | ui     | T10, T11                |
| `src/ui/debtCard.ts`, `src/ui/balanceFlow.ts`, `src/ui/hints.ts`, `src/ui/texts.ts`, `src/ui/inspect.ts`, `tests/ui/{balanceFlow,hints,texts,inspect}.test.ts`                                   | ui     | T11                     |
| `README.md`, `docs/arc42.md`, `docs/spielwerte.md`, `docs/adr/ADR-017-inselproben.md` (Nummer prüfen), Spec-Kopfzeile «Plan», `docs/beobachtungen.md` (D1, E-017)                                | doku   | T13                     |

Nicht angefasst: `tests/sim/balance*.test.ts`, `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, übrige `src/sim/defs/*`, `src/render/`, `src/audio/`,
`src/ui/storage.ts`, `src/ui/devProbes.ts`, `docs/studio/`. Konfliktrisiko: Stadtplanung (`save.ts` Version/Kette, `types.ts`, `world.ts`, Hilfen; prüfen auch `build.ts`/`economy.ts` aus T03, N2) → T14;
I-186 (`app.ts`, `menu.ts`, `startCard.ts`) → P-7; Seerecht nach uns (R874), Stadtrecht `charter` nach uns (Rückfalt-Helfer kommutativ, AK-IP-11 e).

## Tasks

| Task | Titel                                                       | Datei                     | AK-IP                                | Strang | blocked-by                 | Modell | Tools | Persona             |
| ---- | ----------------------------------------------------------- | ------------------------- | ------------------------------------ | ------ | -------------------------- | ------ | ----- | ------------------- |
| T00  | Testzeit-Ausgang (gemessen beim Plan, E-052)                | `T00-testzeiten.md`       | –                                    | –      | –                          | –      | 3     | Controller          |
| T01  | Defs, Kalender, Weltfeld, Save versionsneutral, Rückfalten  | `T01-defs-save.md`        | 01, 09 (Kalender), 11, 12 a          | sim    | T00                        | sonnet | 60    | `tech-sim-engineer` |
| T02  | `startChallenge`, `tickChallenge` (Bestehen), Reihenfolge   | `T02-start-tick.md`       | 02, 03, 04, 10 (Probe), 12 b, 13, 31 | sim    | T01                        | sonnet | 50    | `tech-sim-engineer` |
| T03  | Schuldbrief: Zins, Frist, `repayDebt`, Erstattung 0         | `T03-schuldbrief.md`      | 05, 06, 07, 08, 10 (Szenario), 30    | sim    | T02                        | sonnet | 55    | `tech-sim-engineer` |
| T04  | Tagesinsel: `dailyDef`, Start, 730 Karten                   | `T04-tagesinsel.md`       | 09, 10 (Tagesinsel)                  | sim    | T03                        | sonnet | 35    | `tech-sim-engineer` |
| T05  | Messlauf Schuldbrief (Ref, G1–G3, flache Mitte)             | `T05-mess-schuldbrief.md` | 14                                   | mess   | T03                        | sonnet | 50    | `tech-sim-engineer` |
| T06  | Messlauf Proben 2 und 3                                     | `T06-mess-proben-2-3.md`  | 24 (Probe 2, 3)                      | mess   | T05                        | sonnet | 40    | `tech-sim-engineer` |
| T07  | Messlauf Proben 4 und 5 (Gewürz-, Denkmal-Phase)            | `T07-mess-proben-4-5.md`  | 24 (Probe 4, 5)                      | mess   | T06                        | sonnet | 70    | `tech-sim-engineer` |
| T08  | UI-Helfer: Uhr, Ablage, Wache, Texte, Datum                 | `T08-ui-helfer.md`        | 15, 16, 17, 18, 25, 26, 27, 28, 29   | ui     | T03                        | sonnet | 55    | `tech-ui-engineer`  |
| T09  | Proben-Karte, Startkarte, Menü, Start-Ablauf                | `T09-ui-karte-start.md`   | 19, 28 (`daily`, Anbindung), 26      | ui     | T08, T04, I-186 (P-7)      | sonnet | 50    | `tech-ui-engineer`  |
| T10  | Uhr-Chip, Ergebnis-Karte, Ablage-Anbindung, Dev-Spielstand  | `T10-ui-chip-ergebnis.md` | 20, 21, 23, 29 (Anbindung)           | ui     | T09                        | sonnet | 55    | `tech-ui-engineer`  |
| T11  | Schuldbrief-UI: Schuld-Chip, Tilgen, Zins-Zeile, Erstattung | `T11-ui-schuldbrief.md`   | 22, 05 d (Anzeige)                   | ui     | T10                        | sonnet | 45    | `tech-ui-engineer`  |
| T12  | Browser-Check 1280 px                                       | `T12-playtest.md`         | 19, 20, 21, 22, 23                   | ui     | T04, T07, T11, Integration | sonnet | 35    | `qa-playtester`     |
| T13  | Doku, ADR-017 (D1, E-017)                                   | `T13-doku.md`             | Spec §12 Doku                        | doku   | T12                        | sonnet | 20    | `tech-sim-engineer` |
| T14  | Nachzug Stadtplanung: `git merge main`, Save-Nummer         | `T14-nachzug-save.md`     | 11, 13 (Lauf), 01 (Pin)              | sim    | Stadtplanung auf main, T13 | sonnet | 35    | `tech-sim-engineer` |

Jeder Umsetzer-Task: Review durch `qa-code-reviewer` (sonnet, Urteil OK/BEDENKEN/ZURÜCK), Fix-Runde per `SendMessage`. Final-Review: `qa-code-reviewer` auf `opus`, gesteuert von `lead-qa` (1 Start), über
`git diff main...feat/inselproben` nach T14; ZURÜCK → Fix, dann Delta-Review desselben Reviewers per `SendMessage` (R553).

## Global Constraints (gelten in jedem Task)

- `src/sim/` DOM-frei, deterministisch, kein `Date`; Aktionen werfen nie (`{ ok, reason }`); Spielwerte nur in `src/sim/defs/challenges.ts`.
- Werte (Vorschlag bis Ruling nach T05): Startkasse 5000, Schuld 3000, Zins 5 ‰ je 100 Ticks (`ceil(S × z / 1000)`), Tilgungsschritt 500, Frist 18 000, Erstattung 0.
- Proben (Karte, Ziel, Krisen): 1 «Erste Ernte» 3 `citizens` aus · 2 «Unruhige Küste» 21 `citizens` normal · 3 «Handelsstadt» 58 `merchants` mild ·
  4 «Gewürzstadt» 345 `spice` mild · 5 «Feuerschale» 777 `monument` normal. Wochenplan Mo–So: citizens mild, citizens normal, citizens aus, citizens normal,
  citizens mild, merchants mild, merchants normal.
- Tick-Konvention: jeder Tickwert ist `world.tick` **nach** `step`; Grenzen als Dreiklang `t − 1 / t / t + 1` (Frist 17 999/18 000/18 001, Zins 99/100/101).
- Grundspiel bitgleich: `createWorld` ohne Probe → `challenge: null`; `tests/sim/balance*.test.ts` ohne Diff und grün; kein Controller in `balance*` startet eine Probe.
- Freischaltung in jeder Probe `unlockAll: false`, auch bei Einstellung «Alles frei».
- Texte wörtlich wie in den Task-Dateien (Spec §4, §6.3); Desktop-first ab 1280 px, bei 800 px nur «stürzt nicht ab»; nur `textContent`, kein `innerHTML`.
- Keine neue Laufzeit-Abhängigkeit; `dep-guard` nie umgehen. Bestehende Tests nur ergänzen, Anpassung nur wo der Task sie nennt.

## Review Focus (nicht durch AK abgedeckt; Test im genannten Task)

1. Start einer Probe aus laufender Partie mit Fortschritt ohne Bestätigung überschreibt den Autosave → T09: `challengeStartPrompt(hasProgress, hasAutosave)` und Test, dass ohne Bestätigung nicht gestartet wird.
2. «Tilgen (alles)» bei negativer oder knapper Kasse (−50, 499, 500, 1499, Rest 200) → T03: `repayAll` zahlt 0/0/500/1000/200 bzw. liefert den Grund.
3. Mitternacht während des Laufs: Ergebnis wird auf `challenge.date` gebucht, nicht auf «heute» → T08: `recordResult` mit `today = date + 1`.
4. Tempo 4× (mehrere `step` je Frame) verpasst den Übergang nicht und bucht ihn genau einmal → T08: Wache über 3 Schritte, `observe` je Schritt, ein Treffer.
5. Achtstellige Kartennummer (Tagesinsel) in Menü-Zeile und Teilen-Text → T09 Test der Menüzeile mit `seed` 20261023; T12 Sichtprüfung bei 1280 px.

## Risiken (R553)

- **Proben 4/5 ohne End-zu-End-Controller:** Heute erreicht kein Controller `wonSpice` oder `monumentDone` ab Spielstart (Gewürz- und Denkmal-Tests bauen den
  Stand per Helfer). T07 baut die Phasen auf `runMerchants` auf; Zeitkasten 70 Tools. Ohne grünen Lauf gilt Spec Anhang 02 D: Probe bleibt nicht in der
  Liste → Entscheid L0 (E-IP-1). Die Controller erzwingen Gelände östlich des Kontors; ob das auf Seeds 21/58/345/777 im Rahmen liegt, prüft T06/T07 (Fallback Seed).
- **Tickgrenzen Proben 2–5 (N1):** je ein deterministischer Controller-Lauf, Grenze = Messwert × 1,25 auf 250. Das ist Regressionsschutz, keine
  Balancing-Aussage über Spieler-Zeiten; Rückfall bei Bruch: Ruling (neue Messung oder Grenze), nie stilles Anheben.
- **F7 auf einem Modell:** Rang Ref < G1 < G2 kann im Controller kippen (Klumpenkäufe). Rückfall per Ruling S0 3750 (Anhang 01 §g); keine stille Anpassung.
- **Save-Reihenfolge:** Merge vor Stadtplanung ist ausgeschlossen (P-1); hängt Stadtplanung, wartet T14 (`blocked`).

## AK-Zuordnung (31 AK)

| AK-IP                       | Beleg                                                              | Task               |
| --------------------------- | ------------------------------------------------------------------ | ------------------ |
| 01, 11                      | `tests/sim/challenge.test.ts` (Save), Hash-Pin                     | T01, T14           |
| 09 (Kalender, ungültig)     | `tests/sim/challenge.test.ts`                                      | T01                |
| 09 (`dailyDef`, 730 Karten) | `tests/sim/challenge.test.ts`, `tests/sim/challenge-daily.test.ts` | T04                |
| 12 a / 12 b                 | Def-Test / Textsuche-Test                                          | T01 / T02          |
| 02, 03, 04, 10, 13, 31      | `tests/sim/challenge.test.ts`; 13 = Lauf `balance*.test.ts`        | T02 (10: T03, T04) |
| 05, 06, 07, 08, 30          | `tests/sim/challenge.test.ts`                                      | T03                |
| 14, 24                      | `tests/sim/challenge-solvable.test.ts`                             | T05–T07            |
| 15–18, 25–29                | `tests/ui/challenge.test.ts`, `tests/ui/time.test.ts`              | T08 (+T09, T10)    |
| 19–23                       | Browser, `.studio/qa/INSELPROBEN/`                                 | T12                |

## Test- und Prüfpflichten (wörtlich in jedes Umsetzer-Briefing)

- **Testsperre (R380, R329):** Tests nur bei freier Sperre (`uptime`: 1-min-Load ≤ 4, kein fremder `vitest`/`make check`); sonst `waiting`.
- **Rot zuerst:** neuer Test vor der Umsetzung; rote Ausgabe (Exit ≠ 0) im Bericht.
- **Teilbeleg (R810), nie `make check` je Task:** gezielte Tests `npx vitest run <Dateien>; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`,
  `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`. Sim-Tasks zusätzlich `npx vitest run tests/sim/balance*.test.ts; echo EXIT=$?` (Balancing grün).
- **Determinismus-Beleg:** T02 und T03 nennen den Spiegel-Test AK-IP-31 a und den Hash-Pin AK-IP-01 grün; `git diff main -- tests/sim/balance*.test.ts` leer.
- **Messproben** nie im Hauptcheckout und nie als `*.test.ts` unter `tests/` ausser den geplanten Dateien; Erkundung im Worktree oder Scratchpad.
- **Zeittests:** keine Uhr (`Date.now`, `performance.now`) in neuen Tests; Datum in UI-Tests nur als festes `new Date(2026, 9, 23, 23, 59)`.
- **Arbeiter-Briefing:** «Melde dein Ergebnis per SendMessage an <agentId des Controllers>, nie an main» (R856); `Budget: keins, keine Agenten starten`.

## Abschluss (Controller, nach T12 und erneut in T14)

`make check; echo EXIT=$?` bei freier Sperre; A/B-Vergleich gegen T00 (Tests > 200 ms, Abweichung > 30 % benennen); `git diff main -- tests/sim/balance*.test.ts` leer.
Voller Lauf inkl. Balancing über `make push-check` beim Release (R810).

## Budgetantrag (templates/budgetantrag.md)

```text
Lead: lead-tech
Phase: plan-INSELPROBEN → Umsetzung INSELPROBEN
Pakete:
- T01 Defs, Kalender, Weltfeld, Save (UI nein)    - T08 UI-Helfer (UI nein, DOM-frei)
- T02 Start, tickChallenge (UI nein)              - T09 Proben-Karte, Start (UI ja)
- T03 Schuldbrief-Regeln (UI nein)                - T10 Chip, Ergebnis-Karte (UI ja)
- T04 Tagesinsel (UI nein)                        - T11 Schuldbrief-UI (UI ja)
- T05 Messlauf Schuldbrief (UI nein)              - T13 Doku, ADR-017 (UI nein)
- T06 Messlauf Proben 2–3 (UI nein)               - T14 Nachzug Save (UI nein)
- T07 Messlauf Proben 4–5 (UI nein)
Formel: 13 × 2 + 1 QA-Check (T12, P-6) + 1 Final-Review = 28; + 5 Controller-Starts (R874 A2) = 33 → × 1,3 = 42,9 → aufgerundet 43
Parallelität: 2 (Begründung: Stränge sim/mess und ui in eigenen Worktrees mit disjunkter Ownership)
Bisher frei/verbraucht: —
Begründung Mehrbedarf: —
Befundklasse je Runde + Ansatz-Alternative: —
Kumuliert: 0 von 0 Starts (Plan-Paket: 0 von 2 verbraucht)
Beantragt: 43 Starts, Parallelität 2
```

**Controller** (`lead-tech` sonnet, ≤ 4 Tasks, ≤ 6 Starts je Instanz, R167/R190; Übergabe per Ledger und Handoff, kein Warten innerhalb einer Instanz, R750):
**I1** T01, T02, T03 (6 Starts; T00 liegt vor) · **I2** T04 ∥ T08, dann T05 (6) · **I3** T06, T07, T09 (6; T09 erst nach I-186 auf main) · **I4** T10, T11,
Integration, T12 (5) · **I5** T13, T14 (nach Stadtplanung), Final-Review (5). Fix-Runden und Delta-Review per `SendMessage` (zählen nicht).

**Messfenster:** Tick-Ergebnisse der Controller sind deterministisch und last-unabhängig; nur Laufzeiten (Zeitlimits, `zeitreserve`) brauchen 1-min-Load ≤ 4.
Bedarf: **ein Fenster ≈ 15 min** nach T07 (Dateien `challenge-daily`, `challenge-solvable`, `challenge` je dreimal, Median) plus der kurze Step 0 in T04
(≈ 2 min). Anmeldung durch den Controller über `make messfenster` bzw. die Sperre `messfenster-sperre` (Owner Controller). T00 ist bereits gemessen.

**Abhängigkeiten von aussen:** I-186 Ehrenbuch auf main vor T09 (P-7); Stadtplanung auf main vor T14 (P-1); Merge-Gate erst nach T14 und Final-Review.

## Entscheidungsbedarf an L0 (Entwurf, R471)

- **E-IP-1** Proben 4/5: Controller-Mittel nach P-5; schafft T07 ein Ziel im Zeitkasten nicht, meldet der Controller Messwerte, L0 entscheidet: Probe
  vorerst aus der Liste (Spec Anhang 02 D, Empfehlung) oder Ziel tauschen. **Empfehlung:** P-5 und diese Regel jetzt annehmen.
- **E-IP-2** P-3 (`formatClock` global «h:mm:ss») und P-4 (Dev-Spielstand in `scenarios.ts`). **Empfehlung:** annehmen.
- **E-IP-3** Rulings nach T05 (F7) und T06/T07 (Karten-Nummern, Tickgrenzen × 1,25 auf 250); Umsetzung läuft weiter, Pins tragen «Messwert».
