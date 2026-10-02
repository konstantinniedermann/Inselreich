> **Task-ID:** Abschluss, Final-Review, Gate Merge (D1, lead-tech)
> **AK-IDs:** AK-D1-01 … -03, AK-B1-04 (Ruling-Vorlage)
> **blocked-by:** QA-U2, QA-U3, QA-U4 OK
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md) · [orga-13-e010-controller-wechsel.md](orga-13-e010-controller-wechsel.md)

## Abschluss, Final-Review und Gate Merge

### D1 (lead-tech, kein Start; nach QA-U2, QA-U3, QA-U4 OK, auf `feat/m10-ui`)

- [ ] **README.md** (AK-D1-01): Abschnitt „Freischaltung Schritt für Schritt" mit Tabelle U0–U6 (Auslöser und
      Inhalte aus Spec 4.2), Option „Alles frei" (Menü „Neue Insel"), Amtsstube (Taste I, 200 Geld · 15 Holz · 2
      Werkzeug · 5 Stein, Unterhalt 120 / min, höchstens eine; Steuer und Ausgabesperre nur mit angebundener Amtsstube),
      Werkzeugmacher braucht Schule in Reichweite, Roden (C, 10 Geld, kein Holz) und Aufforsten (Q, 20 Geld), Hilfe
      (`?`), Mouse-over (Auswahl-Werkzeug, 400 ms). Tastenliste um I, C, Q, `?`.
- [ ] **arc42** (AK-D1-02): §5 Bausteine `unlocks`, `townhall`, `forest` (Sim), `hover`, `icons` (UI) mit Importrichtung
      B9; §8 Gebäudezustände + `noService`, Steuerstufe mit `effectiveTaxLevel`, „Sim-Abfragen und Caches im Renderer"
      mit Geländeart im `layoutKey` und den gelände-festen Caches (Spec 7); §6/§8 Persistenz (lead-tech, nach Task 2)
      und §10 (R1) auf Stand prüfen.
- [ ] **Hauptspec** `docs/superpowers/specs/2026-09-29-inselreich-design.md` (AK-D1-03): in 2.2, 2.4, 2.7, 2.8, 3.3,
      3.7 je eine Zeile „**Änderung M10:** siehe [M10-Spec](2026-10-03-m10-schritt-fuer-schritt-spec.md) §{n}" (2.2 → §6,
      2.4 → §4, §5.1, §5.5, 2.7 → §4.6, 2.8 → §5.2, 3.3 → §8.1, 3.7 → §8.2).
- [ ] `make check`; Commit `docs: M10-D1 README, arc42 §5/§8, Hauptspec-Verweise (Spec 19, 20)`; push.

### Final-Review M10

**Prüfer** `qa-code-reviewer` mit `model: opus` im Agent-Aufruf und Kopfzeile `Modell: opus` im Briefing (Start durch
`lead-qa` aus dessen Budget, R164 QA 2) über **`feat/m10-ui`** (enthält `feat/m10-sim` @ Task 4, `feat/m10-forest`,
`feat/m10-scen`, `feat/m10-render` (letzter SHA nach Merge von `main` durch lead-art), `feat/m10-icons`, D1). Vorher
merged Controller 2 den aktuellen `main` (`git -C .worktrees/m10-ui merge --no-edit main`), `make check`, BG-3, push;
geprüft wird genau dieser SHA.

1. `make check` grün; Global Constraints „Unverändert gegen `<BASIS>`" (`git diff` leer); BG-1/BG-2-Werte aus dem
   Ledger und BG-3 am Prüf-SHA; Determinismus (BG-3, beide Welten).
2. Save v5: AK-S1-11 … -15 mit Fixture `save-v4.json` (erster Commit von `feat/m10-sim`, W1) — Liste abhaken.
3. Architektur: `src/sim/**` ohne DOM, kein `Date`/`Math.random`; Werte nur in `src/sim/defs/`; `PLAN-B9` grün;
   Ausnahmen der Ownership nur an den genannten Stellen; `src/render/renderer.ts` nur `Tool`, Forst-Vorschau und
   `wildlifeEnvOf`.
4. Abdeckung: Abdeckungs-Grep (Kopf) → alle Vitest-AK und `RF-1` … `RF-5`, `PLAN-B9`; Browser-AK per QA-Berichten;
   Review-AK (AK-S1-05 c, AK-S1-20, AK-B1-04, AK-D1-01 … -03) per Diff. Tabelle „Abdeckung AK → Task" unten als
   Prüfliste.
5. Testzählung je Datei gegen `<BASIS>`; geänderte bestehende Tests nur nach T-1 … T-13; Massstab Spec @ `0797218`
   plus die vom Gate Plan bestätigten P- und W-Zeilen.
6. Gesammelte Minor/Low-Befunde aus dem Ledger (R65). Urteil OK / BEDENKEN / ZURÜCK; Fix-Runden über Controller 2.

**Gate Merge M10** (L0) → `production-integrator`: `git merge-tree --write-tree main <SHA>` ohne Konflikt,
`git merge --no-ff <SHA feat/m10-ui>` mit genau dem geprüften SHA, `make check`, push, CI und Pages grün. Danach
entfernt `lead-production` die M10-Worktrees per Ruling.

### Ruling-Vorlage B1 (AK-B1-04, lead-tech; das Ruling schreibt L0)

> „Freischalt-Ticks Seed 3: U2 150, U3 350, U4 550, U5 {3850} / {4750}, U6 {6050} / {7050}, U1 nie (Krisen aus /
> normal mit Feuerwache); M8-B1 erster Kaufmann {…}, zweites Ziel {…}, Bürger-Endzustand {…} / {…} — Baseline
> unverändert." Messwerte aus dem Task-5-Bericht einsetzen; weicht einer ab, Meldung statt Ruling.

### Rulings, Befunde, E-010, Schlussbericht

1. Controller-Entscheide, gemeldete Widersprüche (R136/R137), bestätigte P-/W-Zeilen und Streichentscheide aus dem
   Ledger `.superpowers/sdd/m10/ledger.md` stehen im Schlussbericht; L0 trägt sie nach dem Merge in
   `docs/studio/rulings.md` ein.
2. Befunde ausserhalb Scope (Fundort, Beobachtung, Ursprung, Einschätzung) im Schlussbericht; L0 trägt sie in
   `docs/beobachtungen.md` ein. Gelöste Beobachtungen: „Gesperrtes vor der Freischaltung sichtbar" (a) und (b) → U1;
   „Terrain-Cache hängt an `layoutKey`" → F1, R1 (R1 meldet, L0 trägt ein; R164 B3).
3. E-010 M-2/M-3 ins Ledger und in den Schlussbericht an L0 und `studio-coach`.
4. Bericht an L0 „bereit fürs Gate Merge M10" mit SHA, Final-Review-Urteil, Ruling-Vorlage B1, Playtest-Fragen
   P-01 … P-04 (Spec 18.2) für den Nutzer.

---
