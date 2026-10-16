# T11 · Gründe U-7 und Abriss-Bestätigung (Zwei-Klick, R483) (TDD)

Strang ui · Worktree `.worktrees/m13-e2-ui` · Umsetzer `tech-ui-engineer` (sonnet) · AK-M13E2-34 (Spec §7.1 U-7,
§7.5 U-14, U-15; Anhang 08 C; Anhang 07 B, C) · blocked-by T10 · Grösse M (≈ 30 Tools)

**Zweck:** Bewusste Ausnahme zu R476 (3): Nur das Denkmal mit Fortschritt (`running` oder `stage ≥ 1`) verlangt
einen zweiten Klick bzw. Tastendruck; jedes andere Gebäude geht per Knopf und `Entf`/`Backspace` sofort weg.

**Files:**

- Create: `src/ui/demolishConfirm.ts`, `tests/ui/demolishConfirm.test.ts`
- Modify: `src/ui/monumentView.ts` (`monumentNeedsConfirm`), `src/ui/hints.ts` (`REASON_TABLE`), `src/ui/inspect.ts`
  (Abriss-Knopf: Text und Zwei-Klick), `src/ui/app.ts` (`demolishSelected`, `demolishFromPanel`, Kachel-Abriss,
  Rücksetzen bei Auswahlwechsel/`Esc`/Panel schliessen), `src/ui/input.ts` (`canDemolishTile`/Abriss-Zug),
  `src/ui/hotkeys.ts` (nur falls `demolishTarget` den Zustand braucht), `tests/ui/hints.test.ts`,
  `tests/ui/monumentView.test.ts`
- Lesen: Anhang 08 C (Fälle C1–C7), Spec §7.5; `blurAfterClick` und «Wirklich laden?» in `src/ui/dom.ts`/`menu.ts`
  (Muster), `demolishTarget` (`hotkeys.ts`), `demolishSelected` in `app.ts`, `canDemolishTile`, `demolishStroke`
  (`input.ts`), `tests/ui/input.test.ts` (Testmuster).

## Schnittstelle

```ts
// src/ui/monumentView.ts
export function monumentNeedsConfirm(w: World, id: number): boolean;
// = w.monument !== null && id === w.monument.buildingId && (w.monument.running || w.monument.stage >= 1)

// src/ui/demolishConfirm.ts (rein, DOM-frei)
export const CONFIRM_TEXT = 'Wirklich abreissen? Fortschritt geht verloren';
export const MAP_SKIP_TEXT = 'Denkmal nur im Panel abreissen';
export interface ConfirmState {
  armedId: number | null;
}
export type ConfirmInput =
  | { kind: 'press'; id: number } // Klick «Abreissen», Entf oder Backspace — gleich behandelt
  | { kind: 'reset' }; // Auswahlwechsel, Esc, Panel schliessen
export function confirmStep(
  w: World,
  s: ConfirmState,
  input: ConfirmInput,
): { state: ConfirmState; demolish: boolean; buttonText: string | null };
/** Abriss-Werkzeug/-Zug: false für ein Denkmal mit Fortschritt (Meldung MAP_SKIP_TEXT), sonst true. */
export function mapDemolishAllowed(w: World, id: number): boolean;
```

- `confirmStep`: `press` auf ein Gebäude ohne `monumentNeedsConfirm` → `demolish true`, Zustand ungeschärft; auf ein
  Denkmal mit Fortschritt: ungeschärft → scharf (`armedId = id`, `buttonText = CONFIRM_TEXT`, kein Abriss); scharf mit
  derselben Id → `demolish true`, ungeschärft. `press` auf eine andere Id setzt zurück und behandelt die neue Id neu.
  `reset` → ungeschärft, `buttonText null`.
- Verdrahtung: Knopf und Taste rufen denselben `confirmStep` (ein Zustand im App-Zustand); `demolish true` → bestehende
  Abriss-Aktion **genau einmal**. Kachel-Abriss und Abriss-Zug fragen `mapDemolishAllowed`; bei `false` bleibt das
  Denkmal stehen, Meldung `MAP_SKIP_TEXT` (einmal je Zug), Häuser im selben Zug werden abgerissen.
- `REASON_TABLE` (Pflichtfeld `source`: `'placement'` für die drei Bauplatz-Gründe, neuer Wert `'monument'` im Quell-Typ
  für die fünf Aktionsgründe): Zeilen für `'Erst nach dem Kaufleute-Ziel'`, `'Nur auf der Heimatinsel'`, `'Es gibt schon ein
Denkmal'`, `'Kein Denkmal'`, `'Abschnitt läuft'`, `'Denkmal fertig'`, `'Ungültiges Gut'`, `'Ungültiger Wert'`, je
  Text unverändert (Muster «Ungültiges Edikt»). Geldgrund über die bestehende Zeile `^Zu wenig Geld$` mit
  `ctx.cost = { money: MONUMENT_STAGES[stage].money, wood: 0, tools: 0, stone: 0 }`.

## Schritte

- [ ] **Schritt 0:** `grep -n "Wirklich laden\|blurAfterClick" src/ui/*.ts`; `grep -n "demolish" src/ui/app.ts
src/ui/input.ts src/ui/inspect.ts | head -40`.
- [ ] **Schritt 1: Test zuerst (rot):**
  - `tests/ui/monumentView.test.ts`: `monumentNeedsConfirm` — Stufe 0 ohne Lauf `false`, laufend `true`, `stage 1`
    nicht laufend `true`, anderes Gebäude `false`.
  - `tests/ui/demolishConfirm.test.ts`, Fälle **C1–C7** aus Anhang 08 C wörtlich als `it` (C2 mit allen drei
    Eingabefolgen; C6 Haus und Amtsstube; C7 über `mapDemolishAllowed` und den reinen Teil des Abriss-Zugs, falls
    `demolishStroke` dafür einen Helfer braucht: neuer reiner Helfer `strokeTargets` in `src/ui/demolishConfirm.ts`, Test in `tests/ui/demolishConfirm.test.ts`; sonst
    nur `mapDemolishAllowed`).
  - `tests/ui/hints.test.ts`: alle acht Gründe U-7 wörtlich; «Zu wenig Geld: 4000 nötig, 100 vorhanden» mit
    `ctx.cost` des Abschnitts.

```bash
npx vitest run tests/ui/demolishConfirm.test.ts tests/ui/monumentView.test.ts tests/ui/hints.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen** (Helfer, dann Verdrahtung).

```bash
npx vitest run tests/ui/demolishConfirm.test.ts tests/ui/monumentView.test.ts tests/ui/hints.test.ts \
  tests/ui/input.test.ts tests/ui/hotkeys.test.ts tests/ui/inspect.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

Bestehende UI-TASTEN-Tests (`hotkeys.test.ts`, AK-UT-*) bleiben **ohne Änderung** grün (Regression C6).

- [ ] **Schritt 3: Commit.** `feat: Abriss-Bestätigung für das Denkmal mit Fortschritt, Gründe (M13-E2 T11)`.

## Bericht

Testnamen C1–C7, Rot-Zeile, Exit-Codes, Liste der Verdrahtungsstellen (Datei:Zeile). Browser-Abnahme: T15 (AK-45).
