# Plan TOOL-MESSFENSTER · V3 Messfenster-Sperre + V4 Messgüte per A/A-Kontrolle (Stufe leicht, Werkzeug-Paket)

Owner `lead-tech` (Plan-Instanz, sonnet, E-054) · Quelle: Retro `docs/studio/retros/2026-10-22-adhoc-last.md` (B4, V3, V4), R810, R823 · Plan gegen main `9451237e`.
**Kein Save, kein Spielwert, keine Abhängigkeit (ADR-001), kein ADR nötig** (reversibel: Sperrdatei und Gate lassen sich per Ruling zurücknehmen).

## Entscheide des Plans

- **P-1 Eine Sperre, ein Ort.** `<Hauptrepo>/.studio/messfenster` (JSON: `owner`, `pid` optional, `start`, `ende` erwartet, `zweck`, `cwd`). Der Pfad wird aus `git rev-parse --git-common-dir` (Elternordner) aufgelöst, damit alle Worktrees dieselbe Datei sehen (wie `studio-testlock`). `.studio/` ist ignoriert. Test-Überschreibung `MESSFENSTER_PATH` (nur Tests, R378).
- **P-2 Eine Implementierung.** `tools/messfenster/lock.ts` (Node, Typ-Stripping wie `testlock.ts`): reine Funktionen `readLock`, `isOrphan`, `acquire`, `release`, `status` plus CLI `set|clear|status` (Exit 0 frei/gesetzt, 3 belegt). `testlock.ts`, `render-qa/*.mjs` importieren sie; `pushcheck.py` ruft die CLI (`node tools/messfenster/lock.ts status`), kein zweiter Parser in Python.
- **P-3 Verwaist** (Sperre wird beim nächsten Zugriff mit Hinweis auf stderr gelöscht): `pid` gesetzt und tot (`kill -0`, EPERM = lebt), **oder** `jetzt > ende + 5 min` (Karenz). Ohne `pid` (L0 setzt den Block von Hand, `make messfenster-sperre`) zählt nur die Zeitgrenze. Löschen nur unter Wächter-Verzeichnis `<datei>.takeover` (mkdir atomar), Muster aus `testlock.ts`. Grenzen: PID-Wiederverwendung → Zeitgrenze fängt es; abgebrochene Session (e6dbb809) → PID tot → frei.
- **P-4 Gegenseitiger Ausschluss ohne Wettlauf (Dekker-Muster):** erst eigene Sperre atomar setzen (`link`), dann die andere prüfen; belegt → eigene lösen, Exit 3. `testlock.ts`: Testsperre nehmen, dann Messfenster prüfen. Messstart: Messfenster nehmen, dann `studio-testlock` prüfen (lebender PID = «Testsperre belegt»). Mindestens eine Seite sieht die andere.
- **P-5 Meldung:** `testlock: ABBRUCH, Messfenster (Eigentümer <owner>, <zweck>, bis <ende>)`; Präfix `testlock: ABBRUCH` bleibt, damit `pushcheck.py`/`testrun.py` weiter Exit 3 erkennen. Event `load_abort` über `loadsnap.py` mit `reason=messfenster` (Freitext-Feld, keine Änderung an `loadsnap.py` nötig; TOOL-LOADSNAP `tool/loadsnap` ändert nur `script_name`, kein Konflikt).
- **P-6 Eintrittspunkte der Messwerkzeuge:** `sitzung.mjs` (Gate für `perf.mjs`, `hitch.mjs`, `smoke.mjs`) und `perf-lauf.sh` rufen `messsperre.mjs` (`withMessfenster`) statt nur `lastgate`. `make messfenster ARGS="--run -- <befehl>"` setzt die Sperre für den ganzen Block (`--dauer <min>`, `--zweck`, setzt `MESSFENSTER_HELD=<pid>`, Kinder nehmen keine zweite). Einzelaufruf ohne Wrapper: eigene Sperre, Vorgabe 20 min. **`kantenprofil.mjs` liegt nicht auf main** (nur in ORT-A-Strängen): wird über `make messfenster --run` abgedeckt; T04 trägt den Einbau (`withMessfenster`) in der README als Pflicht für neue Messwerkzeuge ein, ORT-A zieht ihn beim Merge nach.
- **P-7 Messgüte:** `tools/render-qa/aagate.mjs` (rein, testbar) wertet die A/A-Kontrolle desselben Blocks aus und liest die Grenzen aus `tools/render-qa/aa-grenzen.json`. Urteil `gueltig` / `ungueltig (A/A ausserhalb)`. Last (`loadavg`) und fremde Prozesse (`messfenster.mjs`-Liste) wechseln dann von Tor zu **Warnung** im Messbericht. Der Wechsel steht in T06, erst nach T00.
- **P-8 Streuungsgrenze (Datenlage unten):** Hitch ist belegt, Render-Median nur vorläufig → **Mess-Task T00** vor dem Schalter. Fällt T00 negativ aus (A/A erkennt Last nicht), bleibt Load ≤ 4 Tor (Rückfall, nur T06 entfällt).

## Datenlage zur Streuungsgrenze (aus Logs, nicht neu gemessen)

| Quelle (Scratchpad 3b332328 / e6dbb809, `.studio/qa/ort-a/`)                                                                                               | Befund                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Hitch A/A `--ohne-bau`, Last ≤ 4 (`h4/`, e6dbb809 `h/`; ort-a `messung-k1.md` «Kontrolle A/A = 0»)                                                         | je Seed `baseMedian` 16,7 ms identisch, Σ`over25` = 0 in allen Fenstern; 3 von 3 Blöcken                                                 |
| Hitch A/A bei Last bis 6,5 (`h3/`, «Block mit Ausreißern ungültig», `messung-k1.md` Z. 17)                                                                 | 4 von 12 Fenstern gestört: `over25` 21 bis 25, `max` 50 bis 67 ms; Σ ≥ 90                                                                |
| Render-Median, Paare ohne erwarteten Effekt (`m4.log`, `t14b/c.log`, `m2.log` T14-AK30/T17 Seeds, `m3.log` Fixture; ≈ 10 Paare, Last vor Lauf 2,4 bis 3,7) | Δ = 0 bis ±0,4 ms, ±2,2 %; Fixture-Profil (≈ 3 ms) 0 bis −3,2 %; Ausreisser −41,9 % ist ein echter Effekt (T17-AK39-save), kein Rauschen |
| Echte Render-A/A (gleicher Stand gegen sich)                                                                                                               | **fehlen** (nur A/B ohne Effekt)                                                                                                         |

**Vorläufige Grenzen** (in `aa-grenzen.json`, Quelle vermerkt): Hitch Σ`over25`(A/A) ≤ 2 (Lücke 0 gegen ≥ 90 trägt die Grenze; gilt nur zusammen mit «kein Fenster mit `max` > 40 ms»); Render-Median |Δ| ≤ max(0,4 ms; 3 %) je Profil. Der Hitch-Wert ist durch die Daten gedeckt, der Render-Wert nicht belastbar (keine echten A/A, nur 2 Profile) → T00.

## Mess-Task T00 (Datenerhebung, ein Messfenster ≈ 70 min)

Je Profil (Seed 7 und 14 mit `focus mountain`, Fixture `ort-a-siedlung.json`, Hitch Seeds 7/14) **8 echte A/A-Paare** (`--a . --b .`, abwechselnd A,B): 4 bei Last ≤ 3 (Ruhe), 4 bei künstlicher Last 6 bis 8 (zwei bis vier `yes > /dev/null` per PID, danach per PID beenden, nie `pkill -f`). Ergebnis: Tabelle in `.studio/qa/tool-messfenster/aa-daten.md` (Rohwerte, Load vor/nach, Streuung). **Ableitung:** Grenze = 1,5 × grösste Ruhe-Abweichung, aufgerundet auf 0,1 ms / 1 %. **Abnahme:** (a) alle Ruhe-Paare innerhalb der Grenze; (b) mindestens 3 von 4 Last-Paaren ausserhalb → die A/A-Kontrolle erkennt Störung. (b) verfehlt ⇒ V4 nicht tragfähig, Load bleibt Tor (T06 entfällt, Ruling-Entwurf E4 wird zur Ablehnung). Die Messung läuft unter der neuen Sperre (Dogfooding), keine Testläufe parallel.

## Tasks

| ID  | Titel                                                                                                                              | Dateien (Ownership)                                                                                                                                                                           | Strang | blocked-by    | Modell                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------- | ------------------------ |
| T01 | Sperr-Bibliothek + CLI, Verwaisterkennung                                                                                          | `tools/messfenster/lock.ts` (neu), `tests/tools/messfenster.test.ts` (neu), `Makefile` (Ziele `messfenster-sperre`/`messfenster-frei`)                                                        | A      | –             | sonnet                   |
| T02 | `testlock.ts` bricht bei Messfenster ab, Gegenrichtung für Messstart                                                               | `tools/testlock/testlock.ts`, `tests/tools/testlock.test.ts`                                                                                                                                  | A      | T01           | sonnet                   |
| T03 | `pushcheck.py` ohne Warten bei Messfenster (Exit 3), `zeitreserve-gate`, Event `reason=messfenster`                                | `tools/studio/pushcheck.py`, `tools/studio/tests/test_pushcheck.py`                                                                                                                           | A      | T02           | sonnet                   |
| T04 | Messwerkzeuge setzen/lösen die Sperre; `messfenster.mjs --run --dauer --zweck`; Testsperre belegt ⇒ kein Start                     | `tools/render-qa/messsperre.mjs` (neu), `sitzung.mjs`, `messfenster.mjs`, `perf-lauf.sh`, `README.md`, `tests/tools/renderqa.test.ts`                                                         | B      | T01           | sonnet                   |
| T05 | `aagate.mjs` + `aa-grenzen.json` (vorläufig), Make-Ziel `messguete`                                                                | `tools/render-qa/aagate.mjs`, `aa-grenzen.json` (neu), `Makefile` (eine Zeile), `tests/tools/renderqa.test.ts` (eigener Block)                                                                | B      | –             | sonnet                   |
| T00 | Mess-Task A/A (siehe oben)                                                                                                         | `.studio/qa/tool-messfenster/`, `tools/render-qa/aa-grenzen.json` (Werte)                                                                                                                     | C      | T04, T05      | sonnet (`qa-playtester`) |
| T06 | Schalter: Load und Fremdprozesse nur Warnung, Gültigkeit per A/A; `lastgate` bleibt für `testlock`-unabhängige Skripte als Warnung | `tools/render-qa/lastgate.mjs`, `sitzung.mjs`, `messfenster.mjs`, Tests                                                                                                                       | B      | T00 (positiv) | sonnet                   |
| T07 | Doku: STUDIO.md Lastregel, README, Rulings, Handoff                                                                                | `docs/studio/STUDIO.md` (Abschnitt Lastregel Z. ≈ 455 bis 466), `tools/render-qa/README.md`, `docs/arc42.md` nur falls Werkzeug-Kapitel existiert; `lernen.md` Z. 25 **nicht** (studio-coach) | A      | T03, T06      | sonnet                   |

Alle Tasks TDD: Test zuerst rot (Vitest unter `tests/tools/`, Python `unittest` unter `tools/studio/tests/`), dann Code. Testfälle:

- T01: frei/belegt/verwaist (tote PID, Zeit über `ende` + Karenz, ohne PID nur Zeit), atomares Setzen (zweiter `set` ⇒ Exit 3), `clear` löscht nur die eigene (PID/Owner), Wächter-Übernahme, Testsperre lebt ⇒ `acquire` verweigert.
- T02: `testlock` mit gesetzter `MESSFENSTER_PATH`-Sperre ⇒ Exit 3 und Text «Messfenster»; verwaiste Sperre ⇒ übernommen, Lauf startet; CI/`STUDIO_TESTLOCK_HELD` unberührt; Reihenfolge Dekker (Messfenster erscheint zwischen Testsperre und Prüfung ⇒ Testsperre wird gelöst).
- T03: Fake-Runner liefert Exit 3 «Messfenster» ⇒ pushcheck bricht ohne Load-Warteschleife ab, kein `test_failed`-Event, `load_abort reason=messfenster`.
- T04: Fake-Load/Fake-Prozessliste wie in `renderqa.test.ts`; `withMessfenster` setzt/löst auch bei Exception und SIGTERM; `MESSFENSTER_HELD` verhindert zweite Sperre; Testsperre lebt ⇒ Exit 3 «Testsperre belegt».
- T05: Fixtures aus den Datenlage-Dateien (sauberer Block, gestörter Block `h3`, Grenzfälle auf der Grenze = gültig); Parser für `hitch`-Ausgabe und `perf`-JSON-Zeile (`deltaPct`, `deltaMs`).
- T06: Load 9 + A/A innerhalb ⇒ gültig mit Warnung; Load 2 + A/A ausserhalb ⇒ ungültig.

## Schnittstellen und Handbuch

- `testrun.py`: keine Änderung (`studio-test`, `zeittests` laufen nicht unter `testlock`); T03 prüft nur, dass Exit 3 kein `test_failed` erzeugt. `pushcheck.py`: bereits `3 if "testlock: ABBRUCH" in output`; neu nur der Vorab-Check, damit nicht bis zur Load-Frist gewartet wird. `loadsnap.py`: unverändert, neuer `reason`-Wert. Reihenfolge der Merges mit TOOL-LOADSNAP beliebig.
- Handbuch STUDIO.md Lastregel (Z. ≈ 455 bis 466): R329 «Messung nur bei Load ≤ 4» wird zu «Messung gilt, wenn A/A im Block innerhalb der Grenze; Load ist Warnung»; R380/R375 (Testsperre, Load > 8 für `make check`) bleibt; R800 (Vermerk «fremder Leerlauf-Chrome») entfällt als Vorbehalt, Fremdprozess steht automatisch als Warnung im Bericht. Messen und Testen schliessen sich über die Sperren aus (löst R803 «nie beides gleichzeitig» im Werkzeug).

## Ruling-Entwürfe

- **R824-E1 (V3):** `.studio/messfenster` ist die einzige Koordination zwischen Messung und Testlauf; Messwerkzeuge setzen/lösen sie, `testlock` bricht mit «Messfenster» ab; verwaist nach Tod des PID oder `ende` + 5 min. L0 plant Blöcke (Dauer 70 min) am Sessionanfang oder nach einer Merge-Welle; Merges davor, Prüfläufe danach.
- **R824-E2 (Gegenrichtung):** Messstart bei lebender Testsperre bricht mit Exit 3 ab; kein Warten, kein Löschen fremder Sperren.
- **R824-E3 (V4, Grenzen):** Streuungsgrenzen stehen in `tools/render-qa/aa-grenzen.json` mit Datenquelle; Änderung nur per Ruling nach neuer Mess-Task-Tabelle. Vorläufig (bis T00): Hitch Σ`over25` ≤ 2, Render-Median ≤ max(0,4 ms; 3 %).
- **R824-E4 (V4, Schalter, wirksam erst nach T00 positiv):** Eine Messung gilt, wenn die A/A-Kontrolle desselben Blocks innerhalb der Grenze liegt; Load > 4 und fremde Prozesse sind Warnung im Bericht. R329 (Lastgrenze der Messung) und der Vermerk aus R800 entfallen. Rückfall: Load ≤ 4 als Tor.
- **R824-E5:** Neue Messwerkzeuge (z. B. `kantenprofil.mjs` beim ORT-A-Merge) müssen `withMessfenster` nutzen oder per `make messfenster --run` laufen.

## Strang- und Merge-Plan, Budgetvorschlag

Integrationsbranch `feat/tool-messfenster` ab main; Strang A `feat/tool-messfenster-a` (`.worktrees/tool-messfenster-a`, T01 → T02 → T03, danach T07), Strang B `feat/tool-messfenster-b` (`.worktrees/tool-messfenster-b`, T05 sofort parallel, T04 nach T01-Commit auf A, danach T06). Dateien disjunkt ausser `Makefile` (A: T01-Ziele, B: eine Zeile T05; getrennte Hunks, Merge-Reihenfolge A vor B) und `tests/tools/renderqa.test.ts` (nur B). T00 läuft im Integrationsbranch nach Merge A+B in einem exklusiven Messfenster (andere Tests pausiert, Umsetzung ohne Testlauf nur Design/Plan).

Budget (Phase «TOOL-MESSFENSTER»): Umsetzer A 1, Umsetzer B 1 (Fortsetzung per SendMessage zählt nicht), T00-Messung 1, Doku T07 1, Task-Reviews je Strang 2, Final-Review `opus` 1, Controller 1 = 8; plus 30 % = 10,4 → **11 Starts**, Parallelität 2 (A ∥ B), während T00 Parallelität 1 ohne Testläufe. Umfang je Strang etwa 150 bis 250 Zeilen, jeweils 1 Umsetzer-Start (sonnet, Werkzeug-Paket ohne Architekturentscheid). Die Plan-Instanz wählt `sonnet` (E-054); Controller-Modell entscheidet L0 (ein Umsetzer je Strang ⇒ Lead sonnet oder direktes Briefing).

## Risiken

1. **A/A erkennt Last nicht** (A und B gleich gestört): Abnahme (b) von T00; abwechselnde Läufe A,B,A,B mildern, belegen muss T00. Folge: T06 entfällt, Rest (V3) bleibt gültig.
2. **Render-Grenze auf dünner Basis** (keine echten A/A, 2 Profile): T00; bis dahin gilt sie nur als vorläufig gekennzeichnet, kein Merge-Gate stützt sich darauf.
3. **Sperre hängt** (kill -9, Rechnerschlaf über `ende`): Zeitgrenze + Karenz 5 min; Schlaf ist ein Randfall, `caffeinate` bleibt Pflicht.
4. **`kantenprofil.mjs` fehlt auf main:** Einbau erst beim ORT-A-Merge (E5); bis dahin Wrapper-Pflicht.
5. **Block blockiert Prüfläufe bis 70 min** (Retro V3-Risiko): L0-Planung; `make messfenster-sperre` mit `--dauer` zeigt «bis»-Zeit in der Abbruchmeldung.
6. **Wettlauf Messstart/Testlauf:** durch P-4 abgedeckt, Test in T02.
