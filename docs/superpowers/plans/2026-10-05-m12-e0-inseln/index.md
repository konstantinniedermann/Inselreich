# M12 Teil E0 „Inseln im Weltzustand" — Implementation Plan (Index)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`)
> syntax. Arbeiter bekommen nur ihre Task-Datei und die AK-IDs, nie diesen Index als Ganzes.

**Goal:** Der Weltzustand lernt „Insel": Raster, Lager und Kontor gehören einer Insel, jedes Gebäude trägt `island`.
Im Spiel gibt es genau eine Insel (Heimat); Save v7 mit `migrateV6ToV7`, Baseline bitgleich, Dienst-Abdeckung als
Filter je Insel und Dienst. Werkzeug-Merge vorab (R226 F-06), kein Release.

**Architecture (≤ 15 Zeilen):**

1. `World.islands: Island[]` (`width`, `height`, `tiles`, `kontorId`, `stock`); alles Übrige global (R-E0-1).
2. `Building.island` Pflichtfeld; `buildings` bleibt eine globale Liste, Ids global, Tick in Id-Reihenfolge (R-E0-2).
3. Zugriff nur über Helfer in `world.ts`: `HOME = 0`, `home(w)`, `islandOf(w, b)`; Raster- und Lager-Helfer nehmen eine
   `Island`, nie die `World` (P-2). Keine Kompatibilitäts-Zugriffe auf `World` (F-S2): der Typprüfer beweist Vollständigkeit.
4. Umstellung in zwei Schritten: erst Helfer auf v6-Form (`home(w)` liefert die Welt selbst, T01/T02), dann Formwechsel
   (T03). Jeder Task endet grün und bitgleich.
5. Save v7: Kette v1 → … → v6 → **v7** → Versionsprüfung → Ladeprüfung → `recomputeConnectivity` → ggf. `deriveUnlocks`.
   `migrateV6ToV7` schreibt reihenfolgetreu um (P-3) und wirft nie (P-4).
6. Inselbezug (T04): Aktionen mit Bauplatz haben `island = HOME` als letzten Parameter, Funktionen mit Gebäude lesen
   `b.island`; Auftrag, Bilanz, Brandziel nur Heimat (R-E0-3); Zählungen global (R-E0-4).
7. Dienst-Abdeckung (T05): neues `src/sim/coverage.ts`; Quellen je Insel und Dienst werden je Aufruf gefiltert,
   `tickPopulation` filtert einmal je Aufruf und reicht `Coverage` durch. Kein Cache über Ticks, nichts im Save (P-6).
8. Doku (T06): ADR-013 „Inselmodell im Weltzustand", arc42 Persistenz, Bausteinsicht, Laufzeitsicht.

**Tech Stack:** TypeScript, Vite, Vitest. Keine neue Abhängigkeit (ADR-001), auch keine Dev-Abhängigkeit.

**Status:** Gate Plan mit BEDENKEN bestanden (**R229**), Plan-Nachtrag R229 eingearbeitet (Abschnitt „Nachtrag R229"). Prozessstufe voll. **Spec:** `docs/superpowers/specs/2026-10-05-m12-weite-welt-spec.md`
§4 mit Anhang 01, Branch `docs/m12-brainstorming` @ **95ed26e** (Auflagen R227 eingearbeitet, in `feat/m12-e0`
gemerged). Rulings: R226, R227, R229, R74. Testnamen beginnen mit der AK-Nummer, `describe('M12 E0 …')`.

## Global Constraints

- **Basis:** `feat/m12-e0` von `main` 020850e (`src/`, `tests/` gleich 17cbafb). Ein Strang, ein Worktree
  `.worktrees/m12-e0`, Parallelität 1. `main` wird nur per **Merge** geholt (Verfassung §6.3), nie Rebase.
- **H-U1 vor T01 (R229 prod-B1):** C1 merged `feat/h-u1-anbinden` @ a852d4a nach T00 und vor T01 in `feat/m12-e0`
  (`src/sim/connect.ts` wird in T01 mit umgestellt). T01 wartet nicht auf REL-03. Merge auf `main`: REL-03
  (H-U1 → S1-Rest → H-R13 → H-R12b) **vor** E0; E0 erst nach REL-03.
- **Bitgleich (4.5):** `OFF_REFERENCE`, `OFF_FINGERPRINT 0x701c6da5`, „normal" + Feuerwache 7850, „mild" 7850,
  `balance-merchants` `[6750, 11200, 320]`, `balance-flow`, `balance-upgrade` unverändert. `git diff main --
tests/sim/balance.test.ts src/sim/defs/` bleibt leer. Weicht ein Pin ab: **nicht nachstellen**, Arbeit anhalten,
  Meldung an Controller → lead-tech → L0 (R74). E0 hat keinen Neupin.
- `src/sim/` DOM-frei, deterministisch; **kein neuer `createRng`-Aufruf**, keine geänderte Eingabe bestehender
  Ziehungen (R-E0-6). Sim-Aktionen werfen nie (`{ ok, reason }`); `deserialize` und alle Migrationen werfen nie.
- **Mechanischer Diff** in `tests/sim/controller.ts` und `tests/sim/merchantsController.ts` (R227): jede geänderte Zeile
  ist ein reiner Zugriffstausch (`w.stock` → `home(w).stock`, Raster-Helfer mit `home(w)`), keine Logik, keine neue Zeile
  ausser Importen. Das Review prüft das Zeile für Zeile.
- Je Task: Test-Commit (rot, Rot-Beleg im Commit-Text) und Umsetzungs-Commit getrennt. `make check` und
  `CI=true make check` grün am Task-Ende. Commit-Präfixe `test:`, `feat:`, `refactor:`, `docs:`.
- Befunde ausserhalb Scope → `docs/beobachtungen.md`. Keine Issues.

## Entscheide des Plans (R227 „im Plan festzulegen")

| Nr.  | Entscheid                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-1  | Zwei Schritte: Helfer auf v6-Form (T01 Sim, T02 Render/UI), dann Formwechsel (T03). Mechanik und Logik getrennt prüfbar.                                                                                                                                                                                                                                                                      |
| P-2  | Helfer-API in `world.ts`: `HOME`, `home`, `islandOf`; `idx`, `inBounds`, `tileAt`, `adjacentOf`, `tilesInRadius` nehmen `Island`; `addStock`, `takeStock` nehmen `Island`; `checkAfford`, `pay`, `grantRefund` nehmen `(world, isl, cost)`. Aktionen mit Bauplatz: letzter Parameter `island = HOME` (T04).                                                                                   |
| P-3  | Schlüsselreihenfolge: `createWorld` = v6-Reihenfolge, `islands` an der Stelle von `width`, die vier anderen entfallen; Gebäude-Literal endet `…, state, island`. `migrateV6ToV7` baut genau diese Reihenfolge (Gebäude: `island` direkt nach `state`). Folge: AK-E0-05 ist mit `serialize` zeichengleich prüfbar, Fold-back ∘ Migration = Identität.                                          |
| P-4  | **B3:** `migrateV6ToV7` wirft nie: `buildings` kein Objekt oder Eintrag kein Objekt → überspringen, die Ladeprüfung entscheidet. Garbage-Test bekommt die Fälle aus T03.                                                                                                                                                                                                                      |
| P-5  | v6-Reste in v7 (`width`, `height`, `tiles`, `kontorId`, `stock` oben) → „Beschädigter Spielstand" (Anhang 01 B, Empfehlung). `kontorId` muss auf `defId 'kontor'` mit `island 0` zeigen (R-E0-5).                                                                                                                                                                                             |
| P-6  | Dienst-Abdeckung ohne Cache über Ticks: `serviceBuildings(world, island, service)` filtert je Aufruf; `tickPopulation` baut `Coverage` einmal und reicht sie an `isSupplied`, `serviceAvailable`, `tryUpgrade`/`upgradeStatus`, `goodsBalance`. Gültig, weil in `tickPopulation` kein Gebäude, `connected` oder `outageUntil` wechselt.                                                       |
| P-7  | **QA 5:** `isSupplied` wird mit derselben Technik beschleunigt und ist Teil von AK-E0-12; Gründe in `queries.ts` (`houseDiagnosis`) und `requiresService` (`production.ts`) ebenso.                                                                                                                                                                                                           |
| P-8  | **B4/QA 8:** Lasttest: Mittel aus einem 1000-Schritt-Lauf ≤ `perfBudget(PIN)`, `PIN = min(6, aufrunden_0,5(1,5 × lokal gemessen))`; Verhältnis aus Minimum von 3 Läufen je Seite, ≥ 5 hart; Timeout `120_000` ms explizit.                                                                                                                                                                    |
| P-9  | Pins „zeichengleich" (AK-E0-02/17) als `fnv1a32` plus Länge der exakten Zeichenkette statt 4 × 200 KB Dateien; Kette (AK-E0-04) über `sortedJson` (R227 QA 1).                                                                                                                                                                                                                                |
| P-10 | **QA 6:** Brand ohne `step`: Beginn `beginCrisis(w, k, { kind: 'fire', tile })`, Ende `w.tick = b.outageUntil!; tickCrises(w)`.                                                                                                                                                                                                                                                               |
| P-11 | **QA 7:** AK-E0-07 prüft **alle** N01–N20 plus N21 (v6-Rest, P-5); Garbage-Test zusätzlich mit den v7-Eingaben aus T03.                                                                                                                                                                                                                                                                       |
| P-12 | **QA 9:** Bestehende Tests mit `version = 7` → „Unbekannte Version" werden auf `8` umgestellt (save.test.ts 102, 408, 534, 793), nicht gelöscht.                                                                                                                                                                                                                                              |
| P-13 | **QA 8:** AK-E0-20: v6-Autosave entsteht im Browser auf `main` mit derselben Origin und demselben Port (`--strictPort`) wie der E0-Build danach.                                                                                                                                                                                                                                              |
| P-14 | **Angenommen mit Auflage (R229):** Fixture `save-v6.json` bei Tick 3000 mit `goodLocks: []`, Glas 0, `upkeepCarry` 0 (per Sim-Aktion nicht anders möglich). T00 erzeugt auf v6-Code einen **zweiten echten Stand** `tests/sim/fixtures/save-v6-locks.json` (`unlockAll`, Amtsstube, `setGoodLock`, `setUpgradeStop`, Glas gekauft); AK-E0-06 lädt ihn. Anhang 01 C gleicht der Spec-Autor an. |
| P-15 | Heimat (R-E0-3): `deliverOrder`, `goodsBalance`, `flammableRect`, `fireTarget` nur Insel `HOME`; `isProtected` nur Wachen derselben Insel; `layoutKey` läuft über alle Inseln ohne Trenner (Wert mit einer Insel unverändert).                                                                                                                                                                |

## Task-Tabelle

| Task | Titel                                              | Datei                                              | AK-IDs                                | blocked-by | Implementierer / Modell                               | Schätzung |
| ---- | -------------------------------------------------- | -------------------------------------------------- | ------------------------------------- | ---------- | ----------------------------------------------------- | --------- |
| T00  | Schritt 0: Fixture, Pins, Zufallsfolge             | [T00-schritt-0.md](T00-schritt-0.md)               | Vorbed. -02/-03/-04/-05/-17; AK-E0-19 | Gate Plan  | tech-sim-engineer / sonnet                            | 35 Tools  |
| T01  | Zugriffshelfer, Umstellung `src/sim` + Sim-Tests   | [T01-helfer-sim.md](T01-helfer-sim.md)             | Vorbed. aller; AK-E0-16 (bleibt grün) | T00        | tech-sim-engineer / sonnet                            | 70 Tools  |
| T02  | Umstellung Render, UI, `perf.mjs` + deren Tests    | [T02-helfer-render-ui.md](T02-helfer-render-ui.md) | Vorbed.; AK-E0-20 (Tests grün)        | T01        | tech-ui-engineer / sonnet                             | 45 Tools  |
| T03  | Form v7, Save v7, Fold-back                        | [T03-form-save-v7.md](T03-form-save-v7.md)         | AK-E0-01 … -09, -17                   | T02        | tech-sim-engineer / sonnet                            | 75 Tools  |
| T04  | Inselbezug je Zugriff                              | [T04-inselbezug.md](T04-inselbezug.md)             | AK-E0-10, -11, -14, -21               | T03        | tech-sim-engineer / sonnet                            | 55 Tools  |
| T05  | Dienst-Abdeckung als Filter, Last                  | [T05-abdeckung-last.md](T05-abdeckung-last.md)     | AK-E0-12, -13, -15                    | T04        | tech-sim-engineer / sonnet                            | 45 Tools  |
| T06  | Abschluss: main-Merge, Proben, Browser-Check, Doku | [T06-abschluss-doku.md](T06-abschluss-doku.md)     | AK-E0-09 (Probe), -16 … -20           | T05        | tech-sim-engineer (Doku, D1) / sonnet + qa-playtester | 35 Tools  |

Je Task danach `qa-code-reviewer` (sonnet, Urteil OK/BEDENKEN/ZURÜCK), ~10 Tools; **Final-Review durch `lead-qa`**
auf **opus** über die ganze Branch (R229 qa-B1; 1 Start von C3 an lead-qa, ~25 Tools). Abdeckung AK → Task: [abdeckung.md](abdeckung.md).

## Datei-Ownership (Strang `feat/m12-e0`, Worktree `.worktrees/m12-e0`)

| Bereich                     | Dateien                                                                                                                                                                                                                                                                   | Task            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Sim (E0 exklusiv bis Merge) | `src/sim/types.ts`, `save.ts`, `world.ts`                                                                                                                                                                                                                                 | T01, T03        |
| Sim (Inselbezug)            | `build.ts`, `economy.ts`, `population.ts`, `supply.ts`, `production.ts`, `queries.ts`, `trade.ts`, `orders.ts`, `upgrade.ts`, `roads.ts`, `crises.ts`, `placement.ts`, `forest.ts`, `flow.ts`; nach H-U1-Merge `connect.ts`                                               | T01, T04, T05   |
| Sim neu                     | `src/sim/coverage.ts`                                                                                                                                                                                                                                                     | T05             |
| Render/UI (nur mechanisch)  | Zugriffsstellen in `src/render/*`, `src/ui/*`, `tools/render-qa/perf.mjs`                                                                                                                                                                                                 | T02 (T06 Merge) |
| Tests                       | `tests/sim/**` (ausser `balance.test.ts`), `tests/render/**`, `tests/ui/**`, neu `tests/sim/islands.test.ts`, `tests/sim/perf.test.ts`, `tests/sim/e0Pins.ts`, `tests/sim/fixtureV6.ts`, `tests/sim/fixtures/save-v6.json`, `tests/sim/fixtures/save-v6-locks.json` (T00) | alle            |
| Doku (D1, E-017)            | `docs/adr/ADR-013-inselmodell-im-weltzustand.md`, `docs/arc42.md`, `docs/index.md` (ADR-Liste)                                                                                                                                                                            | T06             |
| **Nicht anfassen**          | `src/sim/defs/**`, `src/sim/mapgen.ts`, `src/sim/rng.ts`, `src/audio/**`, `tests/sim/balance.test.ts`, `package*.json`, `docs/m12-brainstorming`-Dateien, README                                                                                                          | —               |

## Risiken

- **R-1 Überschneidung REL-03** (`src/render/terrain.ts`, `dunes.ts`, `renderer.ts` DIM_FIRE, `tests/render/terrain*.ts`)
  und **H-U1** (`src/sim/connect.ts` mit 16 Zugriffen, `roads.ts`, `src/ui/app.ts`, `inspect.ts`): H-U1 kommt vor T01 per Merge (R229);
  REL-03 holt der Controller über `main` vor T02, vor T04 und in T06, sobald dort neue Commits liegen; neue Zugriffe aus diesen Branches stellt der
  jeweils nächste Task mechanisch um (Typprüfer zeigt sie ab T03). Konflikte löst der Implementierer im selben Baum.
- **R-2 Fold-back-Reihenfolge** kippt `OFF_FINGERPRINT` wie ein Regelbruch: T03 schreibt zuerst den Eigentest (Fold-back
  von `createWorld(3)` gegen den Schritt-0-Pin), erst danach `normalized()`.
- **R-3 Lasttest im CI:** P-8; kippt es trotzdem, Meldung an L0 statt Schwelle lockern.
- **R-4 v7 unumkehrbar** ab Merge (Pages-Autosaves): Final-Review opus (lead-qa) und AK-E0-20 vor dem Merge-Gate.
- **R-5 Mechanischer Umfang** ≈ 146 Zugriffe `src/`, ≈ 1140 `tests/`: T01/T02 nutzen ein Umstellungsskript im
  Scratchpad (nicht eingecheckt), der Typprüfer (`npx tsc --noEmit`) ist der Vollständigkeitsbeweis ab T03.
- **R-6 Rezept-Abweichung** (P-14): Anhang 01 C verlangt bei Tick 3000 Ausgabesperre, Glas ≠ 0 und `upkeepCarry` ≠ 0;
  die Probe zeigt, dass das per Sim-Aktion nicht geht. Gelöst durch R229 (P-14, `save-v6-locks.json`).

## Steuerung, Controller-Wechsel (E-010, R190) und Budgetantrag

| Instanz (sonnet) | Tasks (Arbeiter-Starts)                                                                         | Starts |
| ---------------- | ----------------------------------------------------------------------------------------------- | ------ |
| C1               | T00 (2), Merge H-U1 @ a852d4a, T01 (2), T02 (2)                                                 | 6      |
| C2               | T03 (2), T04 (2), T05 (2)                                                                       | 6      |
| C3               | T06: Doku-Umsetzer (1) + Review (1), qa-playtester (1), Final-Review an lead-qa (1); Bericht L0 | 4      |

**Übergabe (R190, R229 prod-B3):** je Instanz per Ledger `.superpowers/sdd/m12-e0/ledger.md` (SHAs, Urteile,
Rot-Belege, offene Rulings) und `.studio/handoffs/`. Braucht C1 oder C2 einen **Ersatz-Implementierer** (7. Start),
übergibt die Instanz **vor** diesem Start an eine neue Controller-Instanz; die neue startet den Ersatz.

**Budget (R229):** `7 Tasks × 2 + 1 QA-Check = 15` Starts lead-tech, dazu 1 Start an lead-qa (Final-Review);
freigegeben **lead-tech 20, lead-qa 1**, Reserve 4 (Ersatz-Implementierer, Nach-Review). Fix-Runden per `SendMessage`
zählen nicht. Die Controller-Instanzen startet L0 ausserhalb der Formel. Richtwert **≈ 500 Tools** (Umsetzung 360,
Reviews 70, Playtest 20, Final 25, Steuerung 25).

## Nachtrag R229 (Gate Plan, ohne Zweitprüfung)

| Punkt        | Umsetzung im Plan                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| prod-B1      | H-U1 @ a852d4a per Merge vor T01 (Global Constraints, T01 Schritt 0)                                                 |
| prod-B2      | T06 Doku durch eigenen Umsetzer (`tech-sim-engineer`, D1 erlaubt), mit Review                                        |
| prod-B3      | Übergaberegel bei Ersatz-Implementierer (oben)                                                                       |
| qa-B1        | Final-Review opus durch lead-qa (T06 Schritt 7)                                                                      |
| qa-B2        | Timeout `120_000` für AK-E0-12(a) (T05)                                                                              |
| qa-B3        | Lasttest AK-E0-15 vor der Umsetzung, Platzhalter-Pin 6, rot; danach pinnen (T05)                                     |
| qa-B4        | v6-Autosave für AK-E0-20 vom Spiel auf main (Weg, Haus); Sichtvergleich „Neues Spiel Seed 3" auf beiden Builds (T06) |
| qa-B5        | Fall I16: Wache auf Insel 1 schützt nichts auf Insel 0 (T04, AK-E0-11)                                               |
| P-14 Auflage | `save-v6-locks.json` in T00, AK-E0-06 lädt ihn (T03), Ownership-Zeile Tests                                          |
