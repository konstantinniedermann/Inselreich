# T16 · Browser-Check Hafen, Auftragsschiff, Galerie; Art-Urteil (L4)

Prüfer `qa-playtester` (1 Start), danach `lead-art` (1 Start) · ≈ 40 Tools · AK-HF-40, -46, -51 · blocked-by: T15 · Worktree `.worktrees/hafen-render` (nur lesen) ·
Screenshots `.studio/qa/HAFEN-L4/` · Anhang 02 §J

## Ablauf (qa-playtester, 1280 × 800, Headless-Chrome)

- **AK-HF-40 Hafen:** Seed 1, Insel B, Kontor II an einem Platz abseits `kontorSite`, Route Heimat ↔ B, Zoom 1: Bild mit Steg am Kontor und Schiff liegend am Steg mit
  gerefftem Segel; nach ≈ 3 s (x1) legt es mit gesetztem Segel ab, Bug in Fahrtrichtung (Bildfolge 0 s, ≈ 3,2 s, ≈ 4 s).
- **AK-HF-46 Auftragsschiff:** Tempo x1, Auftrag erscheint: Bildfolge 0 s, ≈ 1,7 s, ≈ 3,5 s zeigt das fremde Schiff auf dem Anfahrtsweg und dann am Steg; nach Lieferung
  fährt es ab (Bild ≈ 1 s danach).
- **AK-HF-51 Galerie:** Raster 4 Richtungen (NO, NW, SO, SW) × fahrend/liegend bei Zoom 0,5 / 1 / 2, plus Auftragsschiff fahrend und liegend bei Zoom 1; Tag und Nacht je
  ein Bild. Richtungen über Routen in passenden Himmelsrichtungen oder Kamera auf Schiffe verschiedener Lanes (Seed 1–3 genügen; Fundstellen im Report). Prüfpunkte §J 2–5,
  dazu 4–5 Schiffe am selben Steg (AK-HF-36 sichtbar: keine Überlappung der Mittelpunkte, vorderes Schiff vorn).
- Pause: Bilder vor und nach 2 s Pause gleich (Auftragsschiff und Flotte stehen).
- Report `.studio/qa/HAFEN-L4/report.md` mit Urteil OK/BEDENKEN/ZURÜCK je AK und Bildpfaden.

## Art-Urteil (lead-art)

Liest Report und Galerie gegen Anhang 02 (B–J) und den Stilrahmen; Urteil mit Begründung je Abweichung. ZURÜCK → Fix im selben Baum durch den T14/T15-Umsetzer per
`SendMessage`, Nachbilder per `SendMessage` an den Playtester.

## Abschluss

Controller: D4, Final-Review L4 (opus), Abschluss laut Index.
