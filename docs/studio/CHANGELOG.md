# Changelog des Studios

Verlauf aller Versionen des Handbuchs ([STUDIO.md](STUDIO.md)) und der Personas
(`.claude/agents/*.md`). Die Verfassung ([VERFASSUNG.md](VERFASSUNG.md)) hat keinen Eintrag hier; sie
ändert nur der Nutzer.

**Format** — neueste Einträge oben, je Änderung ein Eintrag:

```markdown
## <Datum JJJJ-MM-TT> · <Gegenstand> <Version>

- Anlass: <Retro, Vorfall oder Auftrag>
- Datenbasis: <Metrik-Datei, Retro-Bericht oder Auftrag>
- Ruling: <R-Nummer(n)>
- Änderungen: <Stichworte>
```

- **Gegenstand** ist `Handbuch` oder `Persona <name>` (z. B. `Persona lead-tech`).
- **Version:** Handbuch Minor (1.0 → 1.1) je angenommenem Experiment, Major (1.x → 2.0) bei einem
  Umbau der Organisation; Persona Minor je Änderung. Die Version im Kopf von STUDIO.md bzw. im
  Frontmatter-Feld `version` der Persona stimmt immer mit dem neuesten Eintrag überein (geprüft von
  `tools/studio/tests/test_docs.py`). Persona ohne Eintrag: Version 1.0.
- Frühere Fassungen stehen in Git.

## 2026-09-30 · Handbuch 1.0

- Anlass: Session 1.5 — Trennung Verfassung/Handbuch, Autonomie, Messung, Verbesserungsschleife
- Datenbasis: Auftrag des Nutzers
- Ruling: R22–R33
- Änderungen: Nutzerregeln (Feste Regeln, Asset-Regeln, Nutzer-Vorbehalte) in die Verfassung
  verschoben; Abschnitte Autonomie (Auslegung als Ruling, Warteschlange, Guard), Messung und
  Aufwand, Verbesserungsschleife mit Studio-Coach; Briefing-Kopfzeilen `Meilenstein` und
  `Schätzung`; neue Log-Befehle `result`, `milestone`, `retro`, `queue`, `decision` nur noch an
  L0; erweiterte Session-Start- und Session-Ende-Routine; alle Personas auf Version 1.0.
