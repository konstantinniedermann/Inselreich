# T04 · Browser-Check drei Zustände (`qa-playtester`)

Strang A · Worktree `.worktrees/rel-14-inspektor` (nur lesen) · Prüfer `qa-playtester` (sonnet) · AK-Entwurf A8 (`ak-entwuerfe.md`) · blocked-by T01 (Review OK), T03 Schritt 2 (Render-Commit liegt)

**Ziel:** Das Haus-Panel und der Hover sagen in drei Zuständen dasselbe und nirgends „versorgt“. Kein Code ändern; Befunde an den Controller.

**Rahmen:** Headless-Chrome, Fenster 1280 × 720 (Desktop-first), ein Lauf; studioweit ≤ 2 Browser-Läufe zugleich (R424), vor dem Start `pgrep -fl "Chrome|chromium"` prüfen. Dev-Server aus dem Worktree. Screenshots und Bericht unter `.studio/qa/REL-14-INSPEKTOR/`. Spielstand-Aufbau über die Dev-Hilfen (`window.__inselDev`, siehe `src/ui/devProbes.ts`), sonst über normale Bedienung.

## Schritte

- [ ] **Schritt 1: Zustand 1 — ausserhalb der Versorgung.** Wohnhaus ausserhalb von Kontor- und Marktradius (z. B. Marktplatz abreissen oder Haus über die Dev-Hilfe weit weg setzen), Haus anklicken. Erwartet: Chip „✗ Ausserhalb der Versorgung“ (rot), Tooltip „Kein Kontor oder angebundener Marktplatz in Reichweite: keine Waren“, erste Mangel-Zeile „Mangel: ausserhalb der Versorgung“, keine Zeile „Fehlt: …“. Hover über dem Haus: „Ausserhalb der Versorgung“. Screenshot `z1-ausserhalb.png`.
- [ ] **Schritt 2: Zustand 2 — im Radius, Ware fehlt.** Haus im Radius, Lager ohne Nahrung (oder Ware abziehen). Erwartet: Chip „✓ Im Versorgungsradius“ (grün), Tooltip „Kontor oder Marktplatz in Reichweite: Waren kommen an“, „Mangel: Nahrung fehlt“, Bedarf „Nahrung ✗“, keine Zeile „Fehlt: …“. Screenshot `z2-ware-fehlt.png`. Wenn erreichbar (Siedlerhaus ohne Kapelle): Dienst-Fall, Inspektor „Mangel: Kapelle fehlt“ und Hover „Kapelle fehlt“ (Wortlaut nach Gate-Entscheid E1) — Screenshot `z2b-dienst.png`.
- [ ] **Schritt 3: Zustand 3 — voll erfüllt.** Haus im Radius, alle Bedarfe ✓. Erwartet: Chip „✓ Im Versorgungsradius“, keine Mangel-Zeile, keine „Fehlt“-Zeile; Hover „zufrieden“; Cursor-Hinweis (Auswahl-Werkzeug über dem Haus) endet auf „· zufrieden“. Screenshot `z3-erfuellt.png`.
- [ ] **Schritt 4: Auswahlwechsel.** Von Zustand 2 direkt auf ein Haus in Zustand 3 klicken und zurück: keine Restzeile, Chip und Mangel-Liste folgen sofort. Screenshot `z4-wechsel.png`.
- [ ] **Schritt 5: Text-Suche und Konsole.** Im DOM des Info-Panels (`textContent`) in allen drei Zuständen weder „Versorgt“ noch „Nicht versorgt“ noch „Fehlt:“; Konsole ohne Fehler und Warnungen aus `src/`.

## Bericht (Playtest-Report)

Je Zustand: OK/Befund mit Screenshot-Pfad, gefundene Texte wörtlich, Konsole, Chrome-Prozesse vor/nach dem Lauf. Urteil OK/BEDENKEN/ZURÜCK.
