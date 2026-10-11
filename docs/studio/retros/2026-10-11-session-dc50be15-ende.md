# Retro session dc50be15-ende — 2026-10-11

- Datum: 2026-10-11
- Art: session (Kurz-Retro, `studio-coach`, sonnet)
- Auslöser: Session-Ende dc50be15 (R498–R522); Messaufträge aus R497 (Cache-Write, L0-Kontext)
- Datenbasis: `docs/studio/metriken/S-2026-10-11-dc50be15.md` (inkl. Rohwerte `efficiency.lead_stats.rows`,
  `rewrite_stats`); `.studio/events.jsonl` (Session `dc50be15`: `spawn` mit Modell, `push_check`); `tools/studio/efficiency.py`
  (`role_class`); Rulings R497, R499, R501, R508, R514, R519–R522 in `docs/studio/rulings.md`;
  [rel-19-prozess](2026-10-11-rel-19-prozess.md); `docs/studio/experimente.md`; `docs/studio/STUDIO.md` Z. 135–145
- Abgrenzung: Der Push-Weg REL-19 (60,6 min, drei Anläufe, Abhilfe TOOL-BUENDEL-6) steht in der Prozess-Aussensicht und
  in R514; hier nur der Messauftrag zu V4 (B6).

## Befunde

### B1 · Cache-Write 5 min gelb (21,6 %): Besserung, aber Pausen erklären nur einen Teil

- Beobachtung: 21,6 % (vorher 26,8 % und 28,6 %, zwei Sessions rot), gelb. E-057 verfehlt beide Schwellen weiter:
  Lese-Ergebnisse > 30 KB = 3 (35,5 KB und 33,5 KB Tool-Ergebnisse, 31,7 KB Spec M14-E1), Cache-Write 21,6 % > 18 %.
- Beleg: `rewrite_stats`: 18 Neuschreibungen > 20k, Gewicht 1,31 M von 26,4 M Gesamtkosten; Cache-Write 5 min ist
  21,6 % der Kosten (≈ 5,7 M). Die Pausen-Neuschreibungen erklären damit ≈ 23 % dieser Kostenart; 80 % davon folgen auf ein
  Turn-Ende (Warten auf Hintergrund-Agenten, Median der Pause 7–21 min). Cache-Write-Tokens nach Lead: lead-tech 4,55 M
  von 6,93 M (66 %), studio-director 0,79 M, lead-art 0,73 M (Metrik-Datei, Tabelle „Lead“).
- Deutung (getrennt): Der Lese-Hebel (E-057) trifft nur einen kleinen Teil; ein Briefing, das Teillesen verlangt, ändert
  nichts an Tool-Ergebnissen. Der grösste Block ist der Aufbau langer Lead-Kontexte (lead-tech Max 368k) und, nach B3,
  die Plan-Instanzen.

### B2 · Produktivanteil gelb ist ein Messartefakt

- Beobachtung: Produktivanteil 17,3 % (gelb) = Umsetzeranteil 17,3 %; Klasse „Design/Spec/Plan“ 0,0 %.
- Beleg: `tools/studio/efficiency.py` `role_class`: jede Rolle mit Präfix `lead-` ist „Leads“, „Design/Spec/Plan“ nur für
  Rollen `tech-plan*` und `design-*`. Die Plan- und Design-Lead-Instanzen stehen in `steuerung_heraus_grund`: Plan 32,1 %,
  Design 0,5 %. Zählte man sie als Produktivarbeit, läge der Anteil bei ≈ 49,9 %.
- Deutung: Die Ampel kann die Wirkung der Vorarbeit-Strategie (R475) nicht anzeigen. Wertung ob Plan-Kosten „produktiv“
  sind, bleibt offen (B3).

### B3 · Plan-Instanzen: 32 % der Session, drei von vier auf opus, zwei davon gegen E-054

- Beobachtung: Plan-Instanzen kosten 8,48 M ≈ 32 % von 26,4 M: `plan-m13-e2` 4,26 M (105 Turns), `plan-i048` 2,69 M (96),
  `plan-tool-buendel-6` 1,28 M (55), `plan-ui-naechster-schritt` 0,25 M (17); alle `opus`.
- Beleg: `spawn`-Events (`Modell` opus, 07:19–07:24Z); `efficiency.lead_stats.rows`. `STUDIO.md` Z. 135 nennt „Tech-Lead
  beim Plan“ unter `opus`; E-054 (behalten, R497) verlangt sonnet für Stufe leicht und Werkzeug-Pakete, steht aber nicht in
  der Tabelle. Sonnet-Vergleich: `plan-tool-buendel-5` 0,15 M, `plan-ui-tasten` 0,12 M (E-054 Datenpunkt 3).
- Deutung: `plan-tool-buendel-6` und `plan-ui-naechster-schritt` fielen unter E-054 und liefen opus: Mehrkosten ≈ 1,2 M
  (≈ 4,5 % der Session). Die Tabelle erzwang opus (Guard, R167/R428); die Lücke ist ein Umsetzungsmangel nach R497, kein
  Ungehorsam. `plan-m13-e2` und `plan-i048` sind keine E-054-Fälle (Save, Architektur); warum sie 4,26 und 2,69 M
  kosteten (Plan-Nachträge nach Gate, Fortsetzung?), ist aus den Metriken nicht trennbar: Ursache unbelegt.

### B4 · E-049 und E-061: Datenpunkte

- E-049 Datenpunkt 3 von 3: roh 66,2 %, bereinigt 30,1 %, herausgerechnet 36,1 Punkte (16 von 22 Lead-Instanzen: Plan
  32,1, Design 0,5, Gate 3,1, nur Budget keins 0,4); Gegenprobe 30,1 + 36,1 = 66,2 erfüllt. Die Lücke aus f52039fc
  (`design-m14-e1` ohne Phase) trat nicht wieder auf.
- E-061 Datenpunkt 1 von 3: `design-m14-e1-nachtrag` (sonnet) 0,078 M gegen Ausgang 0,70 M (≈ 11 %, Schwelle ≤ 60 %);
  Gate danach ohne weitere Befunde (R501), 0 ZURÜCK. `design-ui-naechster-schritt` 0,056 M gegen 0,16 M (≈ 35 %), Modell
  sonnet laut `spawn`. opus-Anteil der Session 55,6 % (Schwelle ≤ 70 % erfüllt) bei zwei Spec-Arbeiten.

### B5 · Prozessabweichungen: R395, Mehrbedarf, Plan-Lücke (je Einzelfall)

- (a) R395 / Rot-Belege: T01–T04 im M13-E2-SIM-Ledger ohne Rot-Beleg, Ersatz Mutationsstichprobe des Final-Reviews
  (vier Mutationen rot, R522). Dritter Fall nach UI-SEEKARTE und TOOL-GATES-2 (`lernen.md`, R402/R408): Muster über drei
  Pakete, daher Lernzeile ergänzt; Mechanik fehlt weiter.
- (b) Mehrbedarf nicht vorab gemeldet: ART T09 ≈ 100 statt 45 Tools (R521). Erster belegter Fall in diesen Metriken;
  Schätzung gegen Ist insgesamt +4,9 % Minuten, Tools 1653 gegen 1822. Einzelfall, beobachten.
- (c) Plan-Lücke: Nachtlicht AK-46 in keinem Task; erst L0 fand es vor T15 (R521, Beobachtung `monumentNightLight`).
  Einzelfall, beobachten. Wiederholt es sich, wird ein Abgleich AK-ID → Task im Gate Plan vorgeschlagen.

### B6 · Last, Parallelität und Push-Weg

- Beobachtung: Load bis 69; mehrere Agenten warteten auf 1-min-Load ≤ 3/4 (R508). Zwei parallele Sessions teilen den
  Deckel (R519, `c6709a04` ohne Budget-Freigaben, Hook darum `warn`, R520).
- Beleg: `push_check`-Ereignisse mit `load` je Stufe sind seit R514 V2 vorhanden: Lauf 08:20Z `exit 0`, 290 s; Lauf 10:06Z
  `exit 0`, 279 s, Load je Stufe 4,0. Zwei Läufe sind keine Datenbasis für die Wartegrenze (R514 V4).
- Deutung: Der Zielkonflikt volle Parallelität gegen Lastschwellen ist belegt, seine Grösse noch nicht.

## Effizienz-Ampel

| Kennzahl                    | Wert (Session) | Ampel | Befund / Ursache                                                                         | Hebel oder Messauftrag mit Frist                                                                                                           |
| --------------------------- | -------------- | ----- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Steuerungsanteil roh        | 66,2 %         | rot   | B3: Plan-Instanzen 32,1 %; bereinigt 30,1 % grün (E-049 Datenpunkt 3)                    | E-049 bewertet (V4); Plan-Hebel V1                                                                                                         |
| Umsetzeranteil              | 17,3 %         | grün  | —                                                                                        | —                                                                                                                                          |
| Produktivanteil             | 17,3 %         | gelb  | B2: Messartefakt, Plan/Design-Leads zählen zu Leads                                      | V3 (Zusatzzeile nach Phase)                                                                                                                |
| Cache-Write 5 min           | 21,6 %         | gelb  | B1: Pausen ≈ 23 % der Kostenart, Rest Lead-Kontextaufbau                                 | V1 (Plan sonnet nach E-054) senkt Gewicht; Messauftrag Aufschlüsselung nach Rolle bis nächste Session-Retro; E-057 läuft (Datenpunkt 2)    |
| L0-Kontext Max              | 379k           | gelb  | zweite Session über 250k (272k, 379k) bei je 25 Rulings; Zuwachs +107k, Ursache unbelegt | Messauftrag: grösste Eingaben an L0 (Berichtslängen, Tool-Ergebnisse) aus dem Transkript bis nächste Session-Retro; Pflichthebel R316 (V2) |
| Lead-Kontext Median         | 58k            | grün  | —                                                                                        | —                                                                                                                                          |
| opus-Anteil                 | 55,6 %         | grün  | —                                                                                        | —                                                                                                                                          |
| Persona-Starts general opus | 0              | grün  | —                                                                                        | —                                                                                                                                          |
| Grösste gelesene Datei      | 35,5 KB        | grün  | Tool-Ergebnisse                                                                          | —                                                                                                                                          |
| Flake-Verdacht              | 0              | grün  | —                                                                                        | —                                                                                                                                          |

Zusätzlich im Session-Bericht: Actions-Prognose ROT (1991 von 2000 min, R520), Folge ein Push je Tag; kein Spiel-Push
geplant (R505).

## Befragung der Leads

Keine. Kurz-Retro; alle Leads der Session sind beendet, Berichte und Rulings decken die Fragen ab.

## Vorschläge

Höchstens vier; V1 und V3 sind Handbuch- bzw. Werkzeug-Änderungen und brauchen ein Ruling.

- **V1 · E-054 in die Modelltabelle übernehmen.** Hypothese: Wird „Tech-Lead beim Plan“ für Stufe leicht und
  Werkzeug-Pakete (kein Save, kein Architekturentscheid) als sonnet in `STUDIO.md` Modellwahl und `lead-tech.md`
  eingetragen, laufen diese Pläne nicht mehr auf opus. Messgrösse: Kostengewicht je solcher Plan-Instanz ≤ 0,3 M (B3:
  0,12–0,16 M gegen 1,28 M) und 0 Plan-Instanzen dieser Klasse auf opus, über 3 Pläne; Gegenprobe: Gate-Plan-Befunde
  blockierend 0. Kosten: Handbuch-Minor, ein Ruling. Rückfall: Tabellenzeile auf die Fassung davor. Das ist kein neues
  Experiment, sondern die Umsetzung von R497 (E-054 abgeschlossen).
- **V2 · Hebel L0-Kontext (R316).** Ab 300k L0-Kontext plant L0 das Session-Ende (state.md, Übergabe) statt neue Pakete zu
  starten. Messgrösse: L0-Kontext Max ≤ 300k in den nächsten 2 Sessions. Vorbehalt: Ursache unbelegt (Messauftrag in der
  Ampel); wirkt der Messauftrag, ersetzt die Ursache diesen Vorschlag. Kosten: eine Zeile in der Ende-Routine. Rückfall:
  Zeile streichen. Empfehlung: nur den Messauftrag annehmen, V2 zurückstellen, bis die Ursache feststeht.
- **V3 · Zusatzzeile „Produktivanteil nach Phase“** in `metrics.py --efficiency`: Lead-Instanzen mit Freigabephase `plan-*`
  oder `design-*` zählen zu Design/Spec/Plan; Rohzeile und Schwellen unverändert (Messbarkeit bleibt). Messgrösse: Zeile mit
  Wert in 3 Session-Dateien; Gegenprobe Summe der Klassen 100 %. Kosten: kleiner Task im nächsten Werkzeug-Bündel.
  Rückfall: Zeile entfernen.
- **V4 · Bewertungen.** E-049 **behalten** (Datenpunkt 3 von 3, B4); E-057 weiter beobachten (Datenpunkt 2 von 3, Persona-
  Satz in `lead-*.md` nur nach Ruling); E-061 weiter (Datenpunkt 1 von 3). Wird E-049 behalten, ist ein Platz frei; der
  Wartende mit dem besten Nutzen ist E-048 (Reihenfolge R375).

## Bewertung laufender Experimente

- **E-049**: behalten vorgeschlagen (V4).
- **E-057**: Datenpunkt 2 von 3: Lese > 30 KB = 3 (Schwelle ≤ 2 verfehlt), Cache-Write 21,6 % (Schwelle ≤ 18 % verfehlt, aber
  −5,2 Punkte gegenüber Datenpunkt 1). Weiter beobachten; Hebelgrösse nach B1 klein.
- **E-061**: Datenpunkt 1 von 3 (B4), Schwellen erfüllt.

## Änderungen an lernen.md

- Neu: behaltenes Experiment muss in die Handbuch-Tabelle (B3); Produktivanteil als Messartefakt (B2).
- Ergänzt: Cache-Write-Ursache nach Rolle aufschlüsseln (B1); dritter Fall Rot-Beleg (B5 a).
- Gestrichen: Budget-Fix 2663c66 (R169), erledigt und ohne weiteren Fall. Stand: 40 Inhaltszeilen.
