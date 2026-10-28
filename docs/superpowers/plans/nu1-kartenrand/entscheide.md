# NU-1 · Entscheide des Plans und Risiken

Zu [`index.md`](index.md). Entwürfe E-NU-1 … E-NU-6 sind durch **R985** wie empfohlen entschieden (E-NU-5: `lead-design` darf den Text ersetzen).

## Entscheide (Entwurf für das Gate Plan)

- **P-1 Stränge:** A Sim (T00–T06, T09) in `.worktrees/nu1`, Branch `feat/nu1-kartenrand` von main; B UI (T07, T08, T11) in `.worktrees/nu1-ui`, Branch `feat/nu1-ui` von A @ T05-Review OK. B läuft parallel zu T06. Rückführung B → A per Merge vor T09, kein Rebase.
- **P-2 `unlockAll` ohne `U7`:** `createWorld({ unlockAll: true })` setzt `UNLOCK_IDS` ohne Einträge mit Auslöser `wonSpice`. Sonst stünde ein Kartenhaus vor Ziel 3 im Baumenü, ein Speichern dieser Welt wäre «beschädigt» (Ladeprüfung §4), und 417 `unlockAll`-Stellen änderten Baumenü und Hash. Ruling-Entwurf **E-NU-1**.
- **P-3 `nextUnlocks` ohne `U7`:** Einträge mit Auslöser `wonSpice` erscheinen nie in «Nächste Freischaltung» (Spec §3.1: vor Ziel 3 unsichtbar). Teil von E-NU-1.
- **P-4 Fundstück-Faktor in `effectiveCycle`** (nach Rat und Inselvorteil, angewandt auf den Stufen-Zyklus) statt in `cycleOf`: erfüllt «letzter Faktor nach Def, Stufe, Rat, Inselvorteil» und lässt `cycleOf` frei für Volllast/Taktlohn/AUSBAU-LOGIK (R960, Plan I-215 P-7). F1 in `laneTicksOf` und `travelTicksOf`; laufende Fahrten werden bei Übergabe nicht umgerechnet. **E-NU-2**.
- **P-5 Wirkbeginn:** Fundstücke kommen im Rückkehr-Tick in `world.finds`; Systeme nach `tickExpedition` (Bevölkerung, Wirtschaft, Markt) sehen sie im selben Tick, Produktion und Schiffe ab dem nächsten. Auslegung von Spec §3.8 «ab dem nächsten Tick» bei unveränderter Tick-Reihenfolge §3.5. **E-NU-3**.
- **P-6 Kappung N2 (R979):** Nach erfolgreicher Prüfung kappt `capStockOnLoad(world)` jedes Lager jeder Insel auf `storageCap(world, good)`; kein Abweisen.
- **P-7 Save-Nummer (R909):** `export const SAVE_VERSION = <Zahlenliteral main + 1>` (Regex `tools/render-qa/saveVersion.mjs`, Test `renderqa.test.ts:123`), `SAVE_V_KARTENRAND` nur Alias dahinter, nie Wert von `SAVE_VERSION`; gesetzt in T02 und in T09 nach `git merge main` neu abgeglichen; Funktion `migrateKartenrand` ohne Nummer im Namen; Literale nur `save.ts`, `types.ts`, `world.ts`. Tests nennen keine Zahl.
- **P-8 Ladung kanonisch:** `startExpedition` und `chooseOption` schreiben `cargo` in `GOOD_IDS`-Reihenfolge, Nulleinträge entfallen (Anhang 02 §8.4 c); die Ladeprüfung verlangt dieselbe Reihenfolge.
- **P-9 Ergebnis-Typen:** `cancelExpedition` liefert `{ ok: true; lost: ShipLoss[] } | { ok: false; reason }`; `StepReport` bekommt `expedition: ExpeditionNotice[]` (`'remind'`, `'overflowAhead'`, `'complete'`); Verfall bei Rückkehr und `boarding` läuft über `StepReport.lost` (Bestand `ShipLoss`).
- **P-10 Rückkehr ohne Route:** Ist `route` bei der Rückkehr `null`, setzt die Rückkehr `homing = false` (frei in der Heimat, AK-14) im selben Tick.
- **P-11 Pins 25b:** Liste und Regel in [`pins.md`](pins.md); Neu-Pinnen nur dort gelistet, mit Ruling-Notiz **E-NU-4** (Schwester R909/AK-HF-22).
- **P-12 Wartezustand und Texte:** `setRoute` in `boarding` nur mit Heimat-Ende, sonst «Schiff ist auf Expedition» (**E-NU-6**, Review Focus 1); Meldungstext der Vorwarnung Überlauf «Expedition kehrt bald heim: Lager fasst nicht alle Ware» (**E-NU-5**, Spec §3.11.3 nennt keinen Text; `lead-design` darf ersetzen).

## Risiken

- **R553 Wertgrenzen (Gate-Auflage 7):** Kartenhaus-Kosten, Fundstück-Stärken (F1 −10 %, F2 3 statt 2, F7 120) und Proviant beruhen auf Rechnung (Anhang 01), nicht auf zwei unabhängigen Läufen. Rückfall: Wert-Nachtrag per Ruling nur in Anhang 02 und `defs/`; kein Pin berührt, weil alle Hebel ohne Fund neutral sind (AK-20). Tests leiten Erwartungen aus den Defs ab; Spec-Zahlen gelten nur bei unveränderten Defs.
- **F7 ist der teuerste Punkt:** vier Sim-Kappungen plus sechs UI-Stellen (`trade.ts:292`, `storageFull.ts`, `hud.ts` ×3, `hints.ts:238`, `inspect.ts:824`); Wächter AK-40 (Sim) und T07-Wächter (UI). Rückfall laut Spec §3.9.6: Spec-Nachtrag mit Ersatz, kein stiller Tausch.
- **HAFEN (`ships.ts`, läuft in `.worktrees/hafen`):** HAFEN macht `tickShips` zur Zustandsfolge mit `Ship.dwell` und ändert `laneTicks`. NU-1 hält seinen Eingriff auf zwei Zeilen am Schleifenkopf und vor `handleDocked` (T04) und F1 als letzten Faktor in `laneTicksOf`. Konflikttabelle und Nachzug in T09.
- **Save-Kette (I-210, I-215, I-223 Zehnt, Stadtplanung, Inselproben, HAFEN, FLAECHE, GV):** Nummer per Merge-Reihenfolge (R909, P-7); jeder fremde Kettenschritt vor NU-1 verlangt in T09 einen Nachzug (Literal `SAVE_VERSION`, Faltschritt nach E-ZE-1/R987: jüngster Schritt innen, wer später merged, zieht nach; `dropExpedition` in `foldBackToV13/V12/V11` am selben Zeilenort wie `dropTithe`/`dropPetitions`). Tabelle: [`nachbarn.md`](nachbarn.md). Der Integrator merged nicht über Konflikte in `save.ts`/`helpers.ts`.
- **U7-Pins (Gate-Auflage 2):** Liste in `pins.md`; durch P-2 bleiben die 417 `unlockAll`-Stellen bitgleich. Rest-Risiko: Szenario-Welten mit `wonSpice` (`scenarios.ts` m13e2) brauchen `U7`, sonst lehnt AK-42 sie ab.
- **Konflikt `levels.ts`:** I-215, I-210, AUSBAU-LOGIK ändern `cycleOf`; NU-1 ändert nur `effectiveCycle` (P-4).
- **Testlast:** Rechner oft über Last 4; Wartezeit in T00, T03, T06, T09 einplanen.
