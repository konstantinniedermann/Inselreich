# Anhang 03 · Abnahmekriterien des Nachtrags R633/R634 (Handel 2 · Fernangebot)

Stand: 2026-10-14 · Paket `design-handel-2` · Autor: design-spec-author. Gleiche Konventionen wie Spec §8 (Inselindizes
über `kind`, Beispiel Felsbucht, Rum 15, Wert 450, `P = P(k)`). Verbindlich wie die AK in §8.

- **AK-H2-31** Ersatzlage und Fremd↔Fremd (A2). (a) Seed 963 (Weidenau in Stufe 3, `islands-c.test.ts`): Kontor auf
  Weidenau, Höchststufe 4, Periodenbeginn → `farOffer = { island: 3, good: 'glass', amount: 12, reward: 444 }`;
  `acceptFarOrder` → `ok` mit `due = P + FAR_ORDER_DURATION`; Glas 12 im Weidenau-Lager, `deliverOrder(world, 3)` →
  `ok`, Geld +444. Gegenprobe ohne Lieferung: Schritt `P + 1701` → `order` `null`, Geldänderung gleich Vergleichslauf
  ohne Strafe (wie AK-H2-13). Der Test hält zusätzlich `d(0, 3) > dMax` fest (Stufe 3 gemeldet, `onStage`).
  (b) Seed 3, Kontore auf Möweninsel und Felsbucht, Fernauftrag Rum nach Felsbucht, Rum 15 im Möweninsel-Lager,
  Route `{ a: 1, b: 2, ab: [{ good: 'rum', reserve: 0 }], ba: [] }` (nach `validRoute` zulässig) mit Schiff:
  Lieferung am Felsbucht-Kontor → `ok`; `deliverOrder(world, 1)` → `fail('Nur auf Felsbucht')`. Es gibt keinen Test,
  der eine Lieferung vor `due` garantiert (§5, bekannte Grenze).
- **AK-H2-32** Vertrag schliesst Fernangebot aus (R3, R634 (2d)). Seed 3, Kontor auf Felsbucht, Höchststufe 3, Vertrag
  über Perioden k … k + 3 (Lager Vertragsware ausreichend, Lieferung jeweils am Periodenbeginn) → in jedem Schritt
  `farOffer === null` und `order === null`; `acceptFarOrder` → `fail('Kein Fernangebot')`. Nach dem Ende des Vertrags
  (Kündigung oder Bruch) beim nächsten Periodenbeginn Zufallsauftrag und Fernangebot (Bruch: im selben Tick, AK-H2-05).
- **AK-H2-33** Ereignis-Log (reine UI-Helfer unter `tests/ui/`, kein Sim-Test): Eingabe Auftrag vor und nach dem
  Schritt plus `world.tick`. (a) Fernauftrag mit `due`, `tick = due + 1`, `order` `null` → ein Eintrag T-17
  «Fernauftrag verfallen: 15 Rum nach Felsbucht», `toast` `'info'`; (b) `tick ≤ due`, `order` `null` (Lieferung) →
  kein Eintrag T-17; die Lieferung erzeugt genau einen Eintrag T-16 (gleicher Text wie T-08, `toast` `'info'`), nicht
  zwei; (c) Fernangebot vorher da, nachher nicht, `tick >` `due` des Zufallsauftrags, kein Annehmen → Eintrag T-18,
  `toast` `null`; bei Lieferung des Zufallsauftrags (R4 b) oder Annehmen (R4 c) kein Eintrag; (d) Zufallsauftrag
  verfällt → kein Eintrag, keine Meldung; (e) `StepReport` und `serialize` bleiben gleich einem Lauf ohne diese UI.
