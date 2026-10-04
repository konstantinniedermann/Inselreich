import { describe, expect, it } from 'vitest';
import {
  DUNE_LAMBDA,
  DUNE_ONSET,
  DUNE_PROFILE_CREST,
  DUNE_TONE_FLAT,
  DUNE_TONE_MAX,
  WET_SAND,
  duneSample,
  type DuneSample,
} from '../../src/render/dunes';

const SEED = 1;
// Gerade Küste entlang x: Wasser bei y < 0, Küstenwert s = y (landeinwärts +y), Gradient (0, 1)
const straight = (x: number, y: number, beach?: number): DuneSample =>
  duneSample(SEED, x, y, y, 0, 1, beach);
// Kreisinsel um (0, 0) mit Radius R: s = R − |p|, Gradient zeigt landeinwärts (zur Mitte)
const R = 40;

/** Querversatz entlang einer Küste mit Gradient (gx, gy), an dem die Düne voll steht (h ≈ 1 auf den ersten Kämmen). */
function fullX(seed = SEED, gx = 0, gy = 1): number {
  const at = (o: number, tt: number) =>
    duneSample(seed, gx * tt + o * gy, gy * tt - o * gx, tt, gx, gy).h;
  for (let o = 0; o < 600; o += 0.5) {
    let ok = true;
    for (let k = 0; k < 2 && ok; k++) {
      let m = 0;
      const a = DUNE_ONSET + DUNE_LAMBDA * (k + 1) - 1.4;
      for (let tt = a; tt < a + DUNE_LAMBDA + 2.8; tt += 0.02) m = Math.max(m, at(o, tt));
      ok = m > 0.97;
    }
    if (ok) return o;
  }
  throw new Error('kein voller Dünenbereich gefunden');
}

const deg = (rad: number): number => (rad * 180) / Math.PI;

/** Kammlage (Argmax von h) auf einer Linie, in Schritten; liefert null, wenn kein Kamm ≥ minH. */
function argmax(f: (t: number) => number, from: number, to: number, step: number, minH: number) {
  let best = -1,
    bt = from;
  for (let t = from; t <= to; t += step) {
    const v = f(t);
    if (v > best) {
      best = v;
      bt = t;
    }
  }
  return best >= minH ? bt : null;
}

describe('H-R12 Dünen (Kern)', () => {
  it('H-R12-1 Kammrichtung parallel zur geraden Küste (±30°)', () => {
    let measured = 0;
    for (const seed of [1, 2, 3, 4]) {
      const at = (x: number, y: number) => duneSample(seed, x, y, y, 0, 1).h;
      for (let k = 0; k < 4; k++) {
        const nominal = DUNE_ONSET + DUNE_LAMBDA * (k + DUNE_PROFILE_CREST);
        let prev: number | null = null;
        for (let x = 0; x <= 80; x += 1) {
          const c = prev ?? nominal;
          const w = prev === null ? 1.2 : 0.7;
          const y = argmax((t) => at(x, t), c - w, c + w, 0.02, 0.9);
          if (y !== null && prev !== null) {
            measured++;
            expect(Math.abs(deg(Math.atan2(y - prev, 1)))).toBeLessThanOrEqual(30);
          }
          prev = y;
        }
      }
    }
    expect(measured).toBeGreaterThan(100);
  });

  it('H-R12-1b Kammrichtung folgt einer gekrümmten Küste (±30° zur Kreistangente)', () => {
    let measured = 0;
    for (const seed of [1, 2, 3]) {
      const hAt = (th: number, r: number) =>
        duneSample(seed, r * Math.cos(th), r * Math.sin(th), R - r, -Math.cos(th), -Math.sin(th)).h;
      for (let k = 0; k < 3; k++) {
        const nominal = R - DUNE_ONSET - DUNE_LAMBDA * (k + DUNE_PROFILE_CREST);
        let prev: { x: number; y: number; r: number } | null = null;
        for (let th = 0; th < 2 * Math.PI; th += 0.05) {
          const c = prev?.r ?? nominal;
          const w = prev === null ? 1.2 : 0.7;
          const r = argmax((t) => hAt(th, t), c - w, c + w, 0.02, 0.9);
          if (r === null) {
            prev = null;
            continue;
          }
          const p = { x: r * Math.cos(th), y: r * Math.sin(th), r };
          if (prev) {
            const tx = -Math.sin(th - 0.025),
              ty = Math.cos(th - 0.025);
            const dx = p.x - prev.x,
              dy = p.y - prev.y;
            const cos = Math.abs(dx * tx + dy * ty) / Math.hypot(dx, dy);
            measured++;
            expect(deg(Math.acos(Math.min(1, cos)))).toBeLessThanOrEqual(30);
          }
          prev = p;
        }
      }
    }
    expect(measured).toBeGreaterThan(100);
  });

  it('H-R12-2 Abstand ≥ 1 Kachel zum nassen Saum: h = 0 für s < WET_SAND + 1', () => {
    expect(DUNE_ONSET).toBeCloseTo(WET_SAND + 1, 10);
    let maxBefore = 0,
      maxAfter = 0;
    for (let x = 0; x < 80; x += 0.37)
      for (let s = -1; s < 8; s += 0.05) {
        const d = straight(x, s);
        if (s < WET_SAND + 1) maxBefore = Math.max(maxBefore, d.h, d.crest);
        else maxAfter = Math.max(maxAfter, d.h);
      }
    expect(maxBefore).toBe(0);
    expect(maxAfter).toBeGreaterThan(0.5);
  });

  it('H-R12-2b weicher Einsatz: direkt hinter der Grenze bleibt h klein', () => {
    let m = 0;
    for (let x = 0; x < 80; x += 0.37) m = Math.max(m, straight(x, DUNE_ONSET + 0.1).h);
    expect(m).toBeLessThan(0.2);
  });

  it('H-R12-3 asymmetrisches Profil: Luv (seewärts) länger als Lee (landeinwärts)', () => {
    // Auf einer Linie quer zur Küste: Abstand Trog→Kamm (Luv) gegen Kamm→Trog (Lee)
    const x = fullX();
    let luv = 0,
      lee = 0,
      n = 0;
    for (let k = 1; k < 3; k++) {
      const y0 = DUNE_ONSET + DUNE_LAMBDA * k;
      let cy: number | null = null,
        hv = 0;
      for (let y = y0 - 1.5; y < y0 + 2.5; y += 0.01) {
        const h = straight(x, y).h;
        if (h > hv) {
          hv = h;
          cy = y;
        }
      }
      if (cy === null || hv < 0.4) continue;
      let up = cy,
        down = cy;
      while (straight(x, up - 0.01).h < straight(x, up).h) up -= 0.01;
      while (straight(x, down + 0.01).h < straight(x, down).h) down += 0.01;
      luv += cy - up;
      lee += down - cy;
      n++;
    }
    expect(n).toBeGreaterThan(0);
    expect(luv).toBeGreaterThan(1.5 * lee);
  });

  it('H-R12-4 Lee genau 1 Stufe dunkler als Luv (gestufter Median, S6) auf Küsten beliebiger Ausrichtung', () => {
    const step = (v: number): number => Math.floor(v + 0.5);
    const median = (a: number[]): number => a.sort((p, q) => p - q)[a.length >> 1]!;
    for (const [gx, gy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [0.7071, 0.7071],
      [-0.7071, -0.7071],
    ] as const) {
      // Küstenwert entlang der Gradientenrichtung: s = gx·x + gy·y; Querversatz so, dass die Düne voll steht
      const luv: number[] = [],
        lee: number[] = [];
      const off = fullX(SEED, gx, gy);
      let maxJump = 0,
        prev: number | null = null;
      for (let t = 6; t < 20; t += 0.013) {
        const px = gx * t + off * gy,
          py = gy * t - off * gx;
        const d = duneSample(SEED, px, py, t, gx, gy);
        const d2 = duneSample(SEED, px + gx * 0.02, py + gy * 0.02, t + 0.02, gx, gy);
        // S6: im Abstand einer Kachel unterscheiden sich die Stufen um höchstens 1 (Sprünge am Kamm eingeschlossen)
        const st = step(d.tone);
        if (prev !== null) maxJump = Math.max(maxJump, Math.abs(st - prev));
        prev = st;
        if (d.h < 0.3) continue;
        (d2.h > d.h ? luv : lee).push(st);
      }
      expect(luv.length).toBeGreaterThan(20);
      expect(lee.length).toBeGreaterThan(10);
      expect(median(luv) - median(lee), `Richtung ${gx},${gy}`).toBe(1);
      expect(maxJump).toBeLessThanOrEqual(1);
    }
  });

  it('H-R12-5 Tonobergrenze: kein Ton heller als sandDry plus 1 Stufe (auch mit Rippeln und Korn)', () => {
    expect(DUNE_TONE_MAX).toBe(DUNE_TONE_FLAT + 1);
    let max = -Infinity,
      min = Infinity;
    for (const [gx, gy] of [
      [0, 1],
      [-1, 0],
      [0.6, -0.8],
    ] as const)
      for (let i = 0; i < 6000; i++) {
        const x = (i * 0.173) % 70,
          y = ((i * 0.719) % 17) + 1;
        const d = duneSample(SEED, x, y, y, gx, gy);
        const total = d.tone + d.ripple + d.grain;
        max = Math.max(max, total);
        min = Math.min(min, total);
      }
    expect(max).toBeLessThanOrEqual(DUNE_TONE_MAX);
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeGreaterThan(DUNE_TONE_FLAT + 0.3); // Luv trägt wirklich Licht
  });

  it('H-R12-6 Determinismus je Seed, anderer Seed anderes Feld', () => {
    const a = duneSample(5, 12.3, 4.4, 4.4, 0.2, 0.98);
    expect(duneSample(5, 12.3, 4.4, 4.4, 0.2, 0.98)).toEqual(a);
    let diff = 0;
    for (let x = 0; x < 30; x += 0.7)
      if (duneSample(6, x, 4.4, 4.4, 0, 1).h !== duneSample(5, x, 4.4, 4.4, 0, 1).h) diff++;
    expect(diff).toBeGreaterThan(5);
  });

  it('H-R12-7 Rippeln vorhanden, aber schwach und nicht auf der steilen Leeseite', () => {
    let sum = 0,
      sum2 = 0,
      n = 0,
      maxAbs = 0,
      maxLeeAbs = 0,
      maxTone = 0;
    for (let x = 0; x < 60; x += 0.9)
      for (let y = 1.5; y < 14; y += 0.011) {
        const d = straight(x, y);
        sum += d.ripple;
        sum2 += d.ripple * d.ripple;
        n++;
        maxAbs = Math.max(maxAbs, Math.abs(d.ripple));
        maxTone = Math.max(maxTone, Math.abs(d.tone - DUNE_TONE_FLAT));
        const d2 = straight(x, y + 0.02),
          d0 = straight(x, y - 0.02);
        if (d.h > 0.3 && d2.h < d.h - 0.018 && d0.h > d.h + 0.018)
          maxLeeAbs = Math.max(maxLeeAbs, Math.abs(d.ripple));
      }
    const sd = Math.sqrt(sum2 / n - (sum / n) ** 2);
    expect(sd).toBeGreaterThan(0.02); // vorhanden
    expect(maxAbs).toBeLessThanOrEqual(0.25); // schwach (viel weniger als eine Stufe)
    expect(maxAbs).toBeLessThan(maxTone / 3);
    expect(maxLeeAbs).toBeLessThan(0.02);
  });

  it('H-R12-8 Rippeln liegen küstenparallel: Phase hängt vor allem von s ab', () => {
    // entlang der Küste ändert sich ripple langsam, quer dazu schnell
    let along = 0,
      across = 0;
    for (let i = 0; i < 400; i++) {
      const x = i * 0.31,
        y = 3 + (i % 7) * 0.9;
      const a = straight(x, y).ripple;
      along += Math.abs(straight(x + 0.1, y).ripple - a);
      across += Math.abs(straight(x, y + 0.1).ripple - a);
    }
    expect(across).toBeGreaterThan(2 * along);
  });

  it('H-R12-9 schmale Strände (< 1,5 Kacheln trocken) bleiben glatt, breite tragen Dünen', () => {
    let narrow = 0,
      wide = 0;
    for (let x = 0; x < 120; x += 0.9)
      for (let y = 1.2; y < 8; y += 0.1) {
        narrow = Math.max(narrow, straight(x, y, 1.4).h);
        wide = Math.max(wide, straight(x, y, 5).h);
      }
    expect(narrow).toBe(0);
    expect(wide).toBeGreaterThan(0.5);
  });

  it('H-R12-10 Dünen laufen landeinwärts weich aus (Strandende)', () => {
    // beach = trockene Breite; Dünen nahe dem Strandende (s − WET_SAND nahe beach) fallen auf 0
    const beach = 4;
    let nearEnd = 0,
      mid = 0;
    for (let x = 0; x < 120; x += 0.9)
      for (let y = 1.2; y < beach + WET_SAND + 0.01; y += 0.02) {
        const h = straight(x, y, beach).h;
        if (y > beach + WET_SAND - 0.15) nearEnd = Math.max(nearEnd, h);
        else mid = Math.max(mid, h);
      }
    expect(mid).toBeGreaterThan(0.3);
    expect(nearEnd).toBeLessThan(0.15);
  });

  it('H-R12-11 etwa die Hälfte (30–70 %) des breiten Strands bleibt ohne Dünen (Maske)', () => {
    let on = 0,
      n = 0;
    for (let x = 0; x < 400; x += 2)
      for (const seed of [1, 2, 3, 4]) {
        n++;
        let m = 0;
        for (let y = 1.3; y < 6; y += 0.4) m = Math.max(m, duneSample(seed, x, y, y, 0, 1, 3.2).h);
        if (m > 0.05) on++;
      }
    expect(on / n).toBeGreaterThan(0.3);
    expect(on / n).toBeLessThan(0.7);
  });
});
