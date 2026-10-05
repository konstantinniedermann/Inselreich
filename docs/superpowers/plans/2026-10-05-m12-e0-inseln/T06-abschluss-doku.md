> **Task-ID:** T06 · **AK-IDs:** AK-E0-09 (Probe vor E0), AK-E0-16 … -19 (Nachweis), AK-E0-20 (Browser-Check)
> **blocked-by:** T05 · **Strang:** `feat/m12-e0`, Worktree `.worktrees/m12-e0` · Controller C3 (lead-tech, sonnet)
> mit Doku-Umsetzer `tech-sim-engineer` (sonnet, D1 erlaubt, R229 prod-B2) + `qa-code-reviewer`, `qa-playtester`
> (sonnet) und Final-Review durch **lead-qa** (**opus**, R229 qa-B1)
> **Regeln:** [index.md](index.md) Global Constraints · Spec §4.7 (AK-E0-09, -20), §4.9, R227 F-S1, F-S3

## T06: Abschluss — main-Merge, Proben, Browser-Check, ADR-013, arc42, Final-Review

**Ziel:** Die Branch ist Merge-reif: aktuell zu `main`, alle Baseline-AK belegt, sichtbar nichts geändert, Doku und
Entscheidung festgehalten.

## Schritte

- [ ] **1 main holen:** `git merge main` (REL-03 liegt dann auf `main`). Neue Zugriffe aus REL-03/H-U1 meldet
      `npx tsc --noEmit`; der Controller setzt den T02- bzw. T04-Implementierer per `SendMessage` fort (kein neuer
      Start). `make check` und `CI=true make check` grün. Commit `refactor: M12 E0 main gemerged, Zugriffe
nachgeführt` falls nötig.
- [ ] **2 Baseline-Nachweis** (Ledger): Ausgabe von `npx vitest run tests/sim/balance*.test.ts` (AK-E0-16 … -19);
      `git diff main -- tests/sim/balance.test.ts src/sim/defs` leer; `grep -rn "createRng(" src/sim` gleich wie auf
      `main` (R-E0-6).
- [ ] **3 Probe AK-E0-09** (nur lesen, nichts committen): v7-Stand aus dem E0-Build erzeugen
      (`serialize(createWorld(3))` in einem temporären Test im Scratchpad oder per Node-Aufruf), dann im Hauptcheckout
      auf `main` (vor E0) einen temporären Vitest-Aufruf `deserialize(v7json)` ausführen → erwartet
      `{ ok: false, reason: 'Unbekannte Version' }`. Temporäre Datei danach löschen; Ergebnis in Ledger und PR-Text.
- [ ] **4 Render-Sonde:** `node tools/render-qa/perf.mjs` einmal kurz (Seed 3) im E0-Build; läuft ohne Fehler
      (Spec §4.8, Auflage Spec-Autor). Werte nur im Ledger, kein Vergleich verlangt.
- [ ] **5 Browser-Check AK-E0-20** durch `qa-playtester` (1 Start, Briefing mit diesen Punkten und P-13):
  - Server: `npx vite --port 5199 --strictPort` erst im Hauptcheckout auf `main`, danach im E0-Worktree mit
    **demselben Port** (gleiche Origin, sonst fehlt der Autosave im `localStorage`).
  - **Sichtvergleich „Neues Spiel Seed 3" auf beiden Builds** (R229 qa-B4): Seed 3 erzwingen (z. B. `Date.now`-Stub
    im Init-Skript, der beim Klick auf „Neues Spiel" einen Wert ≡ 3 mod 100 000 liefert; Mechanik im Report nennen),
    Screenshot 1280 × 800 Zoom 1 (Startbild, Lagerleiste, Kontor-Panel offen) auf `main` und im E0-Build;
    Pixelvergleich (Muster `tools/render-qa/lib.mjs`/`sichtvergleich.mjs`, Ausgabe `.studio/qa/M12-E0/`) →
    Abweichung 0 bzw. begründet (Animation/Zeit eingefroren über bestehende Dev-Parameter).
  - **v6-Autosave vom Spiel** (R229 qa-B4): auf `main` im laufenden Spiel einen Weg und ein Haus bauen, bis der
    Autosave geschrieben ist (`inselreich.save.auto` enthält `"version":6`); Lagerwerte notieren. Server stoppen,
    `localStorage` **nicht** leeren.
  - Im E0-Build: diesen Autosave laden → keine Meldung, Lager gleich den notierten Werten, Weg und Haus da.
  - Im E0-Build: Haus und Weg bauen, speichern, laden, Autosave laden → keine Meldung, Lager gleich; neues Spiel
    startet ohne Konsolenfehler.
  - `npx vitest run tests/render tests/ui` grün. Urteil OK/BEDENKEN/ZURÜCK mit Pfaden der Screenshots.
- [ ] **6 Doku** durch Doku-Umsetzer `tech-sim-engineer` (1 Start, D1 nach E-017 ausdrücklich erlaubt; Briefing: nur
      diese Datei, Abschnitt 6), danach `qa-code-reviewer` (1 Start) gegen Spec §4.9 und R227 F-S1 … F-S3:
  - `docs/adr/ADR-013-inselmodell-im-weltzustand.md` (Status „angenommen", Bezug R226 F-06, R227 F-S1 … F-S3, ADR-002,
    ADR-005): Kontext (mehrere Inseln ab E1), Entscheidung (Raster/Lager/Kontor je Insel; globale Gebäudeliste und
    Ids; Abarbeitung in Id-Reihenfolge; `island` Pflichtfeld ohne Kompatibilitäts-Zugriffe; abgeleitete Abdeckung
    nie im Save; jede Formänderung je Merge eigene `SAVE_VERSION`, v7 eingefroren), verworfene Alternativen (Welt je
    Insel mit eigener Gebäudeliste; Insel-Id an der Kachel; Abdeckungsraster mit Invalidierung), Folgen (Kosten der
    Umkehr: v7 in Autosaves; E1 lockert die Ladeprüfung auf n Inseln).
  - `docs/arc42.md`: Persistenz (Save v7, Kette bis v7, `migrateV6ToV7` reihenfolgetreu), Bausteinsicht Weltzustand
    (Insel vs. global, `world.ts`-Helfer, `coverage.ts`), Laufzeitsicht (Abdeckung je `tickPopulation`, Aufrufer ohne
    `cov` filtern je Aufruf); Mermaid ohne `\n` in Labels.
  - `docs/index.md`: ADR-013 in der ADR-Liste, falls dort geführt. README unverändert (Spec §4.9).
  - Commit `docs: M12 E0 ADR-013 und arc42 Inselmodell`.
- [ ] **7 Final-Review durch lead-qa** auf **opus** (1 Start von C3 an `lead-qa`, R229 qa-B1) über
      `git diff main...feat/m12-e0`; lead-qa setzt Prüfer nach eigenem Budget ein (lead-qa 1). Prüfliste:
      alle AK-E0-01 … -21 laut [abdeckung.md](abdeckung.md) mit Test; Global Constraints; mechanischer Diff
      `controller.ts`/`merchantsController.ts`; Migration wurffrei und reihenfolgetreu; keine Aliase auf `World`;
      Ladeprüfung N01–N21; `Coverage` nur innerhalb `tickPopulation`; Rot-Belege je Task in Git; Doku konsistent
      (ADR-013, arc42); keine Secrets; Commit-Konvention. Fix-Runden per `SendMessage` an den betroffenen Implementierer.
- [ ] **8 Abschluss:** Rulings aus dem Ledger nach `docs/studio/rulings.md` (Entwurf für L0), Bericht an L0 „bereit
      fürs Gate Merge" mit Pfaden (Ledger, Screenshots, Perf-Pin, Probe AK-E0-09).
