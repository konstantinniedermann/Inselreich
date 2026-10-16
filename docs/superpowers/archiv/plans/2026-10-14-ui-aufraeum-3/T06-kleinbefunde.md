# T06 · Kleinbefunde REL-21

Umsetzer `tech-ui-engineer` · Schätzung 15 Tools · AK-UA3-18, 19 · blocked-by: T05

## Dateien

- ändern: `tests/sim/save.test.ts` Z. 136 (nur Testname), `src/ui/storageFull.ts` Z. 20 (`startKey`), `tests/ui/storageFull.test.ts` (Schlüsselvergleiche, falls vorhanden)

## Testfälle (rot zuerst)

- **AK-UA3-18** Testname beschreibt, was geprüft wird (`createWorld uses SAVE_VERSION`); Inhalt unverändert (kein Rot nötig, reine Umbenennung, im Bericht vermerkt).
- **AK-UA3-19** `storageFull`-Zähler nutzen Präfix `f:` (vorher `g:`, Doppelbelegung mit `problems.ts`-Schlüssel); Test: kein Schlüssel des Zählers beginnt mit `g:` (Rot), Verhalten (Zählen, Verwerfen bei neuem World-Objekt) bleibt.

## Prüfschritte / Task-Review

Reviewer: Kommentar Z. 36 («Schlüssel `g:<insel>:<gut>`») nachgeführt; `problems.ts` unverändert.
