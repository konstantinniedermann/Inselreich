# T05 · Doku (D1, E-017) und Abschlusslauf

Umsetzer `tech-ui-engineer` (Fortsetzung) · ≈ 10 Tools · AK BF12 · blocked-by: T04

## Dateien

- ändern: `README.md` (Absatz Fernauftrag, Z. ≈ 112–113: ein Satz laut Spec Regel 8)
- nicht ändern: `docs/arc42.md` (keine Modul-, Tick- oder Persistenzänderung), Z. 74 und 219 bleiben richtig

## Abschluss (Controller, einmal, bei freier Testsperre)

`make check; echo EXIT=$?`, `tests/sim/balance.test.ts` grün, `git diff main -- src/sim` nur Kommentar, `SAVE_VERSION` unverändert; Rulings aus dem Ledger nach `docs/studio/rulings.md`; Bericht an L0 «bereit zum Merge-Gate» mit Handoff.
