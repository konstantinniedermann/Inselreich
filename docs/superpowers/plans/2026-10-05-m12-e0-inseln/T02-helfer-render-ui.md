> **Task-ID:** T02 · **AK-IDs:** keine neuen; Vorbedingung AK-E0-20 (`tests/render/`, `tests/ui/` grün)
> **blocked-by:** T01 · **Strang:** `feat/m12-e0`, Worktree `.worktrees/m12-e0` · `tech-ui-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints, Entscheide P-1, P-2 · Spec §4.1 (keine sichtbare Änderung), §4.8

## T02: Mechanische Umstellung in `src/render`, `src/ui`, `tools/render-qa/perf.mjs` und deren Tests (Form bleibt v6)

**Ziel:** Darstellung und Bedienung lesen Raster, Lager und Kontor nur noch über `home(world)` bzw.
`islandOf(world, b)`. In E0 zeigt alles die Heimat. **Kein Pixel, kein Text, kein Ablauf ändert sich.**

**Code-Fakten (Basis, Treffer der Zugriffs-Suche):** `src/render` ≈ 86 (`terrain.ts` 14, `massif.ts` 13,
`errands.ts` 7, `renderer.ts` 6, `water.ts` 5, `iso.ts` 5, `terrainField.ts` 4, `ship.ts` 3, Rest je 1–2), dazu 6
Destrukturierungen `const { width: w, height: h } = world` (`terrainField.ts:40`, `life.ts:44`, `water.ts:52/152/188`,
`terrain.ts:934`; bei `seed` bleibt `world.seed`); `src/ui` ≈ 55 (`hints.ts` 11, `app.ts` 8, `input.ts` 5,
`hover.ts` 5, `trade.ts` 4, `hud.ts` 3, Rest je 1–2); `tools/render-qa/perf.mjs:50–62` liest `w.tiles`, `w.width`,
`w.height`; `tests/render` ≈ 276, `tests/ui` ≈ 111. Die Helfer-API steht seit T01 in `src/sim/world.ts` und
`src/sim/economy.ts` (Signaturen dort lesen, nicht ändern).

**Dateien:** Zugriffsstellen in `src/render/**`, `src/ui/**`, `tools/render-qa/perf.mjs`, `tests/render/**`,
`tests/ui/**`. **Nicht:** `src/sim/**` (Meldung an den Controller, falls dort etwas fehlt), `src/audio/**`,
Darstellungslogik, Konstanten.

## Schritte

- [ ] **0 Basis:** H-U1 ist seit T01 im Baum (R229); der Controller hat `main` gemerged, falls dort neue REL-03-Commits liegen; neue Dateien aus
      diesen Branches (z. B. `src/render/dunes.ts`, `src/ui/connect.ts`, `src/render/pathPreview.ts`) gehören mit zur
      Umstellung. Ledger-SHA = `HEAD`.
- [ ] **1 Test zuerst:** in `tests/render/` ein Wächtertest `PLAN-W1 src/render und src/ui lesen Raster und Lager nur
über Insel-Helfer`: liest alle `.ts` unter `src/render` und `src/ui` (Muster `tests/sim/imports.test.ts`,
      `readdirSync`/`readFileSync`) und verlangt, dass kein Treffer für
      `/\b(world|w|state\.world)\.(tiles|stock|kontorId)\b/` und keine Destrukturierung von `width`/`height`/`tiles`
      aus der Welt vorkommt. Rot-Beleg (Trefferliste) → Commit `test: M12 E0 Wächter Render/UI (rot)`.
- [ ] **2 `src/render` umstellen:** `world.tiles` → `home(world).tiles`, `world.width/height` → `home(world).width/
height`, Destrukturierungen aus `home(world)`; Helferaufrufe `tileAt(world, …)` → `tileAt(home(world), …)`. Wo
      eine Funktion pro Frame viele Zugriffe hat, einmal `const isl = home(world)` am Funktionsanfang (gleiche Werte,
      keine neue Allokation). Canvas-Grössen (`canvas.width` usw.) nicht anfassen.
- [ ] **3 `src/ui` umstellen:** Lagerleiste, Handel, Auftrag, Hinweise lesen `home(world).stock`; Kontor über
      `home(world).kontorId`. Aufrufe von `checkAfford`/`addStock` usw. mit `home(world)` nach der neuen Signatur.
- [ ] **4 `tools/render-qa/perf.mjs`:** `home` aus `/src/sim/world.ts` importieren (wie die übrigen dynamischen Importe
      der Seite) und `w.tiles`/`w.width`/`w.height` über `home(w)` lesen. Smoke: `node tools/render-qa/perf.mjs --help`
      bzw. ein kurzer Lauf, falls ohne Argument möglich; sonst im Ledger „nicht ausgeführt, nur Syntax"
      (`node --check`). T06 führt die Sonde einmal aus.
- [ ] **5 Tests umstellen** (`tests/render`, `tests/ui`): gleiche Regeln; Einmal-Skript im Scratchpad erlaubt, nicht
      einchecken. `tests/render/fakeCtx.ts` unverändert.
- [ ] **6 Prüfen:** `make check` und `CI=true make check` grün; Wächter grün; `git diff --stat T01-SHA -- src/sim`
      leer. Commit `refactor: M12 E0 Zugriffshelfer in Render, UI und perf.mjs`.

**Review-Fokus:** reiner Zugriffstausch (kein geänderter Rechenweg, keine geänderte Zeichenreihenfolge); keine
Datei in `src/sim`; Destrukturierungen vollständig; `perf.mjs` lädt `home` im Browser-Kontext. Ein Browser-Check
folgt gesammelt in T06 (AK-E0-20), nicht hier.
