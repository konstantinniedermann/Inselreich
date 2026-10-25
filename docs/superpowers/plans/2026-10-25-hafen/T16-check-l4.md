# T16 · Browser-Check Hafen und Auftragsschiff, Blindtest AK-HF-51 im Spiel; Art-Urteil (L4)

Drei Starts, je frisch: `qa-playtester` **A** (Check), `qa-playtester` **B** (Blindtest, R945), `lead-art` (Urteil) · ≈ 40 + 15 + 15 Tools · AK-HF-40, -46, -51 ·
blocked-by: T15 · Worktree `.worktrees/hafen-render` (nur lesen) · Screenshots `.studio/qa/HAFEN-L4/` · Art-Brief §6, §11.3–§11.4, Anhang 02 §J

## A · Ablauf (qa-playtester, 1280 × 800, Headless-Chrome)

- **AK-HF-40 Hafen (Brief §11.4):** Seed 1, Insel B, Kontor II an einem Platz abseits `kontorSite`, Route Heimat ↔ B, Zoom 1: Steg vom Kontorrand unter die Schiffsmitte,
  Schiff **längsseits** (kantenparallel) mit gerefftem Segel; nach ≈ 3 s (x1) legt es mit gesetztem Segel ab, Bug in Fahrtrichtung (Bildfolge 0 s, ≈ 3,2 s, ≈ 4 s).
  **Mastspitze / Kontorfirst im Screenshot gemessen: 1,1 … 1,3** (Pixelzahl beider Höhen ab Wasserlinie bzw. Kaimauer im Report).
- **AK-HF-46 Auftragsschiff:** Tempo x1, Auftrag erscheint: Bildfolge 0 s, ≈ 1,7 s, ≈ 3,5 s zeigt das fremde Schiff (Farbsatz `auftrag`) auf dem Anfahrtsweg, eingeblendet
  (`ORDER_SHIP_FADE_TICKS`), dann längsseits am Steg; nach Lieferung fährt es ab und blendet aus (Bild ≈ 1 s danach).
- **Galerie im Spiel:** 4 Richtungen (NO, NW, SO, SW) × fahrend/liegend bei Zoom 0,5 / 1 / 2, Auftragsschiff fahrend und liegend bei Zoom 1, Tag und Nacht je ein Bild;
  Richtungen über Lanes verschiedener Himmelsrichtungen (Seeds 1–3, Fundstellen im Report). Päckchen: 4–5 Schiffe am selben Steg (AK-HF-36 sichtbar: Rümpfe nebeneinander
  vom Steg nach aussen, vorderes Schiff deckt das hintere). Fahrt nahe der Diagonale: kein Flackern der Richtung (Bildfolge 5 Frames).
- **Blindsatz im Spiel** für B: 16 Ausschnitte 320 × 200 um die Schiffsmitte (Clip-Screenshot, Kamera auf das Schiff zentriert, Hinweis aus dem T14-Bericht), 4 Richtungen
  × fahrend/liegend × Zoom 1 und 0,5, dazu 4 Ausschnitte eigen/fremd bei Zoom 0,5; gemischt, Namen `probe-nn.png` unter `.studio/qa/HAFEN-L4/blind/`, Zuordnung getrennt in
  `.studio/qa/HAFEN-L4/ZUORDNUNG-NICHT-OEFFNEN.json`; kein Hinweis auf die Art in Bild, Namen oder PNG-Daten (Muster `tools/render-qa/blindprobe.mjs`).
- Pause: Bilder vor und nach 2 s Pause gleich (Auftragsschiff und Flotte stehen).
- Report `.studio/qa/HAFEN-L4/report.md` mit Urteil OK/BEDENKEN/ZURÜCK je AK und Bildpfaden.

## B · Blindtest AK-HF-51 im Spiel (frischer qa-playtester, nie Fortsetzung von A oder T04-B)

Ablauf, Briefing-Grenzen (nur Bilderordner und Brief §1), `antworten.md` und Schwellen wie T04 B: **Richtung ≥ 15/16; Zustand 8/8 bei Zoom 1 und ≥ 7/8 bei Zoom 0,5;
eigen/fremd 4/4.** Auswertung durch den Controller in den Report. Nicht bestanden → ZURÜCK an den T14/T15-Umsetzer per `SendMessage`, neuer Blindsatz durch A
(Fortsetzung), neuer frischer Blindtester (Puffer).

## Art-Urteil (lead-art, frischer Start)

Liest Report, Blind-Ergebnis und Bilder gegen Art-Brief (§4–§8, P1–P10) und Anhang 02 §J; Urteil mit Begründung je Abweichung. ZURÜCK → Fix im selben Baum durch den
T14/T15-Umsetzer per `SendMessage`, Nachbilder per `SendMessage` an A.

## Abschluss

Controller: D4, Final-Review L4 (opus); nach ZURÜCK/BEDENKEN Delta-Review als **frischer** opus-Start (R673); Abschluss laut Index.
