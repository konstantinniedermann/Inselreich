import { afterEach, describe, expect, it, vi } from 'vitest';
import { openHonorCard } from '../../src/ui/honorCard';
import type { HonorRow } from '../../src/ui/honorView';

vi.mock('../../src/ui/modal', () => ({
  openModal: () => {
    lastCard.card = fakeEl('div');
    return { card: lastCard.card, close: () => {} };
  },
}));

interface Fake {
  tag: string;
  textContent?: string;
  children: Fake[];
  [k: string]: unknown;
}
function fakeEl(tag: string): Fake {
  const el: Fake = {
    tag,
    children: [],
    append: (...c: Fake[]) => void el.children.push(...c.filter((x) => typeof x === 'object')),
    replaceChildren: (...c: Fake[]) => void (el.children = c),
    addEventListener: () => {},
    setAttribute: () => {},
    focus: () => {},
  };
  return el;
}
const lastCard: { card?: Fake } = {};
const flat = (e: Fake): Fake[] => [e, ...e.children.flatMap(flat)];
const texts = (e: Fake): string[] =>
  flat(e)
    .map((x) => x.textContent)
    .filter((t): t is string => typeof t === 'string');

describe('Ehrenbuch-Karte (I-186 T06, N8)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const rows: HonorRow[] = [
    {
      id: 'citizenTown',
      name: 'Name <b>fett</b>',
      condition: 'Bedingung <i>x</i>',
      done: { date: '05.10.2026', map: 'Karte 7', crisis: 'normal', time: '2:05' },
      sessionOnly: true,
    },
    {
      id: 'swiftFound',
      name: 'Offen <b>x</b>',
      condition: 'Bed <u>y</u>',
      done: null,
      sessionOnly: false,
    },
  ];

  it('Markup erscheint wörtlich als Text, nie als Element', () => {
    vi.stubGlobal('document', { createElement: fakeEl });
    openHonorCard(fakeEl('div') as unknown as HTMLElement, {
      rows,
      count: { have: 1, total: 2 },
      hints: ['Hinweis <b>1</b>'],
    });
    const all = flat(lastCard.card!);
    expect(all.filter((e) => ['b', 'i', 'u'].includes(e.tag))).toEqual([]);
    expect(all.filter((e) => e.innerHTML !== undefined)).toEqual([]);
    const t = texts(lastCard.card!).join('|');
    expect(t).toContain('Name <b>fett</b>');
    expect(t).toContain('Bed <u>y</u>');
    expect(t).toContain('Hinweis <b>1</b>');
  });

  it('Kopf, erreichte und offene Zeile zeigen ihre Angaben', () => {
    vi.stubGlobal('document', { createElement: fakeEl });
    openHonorCard(fakeEl('div') as unknown as HTMLElement, {
      rows,
      count: { have: 1, total: 2 },
      hints: [],
    });
    const t = texts(lastCard.card!).join('|');
    for (const s of ['1 von 2', '05.10.2026', 'Karte 7', 'normal', '2:05', 'in dieser Sitzung'])
      expect(t).toContain(s);
    const open = flat(lastCard.card!).find((e) => e.className === 'honor-row honor-row--open');
    expect(open).toBeDefined();
  });
});
