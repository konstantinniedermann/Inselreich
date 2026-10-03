# M11 „Wirtschaft im Fluss" — Designvorschlag

Datum: 2026-10-03 · Paket M11-D · Meilenstein M11 · Status: **Vorschlag** (Prozessstufe voll: Baseline-Bruch, Save-Folge).
Das Dokument ist **keine Spec**: Es hat keine Abnahmekriterien; die Spec folgt nach dem Gate Brainstorming.
Grundlage: Programm Nutzerfeedback (`2026-10-02-programm-nutzerfeedback.md`, §3.1, §3.7, M11-Zeile), S12-Design
(`2026-10-03-s12-ausbau-design.md`, Gate bestanden R171), Ruling R161, M10-Spec (Freischaltbaum 4.2). Rechnungen:
`design-economy-designer` (Anhang 01, markiert **[Werte]**), Messprobe `design-balancing-analyst` (Anhang 02,
markiert **[Mess]**). Annahmen sind **A1 bis An** nummeriert (Abschnitt 9). Ist-Stand: `main` bei Commit 1c7d587,
Save v4; M10 (Save v5) ist noch nicht gemergt, M11 baut darauf auf.

## 1. Spielerzweck und Zeitbild

**Spielerzweck in einem Satz:** „Mein Geld fliesst stetig, ein Defizit bremst den Aufstieg, und ich wähle, woher
meine Nahrung kommt und wie ich meine Betriebe ausbaue."

- **Fühlen:** Die Kasse tickt hörbar und sichtbar hoch statt in Sechser-Schüben zu springen. Ein Betrieb zeigt, wie
  weit sein Zyklus ist und wie voll er arbeitet. Wer in eine Hungerkrise aufsteigen will, wird gebremst und sieht
  warum.
- **Entscheiden:** (1) Woher kommt die Nahrung: Küste (Fischer), Wald (Jagd) oder Weide (Rinder), und was kostet
  mich die Fläche? (2) Aufsteigen mit Vorrat und Defizit (langsamer) oder erst Ketten ausbauen? (3) Neubau oder
  Ausbau (S12). (4) Stein für den Aufstieg oder für die Glashütte (R161).
- **Zeitbild:** Flüsse und Fortschrittsring sind ab Sekunde 1 spürbar. Jagdhütte ab dem ersten vollen Pionierhaus
  (Referenzlauf Tick 150, Minute 0:15), Rinderfarm ab den ersten Siedlern (Tick 350, Minute 1), Ausbau Stufe 2 ab
  den ersten Siedlern, Stufe 3 ab den ersten Bürgern (Tick 3850). Die ersten 15 Minuten enthalten damit mindestens
  eine echte Nahrungswahl und einen ersten Ausbau.

**Säulen:** stärkt Wirtschaft (Steuern, Fluss), Produktionsketten (Wahl der Quelle, Ausbau), Bevölkerung versorgen
und aufsteigen lassen (Dämpfung). Leidet bei Misslingen: Balancing (Abschnitt 8) und Lesbarkeit (zu viele Zahlen im
HUD).

## 2. Umfang

| Punkt    | Inhalt                                                       | Grösse | Baseline                                      | Save           |
| -------- | ------------------------------------------------------------ | ------ | --------------------------------------------- | -------------- |
| S10      | Steuer und Unterhalt je Tick mit Übertrag, Fortschrittsring  | M      | **bricht** (bewusst, ein Ruling, +1200 Ticks) | v6 (Überträge) |
| Dämpfung | Aufstieg bei Defizit doppelt so langsam                      | S      | Siegtick bitgleich, Geldverlauf neu           | —              |
| S2       | Jagdhütte und Rinderfarm als Quellen für `food` (Variante A) | S–M    | bitgleich (Controller baut sie nie)           | —              |
| S3       | Holzfäller braucht Wald (Zustand „kein Wald", live)          | S      | bitgleich, wenn A9 hält                       | —              |
| S4-Proz  | Auslastung in Prozent je Betrieb                             | S      | Geld bitgleich, Fingerabdruck neu             | v6 (`eff`)     |
| S12      | Ausbau Stufe 2 und 3 (Design R171)                           | M      | bitgleich (Controller baut nie aus)           | v6 (`level`)   |
| R161     | Stein: Glashütte gegen Aufstieg                              | S      | keine Änderung (Empfehlung)                   | —              |

**Nicht Teil von M11:** Variante B von S2 (zweites Nahrungsgut als eigener Bedarf), Wildbestand als Sim-Zustand und
Nachwachsen oder Erschöpfung von Wald (Backlog, Save-Feld je Kachel), Lager je Insel und zweite Insel (M12), Erlasse
und Politik (Backlog nach M12), Eingangssperre für Produktion (Backlog), Ausbau von Wohnhäusern und öffentlichen
Gebäuden, neue Güter, Arbeiter.

## 3. S10 — Flüsse statt Minuten-Schüben

**Ist:** Steuer und Unterhalt werden alle 100 Ticks gebucht (`tickTaxes`, `tickEconomy`). Waren fliessen schon je Tick.

| Variante                                                                | Erlebnis                 | Baseline                            | Urteil                   |
| ----------------------------------------------------------------------- | ------------------------ | ----------------------------------- | ------------------------ |
| (a) nur Anzeige zählt hoch                                              | Anzeige ≠ Kasse          | bitgleich                           | verworfen (Programm 3.1) |
| **(b) Buchung je Tick mit ganzzahligem Übertrag, Steuer und Unterhalt** | Geld steigt stetig       | **bricht**: Sieg 6050 → 7250 [Mess] | **empfohlen**            |
| (b1) nur Steuer je Tick                                                 | identisch zu (b) [Mess]  | wie (b)                             | verworfen, kein Vorteil  |
| (b2) nur Unterhalt je Tick                                              | Geld wird negativ [Mess] | Sieg 8150, minMoney −88             | verworfen                |

**Regel (b) [Werte]:** `taxCarry += Σ(EW × Steuer × (erfüllt ? 2 : 1)) × pct`, gebucht `floor(taxCarry / 20000)`
(`TAX_CARRY_DIVISOR` = `UPKEEP_INTERVAL × 100 × 2`, abgeleitet in `defs/timing.ts`); `upkeepCarry += Σ Unterhalt`,
gebucht `floor(upkeepCarry / UPKEEP_INTERVAL)`. Zahlenbeispiel: 20 Siedlerhäuser à 8 EW, Steuer normal: heute
+1120 je 100 Ticks, neu 11 je Tick plus 1 alle 5 Ticks, ebenfalls 1120; Bilanz +3120 / min bleibt (Anhang 01 c). Die
Rundungsverluste (heute bis 5 Münzen je Minute) entfallen.

**Befund der Messprobe [Mess], wichtig:** Die Umstellung ist **nicht neutral**. Der alte Takt bucht die Steuer aus dem
Stand am Buchungstick; bei wachsender Belegung liegt er über dem Durchschnitt der 100 Ticks. Je Tick wird weniger
Geld verdient, der Referenzlauf siegt 1200 Ticks später (6050 → 7250, Krisen „normal" 7050 → 7850, zweites Ziel
10 100 → 11 300). Die Schwellen von `balance.test.ts` halten (≤ 7500, ≤ 8000, ≤ 12 000), „normal" mit 150 Ticks
Abstand knapp. Rot werden 14 Tests: 4 exakte Pins (Sieg 6050, Fingerabdruck, Wiederladen im Sturm) und 10 Unit-Tests
auf den 100-Tick-Takt.

**Optionen zum Baseline-Bruch:**

| Option                                                                   | Folge                                          | Urteil                   |
| ------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------ |
| **R1 Neu pinnen**: Siegticks 7250 / 7850 / 11 300, Schwellen unverändert | ehrlich; Spielwerte je Minute unverändert      | **empfohlen**            |
| R2 Steuersatz je Stufe anheben, damit 6050 hält                          | verändert Spielwerte, Folgen für alle Bilanzen | verworfen                |
| R3 Schwellen anheben (7500 → 8500 usw.)                                  | Test verliert Schärfe, kein Gewinn             | nur wenn R1-Marge reisst |

Empfehlung R1, weil ein menschlicher Spieler die Rundung nicht bemerkt und die Kasse über das ganze Spiel stetig
läuft; die 1200 Ticks (20 %) sind ein Controller-Effekt des Entscheidungstakts (alle 100 Ticks, `RESERVE` 300).
**Ruling nötig (A1):** Neumessung `off`/`normal`/`mild`, M8-B1-Szenario, Fingerabdruck; Auslöser U2/U4/U5 (M10
9.3) werden mitgemessen und neu gepinnt (A2). Nebennutzen: Die Lücke „direkt vor der Buchung abreissen, direkt danach
bauen" fällt weg.

**(c) Fortschrittsring:** Ring oder Balken am Betrieb aus `progress / cycle` (nur Darstellung, bitgleich, **kann vor
der Sim starten**). **HUD:** Kontostand jeden Frame aus der Welt (10 Hz bei 1×, ohne Interpolation), „/ min" höchstens
2 × je Sekunde neu gerechnet, Einheit bleibt „/ min" (Programm 3.1).

### 3.1 Gedämpfter Aufstieg bei Defizit

**Regel:** Ist die **prospektive** Warenbilanz eines Bedarfsguts der Zielstufe negativ, gilt die Wartezeit
`UPGRADE_WAIT` (Steuer normal 300, niedrig 150) × `UPGRADE_DEFICIT_WAIT_FACTOR` (= 2, `defs/timing.ts`). Kein Verbot:
Der Vorrat darf genutzt werden, aber der Aufstieg dauert doppelt. Prospektiv heisst: `net − (maxEW(Ziel) −
EW(jetzt)) × Rate(Ziel)`; ohne den Mehrbedarf des Aufstiegs selbst sähe der erste Bürger ohne Brennerei „Rum 0, kein
Defizit". Einmalkosten (Aufstieg, Ausbau-Gebühr) sind Bestand, nicht Fluss, und zählen nicht.

| Variante                         | Tempo      | Hungerrisiko | Erklärbar | Urteil                       |
| -------------------------------- | ---------- | ------------ | --------- | ---------------------------- |
| **A prospektiv, Faktor 2**       | −300 Ticks | gesenkt      | hoch      | **empfohlen**                |
| A0 nominell (wie `goodsBalance`) | 0 [Mess]   | unverändert  | hoch      | wirkungslos im Referenzlauf  |
| B harter Stopp bei Bilanz < 0    | blockiert  | ≈ 0          | mittel    | verworfen (blockiert Ketten) |
| C proportional zur Unterdeckung  | kaum       | mittel       | niedrig   | verworfen                    |

**Messung [Mess]:** Nominell (A0) löst sie im Referenzlauf nie als einziger Grund aus (0 Tick Verschiebung). Prospektiv
(A) löst bei 13 von 17 Häusern irgendwann aus, verzögert aber nur 3 Aufstiege tatsächlich; ohne (b) bleibt der
Siegtick bei 6050 (minMoney 20, nahe 0), mit (b) 6750 statt 7250 (Controller-Effekt). Sie ist also kein Brecher,
sondern greift dort, wo sie soll. Das Szenario mit minMoney 20 prüft die Spec einzeln (A3).

**Spielerlebnis:** Das Haus-Panel zeigt „Rum-Bilanz negativ — Aufstieg verzögert; Vorrat reicht noch X Minuten";
Spieler baut vor, statt in eine Hungerkrise aufzusteigen. **Echte Wahl:** schnell aufsteigen mit Vorrat und Defizit
(langsamer, riskant) gegen Ketten zuerst (Geld jetzt, Tempo später). **Randfälle:** Bilanz 0 nach Mehrbedarf dämpft
nicht; Lager voll bei Defizit dämpft trotzdem; Brand und Sturm zählen nominell (R115); mehrere Aufstiege im selben
Takt ziehen ihren Mehrbedarf nacheinander vom selben Budget ab (Gebäudereihenfolge, deterministisch); Steuer „hoch"
ohne Aufstieg bleibt ohne Aufstieg. Rechnung einmal je Wachstumstakt in neuem Modul `src/sim/flow.ts` (Importzyklus
`queries.ts` ↔ `population.ts`). Bei Irrtum Faktor 1 (= heute).

## 4. S2 — weitere Nahrungsquellen (Variante A)

**Varianten:** (A) zweite und dritte Quelle für dasselbe Gut `food`, `TIERS` bleibt; (B) zweites Nahrungsgut als
eigener Bedarf (bricht die Baseline, Backlog); (C) nur eine neue Quelle (Jagdhütte). **Empfehlung A** (F10 im
Programm); C wäre einfacher, böte aber nur eine Alternative zur Küste, nicht die Wahl zwischen drei Flächen.

**Werte-Vorschlag [Werte], „Dreieck"** (Anhang 01 a; Raten je 100 Ticks):

| Feld              | Fischer (Ist)  | Jagdhütte                      | Rinderfarm                      |
| ----------------- | -------------- | ------------------------------ | ------------------------------- |
| Grösse, `cost`    | 1×1, 100/5/2/0 | 1×1, 50/2/1/0                  | 2×2, 250/15/3/0                 |
| `upkeep`, `cycle` | 5, 40 (2,5)    | 5, 50 (2,0)                    | 10, 20 (5,0)                    |
| `site`            | Küste          | Radius 3, Wald, min 10, `free` | Radius 3, Gras, min 16, `free`  |
| `stormAffected`   | ja             | nein                           | ja                              |
| Einwohner je Bau  | 5              | 4                              | 10                              |
| Geld je EW / 6000 | 80             | 87,5                           | 85                              |
| Preis der Fläche  | Küste          | Wald (Holzfäller, Roden)       | Weide (Schäferei, Rohr, Häuser) |

Kein Eingang (Rinderfarm ohne Wolle): ihr Preis ist die Weide. Geld je Einwohner liegt innerhalb ±10 %, der
**Standort entscheidet**: Fischer billigster Lauf, aber Küste und Sturm; Jagdhütte billig und sturmfest, aber viele
Gebäude und Waldverbrauch; Rinderfarm wenige Gebäude, frisst Weide. Bilanz je Einwohner (Steuer minus anteiliger
Kettenunterhalt): Fischer und Rinderfarm Pioniere +1,0 / Siedler +3,5 / Bürger +7,5 / Kaufleute +11,5, Jagdhütte
−0,25 darunter; überall positiv. Referenzlauf 50 Bürger: 10 Fischer oder 13 Jagdhütten oder 5 Rinderfarmen. Überschuss
endet bei Lager 100, Verkauf zu 3 deckt 2,0 bis 2,5 Unterhalt je Nahrung nicht: kein Endlos-Gewinn.

**Neues Regelfeld `free: true`** in `site` (zählt nur unbebaute Kacheln ohne Weg): Die heutige Radius-Regel zählt
Terrain auch unter Gebäuden (Beobachtung vom 2026-10-03), sodass Flächenkonkurrenz sonst nur über den Grundriss
bestünde. Zonen dürfen überlappen; exklusive Zonen sind Backlog. Wildbestand: Backlog. Silhouette Pflicht
(`sprites.test.ts`); Bauleiste und Hotkey erst bei der Umsetzung.

## 5. S3 — Holzfäller braucht Wald

Der Standort wird nicht nur beim Bau, sondern **live je Tick** geprüft; fehlt der Wald, zeigt der Betrieb den Zustand
„kein Wald" (Muster `waitingInput`, Unterhalt läuft weiter, Marke aus H-R3). Gilt auch für die Jagdhütte. Roden liefert
weiterhin kein Holz (Programm 3.7).

| Variante                                                  | Urteil                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| **A Holzfäller bekommt `free`** (Wald muss unbebaut sein) | **empfohlen**, aber Wirkung auf den Referenz-Layout prüfen (A9) |
| B Regel wie heute (eigene Kachel zählt)                   | wirkungslos: Holzfäller auf Wald kann nie „kein Wald" bekommen  |
| C eigene Zählung „Wald im Radius ohne Gebäude" nur live   | gleich A, aber ohne Änderung der Bau-Regel; **Rückfall zu A**   |

Randfälle: Wer den eigenen Wald rodet, schadet sich selbst (Abriss erstattet wie immer 50 %, keine Sondererstattung);
Aufforsten für einen Standort kostet (Anhang 01 f: Roden 10, Aufforsten 25 je Kachel; Jagdhütte per Aufforsten 300 gegen
Fischer 100: nicht dominant). Erschöpfung und Nachwachsen: Backlog. Kein neuer Zufall.

## 6. S4-Prozent — Auslastung je Betrieb

**Nutzen:** Der Spieler sieht „Weberei arbeitet zu 60 %" und sucht die Ursache (Wolle fehlt, Sturm, Lager voll).

| Variante                                                               | Save  | Urteil                                         |
| ---------------------------------------------------------------------- | ----- | ---------------------------------------------- |
| **A ganzzahlig geglättet, `Building.eff` (0–1000), Fenster 256 Ticks** | `eff` | **empfohlen**: Wiederladen bleibt gleich       |
| B nicht gespeichert, nach dem Laden bei 1000 beginnend                 | —     | verworfen: Wiederladen ≠ durchgelaufene Welt   |
| C nur Zustandssymbol (H-R3), keine Prozent                             | —     | Rückfall, wenn A die Rundung nicht sauber löst |

Fenster ≥ 3 Zyklen (längster Zyklus Werkzeugmacher 80). Je Tick: Zielwert 1000 bei Zustand `ok`, 0 bei
`waitingInput`, `storageFull`, `notConnected`, `burning`, „kein Wald"; Glättung ganzzahlig, Rundung so, dass 0 und
1000 erreichbar sind (A5). Beim Sturm überspringen sturmanfällige Betriebe jeden zweiten Tick; diese Ticks zählen 0, die Auslastung liegt bei ≈ 50 %. Anzeige nur im Panel und im Mouse-over, nicht als Karten-Marke. Geld und Waren hängen nicht an
`eff`, die Baseline bleibt in Geld und Siegtick bitgleich; der Fingerabdruck (M10 9.2) nimmt `eff` in die
Normalisierung auf (A6).

## 7. S12 — Ausbau (Design R171, Variante C)

Das Design gilt unverändert (Gate Brainstorming bestanden, A1 bis A7 dort). M11 ergänzt nur:

- **Neue Betriebe aus S2** bekommen `levels` mit je einem Eintrag, ohne Code [Werte, Anhang 01 b]: Jagdhütte Stufe 2
  Zyklus 30, Unterhalt 7, {25,1,1,0} + 2 Stoff, Stufe 3 Zyklus 20, Unterhalt 9, {38,2,1,0} + 2 Rum (R 1,47 / 1,78:
  Neubau bleibt der Weg, wie beim Holzfäller); Rinderfarm Stufe 2 Zyklus 12, Unterhalt 13, {125,8,2,0} + 3 Stoff,
  Stufe 3 Zyklus 8, Unterhalt 17, {188,12,3,0} + 3 Rum (R 0,97 / 1,16). Rinderfarm Stufe 3 trägt 25 Einwohner
  (Klumpenrisiko Brand wie in S12).
- **Fluss:** Der erhöhte Unterhalt läuft durch den Übertrag aus Abschnitt 3 (kein eigener Pfad); die
  Auslastung (Abschnitt 6) macht den Kettenabgleich „Weberei 2, Schäferei 1" sichtbar.
- **Datei-Ownership (A8):** `levels` steht in neuer `src/sim/defs/levels.ts` (Schlüssel `defId`), nicht im
  `BuildingDef`. So kollidiert S12 nicht mit S2 in `defs/buildings.ts` und beide laufen parallel. Das ist eine
  Abweichung vom Wortlaut „`levels` am `BuildingDef`" in S12 3.1; Inhalt und Werte bleiben.
- **Rückfall bei knappem Wald:** Gebühr der Jagdhütte 1 / 1 statt 2 / 2 (R 1,11 / 1,34), nur wenn Playtests es zeigen.

## 8. R161 — Stein: Glashütte gegen Aufstieg

**Problem:** Die Glashütte zieht je Zyklus 1 Stein, auch ohne Glasbedarf, bis das Lager voll ist, und nimmt dem
Aufstieg 3 → 4 (10 Stein je Haus) den Stein. Kaufleute-Phase (R161: 8550 → 10 100): Bedarf ≈ 178 Stein gegen 103
Ausstoss von 4 Steinbrüchen (Anhang 01 e). Ohne den Testhelfer-Stein erreicht der Kaufleute-Lauf **keinen einzigen
Kaufmann** [Mess].

| Variante                                                    | Wirkung                                     | Messung / Kosten                 | Urteil        |
| ----------------------------------------------------------- | ------------------------------------------- | -------------------------------- | ------------- |
| **1 nichts ändern, Sichtbarkeit**                           | Spieler baut mehr Steinbrüche (+3)          | Baseline unberührt               | **empfohlen** |
| 2 Reserve: Glashütte startet erst ab Stein ≥ 11             | Aufstieg behält 10 Stein                    | Ziel 2 **nicht erreicht** [Mess] | verworfen     |
| 3 Eingangssperre in der Amtsstube (analog Ausgabesperre S5) | Spieler wählt: Stein für Glas oder Aufstieg | UI, Save-Feld, Baseline-neutral  | Backlog       |

**Sichtbarkeit (Variante 1):** Der Aufstiegsgrund „Zu wenig Stein" im Haus-Panel nennt zusätzlich „Glashütte verbraucht
Stein" (Hinweis im Panel, keine Regel); die Lager-Bilanz zeigt Stein negativ (`goodsBalance` rechnet die Glashütte
schon ein). Mit der Auslastung zeigt die Glashütte „kein Stein" statt zu verschwinden. Der Testhelfer aus R161 bleibt.
**Echte Wahl:** mehr Steinbrüche (Geld, Platz am Berg) gegen Verzicht auf Glas; Dominanz-Prüfung: keine, der
Steinbruch ist die Antwort. Variante 3 wäre die stärkere Entscheidung und gehört in einen Folgeschritt mit weiteren
Eingangssperren.

## 9. Freischalt-Einbindung (M10-Baum, `defs/unlocks.ts`)

| Neu                       | Eintrag | Auslöser                    | Begründung                                                         |
| ------------------------- | ------- | --------------------------- | ------------------------------------------------------------------ |
| Jagdhütte (`hunter`)      | U2      | `tierWish` 2 (Tick 150)     | Wald-Thema: Roden, Holzfäller; die Fischer-Küste reicht bald nicht |
| Rinderfarm (`cattlefarm`) | U3      | `tierReached` 2 (Tick 350)  | Weide ist ab Schäferei (U2) knapp; Siedler brauchen mehr Nahrung   |
| Funktion `upgrade2`       | U3      | `tierReached` 2             | S12 3.3                                                            |
| Funktion `upgrade3`       | U5      | `tierReached` 3 (Tick 3850) | S12 3.3                                                            |

Tipps (`tip`) bekommen je einen Satz. Die Kette U2 → U3 stellt sicher, dass die Rinderfarm nicht vor der Schäferei
erscheint. **Folge für M10-Tests** (erst bei der Umsetzung, M10 ist dann gemergt): `FUNCTION_ENTRY`,
`FUNCTION_LABELS`, AK „jedes Gebäude in genau einem Eintrag" (`hunter`, `cattlefarm`), Meldungstexte U2/U3/U5 ändern
sich **bewusst**. Der Baum bleibt bitgleich, da der Controller die neuen Gebäude nie baut; die Freischalt-Ticks
ändern sich nur durch S10 (A2). Das Laden von Ständen mit Jagdhütte vor U2 schaltet über `deriveUnlocks` nach.

## 10. Save und Baseline

- **Save v6** (M10 = v5 ist Voraussetzung): `taxCarry`, `upkeepCarry` (ganzzahlig, `World`), `Building.eff?` (0–1000;
  fehlt = 1000), `Building.level?` (S12; fehlt = 1), neuer `BuildingState` „kein Wald" (A12: `isWellFormed` kennt die
  Zustandsliste). Migration v5 → v6 trivial: Überträge 0, Rest fehlt. Test mit gespeichertem v5-Stand; der
  Wiederladen-Test im Sturm (scheitert heute ohne Übertrag [Mess]) wird Pflicht.
- **Baseline:** bricht **nur** durch S10 (b) und die prospektive Dämpfung (Geldverlauf). Alle anderen Punkte sind
  bitgleich, solange der Controller weder rodet noch Neues baut (A9 prüft die `free`-Regel am Holzfäller gegen sein
  Layout). Ein Ruling, eine Neumessung: Siegticks, `minMoney`, `minMoneyAfterWin`, Freischalt-Ticks, Fingerabdruck für
  Referenz, „normal", „mild" und Kaufleute-Lauf. Die offene Beobachtung (Controller baut 3 statt 5 Brennereien) wird
  dabei mitgeprüft (A13).
- **README:** Spielanleitung bei der Umsetzung: Fortschrittsring, Auslastung, Quellen, Dämpfung, Ausbau.

## 11. Schnitt in Stufen

Datei-Ownership entscheidet die Reihenfolge; `types.ts`, `save.ts` und `tick.ts` sind gemeinsame Engstellen.

| Stufe | Paket                                                      | Dateien                                                                               | Parallel?                                  |
| ----- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| 0     | Spec, Plan, Gates                                          | `docs/`                                                                               | nach M10-Merge                             |
| 1     | **P1 Fluss, Dämpfung, Save v6** (Abschnitt 3)              | `population.ts`, `economy.ts`, neu `flow.ts`, `types.ts`, `save.ts`, `defs/timing.ts` | **seriell, zuerst**; Neumessung und Ruling |
| 1 ∥   | R1 Fortschrittsring, B0 Messtest-Gerüst                    | `render/` (Ring), `tests/sim/` (neue Datei)                                           | parallel zu P1 (bitgleich)                 |
| 2     | **P2 Quellen, Wald, Auslastung** (S2, S3, S4)              | `defs/buildings.ts`, `placement.ts`, `production.ts`, `types.ts` (nach P1)            | nach P1-Merge                              |
| 2 ∥   | **P3 Ausbau** (S12)                                        | neu `defs/levels.ts`, neu `upgrade.ts`, `build.ts` (Abriss)                           | parallel zu P2 (A8)                        |
| 3     | UI-Welle: Panel (Ausbau, Auslastung, Dämpfung), Bauleiste  | `src/ui/` (ein serieller UI-Strang)                                                   | nach P2 und P3                             |
| 3 ∥   | Render: Silhouetten Jagd, Rind, Stufen-Aufsatz, Wald-Marke | `render/sprites.ts`, `statusMarks.ts`                                                 | parallel zur UI-Welle                      |
| 4     | B1 Balancing, Szenarien, Doku, README                      | `tests/sim/`, `docs/`                                                                 | zuletzt                                    |

**Zuerst** ist P1, weil er die Baseline bricht und alle späteren Messungen auf der neuen Referenz laufen sollen
(Programm: M11 nach M10, vor M12). **Streichreihenfolge** bei Platzmangel: Auslastung in Prozent (nur Symbol), dann
Rinderfarm (eine Alternative statt zwei), dann Stufe 3 des Ausbaus. Nicht streichbar: S10, Dämpfung, Jagdhütte, S3.

## 12. Randfälle (Prüffrage 4)

| Fall                                    | Verhalten                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Leeres Lager, Haus mit Defizit          | Aufstieg doppelt so langsam; Hunger wirkt wie bisher (Steuer halbiert)                           |
| Abriss während Produktion, Übertrag     | Übertrag bleibt in der Welt; Unterhalt endet mit dem Gebäude                                     |
| Geld negativ durch Unterhalt je Tick    | wie heute erlaubt; Bauen gesperrt, Steuer läuft weiter                                           |
| Endloser Überschuss Nahrung             | Lager 100, Verkauf 3 < Unterhalt 2,0–2,5 je Einheit: kein Gewinn                                 |
| Wald unter Jagdhütte gerodet            | Zustand „kein Wald", Unterhalt läuft; Aufforsten oder Abriss                                     |
| Rinderfarm gegen Schäferei um die Weide | `free` zählt nur unbebaute Kacheln: die später gebaute Farm scheitert am Standort; Bestand läuft |
| Laden v4/v5-Stand                       | Migration; Überträge 0; `eff` 1000                                                               |
| Ausbau und Dämpfung                     | Gebühr ist Bestand (nicht Fluss); Mehrausstoss zählt ab dem nächsten Wachstumstakt               |

## 13. Annahmen und Fragen an L0

| #   | Annahme / Frage                                                                                           | Empfehlung                                 |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| A1  | S10 (b) Steuer und Unterhalt je Tick; Baseline neu pinnen (Siege 7250 / 7850 / 11 300), Schwellen bleiben | so; Ruling Balancing, kein Nutzervorbehalt |
| A2  | Freischalt-Ticks U2/U4/U5 und Fingerabdruck werden mitgemessen und neu gepinnt                            | so                                         |
| A3  | Dämpfung prospektiv, Faktor 2; Szenario mit minMoney 20 wird in der Spec einzeln geprüft                  | so; Fallback Faktor 1                      |
| A4  | Jagdhütte in U2, Rinderfarm in U3                                                                         | so                                         |
| A5  | Auslastung als geglätteter Ganzzahlwert (Fenster 256), gespeichert                                        | so; Rückfall Symbol                        |
| A6  | Fingerabdruck normalisiert `eff`, `level`, Überträge                                                      | so                                         |
| A7  | Neues Regelfeld `free` an Jagdhütte, Rinderfarm                                                           | so                                         |
| A8  | `levels` in `defs/levels.ts` statt am `BuildingDef` (Abweichung von S12 3.1)                              | so, damit S2 ∥ S12                         |
| A9  | `free` am Holzfäller (S3) ändert den Referenz-Layout nicht (Messung in der Spec)                          | prüfen; sonst Variante C                   |
| A10 | Save v6 trägt alle Felder gemeinsam; M10 (v5) ist vorher gemergt                                          | so                                         |
| A11 | R161: Variante 1 (Sichtbarkeit), Reserve verworfen, Testhelfer bleibt, Eingangssperre Backlog             | so                                         |
| A12 | Neuer `BuildingState` „kein Wald"; die Save-Prüfung kennt ihn                                             | so                                         |
| A13 | Controller-Befund (3 statt 5 Brennereien) wird bei der Neumessung geprüft                                 | so                                         |
| A14 | HUD-Einheit „/ min" bleibt; Kontostand je Frame                                                           | so                                         |

Nutzervorbehalte nach Verfassung §5: **keine**. S10 ist ein Ruling Balancing (Programm F5), kein Richtungswechsel.

## 14. Selbstprüfung Gate Brainstorming

1. **Säulen:** Wirtschaft (Fluss), Produktionsketten (Quellen, Ausbau), Bevölkerung aufsteigen (Dämpfung). Leidet bei
   Misslingen: Balancing und HUD-Lesbarkeit.
2. **Echte Wahl:** ja: drei Nahrungsquellen mit Geld je Einwohner innerhalb ±10 %, Aufstieg mit Defizit gegen Ketten,
   Neubau gegen Ausbau, mehr Steinbrüche gegen Glas. Keine Option dominiert.
3. **Rückkopplung:** Wachstumsmotor Bürger → Bedarf → Ausbau und Quellen; Bremse Dämpfung, Gebühr, Unterhalt, Stein.
   Gewollt.
4. **Randfälle:** Abschnitt 12; ungeprüft bleiben `free` am Holzfäller (A9) und minMoney 20 (A3).
5. **Einfachere Variante:** S2 nur mit der Jagdhütte, S4 nur als Symbol, S12 nur Stufe 2; Streichreihenfolge in
   Abschnitt 11. S10 (a) verfehlt das Erlebnis.

**Urteil Selbstprüfung: BEDENKEN (klein).** Der Baseline-Bruch ist grösser als erwartet (+1200 Ticks, 20 %) und nur als
Controller-Effekt erklärt (nicht bewiesen); das Neupinnen (A1) fängt ihn auf, wenn L0 es als Ruling trägt. Sonst OK.
