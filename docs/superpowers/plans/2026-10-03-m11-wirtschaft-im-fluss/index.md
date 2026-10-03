# M11 „Wirtschaft im Fluss" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Geld fliesst je Tick (Übertrag statt 100er-Schub), ein Defizit dämpft den Aufstieg prospektiv, Nahrung auch
aus Wald (Jagdhütte) und Weide (Rinderfarm), der Holzfäller braucht Wald, Betriebe zeigen Auslastung und
Fortschrittsring und lassen sich auf Stufe 2 und 3 ausbauen — Save v6, Baseline neu gepinnt (R185, R187, R189).

**Architecture:** Die Regel liegt in der Sim. P1: `src/sim/flow.ts` (neu: `goodsBalance`, `upgradeDelta`,
`deficitGood`, `upgradeDeficit`; importiert weder `population.ts` noch `queries.ts`), `src/sim/levels.ts` (neu: `cycleOf`,
`upkeepOf`, `utilization` — einziger Leseort für Zyklus und Unterhalt), Überträge `taxCarry`/`upkeepCarry` in
`tickTaxes`/`tickEconomy`, Typen und Save v6 (`types.ts`, `save.ts` gehören nur P1). P2: Jagdhütte/Rinderfarm,
Regelfeld `free` (`siteRuleOk`), `noForest` live in `tickProduction`, Akkumulator `eff`. P3: `defs/levels.ts` (`LEVELS`),
`src/sim/upgrade.ts` (`upgradeBuilding`, `paidCost`). UI liest nur über `cycleOf`/`upkeepOf`/`utilization`/
`upgradeDeficit`/`upgradeBuilding`; Render über `cycleOf` und `b.level`. Alle Werte und Texte in `src/sim/defs/`.
`step`-Reihenfolge unverändert (ADR-005); Buchung läuft in jedem Schritt statt bei `tick % 100 === 0`.

**Tech Stack:** TypeScript, Vite, Vitest (`node`), Canvas 2D. Keine neue Abhängigkeit (ADR-001), auch keine
Dev-Abhängigkeit. Kein neues ADR (Spielregel, Ruling R185); ADR-005 und arc42 werden nachgeführt (D1).

**Status:** Entwurf zum Gate Plan (Entscheide L0: orga-05 P-1, P-2, P-12). Prozessstufe voll.

**Spec:** `docs/superpowers/specs/2026-10-03-m11-wirtschaft-im-fluss-spec.md` @ `07a45bc` (Branch `docs/m11-design`; Gate
Spec bestanden R189; **75 AK**; im Plan „Spec §n", „AK-…") mit Anhängen 01–03 im Ordner
`…-spec/`. Rulings: R185 (A1–A14), R187 (A15), R189, R74 (Baseline-Abweichung → Meldung an L0). Formvorlage:
`docs/superpowers/plans/2026-10-03-m10-schritt-fuer-schritt/`.

**Testnamen:** Jeder neue Test beginnt mit der AK-Nummer bzw. `RF-<n>` und steht in einem `describe('M11 …')`;
umgeschriebene bestehende Tests tragen im Namen „(M11 S10)" bzw. „(M11 S3)". Abdeckungs-Grep der Reviews:

```bash
npx vitest run --reporter=verbose 2>&1 | grep -oE "M11[^>]*> (AK-[A-Z0-9]+-[0-9]+|RF-[0-9])" | sed -E 's/.*> //' | sort -u
```

## Global Constraints

- **Basis:** `<BASIS>` = `main` nach dem Merge von `docs/m11-design` (Spec und Plan, nur Doku) auf dem Stand des M10-Merges
  (M10 gemergt, Save v5; H-R6 Sprite-Cache seit `4a5130e` auf `main`). Der Controller prüft `git diff --stat 4a5130e main -- src/sim` (leer erwartet; `src/render` darf sich durch H-R7 ändern) und notiert den SHA im
  Ledger `.superpowers/sdd/m11/ledger.md`, bevor der erste Worktree entsteht.
- `src/sim/` bleibt DOM-frei und deterministisch: kein `Date`, kein `Math.random`, Zufall nur über `src/sim/rng.ts`
  (M11 braucht keinen Zufall). Keine Gleitkommazahl im Zustand: `taxCarry`, `upkeepCarry`, `eff` sind Ganzzahlen.
- Sim-Aktionen werfen nie; sie liefern `{ ok, reason }`. `deserialize` wirft nie.
- **Spielwerte und Texte nur in `src/sim/defs/`:** `TAX_UNIT`, `TAX_CARRY_DIVISOR` (`tiers.ts`),
  `UPGRADE_DEFICIT_WAIT_FACTOR`, `EFF_WINDOW`, `EFF_MAX` (`timing.ts`), `hunter`/`cattlefarm` (`buildings.ts`), `LEVELS`
  (`levels.ts`), U2/U3/U5-Einträge und Tipps (`unlocks.ts`). UI-Darstellungskonstanten (`BALANCE_REFRESH_MS`) stehen in
  `src/ui/`.
- **Unverändert gegen `<BASIS>`** (`git diff <BASIS> -- <Pfad>` leer, ausser wo der Task es ausdrücklich nennt):
  `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, `src/sim/defs/goods.ts`, `src/sim/defs/crises.ts`,
  `package.json`, `package-lock.json`. Der Controller baut im Referenzlauf weder Jagdhütte noch Rinderfarm noch aus und
  rodet nie (AK-BAS-05).
- **Baseline bricht bewusst (R185/R187/R189):** Sollwerte Spec 14 (M-01 … M-15). Pins nur in T03 (Neupin) und B1;
  weicht ein Haupt-Pin (M-01 bis M-04, M-07, M-08, M-10, M-11) ab, **nicht nachstellen**, Meldung an L0 (R74).
  M-05 (Gebäudezahlen) und M-06 (Fingerabdruck) sind „Neupin mit Beleg": Messbefehl und Commit stehen im Testkommentar,
  der Wert aus Anhang 03 ist Richtwert. Schwellen bleiben: Sieg ≤ 7500, „normal" ≤ 8000, Ziel 2 ≤ 12 000, Endgeld > 0.
- **Save:** `SAVE_VERSION = 6`; Kette v1 → … → v5 → v6 (`migrateV5ToV6`); Speicherschlüssel `inselreich.save.v1` und
  `inselreich.save.auto` bleiben. Alte Fixtures (`save-v1…v4.json`) laden weiter; neu `save-v5.json` (T00).
- **Importrichtung `src/sim/`:** `flow.ts` importiert weder `population.ts` noch `queries.ts`; `levels.ts` importiert nur
  `./types`, `./defs/*`; kein Importkreis (Test `tests/sim/imports.test.ts` bleibt grün, ggf. erweitern). Lesezugriffe
  auf `def.cycle`/`def.upkeep` in `src/sim/` nur in `levels.ts` (AK-P1-14); Ausnahme: Bauleisten-Tooltip
  (`buildMenu.ts`) und Neubau-Werte in `defs`.
- Kein sichtbarer Text, kein `title`, kein `aria-label` enthält „Tick" (M7:AK-UX-13). Raten „/ min", Kosten im Format
  `costLine`.
- `src/render/` schreibt nie in die Welt; `src/audio/` ändert M11 nicht (Ton `coin` bleibt im 100er-Takt, Spec 3.1).
- Desktop-first ab 1280 px; darunter nur „stürzt nicht ab" (R78).
- **Kein Test fällt weg:** je Testdatei Zahl der `it(`/`test(` nachher ≥ vorher. Zählbefehl je Task:
  `for f in $(git diff --name-only <BASIS> -- tests); do a=$(git show <BASIS>:$f 2>/dev/null | grep -cE "^\s*(it|test)(\.\w+)?\(" ); b=$(grep -cE "^\s*(it|test)(\.\w+)?\(" $f); echo "$f $a -> $b"; done`.
  Geänderte Zeilen in bestehenden Tests nur nach [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md).
- Commits mit Präfix `feat:`, `fix:`, `test:`, `refactor:`, `docs:`; je Task mindestens ein Commit.
- **Push-Pflicht:** nach jedem abgenommenen Commit und jedem grünen Integrations-Merge sofort
  `git -C .worktrees/<strang> push -u origin <branch>`. Kein Pull Request für Zwischenstände.
- **Doku ist Teil jedes Tasks (R190, E-017):** Jede Task-Datei nennt unter „Erwartete Dateien" auch die Doku-Dateien, die der
  Umsetzer ändert (`docs/arc42.md`, `docs/adr/ADR-005-…`, `README.md`, `docs/beobachtungen.md`); Umsetzer dürfen sie ändern.
  Gesammelte Schlussarbeit liegt im eigenen Task D1 (Implementierer `tech-sim-engineer`, kein Lead-Eigenbau; Doku-Ownership in orga-07).
- **Nie rebasen**, auch nicht in Worktrees. Integration nur per `git merge --no-edit <geprüfter SHA>`; im Hauptcheckout
  nur `git pull --ff-only`.
- **Rot-Beleg:** Jeder Task nennt je AK, was vor der Umsetzung rot ist (Test läuft, schlägt mit Meldung X fehl). Ein
  Test, der nie rot war, zählt nicht. Der Implementierer gibt den roten Lauf im Bericht an.

## Review Focus

Zustände, die die Spec impliziert, aber kein AK direkt prüft (jede Zeile hat einen `RF-`Test im genannten Task):

1. **Übertrag über Steuerstufen-Wechsel:** Wechselt `effectiveTaxLevel` (Amtsstube brennt, Ausgabe-/Steuersperre) mitten
   im Übertrag, bleibt `taxCarry` erhalten und bleibt 0 … 19 999; kein Verlust, keine Doppelbuchung. → `RF-1` in T01.
2. **Aufstieg und Buchung im selben Schritt:** Kostet ein Aufstieg in `tickPopulation` Geld, bucht `tickTaxes` danach
   die Steuer des neuen Standes; Geld nach dem Schritt ist ganzzahlig. → `RF-2` in T01.
3. **Dämpfung rechnet `goodsBalance` einmal je Wachstumstakt:** zwischen den Takten keine Berechnung (Zählung per
   Aufruf-Spion über `vi.spyOn` auf dem Modul oder Zähler im Test). → `RF-3` in T02.
4. **Abriss und Neubau am selben Platz:** `eff` und `level` verschwinden mit dem Gebäude; ein Neubau startet mit
   Stufe 1 und Auslastung 100 %. → `RF-4` in T06.
5. **Ausbau im Sturm und bei `noForest`:** Ausbau bucht Kosten und Gebühr, `eff` und `state` bleiben unberührt, solange
   kein Brand läuft. → `RF-5` in T08.
6. **`noForest` und Lager:** ein Holzfäller im Zustand `noForest` füllt kein Lager (kein `storageFull`), der Unterhalt
   läuft; nach Aufforsten läuft `progress` weiter, nicht von 0. → `RF-6` in T05.
7. **Laden mit gespeichertem `noForest`:** Ein v6-Stand mit `state 'noForest'` lädt `ok`; im nächsten Schritt wird der
   Zustand neu bewertet (kein Hängenbleiben). → `RF-7` in T05.

## Task-Tabelle

Datei = Task-Datei in diesem Ordner (je ≤ 10 KB; Teile `a`/`b`, wenn nötig). Strang = Branch/Worktree. Details zu
Rollen, Wellen und Ablauf: [orga-01](orga-01-tasks-pakete-rollen.md), [orga-09](orga-09-wellen-merges.md),
[orga-10](orga-10-ablauf-je-task.md). Abdeckung aller 75 AK: [abdeckung.md](abdeckung.md).

| Task | Titel                                                               | Datei                          | AK-IDs                                                                          | Strang (Branch)         | blocked-by                | Modell |
| ---- | ------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------- | ----------------------- | ------------------------- | ------ |
| T00  | Stufe 0: Fixture `save-v5.json`, Ist-Messung Basis                  | `T00-fixture-messung.md`       | — (Vorbedingung AK-SAV-02, AK-BAS-06)                                           | `feat/m11-sim`          | Gate Plan, M10 gemergt    | sonnet |
| T01  | P1a: Fluss je Tick, Typen, Save v6, Naht `cycleOf`                  | `T01a/b/c-fluss-save.md`       | AK-P1-01, -02, -03, -04, -05, -06, -07, -13; AK-SAV-01, -02, -04, -05; RF-1, -2 | `feat/m11-sim`          | T00                       | sonnet |
| T02  | P1b: Gedämpfter Aufstieg, `flow.ts`                                 | `T02a/b-daempfung.md`          | AK-P1-08, -09, -10, -11, -12, -14; RF-3                                         | `feat/m11-sim`          | T01                       | sonnet |
| T03  | P1c: Umschreiben roter Tests, Neupin Baseline                       | `T03a/b-neupin.md`             | AK-BAS-01, -02, -03, -04, -07; AK-SAV-03; (AK-BAS-06 Review)                    | `feat/m11-sim`          | T02                       | sonnet |
| T04  | P2a: Jagdhütte, Rinderfarm, Regelfeld `free`                        | `T04a/b-quellen.md`            | AK-P2S2-01 … -05; AK-UNL-01, -02, -05                                           | `feat/m11-sources`      | T03                       | sonnet |
| T05  | P2b: Holzfäller braucht Wald (`noForest` live)                      | `T05a/b-wald-live.md`          | AK-P2S3-01 … -04; RF-6, -7                                                      | `feat/m11-sources`      | T04                       | sonnet |
| T06  | P2c: Auslastung `eff`                                               | `T06a-auslastung.md`           | AK-P2S4-01 … -06; RF-4                                                          | `feat/m11-sources`      | T05                       | sonnet |
| T07  | P3a: Ausbau-Kern, `LEVELS` (9 Betriebe), `upgradeBuilding`          | `T07a/b-ausbau-kern.md`        | AK-P3-02, -03, -04; AK-UNL-03                                                   | `feat/m11-upgrade`      | T03                       | sonnet |
| T08  | P3b: Abriss-Erstattung, `deriveUnlocks`, Brand, Kette               | `T08a-ausbau-rest.md`          | AK-P3-05, -06; AK-UNL-04; RF-5                                                  | `feat/m11-upgrade`      | T07                       | sonnet |
| T09  | Integration P2 + P3, `LEVELS` für `hunter`/`cattlefarm`             | `T09-integration.md`           | AK-P3-01, -07; (Prüfung AK-BAS-05)                                              | `feat/m11-sim`          | T06, T08                  | sonnet |
| T10  | UI-1: Kontostand je Frame, Bilanz-Drossel, Zugriffsersatz           | `T10-ui-fluss.md`              | AK-UI-01, -02, -10 (Vitest-Teil)                                                | `feat/m11-ui`           | T03                       | sonnet |
| T11  | UI-2: Betriebs-Panel (Stufe, Auslastung, Ausbau), Mouse-over        | `T11a/b-ui-betrieb.md`         | AK-UI-03, -04, -08, -10 (Browser-Teil)                                          | `feat/m11-ui`           | T09, T10                  | sonnet |
| T12  | UI-3: Haus-Defizit, R161, Bauleiste, Taste, Meldungen               | `T12a/b-ui-haus-bau.md`        | AK-UI-05, -06, -07, -09; AK-R161-01, -02, -03                                   | `feat/m11-ui`           | T11, R1                   | sonnet |
| R1   | Render 1: Fortschrittsring, Marke `noForest`, Tageslicht            | `R1-ring-marke.md`             | AK-RND-03, -04                                                                  | `feat/m11-render`       | T01                       | sonnet |
| R2   | Render 2: Silhouetten, Stufen-Aufsatz `drawLevelTopper`             | `R2-silhouetten.md`            | AK-RND-01, -02, -05                                                             | `feat/m11-render`       | T09, R1, **H-R7 gemergt** | sonnet |
| B1   | Balancing: Fischer-Ausbau-Variante, Szenarien, Endwelt-Prüfung      | `B1a/b-balancing-szenarien.md` | AK-BAS-05; AK-M11B-01, -02, -03                                                 | `feat/m11-scen`         | T09                       | sonnet |
| D1   | Doku: README, arc42, ADR-005-Nachtrag, Spec-Verweise, Beobachtungen | `D1-doku.md`                   | AK-M11B-04                                                                      | `feat/m11-ui` (nach QA) | T12, R2, B1               | sonnet |

Jeder Task endet mit Review (`qa-code-reviewer`, Urteil OK/BEDENKEN/ZURÜCK); UI-Tasks T10 bis T12 zusätzlich Browser-Check
(`qa-playtester`); R1/R2 zusätzlich QA-ART (lead-art mit lead-qa). Review-AKs (AK-P1-14, AK-R161-03, AK-BAS-06,
AK-M11B-03, -04) stehen in [orga-14-qa-uebersicht.md](orga-14-qa-uebersicht.md).

## Orga-Dateien

[orga-01 Tasks, Pakete, Rollen](orga-01-tasks-pakete-rollen.md) · [orga-02 Entscheide](orga-02-entscheide.md) ·
[orga-03 Abweichungen zur Spec](orga-03-abweichungen.md) · [orga-05 Plan-Befunde](orga-05-plan-abweichungen.md) · [orga-06 Schnittstellen](orga-06-schnittstellen.md) ·
[orga-07 Datei-Ownership](orga-07-datei-ownership.md) · [orga-08 Abhängigkeiten extern](orga-08-abhaengigkeiten-extern.md) ·
[orga-09 Wellen und Merges](orga-09-wellen-merges.md) · [orga-10 Ablauf je Task](orga-10-ablauf-je-task.md) ·
[orga-11 Bitgleich und Neupin](orga-11-bitgleich-neupin.md) · [orga-12 Geänderte Tests](orga-12-geaenderte-tests.md) ·
[orga-13 E-010-Controller-Wechsel](orga-13-e010-controller-wechsel.md) · [orga-14 QA-Übersicht](orga-14-qa-uebersicht.md) ·
[orga-15 Streichvariante](orga-15-streichvariante.md) · [orga-16 Budgetantrag](orga-16-budgetantrag.md) ·
[abdeckung.md](abdeckung.md)
