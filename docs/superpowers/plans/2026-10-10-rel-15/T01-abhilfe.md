# T01 · Abhilfe ohne Vorspann (TDD)

Strang UI · Worktree `.worktrees/rel-15-ui` · Branch `fix/rel-15-ui` · Umsetzer `tech-ui-engineer` (sonnet) · AK-Entwürfe A1–A3 (`ak-entwuerfe.md`) · blocked-by –

**Ziel:** Unter „Mangel: Kapelle fehlt“ steht nicht noch einmal „Kapelle fehlt: …“. Die Abhilfe eines Wohnhauses beginnt mit dem Verb, wie bei Betrieben. Wortlaut R435 wörtlich.

**Files (nur diese):**

- Modify: `src/ui/guide.ts` (`foreignGoodHint` Z. 60–63; `remedyText` Wohnhaus-Zweig Z. 200–214)
- Test: `tests/ui/guide.test.ts` (Z. 150–152, 165, 171, 290–295; neuer Block am Dateiende)

**Interfaces:** Consumes nichts Neues. Produces: unveränderte Signatur `remedyText(w: World, b: Building): string | null`; nur Texte ändern sich. `nextStep` und `foreignGoodHint` behalten ihren Wortlaut.

## Schritte

- [ ] **Schritt 1: Bestehende Erwartungen auf den neuen Wortlaut (rot)**

`tests/ui/guide.test.ts`:

- Z. 150–152: `'Nahrung fehlt: baue mehr Fischerhütte oder kaufe Nahrung am Kontor'` → `'Baue mehr Fischerhütte oder kaufe Nahrung am Kontor'`
- Z. 165: `'Kapelle fehlt: baue Kapelle (K) in Reichweite'` → `'Baue Kapelle (K) in Reichweite'`
- Z. 171: `'Nahrung fehlt: baue Fischerhütte (F)'` → `'Baue Fischerhütte (F)'`
- Z. 293–295: `'Gewürz fehlt: kaufe es am Kontor oder gründe ein Kontor auf einer Gewürzinsel'` → `'Kaufe Gewürz am Kontor oder gründe ein Kontor auf einer Gewürzinsel'`
- Z. 279 (`nextStep`, „Deine Kaufleute brauchen Gewürz: kaufe es am Kontor …“) **bleibt** (A3).

- [ ] **Schritt 2: Neuer Block am Dateiende (rot)**

`citizenWorld`, `addDirect` (Z. 204/232), `setHouse`, `uxWorld`, `remedyText` sind in der Datei schon vorhanden.

```ts
describe('REL-15 Abhilfe eines Wohnhauses ohne Vorspann (R435)', () => {
  it('kein „fehlt:“, Satz beginnt gross, über alle Diagnose-Arten', () => {
    const texts: string[] = [];
    const supply = uxWorld();
    supply.house.x = supply.kx + 40; // ausserhalb jeder Versorgung
    texts.push(remedyText(supply.w, supply.house)!);
    const service = uxWorld();
    setHouse(service.house, 2, 4, ['food', 'cloth']); // Siedler ohne Kapelle
    texts.push(remedyText(service.w, service.house)!);
    const withProducer = uxWorld();
    setHouse(withProducer.house, 1, 2, []); // Nahrung fehlt, Fischerhütte steht
    texts.push(remedyText(withProducer.w, withProducer.house)!);
    const noProducer = uxWorld();
    delete noProducer.w.buildings[noProducer.fisher.id];
    setHouse(noProducer.house, 1, 2, []);
    texts.push(remedyText(noProducer.w, noProducer.house)!);
    const w = citizenWorld();
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    for (const id of ['glassworks', 'quarry', 'lumberjack'] as const) addDirect(w, id);
    const h = Object.values(w.buildings).find((b) => b.house)!;
    setHouse(h, 4, 20, ['food', 'cloth', 'rum', 'glass']); // nur Gewürz unerfüllt
    texts.push(remedyText(w, h)!);
    expect(texts).toEqual([
      'Baue einen Marktplatz (M) in der Nähe',
      'Baue Kapelle (K) in Reichweite',
      'Baue mehr Fischerhütte oder kaufe Nahrung am Kontor',
      'Baue Fischerhütte (F)',
      'Kaufe Gewürz am Kontor oder gründe ein Kontor auf einer Gewürzinsel',
    ]);
    for (const t of texts) {
      expect(t).not.toContain('fehlt:');
      expect(t.charAt(0)).toBe(t.charAt(0).toUpperCase());
    }
  });
});
```

Hinweis: Die Zustände sind dieselben wie in den bestehenden Tests Z. 158–172 und 283–295; weicht ein Ergebnis ab, zuerst den bestehenden Test derselben Lage vergleichen, nicht die Erwartung anpassen.

- [ ] **Schritt 3: Rot bestätigen**

Run: `npx vitest run tests/ui/guide.test.ts; echo EXIT=$?`
Expected: FAIL in den vier geänderten Erwartungen und im neuen Block (alter Vorspann „… fehlt: …“), `EXIT=1`.

- [ ] **Schritt 4: Umsetzung in `src/ui/guide.ts`**

Z. 60–63 ersetzen (das Satzende teilen, DRY; `foreignGoodHint` behält den Wortlaut für `nextStep`):

```ts
/** Satzende „gründe ein Kontor auf einer Gewürzinsel“ (Fremdgut). */
function foundKontorHint(g: GoodId): string {
  return `gründe ein Kontor auf einer ${GOODS[g].name}insel`;
}

function foreignGoodHint(g: GoodId): string {
  return `kaufe es am Kontor oder ${foundKontorHint(g)}`;
}
```

Im Wohnhaus-Zweig von `remedyText` (Z. 204–213) nur die Rückgaben ändern:

```ts
if (d.kind === 'service') return `Baue ${nk(SERVICE_BUILDING[d.service])} in Reichweite`;
const g = GOODS[d.good].name;
if (needsForeignIsland(d.good)) return `Kaufe ${g} am Kontor oder ${foundKontorHint(d.good)}`;
const p = producerOf(d.good)!;
return has(w, p) ? `Baue mehr ${nm(p)} oder kaufe ${g} am Kontor` : `Baue ${nk(p)}`;
```

Die Zeile `supply` (Z. 203) und alle Betriebszweige bleiben unverändert.

- [ ] **Schritt 5: Grün bestätigen, Nachbarn mitlaufen lassen**

Run: `npx vitest run tests/ui/guide.test.ts tests/ui/inspect.test.ts tests/ui/panelView.test.ts; echo EXIT=$?`
Expected: PASS, `EXIT=0`.

Run: `grep -rn "fehlt: baue\|fehlt: kaufe" src/ tests/; echo EXIT=$?`
Expected: keine Treffer, `EXIT=1`.

- [ ] **Schritt 6: Typen und Lint**

Run: `npx tsc --noEmit; echo EXIT=$?` → `EXIT=0`
Run: `make lint; echo EXIT=$?` → `EXIT=0`

- [ ] **Schritt 7: Commit**

```bash
git add src/ui/guide.ts tests/ui/guide.test.ts
git commit -m "fix: Abhilfe eines Wohnhauses ohne Vorspann (UI-INSPEKTOR-ABHILFE, R435)"
```

(Trailer laut Briefing anhängen.)

## Abnahme für den Review

- Diff nur in den zwei Dateien; README Z. ~448 bleibt gültig (nennt nur die Mangel-Liste).
- A1–A3 belegt durch die Testausgabe; Exit-Codes im Bericht.
