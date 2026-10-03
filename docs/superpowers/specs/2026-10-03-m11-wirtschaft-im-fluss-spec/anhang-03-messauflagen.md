# Anhang 03 — Messauflagen R185 (design-economy-designer, M11-SPEC-W1)

Messkopie von `main` 1c7d587 (`src/` = b702498) im Scratchpad; Repo unverändert. Basis bitgleich
(Ref Seed 3: Sieg 6050, minMoney 57, Fingerabdruck `0xbfeac8c6` = `OFF_FINGERPRINT`). Alle Zahlen sind **[Mess]**, Seed 3, wenn nicht anders genannt.

**Modi** (`MODE_S10`): `base` = alter Takt; `B` = S10 (b) je Tick mit Übertrag; **`S` = Dämpfung exakt nach Spec 3.2**
(Δ[g] = maxEW(Ziel) × Rate Ziel − EW × Rate jetzt, Budget = `goodsBalance` net einmal je Wachstumstakt, jeder
erfolgreiche Aufstieg zieht Δ ab, Defizit bei `budget − Δ < −1e-9`); `P` = Kurzformel der Messprobe
((maxEW(Ziel) − EW) × Rate Ziel, ohne Budget); Faktor `DAMP` (Standard 2; `DAMP=1` = keine Dämpfung); `F` = `free` am
Holzfäller (Bau und live). **Aufruf** in der Messkopie: `MODE_S10=BS DAMP=2 SEEDS=1,2,3,4,5,6
RUNS=ref,normal,mild,merchants npx vitest run tests/sim/messauflagen.test.ts --silent=false`; dazu `CI_TAKT`, `RES`,
`DUMP=1`. `ref` = Krisen aus, `normal` = „normal" + Feuerwache, `merchants` = Kaufleute.

## A Auflage 1: Zerlegung des Bruchs +1200 Ticks

### A.1 Schattenbuchführung im Altlauf (`base`, Ref, Controller unverändert)

Je Tick mitgeschrieben: exakte Steuer Σ(EW × Steuer × Erfüllung) × pct / 10 000 und fälliger Unterhalt, je Fenster
gegen die Buchung gestellt. „Erfüllung" = Häuser im Fenster kurz unerfüllt (halbe Steuer), am Buchungstick erfüllt;
„Belegung/Stufe" = Wachstum (x50, x00) und Aufstiege zählen am Buchungstick fürs ganze Fenster.

| Ticks      | Steuer gebucht | Steuer exakt | Differenz            | davon Erfüllung    | davon Belegung/Stufe |
| ---------- | -------------- | ------------ | -------------------- | ------------------ | -------------------- |
| 1–600      | 395            | 304,90       | +90,10 (29,6 %)      | 0,00               | +90,10               |
| 601–1500   | 1981           | 1888,08      | +92,92 (4,9 %)       | +45,19             | +47,74               |
| 1501–3800  | 5152           | 5152,00      | 0,00                 | 0,00               | 0,00                 |
| 3801–4900  | 3990           | 3702,79      | +287,21 (7,8 %)      | +183,75            | +103,46              |
| 4901–6000  | 5852           | 5176,71      | +675,29 (13,0 %)     | +509,81            | +165,48              |
| **1–6000** | **17370**      | **16224,48** | **+1145,52 (7,1 %)** | **+738,74 (64 %)** | **+406,78 (36 %)**   |

Je Fenster (`DUMP=1`): keines negativ, 34 von 60 ≠ 0, grösste 6000 (+92,12); Wartephase 1501–3800 exakt 0.

Unterhalt fällig = gebucht in jedem Fenster. Bis Tick 6050 (Sieg vor der nächsten Buchung): Steuer +865,52, Unterhalt
−157,50 (nur die 50 ungebuchten Ticks). **Anteil am Unterschied an den Buchungsticks: Steuer 100 %, Unterhalt 0 %.**

### A.2 Umrechnung in Ticks und Verlauf der Verzögerung (`base` → `B`, Ref)

Netto je Tick (Steuer exakt − Unterhalt), Altlauf: 1501–3800 0,616; 3801–4900 1,107; 4901–6000 1,888; Mittel 1–6000
0,872. 1145,52 Münzen ÷ 1,888 = **607 Ticks** (Grenzrate am Ende); ÷ 0,872 = 1314 (Obergrenze).

| Meilenstein                    | `base` | `B`  | Verzögerung |
| ------------------------------ | ------ | ---- | ----------- |
| Schule + erstes Rum-Paar       | 3701   | 3901 | +200        |
| erster Bürger (U5)             | 3850   | 4050 | +200        |
| zweite Brennerei               | 4701   | 5001 | +300        |
| dritte Brennerei               | 5701   | 6301 | +600        |
| drittes Bürgerhaus             | 5850   | 6450 | +600        |
| Sieg (viertes Haus steigt auf) | 6050   | 7250 | +1200       |

Probe: Geldabstand bei 3700 = 2463 − 2322 = 141 Münzen ÷ 0,64/Tick (Wartephase) = 220 Ticks → Takt: +200. Bis zum dritten Bürgerhaus erklärt das Geld die Verzögerung (+600, Grenzrate: 607).

### A.3 Controller-Effekt

**Letzter Aufstieg (Schwelle):** `base` steigt Haus 4 bei Tick 6050 mit der letzten Rum-Einheit auf (Haus 3 erst 12
EW: 15 + 15 + 12 + 8 = 50). In `B` ist das Rum-Lager von 6700 bis 7100 leer („Kein Rum im Lager"), und Werkzeug für den
Aufstieg kauft der Controller nur bei Rum ≥ 1 (`upgradeReserve`); erst die vierte Rumkette (Plantage 7001, Brennerei 7101) löst. Letzter Schritt (drittes Bürgerhaus → Sieg): `base` 200 Ticks, `B` 800 Ticks → **+600 Ticks Schwelleneffekt**.

**Takt und Reserve** (`CI_TAKT`, `RES`; Ref, Sieg `base` / `B`): Reserve 300, Takt 100 / 50 / 25 / 10 / 1 → +1200 /
+1200 / +1150 / +1500 / +1050. Takt 100 mit Reserve 150: 8100 / 7150 (**−950**), mit Reserve 0: 6950 / 7550 (+600).
Der Takt ist **nicht** die Ursache; die Reserve kehrt das Vorzeichen um. Die Münzdifferenz ist regelbedingt, ihre
Grösse in Ticks controllerabhängig.

**Schluss:** Der Bruch hat eine Geldursache: Der alte Takt bucht die Steuer aus dem Zustand am Buchungstick und
schenkt bis Tick 6000 1145,5 Münzen (7,1 % der Steuer; 64 % kurz unerfüllte Häuser, 36 % Wachstum und Aufstieg im
Fenster), der Unterhalt trägt 0,00 bei. Davon erklärt das Geld ≈ 600 der 1200 Ticks (Grenzrate: 607), die übrigen
≈ 600 sind ein Schwelleneffekt des Controllers am letzten Aufstieg (Rum leer, Werkzeugkauf erst bei Rum ≥ 1); die
Aussage im Designvorschlag 3 („Controller-Effekt des Entscheidungstakts") ist damit zu korrigieren.

## B Auflage 2a: A9, `free` am Holzfäller

Regel der Kopie: Wald zählt nur ohne Gebäude und ohne Weg (Bau und Live-Prüfung je Tick; fehlt Wald: kein Fortschritt,
Unterhalt läuft). Die Def hat **Radius 2, min 1** (nicht 3); Radius 3 nur zur Information.

Seed 3, alle Läufe: zwei Holzfäller, gebaut Tick 1, auf (51,26) und (51,31) = kx+19, ky−5 / ky, eigene Kachel Gras;
Wald r = 2 je 3 alle / 3 frei (r = 3: 6 / 6), min 1; Ticks „kein Wald" 0. Seeds 1–6: r = 2 3–4 alle = frei
(r = 3: 5–9), 0 Ticks „kein Wald".

Kleinster freier Wald je Tick: 3. Siegticks, Geldverlauf und rohe Fingerabdrücke mit und ohne `F` **bitgleich** in 22
Vergleichen (`base`/`F`, `B`/`BF` Seed 3; `BP`/`BPF` und `BS`/`BSF` Seeds 1–6). Grund: Waldstreifen kx+20 erzwungen,
Wege enden bei kx+18. **A9 hält: ja**; Variante C nicht nötig, solange der Controller weder rodet noch dort baut.

## C Auflage 2b: minMoney-20-Szenario (A3), Dämpfung nach Spec 3.2

**Spec-Formel gegen Kurzformel:** `BS` und `BP` sind in allen 22 Läufen (Seeds 1–6, ref/normal/mild/merchants) bitgleich
(Siegticks, Geld, Freischalt-Ticks, Fingerabdrücke, 13 auslösende / 3 verzögerte Häuser in Ref). Die Entscheide
weichen nur dreimal ab (Ref, Tick 350, Häuser 3–5, 1→2: Budget Nahrung 0,00 nach dem Aufstieg von Haus 2, Δ 2,0);
diese Häuser scheitern im selben Tick zusätzlich an „Zu wenig Werkzeug". `BS` mit `DAMP=1` ist in allen 22 Läufen
bitgleich zu `B`. Ref und Kaufleute sind wegen `forceTerrain` seedunabhängig. **Grenze:** Kaufleute-Controller scheitert auf Seed 5 und 6 („kein freier Erweiterungsplatz für fisher",
auch in `base`).

**Seed 3 (bindend):** Sieg / minMoney / nach Sieg. Häuser auslösend / verzögert (`S`, `BS`, `BP`): Ref, normal, mild
13 / 3, Kaufleute 17 / 3.

| Modus                           | Ref                  | normal              | mild                | Kaufleute Ziel 1 / Ziel 2 / nach Sieg |
| ------------------------------- | -------------------- | ------------------- | ------------------- | ------------------------------------- |
| `base`                          | 6050 / 57 / 212      | 7050 / 56 / 211     | 6250 / 13 / 40      | 6050 / 10100 / 212                    |
| `S` (Spec, ohne b)              | 6050 / 20 / 268      | 7150 / 29 / 184     | 6250 / 42 / 69      | 6050 / 10100 / 268                    |
| `B` = `BS` Faktor 1             | 7250 / 61 / 250      | 7850 / 57 / 132     | 7750 / 80 / 291     | 7250 / 11300 / 250                    |
| **`BS` Faktor 2 (Spec)**        | **6750 / 117 / 339** | **7850 / 83 / 140** | **7850 / 44 / 367** | **6750 / 11200 / 320**                |
| `BP` Faktor 2 (Kurzformel, alt) | 6750 / 117 / 339     | 7850 / 83 / 140     | 7850 / 44 / 367     | 6750 / 11200 / 320                    |

Schwellen mit `BS`: Sieg ≤ 7500 hält (6750), normal und mild ≤ 8000 halten (je 7850, Abstand 150), Ziel 2 ≤ 12000
hält, Geld > 0 hält.

**Seeds 1–6, Sieg / minMoney** (Ref: alle Seeds wie Seed 3; „> 9000" = kein Sieg bis `MAX_TICKS`; `BS` = `BP`):

| Seed   | normal `base` | normal F1   | normal **F2** | mild `base` | mild F1    | mild **F2**   |
| ------ | ------------- | ----------- | ------------- | ----------- | ---------- | ------------- |
| 1      | 7650 / 13     | 8150 / 64   | > 9000 / 43   | 6550 / 40   | 7250 / 100 | 7350 / 51     |
| 2      | 7850 / 38     | > 9000 / 65 | 7550 / 115    | 6250 / 0    | 8900 / 72  | 7650 / 71     |
| 3      | 7050 / 56     | 7850 / 57   | 7850 / 83     | 6250 / 13   | 7750 / 80  | 7850 / 44     |
| 4      | 8850 / 45     | 8750 / 33   | 8150 / 79     | 6850 / 38   | 8250 / 97  | 7650 / 32     |
| 5      | 8050 / 74     | 7750 / 49   | 8450 / **−6** | 6050 / 46   | 7550 / 88  | 6750 / **20** |
| 6      | 8250 / 2      | 8450 / 66   | 7850 / 45     | 7650 / 19   | 7050 / 129 | 7150 / 57     |
| Mittel | 7950          | 8325        | 8142          | 6600        | 7792       | 7400          |

„> 9000" zählt als 9000. Auslösend / verzögert, `BS` normal: 13, 12, 13, 12, 12, 11 / je 3. Nicht-Siege = Rum-Schwelle
(A.3).

**Das Szenario minMoney 20** (`S` ohne b, alle Seeds Ref, Tick 4950): Controller kauft bei 4900 Werkzeug für den
Aufstieg (595 → 320), der Bürger-Aufstieg bei 4950 kostet 300 → 20, die Steuer kommt erst bei 5000 (+198). Mit (b)
fliesst sie vorher zu: `BS` hat in Ref das Minimum 117 bei 4150. **Das Szenario existiert in Ref nur ohne (b).**

**Faktor 2 unter 30:** Seed 5 normal −6 bei 4800 (Bürger-Aufstieg bei 4750 → 17, ungelöschter Brand, Gebühr „auch ins
Minus", `ignite`; 4810 wieder +2) und Seed 5 mild 20 bei 4150 (Bürger-Aufstieg mit Reserve 300 = Aufstiegskosten).
Tiefe Minima auf fremden Seeds gibt es schon in `base` (Seed 2 mild 0, Seed 6 normal 2).

**Schluss: Faktor 2 beibehalten.** Seed 3: gleich oder besser in Ref, normal und Kaufleute (Sieg −500, minMoney +56,
normal ±0 bei +26, Ziel 2 −100); mild +100 langsamer (min 80 → 44). Über Seeds 1–6 im Mittel schneller (normal −183,
mild −392 gegen Faktor 1). **Empfehlung zu minMoney < 30:** kein Fehler der Dämpfung, sondern Controller-Reserve =
Aufstiegskosten plus Brandgebühr; Pins nur auf Seed 3, kein minMoney-Pin für Krisenläufe (wie heute nur Endgeld > 0).

## D Neu zu pinnende Sollwerte (`BS` = Spec 3.2, Faktor 2, Seed 3)

| Lauf      | Sieg | minMoney (Tick) | nach Sieg / Endgeld | U2  | U3  | U4  | U5   | U6   | Fingerabdruck norm. (roh)   |
| --------- | ---- | --------------- | ------------------- | --- | --- | --- | ---- | ---- | --------------------------- |
| Ref       | 6750 | 117 (4150)      | 339 / 339           | 150 | 350 | 550 | 4150 | 6750 | `0x701c6da5` (`0x599eef72`) |
| normal+FW | 7850 | 83 (5150)       | 140 / 140           | 150 | 350 | 550 | 5150 | 7850 | `0x77c82470` (`0xec23c8d9`) |
| mild      | 7850 | 44 (4250)       | 367 / 367           | 150 | 350 | 550 | 4250 | 7850 | `0x3f76d4bd`                |
| Kaufleute | 6750 | 117 (4150)      | 320 / 2448          | 150 | 350 | 550 | 4150 | 6750 | `0x1b066873`                |

Ref: erste Siedler 350, erste Bürger 4150. Kaufleute: Bürger-Endzustand 8200, erster Kaufmann 9650, **Ziel 2 11200**.
Alle Werte identisch zur Kurzformel (`BP`). Fingerabdrücke ohne Überträge (Save v4); mit Save v6 und A6 neu messen.

**Differenz zu R185 (ausdrücklich):** R185 nennt 7250 / 7850 / 11300; das ist `B` = (b) **ohne** Dämpfung (Faktor 1).
(b) + Dämpfung nach Spec 3.2, Faktor 2, ergibt **6750 / 7850 / 11200** (−500 / ±0 / −100), gleich wie die Kurzformel.
Ursache: Die Dämpfung verzögert Siedler-Aufstiege und Bauliste um 100 Ticks (U5 4050 → 4150, drittes Bürgerhaus
6450 → 6550), aber Haus 4 steigt bei 6750 mit der letzten Rum-Einheit auf; der
letzte Schritt dauert 200 statt 800 Ticks. Die −500 sind dieselbe Controller-Schwelle wie in A.3, kein Regelvorteil.

Zeitbild (600 Ticks/min, alt → neu): U2–U4 gleich (0:15–0:55), U5 6:25 → 6:55, Sieg 10:05 → 11:15, normal 11:45 →
13:05; alles unter 15 Minuten, minMoney 57 → 117.

**Ruling-Vorschläge** (`<was> — <warum> — <Kosten bei Irrtum>`): (1) Pins Seed 3 = Tabelle D statt R185 — R185 nannte
den Lauf ohne Dämpfung — ein Neupinnen. (2) Design 3: Ursache = Steuer am Buchungstick, nicht der Takt — sonst falsche
Gegenmassnahme — eine Textkorrektur. (3) A9 bestätigt, Variante A — 22 bitgleiche Vergleiche — Rückfall C.
