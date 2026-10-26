# I-223 Zehnt (Kurzdesign)

Datum 2026-10-26 · Paket design-I-223 · Meilenstein ohne · Status: **Entwurf, Nachtrag Gate Spec (BEDENKEN, R982; L1–L3 R981)** · Grundlage, verbindlich:
Rechnung [`2026-10-26-i223-zehnt-rechnung.md`](2026-10-26-i223-zehnt-rechnung.md), abgenommen per R977 (Pioniere 100 %
Werkzeug, Siedler 10 % Stein, Kurs 83 % des Zukaufs, Sperre 1800 Ticks, Warnung mit Kassen-Reichweite I-168). Alle
Zahlen stammen von dort und sind hier übernommen, nicht neu gerechnet. Neuer Save-Stand nötig (Abschnitt «Save»).

## Spielerzweck

Steckt der Ausbau an Werkzeug oder Stein fest, lässt der Spieler Pioniere oder Siedler ihre Steuer als Ware zahlen und
bekommt den Baustoff 17 % billiger als im Zukauf, bezahlt mit Kassen-Reichweite und 3 Minuten Festlegung.
Säule: Wirtschaft, Steuern und Handel. Spürbar im ersten Spiel: Sobald die ersten Siedler da sind und die Amtsstube steht
(U3, Regel 7), füllt der Pionier-Zehnt einen Werkzeug-Engpass; 40 Pioniere bringen 14,4 Werkzeug je Minute (Rechnung §4,
Stadt M).

## Die Regel in drei Sätzen (R896)

In der Amtsstube stellst du für Pioniere und für Siedler ein, ob sie ihre Steuer in Geld oder als Zehnt zahlen. Beim
Zehnt geben Pioniere ihre ganze Steuer als Werkzeug und Siedler ein Zehntel ihrer Steuer als Stein ins Lager der
Heimatinsel; dieser Teil fehlt in der Kasse. Nach jedem Umschalten bleibt die Wahl 3 Minuten fest, und was das Lager
nicht fasst, verfällt.

Spielertexte (Rechnung, unverändert, Tooltip am Schalter und Bestätigung):

- «Zehnt der Pioniere: Ihre ganze Steuer kommt als Werkzeug ins Lager, nicht als Geld.»
- «Zehnt der Siedler: Ein Zehntel ihrer Steuer kommt als Stein ins Lager.»
- «Nach dem Umschalten bleibt der Zehnt 3 Minuten, wie er ist.»
- «Ist das Lager voll, verfällt der Rest.»

## Regeln

1. **Schalter je Stufe.** Es gibt genau für die Stufen in `TITHE_GOOD` (1 Pioniere, 2 Siedler) je einen Schalter
   `Geld | Zehnt`; Standard ist `Geld`. Stufen 3 und 4 haben keinen Zehnt.
2. **Nennsteuer wie heute.** Grundlage sind die heutigen Steuereinheiten je Stufe und Schritt:
   uₜ = `taxBaseByTier(world)[t]` × `effectiveTaxPct(world, t)` (`src/sim/population.ts:240-260`). Darin stecken
   Einwohner, Erfüllung (`TAX_UNIT`), Steuersatz niedrig/normal/hoch, Edikt-Punkte und Stadtrecht. Die Steuerformel
   ändert sich nicht.
3. **Aufteilung je Schritt (ganzzahlig).** Mit pₜ = `TITHE_PCT[t]`, wenn der Zehnt der Stufe wirkt (Regel 7), sonst
   pₜ = 0:
   - Geldanteil cₜ = uₜ, wenn pₜ = 0; sonst cₜ = ⌊uₜ × (100 − pₜ) ÷ 100⌋.
   - Zehntanteil zₜ = uₜ − cₜ (der Rundungsrest geht in den Zehnt, keine Einheit geht verloren).
   - Geld: `taxCarry += Σₜ cₜ`, Buchung mit `TAX_CARRY_DIVISOR` exakt wie heute (`population.ts:270-277`).
     `world.stats.taxes = ⌊Σₜ cₜ ÷ (TAX_UNIT × 100)⌋`, also das Geld, das wirklich in die Kasse geht.
   - Ware: für g = `TITHE_GOOD[t]`: `titheCarry[g] += zₜ × TITHE_UNITS_PER_100[g]`;
     n = ⌊`titheCarry[g]` ÷ `TITHE_CARRY_DIVISOR`⌋; `titheCarry[g] −= n × TITHE_CARRY_DIVISOR`.
     `TITHE_CARRY_DIVISOR` = `TAX_CARRY_DIVISOR` × 100 = 2 000 000. Das ist Ware = ⌊Anteil × Nennsteuer × Kurs ÷ 100 +
     Übertrag⌋, ohne Gleitkomma.
   - Wirkt kein Zehnt (alle pₜ = 0), ist die Buchung bitgleich zu heute; `titheCarry` bleibt unberührt.
4. **Siedler zu 10 %.** Der Geldanteil (90 %) bucht wie heute in die Kasse, nur der Zehntanteil wird zu Stein.
5. **Einlagerung.** Die n Stück gehen per `addStock(home(world), g, n)` (`src/sim/economy.ts:12`) in das Lager der
   Heimatinsel, bis zur Lagergrenze `STORAGE_CAP` = 100. Der Rest n − angenommen verfällt; `tickTaxes` liefert ihn zurück, der Schritt
   meldet ihn in `StepReport.titheLost[g]` (kein Welt-Feld). Häuser aller Inseln zählen (die Steuerbasis ist heute schon global), die
   Ware landet immer in der Heimat.
6. **Umschalten.** `setTithe(world, tier, on): Result` in `src/sim/tax.ts`; wirft nie. Prüfreihenfolge, erster Treffer
   gewinnt, bei `fail` bleibt die Welt unverändert:
   1. `tier` keine Stufe 1 … 4 → «Ungültige Stufe»;
   2. Stufe ohne Eintrag in `TITHE_GOOD` → «Kein Zehnt für ‹TIERS[t].name›» (z. B. «Kein Zehnt für Bürger»);
   3. `on` kein Boolean → «Ungültiger Wert»;
   4. keine wirksame Amtsstube → `townhallReason(world)` wie bei der Steuer;
   5. `titheOn[t] === on` → «Zehnt bereits aktiv» bzw. «Geld bereits aktiv»;
   6. `world.tick < titheLockedUntil[t]` → «Sperrzeit»;
   7. Erfolg: `titheOn[t] = on`, `titheLockedUntil[t] = tick + TITHE_SWITCH_LOCK`; wirkt ab dem nächsten Schritt.
7. **Wirkung braucht die Amtsstube.** Der Zehnt der Stufe wirkt, wenn `titheOn[t]` und `townhallActive(world)` gelten,
   analog `effectiveTaxLevel` (`src/sim/townhall.ts:17`). Brennt die Amtsstube oder ist sie nicht angebunden, zahlt die
   Stufe Geld; Schalter und Sperre bleiben stehen, die Sperr-Uhr läuft weiter. Die Amtsstube kommt mit U3 (erste Siedler,
   `src/sim/defs/unlocks.ts:43`).
8. **Sperre je Stufe getrennt** (die Rechnung sagt nur «nach jedem Umschalten»; entschieden R981, L1). Die Sperre
   gilt in beide Richtungen. Sie ist unabhängig von der Sperre der Steuerstufe (`TAX_SWITCH_LOCK` 300): Wer den Steuersatz
   ändert, ändert damit die Ware ab dem nächsten Schritt, der Zehnt-Schalter bleibt gesperrt oder frei wie vorher.
9. **Übertrag bleibt.** Beim Ausschalten bleibt `titheCarry` stehen (höchstens ein Stück) und zählt beim nächsten
   Einschalten weiter. Kein Zufall, keine Uhrzeit: der Zehnt ist deterministisch.

## Wahl und Nische (R722)

Die Prüfung auf dominante Wahl steht vollständig in der Rechnung, Abschnitt «Prüfung auf dominante Wahl», E1–E10. Kurz:

| Pfad    | Stärke                                    | Preis                                                       | Wann besser                                                |
| ------- | ----------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Betrieb | billigstes Stück                          | Bauplatz (Steinbruch am Berg), Kapital, Unterhalt           | ab 32 % (Steinbruch) bzw. 46 % (Werkzeugmacher) Auslastung |
| Zehnt   | 17 % unter Zukauf (Stadt F: 352 von 2080) | Kassen-Reichweite, 3 min Festlegung, Verfall über 100 Stück | Ausbauwelle, kein Bergplatz, Auflage ohne Zukauf           |
| Zukauf  | sofort und stückgenau                     | voller Preis 40 / 15                                        | kleine Fehlmenge, Eile                                     |

- **Keine Pumpe (E3):** k = 33,3 / 12,5 liegt über jedem Verkaufserlös und der Auftragsprämie (AK-ZE-15).
- **Kein Holz (E4):** Holz-Zehnt verliert immer gegen den Holzfäller; darum gibt es ihn nicht.
- **Edikt Handel (E7):** Zukauf 32 / 12 unterbietet den Zehnt; nach `won` mit Handel ist er nutzlos. Gewollt.
- **Kein Klick-Mikro (E8):** Sperre 1800 Ticks; mit 300 wäre der Zehnt risikofreier Rabatt-Zukauf.
- **Stärkste Nische (E10):** Auflage «Eigenversorgung» (kein Zukauf, 15 min): Zehnt ist dort der einzige Weg ausser
  Betrieb.

## Werte (`src/sim/defs/`)

| Name                  | Datei       | Wert                                   | Einheit, Folge                                                     |
| --------------------- | ----------- | -------------------------------------- | ------------------------------------------------------------------ |
| `TITHE_GOOD`          | `tiers.ts`  | `{ 1: 'tools', 2: 'stone' }`           | Gut je Stufe; Schlüssel bestimmen, welche Stufen einen Zehnt haben |
| `TITHE_PCT`           | `tiers.ts`  | `{ 1: 100, 2: 10 }`                    | % der Nennsteuer, der als Ware kommt                               |
| `TITHE_UNITS_PER_100` | `tiers.ts`  | `{ tools: 3, stone: 8 }`               | Stück je 100 Geld Nennsteuer (Kurs 83 % des Zukaufs)               |
| `TITHE_CARRY_DIVISOR` | `tiers.ts`  | `TAX_CARRY_DIVISOR * 100` (abgeleitet) | Teiler des Übertrags; hängt nicht vom Kurs ab                      |
| `TITHE_SWITCH_LOCK`   | `timing.ts` | `1800`                                 | Ticks Sperre nach jedem Umschalten (3 min bei 1×)                  |

Keine dieser Zahlen steht im Code. Typen: `TitheTier = keyof typeof TITHE_GOOD` (1 | 2), `TitheGood = 'tools' | 'stone'`.
Ein anderer Kurs ändert die Save-Prüfung nicht (Teiler kursfrei); eine Änderung von `TITHE_SWITCH_LOCK` auch nicht
(Prüfung nur «ganze Zahl ≥ 0»).

**Balancing-Test:** Standard ist `Geld`; der Controller schaltet nie einen Zehnt. Dann ist die Buchung bitgleich zu heute
(Regel 3), `tests/sim/balance.test.ts` bleibt ohne Änderung grün. Neue Werte kommen nur hinzu, kein bestehender ändert
sich; darum kein Balance-Ruling. Kurs und Sperre: R977.

## Datenmodell und Save

- Neue Welt-Felder (`src/sim/types.ts`, Start in `src/sim/world.ts` neben `taxCarry`):
  - `titheOn: Record<TitheTier, boolean>`, Start `{ 1: false, 2: false }`;
  - `titheLockedUntil: Record<TitheTier, number>`, Start `{ 1: 0, 2: 0 }` (absoluter Tick wie `taxLockedUntil`);
  - `titheCarry: Record<TitheGood, number>`, Start `{ tools: 0, stone: 0 }`.
- **Save-Version N+1, N = `SAVE_VERSION` auf main beim Merge** (R909; heute 18 auf diesem Zweig, die Nummer vergibt die
  Merge-Reihenfolge). Migration `migrateVNToVN+1` setzt die drei Felder auf die Startwerte und wirft nie; sie hängt sich
  an die bestehende Kette v1 … vN (`src/sim/save.ts:1013-1031`). Ein alter Stand lädt also mit Zehnt aus.
- **Abweisen mit Hinweis, nie Absturz:** Strukturprüfung in `isWellFormed` (Nachbar von `taxCarry`, `save.ts:590`):
  genau die Schlüssel von `TITHE_GOOD` bzw. der Güter; `titheOn` Boolean; `titheLockedUntil` ganze Zahl ≥ 0;
  `titheCarry` ganze Zahl in 0 … `TITHE_CARRY_DIVISOR` − 1. Sonst `{ ok: false, reason: 'Beschädigter Spielstand' }`. Eine
  Version über N+1 liefert wie heute «Unbekannte Version».
- `arc42.md` und README: Plan-Task (Tech 6).

## Bedienung (Browser-Check, Amtsstuben-Panel)

- **Ort:** im Amtsstuben-Panel (`src/ui/inspect.ts`, Steuerzeilen je Stufe ab Z. 630) neben den drei Steuerknöpfen der
  Stufe ein Umschalter `Geld | Zehnt`, nur für Pioniere und Siedler. Tooltip: der Spielertext der Stufe. Texte und Zahlen
  kommen aus einem DOM-freien Helfer (`src/ui/taxView.ts` oder neues `src/ui/titheView.ts`).
- **Restsperre:** unter dem Schalter «wieder änderbar in m:ss» (gleicher Wortlaut und `formatGameTime` wie `taxLockText`);
  in der Sperre ist der Schalter deaktiviert und zeigt «Sperrzeit» als Grund.
- **Strom:** die Steuerzeile der Stufe zeigt mit Zehnt «0 / min · 17,2 Werkzeug / min» (Pioniere) bzw. «Geldanteil / min
  · Stein / min» (Siedler). Ware je Minute = zₜ × 600 × Kurs ÷ `TITHE_CARRY_DIVISOR`, auf eine Nachkommastelle abgerundet.
  Ohne wirksame Amtsstube: «Zehnt ruht: ‹townhallReason›».
- **Bestätigung beim Einschalten** (Geld → Zehnt, jedes Mal; Ausschalten ohne Rückfrage): kleiner Dialog mit dem
  Spielertext der Stufe, dem Sperrtext und der Kassen-Reichweite **nach** dem Umschalten. Rechnung: taxes′ =
  `stats.taxes` minus Geldanteil, der in den Zehnt wandert (gleiche Formel wie Regel 3 mit heutiger Basis); dann
  `cashReach(world.money, taxes′, stats.upkeep)` aus `src/ui/cashReach.ts` (I-168), unverändert.
  - Liefert sie einen Satz: «Nach dem Umschalten: Kasse leer in ≈ m:ss bei −n / min …» bzw. bei Kasse ≤ 0 «Kasse ist leer
    bei …». Zusatzzeile: «Im Minus kannst du nicht bauen und nicht zukaufen.»
  - Sonst: «Kasse bleibt im Plus (+n / min).»
  - Knöpfe «Zehnt einschalten» und «Abbrechen»; Abbrechen ändert nichts.
- **Pflichtwarnung in der Auflage:** Läuft eine Auflage (`world.trial.active !== null`), steht im Dialog immer zusätzlich
  «Auflage läuft: kein Zukauf. Mit leerer Kasse kannst du auch nicht bauen.» Begründung: Eine leere Kasse sperrt das
  Bauen (`economy.ts:29`), ohne Zukauf kann die Stadt schrumpfen (L4, R982).
- **Verfall:** «Lager voll: n Stein verfallen» bzw. «… Werkzeug verfallen» als Meldung im bestehenden Meldungsweg,
  höchstens einmal je Bilanzintervall (`UPKEEP_INTERVAL` = 100 Ticks) und Gut, n = Summe aus `StepReport.titheLost` im
  Intervall.
- Desktop-first (ab 1280 px).

## Randfälle

- **Lager leer, voll oder erreicht 100 im Schritt:** bis 100 einlagern, Rest verfällt mit Meldung; der Übertrag läuft
  weiter (Verfall wird nicht zurückgebucht).
- **Heimat ohne Kontor/Lager:** kommt nicht vor, das Heimatkontor ist nicht abreissbar (`src/sim/build.ts:81`). Würde es
  je möglich, verfällt die Ware mit Meldung.
- **Amtsstube brennt, wird abgerissen oder verliert die Anbindung:** Zehnt ruht, die Stufe zahlt Geld (Regel 7); danach
  wirkt er wieder, ohne neues Umschalten.
- **Kasse schon negativ beim Einschalten:** erlaubt, kein Sperrgrund; der Dialog zeigt «Kasse ist leer bei −n / min».
- **Steuerstufe ändern während des Zehnts:** Ware folgt dem neuen Satz ab dem nächsten Schritt (E9: hoch = 130 % Ware);
  die 300-Ticks-Sperre der Steuer und die 1800-Ticks-Sperre des Zehnts sind unabhängig.
- **Einwohner sinken auf 0 / Stufe ohne Häuser:** uₜ = 0, keine Ware, kein Geld der Stufe, kein Fehler; der Übertrag
  bleibt stehen. Umschalten ist erlaubt.
- **Aufstieg Pionier → Siedler:** ab dem Schritt nach dem Aufstieg zählt die Steuer des Hauses zur Stufe 2 und folgt deren
  Schalter; beim Abstieg umgekehrt.
- **Edikt Handel aktiv:** Zehnt wirkt unverändert, ist aber teurer als der Zukauf (E7). Gewollt, kein Hinweis.
- **Edikt mit Steuerpunkten:** senkt `effectiveTaxPct` und damit die Ware im gleichen Mass.
- **Auflage «Eigenversorgung»:** Zehnt ist kein Zukauf, `trialBuyBlock` greift nicht; Schalten bleibt frei (E10).
- **Laden in der Sperre:** absoluter Tick, sie läuft weiter.
- **Alter Spielstand / Häuser anderer Inseln:** siehe Save bzw. Regel 5.

## Abnahmekriterien

Vitest (DOM-frei): `tests/sim/tithe.test.ts` (neu), `tests/sim/save.test.ts` (Erweiterung), `tests/ui/titheView.test.ts`
(neu). Testwelten mit wirksamer Amtsstube (angebunden, kein Ausfall) und erfüllten Häusern; wo exakte Mengen verlangt
sind, ruft der Test `tickTaxes` direkt, damit Wachstum und Verbrauch die Basis nicht verschieben. Rechenweg der Zahlen:
Regel 3.

- **AK-ZE-01 Standard bitgleich** (`tithe.test.ts`): Welt mit 48 Pionieren und 120 Siedlern, erfüllt, Satz normal,
  beide Schalter `Geld`, `taxCarry` 0: nach 600 Aufrufen von `tickTaxes` Geld + 5616 (= (96 + 840) × 6; 187 200
  Einheiten je Schritt × 600 ÷ 20 000, ohne Rest), `taxCarry` 0, `stats.taxes` 936; Lager und `titheCarry` unverändert
  (absolute Zahl: AK-ZE-25). Zusätzlich bleiben `tests/sim/balance.test.ts` und die Hashes in
  `tests/sim/seaGolden.test.ts` unverändert grün (über `dropTithe`, Tech 2).
- **AK-ZE-02 Werkzeug exakt** (`tithe.test.ts`): 12 Häuser à 4 Pioniere, erfüllt, Satz normal, Werkzeug 20, Zehnt Stufe 1:
  nach 100 Aufrufen Werkzeug 22, `titheCarry.tools` = 1 760 000, Geld aus Stufe 1 = 0; nach 600 Aufrufen (ab Start)
  Werkzeug 37, Übertrag 560 000.
- **AK-ZE-03 Siedler 90/10** (`tithe.test.ts`): 15 Häuser à 8 Siedler, erfüllt, normal, nur Zehnt Stufe 2, Stein 10, Kasse
  K: nach 100 Aufrufen Kasse K + 756 (mit `Geld`: K + 840), Stein 16, `titheCarry.stone` = 1 440 000; `stats.taxes` = 756.
- **AK-ZE-04 Steuersatz skaliert** (`tithe.test.ts`): Fall AK-ZE-02 mit Satz hoch: nach 100 Aufrufen Werkzeug 23,
  Übertrag 1 488 000; mit Satz niedrig Werkzeug 22, Übertrag 32 000.
- **AK-ZE-05 Sperre und Gründe** (`tithe.test.ts`): `setTithe(w, 1, true)` bei Tick T → `ok`, `titheLockedUntil[1]` =
  T + 1800; bei T + 1799 `setTithe(w, 1, false)` → `{ ok: false, reason: 'Sperrzeit' }`, `JSON.stringify(w)` unverändert;
  bei T + 1800 `ok`. Stufe 2 ist bei T + 1 frei. Weiter: Stufe 3 → «Kein Zehnt für Bürger»; Stufe 7, `'x'`, `undefined`
  → «Ungültige Stufe»; `on = 'ja'` → «Ungültiger Wert»; ohne Amtsstube → «Braucht eine Amtsstube»; Amtsstube da, aber nicht angebunden oder ausgefallen →
  «Amtsstube wirkt nicht» (AK-ZE-26); gleicher Zustand →
  «Zehnt bereits aktiv» / «Geld bereits aktiv». Kein Aufruf wirft; bei jedem `fail` bleibt die Welt gleich.
- **AK-ZE-06 Lagergrenze und Verfall** (`tithe.test.ts`): Fall AK-ZE-02 mit Werkzeug 99: nach 100 Aufrufen von
  `tickTaxes` Werkzeug 100, Summe der gelieferten `titheLost.tools` = 1; mit Werkzeug 100: Bestand bleibt 100, Summe = 2; der
  Übertrag ist in beiden Fällen 1 760 000.
- **AK-ZE-07 Determinismus** (`tithe.test.ts`): gleicher Seed, Testwelt mit Amtsstube (Helfer), gleiche Aktionen (Zehnt Stufe 1 bei Tick 600, Stufe 2 bei
  Tick 900), 3000 Schritte, zweimal → gleiches `serialize`. Dazu: Zehnt einschalten, 300 Schritte, `serialize` →
  `deserialize`, weitere 2700 Schritte → gleiches `serialize` wie der durchgelaufene Lauf; im geladenen Stand ist
  `setTithe` bis zum gespeicherten Sperr-Ende «Sperrzeit».
- **AK-ZE-08 Save** (`save.test.ts`): rechnet mit `SAVE_VERSION` aus dem Code (N+1 = `SAVE_VERSION`, N =
  `SAVE_VERSION` − 1), nie mit einer festen Zahl wie 19. Rundlauf erhält alle drei Felder. Ein Stand der Version N
  (Fixture oder aus dem heutigen `serialize` mit `version = N` und ohne die Felder) lädt mit `titheOn` aus, Sperre 0, Übertrag 0. Abgewiesen mit
  `ok: false` und «Beschädigter Spielstand», ohne Wurf: `titheOn[1] = 'ja'`, Schlüssel 3 vorhanden, Feld fehlt in N+1,
  `titheLockedUntil[2] = −1` oder `1.5`, `titheCarry.tools = 2 000 000`. Version N+2 → «Unbekannte Version».
- **AK-ZE-09 Warnung zeigt Reichweite nach dem Umschalten** (`titheView.test.ts`): 48 Pioniere erfüllt (`stats.taxes` =
  96), `stats.upkeep` = 70, Kasse 3000: der Helfer für Stufe 1 liefert genau den Satz von `cashReach(3000, 0, 70)`
  (Bilanz −420 / min); 120 Siedler erfüllt (`stats.taxes` = 840), `stats.upkeep` = 400, Helfer für Stufe 2 → taxes′ = 756,
  Satz «Kasse bleibt im Plus (+2136 / min)». Kasse −50 → Satz «Kasse ist leer bei …».
- **AK-ZE-10 Pflichtwarnung Auflage** (`titheView.test.ts`): mit `trial.active = 'selfSupply'` enthält der Dialogtext
  die Auflagen-Zeile, auch wenn die Kasse im Plus bleibt; ohne Auflage fehlt sie.
- **AK-ZE-11 Stufe ohne Einwohner** (`tithe.test.ts`): beide Schalter Zehnt, keine Häuser: 600 Schritte → Lager, Geld aus
  Steuer und `titheCarry` unverändert, kein Wurf. Häuser fallen auf 0 während des Zehnts → Übertrag bleibt stehen.
- **AK-ZE-12 Aufstieg verschiebt** (`tithe.test.ts`): Zehnt Stufe 1, Stufe 2 Geld; ein Haus wird Stufe 2 → ab dem
  nächsten `tickTaxes` zählt seine Steuer als Geld, die Werkzeugmenge sinkt um seinen Anteil.
- **AK-ZE-13 Amtsstube aus** (`tithe.test.ts`): Zehnt Stufe 1 an, Amtsstube mit `outageUntil` → Buchung wie AK-ZE-01
  (alles Geld), `titheOn[1]` bleibt `true`, Sperre läuft weiter; nach Ausfallende wieder Werkzeug.
- **AK-ZE-14 Werte nur aus Defs** (`tithe.test.ts`): die Defs exportieren `TITHE_GOOD`, `TITHE_PCT`,
  `TITHE_UNITS_PER_100`, `TITHE_CARRY_DIVISOR`, `TITHE_SWITCH_LOCK` mit den Werten der Tabelle. Literalsuche (Quelltext
  ohne Kommentare) nur für `1800` in `src/sim/tax.ts` und `src/sim/population.ts`.
- **AK-ZE-15 Kursband** (`tithe.test.ts`, Schutz gegen Pumpe und Zukauf-Ersatz bei jeder Wertänderung): für jedes g in
  `TITHE_UNITS_PER_100` mit k = 100 ÷ `TITHE_UNITS_PER_100[g]` (Geld je Stück) gilt
  max(`GOODS[g].sell` × max(`BOOM_PCT`, `PREFER_PCT`) ÷ 100, ⌊`GOODS[g].buy` × `ORDER_PREMIUM`⌋) < k < `GOODS[g].buy`
  und k > `GOODS[g].buy` × `EDICTS.trade.buyFactorPct` ÷ 100. Alle Faktoren aus den Defs (`defs/crises.ts`,
  `defs/sea.ts`, `defs/goods.ts`, `defs/edicts.ts`), kein Literal. Heute: Werkzeug max(22,5; 30) < 33,3 < 40 und > 32;
  Stein max(9; 11) < 12,5 < 15 und > 12. Boom und Vorliebe stapeln nicht (`sellPrice` nimmt das Maximum,
  `src/sim/trade.ts:80-95`; `sellPct` höchstens 100, `trade.ts:174`); Vorliebe gilt nur für Stoff, Rum, Glas
  (`defs/sea.ts`), die Formel ist also eine sichere Obergrenze. Gesichert durch AK-ZE-24. Würde Stapeln je eingeführt,
  läge Stein bei 6 × 1,5 × 1,3 = 11,7 gegen 12,5, noch im Band.
- **AK-ZE-16 Regression:** gesamte Suite grün, `balance.test.ts` ohne Änderung.
- **AK-ZE-21 Verfall-Meldung je Intervall** (`tests/ui/titheView.test.ts`): DOM-freier Helfer (z. B.
  `collectTitheLoss(state, report, tick)`) summiert Fake-`StepReport.titheLost` je Gut und liefert bei
  `tick % UPKEEP_INTERVAL === 0` höchstens eine Meldung je Gut, dann setzt er die Summe zurück. Fälle: Verluste 1 bei
  Tick 35 und 1 bei Tick 70 → bei Tick 100 genau «Lager voll: 2 Werkzeug verfallen», bei Tick 1 … 99 keine; Werkzeug und
  Stein im selben Intervall → zwei Meldungen (je Gut eine); Intervall ohne Verlust → keine. Die Summe ist UI-Zustand,
  nicht Welt; nach dem Laden beginnt sie bei 0.
- **AK-ZE-22 Verfall über `step()`** (`tests/sim/tithe.test.ts`): `tickTaxes` läuft im Schritt nach `tickProduction`
  und `tickPopulation` (`src/sim/tick.ts:40-46`); was ein Betrieb im selben Schritt fertigt, liegt also schon im Lager,
  der Zehnt nimmt nur den Rest bis 100. Bauabbuchungen liegen zwischen den Schritten (Aktionen), der Hausverbrauch
  berührt Werkzeug und Stein nicht. Fälle: (a) Pionier-Zehnt, Werkzeug 100, kein Werkzeugmacher, 100 × `step()`: Bestand
  bleibt 100, jeder Bericht mit Fälligkeit hat `titheLost.tools` > 0, und Σ `titheLost.tools` ×
  `TITHE_CARRY_DIVISOR` + Übertrag Ende − Übertrag Anfang = Σ zₜ × Kurs (Erhaltung, Regel 3). (b) Reihenfolge: Werkzeug
  99, ein Werkzeugmacher mit `progress` kurz vor Fertigung und `titheCarry.tools` knapp unter dem Teiler, so dass im
  selben Schritt beides fällig wird → Bestand 100 aus der Produktion, `titheLost.tools` = 1.
- **AK-ZE-23 Geldzahl einheitlich** (`tests/ui/titheView.test.ts` oder `balancePreview`-Test): Welt mit 48 Pionieren
  (Zehnt) und 120 Siedlern (`Geld`), erfüllt, normal, nach einem `step()`: HUD-Bilanz `stats.taxes − stats.upkeep` und
  `balancePreview(…).before` nennen dieselbe Zahl (840 − Unterhalt); `totalTaxes` bleibt 936 (Nennsteuer). Ein neues
  Pionierhaus in der Vorschau erhöht die Geldzahl nicht (Steuer geht in den Zehnt). Umsetzung: Vorschau nutzt bei Zehnt
  den Geldanteil aus `titheSplit` (Tech 4).
- **AK-ZE-24 Boom und Vorliebe stapeln nicht** (`tests/sim/tithe.test.ts` oder `trade`-Test): konstruierte Welt mit Boom
  auf `cloth` und Verkauf auf einer Fremdinsel, deren `prefers` `cloth` enthält, `sellPct` 100: `sellPrice(w, 'cloth', 1,
X)` = ⌊`GOODS.cloth.sell` × max(`BOOM_PCT`, `PREFER_PCT`) ÷ 100⌋, nicht das Produkt der Faktoren. Dazu Boom auf `stone`
  → Erlös 9 je Stück (< k 12,5). Sichert die Annahme hinter AK-ZE-15.
- **AK-ZE-25 Absolutwert Geld** (`tests/sim/tithe.test.ts`): der Fall aus AK-ZE-01 mit fest eingetragener Zahl 5616 und
  `taxCarry` 0. Plan-Pflicht: den Wert vor der Umsetzung auf main mit dem heutigen Code ermitteln und fest eintragen;
  ändern Edikt- oder Stadtrecht-Startwerte die Basis, gilt der gemessene Wert.
- **AK-ZE-26 Zweiter Amtsstuben-Grund** (`tests/sim/tithe.test.ts`): Amtsstube steht, `connected: false` →
  `setTithe` liefert `{ ok: false, reason: 'Amtsstube wirkt nicht' }` (Wortlaut `src/sim/townhall.ts:13-14`); ebenso mit
  gesetztem `outageUntil`. Welt unverändert.
- **AK-ZE-27 Save-Nummer aus dem Code** (`tests/sim/save.test.ts`): ein Stand mit `version = SAVE_VERSION − 1` ohne
  Zehnt-Felder lädt und hat danach `version === SAVE_VERSION`; die neuen Save-Tests enthalten kein Versionsliteral,
  sondern rechnen mit `SAVE_VERSION` (R909).

Browser-Check (`qa-playtester`, Headless, 1280 × 800):

- **AK-ZE-17** Amtsstube öffnen: Pioniere und Siedler haben je einen Schalter `Geld | Zehnt` mit Tooltip-Spielertext,
  Bürger und Kaufleute keinen.
- **AK-ZE-18** Pioniere auf Zehnt: Dialog mit Spielertext, Sperrtext und Kassen-Satz; «Abbrechen» lässt alles gleich;
  «Zehnt einschalten» → Schalter zeigt `Zehnt`, darunter «wieder änderbar in 3:00» (zählt herunter), Steuerzeile
  «0 / min · n Werkzeug / min», Werkzeug im Lager steigt. Zweiter Lauf mit Kasse nahe 0 (z. B. 50) und negativer
  Bilanz nach dem Umschalten: Dialog zeigt «Kasse leer in ≈ …» bzw. «Kasse ist leer bei …» und die Zeile «Im Minus kannst
  du nicht bauen und nicht zukaufen.»; nach dem Einschalten fällt die Kasse unter 0, ein Bauversuch zeigt den Sperrgrund
  «Kein Geld», kein Absturz.
- **AK-ZE-19** Werkzeug auf 100 bringen (Zukauf): Meldung «Lager voll: n Werkzeug verfallen» erscheint höchstens einmal je
  100 Ticks.
- **AK-ZE-20** Während einer laufenden Auflage einschalten: Dialog zeigt die Auflagen-Zeile.

Zuordnung der Gate-Auflagen (R982, Übergabe lead-qa vom 2026-10-26):

| Auflage | Inhalt                        | AK / Ort                                |
| ------- | ----------------------------- | --------------------------------------- |
| 1       | Rückfaltkette `dropTithe`     | Tech 2, AK-ZE-01                        |
| 2       | Verfall-Meldung prüfbar       | AK-ZE-21, AK-ZE-22 (AK-ZE-19 bleibt)    |
| 3       | `stats.taxes` gegen Vorschau  | AK-ZE-23, Tech 4                        |
| 4       | Kursband in k, Boom/Vorliebe  | AK-ZE-15 (berichtigt), AK-ZE-24         |
| 5       | Absolutwert Standard          | AK-ZE-01 (berichtigt), AK-ZE-25         |
| 6       | zweiter Amtsstuben-Grund      | AK-ZE-05 (berichtigt), AK-ZE-26         |
| 7       | Strukturtest schmal           | AK-ZE-14 (berichtigt)                   |
| 8       | Save-Nummer, arc42 und README | AK-ZE-08 (berichtigt), AK-ZE-27, Tech 6 |
| Risiko  | Kasse nahe 0 im Browser       | AK-ZE-18 (zweiter Lauf)                 |

## Nicht im Scope

- Holz-Zehnt (E4) und jede andere Ware als Werkzeug und Stein.
- Zehnt für Stufe 3 und 4.
- Zehnt für Rivalen oder KI; der Balancing-Controller schaltet keinen Zehnt.
- Verkauf-Automatik für Zehnt-Ware, Einlagerung auf anderen Inseln als der Heimat.
- Eigenes Gebäude (Zehntscheune), eigene Freischaltung, eigener Klang.
- Änderung der Steuerformel, der Steuer-Sperre oder der Lagergrenze.

## Offene Punkte für Tech

1. **Verfall-Meldung:** `tickTaxes` liefert die verfallenen Mengen, `step` legt sie als
   `StepReport.titheLost: Partial<Record<TitheGood, number>>` ab, statt Welt-Feld (kein Save-Feld, UI summiert je
   Intervall). Empfehlung: so umsetzen.
2. **Rückfaltkette der Tests (Gate-Auflage 1, Pflicht):** Die Prüfung auf unbekannte Schlüssel beginnt bei
   `foldBackToV13` (`tests/sim/helpers.ts:355`), das zuerst `dropTrial` aufruft. Verlangt nach dem Muster
   `dropTrial`/`foldBackTrial` (`helpers.ts:283-298`): `dropTithe` entfernt `titheOn`, `titheLockedUntil`, `titheCarry`
   ohne Umordnen, nur bei Startwerten, sonst Fehler analog `TRIAL_FOLD_ERROR`; es steht am Kopf der Kette (vor
   `dropTrial` in `foldBackToV13`). Dazu der äusserste Faltschritt vN+1 → vN (wie `foldBackTrial`: `dropTithe`,
   `version − 1`). Im Plan jeden Verbraucher einzeln grün belegen: `seaGolden`, `balance-crises`, `save`,
   `save-contract`, `save-v11`, `scenario-saves`, `reserve-bitgleich`, `buyPct`, `tests/sim/scenarios.ts`; ausserdem
   nutzen die Kette `save-v12`, `save-v13`, `save-loyalty`, `farOrder-save`, `reserve-save`, `goal3`, `edicts`,
   `helpers.test` (per `rg foldBack tests/sim`). Die Hashes in `seaGolden.test.ts` bleiben unverändert (Beleg AK-ZE-01);
   ein Neupinnen ist ein Fehler, kein Ausweg.
3. **Ort der Buchung:** Aufteilung in `tickTaxes` (`population.ts`), `setTithe` in `tax.ts`. Prüfen, dass kein neuer
   Importzyklus entsteht (`population` → `townhall` besteht heute schon). Empfehlung: reine Hilfsfunktion
   `titheSplit(world)` neben `taxUnits`, von Buchung und UI-Vorschau gemeinsam genutzt (DRY).
4. **Geldzahl gegen Nennsteuer (Gate-Auflage 3):** `stats.taxes` wird Geldanteil, `totalTaxes` bleibt Nennsteuer.
   Plan-Pflicht, je Verbraucher bestätigen: `hud.ts:150,194,435,800`, `balanceFlow.ts`, `guide.ts:200` (lesen
   `stats.taxes`, Geldanteil, gewollt) und `balancePreview.ts:20` (liest `totalTaxes`). Empfehlung: Die Vorschau nutzt
   den Geldanteil aus dem gemeinsamen Helfer `titheSplit` (Tech 3), sonst zeigt sie Geld, das nicht kommt (AK-ZE-23).
   Die Steuerzeile je Stufe zeigt Geldanteil plus Ware.
5. **Wortlaut Restsperre:** «wieder änderbar in m:ss» wie bei der Steuer statt «noch m:ss» (Einheitlichkeit).
6. **Doku als Plan-Task (Gate-Auflage 8):** `docs/arc42.md` (Persistenz, `save.ts`-Zeile mit der neuen Migration,
   Tick-Ablauf `titheLost`) und die README-Spielanleitung (Zehnt in der Amtsstube) als eigener Task im Plan.

## Entscheidungen L0

1. **L1 Sperre je Stufe getrennt** (Regel 8). **Entschieden (R981).** Wie `taxLockedUntil` je Stufe; ein gemeinsamer
   Riegel würde den Siedler-Zehnt sperren, nur weil die Pioniere umgeschaltet wurden.
2. **L2 Amtsstube Pflicht** (Regel 7). **Entschieden (R981).** Der Zehnt ist erst ab U3 (erste Siedler) schaltbar; Rechnungsfall Stadt F (min 6,
   nur Pioniere) ist damit nicht erreichbar, die Werte je Einwohner gelten weiter. Begründung: Steuerfragen
   bleiben an einem Ort, und vor U3 deckt der Startbestand (20 Werkzeug) den frühen Bedarf.
3. **L3 Save mit Migration statt Abweisen.** **Entschieden (R981).** Das Briefing verlangte Abweisen alter Stände. Die Kette migriert heute jeden
   Stand ab v1 (`save.ts:1013-1031`, arc42); ohne Migration würden alle laufenden Spielstände unbrauchbar. Ergebnis:
   Migration auf Standardwerte, Abweisen nur bei beschädigtem Stand oder unbekannter Version (AK-ZE-08).
4. **L4 Prämisse Auflage.** **Pflichtwarnung bleibt (R982).** Kasse < 0 lässt eine laufende Auflage nicht scheitern, sie verhindert nur den Start
   (`trial.ts:36`). Pflichtwarnung trotzdem, mit Begründung «kein Bauen, kein Zukauf» (Bedienung).
