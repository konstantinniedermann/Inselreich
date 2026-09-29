# ADR-001: Tech-Stack — TypeScript, Vite, Canvas 2D, keine Laufzeit-Abhängigkeiten

Status: akzeptiert · Datum: 2026-09-29

## Kontext

Das Spiel soll ohne Installation spielbar sein und vom Entwickler (Python/SQL-Kenntnisse,
JS/TS neu) nachvollzogen werden können. Ein Game-Engine-Framework (Phaser, Pixi) würde viel
Magie mitbringen und die Lernkurve verschieben; Python/pygame wäre vertrauter, aber nicht
im Browser verteilbar.

## Entscheidung

- TypeScript (strict) + Vite als Build-Tool, HTML5 Canvas 2D für die Karte, DOM für das UI.
- **Keine Laufzeit-Abhängigkeiten.** Dev-Abhängigkeiten: vite, typescript, vitest, eslint,
  prettier (plus deren Plugins).
- Tests mit Vitest, ausschliesslich gegen die Simulation.

## Konsequenzen

- Jede Zeile Spiellogik ist lesbar und ohne Framework-Wissen verständlich.
- Rendering-Komfort (Sprites, Tweening) muss selbst gebaut werden – bewusst klein gehalten.
- Verteilung als statische Seite (GitHub Pages) möglich.
