# T04 · Sichtprüfung Optik (Browser) und Art-Urteil

Prüfer `qa-playtester` (1 Start) und danach `lead-art` (1 Start, liest nur die Bilder und den Report) · ≈ 30 Tools · AK-HF-51 (Teil Standard-Richtung, eigene Flotte und
Auftragsschiff) · blocked-by: T03 · Worktree `.worktrees/hafen-optik` (nur lesen) · Anhang 02 §J

## Ablauf (qa-playtester)

- Dev-Server im Worktree, Headless-Chrome 1280 × 800 (Desktop-first), Screenshots unter `.studio/qa/HAFEN-O/`.
- Szene: Seed 1, Kontor II auf Insel B, ein Schiff mit Route Heimat ↔ B; Auftrag abwarten (Auftragsschiff liegt am Heimatanker).
- Bilder: fahrendes Schiff Zoom 0,5 / 1 / 2; liegendes Auftragsschiff Zoom 0,5 / 1; Tag und Nacht je ein Bild bei Zoom 1.
- Prüfpunkte (Anhang 02 §J 2–5, ohne die 4 Richtungen, die erst L4 zeigt): Silhouette mit Bugspriet und höherem Heck; Segel voll; Rumpf zweitönig; keine schwarze
  Kontur; Zoom 0,5 heller Saum rundum und Schiff ≥ 16 CSS-px; Auftragsschiff farblich unterscheidbar bei Zoom 0,5; Tageslicht tönt mit.
- Report `.studio/qa/HAFEN-O/report.md` mit Urteil je Prüfpunkt (OK/BEDENKEN/ZURÜCK) und Bildpfaden.

## Art-Urteil (lead-art)

Liest Report und Bilder gegen Anhang 02 und ADR-012/Stilrahmen; Urteil OK/BEDENKEN/ZURÜCK mit Begründung je Abweichung. ZURÜCK → Fix-Runde im selben Baum durch den
T03-Umsetzer per `SendMessage`, danach nur die betroffenen Bilder neu (Fortsetzung des Playtesters per `SendMessage`).

## Abschluss

Final-Review O (opus) über `git diff main...feat/hafen-optik`; Merge-Gate O vor L4 (S5 braucht die neue Optik).
