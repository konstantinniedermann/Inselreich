# T06 · Version festlegen, Doku, Zeitmessung nachher

Plan: [Index](../2026-10-16-i091-treue.md) · R663 (Nummer beim Merge), Spec §6 «Doku-Folgen», AK-TR-16 (Beleg) · Umsetzer
`tech-sim-engineer` · Modell sonnet · ≈ 30 Tools · blocked-by: T05 · **letzter Task vor dem Final-Review**

**Files:**

- Modify (nur bei Renummerierung): `src/sim/save.ts`, `src/sim/types.ts`, `src/sim/world.ts`,
  `tests/sim/save-loyalty.test.ts` (Import des Migrationsnamens), ggf. `tests/sim/helpers.ts` (Reihenfolge der Faltschritte)
- Modify (D1, E-017 ausdrücklich erlaubt): `README.md` (Spielanleitung Stammkunde), `docs/spielwerte.md` (Abschnitt
  «Stammkunde», ein Absatz Treue), `docs/arc42.md` (Bausteine `orders.ts`/`save.ts`/`order.ts`, Persistenz «Save v<S>»),
  `docs/beobachtungen.md` (nur bei Befunden)
- **Nicht:** `docs/studio/rulings.md` (R471: Entwurf an L0 im Bericht), Specs

## Schritte

- [ ] **1 main holen:** `git merge main` (kein Rebase). `M=$(git show main:src/sim/save.ts | grep -o 'SAVE_VERSION = [0-9]*')`.
- [ ] **2 Wächter:** `git diff main -- tests | grep -nE "^\+.*(version\W{1,4}1[4-9]|SAVE_VERSION\s*[-+]\s*[2-9])"; echo EXIT=$?`
      → nur die in T02 genannten Ausnahmen (Generator, AK-14c mit 14).
- [ ] **3 Nummer festlegen:**
  - Fall **frei** (main hat `SAVE_VERSION = S − 1`): nichts ändern.
  - Das v14-Fixture bleibt in beiden Fällen gültig (historisch). Sein Generator (T02) gilt nur für `S = M + 1` direkt
    über v15; nach einer Renummerierung nicht erneut laufen lassen (die Prüfung `x.version === 14` schlüge fehl).
  - Fall **besetzt** (main hat `M ≥ S`, z. B. Erweiterung 1 zuerst): `S' = M + 1`, sieben Stellen:
    1. `save.ts` `SAVE_VERSION = S'`;
    2. Migration umbenennen `migrateV<M>ToV<S'>`, darin `raw.version = S'`;
    3. Kettenglied `if (raw.version === M) migrateV<M>ToV<S'>(raw);` **hinter** das letzte Glied von main;
    4. `types.ts` `version: S'`;
    5. `world.ts` `version: S'`;
    6. Import in `save-loyalty.test.ts`;
    7. `tests/sim/helpers.ts`: Hat die andere Version einen eigenen Faltschritt, läuft `foldBackDeliveries` **vor** ihm
       (neueste zuerst); die Mitzieh-Stelle in `farOrder-save.test.ts` (T02 Schritt 6) bekommt den fremden Faltschritt
       zwischen `foldBackDeliveries` und das Löschen der Fernfelder.
  - Merge-Konflikt in der Kette von `deserialize`: beide Glieder behalten, aufsteigend.
- [ ] **4 Beleg der Kette:** `npx vitest run tests/sim/save-loyalty.test.ts tests/sim/farOrder-save.test.ts
tests/sim/save-contract.test.ts tests/sim/save.test.ts tests/sim/scenario-saves.test.ts tests/sim/seaGolden.test.ts
tests/sim/helpers.test.ts; echo EXIT=$?` → 0, ohne Teständerung ausser Schritt 3 Punkt 6/7.
- [ ] **5 Doku (D1):**
  - `README.md`, Abschnitt Stammkunde: ein Satz «Nach 5 pünktlichen Lieferungen ist der Stammkunde treu und verzeiht einen
    Fehlbestand einmal ohne Strafe; danach zählt die Treue neu. Kündigen setzt sie zurück.» (Zahl aus
    `CONTRACT_LOYAL_AFTER`, Spielanleitung darf den Wert nennen.)
  - `docs/spielwerte.md` «Stammkunde»: ein Absatz Treue mit `CONTRACT_LOYAL_AFTER = 5`, Kulanz nur bei `stock`/`kontor`,
    Deckel eine Kulanz je 5 Lieferungen, kein Geldbonus (R670).
  - `docs/arc42.md`: Baustein `orders.ts` (Treue-Zähler, Kulanz), `order.ts` (`loyaltyText`, `excused`-Meldung), `save.ts`
    (Version S, `migrateV<S−1>ToV<S>`: `contract.deliveries = 0`), Persistenz-Abschnitt neuer Punkt «Save v<S> (I-091)»,
    Tick-Ablauf `tickOrders` («Lieferung oder Kulanz: keine Angebote»), `StepReport.contract` mit Form `excused`. Nur die
    betroffenen Zeilen per `grep -n` lesen (Datei > 30 KB, E-057).
  - `make docs-check; echo EXIT=$?` → 0.
- [ ] **6 Zeitmessung nachher (Controller, R392):** derselbe Befehl wie T00 mit `zeit-nach.json`; Tabelle Datei/Dauer
      vor/nach/Differenz in `.studio/qa/i091/zeit-vergleich.md`. Abnahme nach Index «Zeitmessung».
- [ ] **7 AK-TR-16:** `git diff main -- tests/sim/balance.test.ts tests/sim/controller.ts; echo EXIT=$?` → leer;
      `npx vitest run tests/sim/balance.test.ts tests/sim/contract.test.ts; echo EXIT=$?` → 0 (ganze Dateien, kein `-t`-Filter,
      R675 P3; AK-SK-25 grep-Test liegt in `contract.test.ts`).
- [ ] **8 Pflichtläufe:** bei Renummerierung `npx tsc --noEmit`, `make lint` (je `; echo EXIT=$?`). Controller danach:
      `make zeittests`, `make conflicts`, `make check`, `make zeitreserve-gate` (je `; echo EXIT=$?`).
- [ ] **9 Commits:** `docs: Treue in README, spielwerte, arc42 (I-091 T06)`; bei Renummerierung zusätzlich
      `refactor: Save-Version I-091 auf v<S'> (T06)`.

## Bericht (Entwurf an L0, R471)

«I-091 erhält Save-Version S (main + 1 beim Merge, R663); Kette v1 … vS, `migrateV<S−1>ToV<S>` ergänzt
`contract.deliveries = 0`.» Wird I-091 nach dem Final-Review überholt (anderer Save-Merge), wiederholt der Controller die
Schritte 1–4 als Fix-Runde vor dem Merge-Gate.

## Prüfschritte / Task-Review

Reviewer prüft: Nummer = main + 1, Kette lückenlos, kein Test nennt S, Doku nennt dieselbe Nummer wie `save.ts`,
`docs-check` Exit 0, Zeitvergleich abgelegt.
