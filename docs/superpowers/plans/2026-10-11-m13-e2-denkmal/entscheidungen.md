# M13-E2 · Review Focus, Entscheidungen, Risiken

Gehört zum [Index](../2026-10-11-m13-e2-denkmal.md).

## Review Focus

1. Ohne Denkmal bitgleich: Baseline-Befehl (T17 Punkt 2), `tickMonument` mit `monument === null` tut nichts, `monument` letzter Schlüssel in `BUILDING_DEFS`, kein RNG (T01, T05, T07).
2. Reserve ganzzahlig (`Σ inhabitants × round(needs × 1000)`, Aufrundungsdivision), 61 → 49, 80 → 64 (T04).
3. Ein Zukaufweg `buyMonumentUnit`: Preis `buyPrice(w, g, 1)` vor dem Zug, nie ins Minus, Lager und `sellPct` unberührt (T04, T05).
4. `foldBackToV11` entfernt ohne Umordnen; `foldBackToV10`/`V9` ketten bei `version 12`; kein Pin geändert (T02).
5. Render: jede Aufrufstelle von `bodyHeight`/`bodyHull`/`spriteBounds`/`spriteKey` mit Welt reicht die Stufe durch; übrige Gebäude bitgleich (T09).
6. Zwei-Klick nur für das Denkmal mit Fortschritt; alle anderen Gebäude per `Entf` sofort (R483, T11).

## Entscheidungen für das Gate Plan

**Stand R507:** E1, E2, E4, E5, E6 angenommen; **E3 geändert** (Glocke als T19 im ART-Strang); E7 durch R505
ausgedehnt; E8 angenommen mit `lead-qa`-Review des Nachtrag-Wortlauts vor dem Start von I-049 und Verweiszeile im
I-049-Plan.

- **E1 Task-Schnitt:** Def-Kern mit Freischaltung (T01), Save atomar (T02), dann Regeln in drei Tasks; ART-Maler sofort ab Gate Plan in neuer Datei (kein Konflikt mit T01-Platzhaltern in `sprites.ts`).
- **E2 Ziel-Chip ohne `GoalView`-Umbau:** `goalTexts(view, chip)` mit `chip` aus `monumentView.ts`; `src/sim/queries.ts` bleibt unberührt (Hot Spot I-049 T02). Spec U-8 lässt das offen [Tech].
- **E3 (ursprünglich, durch R507 ersetzt) Klang im UI-Strang:** neues `SoundEvent` `'monumentDone'` (Sample `bell.mp3`) in `src/audio/sound.ts`/`manifest.ts` durch `tech-ui-engineer` in T13; kein neues Asset, `src/audio/` importiert weiter nichts aus `src/sim/`/`src/ui/`.
- **E4 ART-Controller `lead-art`** mit `art-rendering-engineer`; Budget 5 aus dieser Freigabe.
- **E5 Zwei Browser-Läufe** (T15 nach T12 inkl. ART, T16 nach T13/T14) statt je UI-Task; jede sichtbare Änderung wird genau einmal geprüft, gebündelt wegen gemeinsamer Szenario-Stände (nicht zur Budgetersparnis).
- **E6 E1-Berichtigungen (Spec §11, Anhang 08 F):** Code- und Testseite erledigt T02 (AK-M13E1-01, -26, -41 mechanisch; AK-M13E1-14 setzt `money = 600` bereits). Die Spec M13-E1 erhält in T14 nur Verweiszeilen bei AK-M13E1-14 und -36 auf Anhang 08 F; Alternative: `lead-design` pflegt sie selbst.
- **E7 Release-Sperre:** entschieden und ausgedehnt durch **R505** (siehe Merge-Reihenfolge und Save-Regel): kein
  Release von `main` (kein Push nach `origin` mit Spieländerung; lokale Merges nach `main` und spielfremde Pushes erlaubt), bis M13-E2, I-049 und I-048 gemergt sind; damit ist auch das Denkmal mit Platzhalter-Bild
  zwischen SIM- und UI-Merge nie auf Pages.
- **E8 Nachtrag Plan I-049** (tech B5): Wortlaut in [nachtrag-i049.md](2026-10-11-m13-e2-denkmal/nachtrag-i049.md); der I-049-Controller arbeitet ihn vor T01 ein (wie R481 B2–B9), weil dieser Plan fremde Pläne nicht ändert.

## Risiken

1. **Fächer der neuen Id (T01):** unbekannte Tests über alle Ids werden rot; Gegenmittel: Lauf über die Fächerliste in T01, nur Platzhalter in erlaubten Dateien, jede Zusatzdatei im Ledger.
2. **Render-Durchreichen (T09):** ≈ 46 Aufrufstellen; vergessene Stelle schneidet die Spitze ab oder macht sie unpickbar → Renderer-Test «Stufe 4 knapp unter dem Bildrand» (A2) und Picking-Test der Spitze.
3. **Lauf C an der Spanne (T07):** Pflicht-Rulingpunkt; Plan läuft ohne T07-Merge nicht weiter (SIM-Gate wartet).
4. **Save-Hot-Spot mit I-049/I-048:** `save.ts`, `types.ts`, `world.ts`, `helpers.ts`; geregelt über die gemeinsame v12 und die Merge-Reihenfolge (R505). Der UI-Strang holt I-049-Sim vor T18 über `git merge main`.
5. **Doku-Hot-Spot:** README/arc42 teilen sich M13-E2 (T14), I-049 (T07), I-048, UI-NAECHSTER-SCHRITT (R502) und TOOL-BUENDEL-6; T14 holt vorher `main` per Merge.
6. **Laufzeit `balance-monument.test.ts`:** Phase 1/2 einmal je Datei; Zeitreserve-Regel 50 % (Anhang 03 A), sonst Datei teilen.
