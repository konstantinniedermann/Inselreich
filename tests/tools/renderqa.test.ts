// R329/R330/E-039: Lastabbruch und Vergleichsart der Render-QA-Skripte (reine Logik, kein Browser).
// Die .mjs-Module werden dynamisch geladen, damit tsc ohne allowJs nicht über fehlende Typen stolpert.
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import saveSource from '../../src/sim/save.ts?raw';
import { SAVE_VERSION } from '../../src/sim/save';

const nodeEnv = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;
const dir = new URL('../../tools/render-qa/', import.meta.url);
const load = async (name: string) =>
  (await import(/* @vite-ignore */ new URL(name, dir).href)) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const lg = await load('lastgate.mjs');
const vg = await load('vergleich.mjs');
describe('R329 lastgate', () => {
  const { checkLoad, LOAD_MAX, currentLoad } = lg;

  it('R329: Schwelle ist 4', () => {
    expect(LOAD_MAX).toBe(4);
  });
  it('R329: Load 4.0 ist ok', () => {
    expect(checkLoad(4.0).ok).toBe(true);
  });
  it('R329: Load 4.01 bricht ab, Meldung nennt Load und Schwelle', () => {
    const r = checkLoad(4.01);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('4.01');
    expect(r.message).toContain('4');
    expect(r.message).toMatch(/Abbruch/);
  });
  it('R329: eigene Schwelle wird beachtet', () => {
    expect(checkLoad(6, 8).ok).toBe(true);
    expect(checkLoad(9, 8).ok).toBe(false);
  });
  it('R329: LASTGATE_FAKE_LOAD ersetzt die gelesene Last (nur Test/Probe)', () => {
    expect(currentLoad({ LASTGATE_FAKE_LOAD: '9' })).toBe(9);
    expect(typeof currentLoad({})).toBe('number');
  });
  it('R329: CLI bricht bei simulierter Last 9 mit Exit 1 und Meldung ab', () => {
    const p = spawnSync('node', [new URL('lastgate.mjs', dir).pathname], {
      env: { ...nodeEnv, LASTGATE_FAKE_LOAD: '9' },
      encoding: 'utf8',
    });
    expect(p.status).toBe(1);
    expect(p.stderr).toContain('Abbruch');
  });
  it('R329: CLI läuft bei Last 1 mit Exit 0 durch', () => {
    const p = spawnSync('node', [new URL('lastgate.mjs', dir).pathname], {
      env: { ...nodeEnv, LASTGATE_FAKE_LOAD: '1' },
      encoding: 'utf8',
    });
    expect(p.status).toBe(0);
  });
});

describe('E-039 vergleich', () => {
  const { comparisonKind, outName, headerLine, describeStands, labelOf } = vg;

  it('E-039: gleiche Wurzel ist aa, verschiedene sind ab', () => {
    expect(comparisonKind('/x/a', '/x/a')).toBe('aa');
    expect(comparisonKind('/x/a/', '/x/a')).toBe('aa');
    expect(comparisonKind('/x/a', '/x/b')).toBe('ab');
  });
  it('E-039: Dateiname aa- bzw. ab-<A>-vs-<B>-', () => {
    expect(outName('aa', 'main', 'main', 'perf-s7.txt')).toBe('aa-main-perf-s7.txt');
    expect(outName('ab', 'main', 'cand', 'perf-s7.txt')).toBe('ab-main-vs-cand-perf-s7.txt');
  });
  it('E-039: labelOf nimmt den Verzeichnisnamen', () => {
    expect(labelOf('/x/.worktrees/integrate/')).toBe('integrate');
  });
  it('E-039: Kopf nennt Vergleichsart und beide Hashes (ungleich)', () => {
    const h = headerLine({
      kind: 'ab',
      labelA: 'main',
      labelB: 'cand',
      hashA: '8ccec73',
      hashB: 'dbf4524',
    });
    expect(h).toContain('A/B');
    expect(h).toContain('main@8ccec73');
    expect(h).toContain('cand@dbf4524');
  });
  it('E-039: Kopf bei aa nennt A/A und beide (gleiche) Hashes', () => {
    const h = headerLine({
      kind: 'aa',
      labelA: 'main',
      labelB: 'main',
      hashA: 'abc1234',
      hashB: 'abc1234',
    });
    expect(h).toContain('A/A');
    expect(h.match(/abc1234/g)).toHaveLength(2);
  });
  it('E-039: describeStands nutzt die injizierte Hash-Funktion', () => {
    const hash = (root: string) => (root.endsWith('a') ? 'h1' : 'h2');
    const d = describeStands('/w/a', '/w/b', hash);
    expect(d).toEqual({ kind: 'ab', labelA: 'a', labelB: 'b', hashA: 'h1', hashB: 'h2' });
    const s = describeStands('/w/a', '/w/a', hash);
    expect(s.kind).toBe('aa');
    expect(s.hashA).toBe(s.hashB);
  });
});

describe('R365 smoke.mjs', () => {
  const run = (args: string[]) =>
    spawnSync('node', [new URL('smoke.mjs', dir).pathname, ...args], { encoding: 'utf8' });

  it('--help gibt den Aufruf aus und endet mit Exit 0', () => {
    const r = run(['--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('--paket');
  });
  it('fehlendes --paket oder falsche Grösse endet mit Exit 2, ohne Browser', () => {
    expect(run([]).status).toBe(2);
    expect(run(['--paket', 'x', '--size', '10x10']).status).toBe(2);
  });
});

const sv = await load('saveVersion.mjs');
describe('R419 Smoke-Etikett Save-Version', () => {
  it('liest SAVE_VERSION aus der Quelle', () => {
    expect(sv.parseSaveVersion(saveSource)).toBe(SAVE_VERSION);
  });
  it('Etikett nennt die aktuelle Version', () => {
    expect(sv.saveVersionLabel()).toBe(`Save v${SAVE_VERSION}`);
  });
  it('ohne Treffer: null bzw. v?', () => {
    expect(sv.parseSaveVersion('const x = 1;')).toBeNull();
    expect(sv.saveVersionLabel(new URL('file:///gibt/es/nicht.ts'))).toBe('Save v?');
  });
});

describe('TB4 T06 render-qa Helfer', () => {
  it('AK-TB4-13: istErwarteteWarnung erkennt nur die Audio-Warnung', async () => {
    const { istErwarteteWarnung } = await load('lib.mjs');
    expect(
      istErwarteteWarnung('The AudioContext was not allowed to start. It must be resumed…'),
    ).toBe(true);
    expect(istErwarteteWarnung('Uncaught TypeError: x')).toBe(false);
    expect(istErwarteteWarnung('')).toBe(false);
  });

  const lesefolge = (werte: unknown[]) => {
    let n = 0;
    return {
      lies: () => werte[Math.min(n++, werte.length - 1)],
      zaehler: () => n,
    };
  };
  const schlaf = async () => {};

  it('AK-TB4-14: A,B,B,B,B wird ruhig mit B', async () => {
    const { warteBisRuhig } = await load('lib.mjs');
    const f = lesefolge([{ y: 1 }, { y: 2 }, { y: 2 }, { y: 2 }, { y: 2 }]);
    expect(await warteBisRuhig(f.lies, { schlaf })).toEqual({ wert: { y: 2 }, ruhig: true });
  });

  it('AK-TB4-14: immer wechselnd ist nicht ruhig nach maxMs/abstandMs Lesungen', async () => {
    const { warteBisRuhig } = await load('lib.mjs');
    let n = 0;
    const r = await warteBisRuhig(() => n++, { schlaf, maxMs: 1000, abstandMs: 100 });
    expect(r.ruhig).toBe(false);
    expect(n).toBe(10);
    expect(r.wert).toBe(9);
  });

  it('AK-TB4-14: sofort stabil liest genau `gleich` mal', async () => {
    const { warteBisRuhig } = await load('lib.mjs');
    const f = lesefolge([5]);
    expect(await warteBisRuhig(f.lies, { schlaf, gleich: 3 })).toEqual({ wert: 5, ruhig: true });
    expect(f.zaehler()).toBe(3);
  });
});
