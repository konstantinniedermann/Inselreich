// tests/assets/assets.test.ts — Spec 7.6/8, ADR-011 Punkte 3, 6, 8 (AK-X1-02, AK-X1-03, AK-X1-06)
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const MB = 1024 * 1024;
const ROOT = process.cwd();
const PUBLIC = `${ROOT}/public/`;

/** Alle Dateien unter `public/` als relative Pfade mit `/`; versteckte Dateien (.DS_Store) zählen nicht. */
function walk(dir: string, prefix: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = `${dir}${name}`;
    if (statSync(full).isDirectory()) out.push(...walk(`${full}/`, `${prefix}${name}/`));
    else out.push(`${prefix}${name}`);
  }
  return out;
}

const files = existsSync(PUBLIC) ? walk(PUBLIC, '') : [];
const size = (f: string): number => statSync(`${PUBLIC}${f}`).size;
const sum = (prefix: string): number =>
  files.filter((f) => f.startsWith(prefix)).reduce((a, f) => a + size(f), 0);
const total = files.reduce((a, f) => a + size(f), 0);
const sha = (f: string): string =>
  createHash('sha256')
    .update(readFileSync(`${PUBLIC}${f}`))
    .digest('hex');

const MUST = [
  'audio/music/bards-tale.mp3',
  'audio/music/old-tower-inn.mp3',
  'audio/music/dowland-complaints.mp3',
  'audio/amb/sea.mp3',
  'audio/amb/birds.mp3',
  'audio/amb/gulls.mp3',
  'audio/amb/crickets.mp3',
  'audio/amb/rain.mp3',
  'audio/amb/storm.mp3',
  'audio/amb/fire.mp3',
  'audio/sfx/bell.mp3',
  'audio/sfx/foghorn.mp3',
  'audio/sfx/coins.mp3',
  'audio/sfx/hammer.mp3',
  'fonts/eb-garamond-400.woff2',
  'fonts/eb-garamond-700.woff2',
  'fonts/OFL.txt',
];

describe('Assets unter public/', () => {
  it('Spec 7.6 alle Muss-Dateien liegen unter public/', () => {
    for (const f of MUST) expect(files).toContain(f);
  });

  it('AK-X1-03 Grössenbudget', () => {
    expect(total).toBeLessThanOrEqual(12 * MB);
    expect(sum('audio/music/')).toBeLessThanOrEqual(9 * MB);
    expect(sum('audio/amb/') + sum('audio/sfx/')).toBeLessThanOrEqual(2.2 * MB);
    expect(sum('fonts/')).toBeLessThanOrEqual(150 * 1024);
    for (const f of files.filter((f) => f.startsWith('audio/music/')))
      expect(size(f), f).toBeLessThanOrEqual(2.6 * MB);
  });

  it('AK-X1-02 jede Datei hat eine CREDITS-Zeile mit Pflichtfeldern, Lizenzdatei existiert', () => {
    const credits = readFileSync(`${ROOT}/docs/CREDITS.md`, 'utf8');
    const rows = credits
      .split('\n')
      .filter((l) => l.startsWith('|') && l.includes('`public/'))
      .map((l) =>
        l
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim()),
      );
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const row = rows.find((r) => (r[0] ?? '').includes(`\`public/${f}\``));
      expect(row, `CREDITS-Zeile für ${f}`).toBeDefined();
      // Datei, Quelle, Autor, Lizenz, Link, Änderungen, geprüft von / am
      expect(row?.length, `Spaltenzahl für ${f}`).toBe(7);
      row?.forEach((cell, i) => expect(cell.length, `Spalte ${i} für ${f}`).toBeGreaterThan(0));
      // Lizenzspalte verweist auf mindestens eine Datei in docs/licenses/, die existiert
      const refs = [...(row?.[3] ?? '').matchAll(/\]\(licenses\/([^)]+)\)/g)].map(
        (m) => m[1] ?? '',
      );
      expect(refs.length, `Lizenzlink für ${f}`).toBeGreaterThan(0);
      for (const ref of refs)
        expect(existsSync(`${ROOT}/docs/licenses/${ref}`), `docs/licenses/${ref}`).toBe(true);
      expect(row?.[6], `Prüfvermerk für ${f}`).toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });

  it('AK-X1-06 SHA-256 je Datei stimmt; Datei ohne Eintrag und Eintrag ohne Datei scheitern', () => {
    const table = JSON.parse(readFileSync(`${ROOT}/tests/assets/sha256.json`, 'utf8')) as Record<
      string,
      string
    >;
    expect(Object.keys(table).sort()).toEqual([...files].sort());
    for (const f of files) expect(sha(f), f).toBe(table[f]);
  });
});
