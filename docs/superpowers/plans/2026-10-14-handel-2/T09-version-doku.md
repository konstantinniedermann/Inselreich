# T09 · Version festlegen, ADR-010-Nachtrag, arc42 (R633 T5)

Plan: [Index](../2026-10-14-handel-2.md) · AK-H2-21 (Nummer unabhängig), R633 T5, Spec §3 «Save», §7 «Doku-Folgen» · Modell sonnet ·
≈ 25 Tools · **letzter Task vor dem Final-Review**

**Files:**

- Modify (nur bei Renummerierung): `src/sim/save.ts`, `src/sim/types.ts`, `src/sim/world.ts`, ggf. `tests/sim/helpers.ts`
  (Reihenfolge der Faltschritte, siehe Fall K2)
- Modify: `docs/adr/ADR-010-zufall-je-periode.md` (Nachtrag), `docs/arc42.md` (Bausteine `orders.ts`/`save.ts`, Laufzeit
  `tickOrders`, Persistenz) — D1, E-017 ausdrücklich erlaubt

**Interfaces:**

- Consumes: alles aus T01–T08. Produces: endgültige `SAVE_VERSION`; Doku für den Merge.

## Schritte

- [ ] **Step 1: main holen** — `git merge main` (kein Rebase). `git show main:src/sim/save.ts | grep -n "SAVE_VERSION ="`.

- [ ] **Step 2: Test als Wächter (T5)** — vor jeder Änderung beweisen, dass kein Test eine Versionszahl nennt:

```bash
git diff main --name-only -- tests | xargs grep -nE "version\W{1,4}1[4-9]|SAVE_VERSION\s*[-+]\s*[2-9]|V1[45]" ; echo EXIT=$?
```

Erwartet `EXIT=1` (kein Treffer). Treffer → in der betroffenen Testdatei auf `SAVE_VERSION`/`SAVE_VERSION − 1` umstellen
(Ausnahme: Namen bestehender Faltfunktionen `foldBackToV13` usw.).

- [ ] **Step 3: Nummer festlegen** — Fall **frei** (`main` hat `SAVE_VERSION = 14`): nichts ändern, v15 bleibt.
      Fall **K2 zuerst gemerged** (`main` hat `n ≥ 15`): auf `n + 1` umstellen:
  - `save.ts`: `SAVE_VERSION = n + 1`; `migrateV14ToV15` → `migrateV<n>ToV<n+1>`, `raw.version = n + 1`; Aufruf in
    `deserialize` **hinter** das Glied von K2 (`if (raw.version === n) migrateV<n>ToV<n+1>(raw);`).
  - `types.ts` `World.version: n + 1`; `world.ts` `version: n + 1`.
  - `tests/sim/helpers.ts`: `foldBackFarOrders` wird **äusserster** Schritt vor dem K2-Faltschritt (neueste Version zuerst):
    in der K2-Faltfunktion bzw. in `foldBackToV13`/`V12`/`V11` muss `foldBackFarOrders` vor dem K2-Schritt laufen.
  - Fall **Handel 2 zuerst**: Hinweis im Bericht an L0 für die Nutzer-Session: K2 nimmt `v16` und setzt seinen Faltschritt vor
    `foldBackFarOrders` (Dateimatrix im Index).

- [ ] **Step 4: Rot/Grün-Beleg der Kette** — `npx vitest run tests/sim/farOrder-save.test.ts tests/sim/save.test.ts
tests/sim/save-contract.test.ts tests/sim/scenario-saves.test.ts tests/sim/seaGolden.test.ts tests/sim/helpers.test.ts; echo EXIT=$?`
      → 0, **ohne** Teständerung durch die Renummerierung (das ist der Beleg für T5). Bei Fall «frei» genügt der Lauf.

- [ ] **Step 5: ADR-010 Nachtrag** — neuer Abschnitt am Ende:

```markdown
## Nachtrag Handel 2 (2026-10-14): Fernangebot ohne Zufall

Plan: [Handel 2](../superpowers/plans/2026-10-14-handel-2.md) · Spec: [Fernangebot](../superpowers/specs/2026-10-14-handel-2-fernangebot.md)

- Das Fernangebot zieht **keinen** Zufall: Die Insel der Periode `k` ist `farEligible(world)[k mod n]` (Rotation in
  Indexfolge), das Gut ist das erste Vorliebe-Gut mit `order.far`. Kein neuer Strom, keine neue Salz-Konstante.
- `orderForPeriod` bleibt unverändert und zustandslos; der Zufallsauftrag der Periode ist mit und ohne Fernangebot derselbe
  (Test `farOrder-offer.test.ts`, R13). Der Save trägt nur Ergebnisse (`farOffer`, `farSkip`, `order.island`), keinen RNG-Zustand.
```

- [ ] **Step 6: arc42** — Bausteinzeile `orders.ts`: `farGood`, `farEligible`, `acceptFarOrder` (Handel 2), `deliverOrder` mit
      Ortsprüfung beim Fernauftrag, `nextOrderTick` überspringt die gesperrte Periode. Zeile `save.ts`: Version und
      `migrateV14ToV15` (bzw. Nummer aus Step 3) mit `farOffer`, `farSkip` je `null`. Laufzeit-Tabelle `tickOrders`: Ablauf R12
      (Verfall räumt auch `farOffer`; am Periodenbeginn `farSkip` verbrauchen; Vertrag; dann Zufallsauftrag und Fernangebot, nicht
      in der gesperrten Periode). Persistenz: neuer Absatz «**Save v15 (Handel 2, Fernangebot):**» nach dem v14-Absatz — letzte
      Schlüssel `farOffer` (`null` oder `{ island, good, amount, reward }`), `farSkip` (`null` oder Periodenindex),
      `Order.island` nur beim Fernauftrag; Prüfung `isValidFarFields` und Fristfenster ohne `FAR_ORDER_DURATION` (P-3);
      Test-Helfer `foldBackFarOrders`. Text v14 «Eine Version über 14 ergibt …» auf die neue Zahl anpassen.
      Die Zeile `ui/order.ts` bzw. UI-Bausteine: `farOrder.ts` (Texte, Log T-16…T-18) ergänzen.

- [ ] **Step 7: Prüfen** — `make docs-check; echo EXIT=$?` → 0; `npx tsc --noEmit; echo EXIT=$?` → 0.

- [ ] **Step 8: Commit** — `git commit -m "docs: Save-Version Handel 2, ADR-010-Nachtrag und arc42 (Handel 2 T09)"`
      (bei Renummerierung zusätzlich `refactor:`-Commit für den Code getrennt vorher).

## Abnahme

- Grep aus Step 2 ohne Treffer; Kette v1 … neu grün; `Unbekannte Version` für `SAVE_VERSION + 1` grün.
- arc42 nennt Tick-Ablauf R12 und den Save-Absatz; ADR-010 hat den Nachtrag.
- Bericht: gewählter Fall (frei / K2 zuerst), endgültige Nummer, Exit-Codes.
