# Vorlage: Ruling

Eintrag für [rulings.md](../rulings.md) (neueste unten). Eine Entscheidung je Eintrag.

```markdown
## <Rn> · <JJJJ-MM-TT> · <Session oder Meilenstein>

Ruling: <Entscheid in 1–3 Sätzen> — <warum> — <Pfad zu Bericht, Plan oder Retro>

Regelbezug: <Handbuchstelle (STUDIO.md, gates.md …), die das Ruling anwendet oder von der es abweicht; sonst „—"> · Kosten bei Irrtum: <was ein Rückgängigmachen kostet>

Entscheider: <L0 | Nutzer> · Anlass: <Gate, Konflikt, Budget, Balancing …> · ADR: <Link oder „—">
```

Hinweise (R129, R429):

- **Pflichtfelder „Regelbezug“ und „Kosten bei Irrtum“** (eigene Zeile). Weicht das Ruling vom Handbuch ab,
  folgt im selben Zug ein Handbuch-Minor (Auftrag an `studio-coach`).
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
Häusern ab — Bericht lead-design M5-02.

Regelbezug: — · Kosten bei Irrtum: ein Commit (Wert in `src/sim/defs/` und Balancing-Test zurück)

Entscheider: L0 · Anlass: Entscheidungsbedarf aus Bericht M5-02 · ADR: —
```
