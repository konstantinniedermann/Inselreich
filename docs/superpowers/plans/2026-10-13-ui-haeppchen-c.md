# Plan UI-HAEPPCHEN-C · Marktvergleich auf der Angebotskarte, Sprung Vertragskarte → Erzeuger (Kurzplan, Stufe leicht)

Owner `lead-tech` · Quelle: `docs/ideen.md` I-088, I-090; R606 (einplanen, Kombiniertes Gate); I-047-Spec Teil B.4 (Auftragskarte). Plan gegen main `49cc6385` (I-047 ist dort lokal enthalten, `src/ui/order.ts`).
Spielerwirkung: Der Spieler sieht auf dem Stammkunde-Angebot «Markt ≈ 5 je Stück · Erzeugung 31 / min» und entscheidet mit Zahlen; beim laufenden Vertrag springt ein Klick zu seinem Erzeuger des Vertragsguts.
**Kein Sim-Eingriff** (`git diff src/sim/` leer), **kein Save** (`SAVE_VERSION` unverändert, Zustand nur in der `app.ts`-Closure), keine Abhängigkeit (ADR-001), Spielwerte und Balancing unberührt.

## Kurz-Spec

- **I-088.** `orderCardText` (Angebot offen) nennt zusätzlich den Marktverkaufspreis und die Erzeugung auf der Lieferinsel. Quellen sind vorhandene Sim-Funktionen, keine zweite Rechnung: `sellPrice(world, good, 1)` (`src/sim/trade.ts`, mit Sättigung und Boom wie der Handelsdialog), `goodsBalance(world, offer.island)[good].produced` und `perMinute(…, GOODS_BALANCE_TICKS)` (`time.ts`). Neuer Wortlaut: «Stammkunde: 23 Holz alle 1:30 zu 6 je Stück · Markt jetzt ≈ 5 · Erzeugung 31 / min · Angebot noch m:ss»; Erzeugung 0 → «keine Erzeugung»; Fremdinsel-Zusatz «auf <Insel>» bleibt. Nur Zahlen, keine Empfehlung, keine Farbe.
- **I-090.** Neuer Knopf «Zum Erzeuger» auf der Vertragskarte (sichtbar nur bei `world.contract !== null`, neben «Kündigen»). Klick: erster Erzeuger von `contract.good` auf `contract.island` aus `focusList` (nur Rolle `producer`, Reihenfolge Abstand zu `jumpTarget`, dann ID), Kamera mit `spot`, Panel öffnen (`jumpToBuilding`-Pfad der `app.ts`, folgt der Insel). Wiederholter Klick wechselt reihum (`stepList`, eigener Cursor in der Closure, getrennt von Problem- und Fokus-Cursor). Kein Erzeuger → Meldung `noProducerMessage`, kein Sprung. Der Knopf setzt **keinen** Gut-Fokus (`goodFocus` bleibt unberührt).
- **Auftragsprämie:** Das Gate-Briefing nennt «Marktverkaufspreis bzw. Auftragsprämie». Während eines Angebots läuft nie ein Auftrag (I-047 B.3), also gibt es nichts zu vergleichen; die Auftragskarte bleibt unverändert. Zur Bestätigung durch das Gate.

## Entscheidungspunkte für das Gate

1. **Spec-Delta I-047:** Der Wortlaut «Angebot offen» in I-047 B.4 und `tests/ui/order.test.ts:113,120` ändert sich bewusst; T01 zieht den Test nach (kein Rot-Beleg-Verlust: neue AK zuerst rot).
2. «Markt ≈» zeigt den Preis der **ersten** Einheit (`sellPrice(…, 1)`), nicht den Durchschnitt einer Lieferung (bei Sättigung läge der Durchschnitt tiefer). Alternative: `sellPrice(…, amount)/amount`. Empfehlung: erste Einheit, weil es der Wert im Handelsdialog ist.
3. Marktpreis gilt ohne Rücksicht auf ein fehlendes Kontor (Zahlen, kein Handelsangebot).

## Architektur und Dateimatrix

| Datei                                                                  | T01      | T02 |
| ---------------------------------------------------------------------- | -------- | --- |
| `src/ui/order.ts` (`orderCardText`, `renderOrder`, `updateOrder`)      | ja       | ja  |
| `src/ui/contractJump.ts` (neu, rein: Liste, Schritt, Meldung)          |          | ja  |
| `src/ui/app.ts` (Cursor, Aktion `jumpToContractProducer`, Verdrahtung) |          | ja  |
| `src/style.css` (nur falls Knopf die Karte sprengt)                    |          | ja  |
| `tests/ui/order.test.ts`, `tests/ui/contractJump.test.ts` (neu)        | ja       | ja  |
| `README.md`, `docs/arc42.md`, `docs/ideen.md` (I-088/I-090 → live)     | Lead T03 |     |

Nicht angefasst: `src/sim/`, `src/render/`, `src/audio/`, `docs/studio/`. Serielle Umsetzung in einem Strang/Worktree `.worktrees/ui-haeppchen-c-impl` (Grund: beide Tasks ändern `order.ts` und `order.test.ts`).

## Tasks

| Task | Titel                                | Datei                                     | AK-IDs          | Strang | blocked-by | Modell |
| ---- | ------------------------------------ | ----------------------------------------- | --------------- | ------ | ---------- | ------ |
| T01  | Marktvergleich auf der Angebotskarte | `2026-10-13-ui-haeppchen-c/T01-markt.md`  | AK-HC-01 bis 05 | 1      | Merge-Gate | sonnet |
| T02  | Knopf «Zum Erzeuger» + Sprunglogik   | `2026-10-13-ui-haeppchen-c/T02-sprung.md` | AK-HC-06 bis 12 | 1      | T01        | sonnet |
| T03  | Doku (Lead, D1 erlaubt, E-017)       | —                                         | AK-HC-13        | 1      | T02        | sonnet |

Je Task: Umsetzer `tech-ui-engineer`, danach Task-Review `qa-code-reviewer` (sonnet), Playtest `qa-playtester` 1280×720 und 1920×1080 (Screenshots `.studio/qa/ui-haeppchen-c/`), Final-Review opus über die Branch. Fix-Runden per SendMessage.
**Vor T01:** Zeitmessung der berührten Tests (`order.test.ts`, `goodFocus.test.ts`, `problems.test.ts`) nach `.studio/qa/ui-haeppchen-c/zeit-vor.json`. **Neue Tests lokal × 3 grün, jeder ≤ 50 % des Timeouts (R593).** Rot-Beleg je AK-Gruppe vor der Umsetzung (Ausgabe des roten Laufs im Task-Bericht).

## Abnahmekriterien (Präfix AK-HC-, L0 bestätigt)

**I-088**

- **AK-HC-01** Angebotskarte enthält «Markt jetzt ≈ N» mit `N = sellPrice(world, good, 1)`; Rot-Test mit mehreren Gütern.
- **AK-HC-02** Boom auf das Gut und Sättigung (`sellPct` gesenkt) ändern N gegenüber der Grundwelt; Test gleicht gegen `sellPrice` ab (keine eigene Formel in `src/ui/`).
- **AK-HC-03** Erzeugung = `perMinute(goodsBalance(world, offer.island)[good].produced, GOODS_BALANCE_TICKS)` der **Lieferinsel**, Format «Erzeugung x / min»; ohne Erzeuger «keine Erzeugung»; stillgelegte oder unangebundene Betriebe zählen nicht (kommt aus `goodsBalance`).
- **AK-HC-04** Fremdinsel-Zusatz und «Angebot noch m:ss» bleiben; Karte mit Vertrag oder ohne Angebot unverändert (bestehende Tests grün, die zwei Angebots-Wortlaute bewusst nachgezogen, Spec-Delta).
- **AK-HC-05** Browser 1280×720 und 1920×1080: Karte läuft nicht über, überdeckt die Krisenkarte nicht (Abstand 6 px bleibt, R589), Text ohne Abschneiden; Welt vor/nach `orderCardText` per `structuredClone` gleich.

**I-090**

- **AK-HC-06** `contractProducers(world)` liefert nur Erzeuger (`goodRole === 'producer'`) von `contract.good` auf `contract.island`, sortiert wie `focusList`; ohne Vertrag leer.
- **AK-HC-07** Klick 1 landet beim ersten Erzeuger (Kamera auf `spot`, Panel offen, Insel folgt, auch auf ferner Insel); Klick 2 beim zweiten, nach dem letzten wieder beim ersten; fällt der Erzeuger zwischen zwei Klicks weg, gilt das Verhalten von `stepList`.
- **AK-HC-08** Kein Erzeuger: Meldung `noProducerMessage`, Kamera, Panel und Cursor bleiben unverändert.
- **AK-HC-09** Der Sprung setzt keinen Gut-Fokus und ändert `fullSince`, Problem- und Fokus-Cursor nicht; Meldung nennt «Erzeuger i von n» in der Form von `focusMessage`.
- **AK-HC-10** Knopf nur bei aktivem Vertrag sichtbar (`updateOrder` setzt `hidden`), nicht bei Angebot, Auftrag oder leerer Karte; Tastatur: Tab-Reihenfolge Zum Erzeuger → Kündigen, Fokusring sichtbar (Browser-Beleg); `btn.blur()` wie bei den anderen Knöpfen.
- **AK-HC-11** Klickfläche verschiebt das Layout nicht: Kartenhöhe mit und ohne Knopf bei 1280×720 gemessen, Abstand zur Krisenkarte weiter 6 px (R589).
- **AK-HC-12** Kontrakt-Test: `focusList`, `spot`, `jumpTarget`, `noProducerMessage` haben die erwartete Signatur (Umbenennung bricht laut); `git diff src/sim/` leer, `SAVE_VERSION` unverändert (AK-HC-12 prüft beides).

**Doku**

- **AK-HC-13** README (Auftragskarte: Marktvergleich, Knopf «Zum Erzeuger»), `docs/arc42.md` (`contractJump.ts`, UI-Zustand Cursor), `docs/ideen.md` I-088/I-090 auf `live`; `make docs-check` Exit 0.

## Budgetantrag

| Posten                                 | Starts |
| -------------------------------------- | ------ |
| Umsetzer T01, T02 (`tech-ui-engineer`) | 2      |
| Task-Review T01, T02 (sonnet)          | 2      |
| Playtest T01, T02 (`qa-playtester`)    | 2      |
| Final-Review (opus, ganze Branch)      | 1      |
| Summe                                  | 7      |
| Puffer 30 %, aufgerundet               | **10** |

Parallelität 1 (Datei-Eigentum, siehe oben); Fix-Runden und Delta-Review per `SendMessage`, nicht gezählt. Schätzung ≈ 110 Tools (Ideen: 60 + 50). Abschluss: `make check` Exit 0, Exit-Codes im Bericht, Handoff nach `.studio/handoffs/`.

## Nachtrag R607 (Auflagen QA, vom Controller eingetragen, vor T01)

Strang/Worktree ist `.worktrees/ui-haeppchen-c`, Branch `feat/ui-haeppchen-c` (statt `-impl`). Entscheide: «Markt ≈» = Preis der ersten Einheit; Auftragsprämie entfällt; Wortlaut-Delta zu I-047 B.4 bewusst (Spec-Vermerk, `order.test.ts` mit T01).

1. **Rechenzeit (T01, AK-HC-01/03):** Messwelt Spätspiel ≥ 1000 Gebäude; `orderCardText` im Angebotszweig ≤ 1 ms je Frame (Messung im Task-Bericht, Median über ≥ 200 Aufrufe). Rückfall bei Überschreitung: Cache je `world.tick` / Insel / Gut (Schlüssel `tick|island|good`, nur in `order.ts`-Closure, nicht im Spielstand).
2. **N = 0 (AK-HC-01):** Wortlaut bei Marktpreis 0 (Gut nicht handelbar/ausverkauft): `Markt jetzt ≈ 0`; Erzeugung 0: `keine Erzeugung`. Test für beide Fälle.
3. **Cursor (AK-HC-07):** `contractCursor` wird bei Vertragsende, Vertragswechsel (anderes Gut oder andere Insel) und `restart` auf `null` gesetzt; Test: nach Wechsel beginnt Klick 1 wieder beim ersten Erzeuger. Inselwechsel (Sprung auf ferne Insel, Spieler wechselt zurück): `stepList` setzt den Cursor bei `landed !== activeIsland` zurück; als Test festhalten.
4. **Stillgelegte Erzeuger (AK-HC-06/07):** werden angesprungen (Liste filtert nur Rolle, nicht Zustand); Test mit stillgelegtem Betrieb. `runContractJump` bei `world.contract === null` tut nichts (keine Meldung, keine Kamera, kein Cursor); Test.
5. **Rot-Beleg / Signatur:** Rot-Lauf je Testgruppe im Bericht; wo kein Rot möglich ist (z. B. Kontrakt-Test auf bestehende Signaturen), Vermerk «kein Rot möglich, Beleg = <Grund>». Signaturen: `contractProducers(world: World): FocusEntry[]`; `runContractJump(deps: ContractJumpDeps, dir: 1 | -1): void`; `contractNoProducerMessage(world: World, c: { good: GoodId; island: number }): string`; `OrderActions.toProducer(): void`.
6. **Meldung kein Erzeuger:** `contractNoProducerMessage` = `noProducerMessage(world, good)` plus Inselzusatz: `Noch kein Erzeuger für Holz auf <Insel> — Bauen: …` (Name via `islandName`; Zusatz auch auf der Heimatinsel). Test.
