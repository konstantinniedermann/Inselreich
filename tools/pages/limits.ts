// tools/pages/limits.ts — Plattformgrenzen GitHub Pages (Ruling R130), reine Logik ohne node:-Imports.

/**
 * Published GitHub Pages sites may be no larger than 1 GB.
 * Quelle: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
 * (geprüft 2026-10-02). Dezimal gerechnet, weil konservativ.
 */
export const PAGES_SITE_LIMIT_BYTES = 1_000_000_000;

/**
 * GitHub blocks files larger than 100 MiB.
 * Quelle: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
 * (geprüft 2026-10-02). Jede Datei in dist/ stammt aus public/ oder dem Build.
 */
export const GIT_FILE_LIMIT_BYTES = 100 * 1024 * 1024;

/** Schwelle laut Ruling R130: bei 50 % der Limiten Alternativen prüfen (arc42 Kap. 7). */
export const WARN_RATIO = 0.5;

export interface FileEntry {
  path: string;
  size: number;
}

export interface LimitsResult {
  ok: boolean;
  totalBytes: number;
  largest: FileEntry | null;
  problems: string[];
}

const HINT = 'Alternativen prüfen (R130, docs/arc42.md Kap. 7)';

function percent(value: number, limit: number): string {
  return ((value / limit) * 100).toFixed(1);
}

function problem(what: string, value: number, limit: number): string {
  const threshold = WARN_RATIO * limit;
  return `${what}: ${value} Bytes (${percent(value, limit)} % des Limits), Schwelle ${threshold} Bytes. ${HINT}`;
}

export function checkPagesLimits(files: ReadonlyArray<FileEntry>): LimitsResult {
  let totalBytes = 0;
  let largest: FileEntry | null = null;
  for (const f of files) {
    totalBytes += f.size;
    if (largest === null || f.size > largest.size) largest = { path: f.path, size: f.size };
  }
  const problems: string[] = [];
  if (totalBytes >= WARN_RATIO * PAGES_SITE_LIMIT_BYTES) {
    problems.push(problem('Seitengrösse', totalBytes, PAGES_SITE_LIMIT_BYTES));
  }
  if (largest !== null && largest.size >= WARN_RATIO * GIT_FILE_LIMIT_BYTES) {
    problems.push(problem(`Grösste Datei ${largest.path}`, largest.size, GIT_FILE_LIMIT_BYTES));
  }
  return { ok: problems.length === 0, totalBytes, largest, problems };
}
