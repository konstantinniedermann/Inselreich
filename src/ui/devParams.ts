import type { Weather, WeatherKind } from '../render/daynight';

/** Dev-Vorschau aus der Adresszeile (Spec 9.5); im Produktions-Build immer leer. */
export interface DevPreview {
  weather?: Weather;
  /** Brennende Betriebe (`feuer=<id>,<id>,…`), ohne Doppelte, in Eingabereihenfolge. */
  fireIds?: number[];
  boom?: boolean;
  signal?: 'alarm' | 'stormWarning' | 'boom';
  perf?: boolean;
  raster?: boolean;
}

const KINDS: Record<string, WeatherKind> = {
  klar: 'clear',
  wolkig: 'cloudy',
  regen: 'rain',
  sturm: 'storm',
};
const SIGNALS = ['alarm', 'stormWarning', 'boom'] as const;

function wholeNumber(v: string | null): number | undefined {
  if (v === null || !/^\d+$/.test(v)) return undefined;
  const n = Number(v);
  return Number.isSafeInteger(n) ? n : undefined;
}

/** Kommagetrennte Ids; ungültige Einträge und Doppelte entfallen. */
export function parseIdList(v: string | null): number[] {
  if (v === null) return [];
  const ids: number[] = [];
  for (const part of v.split(',')) {
    const n = wholeNumber(part.trim());
    if (n !== undefined && !ids.includes(n)) ids.push(n);
  }
  return ids;
}

/** Liest `?wetter=…&w=…&feuer=<id>,<id>,…&boom=1&signal=…&perf=1&raster=1`; ungültige Werte entfallen. */
export function parseDevParams(search: string, dev: boolean): DevPreview {
  const out: DevPreview = {};
  if (!dev) return out;
  const q = new URLSearchParams(search);
  const kind = KINDS[q.get('wetter') ?? ''];
  if (kind !== undefined) {
    const raw = q.get('w');
    const w = raw === null || raw.trim() === '' ? 1 : Number(raw);
    out.weather = { kind, w: Number.isFinite(w) ? Math.min(1, Math.max(0, w)) : 1 };
  }
  const fireIds = parseIdList(q.get('feuer'));
  if (fireIds.length > 0) out.fireIds = fireIds;
  if (q.get('boom') === '1') out.boom = true;
  const signal = SIGNALS.find((s) => s === q.get('signal'));
  if (signal) out.signal = signal;
  if (q.get('perf') === '1') out.perf = true;
  if (q.get('raster') === '1') out.raster = true;
  return out;
}
