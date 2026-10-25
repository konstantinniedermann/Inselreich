# T04 · Sichtprüfung Optik, Blindtest AK-HF-51 (Galerie) und Art-Urteil

Drei Starts, je frisch: `qa-playtester` **A** (Sichtprüfung), `qa-playtester` **B** (Blindtest, R945), `lead-art` (Urteil) · ≈ 30 + 15 + 15 Tools · AK-HF-51 (Galerie, alle
4 Richtungen; im Spiel nur `SW`) · blocked-by: T03 · Worktree `.worktrees/hafen-optik` (nur lesen) · Art-Brief §11.2–§11.3, Anhang 02 §J

## A · Sichtprüfung (qa-playtester, 1280 × 800, Headless-Chrome)

- **Galerie** aus T03 (`.studio/qa/hafen-optik/galerie/`, Raster 4 Richtungen × gesetzt/gerefft × Zoom 0,5/1/2 + Auftragsschiff, Tag und Nacht): Prüfpunkte Brief P1–P10
  und Anhang 02 §J 2–5 — Silhouette mit Bugspriet, Achterkastell, Wimpel nach achtern; gesetzt/gerefft unterscheidbar; Rumpf zweitönig; keine schwarze Kontur; Zoom 0,5
  heller Saum rundum (auch Mast) und Schiff ≥ 16 CSS-px; Auftragsschiff farblich klar; Nacht tönt mit.
- **Im Spiel** (Dev-Server im Worktree, Screenshots `.studio/qa/HAFEN-O/`): Seed 1, Route Heimat ↔ B, fahrendes Schiff Zoom 0,5 / 1 / 2 (Richtung bis L4 immer `SW`,
  gesetzt), Tag und Nacht je ein Bild bei Zoom 1; Schiff steht neben dem Kontor nicht zu klein (Mast höher als First, Augenmass; gemessen erst T16).
- Report `.studio/qa/HAFEN-O/report.md`: Urteil OK/BEDENKEN/ZURÜCK je Prüfpunkt, Bildpfade. A öffnet den Blindsatz nicht und nennt die Zuordnung nicht.

## B · Blindtest AK-HF-51 (frischer qa-playtester, nie Fortsetzung von A)

- **Briefing nur:** Ordner `.studio/qa/hafen-optik/blind/` (20 Bilder `probe-nn.png`) und die Tabelle Brief §1 «Richtung → Bug zeigt im Bild» (Richtungsnamen). **Nicht**
  ins Briefing: Art-Brief, Spec, T03, Report A, `ZUORDNUNG-NICHT-OEFFNEN.json`. B ist nicht Autor der Bilder.
- Aufgabe je Bild: Richtung (NO/NW/SO/SW), Zustand (fährt = Segel gesetzt / liegt = gerefft), bei den eigen/fremd-Bildern «eigene Flotte» oder «fremder Auftrag».
  Antworten zuerst vollständig in `.studio/qa/hafen-optik/blind/antworten.md` schreiben, danach nichts mehr ändern.
- **Auswertung (Controller, nach B):** `antworten.md` gegen die Zuordnung. **Bestanden:** Richtung ≥ 15/16; Zustand 8/8 bei Zoom 1 und ≥ 7/8 bei Zoom 0,5; eigen/fremd 4/4.
  Ergebnis mit Zahlen in `.studio/qa/HAFEN-O/report.md` (Abschnitt «Blindtest»).
- **Nicht bestanden:** ZURÜCK an den T03-Umsetzer (`SendMessage`, Befund je verwechselter Kombination), neuer Blindsatz per `schiffe.mjs --blind` (neue Mischung), dann
  **neuer frischer** Blindtester (B kennt die Bilder; 1 Start aus dem Puffer, Budget-Index).

## Art-Urteil (lead-art, frischer Start)

Liest Report A, Blind-Ergebnis und Galerie gegen Art-Brief (P1–P10, §4–§8) und ADR-012/Stilrahmen; Urteil OK/BEDENKEN/ZURÜCK mit Begründung je Abweichung.
ZURÜCK → Fix im selben Baum durch den T03-Umsetzer per `SendMessage`, danach nur die betroffenen Galerie-Bilder neu (Fortsetzung von A per `SendMessage`); ändert der
Fix Richtung, Reff oder Farbsatz, folgt ein neuer Blindtest wie oben.

## Abschluss

Final-Review O (`qa-code-reviewer` opus) über `git diff main...feat/hafen-optik`; nach ZURÜCK/BEDENKEN Delta-Review als **frischer** opus-Start (R673). Merge-Gate O vor L4.
