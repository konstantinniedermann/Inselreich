import { describe, expect, it } from 'vitest';
import {
  clampCamera,
  createCamera,
  screenToTile,
  tileToScreen,
  TILE,
  zoomAt,
} from '../../src/render/camera';

describe('camera', () => {
  it('round-trips tile <-> screen', () => {
    const c = createCamera();
    c.x = 100;
    c.y = 50;
    c.zoom = 1.5;
    const s = tileToScreen(c, 10, 7);
    expect(screenToTile(c, s.x + 1, s.y + 1)).toEqual({ x: 10, y: 7 });
  });
  it('clamps to world bounds', () => {
    const c = createCamera();
    c.x = -500;
    c.y = 99999;
    clampCamera(c, 64 * TILE, 64 * TILE, 800, 600);
    expect(c.x).toBe(0);
    expect(c.y).toBe(64 * TILE - 600);
  });
  it('zoom stays within 0.5..2 and never NaN', () => {
    const c = createCamera();
    for (let i = 0; i < 20; i++) zoomAt(c, 1.25, 400, 300, 800, 600, 64 * TILE, 64 * TILE);
    expect(c.zoom).toBe(2);
    for (let i = 0; i < 40; i++) zoomAt(c, 0.8, 400, 300, 800, 600, 64 * TILE, 64 * TILE);
    expect(c.zoom).toBe(0.5);
    expect(Number.isNaN(c.x)).toBe(false);
  });
  it('AK-A1-05 tileToScreen liefert ganze Pixel ohne Lücke oder Überlappung', () => {
    for (const zoom of [0.5, 0.75, 1.1, 1.33, 1.7, 2]) {
      const c = { x: 13.7, y: 5.3, zoom }; // gebrochener Kamera-Versatz wie im Spiel
      for (let n = 0; n < 64; n++) {
        const a = tileToScreen(c, n, n);
        const b = tileToScreen(c, n + 1, n + 1);
        expect(Number.isInteger(a.x) && Number.isInteger(a.y)).toBe(true);
        expect([Math.floor(32 * zoom), Math.ceil(32 * zoom)]).toContain(b.x - a.x);
        expect([Math.floor(32 * zoom), Math.ceil(32 * zoom)]).toContain(b.y - a.y);
      }
    }
  });
});
