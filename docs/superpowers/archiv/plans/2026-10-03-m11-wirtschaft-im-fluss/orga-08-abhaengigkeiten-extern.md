> Teil des Plans M11, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Abhängigkeiten ausserhalb des Plans

| Voraussetzung                                | Stand                                                                                         | Wirkung                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| M10 gemergt (Save v5, Freischaltbaum)        | erledigt (M10-Stand `801c279`; `main` @ `4a5130e` oder neuer)                                 | Basis; M10-Schnittstellen sind geprüft (Spec 13-12)                                                |
| `docs/m11-design` nach `main`                | mit Gate Plan                                                                                 | Spec und Plan liegen sonst nur im Branch                                                           |
| H-R6 Sprite-Cache                            | gemergt, `main` @ `4a5130e`                                                                   | Basis für R1/R2; `src/render/spriteCache.ts` existiert                                             |
| H-R7 Varianz (`feat/h-r7-varianz`, lead-art) | läuft: `sprites.ts`, `spriteCache.ts`, `renderer.ts`, `variants.ts`/`material.ts`, `arc42.md` | blockiert **R2**; Cache-Schlüssel mit Variante, Material und `level`; Konfliktrisiko siehe orga-09 |
| Gate Plan (L0) und Budgetfreigabe            | offen                                                                                         | Start T00                                                                                          |
| lead-art (Render-Controller)                 | Budget R1/R2/QA-ART                                                                           | R1 ab T01-SHA                                                                                      |
