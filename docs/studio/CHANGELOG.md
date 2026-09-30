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

## 2026-09-30 · Persona tech-ui-engineer 1.5

- Anlass: Ruling R78 (Desktop-first, Nutzeranweisung)
- Datenbasis: `docs/studio/rulings.md` R78
- Ruling: R78
- Änderungen: mobile-first → desktop-first ab 1280 px (Beschreibung, Persona, Regeln); Qualitätsmassstab: bedienbar bei 1280 und 1920 px, schmale Fenster nur „stürzt nicht ab, nichts Wesentliches unerreichbar“; `roster.md` Zweck und Version

## 2026-09-30 · Persona qa-playtester 1.4

- Anlass: Ruling R78 (Desktop-first, Nutzeranweisung)
- Datenbasis: `docs/studio/rulings.md` R78
- Ruling: R78
- Änderungen: Standard-Fenstergrössen 1280×800 und 1920×1080, schmales Fenster nur als Absturzprobe; `templates/playtest-report.md` Beispiel auf 1280×800; `roster.md` Version

## 2026-09-30 · Handbuch 1.7

- Anlass: Retro Meilenstein M5 (Vorschläge 1 bis 3)
- Datenbasis: `docs/studio/retros/2026-09-30-meilenstein-m5.md` (B2, B4, B5, B6), `docs/studio/metriken/M5.md`
- Ruling: R75
- Änderungen: Briefing-Standard — Schätzung mit Werkzeugaufrufen als Hauptgrösse, Minuten abgeleitet, Kopfzeile nennt die Tabellenzeile aus `metriken/richtwerte.md` (E-001 angepasst); Autonomie Schritt 2 — Zweck-Gegenprobe im Auslegungs-Ruling (E-003 laufend); Umsetzungszyklus — kein Report-Dateipfad für Final-Review und Playtests, Edit/Write-Regel für Code und Code-nahe Mehrzeiler mit Ausnahme reiner Textgenerierung in Doku per Skript; `templates/briefing.md` (Kopfzeile, Deliverable-Hinweis, Beispiel); `lernen.md` Edit/Write-Zeile ergänzt

## 2026-09-30 · Handbuch 1.6

- Anlass: Ruling R71 (Korrektur von R69): Modellwahl nach Aufgabe, kein Limit-Downgrade
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Modellstufen-Tabelle (opus/sonnet/haiku nach Aufgabe) wiederhergestellt, Satz zum Nutzungslimit ergänzt; Abschnitt „Limits und Sessiongrösse“ bleibt; `roster.md`: Modelle zurück, Versionsspalte auf aktuelle Persona-Versionen

## 2026-09-30 · Persona lead-art 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona lead-design 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona lead-production 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona lead-qa 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona lead-tech 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: Arbeiter-Tabelle auf den Stand vor 83d3f77 (Modell nach Aufgabe)

## 2026-09-30 · Persona qa-code-reviewer 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Persona tech-ui-engineer 1.4

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Persona qa-playtester 1.3

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Persona production-integrator 1.3

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Persona tech-sim-engineer 1.3

- Anlass: Ruling R71
- Datenbasis: `docs/studio/rulings.md` R71
- Ruling: R71
- Änderungen: `model: opus` → `model: sonnet` (Stand vor 83d3f77)

## 2026-09-30 · Handbuch 1.5

- Anlass: Übertragung der Rulings R68 und R69; lernen.md geprüft, kein Widerspruch
- Datenbasis: `docs/studio/rulings.md` R68–R69
- Ruling: R68, R69
- Änderungen: „Modellwahl“: Standard opus für alle Rollen, kein Downgrade; neuer Abschnitt „Limits und Sessiongrösse“ (Limit-Sensor beschrieben, Paket STUDIO-LIMIT in Arbeit; Herunterfahren in L0-Verantwortung, Richtwerte 60/80 %; Wochenfenster > 80 %: Parallelität reduzieren; Sessiongrösse ≈ ein Abschnitt, Übergabe spätestens bei 50 % Kontext); `roster.md` auf opus

## 2026-09-30 · Persona lead-tech 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona lead-art 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona lead-design 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona lead-production 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona lead-qa 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: Arbeiter-Tabelle: Modell opus

## 2026-09-30 · Persona qa-code-reviewer 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona tech-ui-engineer 1.3

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona qa-playtester 1.2

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona production-integrator 1.2

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona tech-sim-engineer 1.2

- Anlass: Ruling R69 (opus für alle Rollen)
- Datenbasis: `docs/studio/rulings.md` R69
- Ruling: R69
- Änderungen: `model: sonnet` → `model: opus`

## 2026-09-30 · Persona lead-tech 1.2

- Anlass: Ruling R67 (Abhängigkeiten per L0-Ruling und ADR, Parallelisierung als oberstes Prinzip)
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Laufzeit-Abhängigkeit nur mit ADR und L0-Ruling (Antrag an L0 statt Nutzer-Entscheid); Parallelisierungsprinzip

## 2026-09-30 · Persona lead-art 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Parallelisierungsprinzip als oberstes Arbeitsprinzip

## 2026-09-30 · Persona lead-design 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Parallelisierungsprinzip als oberstes Arbeitsprinzip

## 2026-09-30 · Persona lead-production 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Parallelisierungsprinzip als oberstes Arbeitsprinzip

## 2026-09-30 · Persona lead-qa 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Parallelisierungsprinzip als oberstes Arbeitsprinzip

## 2026-09-30 · Persona qa-code-reviewer 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Laufzeit-Abhängigkeiten nur mit ADR und L0-Ruling

## 2026-09-30 · Persona tech-ui-engineer 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Laufzeit-Abhängigkeiten nur mit ADR und L0-Ruling

## 2026-09-30 · Persona design-spec-author 1.2

- Anlass: Ruling R67
- Datenbasis: Auftrag STUDIO-R67, `docs/studio/rulings.md`
- Ruling: R67
- Änderungen: Laufzeit-Abhängigkeiten nur mit ADR und L0-Ruling

## 2026-09-30 · Handbuch 1.4

- Anlass: Übertragung der Rulings R65 (Tempo), R66 (Übergabe vor Pause) und R67 (Antwort auf N-001); Retro session-25e8352d
- Datenbasis: `docs/studio/rulings.md` R65–R67, `docs/studio/retros/2026-09-30-session-25e8352d.md`
- Ruling: R65, R66, R67
- Änderungen: neuer Abschnitt „Arbeitsprinzipien und Tempo“ (Parallelisieren als oberstes Prinzip, Tempo-Vorgaben); „Autonomie“: Vorbehaltsliste ohne Abhängigkeiten, L0-Ruling plus ADR, `dep-guard` nie umgehen, Beispiele ohne Pfadsuch-Bibliothek, Verweise auf Verfassung 1.1 §5.7/§5.8; Briefing-Vorlage mit neuem §3-Block (Verfassung 1.1); „Session-Start und -Ende“: Schritt 0, `state.md` vor jeder Pause nachführen

## 2026-09-30 · Handbuch 1.3

- Anlass: Merge S17 (Telemetrie je Session, CI-Reruns, keine Phantom-Knoten); Handbuch beschrieb die alte Zählung (offensichtlicher Fehler, kein Experiment)
- Datenbasis: `docs/studio/retros/2026-09-30-adhoc-budget-lead-tech.md`, `docs/studio/retros/2026-09-30-adhoc-ci-pages.md`, `docs/studio/retros/2026-09-30-adhoc-inaktiv-web-fetch.md`, `docs/beobachtungen.md` (Nachträge Final-Review S17), `tools/studio/model.py`
- Ruling: R58
- Änderungen: „Budget“: Freigabe gilt je Session (nach `/clear` neu loggen), Zählung je Lead, Phase und Session, Start vor der ersten Freigabe zählt nicht, „ohne Freigabe“; Vorfall erst bei > 1,5 × Freigabe, Parallel-Überschreitung nur rot; „Messung“: laufender Meilenstein je Session; „Verbesserungsschleife“: grüner Rerun schliesst `ci:<run>`; „Logging-Pflicht“: `bind` ohne bekannten Agenten erzeugt keinen Knoten, Budgetfreigabe je Session; `lernen.md` bereinigt

## 2026-09-30 · Handbuch 1.2

- Anlass: Retro Meilenstein Studio-Graph, Befund B2 (Basis-Drift durch parallele L0-Sessions)
- Datenbasis: `docs/studio/retros/2026-09-30-meilenstein-studio-graph.md`, `docs/studio/rulings.md` R43, R52
- Ruling: R55
- Änderungen: Abschnitt „Session-Start und -Ende“ um „Parallele L0-Sessions“ ergänzt (Datei-Eigentum und Merge-Reihenfolge in `state.md`, Planung gegen fremde Pfade erst nach deren Merge); `state.md` mit Abschnitt „Parallele Sessions“; Experiment E-002

## 2026-09-30 · Handbuch 1.1

- Anlass: Retro Meilenstein Studio-Graph, Befund B1 (Schätzungen 5- bis 20-fach zu hoch)
- Datenbasis: `docs/studio/metriken/Studio-Graph.md`, `docs/studio/retros/2026-09-30-meilenstein-studio-graph.md`
- Ruling: R54
- Änderungen: Briefing-Standard: Schätzung aus Richtwerten statt Menschenzeit; neu `docs/studio/metriken/richtwerte.md`; Hinweis in `templates/briefing.md`; Experiment E-001

## 2026-09-30 · Persona art-license-checker 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona design-economy-designer 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona design-spec-author 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-art 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-design 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-production 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-qa 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona lead-tech 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona production-integrator 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona qa-code-reviewer 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona qa-playtester 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona studio-coach 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona tech-sim-engineer 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Persona tech-ui-engineer 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert

## 2026-09-30 · Handbuch 1.0

- Anlass: Session 1.5 — Trennung Verfassung/Handbuch, Autonomie, Messung, Verbesserungsschleife
- Datenbasis: Auftrag des Nutzers
- Ruling: R22–R37
- Änderungen: Nutzerregeln (Feste Regeln, Asset-Regeln, Nutzer-Vorbehalte) in die Verfassung
  verschoben; Abschnitte Autonomie (Auslegung als Ruling, Warteschlange, Guard), Messung und
  Aufwand, Verbesserungsschleife mit Studio-Coach; Briefing-Kopfzeilen `Meilenstein` und
  `Schätzung`; neue Log-Befehle `result`, `milestone`, `retro`, `queue`, `decision` nur noch an
  L0; erweiterte Session-Start- und Session-Ende-Routine; alle Personas auf Version 1.0.
