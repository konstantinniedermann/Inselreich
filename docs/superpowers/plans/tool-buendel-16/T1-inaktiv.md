# T1 inaktiv-Ausnahme (R755 V1)

Stand: `model.py` `_Builder.view` (inactive = LIVE, keine lebenden Kinder, quiet > inactive_after, nicht unconfirmed). Vorfall entsteht in `effort.incidents` aus `inactive_keys` (`model.py` ~Z. 1223).
Regel neu, nur für Rollen `studio-director` und `lead-qa`: nicht inaktiv, wenn (a) irgendein Nachfahre (beliebige Tiefe, nicht nur direkte Kinder) lebt (Status in LIVE) oder in den letzten `inactive_after` s ein Heartbeat/last_seen hatte, oder (b) ein langer Make-Lauf läuft. Echte Stillstände von Leads (`test_real_lead_silent_is_still_inactive`) bleiben inaktiv.
(b): Erst in `.studio/events.jsonl` und `testrun.py`/`loadsnap.py` prüfen, welches Ereignis einen laufenden Make-/Testlauf zeigt (testrun schreibt `load` beim Start). Einfachste belastbare Lösung wählen, z. B. letztes Ereignis der Rolle ist Heartbeat `tool: Bash` oder ein Testlauf-Start ohne Ende, jünger als eine Konstante `LONG_RUN_SECONDS` (Vorschlag 1800). Entscheid im Bericht begründen.
Hinweis: Replay der echten Session 21273458 zeigte keinen Vorfall für `main`; Ursache daher mit Fake-Ereignisstrom nachstellen (Kind-Heartbeats bei nicht-LIVE-Statusknoten, Enkel, Bash-Heartbeat vor 10 min).
Tests (je mit Rot-Beleg): L0 mit Enkel-Heartbeat nicht inaktiv; lead-qa mit Bash-Lauf nicht inaktiv; lead-qa ohne alles weiterhin inaktiv; lead-tech nie ausgenommen.
Echtlauf: `build_state` mit Fake-Strom und mit echtem `.studio/events.jsonl` (lesend), Ausgabe im Bericht.
