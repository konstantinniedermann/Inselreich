# Vorlage: Experiment

Jeder Vorschlag des `studio-coach` ist ein Experiment. Der Coach nennt es im Retro-Bericht und
trägt es gleich mit Status `vorgeschlagen` in [experimente.md](../experimente.md) ein; nach dem
Ruling von L0 wird es `laufend` oder `abgelehnt`. Ablauf im Handbuch [STUDIO.md](../STUDIO.md),
Abschnitt „Verbesserungsschleife".

```markdown
## E-<nnn> · vorgeschlagen · <Kurztitel>

- Hypothese: <wenn wir X ändern, dann verbessert sich Y>
- Messgrösse: <Kennzahl mit Schwelle>
- Zeitraum: <wie lange beobachtet wird>
- Rückfall: <exakter Zustand/Version>
- Dateien: <betroffene Dateien>
- Ruling: –
- Start: –
- Bewertung: –
```

## Felder

| Feld       | Pflicht | Inhalt                                                                                                                                                           |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kopfzeile  | ja      | `E-<nnn>` fortlaufend, Status (`vorgeschlagen` → `laufend` → `behalten`/`angepasst`/`zurückgenommen`, oder `abgelehnt`), Kurztitel                               |
| Hypothese  | ja      | Was sich ändert und welche Wirkung erwartet wird, in einem Satz.                                                                                                 |
| Messgrösse | ja      | Kennzahl aus Dashboard oder `docs/studio/metriken/` **mit Schwelle**, z. B. „Annahmequote erster Wurf ≥ 70 % über ≥ 4 Ergebnisse".                               |
| Zeitraum   | ja      | Wie lange beobachtet wird, z. B. „bis Ende M6" oder „die nächsten 3 Sessions".                                                                                   |
| Rückfall   | ja      | Exakter Zustand, zu dem bei Misserfolg zurückgekehrt wird, z. B. „Handbuch 1.0, Abschnitt Briefing-Standard" oder „Persona lead-tech 1.0 (`git show <commit>`)". |
| Dateien    | ja      | Alle betroffenen Dateien (Handbuch, Personas, Vorlagen, Dashboard).                                                                                              |
| Ruling     | ja      | R-Nummer des L0-Entscheids; `–`, solange vorgeschlagen.                                                                                                          |
| Start      | ja      | Handbuch-Version, mit der das Experiment beginnt (z. B. „Handbuch 1.1"); `–`, solange vorgeschlagen.                                                             |
| Bewertung  | ja      | Nach dem Zeitraum: Messwert gegen Schwelle und Urteil (`behalten`/`angepasst`/`zurückgenommen`) mit Ruling; bis dahin `–`.                                       |

## Prüffrage vor dem Vorschlag

**Verschlechtert das Experiment die Messbarkeit seiner Wirkung?** Wenn ja (z. B. es entfernt ein
Log-Event oder eine Kopfzeile, auf der die Messgrösse beruht), ist es kein gültiges Experiment und
wird nicht vorgeschlagen.

Weitere Leitplanken: höchstens 3 Experimente gleichzeitig `laufend`; jede Änderung braucht eine
Datenbasis (Metrik-Datei oder Retro-Bericht), ausser bei offensichtlichen Fehlern; die Verfassung
ist tabu (Vorschläge an sie gehen in die [Warteschlange](../warteschlange.md)).
