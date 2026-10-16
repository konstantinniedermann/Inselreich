# T10 · Reine Panel-Helfer `monumentView.ts` (TDD)

Strang ui · Worktree `.worktrees/m13-e2-ui` · Branch `feat/m13-e2-ui` · Umsetzer `tech-ui-engineer` (sonnet) ·
AK-M13E2-27, -28, -29, -30, -32 (Spec §7.1 U-1–U-4, §7.2 U-9; Anhang 07 A, B) · blocked-by Sim-Hash T04 (Schritt 0)
· Grösse M (≈ 25 Tools)

**Files:**

- Create: `src/ui/monumentView.ts`, `tests/ui/monumentView.test.ts`
- Lesen: Anhang 07 A und B (Texte wörtlich), Spec §7.1, §7.2; `src/ui/edictView.ts` (Muster reiner Helfer),
  `formatGameTime` (`src/ui/time.ts`), `buyPrice`, `monumentBuyBlock` (`src/sim/trade.ts`), `monumentReserve`,
  `monumentStartReason`, `monumentProgress` (`src/sim/monument.ts`), `MONUMENT_*` (`src/sim/defs/monument.ts`),
  `GOODS`. Testwelt: `monumentWorld`, `placeMonument` aus `tests/sim/monumentHelpers.ts`.

## Schnittstelle (DOM-frei, nur Lesen der Welt)

```ts
export interface MonumentRow {
  good: MonumentGood;
  label: string;
  pct: number;
  reserveText: string;
  buyText: string;
  buyOn: boolean;
}
export function monumentRows(w: World): MonumentRow[]; // [] ohne Denkmal oder nach stage 3
export interface MonumentStart {
  visible: boolean;
  disabled: boolean;
  reason: string | null;
  buttonText: string;
}
export function monumentStartState(w: World): MonumentStart;
export function monumentEtaText(w: World): string;
export function monumentStallReason(w: World): string | null;
export function monumentStageLine(w: World): string | null; // null ohne Denkmal
export function monumentChronicleLine(w: World): string | null; // null vor wonMerchants
/** Für den Ziel-Chip (T13): Text, Titel, Balken; null vor Phase 'done'. */
export interface MonumentChip {
  chip: string;
  title: string;
  fillPct: number;
}
export function monumentChip(w: World): MonumentChip | null;
```

- Alle Zahlen und Namen aus `MONUMENT_STAGES`, `MONUMENT_GOODS`, `GOODS[g].name`, `buyPrice(w, g, 1)`,
  `monumentReserve`, `monumentProgress`, `formatGameTime`; **keine** kopierte Zahl.
- `monumentStartState`: `reason = monumentStartReason(w)` (nicht ausführen); `disabled = reason !== null && reason !==
'Zu wenig Geld'`; `visible false` bei `running` oder `stage 3` oder ohne Denkmal.
- `monumentStallReason`: Vorrang 1–7 aus Anhang 07 A wörtlich («Bau pausiert», «Nicht angebunden», «Kein Kontor»,
  «Zu wenig Geld für den Zukauf», «Lager auf Reserve»); «lieferbar» = `stock[g] > reserve` oder (`buy[g]` und
  `monumentBuyBlock === null` und `money ≥ buyPrice`).
- `monumentChip` (Spec U-8, Anhang 07 B): `monumentDone` → «Wahlziel erreicht» (100), Titel «Wahlziel Denkmal erreicht —
  freies Spiel»; ohne Denkmal → «Wahlziel: Denkmal bauen» (0), Titel «Denkmal in der Bauleiste unter Öffentlich»;
  `running` → «Denkmal {stage + 1}/3 · {x} %» (x = `monumentProgress`); zwischen Abschnitten → «Denkmal {stage}/3»
  (⌊100 × stage / 3⌋); Titel sonst «Wahlziel Denkmal: {monumentStageLine}». `null`, solange `wonSpice` false (Chip vor
  Ziel 3 unverändert). Abnahme des Chips im HUD in T13 (AK-31); hier nur der Helfer mit Hilfstests.

## Schritte

- [ ] **Schritt 0: Sim-Stand holen.** `git merge --no-ff <Hash T04 OK aus Sim-Ledger>`; `npx tsc --noEmit; echo
EXIT=$?`.
- [ ] **Schritt 1: Test zuerst (rot)** in `tests/ui/monumentView.test.ts`, je AK ein `describe` mit AK-ID:
  - **AK-27 `monumentRows`:** laufend, Glas 84/140 → «Glas 84 / 140», `pct 60`; 80 versorgte Kaufleute → «Reserve
    64»; «zukaufen (50 / Stück)», mit wirkendem Handel «zukaufen (40 / Stück)»; `buyOn` folgt `buy[g]`; zwischen
    Abschnitten Vorschau «Glas 0 / 140» (nächster Abschnitt); nach `stage 3` leer; Reihenfolge `MONUMENT_GOODS`.
  - **AK-28 `monumentStartState`:** «Abschnitt 1 beginnen (4000)»; `money 100` → `disabled false`, `reason 'Zu wenig
Geld'`; `running` bzw. `stage 3` → `visible false`; `stage 2` → «Abschnitt 3 beginnen (8000)».
  - **AK-29 `monumentEtaText`:** frisch gestartet (grösster Rest 200) → «frühestens fertig in 3:20»; grösster Rest 56 →
    «frühestens fertig in 56 s»; ohne `running` `''`.
  - **AK-30 `monumentStallReason`:** je ein Fall der fünf Gründe in Vorrang-Reihenfolge (jeweils so gebaut, dass auch
    die nachrangigen Gründe zuträfen); `null` bei lieferbarem Gut und ohne `running`.
  - **AK-32 Texte:** `monumentStageLine` «Abschnitt 2 / 3 · Terrassen», «1 / 3 fertig · nächster: Terrassen»,
    «Bauplatz · nächster: Sockel», «Denkmal fertig»; `monumentChronicleLine` vor `wonMerchants` `null`, «Wahlziel
    erreicht: Das Denkmal steht» (Vorrang auch nach Abriss und Neubau), «Wahlziel: Denkmal bauen (Öffentlich)»,
    «Denkmal: Abschnitt 2/3 · 79 %», «Denkmal: 1/3 fertig».
  - **Hilfstests `monumentChip`** (kein eigenes AK): vier Fälle U-8, u. a. Σ 414 / 520 → «Denkmal 2/3 · 79 %»;
    `wonSpice false` → `null`.

```bash
npx vitest run tests/ui/monumentView.test.ts; echo EXIT=$?   # rot
```

- [ ] **Schritt 2: Umsetzen.**

```bash
npx vitest run tests/ui/monumentView.test.ts tests/ui/edictView.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: reine Denkmal-Helfer für Panel, Chronik und Chip (M13-E2 T10)`.

## Bericht

Testnamen je AK, Rot-Zeile, Exit-Codes; Bestätigung «kein DOM-Import in `monumentView.ts`» (`grep -n "document\|
HTMLElement" src/ui/monumentView.ts` leer).
