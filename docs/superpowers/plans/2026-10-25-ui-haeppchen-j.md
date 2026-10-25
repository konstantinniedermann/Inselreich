# Plan UI-HAEPPCHEN-J · I-176 Warn-Toast 7 s + I-139 Rat in Chronik und Log + I-138 Wirkung vorab (Stufe leicht)

Owner `lead-tech` · Quelle: Kurzdesign `docs/superpowers/specs/2026-10-25-ui-haeppchen-j-design.md` (`design/ui-haeppchen-j` @ `0d0daf84`, AK-J1 bis J15), Gate-Spec BEDENKEN mit Auflagen 1 bis 5 (`.studio/handoffs/2026-10-25-lead-qa-gate-UI-HAEPPCHEN-J.md`), F1 bis F4 alle ja. Task-Dateien in [`2026-10-25-ui-haeppchen-j/`](2026-10-25-ui-haeppchen-j/).
Spielerwirkung: Warnungen stehen 7 s statt 3 s; der Rat steht in Chronik und Log; die Rats-Karte nennt vorab «Betrifft jetzt: n …».
**Kein Save** (`SAVE_VERSION` unberührt), **kein Spielwert** (`TOAST_MS` ist UI-Konstante), keine Abhängigkeit, kein ADR, **kein `src/sim/`-Diff**.

## Entscheide des Plans

- **P-1 Ein Strang, ein Umsetzer, seriell:** Worktree `.worktrees/ui-haeppchen-j` (Branch `feat/ui-haeppchen-j`) aus `plan/ui-haeppchen-j`. P2 und P3 ändern beide `council.ts` und `council.test.ts`; Parallelität bringt nichts (Parallelität 1). Reihenfolge T00, T01 (P1), T02 (P2), T03 (P3).
- **P-2 Auflagen des Gates:** (1) AK-J1b als Tabellentest über alle drei Arten mit Zahl: T01. (2) sticky: AK-J2 prüft im Browser zusätzlich, dass eine klebende Meldung stehen bleibt (T04); AK-J1 verweist darauf. (3) Toleranzband 6,5 bis 7,5 s (warn) und 2,5 bis 3,5 s (info), Auslöser siehe P-3: T04. (4) Plural bei mehreren offenen Beschlüssen: `Rat: n Beschlüsse offen` (n ≥ 2), `Rat: 1 Beschluss offen` (n = 1); gefasst plus offen: `Rat: Webordnung — 1 offen` bzw. `— 2 offen` (kein Plural, kurz): T02. (5) Test «nur stehende Gebäude zählen» (Baustelle zählt nicht) in T03; Test «Mehrstufensprung ergibt mehrere Log-Einträge» in T02.
- **P-3 Auslöser für den Browser-Check (ohne Code):** `npm run dev`, Konsole der Seite: `const m = await import('/src/ui/messages.ts'); m.showMessage('Test', 'warn')` (Vite-Dev liefert dieselbe Modulinstanz wie die App). Echte Krisen (Sturm, Brand) nur als Zusatz bei 4×; Zeitmessung per `performance.now()` zwischen Einfügen und Entfernen des `.toast`-Elements (`MutationObserver`). Kein neuer Dev-Probe.
- **P-4 Ein Reviewer am Ende (E-068, R693):** ≥ 2 Tasks, Diff voraussichtlich ≤ 300 Zeilen (ohne Tests und README): ein `qa-code-reviewer` (opus) über die ganze Branch statt je Task. Wird der Diff > 300 Zeilen, meldet der Umsetzer das vor T04.
- **P-5 Doku** (README: Meldungen, Chronik-Zeile «Rat», Vorschauzeile; `docs/arc42.md` nur falls Modulbeschreibung betroffen) als T05 per `SendMessage` an den Umsetzer (E-017).

## Dateimatrix (Ownership)

| Datei                                                      | T01 | T02 | T03 | T05 |
| ---------------------------------------------------------- | --- | --- | --- | --- |
| `src/ui/messages.ts`, `tests/ui/messages.test.ts`          | ja  |     |     |     |
| `src/ui/council.ts`, `tests/ui/council.test.ts`            |     | ja  | ja  |     |
| `src/ui/inspect.ts` (`buildRest`/`updateRest`, eine Zeile) |     | ja  |     |     |
| `src/ui/app.ts` (um `prevCouncil`, ≈ Z. 1002)              |     | ja  |     |     |
| `src/ui/councilCard.ts`, `tests/ui/councilCard.test.ts`    |     |     | ja  |     |
| `src/style.css` (eine Klasse)                              |     |     | ja  |     |
| `README.md`, `docs/arc42.md` (falls nötig)                 |     |     |     | ja  |

Nicht angefasst: `src/sim/`, `src/render/`, `src/audio/`, `docs/studio/` (insbesondere `rulings.md`), Specs.

## Tasks

| Task | Titel                                                     | Datei                  | AK-IDs          | Strang | blocked-by | Modell | Tools | Persona            |
| ---- | --------------------------------------------------------- | ---------------------- | --------------- | ------ | ---------- | ------ | ----- | ------------------ |
| T00  | Testzeiten der berührten Tests vorab, Worktree, Basis     | `T00-vorab.md`         | –               | A      | Gate Plan  | sonnet | 10    | `tech-ui-engineer` |
| T01  | P1 `toastLifetimeMs`, `TOAST_MS`, `appendToast`           | `T01-warn-toast.md`    | J1, J1b         | A      | T00        | sonnet | 25    | `tech-ui-engineer` |
| T02  | P2 `councilChronicleLine`, `councilDecided(Entries)`, Log | `T02-rat-chronik.md`   | J4 bis J7       | A      | T01        | sonnet | 40    | `tech-ui-engineer` |
| T03  | P3 `councilPreview`, Feld `preview`, Kartenzeile, CSS     | `T03-wirkung-vorab.md` | J9 bis J14      | A      | T02        | sonnet | 40    | `tech-ui-engineer` |
| T04  | Browser-Check P1 bis P3 (`qa-playtester`)                 | `T04-playtest.md`      | J2, J3, J8, J15 | A      | T03        | sonnet | 35    | `qa-playtester`    |
| T05  | Doku (README) per `SendMessage`                           | `T05-doku.md`          | –               | A      | T04        | sonnet | 8     | `tech-ui-engineer` |

Summe ≈ 160 Tools. Nur Lauf (kein eigener Test): AK-J7 und AK-J14 (Welt `serialize`-gleich ist Test; Sim-Teil als Lauf): `git diff main -- src/sim` leer, `SAVE_VERSION` unberührt, `tests/sim/balance.test.ts` grün, im Abschluss.

## AK-Zuordnung (15 AK)

| AK         | Beleg                                                           | Task |
| ---------- | --------------------------------------------------------------- | ---- |
| J1, J1b    | `tests/ui/messages.test.ts`                                     | T01  |
| J2, J3     | Browser-Check (Band 6,5 bis 7,5 s; sticky bleibt; Pause)        | T04  |
| J4 bis J6  | `tests/ui/council.test.ts` (mit n ≥ 2 offen, Mehrstufensprung)  | T02  |
| J7         | `serialize`-Test in `council.test.ts` plus Lauf (Sim-Diff leer) | T02  |
| J8         | Browser-Check                                                   | T04  |
| J9 bis J12 | `tests/ui/council.test.ts` (inkl. Baustelle zählt nicht)        | T03  |
| J13        | `tests/ui/councilCard.test.ts`                                  | T03  |
| J14        | `serialize`-Test plus Lauf                                      | T03  |
| J15        | Browser-Check                                                   | T04  |

## Budget (Vorschlag für das Gate Plan)

**Gesamt 4 Starts, Parallelität 1.** Geplant 3: Umsetzer `tech-ui-engineer` (T00 bis T03, ein Start; T05 per `SendMessage`) 1, `qa-playtester` (T04) 2, `qa-code-reviewer` **opus** über die ganze Branch als Final-Review (E-068) 3. **Reserve 1** (Wiederholung Playtest oder Reviewer-Wiederholung). Rechnung: 3 × 1,3 = 3,9, aufgerundet 4. Fix-Runden und Delta-Review (R553) per `SendMessage` zählen nicht. Controller: Lead `sonnet`, ein Umsetzer; L0 kann den Umsetzer direkt briefen (E-037).

## Test- und Prüfpflichten (Umsetzer-Briefing wörtlich)

- **Testsperre (R380):** Tests erst bei freier Sperre (`uptime`: 1-min-Load ≤ 4, kein anderer `vitest`/`make check`-Lauf; sonst `waiting`).
- **Rot zuerst:** je neuem Test den Lauf vor der Umsetzung mit roter Ausgabe (Exit ≠ 0) im Bericht belegen (`…; echo EXIT=$?`, nie in eine Pipe).
- **Teilbeleg am Ende:** gezielte Tests (Befehle je Task-Datei), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`; `make docs-check` vor Doku-Commits. Nie `make check` je Task.
- **Zeittests (R270):** neue Tests ohne Uhr; `messages.test.ts` testet nur die reine Funktion, keine `setTimeout`-Wartezeit.
- **Keine `Contract`-Literale** in neuen Tests (R679-2).
- **Abschluss (Controller):** `git diff main -- src/sim` leer, `SAVE_VERSION` unberührt, `tests/sim/balance.test.ts` grün.

## Ruling-Entwurf (für `docs/studio/rulings.md`, L0 entscheidet)

- **R-J-E (Gate Plan UI-HAEPPCHEN-J):** Plan freigegeben: ein Strang, ein Umsetzer, T00 bis T05; Budget 4 Starts (3 geplant, 1 Reserve), Parallelität 1; ein Final-Review statt Task-Reviews (E-068); Gate-Auflagen 1 bis 5 umgesetzt (P-2), Plural-Text «Rat: n Beschlüsse offen»; kein Save, kein Spielwert, kein ADR.
