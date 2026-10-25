# V4 · Stadtrecht (Kurzdesign, Stufe voll)

Stand 2026-10-23 · Paket `design-STADTRECHT` · Nutzerauftrag R862 ·
Grundlage: [Recherche Wirtschaft im Spätspiel](../../recherche/2026-10-23-wirtschaft-spaetspiel.md) §2 V4 und §3 ·
baut auf dem Rat auf ([I-112](2026-10-16-i112-ratsbeschluss.md), live seit REL-26). Rechnung: `design-economy-designer`
aus den Defs, keine Testläufe; (S) = Schätzung.

## 1 Spielerlebnis

**Spielerzweck in einem Satz:** Nach dem ersten Ziel kauft der Spieler seiner Stadt mit dem Überschuss eine Rats-Sitzung
nach der anderen, jede teurer als die letzte, und beschliesst je Sitzung, ob das Recht ihm mehr Steuer bringt oder eine Kette
schneller macht.

- **Problem:** Ab Minute 14 bis 15 wächst die Kasse linear um +2500 bis +3200 je Minute, ohne dass etwas Geld bindet
  (Recherche §1.1, §1.3). Der Spieler wartet, statt zu entscheiden.
- **Gefühl:** «Meine Stadt steigt im Rang.» Jede Sitzung ist ein sichtbarer Schritt (Name des Rechts, Rang in der
  Rats-Karte), der viel Geld und etwas Glas kostet und sich erst später oder nur über Ketten auszahlt.
- **Säulen:** Wirtschaft (A, Kostenleiter) und Produktionsketten (B). Misslingt es, bleibt eine Scheinwahl oder eine
  nur verschobene Schwemme.
- **Spielschleifen:** kurz — Karte öffnen, Seite wählen, kaufen; Minuten — Kasse und Glas auf die nächste Sitzung sparen;
  Partie — Rang 0 → 6 neben Denkmal und Zielen 2–3.
- **Im 15-Minuten-Spiel spürbar:** Die Freischaltung kommt mit Ziel 1 (Sieg Tick 6750 ≈ min 11, Endausbau min 14,
  `docs/superpowers/specs/2026-10-17-i144-rechnung.md:88-90`); die erste Sitzung ist um Minute 15 bis 16 leistbar (§4.1).

## 2 Varianten und Empfehlung

- S1 eigene Stadtrecht-Leiter mit reinen Steuerstufen: verworfen, keine Wahl je Stufe, zweite UI neben dem Rat.
- **S2 käufliche Rats-Sitzungen mit A/B-Wahl (empfohlen).**
- S3 wiederholbare Sitzung mit Zufallspaar (seeded RNG): verworfen, nicht planbar, Proben (I-190) unfair.

Empfehlung **S2**: Die Rendite selbst wird zur Wahl (Steuer jetzt oder Ketten-Tempo), und Leser, Karte und Save-Muster
gibt es seit I-112.

## 3 Regeln

### 3.1 Die sechs Sitzungen (Werte für `src/sim/defs/charter.ts`, neu)

Geld 5000 × 1,7^(k−1), auf 100 gerundet; Stein 20 je Sitzung; Glas 10·k ab k = 2. Seite A immer **+2 Steuerpunkte**
(Prozentpunkte auf den Satz jeder Stufe, Kartentext «+2 % Steuer in allen Stufen.»). Seite B immer ein Takt-Hebel auf ein
Gebäude, das der Rat **nicht** hebelt (`src/sim/defs/council.ts`: weaver, chapel, distillery, glassworks bleiben frei).

| k   | Recht         | Geld   | Stein | Glas | A    | B-Takt (`buildings.ts`)         | Kartentext B                           |
| --- | ------------- | ------ | ----- | ---- | ---- | ------------------------------- | -------------------------------------- |
| 1   | Marktrecht    | 5000   | 20    | 0    | +2 % | Steinbruch 60 → 40 (`:108`)     | «Steinbrüche +50 % schneller.»         |
| 2   | Zollrecht     | 8500   | 20    | 20   | +2 % | Werkzeugmacher 80 → 40 (`:178`) | «Werkzeugmacher doppelt so schnell.»   |
| 3   | Münzrecht     | 14 500 | 20    | 30   | +2 % | Gewürzplantage 50 → 40 (`:269`) | «Gewürzplantagen +25 % schneller.»     |
| 4   | Stapelrecht   | 24 600 | 20    | 40   | +2 % | Fischer 40 → 28 (`:54`)         | «Fischerhütten +43 % schneller.»       |
| 5   | Gerichtsrecht | 41 800 | 20    | 50   | +2 % | Schäferei 50 → 35 (`:122`)      | «Schäfereien +43 % schneller.»         |
| 6   | Freie Stadt   | 71 000 | 20    | 60   | +2 % | Zuckerrohr 50 → 35 (`:150`)     | «Zuckerrohrplantagen +43 % schneller.» |

B zielt in k1–k3 auf Denkmal (Stein 600, Werkzeug 240) und Ziel 3 (Gewürz), in k4–k6 auf Platz in den Grundketten.

Summe der Leiter 165 400 Geld, 120 Stein, 200 Glas. Höchstens +12 Steuerpunkte. Die Rechts-Namen sind eigene, generische
Begriffe (ADR-006).

### 3.2 Ablauf

1. **Freischalten:** Ab der Weltflagge `won` (Ziel 1, 50 Bürger; `src/sim/defs/tiers.ts:51`, Muster `EDICT_UNLOCK` in
   `src/sim/defs/edicts.ts:38`) zeigt die Rats-Karte den Abschnitt «Stadtrecht». Vorher liefert der Kauf
   `{ ok: false, reason: 'Erst nach dem ersten Ziel' }`.
2. **Kaufen und beschliessen in einem Schritt:** Die Sim-Aktion `buyCharter(world, side)` mit `side ∈ {'A','B'}` bezahlt
   die **nächste** Sitzung k = `charter.length + 1` und hängt die Seite an `world.charter` an. Es gibt keinen Zustand
   «bezahlt, aber unentschieden». Ergebnis `{ ok, reason }`, wirft nie. Gründe in dieser Reihenfolge: «Erst nach dem
   ersten Ziel», «Ungültige Seite», «Stadtrecht vollständig» (k > 6), «Zu wenig Geld», «Zu wenig Stein», «Zu wenig Glas».
   Ein abgewiesener Kauf ändert die Welt nicht.
3. **Bezahlen:** Geld aus der Kasse (`world.money`, nie unter 0), Stein und Glas aus dem Lager der Heimatinsel (`HOME`,
   wie das Denkmal, `src/sim/monument.ts:113`). Der Sperrbestand (I-049) gilt nicht: Er schützt vor Betrieben, nicht vor
   Ausgaben des Spielers (wie Bauen).
4. **Wirkung:** ab dem nächsten Tick reichsweit und bis Partie-Ende, unabhängig von Amtsstube und Edikt (wie der Rat,
   I-112 §3.2.4). Seite A addiert Steuerpunkte auf den wirksamen Satz jeder Stufe:
   `effectiveTaxPct = taxPct(Stufe) − Edikt-Punkte + Stadtrecht-Punkte` (`src/sim/edicts.ts:25-27`). Seite B setzt einen
   Takt-Hebel wie der Rat (`councilCycle`, `src/sim/council.ts:42-46`, Rundung `max(1, ⌊cycle × v / def⌋)`).
5. **Einziger Leseort:** Der Rat-Helfer `activeLever` (`src/sim/council.ts:18-31`) liest die gekauften Sitzungen mit
   (R706 a); die Steuerpunkte liest ein Helfer `charterTaxPoints(world)`. Ohne Kauf liefern beide exakt die heutigen Werte.
6. Kein Rückgängig, kein Unterhalt, kein Zufall; Kauf auch in der Pause (wie I-112 §7).

### 3.3 Bedienung (UI, desktop-first ab 1280 px)

- **Ort:** die bestehende Rats-Karte (`src/ui/councilCard.ts`, Taste Umschalt + R), unter den Ratsbeschlüssen ein
  Abschnitt **«Stadtrecht · Rang k von 6»**. Keine neue Karte, kein Gebäude-Dialog (Amtsstube bleibt für Edikte).
- **Inhalt:** Name der nächsten Sitzung, Kostenzeile «8000 Geld · 20 Stein · 20 Glas» (fehlende Posten hervorgehoben),
  zwei Karten A und B mit Name und Text aus den Defs (Zahl sichtbar), darunter «Gilt für die ganze Partie.» Auswahl
  markiert eine Seite; erst **«Sitzung einberufen»** kauft (Schutz vor Fehlklick). Ist der Knopf gesperrt, steht der
  Grund aus `buyCharterReason` daneben.
- **Liste:** Gekaufte Rechte erscheinen in der bestehenden Liste der Beschlüsse («Marktrecht: Steuer +2 %»).
- **Marke:** «Rat · n» zählt wie bisher nur offene Ratsbeschlüsse. Ist keiner offen und die nächste Sitzung leistbar,
  lautet die Marke «Rat · Stadtrecht» (hervorgehoben). Nach Rang 6 bleibt «Rat» neutral.
- **Hinweis:** einmal im Meldungsweg, wenn die nächste Sitzung leistbar wird («Der Rat kann tagen: Stadtrecht
  leistbar»), abgeleitet aus vorher/nachher wie `councilOpened` (`src/ui/council.ts:52-58`); Laden meldet nichts.

## 4 Rechnung (design-economy-designer, aus Defs, zusammengefasst)

Referenzen (Recherche §1.1): **B** Bürger-Spieler (Steuer 5040/min, Netto +2538/min, i144-rechnung:89-90), **K**
Kaufleute (9180/min, ≈ +3180/min), **K+D** K mit Denkmal zuerst, **G** grosse Stadt (≈ 20 000/min, ≈ +10 100/min, (S)).
A je min = Steuer/min × Punkte/100 (`src/sim/edicts.ts:25-26`).

### 4.1 Wann ist Sitzung k leistbar, wie lange bindet sie Geld (gieriger Kauf)

| Ref | Kauf k1 … k6 (min)                      | bis min 45 / 60 | Kasse gebunden je Sitzung (min Netto, k1 … k6) |
| --- | --------------------------------------- | --------------- | ---------------------------------------------- |
| B   | 15,3 / 18,4 / 23,6 / 32,0 / 45,7 / 68,3 | 4 / 5           | 2,0 / 3,3 / 5,7 / 9,7 / 16,5 / 28              |
| K   | 21,5 / 23,9 / 27,9 / 34,2 / 44,4 / 60,9 | 5 / 5           | 1,6 / 2,7 / 4,6 / 7,7 / 13,1 / 22              |
| K+D | 31,6 / 34,0 / 38,0 / 44,3 / 54,5 / 71,1 | 4 / 5           | wie K                                          |
| G   | 45 / 45 / 45 / 45 / 46 / 52 (S)         | 4 / 6           | 0,5 / 0,8 / 1,4 / 2,4 / 4,1 / 7                |

Kaufzeiten mit den A-Punkten 3/2/3/2/2/2 des Arbeiters; mit flach +2 um < 1 min später (S).

- **Geld ist die Hürde.** Stein (20) ist < 3 % der Kosten; ein Steinbruch liefert 10/min (Takt 60). Glas: K hat mit
  3 Hütten (`tests/sim/balance-merchants.test.ts:55`) genau den Eigenbedarf (36/min), B keine Hütte; 10·k Glas heisst
  also vierte Hütte oder Zukauf à 50 (`src/sim/defs/goods.ts:57`), 500 … 3000 Geld je Sitzung.
- **Erste echte Entscheidung:** K wählt zwischen Denkmal (18 000 Geld plus Güter, `src/sim/defs/monument.ts:7-14`) und
  Stadtrecht; wer das Denkmal zuerst baut, kauft Sitzung 1 rund 10 min später.
- **Senke:** 165 400 Geld ≈ 35–45 min Überschuss (K, B); danach kehrt die Schwemme zurück (Alles-A: K +4465/min ab
  min 61). Die Dauer-Senke bleibt E1 «Wartung».

### 4.2 Wert je Seite (Geld je min)

| k   | B-Wert K / G / Bürger-Stadt                 | A (+2) K / G / Bürger-Stadt | vorn in K / G / B-Stadt  |
| --- | ------------------------------------------- | --------------------------- | ------------------------ |
| 1   | 225 / ≈ 500 / ≈ 75                          | 184 / 400 / 101             | B / B / A                |
| 2   | 0 ausser Denkmal-Phase (≈ 300) / ≈ 450 / 0  | 184 / 400 / 101             | A, B mit Denkmal / B / A |
| 3   | 0 ohne, 360 mit 3 Plantagen / 600 … 840 / 0 | 184 / 400 / 101             | je nach Kolonie / B / A  |
| 4   | 135 + Küstenplatz / ≈ 300 / 108             | 184 / 400 / 101             | A / A / B                |
| 5   | 144 / ≈ 320 / 108                           | 184 / 400 / 101             | A / A / B                |
| 6   | 144 / ≈ 320 / 108                           | 184 / 400 / 101             | A / A / B                |

B-Wert = Mehr-Ausstoss × Zukaufpreis, wo zugekauft wird (Stein 15, Werkzeug 40, Gewürz 40, `goods.ts:11-61`), sonst
gesparte Betriebe × 6 × Unterhalt. k2 (80 → 40) hat lead-design aus dem Arbeiterwert (80 → 50: +4,5/min, 135)
fortgeschrieben: +7,5 Werkzeug/min × 40 ≈ 300, nur solange Werkzeug gebraucht wird (Denkmal, Ausbau; Recherche §6).

- **Kein Paar hat in allen drei Lagen dieselbe Siegerseite**; k2 ist die schwächste Wahl (B nur mit Denkmal-Plan) und
  wird mit E1 stärker.
- **Abweichung vom Arbeiter** (A 3/2/3/2/2/2, Werkzeug 80 → 50): Mit +3 läge A in k1 in allen Lagen vorn
  (275 / 600 / 151 gegen 225 / 500 / 75), eine Scheinwahl. Flach +2 ist einfacher; Werkzeug 80 → 40 trägt den Denkmal-Plan.
- **Fischer 40 → 32** (Entwurf) wäre eine Scheinwahl gewesen (90/min gegen 184), daher 40 → 28; dazu der Küstenplatz
  (15 Fischer nötig, das Layout hat 14, Recherche §2 V2a).
- **Amortisation A** (K): 27 / 46 / 79 / 134 / 227 / 386 min. Ab Sitzung 4 ist das Stadtrecht vor allem Senke und Rang,
  nicht Rendite — gewollt: Der Grenzertrag fällt (Kosten × 1,7, Punkte flach), der Zinseszins läuft nicht davon (Alles-A
  zieht k6 bei B nur von 74 auf 68 min vor).
- **Steuersatz-Summe:** höchstens 100 + 12 = 112 %; mit Sparen 105 %, mit «hoch» 142 % bzw. Kaufleute 127 %
  (`src/sim/defs/tiers.ts:63`). Kein eigener Deckel nötig; der Satz fällt nie unter 0.
- **Takt-Untergrenze:** kleinster neuer Takt 28 (Fischer); `max(1, …)` (`src/sim/council.ts:45`) greift nie.

## 5 Technische Grenze

`activeLever` nimmt je Art und Schlüssel den **ersten** Treffer (`src/sim/council.ts:18-31`): Ein B-Hebel auf ein vom Rat
gehebeltes Gebäude wäre ein bezahlter, wirkungsloser Kauf. Daher B-Hebel disjunkt zu `COUNCIL` (Kriterium 1; gilt auch
für K5).

## 6 Save-Folgen

- **Neues Weltfeld** `charter: ('A' | 'B')[]`, Länge 0 bis 6, Reihenfolge = Sitzung 1 … k. Neue Welt und «Neue Insel»:
  `[]`.
- **Version:** `SAVE_VERSION` heute 18 (`src/sim/save.ts:55`). Stadtrecht nimmt **Stand auf main beim Merge + 1** (R674).
  Auch «Modus Inselproben» plant v18 → v19 (Feld `probe`, Skizze `2026-10-23-tiefe-1-skizzen.md` §6.3); wer zuerst
  merged, nimmt v19, der andere v20.
- **Migration** `migrateV18ToV19`: setzt `charter = []`, wirft nie (Muster `migrateV16ToV17`, `src/sim/save.ts:920-929`).
  Prüfung `isValidCharter`: Array, Länge ≤ Anzahl Sitzungen in den Defs, jedes Element `'A'` oder `'B'`; sonst wird der
  Stand mit dem bestehenden Hinweis abgewiesen, kein Absturz.
- Eine künftige Verlängerung der Leiter (K5, §11) ändert nur die Defs; ein alter Stand mit kürzerer Liste bleibt gültig.

## 7 Balancing-Test-Folgen

- **Referenzläufe bitgleich:** Kein Controller (`tests/sim/controller.ts`, `merchantsController.ts`) ruft `buyCharter`.
  Mit `charter = []` liefern `activeLever` und `charterTaxPoints` die heutigen Werte; alle sieben
  `tests/sim/balance*.test.ts` (u. a. `balance.test.ts`, `-merchants`, `-monument`, `-edicts`) bleiben unverändert grün,
  ohne Neupin.
  Bedingung (Ruling-Entwurf R-1): Das Feld wird nur gesetzt und über die zwei Helfer gelesen.
- Gesetzte Welten prüfen die Hebel (§8); ein Pin eines kaufenden Controllers kommt erst in Etappe 3.

## 8 Abnahmekriterien

Vitest gegen `src/sim/` (`tests/sim/charter.test.ts`, neu):

1. Defs: `CHARTER_SESSIONS` hat 6 Einträge mit Name, Geld, Stein, Glas, Seite A (Punkte, Text), Seite B (Hebel, Text);
   Geld steigt streng; kein B-Hebel trifft ein Gebäude, das `COUNCIL` schon hebelt (Disjunktheit als Test).
2. Neue Welt: `charter` ist `[]`; `buyCharter` vor `won` liefert `ok: false` («Erst nach dem ersten Ziel»), Welt
   unverändert (tiefer Vergleich).
3. Nach `won` mit genug Mitteln: `buyCharter(w, 'A')` liefert `ok`; Geld, Stein und Glas der Heimatinsel sinken genau um
   die Kosten der Sitzung 1; `charter` ist `['A']`.
4. Je fehlendem Posten (Geld, Stein, Glas) ein Fall mit genau 1 zu wenig: `ok: false` mit dem Grund aus §3.2.2, Welt
   unverändert. Ungültige Seite (`'C'`, `undefined`) liefert `ok: false`, wirft nie.
5. Nach sechs Käufen liefert ein siebter `ok: false` («Stadtrecht vollständig»).
6. Steuer: Nach k gekauften A-Seiten ist `effectiveTaxPct` jeder Stufe um die Summe ihrer Punkte höher; mit Edikt Sparen
   gilt `taxPct − 7 + Summe`; ohne Amtsstube wirkt Stadtrecht weiter, das Edikt nicht.
7. Je B-Seite ein Szenariotest auf den wirksamen Takt (Wert aus §3.1) für ein bestehendes und ein danach gebautes
   Gebäude auf einer zweiten Insel; ohne Kauf bzw. mit Seite A gilt der Def-Takt.
8. `buyCharter` prüft keinen Pausenzustand (die Pause lebt in der UI); Sperrbestand Stein 60 auf der Heimatinsel
   hindert den Kauf nicht.
9. Determinismus: Zwei Läufe mit gleichem Seed und gleicher Aktionsfolge inkl. `buyCharter` liefern gleiche Welt-Hashes.
10. Save: Speichern und Laden erhält `charter` für `[]`, `['A']`, `['B','A','B']` und volle Länge; Migration v18 → v19
    setzt `[]`; ein Stand mit `charter` der Länge 7 oder mit `'X'` wird mit Hinweis abgewiesen, kein Absturz.
11. Alle `balance*`-Tests unverändert grün; am Ende jedes Controller-Laufs gilt `charter = []`.

Reine UI-Helfer (`tests/ui/council.test.ts`, erweitert):

12. `charterView(world)` liefert vor `won` nichts; danach Rang, Name, Kostenzeile, zwei Karten mit Defs-Text, Sperrgrund
    oder `null`; nach Rang 6 nur die Liste.
13. `councilBadge` liefert «Rat · Stadtrecht», wenn kein Beschluss offen und die nächste Sitzung leistbar ist; «Rat · n»
    hat Vorrang.
14. `charterBecameAffordable(prev, next)` meldet den Wechsel von nicht leistbar auf leistbar genau einmal; `prev === null`
    meldet nichts.

Browser-Check bei 1280 px (qa-playtester, Screenshots unter `.studio/qa/<paket>/`, Spielstand nach Ziel 1):

15. Rats-Karte zeigt «Stadtrecht · Rang 0 von 6», Kostenzeile und zwei Karten; Auswahl ohne «Sitzung einberufen» ändert
    nichts; bei fehlendem Glas ist der Knopf gesperrt und der Grund sichtbar.
16. Nach dem Kauf: Kasse sinkt um den Betrag, Rang 1, Liste zeigt das Recht, Kopfzeile bleibt einzeilig, auch mit
    «Rat · Stadtrecht».

## 9 Randfälle

- **Glas vor den Kaufleuten:** Sitzung 1 kostet kein Glas; der Bürger-Spieler ohne Glashütte kann nur Sitzung 1 kaufen,
  oder er kauft Glas zu (Zukauf über den Kontor wie heute).
- **Denkmal zieht dieselben Güter:** Denkmal-Abzug (`MONUMENT_PULL_TICKS`) und Kauf greifen auf dasselbe Lager; der Kauf
  ist sofort und vollständig oder gar nicht. Wer beides will, muss Glas planen — gewollte Konkurrenz.
- **Abriss der Amtsstube, Abstieg, Verlust aller Kaufleute:** ohne Folge. Edikt plus Recht: Punkte addieren (§4.2).
- **Takt-Wechsel mitten im Zyklus, Sturm, Ausbaustufen:** wie beim Rat (I-112 §7); Ausbaustufen wirken auf den bereits
  gehebelten Takt (`src/sim/levels.ts:38`).
- **Zweite Insel ohne Lager für Stein/Glas:** zählt nicht; nur die Heimatinsel bezahlt.

## 10 Nicht-Ziele

Kein Rückgängig, kein Unterhalt der Rechte, keine Zufallspaare, keine siebte Sitzung (K5), kein kaufender Controller,
kein neuer Pin, keine Kopplung an Amtsstube oder Edikte, keine neue Grafik, kein Gebäude, keine Änderung der sechs
Ratsbeschlüsse, keine Senkung der Rate (E1 «Wartung»).

## 11 Etappen und Andockstellen

| Etappe | Inhalt                                                                                                  | Grösse    |
| ------ | ------------------------------------------------------------------------------------------------------- | --------- |
| 1 Sim  | `defs/charter.ts`, Weltfeld, `buyCharter` / `buyCharterReason`, Leser in `activeLever` und Steuer, Save | ≈ 5 Tasks |
| 2 UI   | Abschnitt in der Rats-Karte, Marke, Hinweis, README-Spielanleitung                                      | ≈ 3 Tasks |
| 3      | Playtest (B- und K-Spieler, 45 min) und gegebenenfalls Werte-Ruling; optional Pin eines kaufenden Laufs | später    |

- **Erweiterung 1, O8 / K5 Stiftungen:** setzen die Leiter fort (Sitzung 7 ff., × 1,5, nach Ziel 4) statt einer
  zweiten Leiter; ohne Save-Sprung (§6). Abstimmung in der Nutzer-Session Erweiterung 1 (R519).
- **E1 «Wartung»:** Seite B der Sitzung 2 (Werkzeugmacher) gewinnt an Wert, sobald Betriebe Werkzeug verbrauchen.
- **I-186 Ehrenbuch:** Andockstelle «Rang 6 erreicht» bzw. «alle sechs Rechte einer Seite» als Eintrag; liest nur
  `charter`, kein eigenes Feld hier.
- **Inselproben / «Knappe Zeiten»:** Proben nutzen die Grundregeln samt Stadtrecht; ein Szenario kann die Leiter per
  Def-Schalter sperren oder verbilligen. Save-Nummer siehe §6.

## 12 Selbstprüfung Gate Brainstorming

1. **Säule:** Wirtschaft (A, Leiter) und Ketten (B); misslingt es, bleibt eine Scheinwahl ohne Folgeschaden. **OK**
2. **Echte Wahl:** Kein Paar hat in den Lagen K, G und Bürger-Stadt dieselbe Siegerseite (§4.2); dazu die Wahl «Denkmal
   oder Stadtrecht zuerst» (§4.1). k2 ist schwach (B nur im Denkmal-Plan), k4–k6 liegen in K und G bei A (28–36 %
   Vorsprung), in der Bürger-Stadt bei B. **BEDENKEN** — Prüfung im Playtest (Etappe 3), Werte-Ruling statt Neudesign.
3. **Rückkopplung:** Wachstumsmotor mit fallendem Grenzertrag (Kosten × 1,7, Punkte flach); Zinseszins harmlos. Bremse
   ist die Leiter selbst; nach k6 kehrt die Schwemme zurück — gewollt als erster Schritt, Dauer-Senke ist E1. **OK**
4. **Randfälle:** leere Kasse, fehlendes Glas, Denkmal-Konkurrenz ums Lager, Abriss der Amtsstube, Edikt plus Recht,
   Doppel-Hebel mit dem Rat (§5), Save mit voller Liste (§9, Kriterien 2–10). **OK**
5. **Einfacher:** S1 hat keine Wahl; S2 nutzt Karte, Leser und Save-Muster des Rats, eine neue Aktion, A flach +2. **OK**

Gesamt: **OK mit Bedenken** (Frage 2: Gewicht der späten Paare, k2).

## 13 Entscheidungsbedarf (Entwürfe für L0, R471)

- **R-1 Bitgleich:** Kein Controller kauft; `charter` wird nur über `activeLever` und `charterTaxPoints` gelesen. Die
  `balance*`-Tests bleiben ohne Neupin. Empfehlung: so festhalten.
- **R-2 Werte:** Leiter 5000 × 1,7^(k−1), A flach +2, B-Takte laut §3.1; Änderungen nur per Werte-Ruling nach Playtest.
  Empfehlung: annehmen (Abweichung vom Arbeiter in §4.2 begründet).
- **R-3 Save:** Feld `charter`, Version = main beim Merge + 1, Migration setzt `[]`; Kollision mit Inselproben (v19)
  wird beim Merge aufgelöst. Empfehlung: annehmen.
- **Nutzer-Vorbehalt:** keiner (Kernsäule, Genre, Titel unverändert); K5-Hinweis für die Nutzer-Session (R519).
