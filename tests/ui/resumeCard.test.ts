// UI-HAEPPCHEN-G T02: «Wo war ich?»-Karte beim Laden (I-148, AK-G11 bis G18).
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GOODS } from '../../src/sim/defs/goods';
import { TRIALS, TRIAL_DURATION_TICKS } from '../../src/sim/defs/trials';
import { acceptContract, acceptFarOrder, nextSettleTick } from '../../src/sim/orders';
import { serialize } from '../../src/sim/save';
import type { Building, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { farOfferDue } from '../../src/ui/farOrder';
import { homeTravelTicks } from '../../src/ui/homeTravel';
import { isModalOpen, closeAllModals } from '../../src/ui/modal';
import { NO_PROBLEM_TEXT } from '../../src/ui/problems';
import {
  openResumeCard,
  resumeCardView,
  sortLines,
  type ResumeLine,
} from '../../src/ui/resumeCard';
import { formatClock, formatGameTime } from '../../src/ui/time';
import { farWorld, periodStart, stepAt } from '../sim/farHelpers';
import { FakeElement } from './fakeDom';

const lines = (w: World): string[] => resumeCardView(w)!.deadlines;

/** Nicht angebundene Weberei: ein Problem (Muster problems.test.ts). */
function addProblem(w: World, id: number): void {
  w.buildings[id] = {
    id,
    defId: 'weaver',
    x: 3 + id,
    y: 3,
    island: 0,
    connected: false,
    progress: 0,
    state: 'ok',
  } as Building;
}

function localOrderWorld(): World {
  const w = farWorld(3, ['B']);
  stepAt(w, periodStart(1));
  return w;
}
function farOrderWorld(): World {
  const w = localOrderWorld();
  acceptFarOrder(w);
  return w;
}
function contractWorld(): World {
  const w = farOrderWorld();
  // Das Angebot entsteht sonst erst bei erfüllter Lieferung ab Haus-Stufe 3; hier direkt setzen.
  w.contractOffer = { good: w.order!.good, island: w.order!.island! };
  const r = acceptContract(w);
  if (!r.ok) throw new Error(r.reason);
  w.tick = periodStart(1) + 10;
  return w;
}

describe('AK-G11 stumm', () => {
  it('frische Welt: null', () => {
    expect(resumeCardView(createWorld(3))).toBeNull();
  });
});

describe('AK-G12 Fristzeilen', () => {
  it('Zufallsauftrag', () => {
    const w = localOrderWorld();
    expect(w.order!.island).toBeUndefined();
    const o = w.order!;
    expect(lines(w)).toContain(
      `Auftrag ${o.amount} ${GOODS[o.good].name} · ${o.reward} · noch ${formatGameTime(o.due - w.tick)}`,
    );
  });
  it('Fernauftrag', () => {
    const w = farOrderWorld();
    const o = w.order!;
    expect(
      lines(w).some(
        (l) => l.startsWith('Fernauftrag') && l.includes(`noch ${formatGameTime(o.due - w.tick)}`),
      ),
    ).toBe(true);
  });
  it('Fernangebot', () => {
    const w = localOrderWorld();
    const f = w.farOffer!;
    const l = lines(w).find((x) => x.startsWith('Fernangebot'))!;
    expect(l).toContain(`Frist ${formatGameTime(farOfferDue(w)! - w.tick)}`);
    expect(l).toContain(`${f.amount} ${GOODS[f.good].name}`);
  });
  it('Stammkunde', () => {
    const w = contractWorld();
    const l = lines(w).find((x) => x.startsWith('Stammkunde'))!;
    expect(l).toContain(`nächste Lieferung in ${formatGameTime(nextSettleTick(w) - w.tick)}`);
  });
  it('Auflage', () => {
    const w = createWorld(3);
    w.trial = { active: 'selfSupply', ticks: 100, e0: 0, passed: [] };
    expect(lines(w)).toEqual([
      `Auflage ${TRIALS.selfSupply.name}: noch ${formatGameTime(TRIAL_DURATION_TICKS - 100)}`,
    ]);
  });
});

describe('AK-G13 Reihenfolge', () => {
  const mk = (rest: number, order: number): ResumeLine => ({
    rest,
    order,
    text: `${rest}/${order}`,
  });
  it('nach Restzeit, Gleichstand nach fester Folge', () => {
    const sorted = sortLines([mk(50, 4), mk(10, 3), mk(10, 0), mk(10, 2), mk(10, 1), mk(5, 4)]);
    expect(sorted.map((l) => l.text)).toEqual(['5/4', '10/0', '10/1', '10/2', '10/3', '50/4']);
  });
  it('Karte: Auflage 100 s vor Fernauftrag, wenn kürzer', () => {
    const w = farOrderWorld();
    w.trial = { active: 'selfSupply', ticks: TRIAL_DURATION_TICKS - 1, e0: 0, passed: [] };
    expect(lines(w)[0]).toContain('Auflage');
  });
});

describe('AK-G14 zu spät', () => {
  function late(): World {
    const w = farOrderWorld();
    const o = w.order!;
    w.islands[o.island!]!.stock[o.good] = 0;
    w.ships = [];
    o.due = w.tick + homeTravelTicks(w, o.island!)! - 1;
    return w;
  }
  it('Lager 0: zu spät', () => {
    const l = lines(late()).find((x) => x.startsWith('Fernauftrag'))!;
    expect(l.endsWith(' · zu spät')).toBe(true);
  });
  it('BF5 «zu spät» genau einmal', () => {
    const l = lines(late()).find((x) => x.startsWith('Fernauftrag'))!;
    expect(l.split('zu spät').length - 1).toBe(1);
  });
  it('Lager gefüllt: nicht', () => {
    const w = late();
    w.islands[w.order!.island!]!.stock[w.order!.good] = w.order!.amount;
    expect(lines(w).find((x) => x.startsWith('Fernauftrag'))).not.toContain('zu spät');
  });
});

describe('AK-G15 Stammkunde Lager', () => {
  it('Lager < Menge: Marke; Lager >= Menge: keine', () => {
    const w = contractWorld();
    const c = w.contract!;
    w.islands[c.island]!.stock[c.good] = c.amount - 1;
    expect(lines(w).find((x) => x.startsWith('Stammkunde'))).toContain(' · Lager reicht nicht');
    w.islands[c.island]!.stock[c.good] = c.amount;
    expect(lines(w).find((x) => x.startsWith('Stammkunde'))).not.toContain('Lager reicht nicht');
  });
});

describe('AK-G16 Problemzeile', () => {
  it('0 Probleme: NO_PROBLEM_TEXT (Karte nur mit Frist)', () => {
    const w = createWorld(3);
    w.trial = { active: 'selfSupply', ticks: 0, e0: 0, passed: [] };
    expect(resumeCardView(w)!.problems).toBe(NO_PROBLEM_TEXT);
  });
  it('1 Problem', () => {
    const w = createWorld(3);
    addProblem(w, 800);
    const v = resumeCardView(w)!;
    expect(v.deadlines).toEqual([]);
    expect(v.problems).toBe('1 Problem offen — . springt hin');
  });
  it('2 Probleme', () => {
    const w = createWorld(3);
    addProblem(w, 800);
    addProblem(w, 801);
    expect(resumeCardView(w)!.problems).toBe('2 Probleme offen — . springt hin');
  });
  it('Uhrzeile', () => {
    const w = createWorld(3);
    addProblem(w, 800);
    w.tick = 1234;
    expect(resumeCardView(w)!.clock).toBe(`Spielzeit ${formatClock(1234)} · pausiert`);
  });
});

describe('AK-G17 liest nur', () => {
  it('serialize gleich vor und nach der Ansicht', () => {
    const w = contractWorld();
    addProblem(w, 800);
    const before = serialize(w);
    resumeCardView(w);
    expect(serialize(w)).toBe(before);
  });
  it('problemList genau einmal im Quelltext (ESM-Export nicht spionierbar)', () => {
    const src = readFileSync('src/ui/resumeCard.ts', 'utf8');
    expect(src.match(/problemList\(/g)).toHaveLength(1);
  });
});

class Node extends FakeElement {
  parent: Node | null = null;
  override append(...nodes: FakeElement[]): void {
    for (const n of nodes) (n as Node).parent = this;
    super.append(...nodes);
  }
  override appendChild(n: FakeElement): FakeElement {
    (n as Node).parent = this;
    return super.appendChild(n);
  }
  remove(): void {
    if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
}

describe('openResumeCard (DOM)', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { createElement: (t: string) => new Node(t), activeElement: null });
    vi.stubGlobal('window', { addEventListener: () => {}, removeEventListener: () => {} });
  });
  afterEach(() => {
    closeAllModals();
    vi.unstubAllGlobals();
  });
  const cards = (host: Node): FakeElement[] =>
    host.descendants().filter((n) => n.className.split(' ').includes('card--resume'));

  it('leere Welt: null, kein Modal', () => {
    const host = new Node('div');
    expect(openResumeCard(host as unknown as HTMLElement, createWorld(3))).toBeNull();
    expect(isModalOpen()).toBe(false);
    expect(host.children).toHaveLength(0);
  });
  it('mit Frist: offen, Weiter schliesst, Welt unverändert', () => {
    const host = new Node('div');
    const w = localOrderWorld();
    const before = serialize(w);
    expect(openResumeCard(host as unknown as HTMLElement, w)).not.toBeNull();
    expect(isModalOpen()).toBe(true);
    expect(cards(host)).toHaveLength(1);
    const btn = cards(host)[0]!
      .descendants()
      .find((n) => n.textContent === 'Weiter')!;
    btn.fire('click');
    expect(isModalOpen()).toBe(false);
    expect(serialize(w)).toBe(before);
  });
  it('zweites Öffnen ersetzt die Karte', () => {
    const host = new Node('div');
    const w = localOrderWorld();
    openResumeCard(host as unknown as HTMLElement, w);
    openResumeCard(host as unknown as HTMLElement, w);
    expect(cards(host)).toHaveLength(1);
  });
});
