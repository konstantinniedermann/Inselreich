# Designvorschlag: Steuer je Stufe (I-028)

Stand: 2026-10-09 · Autor: lead-design (Werte und Bilanzen: design-economy-designer) · Paket I-028 ·
Prozessstufe voll · Gate: Spec-Vorschlag (L0) · Grundlage: `docs/ideen.md` I-028, R405, R411

## 1. Spielerzweck in einem Satz

Der Spieler stellt in der Amtsstube die Steuer für Pioniere, Siedler, Bürger und Kaufleute getrennt ein und
entscheidet je Gruppe, ob sie schnell aufsteigt (niedrig), voll wächst (normal) oder wenige Köpfe teuer
zahlen (hoch). Spürbar ab der ersten Amtsstube: Pioniere niedrig für den Aufstiegsschub, Siedler und Bürger
normal für Einnahmen.

Säule: Wirtschaft, Steuern und Handel (stärkt), mit Bevölkerung aufsteigen lassen als Gegengewicht. Misslingt
die Idee, leidet die Aufstiegssäule: Ein dominanter Regler würde zum Pflichtklick.

## 2. Heute und Problem

- Ein Regler `world.taxLevel` (`low` / `normal` / `high`) gilt für die ganze Insel, nur mit aktiver Amtsstube
  (`effectiveTaxLevel`, sonst normal). Werte: `TAX_LEVELS` in `src/sim/defs/tiers.ts`
  (70 % · 150 Ticks · Belegung 1 / 100 % · 300 · 1 / 130 % · kein Aufstieg · 0,75). Sperre 300 Ticks
  (`TAX_SWITCH_LOCK`), ein Feld `taxLockedUntil`.
- Global ist «hoch» ein echter Preis: Kein Haus steigt auf. Trennt man die Stufen, fällt dieser Preis bei
  Kaufleuten weg (`upgradeCost: null`). **Entartung:** Kaufleute «hoch» mit 130 % bringt im Dauerzustand
  netto +19 % je Haus (268,5 gegen 226 je 10 s, Waren zum Verkaufspreis) und schlägt «normal» bei jeder
  realen Warenbewertung. Zyklisches Umschalten bringt zusätzlich +176,7 je Haus und Minute.
- Schwelle (Herleitung Anhang A): «hoch» schlägt «normal», wenn der Warenwert je Einwohner g grösser ist als
  g\* = T · (1 − p · o) / (1 − o) (T Steuer der Stufe, p Satz «hoch», o Belegungsanteil). Heute ist
  g\* = 2,2 für Kaufleute, jeder reale Warenwert liegt darüber (V1 Verkauf 10,7 · V3 Herstellkosten 9,56).

## 3. Regeln (Vorschlag)

R1. **Vier Regler.** Der Weltzustand trägt je Stufe 1–4 eine Steuerstufe `taxLevels: Record<Tier, TaxLevel>`.
Steuer, Aufstiegs-Wartezeit und Belegung eines Hauses richten sich nach der Steuerstufe **seiner** Stufe.
Ohne aktive Amtsstube gilt für alle vier «normal» (wie heute).

R2. **Steuer.** Ein Haus zahlt Einwohner × Steuersatz der Stufe × (erfüllt ? 2 : 1) × Prozent seiner
Steuerstufe; summiert wird je Stufe, dann einmal mit dem Übertrag verbucht (`taxCarry` bleibt ein Feld).

R3. **Entartungs-Lösung: Satz «hoch» je Stufe.** «hoch» bekommt für Kaufleute 115 % statt 130 %. Pioniere,
Siedler und Bürger behalten 130 %; die Belegung 0,75 bleibt für alle (3 / 6 / 11 / 15 Einwohner).
Def-Eintrag: `src/sim/defs/tiers.ts`, `TAX_LEVELS.high.pctByTier = { 4: 115 }` (ganzzahlig wie `pct`;
fehlt eine Stufe, gilt `pct`). Wirkung: g\* steigt für Kaufleute auf 12,1. «hoch» ist dann richtig, wenn
Kaufleute-Waren knapp sind (zugekauft, Gewürz vom Händler), «normal», wenn sie reichlich sind und für die
Kopfziele (60 / 80 Kaufleute).

R4. **«niedrig» nur für Stufen mit Aufstieg.** Für Kaufleute ist «niedrig» reiner Verlust (−132 je Haus und
10 s, kein Gegenwert). Die Aktion für Kaufleute «niedrig» liefert `{ ok: false, reason: 'Kaufleute steigen
nicht auf' }`; der Knopf ist deaktiviert und nennt den Grund im Tooltip.

R5. **Sperre je Regler.** Nach dem Umschalten ist **dieser** Regler 300 Ticks gesperrt
(`taxLockedUntil: Record<Tier, number>`). Begründung: Eine gemeinsame Sperre zwänge 90 s Wartezeit beim
Einrichten von vier Reglern; die Umschalt-Ausbeute je Regler ist mit R3 vernachlässigbar (Abschnitt 5, D).

R6. **«Alle»-Aktion bleibt.** `setTaxLevel(world, level)` bleibt bestehen und heisst jetzt «alle Stufen»: Sie
setzt jede Stufe, die noch nicht auf `level` steht (Kaufleute bei `low` auf `normal`). Sie ist atomar:
Ist eine zu ändernde Stufe gesperrt, scheitert sie mit `Sperrzeit` und ändert nichts; stehen schon alle
auf dem Ziel, `Stufe bereits aktiv`. Geänderte Stufen werden gesperrt. Neu:
`setTierTaxLevel(world, tier, level)` mit denselben Gründen plus R4.

R7. **Folgeregeln je Stufe.**

- Fest (I-007, `feast.ts`): Wirkung und Ablehnungsgrund richten sich nach der Steuerstufe des **Hauses**;
  ein Fest wirkt auf Häuser einer Stufe mit «normal» und nicht auf «niedrig» (schon kürzer) oder «hoch».
  Das Fest wird nur abgelehnt, wenn es auf **kein** Haus im Radius wirken kann.
- Freischalt-Hinweis `taxBlocks` (`unlocks.ts`): blockiert, wenn die Stufe des Auslösers (Vorstufe bei
  `tierWish`/`tierReached`) auf «hoch» steht, nicht mehr global.
- Aufstiegs-Halt der Amtsstube (`upgradeStops`) bleibt unverändert und unabhängig: Er hält Köpfe und Satz,
  «hoch» tauscht Köpfe gegen Satz (Abschnitt 5, B).

## 4. Bilanz je Einwohner und je Haus (Dauerzustand, Variante R3)

Steuer je Einwohner und 10 s = Steuer der Stufe × Satz. Warenwert g je Einwohner und 10 s:
V1 Verkauf ungesättigt, V2 gesättigt (Boden 30 %), V3 Herstellkosten (Kettenunterhalt ÷ Ausstoss), V4 Kaufpreis.

| Stufe     | g V1  | g V2 | g V3 | g V4  |
| --------- | ----- | ---- | ---- | ----- |
| Pioniere  | 1,50  | 0,45 | 1,00 | 4,00  |
| Siedler   | 3,90  | 1,17 | 3,50 | 10,00 |
| Bürger    | 7,50  | 2,25 | 6,50 | 18,00 |
| Kaufleute | 10,70 | 3,21 | 9,56 | 27,00 |

Netto je volles Haus und 10 s (Einwohner × (Steuer/Einw. − g)); je Minute = × 6. Dienste-Unterhalt ist bei
jeder Steuerstufe gleich und nicht enthalten.

| Stufe     | Steuerstufe        | Einw. | Steuer/Einw. | Steuer/Haus | netto V1  | netto V2  | netto V3  | netto V4  |
| --------- | ------------------ | ----- | ------------ | ----------- | --------- | --------- | --------- | --------- |
| Pioniere  | niedrig            | 4     | 1,40         | 5,6         | −0,4      | 3,8       | 1,6       | −10,4     |
| Pioniere  | normal             | 4     | 2,00         | 8,0         | 2,0       | 6,2       | 4,0       | −8,0      |
| Pioniere  | hoch               | 3     | 2,60         | 7,8         | 3,3       | 6,5       | 4,8       | −4,2      |
| Siedler   | niedrig            | 8     | 4,90         | 39,2        | 8,0       | 29,8      | 11,2      | −40,8     |
| Siedler   | normal             | 8     | 7,00         | 56,0        | 24,8      | 46,6      | 28,0      | −24,0     |
| Siedler   | hoch               | 6     | 9,10         | 54,6        | 31,2      | 47,6      | 33,6      | −5,4      |
| Bürger    | niedrig            | 15    | 9,80         | 147,0       | 34,5      | 113,3     | 49,5      | −123,0    |
| Bürger    | normal             | 15    | 14,00        | 210,0       | 97,5      | 176,2     | 112,5     | −60,0     |
| Bürger    | hoch               | 11    | 18,20        | 200,2       | 117,7     | 175,4     | 128,7     | 2,2       |
| Kaufleute | niedrig (gesperrt) | 20    | 15,40        | 308,0       | 94,0      | 243,8     | 116,8     | −232,0    |
| Kaufleute | normal             | 20    | 22,00        | 440,0       | **226,0** | **375,8** | **248,8** | −100,0    |
| Kaufleute | hoch heute 130 %   | 15    | 28,60        | 429,0       | 268,5     | 380,9     | 285,6     | 24,0      |
| Kaufleute | **hoch neu 115 %** | 15    | 25,30        | 379,5       | 219,0     | 331,4     | 236,1     | **−25,5** |

Kein endloser Überschuss: «hoch» bringt bei Kaufleuten nie mehr Steuer je Haus als «normal» (379,5 < 440),
nur mehr Steuer je verbrauchter Ware. Kein zwingender Bankrott: «normal» bleibt bei V1–V3 in allen Stufen
positiv; negativ wird nur der Vollzukauf (V4), wie heute.

## 5. Dominanz-Check (Variante R3)

Annahmen: «niedrig»-Nutzen = Zeitvorsprung des Aufstiegs × (netto Folgestufe − netto eigene Stufe), V1;
Kosten = 30 % der Gruppensteuer über die Verweildauer. W\* = Wartezeit, ab der Parken mit «hoch» lohnt.
Füllzeiten: Pioniere 150, Siedler 200, Bürger 350 Ticks.

| Stufe     | niedrig                                                                                                                                                                         | normal                                                                                                         | hoch                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Pioniere  | richtig, sobald Siedler gewollt und die Wartezeit der Engpass ist: Vorsprung 150 Ticks, Nutzen 34,2, Kosten 1,8 je Haus                                                         | richtig, wenn Kapelle oder Stoff der Engpass sind (dann bringt «niedrig» nichts) und sie in < 880 Ticks kommen | richtig, wenn der Aufstieg > 880 Ticks blockiert ist: +1,3 je Haus und 10 s                    |
| Siedler   | richtig, wenn Bürger gewollt und die Rum-Kette reicht: Nutzen 72,7, Kosten 23,1; bei Defizit Nutzen 218, Kosten 39,9                                                            | richtig für gedrosselten Aufstieg im Takt der Rum-Kette; oder Schule kommt in < 1140 Ticks                     | richtig, wenn Rum oder Schule > 1140 Ticks fehlen: +6,4 je Haus und 10 s                       |
| Bürger    | richtig nach Versorgungsbruch bei vollem Haus (Nutzen 193, Kosten 94,5) oder bei Glas-/Gewürz-Defizit (321 gegen 161,7); im normalen Schub Verlust (−161,7, Füllzeit 350 ≥ 300) | richtig im Aufstiegsschub und fürs Ziel 50 Bürger (15 statt 11 Köpfe)                                          | richtig nach dem Ziel, wenn die Kaufleute-Kette > 1270 Ticks fehlt: +20,2 je Haus und 10 s     |
| Kaufleute | **nie richtig** (−132 je Haus und 10 s) → gesperrt (R4)                                                                                                                         | richtig bei reichlich Waren (V1 226 > 219, V2 375,8 > 331,4, V3 248,8 > 236,1) und für die Kopfziele 60 / 80   | richtig bei knappen Waren: Gewürz zugekauft g = 13,5 → 177 > 170; alles zugekauft −25,5 > −100 |

Ergebnis: Keine Steuerstufe ist für eine Gruppe immer richtig; die einzige «nie»-Zelle wird gesperrt.
Grenzfall Pioniere «niedrig»: In der Aufbauphase fast immer richtig, aber nur, wenn die Wartezeit der
Engpass ist; das entspricht dem heutigen globalen Verhalten, solange es nur Pioniere gibt (keine neue
Entartung, Kosten absolut klein).

**D. Umschalt-Ausbeute** (Zyklus normal → hoch → normal im Takt der Sperre 300/300, je Haus und Zyklus = Minute):

| Stufe                              | V1       | V2         |
| ---------------------------------- | -------- | ---------- |
| Pioniere                           | +4,2     | +1,0       |
| Siedler                            | +22,3    | +5,9       |
| Bürger                             | +81,4    | +18,4      |
| Kaufleute heute 130 %              | +176,7   | +64,3      |
| Kaufleute Belegung 0,6 (verworfen) | +142,7   | +7,9       |
| **Kaufleute 115 %**                | **+3,6** | **−108,8** |

Für Stufen 1–3 ist Dauer-«hoch» besser als jeder Zyklus; dort entsteht durch Umschalten keine neue
Strategie. Rechenweg Kaufleute 115 % (V1): Phase hoch 5250 Einwohner-Ticks × 0,253 = 1328,25 (+8,25 gegen
normal), Nachwachsen 5250 × 0,22 = 1155 (−165), ersparte Waren 15 × 10,7 = +160,5, Summe +3,75.

**Verworfene Variante A** (Belegung «hoch» für Kaufleute 0,6 = 12 Einwohner): gleiche Schwelle g\* = 12,1, aber
das Haus fällt in 300 Ticks nur auf 15 und erreicht 12 nie; Umschalten bringt weiter +142,7 je Minute (+10,5 %).

**Fest (I-007):** Fest bei «niedrig» ist Verschwendung (Sim lehnt ab, bleibt so). «Siedler niedrig» gegen
«normal + Fest»: niedrig kostet 100,8 je Haus über 600 Ticks Festdauer, ein Fest 180 (Rum zum Verkaufspreis)
bzw. 400 (Zukauf) je Kapelle; Gleichstand bei 1,8 bzw. 4 Häusern je Kapelle. Keine der beiden dominiert.

## 6. Save, Baseline, Tests

- **Save v9 → v10.** `taxLevel` → `taxLevels { 1, 2, 3, 4 }`, `taxLockedUntil` → je Stufe. Migration: alle
  vier = bisheriger Wert; **Ausnahme R4:** stand der Stand auf `low`, bekommen die Kaufleute `normal`
  (Verlust ohne Gegenwert, im geladenen Stand steigt die Kaufleute-Steuer von 70 % auf 100 %).
  Prüfung: jede Stufe ein gültiger Schlüssel, Kaufleute nie `low`, Sperren ganzzahlig ≥ 0; sonst
  Abweisen mit Hinweis (Test). Hinweis Versionsnummer: Die M12-Spec reserviert v10 für E6 (geparkt);
  wer zuerst kommt, nimmt v10, der andere v11.
- **Baseline bitgleich bei vier gleichen Werten.** (a) Controller und Balancing-Test rufen keine
  Steuer-Aktion auf (grep `tax` in `tests/sim/controller.ts`, `merchantsController.ts`, `balance.test.ts`:
  kein Treffer) → alle vier Stufen bleiben `normal`. (b) Steuer: Σₜ Sₜ · pctₜ = 100 · Σₜ Sₜ; alle Summanden
  sind ganze Zahlen weit unter 2⁵³, Verteilung und Reihenfolge der Summation ändern das Ergebnis nicht,
  `taxCarry` und Geld bleiben bitgleich. (c) Wartezeit, Belegung, Fest und `taxBlocks` lesen für jede Stufe
  denselben Wert `normal` wie heute. (d) `pctByTier` greift nur bei «hoch». (e) Kein RNG-Zugriff.
  (f) Hash-Pins (`e0Pins`, `save.test.ts`) falten heute über `foldBackToV8` zurück; ein `foldBackToV9`
  (`taxLevels` → `taxLevel`, wenn Stufen 1–3 gleich sind; Sperre = Maximum) hält sie bitgleich.
- **Bewusste Wertänderung (Ruling nötig):** Kaufleute «hoch» 130 % → 115 % ändert auch das bisherige
  globale «alle hoch». Betroffen sind Tests mit Kaufleuten unter «hoch» (31 Aufrufe von `setTaxLevel` mit
  `high`/`low` in `tests/sim/`, ein Fixture mit `low`, eines mit `high`) — nicht der Balancing-Test.

## 7. UI-Skizze

- **Amtsstube-Panel:** Abschnitt «Steuer» als Raster 4 Zeilen × 3 Knöpfe (Pioniere, Siedler, Bürger,
  Kaufleute × niedrig / normal / hoch). Je Zeile rechts: Steuer der Gruppe je Minute (aus dem laufenden
  Stand) und bei Sperre «wieder änderbar in m:ss». Tooltip je Knopf nennt Satz, Aufstieg und Belegung
  **dieser** Stufe (Kaufleute hoch: «115 % · 15 Einwohner»). Kaufleute «niedrig» deaktiviert, Tooltip
  «Kaufleute steigen nicht auf». Darunter wie heute Ausgabesperre und Aufstiegs-Halt.
- **Kopfzeile:** Die drei Knöpfe bleiben als «alle Stufen» (R6). Hervorgehoben ist ein Knopf, wenn alle
  vier auf ihm stehen (bei «niedrig»: Kaufleute auf normal); sonst zeigt der Steuer-Knopf «gemischt», und
  der Tooltip listet die vier Stufen («P niedrig · S normal · B normal · K hoch»). Sperrhinweis nennt die
  gesperrte Stufe.
- **Hinweise und Leitfaden:** «Steuer zu hoch» nennt die Gruppe («Steuer ‹hoch› für Bürger verhindert den
  Aufstieg»); Hover eines Hauses zeigt die Steuerstufe seiner Gruppe.

## 8. Nicht im Umfang

Steuer je Insel (M12-Inseln teilen die Regler), frei einstellbare Prozente, neue Steuerstufen,
Abwanderung oder Abstieg von Häusern, Änderungen an Aufstiegs-Halt und Ausgabesperre, Controller-Strategie
mit gemischten Steuern, sichtbare Animation. Keine Wertänderung für Stufen 1–3.

## 9. Offene Punkte mit Empfehlung (fürs Gate markiert)

| Nr. | Frage                                                                      | Empfehlung                                                      | Entscheider              |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------ |
| O1  | Entartung über Satz (115 %) oder Belegung (0,6)?                           | Satz 115 % (R3): löst Dauerzustand und Umschalten, ein Def-Wert | L0 (Ruling Wertänderung) |
| O2  | Kaufleute «niedrig» sperren oder einheitlich zulassen?                     | sperren (R4); Kosten: eine Migrationsausnahme                   | L0                       |
| O3  | Sperre je Regler oder gemeinsam?                                           | je Regler (R5)                                                  | L0                       |
| O4  | Kopfzeile: «alle»-Knöpfe behalten oder nur Anzeige + Sprung zur Amtsstube? | behalten (R6): schneller Hebel in Geldnot, API bleibt für Tests | L0                       |
| O5  | Fest-Ablehnung, wenn Häuser im Radius gemischte Steuerstufen haben         | nur ablehnen, wenn es auf kein Haus wirkt (R7)                  | L0                       |

Kein Nutzer-Vorbehalt (§5.3): kein Richtungswechsel, Säule und Genre unverändert.

## 10. Grösse und Risiko

- **Grösse M:** Sim (Zustand, Steuer, Wartezeit, Belegung, Fest, `taxBlocks`, zwei Aktionen), Save v10 mit
  Migration und Rückfaltung, Panel-Raster, Kopfzeile «gemischt», Hinweise, README-Tabelle, Testanpassungen.
  Grobe Schätzung: 1 Sim-Paket plus 1 UI-Paket.
- **Risiko mittel:** Save und Hash-Pins (abgefangen durch `foldBackToV9`); Wertänderung Kaufleute «hoch»
  (Ruling); 115 % liegt knapp an der Schwelle: Wird nur Gewürz zugekauft, gewinnt «hoch» +1 %, das ist
  gewollt (knappe Ware), aber sensibel; nach dem Playtest per Def-Wert nachstellbar (110 % → g\* 15,4,
  120 % → g\* 8,8, dann dominiert «hoch» wieder).
- **Playtest-Frage (15 Minuten):** Stellt der Spieler Pioniere ohne Erklärung auf «niedrig» und versteht er
  «gemischt» in der Kopfzeile?

## Anhang A · Herleitung der Schwelle

«hoch» schlägt «normal», wenn o · (p · T − g) > T − g, also g · (1 − o) > T · (1 − p · o), also
g > g\* = T · (1 − p · o) / (1 − o). Kaufleute (T = 22, o = 0,75): p = 1,30 → g\* = 2,2; p = 1,15 → 12,1;
Variante A (p = 1,30, o = 0,6) → 12,1. Herstellkosten je Einheit: Nahrung 2,0 · Stoff 12,5 · Rum 15,0 ·
Glas 20,0 · Gewürz 10,6 (Logistik von zweitem Kontor und Schiff auf 80 Kaufleute umgelegt; bei 60: 11,7).
Annahmen: Gebäude der Stufe 1 bei voller Auslastung; Mangel (halbe Steuer, Schrumpfen) nicht modelliert,
er stärkt «hoch» bei Knappheit eher noch.
