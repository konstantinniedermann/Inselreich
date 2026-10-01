import { describe, expect, it } from 'vitest';
import { creditEntries, renderCredits } from '../../src/ui/credits';

class FakeNode {
  children: FakeNode[] = [];
  attrs: Record<string, string> = {};
  className = '';
  private text = '';
  constructor(readonly tag: string) {}
  set textContent(v: string) {
    this.text = v;
  }
  get textContent(): string {
    return this.text + this.children.map((c) => c.textContent).join('');
  }
  set innerHTML(_v: string) {
    throw new Error('innerHTML verboten');
  }
  appendChild(c: FakeNode): FakeNode {
    this.children.push(c);
    return c;
  }
  setAttribute(k: string, v: string): void {
    this.attrs[k] = v;
  }
}
const fakeDocument = (): Document =>
  ({
    createElement: (t: string) => new FakeNode(t),
    createTextNode: (t: string) => {
      const n = new FakeNode('#text');
      n.textContent = t;
      return n;
    },
  }) as unknown as Document;
const all = (n: FakeNode): FakeNode[] => [n, ...n.children.flatMap(all)];
const asNode = (e: HTMLElement) => e as unknown as FakeNode;

describe('Credits', () => {
  it('AK-U1-04 ohne innerHTML; ein Titel mit <b> erscheint als Text', () => {
    const el = renderCredits(fakeDocument(), [
      { title: '<b>X</b>', author: 'A', license: 'CC0-1.0', link: 'https://x' },
    ]);
    expect(asNode(el).textContent).toContain('<b>X</b>');
    const links = all(asNode(el)).filter((n) => n.tag === 'a');
    expect(links.length).toBe(2);
    expect(links.every((a) => a.attrs.target === '_blank' && a.attrs.rel === 'noopener')).toBe(
      true,
    );
  });

  it('javascript:-Links werden nicht verlinkt', () => {
    const el = renderCredits(fakeDocument(), [
      { title: 'T', author: 'A', license: 'Unbekannt', link: 'javascript:alert(1)' },
    ]);
    expect(all(asNode(el)).filter((n) => n.tag === 'a')).toHaveLength(0);
  });

  it('CC BY nennt die Änderungen; leere Liste nennt keine fremden Assets', () => {
    const el = renderCredits(fakeDocument(), [
      { title: 'T', author: 'A', license: 'CC-BY-4.0', link: 'https://x', changes: 'gekürzt' },
    ]);
    expect(asNode(el).textContent).toContain('gekürzt');
    expect(asNode(renderCredits(fakeDocument(), [])).textContent).toContain('nicht eingebunden');
  });

  it('creditEntries führt Manifest und Schriften zusammen, nach Titel sortiert', () => {
    const e = (title: string) => ({ title, author: '', license: '', link: '' });
    expect(creditEntries([e('B')], [e('A')]).map((x) => x.title)).toEqual(['A', 'B']);
  });
});
