# T03 · Träger: Tempo, Ankunfts-Verankerung, `tickClock(speed)` (P1)

Umsetzer `art-rendering-engineer` (derselbe, `SendMessage`) · ≈ 45 Tools · AK-T4 bis T9, V5, V6 (Teil), T8 (Teil) · blocked-by T01 · Spec: `docs/superpowers/specs/2026-10-22-leben-strasse-design.md`, P1 Regeln 3 bis 8; Designfrage 2 (R820: mitten auf dem Weg einblenden)

## Dateien

- ändern: `src/render/errands.ts`, `tests/render/errands.test.ts`, bei Bedarf `tests/render/errandsGraph.test.ts`
- nicht ändern: `drawErrandLoad` (T05), `renderer.ts` (T06), `src/sim/`

## Verhalten

1. `tickClock(world, timeMs, speed?)`: drittes Argument optional (0|1|2|4). `TickClock` bekommt `tickMs` (mit `speed` ≥ 1: nominal `TICK_MS / speed`; ohne: gemessen wie heute) und `speed` (Standard 1). `fast = speed === 4`, ohne `speed` bisherige Messung `FAST_TICK_MS`. `frac` und Pause-Verhalten (Bruchteil 1 im Stillstand) unverändert. `speed = 0`: `frac` 1, alle Posen stehen.
2. `errandPose` bekommt die Echtzeit-Verankerung (Spec P1 Regel 4): je Wegstrecke (Hin, Rück, Liefer) der Länge `L` und Zielphase `k_end` (Hinweg 0,30, Rückweg 0,70, Lieferweg 1,0): `τ = (k_end − k) · cycle · tickMs / 1000`, Weg `s = L − v · f · τ`, Figur sichtbar bei `s ≥ 0` und offenem Zyklusfenster (Fenster dehnbar: Lieferweg ab 0,40 bzw. 0,70 beim Sammler, Rückweg ab 0,40, Hinweg ab 0). `v` = `SPEED_CARRY` ohne Last (Hinweg), `SPEED_LOAD` mit Last; `f = paceFactor(clock.speed)`. Neue Signatur: `errandPose(world, b, p, g, clock?)` (ohne `clock`: `speed 1`, nominaler `tickMs`), damit Aufrufer und Tests schlank bleiben.
3. `ErrandPose` um `step` und `dir` erweitern (wie T02; `step` = zurückgelegte Weglänge `s` plus fester Offset je Betrieb aus `hash2`, damit nicht alle Träger im Gleichschritt gehen) und Ein-/Ausblenden nach Strecke: einblenden über die ersten 0,5 Kacheln der sichtbaren Strecke, ausblenden über die letzten 0,3 (ersetzt `FADE_PHASE`/`ramp`). Sichtbare Strecke < 0,5 Kachel → `null` (kein Aufblitzen). Arbeitsphase (Sammler steht am Sammelpunkt) bleibt stehend, Pose unverändert.
4. Ankunft (AK-T6): bei `p → 1` liegt die Figur am Ende des Lieferwegs (< 0,05 Kachel), Rückweg bei `p = 0,70` am Betrieb, Hinweg bei `p = 0,30` am Sammelpunkt, bei jedem Tempo. `errandsFrom` bleibt in der Signatur (Tempo steckt in `clock`), Ausdünnung `THIN_SHARE` greift über `clock.fast`, `errandCap`/`walkersLeft`/`MAX_ERRANDS` unberührt.
5. Pause: `errandsFrom` bei `speed 0` mit verschiedenem `timeMs` liefert identische Posen.

## Testfälle (rot zuerst)

- **T4** Betriebe mit Zyklus 20/40/60 Ticks und Weglängen 3/8/14 (Testwelt per Helfer der Bestandstests): Bildgeschwindigkeit auf dem sichtbaren Weg = `SPEED_CARRY`/`SPEED_LOAD` (± 1 %), unabhängig von Zyklus und Weglänge; Verhältnis zu `WALK_SPEED` bei 1× in 1,0 bis 1,3.
- **T5** bei 2× und 4×: `v·f` (± 1 %); sichtbare Strecke `min(L, v·f·T_Fenster)`, bei 4× kürzer als bei 1× für denselben Betrieb.
- **T6** Ankunft wie Regel 4, drei Tempi.
- **T7** Pause identisch (Träger); **T8** Welt-JSON vor/nach `errandsFrom`/`errandPose` gleich.
- **T9** Bestandstests für Obergrenzen/Ausdünnung grün; neu: Ausdünnung über `speed = 4` ausgelöst.
- **V5/V6 (Teil)** Δ`step` je Kachel = 1; `dir` folgt der Bewegung.
- Bestandstests mit Phasenfenster-Erwartungen (alte Fensterpositionen, `FADE_PHASE`): auf die neuen exakten Werte (aus `SPEED_*`, `paceFactor`, Weglänge, `tickMs`) ziehen, nicht lockern; Liste der geänderten Erwartungen mit Grund im Bericht.

## Prüfschritte / Task-Review

Gezielte Tests `errands errandsGraph`, `tsc`, eslint/prettier. Reviewer: Randfälle Weglänge < 0,5, 1-Kachel-Weg, kein Weg (`null` wie bisher); keine Sprünge beim Fensterwechsel; `tickClock` ohne `speed` verhält sich wie vor der Änderung; Render schreibt nie in die Welt.
