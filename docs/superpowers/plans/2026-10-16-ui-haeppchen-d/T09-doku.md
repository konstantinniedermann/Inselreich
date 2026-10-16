# T09 · Doku (D1, E-017) und Zeitmessung nachher

Umsetzer `tech-ui-engineer` (D1-Dateien ausdrücklich erlaubt, E-017) · ≈ 30 Tools · AK-UD-10, AK-UR-10 · blocked-by: T08

## Dateien

- ändern: `README.md` (Spielanleitung: Log zeigt Verfall und Vertragslieferung auch bei «Krisen: aus»; Chip «↓ 2:10» und Schwellen), `docs/arc42.md` (UI-Bausteine `autoLog.ts`, `reach.ts`; `LOG_MAX` 20; keine Änderung an Tick-Ablauf/Persistenz), `docs/ideen.md` (I-109 live, I-102 bleibt offen mit Verweis «Kurzdesign fehlt»), `docs/beobachtungen.md` (Abweichung Zeitformat «40 s» statt «0:40», falls nicht als Ruling entschieden; Randfälle aus T08)
- Spec-Status der Kurzdesigns: nur Verweise, keine Änderung an `docs/superpowers/specs/`
- `.studio/qa/ui-haeppchen-d/zeit-nach.json` (gleicher Befehl wie T00, Load ≤ 4) und Vergleichstabelle im Task-Bericht

## Testfälle

- **AK-UD-10, AK-UR-10** `make docs-check; echo EXIT=$?` = 0; README-Aussagen stimmen mit dem Verhalten überein (Reviewer prüft gegen T08-Screenshots); keine Aussage über Spielwerte erfunden.

## Prüfschritte / Task-Review

Reviewer: Doku konsistent mit Änderungen, keine Secrets, Commit-Konvention (`docs:`/`feat:`); Zeitvergleich: Abnahme nach Regel im Index.
