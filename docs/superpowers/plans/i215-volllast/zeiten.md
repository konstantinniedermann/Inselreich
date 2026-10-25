# Zeit-Tests I-215 (R392/R905) — offen

Status: **noch nicht gemessen.** Beim Planen lag die 1-min-Last bei 35 bis 50 (fremde `vitest`-Läufe in `ausbau-logik`,
`i210`, ZEITPIN-D1-Serie); die Messung wartet auf Last ≤ 4 und ein freies Messfenster (`make messfenster`).

Befehl (Plan-Worktree `.worktrees/plan-i215` auf main `1de17074`, Ausgabe nur im Scratchpad):

```bash
npx vitest related --run src/sim/levels.ts src/sim/production.ts src/sim/save.ts src/sim/economy.ts \
  src/sim/defs/timing.ts src/sim/defs/buildings.ts src/sim/types.ts src/ui/inspect.ts src/ui/panelView.ts \
  src/ui/texts.ts src/ui/upkeepRank.ts src/ui/app.ts --reporter=json --outputFile=<scratchpad>/times.json
```

Einzutragen: jeder Test > 200 ms (Datei, Name, ms), Last vor und nach dem Lauf. Ist die Liste beim Start von T00 noch
leer, misst T00 (Schritt «Zeiten vorher»).

| Datei | Test | ms (main) | ms (Branch, T08) |
| ----- | ---- | --------- | ---------------- |
