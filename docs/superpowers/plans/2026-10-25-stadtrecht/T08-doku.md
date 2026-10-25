# T08 · Doku (D1, E-017)

Umsetzer `tech-ui-engineer` (Fortsetzung der T06-Instanz per `SendMessage`; liegt sie nicht mehr vor, Ersatzstart aus der Reserve) · ≈ 15 Tools · keine AK · blocked-by: T07 (OK) · Worktree `.worktrees/stadtrecht`

Das Briefing erlaubt ausdrücklich die D1-Dateien unten (E-017).

## Dateien

- ändern: `README.md`, `docs/arc42.md`, `docs/spielwerte.md`, `docs/beobachtungen.md`
- nicht ändern: Specs, `docs/studio/`, Code

## Inhalt

1. **README** Abschnitt «### Rat» (`README.md:207`): Absatz «Stadtrecht» — ab Ziel 1 in der Rats-Karte, sechs Sitzungen nacheinander, Kosten Geld/Stein/Glas aus der Heimatinsel (Sperrbestand gilt nicht), Wahl A +2 % Steuer in allen Stufen oder B schnellere Kette, gilt für die ganze Partie, kein Rückgängig, Kauf auch in der Pause, Marke «Rat · Stadtrecht», Meldung «Der Rat kann tagen: Stadtrecht leistbar». Zeile in der Liste der Spielwerte (`README.md:270` «Rat (Ratsbeschluss)») um «Stadtrecht: sechs Sitzungen» ergänzen. Tastenzeile `Umschalt` + `R` (`:156`): «nur wenn die Marke «Rat» da ist» bleibt richtig.
2. **`docs/spielwerte.md`:** neuer Abschnitt «Stadtrecht» mit der Tabelle aus Spec §3.1 (Werte aus `defs/charter.ts` abschreiben und gegenprüfen), Hinweis R870 R-2 (Werte-Ruling).
3. **`docs/arc42.md`:** Modultabelle: neue Zeilen `defs/charter.ts`, `charter.ts`; Zeile `council.ts` um «liest auch die B-Seiten des Stadtrechts (`world.charter`) und `charterTaxPoints`»; Zeile `edicts.ts` (`effectiveTaxPct` + Stadtrecht-Punkte, Import `./council`); Zeile `save.ts` um Version, `migrateV<n−1>ToV<n>` (`charter = []`) und `isValidCharter`; UI-Tabelle `charter.ts` (DOM-frei), `councilCard.ts` (Abschnitt Stadtrecht). Kein neuer Tick-Schritt (Kauf ist Spieleraktion).
4. **`docs/beobachtungen.md`:** Eintrag «`hud.ts` `taxTooltip(level)` zeigt den Satz ohne Stadtrecht-Punkte (keine Welt im Aufruf)», Fundort, Ursprung STADTRECHT T05, Einschätzung klein. Weitere Befunde aus T01–T07 falls offen.

## Steps

- [ ] Texte schreiben, Zahlen nur aus `defs/charter.ts` übernehmen.
- [ ] `make docs-check; echo EXIT=$?` → 0.
- [ ] **Commit:** `docs: Stadtrecht in README, arc42 und Spielwerten`.

## Review

Durch den Final-Review (keine eigene Review-Instanz): Spielanleitung gegen das Verhalten im Browser-Check, arc42 gegen den Diff.
