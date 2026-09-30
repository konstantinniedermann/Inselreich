# Vorlage: Bericht

Antwort jedes Agenten an seine Auftraggeber-Ebene. Höchstens 15 Zeilen; Details stehen in Dateien,
der Bericht nennt die Pfade.

```text
Ergebnis: <was erreicht ist, mit Pfaden/Commits>
Entscheidungsbedarf: <Frage> — Empfehlung: <Option und warum> (oder „keiner")
Risiken: <was schiefgehen kann> (oder „keine bekannten")
Befunde ausserhalb Scope: <eingetragen in docs/beobachtungen.md: Titel> (oder „keine")
Budget: <verbraucht>/<frei> Starts, Parallelität max <k> (Arbeiter: „—")
Aufwand: <Dauer, Tool-Aufrufe> (Dashboard misst genauer)
Status: <done|failed|blocked|waiting>
```

## Beispiel

```text
Ergebnis: Paket M5-02 fertig — Marktplatz versorgt Häuser im Radius (src/sim/supply.ts), 4 neue Tests, Commit a1b2c3d in .worktrees/m5-sim.
Entscheidungsbedarf: Radius 6 oder 8 Kacheln? — Empfehlung: 6, hält den Balancing-Test grün; 8 bräuchte ein Ruling.
Risiken: Versorgung iteriert über alle Häuser je Tick; bei > 500 Häusern prüfen.
Befunde ausserhalb Scope: „Warenanzeige rundet ab" in docs/beobachtungen.md.
Budget: —
Aufwand: ca. 20 min, 35 Tool-Aufrufe (Dashboard misst genauer)
Status: done
```
