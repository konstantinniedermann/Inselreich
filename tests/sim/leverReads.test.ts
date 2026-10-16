import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';

/** Muster der Hebel-Leser (R706 a): Takt, Dienst-Reichweite, Hausgrösse. */
const PATTERNS: readonly RegExp[] = [
  /\.maxInhabitants\b/,
  /\.serviceRadius\b/,
  /\bislandCycle\(/,
  /\bdef\.cycle\b/,
];

/** Dateien, die Hebel-Werte lesen dürfen (Helfer-Rümpfe, Defs, Typen). */
const ALLOWED_FILES = ['src/sim/council.ts', 'src/sim/types.ts'];
const ALLOWED_PREFIXES = ['src/sim/defs/'];

interface Allowed {
  datei: string;
  muster: RegExp;
  grund: string;
}
/** Restleser: Zeile muss `muster` treffen, sonst bleibt der Treffer ein Verstoss. */
const ALLOWLIST: readonly Allowed[] = [
  {
    datei: 'src/sim/levels.ts',
    muster:
      /export const islandCycle|BUILDING_DEFS\[b\.defId\]\.cycle|councilCycle\(|islandCycle\(world, island/,
    grund:
      'levels.ts ist der Takt-Leseort: Definition von islandCycle, Grundtakt in cycleOf, effectiveCycle',
  },
  {
    datei: 'src/sim/roads.ts',
    muster: /def\.serviceRadius !== undefined/,
    grund: 'Existenz-Prüfung, kein Wert-Leser',
  },
  {
    datei: 'src/render/overlays.ts',
    muster: /def\.supplyRadius !== undefined \|\| def\.serviceRadius !== undefined/,
    grund: 'Existenz-Prüfung (Abdeckungskreis vorhanden), kein Wert-Leser',
  },
  {
    datei: 'src/ui/panelView.ts',
    muster: /const cycle = def\.cycle !== undefined/,
    grund: 'Existenz-Prüfung, kein Wert-Leser',
  },
  {
    datei: 'src/ui/texts.ts',
    muster: /cycle: number = def\.cycle \?\? 0/,
    grund: 'Default-Parameter für Tests; Aufrufer übergeben cycleOf (texts.ts gehört nicht zu T01)',
  },
  {
    datei: 'src/ui/islandCard.ts',
    muster: /def\.cycle === undefined|effectiveCycle\(world, island, defId, def\.cycle\)/,
    grund: 'Existenz-Prüfung und Grundtakt als Eingabe von effectiveCycle',
  },
  {
    datei: 'src/ui/buildMenu.ts',
    muster:
      /cyc\(def\.cycle\)|if \(def\.(produces|consumes) && def\.cycle\)|\[def\.cycle, lv\[0\]|BUILDING_DEFS\[defId\]\.serviceRadius/,
    grund:
      'Existenz-Prüfungen, Grundtakt als Eingabe von cyc/councilCycle und Def-Fallback ohne Welt (Tooltip ohne Spielstand)',
  },
];

interface Hit {
  datei: string;
  zeile: number;
  text: string;
}

const isAllowedFile = (datei: string): boolean =>
  ALLOWED_FILES.includes(datei) || ALLOWED_PREFIXES.some((p) => datei.startsWith(p));

/** Liefert alle Treffer eines Textes, die weder Datei- noch Zeilen-Allowlist deckt. */
function scanText(datei: string, text: string): Hit[] {
  if (isAllowedFile(datei)) return [];
  const hits: Hit[] = [];
  text.split('\n').forEach((line, i) => {
    if (!PATTERNS.some((p) => p.test(line))) return;
    const ok = ALLOWLIST.some((a) => a.datei === datei && a.muster.test(line));
    if (!ok) hits.push({ datei, zeile: i + 1, text: line.trim() });
  });
  return hits;
}

function tsFiles(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = `${dir}/${name}`;
      if (statSync(path).isDirectory()) return tsFiles(path);
      return name.endsWith('.ts') ? [path] : [];
    });
}

describe('I-112 Wächter: Hebel-Werte nur über Helfer (R706 a)', () => {
  it('src/ liest maxInhabitants, serviceRadius und Takt nur über Helfer', () => {
    const hits = tsFiles('src').flatMap((f) => scanText(f, readFileSync(f, 'utf8')));
    const msg = hits.map((h) => `${h.datei}:${h.zeile} ${h.text}`).join('\n');
    expect(hits.length, `Direkte Hebel-Leser (${hits.length}):\n${msg}`).toBe(0);
  });
  it('Negativtest: der Scanner meldet Probe-Zeilen mit def.cycle und .maxInhabitants', () => {
    const probe =
      'const a = def.cycle;\nconst b = TIERS[t].maxInhabitants;\nconst c = d.serviceRadius;';
    expect(scanText('src/ui/probe.ts', probe).map((h) => h.zeile)).toEqual([1, 2, 3]);
    expect(scanText('src/sim/council.ts', probe)).toEqual([]);
  });
  it('jede Allowlist-Zeile hat eine Begründung und eine real existierende Datei', () => {
    for (const a of ALLOWLIST) {
      expect(a.grund.length).toBeGreaterThan(10);
      expect(() => readFileSync(a.datei, 'utf8'), a.datei).not.toThrow();
    }
  });
});

/** Wächter AK-11: Text enthält `decree` oder einen Import aus `src/sim/council`. */
const importsDecree = (text: string): boolean =>
  /\bdecree\b/.test(text) || /from\s+['"][^'"]*sim\/council['"]/.test(text);

describe('I-112 Wächter: Controller beschliessen nie (AK-11)', () => {
  it('importsDecree erkennt Import und Aufruf, lässt harmlosen Text durch', () => {
    expect(importsDecree("import { decree } from '../../src/sim/council'")).toBe(true);
    expect(importsDecree("import { x } from '../../src/sim/council';")).toBe(true);
    expect(importsDecree('decree(w, 2, "A");')).toBe(true);
    expect(importsDecree("import { step } from '../../src/sim/tick';")).toBe(false);
  });
  it.each(['tests/sim/controller.ts', 'tests/sim/merchantsController.ts'])(
    '%s enthält weder decree noch Import aus src/sim/council',
    (datei) => {
      expect(importsDecree(readFileSync(datei, 'utf8'))).toBe(false);
    },
  );
});
