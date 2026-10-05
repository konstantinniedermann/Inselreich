import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = `${dir}/${f}`;
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });

const direct = /\b(world|w|state\.world)\.(tiles|stock|kontorId)\b/;
const destructured = /\{[^}]*\b(width|height|tiles)\b[^}]*\}\s*=\s*(world|w|state\.world)\b/;

describe('M12 E0 Zugriff Render/UI', () => {
  it('PLAN-W1 src/render und src/ui lesen Raster und Lager nur über Insel-Helfer', () => {
    const hits: string[] = [];
    for (const f of [...walk('src/render'), ...walk('src/ui')]) {
      readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (direct.test(line) || destructured.test(line)) hits.push(`${f}:${i + 1}`);
        });
    }
    expect(hits).toEqual([]);
  });
});
