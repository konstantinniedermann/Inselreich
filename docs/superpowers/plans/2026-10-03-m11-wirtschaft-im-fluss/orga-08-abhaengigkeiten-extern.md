> Teil des Plans M11, Einstieg und Task-Tabelle: [index.md](index.md). **Gemeinsame Regeln:** index.md (Global Constraints).

### Abhängigkeiten ausserhalb des Plans

| Voraussetzung                         | Stand                                                      | Wirkung                                                                           |
| ------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| M10 gemergt (Save v5, Freischaltbaum) | erledigt, `main` @ `801c279`                               | Basis; M10-Schnittstellen sind geprüft (Spec 13-12)                               |
| `docs/m11-design` nach `main`         | mit Gate Plan                                              | Spec und Plan liegen sonst nur im Branch                                          |
| H-R6 Sprite-Cache (M9 Welle 2)        | `feat/h-r6-sprite-cache` @ `801c279` (noch keine Änderung) | blockiert nur **R2**; Cache-Schlüssel muss `level` enthalten (Pflichtpunkt in R2) |
| Gate Plan (L0) und Budgetfreigabe     | offen                                                      | Start T00                                                                         |
| lead-art (Render-Controller)          | Budget R1/R2/QA-ART                                        | R1 ab T01-SHA                                                                     |
