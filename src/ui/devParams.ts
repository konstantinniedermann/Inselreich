import type { Weather, WeatherKind } from '../render/daynight';

/** Dev-Vorschau aus der Adresszeile (Spec 9.5); im Produktions-Build immer leer. */
export interface DevPreview {
  weather?: Weather;
  fireId?: number;
  boom?: boolean;
  signal?: 'alarm' | 'stormWarning' | 'boom';
  extinguishedId?: number;
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

/** Liest `?wetter=…&w=…&feuer=…&boom=1&signal=…&geloescht=…&perf=1&raster=1`; ungültige Werte entfallen. */
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
  const fireId = wholeNumber(q.get('feuer'));
  if (fireId !== undefined) out.fireId = fireId;
  if (q.get('boom') === '1') out.boom = true;
  const signal = SIGNALS.find((s) => s === q.get('signal'));
  if (signal) out.signal = signal;
  const ext = wholeNumber(q.get('geloescht'));
  if (ext !== undefined) out.extinguishedId = ext;
  if (q.get('perf') === '1') out.perf = true;
  if (q.get('raster') === '1') out.raster = true;
  return out;
}
