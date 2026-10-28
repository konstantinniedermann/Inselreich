# T11 · Doku, ADR-010- und ADR-005-Nachtrag

Strang A (`.worktrees/nu1`, per `SendMessage` an Umsetzer B) · Persona `tech-ui-engineer` · Modell sonnet · ≈ 20 Tools · blocked-by: T10 · AK-NU1-33 (Review im Final-Review)
Spec §4 «Doku-Folgen», §3.5; R976 (3). Das Umsetzer-Briefing erlaubt die D1-Dateien ausdrücklich (E-017).

**Files:** `README.md` (Spielanleitung), `docs/spielwerte.md` (Abschnitt Expedition), `docs/arc42.md` (Bausteine, Tick-Ablauf, Persistenz), `docs/adr/ADR-010-zufall-je-periode.md` (Nachtrag), `docs/adr/ADR-005-tick-reihenfolge-und-zustaende.md` (Nachtrag). Nicht: Spec-Dateien, `docs/studio/`.

## Inhalt

- **README:** Kartenhaus (nach der Gewürzstadt, Kosten aus der Def), Expedition ausrüsten (Schiff, Ladung, Proviant 3 Nahrung je Abschnitt), Wahl-Karten mit Bedingung, Umweg, Umkehren, Fund nur bei geschaffter Fahrt, Fundstück-Liste in der Seekarte. Zahlen aus `src/sim/defs/`, nicht abgeschrieben aus der Spec.
- **`docs/spielwerte.md`:** Tabelle der Konstanten aus `defs/expedition.ts`, Gebiete (Abschnitte, Kartenstellen, Dauer), Fundstücke mit Wirkung und Prüfwert.
- **arc42:** Bausteine `finds.ts`, `expeditionCore.ts`, `expedition.ts`, `expeditionSave.ts` (je ein Satz, Importregel: `ships.ts` → `expeditionCore.ts`, nie `expedition.ts`); Tick-Ablauf `tickShips` → `tickExpedition` (Mermaid ohne `\n` in Labels); Persistenz: Felder `expedition`, `seaRevealed`, `finds`, Kappung beim Laden (R979 N2).
- **ADR-010-Nachtrag** im Wortlaut R976 (3): «Expeditions-Karten: eigener Salt, Schlüssel Seed × Gebiet, gezogene Folge als Ergebnis im Save, kein Zähler, kein RNG-Zustand»; Salt `0xc2b2ae35`, Formel aus `drawCards`.
- **ADR-005-Nachtrag:** `tickExpedition` direkt nach `tickShips`; Anlegen in `boarding` innerhalb von `tickShips`; Wirkbeginn der Fundstücke (P-5).

## Schritte

- [ ] Texte schreiben; `make docs-check; echo EXIT=$?` → 0.
- [ ] Commit `docs: NU-1 README, Spielwerte, arc42, ADR-010/ADR-005-Nachtrag (T11)`.
