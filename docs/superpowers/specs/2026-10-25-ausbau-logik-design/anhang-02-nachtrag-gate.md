# Anhang 02 — Nachtrag Gate Spec (R914)

Zur Spec [`2026-10-25-ausbau-logik-design.md`](../2026-10-25-ausbau-logik-design.md). Grundlage: Gate-Bericht lead-qa
(BEDENKEN B1–B12), R908 (E1–E9), R914; Entscheide lead-design. Dieser Anhang ist verbindlich und **geht der Spec vor**,
wo sie abweichen. Neue AK fortlaufend ab AK-AL-35 (R417); bestehende AK bleiben, ersetzte sind in der Spec markiert.

## N1 Save (B1, R908 E4)

- `SAVE_VERSION` = **Wert auf main + 1 beim Merge** von AL-4, keine feste Zahl. Tests referenzieren nur `SAVE_VERSION`.
- Vorgängerstand = Stand mit `version: SAVE_VERSION − 1`, wie ihn main zum Plan-Zeitpunkt schreibt. Der Plan wählt eine
  von zwei Varianten und legt die Merge-Reihenfolge der Save-Kette fest (I-210, I-214 und andere können vorher erhöhen):
  - **A ladbar:** Migrationsschritt `SAVE_VERSION − 1 → SAVE_VERSION` ändert nur `version`, Inhalt gleich.
  - **B abgewiesen:** trägt die Kette das nicht, wird der Vorgängerstand mit Hinweis abgewiesen (Verfassung §3).
- Ersetzt AK-AL-22 durch AK-AL-35, AK-AL-23 durch AK-AL-36.

## N2 Schnitte (B2, B8, B9)

Stufe-2/3-Teile eines AK liegen im frühesten Schnitt, Stufe-4-Teile in AL-4. «Teil 4» meint: der Fall mit `g = 4` bzw.
`k = 4` oder `upgrade4`.

| Schnitt | Inhalt                                                                                                                     | Abhängig | Voraussetzung                                                      | AKs                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| AL-1    | Defs, Doku: `fee` → `extra`, Kosten Stufe 2/3, Tipps U3/U5, README, `spielwerte.md`                                        | —        | —                                                                  | 01 (Stufe 2/3), 02 (ohne I-201 AK-FE7), 05, 32a, 34                                  |
| AL-2a   | `levelRules.ts`: `levelChecks`, `runningLevel`, Fachkräfte, Standort, Feuerwache als reine Abfrage ohne Wirkung            | AL-1     | Weidezahlen mit FLAECHE fixiert (Handoff)                          | 03, 06, 07, 08, 09 (je ohne Teil 4), 46 (Radius-Teil), 47                            |
| AL-2b   | k wirkt auf Zyklus und Unterhalt, Recheck, Ausbau verlangt Bedingungen, Gründe aus `levelChecks`, M-15 neu, Spiral-Messung | AL-2a    | I-201 auf main für 02 (I-201 AK-FE7) und den Erntefest-Teil von 11 | 04, 10, 11, 12 (je ohne Teil 4), 13–18, 21, 32b, 37, 44, 45, 46 (Unterhalt-Teil), 48 |
| AL-3    | UI: Checkliste, Zustandschip, Tooltip                                                                                      | AL-2b    | —                                                                  | 29, 38–43                                                                            |
| AL-4    | Stufe 4 (dritte `LEVELS`-Einträge), U7, `SAVE_VERSION` = main + 1, arc42                                                   | AL-2b    | Save-Kette (N1); Zukaufpreis auf main für 49                       | 01 (Stufe 4), Teil 4 von 04, 07–12, 19, 20, 35, 36, 49                               |
| AL-5    | Gleiches bauen und Pipette mit Stufe, `placeBuilding` mit Zielstufe                                                        | AL-4     | —                                                                  | 25–28, 30                                                                            |
| AL-6a   | Render: Merkmale Rohstoffbetriebe (Fischer, Jagd, Holz, Stein, Schaf, Rohr, Rind)                                          | AL-1     | Stufe-4-Merkmale nach AL-4; «jede Drehung» nach GEBAEUDE-VARIANZ   | 31 (Rohstoffbetriebe)                                                                |
| AL-6b   | Render: Merkmale Werkstätten (Weberei, Werkzeugmacher, Brennerei, Glashütte)                                               | AL-1     | wie AL-6a                                                          | 31 (Werkstätten)                                                                     |

AK-AL-32 geteilt (B7): **32a** (AL-1) `balance.test.ts`, Baseline und `balance-upgrade.test.ts` unverändert grün, M-15
gleich; **32b** (AL-2b) M-15 neu messen (E9). Greift die Variante «baut Fischer aus» nicht mehr, baut sie ein Fachkräfte-Haus
dazu oder die Greift-Bedingung wird per Ruling angepasst; der Test wird nicht abgeschwächt.

## N3 Eine Reihenfolge (B3)

`levelChecks(world, b, level)` liefert die Zeilen in der Ordnung von R7: **Wissen, Brand** (Zeile nur, wenn brennend),
**Fachkräfte, Standort, Geld, Holz, Werkzeug, Stein, fachliche Ware**. `upgradeBuilding` liefert ab R7 Schritt 4 als
`reason` den Text der ersten ✗-Zeile (eine Quelle, DRY); der Tooltip des gesperrten Knopfs zeigt denselben Text. Eine
✗-Zeile hat als Text ihren Sperrgrund; Baustoff-Zeilen im Muster «Zu wenig Stein (0 / 2)» (ersetzt den heutigen Text von
`checkAfford` im Ausbau; Bestandstests anpassen). Höchste Stufe: keine Checkliste, nur der Text «Höchste Stufe erreicht».

## N4 k-Wechsel mitten im Zyklus (B5)

Es gilt der heutige Produktionsschritt `progress += 1; if (progress >= cycle) { 1 Einheit; progress = 0 }` mit `cycle =
cycleOf` der laufenden Stufe k. Ändert sich k, bleibt `progress`. Ist `progress ≥` neuer Zyklus, liefert der nächste
Produktionsschritt genau 1 Einheit und setzt `progress` auf 0, **kein Übertrag**. Bei längerem Zyklus läuft `progress`
bis zum neuen Ende weiter. Gilt gleich für Abriss eines Fachkräfte-Hauses, Bau eines Nachbarn und Wechsel von `crisisLevel`.

## N5 Sperrgrund-Texte (B4, R908 E3)

| Zeile         | ✓ Text (Beispiel)                                                                 | ✗ Text = Sperrgrund (Beispiel)                                           |
| ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Fachkräfte S2 | «Handwerker im Umkreis 8: Siedlerhaus, nächstes 6 Felder»                         | «Keine Handwerker im Umkreis 8 (Siedlerhaus nötig, nächstes 11 Felder)»  |
| ohne Haus     | —                                                                                 | «Keine Handwerker im Umkreis 8 (kein Siedlerhaus auf dieser Insel)»      |
| andere Insel  | —                                                                                 | «Keine Handwerker im Umkreis 8 (Siedlerhaus nur auf anderer Insel)»      |
| Fachkräfte S3 | «Meister im Umkreis 8: Bürgerhaus, nächstes 6 Felder»                             | «Keine Meister im Umkreis 8 (Bürgerhaus nötig, nächstes 11 Felder)»      |
| Fachkräfte S4 | «Verleger im Umkreis 8: Kaufmannshaus, nächstes 6 Felder»                         | «Keine Verleger im Umkreis 8 (Kaufmannshaus nötig, nächstes 11 Felder)»  |
| Wald          | «Wald: 6 freie Waldfelder im Umkreis 2 (nötig 4)»                                 | «Zu wenig Wald: 3 freie Waldfelder im Umkreis 2 (nötig 4)»               |
| Gras          | «Weide: 9 freie Grasfelder im Umkreis 3 (nötig 8)»                                | «Zu wenig Weide: 7 freie Grasfelder im Umkreis 3 (nötig 8)»              |
| Gebirge       | «Fels: 4 Gebirgsfelder im Umkreis 2 (nötig 3)»                                    | «Zu wenig Fels: 2 Gebirgsfelder im Umkreis 2 (nötig 3)»                  |
| Fischgrund    | «Fischgrund: 1 andere Fischerhütte im Umkreis 3 (erlaubt 1)»                      | «Fischgrund überfischt: 2 andere Fischerhütten im Umkreis 3 (erlaubt 1)» |
| Feuerwache    | «Feuerwache in Reichweite 8» · Krisen aus: «Feuerwache: nicht nötig (Krisen aus)» | «Keine Feuerwache in Reichweite 8 (Brennofen)»; Esse, Schmelzofen        |
| Brand         | —                                                                                 | «Gebäude brennt»                                                         |

«Nächstes» = nächstes passendes Haus derselben Insel, `ceil(distance)`. «Andere Insel»: auf dieser Insel kein passendes Haus,
auf einer anderen schon. Chip: «Läuft wie Stufe k: <✗-Text der ersten verletzten Zeile der Stufe k + 1>»; kein Chip bei
`paused` oder brennend.

## N6 Risiken und Stellschrauben (B6, R553)

| Risiko                                                           | Stellschraube (Defs)                       | Rückfall per Ruling             | Messung       |
| ---------------------------------------------------------------- | ------------------------------------------ | ------------------------------- | ------------- |
| Abwärtsspirale Rum: Bürgerhaus fällt weg → Brennerei läuft wie 2 | `THROTTLED_UPKEEP_PCT`, `WORKFORCE_RADIUS` | Wert senken bzw. Radius erhöhen | AK-AL-48      |
| Arbeitsweg zu streng (ferne Betriebe nie ausgebaut)              | `WORKFORCE_RADIUS`                         | 8 → 10                          | AK-AL-48, 32b |
| Dominanz Ausbau gegen Neubau nach Preisänderung                  | E2-Aufschläge in `LEVELS` (Geld Stufe 2)   | Geldwerte anpassen              | AK-AL-49      |

Alle Grenzen stammen aus einer analytischen Rechnung (Rechnung (d)–(f), «geschätzt, nicht gemessen»); die Mess-AK geben
den ersten unabhängigen Beleg. Weicht er ab, gilt der Rückfall, kein neues Design.

## N7 Szenen für Browser-Checks (B12)

Fixture-Spielstände, Datei und Ablage legt der Plan fest (laden über «Laden»): **S1** Fischer g 2 mit Nachbarn im Abstand 2
und 3, Bürgerhaus im Abstand 6; **S2** Brennerei g 3, `crisisLevel` `'normal'`, Feuerwache abreissbar, Bürgerhaus im
Arbeitsweg; **S3** Kolonie mit Steinbruch ohne Wohnhaus; **S4** Fischer g 3, freie Küste und Küste neben zwei Fischern.

## Neue Abnahmekriterien

- **AK-AL-35 Vorgängerstand** (`save.test.ts`, ersetzt AK-AL-22): Fixture `version: SAVE_VERSION − 1` mit drei
  Fischerhütten Stufe 3 im Abstand 1. Variante A: `ok`, `version === SAVE_VERSION`, Inhalt sonst gleich (Vergleich ohne
  `version`), `level` je 3, `runningLevel` je 1, erste ✗-Zeile Fischgrund. Variante B: `ok: false` mit Hinweis, kein Wurf.
  Der Plan nennt die gewählte Variante; der Test ist über `SAVE_VERSION` parametrisiert.
- **AK-AL-36 Abweisen** (ersetzt AK-AL-23): Rundlauf mit `level` 4 und `'U7'` erhalten. `version: SAVE_VERSION + 1` →
  «Unbekannte Version»; `hunter` mit `level` 4, `level` 5, `level` 4 an einem Wohnhaus, `unlocked` mit `'U8'` →
  «Beschädigter Spielstand». Immer `ok: false`, nie ein Wurf.
- **AK-AL-37 Erster Grund gleich** (`upgrade.test.ts`): mindestens vier Welten mit je ≥ 2 verletzten Bedingungen —
  Fachkräfte + Geld, Standort + Ware, Brand + Fachkräfte, Wissen + Stein. Je Welt gilt: Text der ersten ✗-Zeile von
  `levelChecks` === `upgradeBuilding(...).reason` === Tooltip-Text der UI-Funktion; Zeilenordnung wie N3.
- **AK-AL-38 Zeilen Wald, Gras, Gebirge** (`tests/ui/levelChecklist.test.ts`, DOM-frei, reine Text-/Zustandsfunktion):
  je Zeilenart ein ✓- und ein ✗-Fall (Holzfäller, Schäferei, Steinbruch) mit Text wie N5; die Zahl im Text ist gleich der
  in der Testwelt nachgezählten Kachelzahl.
- **AK-AL-39 Zeile Fischgrund:** ✓ mit einer, ✗ mit zwei anderen Hütten im Umkreis 3; Zahl = Zahl der gesetzten Hütten.
- **AK-AL-40 Zeile Feuerwache:** Brennerei g 2 → 3: ✗ ohne Wache, ✓ mit Wache, bei `crisisLevel 'off'` ✓ «nicht nötig
  (Krisen aus)»; Werkzeugmacher nennt «Esse», Glashütte «Schmelzofen».
- **AK-AL-41 Zeile Fachkräfte:** Stufe 2 mit Siedlerhaus im Abstand 6 (✓) und 11 (✗, «nächstes 11 Felder»); ohne Haus
  auf der Insel; Haus nur auf einer anderen Insel; Stufe 3 «Meister»/Bürgerhaus, Stufe 4 «Verleger»/Kaufmannshaus (Teil 4).
- **AK-AL-42 Chip bei Nicht-Fischer:** Brennerei g 3 ohne Feuerwache (`'normal'`): Chip «Läuft wie Stufe 2: Keine
  Feuerwache in Reichweite 8 (Brennofen)», Tooltip «Unterhalt 30 statt 34 (gedrosselt)». Dieselbe Brennerei `paused` oder
  brennend: kein Chip.
- **AK-AL-43 Höchste Stufe:** Jagdhütte g 3 und Fischer g 4 (Teil 4): Ausbau-Karte ohne Checkliste, nur «Höchste Stufe
  erreicht».
- **AK-AL-44 k-Wechsel mitten im Zyklus** (`levelRules.test.ts`): Fischer g 3, k 1, `progress` 30 (Zyklus 40); Bürgerhaus
  wird gebaut und k wird 3 (Zyklus 16) → nächster Produktionsschritt genau 1 Einheit, `progress` 0, nächste Einheit nach 16
  Schritten. Fischer k 3, `progress` 10; einziges Bürgerhaus abgerissen, k wird 1 → keine Einheit bis `progress` 40. Über
  das ganze Fenster: Einheiten = Summe der Einzelzyklen, keine doppelte, keine verlorene.
- **AK-AL-45 crisisLevel im Lauf und Determinismus:** Brennerei g 3 ohne Wache, `'normal'` → k 2; Wechsel auf `'off'` →
  k 3 spätestens nach `LEVEL_RECHECK_TICKS`; zurück → k 2. Zwei Läufe mit denselben Wechseln (AK-44 und dieses AK)
  → gleiches `serialize`; `serialize` → `deserialize` im selben Tick wie der Wechsel, weitere 600 Ticks → gleiches
  `serialize` wie der durchgelaufene Lauf.
- **AK-AL-46 Werte aus Defs, Verhalten** (ersetzt AK-AL-33): Test setzt per `vi.mock` der Defs `WORKFORCE_RADIUS` 7 →
  Siedlerhaus im Abstand 8 gibt k 1 statt 2; `THROTTLED_UPKEEP_PCT` 100 → Unterhalt = u(g). Zusatz: Strukturtest auf
  `src/sim/levelRules.ts` ohne Kommentare, Zahlenliterale nur aus der Whitelist `0, 1, 2, 100`.
- **AK-AL-47 2 × 2-Grundriss** (ergänzt AK-AL-06): 2 × 2-Betrieb (Mittelpunkt auf ganzer Zahl) und 1 × 1-Haus (Mittelpunkt
  .5): Versatz (7,5; 0) → ✓, Anzeige 8; (8,5; 0) → ✗, 9; (7,5; 2,5) ≈ 7,91 → ✓, 8; (7,5; 3,5) ≈ 8,28 → ✗, 9. Vergleich
  über `distance()` wie Dienst-Reichweiten, keine eigene Toleranz.
- **AK-AL-48 Spiral-Messung** (`tests/sim/balance-ausbau.test.ts`, neu, ≥ 2 feste Seeds, R553): Bürgerviertel mit
  Brennerei g 3; zu T0 wird das einzige Bürgerhaus in ihrem Arbeitsweg abgerissen; Lauf über eine feste Tickzahl (Plan,
  Vorschlag 3 000). Gemessen: Zahl der Bürgerhäuser und Rum-Bestand gegen einen Kontrolllauf mit k = g fest. Kennzahl und
  Schwelle per Ruling gepinnt, Vorschlag: höchstens 1 Bürgerhaus Unterschied.
- **AK-AL-49 Dominanz gegengeprüft** (`tests/sim/levelDominance.test.ts`, nach Zukaufpreis auf main): je Typ und Stufe
  `M = W(Stufe) − n × W1 > 0` wie Rechnung (e2), W mit den aktuellen Kaufpreisen der Sim, n = c1/c(Stufe) − c1/c(Vorstufe).
  Fällt ein M ≤ 0, Rückfall N6.
- **AK-AL-29 ergänzt** (Browser, Szenen N7): S2 Brennerei mit und ohne Feuerwache (Zeile, Chip, Tooltip-Unterhalt), S3
  Kolonie ohne Haus («kein Siedlerhaus auf dieser Insel»). AK-AL-30 nutzt S4.
