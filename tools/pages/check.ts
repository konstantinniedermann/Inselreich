// tools/pages/check.ts — CLI: node tools/pages/check.ts [dir]  (Standard: dist), Ruling R130
import { existsSync, readdirSync, statSync } from 'node:fs';
import { checkPagesLimits, GIT_FILE_LIMIT_BYTES, PAGES_SITE_LIMIT_BYTES } from './limits.ts';
import type { FileEntry } from './limits.ts';

function walk(dir: string, prefix: string): FileEntry[] {
  const out: FileEntry[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = `${dir}/${name}`;
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full, `${prefix}${name}/`));
    else out.push({ path: `${prefix}${name}`, size: stat.size });
  }
  return out;
}

function main(): number {
  const dir = process.argv[2] ?? 'dist';
  if (!existsSync(dir)) {
    console.error(`Verzeichnis ${dir} fehlt; zuerst bauen (make build).`);
    return 1;
  }
  const r = checkPagesLimits(walk(dir, ''));
  const mb = (r.totalBytes / 1_000_000).toFixed(2);
  const pct = ((r.totalBytes / PAGES_SITE_LIMIT_BYTES) * 100).toFixed(2);
  const big = r.largest
    ? `${(r.largest.size / 1024 / 1024).toFixed(2)} MiB (${((r.largest.size / GIT_FILE_LIMIT_BYTES) * 100).toFixed(2)} % von 100 MiB), ${r.largest.path}`
    : 'keine Dateien';
  console.log(`pages-limit: gesamt ${mb} MB (${pct} % von 1 GB), grösste Datei ${big}`);
  for (const p of r.problems) console.error(p);
  return r.ok ? 0 : 1;
}

process.exit(main());
