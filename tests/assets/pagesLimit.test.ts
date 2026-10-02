// tests/assets/pagesLimit.test.ts — R130, Plattformgrenze GitHub Pages;
// ersetzt nicht das Asset-Budget AK-X1-03 (12 MB)
import { describe, expect, it } from 'vitest';
import {
  GIT_FILE_LIMIT_BYTES,
  PAGES_SITE_LIMIT_BYTES,
  WARN_RATIO,
  checkPagesLimits,
} from '../../tools/pages/limits';

const SITE_THRESHOLD = WARN_RATIO * PAGES_SITE_LIMIT_BYTES;
const FILE_THRESHOLD = WARN_RATIO * GIT_FILE_LIMIT_BYTES;

describe('checkPagesLimits (R130)', () => {
  it('leere Liste ist ok', () => {
    expect(checkPagesLimits([])).toEqual({
      ok: true,
      totalBytes: 0,
      largest: null,
      problems: [],
    });
  });

  it('knapp unter beiden Schwellen ist ok', () => {
    const files = [
      { path: 'a.bin', size: FILE_THRESHOLD - 1 },
      { path: 'b.bin', size: 1000 },
    ];
    const r = checkPagesLimits(files);
    expect(r.ok).toBe(true);
    expect(r.problems).toEqual([]);
  });

  it('genau an der Seitenschwelle (500 000 000) ist nicht ok', () => {
    const files = Array.from({ length: 10 }, (_, i) => ({ path: `f${i}`, size: 50_000_000 }));
    const r = checkPagesLimits(files);
    expect(r.totalBytes).toBe(500_000_000);
    expect(r.ok).toBe(false);
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]).toContain('Alternativen prüfen (R130, docs/arc42.md Kap. 7)');
  });

  it('Einzeldatei genau an 50 MiB ist nicht ok', () => {
    const r = checkPagesLimits([{ path: 'big.bin', size: 50 * 1024 * 1024 }]);
    expect(r.ok).toBe(false);
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]).toContain('big.bin');
  });

  it('beide Verstösse ergeben zwei Probleme', () => {
    const r = checkPagesLimits([
      { path: 'huge.bin', size: SITE_THRESHOLD },
      { path: 'small.bin', size: 10 },
    ]);
    expect(r.ok).toBe(false);
    expect(r.problems).toHaveLength(2);
  });

  it('bestimmt die grösste Datei', () => {
    const r = checkPagesLimits([
      { path: 'a', size: 5 },
      { path: 'b', size: 50 },
      { path: 'c', size: 7 },
    ]);
    expect(r.largest).toEqual({ path: 'b', size: 50 });
    expect(r.totalBytes).toBe(62);
  });
});
