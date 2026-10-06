// icons.ts — Symbolsatz Schritt 1 (M10 Spec 14): 25 prozedurale SVG-Silhouetten, Farben nur aus PALETTE.
import { PALETTE } from '../render/palette';

export const ICON_IDS = [
  'wood',
  'tools',
  'stone',
  'food',
  'wool',
  'cloth',
  'cane',
  'rum',
  'glass',
  'spice',
  'tier-1',
  'tier-2',
  'tier-3',
  'tier-4',
  'money',
  'balance',
  'tax',
  'faith',
  'school',
  'bath',
  'help',
  'cat-infrastructure',
  'cat-housing',
  'cat-production',
  'cat-public',
] as const;
export type IconId = (typeof ICON_IDS)[number];

export interface IconDef {
  label: string;
  paths: string[];
  color: keyof typeof PALETTE;
}

/** Stufen-Figur (Kopf + Körper) mit n Merkmalen (Punkte oben), n = 1..4. */
function tierPaths(n: number): string[] {
  const x0 = 8 - (3 * n - 1) / 2;
  let pips = '';
  for (let i = 0; i < n; i++) pips += `${i ? ' ' : ''}M${x0 + 3 * i} 0h2v2h-2z`;
  return ['M5.8 6.5a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0z M3 15c0-3 2-5 5-5s5 2 5 5z', pips];
}

export const ICONS: Record<IconId, IconDef> = {
  wood: {
    label: 'Holz',
    paths: [
      'M1 11a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z M8 11a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z',
      'M4.5 5.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z',
    ],
    color: 'earth',
  },
  tools: {
    label: 'Werkzeug',
    paths: ['M2 2h12v4H2z', 'M7 6h2v9H7z'],
    color: 'wallStone',
  },
  stone: {
    label: 'Stein',
    paths: ['M2 14L1 8L5 3H11L15 8L14 14z'],
    color: 'rockLight',
  },
  food: {
    label: 'Nahrung',
    paths: ['M1 11c0-5 3-8 7-8s7 3 7 8z', 'M3 12.5h10v2.5H3z'],
    color: 'roofThatch',
  },
  wool: {
    label: 'Wolle',
    paths: ['M4 12a3 3 0 0 1 0-6a4 4 0 0 1 8 0a3 3 0 0 1 0 6z', 'M5 12h2v3H5z M9 12h2v3H9z'],
    color: 'wallLime',
  },
  cloth: {
    label: 'Tuch',
    paths: ['M1 4h10v8H1z', 'M11 8m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0z'],
    color: 'roofCopper',
  },
  cane: {
    label: 'Zuckerrohr',
    paths: [
      'M3 15L3.5 4h1L5 15z M7.5 15V1h1v14z M11 15L11.5 4h1l.5 11z',
      'M8.5 6L14 3L11 8z M7.5 8L2 5L5 10z',
    ],
    color: 'grassLight',
  },
  rum: {
    label: 'Rum',
    paths: ['M4 2h8c2 2 3 4 3 6s-1 4-3 6H4C2 12 1 10 1 8s1-4 3-6z'],
    color: 'roofTerracotta',
  },
  glass: {
    label: 'Glas',
    paths: ['M3 1h10l-1 6c-.5 2-2 3-3.5 3.5V13h3v2H4.5v-2h3v-2.5C6 10 4.5 9 4 7z'],
    color: 'foam',
  },
  spice: {
    label: 'Gewürz',
    paths: ['M8 1c3 3 5 6 5 9a5 5 0 0 1 -10 0c0-3 2-6 5-9z'],
    color: 'window', // D-144: Bernsteingelb, eigene Chip-Farbe (nicht Braun wie Holz)
  },
  'tier-1': { label: 'Pioniere', paths: tierPaths(1), color: 'sandDry' },
  'tier-2': { label: 'Siedler', paths: tierPaths(2), color: 'grassLight' },
  'tier-3': { label: 'Bürger', paths: tierPaths(3), color: 'waterShallow' },
  'tier-4': { label: 'Kaufleute', paths: tierPaths(4), color: 'roofThatch' },
  money: {
    label: 'Geld',
    paths: [
      'M1 8a7 7 0 1 0 14 0a7 7 0 1 0 -14 0z M3 8a5 5 0 1 1 10 0a5 5 0 1 1 -10 0z',
      'M7 5h2v6H7z',
    ],
    color: 'signalYellow',
  },
  balance: {
    label: 'Bilanz',
    paths: ['M7 2h2v11H7z M2 4h12v1.5H2z M4 13h8v2H4z', 'M.5 10h5L3 5.5z M10.5 10h5L13 5.5z'],
    color: 'rockLight',
  },
  tax: {
    label: 'Steuer',
    paths: [
      'M1.5 4.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0z M9.5 11.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0z',
      'M11 1h2.5L5 15H2.5z',
    ],
    color: 'roofThatch',
  },
  faith: {
    label: 'Glaube',
    paths: ['M7 1h2v4h4v2H9v8H7V7H3V5h4z'],
    color: 'lightMorning',
  },
  school: {
    label: 'Schule',
    paths: ['M1 3c3-1 5 0 7 1.5C10 3 12 2 15 3v10c-3-1-5 0-7 1.5C6 13 4 12 1 13z'],
    color: 'lightEvening',
  },
  bath: {
    label: 'Bad',
    paths: ['M8 1C11 5 13 8 13 10.5a5 5 0 0 1-10 0C3 8 5 5 8 1z'],
    color: 'waterShallow',
  },
  help: {
    label: 'Hilfe',
    paths: [
      'M4 5.5C4 3 5.7 1.5 8 1.5s4 1.5 4 3.5c0 1.8-1.2 2.7-2.3 3.5C9 9 9 9.5 9 10.5H7C7 8.8 7.3 8 8.3 7.2C9.2 6.5 10 6 10 5c0-.8-.8-1.5-2-1.5S6 4.2 6 5.5z',
      'M6.8 13.2a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0z',
    ],
    color: 'sandDry',
  },
  'cat-infrastructure': {
    label: 'Infrastruktur',
    paths: ['M1 6h14v2H1z M2 8h2v5H2z M12 8h2v5h-2z', 'M1 13h14v2H1z'],
    color: 'wallStone',
  },
  'cat-housing': {
    label: 'Wohnen',
    paths: ['M8 1L15 7.5h-2V15H3V7.5H1z'],
    color: 'wallLime',
  },
  'cat-production': {
    label: 'Produktion',
    paths: ['M1 15V6l4 3V6l4 3V3h3v12z', 'M12 15h3V8h-3z'],
    color: 'roofTerracotta',
  },
  'cat-public': {
    label: 'Öffentlich',
    paths: ['M8 1L15 5v2H1V5z M2 8h2v5H2z M7 8h2v5H7z M12 8h2v5h-2z', 'M1 14h14v1.5H1z'],
    color: 'lightMorning',
  },
};

/** SVG-Markup eines Symbols; reiner Schmuck, der zugängliche Name sitzt am Träger. */
export function iconSvg(id: IconId): string {
  const { paths, color } = ICONS[id];
  const body = paths.map((d) => `<path d="${d}" fill="${PALETTE[color]}"/>`).join('');
  return `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">${body}</svg>`;
}
