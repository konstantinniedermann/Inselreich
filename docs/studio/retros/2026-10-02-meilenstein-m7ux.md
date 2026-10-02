# Retro meilenstein M7-UX — 2026-10-02

- Datum: 2026-10-02
- Art: meilenstein
- Auslöser: `meilenstein:M7-UX`, `inaktiv:2042a460-9344-4056-a1da-d5b089b8bc30:a36f22dab59268885`
- Datenbasis: `docs/studio/metriken/M7-UX.md`, `docs/studio/metriken/M7.md`,
  `docs/studio/metriken/S-2026-10-01-2042a460.md`, `docs/studio/rulings.md` R129–R136,
  `.studio/events.jsonl` (`spawn`, `agent_stop`, Sessions), Prozess-Retro
  [2026-10-02-prozess-retro-m7ux.md](2026-10-02-prozess-retro-m7ux.md)
- Umfang: ein Start, zusammen mit der Umsetzung von R136. Die Prozess-Aussensicht (Ablauf, Gates,
  Ursachen) liegt vor und wird nicht wiederholt; diese Retro ergänzt Zahlen, Vergleich mit M7 und
  die Bewertung der Experimente. Keine Lead-Befragung, weil Ledger, Archiv und Prozess-Retro die
  Fragen beantworten.

## Befunde

### B1 · Budget und Schätzung

- Beobachtung: Das Budget reichte mit Reserve, die Schätzung lag deutlich zu hoch.
- Beleg: lead-tech 26 von 34 Starts (76 %), lead-qa 2 von 2 (Ledger, Prozess-Retro B0).
  Werkzeugaufrufe geschätzt 1 100, Ist 709 (−36 %); Dauer 196 gegen 122,5 min (−37,5 %), 28
  verglichene Agenten (`metriken/M7-UX.md`). In M7 lag die Abweichung bei −0,3 % (`metriken/M7.md`).
- Wirkung: Kein Mehrbedarf, kein Budgetantrag. Bisher ist das ein Einzelfall; E-001 (behalten) bleibt
  unverändert. Weicht M8 erneut um mehr als 30 % nach unten ab, sollte `richtwerte.md` für
  `tech-ui-engineer` sonnet neu berechnet werden.

### B2 · Qualität gegen M7

- Beobachtung: Erstabnahme und Review-Runden sind besser als in M7, die Nacharbeit ist höher.
- Beleg (M7-UX gegen M7): Erstabnahme 59 % gegen 50 %; Review-Runden im Mittel 1,45 gegen 1,50,
  Maximum 3 gegen 4; Nacharbeit 26 % gegen 16 %; gescheiterte Agenten 0 gegen 1; Agenten mit Lücke 0
  gegen 6 (`metriken/M7-UX.md`, `metriken/M7.md`).
- Wirkung: Die höhere Nacharbeit kommt aus einem einzigen Task: Die Bauleiste (Task 3) wurde viermal
  nachgearbeitet (Prozess-Retro B0, B2). Die Ursache ist dort analysiert, V1–V3 sind umgesetzt.

### B3 · Gate-Runden und Kostenschwerpunkt

- Beobachtung: Das Merge-Gate brauchte 3 Runden (R133 BEDENKEN, R134, R135). Opus trägt 70 % der
  Cache-Last.
- Beleg: Cache-Read 98,2 Mio., davon 68,6 Mio. auf 5 Opus-Agenten und 29,6 Mio. auf 28
  Sonnet-Agenten (`metriken/M7-UX.md`). Der Controller allein liest 50,2 Mio. (Prozess-Retro B0).
  Cache-Write je Delegation ≈ 155 000 (5,28 Mio. auf 34), in M7 ≈ 305 000.
- Wirkung: Die Gate-Runden sind Gegenstand von V1/V3 (Messung in Retro M8), der Controller-Kontext
  ist Gegenstand von E-010.

### B4 · Messartefakte

- Beobachtung: Der offene Vorfall „Agent unbekannt ist inaktiv“ (`a36f22dab59268885`) ist ein
  Artefakt eines eingebauten Agenten (Prozess-Retro B6). Insgesamt tragen 2 296 von 3 075
  `agent_stop` keine Rolle, und keines davon hat ein `agent_start`. Umgekehrt haben alle 779 mit Rolle
  eines (`.studio/events.jsonl`, ganzer Bestand).
- Beleg: Auswertung `kind == agent_stop` nach `role` und vorherigem `agent_start`.
- Wirkung: Die Rolle allein trennt Hilfsagenten sauber; deshalb prüft der Hook-Fix (R136 V5) nur die
  Rolle und muss keinen Zustand lesen. CI-Läufe stehen in der Metrik als „nicht erfasst“: Das ist kein
  Befund, weil `ci.py` in der Session-Ende-Routine läuft.

## Befragung der Leads

- Keine. Die Prozess-Retro hat Ledger, Final-Review und das Urteil von lead-qa ausgewertet
  (`.studio/archiv/berichte/20261002-091144-qa-code-reviewer-…`, `…-091327-lead-qa-…`).

## Vorschläge

- Keine neuen. Die Vorschläge V1–V5 der Prozess-Retro sind laut R136 umgesetzt (Handbuch 1.10, E-010).

## Bewertung laufender Experimente

- E-006 (vorgeschlagen, wartet auf einen Platz): M7-UX hatte 0 Vorfälle „fremder Schreibzugriff“ bei
  drei Worktrees (Prozess-Retro B5) → weiter beobachten bis Ende M8.
- E-007: In den Klassen (a)–(c) gab es je 0 Ereignisse. Die Session `2a96d607` lief 2 min parallel
  (07:24–07:25), nur lesend, ohne Spawn und ohne Commit, also regelkonform. Die Messregel „0 min
  Überlappung“ zählt sie trotzdem → weiter beobachten. Bei der Bewertung nur schreibende Sessions
  zählen.
- E-008: Kein Fall, weil PAGES-LIMIT ein Nutzerauftrag und kein Folgepaket war. Ausgangswert M7-UX
  gezählt: 7 Starts bis zum ersten Implementierer (lead-design, qa-playtester,
  design-ux-heuristiker, design-spec-author, lead-tech, lead-qa, lead-tech als Controller;
  `spawn`-Events) → Schwelle ≤ 4, weiter beobachten.
- E-009: Alle Schwellen sind erfüllt. R130–R136 haben im Mittel 50 Wörter (45–58), es gibt 0 reine
  Abnahme-Rulings, `STUDIO.md` hat 398 Zeilen und `experimente.md` 898 Wörter (vorher 908, gestrafft).
  Gegenprobe: 0 Befunde „Information fehlte im Ruling“. Der Zeitraum lautet „nächster Meilenstein
  (M8)“, aber M7-UX war der erste Meilenstein nach Handbuch 1.9. **Empfehlung an L0: E-009 jetzt
  `behalten`.** Damit wird ein Platz für E-010 frei, bevor der Plan M8 steht.

## Änderungen an lernen.md

- geändert: Zeile „inaktiv“ (Z. 10). Neu ist die Ursache „interne Hilfsagenten nur SubagentStop,
  ohne Rolle, Hook markiert `internal`“; die Aussage zu Hintergrund-Starts ist als widerlegt markiert
  (30 von 30 mit `agent_start`).
