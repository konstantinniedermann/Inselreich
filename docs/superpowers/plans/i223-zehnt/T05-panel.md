# T05 · Panel: Schalter, Dialog, Verfall-Meldung

Strang A (nach Merge B → A) · Persona `tech-ui-engineer` (Fortsetzung des T04-Umsetzers per `SendMessage`, jetzt im Worktree `.worktrees/i223`) · Modell sonnet · ≈ 55 Tools · blocked-by: T03, T04 (beide Review OK, B in A gemerged) · Vorbereitung AK-ZE-17, -18, -19, -20 (Abnahme im Browser, T07)

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`. Der Sim-Umsetzer arbeitet während T05 nicht in diesem Baum.

**Files:** Modify `src/ui/inspect.ts` (45 KB: nur Amtsstuben-Steuerzeilen Z. ≈ 630–700 und deren Markup-Erzeugung lesen; `rg -n "tax-min-|tax-lock-|data-tax" src/ui/inspect.ts`), `src/ui/app.ts` (Steuer-Aktion Z. ≈ 895, Loop Z. ≈ 1705–1725), `src/style.css`; Create `src/ui/titheDialog.ts` (DOM, nur Darstellung), `tests/ui/tithe-source.test.ts`.

## Interfaces

- Consumes (T03): `setTithe(world, tier, on): Result`, `titheLocked`. (T04): alle Exporte aus `titheView.ts`. Bestand: `openModal` (`modal.ts:105`), `showMessage`, `TITHE_GOOD`.
- Produces (`titheDialog.ts`):
  ```ts
  export function openTitheConfirm(
    host: HTMLElement,
    lines: string[],
    opener: HTMLElement | null,
    onYes: () => void,
  ): void; // Knöpfe «Zehnt einschalten», «Abbrechen»; Esc/Hintergrund = Abbrechen
  ```
  `renderConfirm` wird **nicht** verwendet (fester Text «Ja, neue Insel»).

## Inhalt

1. **Schalter** in der Steuerzeile je Stufe, nur für `Object.keys(TITHE_GOOD)` (Pioniere, Siedler): zwei Knöpfe `Geld | Zehnt` mit `data-tithe-tier`, `data-tithe-on` (`'0'`/`'1'`), `aria-pressed` wie die Steuerknöpfe; `title` = `titheTooltip(tier)`. Darunter Feld `tithe-lock-<t>` (`titheLockText`, `hidden` bei `''`). In der Sperre: beide Knöpfe `disabled`, `title` = «Sperrzeit». Ohne wirksame Amtsstube: `disabled`, `title` = `townhallReason(world)`.
2. **Steuerzeile:** Ist `titheFlowText(world, t)` nicht leer, ersetzt es den Text von `tax-min-<t>`; sonst bleibt `tierTaxPerMinute` (bestehender Pfad, Z. ≈ 689).
3. **Aktion (`app.ts`):** Klick auf `Zehnt` (aus `Geld`) → `openTitheConfirm(host, titheConfirmLines(world, t), btn, () => act(setTithe(world, t, true)))`; Klick auf `Geld` → sofort `setTithe(world, t, false)`. `fail` → `showMessage(reason, 'warn')` wie bei `setTierTaxLevel` (Z. ≈ 895). Die Welt ändert sich nur in diesen Aufrufen.
4. **Verfall-Meldung:** ein `TitheLossState` je Spielsitzung, beim Laden/Neustart `newTitheLossState()`; im Loop nach `reports.push(step(world))` je Bericht `collectTitheLoss(state, r, world.tick)` → `showMessage(text, 'warn')`. Neben `lossMessages(reports)`.
5. **CSS:** Schalter im Stil der Steuerknöpfe (`.active`), Desktop ab 1280 px, kein Umbruch der Steuerzeile bei 1280 × 800.

## Tests (`tests/ui/tithe-source.test.ts`, Quelltext-Prüfung, DOM-frei)

- `src/ui/titheDialog.ts` enthält die Literale «Zehnt einschalten» und «Abbrechen» und importiert nichts aus `src/sim/` ausser Typen.
- `src/ui/inspect.ts` und `src/ui/app.ts` enthalten kein `1800`, kein `TITHE_SWITCH_LOCK` und kein `STORAGE_CAP` neu (Diff-unabhängig: kein Treffer für `/TITHE_SWITCH_LOCK|STORAGE_CAP/` in `titheDialog.ts`; in `app.ts` kein `titheOn\[.*\]\s*=`, d. h. keine direkte Weltänderung).
- `app.ts` ruft `collectTitheLoss` und `setTithe` auf (je ein Treffer).

## Schritte

- [ ] `git -C .worktrees/i223 log --oneline -3` zeigt den Merge von `feat/i223-ui`; sonst Stopp.
- [ ] Quelltest schreiben; **Rot:** `npx vitest run tests/ui/tithe-source.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen (Inhalt 1–5).
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/ui/titheView.test.ts tests/ui/inspect.test.ts tests/ui/taxView.test.ts; echo EXIT=$?` → 0.
- [ ] Sichtprüfung lokal: `make dev`, Amtsstube öffnen, ein Screenshot nach `.studio/qa/I-223/t05-panel.png` (Beleg für das Review, kein Ersatz für T07).
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-223 Zehnt-Schalter, Bestätigung und Verfall-Meldung (T05)`.
