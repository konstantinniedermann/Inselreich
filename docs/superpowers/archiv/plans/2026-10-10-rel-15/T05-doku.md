# T05 · Trivial-Fixes und Doku

Strang UI · Worktree `.worktrees/rel-15-ui` · Branch `fix/rel-15-ui` · Umsetzer `tech-ui-engineer` (sonnet, Fortsetzung des T01/T02-Umsetzers per SendMessage) · AK-Entwürfe B4, D1–D4 (`ak-entwuerfe.md`) · blocked-by T02 (Review OK), T03 (Review OK)

**Ziel:** Ein veralteter Testtitel, README, arc42 und die Beobachtungen stehen auf dem Stand von REL-15. Erlaubte D1-Dateien (E-017): `README.md`, `docs/arc42.md`. Kein Produktivcode.

**Files (nur diese):**

- Modify: `tests/render/decorSea.test.ts` (Z. 259, nur der Titel)
- Modify: `README.md` (Z. 59–62 „Cursor-Hinweis“; Z. ~360–362 „Inseln wechseln“)
- Modify: `docs/arc42.md` (Bausteinzeilen `seaMap.ts` Z. ~242, `hud.ts` Z. ~265, `hover.ts` Z. ~294)
- Modify: `docs/beobachtungen.md` (vier bestehende Einträge im Abschnitt „Offen“, zwei neue am Dateiende)

**Interfaces:** Consumes die Namen aus T02 (`cursorHintVisible`) und T03 (`MapUi.dpr`, `DOT_R`, `MARK`, `islandMenuAbort`); vor dem Schreiben im Branch `fix/rel-15-see` nachsehen: `git -C ../rel-15-see log --oneline -3` und `git -C ../rel-15-see show --stat HEAD~1`.

## Schritte

- [ ] **Schritt 1: Testtitel (D1)**

`tests/render/decorSea.test.ts` Z. 259: Titel `'Zoomschwellen und Fern-Pfad: Wrack, Felsen und Eiland ab 0,25, Palme ab 0,5'` → `'Zoomschwellen: Meeresfels ab 0,25; Wrack, Eiland und Palme ab 0,5 (REL-07)'`. Testkörper unverändert (er prüft `DECOR_MIN_ZOOM`, das Wrack und Eiland seit REL-07 auf 0,5 hat).

Run: `npx vitest run tests/render/decorSea.test.ts; echo EXIT=$?` → PASS, `EXIT=0`

```bash
git add tests/render/decorSea.test.ts
git commit -m "test: Testtitel Zoomschwellen auf Stand REL-07 (Trivial-Fix R435)"
```

- [ ] **Schritt 2: README (B4, D4)**

a) „Cursor-Hinweis“ (Z. 59–62): nach „… den Zustand des Gebäudes unter dem Zeiger.“ einfügen:
„Bei der Auswahl ersetzt die Mouse-over-Karte das Schild, sobald sie erscheint; ein Kachelwechsel, Ziehen oder ein anderes Werkzeug bringen das Schild sofort zurück.“
Der Schlusssatz „Über leerem Boden und bei offener Karte erscheint kein Schild.“ bleibt.

b) „Inseln wechseln“ (Z. ~360–362): nach „… je ein Punkt für jedes Schiff mit Route (ein Schiff ohne Route fehlt; im Hafen liegt der Punkt am Anker der Insel)“ ergänzen: „; Inseln mit Kontor tragen eine helle Marke knapp über dem Anker“. Satzzeichen anpassen, sonst nichts ändern.

- [ ] **Schritt 3: arc42 (D3)**

- Zeile `hover.ts`: nach `hoverVisible (400 ms Ruhe, HOVER_DELAY_MS)` ergänzen: „, `cursorHintVisible` (Cursor-Schild nur ohne offene Karte, R435)“.
- Zeile `seaMap.ts`: ergänzen: „Grössen in CSS-Pixeln × `MapUi.dpr` (`DOT_R`, `MARK`); Kontor-Marke knapp über dem Anker, damit der Hafen-Schiffspunkt sie nicht verdeckt.“
- Zeile `hud.ts`: ergänzen: „Inselmenü: Dokument-Listener je Kopfzeile per `AbortController`, ein Neustart meldet den alten Satz ab.“

Tabellen danach mit `npx prettier --write docs/arc42.md README.md` ausrichten.

- [ ] **Schritt 4: Beobachtungen (D2)** — Marke R287/R288 beachten: neue Einträge nur am Dateiende, in „Ausgewertet …“-Abschnitten nichts ändern.

a) Eintrag „2026-10-09 · UI-INSPEKTOR-HILFSZEILE Mangel doppelt“: Zeile anhängen
`- **Erledigt durch REL-15 (R435):** Die Abhilfe eines Wohnhauses beginnt mit dem Verb („Baue Kapelle (K) in Reichweite“); die Mangel-Liste bleibt im Wortlaut R424. Commit <Hash T01>.`

b) Eintrag „REL-14 (R430): Testtitel «ab 0,25» veraltet“: `- **Erledigt durch REL-15:** Titel angepasst, Commit <Hash Schritt 1>.`

c) Eintrag „REL-14 (R430): Hover-Karte verdeckt Cursor-Hinweis“: `- **Erledigt durch REL-15 (R435):** Das Schild weicht der Karte (\`cursorHintVisible\`), Commit <Hash T02>.`

d) Eintrag „REL-14 (R430): Dienst-Mangel «fehlt in Reichweite» in der Aufstiegsliste“: `- **Abgehakt (R435):** siehe Eintrag „Dienst-Mangel «fehlt in Reichweite» bleibt“ unten.`

e) Am Dateiende anhängen:

```markdown
### 2026-10-10 · Dienst-Mangel «fehlt in Reichweite» bleibt (abgehakt, R435)

- **Fundort:** `src/sim/population.ts` (Aufstiegsliste), `src/ui/hints.ts` (Regex), `src/ui/guide.ts`. Urteil `lead-design`: Der Satz beginnt mit „Kapelle fehlt“ und gehört zur Wortfamilie R424/R427; „in Reichweite“ trägt die Information „steht schon, aber zu weit weg“, die das Panel nur dort zeigt. Ursprung: REL-14 (R430), Kurzdesign REL-15. Einschätzung: abgehakt.
- **Trigger für eine Neubewertung:** Ein Playtest meldet, dass Spieler „fehlt“ und „fehlt in Reichweite“ für zwei verschiedene Zustände halten.

### 2026-10-10 · REL-15: UI-SEEKARTE-NACHZUG erledigt, Rest dpr-Wechsel bei offener Karte

- **Fundort:** `src/ui/hud.ts` (`bindIslandMenu`), `src/render/seaMap.ts`. Erledigt: Kontor-Marke über dem Hafenpunkt und × dpr, Zeittest als Zähler, Szenen-Helfer `tools/render-qa/seekarte.mjs`. Der Teil „Layout und Cache über einen Weltwechsel“ war nicht erreichbar (Laden und „Neue Insel“ bauen die Kopfzeile über `restart` neu); behoben ist stattdessen das Leck der zwei `document`-Listener, die je Neustart die alte Welt hielten. Rest: Wechselt die dpr bei offener Karte (Fenster auf anderen Bildschirm), bleiben Leinwand und Marke bis zum nächsten Öffnen auf der alten dpr, stimmig zueinander. Ursprung: REL-15 (Gate-Entscheide E2, E6). Einschätzung: niedrig.
- **Trigger für eine Neubewertung:** Ein Spieler meldet eine unscharfe oder zu kleine Seekarte nach einem Bildschirmwechsel.
```

Hashes aus `git log --oneline` beider Branches einsetzen (der Hash des Commits aus Schritt 5 steht erst nach dem Commit fest: dort „dieser Commit“ schreiben).

- [ ] **Schritt 5: Prüfen und Commit**

Run: `make docs-check; echo EXIT=$?` → `EXIT=0`
Run: `git diff --stat main -- src/; echo EXIT=$?` → nur `src/ui/guide.ts`, `src/ui/hover.ts`, `src/ui/app.ts` (aus T01/T02), `EXIT=0`

```bash
git add README.md docs/arc42.md docs/beobachtungen.md
git commit -m "docs: REL-15 README, arc42 und Beobachtungen (Abhilfe, Schild, Seekarte)"
```

## Abnahme für den Review

- README-Sätze wörtlich wie oben; arc42-Namen stimmen mit dem Code beider Branches überein.
- Beobachtungen: keine neue Überschrift in „Ausgewertet …“; zwei neue Einträge am Ende, vier Einträge mit Erledigt-/Abgehakt-Zeile.
