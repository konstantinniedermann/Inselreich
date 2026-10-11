# T09 · Final-Review der ganzen Branch (opus)

Prüfer `qa-code-reviewer` mit `model: opus` (Stufe voll: übergeben an `lead-qa`) · alle AK-M14E1-01 … -42 ·
blocked-by T08 · Branch `feat/m14-e1` gegen Basis `9113e574` (T00)

## Prüfauftrag

- Spec-Konformität über [ak.md](ak.md): jedes AK mit Testort grün oder Browser-Nachweis; jede Auflage aus R500/R501
  (Tabelle «Auflagen → Task») erfüllt.
- Determinismus: Stufe 3 ohne `rng()`; A/B bitgleich (`islands-seeds-a/-b.test.ts`); gleicher Seed → gleiche Welt.
- Save: v13-Kette, Migration ohne `createWorld`, Lagevergleich (Tech-B3), Rückfaltung mit Positivliste,
  inkompatible Stände ohne Absturz.
- Baseline: `git diff 9113e574 -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts
tests/sim/seePins.ts` leer; geänderte Pins nur nach [entscheidungen.md](entscheidungen.md) E5, Gruppe D mit Ruling-Nummer
  im Kommentar.
- Faktor an genau einer Stelle (`islandCycle`); keine Zahl im UI-Code; `src/render/` schreibt nicht in die Welt.
- Testzeit: neue Tests im Budget der Task-Dateien; `make check; echo EXIT=$?` Exit 0 (Controller liefert den Lauf).
- Doku: README, arc42, ADR-010-Nachtrag konsistent; keine Secrets; Commit-Konvention.

Urteil OK / BEDENKEN / ZURÜCK. Bei ZURÜCK: Fix-Runde, dann **Delta-Review desselben Reviewers per SendMessage**
(R553, im Budget enthalten).
