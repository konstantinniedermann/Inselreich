# Vorlage: Ruling

Eintrag für [rulings.md](../rulings.md) (neueste unten). Eine Entscheidung je Eintrag.

```markdown
## <Rn> · <JJJJ-MM-TT> · <Session oder Meilenstein>

Ruling: <was> — <warum> — <Kosten bei Irrtum>

Entscheider: <L0 | Nutzer> · Anlass: <Gate, Konflikt, Budget, Balancing …> · ADR: <Link oder „—">
```

Hinweise: „was" ist ein Satz, der ohne Kontext verständlich ist. „Kosten bei Irrtum" beschreibt,
was ein Rückgängigmachen kostet — das zeigt, wie sorgfältig die Entscheidung sein musste. Löst das
Ruling ein älteres ab, steht „löst R<n> ab" im Anlass.

## Beispiel

```markdown
## R12 · 2026-10-02 · M5

Ruling: Marktplatz-Radius 6 Kacheln — hält den Balancing-Test grün und deckt ein Dorf von 20
Häusern ab — Wert in `src/sim/defs/` ändern plus Balancing-Test anpassen (ein Commit).

Entscheider: L0 · Anlass: Entscheidungsbedarf aus Bericht M5-02 · ADR: —
```
