# T07 · `ZEITTESTS` in beide Richtungen

Strang `py` · Worktree `.worktrees/b3-py` · Branch `tool/b3-py` · Umsetzer `tech-sim-engineer` A (sonnet, mit T06 gebündelt) · AK-TB3-07, 08 · Grundlage `docs/beobachtungen.md` „Ausgewertet 2026-10-10“ (Kandidat `ZEITTESTS` bereinigen), REL-15 R437 B4 (der Seekarten-Zeittest wurde ein Zähler) · Grösse S (≈ 8 Tools) · Prüfregel V3, dazu die Einzelprobe unten

**Files:**

- Modify: `vite.config.ts` (`ZEITTESTS`, Z. ~8–17: Eintrag `'tests/render/seaMap.test.ts'` streichen)
- Modify: `Makefile` (Ziel `zeittests`, Z. 17–23: Rückrichtung ergänzen; Hilfetext anpassen)
- **Nicht ändern:** `tests/render/seaMap.test.ts`, andere `ZEITTESTS`-Einträge

## Befund (Planung)

Alle acht Einträge geprüft (`grep -cE 'performance\.now\(|Date\.now\('`): sieben haben 2–4 Treffer, `tests/render/seaMap.test.ts` hat **0**. Die heutige Prüfung `make zeittests` sichert nur die Hinrichtung (Wandzeit-Test fehlt in der Liste) und dass jeder Eintrag als Datei existiert.

## Regel

- `seaMap.test.ts` aus `ZEITTESTS`; die Datei läuft damit im Projekt `parallel`.
- `make zeittests` prüft in der zweiten Schleife zusätzlich: Eintrag ohne `performance.now(` und ohne `Date.now(` → `ZEITTESTS-Eintrag ohne Wandzeit-Aufruf (vite.config.ts): <datei>` und `fail=1`. Gleiche Shell-Form wie die bestehenden Zeilen (POSIX, `grep -qE`).
- Hilfetext: `zeittests: ## ZEITTESTS (vite.config.ts) = genau die Tests mit Wandzeit-Aufruf (beide Richtungen)`.

## Schritte

- [ ] **Schritt 1: rot.** Zuerst nur den Makefile-Teil ändern, dann `make zeittests; echo EXIT=$?` → Exit 1 mit der Zeile für `tests/render/seaMap.test.ts` (Rot-Beleg der neuen Prüfung, im Bericht zitieren).
- [ ] **Schritt 2: grün.** Eintrag in `vite.config.ts` streichen, `make zeittests; echo EXIT=$?` → 0.
- [ ] **Schritt 3: Gegenprobe Hinrichtung.** Eine Wegwerfdatei `tests/render/_probe.test.ts` mit `performance.now()` anlegen, `make zeittests` → Exit 1 („nicht in ZEITTESTS“), Datei löschen, `git status` sauber. Ausgaben zitieren.
- [ ] **Schritt 4: Einzelprobe Projektzuordnung.**

```bash
npx vitest run --project parallel tests/render/seaMap.test.ts; echo EXIT=$?   # läuft jetzt im Projekt parallel
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
make studio-test; echo EXIT=$?
```

- [ ] **Schritt 5: Commit** `fix: ZEITTESTS ohne seaMap.test.ts, zeittests prüft beide Richtungen` mit Session-Trailer.

## Abnahme (Reviewer)

- AK-TB3-07/08 belegt (Rot-Beleg Schritt 1, Gegenprobe Schritt 3); `make check` ruft `zeittests` weiterhin (Ziel `check-run` unverändert).
- Kopfkommentar in `vite.config.ts` Z. 3–6 stimmt noch („Neue Zeittests hier eintragen …“); bei Bedarf um „Einträge ohne Wandzeit-Aufruf meldet `make zeittests` ebenfalls“ ergänzen.
