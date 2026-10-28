# T09 Browser-Check Etappe 1 (AK-AL-29)

Persona `qa-playtester` · Strang A · Tools ≈ 40 · AK-AL-29 (mit S2/S3, Anhang 02) · blocked-by T06, T07, T08 (B und C per Merge in A zurückgeführt, Teilbeleg grün).

**Vorlauf (Controller):** `npx vitest run tests/sim/balance.test.ts <Baseline-Liste T00> tests/sim/balance-upgrade.test.ts tests/sim/balance-ausbau.test.ts; echo EXIT=$?` → 0 auf `feat/ausbau-logik` nach den Rückführungen.

**Szenen:** `AUSBAU_SCENES_OUT=.studio/qa/ausbau-logik/szenen npx vitest run tests/ui/ausbauScenes.test.ts; echo EXIT=$?`, dann je Szene: `make dev`, per CDP `localStorage.setItem('inselreich.save.v1', <S?.json>)`, neu laden, «Laden», `__inselDev.centerOn(focus.x, focus.y)`. Fremde Headless-Chrome nach R922 beenden, eigene am Ende schliessen. Screenshots nach `.studio/qa/ausbau-logik/`.

## Prüfschritte (je Screenshot mit Dateiname im Bericht)

1. **S1 Karte:** Fischer öffnen → Karte «Ausbau auf Stufe 3 — Fischerhütte» mit Zeilen aus R9 (✓/✗, Zahlen: Bürgerhaus «nächstes 6 Felder», Fischgrund «2 andere Fischerhütten im Umkreis 3 (erlaubt 1)»); Knopf gesperrt, Tooltip = Fischgrund-Text (`s1-karte.png`, `s1-tooltip.png`).
2. **S1 Nachbar abreissen** (`ids.n2`): Fischgrund-Zeile ✓, Knopf aktiv (sofern Stein reicht, sonst nennt der Tooltip Stein: dann Stein im Szenenlager prüfen und Befund) (`s1-frei.png`).
3. **S1 Bürgerhaus abreissen:** Chip «Läuft wie Stufe 1: Keine Handwerker im Umkreis 8 …», Chip-Tooltip «Unterhalt 6 statt 7 (gedrosselt)» (`s1-chip.png`). Nachzählen: angezeigte Zahlen stimmen mit der Karte überein (Abstand per Kachelzählung im Bild).
4. **S2 Brennerei mit Wache:** g 3 ist in Etappe 1 die Höchststufe → Karte «Höchste Stufe erreicht», kein Chip (`s2-wache.png`). Wache abreissen → Chip «Läuft wie Stufe 2: Keine Feuerwache in Reichweite 8 (Brennofen)», Tooltip «Unterhalt 30 statt 34 (gedrosselt)» (`s2-chip.png`).
5. **S3 Kolonie:** Steinbruch öffnen → Fachkräfte-Zeile ✗ «Keine Handwerker im Umkreis 8 (kein Siedlerhaus auf dieser Insel)», Knopf gesperrt mit diesem Tooltip (`s3-kolonie.png`).
6. **Konsole:** keine Fehler über alle Szenen; Bildrate unauffällig (x1, 30 s, Notiz).

## Ergebnis

Playtest-Report als Schlussbericht an den Controller: je Schritt bestanden/nicht bestanden, Abweichungen mit Screenshot, Befunde ausserhalb Scope getrennt. Kein Code, keine Commits.
