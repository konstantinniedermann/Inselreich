# T02 · Spaziergänger: `walkerAt` mit Gehuhr, `step`/`dir`, Pause (P1)

Umsetzer `art-rendering-engineer` (derselbe wie T01, `SendMessage`) · ≈ 35 Tools · AK-T3, T7 (Teil), T8 (Teil), V5 (Teil), V6 (Teil) · blocked-by T01 · Spec: `docs/superpowers/specs/2026-10-22-leben-strasse-design.md`, P1 Regeln 2, 7; P2 „Schritt aus der Strecke“, „Blickrichtung“

## Dateien

- ändern: `src/render/life.ts` (nur `WalkerPose`, `walkerAt`), `tests/render/life.test.ts`
- nicht ändern: `drawWalker`/Farben (T05), `renderer.ts` (T06), Möwen, Kamin, Glühen

## Verhalten

1. `walkerAt(g, i, walkMs, seed, stats?)`: der Parameter heisst `walkMs` (Gehuhr aus `pace.ts`); Logik und `WALK_SPEED = 1,2` unverändert, `FADE_MS`-Ausblenden läuft in `walkMs`. Kein `speed`-Parameter: das Tempo steckt in der Uhr.
2. `WalkerPose` wird um `step` (kumulierte Weglänge der Figur in Kacheln, stetig über die Episode: `e·EPISODE_SEGMENTS + k + frac`, ergibt Δ`step` = 1 je Kachel) und `dir: 1 | -1` (Vorzeichen von `dx` der Bildbewegung `project(nx,ny).x − project(cx,cy).x`; bei `dx = 0` die Richtung des vorigen Segments, am Episodenanfang +1) erweitert. Beim Stehen (Sackgasse `next = cur`) behält `dir` die letzte Richtung.
3. Pause: gleiche `walkMs` → identische Pose (Funktion bleibt rein).

## Testfälle (rot zuerst; Bestandstests nachziehen, nicht lockern)

- **T3** entlang einer Episode: Weg zwischen zwei Posen mit `Δ walkMs = dt·f` ist `1,2 · f · dt / 1000` (± 1 %) für f = 1, 1,6, 2,4, gerechnet über die Gehuhr aus T01; gleiche `walkMs` → identische Pose (Pause).
- **V5 (Teil)** Δ`step` je zurückgelegter Kachel = 1 (± 1 %), tempounabhängig (Δ`walkMs` mit f aus `paceFactor`); Pause: `step` bleibt.
- **V6 (Teil)** `dir` folgt dem Vorzeichen der projizierten Bewegung; Sackgasse behält letzte Richtung.
- **T8 (Teil)** `JSON.stringify(world)` vor/nach `walkerAt`, `walkClock` gleich.
- Bestehende Tests in `life.test.ts` (Episoden, Schrittgrenze 32, `FADE_MS`): Aufrufe auf den Parameternamen `walkMs` umstellen, Erwartungswerte unverändert; jede geänderte Erwartung im Bericht begründen.

## Prüfschritte / Task-Review

Gezielter Test `life`, `tsc`, eslint/prettier. Reviewer: `stats.steps` ≤ 32 je Aufruf bleibt (AK-R4-07); keine Allokation je Aufruf über die Pose hinaus; `step` stetig an Episodengrenzen innerhalb einer Episode.
