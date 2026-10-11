# M14-E1 Inselcharakter — Implementation Plan (Index)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Felsbucht wird «Gebirge+» (Steinbruch und Glashütte ×2), eine dritte Fremdinsel «Weidenau» kommt dazu
(«Fruchtbar»: Zuckerrohrplantage und Schäferei ×2). Ihre Erzeugung wirft nie, der Spielstand wird v13 mit Migration.
Der Spieler wählt, welche Insel er wofür besiedelt.

**Spec:** [2026-10-10-m14-e1-inselcharakter-design.md](../specs/2026-10-10-m14-e1-inselcharakter-design.md) mit
Anhängen 01–04. Rulings **R500** (Auflagen), **R501** (Nachtrag, AK-11), **R554** (Plan als Vorarbeit).
[ADR-010](../../adr/ADR-010-zufall-je-periode.md), Nachtrag M14-E1.

Prozessstufe **voll** · M14 · Pakete **M14-E1-SIM**, **M14-E1-UI** · **Vergleichsbasis (QA-B3) `main` @ `9113e574`**
(`SAVE_VERSION` 12 → neu 13) · **Umsetzung erst nach dem Release M13** (R554); ein Release-Fix an `main` zieht nur
die Basis nach (T00). Format E-010, jede Datei ≤ 10 KB: [rahmen.md](2026-10-11-m14-e1-inselcharakter/rahmen.md)
(Global Constraints), [ownership.md](2026-10-11-m14-e1-inselcharakter/ownership.md) (Stränge, Ownership, Budget),
[ak.md](2026-10-11-m14-e1-inselcharakter/ak.md) (AK → Task, Auflagen → Task),
[entscheidungen.md](2026-10-11-m14-e1-inselcharakter/entscheidungen.md) (E1–E8, Pin-Inventar, Wertgrenzen, Risiken),
[testzeiten.md](2026-10-11-m14-e1-inselcharakter/testzeiten.md) (R392). Arbeiter und Reviewer lesen nur `rahmen.md`,
ihre Task-Datei und die dort genannten AK und Anhang-Abschnitte.

## Architektur (≤ 15 Zeilen)

1. **Trait-Faktor an einer Stelle (T01):** `cycleOf(world, b)` in `levels.ts` ruft `islandCycle(world, island, defId,
cycle)`; `traitOf` liest den Trait über `world.islands[i].kind` → `ISLANDS`. Kein Save-Feld (R1.6). Produktion,
   Bilanz, Hover, Panel, Ring und Botengänge lesen nur dort.
2. **Defs nur in `defs/sea.ts`:** `TRAIT_CYCLE_PCT`, `TRAIT_BUILDINGS`, `TRAIT_LABELS`, `ISLANDS[1]` (`quarries 3`,
   `mountainRich`), `ISLANDS[2]` Weidenau, Ersatzregel-Konstanten, `GRASS_ONLY_KINDS`.
3. **Weltgenerierung (T02, T03):** C zieht im Strom `ISLANDS_SALT` nach A und B (A/B bitgleich, Seeds 1…1000). Neue
   Stufe 3 der Lage ohne Zufall, zuletzt konstruktiv rechts neben dem Archipel (E2); Testhooks `forceLastStage`,
   `onStage`; `fitIsland` exportiert.
4. **Save v13 atomar (T03):** `migrateV12ToV13` mit eingefrorenem Literal und Lagevergleich A/B (E3); Ladeprüfung
   unverändert über `ISLANDS` (vier Inseln); `foldBackToV12` hält Hash-Pins wertgleich (E4). Pins nach Inventar E5.
5. **UI (T06):** reine Helfer in `ui/islandCard.ts` (`traitEffectTexts`, `traitLine`), Texte nach Anhang 03; Render
   der Seekarte bleibt generisch über `islands.length`; `src/render/` schreibt nie in die Welt.

## Tasks

| Task | Titel                                  | Datei                                                                               | AK-IDs (M14E1-)                              | Strang | blocked-by       | Modell   |
| ---- | -------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------- | ------ | ---------------- | -------- |
| T00  | Basis-Check (Controller)               | [T00-basis.md](2026-10-11-m14-e1-inselcharakter/T00-basis.md)                       | — (QA-B2, QA-B3)                             | SIM    | Release M13      | sonnet   |
| T01  | Trait-Faktor, Gebirge+, A/B-Fixture    | [T01-trait-faktor.md](2026-10-11-m14-e1-inselcharakter/T01-trait-faktor.md)         | 01–10, 12, 17, 26 (Teile)                    | SIM    | T00              | sonnet   |
| T02  | Ersatzregel Stufe 3, Testhook          | [T02-ersatzregel.md](2026-10-11-m14-e1-inselcharakter/T02-ersatzregel.md)           | 15 (Mechanik)                                | SIM    | T01              | sonnet   |
| T03  | Insel C, Save v13, Pins                | [T03-insel-c-save-v13.md](2026-10-11-m14-e1-inselcharakter/T03-insel-c-save-v13.md) | 01, 03, 04, 11, 15, 19–21, 24a/h, 32 (Teile) | SIM    | T02, Ruling R-c2 | sonnet   |
| T04  | Save-Abdeckung                         | [T04-save-abdeckung.md](2026-10-11-m14-e1-inselcharakter/T04-save-abdeckung.md)     | 22, 23, 24b–g, 25, 42                        | SIM    | T03              | sonnet   |
| T05  | Seed-Läufe, Controller-Test, Szenarien | [T05-szenarien-seeds.md](2026-10-11-m14-e1-inselcharakter/T05-szenarien-seeds.md)   | 13, 14, 16, 18                               | SIM    | T04              | sonnet   |
| T06  | Anzeige der Inselstärken               | [T06-ui-anzeige.md](2026-10-11-m14-e1-inselcharakter/T06-ui-anzeige.md)             | 26–33                                        | UI     | T03              | sonnet   |
| T07  | Doku README, arc42, Hauptspec          | [T07-doku.md](2026-10-11-m14-e1-inselcharakter/T07-doku.md)                         | Spec §11                                     | SIM    | T05, T06         | sonnet   |
| T08  | Browser-Check                          | [T08-browser.md](2026-10-11-m14-e1-inselcharakter/T08-browser.md)                   | 34–41                                        | —      | T07              | sonnet   |
| T09  | Final-Review                           | [T09-final-review.md](2026-10-11-m14-e1-inselcharakter/T09-final-review.md)         | alle                                         | —      | T08              | **opus** |

Je Task T01–T07 ein Review durch `qa-code-reviewer` (sonnet); T06 zusätzlich im Browser-Check T08.

## Budget (Kurzfassung, Details ownership.md)

21 Starts (16 + 30 %), Parallelität 2 (nur T04/T05 ‖ T06), 2 Controller-Instanzen durch L0, ≈ 600 Tools gesamt.

## Optionale Abhängigkeit

`plan-TOOL-GATE-ENSEMBLE` (robuste Gate-Messung) kann die B3-Rangfolge (QA-B2) später nachmessen. **Nicht
blockierend**: E1 ändert die Heimat nicht, Balancing bleibt bitgleich (AK-18); die Rangfolge ist Playtest-Kriterium.

## Entscheidungsbedarf an L0 (Entwürfe, R471)

- **R-c2 Render-Pins (Gruppe D, E5):** AK-E1-10 Heimat-Aufrufliste, AK-K1b und AK-K2 (Meerflächen-Hashes) neu pinnen;
  AK-E1-21 Archipel-Speicher ≈ 44,5 MB → ≈ 56,8 MB. Grund: der Meer-Plan hängt von allen Fremdinseln ab, der
  Speicher rechnet über `ISLANDS`. Empfehlung: im Gate Plan annehmen; `lead-art` zur Kenntnis (B4, Faktor bleibt 2).
- **AK-11 (R501):** Vorbedingung trifft nicht zu (Fruchtbar halbiert den Zuckerrohr-Zyklus); Test nach
  Zyklus-Skalierung (E6). Kein Ruling nötig, nur Kenntnisnahme.
