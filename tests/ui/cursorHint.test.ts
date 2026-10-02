import { describe, expect, it } from 'vitest';
import { project } from '../../src/render/iso';
import type { Camera } from '../../src/render/camera';
import { connectAdvice, placementHint } from '../../src/ui/hints';
import { canDemolishTile, hintKey } from '../../src/ui/input';
import { targetTile } from '../../src/ui/target';
import { uxWorld } from './worlds';

const camAt = (fx: number, fy: number): Camera => {
  const p = project(fx, fy);
  return { x: p.x - 400, y: p.y - 300, zoom: 1 };
};

describe('Cursor-Hinweis am Kartenrand (RF-4)', () => {
  it('RF-4 Zeiger ausserhalb der Karte: keine Zielkachel, also kein Schild', () => {
    const { w } = uxWorld();
    const cam = camAt(-30, -30);
    for (const tool of [
      { kind: 'build', defId: 'fisher' },
      { kind: 'road' },
      { kind: 'select' },
      { kind: 'demolish' },
    ] as const) {
      expect(targetTile(w, cam, tool, 400, 300)).toBeNull();
    }
  });

  it('RF-4 Zeiger auf der Randkachel, Footprint ragt hinaus: Hinweis zum Kartenrand', () => {
    const { w } = uxWorld();
    const h = placementHint(w, { kind: 'build', defId: 'fisher' }, -1, 0);
    expect(h).toEqual({ tone: 'bad', text: 'Reicht über den Kartenrand hinaus' });
  });
});

describe('Weg-Hinweis ohne Hotkey (Review Task 5)', () => {
  it('RF-4 connectAdvice setzt bei fehlender Taste kein "(null)"', () => {
    expect(connectAdvice('R')).toBe('danach mit Weg (R) zum Kontor verbinden');
    expect(connectAdvice(null)).toBe('danach mit Weg zum Kontor verbinden');
    expect(connectAdvice(null)).not.toContain('null');
  });
});

describe('Abriss-Vorschau (Spec L3)', () => {
  it('canDemolishTile: Gebäude und Weg rot, Kontor und leere Kachel nicht', () => {
    const { w, fisher, kx, ky } = uxWorld();
    expect(canDemolishTile(w, fisher.x, fisher.y)).toBe(true);
    expect(canDemolishTile(w, kx, ky)).toBe(false);
    expect(canDemolishTile(w, -5, -5)).toBe(false);
  });
});

describe('Hinweis-Schlüssel (Fix Task 6)', () => {
  it('hintKey ändert sich nur mit Kachel oder Werkzeug', () => {
    const f = { kind: 'build', defId: 'fisher' } as const;
    const a = hintKey({ x: 3, y: 4, tool: f });
    expect(hintKey({ x: 3, y: 4, tool: { ...f } })).toBe(a);
    expect(hintKey({ x: 4, y: 4, tool: f })).not.toBe(a);
    expect(hintKey({ x: 3, y: 4, tool: { kind: 'build', defId: 'house' } })).not.toBe(a);
    expect(hintKey({ x: 3, y: 4, tool: { kind: 'road' } })).not.toBe(a);
    expect(hintKey({ x: 3, y: 4, tool: null })).not.toBe(a);
  });
});
