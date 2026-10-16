# T06 · `reachView` und Schwellen (I-109, Teil B)

Umsetzer `tech-ui-engineer` · ≈ 35 Tools · AK-UR-01, 02, 03 · blocked-by: T04 (nur Reihenfolge; keine Code-Abhängigkeit zu Teil A)

## Dateien

- neu: `src/ui/reach.ts`, `tests/ui/reach.test.ts`
- ändern: `src/ui/time.ts` nur falls ein Hilfsexport nötig ist (`secToTicks`); sonst in `reach.ts` über `TICK_MS` aus `src/sim/defs/timing.ts`

## Schnittstelle

```ts
export interface ReachView {
  kind: 'empty' | 'full' | null;
  ticks: number;
  level: 'ok' | 'warn' | 'alarm';
}
export function reachView(stock: number, net: number, cap: number): ReachView;
```

`net` je 100 Ticks (`goodsBalance`). `TREND_EPS` aus `hud.ts` exportieren oder in `reach.ts` führen und von `hud.ts` importieren (eine Quelle; `hud.ts` gehört T07, daher hier in `reach.ts` definieren und in T07 umstellen). Leer: `net <= -EPS` → `ticks = stock*100/-net`; Stufe `alarm` bei Bestand 0 oder `ticks <= 60 s`, `warn` bei `<= 180 s`, sonst `ok`. Voll: `net >= EPS` und `stock < cap` → `ticks = (cap-stock)*100/net`; `warn` bei `<= 60 s`, sonst `ok`, **nie alarm**. Sonst `{ kind: null, ticks: 0, level: 'ok' }`.

## Testfälle (rot zuerst)

- **AK-UR-01** Bestand 20, net −0,5 → `empty`, `ticks` 4000, Anzeige über `formatGameTime(4000)` erwartet (kein Literal); Bestand 0, net < 0 → `empty`, `alarm`.
- **AK-UR-02** Grenzen über `secToTicks`: genau 180 s → warn, 60 s → alarm, 180 s + 1 Tick → ok; voll genau 60 s → warn, +1 Tick → ok; voll nie alarm. Ganzzahl-Eingaben wählen, die exakt auf der Grenze liegen (kein Gleitkomma-Raten).
- **AK-UR-03** `|net| < EPS` → `null`; Bestand = `cap` bei net > 0 → `null`; net > 0 → nie `empty`; net < 0 → nie `full`; Bestand 0, `net >= 0` → `null`.

## Prüfschritte / Task-Review

Reviewer: keine Zahl aus `defs/` kopiert (Schwellen sind Darstellungskonstanten, R654); reine Funktion, kein DOM.
