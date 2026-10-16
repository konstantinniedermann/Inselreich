# Plan UI-HAEPPCHEN-B · «Lager voll» als Problem, Bilanz-Vorschau bei Bau und Ausbau (Kurzplan, Stufe leicht)

Owner `lead-tech` · Quelle: `docs/ideen.md` I-085, I-078 (Rangliste IDEEN-08, Platz 1 und 2); R566, R573 (Lehren aus Gate A).
Umsetzung **nach UI-HAEPPCHEN-A** (`2026-10-12-ui-haeppchen-a.md`), das nach UI-AUFRAEUM-2 kommt. Main-Stand `d7f68071+` gelesen (M14-E1 ist drin).
Spielerwirkung: Der Spieler sieht, dass Ware verfällt, und springt zu den Erzeugern (I-085); er sieht vor dem Klick, wie die Bilanz nach Bau oder Ausbau aussieht (I-078).
**Kein Sim-Eingriff** (`src/sim/` nur lesend, `git diff src/sim/` leer), **kein Save-Sprung**, keine neue Abhängigkeit (ADR-001), Spielwerte unberührt, Baseline bitgleich.

## Lücke für das Gate (E-061)

Zu beiden Ideen gibt es **keine Spec mit AK**; die AK stehen unten im Plan, das Gate bestätigt sie. Vom Gate zu entscheiden:

1. **«Lager voll seit t» ohne Save:** Empfehlung **UI-Zustand** (`Map<Schlüssel, Tick>` in der `app.ts`-Closure, wie `problemCursor`), kein Sim-Feld. Preis: Nach Laden oder Neustart läuft die 30-s-Frist neu (der Eintrag erscheint 30 s später). Alternative Sim-Feld `fullSince` = Save-Version, Migration, Baseline-Risiko für eine reine Anzeige: verworfen. Die Frist zählt in **Spielzeit** (Ticks, bei Pause steht sie), nicht in Echtzeit.
2. **«Voll» heisst Verlust:** Eintrag nur, wenn `stock ≥ STORAGE_CAP` **und** mindestens ein nicht stillgelegter, angebundener Erzeuger des Guts im Zustand `storageFull` steht. Ein volles Lager ohne Stau (Lager durch Handel gefüllt) ist kein Problem.
3. **Bilanz-Vorschau ohne Stilllegen und ohne Haus-Aufstieg:** `docs/ideen.md` I-078 nennt auch «Stilllegen»; hier ausgeklammert (halber Unterhalt, eigener Schalter, Folgehäppchen). Ebenso der Aufstieg Haus → nächste Stufe.
4. **Wohnhaus:** Steuer bei voller Belegung nur als «bis zu» (lead-design); Obergrenze = Steuer eines voll belegten, voll versorgten Hauses der Stufe 1 bei aktueller Steuerstufe und Edikt.
5. **Bilanz ist inselübergreifend** (wie die Kopfzeile, `world.stats`), nicht je Insel; die Vorschau bleibt bei «Bilanz».

## Architektur (Kurzdesign)

- **I-085:** neue reine Datei `src/ui/storageFull.ts`: `trackFullSince(since: Map<string, number>, world)` (Schlüssel `g:<insel>:<gut>`; setzt den Tick beim ersten Beobachten, löscht Einträge ohne Verlust-Bedingung, leert alles, wenn `world.tick` kleiner als ein gemerkter Tick ist = Laden) und `storageProblems(world, since)`. `problems.ts`: `ProblemClass` um `5` erweitert (hinter 1–4), `problemList(world, anchor, fullSince = new Map())` hängt je Eintrag ein `Problem` an; Vertreter = Erzeuger mit kleinstem Abstand zu `jumpTarget`, dann ID (wie Klasse 4). Text z. B. «Holz-Lager voll (100): Holzfäller verfallen — stilllegen oder verkaufen» plus Insel-Suffix. Schwelle `FULL_PROBLEM_SECONDS = 30` als UI-Konstante (Darstellungswert, kein Spielwert), in Ticks über `TICK_MS`. `app.ts`: `Map` anlegen, `trackFullSince` im vorhandenen HUD-Takt (≤ 500 ms) aufrufen, an `runProblemJump` über `ProblemJumpDeps` reichen. Es gibt keinen Problem-Zähler in der Kopfzeile (grep `hud.ts` ohne Treffer): `hud.ts` bleibt unberührt, Toast bleibt `info`.
- **I-078:** neue reine Datei `src/ui/balancePreview.ts`: `balanceAfterBuild(world, defId)` und `balanceAfterUpgrade(world, b)` liefern `{ before, after, afterMax }` (Nominalwert je 100 Ticks, `afterMax` nur beim Wohnhaus). **Keine zweite Rechnung:** Unterhalt über `totalUpkeep` (`src/sim/economy.ts`, enthält Edikt Sparen und Schiffe) auf einer flachen Probe-Welt (`{ ...world, buildings: { ...world.buildings, [PROBE_ID]: ../../plans/probe } }`, Welt wird nie verändert); Steuer über `totalTaxes` auf einer Probe mit einem voll belegten, voll versorgten Haus (`inhabitants = houseCap`, `supplied`, `satisfied`, `services` alle wahr). Formatierung über `balanceText` aus `hud.ts` (gleiche Funktion wie der Chip). Anzeige: Zeile «Bilanz danach: +120 → +95 / min» im Bau-Tooltip (`buildMenu.ts`, `tooltipLines` hat `world` bereits), Zeile «Bilanz danach» in der Ausbau-Karte (`panelView.ts` `upgradeCard`, Anzeige in `inspect.ts` `updateUpgradeBox`); Wohnhaus «→ bis zu +135 / min (Steuer bei voller Belegung)».

## Tasks (Test-first, Umsetzer `tech-ui-engineer`)

| Task | Titel                               | AK-IDs          | Strang | blocked-by             |
| ---- | ----------------------------------- | --------------- | ------ | ---------------------- |
| T01  | `balancePreview.ts` + Bau-Tooltip   | AK-10 bis AK-14 | 1      | UI-HAEPPCHEN-A gemergt |
| T02  | Ausbau-Karte «Bilanz danach»        | AK-15, AK-16    | 1      | T01                    |
| T03  | «Lager voll» als Problem (Klasse 5) | AK-1 bis AK-9   | 2      | UI-HAEPPCHEN-A gemergt |
| T04  | Doku (Lead)                         | AK-17           | 1+2    | T02, T03               |

**T01.** Rot zuerst: `tests/ui/balancePreview.test.ts` mit den Abgleichen (siehe AK), dann Datei und Tooltip-Zeile. Dateien: `src/ui/balancePreview.ts` (neu), `buildMenu.ts` (`tooltipLines`), `tests/ui/balancePreview.test.ts`, `tests/ui/buildMenu.test.ts`.
**T02.** Rot zuerst: Abgleich Vorschau gegen `upgradeBuilding`, Kartentext. Dateien: `panelView.ts`, `inspect.ts` (nur `updateUpgradeBox`/Gerüst), `tests/ui/panelView.test.ts`, `inspect.test.ts`.
**T03.** Rot zuerst: `tests/ui/storageFull.test.ts` und Ergänzungen in `problems.test.ts`; dann `storageFull.ts`, `problems.ts`, `app.ts`. Test-Welten über `tests/ui/worlds.ts`.
**T04 (Lead).** `README.md` (Problemliste um «Lager voll», Tooltip und Ausbau-Karte), `docs/arc42.md` (zwei neue Dateien, UI-Zustand `fullSince`), `docs/ideen.md` I-085/I-078 auf `live`. D1 erlaubt (E-017).

## Abnahmekriterien

**I-085 «Lager voll»**

- **AK-1** Ein Eintrag je (Insel, Gut), nicht je Betrieb: drei Holzfäller im Stau ergeben einen Eintrag.
- **AK-2** Rot-Test Grenze: bei 29,9 s Spielzeit (aus `TICK_MS` abgeleitet) kein Eintrag, bei 30 s einer; Frist zählt in Ticks, bei Pause (keine Ticks) läuft sie nicht.
- **AK-3** Bedingung: `stock ≥ STORAGE_CAP` und ≥ 1 nicht stillgelegter, angebundener Erzeuger in `storageFull`. Kein Eintrag bei vollem Lager ohne Erzeuger-Stau, bei nur stillgelegten Erzeugern, bei Stock 99.
- **AK-4** Fällt der Stock unter 100 oder endet der Stau, wird der Zähler gelöscht (nächstes «voll» startet neu); sinkt `world.tick` (Laden), werden alle Zähler gelöscht. **R577 (2):** Laden mit gleichem oder höherem Tick und «Neues Spiel» setzen `fullSince` ebenfalls zurück (Reset in `app.ts` an den Lade-/Neustart-Pfaden oder über die Welt-Identität, Test). **R577 Zusatz:** Rot-Test gegen Flackern: wechselt ein Erzeuger nur kurz aus `storageFull` (ein Tick), bleibt der Zähler nicht fälschlich stehen oder springt der Eintrag nicht an/aus — der Test legt das gewünschte Verhalten fest (Zähler nur bei echtem Ende des Staus löschen, sonst Eintrag stabil).
- **AK-5** Text nennt Gut, Menge und Abhilfe («stilllegen oder verkaufen»); Fremdinsel bekommt den Insel-Suffix wie die anderen Klassen.
- **AK-6** Klasse 5 sortiert hinter 1–4; `.`/`,` springen zum Erzeuger mit kleinstem Abstand zu `jumpTarget` (dann ID), öffnen sein Panel und funktionieren auf fernen Inseln über den bestehenden Pfad (`runProblemJump`); fällt der Eintrag während des Umlaufs weg, gilt das bestehende Verhalten für verschwundene Schlüssel (`stepList`).
- **AK-7** Kopfzeile, Bilanz-Chip und `hud.ts` unverändert; Toast-Art `info` (nie `error`); Gewollter Überschuss unter 30 s erzeugt nichts (kein Rauschen).
- **AK-8** Kein Save-Feld: `git diff src/sim/` leer, `SAVE_VERSION` unverändert, Zustand nur in der `app.ts`-Closure.
- **AK-9** Bestehende `problems.test.ts`/`goodFocus.test.ts` bleiben grün (Default-Parameter); leere Liste liefert weiter `NO_PROBLEM_TEXT`.

**I-078 «Bilanz danach»**

- **AK-10** Rot-Test Abgleich Betrieb/Dienst: Vorschau-«danach» (Unterhalt) = Bilanz nach echtem `placeBuilding` (`totalUpkeep` nachher), für mehrere `defId`, mit und ohne Edikt Sparen, mit Schiffen in der Welt.
- **AK-11** «Heute» = Zahl des Bilanz-Chips: `balanceText(world.stats).text` nach einem Tick gleich dem «Bilanz heute»-Teil der Vorschau (gleiche Funktion, kein zweiter Formatierer).
- **AK-12** Wohnhaus: Anzeige «→ bis zu +c / min (Steuer bei voller Belegung)»; Rot-Test: reales Haus gebaut, auf `houseCap` gefüllt und voll versorgt ⇒ tatsächliche Steueränderung ≤ Obergrenze; bei Welt ohne andere Häuser gleich; Test bei anderer Steuerstufe und bei Edikt mit Steuerpunkten.
- **AK-13** Randfälle: Welt ohne Gebäude (Bilanz 0, «±0»); negative Bilanz mit Minus (`signedNum`); Gebäude mit Unterhalt 0 zeigt «gleich» statt Pfeil; Bau-Tooltip auch bei gesperrtem Eintrag (Zahlen bleiben, Sperrgrund kommt wie heute dazu).
- **AK-14** Die Probe verändert die Welt nicht (`structuredClone(world)` vorher = nachher, auch bei der Wohnhaus-Probe), keine Dauer-Schleife: Berechnung nur beim Tooltip- bzw. Panel-Update, nicht je Frame (≈ 1000 Gebäude × 2 `totalUpkeep`-Läufe je Aufruf, unkritisch). **R577 (1):** Probe-Gebäude mit gültiger Insel und Position; Rot-Test Obergrenze (Wohnhaus «bis zu») auf einer Mehrinsel-Welt; kein Neurechnen je Frame bei unverändertem Hover (Test oder Cache je `defId`/`world.tick`).
- **AK-18 (R577 (4))** Kontrakt-Test: `balanceText` (hud.ts), `spot` (problems.ts), `jumpTarget` (islandJump.ts) existieren mit der erwarteten Signatur und liefern bekannte Werte; Umbenennung durch A bricht den Test laut.
- **AK-15** Ausbau-Karte: Zeile «Bilanz danach: a → b / min»; Rot-Test Abgleich gegen echtes `upgradeBuilding` für Stufe 1 → 2 und 2 → 3, mit Edikt; Karte «Höchste Stufe» und gesperrte Karte zeigen keine Zeile.
- **AK-16** Bedienung: Die Zeile ist Text im bestehenden Tooltip bzw. in der Karte (kein neues Bedienelement, Tastatur wie heute); bei 1280×720 läuft die Ausbau-Karte nicht über (kein Überlauf, **Fokusring sichtbar** am fokussierten Knopf der Karte, Browser-Beleg) und die Bauleisten-Tooltips bleiben im Fenster.

**Doku**

- **AK-17** README, arc42, `ideen.md` nachgeführt; `make docs-check` Exit 0.

## Überschneidung mit UI-HAEPPCHEN-A, UI-AUFRAEUM-2, M14-E1

- **Problemliste `.`/`,`:** A ändert `problems.ts` nicht, importiert aber `spot`/`jumpTarget` (Rangliste-Sprung) → Exporte von `spot` bleiben stabil; B erweitert nur `ProblemClass` und `problemList` (Default-Parameter). Ändert A die Signatur doch, muss B nachziehen (Reihenfolge-Abhängigkeit).
- **Bilanz-Chip:** A macht ihn zum Knopf (`hud.ts`, `app.ts`); B fasst `hud.ts` **nicht** an und liest nur `balanceText` (Export bleibt, wird von A nicht umbenannt — im Briefing A/B prüfen).
- **Bauleiste:** `buildMenu.ts`, `panelView.ts` fasst A nicht an; UI-AUFRAEUM-2 ändert `inspect.ts` (T02 danach, Symbol-Suche statt Zeilennummern) und `app.ts` (T03: nur eine Map, ein `trackFullSince`-Aufruf, ein Parameter im Sprung).
- **`hover.ts`:** B ändert sie nicht. Die Zeile «Lager voll» dort (Z. 129, Zustand je Betrieb) bleibt; sie ist die Einzelsicht, der Problem-Eintrag die Gutsicht.
- **`app.ts`** ist die einzige Datei, die A und B beide berühren → B startet erst nach Merge von A, main per Merge holen.

## Datei-Ownership (zwei Stränge, getrennte Dateien)

| Strang / Worktree                               | Dateien                                                                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 `.worktrees/ui-haeppchen-b-bilanz` (T01, T02) | `src/ui/balancePreview.ts`, `buildMenu.ts`, `panelView.ts`, `inspect.ts`, `tests/ui/balancePreview.test.ts`, `buildMenu.test.ts`, `panelView.test.ts`, `inspect.test.ts` |
| 2 `.worktrees/ui-haeppchen-b-lager` (T03)       | `src/ui/storageFull.ts`, `problems.ts`, `app.ts`, `tests/ui/storageFull.test.ts`, `problems.test.ts`                                                                     |
| Lead (T04)                                      | `README.md`, `docs/arc42.md`, `docs/ideen.md`                                                                                                                            |

Branches `feat/ui-haeppchen-b-bilanz` und `feat/ui-haeppchen-b-lager`; Lead führt sie vor dem Final-Review in `feat/ui-haeppchen-b` zusammen (keine Dateiüberschneidung). Nicht anfassen: `src/sim/`, `src/audio/`, `hud.ts`, `hover.ts`, Spielwerte, `docs/studio/rulings.md`.

## Pflichtpunkte

- Rot-Beleg je neuem Test (R395, R410); Exit-Codes (`…; echo EXIT=$?`): `npx tsc --noEmit`, `make lint`, `make test`, `make conflicts`, `make docs-check` alle 0; Balancing grün.
- **Browser-Check** `qa-playtester`, 1 Lauf nach Zusammenführung (`.studio/qa/ui-haeppchen-b/`, 1280×720): Bau-Tooltip Betrieb und Wohnhaus, Ausbau-Karte (Stufe 1 → 2, Höchststufe), Lager voll herstellen (Holzfäller ohne Abnehmer, Tempo 3, ≈ 30 s Spielzeit), `.` springt zum Holzfäller, nach Verkauf verschwindet der Eintrag, Tooltips nur per Tastatur erreichbar wie heute, 0 Konsolenfehler.
- Review je Task `qa-code-reviewer`; **Final-Review `opus`** über die zusammengeführte Branch; nach ZURÜCK Delta-Review per SendMessage (R553).

## Budgetantrag

3 Umsetzer-Tasks (T01–T03) × 2 = 6; Playtester 1; Final-Review 1; Summe 8; + 30 % = 10,4, aufgerundet **11 Starts**. T04 macht der Lead. Fix-Runden per SendMessage. Parallelität **2** (Strang 1 und 2, getrennte Dateien). Aufwand ≈ 180 Tools (Ideen-Schätzung 60–80 + 70, dazu Reviews und Browser-Check). Modelle: Umsetzer, Reviewer, Playtester `sonnet`; Final `opus`.

## Risiken

(1) Die Probe-Welt für das Wohnhaus muss `allNeedsMet` erfüllen; ändert sich `HouseState`, bricht der Abgleichtest laut (gewollt). (2) Frist nach Laden neu (Gate-Punkt 1). (3) `TIERS[1]` als «Wohnhaus» fest verdrahtet: stattdessen Stufe aus `newHouseState(world).tier` lesen. (4) A benennt `balanceText` oder `spot` um → B im Briefing zur Prüfung beim Start. (5) Tooltip wird breiter: 1280×720 im Browser-Check.

## Nachtrag Controller (R577 Auflagen, R586)

- **Rollen:** Umsetzer `tech-ui-engineer` (sonnet), Task-Review `qa-code-reviewer` (sonnet), Final-Review `qa-code-reviewer` (opus), Browser-Check `qa-playtester` (sonnet); Lead steuert und schreibt T04.
- **Stränge:** Basis `feat/ui-haeppchen-a` @ `d4f6420d`. Strang 1 im Worktree `.worktrees/ui-haeppchen-b` (Branch `feat/ui-haeppchen-b`, T01, T02), Strang 2 in `.worktrees/ui-haeppchen-b-lager` (Branch `feat/ui-haeppchen-b-lager`, T03); Zusammenführung per Merge in `feat/ui-haeppchen-b`.
- **Beobachtung:** Haus-Aufstieg in der Bilanz-Vorschau bleibt ausgeklammert; Eintrag in `docs/beobachtungen.md` (Lead).
- **Zeit-Basis** (`npx vitest related --run` auf den geplanten src-Dateien, Basis `d4f6420d`, unter Last 17–26): Einzeltests > 200 ms: monument.test.ts «Eingaben ergeben { ok, reason }» 536 ms; geisterbauten.test.ts (4 Fälle 237–391 ms); cursorHint.test.ts RF-4 284 ms; hover.test.ts AK-U3-06 249 ms; input.test.ts AK-R17-12 241 ms; islandTools.test.ts foreignBuildingHover 292 ms; time.test.ts AK-UX-13 268/386 ms. Dateien der Strang-Dateien: buildMenu 12 ms, inspect 253 ms, panelView 200 ms, problems/goodFocus unter 100 ms. Abnahme: dieselben Dateien Basis vs. Branch nacheinander, kein bestehender Test > 500 ms oder > +50 %. Rohdaten: Scratchpad `base.json`.
