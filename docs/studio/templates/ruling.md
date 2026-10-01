# Vorlage: Ruling

Eintrag für [rulings.md](../rulings.md) (neueste unten). Eine Entscheidung je Eintrag.

```markdown
## <Rn> · <JJJJ-MM-TT> · <Session oder Meilenstein>

Ruling: <Entscheid in 1–3 Sätzen> — <warum> — <Kosten bei Irrtum> — <Pfad zu Bericht, Plan oder Retro>

Entscheider: <L0 | Nutzer> · Anlass: <Gate, Konflikt, Budget, Balancing …> · ADR: <Link oder „—">
```

Hinweise (R129):

- **Richtwert ≤ 60 Wörter.** Das Ruling entscheidet und verweist; es erzählt nicht nach.
- „Entscheid" ist ohne Kontext verständlich. „Kosten bei Irrtum" beschreibt, was ein Rückgängigmachen
  kostet — das zeigt, wie sorgfältig die Entscheidung sein musste.
- **Nicht ins Ruling:** Listen aus Gate-Berichten, Planpflege-Punkte, Messwerte, Zeitabläufe. Sie
  stehen im Archiv-Bericht, Plan oder Retro-Bericht, auf den das Ruling verweist.
- **Kein Ruling für Abnahmen ohne Alternative:** Sie werden nur per `log.py result` erfasst.
- Löst das Ruling ein älteres ab, steht „löst R<n> ab" im Anlass.

## Beispiel

```markdown
## R12 · 2026-10-02 · M5

Ruling: Marktplatz-Radius 6 Kacheln — hält den Balancing-Test grün und deckt ein Dorf von 20
Häusern ab — Wert in `src/sim/defs/` ändern plus Balancing-Test anpassen (ein Commit) —
Bericht lead-design M5-02.

Entscheider: L0 · Anlass: Entscheidungsbedarf aus Bericht M5-02 · ADR: —
```
