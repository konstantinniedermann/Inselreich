# M4 Persistenz & Feinschliff — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spielstand speichern/laden/neu starten, saubere Fehlerbehandlung, ein Balancing-Durchlauf gegen das Erfolgskriterium der Spec (50 Bürger in einer Sitzung), arc42-Dokumentation, Deploy-Workflow für GitHub Pages.

**Architecture:** `save.ts` serialisiert das `World`-Objekt mit Versionsfeld und validiert beim Laden strukturell; UI-Schicht kapselt `localStorage`. Zeitkonstanten wandern nach `defs/timing.ts`. Ein Balancing-Test fährt eine skriptgesteuerte Kolonie bis 50 Bürger und pinnt die Tick-Zahl als obere Schranke.

**Tech Stack:** wie bisher. Keine neuen Abhängigkeiten. GitHub Pages via `actions/deploy-pages`.

**Spec:** `docs/superpowers/specs/2026-09-29-inselreich-design.md` (3.5, 3.7, 4 save/smoke, 5.4, 6) · GitHub-Issue #4

## Global Constraints

- Keine Laufzeit-Abhängigkeiten; `src/sim/**` DOM-frei (kein `localStorage` dort — Persistenz-Adapter liegt in `src/ui/`).
- Spielstand = `JSON.stringify(world)`; `deserialize` prüft `version === 1`, `width/height` = 64, `tiles.length === width*height`, `buildings` enthält `kontorId`, `stock` hat alle `GOOD_IDS`, `money` ist Zahl; sonst `{ ok: false, reason }` — nie `throw`.
- Nach dem Laden: `recomputeConnectivity(world)` (persistiertes `connected` nicht blind übernehmen).
- `localStorage`-Schlüssel `inselreich.save.v1`; Buttons Speichern / Laden / Neu (Neu fragt per `confirm`-freiem Zweischritt: Button wird zu „Wirklich neu?" für 3 s).
- Zeitkonstanten in `src/sim/defs/timing.ts`: `TICK_MS = 100`, `UPKEEP_INTERVAL = 100`, `GROWTH_INTERVAL = 50`, `UPGRADE_WAIT = 300`; alte Exporte bleiben als Re-Export erhalten.
- Balancing-Ziel (Spec 1): skriptgesteuerte Kolonie erreicht 50 Bürger in ≤ 9000 Ticks (= 15 Min bei 1×, ~4 Min bei 4×). Werte dürfen nur in `src/sim/defs/` angepasst werden; jede Änderung mit Begründung im Bericht.
- Doku nach arc42 in `docs/arc42.md` mit Mermaid-Diagrammen (keine `\n` in Node-Labels).
- UI-Sprache Deutsch (CH, kein ß).

## Review Focus

1. **Kaputter/fremder Spielstand im localStorage:** Laden meldet Fehler, Spiel läuft unverändert weiter, nichts wird überschrieben. (Test Task 1)
2. **Laden nach Wegänderung:** `connected` wird neu berechnet; ein Spielstand mit manipuliertem `connected: true` ohne Weg zeigt nach Laden `notConnected`. (Test Task 1)
3. **Neu-Start räumt auf:** alter Loop, Listener und ResizeObserver werden beendet (dispose), keine doppelten Ticks. (manuell + Zähler-Test in app: `startGame` liefert `dispose()`)
4. **Sieg bleibt nach Laden:** `won: true` wird geladen, Banner erscheint nicht erneut. (Test Task 1 + manuell)
5. **Balancing-Schranke:** Balancing-Test schlägt fehl, wenn 50 Bürger nach 9000 Ticks nicht erreicht sind. (Test Task 3)

---

### Task 1: save.ts, timing.ts, Persistenz-Adapter und Buttons

**Files:**

- Create: `src/sim/save.ts`, `src/sim/defs/timing.ts`, `src/ui/storage.ts`
- Modify: `src/sim/economy.ts`, `src/sim/population.ts`, `src/ui/app.ts` (Buttons, `dispose()`), `src/ui/hud.ts`
- Test: `tests/sim/save.test.ts`

**Interfaces:**

```ts
// save.ts
export const SAVE_VERSION = 1;
export function serialize(world: World): string;
export function deserialize(
  json: string,
): { ok: true; world: World } | { ok: false; reason: string }; // Gründe: 'Ungültiges Format', 'Unbekannte Version', 'Beschädigter Spielstand'
// storage.ts (ui)
export const SAVE_KEY = 'inselreich.save.v1';
export function saveToStorage(world: World): Result; // 'Speichern fehlgeschlagen' bei QuotaExceeded etc.
export function loadFromStorage(): { ok: true; world: World } | { ok: false; reason: string }; // 'Kein Spielstand vorhanden' | deserialize-Grund
// app.ts
export function startGame(root: HTMLElement, world?: World): GameState & { dispose(): void };
```

- [ ] Tests: Round-trip identisch (`deepEqual`), Version-Mismatch, JSON-Müll, fehlende Felder, manipuliertes `connected` → nach `deserialize` + recompute `notConnected`, `won` bleibt.
- [ ] Buttons im HUD: Speichern → Toast „Gespeichert", Laden → `dispose()` + `startGame(root, world)`, Neu → Zweischritt, dann neue Welt mit neuem Seed.
- [ ] Commit `feat: Spielstand speichern, laden und neu starten`

### Task 2: Fehlerbehandlung und Meldungen vervollständigen

- `startGame` fängt Fehler aus `createWorld` ab (sticky Toast, kein leerer Bildschirm).
- Toast-Stapel begrenzen (max. 3 sichtbar, älteste fällt raus); identische Meldung innerhalb 1 s nicht doppelt.
- Weg-Drag: Geld-Toast-Flag bei jeder nicht-draggenden Aktion zurücksetzen (Rest aus M2-Review).
- Siegbanner nur einmal pro Welt (`world.won` als Quelle, kein zweites Banner nach Laden).
- Commit `fix: Fehlerbehandlung beim Start, Toast-Begrenzung, Siegbanner einmalig`

### Task 3: Balancing-Durchlauf

- `tests/sim/balance.test.ts`: skriptgesteuerte Kolonie (Helper `buildColony(w)`), die in Phasen ausbaut (Nahrung → Kapelle → Stoffkette → Rumkette → Schule, Häuser nachziehen), Handel für Werkzeug/Holz nutzt; Assertion: `citizens(w) >= 50` bei `tick <= 9000`, `money > 0` am Ende.
- Falls nicht erreichbar: Werte in `defs/` anpassen (Kandidaten: Steuersätze, Unterhalt, Zyklen, Startgeld) — jede Änderung mit Zahl vorher/nachher im Bericht; Spec-Tabellen in Abschnitt 2.3/2.4/2.7 nachführen (docs-Commit).
- Commit `test: Balancing-Durchlauf bis 50 Bürger` (+ ggf. `feat: Balancing …`)

### Task 4: arc42-Doku, README, Deploy-Workflow

- `docs/arc42.md`: 1 Einführung/Ziele, 2 Randbedingungen, 3 Kontext, 4 Lösungsstrategie, 5 Bausteinsicht (Mermaid: sim/render/ui), 6 Laufzeitsicht (Tick-Sequenz als Mermaid-Sequenzdiagramm), 8 Konzepte (Zustände, Anbindung, Persistenz), 9 Entscheidungen (Verweise ADR-001…005), 11 Risiken, 12 Glossar. `docs/index.md` als Einstieg.
- README: Spielanleitung komplett (Ziel, Stufen, Ketten, Handel, Speichern), Hinweis auf Pages-URL (Platzhalter bis Repo öffentlich).
- `.github/workflows/pages.yml`: bei Push auf `main` build mit `base: '/anno-clone/'` (vite `--base`), Upload `dist`, `deploy-pages`. Workflow wird committet, aber greift erst, wenn Pages im Repo aktiviert ist (Free-Plan: öffentliches Repo nötig — Nutzerentscheid, siehe Spec 6).
- Projekt-`CLAUDE.md` Scopes/Doku-Verweise aktualisieren; `docs/beobachtungen.md` durchsehen, Erledigtes streichen.
- Commit `docs: arc42, Spielanleitung, Pages-Workflow`

## Self-Review (durchgeführt)

- Spec-Abdeckung: 3.5 (Task 2), 3.7 (Task 1), 4 save (Task 1), 5.4 komplett (Tasks 1–4), 6 Pages-Entscheid dokumentiert (Task 4).
- Review Focus 1–5 durch Tests in Task 1, 3 und manuelle Prüfung (3) abgedeckt.
