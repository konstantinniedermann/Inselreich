import { describe, expect, it } from 'vitest';
import {
  centerOnVisible,
  clampVisible,
  makeVisibleHeight,
  visibleViewHeight,
} from '../../src/ui/cameraView';
import { project } from '../../src/render/iso';
import { worldToScreen } from '../../src/render/camera';

const bounds = { x0: 10, y0: 20, x1: 70, y1: 90 };

describe('cameraView: sichtbare Kartenhöhe (UI-KAMERA U1)', () => {
  it('zieht das Overlay ab und klemmt Ausreisser', () => {
    expect(visibleViewHeight(574, 36)).toBe(538);
    expect(visibleViewHeight(574, 0)).toBe(574);
    expect(visibleViewHeight(30, 100)).toBe(1);
    expect(visibleViewHeight(574, -5)).toBe(574);
  });

  it('visibleHeight misst nach Änderung von clientHeight und Overlay neu', () => {
    const canvas = { clientHeight: 600 };
    let overlay = 0;
    const visibleHeight = makeVisibleHeight(canvas, () => overlay);
    expect(visibleHeight()).toBe(600);
    canvas.clientHeight = 800;
    expect(visibleHeight()).toBe(800);
    overlay = 50;
    expect(visibleHeight()).toBe(750);
  });
});

describe('cameraView: Klemmung und Zentrierung (UI-KAMERA U2)', () => {
  it('AK-U2a: zweimal klemmen = einmal klemmen', () => {
    const once = { x: 5000, y: -3000, zoom: 1 };
    clampVisible(once, bounds, 1280, 720, 40);
    const twice = { ...once };
    clampVisible(twice, bounds, 1280, 720, 40);
    expect(twice).toEqual(once);
  });

  it('AK-U2b: DPR 1 und 2 geben dieselbe Kamera (CSS-Pixel)', () => {
    const cssW = 1280;
    const cssH = 720;
    const run = (dpr: number) => {
      const devW = cssW * dpr;
      const devH = cssH * dpr;
      const cam = { x: 9000, y: 9000, zoom: 1 };
      clampVisible(cam, bounds, devW / dpr, devH / dpr, 36);
      return cam;
    };
    expect(run(2)).toEqual(run(1));
  });

  it('AK-U2c: Kamera im Rahmen bleibt beim Overlay-Wechsel unverändert', () => {
    const mid = project(40, 55);
    const cam = { x: mid.x - 640, y: mid.y - 360, zoom: 1 };
    const before = { ...cam };
    clampVisible(cam, bounds, 1280, 720, 36);
    expect(cam).toEqual(before);
  });

  it('AK-U2d: centerOn-Ziel liegt bei overlayH > 0 in der sichtbaren Mitte', () => {
    const cam = { x: 0, y: 0, zoom: 1 };
    centerOnVisible(cam, 40, 55, 1280, 720, 100, bounds);
    const s = worldToScreen(cam, project(40, 55));
    expect(s.x).toBeCloseTo(640, 6);
    expect(s.y).toBeCloseTo((720 - 100) / 2, 6);
  });
});
