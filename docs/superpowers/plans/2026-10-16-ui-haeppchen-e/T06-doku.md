# T06 · Doku (D1, E-017) und Zeitmessung nachher

Umsetzer `tech-ui-engineer` (D1-Dateien ausdrücklich erlaubt, E-017) · ≈ 30 Tools · I097 AK-11b, I102 AK-9b · blocked-by: T05

## Dateien

- ändern: `README.md` (Spielanleitung: ein Satz zur Pause-Anzeige «getönter Kartenrand und Banner Pause; P oder 1× setzt fort»; ein Satz zur Auftragskarte «zeigt das voraussichtliche Gut des nächsten Auftrags; ein Stufenaufstieg kann es ändern»), `docs/arc42.md` (UI-Baustein `pauseOverlay.ts`; Sim-Lesefunktion `previewOrder` bei den Aufträgen; keine Änderung an Tick-Ablauf oder Persistenz), `docs/ideen.md` (I-097 und I-102 live, nach Playtest), `docs/beobachtungen.md` (Randfälle aus T05, z. B. `refresh()`-Latenz)
- `.studio/qa/ui-haeppchen-e/zeit-nach.json` (gleicher Befehl wie T00, Load ≤ 4) und Vergleichstabelle im Task-Bericht
- `docs/superpowers/specs/` nicht ändern

## Testfälle

- `make docs-check; echo EXIT=$?` = 0. README-Aussagen stimmen mit T05-Screenshots überein; keine Aussage über Spielwerte erfunden.
- Zeitvergleich nach Regel im Index (≤ 25 % je Testfall, < 50 % Timeout); Ausreisser → Beobachtung oder Fix-Task.
- Abschlussläufe: `make check`, `make zeitreserve-gate`, `make docs-check` je mit `; echo EXIT=$?`.

## Prüfschritte / Task-Review

Reviewer: Doku konsistent mit Änderungen, keine Secrets, Commit-Konvention (`docs:`); danach Final-Review über die Branch (`opus`).
