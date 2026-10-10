# T09 · Reine Helfer `src/ui/edictView.ts` und Edikt-Gründe (TDD)

Strang ui · Worktree `.worktrees/m13-e1-ui` · Branch `feat/m13-e1-ui` · Umsetzer `tech-ui-engineer` (sonnet) · AK-M13E1-26 (UI-Teil), 27, 28, 29, 30, PLAN-M13-02 · Spec §7.1, U-6 · blocked-by T03, REL-17-Merge · Grösse M (≈ 25 Tools)

**Vorbereitung (Controller C):** `git worktree add .worktrees/m13-e1-ui -b feat/m13-e1-ui main` erst, wenn REL-17 auf `main` liegt; danach `git merge --no-ff feat/m13-e1-sim` (Stand T03: `EDICTS`, Weltfelder, `edicts.ts` mit `activeEdict`, `edictReason`, `setEdict`). `npm ci` falls nötig.

**Files:**

- Create: `src/ui/edictView.ts`, `tests/ui/edictView.test.ts`
- Modify: `src/ui/hints.ts` (`REASON_TABLE`), `tests/ui/hints.test.ts` (Vollständigkeit AK-UX-03, neue Zeilen)
- Lesen, nicht ändern: `src/sim/edicts.ts`, `src/sim/defs/edicts.ts`, `src/sim/defs/timing.ts` (`GROWTH_INTERVAL`, `EDICT_LOCK`), `src/sim/townhall.ts`, `src/ui/time.ts` (`formatGameTime`), `src/ui/taxView.ts` (Muster `taxLockText`), `tests/ui/worlds.ts`, `tests/sim/helpers.ts` (`placeTownhall`)

## Schnittstelle (rein, DOM-frei; Kopfkommentar wie `taxView.ts`)

```ts
export function edictEffectText(id: EdictId): string;
export function edictWhenText(id: EdictId): string; // «lohnt, wenn …» (Spec 7.1)
export function edictLockText(w: World): string; // `wieder änderbar in ${formatGameTime(rest)}` oder ''
export interface EdictCard {
  active: boolean;
  disabled: boolean;
  reason: string | null;
  buttonText: string;
}
export function edictCardState(w: World, id: EdictId): EdictCard;
export function edictStatusLine(w: World): string;
```

- **`edictEffectText`** aus den Def-Werten, Teile in fester Folge, verbunden mit « · »: `upkeepPct < 100` → `Unterhalt −{100 − p} %`; `buyPct < 100` → `Kaufpreise am Kontor −{100 − p} %`; `growthInterval` → `Wachstum alle {fmt(gi)} statt {fmt(GROWTH_INTERVAL)}`; `upgradeWait` → `Aufstieg nach {fmt(w)}`; `taxPoints > 0` → `Steuer −{n} Punkte`. Minuszeichen U+2212 «−» wie in der Spec. Ergebnis wörtlich (AK-27): Sparen «Unterhalt −20 % · Steuer −7 Punkte», Handel «Kaufpreise am Kontor −20 %», Wohlfahrt «Wachstum alle 4 s statt 5 s · Aufstieg nach 20 s · Steuer −5 Punkte».
- **`edictWhenText`** feste Sätze (Spec 7.1): Sparen «lohnt, wenn die Kolonie steht und wenig kauft», Handel «lohnt, wenn du Ware zukaufst», Wohlfahrt «lohnt, wenn du viele neue Häuser hochziehst». Als `Record<EdictId, string>` in `edictView.ts` (UI-Text, kein Spielwert).
- **`edictCardState`:** `active = w.edict === id`; Aktion der Karte = aktiv ? `null` (Aufheben) : `id`; `reason = edictReason(w, aktion)` (reine Sim-Prüfung, **nie** `setEdict` ausführen); `disabled = reason !== null && reason !== 'Zu wenig Geld'`; `buttonText` = aktiv «Aufheben», sonst `Erlassen (${EDICT_COST})`.
- **`edictStatusLine`:** `w.edict === null` → «Kein Edikt»; wirkt (`activeEdict(w) !== null`) → `Edikt: ${name}`; erlassen, Amtsstube wirkt nicht → `Edikt ${name} ruht: Amtsstube wirkt nicht`. Vor der Freischaltung zeigt T10 statt der Statuszeile «Erst nach dem Bürger-Ziel» (U-4).
- **Gründe (U-6, `hints.ts`):** Zeile für `'Edikt-Sperrzeit'` (unten); wörtlich (`show: same`): `Erst nach dem Bürger-Ziel`, `Edikt bereits aktiv`, `Kein Edikt aktiv`, `Ungültiges Edikt`. «Zu wenig Geld» und die Amtsstuben-Gründe bestehen schon.

```ts
{
  source: 'edicts',
  pattern: /^Edikt-Sperrzeit$/,
  show: (_m, w) =>
    w.tick < w.edictLockedUntil
      ? `Edikt erst in ${formatGameTime(w.edictLockedUntil - w.tick)} wieder änderbar`
      : null,
},
```

- Kein Import aus `./inspect`, `./app`, `./hints` in `edictView.ts` (Zyklen, `tests/ui/imports.test.ts`).

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** `tests/ui/edictView.test.ts`, `describe('M13-E1 edictView (AK-M13E1-27…30)')`. Welt: `createWorld(3, { unlockAll: true })`, `won = true`, `placeTownhall(w)`, `money = 1000`, `tick = 1000`.
  1. `AK-M13E1-27`: drei Wirkungstexte wörtlich; `edictWhenText` je Edikt nicht leer und beginnt mit «lohnt, wenn».
  2. `AK-M13E1-28`: `won = false` → alle drei `disabled`, `reason 'Erst nach dem Bürger-Ziel'`; Sparen erlassen (`setEdict`) → Sparen `active`, `buttonText 'Aufheben'`; in der Sperre andere Karten `disabled`, `reason 'Edikt-Sperrzeit'`; nach Sperrende mit `money 100` → `disabled false`, `reason 'Zu wenig Geld'`; ohne Sperre, mit Geld, ohne Edikt → `reason null`, `buttonText 'Erlassen (600)'`.
  3. `AK-M13E1-29`: Rest 3000 → «wieder änderbar in 5:00»; 450 → «wieder änderbar in 45 s»; 0 → `''`; `friendlyReason(w, 'Edikt-Sperrzeit')` bei Rest 450 → «Edikt erst in 45 s wieder änderbar» (in `tests/ui/hints.test.ts`).
  4. `AK-M13E1-30`: «Kein Edikt»; Handel → «Edikt: Handel»; Amtsstube brennt (`outageUntil`) → «Edikt Handel ruht: Amtsstube wirkt nicht».
  5. `AK-M13E1-26` (UI): `friendlyReason(w, 'Unbekannte Version')` und `'Ungültiges Format'` nicht leer (`tests/ui/hints.test.ts`).
  6. Vollständigkeit AK-UX-03: die fünf Edikt-Gründe über echte `setEdict`-Aufrufe provozieren und `covered` prüfen.
  7. Reinheit: `JSON.stringify(w)` vor/nach allen Helfern gleich; `readFileSync('src/ui/edictView.ts')` ohne `document`/`window`.

```bash
npx vitest run tests/ui/edictView.test.ts tests/ui/hints.test.ts; echo EXIT=$?   # rot: Modul fehlt, Gründe fehlen
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/ui/edictView.test.ts tests/ui/hints.test.ts tests/ui/tooltip.test.ts tests/ui/imports.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Texte und Kartenzustand der Edikte als reine Helfer (M13-E1 T09)`.

## Bericht

Je AK Testname und Rot-Zeile, Exit-Codes, Zeilenzahl `edictView.ts`, `git diff --stat main...HEAD -- src/ui tests/ui`.
