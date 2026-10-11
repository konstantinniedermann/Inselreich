# T12 · Denkmal-Panel und Bauleiste (TDD)

Strang ui · Worktree `.worktrees/m13-e2-ui` · Umsetzer `tech-ui-engineer` (sonnet) · AK-M13E2-35 (Spec §7.1 U-1–U-6;
Anhang 07 A, C) · blocked-by T11 und ART-Hash T09 (Schritt 0) · Grösse M (≈ 35 Tools)

**Files:**

- Create: `src/ui/monumentSection.ts` (DOM-Abschnitt «Bau»)
- Modify: `src/ui/inspect.ts` (Panel «Denkmal»: Aufbau einmal je Auswahl, Nachführung je Tick), `src/ui/app.ts`
  (Aktionen `startMonumentStage`, `setMonumentPaused`, `setMonumentBuy` mit Meldung/Fehler), `src/ui/buildMenu.ts`
  (Tooltip-Zeile U-6, `tierPreviewLine('monument') === null`), `src/ui/goal.ts` (nur `lockedToolText`, falls nötig),
  `src/style.css` (nur `.monument-*`), `tests/ui/buildMenu.test.ts` (neu), `tests/ui/monumentView.test.ts`
- Lesen: Spec §7.1, Anhang 07 A/C; `src/ui/edictSection.ts` und `renderTownhall`/`updateTownhall` in `inspect.ts`
  (Muster: Knoten einmal bauen, Nachführung setzt nur Text, Klassen, `hidden`, `disabled`, `checked`, `title`),
  `tooltip.test.ts`/`islandTools.test.ts` (wie Bauleisten-Einträge getestet werden).

## Verhalten

- **U-1:** Auswahl des Denkmals öffnet das Panel «Denkmal», Abschnitt «Bau»: Zeile `monumentStageLine`, Grund-Zeile
  `monumentStallReason` (verborgen bei `null`), Zeile `monumentEtaText` (verborgen bei `''`).
- **U-2:** je Gut eine Grid-Zeile (eine Spalte): `label`, Balken (`pct`), `reserveText` klein, Schalter
  «zukaufen (… / Stück)» (`checkbox`, `checked = buyOn`); Klick → `setMonumentBuy(w, good, checked)`.
- **U-3:** Knopf «Bau pausieren» / «Bau fortsetzen» → `setMonumentPaused`; sichtbar bei `stage < 3`.
- **U-4:** Knopf aus `monumentStartState`: Text `buttonText`; `disabled` mit `title = friendlyReason(reason)`; bei
  `'Zu wenig Geld'` klickbar mit Klasse `unaffordable` (Muster Edikt-Karte). Erfolg → Meldung «Abschnitt {n} begonnen:
  {Name}»; Fehler → `friendlyReason(w, reason, { cost: { money: …, wood: 0, tools: 0, stone: 0 } })`.
- **U-5:** Knoten einmal je Auswahl; Nachführung ändert nie die Knotenmenge (Fokus bleibt).
- **U-6:** Bauleiste «Öffentlich»: Tooltip-Zeile «Wahlziel in drei Abschnitten: Stein, Werkzeug, Glas, Gewürz»
  (Gutnamen aus `GOODS`/`MONUMENT_GOODS`); keine Bau-Taste (R476); Vorschau 3×3 mit Bild Stufe 4 kommt aus
  `drawGhost` (T09) und wird nur im Browser geprüft. `lockedToolText` vor Ziel 2 → «Denkmal: Erst nach dem
  Kaufleute-Ziel».
- Abriss-Knopf im Panel nutzt T11 (Zwei-Klick); kein eigener Abrisspfad.
- Desktop-first: kein waagrechtes Scrollen in der 280-px-Spalte; Zeilen umbrechen statt überlaufen.

## Schritte

- [ ] **Schritt 0: ART- und Sim-Stand holen.** `git merge --no-ff <Hash T09 OK aus ART-Ledger>` und, falls neuer als
      der letzte Merge, `git merge --no-ff <letzter Sim-Hash OK, mindestens T06>` (Szenario-Stände für T15);
      `npx tsc --noEmit; echo EXIT=$?`.
- [ ] **Schritt 1: Test zuerst (rot):**
  - **AK-35** `tests/ui/buildMenu.test.ts` (neu): `tierPreviewLine('monument') === null`; Tooltip-Text des Eintrags
    enthält die Zeile U-6 wörtlich; `lockedToolText(w, { kind: 'build', defId: 'monument' })` vor Ziel 2 → «Denkmal:
    Erst nach dem Kaufleute-Ziel»; nach Ziel 2 `null`; kein Hotkey für `monument` in der Tastenliste.
  - Hilfstest (kein eigenes AK, Browser-Abnahme AK-41 in T15): reiner Teil von `monumentSection.ts`, falls ausgelagert
    (z. B. `monumentSectionModel(w)` = Zeilen + Knöpfe), in `tests/ui/monumentView.test.ts`; Meldungstext «Abschnitt 1
    begonnen: Sockel».

```bash
npx vitest run tests/ui/buildMenu.test.ts tests/ui/monumentView.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/ui/buildMenu.test.ts tests/ui/monumentView.test.ts tests/ui/tooltip.test.ts \
  tests/ui/islandTools.test.ts tests/ui/inspect.test.ts tests/ui/edictView.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Denkmal-Panel mit Abschnitt, Gütern, Zukauf und Pause; Bauleiste (M13-E2 T12)`.

## Bericht

Testnamen, Rot-Zeile, Exit-Codes, Liste der neuen CSS-Klassen, Hinweis für T15 (welche Szenarien welches AK zeigen).
