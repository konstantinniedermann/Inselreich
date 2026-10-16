# T07 · Doku: README, arc42, Beobachtungen

Strang ui · Umsetzer `tech-ui-engineer` (E-017: darf ausdrücklich `README.md`, `docs/arc42.md`, `docs/beobachtungen.md` ändern, sonst nichts) · AK-GC-16 · blocked-by T06 · Grösse S (≈ 15 Tools)

**Review dieser Task:** `qa-code-reviewer` (sonnet) über den Diff der Task. Das opus-Review über die ganze Branch ist T09 und läuft erst nach T08 (R462 B1).

## Schritt 0: Zeilenstände nach M13-E1-Merge prüfen (Pflicht)

M13-E1 (T13) und REL-17 haben `README.md` und `docs/arc42.md` geändert; `docs/beobachtungen.md` bekommt dort Anhänge.

```bash
git log --oneline 1b723334..HEAD -- README.md docs/arc42.md docs/beobachtungen.md
grep -n "Zum nächsten / vorigen Problem\|Probleme sind, nach Dringlichkeit\|Esc. oder Rechtsklick\|Lagerleiste" README.md; echo EXIT=$?
grep -n "problems.ts\|hud.ts\|statusMarks\|Bausteine\|Tick-Ablauf" docs/arc42.md | head -20
grep -n "unconnectedIds\|cutOffIds\|HOUSE_TITLES" docs/beobachtungen.md
```

Auf `1b723334`: README-Tastentabelle `.`/`,` Z. 146, Problem-Absatz Z. 155, `Esc` Z. 131 und Z. 63–65, Lagerleiste Z. 366.

## Inhalt

- **README, Bedienung:** Abschnitt Probleme/Lagerleiste: Klick auf einen Lager-Chip (oder `Enter`/Leertaste bei Tastaturfokus) markiert Erzeuger (durchgezogene Kontur) und Verbraucher-Betriebe (gestrichelt) des Guts auf der aktiven Insel und springt zum ersten Erzeuger (Panel offen, Meldung „Holz 1 von 4: Holzfäller (Erzeuger) · …“); `.`/`,` gehen bei aktivem Fokus die Gut-Liste durch (sonst die Problemliste); zweiter Klick auf denselben Chip oder `Esc` oder Inselwechsel löscht; Häuser werden nicht markiert (Anzahl im Tooltip); „Noch kein Erzeuger für Holz — Bauen: …“. Tastentabelle `.`/`,` und `Esc` ergänzen („löscht auch die Markierung“). Zahlen nur aus Code (`MAX_FOCUS_MARKS` = 40 als „höchstens 40 Gebäude gleichzeitig“).
- **`docs/arc42.md`:** Bausteine `src/ui/goodFocus.ts` (Liste, Meldungen, Reducer, Sprungablauf), `src/render/focusMarks.ts`, gemeinsamer Umlauf `stepList` in `problems.ts`, `HOUSE_TITLES` in `texts.ts`; Datenfluss „Fokus ist reiner UI-Zustand, `RenderFx.focus`, nie im Save“; Persistenz-Abschnitt: unverändert. Mermaid nur, wenn ein bestehendes Diagramm die UI-Module aufzählt (kein `\n` in Labels).
- **`docs/beobachtungen.md`:** Eintrag (b) `unconnectedIds` vs. `cutOffIds` bleibt offen (Datum, Fundort, Beobachtung, Ursprung, Einschätzung unverändert, Hinweis „I-043 hat `hints.ts` bewusst nicht berührt“). Eintrag (8) `HOUSE_TITLES` als erledigt vermerken bzw. streichen, wie die Datei es für Erledigtes vorsieht. Neue Befunde aus Ledger und Reviews anhängen.

## Schritte

- [ ] **Schritt 1: Prüfliste statt Test (vorher).** `grep -n "Lager-Chip\|Gut-Fokus\|goodFocus" README.md docs/arc42.md; echo EXIT=$?` → EXIT=1 (Ausgangslage belegt).
- [ ] **Schritt 2: Doku schreiben** wie oben; jede Zahl und jeden Wortlaut gegen `ak.md` und den Code prüfen (Meldungen wörtlich).
- [ ] **Schritt 3: Prüfen.** `make docs-check; echo EXIT=$?` → 0; `grep -n "Gut-Fokus\|goodFocus" README.md docs/arc42.md` zeigt die Einträge; AK-GC-16: `grep -n "from './hover'" src/ui/problems.ts; echo EXIT=$?` → EXIT=1 und `grep -n "HOUSE_TITLES" src/ui/texts.ts`.
- [ ] **Schritt 4: Commit** `docs: Gut-Chip in README und arc42 (I-043)`.

## Nicht in dieser Task

Code. Kein ADR (ein Mechanismus, keine Bestandsentscheidung).
