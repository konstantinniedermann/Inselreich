// Manifest der Audio-Dateien (Spec 7.6, ADR-011). Nur hier stehen Dateinamen; die Schrift steht in
// src/ui/credits.ts. Fehlt eine Datei, greift der synthetische Rückfall (kein Fehler).
// Pfade relativ zu `public/`; Auflösung über `assetUrl(import.meta.env.BASE_URL, file)`.
import type { Layer } from './mix';
import type { SoundEvent } from './sound';

export type AssetKind = 'music' | 'loop' | 'sfx';

export interface AssetEntry {
  id: string;
  kind: AssetKind;
  file: string;
  phase?: 'day' | 'night';
  title: string;
  author: string;
  license: string;
  link: string;
  /** CC-BY-Änderungsvermerk (Spec 7.6). */
  changes?: string;
}

const CC0 = 'CC0 1.0';
const fs = (id: number) => `https://freesound.org/s/${id}/`;

const OGA = 'https://opengameart.org/'; // Seiten-Links der Stücke ergänzt X1 laut Lizenzurteil

export const MANIFEST: readonly AssetEntry[] = [
  {
    id: 'MU1',
    kind: 'music',
    file: 'audio/music/bards-tale.mp3',
    phase: 'day',
    title: "Medieval: The Bard's Tale",
    author: 'RandomMind',
    license: CC0,
    link: OGA,
  },
  {
    id: 'MU2',
    kind: 'music',
    file: 'audio/music/old-tower-inn.mp3',
    phase: 'day',
    title: 'Medieval: The Old Tower Inn',
    author: 'RandomMind',
    license: CC0,
    link: OGA,
  },
  {
    id: 'MU3',
    kind: 'music',
    file: 'audio/music/dowland-complaints.mp3',
    phase: 'night',
    title:
      'If my complaints could passions move (John Dowland, 1597; Einspielung Of Far Different Nature)',
    author: 'Of Far Different Nature',
    license: CC0,
    link: OGA,
  },
  {
    id: 'AM1',
    kind: 'loop',
    file: 'audio/amb/sea.mp3',
    title: 'Meer (Schleife)',
    author: 'kkenny101',
    license: CC0,
    link: fs(852826),
  },
  {
    id: 'AM2',
    kind: 'loop',
    file: 'audio/amb/birds.mp3',
    title: 'Vögel (Schleife)',
    author: 'Nordliecht',
    license: CC0,
    link: fs(855955),
  },
  {
    id: 'AM3',
    kind: 'loop',
    file: 'audio/amb/gulls.mp3',
    title: 'Möwen (Schleife)',
    author: 'nikitralala',
    license: CC0,
    link: fs(317676),
  },
  {
    id: 'AM4',
    kind: 'loop',
    file: 'audio/amb/crickets.mp3',
    title: 'Grillen (Schleife)',
    author: 'Goldenboy76',
    license: CC0,
    link: fs(857163),
  },
  {
    id: 'AM5',
    kind: 'loop',
    file: 'audio/amb/rain.mp3',
    title: 'Regen (Schleife)',
    author: 'Talitha5',
    license: CC0,
    link: fs(321885),
  },
  {
    id: 'AM6',
    kind: 'loop',
    file: 'audio/amb/storm.mp3',
    title: 'Sturm (Schleife)',
    author: 'Qwirkie',
    license: CC0,
    link: fs(341941),
  },
  {
    id: 'AM7',
    kind: 'loop',
    file: 'audio/amb/fire.mp3',
    title: 'Feuer (Schleife)',
    author: 'Nox_Sound',
    license: CC0,
    link: fs(564621),
  },
  {
    id: 'SG1',
    kind: 'sfx',
    file: 'audio/sfx/bell.mp3',
    title: 'Schiffsglocke (Alarm)',
    author: 'gsparrysound',
    license: CC0,
    link: fs(582523),
  },
  {
    id: 'SG2',
    kind: 'sfx',
    file: 'audio/sfx/foghorn.mp3',
    title: 'Nebelhorn (Sturmwarnung)',
    author: 'TomOstepop',
    license: CC0,
    link: fs(673668),
  },
  {
    id: 'FX1',
    kind: 'sfx',
    file: 'audio/sfx/coins.mp3',
    title: 'Münzen',
    author: 'ilyaShevelev',
    license: CC0,
    link: fs(847349),
  },
  {
    id: 'FX2',
    kind: 'sfx',
    file: 'audio/sfx/hammer.mp3',
    title: 'Hammer (Stadt)',
    author: 'L.i.Z.e.L.l.E_+',
    license: CC0,
    link: fs(707864),
  },
];

/** Datei je Umgebungsschicht; `wind` und `town` sind rein synthetisch (Gemurmel). */
export const LAYER_FILES: Partial<Record<Layer, string>> = {
  sea: 'audio/amb/sea.mp3',
  birds: 'audio/amb/birds.mp3',
  gulls: 'audio/amb/gulls.mp3',
  night: 'audio/amb/crickets.mp3',
  rain: 'audio/amb/rain.mp3',
  storm: 'audio/amb/storm.mp3',
  fire: 'audio/amb/fire.mp3',
};

/** Samples der Signaltöne; ohne Datei oder bei Fehler spielt der synthetische Rückfall. */
export const SFX_FILES: Partial<Record<SoundEvent, string>> = {
  alarm: 'audio/sfx/bell.mp3',
  stormWarning: 'audio/sfx/foghorn.mp3',
  boom: 'audio/sfx/coins.mp3',
};

/** Hammer der Schicht `town`. */
export const HAMMER_FILE = 'audio/sfx/hammer.mp3';

/** Löst eine Datei aus `public/` gegen die Basis (Vite `BASE_URL`) auf. */
export function assetUrl(baseUrl: string, file: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return base + file.replace(/^\/+/, '');
}
