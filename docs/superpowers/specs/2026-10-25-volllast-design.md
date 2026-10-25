# I-215 Volllast (Spec, Stufe voll)

Datum 2026-10-25 · Paket design-volllast · Meilenstein ohne · ein Häppchen · Quelle: `docs/ideen.md` I-215, Rechnung
[`2026-10-25-volllast-rechnung.md`](2026-10-25-volllast-rechnung.md) mit
[Anhang 01 Rechenweg](2026-10-25-volllast-rechnung/anhang-01-rechenweg.md) (Zahlen, Lagen A–G, Dominanzprüfung,
Wertebereich; hier übernommen, nicht neu gerechnet; Verweise «Rechnung §n» bzw. «A.n»). Entscheide R937 (Werte, Ruhe
50 %, `ceil` als letzter Faktor, Uhr in Ticks, Sperren, ein Save-Feld, Abriss ohne Sonderregel), Erklärbarkeit R896 (0).
Anhänge dieser Spec: [01 Texte](2026-10-25-volllast-design/anhang-01-texte.md) (Panel, Tooltip, Sperrgründe,
Warnungen), [02 Testaufbau](2026-10-25-volllast-design/anhang-02-testaufbau.md) (Welten und Zahlenwege der AK).

## Spielerzweck

Der Spieler zieht in einem Engpass Ware vor: Ein Knopf am Betrieb lässt ihn 3:00 lang schneller arbeiten, danach ruht
er 2:00 ohne Ausstoss — ein **Kredit in Ware**, der sich lohnt, wenn die Kette Überschuss hat oder eine Frist drängt, und
sich rächt, wenn sie am Anschlag läuft (Rechnung §0, §4).

Säulen: Produktionsketten und Handel (Aufträge, Verträge). Spürbar im ersten Spiel: ein Knopf neben «Stilllegen» mit
Wirkung und Preis in Zahlen, ein sichtbarer Zustand «Volllast 2:13» bzw. «Ruht 1:05» und kein Pflichtklick.

**Spielschleifen:**

- **Kurz (Sekunden bis 1 min):** Lücke im Lager oder Auftrag mit Frist sehen → Tooltip lesen (Ausstoss, Unterhalt,
  Ruhe, Warnungen) → Volllast, Zukauf am Kontor oder Abwarten wählen.
- **Mittel (ein Fenster 5:00 = 3000 Ticks):** Volllast vor einer Frist starten (Vorlauf), Betriebe einer Kette
  staffeln statt alle gleichzeitig, die Ruhe nicht auf eine Vertragsabrechnung legen; der Engpass wandert zum Eingang
  (Rechnung §4, «Engpass wandert»).
- **Lang (Partie):** Dauer-Volllast verliert immer (≤ 80 % Ausstoss, 110–120 % Unterhalt, Rechnung §5); wer dauerhaft
  mehr braucht, baut aus oder baut einen weiteren Betrieb. Volllast ist die Brücke bis dahin, im Früh- und Mittelspiel
  am stärksten (Rechnung §0 «Grenze»).

## Regeln

1. **Werte** (R937, nur in den Defs, nie im Code):
   - `src/sim/defs/buildings.ts`: `OVERTIME_CYCLE_PCT = 75` (Zyklus in Volllast, Prozent, aufgerundet),
     `OVERTIME_UPKEEP_PCT = 150` (Unterhalt in Volllast, Prozent, aufgerundet); neben `PAUSED_UPKEEP_PCT`.
   - `src/sim/defs/timing.ts`: `OVERTIME_TICKS = 1800` (Volllast, 3:00 bei 1×), `OVERTIME_REST_TICKS = 1200` (Ruhe,
     2:00 bei 1×), im Block neben dem Fest mit Doc-Kommentar «Save-Prüfung liest `overtimeAt` nur gegen den Tick».
   - Ruhe-Unterhalt: `PAUSED_UPKEEP_PCT` (50, `buildings.ts:303`), **kein neues Feld**.
   - Spielraum und Stellhebel nach einem Playtest: Rechnung §6 (`k` 70–75, `m` 150–175, Paare `OT`/`RT` A.4). Schranke:
     `OVERTIME_UPKEEP_PCT` muss > 133 bleiben (S0), sonst wird Dauer-Volllast auf gedrosselten Betrieben billiger.
2. **Gilt für** Gebäude mit `produces` und Zyklus (`cycleOf` ≠ `undefined`), auf jeder Insel, jeder Stufe. Nicht für
   Häuser, Dienste, Markt, Kontor, Denkmal (Nicht im Scope).
3. **Phase** (abgeleitet, einziger Leseort `overtimeState(world, b)` im neuen Blattmodul `src/sim/overtime.ts`). Mit
   `d = world.tick − b.overtimeAt`, `OT` = `OVERTIME_TICKS`, `RT` = `OVERTIME_REST_TICKS`:
   - Feld fehlt → `{ phase: 'normal', remaining: 0 }`;
   - `d < OT` → `{ phase: 'overtime', remaining: OT − d }`;
   - `OT ≤ d < OT + RT` → `{ phase: 'rest', remaining: OT + RT − d }`;
   - `d ≥ OT + RT` → `{ phase: 'normal', remaining: 0 }` (abgelaufen; Löschung Regel 9).
   - Muster wie `feastState` (`feast.ts:14-22`). Die Uhr läuft in Ticks, **unabhängig vom Zustand** des Betriebs
     (`waitingInput`, `storageFull`, `noService`, `noForest`, `waitingReserve`, `burning`, `notConnected`,
     stillgelegt). Spielpause hält sie an, Zeitraffer beschleunigt sie (es zählen nur `step`-Aufrufe).
   - Exakte Zählung: Die Aktion läuft zwischen zwei Schritten bei Tick `T`. Die Schritte `T + 1 … T + OT − 1` laufen in
     Volllast (1799 Produktionsschritte), `T + OT … T + OT + RT − 1` in Ruhe (1200), ab `T + OT + RT` normal. Anzeige
     direkt nach dem Klick: «Volllast 3:00».
   - `overtime.ts` importiert nur `defs/*` und `types`, nie `levels`, `production`, `economy` (kein Importzyklus,
     wie `feastEffect.ts` in I-201 Regel 8).
4. **Zyklus** (`cycleOf`, `levels.ts:40`, einziger Leseort): In Phase `overtime` gilt
   `c' = max(1, ceil(c × OVERTIME_CYCLE_PCT / 100))`, wobei `c` der Zyklus **nach allen anderen Faktoren** ist
   (Abschnitt «Schnittstelle `cycleOf`»). Der Faktor ist der **letzte** Schritt vor der Rückgabe. In `normal` und
   `rest` bleibt `c`. Reine Hilfsfunktion `overtimeCycle(c)` (exportiert, testbar). Beispiele: 50 → 38, 30 → 23,
   20 → 15, 8 → 6, 4 → 3, 3 → 3, 2 → 2, 1 → 1. Mit `ceil` gilt `c / c'` ≤ 4/3 für jedes `c` (Rechnung §5
   «Struktursicherheit», A.4 S5). Panel-Anzeige und alle Raten, die `cycleOf` lesen, zeigen den Volllast-Zyklus mit.
5. **Unterhalt** (`buildingUpkeep`, `levels.ts:49`, einziger Leseort für die Summe), mit `u = upkeepOf(b)` (inklusive
   künftiger Drosselung durch AUSBAU-LOGIK):
   - stillgelegt (`paused`) → `ceil(u × PAUSED_UPKEEP_PCT / 100)`, **Vorrang** vor jeder Phase (Rechnung §8.6);
   - sonst Phase `overtime` → `ceil(u × OVERTIME_UPKEEP_PCT / 100)`;
   - sonst Phase `rest` → `ceil(u × PAUSED_UPKEEP_PCT / 100)`;
   - sonst `u`. Stillgelegt **und** Ruhe stapeln nicht (50 %, nicht 25 %).
   - `buildingUpkeep` braucht dafür den Tick; die Signatur (z. B. `buildingUpkeep(world, b)`) legt der Plan fest, alle
     Aufrufer (`economy.ts:64`, `ui/inspect.ts:960`, `ui/upkeepRank.ts:30`, `ui/panelView.ts:191`) ziehen mit.
   - Edikt «Sparen» wirkt wie heute auf die Summe inklusive Mehr-Unterhalt (`economy.ts:62-68`), keine Sonderregel.
   - Beispiele: Weberei St. 1 `u` 15 → Volllast 23, Ruhe 8; Rinderfarm St. 3 `u` 17 → 26 bzw. 9 (A.2).
6. **Produktion** (`production.ts`, `advance`): Prüfreihenfolge neu, erster Treffer gewinnt:
   1. Ausfall (`burning`) wie heute;
   2. stillgelegt (`paused`) wie heute;
   3. **neu:** Phase `rest` → `b.state = 'resting'`, kein Fortschritt, keine Entnahme, `progress` bleibt;
   4. ab `notConnected` wie heute.
   - In der Ruhe friert der Fortschritt ein wie beim Stilllegen; schon entnommene Eingangsware bleibt im Betrieb
     (Rechnung §8.10). Die Auslastung `eff` zählt die Ruhe als 0 (kein Fortschritt, Rechnung §8.11).
   - In Volllast ändert sich nur der Zyklus. Ist `progress ≥ c'` zu Beginn der Volllast, entsteht die Einheit im
     nächsten Schritt (`production.ts:67`, Vergleich `>=`). Volles Lager, fehlender Eingang, Sturm (Fortschritt nur bei
     jedem zweiten Tick, `production.ts:51`) gelten unverändert; Volllast wirkt dort relativ gleich oder verpufft.
7. **Neuer Zustand `'resting'`** in `BuildingState` (`types.ts:151`) und in `BUILDING_STATES` (`save.ts:552`). Anzeige
   «Ruht m:ss» (Anhang 01), unterscheidbar von «Stillgelegt». Für Phase `overtime` gibt es keinen eigenen Zustand; das
   Panel zeigt die Phase aus `overtimeState` zusätzlich zum Zustand.
8. **Aktion** `startOvertime(world, id: unknown): Result` in `overtime.ts`; wirft nie, bei `fail` bleibt die Welt
   unverändert. Sperrprüfung als reine Lesefunktion `overtimeBlockReason(world, b): string | null`. Reihenfolge, erster
   Treffer gewinnt (Texte exakt, Anhang 01 A):
   1. kein Gebäude zur Id (auch Nicht-Ganzzahl) → «Gebäude nicht gefunden»;
   2. kein `produces` oder kein Zyklus → «Nur Betriebe kennen Volllast»;
   3. Phase `overtime` → «Volllast läuft»;
   4. Phase `rest` → «Ruht»;
   5. `paused` → «Stillgelegt: erst anfahren»;
   6. `outageUntil` gesetzt → «Brennt»;
   7. `!connected` → «Keine Strassenverbindung»;
   8. Erfolg: `b.overtimeAt = world.tick`. Kein Geld, keine Ware, kein Zufall.
   - **Nicht gesperrt** sind `waitingInput`, `waitingReserve`, `storageFull`, `noService`, `noForest`: Der Knopf bleibt
     wählbar und warnt im Tooltip «… Volllast verpufft» (Rechnung §8.2, Regel 12).
   - Die Ruhe ist nicht abbrechbar; es gibt keinen Knopf «Volllast beenden» (I-215).
9. **Löschen:** In `tickProduction` wird vor `advance` ein Feld mit `d ≥ OT + RT` gelöscht (`delete b.overtimeAt`).
   Der Schritt läuft danach normal. Nach dem Schritt `T + OT + RT` gibt es also kein Feld mehr, der Knopf ist wählbar.
10. **Stilllegen** (`pause.ts`) bleibt unverändert und ist in jeder Phase erlaubt: In Volllast läuft die Uhr weiter, der
    Betrieb steht, Unterhalt 50 % (Regel 5); in der Ruhe ändert es nur den Zustand (`paused` statt `resting`). Anfahren
    während der Ruhe führt im nächsten Schritt zu `resting`.
11. **Ausbau** (`upgrade.ts`) während Volllast oder Ruhe ist erlaubt; das Feld und `progress` bleiben, `c'` und `u'`
    folgen der neuen Stufe ab dem nächsten Schritt (Rechnung §8.7). **Abriss** ohne Sonderregel: Feld geht mit dem
    Gebäude, Erstattung wie heute (`build.ts:94-95`, Rechnung §8.5). **Brand** während der Volllast: Uhr läuft weiter,
    Brandrisiko unverändert.
12. **Erklärbarkeit (R896 (0)), Bedienung:** Knopf «Volllast» im Betriebs-Panel (`src/ui/inspect.ts`, neben
    «Stilllegen»), Tooltip mit den echten Zahlen des Betriebs aus `cycleOf`, `buildingUpkeep` und den Defs, Sperrgrund
    mit Restzeit, Zustandszeile, Warnungen ohne Sperre, Unterhaltszeile mit Zusatz. Texte, Formeln und Beispiele:
    [Anhang 01](2026-10-25-volllast-design/anhang-01-texte.md). Die Textbausteine baut ein reiner, DOM-freier Helfer
    `src/ui/overtime.ts` (`overtimeTooltip`, `overtimeLockText`, `overtimeWarnings`), getestet unter `tests/ui/`.
    - Einheiten wie die bestehenden Panelzeilen: Raten mit `perMinute` (`/ min`), Zeiten mit `formatGameTime`
      (`src/ui/time.ts`). Abweichung zur Rechnung §9 nur in der Einheit (dort «je 100 Ticks»), nicht im Wert.
    - Warnungen: Eingang fehlt bzw. Lager voll bzw. kein Fortschritt (aus dem Zustand), Ruhe überdeckt eine
      Vertragsabrechnung (`nextSettleTick`, `orders.ts:307`; Vertrag des Ausstossguts auf derselben Insel) oder eine
      Auftragsfrist (`order.due`, Ausstossgut, Insel egal). Fenster der Ruhe: `[tick + OT, tick + OT + RT)`.

## Schnittstelle `cycleOf`

`cycleOf` ist der einzige Leseort des Zyklus (R706 a, Spec 3.1 R1.8); vier offene Pakete setzen dort an. Verbindliche
Reihenfolge, unabhängig von der Merge-Reihenfolge:

| Schritt | Faktor                                                 | Paket                  | Rundung            |
| ------- | ------------------------------------------------------ | ---------------------- | ------------------ |
| 1       | Grundzyklus der laufenden Stufe (`LEVELS`, k aus R5)   | heute / AUSBAU-LOGIK   | –                  |
| 2       | Rat anteilig, dann Inselvorteil (`effectiveCycle`)     | heute                  | `floor`, min. 1    |
| 3       | Erntefest (I-201 Regel 6) und Taktlohn (I-210 `cycle`) | I-201, I-210           | `floor`, min. 1    |
| 4       | **Volllast** (`overtimeCycle`, nur Phase `overtime`)   | **I-215 (diese Spec)** | **`ceil`**, min. 1 |

- Die Reihenfolge innerhalb von Schritt 3 (Erntefest gegen Taktlohn) legen die Pläne von I-201 und I-210 fest; sie
  berührt Volllast nicht.
- **Warum zuletzt:** Nur dann gilt `c / c'` ≤ 4/3 auf den fertigen Zyklus, egal welche Faktoren davor stehen
  (Rechnung §8.9, A.4 S5). Bei kleinen Zyklen ändert die Reihenfolge das Ergebnis: Glashütte St. 3 (20) auf
  Bergbau-Insel (`TRAIT_CYCLE_PCT` 50) → 10 → Volllast **8**; umgekehrt wäre es 7 (AK-VL-03).
- **Merge-Reihenfolge:** Merged Volllast zuerst, setzen I-201, I-210 und AUSBAU-LOGIK ihre Faktoren **vor** den
  Volllast-Schritt; die Volllast-Zeile bleibt die letzte vor `return`. Merged Volllast zuletzt, kommt der Schritt hinter
  die vorhandenen. AK-VL-03 sichert die Lage in jedem Fall; der Plan nennt den Konfliktpunkt `levels.ts` für das Gate
  Merge (gleichzeitige Änderung an `cycleOf` und an `buildingUpkeep` durch AUSBAU-LOGIK AK-AL-12).
- **`buildingUpkeep`:** AUSBAU-LOGIK ändert `upkeepOf` (Drossel nach k); Volllast multipliziert das Ergebnis. Reihenfolge:
  `upkeepOf` (Stufe/Drossel) → Stilllegen oder Phase (Regel 5) → Summe → Edikt.

## Save

- Neues optionales Gebäudefeld `overtimeAt?: number` (`types.ts`, `Building`, neben `feastAt`): Starttick der Volllast.
  Fehlt = Normalbetrieb. Ein Feld statt zweier Zähler (Rechnung §8.4, R937).
- **Prüfung** (neue Funktion `isValidOvertime(b, tick)` neben `isValidFeast`, `save.ts:582`, aufgerufen in
  `isValidV6Fields`), nachsichtig: Feld fehlt → gültig; sonst nur an Gebäuden mit `produces`, ganzzahlig,
  `0 ≤ overtimeAt ≤ tick`. Abgelaufene Felder (`d ≥ OT + RT`) sind gültig und gelten als Normalbetrieb; der nächste
  Schritt löscht sie (Regel 9). So bricht eine spätere Änderung von `OT`/`RT` keinen Spielstand. Ungültig →
  `{ ok: false, reason: 'Beschädigter Spielstand' }`, nie ein Wurf.
- `'resting'` ist ein gültiger Zustand in `BUILDING_STATES`.
- **Version:** `SAVE_VERSION` = Wert des Merge-Stands auf main **+ 1** (R909, R937). Spec, Plan und Tests nennen keine
  feste Nummer; Tests lesen nur `SAVE_VERSION`.
- **Vorgängerstand** (`version: SAVE_VERSION − 1`), Regel nach R937: **mit Hinweis abgewiesen**, nicht migriert:
  `deserialize` liefert `{ ok: false, reason: 'Unbekannte Version' }` (bestehender Text, `save.ts:1031`; die UI zeigt
  ihn als Hinweis), nie ein Wurf. Folge: Auch alle älteren Stände, die über die Kette auf `SAVE_VERSION − 1` kommen,
  werden abgewiesen. Bestehende Tests, die ältere Stände laden und `ok` erwarten (mindestens `tests/sim/trial-save.test.ts`
  AK-12, `council-save.test.ts`, `save-v11/12/13.test.ts`, `save.test.ts`, `save-loyalty.test.ts`,
  `scenario-saves.test.ts`, `tests/ui/storage.test.ts`), stellt der Plan auf Abweisen um. **Entscheidungsbedarf E1**
  (Offene Punkte): Empfehlung Migration ohne Datenänderung.
- `SAVE_VERSION + 1` → «Unbekannte Version» wie heute.
- arc42 (Kapitel Persistenz und Tick-Ablauf: neues Feld, Löschung im Produktionsschritt) und README (Spielanleitung:
  Knopf Volllast) führt der Plan mit.

## Randfälle (Rechnung §8 → Regel / AK)

| Nr. | Randfall (Rechnung §8)               | Antwort in dieser Spec                                                   | AK                 |
| --- | ------------------------------------ | ------------------------------------------------------------------------ | ------------------ |
| 1   | Ruhe während laufender Frist         | keine Sonderregel, Ruhe nicht abbrechbar; Warnung im Tooltip (Regel 12)  | AK-VL-20           |
| 2   | Volllast bei leerem Eingangslager    | Uhr läuft trotzdem (Regel 3), Knopf wählbar mit Warnung (Regel 8)        | AK-VL-07, -11      |
| 3   | Spielpause und Zeitraffer            | Uhr in Ticks, nur `step` zählt; Anzeige in Spielzeit bei 1× (Regel 3)    | AK-VL-06, -19      |
| 4   | Speichern                            | ein Feld `overtimeAt`, nachsichtig geprüft, Version + 1 (Save)           | AK-VL-15 … -17     |
| 5   | Abriss während Volllast oder Ruhe    | keine Sonderregel, Erstattung wie heute (Regel 11)                       | AK-VL-13           |
| 6   | Stilllegen in Volllast / Ruhe; Knopf | Uhr läuft, 50 % mit Vorrang, kein Stapeln; Knopf gesperrt (Regeln 5, 8)  | AK-VL-05, -10      |
| 7   | Ausbau während Volllast oder Ruhe    | erlaubt, Feld und Fortschritt bleiben, Werte der neuen Stufe (Regel 11)  | AK-VL-12           |
| 8   | Brand, Strasse, Sturm                | Knopf gesperrt bei Brand/ohne Strasse; Uhr läuft; Sturm unverändert      | AK-VL-07, -10, -14 |
| 9   | Reihenfolge der Faktoren, Edikte     | Volllast letzter Faktor (`ceil`); Sparen auf die Summe                   | AK-VL-03, -04      |
| 10  | Fortschritt beim Phasenwechsel       | `progress ≥ c'` → Einheit im nächsten Schritt; Ruhe friert ein (Regel 6) | AK-VL-08, -09      |
| 11  | Auslastung                           | Ruhe zählt 0, Zustand «Ruht» (Regeln 6, 7)                               | AK-VL-08           |

Weitere Randfälle dieser Spec: abgelaufenes Feld im geladenen Stand (AK-VL-16), Feld an einem Nicht-Betrieb im Save
(AK-VL-16), mehrere Betriebe einer Kette gleichzeitig in Volllast (keine Regel, gewollte Wahl; Panel zeigt die
Restzeit je Betrieb, Rechnung §4), Zyklen ≤ 3 durch künftige Faktoren (Volllast wirkungslos, kein Fehler; AK-VL-01).

## Balancing-Test

`tests/sim/balance.test.ts` bleibt **unverändert** und grün. Begründung: Der Controller drückt den Knopf nicht; ohne
`overtimeAt` liefern `cycleOf` und `buildingUpkeep` exakt die heutigen Werte (AK-VL-18). Kein Ruling nötig (Rechnung
§10). Die Rechnung (A.2) bleibt die Quelle der Wertebilanz; gemessen wird nur, was AK-VL-18 und -19 belegen.

## Abnahmekriterien

Vitest (DOM-frei): `tests/sim/overtime.test.ts` (neu), `tests/sim/overtime-save.test.ts` (neu),
`tests/ui/overtime.test.ts` (neu), bestehend `tests/sim/save*.test.ts`. Aufbau der Welten und Zahlenwege:
[Anhang 02](2026-10-25-volllast-design/anhang-02-testaufbau.md). Zahlen im Test immer aus den Defs ableiten oder gegen
die hier genannten Werte prüfen, wenn die Defs unverändert sind (`OVERTIME_*` wie Regel 1).

- **AK-VL-01 Zyklusformel** (`overtime.test.ts`): `overtimeCycle(c)` für `c` = 1, 2, 3, 4, 8, 20, 30, 50 →
  1, 2, 3, 3, 6, 15, 23, 38. Für alle `c` in 1 … 500 gilt `3 × c ≤ 4 × overtimeCycle(c)` und `overtimeCycle(c) ≤ c`.
- **AK-VL-02 Zyklus je Phase** (`overtime.test.ts`): Weberei St. 1 auf der Heimatinsel: `cycleOf` = 50 normal,
  38 in Volllast, 50 in der Ruhe und nach dem Löschen. Rinderfarm St. 3: 8 → 6.
- **AK-VL-03 Letzter Faktor** (`overtime.test.ts`): Glashütte St. 3 auf einer Insel mit `mountainRich`: `cycleOf` =
  10 normal, **8** in Volllast (nicht 7). Schäferei St. 1 auf `fertile`: 25 → 19. Ist I-201 oder I-210 bereits auf
  main, ergänzt der Plan einen Fall mit Erntefest bzw. Taktlohn: Weberei St. 3 (20) mit Erntefest → 15 → Volllast 12
  (nicht 11).
- **AK-VL-04 Unterhalt** (`overtime.test.ts`): `buildingUpkeep` Weberei St. 1 = 15 / 23 / 8 (normal / Volllast /
  Ruhe), Rinderfarm St. 3 = 17 / 26 / 9. Mit Edikt «Sparen» (80 %) ist `totalUpkeep` = ⌊(S + 23) × 80 / 100⌋, wobei S
  der Unterhalt aller anderen Gebäude und Schiffe ist.
- **AK-VL-05 Stilllegen** (`overtime.test.ts`): Weberei St. 1 in Volllast, dann `setPaused(true)`: `buildingUpkeep` = 8,
  `progress` und Lager unverändert über 100 Schritte, `overtimeState.remaining` sinkt um genau 100. In der Ruhe
  stillgelegt: `buildingUpkeep` = 8 (nicht 4), Zustand `'paused'`; nach `setPaused(false)` im nächsten Schritt
  `'resting'`.
- **AK-VL-06 Phasen und Uhr** (`overtime.test.ts`): `startOvertime` bei Tick T → `ok`, `overtimeAt` = T,
  `overtimeState` = `overtime`/1800. Nach 1800 `step`: `rest`/1200. Nach weiteren 1199: `rest`/1. Nach einem weiteren:
  Feld fehlt, `normal`/0, `startOvertime` wieder `ok`.
- **AK-VL-07 Uhr unabhängig vom Zustand** (`overtime.test.ts`): Weberei St. 1 ohne Wolle (`waitingInput` während der
  ganzen Volllast): Phasenwechsel bei denselben Schritten wie AK-VL-06, keine Wolle entnommen, kein Stoff erzeugt, Feld
  nach 3000 Schritten gelöscht. Dasselbe mit Brand während der Volllast (`outageUntil` gesetzt) und mit
  `notConnected` nach dem Start (Strasse abgerissen).
- **AK-VL-08 Ruhe ohne Fortschritt** (`overtime.test.ts`): Betrieb mit `progress` 13 bei Ruhe-Beginn: über alle 1200
  Ruhe-Schritte `progress` 13, Lager Eingang und Ausstoss unverändert, Zustand `'resting'`, `eff` fällt in jedem Schritt
  (Ziel 0). Nach der Ruhe läuft der Betrieb mit `progress` 14 weiter.
- **AK-VL-09 Fortschritt beim Phasenwechsel** (`overtime.test.ts`): Weberei St. 1 mit `progress` 40 (≥ 38), Start der
  Volllast → im nächsten Schritt eine Einheit Stoff, `progress` 0, keine zweite Wollentnahme in diesem Schritt.
- **AK-VL-10 Sperrgründe** (`overtime.test.ts`, `it.each`): je Fall `{ ok: false, reason }` mit exaktem Text aus
  Regel 8 und `serialize(world)` vor und nach gleich: unbekannte Id, Id `'1'`, Haus, Markt, in Volllast, in der Ruhe,
  stillgelegt, brennend, ohne Strassenverbindung. Rangfolge: Ruhe **und** stillgelegt → «Ruht»; stillgelegt **und**
  brennend → «Stillgelegt: erst anfahren»; brennend **und** ohne Strasse → «Brennt». `overtimeBlockReason` liefert
  dieselben Texte und ändert nichts.
- **AK-VL-11 Erlaubt trotz Engpass** (`overtime.test.ts`): `startOvertime` liefert `ok` bei `waitingInput`,
  `waitingReserve`, `storageFull`, `noService` und `noForest`.
- **AK-VL-12 Ausbau** (`overtime.test.ts`): Weberei St. 1 in Volllast, `upgradeBuilding` → `ok`; `overtimeAt` und
  `progress` unverändert, `cycleOf` = 23 (`ceil(30 × 0,75)`), `buildingUpkeep` = 30 (`ceil(20 × 1,5)`). In der Ruhe
  ausgebaut: `cycleOf` 30, `buildingUpkeep` 10.
- **AK-VL-13 Abriss** (`overtime.test.ts`): Weberei in Volllast bzw. in der Ruhe abgerissen → `ok`, Geld- und
  Lagerzugang identisch zum Abriss derselben Weberei ohne Volllast in einer Vergleichswelt; das Gebäude fehlt danach in
  `world.buildings`.
- **AK-VL-14 Sturm** (`overtime.test.ts`): Fischer St. 1 (`stormAffected`, `c` 40) in Volllast während eines wirkenden
  Sturms, Start bei geradem Tick: eine Einheit nach genau 60 Schritten (30 Fortschritt, nur jeder zweite Tick), ohne
  Volllast nach 80.
- **AK-VL-15 Save-Rundreise** (`overtime-save.test.ts`): Welten mit Betrieb in Volllast (`d` = 500) und in der Ruhe
  (`d` = 2000) → `serialize`/`deserialize` → `ok`, `overtimeAt` gleich, Zustand `'resting'` erhalten; danach 3000
  Schritte geladene und ungeladene Welt: `serialize` gleich (bitgleich).
- **AK-VL-16 Save-Prüfung** (`overtime-save.test.ts`, `it.each`): `overtimeAt` −1, `tick + 1`, 1,5, `'5'`, `null`, an
  einem Haus, am Markt → «Beschädigter Spielstand», kein Wurf. Abgelaufen (`d` = 5000) → `ok`, `overtimeState` =
  `normal`, Feld nach dem nächsten `step` gelöscht. Zustand `'resting'` ohne Feld ist gültig (Zustand wird im nächsten
  Schritt neu gesetzt).
- **AK-VL-17 Version** (`overtime-save.test.ts`): `serialize` schreibt `version: SAVE_VERSION`. Ein Stand mit
  `version: SAVE_VERSION − 1` (aus `createWorld`, Feld `version` ersetzt, ohne `overtimeAt` und ohne `'resting'`) →
  nach R937 `{ ok: false, reason: 'Unbekannte Version' }`, kein Wurf (bei E1 = Migration: `ok`, `version ===
SAVE_VERSION`, Inhalt sonst gleich, Weiterspielen bitgleich). `version: SAVE_VERSION + 1` → «Unbekannte Version».
  Kein Literal einer Versionsnummer im Test.
- **AK-VL-18 Baseline bitgleich** (`overtime.test.ts` und bestehende Tests): Ohne `overtimeAt` liefern `cycleOf` und
  `buildingUpkeep` für alle Betriebe mit Zyklus, Stufen 1–3, normal und stillgelegt, dieselben Werte wie
  `effectiveCycle(…)` bzw. `upkeepOf`/`PAUSED_UPKEEP_PCT` (Tabelle im Test aus den Defs). `tests/sim/balance.test.ts`
  ist gegenüber main unverändert (`git diff main -- tests/sim/balance.test.ts` leer) und grün; alle übrigen Sim-Tests
  grün, Anpassungen nur an Versionsfällen (Abschnitt Save).
- **AK-VL-19 Dauer-Volllast** (`overtime.test.ts`): Weberei St. 1, Wolle 100, Stoff 0, keine Verbraucher, `progress` 0.
  Lauf A: 3000 Schritte normal → **60** Stoff. Lauf B: `startOvertime` bei T, 3000 Schritte, danach sofort wieder
  möglich → **47** Stoff (≤ 80 % von 60). Mehr-Unterhalt B gegen A über die 3000 Schritte: 59 oder 60 Geld (Rechnung
  A.2 `ΔU` 60). Anzeige-Grösse: `formatGameTime(OVERTIME_TICKS)` = «3:00», `formatGameTime(OVERTIME_REST_TICKS)` = «2:00».
- **AK-VL-20 Texte und Warnungen** (`tests/ui/overtime.test.ts`): `overtimeTooltip` für Weberei St. 1 liefert exakt die
  Zeilen aus Anhang 01 B; `overtimeLockText` liefert «Volllast läuft noch 2:13» bei `remaining` 1330 und «Ruht noch
  1:05» bei 650; `overtimeWarnings` liefert je eine Zeile für `waitingInput`, `storageFull`, eine Vertragsabrechnung
  des Stoffs im Ruhefenster («Ruhe überdeckt die Vertragsabrechnung in …») und eine Auftragsfrist im Ruhefenster; keine
  Warnung ohne Vertrag und Auftrag, keine für einen Vertrag eines anderen Guts oder einer anderen Insel.
- **AK-VL-21 Werte nur in den Defs** (Prüfung im Gate per `rg`): `src/sim/overtime.ts`, `src/sim/levels.ts`,
  `src/sim/production.ts` und `src/ui/overtime.ts` enthalten keine Literale 75, 150, 1800, 1200 für Volllast; sie lesen
  `OVERTIME_*` und `PAUSED_UPKEEP_PCT`. `overtime.ts` importiert weder `levels` noch `production` noch `economy`.
- **AK-VL-22 Browser-Check Panel** (`npm run dev`, 1280 px, Screenshot je Schritt; Ablauf Anhang 02 C): Weberei St. 1
  mit Wolle wählen → Knopf «Volllast» neben «Stilllegen», Tooltip zeigt Zyklus, Unterhalt, Eingang, Ruhe und Dauer wie
  Anhang 01 B. Klick → Zustandszeile «Volllast 3:00», zählt herunter; Unterhaltszeile 138 / min mit Zusatz «+48 / min
  durch Volllast»; Knopf gesperrt mit «Volllast läuft noch …». Bei 4× bis zur Ruhe → «Ruht 2:00», Ausstossrate 0,
  Unterhalt 48 / min mit «−42 / min in der Ruhe», Knopf «Ruht noch …». Danach Normal, Knopf frei. Stillgelegt, brennend
  und ohne Strasse je einmal: Sperrtext sichtbar. Weberei ohne Wolle: Warnung «Eingang fehlt: Volllast verpufft».
- **AK-VL-23 Browser-Check Spielstand**: Volllast starten, speichern, neu laden → Zustand und Restzeit stimmen (± 1 s),
  die Uhr läuft weiter. Ein Spielstand der Vorgängerversion zeigt beim Laden den Hinweis aus AK-VL-17, die Seite stürzt
  nicht ab.

## Nicht im Scope

- Volllast für Häuser, Dienste, Markt, Kontor, Denkmal oder Schiffe (Rechnung §12).
- Controller- oder KI-Nutzung; der Balancing-Controller drückt den Knopf nicht.
- Änderungen an Brandrisiko, Edikten, Ratsbeschlüssen, Inselvorteil, Sturm.
- Abbrechen der Ruhe, Volllast-Staffel per Knopf für eine ganze Kette, Warteschlange von Volllasten.
- Symbol am Gebäude auf der Karte (Render-Strang) und Klang (Audio-Strang); als Folgeeintrag Offene Punkte 3.
- Messung per Wrapper oder Replay; die Rechnung ist gerechnet, nicht gemessen (Rechnung §11).
- Neue Werte ausser den vier `OVERTIME_*`; keine Änderung an `PAUSED_UPKEEP_PCT`.

## Offene Punkte

1. **E1 Vorgängerstand (Entscheidungsbedarf L0, R471).** R937 legt «Altstand mit Hinweis abgewiesen» fest. Die
   Save-Kette migriert heute jede Version bis zur aktuellen (`save.ts:1013-1031`), und die offenen Pakete SEERECHT,
   I-210 und AUSBAU-LOGIK migrieren bzw. laden ihren Vorgänger. Abweisen beendet die ganze Kette: Jeder alte Spielstand
   wird unladbar, und mindestens acht Testdateien müssen von «lädt» auf «abgewiesen» umgestellt werden. Das Feld ist
   optional, sein Fehlen bedeutet Normalbetrieb; eine Migration `SAVE_VERSION − 1 → SAVE_VERSION`, die nur `version`
   erhöht, ist ein Einzeiler. **Empfehlung: Migration ohne Datenänderung** (AK-VL-17 Variante in Klammern), Abweisen
   bleibt für `SAVE_VERSION + 1` und beschädigte Felder. Bis zu einem Ruling gilt R937.
2. **Signatur `buildingUpkeep`** (Regel 5): Der Plan wählt zwischen `buildingUpkeep(world, b)` und einem Tick-Parameter
   und stimmt sie mit AUSBAU-LOGIK (Drossel in `upkeepOf`, AK-AL-12) ab.
3. **Kartensymbol** für Volllast und Ruhe (Rechnung §9): eigener Eintrag im Render-Strang nach dem Merge; bis dahin
   tragen Panel und Hover die Erklärbarkeit.
4. **Leistung:** `overtimeState` ist O(1) je Betrieb und Schritt (ein Feld, eine Subtraktion); kein Cache nötig.
