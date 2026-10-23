# T04 · `walkerLook.ts`: Farbsätze, Variation, Luminanz (P2, Strang 2)

Umsetzer `art-rendering-engineer` (eigener Start) · ≈ 35 Tools · AK-V8, AK-V9 · Strang 2 (`.worktrees/leben-strasse-look`, ab `plan/leben-strasse`) · läuft parallel zu T01 bis T03 · Spec: `docs/superpowers/specs/2026-10-22-leben-strasse-design.md`, P2 „Gestaltung“

## Dateien

- neu: `src/render/walkerLook.ts`, `tests/render/walkerLook.test.ts`
- nicht ändern: `life.ts` (die alte `CLOTHES`/`clothesOf` bleibt bis T05 bestehen und wird dort ersetzt)

## Verhalten

1. Reine Farbsätze aus `PALETTE` (Mischung nur über `mixHex`/vorhandene Helfer, nie mit `#000000`/`#ffffff`, Tonstufen zum kühlen Schattenton `waterDeep`/`rockDark` und warmen Lichtton `sandDry`): `CLOTHES_WALK` (6 Töne aus `roofSlate`, `roofTerracotta`, `grassDark`, `roofThatch`, `roofCopper`, `wallStone`), `CLOTHES_WORK` (3 Töne `roofWood`, `earth`, `roofSlate`; **disjunkt** zu `CLOTHES_WALK`: Tonstufen so wählen, dass keine Farbe gleich ist, auch wenn `roofSlate` in beiden Quellen steht), `SKIN` (3), `HAIR` (2), `HEADGEAR_WORK` (dunkles Tuch/Hut).
2. `figureLook(seed, id, kind: 'walk' | 'work')` → `{ torsoLight, torsoDark, skin, hair, headgear | null, legs }`, deterministisch aus `hash2(seed, id)` (Ids der Träger ab `ERRAND_ID_BASE`, Konstante nicht aus `errands.ts` importieren, sondern als Parameter `kind` lösen, um Importzyklen zu vermeiden). Je Figur eine Rumpf-Tonstufe hell/dunkel (Licht links oben nach `LIGHT`).
3. **Mess-Schritt AK-V8:** Relative Luminanz (sRGB, WCAG-Formel) jedes `torsoLight`/`torsoDark` gegen die Wegfarbe der Strassenkachel (Farbe aus dem Terrain-/Strassenzeichner; Fundstelle per `rg "road" src/render` nennen). Zuerst als Wegwerf-Test, der die Werte ausgibt; Ausgabe im Bericht. Daraus `MIN_TORSO_CONTRAST` = auf zwei Stellen abgerundeter kleinster gemessener Kontrast (Luminanzdifferenz oder Kontrastverhältnis, die Formel steht im Kommentar); Konstante exportiert und im Test festgeschrieben. Liegt eine Farbe darunter, wird die Tonstufe angepasst (nicht der Mindestwert gesenkt), bis alle erfüllen.

## Testfälle (rot zuerst)

- **V8** alle Figurenfarben entstehen aus `PALETTE` (Test wie die S1-Prüfung des Stilrahmens: keine Komponente identisch `#000000`/`#ffffff`, Mischung mit Schwarz/Weiss erkannt über Abstand zu Mischkandidaten); Kontrast Rumpf gegen Wegfarbe ≥ `MIN_TORSO_CONTRAST`; `CLOTHES_WALK` ∩ `CLOTHES_WORK` = ∅.
- **V9** gleiche `(seed,id)` → bitgleiche Farben; über 40 Ids alle 3 Hauttöne, 2 Haarfarben, ≥ 5 der 6 Kleidertöne.

## Prüfschritte / Task-Review

Gezielter Test `walkerLook`, `tsc`, eslint/prettier. Reviewer: nur Farben, kein Zeichnen, keine Allokation je Aufruf ausser dem Rückgabeobjekt (oder konstante Tabellen mit Index, bevorzugt).
