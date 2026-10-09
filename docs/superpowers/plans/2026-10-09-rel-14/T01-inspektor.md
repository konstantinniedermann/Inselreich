# T01 · Inspektor-Klartext (UI-Code und Tests)

Strang A · Worktree `.worktrees/rel-14-inspektor` · Branch `fix/rel-14-inspektor` · Umsetzer `tech-ui-engineer` (sonnet) · AK-Entwürfe A1–A7 (`ak-entwuerfe.md`) · blocked-by –

**Ziel:** Ein Begriff je Ursache. Radius = „Versorgung“ (Chip), Waren/Dienste = „Mangel: … fehlt“. Die Zeile „Fehlt: X“ entfällt. Hover und Cursor-Hinweis nutzen denselben Text wie der Inspektor.

**Files (nur diese):**

- Modify: `src/ui/panelView.ts` (`supplyChip`, Z. ~93–103)
- Modify: `src/ui/texts.ts` (`diagnosisText`, Z. 11–20)
- Modify: `src/ui/hover.ts` (`diagnosisLine`, Z. ~86–95; Import aus `./texts`)
- Modify: `src/ui/hints.ts` (Z. ~294, Rückfall `'versorgt'`)
- Modify: `src/ui/inspect.ts` (`TIER_LIST` Z. 109/126/139/626; `addLine(stats, '', 'first-missing')` Z. ~463; `setFirstMissing` Z. ~476–486 und Aufruf Z. ~529–532)
- Modify: `src/ui/hud.ts` (Z. 35 lokale Konstante `TIER_IDS` → Import)
- Modify: `src/style.css` (Regel `.panel-line[data-field='first-missing']`, Z. ~1031–1034)
- Test: `tests/ui/panelView.test.ts`, `tests/ui/format.test.ts`, `tests/ui/hover.test.ts`, `tests/ui/hints.test.ts`

**Interfaces:** Consumes `TIER_IDS: readonly Tier[]` aus `src/sim/defs/tiers.ts` (besteht), `houseDiagnosis` aus `src/sim/queries.ts`. Produces: unveränderte Signaturen; nur Texte ändern sich. `diagnosisText(d: Diagnosis): string` bleibt die einzige Diagnose-Textquelle.

**Gate-Entscheid E1 (Dienst-Wortlaut):** Der Plan setzt die Empfehlung um („Kapelle fehlt“ überall). Entscheidet L0 die Alternative, gilt Schritt 3 b.

## Schritte

- [ ] **Schritt 1: Tests zuerst ändern (rot)**

`tests/ui/panelView.test.ts`, Block `AK-PU-05 supplyChip`: Erwartungen ersetzen.

```ts
it('im Radius, ausserhalb, kein Haus (Wortfamilie Versorgung, REL-14)', () => {
  const { w, house, fisher } = uxWorld();
  expect(isSupplied(w, house)).toBe(true);
  expect(supplyChip(w, house)).toEqual({
    text: 'Im Versorgungsradius',
    tone: 'ok',
    label: 'Kontor oder Marktplatz in Reichweite: Waren kommen an',
  });
  const far = put(w, 'house', { x: 0, y: 0, house: { ...house.house! } });
  expect(isSupplied(w, far)).toBe(false);
  expect(supplyChip(w, far)).toEqual({
    text: 'Ausserhalb der Versorgung',
    tone: 'bad',
    label: 'Kein Kontor oder angebundener Marktplatz in Reichweite: keine Waren',
  });
  expect(supplyChip(w, fisher)).toBeNull();
});
```

Neuer Block am Dateiende (Quelltext-Wächter für A2, A4, A7; `readFileSync` aus `node:fs` importieren, falls noch nicht vorhanden):

```ts
describe('REL-14 Quelltext: alte Begriffe und Fehlt-Zeile entfernt', () => {
  const ui = ['panelView', 'inspect', 'texts', 'hover', 'hints', 'hud'].map((f) =>
    readFileSync(`src/ui/${f}.ts`, 'utf8'),
  );
  it('kein „Versorgt“/„Nicht versorgt“, kein first-missing, kein TIER_LIST', () => {
    for (const src of ui) {
      expect(src).not.toMatch(/\bVersorgt\b|Nicht versorgt/);
      expect(src).not.toMatch(/first-missing|setFirstMissing|TIER_LIST/);
      expect(src).not.toMatch(/const TIER_IDS/);
    }
    expect(readFileSync('src/style.css', 'utf8')).not.toContain('first-missing');
  });
});
```

`tests/ui/format.test.ts`, Block `diagnosisText (AK-U3-02)`: erste Erwartung auf `'ausserhalb der Versorgung'`; die Dienst-Erwartungen (`'Kapelle fehlt'`, `'Schule fehlt'`) bleiben.

`tests/ui/hover.test.ts`, Test „Spec 13.2 Haus-Diagnose …“ (Z. ~276): Titel auf „… Ausserhalb der Versorgung, Dienst fehlt (gleich wie Inspektor)“, Erwartung Z. ~282 auf `'Kapelle fehlt'`; im selben Test ergänzen (Import `diagnosisText` aus `../../src/ui/texts`, `houseDiagnosis` aus `../../src/sim/queries`):

```ts
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
// das Haus aus der ersten Erwartung wiederverwenden (dort `const far = houseFar(w)` herausziehen)
expect(hoverInfo(w, far, 0, none)!.lines[1]).toBe(cap(diagnosisText(houseDiagnosis(w, far)[0]!)));
const h = houses[0]!;
expect(hoverInfo(w2, h, 0, none)!.lines[1]).toBe(cap(diagnosisText(houseDiagnosis(w2, h)[0]!)));
```

`tests/ui/hints.test.ts`, neuer Block (Helfer `village`, `houseFar`, `setHouse` aus `../sim/helpers`; Muster `readyPioneer` in `tests/ui/hover.test.ts` Z. 32):

```ts
describe('REL-14 Haus-Hinweis ohne „versorgt“ (A6)', () => {
  it('ohne Mangel „zufrieden“, ausserhalb „ausserhalb der Versorgung“', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    setHouse(h, 1, 4);
    h.house!.supplied = true;
    h.house!.satisfied = { food: true };
    expect(houseDiagnosis(w, h)).toEqual([]); // Vorbedingung
    expect(placementHint(w, { kind: 'select' }, h.x, h.y)?.text).toMatch(/ · zufrieden$/);
    const far = houseFar(w);
    expect(placementHint(w, { kind: 'select' }, far.x, far.y)?.text).toMatch(
      / · ausserhalb der Versorgung$/,
    );
  });
});
```

Greift die Vorbedingung nicht (Haus hat doch eine Diagnose), die Testwelt anpassen, bis `houseDiagnosis` leer ist; die Erwartungen nicht abschwächen.

- [ ] **Schritt 2: Rot belegen**

Run: `npx vitest run tests/ui/panelView.test.ts tests/ui/format.test.ts tests/ui/hover.test.ts tests/ui/hints.test.ts; echo EXIT=$?`
Expected: FAIL (supplyChip-Texte, Quelltext-Wächter, `diagnosisText` supply, Hover „Kapelle fehlt“, Hinweis „zufrieden“/„ausserhalb …“). Ausgabe-Ausschnitt in den Bericht.

- [ ] **Schritt 3: Umsetzen**

(a) `src/ui/panelView.ts` `supplyChip`:

```ts
/** Versorgungs-Chip des Wohnhauses (Radius von Kontor/angebundenem Markt, REL-14); sonst `null`. */
export function supplyChip(world: World, b: Building): Chip | null {
  if (!b.house) return null;
  return isSupplied(world, b)
    ? {
        text: 'Im Versorgungsradius',
        tone: 'ok',
        label: 'Kontor oder Marktplatz in Reichweite: Waren kommen an',
      }
    : {
        text: 'Ausserhalb der Versorgung',
        tone: 'bad',
        label: 'Kein Kontor oder angebundener Marktplatz in Reichweite: keine Waren',
      };
}
```

(b) `src/ui/texts.ts` `diagnosisText`: `case 'supply': return 'ausserhalb der Versorgung';`. Nur bei Gate-Entscheid E1 = Alternative zusätzlich `case 'service'` → `` `${…name} fehlt in Reichweite` `` und `format.test.ts`-Dienst-Erwartungen sowie Hover-Erwartung auf „… fehlt in Reichweite“.

(c) `src/ui/hover.ts`: `diagnosisLine` ersetzen und `diagnosisText` zum bestehenden Import aus `./texts` nehmen; danach ungenutzte Importe entfernen (ESLint meldet sie; `GOODS` und `SERVICE_BUILDING` werden an anderer Stelle weiter gebraucht).

```ts
/** Diagnosezeile des Hovers: derselbe Text wie im Inspektor, Anfangsbuchstabe gross. */
function diagnosisLine(d: Diagnosis): string {
  const t = diagnosisText(d);
  return t.charAt(0).toUpperCase() + t.slice(1);
}
```

(d) `src/ui/hints.ts` Z. ~294: `d ? diagnosisText(d) : 'zufrieden'`.

(e) `src/ui/inspect.ts`: Zeile `addLine(stats, '', 'first-missing').hidden = true;` löschen; Funktion `setFirstMissing` samt JSDoc löschen; den Aufruf `setFirstMissing(panel, icons.find((n) => !n.met));` löschen. `iconChip` und `NeedIcon` bleiben (Bedarfsliste nutzt sie). `const TIER_LIST …` löschen, `TIER_IDS` zum Import aus `'../sim/defs/tiers'` nehmen und die drei Verwendungen umbenennen.

(f) `src/ui/hud.ts` Z. 35: lokale Konstante löschen, `TIER_IDS` zum Import aus `'../sim/defs/tiers'` nehmen (Typ `readonly Tier[]`; Verwendungen sind `for … of` und `.map`). Bleibt `Tier` danach ungenutzt, aus dem Typ-Import entfernen.

(g) `src/style.css`: Regel `.panel-line[data-field='first-missing'] { … }` löschen.

- [ ] **Schritt 4: Grün belegen**

Run: `npx vitest run tests/ui/panelView.test.ts tests/ui/format.test.ts tests/ui/hover.test.ts tests/ui/hints.test.ts tests/ui/inspect.test.ts tests/ui/cursorHint.test.ts tests/ui/hud.test.ts tests/ui/guide.test.ts tests/ui/feast.test.ts tests/ui/imports.test.ts; echo EXIT=$?`
Expected: PASS, EXIT=0.
Run: `npx tsc --noEmit; echo EXIT=$?` und `make lint; echo EXIT=$?` → je EXIT=0.
Run: `grep -rnw "Versorgt" src/ui/; grep -rn "Nicht versorgt\|first-missing\|TIER_LIST" src/ src/style.css; grep -rn "const TIER_IDS" src/` → nur `src/sim/defs/tiers.ts:52`.

- [ ] **Schritt 5: Commit** (einer; `git add -p` ist nicht verfügbar, `inspect.ts` trägt beide Themen)

```bash
git add src/ui/panelView.ts src/ui/texts.ts src/ui/hover.ts src/ui/hints.ts src/ui/inspect.ts src/ui/hud.ts src/style.css tests/ui/panelView.test.ts tests/ui/format.test.ts tests/ui/hover.test.ts tests/ui/hints.test.ts
git commit -m "fix: Inspektor-Klartext Versorgung, Fehlt-Zeile entfernt, TIER_IDS aus den Defs (REL-14)"
```

## Bericht an den Controller

Rot-/Grün-Ausgaben (Ausschnitt), Exit-Codes von vitest, tsc, lint, die grep-Ergebnisse, Commit-Hashes, Abweichungen vom Plan. Keine Dateien ausserhalb der Liste.
