# T12 · Stilllegen im UI, Zustandstexte, Problemliste (TDD)

Strang ui · Worktree `.worktrees/m13-e1-ui` · Umsetzer `tech-ui-engineer` (sonnet, Fortsetzung) · AK-M13STL-09, 11; Browser-Teil AK-M13STL-10 in T14 · Spec §8.2 U-11…U-13, S6 (Problemliste, R455 Q-B3) · Entscheid E4 · blocked-by T11, T07 · Grösse M (≈ 40 Tools)

**Vorbereitung (Controller C):** `git merge --no-ff feat/m13-e1-sim` (Stand T07: `setPaused`, `buildingUpkeep`, Zustand `'paused'` in der Sim). `src/ui/problems.ts` liegt seit dem REL-17-Merge auf `main` und damit im Branch.

**Files:**

- Modify: `src/ui/inspect.ts` (`InspectActions.setPaused(id, paused)`; `renderBetrieb`/`updateBetrieb`: Knopf; `upkeepText` mit `buildingUpkeep`), `src/ui/app.ts` (Aktion `setPaused` im `setPanel`-Block), `src/ui/texts.ts` (`stateInfo`: Vorrang), `src/ui/panelView.ts` (`stateTone` Vorrang; Kachel `upkeep` mit `buildingUpkeep`; + `pauseButton`), `src/ui/hover.ts` (`troubleLine`), `src/ui/guide.ts` (`storageFull`-Zusatz, kein Hinweis bei `paused`), `src/ui/problems.ts` (`isCutOff`), `src/ui/hints.ts` (Gründe), `src/style.css` (falls Knopf-Stil nötig)
- Tests: `tests/ui/panelView.test.ts`, `tests/ui/inspect.test.ts`, `tests/ui/hover.test.ts`, `tests/ui/guide.test.ts`, `tests/ui/problems.test.ts`, `tests/ui/hints.test.ts`, `tests/render/statusMarks.test.ts`
- Lesen: `src/sim/pause.ts`, `src/sim/levels.ts`, `src/render/statusMarks.ts` (liefert für unbekannte Zustände schon `null`, nicht ändern)

## Regeln

- **U-11 Knopf:** reiner Helfer in `panelView.ts`: `export function pauseButton(b: Building): { text: string; title: string } | null` → `null` ohne `BUILDING_DEFS[b.defId].produces`; sonst `{ text: b.paused ? 'Wieder anfahren' : 'Stilllegen', title: 'Halber Unterhalt, keine Erzeugung' }`. Knopf `data-field="pause"` unter der Zustandszeile, Klick → `actions.setPaused(b.id, b.paused !== true)`; in `app.ts`: `const r = setPaused(world, id, paused); if (!r.ok) showError(friendlyReason(world, r.reason)); refresh();`. Wohnhaus, Dienste, Markt, Kontore, Amtsstube: kein Knopf.
- **U-12 Texte, Vorrang Ausfall → stillgelegt → Anbindung:** `stateInfo`: nach dem Ausfall-Zweig `if (b.paused === true) return { text: 'Stillgelegt — halber Unterhalt', ok: false };` vor `!b.connected` (der `case 'paused'` aus T02 bleibt als Rückfall); `stateTone`: gleicher Vorrang, `'warn'`; Zustands-Chip nutzt `stateInfo` (keine zweite Wortfamilie). `upkeepText(b)` und Kachel `upkeep` mit `buildingUpkeep(b)` (Glashütte still «Unterhalt 78 / min»); die Ausbau-Vorschau (`upgradeGain`) bleibt nominal. `hover.ts` `troubleLine`: nach «brennt» `if (b.paused === true) return 'Stillgelegt';`.
- **U-13 Leitfaden:** `guide.ts` bei `storageFull` an jeden Rückgabetext « oder lege den Betrieb still»; ein Betrieb mit `paused` bekommt keinen Hinweis (früh `null`, auch nicht «anbinden»). Keine Statusmarke (`statusMarkOf('paused') === null`, Bestand).
- **Gründe (`hints.ts`, wörtlich, `show: same`):** `Ungültiger Wert`, `Nur Betriebe lassen sich stilllegen`, `Schon stillgelegt`, `Läuft bereits` (`Gebäude nicht gefunden` besteht).
- **Problemliste (S6, AK-M13STL-11) und Trenn-Warnung (E4):** in `problems.ts` `isCutOff(b)` um `&& b.paused !== true` ergänzen; damit fehlt ein stillgelegter Betrieb in `problemList` (Klasse 1) **und** in `cutOffIds`/`newlyCut`. Klasse 2 kennt `'paused'` ohnehin nicht. Sonst nichts an `problems.ts` ändern.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** Welt `createWorld(3, { unlockAll: true })` bzw. `uxWorld()`; Betriebe angebunden, Stilllegen über `setPaused`.
  1. `AK-M13STL-09` (`tests/ui/panelView.test.ts`, `tests/ui/inspect.test.ts`): `stateInfo` stillgelegt → «Stillgelegt — halber Unterhalt», `ok false`, auch ohne Anbindung; `stateTone` → `'warn'`; `upkeepText` Glashütte still «Unterhalt 78 / min» (läuft: «Unterhalt 150 / min»); `pauseButton` Fischer «Stilllegen» / nach `setPaused` «Wieder anfahren», Wohnhaus und Kapelle → `null`; `friendlyReason(w, 'Nur Betriebe lassen sich stilllegen')` wörtlich (`tests/ui/hints.test.ts`, dazu Vollständigkeit AK-UX-03 mit allen vier neuen Gründen); `statusMarkOf('paused') === null` (`tests/render/statusMarks.test.ts`).
  2. Hover (`tests/ui/hover.test.ts`): stillgelegter Fischer → Zeile «Stillgelegt»; brennend und still → «brennt».
  3. Leitfaden (`tests/ui/guide.test.ts`): `storageFull` endet auf « oder lege den Betrieb still»; stillgelegt und nicht angebunden → kein Hinweis.
  4. `AK-M13STL-11` (`tests/ui/problems.test.ts`, neuer `describe`): Fischer `state 'waitingInput'` erscheint; nach `setPaused(w, id, true)` fehlt er; still und ohne Anbindung (`connected false`) fehlt er; nach dem Anfahren ohne Anbindung erscheint er als «Fischer nicht angebunden». E4: `before = cutOffIds(w)` mit stillgelegtem angebundenem Fischer, Weg weg → `newlyCut(before, w) === 0`.

```bash
npx vitest run tests/ui/panelView.test.ts tests/ui/inspect.test.ts tests/ui/hover.test.ts tests/ui/guide.test.ts tests/ui/problems.test.ts tests/ui/hints.test.ts tests/render/statusMarks.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/ui/ tests/render/statusMarks.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
make build; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Betrieb stilllegen im Panel, Texte und Problemliste (M13-E1 T12)`.

## Bericht

Je AK Testname und Rot-Zeile, Exit-Codes, `git diff --stat main...HEAD -- src/ui tests/ui tests/render`; bestätigen: `git diff main...HEAD -- src/render` leer.
