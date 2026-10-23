# I-186 · Ehrenbuch (Meisterstücke über alle Partien) (Kurzdesign, Stufe voll)

Stand 2026-10-23 · Paket `design-I-186` · Prozessstufe voll (neue Schwellenwerte) · Auftrag R862 (länger am Ball),
Rangliste TIEFE-1 Rang 1. Grundlage: [I-186 in `docs/ideen.md`](../../ideen.md), Recherche
[`docs/recherche/2026-10-23-tiefe-1.md`](../../recherche/2026-10-23-tiefe-1.md) R1 1.3–1.5 (Frostpunk: Erfolge je
Schwierigkeit; Dorfromantik und Islanders: Freischaltung trägt das Wiederspiel, Kritik «ein Gesamtziel fehlt»; Q9–Q14).
Keine Nachrecherche nötig. Übernommen ist nur die Mechanik «dauerhafte Liste von Prüfungen je Schwierigkeit», keine
Namen oder Inhalte (ADR-006). Plan: offen (`lead-tech`).

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
- Die Prüfung läuft **nach jedem Sim-Schritt** (`step`), nicht je Frame. So stimmt der Tick des Eintrags bei jedem
  Tempo. Sie liest nur. Die Sim (`step`) ruft sie nicht auf. Welt, Save und Baseline bleiben bitgleich.
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
  `HONOR_SWIFT_MERCHANT_TICK = 18000`. Herleitung: Der Balancing-Controller erreicht Ziel 1 bei Tick 6050 (AK-B1-01) bzw.
  6750 (I-144-Rechnung §1.1). Der Kaufleute-Controller muss Ziel 2 bis Tick 12 000 schaffen (Spec 16.3,
  `MERCHANT_TICK_LIMIT`). Die Schwellen liegen beim 1,3- bis 1,5-Fachen des Skripts. Das Skript plant ohne Fehler und kauft
  zu. Ein Mensch braucht Planung und Verzicht, in der Pause bleibt er aber frei. Das soll ein Meisterstück sein, kein
  Nebenbei. Prüfung der Erreichbarkeit: AK-H5.
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
- Für «Krisen aus» braucht es keinen Merker: `crisisLevel` steht in der Welt und ist je Partie fest. Nur die Sturm-Stücke
  verlangen «normal».

### 2.4 Ablage (getrennt vom Spielstand)

- Eigener Schlüssel `inselreich.ehrenbuch` im `localStorage`, neben `inselreich.settings` und den zwei Speicherplätzen
  (`src/ui/storage.ts:5-6`). **Der Welt-Save bleibt v18.** Die Welt bleibt ein JSON-Objekt ohne Buchdaten (ADR-002).
- Format v1:
  `{ "v": 1, "earned": { "<id>": { "date": "JJJJ-MM-TT", "seed": <Zahl>, "tick": <Zahl>, "crisis": "off|mild|normal" } }, "run": { "seed": <Zahl>, "unlockMode": "stepwise|all" } | null }`.
  Das Datum stammt aus der UI (`Date`), nie aus der Sim.
- **Lesen nie mit Absturz:**
  - Fehlender Schlüssel ergibt ein leeres Buch.
  - Kaputtes JSON oder ein unbekanntes Format ergibt ein leeres Buch. Die Karte zeigt dann «Ehrenbuch war unlesbar und
    wurde neu begonnen». Erst der nächste Eintrag überschreibt den Inhalt.
  - Eine **höhere Version** (`v > 1`, z. B. nach Rückkehr zu einem älteren Build) ergibt ein **schreibgeschütztes**
    Buch. Es wird gezeigt, so weit lesbar, und nie überschrieben. Die Meldung lautet «Ehrenbuch aus neuerer Fassung, wird
    nicht verändert».
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
- **Neue Insel mitten im Schritt, Laden, Menü:** Bei Start und Laden wird der Vorher-Zustand neu gesetzt. Es gibt keinen
  Wechsel über Partiegrenzen.
- **Mehrere Stücke in einem Schritt** (z. B. `won` mit Tempo): Alle werden eingetragen, in Tabellenreihenfolge. Die
  Meldung fasst sie zusammen: «Meisterstücke: Bürgerstadt, Flinke Gründung».
- **Fremdinsel ohne Kontor bleibt möglich:** «Inselreich» ist freiwillig. Abriss eines Kontors nach dem Eintrag löscht
  nichts.
- **Zielmerkmal schon beim Laden gesetzt, Auflage danach bestanden:** «Meister im Sturm» zählt, weil sein Ereignis die
  Auflage ist, nicht das Ziel.
- **Zwei Browserfenster:** Der zuletzt geschriebene Stand gewinnt. Vor jedem Schreiben wird neu gelesen und
  zusammengeführt (Vereinigung der Kennungen, je Kennung der ältere Eintrag). Ein Stück geht so nicht verloren.
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

Vitest gegen die reinen Funktionen (Prüfung in `src/sim/`, Ablage-Parser als DOM-freier Helfer in `src/ui/`), dazu
Browser-Checks.

1. **AK-H1 Defs:** `HONOR_IDS` enthält die 8 festen Kennungen in Tabellenreihenfolge (§2.2) und je `TRIAL_IDS`-Eintrag
   `trial:<id>`. Heute ist die Länge 9. Die Schwellen 9000 und 18 000 stehen nur in `src/sim/defs/honors.ts`
   (rg-Prüfung: keine Literale im Prüfcode).
2. **AK-H2 Wechsel statt Zustand:** Für jedes Stück gilt: vorher «nein», jetzt «ja» ergibt das Stück. Vorher «ja», jetzt
   «ja» ergibt es nicht. Vorher «nein», jetzt «nein» ergibt es nicht. Je Stück ein Testfall mit präparierter Welt.
3. **AK-H3 Schwellen auf den Tick:** `won` wechselt bei Tick 9000 → `swiftFound`. Bei Tick 9001 → nicht. Gleich für
   `swiftTrade` mit 18 000 und 18 001.
4. **AK-H4 Rahmen:** Tempo-Stücke fehlen bei `run.unlockMode === 'all'`, bei `run === null` und bei
   `run.seed !== world.seed`. Alle anderen Stücke sind davon unberührt. Sturm-Stücke fehlen bei `crisisLevel` `off` und
   `mild`.
5. **AK-H5 Erreichbarkeit:** Der Balancing-Controller (`createWorld(3)`, stufenweise) erreicht `won` bei Tick ≤ 9000. Der
   Kaufleute-Controller erreicht `wonMerchants` bei Tick ≤ 18 000. Beide Belege stammen aus bestehenden Läufen. Schlägt
   einer fehl, sind die Schwellen zu hart.
6. **AK-H6 Bitgleich:** `tests/sim/balance.test.ts` und alle Baseline-Pins bleiben unverändert grün. `World.version`
   bleibt 18. `serialize(world)` ist vor und nach einem Lauf mit Ehrenbuch-Prüfung gleich (die Prüfung schreibt nicht in
   die Welt).
7. **AK-H7 Ablage lesen:** Fehlend → leer. Kaputtes JSON → leer und Hinweis. `v: 2` → schreibgeschützt (Schreiben ist ein
   No-op). Ungültiger Einzeleintrag → verworfen, Rest bleibt. Unbekannte Kennung → beim Schreiben erhalten, nicht
   gezählt. Kein Fall wirft.
8. **AK-H8 Einmalig und Zusammenführen:** Ein schon eingetragenes Stück ändert beim zweiten Erreichen nichts, auch das
   Datum nicht. Das Zusammenführen zweier Stände ergibt die Vereinigung, je Kennung den älteren Eintrag.
9. **AK-H9 Laden löst nicht aus:** Wird eine Welt mit `won`, `wonMerchants`, `wonSpice`, `monumentDone` und bestandener
   Auflage geladen und ein Schritt gerechnet, kommt kein Stück und keine Meldung.
10. **AK-H10 Browser-Check (`qa-playtester`):**
    - Neue Insel: Die Menüzeile zeigt «0 von 9».
    - Mit einem Dev-Stand kurz vor Ziel 1 erscheint die Meldung «Meisterstück: Bürgerstadt».
    - Die Karte zeigt den Eintrag mit Datum, Karte und Spielzeit.
    - Nach Neuladen der Seite ist der Eintrag noch da.
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
  `src/sim/honors.ts` (reine Prüfung `newHonors(prev, cur, run)`, DOM-frei). Tests AK-H1 bis AK-H6 und AK-H9.
- **Häppchen 2 UI, ≈ 80 Tools:** Ablage-Helfer (Parser, Zusammenführen, Schreibschutz), Aufruf nach jedem `step` in
  `app.ts`, Meldung, Menüzeile, Karte, Hilfe und README. Tests AK-H7 und AK-H8, Browser-Check AK-H10.
- Gesamt ≈ 120 Tools, ein Worktree, zwei Häppchen hintereinander, je mit `qa-code-reviewer`, dazu ein `qa-playtester` und
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
   **BEDENKEN (klein):** Die Schwellen 9000 und 18 000 sind nur aus dem Skript hergeleitet, ohne menschlichen Playtest.
   Das ist rückbaubar, weil es Werte in den Defs sind. Ein Playtest nach der Umsetzung (Beobachtung, kein Gate) prüft, ob
   «Flinke Gründung» erreichbar, aber nicht nebenbei zu holen ist.
6. **Einfachere Variante:** Ohne Partie-Merker gälten Tempo-Stücke auch bei «alles frei». Das wäre einfacher, aber
   unfair. Die Alternative ist D1 b.

Gesamturteil: **OK mit einem kleinen BEDENKEN** (Schwellen ohne Playtest).

## 10 Entscheidungsbedarf (Entwurf an L0)

- **D1 Freischaltung erkennen.**
  - a) Partie-Merker im Buch (§2.3). Empfehlung, weil es keinen Save-Sprung braucht.
  - b) Tempo-Stücke gelten in jedem Modus. Das ist das Einfachste, «alles frei» wird aber zur Abkürzung.
  - c) Weltfeld `setup.unlockMode` mit v19, gemeinsam mit den Inselproben. Das ist sauber, koppelt aber den Zeitplan.
- **D2 Schwellen** 9000 und 18 000 Ticks: annehmen als Ruling, rückbaubar über die Defs. Empfehlung: annehmen.
- **D3 Zahl der Stücke:** 9, wachsend mit `TRIAL_IDS`. Empfehlung: so. Bei «festen 9» bräuchte jede neue Auflage ein
  Ruling.
