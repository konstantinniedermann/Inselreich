# I-186 · Ehrenbuch (Meisterstücke über alle Partien) (Kurzdesign, Stufe voll)

Stand 2026-10-23 · Paket `design-I-186` · Prozessstufe voll (neue Schwellenwerte) · Auftrag R862 (länger am Ball),
Rangliste TIEFE-1 Rang 1. Grundlage: [I-186 in `docs/ideen.md`](../../ideen.md), Recherche
[`docs/recherche/2026-10-23-tiefe-1.md`](../../recherche/2026-10-23-tiefe-1.md) R1 1.3–1.5 (Frostpunk: Erfolge je
Schwierigkeit; Dorfromantik und Islanders: Freischaltung trägt das Wiederspiel, Kritik «ein Gesamtziel fehlt»; Q9–Q14).
Keine Nachrecherche nötig. Übernommen ist nur die Mechanik «dauerhafte Liste von Prüfungen je Schwierigkeit», keine
Namen oder Inhalte (ADR-006). Plan: `docs/superpowers/plans/2026-10-23-i186-ehrenbuch.md`. Gate Spec: BEDENKEN (`lead-qa`), Nachtrag N1–N6
eingearbeitet, N7–N9 für den Plan (§11). L0 hat D1 a, D2 und D3 angenommen (§10).

## 1 Spielerzweck (ein Satz)

Der Spieler sieht im Menü, welche Meisterstücke ihm über alle Partien noch fehlen, und beginnt die nächste Insel bewusst
anders: mit Krisen «normal», im Eiltempo oder mit Meisterprüfung. Lohn ist nur der Eintrag im Ehrenbuch.

- **Säulen:** Bevölkerung versorgen und aufsteigen lassen (die Ziele bekommen eine zweite, härtere Lesart) sowie Insel
  besiedeln (Kontore auf allen Fremdinseln). Leidet etwas, wenn es misslingt? Nein. Das Buch liest nur und ändert keinen
  Spielwert. Schlimmstenfalls bleibt es unbeachtet.
- **Spürbar in den ersten 15 Minuten:** Schon beim ersten «Neue Insel» steht unter den Auswahlfeldern «Ehrenbuch: 0 von
  9 Meisterstücken». Die Karte zeigt offene Stücke mit Bedingung, etwa «Sturmfest: Handelsstadt mit Krisen normal». Das
  erste Stück («Bürgerstadt») fällt in Partie 1 mit Ziel 1, also nach etwa 15 bis 25 Minuten, und trägt sich mit einer
  Meldung ein.
- **Echte Wahl:** Die Krisenstufe, die Freischaltung und der Start der Meisterprüfung werden zur Entscheidung mit Preis.
  Wer «Sturmfest» will, spielt mit Krisen. Wer «Flinke Gründung» will, verzichtet auf Komfortbauten vor Ziel 1. Kein
  Stück ist in jeder Partie zugleich mitzunehmen: Tempo-Stücke und Sturm-Stücke ziehen gegeneinander, weil Krisen
  bremsen (§3, Spannungen).
- **Warum nicht Geld oder Startbonus:** Geld ist ab Minute 15 kein Engpass (R722). Meta-Boni über Partien sind
  ausgeschlossen (TIEFE-1 T6, I-134 geparkt). Sie würden die Vergleichbarkeit der Proben (I-190) brechen.

## 2 Regeln

### 2.1 Was ein Meisterstück ist

Ein Meisterstück ist eine Def mit Kennung, Name, Bedingungstext und Prüfung. Die Prüfung ist eine **reine Funktion über
zwei Weltzustände** (vorher, jetzt) und den Partie-Rahmen (§2.3). Sie meldet ein Stück genau dann, wenn sein
**Auslöse-Ereignis** in diesem Schritt eintritt, also wenn ein Merkmal von «nein» auf «ja» wechselt. Ein Zustand, der
schon beim Start oder Laden galt, löst nichts aus. Das Muster entspricht den Zielbannern
(`initialGoalShown`, `src/ui/goal.ts`).

- Ein Stück wird **einmal im Leben des Buchs** eingetragen. Der erste Eintrag bleibt. Ein späteres Erreichen in einer
  anderen Partie ändert nichts und zeigt keine Meldung.
- **Schnappschuss statt Weltkopie:** `honorMarks(world)` liest nur die auslösenden Merkmale: `won`, `wonMerchants`,
  `wonSpice`, `monumentDone`, die Zahl der Inseln mit Kontor und die Kennungen in `trial.passed`. Die Prüfung
  `newHonors(prev, world, run)` vergleicht diesen Schnappschuss mit der Welt. Kosten O(Inseln + Auflagen), keine Kopie.
- **Tracker (N1):** Den Vorher-Zustand hält ein DOM-freier Tracker in `src/ui/` (ohne DOM, ohne `localStorage`; Name im
  Plan). `reset(world)` setzt den Schnappschuss auf die Welt. `observe(world, run)` liefert die neuen Stücke und rückt den
  Schnappschuss nach. `reset` läuft an drei Stellen: Seitenstart (neben `initialGoalShown`, `app.ts:345`), Laden eines
  Speicherplatzes (`loadSlotPaused`, `app.ts:486`) und «Neue Insel». Ein geladener Stand mit erreichtem Ziel löst so
  nichts aus. Ein Wechsel nach dem Laden löst genau einmal aus.
- **Je Schritt, nicht je Frame (N2):** Bei höherem Tempo rechnet die Spielschleife mehrere Schritte je Frame
  (`app.ts:1660`, `while (acc >= TICK_MS && ticks < MAX_TICKS_PER_FRAME) step(world)`). `observe` steht **in** dieser
  Schleife direkt nach jedem `step`, nicht danach. So ist der Tick des Eintrags der Tick des Wechsels. Die Meldung darf
  gesammelt nach der Schleife erscheinen. Die Sim ruft nichts davon auf. Welt, Save und Baseline bleiben bitgleich.
- **Spielzeit** heisst `world.tick` (10 Ticks = 1 s bei 1×, `TICK_MS = 100`). Tempo und Pause ändern die Spielzeit nicht.
  Planen in der Pause ist erlaubt.

### 2.2 Die Meisterstücke (9; 8 feste und eines je Auflage)

Krisenstufen im Spiel sind `off` «aus», `mild` und `normal`. «normal» ist die härteste Stufe. Die Skizze nennt sie
«Krisen hoch», im Spiel heisst sie «normal» (`src/sim/defs/crises.ts`). Merkmale nur aus dem heutigen `World` (v18).

| ID            | Name                  | Bedingung (Text auf der Karte)                          | Auslöse-Ereignis (prüfbar)                                                               | Rahmen          |
| ------------- | --------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------- |
| `citizenTown` | Bürgerstadt           | Erstes Ziel erreichen                                   | `won` wechselt auf `true`                                                                | –               |
| `swiftFound`  | Flinke Gründung       | Erstes Ziel bis Spielzeit 15:00                         | `won` wechselt auf `true` und `tick ≤ HONOR_SWIFT_CITIZEN_TICK` (9000)                   | nur stufenweise |
| `swiftTrade`  | Kaufmannseile         | Handelsstadt bis Spielzeit 30:00                        | `wonMerchants` wechselt auf `true` und `tick ≤ HONOR_SWIFT_MERCHANT_TICK` (18 000)       | nur stufenweise |
| `stormTrade`  | Sturmfest             | Handelsstadt mit Krisen «normal»                        | `wonMerchants` wechselt auf `true` und `crisisLevel === 'normal'`                        | –               |
| `spiceTown`   | Gewürzstadt           | Drittes Ziel erreichen                                  | `wonSpice` wechselt auf `true`                                                           | –               |
| `realm`       | Inselreich            | Auf jeder Fremdinsel ein Kontor                         | Zahl der Inseln mit `kontorId !== null` erreicht `islands.length` (heute 4 = Heimat + 3) | –               |
| `monument`    | Denkmal               | Das Denkmal vollenden                                   | `monumentDone` wechselt auf `true`                                                       | –               |
| `stormTrial`  | Meister im Sturm      | Eine Meisterprüfung mit Krisen «normal» bestehen        | `trial.passed` wird länger und `crisisLevel === 'normal'`                                | –               |
| `trial:<id>`  | Meisterprüfung «Name» | Die Auflage «Name» bestehen (je Eintrag in `TRIAL_IDS`) | `trial.passed` bekommt einen Eintrag mit `id`                                            | –               |

- Heute gibt es eine Auflage (`selfSupply`, «Eigenversorgung», I-132), also 9 Stücke. Bringt AUFLAGEN-KERN die Auflage
  `export` «Ausfuhrmeister», entsteht ohne weitere Arbeit ein zehntes Stück. Die Zahl auf der Karte ist immer
  `8 + TRIAL_IDS.length`.
- **Neue Spielwerte** (in `src/sim/defs/honors.ts`, Änderung nur per Ruling): `HONOR_SWIFT_CITIZEN_TICK = 9000` und
  `HONOR_SWIFT_MERCHANT_TICK = 18000`. Herleitung aus gepinnten Sieg-Ticks (Seed 3, stufenweise):
  - Ziel 1: Tick 6050 (`M6:AK-B1-01`, Balancing-Controller) und 6750 (`M11:AK-BAS-02`, Kaufleute-Controller,
    `tests/sim/balance-merchants.test.ts:81`).
  - Ziel 2: Tick **11 500**, gemessen und gepinnt in `M11:AK-BAS-02`; die Grenze `MERCHANT_TICK_LIMIT` ist 12 000.
  - Die Schwellen liegen beim 1,33-Fachen (9000 ÷ 6750) und 1,57-Fachen (18 000 ÷ 11 500) des Skripts. Das Skript plant
    fehlerfrei und kauft zu. Ziel 2 bekommt mehr Spielraum, weil sich Fehler über die längere Strecke summieren. Das soll
    ein Meisterstück sein, kein Nebenbei. Erreichbarkeit: AK-EB-05.
  - **Risiko R-EB-1 (N3):** Beide Messungen stammen aus einem Seed und einem Skript je Ziel. Ein zweiter Seed fehlt,
    eigene Läufe waren nicht beauftragt. Rückfallwerte: `HONOR_SWIFT_CITIZEN_TICK = 10800` (1,6 × 6750) und
    `HONOR_SWIFT_MERCHANT_TICK = 21000` (≈ 1,8 × 11 500). **Nachjustier-Regel:** Nach mindestens drei beobachteten
    Partien mit dem jeweiligen Ziel (Playtest, Beobachtung, kein Gate) gilt: Holt keine das Tempo-Stück, gilt per Ruling
    der Rückfallwert. Holt eine Erstpartie es ohne Absicht, sinkt die Schwelle um 1500 Ticks, höchstens bis zum
    1,2-Fachen des Skripts. Geändert wird nur in den Defs.
- **Nicht aufgenommen** (geprüft, verworfen):
  - «Partie ohne jeden Zukauf»: Die Welt zählt keine Käufe. Das bräuchte einen Sim-Zähler und einen Save-Sprung. Die
    Meisterprüfung «Eigenversorgung» deckt die Wahl schon ab.
  - «Alle Ratsbeschlüsse»: Ein Klick je Hausstufe ist keine Wahl.
  - «Stammkunde gewonnen»: fällt im normalen Spiel nebenbei.
  - Ein Stück «alle Stücke»: Sammeln um des Sammelns willen.

### 2.3 Partie-Rahmen (Freischaltung)

Die Freischaltung («stufenweise» oder «alles frei») steht nicht in der Welt. `createWorld` legt mit `unlockAll` nur
`unlocked` fest, und später ist der Stand nicht mehr zu unterscheiden. «Alles frei» erlaubt Vorbauen und verkürzt so die
Tempo-Stücke. Darum gelten die beiden Tempo-Stücke nur für Partien mit stufenweiser Freischaltung.

- **Empfehlung (D1 a):** Das Buch führt einen **Partie-Merker** `run: { seed, unlockMode }`. «Neue Insel» setzt ihn.
  Laden ändert ihn nicht. Ein Tempo-Stück zählt nur, wenn `run.seed === world.seed` und `run.unlockMode === 'stepwise'`
  gelten. Ein geladener Stand einer anderen Partie, etwa aus dem zweiten Speicherplatz, kann Tempo-Stücke in dieser
  Sitzung nicht holen. Die Karte sagt dann «Tempo-Stücke zählen in dieser Partie nicht (Freischaltung unbekannt)». Alle
  anderen Stücke gelten in jedem Modus.
- **Herkunft von `run` im Tracker:** «Neue Insel» setzt den neuen Merker im Speicher und im Tracker. Seitenstart und
  Laden lesen ihn aus dem Speicher.
- **Restlücke RL-1 (N4):** Der Seed ist `Date.now() % 100000` (`app.ts:331`). Ein alter Stand aus «alles frei» mit
  zufällig gleichem Seed wie der Merker zählt als stufenweise. Das ist ≈ 1 : 100 000 je Paar und wird bewusst
  hingenommen. AK-EB-04 hält dieses Verhalten fest.
- **Zwei Fenster:** «Neue Insel» in Fenster B überschreibt `run` im Speicher. Fenster A behält seinen Merker im Tracker
  und zählt weiter richtig. Erst nach Neuladen oder Laden gilt in A der Merker von B. Tempo-Stücke zählen dann nicht, und
  der Hinweis «Freischaltung unbekannt» erscheint. Der Fehler geht also nur zur sicheren Seite.
- Für «Krisen aus» braucht es keinen Merker: `crisisLevel` steht in der Welt und ist je Partie fest. Nur die Sturm-Stücke
  verlangen «normal».

### 2.4 Ablage (getrennt vom Spielstand)

- Eigener Schlüssel `inselreich.ehrenbuch` im `localStorage`, neben `inselreich.settings` und den zwei Speicherplätzen
  (`src/ui/storage.ts:5-6`). **Der Welt-Save bleibt v18.** Die Welt bleibt ein JSON-Objekt ohne Buchdaten (ADR-002).
- Format v1:
  `{ "v": 1, "earned": { "<id>": { "at": "<ISO-8601 mit ms>", "seed": <Zahl>, "tick": <Zahl>, "crisis": "off|mild|normal" } }, "run": { "seed": <Zahl>, "unlockMode": "stepwise|all" } | null }`.
  `at` stammt aus der UI (`new Date().toISOString()`), nie aus der Sim. Die Karte zeigt nur das Datum.
- **Lesen nie mit Absturz:**
  - Fehlender Schlüssel ergibt ein leeres Buch.
  - Kaputtes JSON, kein Objekt, fehlendes `v` oder `earned` kein einfaches Objekt (`null`, Array, Zahl) ergibt ein
    leeres Buch. Der Hinweis lautet «Ehrenbuch war unlesbar und beginnt neu». Der **erste Schreibvorgang jeder Art**
    ersetzt den Inhalt, also auch das Setzen von `run` bei «Neue Insel» (N5 d). Davor wird der unlesbare Text einmal
    unter `inselreich.ehrenbuch.defekt` abgelegt (überschreibt eine ältere Kopie).
  - Eine **höhere Version** (`v > 1`, z. B. nach Rückkehr zu einem älteren Build) ergibt ein **schreibgeschütztes**
    Buch. Es wird gezeigt, so weit lesbar, und nie überschrieben. Die Meldung lautet «Ehrenbuch aus neuerer Fassung, wird
    nicht verändert». Neue Stücke werden in der Sitzung trotzdem erkannt und gemeldet, mit dem Zusatz «nicht
    gespeichert». Die Karte zeigt sie als «in dieser Sitzung». Geschrieben wird nie, auch nicht `run` (N5 c).
  - Ungültiges `run` (kein Objekt, Seed keine ganze Zahl ≥ 0, Modus unbekannt) wird `null`. Das Buch bleibt sonst
    gültig, ohne Hinweis (N5 a).
  - Einträge werden in eine `Map` gelesen, nie per Zuweisung in ein Objekt. Eine Kennung gilt nur nach dem Muster
    `^[a-z][A-Za-z]*(:[a-z][A-Za-z]*)?$` und nicht als `constructor` oder `prototype`. `__proto__` fällt schon durch das
    Muster. Andere Kennungen werden verworfen (N5 b).
  - Ein ungültiger Einzeleintrag wird verworfen, der Rest bleibt.
  - Unbekannte Kennungen bleiben beim Schreiben erhalten. Sie werden nicht angezeigt und nicht gezählt, so bleibt das
    Format vorwärts verträglich.
- **Gesperrter Speicher** (privates Fenster, Quota): Das Buch lebt nur in der Sitzung. Die Karte zeigt «Ehrenbuch wird
  nicht gespeichert», wie `storageNote` beim Spielstand. Das Spiel läuft weiter.

## 3 Dynamik, Randfälle, Entartung

- **Spannungen (gewollt):** Sturm-Stücke und Tempo-Stücke ziehen gegeneinander, weil Krisen bremsen. «Meister im Sturm»
  verlangt Meisterprüfung und Krisen zugleich. Das ist das schwerste Stück, aber kein Pflichtweg. Es gibt keinen
  Wachstumsmotor: Das Buch gibt nichts in die Welt zurück.
- **Laden kurz vor dem Ziel** (Stück mehrfach holen): harmlos, das Stück ist einmalig. Das Laden eines Stands **nach** dem
  Ziel löst nichts aus, weil die Prüfung den Wechsel sucht (§2.1).
- **Neue Insel, Laden, Seitenstart:** Der Tracker setzt den Vorher-Zustand neu (`reset`, §2.1). Es gibt keinen Wechsel
  über Partiegrenzen.
- **Mehrere Stücke in einem Schritt** (z. B. `won` mit Tempo): Alle werden eingetragen, in Tabellenreihenfolge. Die
  Meldung fasst sie zusammen: «Meisterstücke: Bürgerstadt, Flinke Gründung».
- **Fremdinsel ohne Kontor bleibt möglich:** «Inselreich» ist freiwillig. Abriss eines Kontors nach dem Eintrag löscht
  nichts.
- **Zielmerkmal schon beim Laden gesetzt, Auflage danach bestanden:** «Meister im Sturm» zählt, weil sein Ereignis die
  Auflage ist, nicht das Ziel.
- **Zwei Browserfenster:** Der zuletzt geschriebene Stand gewinnt. Vor jedem Schreiben wird neu gelesen und
  zusammengeführt. Die Kennungen werden vereinigt, je Kennung gilt das kleinere `at`. Bei Gleichstand bleibt der Eintrag
  aus dem Speicher (N5 e). `run` bleibt wie im Speicher, ausser die Aktion ist «Neue Insel». Ein Stück geht so nicht
  verloren.
- **Gerät wechseln, Browserdaten löschen:** Das Buch ist weg. Das ist bewusst so (Nicht-Ziel: kein Export, §6).

## 4 Anzeige

- **Meldung beim Eintrag:** Die bestehende Meldungsleiste (wie die Zielbanner) zeigt einmal «Meisterstück: Sturmfest — ins
  Ehrenbuch eingetragen». Es gibt kein eigenes Modal und keinen Ton (Ton als Andockstelle für `lead-art`, kein Muss).
- **Menü-Karte, Bereich «Neue Insel»:** Eine Zeile «Ehrenbuch: 3 von 9 Meisterstücken» mit Knopf «Ehrenbuch». Steht dort,
  weil die Wahl von Krise und Freischaltung genau hier fällt.
- **Karte «Ehrenbuch»** (Modal wie Menü und Hilfe, Esc schliesst, Fokus zurück):
  - Liste in Tabellenreihenfolge. Erreichte Stücke zeigen Name, Datum, «Karte N», Krisenstufe und Spielzeit `mm:ss`.
    Offene Stücke zeigen Name und Bedingungstext, gedämpft.
  - Kopf «3 von 9».
  - Hinweiszeilen aus §2.3 und §2.4, wenn sie gelten.
  - Nach Desktop-first (≥ 1280 px). Schmale Fenster: scrollbar, stürzt nicht ab.
- **Hilfe und README:** Ein Absatz «Ehrenbuch». Er nennt die 9 Stücke und sagt: kein Spielvorteil, nur auf diesem Gerät.

## 5 Abnahmekriterien

Vitest gegen die reinen Funktionen: Prüfung in `src/sim/`, Tracker und Ablage-Parser als DOM-freie Helfer in `src/ui/`.
Dazu ein Browser-Check und ein Review-Kriterium. Die Kennungen `AK-EB-nn` sind eindeutig (N6, R417).

1. **AK-EB-01 Defs:** `HONOR_IDS` enthält die 8 festen Kennungen in Tabellenreihenfolge (§2.2) und je `TRIAL_IDS`-Eintrag
   `trial:<id>`. Heute ist die Länge 9. Die Schwellen 9000 und 18 000 stehen nur in `src/sim/defs/honors.ts`, keine
   Literale im Prüfcode (Prüfweg: §11 N9).
2. **AK-EB-02 Wechsel statt Zustand:** Je Stück: vorher «nein», jetzt «ja» ergibt das Stück. «ja»→«ja» und «nein»→«nein»
   ergeben es nicht. Je Stück ein Testfall mit präparierter Welt.
3. **AK-EB-03 Schwellen auf den Tick:** `won` wechselt bei Tick 9000 → `swiftFound`, bei Tick 9001 → nicht. Gleich für
   `swiftTrade` mit 18 000 und 18 001 (Tick-Bezug: §11 N7).
4. **AK-EB-04 Rahmen:** Tempo-Stücke fehlen bei `run.unlockMode === 'all'`, bei `run === null` und bei
   `run.seed !== world.seed`. Alle anderen Stücke sind davon unberührt. Sturm-Stücke fehlen bei `crisisLevel` `off` und
   `mild`. RL-1: Eine Welt aus `createWorld(S, { unlockAll: true })` mit `run = { seed: S, unlockMode: 'stepwise' }`
   ergibt `swiftFound`. Das ist dokumentiertes Verhalten.
5. **AK-EB-05 Erreichbarkeit:** Im bestehenden Lauf `M11:AK-BAS-02` gilt `winTick ≤ HONOR_SWIFT_CITIZEN_TICK` und
   `wonMerchantsTick ≤ HONOR_SWIFT_MERCHANT_TICK`. Das sind zwei zusätzliche Erwartungen, keine neue Simulation.
6. **AK-EB-06 Bitgleich:** `tests/sim/balance.test.ts` und alle Baseline-Pins bleiben unverändert grün. `World.version`
   bleibt 18. `serialize(world)` ist gleich, ob über 1000 Schritte `observe` mitläuft oder nicht.
7. **AK-EB-07 Ablage lesen:** Keiner der folgenden Fälle wirft.
   - Fehlend → leer.
   - Kaputtes JSON, `earned: null` und `earned: []` → leer, Hinweis, Kopie unter `inselreich.ehrenbuch.defekt`.
   - Danach ersetzt das Setzen von `run` den Inhalt.
   - `v: 2` → schreibgeschützt: Schreiben und `run` sind No-ops, ein neues Stück wird gemeldet, aber nicht gespeichert.
   - Ungültiges `run` → `null`, Einträge bleiben.
   - Kennungen `__proto__`, `constructor` und `a b` → verworfen, `Object.prototype` unverändert.
   - Ungültiger Einzeleintrag → verworfen, Rest bleibt.
   - Unbekannte gültige Kennung → beim Schreiben erhalten, nicht gezählt.
8. **AK-EB-08 Einmalig und Zusammenführen:**
   - Ein schon eingetragenes Stück ändert beim zweiten Erreichen nichts, auch `at` nicht.
   - Das Zusammenführen ergibt die Vereinigung, je Kennung das kleinere `at`. Bei gleichem `at` bleibt der Eintrag aus
     dem Speicher.
   - `run` bleibt beim Zusammenführen wie im Speicher, ausser bei «Neue Insel».
9. **AK-EB-09 Tracker (N1):**
   - `reset` auf eine Welt mit `won`, `wonMerchants`, `wonSpice`, `monumentDone`, allen Kontoren und bestandener Auflage,
     dann ein Schritt und `observe` → keine Stücke.
   - `reset` auf eine Welt kurz vor Ziel 1, dann Wechsel von `won` → genau einmal `citizenTown` (mit passendem `run` auch
     `swiftFound`). Ein zweites `observe` ohne Wechsel → nichts.
   - `reset` auf eine frische Welt nach «Neue Insel» → nichts.
10. **AK-EB-10 Je Schritt (N2):** Ein Test bildet die Schleife nach: 8 Schritte in einem «Frame», je `step` gefolgt von
    `observe`. `won` wechselt in Schritt 3, der Eintrag trägt den Tick nach Schritt 3, nicht den nach Schritt 8.
    Review-Kriterium (`qa-code-reviewer`): `observe` steht in `app.ts` innerhalb der `while`-Schleife direkt nach `step`.
11. **AK-EB-11 Browser-Check (`qa-playtester`):**
    - Neue Insel: Die Menüzeile zeigt «0 von 9».
    - Mit einem Stand kurz vor Ziel 1 (Fixture: §11 N8) erscheint die Meldung «Meisterstück: Bürgerstadt».
    - Die Karte zeigt den Eintrag mit Datum, Karte und Spielzeit.
    - Nach Neuladen der Seite ist der Eintrag noch da.
    - **Ein Stand nach Ziel 1 wird geladen und läuft 30 s auf 4×: keine Meldung, Zähler unverändert.**
    - Bei gesperrtem Speicher erscheint der Hinweis und kein Konsolenfehler.
    - Screenshots unter `.studio/qa/<paket>/`.

## 6 Nicht-Ziele

- Kein Spielwert, kein Startbonus, kein Freischalten von Gebäuden, Karten oder Kosmetik über Partien.
- Kein Welt-Save-Sprung, keine Änderung an `step`, kein Einfluss auf den Balancing-Test.
- Kein Export oder Import, keine Cloud, kein Teilen, keine Bestenliste. Das Teilen von Ergebnissen gehört zu I-190.
- Kein Zurücksetzen des Buchs in v1. Browserdaten löschen genügt. Ein Knopf kann später kommen, wenn ihn ein Playtest
  verlangt.
- Keine Fortschrittsbalken für offene Stücke («6:12 bis zur Schwelle»). Das Buch zeigt nur Bedingungen.
- Keine Stücke über die Erweiterung 1 (Reeder, Werft, Ziel 4). Die kommen mit ihr als neue Defs.

## 7 Schnittstelle «Modus Inselproben» (offen, nicht festgelegt)

Das Brainstorming «Modus Inselproben» (I-190, I-191, I-192) läuft parallel. Die Andockstellen hier sind nur angeboten:

- **A1 Bestzeiten im selben Speicher:** Das Buchformat kann einen Abschnitt `records: { "<probeId>": [ticks…] }` bekommen
  (Buch v2). Das Format liegt dann weiter ausserhalb der Welt. Ein Build mit Leser v1 behandelt ein v2-Buch als
  schreibgeschützt (§2.4). Der Leser v2 muss also ein v1-Buch heben können.
- **A2 Probe-Stücke als Defs:** «Probe n bestanden» als weitere Stücke mit Rahmen `probe === n`. Der Partie-Merker
  (§2.3) würde dann um `probe` erweitert. Das ist eine Alternative zu einem Weltfeld `probe`.
- **A3 Rahmen aus der Welt:** Bekommt die Welt mit den Inselproben ohnehin v19 und einen Partie-Rahmen (`setup`), kann
  `unlockMode` dorthin wandern. Dann entfällt der Partie-Merker. Für v1 des Ehrenbuchs nicht nötig.

Wer was entscheidet: Das Inselproben-Brainstorming wählt A1, A2 und A3. Dieses Kurzdesign bindet nichts davon.

## 8 Aufwand und Schnitt (Vorschlag für `lead-tech`)

- **Häppchen 1 Sim, ≈ 40 Tools:** `src/sim/defs/honors.ts` (Kennungen, Namen, Texte, zwei Schwellen) und
  `src/sim/honors.ts` (reine Prüfung `newHonors(prev, cur, run)`, DOM-frei). Tests AK-EB-01 bis AK-EB-06.
- **Häppchen 2 UI, ≈ 90 Tools:** Tracker, Ablage-Helfer (Parser, Zusammenführen, Schreibschutz, Defekt-Kopie), Aufruf
  je `step` in `app.ts`, Meldung, Menüzeile, Karte, Hilfe und README. Tests AK-EB-07 bis AK-EB-10, Browser-Check
  AK-EB-11.
- Gesamt ≈ 130 Tools, ein Worktree, zwei Häppchen hintereinander, je mit `qa-code-reviewer`, dazu ein `qa-playtester` und
  das Final-Review auf `opus`. Kein Save, kein Baseline-Pin. Neue Spielwerte gibt es nur als Schwellen, die nicht in die
  Sim wirken.

## 9 Selbstprüfung Gate Brainstorming (`lead-design`)

1. **Säulen:** Bevölkerung (Ziele mit zweiter Lesart) und Besiedeln (Inselreich). Misslingt es, leidet nichts. Urteil OK.
2. **Ein Satz, in 15 Minuten spürbar:** ja (§1). Der Zähler im Menü ist ab dem ersten Start sichtbar, das erste Stück
   fällt mit Ziel 1. Ziel 1 liegt für Einsteiger bei 15 bis 25 Minuten. Das Buch wird also in Minute 1 sichtbar,
   aber erst nach Ziel 1 gefüllt. Urteil OK.
3. **Scope:** begrenzt (§6), zwei Häppchen, kein Save. Urteil OK.
4. **Nur Mechanik:** Erfolge je Schwierigkeit sind Genre-Mechanik. Namen und Texte sind eigen. Urteil OK.
5. **Echte Wahl, keine Dominanz:** Tempo gegen Sturm, Auflage gegen Komfort. Kein Stück schaltet ein anderes frei.
   **BEDENKEN (klein):** Die Schwellen stützen sich auf einen Seed, ohne menschlichen Playtest. Das ist als Risiko
   R-EB-1 mit Rückfallwert und Nachjustier-Regel festgehalten (§2.2) und über die Defs rückbaubar.
6. **Einfachere Variante:** Ohne Partie-Merker gälten Tempo-Stücke auch bei «alles frei». Das wäre einfacher, aber
   unfair; von L0 verworfen (D1 b).

Gesamturteil: **OK mit einem kleinen BEDENKEN** (Schwellen ohne Playtest).

## 10 Entscheide (L0, Gate Spec)

- **D1 a angenommen:** Partie-Merker im Buch (§2.3), kein Save-Sprung. Verworfen: b) Tempo-Stücke in jedem Modus, c)
  Weltfeld `setup.unlockMode` mit v19.
- **D2 angenommen:** Schwellen 9000 und 18 000 Ticks, rückbaubar über die Defs. Risiko und Regel: R-EB-1 (§2.2).
- **D3 angenommen:** 9 Stücke, wachsend mit `TRIAL_IDS`.

## 11 Für den Plan (Gate-Befunde N7–N9, `lead-tech`)

- **N7 Tick-Bezug:** `observe` liest `world.tick` nach dem Schritt (`step` erhöht den Tick zuerst). Die Grenzfälle
  9000/9001 in AK-EB-03 beziehen sich auf diesen Wert. Der Plan schreibt das fest.
- **N8 Fixture und Ausgabe:** Der Browser-Check braucht einen benannten, reproduzierbaren Weg zu einem Stand kurz vor und
  einem Stand nach Ziel 1, etwa einen Dev-Parameter oder einen Speicherplatz-Fixture. Die Karte gibt Datum, Seed und
  Namen nur per `textContent` aus, nie per `innerHTML`.
- **N9 Literale:** Die Prüfung «keine Schwellen-Literale im Prüfcode» läuft als Vitest, der den Quelltext von
  `src/sim/honors.ts` liest, nicht als loser `rg`-Befehl.
