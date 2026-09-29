# Beobachtungen (Posteingang für Befunde ausserhalb des Scopes)

Aufbau je Eintrag: Datum · Fundort · Beobachtung · Ursprung · erste Einschätzung.
Auswertung mit dem Skill `beobachtungen-auswerten`. Ein Folgeissue entsteht nur auf
ausdrückliche Zustimmung des Nutzers.

---

## 2026-09-29 · dep-guard-Hook (`~/.claude/hooks/dep_guard.py`) · Fehlalarm bei Heredoc-Text
**Beobachtung:** Ein Bash-Aufruf, der Dateien per Heredoc anlegte *und* danach `npm install -D …` ausführte,
wurde blockiert, weil der Hook Wörter aus dem Heredoc (README-/Makefile-Text) als Paketnamen gelesen hat.
**Ursprung:** Task 1 (Scaffold), Implementierer-Bericht. Workaround: Dateianlage und Install getrennt ausführen.
**Einschätzung:** Falsch-positiv durch Tokenisierung des gesamten Kommandos statt nur der Install-Zeile.
Betrifft alle CAS-Projekte (geteilter Baustein). Kandidat für eine kleine Härtung des Hooks: nur die Zeile
mit dem Install-Kommando tokenisieren.
