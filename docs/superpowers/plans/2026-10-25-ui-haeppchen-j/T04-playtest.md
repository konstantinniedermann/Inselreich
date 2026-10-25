# T04 · Browser-Check P1 bis P3

Umsetzer `qa-playtester` · ≈ 35 Tools · AK J2, J3, J8, J15 · blocked-by: T03 · Screenshots unter `.studio/qa/ui-haeppchen-j/`

Dev-Server im Worktree (`npm run dev`), Headless-Chrome.

## P1 (J2, J3)

Auslöser ohne Code: in der Seitenkonsole `const m = await import('/src/ui/messages.ts'); m.showMessage('Test', 'warn')` (gleiche Modulinstanz wie die App). Dauer in Echtzeit per `MutationObserver` auf dem `.toast`-Element und `performance.now()`.

- AK-J2: Warnung **6,5 bis 7,5 s**, Info-Meldung **2,5 bis 3,5 s** (Band wegen Headless-Jitter); bei Tempo 4× unverändert. Drei Warnungen kurz nacheinander (verschiedene Texte, > `DEDUPE_MS` Abstand ist nicht nötig): höchstens drei Karten, älteste fällt zuerst. **Sticky** (`showMessage('x','warn',true)`) bleibt stehen, bis es geschlossen wird. Zusatz, falls erreichbar: echte Sturmwarnung oder Brand bei 4×.
- AK-J3: Pause (Leertaste) während einer Warnung: Ablauf weiterhin 6,5 bis 7,5 s.

## P2 (J8)

Rat in einer Partie bis Stufe 2 öffnen (Wege wie bei früheren Rats-Checks, `window.__inselDev` nur lesend; Spielstand-Vorlage mit Ratsmarke, falls vorhanden). Beschluss fassen: Ruhe-Ansicht (Inselkarte ohne Auswahl) zeigt `Rat: <Name>`; Ereignis-Log trägt «Rat beschliesst: <Name>»; Seite neu laden: Zeile bleibt, im Log kein zweiter Eintrag; «Neue Insel»: Zeile weg.

## P3 (J15)

Rat öffnen mit Webereien auf der Insel: Zeile «Betrifft jetzt: n × Weberei» unter «Webordnung», Zahl stimmt; Kapelle bauen/abreissen, Karte neu öffnen: Zahl folgt. Eine Option mit 0 Gebäuden zeigt «Wirkt noch nicht: … fehlt» und bleibt wählbar.

Report als Schlussbericht; Befunde ausserhalb Scope nach `docs/beobachtungen.md` (Lead trägt ein). Keine Codeänderung.
