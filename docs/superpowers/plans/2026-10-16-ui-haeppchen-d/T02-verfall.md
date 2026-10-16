# T02 · Verfall von Zufallsauftrag und Stammkunden-Angebot ins Log

Umsetzer `tech-ui-engineer` · ≈ 40 Tools · AK-UD-03, 04, 05a · blocked-by: T01

## Dateien

- neu: `src/ui/autoLog.ts`, `tests/ui/autoLog.test.ts` (DOM-frei, importiert nicht `./app`; darf `./farOrder` für `FarSnap` und `./crisisLog` für `LogEntry` importieren)
- `farLogEntries` und `tests/ui/farOrder.test.ts` bleiben unverändert (AK-H2-33 (d) gilt weiter)

## Schnittstelle

```ts
export interface AutoSnap {
  order: Order | null;
  contractOffer: ContractOffer | null;
} // Kopien
export function autoSnap(world: World): AutoSnap;
/** Verfall ohne Spielerhandlung zwischen `prev` und jetzt; älteste zuerst (Stammkunde, dann Zufallsauftrag). toast immer null. */
export function expiryLogEntries(prev: AutoSnap, world: World): LogEntry[];
```

Regeln: **Angebot** verfallen = `prev.contractOffer !== null` und (`world.contractOffer === null` oder Ware/Insel anders), dazu `world.contract === null` oder Vertrag nicht aus diesem Angebot (angenommen: Vertrag mit gleicher Ware entstand, Handler setzt `prev` ohnehin zurück, die Funktion prüft zusätzlich `world.contract?.good === prev.contractOffer.good` → kein Eintrag). Text «Stammkunden-Angebot verfallen: <Ware>». **Zufallsauftrag** verfallen = `prev.order` ohne `island`, `world.tick > prev.order.due` und (`world.order === null` oder `period` anders). Text «Auftrag verfallen: <Menge> <Ware>». Lieferung im selben Frame (`order` `null`, `tick ≤ due`) → kein Eintrag.

## Testfälle (rot zuerst)

- **AK-UD-03** Angebot vorher, nachher `null`, kein Vertrag → ein Eintrag «Stammkunden-Angebot verfallen: Rum», `toast` `null`; angenommen (Vertrag da) → `[]`; durch neues Angebot ersetzt → Eintrag für das alte.
- **AK-UD-04** Zufallsauftrag nach `due` (Welt per `stepAt` wie in `farOrder.test.ts`, Helfer `offerWorld`/`farWorld` aus `tests/ui/worlds.ts`) → «Auftrag verfallen: 15 Rum», `toast` `null`; Lieferung (`deliverOrder`) → `[]`; Fernauftrag → `[]` (das bleibt Sache von `farLogEntries`).
- **AK-UD-05a** `isNotable` für beide Einträge false (`nextUnread` zählt 0). Randfall: Lieferung und Verfall im selben Frame → Lieferung gewinnt; Fernangebot-Verfall (`farLogEntries`) und Zufallsauftrag-Verfall im selben Frame: beide Einträge, kein Doppel.
- Funktionen verändern die Welt nicht (Welt vorher/nachher `serialize` gleich, wie AK-H2-33 (e)).

## Prüfschritte / Task-Review

Reviewer: Text der Meldung `orderMessage` unberührt; kein `src/sim`-Import ausser Typen und `GOODS`.
