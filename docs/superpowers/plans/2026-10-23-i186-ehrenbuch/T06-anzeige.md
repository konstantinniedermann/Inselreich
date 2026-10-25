# T06 · Anzeige: Texte, Karte «Ehrenbuch», Menüzeile, Hilfe

Umsetzer `tech-ui-engineer` · ≈ 60 Tools · Muster-Teil AK-EB-01, Vorbereitung AK-EB-11 · blocked-by: T01 (OK), T03 (OK) · Strang B (`.worktrees/i186-buch`) · Spec §2.3 Hinweis, §2.4 Hinweise, §3 Mehrere Stücke, §4, §11 N8

**Erster Schritt:** `git merge feat/i186-ehrenbuch` (bringt `defs/honors.ts` aus T01), kein Rebase.

## Dateien

- neu: `src/ui/honorView.ts`, `tests/ui/honorView.test.ts`, `src/ui/honorCard.ts`
- ändern: `src/ui/menu.ts` (Bereich «Neue Insel»: Zeile + Knopf; `MenuActions` um `honors(): HonorSummary` und `openHonors(opener: HTMLElement): void`), `tests/ui/menu.test.ts` (Fake-Aktionen ergänzen, neue Fälle am Dateiende), `src/ui/startCard.ts` (Hilfe-Abschnitt `help-honors`), `tests/ui/startCard.test.ts` (Fall am Ende), `src/style.css` (gedämpfte offene Zeile, scrollbare Karte)
- `src/ui/app.ts` **nur** in `launch`: eine Zeile `const honorBook = openHonorBook(() => { try { return window.localStorage; } catch { return null; } })` direkt nach `settings`, und in `menuActions` die Felder `honors` und `openHonors` (Karte über `openHonorCard` mit `honorRows`/`honorHints`, `run` vorerst `honorBook.data().run`). Schleife, Tracker und Merker gehören T05.
- nicht ändern: `src/sim/`

## Verhalten

1. `honorView.ts` (rein, DOM-frei):
   - `honorCount(data, session)`: `{ have, total }` mit `total = HONOR_IDS.length`; gezählt werden nur Kennungen aus `HONOR_IDS` (unbekannte nicht).
   - `menuLine(c)` → `Ehrenbuch: ${have} von ${total} Meisterstücken`.
   - `honorRows(data, session)`: je `HONOR_IDS`-Eintrag in Reihenfolge `{ id, name, condition, done: null | { date, map: \`Karte ${seed}\`, crisis: CRISIS_LEVELS[c].name, time: formatClock(tick) }, sessionOnly: boolean }`. Datum lokal `TT.MM.JJJJ`aus`at`(Test baut`at`aus einem lokalen`Date`).
   - `honorHints(status, run, worldSeed)`: `damaged` → «Ehrenbuch war unlesbar und beginnt neu»; `newer` → «Ehrenbuch aus neuerer Fassung, wird nicht verändert»; `unavailable` → «Ehrenbuch wird nicht gespeichert»; `run === null || run.seed !== worldSeed` → «Tempo-Stücke zählen in dieser Partie nicht (Freischaltung unbekannt)».
   - `honorMessage(ids, saved: boolean)`: ein Stück «Meisterstück: Sturmfest — ins Ehrenbuch eingetragen»; mehrere «Meisterstücke: Bürgerstadt, Flinke Gründung — ins Ehrenbuch eingetragen»; ungespeichert Zusatz « (nicht gespeichert)».
   - `type HonorSummary = { line: string; note: string | null }` (Status-Hinweis ohne Tempo-Hinweis).
2. `honorCard.ts`: `openHonorCard(host, { rows, count, hints, opener })` über `openModal` (wie Menü/Hilfe; Esc schliesst, Fokus zurück). Kopf «n von m», Hinweiszeilen, Liste; erreicht: Name, Datum, «Karte N», Krisenstufe, Spielzeit, ggf. «in dieser Sitzung»; offen: Name und Bedingung, gedämpft. **Nur `textContent`, nie `innerHTML`** (N8). Scrollbar bei schmalem Fenster.
3. Menü: im Bereich «Neue Insel» unter den Auswahlfeldern Zeile `a.honors().line`, ggf. `note`, Knopf «Ehrenbuch» → `a.openHonors(button)`.
4. Hilfe: Abschnitt «Ehrenbuch» mit Satz «Meisterstücke über alle Partien, kein Spielvorteil, nur auf diesem Gerät» und den Namen aus `HONORS` in `HONOR_IDS`-Reihenfolge.

## Testfälle (rot zuerst)

- `honorView.test.ts`: Zählung (unbekannte Kennung nicht gezählt, `session` gezählt); `menuLine` «0 von 9» bei leerem Buch; Zeilen-Reihenfolge = `HONOR_IDS`; erreicht/offen; Spielzeit über `formatClock`; je Status der Hinweis, Tempo-Hinweis bei `run === null` und bei fremdem Seed, nicht bei passendem; `honorMessage` ein/mehrere/ungespeichert. **Muster (P-6):** jedes Element von `HONOR_IDS` erfüllt `isHonorKey`.
- `menu.test.ts` (Ende): Menü zeigt die Zeile, Knopf ruft `openHonors`.
- `startCard.test.ts` (Ende): `helpSections` enthält `help-honors` mit allen Namen.
- Karte: Test mit Text, der `<b>` enthält (z. B. unbekannter Name über Fake-Zeile), erscheint wörtlich als Text (kein Element `b`).

## Prüfungen (Teilbeleg)

- `npx vitest run tests/ui/honorView.test.ts tests/ui/menu.test.ts tests/ui/startCard.test.ts tests/ui/honorBook.test.ts; echo EXIT=$?` (rot vorher, grün nachher)
- `npx tsc --noEmit; echo EXIT=$?` (die neuen `MenuActions`-Felder sind Pflicht; `app.ts` liefert sie in diesem Task, damit `tsc` grün ist)
- `make lint; echo EXIT=$?` · `make zeittests; echo EXIT=$?` · `make conflicts; echo EXIT=$?`

Commit: `feat: Ehrenbuch-Karte, Menüzeile und Hilfe (I-186)`
