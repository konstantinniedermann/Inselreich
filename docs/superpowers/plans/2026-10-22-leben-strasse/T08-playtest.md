# T08 · Browser-Check und Abstimmung der Tempofaktoren

`qa-playtester` · ≈ 35 Tools · AK-V12 (und Beleg für T1 bis T6 im Bild) · blocked-by T07

## Ablauf

1. Headless nach `tools/render-qa/galerie.mjs` (Vorbild `docs/superpowers/plans/2026-10-22-ui-haeppchen-h/T03-playtest-p1.md` für Aufruf), Testsperre beachten. Belebte Strasse mit Sammler und Träger mit Last.
2. Zoom 0,5 / 1 / 2 je ein Screenshotsatz bei 1×, 2×, 4× und Pause unter `.studio/qa/LEBEN-STRASSE/`.
3. Prüffragen (Urteil je Frage mit Bild): Träger mit Last und Spaziergänger bei Zoom 1 unterscheidbar? Füsse rutschen nicht? Gleich flüssiges Gehen bei 1×, 2×, 4×? Bei 4× kürzere Trägerstrecke? Pause = Stillstand (zwei Aufnahmen im Abstand gleich)? Kein Aufblitzen kurzer Träger?
4. **Tempofaktoren:** wirken 1,6/2,4 zu langsam oder flimmerig, Vorschlag mit Zahl im Bericht (Änderung macht die Umsetzer-Instanz von T01 in `pace.ts` per Fix-Runde, Tests lesen die Konstanten; f(1) = 1 bleibt).

Der Bericht nennt Screenshot-Pfade und je Frage OK/Mangel. Keine Datei im Repo ändern.
