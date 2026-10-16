# Anhang 05 · Doku-Folgen (Spec M13-E1)

Gehört zu [Spec M13-E1 Edikte und Betrieb stilllegen](../2026-10-10-m13-e1-edikte-design.md), §11. Eigener Doku-Task
im Plan (E-017).

- **README:** Abschnitt «Edikte» unter Amtsstube (Tabelle der drei Edikte mit Wirkung und Preis, 600 Geld, 5 min
  Sperre, Aufheben kostenlos, ruht ohne wirkende Amtsstube, Stapelregel in einem Satz «nie unter 15 s») und ein Satz
  zu B2: «Im späten Spiel sind Edikte eine Feinsteuerung von wenigen Prozent; spürbar werden sie beim Zukauf und bei
  vielen neuen Häusern.» Abschnitt Betriebe: «Stilllegen» (halber Unterhalt, keine Erzeugung, Kette läuft leer).
  Kontor: Preise mit Handel.
- **`docs/arc42.md`:** Bausteine (`edicts.ts`, `defs/edicts.ts`), Tick-Ablauf (Wachstumstakt aus `growthInterval`),
  Persistenz (Version 11, `migrateV10ToV11`, Prüfung C1–C7, Kette v1 … v11).
- **ADR:** keine nötig (keine Abhängigkeit, Save-Versionierung nach bestehendem Muster).
