# T16 Browser-Check Etappe 2 (Stufe 4, Gleiches bauen)

Persona `qa-playtester` · Strang A2 · Tools ≈ 40 · AK-AL-30, AK-AL-41 (Teil 4), AK-AL-43 (Teil 4) · blocked-by T15 (C2 in A2 gemergt, Teilbeleg grün).

**Vorlauf (Controller):** `npx vitest run tests/sim/balance.test.ts <Baseline-Liste> tests/sim/balance-upgrade.test.ts tests/sim/balance-ausbau.test.ts tests/sim/save-ausbau.test.ts; echo EXIT=$?` → 0 auf `feat/ausbau-logik-2`.

**Szenen:** wie T09 (`AUSBAU_SCENES_OUT=.studio/qa/ausbau-logik/szenen-2 …`, CDP `localStorage.setItem('inselreich.save.v1', …)`, «Laden», `__inselDev.centerOn`). Fremde Headless-Chrome nach R922. Screenshots nach `.studio/qa/ausbau-logik/`.

## Prüfschritte

1. **AK-AL-30 (S4):** Fischer `ids.source` (Stufe 3) öffnen, «Gleiches bauen» → Werkzeugname «Fischerhütte · Stufe 3» (`s4-werkzeug.png`); Vorschau an freier Küste grün (`s4-gruen.png`), neben `ids.f1`/`ids.f2` rot mit Fischgrund-Grund (`s4-rot.png`); Klick dort baut nichts (Gebäudezahl in `__inselDev.world()` vor/nach gleich); `Cmd`/`Strg`+Klick (Pipette) auf die Quelle liefert dasselbe Werkzeug. An der grünen Stelle bauen: neue Hütte zeigt im Panel Stufe 3; Kasse sinkt um die Summe (Zahl im Bericht).
2. **Stufe 4 (S4):** Fischer `ids.source` (Stufe 3, Bürgerhaus, kein Kaufmannshaus) öffnen → Karte «Ausbau auf Stufe 4» mit Wissenszeile ✓ (Szene mit `unlockAll`) und Fachkräfte-Zeile ✗ «Keine Verleger im Umkreis 8 (Kaufmannshaus nötig, …)» (AK-41 Teil 4), Knopf gesperrt mit diesem Tooltip (`s4-stufe4.png`). Schreiben über die Dev-Sonde ist nicht erlaubt.
3. **AK-AL-43 Teil 4:** Eine Hütte mit `level` 4 aus der Szene-Variante `S4` (`ids.max`, ergänzt in T14) zeigt nur «Höchste Stufe erreicht» (`s4-max.png`).
4. **Speichern/Laden:** Stand mit Stufe-4-Hütte speichern, neu laden, Hütte weiter Stufe 4, keine Konsolenfehler.
5. **Konsole** über alle Schritte fehlerfrei.

## Ergebnis

Playtest-Report an den Controller (bestanden/nicht bestanden je Schritt, Screenshots, Befunde getrennt). Kein Code, keine Commits.
