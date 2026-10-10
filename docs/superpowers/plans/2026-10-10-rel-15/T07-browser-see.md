# T07 · Browser-Check Seekarte (`qa-playtester`)

Strang See · Worktree `.worktrees/rel-15-see` (nur lesen) · Prüfer `qa-playtester` (sonnet) · AK-Entwürfe C6, C7 (`ak-entwuerfe.md`) · blocked-by T04 (Review OK)

**Ziel:** Die Kontor-Marke ist auf der Seekarte neben dem Hafen-Schiffspunkt sichtbar, Marke und Punkt wirken bei dpr 1 und 2 gleich gross, nach zwei Neustarts hängt genau ein Inselmenü-Listener am `document`. Kein Code ändern; Befunde an den Controller.

**Rahmen:** Lauf mit dem Szenen-Helfer aus T04, nicht mit einem eigenen Skript. Studioweit ≤ 2 Browser-Läufe zugleich (R424); T06 läuft parallel auf Port 5291, dieser Lauf auf **5391**. Vor und nach dem Lauf `pgrep -fl "Chrome|chromium"`. Ausgabe unter `.studio/qa/REL-15/see/`.

## Schritte

- [ ] **Schritt 1: Hilfe.** Im Worktree: `node tools/render-qa/seekarte.mjs --help; echo EXIT=$?` → Hilfetext, `EXIT=0`.

- [ ] **Schritt 2: Hauptlauf (C6, C7).**

Run: `node tools/render-qa/seekarte.mjs --size 1280x720,1920x1080 --dpr 1,2 --leck --port 5391 --out .studio/qa/REL-15/see; echo EXIT=$?`
Expected: vier Screenshots `seekarte-<B>x<H>-dpr<d>.png`, alle Zeilen in `seekarte.txt` BESTANDEN (Karte offen, Hafenschiff vorhanden, Marke sichtbar Heimat und Insel 1, kein Listener-Leck mit `n0 = 1`, `n2 = 1`, Esc und Klick daneben schliessen), `EXIT=0`.

- [ ] **Schritt 3: Bildurteil.** Je Screenshot: weisse Marke knapp über dem gelben Schiffspunkt am Anker der Heimat, nicht verdeckt, nicht mit dem Punkt verschmolzen; Marke auf Insel 1 sichtbar. Vergleich dpr 1 und dpr 2 bei gleicher Grösse: Punkt und Marke in CSS-Grösse gleich (bei dpr 2 schärfer, nicht halb so gross). Ausschnitte der Karte (Popover-Bereich) im Bericht nennen.

- [ ] **Schritt 4: Konsole.** Die Zeilen der Konsolenmeldungen aus `seekarte.txt` übernehmen; Fehler oder Warnungen aus `src/` → Befund.

## Bericht (Playtest-Report)

Exit-Code des Laufs, die Zeilen BESTANDEN/NICHT BESTANDEN wörtlich, Bildurteil je Screenshot mit Pfad, Chrome-Prozesse vor/nach dem Lauf. Urteil OK/BEDENKEN/ZURÜCK.
