# T01 Helfer in `crisisLog.ts` (AK-1, AK-2, AK-3, AK-4)

Persona `tech-sim-engineer` (DOM-freie Helfer; alternativ `tech-ui-engineer`), Modell sonnet, Worktree `.worktrees/i100-impl`. Schätzung ~25 Tools.
Dateien (nur diese): `src/ui/crisisLog.ts`, `tests/ui/crisisLog.test.ts`. Spec Regeln 1, 2, 4.

## Schritte

- [ ] **1. Tests zuerst** in `tests/ui/crisisLog.test.ts` (neuer `describe('Neu-Zähler (I-100)')`, Imports `isNotable`, `nextUnread`, `unreadLabel`). Rot belegen: `npx vitest run tests/ui/crisisLog.test.ts; echo EXIT=$?` = 1 (Import fehlt).
  - AK-1 `isNotable`: Einträge aus `run()` auf `krise-brand` (Brand `warn`), Brand gelöscht (`krise-brand-geschuetzt` oder literal `info`), Sturmwarnung, Boom, literal `{text, toast: null, tick, tag: 'monument-done'}` → true; «Sturm vorüber», «… wieder in Betrieb», «Brand ohne Schaden», «Sturm hat begonnen» (alle `toast: null`, kein `tag`) → false.
  - AK-2 `nextUnread(0, [Brand, Warnung], false) === 2`; `expanded = true` → Eingabewert bleibt (auch bei 5 → 5); nur stille Einträge → unverändert; mehrere Einträge in einem Aufruf zählen alle.
  - AK-3 `krise-brand` über `run(w, 205)`: eingeklappt fortlaufend `nextUnread` je Tick-Gruppe angewandt → 1 nach dem Brandeintrag (die stillen «wieder in Betrieb» ändern ihn nicht).
  - AK-4 `unreadLabel`: 0 → `''`, 3 → ` (3 neu)`, 9 → ` (9 neu)`, 10 und 25 → ` (9+ neu)`.
- [ ] **2. Umsetzen:** `isNotable(e) = e.toast !== null || e.tag !== undefined`; `nextUnread(unread, added, expanded) = expanded ? unread : unread + added.filter(isNotable).length`; `unreadLabel(n)`: `n <= 0 ? '' : n >= 10 ? ' (9+ neu)' : \` (${n} neu)\``. Zähler selbst nicht deckeln (Deckel nur in der Anzeige).
- [ ] **3. Prüfen:** Testdatei grün (`EXIT=0`), `npx tsc --noEmit`, Lint, jeweils mit `echo EXIT=$?`. Commit `feat: Neu-Zähler Helfer (I-100)`.
- [ ] **4. Review** durch `qa-code-reviewer` (Spec-Konformität AK-1…4, Qualität), Fix-Runden im selben Baum bis OK.
