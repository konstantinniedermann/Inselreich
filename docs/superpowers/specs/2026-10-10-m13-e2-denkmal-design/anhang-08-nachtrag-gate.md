# Anhang 08 · Nachtrag Gate Spec (R489, Spec M13-E2)

Gehört zu [Spec M13-E2 Denkmal als Wahlziel](../2026-10-10-m13-e2-denkmal-design.md). Grundlage: Ruling **R489**,
Gate-Urteile `.studio/handoffs/2026-10-10-lead-qa-GATE-SPEC-M13-E2.md` (qa B1–B9) und
`.studio/handoffs/2026-10-10-lead-tech-GATE-SPEC-M13-E2.md` (tech B1–B5, A1–A6). Kein Zweit-Gate auf die Spec; das
Gate Plan prüft diesen Nachtrag mit.

## A. Zuordnung der Befunde

| Befund                                   | Erledigt in                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| qa B1 Determinismus Speichern/Laden      | AK-M13E2-16 (laufender Abschnitt), neues AK-M13E2-49, hier B.2          |
| qa B2 AK-10 stabil, Aufbau               | AK-M13E2-10, hier B.1                                                   |
| qa B3 Lauf B Controller                  | Anhang 03 A (Messen → Pin → Stopp), 03 C (ab T0 kein Controller), AK-18 |
| qa B4 Abriss-Bestätigung                 | §7.5 U-14, AK-M13E2-34 (C1–C7), AK-M13E2-45                             |
| qa B5 Ausgangsstände Browser             | §10.4 Einleitung, AK-44, AK-45, hier D (Task im Plan)                   |
| qa B6 bedingte AK                        | AK-M13E2-09 (Fall K1 an I-049), AK-12 und Anhang 03 B (Kaufanteil 100)  |
| qa B7 Bildstufen, Höhe, Amtsstube        | AK-M13E2-36, -39; Anhang 06 A (sieben Paare), 06 C (Höhenmass)          |
| qa B9b, tech B4 Rückfaltung              | §9 R9.5, AK-M13E2-22, Anhang 02 D Regeln 1, 4–6                         |
| tech B1 / R489 Zukauf                    | R5.2, R7.1, R7.3, AK-M13E2-11, -12                                      |
| tech B3 Tick-Platz                       | R5.1, Anhang 05                                                         |
| tech B5 `lock_g` ohne Eigentümer         | R6.1 (eigene Funktion, in E2 immer 0), AK-M13E2-09, Fall K1 unten       |
| tech A3, A4, A5 (mitgenommen, Spec-Text) | R6.2 (ganzzahlig), Anhang 03 A (Krisen aus in A, C), AK-11 (Vergleich)  |
| tech B2 (teilweise, Wortlaut)            | §15, Anhang 06 Kopf; der Task «Def-Kern» selbst gehört in den Plan      |

**Fall K1 (Kopplung Sperrbestand → Reserve), Eigentümer I-049.** Kein E2-AK; wird im Plan I-049 (Nachtrag nach tech
B5) als dessen AK geführt und dort abgenommen. Inhalt: Heimat-Sperrbestand Stein 40 → `monumentReserve(w, 'stone')`
= 40; Sperrbestand 10 → 20 (`MONUMENT_RESERVE_MIN`); Werkzeug, Glas, Gewürz unverändert. I-049 darf dafür in
`src/sim/monument.ts` nur den Rumpf der Sperrbestand-Funktion (R6.1) ändern und `tests/sim/monument.test.ts` nur
ergänzen.

## B. Testaufbauten

### B.1 Reserve hält (AK-M13E2-10)

- `village(4, { unlockAll: true })` aus `tests/sim/helpers.ts` (Krisen aus, vier Häuser am Kontor, alle im
  Versorgungsradius); `setHouse(h, 4, 20)` für alle vier → 80 versorgte Kaufleute (Anhang 01 A: Reserve Glas und
  Gewürz 64).
- `wonMerchants = true`, `money = 100 000`, Denkmal und Weg wie die Testwelt in Spec §10 [Tech: Konstante]; Lager
  Stein und Werkzeug 20, Glas 80, Gewürz 64; alle `buy` aus; Abschnitt 1 gestartet bei Tick 1000.
- Vor **jedem** Schritt `setHouse(h, 4, 20)` für alle vier (hält die Reserve fest bei 64, wie `feed` die Nahrung);
  Hausverbrauch von Glas und Gewürz läuft weiter.
- Prüfung wie Spec AK-10: nur in Schritten mit gestiegenem `delivered[g]`; Glas geliefert 1 … 16 (80 − 64 ist die
  Obergrenze ohne Verbrauch), Gewürz 0 (64 ist nie > 64).

### B.2 Speichern und Laden mitten im Abschnitt (AK-M13E2-16, -49)

- Welt: Testwelt aus Spec §10, Krisen **Standard** (RNG-Pfad aktiv), Lager Stein 40 (das Lager liefert 20 Stück),
  Werkzeug, Glas, Gewürz 20 (= Reserve); `buy` an für Werkzeug, Glas, Gewürz, aus für Stein; `money = 100 000`;
  `startMonumentStage` bei Tick 1000.
- Zwilling Z läuft ununterbrochen bis Tick 1500. Kopie K läuft bis zum Speicher-Tick s, dann `K′ =
deserialize(serialize(K))`, weiter bis Tick 1500. Erwartung je Fall: `serialize(K′) === serialize(Z)`.
- Fälle s: **1007** (vor dem Zug-Tick 1010), **1010** (unmittelbar nach dem Zug-Tick), **1013** (danach),
  **1025 pausiert**: in Z und K bei Tick 1015 `setMonumentPaused(true)` und bei Tick 1035 `false` (zwischen den
  Schritten).
- In jedem Fall bis Tick 1500: `delivered.stone ≥ 1` (Lager) und `delivered.glass ≥ 1` (Zukauf); der Abschnitt läuft
  nach s noch mindestens 40 Zug-Ticks.
- AK-16 nutzt dieselbe Welt ohne Speichern (zwei Kopien, 1000 Schritte).

## C. Zwei-Klick-Zustand der Abriss-Bestätigung (AK-M13E2-34)

Reiner, DOM-freier Helfer in `src/ui/` [Tech: Name, Ort], Test unter `tests/ui/` im Muster von
`tests/ui/input.test.ts`. «Abriss» heisst: die Abriss-Aktion wird genau einmal ausgelöst.

| Fall | Ausgang                                                                                     | Eingaben                                                | Erwartung                                                                                      |
| ---- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| C1   | Denkmal, `stage 0`, `running`                                                               | Klick «Abreissen», dann Klick                           | nach 1: Knopftext «Wirklich abreissen? Fortschritt geht verloren», kein Abriss; nach 2: Abriss |
| C2   | wie C1                                                                                      | `Entf`, `Entf`; `Backspace`, `Backspace`; Klick, `Entf` | je wie C1 (Knopf und Taste gleich)                                                             |
| C3   | wie C1, scharf nach erstem Klick                                                            | Auswahlwechsel, `Esc` oder Panel schliessen, dann Klick | zurückgesetzt; der folgende Klick macht nur wieder scharf                                      |
| C4   | Denkmal, `stage 1` oder `2`, nicht laufend                                                  | Klick, Klick                                            | wie C1                                                                                         |
| C5   | Denkmal, `stage 0`, nicht laufend                                                           | Klick bzw. `Entf`                                       | sofort Abriss, kein Bestätigungstext                                                           |
| C6   | anderes Gebäude (Haus, Amtsstube)                                                           | `Entf`, `Backspace`, Klick                              | sofort Abriss, kein Bestätigungstext (Regression R483, UI-TASTEN)                              |
| C7   | Abriss-Werkzeug oder Abriss-Zug über Kacheln eines Denkmals wie C1 oder C4 und eines Hauses | Zug                                                     | Denkmal bleibt, Meldung «Denkmal nur im Panel abreissen»; Haus wird abgerissen                 |

## D. Ausgangsstände für die Browser-AK (AK-M13E2-40 bis -48)

Erzeugung (Plan-Task «Szenario-Stände M13-E2», qa B5): Einträge in `RAW_SCENARIOS` (`tests/sim/scenarios.ts`),
geschrieben über `writeScenarios` mit `SCENARIO_OUT` wie die übrigen Browser-Szenarien; `scenario-saves.test.ts`
lädt jeden über `deserialize` (ok) und prüft je Stand die unten genannten Felder. Gemeinsame Basis [Tech: Name]:
`createWorld(3, { unlockAll: true, crisisLevel: 'off' })`, `won = true`, `wonMerchants = true`, Amtsstube über
`placeTownhall`, vier Kaufleute-Häuser am Kontor (Muster B.1), Platz `MONUMENT_AT` frei mit Weg, `money = 30 000`,
Lager der vier Denkmal-Güter je 20, Holz 100.

| Name                    | Abweichung von der Basis                                                                                           | AK            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------- |
| `m13e2-vor-ziel2`       | `wonMerchants = false`                                                                                             | -40 (Teil 1)  |
| `m13e2-ziel2`           | keine                                                                                                              | -40           |
| `m13e2-bauplatz`        | Denkmal gebaut, `stage 0`, nicht laufend, angebunden; Stein auf Reserve (20)                                       | -41, -42, -45 |
| `m13e2-abschnitt1`      | wie `m13e2-bauplatz`, Abschnitt 1 läuft, `delivered` je Gut ein Viertel des Solls                                  | -45, -48      |
| `m13e2-abschnitt1-rest` | Abschnitt 1 läuft, Rest 5 je Gut, alle `buy` an, `wonSpice = true`                                                 | -43           |
| `m13e2-abschnitt3-rest` | `stage 2`, Abschnitt 3 läuft, Rest 1 je Gut, alle `buy` an, `wonSpice = true`, `monumentDone = false`              | -44           |
| `m13e2-bild-0` … `-4`   | Bildstufe 0 … 4 nach Anhang 06 A (Bild 1: Abschnitt 1 läuft; sonst nicht laufend), Amtsstube daneben               | -46           |
| `m13e2-v13`             | `serialize(m13e2-ziel2)` mit `version: 13`; **nicht** in `SCENARIOS` (lädt absichtlich nicht), eigene Datei [Tech] | -47           |

Klarstellung zu qa B5 («Ziel 3 offen»): Der Ziel-Chip zeigt die Denkmal-Zeilen erst in Phase `'done'`, also nach
Ziel 3 (U-8, AK-31). Damit AK-43 und -44 Chip-Zeilen prüfen können, haben `m13e2-abschnitt1-rest` und
`m13e2-abschnitt3-rest` `wonSpice = true`; «nach Laden» in AK-44 heisst: Stand geladen, dann der letzte Zug.

## E. Verbleibend für den Plan (lead-tech, R489)

- qa B5: Task «Szenario-Stände M13-E2» nach D (Eigentum, Strang).
- qa B8: Randfälle als Testzeilen in AK-11/-14 (leeres Lager unter Reserve, Handel oder Amtsstube fällt mitten im
  Abschnitt weg, Häuser schrumpfen oder wachsen, Weg-Abriss im Zug-Tick, Abriss bei `paused`).
- qa B9a: AK-21 als Final-Review-Prüfpunkt mit wörtlichem Befehl; Ledger-Einträge für die mechanischen Anpassungen in
  `save.test.ts` und `save-v11.test.ts`.
- tech B2: erster Task «Def-Kern» mit erlaubten Platzhaltern in Render, Audio, UI; Stränge zweigen davon ab.
- tech B5: Nachtrag Plan I-049 (Eigentum Sperrbestand-Funktion und Testergänzung, Fall K1, Verschärfung
  `dropZeroReserve` in T03).
- tech A1–A6, darunter A2 (Bildstufe in die Render-Geometrie, Renderer-Test «Stufe 4 knapp unter dem Bildrand wird
  gezeichnet») und A6 (V4 vor V6 schützen).

## F. Berichtigungen der E1-Spec (aus Spec §11 verschoben, Wortlaut unverändert)

- **AK-M13E1-36 neu:** «Klick «Erlassen (600)» bei Sparen: Geld −600, die Karte Sparen ist hervorgehoben (Klasse
  `active`) mit Knopf «Aufheben»; die Zeile «wieder änderbar in 5:00» zählt herunter; die Karten Handel und Wohlfahrt
  sind gesperrt (Knopf `disabled`), ihr Tooltip lautet «Edikt erst in {m:ss} wieder änderbar»; ein Klick auf eine
  gesperrte Karte löst nichts aus, keine Meldung; der Unterhalt der Kopfzeile sinkt.» Grund: U-4 und `edictCardState`
  (`disabled`, `reason`) gehen dem alten Wortlaut «Klick auf Handel → Meldung» vor (R466 (1)). Texte aus
  `src/ui/edictView.ts` (`edictLockText`) und `src/ui/hints.ts` zum Grund `'Edikt-Sperrzeit'` (`src/sim/edicts.ts`).
- **AK-M13E1-14 ergänzt:** «… bei 4000 mit `money ≥ 600` (der Test setzt `money = 600`) → ok.» Grund: Beobachtung
  M13-E1 Punkt 3 (nach dem Erlass bleiben 400).
- **Mechanisch** (Spec-Text unverändert): AK-M13E1-01 prüft die Folge vor den Denkmal-Schlüsseln; AK-M13E1-26 und -41
  nutzen `SAVE_VERSION + 1` statt 12 (§6).
