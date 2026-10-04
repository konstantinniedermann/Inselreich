# Vorlage: Playtest-Report

Bericht von `qa-playtester` nach einem Browser-Check (Idee: CCGS-Playtest-Report, siehe
[herkunft.md](../herkunft.md)). Ablage neben den Screenshots im **Hauptrepo** (nicht im Worktree) unter
`<Hauptrepo>/.studio/qa/<paket>/report.md`;
die Kurzfassung geht als Bericht an den Lead.

```markdown
# Playtest <paket>

Datum: <JJJJ-MM-TT> · Build/Commit: <hash> (<branch/worktree>) · Server: <URL> · Fenster: <b×h>

## Szenario

<Was geprüft wird und welches Abnahmekriterium es abdeckt>

## Schritte

1. <Aktion> → erwartet: <…>
2. <Aktion> → erwartet: <…>

## Beobachtungen

- <was tatsächlich passierte, je Schritt>

## Screenshots

- `.studio/qa/<paket>/<datei>.png` — <was zu sehen ist>

## Befunde nach Schwere

| Schwere  | Befund | Schritt | Screenshot |
| -------- | ------ | ------- | ---------- |
| blockend | <…>    | <n>     | <datei>    |
| hoch     | <…>    | <n>     | <datei>    |
| niedrig  | <…>    | <n>     | <datei>    |

## Empfehlung

<OK | BEDENKEN [Liste] | ZURÜCK [Grund]> — <ein Satz>
```

Schwere: **blockend** = Abnahmekriterium verfehlt oder Absturz · **hoch** = Spielerlebnis leidet
deutlich · **niedrig** = Kosmetik. Befunde ausserhalb des Pakets gehen nach
`docs/beobachtungen.md`.

**Release-Lauf (E-028):** Der Report gilt für einen Kandidaten aus mehreren Branches (`<paket>` = `REL-nn`,
Commit des Kandidaten, Branches im Kopf). Die Abschnitte Szenario bis Befunde stehen **je UI-Task**
(Überschrift `## UI-Task <ID>`), Screenshots unter `.studio/qa/REL-nn/<ui-task>/`; die Empfehlung am
Schluss gilt für den Kandidaten. Am Ende steht die Prüfliste „UI-Task → Screenshot-Pfad“, die das Gate
Merge Release abgleicht ([gates.md](../gates.md#gate-merge-release)); ein UI-Task ohne Pfad ist blockend.

## Beispiel

```markdown
# Playtest M5-03

Datum: 2026-10-02 · Build/Commit: a1b2c3d (.worktrees/m5-ui) · Server: http://127.0.0.1:5174/ · Fenster: 1280×800

## Szenario

Versorgungsanzeige im Info-Panel (Abnahmekriterium 3 der Spec).

## Schritte

1. Marktplatz und Haus im Radius bauen, Haus anklicken → erwartet: „versorgt" im Panel.
2. Marktplatz abreissen → erwartet: „nicht versorgt".

## Beobachtungen

- Schritt 1 wie erwartet; Schritt 2 zeigt den Wechsel erst nach erneutem Anklicken.

## Screenshots

- `.studio/qa/M5-03/schritt-2.png` — Panel zeigt noch „versorgt"

## Befunde nach Schwere

| Schwere | Befund                                    | Schritt | Screenshot    |
| ------- | ----------------------------------------- | ------- | ------------- |
| hoch    | Panel aktualisiert sich nicht nach Abriss | 2       | schritt-2.png |

## Empfehlung

BEDENKEN [Panel-Aktualisierung] — Kriterium erfüllt, aber verzögert sichtbar.
```
