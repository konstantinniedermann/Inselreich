# I-048 Zukauf-Aufschlag (I048) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Der Kaufpreis je Gut steigt mit jeder gekauften Einheit (+2 Punkte, Deckel 160 %, Erholung 1 Punkt/s), die Verkaufserholung wird halbiert (1 Punkt je 2 s). Der Dialog zeigt «Kauf … %» und «Verkauf … %».

**Spec:** [`…-i048-zukauf-aufschlag-design.md`](../specs/2026-10-10-i048-zukauf-aufschlag-design.md) (`12c98fd3`, AK-ZK-01…33) samt Anhang 01. Rulings R487, R489, R490, R492, **R505** (Gate Plan: Spec-Klarstellung §6, AK-ZK-13, -15).

Stufe voll · Paket I048 · M13 · Planbasis `main` @ `c62f346b`, Nachtrag nach R505 · E-010: Index plus Tasks ≤ 10 KB in [`2026-10-11-i048-zukauf-aufschlag/`](2026-10-11-i048-zukauf-aufschlag/) · Plan `lead-tech` opus.

## Save und Merge-Reihenfolge (R505)

- **Save v12 geteilt:** Bis M13-E2, I-049 und I-048 gemergt sind, wird `main` nicht released; spielfremde Pushes bleiben erlaubt. Es gibt eine Migration v11→v12, und jeder spätere Strang erweitert sie. Der **Rückfall** (Release vorher) folgt nur nach neuem Ruling: I-048 bekommt dann v14, und der Controller stoppt vor dem nächsten Task an L0.
- **Reihenfolge:** (1) M13-E2-SIM, (2) I-049-Sim, (3) M13-E2-ART → -UI, (4) I-049-UI → **I048-UI** (seriell wegen `src/ui/trade.ts`), (5) **I048-B** zuletzt. **I048-SIM** (T01–T03, T05) zweigt nach (1) ab und läuft parallel zu (2) und (3).
- **Merge nach `main`** je Strang nur über Gate Merge (L0) und `production-integrator` (Prod-B6). Der Controller merged nie nach `main`. Vor dem Gate holt er `main` per Merge (kein Rebase).
- **Rückfaltung (Prod-B4):** Wer später mergt, erweitert `migrateV11ToV12` und prüft im Test die `foldBackToV11`-Regeln der schon gemergten Stränge (`monument`, `reserve`, `buyPct`). Da I048-B zuletzt mergt, prüft T06 alle Regeln.
- **Gemeinsame Dateien:** mit E2 und I-049 `src/sim/{trade,types,world,save}.ts`, `tests/sim/helpers.ts`, `src/ui/trade.ts`, README, arc42. `balance-monument` aus E2 wird in B neu gemessen (Klasse N). `tickMonument` läuft vor `tickMarket` (E2 R5.1), `tick.ts` bleibt unverändert.

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard`). `src/sim/` bleibt DOM-frei, ohne RNG und mit ganzen Zahlen; Aktionen werfen nicht. Werte stehen nur in `defs/`: A `BUY_RISE` 0 / `SELL_RECOVERY_INTERVAL` 10, B 2 / 20.
- Jeder Test ist zuerst rot. Ist ein Test schon vor der Umsetzung grün, kommt er ins Ledger als «Regressionsschutz» (QA-B6). Umsetzer fahren nur gezielte Dateien; `make test` und `make check` fährt nur der Controller über die Testsperre, nie während eines Pushs (R464). Exit-Codes `…; echo EXIT=$?`, nie in einer Pipe.
- `vi.mock` ist nur für Klasse R erlaubt. Die Bitgleichheit prüft `buyQuote` ohne Mock. `rulings.md` bleibt tabu (R471). Kein Rebase, kein `reset --hard`, kein Force-Push.

## Architektur (≤ 15 Zeilen)

- `World.buyPct: Record<GoodId, number>` (100 … `BUY_CAP`) ist der letzte Weltschlüssel; Muster `sellPct`.
- `buyQuote(list, startPct, n, rise, cap, edictPct) → { price, meanPct, endPct }` in `trade.ts`: rein, als Schleife, einmal aufgerundet.
- `edictBuyPct(w)` (exportiert) ist der einzige Leser von `buyFactorPct`. `buyQuoteFor(w, g, n)` ist der Welt-Adapter, `buyPrice` = `.price`.
- `buy`: `buyQuoteFor` genau einmal, `money -= price`, `buyPct[g] = endPct`; ein Fehlschlag ändert nichts. Der Denkmal-Zukauf zahlt `buyPrice(w, g, 1)` und hebt den Anteil nicht.
- `tickMarket`: zwei getrennte Intervalle (Verkauf +1, Kauf −1, beide bis 100), Tick 0 nichts.
- Save: Migration auf alle 100, Ladeprüfung nach `isValidV2Fields`, Rückfaltung entfernt `buyPct` nur bei allen 100.
- UI-Helfer `buyPctText`, `sellPctText`, `buyTitleText`, `tradeReasonCtx` in `src/ui/trade.ts`. Umbenennung `EdictDef.buyPct` → `buyFactorPct`.

## Stränge und Datei-Ownership

- **I048-SIM** (`.worktrees/i048-sim`, `feat/i048-sim`), T01, T02, T03, T05. Dateien: `src/sim/defs/{goods,timing,edicts}.ts`, `src/sim/{types,world,trade,save}.ts`, `src/ui/{edictView,trade}.ts` (nur Umbenennung), `tests/sim/helpers.ts`, `defs.test.ts`, `edicts.test.ts`, neu `buyPct.test.ts`, `buyPct-save.test.ts`, `tests/ui/buyPctReason.test.ts`, Fixtures nur neu.
- **I048-UI** (`.worktrees/i048-ui`, `feat/i048-ui` ab `main` nach (4) I-049-UI und I048-SIM), T04. Dateien: `src/ui/trade.ts`, `src/ui/app.ts` (nur `tradeCtx`), `src/style.css` (`.trade-*`), `tests/ui/trade.test.ts`.
- **I048-B** (`.worktrees/i048-b`, `feat/i048-b` ab `main` nach I048-UI), T06, T07, T08. Dateien: `defs/{goods,timing}.ts`, Testdateien laut Inventar N/R/S, `fixture-recipes.test.ts`, `controller.ts`, `tests/ui/trade.test.ts`, `README.md`, `docs/arc42.md`, `docs/beobachtungen.md` (D1, E-017).

Die Stränge laufen seriell, weil die Abhängigkeiten echt sind. Parallelität entsteht nur zu den Strängen von E2 und I-049.

## Budgetantrag (Handbuch 1.39, Starts inkl. Controller, Prod-B5)

```text
Lead: lead-tech
Phase: I048-umsetzung
Pakete:
- I048-SIM T02, T03 (nein) · I048-UI T04 (ja) · I048-B T06 (nein), T08 (Review im Final)
Formel: 4 × 2 + 1 QA-Check + 2 Final-Reviews + 3 Controller = 14 → × 1,3 = 18,2 → 19
Parallelität: 1 je Strang
Beantragt: 19 Starts
```

Geplant sind 13 Starts:

- **SIM:** Controller (1), `tech-sim-engineer` für T02 + T03 per SendMessage (2), Review T02 (3), Review T03 (4), Final-Review opus SIM (5).
- **UI:** Controller (6), `tech-ui-engineer` T04 (7), Review T04 (8).
- **B:** Controller (9), `tech-sim-engineer` für T06 + T08 (10), Review T06 (11), `qa-playtester` T07 (12), Final-Review opus über ganz I-048 inkl. T08 (13).

Die Starts 14–19 sind Puffer und nur nach Meldung verfügbar. Briefet L0 den UI-Umsetzer direkt (E-037), entfällt Start 6.

Schätzung: ≈ 470 Tools, davon Controller ≈ 120. Das ergibt ≈ 120 min, verteilt auf drei Zeitfenster.

## Task-Tabelle

| ID  | Titel                                               | Datei                                                   | AK (ZK-)                         | Strang | blocked-by          | Modell |
| --- | --------------------------------------------------- | ------------------------------------------------------- | -------------------------------- | ------ | ------------------- | ------ |
| T01 | Vorlauf: Voraussetzung, Save, Testzeiten main       | [T01](2026-10-11-i048-zukauf-aufschlag/T01-vorlauf.md)  | –                                | SIM    | M13-E2-SIM          | sonnet |
| T02 | Sim A: Umbenennung, Zustand, Kern, Markt, Migration | [T02](2026-10-11-i048-zukauf-aufschlag/T02-sim-kern.md) | 01 07 08 09 11 12 29 31 33       | SIM    | T01                 | sonnet |
| T03 | Save A: Ladeprüfung, Rundlauf, Fixture              | [T03](2026-10-11-i048-zukauf-aufschlag/T03-save.md)     | 16 17 18                         | SIM    | T02                 | sonnet |
| T05 | Beleg Schritt A, Gate Merge SIM                     | [T05](2026-10-11-i048-zukauf-aufschlag/T05-beleg-a.md)  | 13                               | SIM    | T03                 | sonnet |
| T04 | UI A: Helfer, «Kauf … %», «Verkauf … %»             | [T04](2026-10-11-i048-zukauf-aufschlag/T04-ui.md)       | 19 21 32                         | UI     | T05-Merge, I-049-UI | sonnet |
| T06 | Schritt B: Werte, Inventar N/R/S, Messweg           | [T06](2026-10-11-i048-zukauf-aufschlag/T06-werte-b.md)  | 02 03 04 05 06 10 14 15 20 22 30 | B      | T04-Merge           | sonnet |
| T07 | Browser-Check Handelsdialog                         | [T07](2026-10-11-i048-zukauf-aufschlag/T07-browser.md)  | 23 24 25 26 27 28                | B      | T06                 | sonnet |
| T08 | Doku: README, arc42                                 | [T08](2026-10-11-i048-zukauf-aufschlag/T08-doku.md)     | – (§10)                          | B      | T06                 | sonnet |

Alle 33 AK sind je genau einmal zugeordnet. Schritt A umfasst SIM und UI, Schritt B den Strang B. AK-ZK-06 liegt in B, weil die Zahl 435 erst bei einem Preis von 436 scheitert.

**Abschluss (Controller B), E-052 (QA-B7):** Dieselben Dateien wie in T01 laufen auf `main` und auf dem Branch direkt nacheinander. Schwelle je Datei: höchstens +25 % oder +300 ms. Neue Dateien ohne Basis (`fixture-recipes.test.ts`, Zweiläufe AK-ZK-30) werden einzeln ausgewiesen. Danach `make check` Exit 0, Ruling-Entwürfe, Handoff und der Hinweis «bereit fürs Final-Review».

## Risiken

1. **Release vor M13-Ende** (Rückfall v14): stoppt den laufenden Strang; Nachtrag per Ruling.
2. **Inventar B** (mittel): Der Aufwand ist offen, am stärksten betrifft er `balance-merchants`. Reisst eine Grenze, wird zuerst `BUY_RISE` auf 1 gesenkt, sonst Stopp an L0.
3. **Lange Sperre:** I048-UI wartet auf I-049-UI. Bis dahin liegt die Mechanik ohne Anzeige auf `main` (`BUY_RISE` 0, also ohne Wirkung).
