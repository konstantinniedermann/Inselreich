> **Task-ID:** B1 (Paket M11-B1) — Teil 2 von 2
> **AK-IDs:** AK-M11B-02, -03 (dazu AK-BAS-05, AK-M11B-01 in Teil 1)
> **blocked-by:** T09 (Review OK)
> **Strang:** `feat/m11-scen` · Worktree `.worktrees/m11-scen`
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-12](orga-12-geaenderte-tests.md) · [orga-14](orga-14-qa-uebersicht.md)
> **Teile:** [B1a-balancing-szenarien.md](B1a-balancing-szenarien.md) · **B1b-balancing-szenarien.md** (diese)

- [ ] **Schritt 1 (Fortsetzung): Szenarien** in `tests/sim/scenarios.ts` (Muster M10: `baseWorld`, `m10Base`, `put`,
      `settledHouse`, `smallColony`; Seed 3). Koordinaten relativ zum Kontor `(kx, ky)`; Rechnungen siehe Risiken.

| Name          | Bau (Anhang 02 F)                                                                                                                                                                                                                                | `unlocked`                        | Prüfpunkte `[dx, dy]`                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `m11-fluss`   | `createWorld(3)`, `startColony`, `runColony(…, (x) => x.tick >= 3000)` (Krisen aus)                                                                                                                                                              | aus dem Lauf (gemessen U0, U2–U4) | `kontor [0,0]`, `haus [3,-2]`                                                                        |
| `m11-wald`    | `baseWorld()`, `roadRow(kx+2 … kx+14, ky)`; Wald `kx+4 … kx+8 × ky-3 … ky-2` (genau 10 frei im Radius 3); `put hunter (kx+6, ky-1)`; Wald `(kx+12, ky-2)`; `put lumberjack (kx+12, ky-1)`; Geld 1000                                             | `['U0','U2','U3']`                | `kontor`, `jagdhuette [6,-1]`, `holzfaeller [12,-1]`, `wald-holzfaeller [12,-2]`, `wald-jagd [4,-2]` |
| `m11-ausbau`  | `baseWorld()`, `roadRow(kx+2 … kx+14, ky)`; Wasser `(kx+3                                                                                                                                                                                        | 5                                 | 7, ky-2)`; Fischer `(kx+3                                                                            | 5   | 7, ky-1)`mit`level`–/2/3; Weberei`(kx+9, ky+1)` `level 2`, Schäferei `(kx+11, ky+1)`; Wolle 0, Weberei `state 'waitingInput'`; Stoff 10, Rum 10, Geld 2000 | `['U0','U1','U2','U3','U4','U5']` | `kontor`, `fischer1 [3,-1]`, `fischer2 [5,-1]`, `fischer3 [7,-1]`, `weberei [9,1]`, `schaeferei [11,1]` |
| `m11-defizit` | `m10Base()`; `settledHouse` Stufe 2, 8 EW auf `layout.houses[0]`; Kapelle, Schule auf `layout.chapel`/`.school`; **3 Fischer** auf `layout.fishers[0…2]`, **2 Webereien** auf `layout.farms[0…1]`; keine Brennerei; Rum 40, Nahrung 50, Stoff 30 | `deriveUnlocks` (enthält U4)      | `kontor`, `haus [3,-2]`, `kapelle [6,-2]`, `schule [6,1]`                                            |
| `m11-stein`   | `smallColony()`, `won = true`; `put glassworks (kx+9, ky-2)`; `settledHouse(kx+3, ky-2, 3, 15)`; `stockHouses(w)`; danach Stein 4                                                                                                                | `deriveUnlocks` (enthält U6)      | `kontor`, `haus [3,-2]`, `glashuette [9,-2]`                                                         |

- `m11-fluss`, `m11-wald`, `m11-ausbau` in `KEEP_UNLOCKS` aufnehmen (sonst überschreibt `finishUnlocks` die gesetzten
  Stände); `m11-defizit`, `m11-stein` laufen durch `finishUnlocks`. `PROBES` um die fünf Namen (Muster
  `relativeProbes`, eigene Tabelle `M11_PROBES`); `RAW_SCENARIOS` um die fünf Builder.
- Ausbau-Stufen in `m11-ausbau` direkt setzen (`b.level = 2`): Szenario, keine Aktion; `isWellFormed` prüft `level` gegen
  `LEVELS` (T01/T09).

`tests/sim/scenario-saves.test.ts`, `describe('M11 Szenarien (Anhang 02 F)')`:

```ts
const M11 = ['m11-fluss', 'm11-wald', 'm11-ausbau', 'm11-defizit', 'm11-stein'] as const;
it('AK-M11B-02 die fünf Szenen sind wohlgeformt und überstehen deserialize(serialize(w)) gleich', () => {
  for (const name of M11) {
    const w = SCENARIOS[name]!();
    const r = deserialize(serialize(w));
    expect(r.ok, name).toBe(true);
    if (!r.ok) continue;
    expect(serialize(r.world), name).toBe(serialize(w));
    expect(r.world.crisisLevel, name).toBe('off');
    expect(JSON.stringify(PROBES[name]!(r.world))).not.toMatch(/Tick/);
  }
});
it('AK-M11B-02 Inhalte: Zustände, Stufen, freie Kacheln, Defizit-Gut, Freischaltung', () => {
  // m11-fluss: tick 3000, unlocked enthält U4; m11-wald: Jagdhütte 10 / Holzfäller 1 freie Waldkachel (Zählung wie T04),
  //   beide connected; m11-ausbau: Fischer-Stufen [undefined, 2, 3], weberei level 2 / waitingInput, schaeferei ohne level;
  // m11-defizit: upgradeDeficit(w, haus)?.good === 'rum' (Nahrung und Stoff decken Δ genau bzw. reichlich);
  // m11-stein: upgradeStatus(w, haus).reasons enthält 'Zu wenig Stein', eine Glashütte steht
});
```

**Geänderter bestehender Test** (Name + „(M11 B1)"): `scenario-saves.test.ts` M10 AK-B1-03 „writeProbes schreibt …"
(Ist `:533-541`): `toBe(8)` → `toBe(13)`, Namensliste `[...M10, 'galerie']` → `[...M10, ...M11, 'galerie']`.

- [ ] **Schritt 2: Rot-Beleg (Teil 2).** AK-M11B-02 beide: `TypeError: SCENARIOS[name] is not a function`; writeProbes-Test
      nach dem Einbau der Prüfpunkte `expected 13 to be 8` (vor seiner Umschreibung).
- [ ] **Schritt 3: Umsetzung** wie Tabelle; Prüfpunkt liegt nicht wie in der Tabelle → **nicht verschieben**, melden
      (R137). `SCENARIO_OUT=… npx vitest run tests/sim/scenario-saves.test.ts` schreibt die Saves und `.probes.json` für QA.
- [ ] **Schritt 4: Grün.** `npx vitest run`; `npx tsc --noEmit`; `make check`; Pins unverändert gegen `<T09-SHA>`
      (`git diff <T09-SHA> -- tests/sim/balance.test.ts tests/sim/balance-crises.test.ts tests/sim/balance-merchants.test.ts` leer);
      Testzählbefehl aus index.md.
- [ ] **Schritt 5: Doku und AK-M11B-03 (Review-Checkliste für `lead-qa`, Belege im Bericht):**
  - M-09: T05-Bericht (Pins bitgleich mit `free` am Holzfäller) plus Anhang 03 B (22 Vergleiche).
  - M-13: Anhang 03 A.1 (Steuer +1145,52, Unterhalt 0,00; Anteil 100 % / 0 %).
  - M-14: Anhang 03 C (Szenario nur ohne (b), Tick 4950); Ist-Lauf: `minMoney` 117 bei Tick 4150 (T03-Pin).
  - A13: `OFF_REFERENCE.buildings.distillery` (T03-Pin, erwartet 3) im Bericht nennen, nicht korrigieren.
  - M-15 aus Teil 1. `docs/beobachtungen.md`: die zwei Spec-Lücken unten, falls kein Ruling vorliegt.
- [ ] **Schritt 6: Commit und Push.**

```bash
git add tests/sim/balance-upgrade.test.ts tests/sim/scenarios.ts tests/sim/scenario-saves.test.ts docs/beobachtungen.md
git commit -m "test: M11-B1 Fischer-Ausbau-Variante (M-15), Referenz-Endwelt, Szenarien m11-* (Spec 11.4, Anhang 02 F)"
git -C .worktrees/m11-scen push -u origin feat/m11-scen
```

**Risiken/Randfälle und Spec-Lücken:**

- **`m11-fluss` „Bilanz ≥ +500 je 100 Ticks" ist im Referenzlauf nicht erreichbar:** gemessen (M10-Code, Tick 3000)
  Steuer 224, Unterhalt 160 → **+64**; Höchstwert im Lauf ≈ +315 (Tick 6000). Der Test prüft `stats.taxes −
stats.upkeep > 0`; die Zahl kommt in den Bericht. AK-UI-01 (≥ 10 Änderungen in 2 s) hält bei +0,64 je Tick knapp
  (≈ 13 von 20). Entscheid L0: Tick 3000 lassen oder z. B. Tick 6000.
- **`m11-defizit`:** ohne Nahrung und Stoff wäre `deficitGood` „Nahrung" (erstes Gut in `GOOD_IDS`), nicht „Rum".
  3 Fischer (7,5 − 4,0 = 3,5 = Δ, dämpft nicht) und 2 Webereien (4,0 − 1,6 ≥ 1,4) sind Ergänzung des Plans; Text
  AK-UI-07 X = floor(40 / 3,0 / 6) = 2.
- `m11-wald`: Rechnung wie T04 `hunterSite` (Reihen dy −1, −2, dx −2 … +2); Radius-Scheiben von Hütte und Holzfäller
  überlappen nicht (Abstand 6 > 3 + 2); `baseWorld` erzwingt Gras auf `kx+2 … kx+19 × ky-9 … ky+9`.
- `m11-fluss` läuft den Controller 3000 Schritte je Aufruf (≈ 0,1 s); im Test höchstens zweimal aufrufen.
