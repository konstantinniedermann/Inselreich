# T08 Review und Browser-Check (Controller)

blocked-by T02 (A) bzw. T07 (R). Kein Task-Review je Task (E-068); je Strang ein Reviewer am Ende über die ganze Branch.

1. `qa-code-reviewer` A (`sonnet`): Diff `feat/i120` gegen Spec Teil A, Briefing nur Task-Dateien T01/T02 und AK-IDs A1–A7. Prüft Importgrenze, Determinismus, Pegel (Faktor 2), keine Spielwerte in `defs/`.
2. `qa-code-reviewer` R (`opus`, grösserer Diff, Final-Review): Diff `feat/i118` gegen Teil B, AK-IDs B1–B8; prüft Renderer schreibt nie in die Welt, Deckel, Reihenfolge Kranz/Marken, Konflikte nach Einmergen von `main`.
3. `qa-playtester`: Aufstieg per Schnellvorlauf auslösen, Kranz bei Standard-Zoom Tag und Nacht erkennbar, Mangelmarken nicht verdeckt, «Bewegung reduzieren» nur Kranz, Pause friert ein; Screenshots `.studio/qa/i118/`. Der Klang selbst: nur der Nutzer hört ihn; Playtester prüft Pegel per Fake-Test nicht, nur dass der Ton nicht abbricht.
4. Rulings aus dem Ledger nach Abschluss als Entwurf an L0 (nicht in `rulings.md` schreiben). Handoff nach `uebergabe.md`.
