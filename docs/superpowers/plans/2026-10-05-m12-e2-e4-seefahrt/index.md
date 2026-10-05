# M12 Seefahrt-Bündel E2+E3+E4 — Implementation Plan (Index)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`)
> syntax. Arbeiter bekommen nur ihre Task-Datei und die AK-IDs, nie diesen Index als Ganzes.

**Goal:** Der Spieler gründet mit U6 auf einer Fremdinsel ein Kontor, baut dort Gewürz an und holt es per
Handelsschiff heim; Kaufleute brauchen Gewürz; drittes Ziel „Gewürzstadt". Ein Merge, **Save v9**.

**Architecture (≤ 15 Zeilen):**

1. **Fundament auf der Integrationsbranch** (T00–T02): Fixture `save-v8.json`, Pins, dann Save v9 mit allen neuen
   Feldern (`spice`, `ships`, `nextShipId`, `wonSpice`, `crisis.tile.island`) und alle Werte aus Anhang 03 A / 05 C
   ausser `TIERS[4]`. Danach ändert kein Strang mehr `types.ts`, `save.ts`, `defs/goods.ts`, `defs/sea.ts`.
2. **Vier Stränge parallel** in eigenen Worktrees: `e2` (Kontor II, Wirtschaft je Insel, danach UI Inseln),
   `e3` (Gewürz/Kaufleute, drittes Ziel Sim + Texte), `e4` (Schiffe, `tickShips`), `render` (Gebäude auf
   Fremdinseln, Schiffe auf der Fahrlinie). Rückfluss nur per Merge in `feat/m12-see` (T14).
3. **Schiffe** (`src/sim/ships.ts`, neu): Aktionen `buyShip`, `retireShip`, `setRoute`, `updateRoute`, `clearRoute`
   liefern `Result`; `tickShips(world)` ganzzahlig, ohne `createRng`, in `step` nach `tickProduction`, vor
   `tickPopulation`. Fahrzeit `laneTicks` aus E1-`seaLanes`, nur bei Abfahrt und Ladeprüfung gerechnet.
4. **Meldungen aus dem Tick** („n Gewürz verloren") über den Rückgabewert `step(world): StepReport`, nicht im Save.
5. **Drittes Ziel** in `checkWin` (rein lesend, nur bei `wonMerchants && !wonSpice`); `goalView` Phase `'spice'`.
6. **Render:** `islandView` bekommt die Gebäude der Insel (flache Kopien mit `island: 0`); Schiffe als bewegte
   Objekte in der Tiefensortierung ihrer Insel oder zwischen den Inseln; reine Mathematik in `src/render/shipLane.ts`.
7. **UI:** aktive Insel = Bildmitte (rein, `src/ui/activeIsland.ts`); Lagerleiste, Bilanz, Auftrag, Bauen und Handel
   je Insel; Schiffs-Abschnitt im Kontor-Panel (`src/ui/ships.ts`), Route in 2 Klicks.

**Tech Stack:** TypeScript, Vite, Vitest, Canvas 2D. Keine neue Abhängigkeit (ADR-001).

**Status:** Entwurf für Gate Plan (lead-qa Testbarkeit, lead-production Budget/Ownership). Prozessstufe voll.
**Spec:** `docs/superpowers/specs/2026-10-05-m12-weite-welt-spec.md` §6–§9 mit Anhang 03 (A–F), Anhang 04 (AK E2–E4,
B1–B5, Auflagen), Anhang 05 (AK-Z3, Auflagen J), Stand `docs/m12-brainstorming` @ **619eea5**. Rulings R226–R231,
R238, R239, R74. Basis-Pläne E0, E1 (`docs/superpowers/plans/2026-10-05-m12-e0-inseln/`, `…-e1-archipel/`).
Testnamen beginnen mit der AK-Nummer, `describe('M12 E2 …')`, `'M12 E3 …'`, `'M12 E4 …'`, `'M12 Z3 …'`.

## Global Constraints

- **Basis:** `feat/m12-see` von `feat/m12-e1` @ acd3dab. Nur **Merge**, nie Rebase, nie Force-Push (Verfassung §6.3).
- **Merge-Fluss:** `main` → `feat/m12-e0` → `feat/m12-e1` → `feat/m12-see` → Teilbranches. `feat/m12-see` merged
  `main` oder `feat/m12-e0` direkt **nur per L0-Ruling**; nach dem E1-Merge auf `main` holt es nur noch `main`.
  Teilbranches holen nur `feat/m12-see`, dazu genau zwei Quer-Merges: `e3` holt `e2` nach T04 (T05, damit der
  vorläufige Neupin die Bilanz je Insel und D-142 enthält), `e2` holt `render` nach T10 (T13). Merge-Punkte unten.
- **Bitgleich (AK-M12-B1, B2, B4):** `git diff main -- tests/sim/balance.test.ts` leer; `OFF_REFERENCE`,
  `OFF_FINGERPRINT 0x701c6da5`, „normal"/„mild" 7850, Zufallsfolge AK-E0-19, `orderForPeriod`- und Brandziel-Pins
  (T00) unverändert. Erlaubt ist nur, dass `normalized()` die v9-Felder entfernt. **Einziger bewusster Bruch:**
  `balance-merchants` und die Pin-Liste Anhang 03 D (nur T05, T14, mit Befehl und Commit). Weicht etwas anderes
  ab: **nicht nachstellen**, anhalten, Meldung Controller → lead-tech → L0 (R74).
- `src/sim/` DOM-frei, deterministisch; **kein neuer `createRng`-Aufruf** im ganzen Bündel (Spione AK-E4-10,
  AK-Z3-08). Sim-Aktionen werfen nie, liefern `{ ok, reason }`; Migrationen und `deserialize` werfen nie.
- Spielwerte nur in `src/sim/defs/` (Ziel-Zahlen 80/600 nie ausserhalb, AK-Z3-01); UI-Texte wie heute in `src/ui/`
  bzw. Gründe in `src/sim/`. `src/render/` schreibt nie in die Welt.
- Je Task: Test-Commit (rot, Rot-Beleg im Commit-Text) und Umsetzungs-Commit getrennt; `make check` und
  `CI=true make check` grün am Task-Ende; Prettier über alle geänderten Dateien. Präfixe `test:`, `feat:`,
  `refactor:`, `docs:`. Befunde ausserhalb Scope → `docs/beobachtungen.md`, keine Issues.

## Entscheide des Plans

| Nr.  | Entscheid                                                                                                                                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-1  | Fundament zuerst, dann Stränge mit getrennten Dateien (Ownership unten). Gemeinsame Dateien (`types.ts`, `save.ts`, `defs/goods.ts`, `defs/sea.ts`, `tests/sim/helpers.ts`, `save.test.ts`) nur in T00–T02 und T14.  |
| P-2  | Schlüsselreihenfolge v9: `World` endet `…, upkeepCarry, ships, nextShipId, wonSpice`; `spice` letzter Schlüssel in jedem `stock` und `sellPct`; `crisis.tile` = `{ x, y, island }`. Migration baut genau diese Form. |
| P-3  | `step(world): StepReport` mit `lost: { ship: number; good: GoodId; n: number }[]` (Spec „Rest verfällt mit Meldung"); nicht im Save, Aufrufer ohne Bedarf ignorieren den Wert.                                       |
| P-4  | Fahrzeit `laneTicks(islands, a, b)` in `islands.ts` (T01) aus `seaLanes`; Lane-Punkte für `a > b` rückwärts. Nie je Tick neu gerechnet.                                                                              |
| P-5  | Brand „untereinander": Teilrechtecke `R_i` in Inselfolge, Gesamt `{ x0: R_f.x0, y0: R_f.y0, x1: R_f.x0 + Wmax − 1, y1: R_f.y0 + ΣH − 1 }`; `rollCrisis` unverändert; Rückrechnung in T04. Nur Heimat → `R_0`.        |
| P-6  | `isKontor(defId)` (`kontor` oder `kontor2`) in `world.ts` (T02) überall, wo „ein Kontor" gemeint ist; Abriss-Sperre des Heimatkontors bleibt `=== 'kontor'`.                                                         |
| P-7  | `islandView(world, i)` liefert für `i ≥ 1` die Gebäude mit `b.island === i` als flache Kopien `{ ...b, island: 0 }` (Ids gleich); Heimat unverändert `=== world`.                                                    |
| P-8  | Neupin zweistufig (Auflage J.2): T05 pinnt `balance-merchants` **vorläufig** (Kommentar „vorläufig T05"); T14 misst nach Einbau aller Teile auf `feat/m12-see` neu — Wert muss gleich sein, sonst R74.               |
| P-9  | Kontor-Panel (Auflage B3): Aufbau nur bei geänderter Struktur (`shipsKey`), je Tick nur Text/Zustand; nie `replaceChildren` je Tick.                                                                                 |
| P-10 | Testwelt-Helfer `tests/sim/seaHelpers.ts` (T02): `SEED_D37` (T00), `foundKontor2Literal`, `shipLiteral`; Szenario Z3 in T06. Helfer schreiben nur Testwelten, nie Saves.                                             |
| P-11 | Offene Spec-Punkte **D-142** (Dämpfung bei Gewürz) und **D-143** (aktive Insel vor U6): umgesetzt wird der L0-Entscheid aus dem Gate Plan, ohne Ruling der Spec-Wortlaut (Details T04, T12).                         |

## Merge-Punkte (E0/E1 → See)

| Punkt | Wann                             | Was                                                                                                    |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| M0    | T00 Schritt 0                    | `git merge docs/m12-brainstorming` (619eea5, nur Doku: Anhang 05), dann `feat/m12-e1` ab **E1-T02 OK** |
| M1    | vor T10 (render) und T12 (e2-UI) | `feat/m12-e1` mit **E1-Final-Review OK** (T08) in `feat/m12-see`, dann in den Strang                   |
| M2    | vor T14                          | `feat/m12-e1` Endstand (bzw. `main`, wenn E1 dort ist), dann Stränge `e2`, `e3`, `e4`, `render`        |

SHA je Punkt = Review-OK-Commit aus `.superpowers/sdd/m12-e1/ledger.md`. Ändert E1 nach M0 noch `src/sim` (Save v8),
merged der Controller neu, T00 erzeugt `save-v8.json` nach demselben Rezept neu und der T01-Reviewer prüft nach.

## Task-Tabelle

| Task | Titel                                             | Datei                                              | AK-IDs (Kurz)                                   | Strang | blocked-by                  | Implementierer / Modell          | Schätzung |
| ---- | ------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------- | ------ | --------------------------- | -------------------------------- | --------- |
| T00  | Schritt 0: Fixture `save-v8.json`, Pins           | [T00-schritt-0.md](T00-schritt-0.md)               | Vorbed. B4, E2-07, E3-04, E3-07, E4-03          | int    | Gate Plan, M0               | tech-sim-engineer / sonnet       | 40 Tools  |
| T01  | Save v9 und Gut Gewürz                            | [T01-save-v9.md](T01-save-v9.md)                   | E3-06, E3-07, Z3-09, B2, B5; B4                 | int    | T00                         | tech-sim-engineer / sonnet       | 70 Tools  |
| T02  | Werte, Bauregeln, Testwelt                        | [T02-werte-regeln.md](T02-werte-regeln.md)         | E2-09, E3-01 (Teil), E3-02 (Platz), Z3-01       | int    | T01                         | tech-sim-engineer / sonnet       | 55 Tools  |
| T03  | Kontor II gründen, bauen, abreissen               | [T03-kontor2.md](T03-kontor2.md)                   | E2-01, -02, -03 (Sim), -12, -13                 | e2     | T02                         | tech-sim-engineer / sonnet       | 55 Tools  |
| T04  | Wirtschaft je Insel, Krisen                       | [T04-wirtschaft-insel.md](T04-wirtschaft-insel.md) | E2-04 … -08, -14                                | e2     | T03, D-142                  | tech-sim-engineer / sonnet       | 60 Tools  |
| T05  | Gewürz und Kaufleute, Neupin vorläufig            | [T05-gewuerz.md](T05-gewuerz.md)                   | E3-01 … -05; B3 (vorl.)                         | e3     | T04 (Merge e2), D-142       | tech-sim-engineer / sonnet       | 65 Tools  |
| T06  | Drittes Ziel: Regel, `goalView`, Szenario         | [T06-ziel3-sim.md](T06-ziel3-sim.md)               | Z3-02 … -08, -10, -13 (Teil)                    | e3     | T05                         | tech-sim-engineer / sonnet       | 55 Tools  |
| T07  | Drittes Ziel: Texte, Banner, U6-Meldung           | [T07-ziel3-texte.md](T07-ziel3-texte.md)           | Z3-11, -12; U1-01, U1-08, RF-4                  | e3     | T06                         | tech-ui-engineer / sonnet        | 30 Tools  |
| T08  | Schiffe: Kauf, Unterhalt, Ausmustern, Routen      | [T08-schiffe-aktionen.md](T08-schiffe-aktionen.md) | E4-01, -02, -07, -16                            | e4     | T02                         | tech-sim-engineer / sonnet       | 50 Tools  |
| T09  | Schiffe: `tickShips`, Umschlag, Auflösen          | [T09-tickships.md](T09-tickships.md)               | E4-03 … -06, -08 … -10, -17 … -19               | e4     | T08                         | tech-sim-engineer / sonnet       | 60 Tools  |
| T10  | Render: Gebäude und Vorschau auf Fremdinseln      | [T10-render-inseln.md](T10-render-inseln.md)       | Vorbed. E2-11, E4-13                            | render | T02, M1                     | tech-ui-engineer / sonnet        | 50 Tools  |
| T11  | Render: Schiffe auf der Fahrlinie                 | [T11-render-schiffe.md](T11-render-schiffe.md)     | E4-12, E4-15                                    | render | T10                         | tech-ui-engineer / sonnet        | 50 Tools  |
| T12  | UI: aktive Insel, Lagerleiste, Tasten, „Inseln"   | [T12-ui-inseln.md](T12-ui-inseln.md)               | E2-10, E2-11; C.11, Gewürz-Chip                 | e2     | T04, M1, D-143              | tech-ui-engineer + qa-playtester | 55 Tools  |
| T13  | UI: Bauen, Handeln, Aufträge auf Fremdinseln      | [T13-ui-bauen-handeln.md](T13-ui-bauen-handeln.md) | Spielweg E2-01…-05; Lade-Meldung (E3-07)        | e2     | T12, T10                    | tech-ui-engineer + qa-playtester | 55 Tools  |
| T14  | Integration: Merge, Querschnitt, Neupin endgültig | [T14-integration.md](T14-integration.md)           | E2-03 (Save), E4-09, E4-11, B1–B5, E3-05, Z3-13 | int    | T04, T07, T09, T11, T13, M2 | tech-sim-engineer / sonnet       | 45 Tools  |
| T15  | UI: Schiffe und Routen im Kontor-Panel            | [T15-ui-schiffe.md](T15-ui-schiffe.md)             | E4-13, E4-14, Z3-14                             | int    | T14                         | tech-ui-engineer + qa-playtester | 60 Tools  |
| T16  | Abschluss: Doku (ADR-005-Nachtrag, arc42, README) | [T16-doku.md](T16-doku.md)                         | Auflage B5, §9.3, Anhang 05 F                   | int    | T15                         | tech-sim-engineer (D1) / sonnet  | 25 Tools  |

Je Task danach `qa-code-reviewer` (sonnet, OK/BEDENKEN/ZURÜCK, ~10 Tools); UI-Tasks T12, T13, T15 zusätzlich
`qa-playtester`. **Final-Review durch `lead-qa`** auf **opus** über `feat/m12-see` (wie R229 qa-B1).
Abdeckung AK → Task und Dateimatrix: [abdeckung.md](abdeckung.md).

## Datei-Ownership (Worktrees)

| Strang · Branch · Worktree                                   | Dateien (exklusiv in der Laufzeit des Strangs)                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Tasks              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| int · `feat/m12-see` · `.worktrees/m12-see`                  | `src/sim/types.ts`, `save.ts`, `world.ts`, `islands.ts`, `placement.ts` (nur T02), `defs/goods.ts`, `defs/sea.ts`, `defs/buildings.ts`, `defs/unlocks.ts`, `defs/tiers.ts` (nur `WIN_SPICE_*`); `tests/sim/helpers.ts`, `seaHelpers.ts`, `fixtures/save-v8.json`, `fixtureV8.ts`, `seePins.ts`, `save.test.ts`, `defs.test.ts`, `unlocks.test.ts`, `balance-crises.test.ts` (nur `normalized`); erschöpfende Tabellen in `src/render/errands.ts`, `overlays.ts`, `src/ui/icons.ts` (nur Einträge) | T00–T02, T14–T16   |
| e2 · `feat/m12-see-e2` · `.worktrees/m12-see-e2`             | `src/sim/build.ts`, `placement.ts`, `world.ts` (nur `checkAfford`), `forest.ts`, `population.ts` (Budget je Insel), `roads.ts`, `supply.ts`, `trade.ts`, `orders.ts`, `flow.ts`, `crises.ts`, `upgrade.ts`; `tests/sim/kontor2.test.ts` (neu), `trade.test.ts`, `orders.test.ts`, `flow.test.ts`, `fire.test.ts`, `storm.test.ts`; ab T12 `src/ui/` ausser `goal.ts`, `ships.ts`, `inspect.ts`-Schiffsabschnitt; `tests/ui/activeIsland.test.ts` (neu) u. a.                                      | T03, T04, T12, T13 |
| e3 · `feat/m12-see-e3` · `.worktrees/m12-see-e3`             | `src/sim/defs/tiers.ts` (`TIERS[4]`), `tick.ts` (nur `checkWin`), `queries.ts` (`goalView`), `src/ui/goal.ts`; `tests/sim/merchantsController.ts`, `spice.test.ts`, `goal3.test.ts` (neu), `scenariosSea.ts` (neu), `merchants.test.ts`, `taxes.test.ts`, `scenario-saves.test.ts`, `balance-merchants.test.ts`, `queries.test.ts`, `fixtures/z3-scenario-v9.json`; `tests/ui/goal.test.ts`                                                                                                       | T05–T07            |
| e4 · `feat/m12-see-e4` · `.worktrees/m12-see-e4`             | neu `src/sim/ships.ts`; `tick.ts` (nur `step`), `economy.ts` (`totalUpkeep`); neu `tests/sim/ships.test.ts`, `ships-rng.test.ts`; `tick.test.ts`                                                                                                                                                                                                                                                                                                                                                  | T08, T09           |
| render · `feat/m12-see-render` · `.worktrees/m12-see-render` | `src/render/archipel.ts`, `renderer.ts`, `ship.ts`, neu `shipLane.ts`, `overlays.ts` (ausser Tabellen); `tests/render/archipel.test.ts`, `renderer.test.ts`, neu `shipLane.test.ts`                                                                                                                                                                                                                                                                                                               | T10, T11           |
| Doku (D1, E-017)                                             | `docs/adr/ADR-005-*.md` (Nachtrag), `docs/arc42.md`, `README.md`, `docs/beobachtungen.md`                                                                                                                                                                                                                                                                                                                                                                                                         | T16                |
| **Nicht anfassen**                                           | `tests/sim/balance.test.ts`, `src/sim/rng.ts`, `mapgen.ts`, `src/audio/**`, `package*.json`; Branches `feat/m12-e0`, `feat/m12-e1`, `docs/m12-brainstorming`                                                                                                                                                                                                                                                                                                                                      | —                  |

`tick.ts` teilen e3 (`checkWin`) und e4 (`step`) in getrennten Funktionen; der Merge in T14 ist textuell getrennt.
Ein Signaturbruch ausserhalb der eigenen Dateien wird nur mit Standardwert behoben (z. B. `island = HOME`), ohne Logik.

## Review Focus (Eingaben, die kein einzelner AK-Test vollständig abdeckt)

- Alte und halbe Stände: Autosave v1 … v8 mitten in Krise oder Auftrag lädt ohne Ausnahme; Migration wirft nie (T01).
- Volles Lager beim Entladen: Rest bleibt an Bord bzw. verfällt nur bei „heim nach Auflösen" mit Meldung (T09).
- Kontor II weg, Schiffe noch unterwegs: Abriss-Sperre, `port` ohne Kontor, Laden danach (T03, T14).
- Spieler ohne Seefahrt: Kaufleute nur per Zukauf versorgt, kein Bankrott, kein drittes Ziel (AK-E3-03, AK-Z3-05).
- Geld < 0 mit Schiffen: Unterhalt läuft weiter, Kauf gesperrt, keine Ausnahme (T08); Tempo 4 mit 4 Schiffen ohne
  Fahrzeit-Neuberechnung je Tick (T09-Review).

## Risiken

- **R-1 E0/E1 nicht fertig:** T00 braucht E1-T02 (Save v8); Render/UI (T10, T12) brauchen E1 komplett (M1). Ändert
  E1 die v8-Form nach M0 → Fixture neu (Rezept bleibt), T01-Nachprüfung. Wählt E1 die Streichvariante
  `ARCHIPEL_VIEW 'jump'`, ist die aktive Insel die gesprungene (T12, ein Aufrufer).
- **R-2 Neupin über 12 000:** Dämpfung (Faktor 2) bei Gewürz-Defizit in der Heimat (D-142) kann `wonMerchantsTick`
  über `MERCHANT_TICK_LIMIT` heben. T05 hält an und meldet; Eskalation (Steuer 24, Grenze 13 000) nur per Ruling.
- **R-3 Merge-Konflikte** in `src/ui/app.ts` (T12/T13 gegen T15) und `tick.ts`: T15 startet erst nach T14 auf der
  Integrationsbranch; `tick.ts` siehe Ownership.
- **R-4 Darstellung** Gewürzplantage, Gewürz-Farbe, Schiff auf See: Platzhalter aus vorhandenen Formen (T02, T11);
  Sichturteil lead-art im Playtest T15 (D-144).
- **R-5 H-I007** (`feastAt`, D-140/141) kommt über `main` → E0 → E1; Ladeprüfung v9 übernimmt das optionale Feld
  unverändert (T01-Reviewer prüft beim Merge M2).

## Steuerung, Controller-Wechsel (E-010, R190) und Budgetantrag

| Instanz (sonnet) | Strang | Tasks (Arbeiter-Starts)                                                     | Starts | ab                  |
| ---------------- | ------ | --------------------------------------------------------------------------- | ------ | ------------------- |
| C1               | int    | T00 (2), T01 (2), T02 (2)                                                   | 6      | Gate Plan, M0       |
| C2               | e2     | T03 (2), T04 (2)                                                            | 4      | T02                 |
| C3               | e3     | Merge `e2` (T04 OK); T05 (2), T06 (2), T07 (2)                              | 6      | T04                 |
| C4               | e4     | T08 (2), T09 (2)                                                            | 4      | T02                 |
| C5               | render | M1; T10 (2), T11 (2)                                                        | 4      | T02, E1 fertig      |
| C6               | e2     | M1; T12 (2 + 1 Playtest), Merge `render`; T13 (2 + 1)                       | 6      | T04, T10, E1 fertig |
| C7               | int    | M2; T14 (2), T15 (2 + 1 Playtest)                                           | 5      | T07, T09, T11, T13  |
| C8               | int    | T16 Doku-Umsetzer (1) + Review (1); Final-Review an lead-qa (1); Bericht L0 | 2 + 1  | T15                 |

C2, C4, C5 starten nach T02 parallel, C3 nach T04, C6 nach T04 und T10 (je ein Worktree, Arbeiter-Parallelität 1 je
Instanz → gesamt höchstens 4: C3, C4, C5, C6). Kritischer Pfad: T00 → T02 → T03 → T04 → T05 → T06 → T07 → T14 → T15 → T16.
**Übergabe:** Ledger `.superpowers/sdd/m12-see/ledger.md` (SHAs, Urteile, Rot-Belege, Pins, Merge-Punkte) und
`.studio/handoffs/`. Braucht eine Instanz einen Ersatz-Implementierer (7. Start), übergibt sie **vor** diesem Start.
**L0 startet die acht Controller-Instanzen ausserhalb der Formel** (wie E0/E1, R231 prod-B4).

**Budgetantrag:** `17 Tasks × 2 + 3 QA-Checks + 1 Final-Review = 38`; × 1,3 = 49,4 → **50 Starts**: lead-tech 49
(geplant 37, Reserve 12 für Ersatz, Nach-Review nach Neu-Merge, Eskalation R-2), lead-qa 1 (Final-Review).
**Parallelität 4** (Stränge e2/e3/e4/render), sonst ≤ 2. Fix-Runden per `SendMessage` zählen nicht. Richtwert **≈ 1100 Tools**
(Umsetzung 880, Reviews 170, Playtests 75 — Steuerung ausserhalb).
