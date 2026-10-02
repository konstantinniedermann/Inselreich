# Retro Meilenstein M8 — 2026-10-02

- Datum: 2026-10-02
- Art: meilenstein
- Auslöser: `meilenstein:M8`
- Datenbasis: `docs/studio/metriken/M8.md`, `docs/studio/metriken/S-2026-10-02-58d6bc4a.md`,
  `.superpowers/sdd/m8/ledger.md` (Messpunkte E-010, Budget, Rot-Logs), `.studio/events.jsonl`
  (Sessions, `spawn`, `result`, `budget`), `.studio/archiv/berichte/20261002-143132-lead-art-ab655ef73d9072260.md`
  (H-R1), `.studio/archiv/berichte/20261002-160700-lead-art-a8346ddaf0862be39.md` (H-R2),
  `docs/studio/rulings.md` R144–R165
- Umfang: ein Coach-Start, rund 20 Tool-Aufrufe. Begründung: drei laufende Experimente enden mit
  M8 und brauchen ein Urteil, deshalb mehr als bei einer Kurz-Retro. Leads wurden nicht befragt,
  weil L0 keine Agent-IDs übergeben hat. Stattdessen gelten Ledger und Archiv-Berichte. Zur Session
  gibt es eine eigene Kurz-Retro: [2026-10-02-session-58d6bc4a.md](2026-10-02-session-58d6bc4a.md).

## Befunde

### B1 · Qualität hoch, Schätzung der Werkzeugaufrufe zu niedrig

- Beobachtung: Die Erstabnahme-Quote liegt bei 88 %. Es gab 2 Nacharbeiten (8 %), nichts wurde
  verworfen, kein Agent ist gescheitert. Die Dauer wurde gut getroffen: −9,5 % über 15 Agenten.
  Bei den Werkzeugaufrufen lag das Ist bei 1510 gegenüber 1049 geschätzt (+44 %). In der Session lag
  die Dauer +39,4 % über der Schätzung, die Werkzeugaufrufe bei 2329 statt 1062 (+119 %).
- Beleg: `metriken/M8.md` (Qualität, Schätzung gegen Ist), `metriken/S-2026-10-02-58d6bc4a.md`.
- Deutung: Die Session-Abweichung kommt vor allem von lead-art. Dort liefen 16 Agenten in 385 min,
  3 Pakete, mehrere Fix-Runden und Fortsetzungen. Fortsetzungen buchen auf die erste Schätzung
  (lernen.md). Ein Einzelfall, noch kein Muster für ein neues Experiment. E-001 bleibt behalten.

### B2 · Fehler bei der Ergebnis-Erfassung verzerren die Erstabnahme

- Beobachtung: H-R2 `art-rendering-engineer` ist als `angenommen` mit 3 Runden erfasst
  (richtig wäre `nacharbeit`). M8-B1 ist als `nacharbeit` mit 1 Runde erfasst (bei Nacharbeit sind
  es mindestens 2). Für M8-U steht ein zweites `result` mit dem Arbeiter qa-playtester
  (Ledger C2-3).
- Beleg: `result`-Events 16:06, 17:08 und 17:14 in `.studio/events.jsonl`; Ledger „Logging-Fehler
  C2-3“.
- Deutung: Die Quote stimmt auf ±1 Ergebnis. Die Erfassungsregel steht im Handbuch
  (verbesserung.md, Tabelle „Endurteil“). Es fehlt an der Prüfung, nicht an der Regel. Siehe
  Beobachtung für lead-production in der Session-Retro.

### B3 · Drei Experimente am Ende ihres Zeitraums

Die Bewertung folgt unten. Kurzfassung: E-007 und E-008 erfüllen ihre Hauptschwelle. E-010 ist
nur in der Summe beider Controller erfüllt, Controller 2 allein liegt darüber.

## Befragung der Leads

- Keine. Agent-IDs der Leads lagen nicht vor. Ersatz: Ledger M8 (lead-tech, beide Controller),
  Archiv-Berichte lead-art H-R1 und H-R2.

## Vorschläge

Die drei Vorschläge kommen aus den Session-Befunden und stehen in der
[Session-Retro](2026-10-02-session-58d6bc4a.md) (E-011 bis E-013). M8 selbst bringt keinen
zusätzlichen Vorschlag.

## Bewertung laufender Experimente

- **E-010 Controller-Wechsel.** Messpunkte laut Ledger:
  - M-1, Controller 1 (5 Tasks): 2,31 Mio. je Task, unter der Schwelle von 3,5 Mio.
  - M-2, Final-Review-Fixes: 0. Begleitwert bis zum Gate: 0,66 Mio.
  - M-3, Controller 2 (3 Tasks): 4,21 Mio. je Task. Ohne den Anteil bis M-2 sind es 3,99 Mio.
    Beides liegt über der Schwelle.
  - Summe beider Controller: 24,16 Mio. auf 8 Tasks = 3,02 Mio. je Task, unter der Schwelle. Der
    Ausgangswert M7-UX war 5,02 Mio. (−40 %).
  - Abbruchkriterien nicht ausgelöst: 0 Widersprüche zwischen den Rulings, 0 Rückfragen.
  - Störgrössen bei M-3: Der Controller wartete über den 5-h-Reset mit vollem Kontext. Er
    erledigte Arbeit ausserhalb der Tasks (Diagnose W-T6-1, W6-Merge, QA-B-Ablage, D1 selbst
    geschrieben, main-Merges). Die Messung musste aus dem Transkript gerechnet werden, weil
    metrics.py keine Zeile je Agent liefert.
  - Deutung: Der Wechsel wirkt. Die Schwelle war aber mehrdeutig formuliert („beider Controller je
    Task“: als Summe oder je Controller).
  - Empfehlung **angepasst**: Wechsel behalten. Die Schwelle gilt ab jetzt je Controller (≤ 3,5 Mio.
    je Task). Zusätzlich übergibt der Controller vor einer Wartezeit über einen Reset. Er schreibt
    keine Doku-Pakete selbst, sondern delegiert sie. Neue Messung im nächsten Meilenstein mit mehr
    als 6 Tasks (M10). Voraussetzung ist die Tabelle „Tokens je Agent“ in metrics.py
    (Werkzeug-Paket lead-production). Ohne sie bleibt die Wirkung nur von Hand messbar.
- **E-008 Ein Gate für Folgepakete.**
  - Gemessene Pakete: BUG-LICHT, H-R1, H-R2 (je ein kombiniertes Gate: R145, R149, R157).
  - Starts bis zum ersten Code: je 2, nämlich der Lead und ein Implementierer (`spawn` 13:33,
    13:57, 14:54). Ausgangswert 7, Schwelle ≤ 4: **erfüllt**.
  - Gegenprobe Spec- oder Plan-Lücke: 0 BEDENKEN mit dieser Ursache, **erfüllt**.
  - Gegenprobe Erstabnahme: 1 von 3 Paketen, also 33 % statt der geforderten 50 %: **verfehlt**.
    Ursachen: Bei H-R1 eine Review-Fix-Runde wegen Seed-Versätzen. Bei H-R2 eine visuelle Auflage
    von L0 (R160) und ein Farbfehler. Beides betrifft Code oder Bild, nicht die Gate-Form.
  - Empfehlung **behalten**. Den Vorbehalt bei der Erstabnahme entscheidet L0.
- **E-007 Eine aktive L0-Session.**
  - Übergänge: 2042a460 → 58d6bc4a ohne Überlappung (12:02:13,137 → 12:02:13,242). Die
    2 min von 2a96d607 waren nur lesend und sind schon im Zwischenstand M7-UX erfasst.
  - Klassen (a)–(c): je 0. Die 66 Ruling-Überschriften haben keine doppelte Nummer, der Ausgangswert
    war 2/4/1.
  - Offen: Der Warnblock im Start-Hook (Werkzeug-Paket) ist nicht umgesetzt. `context.py` enthält
    keine Session-Warnung.
  - Empfehlung **behalten**: Die Regel wirkt auch ohne Werkzeug. Das Werkzeug-Paket bleibt
    optional.

## Änderungen an lernen.md

- Neu: Budget-Phase entspricht genau der Paket-ID. Die Rebase-Zeile ist ergänzt (Guard erkennt
  `pull --rebase` nicht, Rebase nie anweisen). Pages-Warteschlange und `cancel-in-progress`.
- Gestrichen: keine. 24 von 40 Zeilen vorher.
