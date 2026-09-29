# ADR-003: Top-down-Darstellung statt Isometrie im MVP

Status: akzeptiert · Datum: 2026-09-29

## Kontext
Der Anno-Look ist isometrisch. Isometrie verkompliziert Trefferprüfung, Zeichenreihenfolge
und Footprints erheblich und bringt für ein funktionierendes MVP keinen Spielwert.

## Entscheidung
Quadratische Kacheln von oben (32 px). Der Renderer ist über `camera.ts` und `renderer.ts`
isoliert, sodass ein späterer Wechsel auf Isometrie die Simulation nicht berührt.

## Konsequenzen
- Schneller zu einem spielbaren Stand; weniger Fehlerquellen.
- Optischer Abstand zum Vorbild – bewusst in Kauf genommen, steht im Backlog.
