// I-132 T04: Auflagen-Karte (AK-18, AK-20, Review Focus 4, P-5).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { createTrialCard } from '../../src/ui/trialCard';
import { putBuilding } from '../sim/helpers';
import { FakeElement } from './fakeDom';

class Node extends FakeElement {
  parent: Node | null = null;
  override append(...nodes: FakeElement[]): void {
    for (const n of nodes) (n as Node).parent = this;
    super.append(...nodes);
  }
  remove(): void {
    if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
}

function merchantWorld(n: number): World {
  const w = createWorld(3);
  w.monumentDone = true;
  const k = w.buildings[w.islands[0]!.kontorId ?? -1]!;
  let left = n;
  for (let i = 0; left > 0; i++) {
    const h = putBuilding(w, 0, 'house', k.x + 3 + (i % 10) * 2, k.y + Math.floor(i / 10) * 2);
    h.house!.tier = 4;
    h.house!.inhabitants = Math.min(20, left);
    left -= h.house!.inhabitants;
  }
  return w;
}

const textOf = (n: FakeElement): string =>
  [n.textContent, ...n.children.map(textOf)].filter((t) => t !== '').join(' ');

function setup(preview?: (w: World) => never[]) {
  const host = new Node('div');
  const onStart = vi.fn();
  const onAbort = vi.fn();
  const onClose = vi.fn();
  const card = createTrialCard(
    host as unknown as HTMLElement,
    onStart,
    onAbort,
    onClose,
    preview as never,
  );
  const root = host.children[0] as Node;
  const action = (): FakeElement | undefined =>
    root.descendants().find((n) => n.className.split(' ').includes('trial-action'));
  return { host, root, card, onStart, onAbort, onClose, action };
}

describe('I-132 Auflagen-Karte', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { createElement: (t: string) => new Node(t) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('AK-18 Aufbau', () => {
    const { root, card, action } = setup();
    const w = merchantWorld(60);
    card.setOpen(true);
    card.update(w);
    const t = textOf(root);
    expect(t).toContain('Eigenversorgung');
    expect(t).toContain('15 Minuten, Einwohner nicht unter 70 % des Starts');
    expect(t).toContain('Ohne Zukauf fehlen');
    expect(t).toContain('Gewürz');
    expect(t).toContain('Feuerwachen schützen Kapelle, Schule und Bad');
    expect(action()!.textContent).toBe('Auflage beginnen');
    expect(root.hidden).toBe(false);
    card.setOpen(false);
    expect(root.hidden).toBe(true);
  });

  it('AK-18 blass', () => {
    const { card, action, onStart } = setup();
    card.setOpen(true);
    card.update(merchantWorld(59));
    const b = action()!;
    expect(b.classList.contains('unaffordable')).toBe(true);
    expect(b.title).toBe('Erst ab 60 Kaufleuten (jetzt 59)');
    b.fire('click');
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('AK-20 Abbruch zweiter Klick', () => {
    const { card, action, onAbort } = setup();
    const w = merchantWorld(60);
    w.trial = { active: 'selfSupply', ticks: 10, e0: 60, passed: [] };
    card.setOpen(true);
    card.update(w);
    action()!.fire('click');
    expect(onAbort).not.toHaveBeenCalled();
    expect(action()!.textContent).toBe('Wirklich abbrechen?');
    action()!.fire('click');
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  it('Review Focus 4: bewaffnet fällt beim Wechsel der Aktion zurück', () => {
    const { card, action, onAbort } = setup();
    const w = merchantWorld(60);
    w.trial = { active: 'selfSupply', ticks: 10, e0: 60, passed: [] };
    card.setOpen(true);
    card.update(w);
    action()!.fire('click'); // bewaffnet
    w.trial = { active: null, ticks: 0, e0: 0, passed: [] };
    card.update(w);
    w.trial = { active: 'selfSupply', ticks: 1, e0: 60, passed: [] };
    card.update(w);
    action()!.fire('click');
    expect(onAbort).not.toHaveBeenCalled();
  });

  it('Schliessen setzt bewaffnet zurück', () => {
    const { card, action, onAbort } = setup();
    const w = merchantWorld(60);
    w.trial = { active: 'selfSupply', ticks: 10, e0: 60, passed: [] };
    card.setOpen(true);
    card.update(w);
    action()!.fire('click');
    card.setOpen(false);
    card.setOpen(true);
    action()!.fire('click');
    expect(onAbort).not.toHaveBeenCalled();
  });

  it('Vorschau gedrosselt', () => {
    const preview = vi.fn(() => []);
    const { card } = setup(preview);
    const w = merchantWorld(60);
    w.tick = 1000;
    card.update(w);
    expect(preview).toHaveBeenCalledTimes(0);
    card.setOpen(true);
    card.update(w);
    expect(preview).toHaveBeenCalledTimes(1);
    w.tick = 1050;
    card.update(w);
    expect(preview).toHaveBeenCalledTimes(1);
    w.tick = 1100;
    card.update(w);
    expect(preview).toHaveBeenCalledTimes(2);
  });

  it('dispose: wirkungslos, Karte entfernt', () => {
    const { host, card, action, onStart, onAbort } = setup();
    const w = merchantWorld(60);
    card.setOpen(true);
    card.update(w);
    const b = action()!;
    card.dispose();
    b.fire('click');
    expect(onStart).not.toHaveBeenCalled();
    expect(onAbort).not.toHaveBeenCalled();
    expect(host.children).toHaveLength(0);
    card.setOpen(true);
    card.update(w);
    expect(host.children).toHaveLength(0);
  });
});
