# Retro meilenstein release-rel13 — 2026-10-09

- Datum: 2026-10-09
- Art: meilenstein (Release-Retro nach R127/R316)
- Auslöser: Push REL-13 `3417346..46153c6`, CI 37984641871, Pages 37985195805 (R425); Vorfall `meilenstein:REL-13`; L0-Pflichtbefunde R425/R426, R421, R424, Lieferkette I-028
- Datenbasis: `docs/studio/rulings.md` R412–R426, `.studio/events.jsonl` (Sessions `fb37ceac` ab 15:10 und `c64c0775` bis 20:13, per Skript gefiltert), `.studio/archiv/briefings/20261009-1957*.md`, `…-201209-production-integrator-8eDJ96Q3.md`, `git log 3417346..main`, `Makefile`, `docs/studio/STUDIO.md` Z. 319–320, 342, 374–377, `docs/studio/templates/ruling.md`, `python3 tools/studio/metrics.py --efficiency` (Historie, 39 Sessions). Zeiten in UTC (Event-Log); Commit-Zeiten in `git log` sind Ortszeit (+2 h). „HB“ = Heartbeat-Events, Näherung für Tool-Aufrufe. Nicht doppelt: verwaister Vitest-Worker (Session-Retro fb37ceac B3) und opus gegen Modelltabelle (R420 A1) werden nur zitiert.

## Befunde

### B1 · R425 erlaubte `worktree remove --force` gegen das Handbuch; der Guard fing es (Pflicht)

- Beobachtung: R425 (2) erlaubte `git worktree remove --force`, wenn `git status --porcelain` genau `?? .vitest/` zeigt. Das Briefing `…-201209-production-integrator-8eDJ96Q3.md` übernahm die Ausnahme wörtlich. Das Handbuch verbietet sie zweimal: `STUDIO.md` Z. 320 („nie `--force`“, R329) und Z. 377 (`worktree remove --force` unter „Verlust ungesicherter Arbeit“). Der Guard (`tools/studio/guard.py` Z. 322–323) sperrte den Befehl. Status `blocked` um 20:12:23, Korrektur R426. In R412–R426 hat kein Ruling das Vorlagenfeld „Kosten bei Irrtum“ (`templates/ruling.md`). Zuletzt stand es in R353, also fehlt es seit 73 Rulings. Alle 15 Rulings liegen über dem Richtwert von 60 Wörtern (73–236, Median 121). R425 hat 107 Wörter und enthält Ablaufdetails des Integrators.
- Wirkung: 1 gesperrter Schritt, 1 Korrektur-Ruling, 1 L0-Turn. 1 Worktree bleibt bis zum `.gitignore`-Fix in REL-14 stehen. Kein Datenverlust, weil der Guard griff.
- Deutung: Muster, kein Einzelfall. Dieselbe Session hat zwei weitere Rulings mit Handbuch-Bezug ohne Abgleich (R421 legt Handbuchtext aus, siehe B2; R424 ändert eine Dauerregel, siehe B3). Nur §6-Aktionen fängt der Guard mechanisch. Umkehrbare Abweichungen bleiben unbemerkt. 5-Why: Guard-Sperre ← Briefing befahl `--force` ← R425 erlaubte es ← L0 löste das Hindernis `.vitest/` vor Ort und schlug die geltende Regel nicht nach ← die Ruling-Vorlage fragt nicht nach der berührten höheren Regel, und die Frage nach den Kosten bei Irrtum ist seit R353 ausser Gebrauch. Hätte R425 sie beantwortet, wäre „`--force` verwirft ungesicherte Arbeit“ aufgefallen ← **Rulings sind Freitext ohne Abgleich mit Handbuch und Verfassung, obwohl sie Ablaufdetails festlegen, die ein Briefing wörtlich übernimmt.** Wirkung auf die Rangfolge: Ein Ruling steht in Verfassung §1.1 nicht in der Rangfolge. Im Briefing landet es auf der untersten Stufe, das Handbuch gilt also ohnehin. Der Widerspruch kostet trotzdem einen Lauf.

### B2 · R421 Push zu Sessionbeginn: wirksam; Risiko „L0 committet parallel“ trat ein (Pflicht)

- Beobachtung: Session-Start 19:56:10, Spawn PUSH-REL-13 um 19:57:13, Push nach Integrator-Bericht ≈ 20:05, CI und Pages grün um 20:11:20 (R425: `make test` 103 s, `make check` 134 s, Load < 3). L0 committete R422 (`49498bd`) um 19:57:50 auf main, während das Push-Gate lief. Das Briefing nennt in Schritt 3 `git push origin main`, nicht den geprüften Hash. Der L0-Nachtrag um 19:58:02 („Pushe genau den im Gate geprüften Commit“) wurde von lead-production um 19:58:06 weitergegeben. Gepusht wurde `46153c6:main`. R421 selbst nennt `main @ f0307c0`, gepusht wurde der Ruling-Commit `46153c6`. Planer bekamen Testläufe erst nach dem Push wieder frei (Nachrichten 20:11:45 und 20:11:47).
- Wirkung: REL-13 war 14 min nach Sessionbeginn live statt erst am Session-Ende. Das Push-Gate lief ohne Lastkonflikt. Es kostete 1 Nachtrag und 1 zusätzlichen lead-production-Turn. Ohne den Nachtrag wären ungeprüfte Doku-Commits mitgegangen (nur Doku, CI-Risiko gering).
- Deutung: In der Sache positiv. Die Auslegung „am Session-Ende = nach Abschluss des zu pushenden Stands“ dient dem Zweck von R335 (ein Push je Session) besser als der Wortlaut. Sie ist aber dieselbe Mechanik wie B1: Ein Ruling biegt Handbuchtext (`STUDIO.md` Z. 342), statt ihn per Handbuch-Minor zu ändern. Das Risiko liegt in der Vorlage: Ein Push-Befehl mit Branch-Namen statt Hash ist nur sicher, solange niemand parallel auf main committet. Ein Push zu Sessionbeginn macht genau das wahrscheinlich, weil L0 dann Rulings schreibt. Muster offen. Das ist der erste belegte Nachtrag zum Push-Ziel.

### B3 · R424 Obergrenze 5 → 8: bisher ohne Wirkung, Risiko gering, eine Regelstelle veraltet (Pflicht)

- Beobachtung: Höchstzahl gleichzeitig laufender Agenten (zwischen `agent_start` und `agent_stop`): Session fb37ceac 3 (14:04:05), Session c64c0775 4 (19:58:37: Integrator, lead-design, lead-art, lead-tech). Die Grenze 5 war in beiden Sessions nicht bindend. Bei I-028 begrenzte Parallelität 1 je Strang (R416) und die Last (Load 20, Session-Retro fb37ceac B3), nicht die Obergrenze. Die Entscheidung fiel in 70 s nach der Nutzerfrage (Prompt 20:00:10, Turn-Ende 20:01:20), ohne lead-production, aus dessen Gate-Bedenken R241 stammt. `docs/studio/state.md` Z. 70 nennt weiter „studioweit ≤ 5 Arbeiter (R241)“.
- Deutung: Das Risiko ist gering. TOOL-TESTLOCK (ein voller Lauf, Abbruch bei Load > 8) und die neue Grenze von 2 Browser-Läufen decken die Last ab, die R241 begründete. Ownership-Konflikte bleiben über die Datei-Ownership je Strang geregelt. Die Prüfung in der nächsten Session-Retro steht im Ruling. Sie braucht eine Schwelle, sonst ist sie nicht entscheidbar (siehe Ampel, Messauftrag). L0 darf eine Ruling-Regel (R241) per Ruling ändern, das ist kein Fall von B1. Die Dauerregel in `state.md` ist aber jetzt doppelt geführt und widersprüchlich (Befund ausserhalb Scope, Bericht).

### B4 · Lieferkette I-028: Brainstorming bis live 6 h 08 min, davon 2 h 23 min T2 unter Last (Pflicht)

| Abschnitt                             | Zeit (UTC)  | Dauer   | Warten / Übergabe / Doppelarbeit                                                                                                              |
| ------------------------------------- | ----------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Brainstorming → Plan frei (R412–R416) | 14:03–14:56 | 53 min  | Gates ≈ 7 min, Nacharbeit 12 min (Retro REL-12 B4)                                                                                            |
| Warten auf Push-Gate REL-11/12        | 14:56–15:14 | 18 min  | bewusst seriell (R416: Last fürs Push-Gate)                                                                                                   |
| T0 + T1a + Review                     | 15:14–15:40 | 26 min  | Review 1,2 min                                                                                                                                |
| T1b + Review                          | 15:40–16:05 | 25 min  | Review-Urteil 16:01:04, `agent_stop` 16:05:47: 4,7 min ohne HB                                                                                |
| Briefing T2 durch lead-tech           | 16:05–16:11 | 5 min   | –                                                                                                                                             |
| T2 UI (tech-ui-engineer)              | 16:11–18:34 | 143 min | Load 20 durch verwaisten Vitest-Worker, Timeouts, Lastwarten (Session-Retro fb37ceac B3)                                                      |
| Review T2 + `make check` Controller   | 18:35–18:56 | 21 min  | Urteil 18:35:56, `agent_stop` 18:51:23: 15,5 min ohne HB, Ende 5 s nach Nutzer-„mach weiter“; `make check` zweimal (Last)                     |
| Instanz 2: T3, 3 Fix-Runden, T4       | 18:57–19:23 | 26 min  | 3 Fix-Runden (CSS, 2× arc42), je Fix + Nachprüfung ≤ 3 min; 6 Wiederaufnahmen lead-tech                                                       |
| Gate Merge (lead-qa) → Merge          | 19:23–19:29 | 6 min   | BEDENKEN nur formal; Integrator `make check` + `check-ci-perf` auf `d7291aa`                                                                  |
| Release-Check REL-13 (lead-qa)        | 19:31–19:35 | 4 min   | zweiter lead-qa-Start in 8 min auf gleichem Code (R419: Delta leer)                                                                           |
| Session-Abschluss, Sessionwechsel     | 19:35–19:57 | 22 min  | Wartezeit nur durch R335 (ein Push je Session), Session-Retro, Handbuch 1.36                                                                  |
| Push-Gate REL-13                      | 19:57–20:11 | 14 min  | `make test` + `make check` + `zeitreserve-push` auf Code, der seit `aee3c6b` unverändert ist (`git diff aee3c6b 46153c6 -- src tests …` leer) |

- Beobachtung: Vom fertigen Code (`5f14317`, 19:21) bis live vergingen 50 min. Davon fielen 10 min auf Gates und Merge, 22 min auf Session-Abschluss und -wechsel und 14 min auf das Push-Gate. Auf identischem Code-Baum liefen 3 volle `make check` (`aee3c6b` 19:16–19:18, `d7291aa` 19:26–19:29, `46153c6` im Push-Gate) und dazu 1 `make test` im Push-Gate. `make check` enthält `test` (`Makefile` Z. 73–76: `check-run: conflicts lint zeittests test zeitreserve …`). Jedes Push-Gate fährt also zwei volle Testläufe. Das ist ein Muster: Alle 5 Push-Briefings vom 2026-10-09 (`…-104039`, `…-105535`, `…-110804`, `…-144732`, `…-195738-production-integrator-*`) schreiben `make test` und danach `make check` vor.
- Deutung: Die Kette verlor ihre Zeit an zwei Stellen. Erstens in T2 durch Last, ein Befund der Session-Retro, der hier nicht doppelt gezählt wird. Zweitens in der Freigabestrecke nach fertigem Code, durch Doppelarbeit: zwei lead-qa-Starts auf demselben Stand, zweifacher Testlauf im Push-Gate. 5-Why zum Push-Gate: zwei volle Läufe ← Ablauf `make test` → `zeitreserve-push` → `make check` ← `zeitreserve-push` braucht eine frische Messung „nach make test“ (R394/R396) ← als der Schritt eingeführt wurde, blieb `make check` als zweiter Schritt stehen ← **beim Einfügen eines Schritts wurde nicht geprüft, ob ein vorhandener Schritt ihn schon enthält.** Der dreifache `make check` über Merge und Push folgt aus der Verfassung (§7.1 vor Merge, §7.2 vor Push). Eine Auslegung „Prüfung auf identischem Code-Baum genügt“ wäre eine Verfassungsfrage, gehört also nach B1 in die Nutzer-Warteschlange und nicht in ein L0-Ruling. Die beiden Leerläufe nach dem Urteil (4,7 und 15,5 min ohne HB) fallen in die Lastphase. Die Ursache ist unbelegt (Messauftrag in der Ampel).

### B5 · Positiv

- REL-13 ist live, CI und Pages beim ersten Versuch grün. Kein Integrator-Abbruch im Merge I-028 und im Push-Gate REL-13. Der Release-Check REL-13 lief ohne Browser-Leistungsmessung (R417 V3, Handbuch 1.35). Das Push-Gate lief parallel zu Kurzdesign, Fels-Urteil und zwei Plänen, ohne Konflikt. Der Guard hat einen Ruling-Fehler aufgehalten, bevor Arbeit verloren ging (B1).

## Effizienz-Ampel

Quelle: `metrics.py --efficiency` (Historie, 39 Sessions). Die Session-Werte für c64c0775 folgen in der Session-Retro.

| Kennzahl               | Wert (Historie) | Ampel | Befund / Ursache                                                                                                                                                                                                                   | Hebel oder Messauftrag mit Frist                                                                                                                                                                               |
| ---------------------- | --------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Steuerungsanteil       | 50,9 %          | rot   | Beobachtung: In c64c0775 gab es bis 20:13 9 `agent_start`, davon 0 Umsetzer. Release, Design-Urteil und Planung sind Steuerung. Fünfte Retro in Folge rot                                                                          | Hebel per Ruling: E-049 (R420 V2, gestartet); dazu V3 (ein lead-qa-Start weniger je Ein-Paket-Release); kein weiterer Hebel                                                                                    |
| Cache-Write 5 min      | 29,1 %          | rot   | Beobachtung: lead-tech Instanz 1 wartete 143 min auf T2 und wurde 8-mal wieder aufgenommen. Reviewer liefen nach dem Urteil 4,7 und 15,5 min ohne HB weiter (B4)                                                                   | E-037, E-042 (R420); Messauftrag studio-coach bis Session-Retro c64c0775: Zahl der Fälle „Status done → `agent_stop` > 2 min“ über die letzten 3 Sessions und deren Last                                       |
| L0-Kontext Max         | 774k            | rot   | Historienwert aus 29c3791b; der Session-Wert c64c0775 steht erst am Session-Ende                                                                                                                                                   | Messauftrag studio-coach, Session-Retro c64c0775: L0-Max gegen die Übergabeschwelle                                                                                                                            |
| opus-Anteil            | 71,9 %          | gelb  | Beobachtung: Gate Merge I-028 und Release-Check REL-13 (lead-qa) liefen auf opus (Spawn 19:23:32, 19:31:03). Das ist bereits R420 A1                                                                                               | E-038 / TOOL-MODELL-GUARD (R420 V1); zur Obergrenze: Messauftrag studio-coach, Session-Retro c64c0775 mit Schwelle für R424: Höchstzahl gleichzeitiger Agenten, Load-Spitzen > 8 = 0, Testsperren-Abbrüche ≤ 1 |
| Grösste gelesene Datei | 66,7 KB         | gelb  | Beobachtung: `.superpowers/sdd/steuer-je-stufe/review-final-3417346..aee3c6b.diff`, also der Final-Review I-028 über den ganzen Diff. `docs/beobachtungen.md` ist seit `bcc97f5` 36 KB, damit ist der Messauftrag aus R417 erfüllt | R420 V3 (Final-Review liest den Diff je Datei), erste Wirkung ab REL-14                                                                                                                                        |
| übrige Zeilen          | –               | grün  | –                                                                                                                                                                                                                                  | –                                                                                                                                                                                                              |

## Befragung der Leads

- Nicht befragt (Release-Retro, ein Start). Quellen: Ruling-Texte, Event-Log und archivierte Briefings.

## Vorschläge

Höchstens 3, nach Hebel sortiert. Eintrag in `experimente.md` erst nach einem Ruling.

### V1 · Ruling-Vorlage: Regelbezug und Kosten bei Irrtum als Pflichtteile

- Hypothese: Jedes Ruling nennt in einem Halbsatz „Regelbezug: keine | <Handbuch-/Verfassungsstelle>“, und das vorhandene Feld „Kosten bei Irrtum“ ist wieder Pflicht. Dann fallen Widersprüche zu höheren Regeln beim Schreiben auf, nicht erst am Guard (B1). Weicht ein Ruling vom Handbuch ab, ändert der studio-coach das Handbuch im selben Zug per Handbuch-Minor. Eine Abweichung von der Verfassung geht in die Nutzer-Warteschlange. Der erste Anwendungsfall ist die Auslegung aus R421 („Push nach Abschluss des zu pushenden Stands, höchstens einmal je Session“) als Wortlaut in `STUDIO.md` Z. 342.
- Erwartete Einsparung: je vermiedenem Fall ein gesperrter Lauf, ein Korrektur-Ruling und ein L0-Turn (B1). Dazu entfällt die Doppelführung von Regeln in Ruling und Handbuch.
- Messgrösse: Korrektur-Rulings wegen Widerspruchs zu Handbuch oder Verfassung = 0 und Guard-Sperren, die ein Briefing ausgelöst hat, = 0 in den nächsten 30 Rulings (Ausgang 1 in 15: R425/R426). Das Feld „Regelbezug“ steht in ≥ 90 % dieser Rulings (Zählung per `grep`).
- Messbarkeit: Das Feld ist per `grep` zählbar, Guard-Sperren stehen als `blocked` im Event-Log.
- Rückfall: Feld streichen, Vorlage wie vorher.
- Aufwand: klein (studio-coach: `templates/ruling.md` eine Zeile, `STUDIO.md` ein Satz und der R421-Wortlaut).
- Betroffene Regel: `templates/ruling.md` (R129), `STUDIO.md` Z. 342 (R335).

### V2 · Push-Gate: `make test` streichen, Push immer auf den geprüften Hash

- Hypothese: `make check` enthält `test` und `zeitreserve` (`Makefile` Z. 76). Der Ablauf „`make check` (Load ≤ 3) → Last ≤ 4 abwarten → `make zeitreserve-push` → `make check-ci-perf`“ prüft damit dasselbe wie heute, mit einem vollen Testlauf weniger (B4). Lautet der Push-Befehl in der Vorlage fest `git push origin <geprüfter Hash>:main`, sind parallele L0-Commits auf main gefahrlos, und der Nachtrag aus B2 entfällt.
- Erwartete Einsparung: je Push-Gate ≈ 100 s Testlauf, eine Belegung der Testsperre und ein Lastabklingen (Ausgang `make test` 103 s, R425). Bei 3 bis 5 Push-Gates je Tag sind das ≈ 5–10 min Wanduhr. Dazu kommt 1 Nachtrag je Push mit parallelen Commits.
- Messgrösse: volle Vitest-Läufe je Push-Gate = 1 (heute 2) in den nächsten 3 Push-Gates. Integrator-Start → Push ≤ 6 min bei Load < 3 (Ausgang ≈ 8 min, 19:57:38 → ≈ 20:05). L0-Nachträge zum Push-Ziel = 0.
- Messbarkeit: Der Integrator-Bericht nennt die Laufzeiten je Schritt weiter. `.studio/zeitreserve.json` bleibt erhalten, weil der Testschritt in `check` sie schreibt.
- Vorbedingung: lead-tech bestätigt einmal, dass `zeitreserve-push` die von `make check` geschriebene Messung genauso akzeptiert wie die aus `make test` (R394 `loadStart`). Wenn nicht, gilt der Rückfall.
- Rückfall: `make test` wieder vorschalten.
- Aufwand: klein (studio-coach: `STUDIO.md` Z. 342 und das Push-Muster im Briefing; die Prüfung läuft beim nächsten Push mit).
- Betroffene Regel: `STUDIO.md` Push-Ablauf (R335, R394/R396, R398/R410).

### V3 · Ein-Paket-Release: Gate Merge und Release-Check in einem lead-qa-Start

- Hypothese: Besteht ein Release aus genau einem Paket und bringt der Merge kein Code-Delta gegenüber dem Final-Review-Stand (R249 (1)), dann läuft der Smoke-Lauf (`smoke.mjs`) im Gate Merge mit. L0 entscheidet Gate Merge und Gate Merge Release in einem Ruling über denselben Bericht. Bei I-028/REL-13 lagen beide lead-qa-Starts 8 min auseinander auf demselben Code (B4).
- Erwartete Einsparung: je Ein-Paket-Release 1 lead-qa-Start (≈ 4 min, Startkontext ≈ 27k) und ein Ruling.
- Messgrösse: lead-qa-Starts je Ein-Paket-Release = 1 (heute 2) in den nächsten 3 solchen Releases, ohne Release-Fund nach dem Push (CI rot oder Hotfix = 0).
- Messbarkeit: Die Starts sind im Event-Log je Paket-ID zählbar, der Smoke-Bericht liegt weiter unter `.studio/qa/<REL>/`.
- Rückfall: wieder getrennte Läufe.
- Aufwand: klein (studio-coach: ein Absatz in `gates.md`, Abschnitt Gate Merge Release).
- Betroffene Regel: `gates.md` Gate Merge Release (E-028, R208), R249.

Empfehlung: V1, V2 und V3 annehmen. V1 zuerst, weil es auch den Wortlaut von R421 heilt.

## Bewertung laufender Experimente

- R417 V1 (Formatzeile im Plan-Briefing, AK-Nummern im Ruling): noch kein Gate Plan danach. Das kombinierte Gate REL-14 läuft seit 20:13.
- R417 V3 (Leistungs-AK per Test): 1 von 3 Release-Checks, 0 Urteile „unter Last ungültig“ (R419).
- R417 V2 / TOOL-PRETTIER-HOOK: noch nicht umgesetzt. Seit R417 gab es 0 lint-Abbrüche in 2 Integrator-Läufen (Merge I-028, Push REL-13).
- R410 V1 (Integrator-Vorlauf): 2 weitere Gates ohne Abbruch, damit 2 von 5 Code-Gates sauber.
- E-037, E-042, E-046, E-049, E-050: Bewertung in der Session-Retro c64c0775.

## Änderungen an lernen.md

- keine (Sache des studio-coach nach einem Ruling)
