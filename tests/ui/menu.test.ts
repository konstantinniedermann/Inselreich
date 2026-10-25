import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hasAutosave,
  newIslandPrompt,
  openMenu,
  slotLabel,
  type MenuActions,
} from '../../src/ui/menu';
import type { SaveInfo } from '../../src/ui/storage';
import { formatClock } from '../../src/ui/time';
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
      honors: () => ({ line: 'Ehrenbuch: 0 von 9 Meisterstücken', note: null }),
      openHonors: () => {},
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
      honors: () => ({ line: 'Ehrenbuch: 0 von 9 Meisterstücken', note: null }),
      openHonors: () => {},
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
      honors: () => ({ line: 'Ehrenbuch: 0 von 9 Meisterstücken', note: null }),
      openHonors: () => {},
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

describe('Zweiter Autosave im Menü (I-147, AK-H4, H9)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const tick = (sec: number): number => (sec * 1000) / TICK_MS;
  const actions = (saves: SaveInfo[]): MenuActions =>
    ({
      save: () => {},
      listSaves: () => saves,
      storageNote: () => null,
      hasProgress: () => false,
      load: () => {},
      crisisLevel: () => 'normal',
      unlockMode: () => 'stepwise',
      newIsland: () => {},
      hotkeys: () => [],
      seed: () => 1,
      openGuide: () => {},
      honors: () => ({ line: 'Ehrenbuch: 0 von 9 Meisterstücken', note: null }),
      openHonors: () => {},
    }) as unknown as MenuActions;
  const labels = (saves: SaveInfo[]): (string | undefined)[] => {
    vi.stubGlobal('document', { createElement: fakeEl });
    vi.stubGlobal('Option', function Option() {});
    openMenu(
      fakeEl('div') as unknown as HTMLElement,
      actions(saves),
      fakeEl('button') as unknown as HTMLElement,
    );
    return flat(lastCard.card!)
      .filter((e) => e.tag === 'button' && /Spielzeit/.test(e.textContent ?? ''))
      .map((e) => e.textContent);
  };

  it('H4: slotLabel nennt den älteren Platz «Autosave davor», Zeit über formatClock', () => {
    const info: SaveInfo = { slot: 'auto2', tick: tick(125) };
    expect(slotLabel(info, true)).toBe(`Autosave davor — Spielzeit ${formatClock(info.tick)}`);
    expect(slotLabel(info)).toBe(`Autosave — Spielzeit ${formatClock(info.tick)}`);
    const manual: SaveInfo = { slot: 'manual', tick: tick(30) };
    expect(slotLabel(manual, true)).toBe(`Gespeichert — Spielzeit ${formatClock(manual.tick)}`);
  });

  it('H4: Liste Autosave, Autosave davor, Gespeichert', () => {
    const saves: SaveInfo[] = [
      { slot: 'manual', tick: tick(10) },
      { slot: 'auto2', tick: tick(300) },
      { slot: 'auto', tick: tick(200) },
    ];
    expect(labels(saves)).toEqual([
      `Autosave — Spielzeit ${formatClock(tick(300))}`,
      `Autosave davor — Spielzeit ${formatClock(tick(200))}`,
      `Gespeichert — Spielzeit ${formatClock(tick(10))}`,
    ]);
  });

  it('H4: mit einem Autosave nur «Autosave — …»', () => {
    const l = labels([{ slot: 'auto2', tick: tick(40) }]);
    expect(l).toEqual([`Autosave — Spielzeit ${formatClock(tick(40))}`]);
  });

  it('H9: hasAutosave gilt auch, wenn nur auto2 besteht', () => {
    expect(hasAutosave([{ slot: 'auto2', tick: 1 }])).toBe(true);
    expect(hasAutosave([{ slot: 'auto', tick: 1 }])).toBe(true);
    expect(hasAutosave([{ slot: 'manual', tick: 1 }])).toBe(false);
    expect(hasAutosave([])).toBe(false);
  });
});

describe('Ehrenbuch im Menü (I-186, AK-EB-01)', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('zeigt Zeile und Hinweis, Knopf «Ehrenbuch» ruft openHonors mit dem Knopf', () => {
    vi.stubGlobal('document', {
      createElement: (tag: string) => {
        const e = fakeEl(tag);
        if (tag === 'button')
          e.addEventListener = (_t: string, f: () => void) => void (e.onClick = f);
        return e;
      },
    });
    vi.stubGlobal('Option', function Option() {});
    const opened: unknown[] = [];
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
      honors: () => ({
        line: 'Ehrenbuch: 2 von 9 Meisterstücken',
        note: 'Ehrenbuch wird nicht gespeichert',
      }),
      openHonors: (o: unknown) => void opened.push(o),
    } as unknown as MenuActions;
    openMenu(
      fakeEl('div') as unknown as HTMLElement,
      a,
      fakeEl('button') as unknown as HTMLElement,
    );
    const all = flat(lastCard.card!);
    const texts = all.map((e) => e.textContent);
    expect(texts).toContain('Ehrenbuch: 2 von 9 Meisterstücken');
    expect(texts).toContain('Ehrenbuch wird nicht gespeichert');
    const btn = all.find((e) => e.tag === 'button' && e.textContent === 'Ehrenbuch')!;
    (btn.onClick as () => void)();
    expect(opened).toEqual([btn]);
  });
});
