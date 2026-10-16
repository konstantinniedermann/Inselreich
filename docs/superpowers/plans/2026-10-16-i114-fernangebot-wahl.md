# Plan I-114 «Fernangebot zur Wahl» (Stufe leicht, Variante A)

Owner `lead-tech` · Quelle: Kurzdesign `docs/superpowers/specs/2026-10-16-i114-fernangebot-wahl.md` (11 AK), Entscheid R699 (Variante A, REL-26). Plan gegen main `6cc5b068`, ohne Testläufe. Task-Dateien in [`2026-10-16-i114-fernangebot-wahl/`](2026-10-16-i114-fernangebot-wahl/).
Spielerwirkung: ab zwei Fremdkontoren zwei Fernkarten («Möweninsel: 20 Stoff · 440» / «Felsbucht: 15 Rum · 450»), der Spieler nimmt die mit dem volleren Lager oder der kürzeren Fahrt.
**Kein Save** (`SAVE_VERSION`, `types.ts`, `save.ts`, `defs/` ohne Diff), kein Spielwert, keine Abhängigkeit (ADR-001), kein ADR (Entscheid in R699 und Spec).

## Entscheide des Plans

- **P-1 Sim vor UI, ein Strang, seriell** (T01 → T02): die UI braucht die Signatur `farAlternative`/`acceptFarOrder(world, pick)`.
- **P-2 Gemeinsamer Helfer statt Doppelcode:** `offerFarOrder` baut das Angebot aus `(world, island)`; neue interne Funktion `farOfferFor(world, island): FarOffer` wird von `offerFarOrder` und `farAlternative` genutzt (DRY, Rotation `e[k % n]` bitgleich). `farAlternative` liest `k = world.order?.period` (Auftrag gleicher Periode; `null` ohne Auftrag, Spec R2).
- **P-3 UI-Form:** zwei Karten im Stapel (`far-card`, neu `far-card-2`, beide `data-field`), Text- und Tooltip-Funktionen bekommen `which: 0 | 1 = 0` (Default bitgleich, Bestandstests grün). `OrderActions.acceptFar(pick?)` mit Default 0. Fallback bei Platzmangel (AK-11): zweite Karte kompakt (kleinere Schrift, kein Umbruch der Knopfzeile).
- **P-4 Gewähltes Angebot ist das angezeigte:** `acceptFarOrder(world, 1)` rechnet `farAlternative` zum Klickzeitpunkt; ändert sich `e` zwischen Anzeige und Klick (Drift), nimmt der Spieler die neue Zweitkarte. Hinnahme laut R699; die UI zeigt per Refresh (alle 10 Frames) den aktuellen Stand.
- **P-5 Zeitmessung R392:** T00 misst die berührten Test-Dateien vorher, T03 nachher; Abnahme mit `zeit-vor.json`/`zeit-nach.json` im Bericht.

## Blocker

**blocked-by: UI-AUFRAEUM-4 gemergt** (R694, berührt `hud.ts`/`order.ts`). T00 prüft den Merge auf main; fehlt er, `waiting`, nicht starten. Danach `git merge main` im Umsetzungs-Worktree (kein Rebase).

## Dateimatrix (Ownership, ein Strang)

| Datei                                                                                                                                                       | T01 | T02 | T04 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- |
| `src/sim/orders.ts`, `tests/sim/orders.test.ts`, `tests/sim/farOrder-alternative.test.ts` (neu)                                                             | ja  |     |     |
| `src/ui/farOrder.ts`, `src/ui/order.ts` (nur `acceptFar`-Signatur), `src/ui/hud.ts`, `src/ui/app.ts`, `src/style.css` (nur `.far-card`-Regeln, Z. ≈ 947ff.) |     | ja  |     |
| `tests/ui/farOrder.test.ts`, `tests/ui/farChoice.test.ts` (neu)                                                                                             |     | ja  |     |
| `README.md`, `docs/spielwerte.md` («Fernangebot»), `docs/arc42.md`, `docs/ideen.md`                                                                         |     |     | ja  |

Nicht angefasst: `types.ts`, `defs/`, `save.ts`, `world.ts`, `balance.test.ts` (nur gelaufen), `docs/studio/`, Specs. Worktree `.worktrees/i114-impl` ab `plan/i114` (`git worktree add … -b feat/i114`), dann `git merge main`.

## Tasks

| Task | Titel                                                        | Datei                | AK-IDs                   | Strang | blocked-by            | Modell | Tools |
| ---- | ------------------------------------------------------------ | -------------------- | ------------------------ | ------ | --------------------- | ------ | ----- |
| T00  | Zeitmessung vorher, Blocker prüfen (Controller, R392)        | `T00-zeitmessung.md` | –                        | 1      | UI-AUFRAEUM-4 gemergt | sonnet | 8     |
| T01  | Sim: `farAlternative`, `acceptFarOrder(pick)`, Tests         | `T01-sim.md`         | AK-1 bis AK-9            | 1      | T00                   | sonnet | 40    |
| T02  | UI: zwei Karten, Text/Tooltip je `which`, Annehmen, CSS      | `T02-ui.md`          | AK-10                    | 1      | T01                   | sonnet | 40    |
| T03  | Browser-Check 1280 px, Zeitmessung nachher (`qa-playtester`) | `T03-browser.md`     | AK-11                    | 1      | T02                   | sonnet | 25    |
| T04  | Doku (D1, E-017)                                             | `T04-doku.md`        | Spec «Grösse und Folgen» | 1      | T03                   | sonnet | 15    |

Umsetzer: T01 `tech-sim-engineer`, T02 und T04 `tech-ui-engineer` (T04 mit ausdrücklicher D1-Erlaubnis im Briefing), T03 `qa-playtester`. Kein Task-Review je Task: **E-068** gilt, Diff erwartet ≈ 150 bis 250 Zeilen (≤ 300): ein einziger `qa-code-reviewer` am Ende, **`model: opus`, frischer Start über die ganze Branch** (Final-Review, R673), Ergebnis an `lead-qa`; bei ZURÜCK Delta-Review per SendMessage (R553). Überschreitet der Diff nach T02 300 Zeilen, Task-Review für T01 nachholen (Budgetmeldung vorab). Fix-Runden per SendMessage. Der Controller läuft auf `sonnet`, höchstens 4 Tasks je Instanz.

## Schätzung Umsetzung (Starts)

T01 1 · T02 1 · T03 1 · T04 1 · Final-Review 1 (opus) = **5 Starts**, Fix-Runden per SendMessage (kein neuer Start). Mit Puffer 30 % aufgerundet: **7 Starts, Parallelität 1** (Strang seriell; T04 könnte parallel zu T03 laufen, spart aber nur Minuten und teilt `README.md` nicht mit anderen: bei freiem Platz zulässig, Parallelität dann 2). Dauer ≈ 60 bis 80 min Wanduhr.

## Risiken

- **Platz bei 1280 px:** Stapel Auftrag + 2 Fern + Krise kann hoch werden; Fallback P-3, Befund aus T03.
- **Drift (P-4):** Zweitkarte springt bei Kontorwechsel; R699 hingenommen, T01 testet es (AK-7).
- **Mehrverdienst ≈ 10 % einer Fernprämie** ist Abschätzung; AK-9 belegt Balancing-Test und Baseline bitgleich (Controller-Baseline nimmt nie an).

## AK-Zuordnung

AK-1 bis AK-8: T01, je ein Testfall mit der AK-Nummer im Namen in `tests/sim/farOrder-alternative.test.ts`. AK-9: T01, Test «Version unverändert, Spielstand mit offenem Fernangebot lädt, Rundreise gleich» plus `npx vitest run tests/sim/balance.test.ts` Exit 0. AK-10: T02, `tests/ui/farChoice.test.ts`. AK-11: T03, Screenshots in `.studio/qa/i114/`.
