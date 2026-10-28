import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { createCouncilCard } from '../../src/ui/councilCard';
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

describe('I-112 Rats-Karte: dispose', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { createElement: (t: string) => new Node(t) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('kein decree auf verworfener Welt: dispose entfernt die Karte, «Beschluss fassen» tut nichts mehr', () => {
    const host = new Node('div');
    const onDecree = vi.fn();
    const card = createCouncilCard(host as unknown as HTMLElement, onDecree, () => {});
    const w = createWorld(1);
    w.council[2] = 'open';
    card.update(w);
    card.setOpen(true);
    const root = host.children[0] as Node;
    const options = root.descendants().filter((n) => n.className === 'council-option');
    const go = root.descendants().find((n) => n.className.includes('council-go'))!;
    options[0]!.fire('click');
    card.dispose();
    expect(host.children).toHaveLength(0);
    expect(card.isOpen).toBe(false);
    go.fire('click');
    expect(onDecree).not.toHaveBeenCalled();
    card.setOpen(true);
    card.update(w); // nach dispose wirkungslos
    expect(host.children).toHaveLength(0);
  });

  it('AK-SR-19 Stufe 4: Option C wählen, update ohne Änderung, Beschluss fassen', () => {
    const host = new Node('div');
    const onDecree = vi.fn();
    const card = createCouncilCard(host as unknown as HTMLElement, onDecree, () => {});
    const w = createWorld(1);
    w.council[4] = 'open';
    card.update(w);
    card.setOpen(true);
    const root = host.children[0] as Node;
    const options = root.descendants().filter((n) => n.className === 'council-option');
    expect(options).toHaveLength(3);
    const c = options.find((n) => n.dataset['side'] === 'C')!;
    c.fire('click');
    card.update(w);
    root
      .descendants()
      .find((n) => n.className.includes('council-go'))!
      .fire('click');
    expect(onDecree).toHaveBeenCalledWith(4, 'C');
  });
});

describe('I-138 Rats-Karte: Vorschau', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { createElement: (t: string) => new Node(t) });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('AK-J13: Vorschau steht als eigenes Element direkt nach dem Kartentext', () => {
    const host = new Node('div');
    const card = createCouncilCard(
      host as unknown as HTMLElement,
      () => {},
      () => {},
    );
    const w = createWorld(1);
    w.council[2] = 'open';
    card.update(w);
    card.setOpen(true);
    const root = host.children[0] as Node;
    const option = root.descendants().find((n) => n.className === 'council-option')!;
    const classes = option.children.map((c) => c.className);
    expect(classes).toEqual(['council-name', 'council-text', 'council-preview']);
    expect(option.children[2]!.textContent).toContain('Wirkt noch nicht');
  });
});
