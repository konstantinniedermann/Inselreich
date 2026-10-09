// TOOL-GATES-2 V8: make check bricht bei Git-Konfliktmarkern in versionierten Dateien ab.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = new URL('../../tools/conflicts/check.ts', import.meta.url).pathname;

function repoWith(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'conflicts-'));
  const git = (...a: string[]) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
  git('init', '-q');
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  git('add', '.');
  return dir;
}
const run = (cwd: string) => spawnSync('node', [script], { cwd, encoding: 'utf8' });

describe('Konfliktmarker-Gate', () => {
  it('sauberes Repo: Exit 0', () => {
    const r = run(repoWith({ 'a.md': '# Titel\n\nText\n', 'b.ts': 'export const x = 1;\n' }));
    expect(r.status).toBe(0);
  });

  it('Konfliktmarker: Exit 1 mit Datei, Zeile und Hinweis', () => {
    const text = 'a\n<<<<<<< HEAD\nx\n=======\ny\n>>>>>>> feat/z\nb\n';
    const r = run(repoWith({ 'konflikt.ts': text }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('konflikt.ts:2');
    expect(r.stderr).toContain('Konfliktmarker');
  });

  it('keine Fehlalarme: längere Linien und eingerückte Marker', () => {
    const text = 'Titel\n==========\n  <<<<<<< x\n<<<<<<<<<< x\n';
    expect(run(repoWith({ 'doku.md': text })).status).toBe(0);
  });

  it('ein einzelnes ======= (Markdown-Trenner) ist kein Marker, nur <<<<<<< und >>>>>>> zählen', () => {
    expect(run(repoWith({ 'doku.md': 'Titel\n=======\ntext\n' })).status).toBe(0);
    expect(run(repoWith({ 'x.ts': '>>>>>>> feat/z\n' })).status).toBe(1);
  });

  it('nicht versionierte Dateien zählen nicht', () => {
    const dir = repoWith({ 'ok.ts': 'x\n' });
    writeFileSync(join(dir, 'neu.ts'), '<<<<<<< HEAD\n');
    expect(run(dir).status).toBe(0);
  });
});
