# T13 · Browser-Check Vorschau und Liegen (L3)

Prüfer `qa-playtester` · ≈ 30 Tools · AK-HF-50 · blocked-by: T11, T12 (Controller merged `feat/hafen-vorschau` per `git merge` in `feat/hafen-dwell`) · Worktree
`.worktrees/hafen-dwell` (nur lesen) · Screenshots `.studio/qa/HAFEN-L3/`

## Ablauf

- Dev-Server, Headless-Chrome 1280 × 800, Seed 1, Spiel bis Kontor II baubar (Freischaltung «Alles frei» erlaubt).
- **AK-HF-50:** Werkzeug Kontor II auf Insel B, Maus über zwei gültige Plätze mit verschiedenem Anker: Hinweis zeigt «Fahrzeit zur Heimat m:ss (vorgesehener Platz m:ss)»,
  der erste Wert wechselt, der zweite bleibt. Über einen Binnenplatz (Insel A): «Kontor braucht Zugang zum Meer», keine Fahrzeit.
- **Sichtprobe Liegezeit (kein AK, Spielgefühl):** Route Heimat ↔ B; bei Tempo x1 liegt das Schiff ≈ 3 s am Anker, dann legt es ab; Inselkarte zeigt dieselbe Fahrzeit wie
  der Hinweis vor dem Bau. Abweichungen als Befund.
- Hinweistext bei 1280 px ohne Umbruch-Abschnitt oder Abschneiden (Bild).
- Report `.studio/qa/HAFEN-L3/report.md` mit Urteil OK/BEDENKEN/ZURÜCK je Punkt und Bildpfaden.
