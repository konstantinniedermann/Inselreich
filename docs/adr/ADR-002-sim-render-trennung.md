# ADR-002: Simulation als reines Datenmodell, getrennt von Darstellung

Status: akzeptiert · Datum: 2026-09-29

## Kontext

Spiellogik, die mit Rendering und DOM verwoben ist, ist weder testbar noch speicherbar.

## Entscheidung

- `src/sim/` enthält keine DOM-Referenzen. Der Welt-Zustand ist ein einfaches JSON-fähiges
  Objekt; Systeme sind Funktionen `(world) => void` bzw. `(world, ...) => Result`.
- Rendering und UI lesen den Zustand nur; Änderungen laufen über Sim-Aktionen.
- Fester Tick (100 ms), damit Ergebnisse reproduzierbar sind.

## Konsequenzen

- Speichern/Laden = JSON; Tests laufen ohne Browser; Renderer austauschbar (siehe ADR-003).
- Disziplin nötig: Kein „kurz mal" DOM-Zugriff in der Simulation. ESLint-Regel
  (`no-restricted-globals` für `window`/`document` in `src/sim/**`) sichert das ab.
