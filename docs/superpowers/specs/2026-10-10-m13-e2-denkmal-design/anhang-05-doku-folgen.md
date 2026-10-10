# Anhang 05 · Doku-Folgen (Spec M13-E2)

Gehört zu [Spec M13-E2 Denkmal als Wahlziel](../2026-10-10-m13-e2-denkmal-design.md), §12. Eigener Doku-Task im Plan
(E-017), im Paket M13-E2-UI.

- **README, Abschnitt «Denkmal»** unter «Ziel»: frei nach dem Kaufleute-Ziel, nur Heimatinsel, eines, 3×3, Bauplatz
  500 Geld, 10 Holz, 10 Stein; Tabelle der drei Abschnitte (Name, Geld, Stein, Werkzeug, Glas, Gewürz) aus
  `MONUMENT_STAGES`; Lieferung 1 Stück je Gut und Sekunde aus dem Lager über der Reserve (Reserve-Regel in einem Satz:
  «mindestens 20, sonst 8 × Hausverbrauch je 100 Ticks»); Schalter «zukaufen» je Gut zum Kontorpreis (mit Edikt
  Handel −20 %); «Bau pausieren»; Abriss ohne Erstattung von Abschnitts-Geld und Ware; Wahlziel ohne Lohn, Ziel-Chip
  und Inselchronik. Ein Satz aus Lauf B (Anhang 03 C), z. B. «Ohne zusätzliche Betriebe wird schon der erste Abschnitt
  nicht fertig.» und ein Satz zur Dauer: «Voll zugekauft dauert der Bau 10 Minuten und kostet 64 200 Geld.»
- **README, Inselchronik:** Zeile «Wahlziel» ergänzen.
- **README, Bedienung:** Abriss-Bestätigung beim Denkmal (nur falls P-1 angenommen).
- **`docs/arc42.md`:** Bausteine (`src/sim/monument.ts`, `src/sim/defs/monument.ts`, `src/ui/monumentView.ts`, Bildstufe
  in `src/render/`); Tick-Ablauf (`tickMonument` nach `tickEconomy`, vor `tickUnlocks`); Persistenz (Version 12,
  `migrateV11ToV12`, Prüfung V1–V9, Kette v1 … v12, Rückfaltung mit Insel-Positivliste); Abschnitt Obergrenzen
  (Effekt Abschluss-Moment unter `CAPS`).
- **`docs/CREDITS.md`:** keine Änderung (prozedurales Sprite, bestehende Glocke).
- **ADR:** keiner nötig (keine Abhängigkeit, Save-Versionierung nach bestehendem Muster).
