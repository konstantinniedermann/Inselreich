# I-048 Zukauf-Aufschlag (I048) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Der Kaufpreis je Gut steigt mit jeder gekauften Einheit (+2 Punkte, Deckel 160 %, Erholung 1 Punkt/s). Die Verkaufserholung halbiert sich (1 Punkt je 2 s). Der Dialog zeigt «Kauf … %» und «Verkauf … %».

**Spec:** [`…-i048-zukauf-aufschlag-design.md`](../specs/2026-10-10-i048-zukauf-aufschlag-design.md) (`12c98fd3`, AK-ZK-01…33) mit Anhang 01; Rulings R487, R489, R490, R492; Gate-Urteile `.studio/handoffs/2026-10-10-lead-{qa,tech}-GATE-SPEC-I048.md`.

Stufe voll · Paket I048 · M13 · Planbasis `main` @ `c62f346b` (`SAVE_VERSION` 11, M13-E2-SIM nicht gemergt) · E-010: Index plus Tasks ≤ 10 KB in [`2026-10-11-i048-zukauf-aufschlag/`](2026-10-11-i048-zukauf-aufschlag/) · Plan `lead-tech` opus.

## Voraussetzung und gemeinsame Dateien

- **blocked-by M13-E2-SIM** (R486 O8, R489, state.md). Das ganze Paket zweigt erst nach dem Merge ab (R481 B1). Es braucht `monument`/`monumentDone`, `migrateV11ToV12`, `isValidV12Fields`, `foldBackToV11` und `buyMonumentUnit` (M13-E2-Plan T04). Laut M13-E2-Plan (E7: keine Freigabe zwischen SIM- und UI-Merge) ist Fall v12 zu erwarten. Abzweig empfohlen nach dem Merge von M13-E2-UI.
- **Mit M13-E2 gemeinsam:** `src/sim/{trade,types,world,save}.ts`, `tests/sim/helpers.ts`, `save.test.ts` (Versionszeilen), README «Denkmal», arc42 `save.ts`. **Baseline:** E2 pinnt `balance-monument`, I-048 misst ihn in B neu (Klasse N). **Save:** Weiche v12 geteilt / v13 (T01).
- **Mit I-049 gemeinsam** (ebenfalls nach E2-SIM): `save.ts`, `types.ts`, `world.ts`, `helpers.ts`, `src/ui/trade.ts`, README, arc42. Die Merges laufen seriell. Wer als zweiter mergt, holt vorher `main` per Merge und prüft die Weiche erneut.
- `tickMonument` läuft vor `tickMarket` (M13-E2 R5.1), `tick.ts` bleibt unverändert. Ein Denkmal-Zug bei Tick t zahlt den Anteil vor der Erholung dieses Ticks. AK-ZK-29 pinnt das.

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard`). `src/sim/` DOM-frei, kein RNG, ganze Zahlen; Aktionen werfen nicht. Werte nur in `defs/`: A `BUY_RISE` 0 / `SELL_RECOVERY_INTERVAL` 10, B 2 / 20.
- Test zuerst rot. Umsetzer fahren gezielte Dateien. `make test`/`make check` fährt nur der Controller über die Testsperre, nie während eines Pushs (R464). Exit-Codes `…; echo EXIT=$?`, nie in eine Pipe.
- `vi.mock` nur für Klasse R. Die Bitgleichheit prüft `buyQuote` ohne Mock (AK-ZK-08, -21).
- `docs/studio/rulings.md` bleibt tabu (R471). Commit-Präfixe nach Konvention. Kein Rebase, `reset --hard` oder Force-Push.

## Architektur (≤ 15 Zeilen)

- `World.buyPct: Record<GoodId, number>` (100 … `BUY_CAP`), letzter Weltschlüssel nach `monumentDone`; Muster `sellPct`.
- Reiner Kern `buyQuote(list, startPct, n, rise, cap, edictPct) → { price, meanPct, endPct }` in `trade.ts`, Schleife, einmal aufrunden.
- Welt-Adapter `buyQuoteFor(w, g, n)` ist die einzige Lesestelle von Anteil, `BUY_RISE`, `BUY_CAP` und `buyFactorPct`. `buyPrice` = `.price`.
- `buy` ruft `buyQuoteFor` einmal: `money -= price`, `buyPct[g] = endPct`. Die Prüfreihenfolge bleibt, ein Fehlschlag ändert nichts.
- Der Denkmal-Zukauf bleibt bei `buyPrice(w, g, 1)` und schreibt `buyPct` nie (R489).
- `tickMarket`: zwei getrennte Intervalle, erst Verkauf (+1 bis 100), dann Kauf (−1 bis 100); Tick 0 nichts.
- Save: Migration setzt alle 100, Ladeprüfung nach Muster `isValidV2Fields`, Rückfaltung entfernt `buyPct` nur bei allen 100.
- UI: reine Helfer `buyPctText`, `sellPctText`, `buyTitleText`, `tradeReasonCtx` in `src/ui/trade.ts`; `buyTitle` nutzt `buyQuoteFor`.
- Umbenennung `EdictDef.buyPct` → `buyFactorPct` als eigener `refactor:`-Commit.

## Datei-Ownership

- **sim** (`.worktrees/i048`, `feat/i048`), T02/T03: `src/sim/defs/{goods,timing,edicts}.ts`, `src/sim/{types,world,trade,save}.ts`, `src/ui/{edictView,trade}.ts` **nur Umbenennung**, `tests/sim/helpers.ts`, `defs.test.ts`, `edicts.test.ts`, neu `buyPct.test.ts`, `buyPct-save.test.ts`, `tests/ui/buyPctReason.test.ts`, Fixtures nur neu.
- **ui** (`.worktrees/i048-ui`, `feat/i048-ui` ab T02), T04: `src/ui/trade.ts`, `src/ui/app.ts` (nur `tradeCtx`), `src/style.css` (`.trade-*`), `tests/ui/trade.test.ts`.
- **sim** nach Merge von `feat/i048-ui`, T06/T08: `defs/{goods,timing}.ts` (Werte), Testdateien laut Inventar N/R/S, neu `fixture-recipes.test.ts`, `tests/sim/controller.ts`, `tests/ui/trade.test.ts`; T08 `README.md`, `docs/arc42.md`, `docs/beobachtungen.md` (D1 erlaubt, E-017).
- **Controller**, T01/T05/Abschluss: Merges, Ledger `.superpowers/sdd/i048/ledger.md`.

T03 läuft parallel zu T04 (eigene Bäume, getrennte Dateien). Der Rest läuft seriell, weil echte Abhängigkeiten bestehen: B braucht A; AK-ZK-20/-22 brauchen B-Werte; der Browser-Check braucht B.

## Budgetantrag (Handbuch 1.39)

```text
Lead: lead-tech
Phase: I048-umsetzung
Pakete:
- I048-A-sim T02, T03 (nein)
- I048-A-ui T04 (ja)
- I048-B T06 (nein)
- I048-D Doku T08 (nein; Review im Final-Review)
Formel: 4 × 2 + 1 QA-Check + 1 Final-Review = 10 → × 1,3 = 13
Parallelität: 2 (T03 ‖ T04)
Beantragt: 13 Starts, Parallelität 2
```

Geplant sind 9 Starts (Tools): `tech-sim-engineer` T02 + T03 per SendMessage (85) · Review T02 (15) · `tech-ui-engineer` T04 (35) · Review T03 (12) · Review T04 (12) · `tech-sim-engineer` T06 + T08 per SendMessage (85) · Review T06 (18) · `qa-playtester` T07 (25) · Final-Review opus, zugleich Review T08 (35). Reviews sind `qa-code-reviewer` sonnet; die Starts 10–13 sind Puffer.

**Controller** sonnet, ≤ 4 Tasks je Instanz (R167, R190). Instanz 1 übernimmt T01–T04 (5 Starts), Instanz 2 T05–T08 und den Abschluss (4 Starts). **Schätzung:** ≈ 322 Arbeiter- und 90 Controller-Tools, zusammen **≈ 410 Tools**. Das sind ≈ 95–105 min plus Testläufe.

## Task-Tabelle

| ID  | Titel                                               | Datei                                                   | AK (ZK-)                         | Strang | blocked-by | Modell |
| --- | --------------------------------------------------- | ------------------------------------------------------- | -------------------------------- | ------ | ---------- | ------ |
| T01 | Vorlauf: Voraussetzung, Weiche, Testzeiten main     | [T01](2026-10-11-i048-zukauf-aufschlag/T01-vorlauf.md)  | –                                | Contr. | M13-E2-SIM | sonnet |
| T02 | Sim A: Umbenennung, Zustand, Kern, Markt, Migration | [T02](2026-10-11-i048-zukauf-aufschlag/T02-sim-kern.md) | 01 07 08 09 11 12 29 31 33       | sim    | T01        | sonnet |
| T03 | Save A: Ladeprüfung, Rundlauf, Fixture              | [T03](2026-10-11-i048-zukauf-aufschlag/T03-save.md)     | 16 17 18                         | sim    | T02        | sonnet |
| T04 | UI A: Helfer, «Kauf … %», «Verkauf … %»             | [T04](2026-10-11-i048-zukauf-aufschlag/T04-ui.md)       | 19 21 32                         | ui     | T02        | sonnet |
| T05 | Beleg Schritt A, Merge UI-Strang                    | [T05](2026-10-11-i048-zukauf-aufschlag/T05-beleg-a.md)  | 13                               | Contr. | T03, T04   | sonnet |
| T06 | Schritt B: Werte, Inventar, Klassen N/R/S, Messweg  | [T06](2026-10-11-i048-zukauf-aufschlag/T06-werte-b.md)  | 02 03 04 05 06 10 14 15 20 22 30 | sim    | T05, Rul.  | sonnet |
| T07 | Browser-Check Handelsdialog                         | [T07](2026-10-11-i048-zukauf-aufschlag/T07-browser.md)  | 23 24 25 26 27 28                | qa     | T06        | sonnet |
| T08 | Doku: README, arc42                                 | [T08](2026-10-11-i048-zukauf-aufschlag/T08-doku.md)     | – (§10)                          | sim    | T06        | sonnet |

Jedes AK steht genau einmal, zusammen 33. **A** = T02–T05: Diese AK setzen den Anteil von Hand oder rufen `buyQuote` mit `rise` 2 direkt. **B** = T06–T07: Diese AK brauchen 2 bzw. 20 (436, 516, Tick 1400, «· im Mittel»). AK-ZK-06 steht in B, weil `money` 435 erst bei Preis 436 scheitert. «Rul.» = Ruling zu Entscheid 1/2.

**Abschluss (Controller):** E-052-Vergleich derselben Dateien wie T01 auf `main` und auf dem Branch, direkt nacheinander. Dann `make check` Exit 0, Ruling-Entwürfe, Handoff und der Vermerk «bereit fürs Final-Review».

## Entscheidungsbedarf an L0 (Gate Plan)

1. **Klasse S fehlt.** Schritt B macht Regel-Tests früherer Specs rot, die weder N noch R sind: `trade.test.ts:88` (400), «AK-S2-03» in `trade.test.ts`/`tick.test.ts` (Erholung 10 Ticks, Nahrung −40), `edicts.test.ts` ≈ 194–216/395–396 (n > 1), `tests/ui/trade.test.ts` 57–65 (80/64). Nach §6 wäre das ein Stopp. **Empfehlung:** Klasse S «Erwartung, die I-048 Z2/Z5 ausdrücklich ändert». Die Erwartung wird auf den nachgerechneten Spec-Wert umgestellt; ein Test, der einen anderen Effekt isoliert, wird auf n 1 bzw. `rise` 0 umgestellt. Zu S gehören auch Vergleichshelfer, die zwei Endwelten **derselben** Ökonomie zurückfalten (`normalized()` in `balance-crises.test.ts`): Sie entfernen `buyPct` vor der Rückfaltung. Ein Hash gegen einen historischen Stand bleibt R. Alles steht in der Tabelle (Plan-Review B1).
2. **Messbasis AK-ZK-15.** «Preis − `buyQuote(…, startPct 100, …)`» mit `rise` 2 lässt den Aufschlag innerhalb eines Brockens aus. Anhang b rechnet dagegen +36 je 10er-Brocken. **Empfehlung:** Basis `buyQuote(list, 100, n, 0, BUY_CAP, edictPct)`, also Listenpreis mit Edikt (strenger, deckt sich mit Anhang b).
3. **AK-ZK-13 «leerer Diff»** kollidiert mit der neuen Fixture (AK-ZK-17) und im Fall v13 mit `toBe(12)` in `save.test.ts`. **Empfehlung:** `--diff-filter=MDR` für Fixtures; Im Fall v13 sind nur die Versionszeilen erlaubt, auch in den E2-Dateien `save-v11/-v12.test.ts`. Weil Fall v12 erwartet wird, geht v13 vor T02 an L0 (T01).

## Risiken

1. **Weiche** (hoch): Ein Release zwischen den Merges bedeutet v13, ≈ 10 Tools mehr. T01 prüft das, L0 prüft es im Merge-Gate erneut.
2. **Inventar B** (mittel): Der Aufwand ist offen; `balance-merchants` trifft es am stärksten. Reisst eine Grenze, folgt zuerst `BUY_RISE` 1, sonst Stopp an L0.
