# T06 · Final-Review `opus` über den Kandidaten REL-17

Rolle `qa-code-reviewer` · Modell **opus** (Briefing-Kopfzeile `Modell: opus (Final-Review über den Kandidaten)`, Tabelle STUDIO.md Modellwahl) · gestartet im `lead-qa`-Start „Gate Merge + Release-Check“ (R429 V3, Entscheid E9) · alle AK-R17-01…20 (`ak.md`) · blocked-by T05

**Gegenstand:** Kandidat in `.worktrees/integrate` gegen `main` (enthält REL-16). Diff **je Datei** lesen (R420 V3): `git diff main...HEAD --stat`, dann `git diff main...HEAD -- <datei>`. Erwartete Dateien: `src/ui/problems.ts`, `src/ui/hover.ts`, `src/ui/hotkeys.ts`, `src/ui/messages.ts`, `src/ui/app.ts`, `src/ui/input.ts`, `tests/ui/problems.test.ts`, `tests/ui/hotkeys.test.ts`, `tests/ui/input.test.ts`, `README.md`, `docs/arc42.md`, `docs/beobachtungen.md`; jede weitere Datei ist ein Befund.

## Prüfpunkte

1. **AK-Abdeckung:** je AK-R17-01…20 den belegenden Test bzw. den T05-Schritt aus dem Ledger `.superpowers/sdd/rel-17/ledger.md` und dem Playtest-Report nennen; fehlt ein Beleg → BEDENKEN. Ausnahmen mit Begründung: AK-R17-10, 11 nur Browser (kein DOM in `tests/ui/`).
2. **Sperrdateien:** `git diff main...HEAD -- src/sim src/render src/audio tests/sim src/ui/hints.ts src/ui/hud.ts docs/studio docs/ideen.md` ist leer (AK-R17-19); `SAVE_VERSION` unverändert.
3. **Reinheit `problems.ts`:** kein DOM, kein Kamera-Parameter, kein Import aus `./app` oder `./hints`; ein Prädikat für Klasse 1 und `cutOffIds`; Brand vor Anbindung; Sortierschlüssel vollständig (keine Gleichstände ohne ID).
4. **Umlauf (Review Focus 1):** `problemStep` mit `landed`/`anchor` kann bei zwei Inseln nicht pendeln; Test simuliert die gefolgte Kamera; verschwundener Schlüssel → Nachfolger nach `sort`.
5. **Sprung (`app.ts`):** Reihenfolge `cancelPointerAction` → `centerOn` (Archipel-Kacheln) → `setPanel` → `refresh` → Cursor mit `landed = state.activeIsland` → `replaceMessage`; kein `selectTool`; `onHotkey` endet nicht mehr in einem stillen `else` = Pause.
6. **`replaceMessage`:** Toast-Aufbau geteilt, `showMessage`-Verhalten (Dedupe, MAX_TOASTS, sticky, closable, Aktion) unverändert; Slot-Selektor ohne Benutzereingabe (keine Injektion).
7. **Abriss-Zug (Review Focus 2, 3):** Druck auf Hülle → `road = false`, Einzelabriss; im Zug jede Kachel `dragging: true`, Pick über `strokePickTool`; `app.ts` ruft im Zug nur `removeRoad`, nie `demolish`; Weg, Roden, Aufforsten senden dieselben `dragging`-Werte wie vorher.
8. **Trenn-Warnung (Review Focus 4):** `stroke` wird bei jedem `dragEnd` ausgewertet und auf `null` gesetzt (auch über `cancelPointerAction`); kein Pfad, auf dem `stroke` hängen bleibt (Einzelabriss eines Gebäudes setzt ihn nicht).
9. **Doku:** README-Tastentabelle, Abriss, arc42-Zeilen stimmen mit dem Code; Beobachtungen nur angehängt.
10. **Prüfläufe:** `make check` Exit 0 laut Integrator; selbst nur gezielt: `npx vitest run tests/ui/problems.test.ts tests/ui/hotkeys.test.ts tests/ui/input.test.ts tests/ui/imports.test.ts tests/sim/balance.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, nie in eine Pipe.
11. **Konfliktprobe:** `git merge-tree --write-tree main feat/rel-17-problem-sprung; echo EXIT=$?` → 0 (AK-R17-20).

## Ausgabe

Urteil **OK / BEDENKEN / ZURÜCK**, Befunde mit Datei:Zeile, Schweregrad und Empfehlung; Befunde ausserhalb des Scopes als Vorschlag für `docs/beobachtungen.md`. Kein Report-Dateipfad: der Schlussbericht ist der Report. Keinen Code ändern.
