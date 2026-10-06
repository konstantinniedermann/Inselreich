# Retro session parallel-playtest — 2026-10-06

- Datum: 2026-10-06
- Art: session (Kurz-Retro, Parallel-Session)
- Auslöser: Session-Ende der Parallel-Session (Playtest-Aufnahme ohne Umsetzung); Nutzerfrage zu ungesichteten Beobachtungen
- Datenbasis: `docs/studio/rulings.md` R284–R289, `docs/beobachtungen.md`
- Grenzen: Kurz-Retro, keine Metrik-Datei und keine Archiv-Berichte gelesen; Starts und Aufwand sind aus den Rulings belegt, nicht gemessen. Keine Effizienz-Ampel für diese Notiz (kein Metrik-Lauf).

## Befunde

### B1 · Playtest-Aufnahme ohne Umsetzung war billig und lieferte einen Live-Fehler

- Beobachtung: Die Session setzte nichts um (Nutzer-Auftrag, R284, R285, R286). Sie nutzte 2 Scout-Starts (IDEEN-04, IDEEN-04b, `design-idea-scout`) und 1 Diagnose-Start (DIAG-PT1). Ergebnis: Ideen I-015, I-019, drei Bausteine für das Meilenstein-Brainstorming und der Hotfix H-F1 (Geisterbauten, Live-Fehler aus M12-E2, R286).
- Beleg: `docs/studio/rulings.md` R284 (IDEEN-04), R285 (IDEEN-04b), R286 (DIAG-PT1).
- Deutung (offen, nicht gemessen): Der Diagnose-Start war der wertvollste der drei, weil nur er einen Fehler im Livebetrieb fand. Ob das ein Muster ist, zeigt sich erst an weiteren Playtests; Einzelfall.

### B2 · Beobachtungen blieben unbemerkt liegen, bis der Nutzer fragte

- Beobachtung: Die letzte Auswertung von `docs/beobachtungen.md` lag am 2026-09-30; R287 nennt rund 175 neue Einträge ohne Sichtung, der neue Zähler zählt gegen die heutige Datei 95 Überschriften unter der Marke. Die Differenz ist eine andere Zählweise (R287: Zeilen und Einträge geschätzt, Zähler: Überschriften Ebene 2/3), nicht geklärt.
- Beleg: `docs/studio/rulings.md` R287, R288; Zähler-Lauf gegen `docs/beobachtungen.md` (Marke 2026-09-30).
- Deutung: Das Handbuch kannte keinen Takt und L0 hat nicht gezählt. Ursache ist fehlende Messung, nicht fehlender Wille. Massnahme R288: Der SessionStart-Hook zählt (Handbuch 1.22).

## Experiment-Vorschlag

- Kein neues Experiment. R288 wird gegen eine Schwelle bewertet, die ohnehin gilt: Beim Start einer Session stehen höchstens 30 Einträge unter der Marke, in den nächsten 3 Sessions. Rückfallzustand: Zähler-Hinweis entfernen (`context.observations_line`), Handbuch Punkt 6 zurücknehmen. Das Experiment verschlechtert seine Messbarkeit nicht: Die Zahl steht in jedem Start-Kontext.
- Offene Frage an lead-production: Marke als eigene Zeile „Letzte Auswertung: JJJJ-MM-TT“, und entscheidend, dass erledigte Einträge unter der Marke gestrichen oder verschoben werden, sonst zählt der Zähler sie weiter.

## Bewertung laufender Experimente

- keine Prüfung in dieser Notiz.

## Änderungen an lernen.md

- keine
