# T04 — `/api/ping`, `start.sh` erkennt Fremdserver, Drosselung absenken (AK-TB5-07, AK-TB5-08)

**Dateien:** `tools/studio/server.py` (`route` ≈ Z. 67; Drosselung des Zustandsaufbaus: Fundstelle per Grep `90`/`30` im Aufbau-Thread), `tools/studio/start.sh` (`answers`), `tools/studio/tests/test_server.py`, `tools/studio/tests/test_start.py`. blocked-by T01 (Messwert).

**AK-TB5-07:** `GET /api/ping` antwortet `{"studio": true}` (Host-Prüfung wie übrige Routen, kein Zustandsaufbau). `start.sh` zählt nur diese Antwort als «läuft bereits»/«bereit». Antwortet ein anderer HTTP-Server am Port: Meldung «Port <n> belegt (kein Studio-Dashboard)» auf stderr, Exit 1, kein Start-Versuch.
**AK-TB5-08:** Die Drosselung (heute 30-Fache der Aufbaudauer, max. 90 s) ist so abgesenkt, dass der Verzug bei dem in T01 gemessenen Aufbau ≤ 5 s bleibt (Faktor und Obergrenze als benannte Konstanten, Kommentar mit Messwert).

## Schritte

- [ ] **Test zuerst:** `test_ping_returns_studio_marker`; `test_start_foreign_server_reports_port_busy` (Fake-Server mit `http.server` in Test, `STUDIO_PORT`, `STUDIO_HOME=<tmp>` nur Tests, vgl. bestehendes `test_second_start_reports_running`); `test_throttle_bound` auf die Konstante/Funktion.
- [ ] **Umsetzung:** Route ergänzen; `answers()` ruft `/api/ping` und prüft den Text auf `"studio"` (python3 -c, `json`); `running()` bleibt erste Prüfung (ein noch alter Studio-Server ohne `/api/ping` wird so über PID erkannt, nicht als fremd). Drosselkonstanten senken.
- [ ] **Prüfen:** gezielte Tests, `make studio-lint`; kein echter Server im Hauptrepo (`STUDIO_HOME=<tmp>`).

**Commit:** `fix: start.sh prüft /api/ping statt jede HTTP-Antwort; Drosselung nach Messung abgesenkt`

## Nacharbeit Gate Plan (R478, B6; ersetzt AK-TB5-08 und den Schritt «Drosselkonstanten senken»)

R468/R469 bestätigten die 30-fache Drosselung (4,7 % CPU). **Sie bleibt**, ausser ein CPU-Messwert im Leerlauf nach dem Absenken ist <= 10 %.

- [ ] **AK-TB5-08 neu:** Mit T01-Aufbaudauer die Drosselung testweise absenken (Ziel Verzug <= 5 s), CPU im Leerlauf messen (z. B. `ps -o %cpu` über >= 60 s, Methode im Bericht). Messwert <= 10 %: absenken, Konstanten benannt, Kommentar mit Messwert und R468/R478. Messwert > 10 %: **alter Wert bleibt**, T04 liefert nur `/api/ping` und Fremdserver-Erkennung; Messwert im Bericht (Entwurf an L0 zur Änderung von R468 nur, wenn abgesenkt wurde).
- [ ] **Gegenproben (R465 B4):** Studio-Server ohne `/api/ping` (404, alter Stand) wird über PID als «läuft» erkannt, nicht als fremd; `/api/ping` mit falschem Host wird abgelehnt; Fremdserver-Test auf freiem ephemerem Port (Port 0 bzw. frei gewählt), kein fester Port.
