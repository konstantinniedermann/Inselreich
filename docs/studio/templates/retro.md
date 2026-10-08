# Vorlage: Retro-Bericht

Für jede Retrospektive des `studio-coach`. Ablage unter `docs/studio/retros/<datum>-<art>-<kurz>.md`
([retros/README.md](../retros/README.md)); Ablauf im Handbuch
[verbesserung.md](../verbesserung.md#verbesserungsschleife). Kurz-Retro am Session-Ende: nur die Abschnitte mit Inhalt, höchstens eine
Seite.

```markdown
# Retro <art> <kurz> — <datum>

- Datum: <JJJJ-MM-TT>
- Art: <meilenstein|session|adhoc>
- Auslöser: <Meilenstein-ID, Session-Ende oder Vorfall-IDs, z. B. failed:tech-ui-engineer, ci:123456>
- Datenbasis: <Pfade, z. B. docs/studio/metriken/M5.md, .studio/archiv/berichte/…, docs/studio/rulings.md>

## Befunde

### B1 · <Kurztitel>

- Beobachtung: <was passiert ist>
- Beleg: <Zahl oder Zitat mit Pfad>
- Wirkung: <was es gekostet oder gebracht hat>

## Effizienz-Ampel

Pflicht in jeder Retro. Quelle: Abschnitt „Effizienz“ der Metrik-Datei (`python3 tools/studio/metrics.py --efficiency`), Schwellen in [verbesserung.md](../verbesserung.md#messung-und-aufwand). Je gelber oder roter Zeile ein Befund mit Ursache (Beobachtung und Deutung getrennt); Je gelber oder roter Zeile ist die Spalte „Hebel oder Messauftrag mit Frist“ Pflicht (R316): ein Hebel (E-/R-Nr.) oder ein Messauftrag mit Verantwortlichem und Frist (Datum oder Session), der bis dahin die Ursache belegt. „Ursache unbelegt“, „Hypothese“ und „Plätze belegt“ sind kein Abschluss; ohne Beleg folgt ein Messauftrag. Steht dieselbe Zeile in der dritten Retro in Folge gelb oder rot, ist ein Hebel-Vorschlag an L0 Pflicht, eine Begründung statt eines Vorschlags entfällt.

| Kennzahl   | Wert   | Ampel         | Befund / Ursache          | Hebel oder Messauftrag mit Frist                      |
| ---------- | ------ | ------------- | ------------------------- | ----------------------------------------------------- |
| <Kennzahl> | <Wert> | grün/gelb/rot | <B-Nr. oder „–“ bei grün> | <E-/R-Nr. oder Messauftrag bis <Frist>; „–“ bei grün> |

## Befragung der Leads

- <lead>: <Kurzfassung der Antwort> (oder „nicht erreichbar, Archiv-Bericht <pfad> gelesen")

## Vorschläge

Höchstens 3, jeder als Experiment nach [templates/experiment.md](experiment.md) (oder „keine").

## Bewertung laufender Experimente

- E-<nnn>: <Messwert gegen Schwelle> → <weiter beobachten|behalten|angepasst|zurückgenommen>
  (oder „keine laufenden Experimente")

## Änderungen an lernen.md

- neu: <Zeile> · gestrichen: <Zeile> (oder „keine")
```

Danach loggt der Coach die Retro (quittiert die genannten Vorfälle):

```bash
python3 tools/studio/log.py retro --id R-<datum>-<kurz> --kind <art> --triggers <id1>,<id2> --report docs/studio/retros/<datei>.md
```
