# T02 · Fahrzeit-Format der Inselkarte, `FAR_TRAVEL_TIP`-Test (Befund 3, 4)

Umsetzer `tech-ui-engineer` (Fortsetzung T01) · ≈ 20 Tools · AK BF6, BF7 · blocked-by: T01 · Spec: Regeln 4, 5

## Dateien

- ändern: `src/ui/islandCard.ts`, `tests/ui/islandCard.test.ts` (Zeilen ≈ 12, 15, 17, 31, 38), `tests/ui/hud.test.ts` (Zeilen ≈ 601, 665 plus ein Pin-Test)
- nicht ändern: `src/ui/hud.ts`, `farOrder.ts`; Signatur `formatIslandCard(def, width, height, d)` bleibt

## Verhalten

1. `islandCard.ts`: `formatGameTime(travelTicks(d))` statt `clock`; `clock` und `TICK_MS`-Umrechnung entfallen. Ergebnis «Fahrzeit 27 s» unter einer Minute, «1:05» darüber, «1:00» bei 60 s, «0 s» bei 0 Ticks.
2. `hud.test.ts`: beide Stellen prüfen `lead.title` mit `toBe('Fahrzeit einer Einzelfahrt von der Heimat; ein Schiff muss erst bereitstehen.')`; zusätzlicher Test pinnt `FAR_TRAVEL_TIP`. Nur Test, kein Code.

## Testfälle (rot zuerst)

- **BF6** feste Texte «Fahrzeit 27 s», «Fahrzeit 1:05», «Fahrzeit 1:00» und Vergleich gegen `formatGameTime(travelTicks(d))`.
- **BF7** Festtext-Erwartung; Änderung der Konstante macht den Test rot.

## Prüfschritte

Gezielte Tests laut index.md. Reviewer: Hinweis, dass Seerecht T04 danach nur das Argument ersetzt.
