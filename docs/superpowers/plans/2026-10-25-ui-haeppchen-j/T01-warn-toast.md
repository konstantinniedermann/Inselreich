# T01 · P1 Warn-Toast 7 s (I-176)

Umsetzer `tech-ui-engineer` · ≈ 25 Tools · AK J1, J1b · blocked-by: T00 · Spec: Teil P1 (Regeln 1 bis 4)

## Dateien

- ändern: `src/ui/messages.ts` (`appendToast` ≈ Z. 138: feste `3000` ersetzen), `tests/ui/messages.test.ts` (Ergänzung)
- nicht ändern: `MAX_TOASTS`, `DEDUPE_MS`, `.messages`-CSS, `src/sim/`

## Verhalten

1. Typ `ToastKind = 'info' | 'error' | 'warn'` (aus der Signatur von `showMessage` ableiten, nicht doppelt schreiben); `export const TOAST_MS: Record<ToastKind, number> = { warn: 7000, info: 3000, error: 3000 }` und `export function toastLifetimeMs(kind: ToastKind): number`.
2. `appendToast` nutzt `toastLifetimeMs(kind)` statt `3000`; sticky bleibt ohne Zeitgeber. Prüfen, dass `kind` in `appendToast` verfügbar ist (sonst durchreichen, `replaceMessage` mitziehen).

## Testfälle (rot zuerst)

- AK-J1: `toastLifetimeMs('warn') === 7000`, `'info'` und `'error'` je 3000.
- AK-J1b (Auflage 1): Tabellentest `it.each` über **alle drei** Arten mit erwarteter Zahl; dazu ein Typ-Beleg, dass der Record alle `ToastKind` abdeckt (`Object.keys(TOAST_MS).sort()` gleich `['error','info','warn']`).
- Kein `setTimeout`/Fake-Timer-Test nötig; Ablauf und sticky prüft T04 im Browser (AK-J2).

## Prüfungen

`npx vitest run tests/ui/messages.test.ts; echo EXIT=$?` (vorher rot), `npx tsc --noEmit; echo EXIT=$?`, eslint und prettier auf berührte Dateien. Commit `feat: Warnmeldungen bleiben 7 s stehen (I-176)`.
