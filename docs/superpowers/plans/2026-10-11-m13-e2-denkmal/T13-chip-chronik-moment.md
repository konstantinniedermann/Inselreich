# T13 · Ziel-Chip, Inselchronik, Meldungen, Abschluss-Moment (TDD)

Strang ui · Worktree `.worktrees/m13-e2-ui` · Umsetzer `tech-ui-engineer` (sonnet) · AK-M13E2-31, -33 (Spec §7.2
U-8, U-9, §7.3 U-10–U-12; Anhang 07 B) · blocked-by T12 · Grösse M (≈ 30 Tools) · Index E2, E3

**Files:**

- Modify: `src/ui/goal.ts` (`goalTexts(view, chip?)`), `src/ui/hud.ts` (Aufruf mit `monumentChip(w)`),
  `src/ui/inspect.ts` (`renderRest`: Zeile `rest-monument`), `src/ui/monumentView.ts` (`monumentEvents`,
  `monumentSnapshot`), `src/ui/soundEvents.ts` (`SoundSnapshot.monumentDone`, Ereignis), `src/ui/app.ts` (Ereignisse je
  Frame → `pushLog`/Meldung/Banner; Flare-Start), `src/audio/sound.ts` (`SoundEvent` + `'monumentDone'`, Klangfigur
  über das Sample, Drossel), `src/audio/manifest.ts` (`SFX_FILES.monumentDone = 'audio/sfx/bell.mp3'`),
  `tests/ui/goal.test.ts`, `tests/ui/monumentView.test.ts`, `tests/ui/soundEvents.test.ts`, `tests/audio/*` (nur
  ergänzen)
- Lesen: Spec §7.2, §7.3, Anhang 07 B; `goalTexts`, `goalBanners`, `initialGoalShown` (`goal.ts`), `crisisLogEntries`,
  `pushLog` (`crisisLog.ts`), `soundSnapshot`/`diffSoundEvents`, `alarm` in `sound.ts`/`manifest.ts` (Muster Sample
  mit synthetischem Rückfall), `RenderFx.monumentFlareStart` (T09).

## Schnittstelle

```ts
// src/ui/goal.ts — Phase 'done' mit Denkmal; alle anderen Phasen unverändert
export function goalTexts(view: GoalView, chip?: MonumentChip | null): GoalTexts;

// src/ui/monumentView.ts
export interface MonumentSnapshot {
  stage: number;
  monumentDone: boolean;
} // stage −1 ohne Denkmal
export function monumentSnapshot(w: World): MonumentSnapshot;
export function monumentEvents(
  prev: MonumentSnapshot,
  cur: MonumentSnapshot,
  tick: number,
): LogEntry[];
```

- **U-8:** In Phase `'done'` mit `chip !== null` übernimmt `goalTexts` `chip`, `title`, `fillPct` aus `chip`; `rest`
  und `next` wie heute. Vor `wonSpice` ist die Ausgabe gleich wie heute (bestehende Tests unverändert).
- **U-9:** `renderRest` zeigt unter «Ziel» die Zeile `rest-monument` mit `monumentChronicleLine(w)`; `hidden` bei
  `null` (vor `wonMerchants`).
- **U-10:** `monumentEvents`: `cur.stage > prev.stage` und `prev.stage ≥ 0` → `{ text: 'Denkmal: Abschnitt
{cur.stage} fertig', toast: 'info' }`; danach `!prev.monumentDone && cur.monumentDone` → `{ text: 'Wahlziel
erreicht: Das Denkmal steht!', toast: null }` plus Banner (Muster `goalBanners`). Abriss (`stage` → −1), Neubau
  (−1 → 0) und gleicher Stand → `[]`. Basis nach Laden = Schnappschuss des geladenen Stands.
- **U-11:** Einträge über `pushLog`; Sichtbarkeit des Logs bleibt wie heute (`crisisLogVisible`).
- **U-12:** Beim Übergang `monumentDone` false → true setzt `app.ts` einmal `fx.monumentFlareStart = now` und
  `diffSoundEvents` liefert `'monumentDone'` (Glocke). Nach dem Laden kein Effekt, kein Klang (Schnappschüsse beginnen
  beim geladenen Stand). `src/audio/` importiert weiter nichts aus `src/sim/` oder `src/ui/`.

## Schritte

- [ ] **Schritt 0:** `grep -n "export function goalTexts\|goalTexts(" src/ui/*.ts`; `grep -n "renderRest\|rest-"
src/ui/inspect.ts | head`; `grep -n "alarm" src/audio/sound.ts src/audio/manifest.ts`.
- [ ] **Schritt 1: Test zuerst (rot):**
  - **AK-31** `tests/ui/goal.test.ts`: vor `wonSpice` gleich wie heute (bestehende Erwartungen, ohne und mit `chip`
    `null`); danach vier Fälle U-8 über `goalTexts(goalView(w), monumentChip(w))`: «Wahlziel erreicht» (100), «Wahlziel:
    Denkmal bauen» (0), Σ 414 / 520 → «Denkmal 2/3 · 79 %», zwischen Abschnitten «Denkmal 1/3» (33).
  - **AK-33** `tests/ui/monumentView.test.ts`: `monumentEvents` 0 → 1 ein Eintrag «Denkmal: Abschnitt 1 fertig»
    (`info`); 2 → 3 mit `monumentDone` → zwei Einträge in dieser Reihenfolge; gleicher Stand, Abriss, Neubau → `[]`.
    `tests/ui/soundEvents.test.ts`: `diffSoundEvents` liefert `'monumentDone'` genau beim Übergang false → true; Paar
    (geladener Stand, geladener Stand) mit `monumentDone true` → nichts.
  - Hilfstests: `rest-monument` über den bestehenden DOM-Testweg von `renderRest` (falls `tests/ui/inspect.test.ts`
    `renderRest` prüft), sonst nur über `monumentChronicleLine` (T10); `SFX_FILES.monumentDone` zeigt auf
    `bell.mp3`; Asset-Prüfsummen unter `tests/assets/` unverändert.

```bash
npx vitest run tests/ui/goal.test.ts tests/ui/monumentView.test.ts tests/ui/soundEvents.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/ui/goal.test.ts tests/ui/monumentView.test.ts tests/ui/soundEvents.test.ts tests/ui/inspect.test.ts \
  tests/ui/crisisLog.test.ts tests/audio tests/assets; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Denkmal im Ziel-Chip und in der Chronik, Meldungen, Glocke und Aufflammen (M13-E2 T13)`.

## Bericht

Testnamen je AK, Rot-Zeile, Exit-Codes; Bestätigung `grep -rn "from '../sim\|from '../ui" src/audio` leer.
