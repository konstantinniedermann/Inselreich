import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/style.css', 'utf8');

/** Variablen aus dem :root-Block ziehen. */
function rootVars(source: string): Record<string, string> {
  const block = /:root\s*\{([^}]*)\}/.exec(source)?.[1] ?? '';
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]!] = m[2]!.trim();
  return out;
}

/** Relative Luminanz nach WCAG 2.1. */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

const vars = rootVars(css);

const PAIRS: Array<[string, string]> = [
  ['--ink', '--parchment'],
  ['--ink', '--warn-parchment'], // .toast.warn
  ['--parchment', '--wood'],
  ['--gold', '--wood'],
  ['--ink', '--gold'],
  ['--ink', '--parchment-edge'],
  ['--parchment', '--wood-light'], // Buttons, Segmente
  ['--parchment', '--wood'], // gesperrte Buttons, Leisten
  ['--parchment-edge', '--wood'], // Seed-Zeile in der Leiste
  ['--negative', '--wood'], // .negative in der Leiste
  ['--parchment-muted', '--wood-light'], // .btn.unaffordable (R132)
  ['--parchment-muted', '--wood'], // .btn.unaffordable auf Hover
];

describe('UI-Kontrast (AK-U2-02)', () => {
  it('AK-U2-02 alle Textfarben ≥ 4,5 : 1 auf ihrem Hintergrund', () => {
    for (const [fg, bg] of PAIRS) {
      expect(vars[fg], fg).toBeDefined();
      expect(vars[bg], bg).toBeDefined();
      expect(contrast(vars[fg]!, vars[bg]!), `${fg}/${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('Grafik-Kontrast ≥ 3 : 1: Warnkante auf Warn-Pergament', () => {
    expect(contrast(vars['--warn-amber']!, vars['--warn-parchment']!)).toBeGreaterThanOrEqual(3);
  });

  it('Boom-Marke bleibt mit hidden verborgen', () => {
    expect(css).toMatch(/\.badge--boom\[hidden\]\s*\{[^}]*display:\s*none/);
  });

  it('Keine Opacity auf Text (ausser :disabled, WCAG-ausgenommen)', () => {
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/opacity\s*:/.test(m[2]!)) expect(m[1]!, 'Regel mit opacity').toContain(':disabled');
    }
  });

  it('Spec 9.1 Signalrot ist nie Textfarbe', () => {
    expect(css).not.toMatch(/(^|[^-])color:\s*var\(--signal-red\)/m);
  });

  it('Spec 9.1 Signalrot ist nie Texthintergrund', () => {
    expect(css).not.toMatch(/background(-color)?:\s*var\(--signal-red\)/);
  });
});

describe('Info-Panel Töne und Regeln (AK-PU-19, AK-PU-20)', () => {
  it('AK-PU-19 Tonfarben ≥ 3 : 1 auf Pergament und Pergamentkante', () => {
    for (const tone of ['--tone-ok', '--tone-warn', '--tone-bad']) {
      expect(vars[tone], tone).toBeDefined();
      for (const bg of ['--parchment', '--parchment-edge'])
        expect(contrast(vars[tone]!, vars[bg]!), `${tone}/${bg}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('AK-PU-20 Kennzahlen-Grid, Tonkanten und verborgene Karten-Zeilen', () => {
    expect(css).toMatch(/\.pv-grid\s*\{[^}]*display:\s*grid/);
    for (const tone of ['ok', 'warn', 'bad'])
      expect(css).toMatch(
        new RegExp(`\\.pv-chip\\[data-tone='${tone}'\\]\\s*\\{[^}]*var\\(--tone-${tone}\\)`),
      );
    expect(css).toMatch(/\.pv-card \[hidden\],\s*\.pv-gain\[hidden\]\s*\{[^}]*display:\s*none/);
  });
});

describe('Bedarfs- und Grundkanten (AK-C1)', () => {
  it('AK-C1 Randfarben von .needs/.reasons .ok/.bad ≥ 3 : 1 auf Pergament', () => {
    const rule = /(\.needs \.(ok|bad),\s*\.reasons \.\2)\s*\{([^}]*)\}/g;
    let found = 0;
    for (const m of css.matchAll(rule)) {
      const v = /border-left:\s*\d+px solid var\((--[\w-]+)\)/.exec(m[3]!)?.[1];
      expect(v, m[1]).toBeDefined();
      expect(contrast(vars[v!]!, vars['--parchment']!), `${m[1]} ${v}`).toBeGreaterThanOrEqual(3);
      found++;
    }
    expect(found).toBe(2);
  });
});
