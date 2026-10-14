# T02 · Badge `prefer-*` eigene Klasse

Umsetzer `tech-ui-engineer` · Schätzung 20 Tools · AK-UA3-04, 05 · blocked-by: T01

## Dateien

- ändern: `src/ui/trade.ts` (Z. 207 `prefer.className`), `src/style.css` (neue Regel `.badge--prefer` samt `[hidden]`), `tests/ui/inselmarkt.test.ts`

## Testfälle (rot zuerst)

- **AK-UA3-04** Das Feld `prefer-<good>` im Handelsdialog hat Klasse `badge--prefer`, nicht `badge--boom`; das Feld `boom-<good>` behält `badge--boom`.
- **AK-UA3-05** `setField` füllt weiter Text «Vorliebe +30 %» und versteckt bei fehlender Vorliebe (bestehende Tests grün). Kontrast der neuen Farben besteht `tests/ui/contrast.test.ts`, falls Farben dort geprüft werden (sonst Vermerk); Rand und Schrift wie Boom, Füllung `--parchment` statt `--gold`.

## Schritte

1. Tests (Rot), 2. Klasse und CSS, 3. grün, `badge--boom[hidden]`-Spiegelregel für `badge--prefer`.

## Prüfschritte / Task-Review

Reviewer: nur die Marke geändert, keine Sim-Berührung. Sichtprüfung im gemeinsamen Browser-Check (Boom und Vorliebe gleichzeitig nie möglich, R-Text README Z. 76).
