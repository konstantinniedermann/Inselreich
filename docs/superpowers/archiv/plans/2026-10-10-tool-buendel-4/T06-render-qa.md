# T06 · render-qa: Audio-Warnung filtern, Kamera-Ruhe abwarten

Strang `tool` · Worktree `.worktrees/b4` · Branch `tool/b4` · Umsetzer B `tech-ui-engineer` (sonnet) · AK-TB4-13, AK-TB4-14 · blocked-by T05 (Reihenfolge) · Grundlage Beobachtung «REL-16 (R454): render-qa-Werkzeug» · Grösse S (≈ 15 Tools)

**Files:**

- Modify: `tools/render-qa/sitzung.mjs` (Konsolenfilter Z. ≈ 94–110), `tools/render-qa/lib.mjs` (neuer reiner Helfer), die Stellen, die `tileCenter` nach `centerOn` lesen: `altwald.mjs` Z. ≈ 60, `smoke.mjs` Z. ≈ 175, `sitzung.mjs`
- Test: `tests/tools/renderqa.test.ts` (vorhanden; erst Kopf und die Tests zu `lib.mjs` lesen)
- Nicht ändern: `src/`, `perf*.mjs`, `hitch.mjs`

## Teil 1 · Konsolenfilter (AK-TB4-13)

Headless-Chrome meldet je Grösse 15-mal «AudioContext was not allowed to start» (Warnung aus `src/audio/`). Reiner Helfer in `lib.mjs`: `export function istErwarteteWarnung(text) { return /AudioContext was not allowed to start/.test(text); }`.

- [ ] Test zuerst (rot): `istErwarteteWarnung("The AudioContext was not allowed to start. It must be resumed…") === true`; `istErwarteteWarnung("Uncaught TypeError: x") === false`; `istErwarteteWarnung("")` false.
- [ ] In `sitzung.mjs` beide Pfade (`Runtime.consoleAPICalled` und `Log.entryAdded`) rufen den Helfer vor dem Sammeln auf und überspringen die Zeile. Fehler (`error`) werden **nie** gefiltert, nur Level `warning` mit diesem Text.

## Teil 2 · Kamera-Ruhe (AK-TB4-14)

`tileCenter` nach `centerOn` schwankt zwischen Läufen (Y 349,8 oder 370,8); nach 1,5 s ist die Kamera evtl. noch nicht ruhig.

- [ ] Reiner Helfer in `lib.mjs`: `export async function warteBisRuhig(lies, { gleich = 3, abstandMs = 100, maxMs = 3000, schlaf = (ms) => new Promise((r) => setTimeout(r, ms)) })` — ruft `lies()` (liefert JSON-fähigen Wert) im Abstand, kehrt zurück, sobald `gleich` aufeinanderfolgende Lesungen per `JSON.stringify` gleich sind, sonst nach `maxMs` mit der letzten Lesung und `ruhig: false`. Rückgabe `{ wert, ruhig }`.
- [ ] Test zuerst (rot), mit Fake-`schlaf` (kein echtes Warten): (a) Folge A,B,B,B,B → `ruhig: true`, `wert: B`; (b) immer wechselnd → `ruhig: false` nach `maxMs / abstandMs` Lesungen; (c) sofort stabil → genau `gleich` Lesungen.
- [ ] Die Stellen mit festem Warten (`setTimeout 1500` o. Ä. vor `tileCenter`, per `grep -n "tileCenter" tools/render-qa/*.mjs` finden) auf `warteBisRuhig(() => lies tileCenter)` umstellen; ist die Kamera nicht ruhig, eine Zeile Warnung `[render-qa] Kamera nicht ruhig` ausgeben statt abzubrechen. Nur die Stellen, die `centerOn` und danach `tileCenter` nutzen; Bildaufnahmen bleiben unverändert.
- [ ] `npx vitest run tests/tools/renderqa.test.ts` (gezielter Einzeldatei-Lauf, R465 B1; nicht während eines Push-Gates), `make lint` Exit 0. Browser-Lauf nicht nötig: Helfer sind rein; der Bericht listet die `grep -n "centerOn\|tileCenter" tools/render-qa/*.mjs`-Ausgabe und je Paar «umgestellt» oder «Grund»; das Final-Review prüft die Liste.
- [ ] `git add tools/render-qa tests/tools/renderqa.test.ts && git commit -m "fix: render-qa filtert Audio-Warnung und wartet auf ruhige Kamera"`
