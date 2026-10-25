# ADR-016: Ehrenbuch ausserhalb des Welt-Saves, Partie-Merker im Buch

Status: angenommen · Paket: I-186 · Grundlage: [Ehrenbuch-Kurzdesign](../superpowers/specs/2026-10-23-i186-ehrenbuch-design.md) · Betrifft: `src/sim/honors.ts`, `src/ui/honor*.ts`, `src/ui/app.ts`

## Kontext

Das Ehrenbuch hält 9 Meisterstücke über Partien hinweg fest (kein Spielvorteil, nur auf diesem Gerät). Es muss «Neue Insel» und Laden überleben. Tempo-Stücke («Flinke Gründung», «Kaufmannseile») sind nur fair, wenn die Partie stufenweise freigeschaltet war; die Welt weiss das nicht (`unlockAll` wirkt nur bei `createWorld`).

## Entscheid

Das Buch liegt in eigenen `localStorage`-Schlüsseln (`inselreich.ehrenbuch`, `inselreich.ehrenbuch.defekt`), Format v1, nicht im Welt-Save (kein Save-Wechsel). Die Sim liefert nur reine Prüfungen (`src/sim/honors.ts`) und die Def-Werte (`src/sim/defs/honors.ts`). Den Partie-Merker `{ seed, unlockMode }` führt das Buch selbst; «Neue Insel» schreibt ihn, Seitenstart und Laden lesen ihn. Ein Tempo-Stück zählt nur bei `run.seed === world.seed` und `unlockMode === 'stepwise'`. Ein neueres Buchformat wird nur gelesen, nie überschrieben.

## Alternativen

- **Weltfeld `setup` mit Save v19:** sauberer Partie-Rahmen, aber ein Save-Wechsel nur für ein Nebenfeature und Eingriff in die Sim. Verworfen, bleibt als A3 offen.
- **Tempo-Stücke in jedem Modus:** kein Merker nötig, aber «alles frei» entwertet die Tempo-Stücke. Verworfen.

## Folgen

- RL-1: Gleicher Seed (`Date.now() % 100000`) in einem alten «alles frei»-Stand zählt als stufenweise, etwa 1 : 100 000 je Paar, hingenommen.
- Zwei Fenster: «Neue Insel» in Fenster B überschreibt den Merker; in A zählen Tempo-Stücke nach Neuladen nicht mehr (sichere Seite, Hinweis erscheint).
- Kein Export und keine Synchronisierung zwischen Geräten.
- `new Date()` und Speicherzugriff nur in `src/ui/`; die Sim bleibt DOM- und uhrfrei.

## Andockstellen für die Inselproben (offen, nicht festgelegt)

- **A1:** Bestzeiten als Abschnitt `records` im Buch (v2); ein Leser v1 behandelt v2 als schreibgeschützt.
- **A2:** «Probe n bestanden» als weitere Stücke; der Merker würde um `probe` erweitert.
- **A3:** `unlockMode` wandert in einen Partie-Rahmen der Welt (v19); der Merker entfällt.
