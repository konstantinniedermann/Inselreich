# T02 Verdrahtung: Knopf, `app.ts`, CSS (AK-7; Grundlage für AK-5/6)

Persona `tech-ui-engineer`, Modell sonnet, blocked-by T01. Schätzung ~30 Tools.
Dateien (nur diese): `src/ui/eventLogView.ts`, `src/ui/app.ts` (nur `AppState`/Initialwert Z. ~206/310, Aufruf `renderEventLog` Z. ~371, `updateEventLog` Z. ~886, die zwei `pushLog`-Stellen Z. ~1557/~1566), `src/style.css` (eigener Block `.btn--unread`), optional `tests/ui/eventLogView.test.ts`. Spec Regeln 2–5.

## Schritte

- [ ] **1. Test zuerst** (nur wenn die Testumgebung ein DOM bietet; per `grep -l "environment" vitest.config.* tests/ui/*.ts` prüfen, sonst Schritt entfällt und AK-5/6 trägt T03): `tests/ui/eventLogView.test.ts` mit `renderEventLog` + `updateEventLog(..., unread)`: Knopftext `Ereignisse ▸ (3 neu)` bei 3 eingeklappt, `Ereignisse ▸` bei 0, aufgeklappt `Ereignisse ▾` ohne Zähler, `aria-label` «3 neue Ereignisse» (bei 12: «12 neue Ereignisse»), Klasse `btn--unread` nur bei > 0, Knopftext ändert sich auch bei **unveränderter** Einträge-Liste (Key-Cache). Klick auf Aufklappen ruft `onExpand` einmal. Rot belegen (`EXIT=1`).
- [ ] **2. `eventLogView.ts`:** `renderEventLog(box, onExpand?)`; `isEventLogExpanded(box)` (Liste ohne `event-log--collapsed`); `updateEventLog` bekommt als letzten Parameter `unread = 0` und aktualisiert Knopftext (`'Ereignisse ▸' + unreadLabel(unread)`), `aria-label` und `btn--unread` **vor** dem `dataset.key`-Early-Return; der Klick-Handler ruft beim Aufklappen `onExpand`, danach `sync()` ohne Zähler (aufgeklappt nie ein Zähler). `sync()` und Zählertext teilen einen Pfad, kein zweiter Textbau.
- [ ] **3. `app.ts`:** `logUnread: number` in `AppState` (Initialwert 0); an beiden `pushLog`-Stellen `state.logUnread = nextUnread(state.logUnread, <entries>, isEventLogExpanded(logBox))`; `renderEventLog(logBox, () => { state.logUnread = 0; })`; `updateEventLog(..., state.logUnread)`. **Kein** Reset-Code beim Laden/Neue Insel (frische Closure, Z. ~417); `logUnread` nicht in `serialize`/Save (AK-7: Test oder `grep` belegt, dass `src/sim/save.ts` unberührt ist).
- [ ] **4. CSS:** `.btn--unread` nur Farbe (vorhandene Variablen, kein Blinken, kein neuer Spielwert); Desktop-first.
- [ ] **5. Prüfen:** neue/betroffene Tests grün, `npx tsc --noEmit`, Lint, `make check`, alle mit `echo EXIT=$?`; Balancing-Test unberührt. Commit `feat: Neu-Zähler am Ereignis-Log (I-100)`.
- [ ] **6. Review** durch `qa-code-reviewer`, Fix-Runden bis OK.
