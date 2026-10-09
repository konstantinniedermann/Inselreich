import { describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import {
  SEA_LANE_GAP,
  SEA_PAD,
  seaContext,
  seaKeepOut,
  seaPlan,
  seaPlanKeepOut,
  type SeaContext,
} from '../../src/render/decor';

/*
 * RENDER-SEEPLAN-KEEPOUT, P1 (Messung auf main, Load ~4, Kaltstart je Seed, Seeds 1-40, 3 Läufe, Median):
 *   seaContext-Neubau (inkl. seaRoute-Kopien):      0,08 ms  -> seaRoute ist gecacht/billig, P3 (Routen-Cache) nicht nötig
 *   seaPlan mit routes = [] (ohne Routen-Prüfung):  2,25 ms
 *   seaPlan mit Routen (seaPlanKeepOut-Schleife):   9,78 ms  -> die Schleife über ~630-900 Routenpunkte je Kachel kostet ~7,5 ms
 *   Math.hypot-Aufrufe je seaPlan-Neubau (= distToSeg + wenige andere), Mittel über Seeds 1-40: 479 551
 *   Summe über Seeds 1-40: 19 182 059
 * Entscheid: P2 (räumlicher Index) ja, P3 nein.
 */
const OLD_HYPOT_TOTAL = 19_182_059; // Summe Math.hypot-Aufrufe je Plan-Neubau auf main, Seeds 1-40
const PADS = [...new Set([0, SEA_PAD.wreck, SEA_PAD.rock, SEA_PAD.islet])]; // rock = 0 fällt mit 0 zusammen

function segDist(
  px: number,
  py: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

/** Referenz: die alte Schleife über alle Segmente aller Routen. */
function seaPlanKeepOutRef(ctx: SeaContext, x: number, y: number, pad = 0): boolean {
  if (seaKeepOut(ctx, x, y, pad)) return true;
  const cx = x + 0.5,
    cy = y + 0.5,
    gap = SEA_LANE_GAP + pad;
  for (const r of ctx.routes)
    for (let i = 1; i < r.length; i++) if (segDist(cx, cy, r[i - 1]!, r[i]!) < gap) return true;
  return false;
}

describe('RF-P2 seaPlanKeepOut mit Segmentindex', () => {
  it('RF-P2 jede Kachel der Heimat, Seeds 1-40, alle pads: Antwort gleich der Referenzschleife', () => {
    let tiles = 0,
      blockedByRoute = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const ctx = seaContext(w);
      for (const pad of PADS)
        for (let y = 0; y < isl.height; y++)
          for (let x = 0; x < isl.width; x++) {
            const got = seaPlanKeepOut(ctx, x, y, pad);
            const ref = seaPlanKeepOutRef(ctx, x, y, pad);
            tiles++;
            if (got !== ref)
              expect({ seed, x, y, pad, got }).toEqual({ seed, x, y, pad, got: ref });
            if (ref && !seaKeepOut(ctx, x, y, pad)) blockedByRoute++;
          }
    }
    expect(tiles).toBeGreaterThan(100_000);
    expect(blockedByRoute).toBeGreaterThan(0); // der Test prüft den Routenzweig wirklich
  }, 60_000);

  it('RF-P2 pad ausserhalb der Indexgrenze (Rückfall) und Punkte ausserhalb der Insel stimmen ebenfalls', () => {
    const w = createWorld(7);
    const ctx = seaContext(w);
    for (const pad of [1.5, 3, 6])
      for (let y = -20; y < home(w).height + 20; y += 3)
        for (let x = -20; x < home(w).width + 20; x += 3)
          expect(seaPlanKeepOut(ctx, x, y, pad)).toBe(seaPlanKeepOutRef(ctx, x, y, pad));
  });

  it('RF-P2 Zählgrösse: Math.hypot-Aufrufe je Plan-Neubau (Seeds 1-40) <= 20 % des Ausgangswerts', () => {
    const orig = Math.hypot;
    let n = 0;
    Math.hypot = (...a: number[]): number => (n++, orig(...a));
    try {
      for (let seed = 1; seed <= 40; seed++) {
        const w = createWorld(seed);
        seaPlan(seed, home(w), seaContext(w));
      }
    } finally {
      Math.hypot = orig;
    }
    expect(n).toBeLessThanOrEqual(OLD_HYPOT_TOTAL * 0.2);
  });
});
