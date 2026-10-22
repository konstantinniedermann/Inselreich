# Retro adhoc hook — 2026-10-17

- Datum: 2026-10-17
- Art: adhoc
- Auslöser: Hook-Signale der Session 21273458 («Agent studio-director ist inaktiv», «Budget von lead-tech überschritten: 5 von 3», «Cache-Write 5 min in zwei Sessions in Folge rot: S-2026-10-16-66d37b15, S-2026-10-16-ca9d40c8»)
- Datenbasis: `docs/studio/rulings.md` R735, R750, R754 (sowie R-Eintrag zu «lead-qa inaktiv», Zeile 932), `docs/studio/retros/2026-10-16-session-ca9d40c8-ende.md`, `python3 tools/studio/metrics.py --efficiency`, `tools/studio/effort.py` (Vorfallsbildung, Zeilen 320–345). Kein Lead befragt (Budget 0 Starts).

## Befunde

### B1 · Budget lead-tech «5 von 3»: abgedeckt

- Beobachtung: Das Signal nennt denselben Stand wie R735 («TOOL-GUARD-REDACT/ALLOWLIST 5 von 3 + 3»).
- Beleg: `docs/studio/rulings.md` R735 (V1 Ansatzprüfung nach dem zweiten ZURÜCK/BEDENKEN, V3 kumulierter Stand «n von m»; Messgrössen bis 2026-11-30 bzw. 2026-11-15).
- Deutung: Abgedeckt, ja. Der Hook meldet einen bereits bewilligten Stand erneut; kein neuer Vorfall. Neues Budget für TOOL-BUENDEL-15 (5 Starts, R754) ist ein frisches Paket.

### B2 · Cache-Write 5 min zwei Sessions rot: abgedeckt

- Beobachtung: Historie 28,0 % (rot, Schwelle 25 %), davon Pause 12,5 %, übriges Wachstum 15,5 %; Session ca9d40c8 26,6 % mit Pause nur 3,9 %.
- Beleg: `--efficiency` (Zeilen «Cache-Write 5 min»), `docs/studio/retros/2026-10-16-session-ca9d40c8-ende.md` B4; R750 (V3 Wartepause, Bewertung 2026-10-30), E-068 (Review-Zahl), Messauftrag Tool-Ergebnisgrösse (studio-coach, Frist 2026-10-23).
- Deutung: Abgedeckt, ja. V3 ist mit Handbuch 1.63 umgesetzt (dieser Start); der Posten wird zunehmend vom Wachstum getragen, das V3 nicht trifft. Kein neuer Hebel ohne die Daten aus dem Messauftrag; der zweite Datenpunkt (Wachstum nach Rolle) liegt in der Retro ca9d40c8 vor. Eine weitere Bewertung vor 2026-10-23/-30 wäre Spekulation.

### B3 · «studio-director inaktiv»: neuer Befund, teils Hook-Artefakt

- Beobachtung: `effort.py` bildet einen Vorfall `inaktiv:<key>` für jeden Agenten ohne Heartbeat im Zeitfenster; die Rolle studio-director ist L0, die Hauptsession (`agent_id: main`, Ereignis `bind`). L0 ruft keine Tools auf, solange es auf Agenten wartet (R754: vier Pakete parallel gestartet).
- Beleg: `tools/studio/effort.py` Z. 330–345; `.studio/events.jsonl` (Session 21273458, `kind: bind`, role studio-director, 08:15:52Z); Präzedenz «lead-qa inaktiv» beim langen Make-Lauf: `docs/studio/rulings.md` Zeile 932 («kein Vorfall, Befund an die Retro, ob lange Läufe als Heartbeat zählen sollen»).
- Deutung: Neu, ja, Muster aus zwei Rollen (lead-qa, studio-director) bei legitimem Warten. Ob die Schwelle zu kurz oder die Rolle auszunehmen ist, belegen die Daten nicht (kein Wert zur Dauer geprüft). Hypothese, kein Befund über Ursache; Vorschlag ist ein Messauftrag.

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency` (Historie, 66 Sessions).

| Kennzahl                   | Wert                     | Ampel | Befund / Ursache                        | Hebel oder Messauftrag mit Frist                                          |
| -------------------------- | ------------------------ | ----- | --------------------------------------- | ------------------------------------------------------------------------- |
| Cache-Write 5 min          | 28,0 %                   | rot   | B2: Wachstum 15,5, Pause 12,5           | R750 V3 (jetzt Handbuch 1.63), E-068; Messauftrag studio-coach 2026-10-23 |
| L0-Kontext Max             | 774k                     | rot   | Historie; ca9d40c8 419k (Retro dort B5) | R750-Retro V3 Schnitt ab 300k, Bewertung in 2 Session-Retros              |
| Flake-Verdacht             | 9 (davon 6 bei Last ≥ 8) | rot   | Last, nicht Test (Retro ca9d40c8 B2)    | R750 V1 (TOOL-BUENDEL-15), Bewertung 2026-10-30                           |
| Steuerungsanteil bereinigt | 44,0 %                   | gelb  | lead-tech-Delegationszahl               | beobachten, E-068                                                         |
| opus-Anteil                | 67,8 %                   | gelb  | Pflicht-opus (Plan, Final-Review)       | kein Hebel                                                                |
| Grösste gelesene Datei     | 66,7 KB                  | gelb  | Historie, Session ca9d40c8 grün         | Messauftrag R708 erledigt (R712)                                          |

## Befragung der Leads

Keine; Archiv nicht gelesen (Budget 0 Starts).

## Vorschläge (Entwürfe an L0)

- **V1 · Messauftrag «inaktiv» für L0 und lange Wartephasen, Empfehlung annehmen.** Werkzeug-Bündel (nicht von mir): `effort.py`/Hook nimmt die Rolle studio-director aus `inaktiv:` aus, solange Kind-Agenten der Session aktive Heartbeats senden; lange Make-Läufe zählen als Heartbeat (Frage aus Zeile 932). Messgrösse: 0 `inaktiv`-Signale für studio-director und lead-qa mit laufendem Kind-Agent oder Make-Lauf über 3 Sessions, Frist 2026-10-30. Rückfall: Regel entfernen, Signal wie bisher. Verschlechtert die Messbarkeit nicht (Signal für echte Stillstände von Leads bleibt).
- Keine weiteren: B1 und B2 sind durch R735/R750 gedeckt.

## Bewertung laufender Experimente

- E-063, E-066, E-068: keine neue Datenlage seit der Retro ca9d40c8 → weiter beobachten.

## Änderungen an lernen.md

- keine
