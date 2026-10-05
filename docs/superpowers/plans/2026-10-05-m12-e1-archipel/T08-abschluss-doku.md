> **Task-ID:** T08 · **AK-IDs:** AK-M12-B1 … B5 (Nachweis auf Endstand), Doku (Spec §9.3)
> **blocked-by:** T07, **E0-T06** (ADR-013 vorhanden, per Merge in `feat/m12-e1`) · **Strang:** render,
> `.worktrees/m12-e1` · `tech-sim-engineer` als Doku-Umsetzer (D1-Dateien ausdrücklich erlaubt, E-017) / sonnet
> **Regeln:** [index.md](index.md) Global Constraints, Risiken R-4, R-6 · Spec §9.3, Anhang 02

## T08: Abschluss — Merges, Nachweise, Doku, Final-Review

**Ziel:** Die Branch ist auf dem Stand von `main` und `feat/m12-e0`, alle Bitgleichheits-Nachweise liegen vor, die
Doku beschreibt Archipel, Render je Insel und Save v8, und der Final-Review ist angestossen.

**Dateien (D1):** `docs/adr/ADR-013-inselmodell-im-weltzustand.md` (Nachtrag), `docs/arc42.md`, `README.md`,
`docs/beobachtungen.md` (zwei Einträge). Kein `src/`, kein `tests/`.

## Schritte

- [ ] **1 Merges (prod-B2):** `git merge feat/m12-e0`; ist E0 schon auf `main`, stattdessen `git merge main`. Konflikte nur in Doku selbst lösen; in
      `src/`/`tests/` → anhalten, Controller.
- [ ] **2 Nachweise** (Ausgabe in den Ledger):
  - AK-M12-B1: `git diff main -- tests/sim/balance.test.ts` leer, `npx vitest run tests/sim/balance.test.ts` grün.
  - AK-M12-B2: `npx vitest run tests/sim/balance-crises.test.ts` grün; `git diff main -- tests/sim/balance-crises.test.ts`
    zeigt nur `normalized()` (+ `foldBackToV7`-Import).
  - AK-M12-B3: `balance-merchants` `[6750, 11200, 320]` grün. AK-M12-B4: Zufallsfolge AK-E0-19 grün,
    `grep -rn "createRng(" src/sim` = bisherige Stellen + `islands.ts`.
  - AK-M12-B5: Kette `save-v1` … `save-v7` → v8 grün, `version 9` → „Unbekannte Version".
  - `make check`, `CI=true make check` grün; `npx prettier --check .` grün.
- [ ] **3 ADR-013 Nachtrag „Darstellung des Archipels" (E1):** Kontext (mehrere Raster, Render-Last), Entscheid
      (Archipel-Koordinaten `ox + x`; Inselkamera statt Inselparameter in allen Zeichnern; Inselansicht `islandView` nur
      lesend, Gebäude ab E2; Terrain-Cache je Insel, Heimat sofort, Fremdinseln im Leerlauf in Scheiben ≤ 8 ms, Notfall
      synchron; Detailstufe ≤ 0,25; Streichvariante `ARCHIPEL_VIEW 'jump'`), Folgen (Save v8: `kind`, `ox`, `oy`, `anchor`,
      `kontorId null`; Speicher ≈ 44,5 MB in `limits.ts`), Alternativen (Inselparameter durch alle Zeichner; Aufbau beim
      ersten Sichtkontakt — verworfen, ruckelt), Messwerte R1–R5 aus T07. Definition `d` nach D-139.
- [ ] **4 arc42:** Bausteinsicht (`src/sim/islands.ts`, `src/sim/defs/sea.ts`, `src/render/archipel.ts`,
      `src/render/cachePlan.ts`); Laufzeitsicht „Start: Heimat sofort, Fremdinseln im Leerlauf" (Mermaid-Sequenz, keine
      `\n` in Labels); Persistenz: Save v8, Migration v7 → v8, Ladeprüfung v8; Querschnitt Darstellung: Detailstufe,
      Speicher. Verweis auf ADR-013.
- [ ] **5 README** (Spielanleitung, Bedienung): Mausrad zoomt bis 1/8 und zeigt die ganze Inselwelt; zwei ferne Inseln
      (Möweninsel, Felsbucht) sind zu sehen, Mauszeiger darüber zeigt Name, Grösse, Merkmale, Fahrzeit; Bauen dort folgt
      mit der Seefahrt.
- [ ] **6 Beobachtungen** (`docs/beobachtungen.md`, je Datum, Fundort, Beobachtung, Ursprung M12-E1, Einschätzung):
      (a) `islandView` setzt `buildings: {}` — der Seefahrt-Plan (E2) muss Gebäude je Insel in die Ansicht bringen (R-6);
      (b) Plätze A/B sind in E1 nur per Geländeregel geprüft (P-3) — E2/E3 prüfen sie per `canPlace` für `kontor2` und
      `spicefarm`; `spicefarm.site` muss `PLANTATION_SITE` enthalten.
- [ ] **7 Commit** `docs: M12 E1 ADR-013 Darstellung, arc42, README` und Review durch `qa-code-reviewer` (Doku konsistent
      mit Code, Mermaid-Regel, keine Secrets, Commit-Konvention).
- [ ] **8 Final-Review:** Controller startet **lead-qa** (opus) über `git diff main...feat/m12-e1` mit Plan-Index,
      Abdeckung und Ledger; Urteil ins Ledger. Danach Bericht an L0 „bereit fürs Merge-Gate" (Merge erst nach E0).

**Review-Fokus:** Doku beschreibt den tatsächlichen Code (Namen, Konstanten, Versionen); ADR nennt Alternativen und
Messwerte; README ohne Versprechen über E2.
