# T02 · Texte: Menü, `aria-label`, Tooltip «Leer»

Umsetzer `tech-ui-engineer` · ≈ 35 Tools · AK-5 bis 7 · blocked-by: T01

## Dateien

- ändern: `src/ui/menu.ts` (Z. ≈ 109 `crisisLabel.append`), `src/ui/eventLogView.ts` (Z. ≈ 27), `src/ui/hud.ts` (nur `reachLine`, Z. nach F neu suchen), zugehörige Tests: `tests/ui/menu.test.ts`, `tests/ui/hud.test.ts`, für den Log-Knopf eine Testdatei nach Fund (`rg -n "renderEventLog" tests/ui`; gibt es keine, neue `tests/ui/eventLogView.test.ts` mit `fakeDom`)
- nicht ändern: `src/ui/reach.ts`, `src/ui/crisisLog.ts`

## Verhalten (D-3 bis D-5)

1. Menü: `crisisLabel.append('Krisen (neue Insel): ', select)`; `aria-label` und «Freischaltung: » bleiben.
2. Ereignis-Knopf: bei `n > 0` `aria-label` = `Ereignisse${unreadLabel(n)}`; sonst Attribut entfernen. Import von `unreadLabel` ist vorhanden.
3. `reachLine`: bei `r.kind === 'empty'` und `stock <= 0` Rückgabe `Jetzt leer bei ${rate} / min (ohne Handel und Aufträge)\n`; sonst unverändert.

## Test-first (Rot-Beleg)

Tests erwarten den neuen Text (AK-5, 6, 7) und laufen vorher **rot** (`npx vitest run <Dateien>; echo EXIT=$?`, Ausgabe im Ledger); bestehende AK-UR-05-Fälle bleiben unverändert grün. Erwartungstexte für Tooltip und Zähler nicht als Literal doppeln, wo ein Helfer (`unreadLabel`, `signedNum`, `perMinute`) existiert.

## Prüfschritte

`rg -n "Leer in 0|neue Ereignisse|Krisen: \" src tests` ohne Treffer ausser `crisis.ts`-Karte («Krisen: normal …», andere Stelle, bleibt); `make check` Exit 0; Review `qa-code-reviewer` (Urteil OK).
