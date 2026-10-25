# Anhang 01 — Tabellen je Gebäudetyp (Ausbau-Logik)

Zur Spec [`2026-10-25-ausbau-logik-design.md`](../2026-10-25-ausbau-logik-design.md), Pflichtteil der Spec (E-010).

Spalten: **Stufe** (c Zyklus in Ticks, u Unterhalt je 100 Ticks) · **Bedingung** (Baustoff │ Fachkräfte │ Standort) ·
**Begründung im Spielbild** · **Merkmal** (Vorgabe an lead-art). Wz = Werkzeug, F = Fischerhütte, FW = Feuerwache.
Stufe 1 = heutiger Bau, ohne Dauerbedingung. Kosten, c und u: Rechnung (a); Standort: Rechnung (c).

### Fischerhütte (`fisher`)

| Stufe          | Bedingung                                                                    | Begründung im Spielbild                                               | Merkmal                               |
| -------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| 2 (c 24, u 7)  | 50 Geld, 3 Holz, 1 Wz, Stoff 2 │ Siedler ≤ 8 │ ≤ 1 andere F. d ≤ 2           | Netz aus Tuch, Gesellen flicken es; zwei Hütten teilen den Fischgrund | grosses Netz am Trockengestell        |
| 3 (c 16, u 9)  | 65 Geld, 4 Holz, 2 Wz, 2 Stein, Stoff 2 │ Bürger ≤ 8 │ ≤ 1 andere F. d ≤ 3   | Boot mit Segel fährt weiter hinaus, braucht Steg und Meister          | kleines Segelboot am Steinsteg        |
| 4 (c 12, u 11) | 120 Geld, 6 Holz, 3 Wz, 4 Stein, Stoff 3 │ Kaufleute ≤ 8 │ 0 andere F. d ≤ 3 | grosses Segelboot braucht den Fanggrund allein, Kai und Räucherei     | grosses Segelboot am Kai, Räucherkate |

### Jagdhütte (`hunter`, Höchststufe 3)

| Stufe         | Bedingung                                                          | Begründung im Spielbild                            | Merkmal                      |
| ------------- | ------------------------------------------------------------------ | -------------------------------------------------- | ---------------------------- |
| 2 (c 30, u 7) | 85 Geld, 1 Holz, 1 Wz │ Siedler ≤ 8 │ freier Wald r 3 ≥ 14         | mehr Jäger brauchen mehr Wild, also mehr Wald      | Fellgestell                  |
| 3 (c 20, u 9) | 88 Geld, 2 Holz, 1 Wz, 2 Stein │ Bürger ≤ 8 │ freier Wald r 3 ≥ 18 | Räucherkammer aus Stein; zwei Drittel Wald ringsum | Räucherkammer mit Steinkamin |

### Rinderfarm (`cattlefarm`)

| Stufe          | Bedingung                                                    | Begründung im Spielbild                   | Merkmal                   |
| -------------- | ------------------------------------------------------------ | ----------------------------------------- | ------------------------- |
| 2 (c 12, u 13) | 215 Geld, 8 Holz, 2 Wz │ Siedler ≤ 8 │ freies Gras r 3 ≥ 18  | grössere Herde, Zäune, mehr Weide         | grösserer Stall (Anbau)   |
| 3 (c 8, u 17)  | 248 Geld, 12 Holz, 3 Wz, 4 Stein │ Bürger ≤ 8 │ Gras ≥ 20    | Steinstall, Heuvorrat für die Herde       | Heuschober und Steinstall |
| 4 (c 6, u 22)  | 400 Geld, 16 Holz, 4 Wz, 8 Stein │ Kaufleute ≤ 8 │ Gras ≥ 22 | Stallhof mit Tränke, fast die ganze Weide | Melkhaus                  |

### Holzfäller (`lumberjack`)

| Stufe         | Bedingung                                          | Begründung im Spielbild                  | Merkmal                          |
| ------------- | -------------------------------------------------- | ---------------------------------------- | -------------------------------- |
| 2 (c 18, u 7) | 85 Geld, 1 Wz │ Siedler ≤ 8 │ freier Wald r 2 ≥ 4  | Sägen und Gesellen, Bäume in Griffweite  | Sägebock, grösserer Holzstapel   |
| 3 (c 12, u 9) | 88 Geld, 1 Wz, 2 Stein │ Bürger ≤ 8 │ Wald ≥ 6     | Sägegrube auf Steinfundament am Waldrand | Langholzschuppen auf Steinsockel |
| 4 (c 9, u 11) | 120 Geld, 2 Wz, 3 Stein │ Kaufleute ≤ 8 │ Wald ≥ 8 | Sägewerk mitten im Wald                  | Sägehalle mit Langholzlager      |

### Steinbruch (`quarry`)

| Stufe          | Bedingung                                                      | Begründung im Spielbild                       | Merkmal                      |
| -------------- | -------------------------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 2 (c 36, u 13) | 135 Geld, 5 Holz, 2 Wz │ Siedler ≤ 8 │ Gebirge r 2 ≥ 3         | Gerüst und Keile an einer Abbaufront          | Hebebaum/Kran                |
| 3 (c 24, u 17) | 148 Geld, 8 Holz, 3 Wz, 3 Stein │ Bürger ≤ 8 │ Gebirge ≥ 4     | gemauerte Rampe an einer vollen Felskante     | Steinmetzhütte, Quaderstapel |
| 4 (c 18, u 22) | 250 Geld, 12 Holz, 4 Wz, 4 Stein │ Kaufleute ≤ 8 │ Gebirge ≥ 6 | Kran in einer Felsbucht, Fels auf zwei Seiten | Lore auf Schiene             |

### Schäferei (`sheepfarm`)

| Stufe          | Bedingung                                                    | Begründung im Spielbild       | Merkmal                      |
| -------------- | ------------------------------------------------------------ | ----------------------------- | ---------------------------- |
| 2 (c 30, u 13) | 165 Geld, 5 Holz, 1 Wz │ Siedler ≤ 8 │ freies Gras r 3 ≥ 8   | Pferch, grössere Herde, Weide | Scherschuppen                |
| 3 (c 20, u 17) | 188 Geld, 8 Holz, 2 Wz, 3 Stein │ Bürger ≤ 8 │ Gras ≥ 12     | Steinscheune für die Wolle    | Wollspeicher auf Steinsockel |
| 4 (c 15, u 22) | 250 Geld, 12 Holz, 3 Wz, 6 Stein │ Kaufleute ≤ 8 │ Gras ≥ 16 | Hof mit gemauertem Pferch     | steinerner Pferch            |

### Zuckerrohrplantage (`canefarm`)

| Stufe          | Bedingung                                                    | Begründung im Spielbild        | Merkmal              |
| -------------- | ------------------------------------------------------------ | ------------------------------ | -------------------- |
| 2 (c 30, u 13) | 165 Geld, 5 Holz, 1 Wz │ Siedler ≤ 8 │ freies Gras r 3 ≥ 8   | Bewässerungsgraben, mehr Feld  | Erntekarren          |
| 3 (c 20, u 17) | 188 Geld, 8 Holz, 2 Wz, 3 Stein │ Bürger ≤ 8 │ Gras ≥ 12     | Rohrpresse aus Stein           | Rohrpresse aus Stein |
| 4 (c 15, u 22) | 250 Geld, 12 Holz, 3 Wz, 6 Stein │ Kaufleute ≤ 8 │ Gras ≥ 16 | Hof mit Speicher für die Ernte | Speicher             |

### Weberei (`weaver`, keine Standortregel)

| Stufe          | Bedingung                                                | Begründung im Spielbild        | Merkmal                                   |
| -------------- | -------------------------------------------------------- | ------------------------------ | ----------------------------------------- |
| 2 (c 30, u 20) | 190 Geld, 8 Holz, 2 Wz │ Siedler ≤ 8                     | zweiter Webstuhl, Gesellen     | zweiter Webstuhl unter Vordach            |
| 3 (c 20, u 26) | 210 Geld, 12 Holz, 3 Wz, 4 Stein │ Bürger ≤ 8            | Steinhalle, Meister            | Tuchbahnen am Trockengestell, Steinsockel |
| 4 (c 15, u 33) | 300 Geld, 16 Holz, 4 Wz, 6 Stein, Glas 3 │ Kaufleute ≤ 8 | Manufaktur mit hellen Fenstern | Fensterreihe (Glas)                       |

### Werkzeugmacher (`toolmaker`, Schule in Reichweite wie heute auf jeder Stufe)

| Stufe          | Bedingung                                                     | Begründung im Spielbild       | Merkmal                         |
| -------------- | ------------------------------------------------------------- | ----------------------------- | ------------------------------- |
| 2 (c 48, u 33) | 190 Geld, 8 Holz, 2 Wz │ Siedler ≤ 8                          | Werkbank, Gesellen            | Amboss vor der Tür              |
| 3 (c 32, u 43) | 210 Geld, 12 Holz, 3 Wz, 4 Stein │ Bürger ≤ 8 │ FW            | gemauerte Esse, offenes Feuer | Esse mit hohem Steinschornstein |
| 4 (c 24, u 55) | 300 Geld, 16 Holz, 4 Wz, 6 Stein, Glas 3 │ Kaufleute ≤ 8 │ FW | Hammerwerk mit Fenstern       | Hammerwerk mit Glasfenstern     |

### Brennerei (`distillery`)

| Stufe          | Bedingung                                                     | Begründung im Spielbild           | Merkmal                               |
| -------------- | ------------------------------------------------------------- | --------------------------------- | ------------------------------------- |
| 2 (c 30, u 26) | 265 Geld, 8 Holz, 2 Wz, 3 Stein │ Siedler ≤ 8                 | Kupferkessel                      | grösserer Kessel                      |
| 3 (c 20, u 34) | 278 Geld, 12 Holz, 3 Wz, 6 Stein │ Bürger ≤ 8 │ FW            | gemauerter Brennofen, Brandgefahr | hoher Steinschornstein, Fässerstapel  |
| 4 (c 15, u 44) | 350 Geld, 16 Holz, 5 Wz, 8 Stein, Glas 4 │ Kaufleute ≤ 8 │ FW | Glaskolben und Fenster            | zweiter Kessel, Glaskolben im Fenster |

### Glashütte (`glassworks`)

| Stufe          | Bedingung                                                      | Begründung im Spielbild          | Merkmal                  |
| -------------- | -------------------------------------------------------------- | -------------------------------- | ------------------------ |
| 2 (c 30, u 33) | 340 Geld, 10 Holz, 3 Wz, 5 Stein │ Siedler ≤ 8                 | zweiter Schmelztiegel            | zweiter Ofenkegel        |
| 3 (c 20, u 43) | 315 Geld, 15 Holz, 5 Wz, 10 Stein │ Bürger ≤ 8 │ FW            | grösserer Steinofen, Brandgefahr | hoher Steinschornstein   |
| 4 (c 15, u 55) | 450 Geld, 20 Holz, 6 Wz, 12 Stein, Glas 4 │ Kaufleute ≤ 8 │ FW | eigenes Fensterglas, Schauraum   | grosse Fenster/Schauraum |
