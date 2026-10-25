# Anhang 03 · Testmatrix AUFLAGEN-KERN (Nachtrag nach Gate Spec, R839)

Gehört zu [../2026-10-22-auflagen-kern-design.md](../2026-10-22-auflagen-kern-design.md) §7. Alle Abnahmekriterien tragen den
Präfix `AUF-`, weil `AK-U1` bis `U3` und `AK-B1` bis `B3` sonst mit m5, m6, m7, i101 und i120 kollidieren (R136). Die
Nummern vergibt L0 (R417); die hier genannten K15 bis K18 sind Vorschläge. Gilt für Stufe voll: jedes AK ist ein Vitest-Test
oder ein beschriebener Browser-Check. **Voraussetzung:** Der Plan startet erst nach dem Merge von Stadtplanung und Seerecht,
darum sind die Lärm-AK unbedingt (nicht konditional) formuliert.

## 1 Rundungsregel `c0` (ersetzt den Wortlaut in §4.2)

`c0` = Summe über alle Bedarfsträger-Häuser (Stufe braucht das Zielgut, bei Stein: Stufe braucht Glas) aller Inseln von
`max(1, floor(maxInhabitantsOf(Haus) × NOISE_OCCUPANCY_Haus))`. Der Lärmfaktor ist 1 oder `NOISE_OCCUPANCY` (0,75, v19), je
nach Lage des Hauses (`quiet.ts`). Der Steuerfaktor bleibt draussen. Die Abrundung je Haus entspricht `houseCap` auf
`feat/stadtplanung`; nur so erreicht eine voll versorgte Stadt `c0` ganzzahlig, und die Zählung ruht nicht dauerhaft.

## 2 Neue und geänderte AK (Wortlaut, ersetzt die Kurzfassung in §7)

**Sim (`tests/sim/trial-export.test.ts`):**

- **AK-AUF-K3 (ergänzt):** Zusätzlich zu «Zielgut wählen» mit `'food'` und Zahl wird `'constructor'` (und `'toString'`)
  abgewiesen. Die Prüfung nutzt `Object.hasOwn(TRIAL_EXPORT_GOALS, good)`, nicht `in`. Die Gründe aus «I-132 AK 2»
  stehen in [2026-10-16-i132-meisterpruefung.md](../2026-10-16-i132-meisterpruefung.md) §7 AK 2.
- **AK-AUF-K5 (ergänzt):** Szenario Glas: Glas 25 Heimat, Stein 70, Holz 40. Ziel = 320 + 25 + `min(70, 40)` = 385.
  Das Glas selbst zählt in `s0` (Zielgut), nicht nur die Vorprodukte.
- **AK-AUF-K7 (ergänzt):** Ein fehlgeschlagener `sell` (leeres Lager, Menge über Bestand, kein Kontor) zählt nicht, `sold`
  bleibt. `sold` darf `goal` überschreiten (Verkauf von 40 bei `sold = goal − 1`); es gibt keine Kappung.
- **AK-AUF-K10 (ergänzt):** Ist `sold ≥ goal` genau bei `ticks` 8999 → 9000 erreicht (Verkauf vor dem Tick 9000), ist die
  Auflage **bestanden** (Reihenfolge §3.2 Punkt 3: Bestehen vor Zeitablauf). Bei `sold < goal` und 9000 ist sie nicht
  bestanden. Ein Verkauf _nach_ Ablauf zählt nicht (`active = null`).
- **AK-AUF-K12 (neu gefasst):** Bezug sind die vorhandenen Pins in `tests/sim/balance.test.ts` und
  `tests/sim/balance-monument.test.ts`. Beide Dateien bleiben bis auf das `trial`-Literal (AK-AUF-K14) unverändert grün, ohne
  dass ein Pin angefasst wird. Zusätzlich: Zwei Läufe mit gleichem Seed und gleicher Aktionsfolge (`startTrial`, `sell`,
  `abortTrial`) liefern gleiche JSON-Welten.
- **AK-AUF-K14 (neu gefasst):** Das Literal der Startwerte zieht in **allen** Stellen auf
  `{ active: null, ticks: 0, e0: 0, sale: null, passed: [] }` mit: `tests/sim/balance.test.ts:32`,
  `tests/sim/balance-monument.test.ts:164`, `tests/sim/trial.test.ts:29, 203, 273`, `tests/sim/trial-save.test.ts`
  (Zeilen 16, 29, 30, 84–100), `tests/ui/trial.test.ts:42` und `src/sim/world.ts:159` (`createWorld`). Formänderung, keine Zahl.
- **AK-AUF-K15 (neu) Gleichgewicht:** Voll versorgte Stadt, Steuer «normal», Rum-Ziel. (a) Ohne Lärmhaus wächst die Stadt auf
  Einwohner = `c0`; ein `sell` zählt sofort. (b) Mit einem Haus in Lärm (`NOISE_OCCUPANCY`, ungerade Grenze, z. B. 6 × 0,75 =
  4,5 → 4) erreicht die Stadt Einwohner = `c0` (Summe der abgerundeten Grenzen), ein `sell` zählt sofort. Die Zählung ruht
  zu keinem Zeitpunkt, an dem alle Häuser voll sind.
- **AK-AUF-K16 (neu) Lärm während der Auflage:** Wird nach dem Start eine Lärmquelle neben ein Bedarfsträger-Haus gebaut und
  sinkt dadurch die Belegungsgrenze, fallen die Einwohner unter `c0`: Der folgende `sell` zählt nicht (Geld fliesst).
  Wird die Quelle abgerissen und die Stadt wieder voll, zählt er wieder. `c0` ändert sich dabei nicht.
- **AK-AUF-K17 (neu) Steuer «niedrig»:** Mit Steuer «niedrig» erreicht dieselbe Stadt dieselben Einwohner wie bei «normal»
  (`c0` ist steuerfrei), und `sell` zählt gleich. «Hoch» senkt die Einwohner unter `c0`, die Zählung ruht (siehe K8).
- **AK-AUF-K18 (neu) Determinismus über Save:** Seed fix, `sell`-Auflage aktiv, `sold > 0`. N Ticks, `saveWorld`, `loadWorld`,
  M Ticks ergibt dieselbe JSON-Welt wie N+M Ticks am Stück (mit mindestens einem `sell` zwischen den Abschnitten).

**UI (`tests/ui/trial.test.ts`, `app`-nahe Kopie in `tests/ui/`):**

- **AK-AUF-U2 (neu gefasst):** Grenze = `ceil(e0 × 70 ÷ 100)` in ganzer Rechnung (kein `× 0,7`; Gleitkomma liefert für 10 die
  Zahl 8 statt 7). Prüfwerte: `e0 = 10` → 7, `e0 = 20` → 14, `e0 = 100` → 70, dazu 401 → 281. Für jeden Wert bricht die Sim
  bei Einwohner = Grenze − 1 ab und bei Einwohner = Grenze nicht; die Anzeige nennt dieselbe Zahl. Puffer nie negativ. Takt bei
  `sell` = `ceil((goal − sold) ÷ Restminuten)`.
- **AK-AUF-U4 (ergänzt):** `cloneTrial` (`src/ui/app.ts:644`) kopiert tief, `sale` wird nicht geteilt. Test: Vorzustand mit
  `sale { sold: 512, goal: 630 }`; nach dem Übergang (`sale = null`) nennt die Meldung «512 von 630 verkauft» aus dem
  Vorzustand. Ein Zähler im Klon ändert den Original-Zustand nicht.

**Browser-Check bei 1280 px (qa-playtester):**

- **AK-AUF-B3 (neu gefasst):** Prüfstand ist der Spielstand `monumentDone` mit Weidenau aus B1/B2, dazu ein Skript, das (1)
  ein Kaufmannshaus abreisst («zählt nicht: Stadt nicht voll» in der Statuszeile) und (2) bei 4× die Einwohner per Aushungern
  (Lager Zielgüter leer) unter 85 % von `e0` fallen lässt: der Chip ist warm. Das Bestehen (Verkauf über `goal`) erzeugt
  Meldung und Chronikzeile mit Gut. Screenshots unter `.studio/qa/AUFLAGEN-KERN/`.

## 3 Messlauf T5 und Rückfall (R553)

- **Messlauf T5:** Controller-Szenario K'-arm mit Rum-Ausfuhr mit **mindestens 2 Seeds**. Beleg für AUF-K9, keine Pins. Sind
  Zielmengen nur gerechnet ([G]/[S]), bleibt R-4 vorläufig.
- **Rückfall bei Befund:** (1) Zielmenge je Gut per Werte-Ruling in `src/sim/defs/trials.ts` senken (nur Defs, kein Code).
  (2) Beim Glas den Baustoff-Aufschlag streichen: `s0` zählt nur das Zielgut (Regel «Vorprodukte zählen ausser Baustoffen»).
  (3) Besonders prüfen: Felsbucht-Stein Stufe 2 ([S]) und Holz-Zukauf bei Glas (gesperrt, Baustoff).

## 4 Zuordnung zu Aufgaben (§12)

T1: K1, K2, K13, K14 · T2: K3 bis K12, K15 bis K18 · T3: U1 bis U5 · T4: U4 (`cloneTrial`), U5 · T5: K9 (Lauf) · T6: B1 bis B3.
