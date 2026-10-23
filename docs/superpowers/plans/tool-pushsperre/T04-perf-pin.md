# T04 · Pin `perf.test.ts` AK-E0-15a entschärfen (V2, Messung zuerst)

Strang P · gezielter vitest: `node tools/testlock/testlock.ts npx vitest run tests/sim/perf.test.ts`; danach `npx tsc --noEmit`, `make lint`.

**Befund:** Pin 2,5 ms = 1,5 × lokales Mittel 1,59 ms (ruhig, 2026-10-05). R815: 2,54 ms bei Last ≈ 5,4. Flake-Verdacht 11, davon 6 bei Last ≥ 8. Heute: ein Lauf mit 1000 Schritten, Mittel gegen Pin; ein einzelner Ausreisser durch Eigenlast färbt den ganzen Lauf.

**Vorschlag (Begründung):** Mittelwert je Lauf wie bisher, **drei Läufe, der kleinste zählt** (best-of-3, `RUNS = 3` gibt es in 15b schon und nutzt dort ebenfalls `Math.min`). Last wirkt additiv und trifft selten drei Läufe gleich stark; eine echte Regression hebt alle drei an. Pin bleibt 2,5 ms ruhig, CI-Faktor 4 bleibt. Alternative: Median von 5 Läufen (robuster gegen einen unglücklich niedrigen Lauf, kostet 5 statt 3 Läufe ≈ 8 s) oder Pin × (1 + 0,15 × max(0, Last − 2)) per `os.loadavg()` (macht den Test von der Maschine abhängig, Aufschlag ist selbst unmessbar). Kein blosses Hochsetzen.

**Messprotokoll (Teil des Tasks, vor der Änderung):**

1. Ruhig (Last ≤ 2): 10 × `npx vitest run tests/sim/perf.test.ts` mit temporärem Pin 0 (Meldung «Mittel x ms/Schritt» lesen) → 10 Mittelwerte.
2. Unter Last ≈ 5–6 (z. B. 5 × `yes > /dev/null &`, Last über `uptime` belegen, danach per `kill <PID>` beenden): wieder 10 Läufe → 10 Mittelwerte; bei der Messung die einzelnen 3 Läufe des Prototyps (siehe 3) mitschreiben.
3. Prototyp: Test misst 3 × 1000 Schritte, meldet Mittel je Lauf; daraus für beide Lagen Mittel, Median, best-of-3 vergleichen.
4. Tabelle (ruhig/belastet × Mittel/Median/best-of-3, jeweils min/max über die 10 Läufe) in den Kopfkommentar; dazu Entscheidung der Regel. **Annahme-Kriterium:** unter Last ≈ 5,4 höchstens 1 von 10 Läufen über Pin; ein künstlich verlangsamter Schritt (11-fach, ≈ 18 ms, entspricht dem naiven Code) bleibt rot (einmal per temporärer Änderung zeigen, dann zurücknehmen). Trägt best-of-3 die Daten nicht, wird die Alternative Median gewählt und begründet; reicht keine, bleibt der Pin und der Bericht nennt das (L0 entscheidet).
5. Kopfkommentar und AK-Text 15a aktualisieren (Regel, Datum, Tabelle). `check-ci-perf` und die Zeitreserve-Schritte bleiben streng und unverändert.

**Test-first:** Der Test selbst ist das Messobjekt; Rot-Beleg = Lauf mit 11-fach langsamem Schritt (siehe 4) und die belastete Lage vor der Änderung (mindestens 1 roter Lauf von 10 mit der alten Regel, sonst Lage nicht reproduzierbar → im Bericht nennen).
