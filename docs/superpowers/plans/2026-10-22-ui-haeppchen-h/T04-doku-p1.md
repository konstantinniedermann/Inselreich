# T04 · Doku P1 (D1, E-017)

Umsetzer-Instanz von T02, per `SendMessage` fortgesetzt · ≈ 15 Tools · blocked-by: T03

## Dateien

`README.md` (Speichern/Laden: zwei Autosave-Plätze, «Autosave davor», Startkarte «Davor laden», `pagehide` überschreibt nur den neuesten), `docs/arc42.md` (Bausteinsicht UI/Persistenz: zweiter Platz und Zeiger-Schlüssel `inselreich.save.auto.last`, kein Save-Format-Wechsel), `docs/ideen.md` (I-147 «umgesetzt» laut Spaltenkonvention, nur auf diesem Branch), `docs/beobachtungen.md` (Messwerte der Standgrösse aus T03; Befunde ausserhalb Scope).

## Prüfschritte

`npx prettier --check` der Dateien, Exit 0; Abschluss durch den Controller: `make check; echo EXIT=$?` bei freier Sperre.
