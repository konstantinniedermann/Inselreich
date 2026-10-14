# T01 · Rechtsklick im Linienzug staffelt wie Esc (I-098)

Umsetzer `tech-ui-engineer` · Schätzung 30 Tools · AK-UA3-01 bis 03 · blocked-by: Push REL-21

## Dateien

- ändern: `src/ui/input.ts` (`onPointerDown`, Zweig `e.button === 2`, ca. Z. 361)
- ändern: `tests/ui/input.test.ts` (Gruppe «Linienzug», ca. Z. 320–390, Helfer `ptr`, `at`, `actions`)

## Testfälle (rot zuerst)

- **AK-UA3-01** Zug mit Umschalt offen, Rechtsklick: `actions` enthält `{type:'roadLine',phase:'cancel'}`, aber **kein** `{type:'cancel'}`; Werkzeug bleibt (kein Abwurf).
- **AK-UA3-02** Zweiter Rechtsklick ohne Zug: `{type:'cancel'}` wie heute (altes Verhalten ohne Zug bleibt, bestehender Test grün).
- **AK-UA3-03** Esc und erster Rechtsklick im Zug haben dieselbe Wirkung (gleicher Vergleichstest); Abriss- und Weide-Zug: der Umsetzer prüft, ob `drag` dort bei Rechtsklick gesetzt ist; wenn ja gleiche Staffelung mit Test, wenn nein Test «unverändert» und Vermerk im Task-Bericht.

## Schritte

1. Drei Tests schreiben, `npx vitest run tests/ui/input.test.ts` zeigt Rot (Ausgabe sichern).
2. Zweig umbauen: `if (drag?.line === true) { cancelPointerAction(); return; }` vor `onAction({type:'cancel'})`.
3. Test grün; `make lint typecheck` (gezielt, kein `make check`, Testlock).

## Prüfschritte / Task-Review

Reviewer prüft: Touch-Pfad unberührt, `contextmenu` weiter unterdrückt, keine neue Action-Art. README-Text bleibt bis T07 stehen.
