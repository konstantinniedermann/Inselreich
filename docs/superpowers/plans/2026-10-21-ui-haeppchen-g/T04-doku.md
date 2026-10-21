# T04 · Doku (D1, E-017)

Umsetzer-Instanz von T02, per `SendMessage` fortgesetzt · ≈ 20 Tools · blocked-by: T03

## Dateien

`README.md` (Spielanleitung: «Zu spät» an der Fern-Marke der Seekarte; Karte «Wo war ich?» beim Laden, Esc/«Weiter», Spiel bleibt pausiert), `docs/arc42.md` (Bausteinsicht UI: `resumeCard.ts`, `farLate` in `farOrder.ts`; kein Tick-Ablauf, keine Persistenz), `docs/ideen.md` (I-155 und I-148 auf «umgesetzt» laut Spalten-Konvention der Datei, nur auf diesem Branch), `docs/beobachtungen.md` (Befunde ausserhalb Scope: Fernauftrag-HUD-Text «zu spät» als Beipack-Kandidat; Überschätzung der Ladungszählung bei vollem Fern-Lager).

## Prüfschritte

`npx prettier --check` der vier Dateien, Exit 0; Abschluss durch den Controller: `make check; echo EXIT=$?` bei freier Sperre.
