# T18 · Final-Review `opus` M13-E2-ART und M13-E2-UI (Gate Merge M13-E2)

Rolle `qa-code-reviewer` · Modell **opus** (Kopfzeile `Modell: opus (Final-Review M13-E2 ART und UI)`) · gestartet
von `lead-qa` (Budget lead-qa 1) · AK-M13E2-27 … -48 und Spec §11, §12 · blocked-by T16, Merge M13-E2-SIM auf `main`
und «bereit fürs Final-Review» von Controller E

**Gegenstand:** `feat/m13-e2-ui` (enthält `feat/m13-e2-art`) gegen `main`, nachdem der UI-Controller `main`
gemergt hat (SIM ist dann auf `main`, der Diff zeigt nur ART und UI). Diff je Datei:
`git diff main...feat/m13-e2-ui --stat`, zusätzlich `git diff main...feat/m13-e2-art --stat` (Teilmenge). Erwartete
Dateien: Ownership T08–T14 im [Index](../2026-10-11-m13-e2-denkmal.md); Sim-Fixes nach dem SIM-Merge nur mit
Ledger-Vermerk.

## Prüfpunkte

1. **AK-Abdeckung:** je AK der Test bzw. der Browser-Schritt aus [ak.md](ak.md), Ledger
   `.superpowers/sdd/m13-e2-art/ledger.md`, `.superpowers/sdd/m13-e2-ui/ledger.md`, Playtest-Reports T15/T16;
   Rot-Belege je Task (T08 für die Maler-Teile von AK-36/-39). Fehlt ein Beleg → BEDENKEN.
2. **Render (A2, qa B7):** jede Aufrufstelle von `bodyHeight`/`bodyHull`/`spriteBounds`/`spriteKey` mit Welt reicht
   die Bildstufe durch (Liste aus dem T09-Bericht gegen `grep -rn` prüfen); übrige Gebäude bitgleich (Schlüssel,
   Höhe, Hülle; nur Referenz-Hash `monument` geändert); Render schreibt nie in die Welt; Effekt unter `CAPS`, ≤ 3 s,
   aus bei reduzierter Bewegung; kein Laufzeit-Import `monumentSprite.ts` → `sprites.ts`.
3. **UI:** `monumentView.ts` und `demolishConfirm.ts` rein; keine Zahl hart im UI; Texte wörtlich laut Spec §7 und
   Anhang 07; Knoten des Panels stabil (U-5); Zwei-Klick nur für das Denkmal mit Fortschritt, UI-TASTEN-Tests
   unverändert grün (R483); Abriss-Werkzeug überspringt mit Meldung.
4. **Ziel-Chip und Ereignisse:** vor `wonSpice` unverändert; `monumentEvents` und Glocke nicht nach dem Laden;
   `src/audio/` importiert nichts aus `src/sim/`/`src/ui/`; kein neues Asset (`tests/assets` unverändert). T19: Klangfigur `monumentDone` von `lead-art` abgenommen (ART-Ledger), Rezept unterscheidet sich vom `alarm`; Dev-Zähler `events` in `debugState`.
5. **Desktop-first:** T15-Messwert kein waagrechtes Scrollen ab 1280 px; 800×600 ohne Überlappung.
6. **Doku:** README-Abschnitt, Tabelle und Lauf-B-Satz stimmen mit `MONUMENT_STAGES` und dem T07-Messwert; arc42
   (Bausteine, Tick, Persistenz v12, Obergrenzen); E1-Spec nur zwei Verweiszeilen; Beobachtungen nur angehängt.
7. **Zeitvergleich (T00):** Controller-Messung main/Branch für ART- und UI-Dateien liegt vor; Ausreisser begründet.
8. **Prüfläufe** (selbst, gezielt, Befehle unten); `make check` Exit 0 laut Controller. Nie in eine Pipe; kein Lauf
   während eines Pushs.

```bash
npx vitest run tests/ui/monumentView.test.ts tests/ui/demolishConfirm.test.ts tests/ui/goal.test.ts tests/render/monumentSprite.test.ts tests/render/picking.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
git merge-tree --write-tree main feat/m13-e2-ui; echo EXIT=$?
```

## Ausgabe

Urteil **OK / BEDENKEN / ZURÜCK**, Befunde mit Datei:Zeile, Schweregrad, Empfehlung; Befunde ausserhalb Scope als
Vorschlag für `docs/beobachtungen.md`. Der Schlussbericht ist der Report. Keinen Code ändern.
