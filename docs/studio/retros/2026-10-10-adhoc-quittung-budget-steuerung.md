# Quittung fälliger Retros: Budget lead-qa und Steuerungsanteil (ad hoc)

- Datum: 2026-10-10
- Art: adhoc (Quittung ohne neue Vorschläge)
- Auslöser: `budget:lead-qa:release-check-REL-14` („Budget von lead-qa überschritten: 4 von 2“),
  `ampel:steuerung:S-2026-10-10-2cfa57e0` („Ampel Steuerungsanteil in zwei Sessions in Folge rot“,
  S-2026-10-10-c64c0775, S-2026-10-10-2cfa57e0)
- Datenbasis: `python3 tools/studio/metrics.py --efficiency` (44 Sessions), `model.build_state` auf
  `.studio/events.jsonl` (Budgetsicht `lead-qa`), `docs/studio/rulings.md` R440, R443, R471

## Budget lead-qa „4 von 2“

- Beobachtung: Die Freigabe `release-check-REL-14` (2 Starts, Session c64c0775) zählt 4 Starts
  (2 opus, 2 sonnet). Die Freigabe `release-check-REL-15` steht erst 07:15:22 im Log, nach Start und
  Ende der zwei Arbeiter des REL-15-Release-Checks (07:10:15, 07:10:27); ohne Namenstreffer zählt das
  Dashboard sie auf die jüngste Freigabe derselben Rolle, also auf REL-14.
- Deutung: Kein Überzug, sondern Freigabe nach dem Start; abgedeckt durch
  [Retro session-c64c0775-b-ende](2026-10-10-session-c64c0775-b-ende.md) B1 und R440
  („L0-Versäumnis“), Hebel E-055 (Warnung bei Lead-Start ohne Freigabe, übernommen als Werkzeug R443,
  TOOL-BUENDEL-3). Die damalige Retro hat nur `meilenstein:REL-15` quittiert; diese Quittung holt den
  Budget-Vorfall nach.

## Steuerungsanteil zwei Sessions in Folge rot

- Beobachtung: Historie roh 51,6 % rot, bereinigt 44,8 % gelb (herausgerechnet 6,7 %, davon Plan
  1,5 %, Gate 0,1 %). Die Bereinigung greift nur bei Freigabephasen mit Präfix `plan-`, `design-`,
  `gate-` (`tools/studio/efficiency.py` Z. 96, Phase aus der Freigabe über `model.lead_phases`).
- Deutung: Abgedeckt durch [Retro session-5a00a316-ende](2026-10-10-session-5a00a316-ende.md) B2 und
  R471: V1 (Phasenpräfix, umgesetzt mit Handbuch 1.45) behebt den Messfehler, E-054 (Pläne auf
  sonnet) ist der Kostenhebel; E-049 misst. Die Pflicht aus R316 gilt mit R471 als erfüllt. Kein
  neues Experiment; Prüfpunkt: nächste Session mit Plan- oder Gate-Start zeigt herausgerechnete
  Instanzen > 0 (V1-Messgrösse).
