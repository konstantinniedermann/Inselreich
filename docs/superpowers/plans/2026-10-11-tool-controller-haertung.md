# Controller-Härtung (TOOL-CONTROLLER-HAERTUNG) — Kurzplan (Kurzdesign + Plan)

**Ziel:** Der Balancing-Controller baut die Schule erst, wenn die Stoffkette den Bedarf der Zielstufe aller Häuser deckt. Fürs Spielerlebnis: Balancing-Gates messen das Spiel, nicht einen Zufall im Bot-Timing.
**Quelle:** R558 (3), R560; Probe `probe-CONTROLLER-PHASE` · Werkzeug-Paket, Prozessstufe leicht, Plan: `lead-tech`, sonnet (E-054, R523) · Zeitpunkt: vor Start M14-E1 (T00 zieht die Basis nach, R557 (4)).

## Diagnose und Entscheid

Bei Phase 60/80 liegt der Entscheidungstick (≈ 560/580) im Fenster, in dem erst ein Haus Stufe 2 voll ist. `producersNeeded(cloth)` rechnet nur den Ist-Bedarf (ein Haus) plus `upcoming ? 1 : 0` und liefert 1; `buildChain('cloth')` gilt als fertig, `anyPlan(3)` ist wahr (planTier des vollen Stufe-2-Hauses), der Controller baut Schule + Zuckerrohr + Brennerei, das Geld fällt unter `RESERVE`, Stoff bleibt ab Tick 780 auf 0 — Stillstand bis `MAX_TICKS`. Reihenfolge-Lücke in `control()` (Schritt 5), kein Spielerproblem (R560).

**Entscheid (Änderung nur in `tests/sim/controller.ts`):** Neue Hilfsfunktion `clothCoversTarget(w)`: Stoffbedarf = Summe über alle Häuser von `maxInhabitants × needs.cloth` der Stufe `max(planTier(b), 2)`-bis-Zielstufe, d. h. jedes Haus, das schon Stufe 2 ist oder dorthin steuert, zählt mit seiner Zielstufe; Bedarf ÷ Ausstoss je 100 Ticks, aufgerundet ≤ `count(w, weaver)`. Schritt 5 (Schule) verlangt zusätzlich `clothCoversTarget(w)`; sonst `return` (spätere Stufen warten, wie bei fehlendem Geld). Kein neuer Spielwert, keine neue Konstante ausser dieser Funktion. Die genaue Formel legt der Umsetzer test-first fest; Leitplanke ist AK-3.
**Alternative (verworfen):** `producersNeeded` für alle Häuser auf Zielstufe hochziehen — verschiebt auch Schritt 4 (Stoffkette) und damit Phase 0 sicher. **Rückfall:** verschiebt die Funktion Phase 0 (AK-3 rot), engere Bedingung wählen (z. B. nur Schule gaten, nur wenn `home(w).stock.cloth === 0` und Stoffbedarf > Webereien); scheitert auch das, Stopp (`blocked`) und Bericht an L0.

## Auflagen aus R561 (vor T01 eingetragen)

1. **Erfüllbarkeit:** Weber-Bau (`buildChain('cloth')`/`producersNeeded`) und die Schul-Bedingung nutzen dieselbe Zielbedarf-Formel, damit die Schule nie dauerhaft wartet. Neuer Test "Schule wird bis `MAX_TICKS` gebaut" je Phase (0/20/40/60/80). Verschiebt das Phase 0, gilt der Rückfall; bleibt eine Verschiebung, ist sie als Tabelle alt→neu eine bewusste Pin-Änderung für Gate Merge (Verfassung §3, R560 (1)).
2. **Tick-Gleichheit Phase 0** vor/nach (Schul-Tick, Zustand nach N Ticks) im Bericht, nicht nur Pins.
3. **Stillstand** = kein Sieg bis `MAX_TICKS`. Gegenprüfung Phasen 10/30/50/70/90 als Tabelle im Bericht; Treffer nach `docs/beobachtungen.md`.
4. **Zeitbudget AK-2:** zeigt T00 > 500 ms je Test, liegen die Vollläufe von Anfang an hinter `VITE_ENSEMBLE`. Restrisiko: nur Seed 3 (Beobachtung "Seed wirkt nicht", R553 V1).

## Abnahmekriterien

| ID   | Kriterium                                                                                                                                                                                                                                                                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AK-1 | Ensemble Seed 3, Phasen 0/20/40/60/80: alle fünf siegen (`winTick` ≠ `MAX_TICKS+1`, `w.won`). Sieg-Tick-Verdikt OK (alle ≤ `WIN_TICK_LIMIT` 7500) oder begründet AUSREISSER mit Tabelle im Bericht; Geld bleibt ≥ 0 (`minMoney`, `endMoney` > 0).                                                                                                                     |
| AK-2 | Rot-Beleg: neuer Test „Phase 60 und 80 siegen“ ist vor der Härtung rot (`EXIT=1`, Meldung nennt fehlenden Sieg/`won` false, nicht „Import fehlt“), danach grün. Ort: `tests/sim/ensemble.test.ts` (Standardlauf, 2 Läufe; Einzeldauer ≤ 500 ms, sonst als Messlauf hinter `VITE_ENSEMBLE` und Bericht).                                                               |
| AK-3 | Phase 0 bitgleich: `tests/sim/balance*.test.ts`, `unlock-timeline`, `population`, `goal3`, `balance-flow` unverändert grün, Pins (Sieg 6750, `minMoney` 117, `endMoney` 339, 350/4150, M-15 8250/71, Kaufleute 6750/11 500/320) unverändert. Phase 20/40 vorher/nachher in der Ensemble-Tabelle verglichen.                                                           |
| AK-4 | Balance-Test-Grenzen nach Härtung neu abgeleitet: Tabelle alt→neu (Grenze, Quelle, alt, neu) im Bericht als Ruling-Vorlage (Verfassung §3, bewusste Änderung). Erwartung: Pins unverändert (Phase 0 unberührt), Änderung nur in der Ensemble-Messung (Phase 60/80: AUSREISSER/GERISSEN → OK). Wert-Änderung eines Pins nur nach Rückfrage an L0, nie stillschweigend. |
| AK-5 | Keine Spielwerte, kein `src/`, keine `defs/`, kein Save. Nur `tests/sim/controller.ts` und `tests/sim/ensemble.test.ts` (nebst Kommentar-Update in `ensemble.test.ts` zu Phase 60/80). Keine neue Abhängigkeit.                                                                                                                                                       |
| AK-6 | Andere Controller-Nutzer geprüft (siehe Risiken). `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, `make check`, `make docs-check` je Exit 0 (nie in eine Pipe). `make gate-ensemble` Tabelle im Bericht.                                                                                                                                         |
| AK-7 | Testzeiten vorher/nachher (R392, E-052): Messung vor T01 auf `main`, Load ≤ 4 (R329): `npx vitest related --run tests/sim/controller.ts tests/sim/merchantsController.ts; echo EXIT=$?`, Zeiten je Datei; danach gleicher Lauf auf dem Branch. Kein bestehender Test > 500 ms und keiner > +50 % gegen die Basis.                                                     |
| AK-8 | Final-Review `qa-code-reviewer` auf `opus` über die Branch; nach ZURÜCK Fix-Runde und Delta-Review desselben Reviewers per `SendMessage` (Handbuch 1.51).                                                                                                                                                                                                             |

## Risiken

- **Importeure (7 Dateien + 2 Helfer):** `balance-edicts`, `balance-flow`, `balance-merchants`, `balance-crises`, `balance-monument`, `unlock-timeline`, `population` nutzen `control`/`buildColony` direkt oder über `scenarios.ts`, `merchantsController.ts` (ruft `control(w, layout, {})` in der Kaufleute-Phase und ab `chainsCover`), `fixtureV6/V8`. Alle laufen mit Phase 0. Greift die Härtung dort, verschiebt sich der Schul-Zeitpunkt und damit viele Pins (R560: Wert-Änderung = Gate-Ruling). Schutz: AK-3 vor jedem weiteren Schritt; Abweichung = Rückfall oder Stopp.
- **Verdeckte Spielhärte:** Die Härtung kann den Stoffmangel-Stillstand (Armutsfalle ohne Notausgang) für den Bot verdecken; Gegenmittel ist die Idee „Armutsfalle“ in der Ideen-Runde (R560 (3)), kein Paketinhalt.
- **Neuer Stillstand:** Wartet die Schule dauerhaft auf Stoff, kann der Bot an anderer Stelle stehen. AK-1 prüft alle fünf Phasen; zusätzlich Phase 10/30/50/70/90 einmalig im Scratchpad (nur Messung, kein Test), Befund → `docs/beobachtungen.md`.
- **Last:** Messproben nur bei 1-min-Load ≤ 4 (R329); heute 29 → Umsetzung wartet, Zeitmessung nicht unter Last (R392).

## Tasks (ein Strang, ein Umsetzer `tech-sim-engineer`, sonnet; Worktree `.worktrees/tool-controller-haertung`, Branch `tool/controller-haertung`)

| Task | Titel                                                                          | Datei                        | AK               | blocked-by |
| ---- | ------------------------------------------------------------------------------ | ---------------------------- | ---------------- | ---------- |
| T00  | Basismessung: Testzeiten + `make gate-ensemble` auf `main` (Tabelle ablegen)   | nur Messung, Scratchpad      | AK-7             | —          |
| T01  | Rot-Test Phase 60/80 siegen, Rot-Beleg                                         | `tests/sim/ensemble.test.ts` | AK-2             | T00        |
| T02  | `clothCoversTarget` + Schul-Bedingung in `control()`, Phase 0 bitgleich prüfen | `tests/sim/controller.ts`    | AK-1, AK-3, AK-5 | T01        |
| T03  | Ensemble-Neumessung, Tabelle alt→neu, Testzeiten nachher, Gesamtprüfung        | Bericht                      | AK-4, AK-6, AK-7 | T02        |
| T04  | Review: `qa-code-reviewer` Task-Review T01–T02, dann Final-Review opus         | —                            | AK-8             | T03        |

Ownership: `tests/sim/controller.ts` und `tests/sim/ensemble.test.ts` nur der Umsetzer; alle übrigen Dateien Lese-Zugriff. Docs: keine arc42-/README-Änderung (Test-Werkzeug); Basis-Wert-Änderung trägt L0 per Ruling nach (R471).

## Budgetantrag

Pakete 1 (T01–T03 ein Umsetzer-Start) × 2 = 2, Task-Review 1, Final-Review opus 1 → 4, + 30 % Puffer = 5,2 → **6 Starts** (inkl. Delta-Review per `SendMessage`, zählt nicht). Parallelität 1 (ein Baum). Umsetzer-Briefing: `Budget: keins, keine Agenten starten`. Start erst bei Load ≤ 4. Aufwand Umsetzung geschätzt 40–60 Tools.
