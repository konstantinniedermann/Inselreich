# I-048 Zukauf-Aufschlag — Anhang 02: Last-Probe Schritt B (R555 c)

`lead-design` · Paket I-048-B · 2026-10-12 · Stand `main` c20c4f3a (`BUY_RISE` 0, Mechanik inaktiv; TOOL-GATE-ENSEMBLE
und TOOL-CONTROLLER-HAERTUNG auf `main`). **Ergebnis: Abbruchkriterium R555 (c) erfüllt → Option 1 (Verzicht).**

## Messweg

- Wegwerf-Worktree von `main` (Scratchpad, nach der Messung entfernt). `buy` in `src/sim/trade.ts` schreibt nach jedem
  **erfolgreichen** Kauf `(Test, Welt, Tick, Gut, n)` in ein globales Protokoll. Eine Setup-Datei schreibt das
  Protokoll je Testdatei. Spielwerte und Testerwartungen bleiben unverändert.
- Lauf: alle 69 Dateien unter `tests/sim/` grün (1230 Tests), dazu eine Probe-Datei für die Ensemble-Phasen
  0/20/40/60/80 (R556) des Basis-Controllers Seed 3 in den Krisenstufen `off`, `normal` (mit Feuerwache) und `mild`.
- Kennzahlen je Welt und Gut:
  - **60 s**: grösste Kaufmenge in einem gleitenden Fenster von 600 Ticks, also die Last in Einheiten/min.
  - **Zähler**: Höchststand des Kontingent-Zählers aus der Designfrage. Er steigt um 1 je gekaufte Einheit und sinkt
    um 1 je Erholungsintervall I (Boden 0). Das ist das Kontingent, das die Welt bitgleich hält.
  - Rechnung mit I = 10 Ticks (60/min) und I = 20 Ticks (30/min).

## Controller-Last je Gut

| Szenario (Welten)                        | Gut      | Summe   | grösstes Los | 60 s | Zähler I10 | Zähler I20 |
| ---------------------------------------- | -------- | ------- | ------------ | ---- | ---------- | ---------- |
| `balance` / Ensemble Seed 3, Phase 0–40  | Holz     | 81–95   | 15           | 71   | 36         | 46         |
| Ensemble Seed 3, Phase 60/80             | Holz     | 100     | 15           | 90   | 59         | 70         |
| Ensemble Seed 3, alle Phasen             | Werkzeug | 86–105  | 8            | 24   | 15         | 15         |
| Ensemble Seed 3, alle Phasen             | Stein    | 50–60   | 15           | 30   | 20         | 20         |
| `balance-edicts` **reich** (AK-M13E1-17) | Holz     | 301     | 20           | 292  | 242        | 271        |
| `balance-edicts` reich                   | Werkzeug | 107     | 10           | 107  | 60         | 82         |
| `balance-edicts` reich                   | Stein    | 135     | 20           | 120  | 78         | 95         |
| `balance-merchants` (6)                  | Gewürz   | 65      | 6            | 28   | 6          | 7          |
| `balance-merchants`, `balance-monument`  | Stein    | 254–259 | 20           | 47   | 20         | 46         |
| `goal3` AK-Z3-05 «nur Zukauf»            | Gewürz   | 156     | 8            | 48   | 8          | 62         |

- Der Basis-Controller kauft Holz in den ersten 50 s gebündelt (Tick 200–700: 71 Stück; Phase 60: Tick 160–560,
  90 Stück). Die Annahme der Designfrage (≈ 15 Einheiten/min über alle Güter, Lose ≤ 10) gilt nur im Mittel, nicht
  für die Spitzen.
- Der reiche Lauf aus `balance-edicts` (Startgeld + 20 000) kauft in 80 s 301 Holz, 107 Werkzeug und 135 Stein. Er
  ist genau der Spieler, den der Zielsatz treffen soll («wer jeden Engpass mit Geld löst»). R555 (a) verlangt aber,
  dass er bitgleich bleibt.

## Krisen-Last

`normal` und `mild`, Phasen 0–80: Holz 52–90 Stück in 60 s, Zähler I10 35–59 und I20 41–70; Werkzeug ≤ 24 und
Stein ≤ 30 Stück in 60 s. Krisen heben die Spitze je Gut nicht über die Spitze von `off` über alle Phasen. Die
Holz-Spitze kommt aus der Phase (60/80), nicht aus der Krise.

## Urteil nach R555 (c)

- **Controller-Last je Gut > 30/min: erfüllt.** Holz liegt bei 71–90/min im Basis-Controller und bei 292/min im
  reichen Lauf. Werkzeug (107) und Stein (120) liegen im reichen Lauf ebenfalls darüber.
- **Kontingent unter der Krisen-Last: erfüllt** für jedes Kontingent, das noch beisst. Bitgleich bleiben `balance`,
  Krisen und Ensemble erst mit einem Holz-Kontingent ≥ 59 (I10) bzw. ≥ 70 (I20). Der reiche Lauf braucht ≥ 242
  bzw. ≥ 271. Beides liegt über dem Bedarf einer Stadt-Insel je Minute (Anhang 01 c: > 30/min).
- Zusätzlich hätte das Kontingent auch in `balance-merchants` keine Wirkung. Gewürz kommt dort auf höchstens 28/min
  bei Zähler ≤ 7. Die Annahme aus Anhang 01 g («`feedSpice` > 30/min») trifft auf `main` nicht zu. Option 2 hätte also
  in keinem gegateten Szenario gebissen. Wo sie hätte beissen dürfen (Holz, Werkzeug, Stein beim reichen Spieler),
  verbietet R555 (a) die Wirkung.
- Folge laut R555 (c): **Option 1, Verzicht.** Es gibt kein neues Brainstorming und keine Werte, und die Werte-Probe
  (R565 P3) entfällt.

## Nicht weiterverfolgt (nur Hinweis)

Eine Staffel **nur für Konsumgüter** (Stoff, Rum, Glas, Gewürz) wäre gegen den Controller bitgleich: Er kauft sie kaum
(Gewürz Zähler ≤ 7). Sie träfe den Stadt-Käufer (`goal3` «nur Zukauf» 48/min). Das wäre eine andere Regel als
Option 2 und bräuchte ein eigenes Gate Brainstorming. R555 (c) schliesst sie für dieses Paket aus. Sie ist im
Ideen-Pool bei I-048 vermerkt.
