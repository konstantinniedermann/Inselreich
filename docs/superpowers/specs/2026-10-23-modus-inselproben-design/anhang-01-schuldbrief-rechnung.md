# Anhang 01 · Rechnung Prüf-Szenario «Schuldbrief» (Modus Inselproben)

Stand: 2026-10-23 · Paket `design-INSELPROBEN` · Autor: design-economy-designer · Empfänger: lead-design (Spec
`../2026-10-23-modus-inselproben-design.md`). Alle Werte sind **Vorschläge** für `src/sim/defs/`; nichts unter `src/`
oder `tests/` geändert, keine Testläufe. Gerechnet mit einem Wegwerf-Modell (Scratchpad, nicht im Repo) auf der
gemessenen Controller-Kurve; Schätzungen mit **(S)**.

**Ergebnis vorab:** K0 5000, S0 3000, z 5 ‰ je 100 Ticks, T 18 000 Ticks (30 min), Schritt 500, **keine Pflichtrate**.
Frühestes Bestehen t_ref = **14,5 min** («gemischt»), «erst Endausbau» 16,7 min, «sofort tilgen» 21,3 min. Rang und
Bestehen bleiben bei z ± 50 % und S0 ± 25 % in allen 9 Zellen gleich (Teil g). Zwei Zusatzregeln sind nötig:
**Abriss-Erstattung 0 % bei offener Schuld** und **«Ziel 1 hält»** beim letzten Tilgen (Teil f).

## 0 · Modell und Eingaben

- Kasse Controller ohne Schuld: min 1 2718 · 2 391 · 7 149 · 9 209 · 14 1946 · 15 4427; Sieg Tick 6750 (min 11,25),
  Endausbau min 14, danach +2538/min (`docs/superpowers/specs/2026-10-17-i144-rechnung.md:77-90`).
- Startkasse 5000, Startlager Holz 40, Werkzeug 20, Stein 10, Nahrung 20 (`src/sim/defs/goods.ts:85-97`).
- Ziel 1 = 50 Bürger, `won` bleibt gesetzt (`src/sim/defs/tiers.ts:53`, `src/sim/tick.ts:21`).
- Takt 100 Ticks, 6 je min (`src/sim/defs/timing.ts:4`). Bauen und Zukauf bei Kasse < 0 gesperrt
  (`src/sim/economy.ts:25-40`, `src/sim/trade.ts:115-140`). Abriss erstattet 50 % (`economy.ts:45-52`, `src/sim/build.ts:78-100`).
- Netto-Einkommen vor Bau (S), aus `i144:79-90` und Spätspiel §1.2 zurückgerechnet: min 2 150 · 4–6 565 · 8 1000 · 10
  1800 · 12 2300 · 14 2538 je min.

Modell: Fortschritt `K` = verbautes Kapital, `K_ref(t) = 5000 + ∫Einkommen − Kasse_ref(t)`; Ziel 1 bei `K_win` ≈ 13 500
(S), Endausbau `K_end` ≈ 18 400 (S). Einkommen folgt dem Fortschritt von vor 7/6 min (Bauverzug, so kalibriert, dass
ohne Schuld t = 11,3 min herauskommt; gemessen 11,25). Reserve 150, Rest fliesst in `K`. Zins `ceil(S × z ÷ 1000)`
je Takt; Tilgung in 500ern, wenn Kasse − 150 ≥ Schritt. **Grenze:** Klumpenkäufe (Bürger-Paket min 4–6) sind
geglättet. Richtung und Rang sind belastbar, absolute Zeiten ± 1 min (S). Controller-Lauf mit Schuld gehört ins
Umsetzungspaket.

## a) Vorschlag und Herleitung

| Grösse      | Ist  | Soll                      | Herleitung                                                                                     |
| ----------- | ---- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| K0          | 5000 | **5000**                  | Gleicher Aufbaupfad wie i144; mehr Startgeld würde den Zins verdecken.                         |
| S0          | –    | **3000**                  | 60 % der Startkasse; 2250 gibt zu wenig Wahl, 3750 verlängert Fehlspiel (Teil g, f).           |
| z           | –    | **5 ‰ je 100 Ticks**      | 15 Geld bei S0, 90/min. Muss unter dem kleinsten Tief 117 (min 7, `i144:81`) bleiben (Teil c). |
| T           | –    | **18 000 Ticks (30 min)** | ≥ 1,25 × t_ref = 18,1. Durchschnittsspieler (S) 24 min, 1,25 × 24 = 30.                        |
| Schritt     | –    | **500**                   | Vorgabe; 6 Schritte bis 0.                                                                     |
| Pflichtrate | –    | **keine**                 | «Erst am Ende» gewinnt nicht (Teil d); Rate ≥ 100/Takt (= 600/min) bricht den Aufbau: 26 min.  |

Gesamtzins «gemischt» ≈ 1200 (S), «erst Endausbau» ≈ 1500 (S): Die Wahl kostet echtes Geld.

## b) Kassenkurve der Referenz «gemischt» (Minutenende)

| min  | Kasse ohne Schuld (i144) | Kasse mit Schuld | Fortschritt K | Schuld | Zins/min | Ereignis                |
| ---- | ------------------------ | ---------------- | ------------- | ------ | -------- | ----------------------- |
| 0    | 5000                     | 5000             | 0             | 3000   | –        | Start                   |
| 1    | 2718                     | 75               | 4835          | 3000   | 90       | Startbau                |
| 2    | 391                      | 150              | 4919          | 3000   | 90       |                         |
| 4    | 1048 (S)                 | 150              | 5684          | 3000   | 90       | Spar-Phase              |
| 7    | 149                      | 150              | 7269          | 3000   | 90       |                         |
| 9    | 209                      | 150              | 8491          | 3000   | 90       |                         |
| 11   | 352                      | 150              | 10 514        | 3000   | 90       | letzter Ausbauschritt   |
| 12   | 522                      | 405              | 11 647        | 3000   | 90       | Ausbau stoppt, Tilgen   |
| 13   | 797                      | 633              | 11 647        | 1500   | 45       | 3 Schritte getilgt      |
| 14   | 1946                     | 150              | 12 544        | 0      | 0        | Schuld 0, Ausbau weiter |
| 14,5 | –                        | –                | ≥ 13 500      | 0      | 0        | **bestanden**           |

**t_ref = 14,5 min (8700 Ticks)** gegen 11,3 ohne Schuld. T = 2,07 × t_ref. Durchschnittsspieler (S): Aufbau 1,6 ×
langsamer, «erst Endausbau» → ≈ 24 min, 6 min Spielraum. Mit Bauverzug 1,75 / 2,33 min statt 1,17: t_ref 16,0 / 17,8,
«erst Endausbau» 18,2 / 20,2; T bleibt ≥ 1,5 × t_ref.

## c) Tiefpunkte

Zins/min bei 2,5 / 5 / 7,5 ‰: 45 / 90 / 138. Kasse-Minimum je Minute aus `i144:78,81,83`:

| Tief  | Kasse min | Rest bei 2,5 / 5 / 7,5 ‰ | Urteil                               |
| ----- | --------- | ------------------------ | ------------------------------------ |
| min 2 | 317       | 272 / 227 / 179          | bleibt ≥ 0                           |
| min 7 | 117       | 72 / 27 / −21            | bei 7,5 ‰ wartet ein Kauf ≈ 10 s (S) |
| min 9 | 117       | 72 / 27 / −21            | wie min 7                            |

Der Zins verschiebt Käufe, erzwingt aber kein Minus; im Modell bleibt die Kasse bei z ≤ 7,5 ‰ ≥ 45. K0 muss nicht
steigen. **z nicht über 5 ‰ anheben** ohne neue Rechnung.

## d) Echte Wahl

Wechselpunkt `k` = Anteil des Endausbaus (K ÷ 18 400), ab dem der Spieler tilgt statt baut; nach Schuld 0 baut er bis
Ziel 1 weiter.

| Strategie                              | k     | Bestanden    | Rang |
| -------------------------------------- | ----- | ------------ | ---- |
| S1 «sofort tilgen» (nach Startbau)     | 13 %  | 21,3 min     | 3    |
| S2 «erst Endausbau, dann alles tilgen» | 100 % | 16,7 min     | 2    |
| S3 «gemischt», Optimum                 | 63 %  | **14,5 min** | 1    |
| ohne Schuld (Vergleich)                | –     | 11,3 min     | –    |

| k in %          | 13   | 29   | 45   | 53   | 61   | 70       | 78   | 86   | 94   |
| --------------- | ---- | ---- | ---- | ---- | ---- | -------- | ---- | ---- | ---- |
| bestanden (min) | 21,3 | 17,7 | 15,7 | 14,8 | 14,7 | **14,5** | 15,0 | 15,7 | 16,2 |

Das Optimum ist flach (53–70 % ≤ +0,3 min). «Nie vor dem Endausbau» ist **nicht** die beste (+2,2 min), «sofort»
die schlechteste (+6,8 min). Früh trägt Kapital hoch (+24 bis +146 je Haus und min, Spätspiel §1.2) gegen 3 %/min
Zins; nach Ziel-1-Niveau bringt weitere Investition nur +370/min (2167 → 2538) für ≈ 5000 Kapital, das lohnt gegen
90/min Zins erst nach mehr als 10 min. **Vorbehalt:** bis ≈ 45 % Endausbau ist Bauen ein Pflichtzug; die echte Wahl
liegt im Fenster 45–94 %. Ein zweiter Pfad (Kaufleute nach `won`, +640/min erst ab ≈ min 19, Spätspiel §1.1) greift
bei t_pass ≈ 15 nicht; die zwei Pfade hier sind «früh» und «spät» tilgen.

## e) Geld bindet bis zum Ende

Im Modell liegt die Kasse in 87 von 87 Takten bis zum Bestehen unter 650 (Tilgungsschritt plus Reserve, oder nächstes
Bau-Paket). Min 1–12 deckt sich das mit der Messung (Tiefen 117–2178, `i144:77-88`); min 12–14,5 bindet der
Tilgungsschritt. Anteil «Kasse unter nächstem Posten» ≈ 100 %. Anders als im Grundspiel (+2538/min ab min 14, R722)
gibt es keine Minute ohne Verwendung, weil das Bestehen am Schuldenstand hängt. Der Nachlauf nach dem Bestehen ist
freies Spiel.

## f) Entartungen

- **Abriss-Erstattung.** 50 % von Gebäudekosten (`economy.ts:45`); bei K_win ≈ 6750 (S, Obergrenze, nur Geldanteil)
  grösser als S0 3000, `won` bleibt (`tick.ts:21`). Bestehen bei **11,3 min** statt 14,5, schlägt jede Strategie. Gegenmassnahme:
  Erstattung 0 % solange Schuld > 0 **und** «Ziel 1 hält» (aktuell ≥ 50 Bürger) beim letzten Tilgen. Nur Ketten
  abreissen bringt ≈ 25 % von K (S) ≈ 1700 und kostet Bürger durch Mangel.
- **Startlager verkaufen.** Holz 40 × 4 ≈ 128, Werkzeug 20 × 15 ≈ 270, Stein 10 × 6 ≈ 57, Nahrung 20 × 3 ≈ 54, Abschlag
  1 %-Punkt je Stück (`goods.ts:67`, `trade.ts:84-96`) ≈ 510 (S) = 1 Schritt; Wiederbeschaffung 1510 (`goods.ts:7-23`).
  Verlust ≈ 1000, keine Gegenmassnahme nötig.
- **Steuer «hoch».** 130 % × Belegung 0,75 = 0,975 (`tiers.ts`, TAX_LEVELS), Stufe 4 0,86, Aufstieg gesperrt: Einkommen
  −2,5 %, schadet. «Niedrig» (70 %) bringt nichts.
- **Zins-Spirale.** Zins 90/min gegen Einkommen ≥ 565/min ab min 4 (6,3 fache Deckung). Spirale nur bei Einkommen
  < 90/min, also in den ersten ≈ 2 min oder nach Totalverlust.
- **Fehlinvestition `W`** (Gebäude ohne Ertrag, Unterhalt 3 % je Takt (S)), «gemischt», T 30 min. `W` bei min 3: 500 →
  17,2 min · 1000 → 21,2 · 2000 → **41 (verloren)**; bei min 8: 1000 → 17,2 · 2000 → 21,5 · 3000 → 30,8 (Grenze) ·
  4000 verloren. Verloren ab ≈ 2000 bei min 3 (40 % der Startkasse). Ohne Schuld wirkt `W` 2000 ähnlich (25,7 min,
  Modell). Ausweg ohne Erstattung: nur Frist verstreichen lassen, dann freies Spiel; im Prüfmodus zulässig.

## g) Empfindlichkeit (Hauptkriterium)

Bestanden in min, **S3 / S2 / S1** (gemischt / erst Endausbau / sofort):

| S0 \\ z      | 2,5 ‰ (−50 %)      | 5 ‰                    | 7,5 ‰ (+50 %)      |
| ------------ | ------------------ | ---------------------- | ------------------ |
| 2250 (−25 %) | 13,2 / 15,3 / 17,8 | 13,8 / 16,0 / 18,5     | 14,5 / 16,7 / 19,3 |
| 3000         | 13,7 / 15,8 / 20,2 | **14,5 / 16,7 / 21,3** | 15,8 / 18,0 / 23,0 |
| 3750 (+25 %) | 14,3 / 16,3 / 22,7 | 15,5 / 17,5 / 24,5     | 17,3 / 19,3 / 27,5 |

**Rang S3 < S2 < S1 in 9 von 9 Zellen**, alle 27 Werte ≤ 27,5 min < T. S3 über das Raster 13,2–17,3 min (−9 % / +19 %
gegen 14,5), bei z allein −6 % / +9 %. Kante: z ≈ 10 ‰ bei S0 5000 (S2 32,7, S1 und S3 scheitern); bei S0 3000 erst bei
20 ‰ (15 ‰ noch S3 23,2 min).

## h) Defs-Vorschlag

Neue Datei `src/sim/defs/scenarios.ts`, Block `SCENARIOS.debt`; `START_MONEY` (`goods.ts:85`) bleibt.

| Name               | Wert   | Einheit                | Bemerkung                               |
| ------------------ | ------ | ---------------------- | --------------------------------------- |
| `seed`             | 3      | –                      | Karte                                   |
| `crisisLevel`      | aus    | nach Konvention        | Krisen aus                              |
| `startMoney`       | 5000   | Geld                   | wie Grundspiel                          |
| `debt`             | 3000   | Geld                   | eigenes Feld, nicht in der Kasse        |
| `interestPermille` | 5      | ‰ je `UPKEEP_INTERVAL` | `ceil(Schuld × 5 ÷ 1000)` aus der Kasse |
| `deadlineTicks`    | 18 000 | Ticks                  | 30 min bei 1×                           |
| `repayStep`        | 500    | Geld                   | oder Rest; nur bei Kasse ≥ Betrag       |
| `refundPct`        | 0      | % bei `debt` > 0       | Eingriff bei `economy.ts:45`            |
| `requireWinHolds`  | true   | –                      | Prüfung nahe `tick.ts:21`               |

## Abgrenzung zu I-094

Mängel nach N-101 und `design-i091-i094/docs/superpowers/specs/2026-10-16-i091-i094-rechnung.md` A6: (1) vor U6
Pflichtzug, danach wirkungslos; (2) kleine Zinsänderung kippt das Ergebnis (20 oder 30 % Aufschlag: +3277 gegen
−27 761).

- **Freiwillig vs. fest:** Schuld ist fest, keine Wahl «ob»; Geld bindet bis zum Bestehen (Teil e, ≈ 100 %).
- **Pflichtzug:** besteht **teilweise** fort. Bauen bis ≈ 45 % Endausbau ist nicht verhandelbar (S1 +6,8 min). Echte
  Wahl im Fenster 45–94 % (Spanne 14,5–16,2 min).
- **Wirkung danach:** Tilgen ist selbst das Ziel; der Zeitpunkt entscheidet. S3 gegen S2 −2,2 min (13 %), gegen S1 −6,8.
- **Zinsempfindlichkeit:** z ± 50 % ändert S3 um −6 % / +9 %, Rang in 9 von 9 Zellen unverändert (Teil g).

Das Hauptkriterium ist erreicht; ein Ersatz (zinslose Pflichtrate, «Karge Heimat») ist nicht nötig.

## Ruling-Entwürfe für L0 (`<was> — <warum> — <Kosten bei Irrtum>`)

1. Schuldbrief K0 5000, S0 3000, z 5 ‰, T 18 000, Schritt 500 — Rang stabil 9/9, t_ref 14,5 min, T = 2,07 × t_ref —
   nur Werte in `scenarios.ts`; Nachjustieren nach Controller-Lauf.
2. Erstattung 0 % bei offener Schuld plus «Ziel 1 hält» — sonst Bestehen bei 11,3 min durch Abriss — Fehlspieler
   verlieren den Ausweg «Abriss»; Alternative 25 % ungerechnet.
3. Keine Pflichtrate — S2 gewinnt nicht (16,7 gegen 14,5), Rate ≥ 100/Takt bricht den Aufbau — keine Kosten.
4. Balancing-Test (`tests/sim/balance.test.ts`) bleibt unberührt, solange `SCENARIOS.debt` eigener Block ist.
