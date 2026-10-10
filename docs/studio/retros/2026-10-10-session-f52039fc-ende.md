# Retro session f52039fc-ende — 2026-10-10

- Datum: 2026-10-10
- Art: session (Kurz-Retro, `studio-coach`, sonnet)
- Auslöser: Session-Ende f52039fc (R472–R496); offene Messaufträge aus Retro [rel-18-prozess](2026-10-10-rel-18-prozess.md) (opus-Anteil an die nächste Session-Retro)
- Datenbasis: `docs/studio/metriken/S-2026-10-10-f52039fc.md` (inkl. Rohwerte `efficiency.lead_stats.rows`);
  `python3 tools/studio/metrics.py --efficiency` (Historie); `.studio/events.jsonl` (Session `f52039fc`: `spawn`,
  `spawned`, `agent_stop`, `budget`, `budget_warn`, `decision`, `commit_rejected`); `git log --merges` und
  `git merge-tree` für `ae050073`, `adb7e28e`, `4b3a3aac`; `docs/studio/rulings.md` R472–R496;
  `docs/studio/experimente.md`; `docs/studio/STUDIO.md` (Modelltabelle Z. 135–136)
- Abgrenzung: Push REL-18, Actions-Minuten, Inaktiv-Alarm beim CI-Warten und L0-Latenz in der ersten Session-Hälfte
  stehen in der Prozess-Aussensicht (R488) und werden hier nicht wiederholt.

## Befunde

### B1 · Nutzerauftrag R475: Deckel voll, viel Vorarbeit, bis die Limit-Ampel stoppt

- Beobachtung: Nach R475 (≈ 15:26 UTC) belegte L0 den Deckel fast voll; nach R488 (Limit-Ampel gelb) startete L0 ab
  15:54 nichts mehr bis zur Retro. Ergebnis der Session: 6 Design-Artefakte (Kurzdesigns UI-TASTEN, I-049; Specs
  M13-E2, I-048, M14-E1; M14-Brainstorming), 2 Spec-Nachträge, 1 Ideen-Runde, 1 Art-Scouting; 4 Pläne (TOOL-BUENDEL-5,
  UI-TASTEN, I-049, AUFRAEUM-01); 11 Gates (4 Plan/kombiniert, 2 Spec mit je 2 Urteilen, 1 Brainstorming, 4 Merge);
  3 Umsetzungen bis zum lokalen Merge (AUFRAEUM-01, TOOL-BUENDEL-5, UI-TASTEN); 25 Rulings.
- Beleg: Gleichzeitig laufende L0-Kinder (aus `spawned`/`agent_stop`, 30-s-Raster): 15:12–15:27 Mittel 2,9;
  15:27–15:42 Mittel 7,4 (max 8); 15:42–15:57 Mittel 6,0; 15:57–16:18 Mittel 2,6. Abstand Agent-Ende → nächster
  L0-Start: Median 28 s (n = 27, max 320 s). Kostenanteile (Metrik-Datei): L0 12,2 %, Leads 46,1 %, Design/Spec/Plan
  22,9 %, Umsetzer 5,9 %; Steuerung roh 58,3 %, bereinigt (E-049) 23,4 %.
- Beleg Schätzung: 831 min geschätzt gegen 160 min Ist (−80,7 %), Werkzeugaufrufe 1441 gegen 1283 (−11 %). Die
  Kopfzeilen aller L0-Starts summieren 1471 Tools und 851 min; nach der Regel „Minuten = Tools ÷ 6“ (`lernen.md`,
  Retro session-c64c0775 B5) wären es 245 min gewesen.
- Wirkung: Die Pipeline ist gefüllt: gegatet und planreif sind M13-E2 und I-048 (R492, R493), I-049 ist geplant und
  wartet auf M13-E2-SIM (R481), M14-E1 wartet auf das Gate Spec (R495), REL-19 ist push-bereit (R496). Die Vorarbeit
  hat 3 Umsetzungen nicht verdrängt. Der Deckel war nur rund 30 min voll; Grenze war die Limit-Ampel, nicht L0.

### B2 · Parallele Vorarbeit an gekoppelten Paketen erzeugt Kopplungsbefunde und Nachträge

- Beobachtung: M13-E2, I-048 und I-049 entstanden parallel und teilen Save v12, `trade.ts`, `types.ts`, `world.ts`,
  `save.ts`. Die Gates fanden fünf Kopplungspunkte: Save-Reihenfolge (R477), Start I-049 erst nach M13-E2-SIM (R481
  B1), Denkmal-Zukauf gegen Kaufaufschlag (R489, R490 B1), geteilter v12-Sprung (R490 B3), Nachtrag Plan I-049 (R493).
- Beleg: Die zwei Nachträge kosteten zusammen 1,41 M Kostengewicht (`design-m13-e2-nachtrag` 0,71 M,
  `design-i048-nachtrag` 0,70 M, beide opus), ≈ 6,7 % der Session; sie arbeiteten auch kopplungsfreie Gate-Befunde ein.
- Wirkung: Der Kopplungsanteil der Nachträge ist nicht trennbar. Muster über drei Pakete in einer Session, aber erst
  eine Session: Lernzeile statt Experiment.

### B3 · `docs/beobachtungen.md` konfliktiert bei jedem Merge der Session

- Beobachtung: Alle drei Merges der Session mit Änderungen an der Datei hatten einen Konflikt (Anhängen am Dateiende
  zweier Stränge); Auflösung jedes Mal durch „beide behalten“. `0fe465e0` ist ein zusätzlicher Merge-Commit dafür.
- Beleg: `git merge-tree` der Eltern von `ae050073` (AUFRAEUM-01), `adb7e28e` (TOOL-BUENDEL-5), `4b3a3aac`
  (UI-TASTEN): je `CONFLICT (content): Merge conflict in docs/beobachtungen.md`. Vorher mindestens 3 Fälle bis R458
  (Retro session-2cfa57e0 B3). Die 13 gelöschten Zeilen in `adb7e28e` sind die drei TOOL-BUENDEL-4-Kandidaten, die
  TOOL-BUENDEL-5 umgesetzt hat (gewollt), keine verlorenen Einträge.
- Wirkung: Je Merge eine manuelle Auflösung durch den Integrator. E-056 (Einträge erst nach `git merge main`)
  verhindert das nicht: Drei release-reife Stränge, die nacheinander gemergt werden, hängen alle am selben Dateiende an.
  `merge=union` wurde wegen zurückgeholter gestrichener Zeilen entfernt (E-031, R294/R303); das betraf Konflikte mit
  Löschungen, nicht reines Anhängen.

### B4 · Controller-Stopps TOOL-BUENDEL-5 (R482, R484)

- Beobachtung: Zwei Stopps nach Plan-Schwellen: B5 (`build_state` ≤ 1,0 s, erreicht 1,3 s) und B4 (> 10 abweichende
  Lead-Phasen, gefunden 24 von 263). Beide wurden nach Empfehlung des Controllers akzeptiert.
- Beleg: `decision` D-tb5-t01 15:36:54 → Auflösung 15:37:18 (24 s), D-tb5-t02 15:39:01 → 15:39:39 (38 s); R494: 5 von 7
  Starts, Final-Review OK.
- Wirkung: Kosten gering (zusammen ≈ 1 min L0). B5 war ein Zielwert ohne Messbasis; B4 zählte absolute Abweichungen,
  obwohl T02 die Zuordnung gerade korrigieren sollte (20 von 24 waren gewollte Korrekturen). Sinnvoller Stopp wäre
  „ungeklärte Abweichung > 0“. Einzelfall, kein Experiment; Hinweis an `lead-qa` für künftige Plan-Gates.

### B5 · L0-Fehler: Budgetfreigabe nach dem Start, Task-ID als Paket

- Beobachtung (a): `design-m14-e1` startete 15:42:39, die E-055-Warnung kam 15:42:39,9, `log.py budget` 15:42:42.
  Die Budgetansicht bindet die Freigabe trotzdem (2 von 2), `lead_phases` nicht: Die Instanz steht mit Phase `None`
  in `lead_stats.rows` und wird von E-049 nicht herausgerechnet.
- Beleg: Rohwerte der Metrik-Datei; `design-m14-e1` ist mit 1,36 M die teuerste Lead-Instanz der Session, ≈ 6,5
  Punkte des Gesamtgewichts. Bereinigt wären es ≈ 16,9 % statt 23,4 % (Ampel in beiden Fällen grün). Vorfall wie
  R440 (REL-15, Budget ohne Freigabe): zweite Session mit Freigabe-Reihenfolgefehler.
- Beobachtung (b): Task-ID als `Paket:` (`ac8af81e`, `M13-E1-T01`) stammt aus einer früheren Session; R494 regelt es.
  In dieser Session nannten alle 31 L0-Starts ein Paket, keinen Task. Kein Handlungsbedarf.
- Wirkung: Die Warnung kommt, aber erst nach dem Start; sie verhindert den Fehler nicht, sie meldet ihn.

### B6 · Sechs Commit-Abweisungen durch den Prettier-Hook

- Beobachtung: Der Commit-Hook wies 6 Commits mit unformatierten Plänen/Specs ab (4 Pläne, 1 Kurzdesign, 1 Plan doppelt
  in zwei Bäumen); jeder Fall kostete einen Wiederholungsversuch.
- Beleg: `commit_rejected` 15:29:27–15:41:53 in `.studio/events.jsonl`.
- Wirkung: Der Hook (R417) wirkt wie gedacht; kein Push scheiterte am Format. Die Lernzeile zu Prettier ist damit veraltet.

## Effizienz-Ampel

| Kennzahl                             | Wert (Session / Historie) | Ampel             | Befund / Ursache                                                                                         | Hebel oder Messauftrag mit Frist                                                     |
| ------------------------------------ | ------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Steuerungsanteil                     | 58,3 % / 51,7 %           | rot / rot         | B1: Design-Leads unter R475; bereinigt 23,4 % (grün), mit B5-Korrektur ≈ 16,9 %                          | E-049 läuft (Datenpunkt 2); V2 schliesst die Bindungslücke                           |
| Umsetzeranteil                       | 5,9 %                     | rot               | B1: Vorarbeit statt Umsetzung, von R475 gewollt; Produktivanteil 28,8 %                                  | R488 V4 (Ampelzeile Produktivanteil) ist der Hebel                                   |
| Cache-Write 5 min                    | 26,8 % / 28,6 %           | rot / rot         | Neuschreibungen > 20k vor allem `lead-design` (8) beim Warten auf Spec-Autoren                           | E-057 läuft (Datenpunkt 1 von 3: Lese > 30 KB = 2 erfüllt, CW 26,8 % verfehlt)       |
| L0-Kontext Max                       | 272k / 774k               | gelb / rot        | 25 Rulings, 31 Starts in einer Session; Historie Altlast                                                 | Messauftrag: nächste Session-Retro; > 250k zum zweiten Mal → Hebel-Vorschlag Pflicht |
| opus-Anteil                          | 76,7 % / 71,3 %           | gelb              | Modelltabelle: Design-Lead immer opus, auch Nachträge und Kurzdesigns; lead-tech-Gate-Spec opus (1,46 M) | V3; Messauftrag R488 damit erledigt                                                  |
| Grösste gelesene Datei               | 37,0 KB / 66,7 KB         | grün / gelb       | Historie: Review-Diff `.superpowers/sdd/…`                                                               | E-057 läuft                                                                          |
| Lead-Kontext Median                  | 69k                       | grün              | —                                                                                                        | —                                                                                    |
| Actions (Inselreich, Konto, Session) | 979 / 1251 / 9            | rot / gelb / gelb | unverändert seit Retro rel-18-prozess                                                                    | R488 V2 (Prognose-Zeile) im nächsten Werkzeug-Bündel                                 |

## Befragung der Leads

Keine. Kurz-Retro; alle Leads der Session sind beendet, Berichte und Rulings decken die Fragen ab.

## Vorschläge

Drei neue Experimente in [experimente.md](../experimente.md): **E-059** (V1, `beobachtungen.md` mit Merge-Treiber
für reines Anhängen, ersetzt E-056), **E-060** (V2, E-055 blockt statt zu warnen), **E-061** (V3, Spec-Nachtrag und
Kurzdesign Stufe leicht auf sonnet). Laufend sind 3 (E-049, E-054, E-057); E-054 ist bewertungsreif (siehe unten),
damit wird ein Platz frei. Befund an L0 ohne Experiment: Minuten in der Kopfzeile nach Tools ÷ 6 (B1).

## Bewertung laufender Experimente

- **E-054** (Plan auf sonnet): Datenpunkt 3: `plan-tool-buendel-5` 0,15 M (≈ 8 % von 2,01 M), `plan-ui-tasten` 0,12 M
  (≈ 9 % von 1,38 M), `plan-aufraeum-01` 0,14 M, `plan-i049-reserve` 0,16 M, alle sonnet. Gate-Befunde 10 / 5 / 3 / 9,
  0 blockierend, nicht über Ausgang (12 / 5). Steuerung bereinigt 23,4 % ≤ 40 %, Review-Runden 1,6 ≤ 2. Gegenprobe
  Erstabnahme 40 % verfehlt (5 geprüfte Ergebnisse; Ursache Umsetzung: T01 BEDENKEN, Playtest ZURÜCK in UI-TASTEN, nicht
  die Pläne). Vorschlag: **behalten**.
- **E-049**: Datenpunkt 2 von 3: roh 58,3 %, bereinigt 23,4 %, herausgerechnet 34,9 Punkte (21 Instanzen); Gegenprobe
  23,4 + 34,9 = 58,3 erfüllt. Lücke: `design-m14-e1` ohne Phase (B5). Weiter beobachten.
- **E-057**: Datenpunkt 1 von 3 (siehe Ampel). Weiter beobachten.
- **E-055** (Werkzeug): Warnung kam, aber nach dem Start; Freigabe 3 s später. Kein Budget-Vorfall, aber Bindung in
  `lead_phases` verloren (B5). Anpassung als E-060.
- **E-056**: wird von E-059 ersetzt (B3); Vorschlag: abgelehnt.

## Änderungen an lernen.md

- Neu: Parallele Vorarbeit an gekoppelten Paketen (B2).
- Ergänzt: Budgetzeile vor dem Start (B5), Minutenschätzung (B1), `beobachtungen.md`-Konflikte (B3), Prettier-Zeile
  auf den Hook umgestellt (B6).
- Zusammengelegt: die zwei Zeilen zu Prüfungen mit `&&` und ohne Pipe. Stand: 39 Inhaltszeilen.
