# Plan I-197 · Kartennummer wählen (Stufe leicht)

Owner `lead-tech` · Quelle: Kurzdesign `docs/superpowers/specs/2026-10-25-i197-kartennummer-design.md` (`design/i197-i201` @ `8a1191f8`), Gate-Spec BEDENKEN B1 bis B3 (`.studio/handoffs/2026-10-25-lead-qa-gate-I-197.md`), L0-Entscheide B1 bis B3. Task-Dateien in [`2026-10-25-i197-kartennummer/`](2026-10-25-i197-kartennummer/).
Spielerwirkung: Der Spieler tippt bei «Neue Insel» eine Kartennummer ein und spielt dieselbe Insel wie ein Freund oder die letzte Partie; leer bleibt Zufall.
**Kein Save** (`SAVE_VERSION` unberührt), **kein Spielwert**, keine Abhängigkeit, kein ADR, **kein `src/sim/`-Diff**.

## Entscheide des Plans

- **P-1 Abhängigkeit:** Umsetzung erst nach dem Inselproben-UI-Task (`menu.ts`, `app.ts` gemeinsam). T00 prüft den gemergten Stand; Zeilenangaben der Spec (`menu.ts:125`, `app.ts:331/522`) sind dann verschoben, massgeblich sind Symbole (`newIsland`, `launch`, `createWorld(Date.now() % 100000`).
- **P-2 Eingabegrenze 0 bis 99 999 949 (L0 B2):** `SEED_MAX = 99_999_949`; `seedUsed` ≤ `n + 49` bleibt ≤ 99 999 998, also achtstellig und wieder eintippbar. Hinweistext mit 99999949. **Der Plan weicht damit von Regel 2/3 der Spec ab (99 999 999); die Spec-Zahl wird bei Freigabe per Ruling überschrieben**, kein Spec-Edit im Plan.
- **P-3 AK-K3 ist ein Charakterisierungstest (L0 B1):** `generateMap`/`createWorld` existieren, der Test ist voraussichtlich sofort grün; kein Rot-Beleg, im Bericht so benannt. Er läuft als Erstes (T01). Rot = Befund: Rückfall auf 99 999 (mechanisch: `SEED_MAX`, Regex, K1) und Meldung an L0.
- **P-4 Fixpunkt auch an der Grenze:** AK-K2 für 0, 1, 21, 345, 4711, 99999, 20261025, 99999949, dazu `seedUsed` ≤ `n + 49` und `/^\d{1,8}$/` auf `seedUsed` (T01).
- **P-5 B3 eindeutig prüfbar:** AK-K5 = `pickSeed(seed: number | undefined, now: number): number` in `src/ui/seedInput.ts` (`seed ?? now % 100000`, Test mit 0). Neue **AK-K12** Info-Text `seedNote(requested, used)` («Karte 4711 nicht bebaubar, genutzt: 4712», `null` bei Gleichheit) als Vitest, Verdrahtung im Browser. Neue **AK-K13** «geladene Welt ignoriert `opts.seed`»: strukturell (Ladepfad übergibt nie `seed`, `loaded ??` gewinnt) im Review plus Browser (4711 starten, speichern, anders starten, laden: `Karte 4711`). AK-K7 vergleicht die `Karte N`-Anzeige und die Kontor-Koordinate, nicht Pixel.
- **P-6 Ein Reviewer am Ende (E-068):** ≥ 2 Tasks, Diff voraussichtlich ≤ 300 Zeilen ohne Tests und README: ein `qa-code-reviewer` (opus) über die ganze Branch statt je Task. Wird der Diff > 300 Zeilen, meldet der Umsetzer das vor T04.
- **P-7 Ein Strang, ein Umsetzer, seriell:** Worktree `.worktrees/i197` (Branch `feat/i197`); `tech-ui-engineer` macht T00 bis T03 in einem Start, T05 per `SendMessage` (E-017). L0 kann ihn direkt briefen (E-037).

## Dateimatrix (Ownership)

| Datei                                                           | T01 | T02 | T03 | T05 |
| --------------------------------------------------------------- | --- | --- | --- | --- |
| `tests/sim/mapgenSeed.test.ts` (neu)                            | ja  |     |     |     |
| `src/ui/seedInput.ts` (neu), `tests/ui/seedInput.test.ts` (neu) |     | ja  |     |     |
| `src/ui/menu.ts`, `tests/ui/menu.test.ts`                       |     |     | ja  |     |
| `src/ui/app.ts` (`StartOptions`, `launch`, `newIsland`)         |     |     | ja  |     |
| `src/style.css` (nur falls nötig)                               |     |     | ja  |     |
| `README.md`, `docs/arc42.md` (falls nötig)                      |     |     |     | ja  |

Nicht angefasst: `src/sim/`, `src/render/`, `src/audio/`, `src/ui/startCard.ts`, `docs/studio/` (insbesondere `rulings.md`), Specs.

## Tasks

| Task | Titel                                                    | Datei                | AK-IDs               | Strang | blocked-by                | Modell | Tools | Persona            |
| ---- | -------------------------------------------------------- | -------------------- | -------------------- | ------ | ------------------------- | ------ | ----- | ------------------ |
| T00  | Testzeiten vorab, Worktree, Basis                        | `T00-vorab.md`       | –                    | A      | Gate Plan, Inselproben-UI | sonnet | 10    | `tech-ui-engineer` |
| T01  | Charakterisierung `generateMap`/`createWorld`            | `T01-kartentests.md` | K2, K3               | A      | T00                       | sonnet | 20    | `tech-ui-engineer` |
| T02  | `seedInput.ts`: `parseSeedInput`, `pickSeed`, `seedNote` | `T02-seedinput.md`   | K1, K5, K12          | A      | T01                       | sonnet | 30    | `tech-ui-engineer` |
| T03  | Menü-Feld, Prompt, Start mit Nummer, Info-Meldung        | `T03-menu-app.md`    | K4, K12 (Draht), K13 | A      | T02                       | sonnet | 40    | `tech-ui-engineer` |
| T04  | Browser-Check (`qa-playtester`)                          | `T04-playtest.md`    | K7 bis K11, K12, K13 | A      | T03                       | sonnet | 35    | `qa-playtester`    |
| T05  | Doku (README) per `SendMessage`                          | `T05-doku.md`        | –                    | A      | T04                       | sonnet | 8     | `tech-ui-engineer` |

Summe ≈ 145 Tools. Nur Lauf (kein eigener Test): AK-K6 = `git diff main -- src/sim` leer, `SAVE_VERSION` unberührt, `tests/sim/balance.test.ts` grün (Abschluss, T03).

## AK-Zuordnung (13 AK; K1 bis K11 bestätigt, K12 und K13 neu)

| AK         | Beleg                                                   | Task     |
| ---------- | ------------------------------------------------------- | -------- |
| K1         | `tests/ui/seedInput.test.ts` (Grenze 99999949/99999950) | T02      |
| K2, K3     | `tests/sim/mapgenSeed.test.ts` (K3 Charakterisierung)   | T01      |
| K4         | `tests/ui/menu.test.ts`                                 | T03      |
| K5         | `tests/ui/seedInput.test.ts` (`pickSeed(0, …) === 0`)   | T02      |
| K6         | Lauf: Sim-Diff leer, `SAVE_VERSION`, Balancing grün     | T03      |
| K7 bis K10 | Browser-Check                                           | T04      |
| K11        | Browser-Check (Inselproben vorher gemergt)              | T04      |
| K12        | Text: `seedInput.test.ts` (T02); Meldung: Browser (T04) | T02, T04 |
| K13        | Struktur im Review (T03), Browser                       | T03, T04 |

## Budget (Vorschlag für das Gate Plan)

**Gesamt 4 Starts, Parallelität 1.** Geplant 3: Umsetzer `tech-ui-engineer` (T00 bis T03, ein Start; T05 per `SendMessage`) 1, `qa-playtester` (T04) 2, `qa-code-reviewer` **opus** über die ganze Branch als Final-Review (E-068) 3. **Reserve 1** (Wiederholung Playtest oder Reviewer). Rechnung: 3 × 1,3 = 3,9, aufgerundet 4. Fix-Runden und Delta-Review (R553) per `SendMessage` zählen nicht.

## Test- und Prüfpflichten (Umsetzer-Briefing wörtlich)

- **Testsperre (R380):** Tests erst bei freier Sperre (`uptime`: 1-min-Load ≤ 4, kein anderer `vitest`/`make check`-Lauf; sonst `waiting`).
- **T00:** Testzeiten der berührten Tests vorab (Befehle in `T00-vorab.md`).
- **Rot zuerst:** je neuem Test (T02, T03) der Lauf vor der Umsetzung mit Exit ≠ 0 (`…; echo EXIT=$?`, nie in eine Pipe). **Ausnahme T01:** Charakterisierung, kein Rot-Beleg, Grün-Beleg genügt und wird als Charakterisierung benannt.
- **Teilbeleg am Ende:** gezielte Tests (Befehle je Task-Datei), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`; `make docs-check` vor Doku-Commits. Nie `make check` je Task; Balancing grün.
- **Zeittests (R270):** neue Tests ohne Uhr (`now` ist Parameter von `pickSeed`).
- **Keine `Contract`-Literale** in neuen Tests (R679-2).

## Ruling-Entwurf (für `docs/studio/rulings.md`, L0 entscheidet)

- **R-I197-E (Gate Plan I-197):** Plan freigegeben: ein Strang, ein Umsetzer, T00 bis T05, nach dem Inselproben-UI-Task; Budget 4 Starts (3 geplant, 1 Reserve), Parallelität 1; ein Final-Review statt Task-Reviews (E-068). Eingabegrenze 0 bis 99 999 949 (überschreibt Spec Regel 2/3 «99 999 999»); AK-K3 als Charakterisierungstest; AK-K12 (Info-Text) und AK-K13 (Laden ignoriert Nummer) neu; Gate-Auflagen B1 bis B3 umgesetzt; kein Save, kein Spielwert, kein ADR.
