# H-U1 · Anbinden auf Knopfdruck — Kurz-Plan

Stufe leicht · Spec `docs/superpowers/specs/2026-10-05-h-u1-anbinden.md` · Branch `feat/h-u1-anbinden` ·
Worktree `.worktrees/h-u1` · Controller lead-tech · Kein Merge nach main (L0 bündelt REL-03).

## Architektur (≤ 15 Zeilen)

- `src/sim/roads.ts`: Prädikat `needsConnection(defId)` aus `recomputeConnectivity` herausziehen (verhaltensgleich).
- `src/sim/connect.ts` (neu): `connectPath(world, id)` — reine 0-1-Breitensuche (Deque, `Int32Array`) über
  freie Kacheln (Kosten 1) und vorhandene Wege (Kosten 0), Start = `adjacentOf` des Grundrisses, Ziel = Kachel in
  `reachableRoads` oder 4er-angrenzend am Kontor; liefert die neuen Kacheln in Pfadreihenfolge.
  `connectBuilding(world, id)` — Pfad, `checkAfford(n × ROAD_COST_OBJ)`, dann `placeRoad` je Kachel; ganz oder gar nicht.
- `src/ui/connect.ts` (neu, rein): `connectView(world, b)` → `{ label, ok, reason, tiles } | null`.
- `src/ui/inspect.ts`: Knopf `data-field="connect"` + Grundzeile `connect-reason`; neue `InspectActions.connect(id)`
  und `previewConnect(tiles | null)`; `updateInspect` setzt Label/Zustand.
- `src/ui/app.ts`: Aktion verdrahten (Ton `road`, `reportConnections`, `showError` bei Grund), Vorschau-Zustand
  halten, nach `render(...)` `drawPathPreview(ctx, cam, tiles)` aufrufen.
- `src/render/pathPreview.ts` (neu): Rauten der Pfadkacheln; `renderer.ts` bleibt unberührt (gehört lead-art).

## Datei-Ownership

| Task      | Dateien                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T1        | `src/sim/roads.ts`, `src/sim/connect.ts`, `tests/sim/connect.test.ts`                                                                                                                                  |
| T2        | `src/ui/connect.ts`, `src/ui/inspect.ts`, `src/ui/app.ts`, `src/style.css` (nur falls nötig), `src/render/pathPreview.ts`, `tests/ui/connect.test.ts`, `tests/render/pathPreview.test.ts`, `README.md` |
| lead-tech | Spec, dieser Plan, `docs/arc42.md` (Modulzeilen), `.studio/handoffs/H-U1-*.md`                                                                                                                         |

## Tasks

| Task | Titel                       | AK-IDs        | Strang | blocked-by | Modell | Review                                     |
| ---- | --------------------------- | ------------- | ------ | ---------- | ------ | ------------------------------------------ |
| T1   | Sim: Wegsuche und Aktion    | AK-01 … AK-07 | h-u1   | —          | sonnet | qa-code-reviewer sonnet                    |
| T2   | UI: Knopf, Vorschau, README | AK-08 … AK-12 | h-u1   | T1         | sonnet | Final-Review opus (Branch) + qa-playtester |

Je Task Test zuerst rot, dann grün; `make check` und `CI=true make check` grün.

## Budget (Stufe leicht)

Starts: T1-Umsetzer, T1-Review, T2-Umsetzer, Final-Review (opus), Playtester = 5 von 6; 1 Reserve.
Fix-Runden per SendMessage (zählen nicht). Parallelität 1, seriell wegen `blocked-by`.
