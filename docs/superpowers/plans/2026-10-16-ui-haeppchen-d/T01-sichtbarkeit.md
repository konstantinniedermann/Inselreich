# T01 · Log-Box sichtbar bei Einträgen, `LOG_MAX` 20

Umsetzer `tech-ui-engineer` · ≈ 30 Tools · AK-UD-01, 02, 06 · blocked-by: T00

## Dateien

- ändern: `src/ui/crisisLog.ts` (neu `eventLogVisible`, `LOG_MAX` 10 → 20), `src/ui/app.ts` (Aufruf in `refresh()` Z. ≈ 930: `crisisLogVisible(world)` → `eventLogVisible(world, state.eventLog)`), `src/ui/eventLogView.ts` (nur Kommentar an `updateEventLog`: «verborgen ohne Einträge», Logik bleibt)
- ändern: `tests/ui/crisisLog.test.ts`

## Schnittstelle

```ts
export function eventLogVisible(
  world: Pick<World, 'crisisLevel' | 'tick'>,
  entries: readonly LogEntry[],
): boolean;
// crisisLogVisible(world) || entries.length > 0
```

`crisisLogVisible` bleibt unverändert (steuert weiter die Legende in `guide.ts`; grep: nur `guide.ts` und `app.ts`). In `updateEventLog` bleibt `box.hidden = !visible || entries.length === 0`: Krisen an ohne Einträge bleibt verborgen, mit Eintrag und «Krisen: aus» erscheint die Box.

## Testfälle (rot zuerst)

- **AK-UD-01** `eventLogVisible`: Krisen an, `tick >= CRISIS_FIRST_TICK`, leer → true; Krisen `off`, leer → false; Krisen `off`, ein Eintrag → true; Krisen an, `tick < CRISIS_FIRST_TICK`, leer → false.
- **AK-UD-02** bestehende `crisisLogVisible`-Tests unverändert grün; `guide.ts` nutzt weiter `crisisLogVisible` (grep im Review).
- **AK-UD-06** `pushLog` hält höchstens `LOG_MAX` (= 20, Wert im Test über die Konstante, plus einmal hart `toBe(20)`); 12 stille Einträge vor einer Krise: die Krise bleibt im Puffer. Die Deckelung `unreadLabel` «9+» bleibt (bestehender Test).

## Schritte

1. Tests (Rot-Beleg), 2. `crisisLog.ts`, 3. `app.ts`-Aufruf, 4. grün, `npx tsc --noEmit` bzw. `make lint`.

## Prüfschritte / Task-Review

Reviewer: `LOG_MAX` nirgends sonst hart (grep `10` in `eventLogView.ts`, `app.ts`); Log nicht im Save (`grep eventLog src/sim` leer).
