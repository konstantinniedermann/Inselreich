# T03 · Automatische Vertragslieferung und -bruch ins Log

Umsetzer `tech-ui-engineer` · ≈ 25 Tools · AK-UD-05b · blocked-by: T02

## Dateien

- ändern: `src/ui/autoLog.ts` (neue Funktion), `tests/ui/autoLog.test.ts`
- lesen: `src/ui/order.ts` (`contractNotice`, nicht ändern), `src/sim/types.ts` (`StepReport.contract`)

## Schnittstelle

```ts
/** Ein Eintrag je Vertragsereignis der Schritte eines Frames; Text wie `contractNotice`, toast 'info' (delivered) bzw. 'warn' (broken). */
export function contractLogEntries(
  reports: readonly StepReport[],
  world: World,
  tick: number,
): LogEntry[];
```

## Testfälle (rot zuerst)

- **AK-UD-05b** `delivered` → Eintrag «Stammkunde: 10 Rum geliefert, +…», `toast` `info`; `broken` (Gründe `stock`, `kontor`, ohne Grund) → «Stammkunde abgesprungen…», `toast` `warn`; Texte gleich `contractNotice(...).text`; `isNotable` true, `nextUnread` zählt 1. Berichte ohne Vertrag (`contract: null`) → `[]`. Zwei Ereignisse im Frame → zwei Einträge in Reihenfolge der Berichte.
- Der Eintrag ersetzt die Toast-Meldung nicht (`announceContract` bleibt); der Eintrag selbst löst **keinen** zweiten Toast aus: in T04 werden für diese Einträge keine `showMessage` aufgerufen.

## Prüfschritte / Task-Review

Reviewer: kein Duplikat der Texte (Aufruf von `contractNotice`, nicht kopiert, DRY).
