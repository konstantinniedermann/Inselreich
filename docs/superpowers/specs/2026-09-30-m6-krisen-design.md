# M6 „Krisen und Stadtdienste" — Design-Spec (Entwurf)

Datum: 2026-09-30 · Paket M6-SPEC · Status: **Entwurf.** Designvorschlag `lead-design` nach Ruling R72.
Die Ausarbeitung durch `design-spec-author` mit Abnahmekriterien steht noch aus, das Gate Spec ebenfalls.

Grundlage: Ruling R72, Kandidaten `.studio/handoffs/m6-kandidaten.md`, Wirtschaftscheck
`.studio/handoffs/m6-wirtschaftscheck.md` und die verbindlichen Werte `.studio/handoffs/m6-werte.md`.
Die drei Dateien liegen lokal und fliessen bei der Ausarbeitung in diese Spec ein.

## 1. Ziel

**Spielerzweck:** Meine Kolonie kann Schaden nehmen. Ich wäge Vorsorge, Lagerpuffer, Aufträge und
Boom-Verkäufe gegeneinander ab.

**15-Minuten-Kriterium:** Die erste Krise kommt bei Tick 2400 (4 min bei 1×). Danach kommt je Periode genau
eine Krise (Stufe „normal": alle 600 Ticks).

## 2. Entscheide aus dem Brainstorming (lead-design)

Die Zahlen sind vorläufig und stammen aus dem Wirtschaftscheck. Verbindlich ist `m6-werte.md`, sobald die
Ausarbeitung sie übernimmt.

1. **Krisenstufe:** Das neue Feld `world.crisisLevel` hat die Werte `off`, `mild` und `normal`.
   - Die Stufe wird nur beim neuen Spiel gewählt, im laufenden Spiel lässt sie sich nicht wechseln.
   - `createWorld` setzt standardmässig `off`, damit der Balancing-Test bitgleich bleibt (6050).
   - Die UI setzt standardmässig `normal`. Die Wahl steht in `inselreich.settings` und gilt für das nächste „Neu".
   - Migrierte v2-Spielstände erhalten `off`.
   - Die Periode dauert bei `normal` 600 Ticks, bei `mild` 1200 Ticks. Die erste Periode beginnt bei beiden Stufen bei Tick 2400.
2. **Zufall:** Der Zufall wird je Periode `k` nach ADR-010 abgeleitet, mit eigener Konstante (nicht 0x9e3779b1).
   Im Save liegt kein RNG-Zustand.
   - Je Periode gibt es genau eine Krise. Die Anteile sind Brand 50 %, Sturm 25 %, Boom 25 %.
   - Es laufen nie zwei Krisen gleichzeitig: Die längste Krise dauert 500 Ticks, die Periode 600.
3. **Brand:**
   - **Ziel:** Gezogen wird eine Zielkachel im Rechteck um alle brennbaren Gebäude. Getroffen wird das nächste
     brennbare Gebäude im Radius 2 (Gleichstand: kleinste Id). Liegt keines in diesem Radius, entsteht kein Schaden.
     Die Kachelziehung verhindert, dass sich ein Brand mit Ködergebäuden umlenken lässt.
   - **Brennbar:** Gesteuert über das Flag `flammable` in `defs/buildings.ts`. Brennbar sind Produktionsbetriebe,
     Kapelle und Schule. Nicht brennbar sind Kontor, Markt, Wege, Wohnhäuser und die Feuerwache.
   - **Geschützt:** Liegt das Ziel im Radius einer angebundenen Feuerwache, wird der Brand gelöscht. Es entsteht
     kein Schaden, das Ereignis-Log zeigt „Brand gelöscht".
   - **Ungeschützt:**
     - Die Instandsetzungsgebühr (`cost.money` des Gebäudes) wird **sofort** abgebucht, auch wenn das Geld dadurch
       negativ wird. So bringt ein Abriss während des Brands keinen Vorteil.
     - Das Gebäude ist danach `FIRE_OUTAGE` Ticks (vorläufig 200) ausser Betrieb, im neuen Zustand `burning`.
       In dieser Zeit produziert es nicht und liefert keinen Dienst. Der Zyklusfortschritt und ein bereits
       entnommener Input sind verloren.
   - **Feuerwache** (`firestation`): 1×1 (laut `m6-werte.md`), `cost(150, 10, 2, 0)`, Unterhalt 10, Radius 8, muss angebunden sein.
     Hotkey E ist noch frei. Radiusanzeige wie bei Kapelle und Schule (M5 A3).
4. **Sturm:**
   - Der Sturm wird beim Periodenstart angekündigt (Vorwarnkarte).
   - Er beginnt `STORM_WARNING` Ticks später (vorläufig 200) und dauert `STORM_DURATION` Ticks (vorläufig 300).
   - Betroffen sind die Betriebe mit dem Flag `stormAffected`: Fischer, Holzfäller, Schäferei und Zuckerrohr.
   - Deren Fortschritt zählt nur jeden zweiten Tick (ganzzahlig, Faktor 0.5).
5. **Boom:**
   - Das Gut kommt aus dem Pool der Aufträge (nach Höchststufe).
   - Sein Verkaufspreis steigt um `BOOM_FACTOR` (vorläufig 1.5) für `BOOM_DURATION` Ticks (vorläufig 300).
   - Die Sättigung wirkt weiter.
   - Invariante (als Test): `BOOM_FACTOR × sell < buy` für jedes Gut.
6. **Ereignis-Log:**
   - Die UI zeigt die letzten 10 Einträge. Das Log gehört nicht zum Spielstand.
   - Die Sim stellt den Zustand der laufenden Krise bereit (`world.crisis`: Periode, Art, Start und Ende, Ziel oder Gut).
7. **Save v3:** Neu im Spielstand sind `crisisLevel`, `crisis`, der Zustand `burning` und ein Ende-Tick je
   Gebäude. Die Migration v2 → v3 bekommt einen Test mit einem v2-Fixture.
8. **Balancing:**
   - `balance.test.ts` bleibt unverändert (Stufe `off`).
   - Eine neue Testdatei lässt den Controller mit `normal` und `mild` laufen, mit Sieg ≤ 9000 und `money > 0`.
     Die Baseline wird im Umsetzungspaket gemessen und als Ruling festgehalten.
9. **Ambiente:**
   - Render (lead-art): Flammen und Rauch am brennenden Gebäude, Sturmtönung und stärkere Wellen,
     ein Münzsymbol am Kontor im Boom, eine Silhouette für die Feuerwache.
   - Ton (lead-art): Alarm, Sturmwarnung, Boom.

## 3. Auflage R72: echte Abwägung je Krise

Die Ausarbeitung übernimmt die Abwägungstabellen aus `m6-werte.md`:

- **Brand:** Lohnt sich die Feuerwache? Das hängt vom Stadium der Kolonie und vom Layout ab. Break-even liegt bei
  einem mittleren Schaden von etwa 120, also etwa ab der Stoffkette.
- **Sturm × Auftrag × Boom:** Vor der Ankündigung ist das eine Erwartungswertrechnung. Liefern oder verkaufen bringt
  einen sicheren Ertrag. Halten bringt nur etwas, wenn ein Sturm kommt, gewichtet mit seiner Wahrscheinlichkeit.
  Im Sturm zuzukaufen kostet den festen Kaufpreis. Nach der Ankündigung darf „halten" dominieren, und die Spec sagt
  das offen.
- **Boom:** Im Boom verkaufen oder den Puffer halten.
- **Krisenhäufigkeit:** Sie ist Einstellung (`off`, `mild`, `normal`) und Playtest-Frage zugleich.

## 4. Nicht in M6

- Krankheit und Heilerhaus: Sie rechnen sich identisch zum Brand und wären redundant.
- Feuerausbreitung, brennende Wohnhäuser, Löschen per Klick, Versicherung.
- Terrainänderung durch Krisen.
- Wechsel der Krisenstufe im laufenden Spiel.
- Krisen an Schiffen.
- 4. Stufe (Kandidat M7), zweite Insel (Backlog).
- Keine neue Abhängigkeit, keine fremden Assets.

## 5. Offen für die Ausarbeitung

- Abnahmekriterien je Paket (Vitest-Szenarien mit exakten Sollzahlen, Browser-Checks nach R65).
- Pakete und Datei-Ownership: Sim, UI, Render und Audio parallel wie in M5.
- Kann-Posten: Restbefunde mobil aus M5 (HUD-Höhe, Info-Panel bei 390 px, 34-px-Tippziele).
- Änderungen gegenüber Hauptspec, arc42 (§8, Tick-Reihenfolge) und ADR-005/ADR-010.
