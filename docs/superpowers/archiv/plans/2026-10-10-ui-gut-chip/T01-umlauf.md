# T01 · Gemeinsamer Umlauf-Helfer, `HOUSE_TITLES` nach `texts.ts`

Strang ui · Worktree `.worktrees/ui-gut-chip` · Umsetzer `tech-ui-engineer` · AK-GC-04, AK-GC-16 (Import) · blocked-by M13-E1-UI-Merge · Grösse S (≈ 20 Tools)

**Dateien (exklusiv):** `src/ui/problems.ts`, `src/ui/texts.ts`, `src/ui/hover.ts`, `tests/ui/problems.test.ts` (nur ergänzen, nichts ändern), `tests/ui/hover.test.ts` (nur Importpfad, falls es `HOUSE_TITLES` importiert), `tests/ui/focusStep.test.ts` (neu).
Lesen: `ak.md` (AK-GC-04, 16), `src/ui/islandJump.ts`.

## Schritt 0: Zeilenstände nach M13-E1-Merge prüfen (Pflicht)

M13-E1-UI (T12) hat `problems.ts` (`isCutOff`), `texts.ts` (`stateInfo`: Vorrang „Stillgelegt“), `hover.ts` (`troubleLine`) und deren Tests geändert. Vor dem Editieren:

```bash
git log --oneline 1b723334..HEAD -- src/ui/problems.ts src/ui/texts.ts src/ui/hover.ts tests/ui/problems.test.ts
grep -n "HOUSE_TITLES\|export function problemStep\|function compareSort\|isCutOff" src/ui/problems.ts src/ui/hover.ts src/ui/texts.ts; echo EXIT=$?
```

Auf `1b723334`: `HOUSE_TITLES` `hover.ts:77` (Nutzung Z. 113), Import `problems.ts:10`, `problemStep` `problems.ts:163–205`, `compareSort` Z. 38. Weichen die Zeilen ab, gelten die Symbole, nicht die Nummern.

## Schritte

- [ ] **Schritt 1: Roter Test `tests/ui/focusStep.test.ts`** für `stepList` mit einfachen Listen `{ key, sort }`:
  - kein Cursor, `dir 1` → Eintrag 1; `dir -1` → letzter; leere Liste → `null`;
  - Cursor auf Eintrag, Nachfolger; Umlauf am Ende (letzter → erster) und rückwärts am Anfang (erster → letzter);
  - Rückfall: Cursor-`key` nicht mehr in der Liste (Eintrag entfernt) → `dir 1` nimmt den ersten Eintrag mit grösserem `sort`, sonst Eintrag 1; `dir -1` den letzten mit kleinerem `sort`, sonst letzter;
  - Cursor mit `landed !== activeIsland` wird wie `null` behandelt;
  - `anchor` des Cursors wird an `listFor` durchgereicht, ohne Cursor die `activeIsland`.
    Lauf `npx vitest run tests/ui/focusStep.test.ts; echo EXIT=$?` → **rot** (Datei/Export fehlt).
- [ ] **Schritt 2: `stepList` in `problems.ts`** (exportiert), Signatur:

  ```ts
  export function stepList<T extends { key: string; sort: ProblemSort }>(
    listFor: (anchor: number) => readonly T[],
    cursor: ProblemCursor | null,
    activeIsland: number,
    dir: 1 | -1,
  ): { item: T; index: number; count: number; cursor: Omit<ProblemCursor, 'landed'> } | null;
  ```

  Rumpf = der bisherige Rumpf von `problemStep` (Z. 174–204), `problem` heisst `item`, die Liste kommt aus `listFor(anchor)`. `problemStep` bleibt mit unveränderter Signatur und Rückgabe (`problem`, `index`, `count`, `cursor`) und ruft `stepList((a) => problemList(world, a), …)`; es mappt `item` → `problem`. Kein Verhaltensunterschied.

- [ ] **Schritt 3: `HOUSE_TITLES` verschieben.** Definition aus `hover.ts` nach `texts.ts` (dort `export const`, `Tier`-Typimport ergänzen), `hover.ts` importiert sie aus `./texts` (Nutzung in `houseInfo`, Z. ≈ 113), `problems.ts` importiert aus `./texts` und **nicht mehr aus `./hover`**. Kein Re-Export aus `hover.ts` (sonst bleibt die Kante). Tests, die `HOUSE_TITLES` aus `hover` importieren, auf `texts` umstellen (nur Importzeile).
- [ ] **Schritt 4: Prüfen.**
      `npx vitest run tests/ui/focusStep.test.ts tests/ui/problems.test.ts tests/ui/hover.test.ts tests/ui/imports.test.ts; echo EXIT=$?` → grün, `tests/ui/problems.test.ts` **ohne geänderte Zeile** (`git diff -- tests/ui/problems.test.ts` zeigt nichts oder nur Ergänzungen). `grep -n "from './hover'" src/ui/problems.ts; echo EXIT=$?` → EXIT=1 (keine Treffer). `npx tsc --noEmit; echo EXIT=$?` und `make lint; echo EXIT=$?` → 0.
- [ ] **Schritt 5: Commit** `refactor: gemeinsamer Umlauf-Helfer stepList, HOUSE_TITLES nach texts.ts (I-043)`.

## Nicht in dieser Task

`focusList`, Meldungen, Zustand (T02/T03). Kein Verhalten der Problem-Tasten ändern.
