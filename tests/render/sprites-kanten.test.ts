import { describe, expect, it } from 'vitest';
import { spriteBounds } from '../../src/render/iso';
import { INK_TONE, PALETTE, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import { GRAIN_DARK, GRAIN_LIGHT, ROW_DARK } from '../../src/render/material';
import {
  CONTOUR_ALPHA,
  CONTOUR_WIDTH,
  HAND_SAG_MAX,
  HAND_SAG_MIN,
  L3_SALTS,
  LIGHT_EDGE_LADDER,
  TUFT_COLORS,
  contourWidth,
  drawBody,
  drawBodyPlain,
} from '../../src/render/sprites';
import { VARIANT_COUNT } from '../../src/render/variants';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { LEVELS } from '../../src/sim/defs/levels';
import type { Building, BuildingDef, Tier } from '../../src/sim/types';
import { hexToLab, deltaE2000, rgbToLab } from './deltaE';
import { fakeCtx, type Ev } from './fakeCtx';

// Auslegung der Breiten: Die Silhouette ist EIN Strich mit `lineWidth = 2 · Konturbreite`; die anschliessenden
// Füllungen decken die innere Hälfte und alle Innenkanten. Sichtbar bleibt `lineWidth / 2` (die Aussenhälfte).
// Der Test prüft deshalb `lineWidth / 2` als sichtbare Breite. Lichtkanten sind Striche mit lineWidth < 1.
const sceneCam = (zoom: number) => ({ x: 0, y: 0, zoom });
const MARGIN = 8; // wie spriteCache.ts (Rand der Cache-Fläche)

interface Case {
  name: string;
  def: BuildingDef;
  b: Building;
  variant: number;
}
/** Jeder Typ × Wohnhaus-Stufen 1–4 × Ausbaustufen (falls LEVELS) × alle Varianten. */
function cases(): Case[] {
  const out: Case[] = [];
  for (const def of Object.values(BUILDING_DEFS)) {
    const tiers: (Tier | undefined)[] = def.id === 'house' ? [1, 2, 3, 4] : [undefined];
    const levels: (2 | 3 | undefined)[] = LEVELS[def.id] ? [undefined, 2, 3] : [undefined];
    for (const tier of tiers)
      for (const level of levels)
        for (let variant = 0; variant < VARIANT_COUNT; variant++) {
          const b: Building = {
            id: 3,
            defId: def.id,
            x: 10,
            y: 10,
            connected: true,
            progress: 0,
            state: 'ok',
            island: 0,
          };
          if (tier) b.house = { tier } as unknown as Building['house'];
          if (level) b.level = level;
          out.push({
            name: `${def.id}${tier ?? ''}${level ? 'L' + level : ''}v${variant}`,
            def,
            b,
            variant,
          });
        }
  }
  return out;
}
const CASES = cases();
const house = (tier: Tier, variant = 0): Case =>
  CASES.find((c) => c.name === `house${tier}v${variant}`)!;

/** Zeichnet im Bildmodus und liefert Protokoll samt Kurvenaufrufen (Kontrollpunkt, Ende, Anfang). */
function paint(c: Case, zoom = 1, plain = false) {
  const { ctx, log } = fakeCtx();
  const curves: { from: { x: number; y: number }; cx: number; cy: number; x: number; y: number }[] =
    [];
  let cur = { x: 0, y: 0 };
  const spy = new Proxy(ctx, {
    get(t, k) {
      if (k === 'moveTo' || k === 'lineTo')
        return (x: number, y: number) => {
          cur = { x, y };
          (t as unknown as Record<string, (x: number, y: number) => void>)[k]!(x, y);
        };
      if (k === 'quadraticCurveTo')
        return (cx: number, cy: number, x: number, y: number) => {
          curves.push({ from: cur, cx, cy, x, y });
          cur = { x, y };
          t.quadraticCurveTo(cx, cy, x, y);
        };
      return Reflect.get(t, k, t) as unknown;
    },
  });
  (plain ? drawBodyPlain : drawBody)(spy, sceneCam(zoom), c.def, c.b, 0, undefined, c.variant);
  return { log, curves };
}
const strokes = (events: Ev[]) => events.filter((e) => e.op === 'stroke');
/** Silhouette: Strich mit lineWidth ≥ 1 bei Zoom 1 (Linien `p.line` haben Breite 1 und Deckkraft 1). */
const contours = (events: Ev[]) => strokes(events).filter((e) => e.lineWidth > 1);
const lightEdges = (events: Ev[]) => strokes(events).filter((e) => e.lineWidth < 1);
const share = (css: string): number => {
  const [r, g, b] = rgbOfCss(css);
  return b / (r + g + b);
};

describe('L3 Kanten: Silhouette statt Strich je Fläche', () => {
  it('AK-L3-a je Körper höchstens ein Kontur-Strich (Wohnhaus Stufe 2, Zoom 1)', () => {
    const { log } = paint(house(2));
    expect(strokes(log.events).filter((e) => e.lineWidth >= 1).length).toBeLessThanOrEqual(1);
  });
  it('AK-L3-a alle Typen, Stufen, Varianten: höchstens ein Kontur-Strich, Innenkanten ohne Strich', () => {
    for (const c of CASES) {
      const { log } = paint(c);
      const kont = contours(log.events);
      expect(kont.length, c.name).toBe(1);
      // keine Strich-Polygone je Fläche: ausser der Silhouette nur Lichtkanten und p.line-Striche (Breite 1, 2 Punkte)
      for (const e of strokes(log.events))
        if (e.lineWidth === 1) expect(e.points.length, c.name).toBe(2);
    }
  });
  it('AK-L3-a alle Typen, Stufen, Varianten bei Zoom 0,75: genau ein Kontur-Strich (SIL_MIN_BOX nimmt keiner kleinen Hütte die Kontur)', () => {
    const zoom = 0.75;
    for (const c of CASES) {
      const { log } = paint(c, zoom);
      // Kontur: Strich mit lineWidth = 2 · Konturbreite des Zooms und Deckkraft CONTOUR_ALPHA
      const kont = strokes(log.events).filter(
        (e) => Math.abs(e.lineWidth - 2 * contourWidth(zoom)) < 1e-9 && e.alpha === CONTOUR_ALPHA,
      );
      expect(kont.length, c.name).toBe(1);
    }
  });
  it('AK-L3-a Kontur: sichtbare Breite ≤ 0,75 px, Deckkraft ≤ 0,7, dunkler Eigenton (nie Schwarz oder Weiss)', () => {
    expect(CONTOUR_WIDTH).toBeLessThanOrEqual(0.75);
    expect(CONTOUR_ALPHA).toBeLessThanOrEqual(0.7);
    for (const zoom of [1, 1.5, 2])
      for (const c of CASES.filter((x) => x.variant === 0)) {
        const k = contours(paint(c, zoom).log.events)[0]!;
        expect(k.lineWidth / 2, c.name).toBeLessThanOrEqual(0.75 + 1e-9);
        expect(k.alpha, c.name).toBeLessThanOrEqual(0.7);
        expect(k.lineJoin, c.name).toBe('round');
        const [r, g, b] = rgbOfCss(k.style);
        expect(r + g + b, c.name).toBeGreaterThan(0);
        expect(r + g + b, c.name).toBeLessThan(765);
        expect(Math.max(r, g, b), c.name).toBeLessThan(150); // dunkler als jede Wandfläche
      }
  });
  it('AK-L3-a Breite wächst linear von Zoom 0,5 (keine Linie) bis Zoom 1', () => {
    expect(contourWidth(0.5)).toBe(0);
    expect(contourWidth(0.25)).toBe(0);
    expect(contourWidth(0.75)).toBeCloseTo(CONTOUR_WIDTH / 2, 9);
    expect(contourWidth(1)).toBe(CONTOUR_WIDTH);
    expect(contourWidth(2)).toBe(CONTOUR_WIDTH);
  });
  it('AK-L3-a bei Zoom ≤ 0,5 kein Konturstrich und keine Lichtkante', () => {
    for (const zoom of [0.5, 0.35, 0.25])
      for (const c of CASES.filter((x) => x.variant === 0)) {
        const { log } = paint(c, zoom);
        expect(contours(log.events).length, `${c.name}@${zoom}`).toBe(0);
        expect(lightEdges(log.events).length, `${c.name}@${zoom}`).toBe(0);
      }
  });
  it('AK-L3-a Zeichnungen sind ausgeglichen: save/restore und Matrix wie vorher', () => {
    for (const c of CASES.filter((x) => x.variant === 1)) {
      const { log } = paint(c);
      expect(log.saves, c.name).toBe(log.restores);
      expect(log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
      expect(log.globalAlpha).toBe(1);
      expect(log.lineJoin).toBe('miter');
    }
  });
});

describe('L3 Kanten: Lichtkante', () => {
  it('AK-L3-b Lichtkante je Körper mit Dach oder Quader: 0,5–1 px, wärmer als die angrenzende Fläche', () => {
    let withEdge = 0;
    for (const c of CASES.filter((x) => x.variant === 0)) {
      const { log } = paint(c);
      const light = lightEdges(log.events);
      if (light.length > 0) withEdge++;
      for (const e of light) {
        const i = log.events.indexOf(e);
        expect(e.lineWidth, c.name).toBeGreaterThanOrEqual(0.5);
        expect(e.lineWidth, c.name).toBeLessThanOrEqual(1);
        expect(e.alpha, c.name).toBeLessThan(1);
        const xs = e.points.map((p) => p.x),
          ys = e.points.map((p) => p.y);
        // angrenzende Fläche: eine vorher gefüllte, deren Box die Kante umschliesst (± 2 px)
        const around = log.events
          .slice(0, i)
          .filter(
            (f) =>
              f.op === 'fill' &&
              Math.min(...f.points.map((p) => p.x)) - 2 <= Math.min(...xs) &&
              Math.max(...f.points.map((p) => p.x)) + 2 >= Math.max(...xs) &&
              Math.min(...f.points.map((p) => p.y)) - 2 <= Math.min(...ys) &&
              Math.max(...f.points.map((p) => p.y)) + 2 >= Math.max(...ys),
          );
        expect(around.length, c.name).toBeGreaterThan(0);
        expect(
          around.some((f) => share(e.style) < share(f.style)),
          `${c.name} Lichtkante ${e.style}`,
        ).toBe(true);
      }
    }
    // deckt die Mehrzahl der Typen (Sonderformen ohne Kante sind erlaubt)
    expect(withEdge).toBeGreaterThanOrEqual(Object.keys(BUILDING_DEFS).length * 0.6);
  });
  it('AK-L3-b Wohnhaus Stufe 1–4 und Kontor haben eine Lichtkante', () => {
    for (const n of ['house1v0', 'house2v0', 'house3v0', 'house4v0', 'kontorv0']) {
      const c = CASES.find((x) => x.name === n)!;
      expect(lightEdges(paint(c).log.events).length, n).toBeGreaterThan(0);
    }
  });
});

describe('L3 Kanten: Hand-Linie', () => {
  const sagOf = (k: {
    from: { x: number; y: number };
    cx: number;
    cy: number;
    x: number;
    y: number;
  }) => (k.cy - (k.from.y + k.y) / 2) / 2;
  it('AK-L3-c Versatz zwischen 0,3 und 0,8 px bei Zoom 1, immer nach unten', () => {
    expect(HAND_SAG_MIN).toBeGreaterThanOrEqual(0.3);
    expect(HAND_SAG_MAX).toBeLessThanOrEqual(0.8);
    let n = 0;
    for (const c of CASES) {
      for (const k of paint(c).curves) {
        const d = sagOf(k);
        n++;
        expect(d, c.name).toBeGreaterThanOrEqual(0.3 - 1e-9);
        expect(d, c.name).toBeLessThanOrEqual(0.8 + 1e-9);
      }
    }
    expect(n).toBeGreaterThan(100);
  });
  it('AK-L3-c bei kleinerem Zoom proportional kleiner (≤ 0,8 · Zoom)', () => {
    for (const c of CASES.filter((x) => x.variant === 2))
      for (const k of paint(c, 0.75).curves)
        expect(sagOf(k), c.name).toBeLessThanOrEqual(0.6 + 1e-9);
  });
  it('AK-L3-c deterministisch: zweimal zeichnen = identische Ereignisliste', () => {
    for (const c of CASES.filter((x) => x.variant === 3)) {
      expect(paint(c).log.events, c.name).toEqual(paint(c).log.events);
    }
  });
  it('AK-L3-c hängt von der Variante ab, nicht von der Lage der Kachel', () => {
    const sags = (c: Case) => paint(c).curves.map(sagOf).join(',');
    expect(sags(house(2, 0))).not.toBe(sags(house(2, 1)));
    const moved = { ...house(2, 0), b: { ...house(2, 0).b, x: 31, y: 17 } };
    const a = paint(house(2, 0)).curves.map(sagOf);
    expect(paint(moved).curves.map(sagOf)).toEqual(a);
  });
  it('AK-L3-c gemeinsame Kanten hängen in jeder Fläche gleich durch (keine Spalten)', () => {
    for (const c of CASES.filter((x) => x.variant === 0)) {
      const seen = new Map<string, number>();
      for (const k of paint(c).curves) {
        const [a, b] = [k.from, { x: k.x, y: k.y }].sort((p, q) => p.x - q.x || p.y - q.y);
        const key = `${a!.x.toFixed(2)},${a!.y.toFixed(2)}|${b!.x.toFixed(2)},${b!.y.toFixed(2)}`;
        const d = sagOf(k);
        if (seen.has(key)) expect(d, `${c.name} ${key}`).toBeCloseTo(seen.get(key)!, 6);
        else seen.set(key, d);
      }
    }
  });
  it('AK-L3-c Bildmodus nur für das Bild: Plain-Zeichnung hat keine Kurven und Strich je Fläche', () => {
    const { log, curves } = paint(house(2), 1, true);
    expect(curves.length).toBe(0);
    expect(strokes(log.events).length).toBeGreaterThan(5);
  });
});

describe('L3 Kanten: Signalabstand und Zusatzfarben', () => {
  it('AK-L3-d jede neue Farbe hat ΔE2000 ≥ 20 zu allen Signalfarben', () => {
    const colors = new Set<string>([
      INK_TONE,
      GRAIN_LIGHT,
      GRAIN_DARK,
      ROW_DARK,
      ...TUFT_COLORS,
      ...LIGHT_EDGE_LADDER,
    ]);
    for (const c of CASES) {
      const hand = paint(c).log;
      const plain = paint(c, 1, true).log;
      const known = new Set([...plain.fillSet, ...plain.strokeSet]);
      for (const s of [...hand.fillSet, ...hand.strokeSet]) if (!known.has(s)) colors.add(s);
    }
    expect(colors.size).toBeGreaterThan(20);
    for (const css of colors) {
      const lab = rgbToLab(rgbOfCss(css));
      for (const name of SIGNAL_NAMES)
        expect(deltaE2000(lab, hexToLab(PALETTE[name])), `${css} ~ ${name}`).toBeGreaterThanOrEqual(
          20,
        );
    }
  });
  it('AK-L3-d Salze liegen im Block 500–599', () => {
    for (const s of Object.values(L3_SALTS)) {
      expect(s).toBeGreaterThanOrEqual(500);
      expect(s).toBeLessThanOrEqual(599);
    }
  });
});

describe('L3 Kanten: Bodenkontakt und Sprite-Fläche', () => {
  it('AK-L3-e alle Pfadpunkte des Körpers liegen in spriteBounds + MARGIN (alle Zooms)', () => {
    for (const zoom of [1, 2])
      for (const c of CASES) {
        const { log } = paint(c, zoom);
        const bb = spriteBounds(c.def, c.b);
        const [x0, y0, x1, y1] = [
          (bb.x - MARGIN) * zoom,
          (bb.y - MARGIN) * zoom,
          (bb.x + bb.w + MARGIN) * zoom,
          (bb.y + bb.h + MARGIN) * zoom,
        ];
        for (const p of log.allPoints) {
          expect(p.x, `${c.name}@${zoom}`).toBeGreaterThanOrEqual(x0);
          expect(p.x, `${c.name}@${zoom}`).toBeLessThanOrEqual(x1);
          expect(p.y, `${c.name}@${zoom}`).toBeGreaterThanOrEqual(y0);
          expect(p.y, `${c.name}@${zoom}`).toBeLessThanOrEqual(y1);
        }
      }
  });
  it('AK-L3-e Bildmodus malt Kontaktschatten (kühl, 2 Stufen) und 2–4 Grasbüschel; Plain nicht', () => {
    for (const c of CASES.filter((x) => x.variant === 0 && x.def.id === 'house')) {
      const hand = paint(c).log.events.filter((e) => e.op === 'fill');
      const plain = paint(c, 1, true).log.events.filter((e) => e.op === 'fill');
      const shade = hand.filter((e) => e.style === INK_TONE && e.alpha < 0.3);
      expect(new Set(shade.map((e) => e.alpha)).size, c.name).toBeGreaterThanOrEqual(2);
      expect(plain.filter((e) => e.style === INK_TONE && e.alpha < 0.3).length, c.name).toBe(0);
      const tufts = hand.filter((e) => (TUFT_COLORS as readonly string[]).includes(e.style));
      expect(tufts.length, c.name).toBeGreaterThanOrEqual(2 * 3);
      expect(tufts.length, c.name).toBeLessThanOrEqual(4 * 3);
      expect(plain.filter((e) => (TUFT_COLORS as readonly string[]).includes(e.style)).length).toBe(
        0,
      );
    }
  });
  it('AK-L3-e Hofplatte: ausgefranster Rand hat mehr Stützpunkte als die gerade Platte', () => {
    const c = house(1);
    const hand = paint(c).log.events.filter((e) => e.op === 'fill');
    const plain = paint(c, 1, true).log.events.filter((e) => e.op === 'fill');
    expect(hand[0]!.points.length).toBeGreaterThan(plain[0]!.points.length);
  });
});

describe('L3 Kanten: Pinselkorn (material.ts)', () => {
  it('AK-L3-e Korn: zwei Tonstufen, 1-px-Punkte, nur Strich-Pfade, begrenzte Zahl', async () => {
    const { drawMaterial } = await import('../../src/render/material');
    const { bodyFaces } = await import('../../src/render/sprites');
    const c = house(2, 1);
    const z = 1.5;
    const { ctx, log } = fakeCtx();
    drawMaterial(ctx, bodyFaces(c.def, c.b, 1, { x: 0, y: 0, zoom: z }), c.def, c.b, 1, z);
    const grain = log.events.filter((e) => e.style === GRAIN_LIGHT || e.style === GRAIN_DARK);
    expect(new Set(grain.map((e) => e.style)).size).toBe(2);
    for (const e of grain) {
      expect(e.op).toBe('stroke');
      expect(e.lineWidth).toBeLessThanOrEqual(1);
      expect(e.points.length).toBeLessThanOrEqual(2 * 48 * 12);
    }
    expect(log.events.some((e) => e.style === ROW_DARK)).toBe(true);
  });
  it('AK-L3-perf Material gebündelt: höchstens ein Strich je Gruppe, Fläche und Tonstufe (Cache-Aufbau)', async () => {
    const { drawMaterial } = await import('../../src/render/material');
    const { bodyFaces } = await import('../../src/render/sprites');
    for (const c of CASES.filter((x) => x.variant === 1)) {
      const faces = bodyFaces(c.def, c.b, 1, { x: 0, y: 0, zoom: 1.5 });
      const { ctx, log } = fakeCtx();
      drawMaterial(ctx, faces, c.def, c.b, 1, 1.5);
      const st = log.events.filter((e) => e.op === 'stroke');
      // Fugen, Stroh hell/dunkel, Risse, Dachreihen: je ein Strich; Korn: je Fläche und Tonstufe ein Strich
      expect(st.length, c.name).toBeLessThanOrEqual(5 + 2 * faces.length);
      const grain = st.filter((e) => e.style === GRAIN_LIGHT || e.style === GRAIN_DARK);
      expect(grain.length, c.name).toBeLessThanOrEqual(2 * faces.length);
    }
  });
});
