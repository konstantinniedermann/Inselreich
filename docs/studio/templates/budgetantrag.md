# Vorlage: Budgetantrag

Antrag eines Leads an L0 — mit dem Plan (Gate Plan) oder vor dem Überschreiten einer Freigabe.
Regeln: [STUDIO.md](../STUDIO.md), „Budget".

```text
Lead: <lead-…>
Phase: <name, z. B. M5-umsetzung>
Pakete:
- <id> <titel> (<UI ja/nein>)
- <id> <titel> (<UI ja/nein>)
Formel: <Pakete> × 2 + <QA-Checks> + 1 Final-Review = <summe> → × 1,3 = <wert> → aufgerundet <n>
Parallelität: <k> (Begründung: <Stränge/Worktrees>)
Bisher frei/verbraucht: <frei>/<verbraucht> (bei Mehrbedarf)
Begründung Mehrbedarf: <warum, z. B. zwei Reviews ZURÜCK, zusätzliche Fix-Runden> (sonst „—")
Beantragt: <n> Starts, Parallelität <k>
```

L0 gibt frei mit
`python3 tools/studio/log.py budget --lead <lead> --grant <n> --parallel <k> --phase <phase>`
und schreibt bei Mehrbedarf ein Ruling.

## Beispiel

```text
Lead: lead-tech
Phase: M5-umsetzung
Pakete:
- M5-01 Marktplatz-Gebäude (nein)
- M5-02 Versorgung im Radius (nein)
- M5-03 Versorgungsanzeige (ja)
- M5-04 Bauleiste Marktplatz (ja)
Formel: 4 × 2 + 2 + 1 = 11 → × 1,3 = 14,3 → aufgerundet 15
Parallelität: 2 (Stränge m5-sim und m5-ui)
Bisher frei/verbraucht: —
Begründung Mehrbedarf: —
Beantragt: 15 Starts, Parallelität 2 (davon 1 Final-Review an lead-qa)
```

Freigabe durch L0 (Aufteilung, Stufe voll):

```bash
python3 tools/studio/log.py budget --lead lead-tech --grant 14 --parallel 2 --phase M5-umsetzung
python3 tools/studio/log.py budget --lead lead-qa --grant 1 --parallel 1 --phase M5-umsetzung
```
