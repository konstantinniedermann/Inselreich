# Retros

Berichte der Retrospektiven des Studios ([Verfassung §10](../VERFASSUNG.md#10-verbesserungsprozess-grundzüge),
Ablauf im Handbuch [STUDIO.md](../STUDIO.md), Abschnitt „Verbesserungsschleife").

- **Zweck:** festhalten, was eine Retro gefunden hat, womit (Datenbasis) und welche Experimente sie
  vorschlägt. Ein Retro-Bericht ist die Datenbasis für jede Änderung am Handbuch oder an Personas.
- **Dateiname:** `retros/<datum>-<art>-<kurz>.md`, z. B. `2026-10-05-meilenstein-m5.md`,
  `2026-10-02-session-kurz.md`, `2026-10-03-adhoc-ci-rot.md`. Art ist `meilenstein`, `session` oder
  `adhoc`.
- **Vorlage:** [templates/retro.md](../templates/retro.md).
- **Wer schreibt:** der `studio-coach`. Danach loggt er die Retro mit
  `python3 tools/studio/log.py retro --id <id> --kind <art> --triggers <vorfall-ids> --report docs/studio/retros/<datei>.md`;
  die genannten Vorfälle gelten damit als erledigt.
- Retro-Berichte werden committet und nicht nachträglich geändert.
