import { afterEach, describe, expect, it, vi } from 'vitest';
import { newIslandPrompt, openMenu, slotLabel, type MenuActions } from '../../src/ui/menu';
import { TICK_MS } from '../../src/sim/defs/timing';

vi.mock('../../src/ui/modal', () => ({
  openModal: () => {
    lastCard.card = fakeEl('div');
    return { card: lastCard.card, close: () => {} };
  },
  renderConfirm: () => {},
}));

interface Fake {
  tag: string;
  className?: string;
  textContent?: string;
  title?: string;
  value?: string;
  children: Fake[];
  [k: string]: unknown;
}
/** Minimaler DOM-Ersatz: merkt Kinder und Eigenschaften, Methoden sind folgenlos. */
function fakeEl(tag: string): Fake {
  const el: Fake = {
    tag,
    title: undefined,
    children: [],
    append: (...c: Fake[]) => void el.children.push(...c.filter((x) => typeof x === 'object')),
    replaceChildren: (...c: Fake[]) => void (el.children = c),
    addEventListener: () => {},
    setAttribute: () => {},
    focus: () => {},
    querySelector: () => null,
  };
  return el;
}
const lastCard: { card?: Fake } = {};
const flat = (e: Fake): Fake[] => [e, ...(e.children ?? []).flatMap(flat)];

describe('UI-TASTEN Tooltip am Menü-Knopf «Speichern» (AK-UT-12)', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('«Speichern» trägt title «Strg/Cmd + S», die übrigen Knöpfe keinen', () => {
    vi.stubGlobal('document', { createElement: fakeEl });
    vi.stubGlobal('Option', function Option() {});
    const host = fakeEl('div');
    const a = {
      save: () => {},
      listSaves: () => [{ slot: 'auto', tick: 0 }],
      storageNote: () => null,
      hasProgress: () => false,
      load: () => {},
      crisisLevel: () => 'normal',
      unlockMode: () => 'stepwise',
      newIsland: () => {},
      hotkeys: () => [],
      seed: () => 1,
      openGuide: () => {},
    } as unknown as MenuActions;
    openMenu(host as unknown as HTMLElement, a, fakeEl('button') as unknown as HTMLElement);
    const buttons = flat(lastCard.card!).filter((e) => e.tag === 'button');
    const titles = Object.fromEntries(buttons.map((b) => [b.textContent, b.title]));
    expect(titles['Speichern']).toBe('Strg/Cmd + S');
    for (const [label, title] of Object.entries(titles))
      if (label !== 'Speichern') expect(title).toBeUndefined();
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('AK-UT-10 Menü: Überschrift «Speichern»', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('Reihenfolge: Titel, Speichern-Überschrift, Knopf, Laden-Überschrift, Liste', () => {
    vi.stubGlobal('document', { createElement: fakeEl });
    vi.stubGlobal('Option', function Option() {});
    const a = {
      save: () => {},
      listSaves: () => [],
      storageNote: () => null,
      hasProgress: () => false,
      load: () => {},
      crisisLevel: () => 'normal',
      unlockMode: () => 'stepwise',
      newIsland: () => {},
      hotkeys: () => [],
      seed: () => 1,
      openGuide: () => {},
    } as unknown as MenuActions;
    openMenu(
      fakeEl('div') as unknown as HTMLElement,
      a,
      fakeEl('button') as unknown as HTMLElement,
    );
    const kids = lastCard.card!.children;
    expect(kids.slice(0, 5).map((k) => [k.tag, k.textContent])).toEqual([
      ['h2', 'Menü'],
      ['h3', 'Speichern'],
      ['button', 'Speichern'],
      ['h3', 'Laden'],
      ['div', undefined],
    ]);
  });
});

describe('Menü-Texte (Spec L2, P-3)', () => {
  it('slotLabel: Spielzeit als Uhr', () => {
    expect(slotLabel({ slot: 'auto', tick: (300 * 1000) / TICK_MS })).toBe(
      'Autosave — Spielzeit 5:00',
    );
    expect(slotLabel({ slot: 'manual', tick: (30 * 1000) / TICK_MS })).toBe(
      'Gespeichert — Spielzeit 0:30',
    );
  });
  it('newIslandPrompt: mit Autosave der L1-Text, ohne Autosave der Hinweis auf die laufende Insel', () => {
    expect(newIslandPrompt(true)).toBe(
      'Neue Insel beginnen? Der bisherige Autosave wird beim nächsten Speichern ersetzt.',
    );
    expect(newIslandPrompt(false)).toBe(
      'Neue Insel beginnen? Die laufende Insel ist nicht gespeichert und geht verloren.',
    );
  });
});

describe('UI-AUFRAEUM-4 AK-5 Menü: Krisen-Beschriftung', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('«Krisen (neue Insel): » vor dem Auswahlfeld', () => {
    const texts: string[] = [];
    vi.stubGlobal('document', {
      createElement: (tag: string) => {
        const e = fakeEl(tag);
        if (tag === 'label') {
          const orig = e.append as (...c: unknown[]) => void;
          e.append = (...c: unknown[]) => {
            texts.push(...c.filter((x): x is string => typeof x === 'string'));
            orig(...c);
          };
        }
        return e;
      },
    });
    vi.stubGlobal('Option', function Option() {});
    const a = {
      save: () => {},
      listSaves: () => [],
      storageNote: () => null,
      hasProgress: () => false,
      load: () => {},
      crisisLevel: () => 'normal',
      unlockMode: () => 'stepwise',
      newIsland: () => {},
      hotkeys: () => [],
      seed: () => 1,
      openGuide: () => {},
    } as unknown as MenuActions;
    openMenu(
      fakeEl('div') as unknown as HTMLElement,
      a,
      fakeEl('button') as unknown as HTMLElement,
    );
    expect(texts).toContain('Krisen (neue Insel): ');
    expect(texts).toContain('Freischaltung: ');
    expect(texts).not.toContain('Krisen: ');
  });
});
