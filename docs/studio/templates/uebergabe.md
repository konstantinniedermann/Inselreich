# Vorlage: Übergabe

Querabstimmung zwischen Leads oder Zwischenstand beim Pausieren. Ablage:
`<Hauptrepo>/.studio/handoffs/<datum>-<von>-<an>.md` (gitignored; nicht im Worktree, Hauptrepo via
`git rev-parse --git-common-dir`). Ergebnisse mit Bestand gehören danach in
Spec, Plan oder Ruling.

```markdown
# Übergabe <von> → <an>

Datum: <JJJJ-MM-TT> · Paket: <id>

## Anlass

<warum diese Übergabe>

## Ergebnis und Artefakte

- <pfad oder Commit> — <was darin steht>

## Offene Fragen

1. <Frage> — Vorschlag: <Antwort>

## Erwartete Antwort

<was, in welcher Form> bis <Zeitpunkt oder Ereignis, z. B. „vor Gate Plan">
```

## Beispiel

```markdown
# Übergabe lead-design → lead-tech

Datum: 2026-10-01 · Paket: M5-spec

## Anlass

Spec Marktplatz fertig; vor dem Plan braucht Design eine Einschätzung zum Save-Format.

## Ergebnis und Artefakte

- `docs/superpowers/specs/2026-10-01-marktplatz-design.md` — Regeln, Werte, Abnahmekriterien

## Offene Fragen

1. Braucht das neue Feld `supplied` eine Save-Migration? — Vorschlag: ja, Version 3 mit Test.

## Erwartete Antwort

Kurzurteil im Gate-Spec-Bericht an L0, vor Gate Spec.
```
