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

## Nachtrag 2026-09-30: Ausnahmen per L0-Ruling (Ruling R67)

Anlass: Antwort des Nutzers auf N-001 (`docs/studio/warteschlange.md`), umgesetzt in Ruling R67.

- **Der Normalfall bleibt „keine Laufzeit-Abhängigkeit".** Zuerst wird geprüft, ob eine eigene
  Umsetzung oder vorhandene Mittel (Browser-APIs, bestehende Dev-Abhängigkeiten) genügen.
- **Ausnahme:** Macht eine eigene Umsetzung keinen Sinn, entscheidet L0 eine neue Abhängigkeit
  (auch zur Laufzeit) selbst per Ruling. Jede solche Abhängigkeit bekommt ein eigenes ADR mit
  geprüften Alternativen, Lizenz und Grösse. Sie ist kein Nutzer-Vorbehalt mehr.
- Der user-scope Hook `dep-guard` wird nicht umgangen: Blockt er ein Paket, meldet L0 den
  Paketnamen dem Nutzer zur technischen Freigabe.
- Bis der Verfassungstext (Version 1.1) nachgeführt ist, gilt R67 vor dem Wortlaut der festen Regel
  „Keine neuen Laufzeit-Abhängigkeiten ohne Freigabe des Nutzers".
