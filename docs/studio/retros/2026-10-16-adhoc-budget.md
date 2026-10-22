# Retro adhoc Budget — 2026-10-16

- Datum: 2026-10-16
- Art: adhoc
- Auslöser: Hook «Ad-hoc-Retro fällig» (R733): Budgetüberschreitungen TOOL-GUARD-REDACT (5 von 3) und ORT-A T08 (+5 Starts über Plan)
- Datenbasis: `docs/studio/rulings.md` (R717, R721, R723, R725, R728–R733), `.studio/handoffs/2026-10-16-lead-tech-TOOL-GUARD-REDACT.md`, `.studio/handoffs/2026-10-16-lead-tech-ORT-A-C2.md`, `.studio/events.jsonl` (gefiltert, seit 11:40Z), `python3 tools/studio/metrics.py --efficiency`
- Befragung: keine (Budget keins, keine Agenten gestartet)

## Zeitstrahl

| Ruling | Paket     | Ereignis                                                                                                                                          |
| ------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| R717   | ORT-A T08 | T07 nach 3 Review-Runden abgenommen; +3 Starts aus Puffer (12 → 9) für T08. Browser-Läufe «Messfenster belegt» (N-102)                            |
| R721   | GUARD     | TOOL-GUARD-REDACT (S) in den Pool                                                                                                                 |
| R723   | ORT-A T08 | 3. Fix-Runde, +1 frisches Delta-Review (Puffer 8). Risiko Hof/Schatten-Querschnitte im Handoff vermerkt                                           |
| R725   | GUARD     | Review: Unter-Schwärzungen (`curl -u`, `token=` usw.) → Fix, +1 Start (Budget 3 → 4)                                                              |
| R728   | ORT-A T08 | Delta-Review 3 ZURÜCK, +1 Delta-Review (Puffer 7)                                                                                                 |
| R729   | ORT-A T08 | Review ZURÜCK: Schatten ½ Kachel versetzt (`buildingShadow` Rohkoordinaten vs. `tileCenter`); Fix-Runde 4, +1 Review (Puffer 6); Retro-Vormerkung |
| R730   | ORT-A T08 | Delta-Review 4 BEDENKEN → angenommen. Browser-Läufe weiter offen                                                                                  |
| R732   | GUARD     | Review opus ZURÜCK (Restlücken), +1 Review (Budget 5); Allowlist als Folgepaket vorgemerkt                                                        |
| R733   | GUARD     | Review auf `74c3d966` ZURÜCK (`PGPASSWORD=`, `accessToken=`, `passphrase`); Muster-Jagd beendet → TOOL-GUARD-ALLOWLIST; diese Retro               |

## Befunde

### B1 · TOOL-GUARD-REDACT: Review-Zyklus über einem offenen Problem (Muster-Schwärzung)

- Beobachtung: Vier Commits (`de380351`, `d4ae9675`, `c267f04a`, `74c3d966`), vier Review-Runden, jede mit neuen Lücken. Die Restlücken-Liste im Handoff wächst vom ersten Fix an (https://TOKEN@host, `Authorization:` ohne Schema, `?key=` …). Schon im Handoff nach R725 steht: «Allowlist für das command-Feld wäre robuster (Beobachtung)». Beleg: Handoff GUARD, R725, R732, R733.
- Beobachtung: Die letzte Lücke entstand durch die Wortgrenzen-Sperre `(?<![A-Za-z0-9])`, die R725 selbst verlangte («Wortgrenze vor `sk-`/`gh*_`»); c267f04a schwärzte die Fälle noch (Handoff Nachtrag). Ein Fix der vorigen Runde erzeugte die nächste Unter-Schwärzung.
- Deutung: Der Ansatz (Negativliste über freie Befehlstexte) hat keine Abschlussbedingung; jede Review-Runde findet neue Namen. Das Problem war ab dem zweiten ZURÜCK mit Befunden derselben Art (Unter-Schwärzung) bekannt (R725 → R732). R725 entschied «Unter-Schwärzung nicht hinnehmbar» und liess den Ansatz bestehen; die Alternative stand zu diesem Zeitpunkt im Handoff. Der Umschnitt kam mit R732/R733 (je ein Start später).
- Wirkung: 2 Starts über Budget 3 (R725 +1, R732 +1). Unklar: ob R733 mit vorgezogenem Umschnitt beim 2. ZURÜCK (R725) 2 Starts gespart hätte; das Muster-Schwärzen bleibt als zweite Linie ohnehin im Paket.

### B2 · ORT-A T08: Messwerkzeug-Task ohne Browser-Lauf, Geometriefehler erst im 4. Review

- Beobachtung: T08 (`tools/render-qa/`, Galerie/Messwerkzeug): Runden: sonnet BEDENKEN → Fix → opus Delta BEDENKEN (2 hoch) → Fix → Delta 2 ZURÜCK → Fix 3 → Delta 3 ZURÜCK (Schatten ½ Kachel) → Fix 4 → Delta 4 BEDENKEN (Handoff ORT-A, Nachträge 1–5). Vier Review-Runden, +5 Starts über Plan (R717 +3, R723 +1, R728 +1, R729 +1).
- Beobachtung: Browser-Läufe liefen nie (N-102, Messfenster belegt; R717, R730, Handoff «Offen»). Die Koordinatenfehler (Rohkoordinaten gegen `tileCenter` ± 0,5) lagen in dem, was der Browser sofort zeigt: der Reviewer rechnete eine Probe von Hand (Haus (10,10), Handoff Nachtrag 3). Der Handoff nach dem Fix sagt «Schatten erst im Browser bestimmbar».
- Beobachtung: Risiken für T09 (Hof 0 Querschnitte, Schatten 0 auf `ort-a-siedlung.json`) tauchten erst in den Reviews 2–4 auf und sind weiter offen (R730 → C4).
- Deutung: Ein Review ersetzt hier den Messlauf; es findet einen Befund je Runde, weil es die Geometrie nur durch Rechnen prüft. Die Entscheidung, T08 trotz gesperrtem Browser fertigzustellen, wurde bei R717 getroffen (+3 Starts, «Vermerk Messfenster belegt»); die Kostenfolge war bereits damals absehbar (Browser nie gelaufen seit C2-Start). Beim 2. ZURÜCK (R728) war das Muster «Geometrie nur per Review» erkennbar; R729 setzte erst bei erneutem ZURÜCK einen Stopp-Punkt.
- Unbelegt: ob die Browser-Läufe tatsächlich die ½-Kachel-Abweichung gefunden hätten (Deutung; die Selbsttests ab Rohmassen aus Fix 4 decken sie jetzt auch ohne Browser).

### B3 · Gemeinsame Ursache: kein Umschnitt-Kriterium im Budgetantrag

- Beobachtung: In beiden Fällen bewilligte L0 den Zusatzstart mit Regelbezug R673/R708 («frisches Review»), ohne dass das Ruling die Art der neuen Befunde mit den vorigen verglich. R725, R723, R728 nennen «Kosten bei Irrtum: ein Start»; die kumulierten Kosten (Fall 1: +2, Fall 2: +5) stehen nirgends vor dem letzten Antrag.
- Deutung: Der Budgetantrag des Leads (`log.py budget`) fragt «+1 Start?», nicht «was hat sich seit dem letzten Antrag geändert?». Jeder Einzelantrag wirkt klein; die Summe zeigt sich erst rückblickend.
- Gegenprobe (Fremdbeleg): Beide Fälle wurden gestoppt, als L0 explizit eine Abbruchbedingung formulierte (R729 «bei erneutem ZURÜCK: Stopp», R733). Das Mittel wirkt, nur zu spät.

## Leitfrage: wann hätte umgeschnitten werden müssen

| Fall  | Frühester belegter Zeitpunkt                                                                                                                           | Tatsächlich | Verbrannte Starts nach dem frühesten Punkt        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------- |
| GUARD | R725: zweites ZURÜCK, Befunde derselben Art; Allowlist im Handoff schon genannt                                                                        | R733        | 1 (R732)                                          |
| ORT-A | R717: Messwerkzeug-Task ohne Browser-Lauf (N-102 seit C2-Start bekannt); spätestens R728 (zweites ZURÜCK mit Befunden derselben Art: Koordinatenarten) | R729/R730   | 1–2 (R729 plus die Frage, ob R723 vermeidbar war) |

Die Zahlen sind Zählungen aus den Rulings; «vermeidbar» ist Deutung.

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency` (64 Sessions). Keine Zeile ist durch diese Fälle verursacht; die Retro verweist auf Bestehendes. Offene Messaufträge aus der Retro vom 2026-10-13 (Testlock) bleiben dort geführt (`docs/studio/retros/2026-10-13-adhoc-testlock.md`).

| Kennzahl               | Wert                                   | Ampel | Befund / Ursache                                                                                              | Hebel oder Messauftrag mit Frist                                                                                                            |
| ---------------------- | -------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil ber.  | 43,9 %                                 | gelb  | Fix-Runden und Reviews zählen mit; Anteil der 7 Zusatzstarts dieser Fälle nicht ausgewiesen                   | Messauftrag studio-coach: Starts je Paket über Budget in `metrics.py` ausweisen oder per Skript zählen, bis nächste Session-Retro           |
| Cache-Write 5 min      | 28,1 % (Pause 12,6 %, Wachstum 15,5 %) | rot   | lead-tech: Pause 2,4 %, Wachstum 2,8 %; frische Reviews laden Kontext neu (Vermutung, nicht je Fall gemessen) | V1 senkt frische Reviews bei Wiederholungs-Befunden; Messauftrag: Rollen-Aufschlüsselung (offen seit 2026-10-13), bis nächste Session-Retro |
| L0-Kontext Max         | 774k                                   | rot   | Historienwert, nicht diese Session (Lernen-Zeile session-2cfa57e0)                                            | Messauftrag bis nächste Session-Retro: Max der aktuellen Session getrennt ausweisen                                                         |
| opus-Anteil            | 68,0 %                                 | gelb  | Fall-Reviews laufen auf opus (R673/R708 verlangen es für Delta-Reviews); ca. 8 opus-Starts hier               | V2 begrenzt opus-Delta-Reviews; Messung wie V1                                                                                              |
| Grösste gelesene Datei | 66,7 KB                                | gelb  | nicht Gegenstand; E-057 gilt                                                                                  | E-057 (laufende Regel)                                                                                                                      |
| Flake-Verdacht (Tests) | 9 (rot)                                | rot   | 6 von 9 bei Last ≥ 8; nicht Gegenstand dieser Fälle                                                           | Messauftrag aus Testlock-Retro V3 (Lastprotokoll) bleibt, Frist 2026-11-19                                                                  |

## Vorschläge

Drei Entwürfe für L0. Alle messbar; keiner verschlechtert die Messbarkeit (Starts zählt `log.py budget`/`spawn` unverändert).

### V1 · Umschnitt-Regel im Budgetantrag («zweites ZURÜCK derselben Art»)

- Hypothese: Beantragt ein Lead den Zusatzstart nach einem zweiten ZURÜCK/BEDENKEN-hoch, dessen Befunde derselben Klasse wie die der Vorrunde angehören (z. B. Unter-Schwärzung, Koordinatenart), muss der Antrag zusätzlich nennen: (a) Befundklasse je Runde, (b) einen Ansatz-Alternativvorschlag oder die Begründung, warum keiner besteht. L0 prüft vor dem Ruling, ob der Ansatz oder nur der Fix zu ändern ist. Dann sinken Starts über Budget je Paket mit Zusatzstarts auf ≤ 1.
- Kosten: gering (Regeltext in `docs/studio/STUDIO.md`, Budgetantrag-Vorlage; nur per L0-Ruling).
- Messgrösse: Starts über Budget je Paket ≤ 1 bei Paketen mit ≥ 2 ZURÜCK, über die nächsten 5 Pakete mit Zusatzstarts; Beleg `log.py budget`/Rulings. Frist: 2026-11-30 oder 5 Pakete.
- Risiko: Mehr Text je Antrag; Fehlalarm bei zwei ZURÜCK mit unabhängigen Befunden (dann Alternative «keine» zulässig).
- Rückfall: Regel streichen; Einzelantrag wie bisher.
- Experiment-Kandidat: ja.

### V2 · Messwerkzeug-Tasks: Reviews decken, Browser-Lauf vor Abnahme oder Task verschieben

- Hypothese: Ein Task, dessen Kernergebnis ein Browser-Lauf ist (Messwerkzeug, Galerie) und dessen Messfenster belegt ist, bekommt höchstens 2 Review-Runden; danach geht der Rest in ein Paket mit freiem Fenster, statt durch weitere Reviews ersetzt zu werden. Alternativ eine Mini-Fixture, die Koordinaten ohne Browser prüft (Selbsttest ab Rohmassen, wie Fix 4). Dann sinken Starts über Plan je Messwerkzeug-Task auf ≤ 2.
- Kosten: gering bis mittel (Regel in Plan-/Briefing-Vorlage `docs/studio/templates/`; Planer prüft Messfenster beim Planen).
- Messgrösse: Starts über Plan je Messwerkzeug-Task ≤ 2 bei den nächsten 3 solchen Tasks (T09, T17 und nächstes Paket aus ORT-A-C4). Frist: 2026-12-15.
- Risiko: Verschobene Tasks verzögern T09; Messfenster (N-102) bleibt Engpass, der damit sichtbarer, nicht kleiner wird.
- Rückfall: Regel streichen; Zusatzstarts wie R717 aus dem Puffer.
- Experiment-Kandidat: ja.

### V3 · Messauftrag: kumulierte Mehrstarts im Ruling nennen

- Hypothese: Jedes Budget-Ruling nennt Plan-Starts, verbrauchte Starts und kumulierten Überzug («5 von 3»). Die Zahl steht heute nur im Handoff (z. B. «Starts 8/8», «14 von 25 verbraucht»).
- Kosten: sehr gering (Rulingvorlage `docs/studio/templates/`, nur per L0-Ruling).
- Messgrösse: In 100 % der Budget-Rulings der nächsten 10 Rulings steht die Zeile; Stichprobe `docs/studio/rulings.md`. Frist: 2026-11-15.
- Rückfall: Zeile streichen. Kein Verhalten betroffen; Experiment-Kandidat: nein (Messauftrag).

## Bewertung laufender Experimente

- Nicht geprüft (Kurz-Retro, nur Fall-Daten gelesen). Neue Vorschläge V1/V2 benötigen freie Plätze in `docs/studio/experimente.md` (höchstens 3 laufende); Platzlage ist hier nicht verifiziert.

## Änderungen an lernen.md

- keine (Datei bei ≈ 40 Inhaltszeilen; kein Ruling). Vorgemerkt nach V1-Bewertung: «Zweites ZURÜCK mit Befunden derselben Art → Ansatz prüfen, nicht Fix (R725/R733)».
