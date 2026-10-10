# T15 · Final-Review `opus` über beide Stränge (Gate Merge M13)

Rolle `qa-code-reviewer` · Modell **opus** (Kopfzeile `Modell: opus (Final-Review über beide Stränge)`) · gestartet von `lead-qa` (Stufe voll, Budget lead-qa 1) · alle AK aus [ak.md](ak.md) · blocked-by T14 und „bereit fürs Final-Review“ von lead-tech

**Gegenstand:** `feat/m13-e1-sim` und `feat/m13-e1-ui` gegen `main` (nach REL-17). Diff **je Datei** lesen: `git diff main...feat/m13-e1-ui --stat`, dann je Datei; zusätzlich `git diff main...feat/m13-e1-sim --stat` (muss eine Teilmenge sein; `feat/m13-e1-ui` enthält den letzten Sim-Stand). Erwartete Dateien: Ownership-Tabelle im [Index](index.md); jede weitere Datei ist ein Befund.

## Prüfpunkte

1. **AK-Abdeckung:** je AK den Test bzw. den T14-Schritt aus den Ledgern `.superpowers/sdd/m13-e1-sim/ledger.md`, `.superpowers/sdd/m13-e1-ui/ledger.md` und dem Playtest-Report; Rot-Belege je Task vorhanden. Fehlt ein Beleg → BEDENKEN.
2. **Baseline (AK-M13E1-21):** `git diff --diff-filter=M --stat main -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts tests/sim/seePins.ts` nennt nur `balance-upgrade.test.ts` mit einer `buyPrice`-Zeile; `controller.ts`/`merchantsController.ts` nur `buyPrice(w, …)`; keine Wertänderung in bestehenden Defs (`git diff main -- src/sim/defs` nur Zusätze).
3. **Bitgleich ohne Edikt/Stilllegung:** jede neue Formel hat einen Neutralzweig (Edikt `null`, `paused` fehlt), der exakt den alten Ausdruck rechnet (`buyPrice`, `totalUpkeep`, `taxUnits`, Takt, Stapelregel); kein neuer Pfad liest Zufall oder hängt Brandziele an `state`/`paused`.
4. **Save v11:** Migration wirft nie, lässt vorhandene Werte stehen; C1–C7 vollständig; `'paused'` in `BUILDING_STATES`; `foldBackToV9` ruft `foldBackToV10` nur bei `version 11`; kein Pin-Wert geändert; Abweisen inkompatibler Stände mit Grund (AK-25, 26, 41).
5. **Module:** `townhall.ts` Blatt; `edicts.ts`, `pause.ts` ohne Kreis; `buildingUpkeep` einziger Upkeep-Leseort ausser `levels.ts`; `src/ui/` ändert nie die Welt ausser über Sim-Aktionen; `edictView.ts` rein.
6. **Vorrang Ausfall → stillgelegt → Anbindung** an allen fünf Stellen (Sim) und in `stateInfo`, `stateTone`, `troubleLine`; Problemliste und `cutOffIds` ohne stillgelegte Betriebe (E4).
7. **UI:** Knoten der Edikt-Karten stabil (U-5), keine Zahl hart im UI, Texte wörtlich laut Spec; desktop-first ohne waagrechtes Scrollen (T14-Messwert).
8. **Seed-Läufe:** Festwerte gesetzt (kein `NaN`), Grenzen relativ zu K′ unverändert gegen Anhang 03; Laufzeiten unter `CI=true` ≤ 50 % des Timeouts (`.studio/zeitreserve.json`, gates.md Gate Merge Frage 5); kein Eintrag in `ZEITTESTS`.
9. **Doku:** README (B2-Satz wörtlich), arc42 (Bausteine, Tick, Persistenz v11) stimmen mit dem Code; Beobachtungen nur angehängt.
10. **Prüfläufe** (selbst, gezielt): `npx vitest run tests/sim/edicts.test.ts tests/sim/pause.test.ts tests/sim/save-v11.test.ts tests/sim/balance.test.ts tests/ui/edictView.test.ts tests/ui/problems.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`; `make check` Exit 0 laut Controller; `git merge-tree --write-tree main feat/m13-e1-ui; echo EXIT=$?` → 0. Nie in eine Pipe.

## Ausgabe

Urteil **OK / BEDENKEN / ZURÜCK**, Befunde mit Datei:Zeile, Schweregrad und Empfehlung; Befunde ausserhalb des Scopes als Vorschlag für `docs/beobachtungen.md`. Der Schlussbericht ist der Report. Keinen Code ändern.
