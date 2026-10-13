# Retro adhoc Testlock — 2026-10-13

- Datum: 2026-10-13
- Art: adhoc
- Auslöser: Vorfall Push-Gate REL-20 gescheitert (R587), `make check` 9× am Testlock
- Datenbasis: `docs/studio/rulings.md` (R380, R578, R582, R585, R586, R587), `tools/testlock/testlock.ts`, `python3 tools/studio/metrics.py --efficiency`, `uptime`/`ps` vom 2026-10-13 15:49

## Befunde

### B1 · Testlock-Grenze 8 trifft eine Maschine mit Grundlast und Deckel 8

- Beobachtung: Der Testlock bricht bei 1-min-Load > 8 sofort ab (Exit 3, kein Warten); `LOAD_MAX = 8` ist fest (`tools/testlock/testlock.ts` Z. 25, Z. 75–78). Der Rechner hat 10 logische Kerne (`sysctl hw.ncpu`). R578 hob den Deckel wieder auf 8 Agenten, mehrere davon mit Testläufen.
- Beleg (gemessene Abbrüche): Integrator REL-20 viermal Exit 2 bei Load 20,0 / 25,6 / 8,8 / 13,0 (R587); UI-HAEPPCHEN-A zweimal bei Load 22–24 (R586); TOOL-BUENDEL-10 zweimal, erst der dritte Versuch Exit 0 (R582, R585). Summe 8 belegte Abbrüche in den Rulings; die 9. Zählung (Grenzfall) stammt aus dem Auftrag, nicht aus einem Ruling.
- Beleg (Grundlast jetzt, 15:49, ohne eigenen Testlauf des Coachs): `uptime` Load 10,69 / 12,42 / 16,05; `ps`: ein node-Prozess 194 %, `fileproviderd` 81 %, `rtcreportingd` 43 %, Dropbox-Prozesse zusammen ≈ 60 %. Systemprozesse (ohne node) ≈ 2,3 Kerne, passend zu R587 (≈ 1,5–2 Kerne).
- Wirkung: Zwei Gates (REL-20 Push, Merge A) blockiert; REL-20 nicht live; jeder Fehlversuch kostet einen Integrator-Start plus L0-Warten.

### B2 · Ursache: Konflikt zweier Regeln, Beobachtung und Deutung getrennt

- Beobachtung: Zwei gültige Regeln addieren sich: Deckel 8 Agenten (R578, R424) und Abbruch bei Load > 8 (R380). Die Abbrüche fielen in Zeiten mit mehreren parallelen Arbeitern (R586: A fertig, B startet, Integrator wartet).
- Deutung (Vermutung, nicht gemessen): Die Spitzen 20–26 stammen von parallel laufenden Vitest-Läufen der Arbeiter (Worker je Kern), die Grundlast ≈ 2 Kerne verschiebt die Basis, löst die Spitzen aber nicht aus. Unbelegt: welcher Anteil der Last von Agenten und welcher von Systemprozessen kam; der Testlock schreibt bei Abbruch nur den Load-Wert, keine Prozessliste.
- Messbarkeit: fehlt genau diese Aufschlüsselung; deshalb V3 als Messauftrag.

### B3 · Die Regel „nicht warten" (R380) verlagert das Warten auf teure Instanzen

- Beobachtung: R380 verbietet Warten im Werkzeug; stattdessen wartet L0 per Hintergrund-Prüfung und startet den Integrator neu (R587 (1): bis 6 Versuche, ≥ 3 min Pause).
- Beleg: R587 (1); `testlock.ts` Z. 4 „Exit 3, kein Warten“.
- Wirkung: Jeder Neustart lädt Kontext neu (Integrator-Start), obwohl ein Warten im Prozess Sekunden an Token kostet. Unbelegt: konkrete Token-Kosten der 4 Integrator-Versuche (Messauftrag in V2).

## Effizienz-Ampel

Quelle: `python3 tools/studio/metrics.py --efficiency` (Historie, 53 Sessions). Die Zeilen sind nicht durch diesen Vorfall verursacht; Hebel verweisen auf Bestehendes, soweit vorhanden.

| Kennzahl               | Wert    | Ampel | Befund / Ursache                                                     | Hebel oder Messauftrag mit Frist                                                                               |
| ---------------------- | ------- | ----- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil ber.  | 43,9 %  | gelb  | Ursache nicht vom Vorfall; Neustarts des Integrators (B3) tragen bei | V2 senkt Neustarts; Messauftrag studio-coach: Anteil Integrator-Neustarts am Steuerungsanteil bis Session-Ende |
| Cache-Write 5 min      | 28,3 %  | rot   | Neustarts laden Kontext neu (Vermutung); Rolle nicht aufgeschlüsselt | Lernen-Zeile Cache-Write: erst nach Rolle aufschlüsseln; Messauftrag studio-coach bis nächste Session-Retro    |
| L0-Kontext Max         | 774k    | rot   | Historienwert, früher Session (Lernen-Zeile session-2cfa57e0 B6)     | Messauftrag: Session-Datei gegenlesen, studio-coach bis nächste Session-Retro                                  |
| opus-Anteil            | 69,8 %  | gelb  | nicht Gegenstand dieser Retro                                        | Messauftrag: Aufschlüsselung nach Rolle, studio-coach bis nächste Session-Retro                                |
| Grösste gelesene Datei | 66,7 KB | gelb  | nicht Gegenstand; E-057 gilt (Abschnittslesen)                       | E-057 (laufende Regel)                                                                                         |
| Flake-Verdacht (Tests) | 7 (rot) | rot   | Vermutung: Lastspitzen (B1) lassen Zeit-/Timeout-Tests rot werden    | V3 liefert Lastprotokoll; Messauftrag: Flakes gegen Load der Läufe legen, TOOL-BUENDEL-11                      |

## Befragung der Leads

- Keine (Budget keins, keine Agenten gestartet); Ruling-Berichte R582–R587 gelesen.

## Vorschläge

Drei Entwürfe für L0 (Umsetzung in TOOL-BUENDEL-11 bzw. per Ruling in `gates.md`). Alle messbar, keiner verschlechtert die Messbarkeit; Perf-Messungen bleiben bei Load ≤ 4 (Lernen-Zeile R326/R327) und werden nie gelockert.

### V1 · Testlast-Abschlag im Release-Fenster (Ruhefenster als Regel)

- Hypothese: Ab „Gate Merge Release OK“ bis zum Push startet L0 höchstens 2 weitere Agenten mit Testläufen (Plan-/Gate-/Doku-Agenten bleiben frei); dann sinkt die Zahl der Testlock-Abbrüche des Push-Gates auf ≤ 1 je Release.
- Kosten: gering (Regeltext in `gates.md`/Handbuch, nur per L0-Ruling), kostet Durchsatz im Fenster (Ausgleich: Plan-/Doku-Arbeit läuft weiter).
- Nutzen: Release kommt ohne Neustartschleife live.
- Risiko: Deckel bleibt unausgeschöpft (Konflikt mit „Deckel ausschöpfen“, R475); das Fenster ist kurz.
- Messgrösse: Abbrüche (Exit 2/3 mit Testlock-Text) je Push-Gate ≤ 1, über die nächsten 3 Releases; Beleg Integrator-Berichte.
- Rückfall: Regel streichen, R587 (1) bleibt.
- Experiment-Kandidat: ja.

### V2 · Testlock reiht ein statt abzubrechen (Warteschlange mit Frist)

- Hypothese: Bei Load > Grenze oder belegter Sperre wartet der Testlock bis zu 10 min (Abfrage alle 15 s, Grenze und Sperrlogik unverändert) und bricht erst danach mit Exit 3 ab; Neustarts des Integrators durch Testlock-Abbruch sinken auf 0.
- Kosten: mittel (`tools/testlock/testlock.ts` plus Tests, Schleifentest mit ≥ 100 Runden laut Lernen-Zeile ABA; R380 ändert sich von „nicht warten“ zu „bis zur Frist warten“ → L0-Ruling nötig). Bash-Limit 600 s beachten: Lauf im Hintergrund.
- Nutzen: Ersetzt teure Neustarts durch billiges Warten (B3).
- Risiko: Mehrere Wartende laufen gleichzeitig los, sobald die Last fällt (Herdeneffekt); Wartezeit verdeckt Dauerüberlast, daher Abbruchzahl und Wartezeit weiter loggen.
- Messgrösse: Exit-3-Abbrüche je `make check` ≤ 0,2 und Wartezeit-Median ≤ 5 min über 10 Läufe; Wartezeit im Ereignislog, damit die Wirkung messbar bleibt.
- Rückfall: Frist auf 0 setzen (altes Verhalten).
- Experiment-Kandidat: ja.

### V3 · Messauftrag statt Grenzänderung: Lastprotokoll beim Abbruch

- Hypothese: Erst wenn der Abbruch Load, Top-5-Prozesse und Zahl laufender Vitest-Worker protokolliert, lässt sich eine Grenze relativ zur Grundlast begründen. Heute ist unbelegt, ob die Spitzen von Agenten oder von Fremdprozessen kommen (B2).
- Kosten: gering (wenige Zeilen in `testlock.ts` in TOOL-BUENDEL-11, `ps` ist schon importiert über `orphans.ts`).
- Nutzen: Datenbasis für eine spätere relative Grenze; hilft gegen Flake-Verdacht (Ampel).
- Risiko: keines für Messbarkeit; Grenze bleibt 8, eine Absenkung der Strenge (z. B. Grundlast + 6) wird nicht vorgeschlagen, weil Zeittests bei hoher Last flackern (Lernen-Zeilen H-T4/H-T6).
- Messgrösse: Nach 5 Abbrüchen (oder bis 2026-11-19) liegt eine Aufschlüsselung Agent-Last gegen Fremdlast vor.
- Rückfall: Protokollzeilen entfernen.
- Experiment-Kandidat: nein (Messauftrag, kein Verhalten), Aufnahme in TOOL-BUENDEL-11 per Ruling.

## Bewertung laufender Experimente

- Platzlage (`docs/studio/experimente.md`): laufend E-060, E-062, E-063 (3 von 3); E-064 und E-065 (R579 angenommen) warten auf Platz; V1 und V2 würden hinten anstehen.
- Vorschlag: E-060 (Budget-Hook blockt, laufend seit R542, ältestes) zuerst bewerten und abschliessen, um E-064 Platz zu schaffen. Ich habe die Messdaten von E-060 hier nicht gelesen (Kurz-Retro); die Bewertung ist daher kein Ergebnis, nur eine Reihenfolge. Danach E-064/E-065, V1/V2 erst nach weiteren Abschlüssen.

## Änderungen an lernen.md

- keine (Datei steht bei 42 nicht leeren Zeilen, Kopf und Kommentar eingerechnet; eine neue Zeile erfordert Streichen). Vorgemerkt für nach V2-Bewertung: „Zwei Grenzen (Deckel 8, Load 8) ohne Abstimmung erzeugen Abbruchschleifen“ (R587).
