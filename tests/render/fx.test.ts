import { describe, expect, it } from 'vitest';
import {
  EXTINGUISHED_TICKS,
  drawBoomCoin,
  drawFire,
  drawFireGlow,
  drawWarnRing,
  warnRingAlpha,
} from '../../src/render/fx';
import { fireTongues, rainStreaks } from '../../src/render/limits';
import { PALETTE, SIGNAL_NAMES, rgbaOf } from '../../src/render/palette';
import { fakeCtx } from './fakeCtx';

const R = { x: 100, y: 80, w: 64, h: 60 };
const flameFills = (evs: { op: string; style: string }[]) =>
  evs.filter((e) => e.op === 'fill' && e.style.startsWith('gradient(')).length;
const SIGNAL_HEX = SIGNAL_NAMES.map((n) => PALETTE[n].toLowerCase());
const hasSignal = (styles: string[]) =>
  styles.some((s) => SIGNAL_HEX.includes(s.toLowerCase()) || /255,103,38/.test(s));

describe('Krisen-Effekte (Spec 6.5)', () => {
  it('AK-R3-02 Regenschlieren ≤ w × CAP_RAIN, reduziert ≤ w × 100', () => {
    expect(rainStreaks(1)).toBe(350);
    expect(rainStreaks(0.5)).toBe(175);
    expect(rainStreaks(1, true)).toBe(100);
  });

  it('AK-R3-02 Feuerzungen ≤ CAP_FIRE, bei flames = 0 keine; drawFire hält sich daran', () => {
    expect(fireTongues(1)).toBe(24);
    expect(fireTongues(1, true)).toBe(8);
    expect(fireTongues(0)).toBe(0);
    const none = fakeCtx();
    drawFire(none.ctx, R, 500, { flames: 0, smoke: 1 });
    expect(flameFills(none.log.events)).toBe(0);
    expect(none.log.events.some((e) => e.op === 'fill')).toBe(true); // Rauch-Nachlauf bleibt
  });

  it('AK-R3-02 Flammen: ein Verlauf-Pfad mit höchstens CAP_FIRE Zungen, reduziert weniger', () => {
    const full = fakeCtx();
    drawFire(full.ctx, R, 500, { flames: 1, smoke: 0 });
    expect(flameFills(full.log.events)).toBe(1);
    const red = fakeCtx();
    drawFire(red.ctx, R, 500, { flames: 1, smoke: 0, reduce: true });
    const tongue = (log: { allPoints: unknown[] }) => log.allPoints.length;
    expect(tongue(red.log)).toBeLessThan(tongue(full.log));
    expect(tongue(full.log)).toBeLessThanOrEqual(24 * 8);
  });

  it('Spec 6.5 Feuer, Glühen, Münze ohne Signalfarben; Warnring genau signalWarn', () => {
    for (const draw of [
      (c: CanvasRenderingContext2D) => drawFire(c, R, 700, { flames: 1, smoke: 1 }),
      (c: CanvasRenderingContext2D) => drawFireGlow(c, R, 700, 1),
      (c: CanvasRenderingContext2D) => drawBoomCoin(c, R, 700),
    ]) {
      const { ctx, log } = fakeCtx();
      draw(ctx);
      const styles = [...log.fillSet, ...log.strokeSet];
      expect(styles.length).toBeGreaterThan(0);
      // Umriss der Münze ist Weiss (Signal-Umriss), sonst keine Signalfarbe
      expect(hasSignal(styles)).toBe(false);
    }
    const { ctx, log } = fakeCtx();
    drawWarnRing(ctx, R, 100);
    expect(log.strokeSet).toContain(PALETTE.signalWarn);
    expect(log.saves).toBe(log.restores);
  });

  it('drawFireGlow zeichnet bei flames = 0 nichts', () => {
    const { ctx, log } = fakeCtx();
    drawFireGlow(ctx, R, 100, 0);
    expect(log.events).toHaveLength(0);
  });

  it('Rauch dunkel, steigt mit Wind nach rechts (Punkte driften nach rechts-oben)', () => {
    const early = fakeCtx(),
      later = fakeCtx();
    drawFire(early.ctx, R, 0, { flames: 0, smoke: 1 });
    drawFire(later.ctx, R, 400, { flames: 0, smoke: 1 });
    const mean = (pts: { x: number; y: number }[], k: 'x' | 'y') =>
      pts.reduce((a, p) => a + p[k], 0) / pts.length;
    // über eine ganze Periode gemittelt liegt der Schwerpunkt rechts und über der Basis
    expect(mean(early.log.allPoints, 'x')).toBeGreaterThan(R.x + R.w / 2);
    expect(mean(early.log.allPoints, 'y')).toBeLessThan(R.y + R.h);
    expect(later.log.allPoints.length).toBe(early.log.allPoints.length);
  });

  it('Plan-Setzung Warnring: Plateau 100 % für 0,5 s je 1,2 s, sonst bis 60 %', () => {
    const a = [...Array(120)].map((_, i) => warnRingAlpha(i * 10));
    expect(Math.min(...a)).toBeCloseTo(0.6, 2);
    expect(a.filter((v) => v === 1).length).toBeGreaterThanOrEqual(50);
    expect(Math.max(...a)).toBe(1);
    for (let t = -3000; t < 3000; t += 37) {
      const v = warnRingAlpha(t);
      expect(v).toBeGreaterThanOrEqual(0.6 - 1e-9);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(warnRingAlpha(NaN)).toBe(1);
  });

  it('Warnring: Rahmen 2 px in signalWarn mit voller Deckkraft im Plateau, dunkler Umriss 1,5 px darunter', () => {
    const { ctx, log } = fakeCtx();
    drawWarnRing(ctx, R, 100);
    const rings = log.events.filter((e) => e.op === 'strokeRect');
    expect(rings).toHaveLength(2);
    expect(rings[0]!.style).not.toBe(PALETTE.signalWarn);
    expect(rings[1]!.style).toBe(PALETTE.signalWarn);
    expect(rings[1]!.alpha).toBe(1);
    expect(rings[1]!.composite).toBe('source-over');
    expect(rgbaOf(PALETTE.signalWarn, 1)).toBeTruthy();
  });

  it('EXTINGUISHED_TICKS ist 60 (R85 Punkt 12)', () => expect(EXTINGUISHED_TICKS).toBe(60));
});
