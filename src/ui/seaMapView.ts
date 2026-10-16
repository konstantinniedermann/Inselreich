// seaMapView.ts — rein: Anzeige-Helfer der Seekarte (UI-SEEKARTE T3). Kein Sim-Zustand, nichts im Save.
import { hitIsland, mapDots, tileToMap, type MapLayout } from '../render/seaMap';
import { functionLock } from '../sim/unlocks';
import type { World } from '../sim/types';
import { islandList } from './islandJump';
import { islandEffectTexts } from './islandCard';
import { farMark } from './farOrder';

/** Kartengrösse in CSS-Pixeln und Rand; `style.css` zeichnet dieselbe Grösse. */
export const SEA_MAP_W = 360;
export const SEA_MAP_H = 240;
export const SEA_MAP_PAD = 12;

/** Ohne Seefahrt gibt es keine Karte; sonst `null`. */
export function seaMapUnavailable(world: World): string | null {
  return functionLock(world, 'seafaring') === null ? null : 'Karte nicht verfügbar';
}

/** Anzeige-Schlüssel: gleich, solange die Karte gleich aussieht (Inselzahl, Kontor-Flags, Schiffspunkte in ganzen Karten-Pixeln). */
export function seaMapKey(world: World, l: MapLayout): string {
  const flags = world.islands.map((s) => (s.kontorId === null ? '0' : '1')).join('');
  const dots = mapDots(world).map((d) => {
    const m = tileToMap(l, d.x, d.y);
    return `${d.id}:${Math.round(m.x)},${Math.round(m.y)}`;
  });
  const m = farMark(world);
  const mark = m === null ? '-' : `${m.island}:${m.kind}:${m.text}:${m.warn ? 1 : 0}`;
  return `${world.islands.length}|${flags}|${dots.join(';')}|m:${mark}`;
}

/** Insel unter dem Kartenpunkt (nur Land) oder `null`. */
export function seaMapPick(world: World, l: MapLayout, px: number, py: number): number | null {
  return hitIsland(world, l, px, py);
}

/** Hover-Text: Label der Inselliste plus Abschnitte der Traits mit Wirkung und Markt-Vorliebe («Felsbucht · Gebirge+: Steinbruch, Glashütte ×2»), sonst `null`. */
export function seaMapTip(world: World, l: MapLayout, px: number, py: number): string | null {
  const i = hitIsland(world, l, px, py);
  if (i === null) return null;
  const label = islandList(world).find((e) => e.index === i)?.label;
  if (label === undefined) return null;
  const parts = [label, ...islandEffectTexts(world, i)];
  const m = farMark(world);
  if (m !== null && m.island === i)
    parts.push(`${m.kind === 'order' ? 'Fernauftrag' : 'Fernangebot'}: ${m.text}`);
  return parts.join(' · ');
}
