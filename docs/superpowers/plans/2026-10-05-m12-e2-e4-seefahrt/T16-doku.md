> **Task-ID:** T16 · **AK-IDs:** Auflage B5 (ADR-005-Nachtrag `tickShips`), Spec §9.3 (Doku je Teil), Anhang 05 F
> (README „Ziel"), Anhang 05 J.4
> **blocked-by:** T15 · **Strang:** int, `.worktrees/m12-see` · Doku-Umsetzer `tech-sim-engineer` (sonnet), D1-Dateien
> ausdrücklich erlaubt (E-017)

## T16: Abschluss — ADR-005-Nachtrag, arc42, README, Beobachtungen

**Ziel:** Doku folgt dem Code: Tick-Reihenfolge mit `tickShips`, Save v9, neue Module, Bedienung und Werte im README.

**Dateien (D1):** `docs/adr/ADR-005-*.md` (Nachtrag), `docs/arc42.md`, `README.md`, `docs/beobachtungen.md`. Kein
Code.

## Schritte

- [ ] **1 ADR-005-Nachtrag „Tick-Reihenfolge mit `tickShips`"** (Auflage B5, J.4): neue Reihenfolge
      `tickProduction → tickShips → tickPopulation → tickTaxes → tickEconomy → tickMarket → tickOrders → tickCrises →
checkWin → tickUnlocks`; Begründung (Ladung, die ankommt, deckt den Bedarf desselben Schritts; ganzzahlig, ohne
      Zufall; Reihenfolge `id`); `checkWin` prüft das dritte Ziel nach `wonMerchants`, rein lesend; `step` liefert
      `StepReport` (nicht im Save, P-3); Folgen und Alternativen (Schiffe nach dem Verbrauch: eine Periode Verzug).
- [ ] **2 arc42:** Bausteinsicht (`ships.ts`, `goal3.ts`, `render/shipLane.ts`, `ui/activeIsland.ts`, `ui/ships.ts`,
      `ui/islandJump.ts`); Laufzeitsicht (Tick mit `tickShips`, Mermaid-Diagramm ohne `\n` in Labels); Persistenz
      (Save v9: Felder, Migration v8 → v9 mit Übergangsbestand, Ladeprüfung v9, Kette v1 … v9); Querschnitt
      „Lager je Insel, Sättigung global, Brand über alle Inseln".
- [ ] **3 README:** Seefahrt (U6, Kontor II mit Kosten aus der Heimat, Bauen auf Fremdinseln, Lagerleiste je Insel,
      Tasten `0`/`9`, Knopf „Inseln"); Gewürz (Plantage nur auf Gewürzinseln, Kauf 40/Verkauf 12, Kaufleute 0,1 je EW,
      Steuer 22); Schiffe (Kauf, Ladung 50, höchstens 4, Route in 2 Klicks, Reserve, Auflösen, Ausmustern); Abschnitt
      „Ziel": drittes Ziel statt „danach spielst du frei weiter" (Anhang 05 F), U6-Meldungstext zitiert.
- [ ] **4 Beobachtungen:** prüfen, ob „Geldschwemme ab Kaufleuten" (R238) und „unversorgte Häuser auf Fremdinseln"
      (Anhang 03 C.12) eingetragen sind; fehlt einer, ergänzen (Datum, Fundort, Beobachtung, Ursprung, Einschätzung).
      **prod-B3:** Befunde ausserhalb Scope stehen während der Umsetzung nur in den Strang-Ledgern
      (`/Users/KN/CAS/projekte/anno-clone/.superpowers/sdd/m12-see/<strang>.md`); T16 überträgt sie gesammelt (keine Konflikte am Dateiende), dazu „Plan E0 P-2 nennt
      Helfer in `world.ts`, umgesetzt in `economy.ts` (nur Doku)".
- [ ] **5 Prüfen:** Prettier über alle Doku-Dateien; Links prüfen; Commit `docs: M12 Seefahrt ADR-005-Nachtrag,
arc42, README`.

**Review-Fokus:** Doku stimmt mit Code (Tick-Reihenfolge aus `tick.ts` abgeschrieben, nicht aus dem Plan); Werte im
README aus `src/sim/defs/`; keine Versprechen zu E5/E6.
