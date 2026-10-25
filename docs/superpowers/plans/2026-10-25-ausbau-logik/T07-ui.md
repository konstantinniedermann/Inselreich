# T07 AL-3 UI: Ausbau-Checkliste, Zustandschip, Tooltip

Persona `tech-ui-engineer` · Strang C · Tools ≈ 75 · AK-AL-37 (Tooltip-Teil), 38, 39, 40, 41 (ohne Teil 4), 42, 43 (ohne Teil 4), 29 (Vitest-Teil), Review Focus 4 · blocked-by T05.

Spec: R9 (Karte, Chip, Tooltip), Anhang 02 N3, N5, AK-AL-29, 37–43. Desktop-first ab 1280 px; Card-UI wie die heutige Ausbau-Karte.

**Worktree:** `.worktrees/ausbau-ui`, Branch `feat/ausbau-ui` von `feat/ausbau-logik` @ T05 (Hash vom Controller).

**Files:** Create `src/ui/levelChecklist.ts` (DOM-frei), `tests/ui/levelChecklist.test.ts`. Modify `src/ui/panelView.ts` (`upgradeCard`/`upgradeView` auf `levelChecks` umstellen, Probelauf auf Kopie entfällt), `src/ui/inspect.ts` (45 KB, nur abschnittsweise: `rg -n "upgradeCard|cardNode\('Ausbau'|UPGRADE_TITLE|chip" src/ui/inspect.ts`), `src/style.css` (✓/✗-Zeilen, Chip), `tests/ui/panelView.test.ts`, `tests/ui/inspect.test.ts`.

**Interfaces:**

- Consumes (Sim): `levelChecks(world, b, level)`, `levelChipText(world, b)`, `levelChipDetail(world, b)` aus `src/sim/levelChecks.ts`; `upgradeBuilding` nur für den Klick.
- Produces (`src/ui/levelChecklist.ts`):

```ts
export interface ChecklistRow {
  id: LevelCheckId;
  ok: boolean;
  text: string;
}
export type ChecklistView =
  | { kind: 'max'; text: 'Höchste Stufe erreicht' }
  | {
      kind: 'list';
      title: string;
      rows: ChecklistRow[];
      canUpgrade: boolean;
      tooltip: string | null;
    }; // tooltip = Text der ersten ✗-Zeile, null wenn alle ✓
export function checklistView(world: World, b: Building): ChecklistView | null; // null: Betrieb ohne LEVELS
export function chipView(world: World, b: Building): { text: string; tooltip: string } | null; // tooltip = levelChipDetail verbunden mit Zeilenumbruch
```

Titel «Ausbau auf Stufe n — <Name>». Texte kommen unverändert aus der Sim (P-5); die UI ergänzt nur ✓/✗. Gesperrte Wissenszeile: Karte zeigt die Checkliste mit ✗ in der Wissenszeile (ersetzt die heutige «locked»-Karte; Gewinnzeilen `upgradeGain` bleiben wie heute über der Liste). Knopf «Ausbauen» `disabled` ⇔ `!canUpgrade`, `title` = `tooltip` bzw. `UPGRADE_TITLE`. Chip in der Kopfzeile des Betriebs-Panels (Ort wie der vorhandene Zustandschip), nur wenn `chipView` nicht null.

## Schritte

- [ ] **Tests zuerst** in `levelChecklist.test.ts` (DOM-frei; Welten mit `createWorld` + `putBuilding` aus `tests/sim/helpers.ts`, eigene Kleinhelfer in der Testdatei):
  - **AK-AL-38** Holzfäller, Schäferei, Steinbruch je ✓ und ✗, Text wie N5, Zahl = in der Welt gezählte Kacheln.
  - **AK-AL-39** Fischgrund ✓ (eine andere Hütte in r 3), ✗ (zwei), Zahl = gesetzte Hütten.
  - **AK-AL-40** Brennerei g 2 → 3: ✗ ohne Wache, ✓ mit Wache, `'off'` ✓ «nicht nötig (Krisen aus)»; Werkzeugmacher «Esse», Glashütte «Schmelzofen».
  - **AK-AL-41 (ohne Teil 4)** Siedlerhaus Abstand 6 ✓, 11 ✗ «nächstes 11 Felder»; ohne Haus; Haus nur auf anderer Insel; Stufe 3 «Meister»/Bürgerhaus.
  - **AK-AL-42** Brennerei g 3 ohne Wache (`'normal'`): `chipView.text` «Läuft wie Stufe 2: Keine Feuerwache in Reichweite 8 (Brennofen)», Tooltip enthält «Unterhalt 30 statt 34 (gedrosselt)» (Einheit wie die Sim-Zeile aus T04); `paused` bzw. brennend → `null`.
  - **AK-AL-43 (ohne Teil 4)** Jagdhütte g 3 → `{ kind: 'max' }`. **Review Focus 4:** Wohnhaus → `null`.
  - **AK-AL-37 (Tooltip)** dieselben vier Welten wie T05 (Hilfsfunktionen aus `tests/sim/upgrade.test.ts` nicht importieren, nachbauen): `checklistView(...).tooltip === upgradeBuilding(...).reason`.
  - **AK-AL-29 (Vitest)** Szene wie S1 (Fischer g 2, Nachbarn 2 und 3, Bürgerhaus 6): Zeilen und Zahlen wie R9-Bild, `canUpgrade` false, Tooltip Fischgrund; nach Abriss des Nachbarn im Abstand 2 `canUpgrade` true; nach Abriss des Bürgerhauses (kein Siedlerhaus übrig) Chip «Läuft wie Stufe 1: …», Tooltip «Unterhalt 6 statt 7 (gedrosselt)».
- [ ] **Rot-Lauf:** `npx vitest run tests/ui/levelChecklist.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen** `levelChecklist.ts`, dann Verdrahtung in `panelView.ts`/`inspect.ts`/`style.css`. Bestehende Panel-/Inspect-Tests anpassen, wo sie die alte Karte erwarten (Ledger-Liste).
- [ ] **Grün:** `npx vitest run tests/ui/levelChecklist.test.ts tests/ui/panelView.test.ts tests/ui/inspect.test.ts; echo EXIT=$?` → 0; `npx vitest related --run src/ui/panelView.ts src/ui/inspect.ts src/ui/levelChecklist.ts; echo EXIT=$?` → 0 (ausser `balance-upgrade.test.ts`, P-9).
- [ ] **Sichtprüfung Dev-Server** (kein Browser-Check-Ersatz): `make dev`, ein Fischer mit Karte, ein Screenshot nach `.studio/qa/ausbau-logik/t07-karte.png`; fremde Headless-Chrome nach R922.
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Ausbau-Karte als Checkliste mit Chip und Tooltip (AUSBAU-LOGIK T07)`.
