/**
 * Fake-DOM für UI-Tests (kein jsdom/happy-dom, ADR-001): bildet nur die Felder nach, die
 * `monumentSection.ts` und `setField` nutzen. `querySelector` versteht `[data-attr="wert"]`.
 */
export class FakeElement {
  tagName: string;
  className = '';
  textContent = '';
  hidden = false;
  checked = false;
  disabled = false;
  title = '';
  type = '';
  dataset: Record<string, string> = {};
  style: Record<string, string> = {};
  children: FakeElement[] = [];
  private classes = new Set<string>();
  private listeners: Record<string, Array<(ev: unknown) => void>> = {};
  private attrs: Record<string, string> = {};

  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }

  classList = {
    toggle: (name: string, force?: boolean): boolean => {
      const on = force ?? !this.classes.has(name);
      if (on) this.classes.add(name);
      else this.classes.delete(name);
      return on;
    },
    contains: (name: string): boolean => this.classes.has(name),
  };

  append(...nodes: FakeElement[]): void {
    this.children.push(...nodes);
  }
  appendChild(node: FakeElement): FakeElement {
    this.children.push(node);
    return node;
  }
  addEventListener(type: string, fn: (ev: unknown) => void): void {
    (this.listeners[type] ??= []).push(fn);
  }
  /** Löst die registrierten Listener aus (Klick, Änderung); `ev` ist das Ereignis-Fake. */
  fire(type: string, ev: unknown = { detail: 0 }): void {
    for (const fn of this.listeners[type] ?? []) fn(ev);
  }
  blur(): void {}
  focus(): void {}
  setAttribute(name: string, value: string): void {
    this.attrs[name] = value;
  }
  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }
  replaceChildren(...nodes: FakeElement[]): void {
    this.children = [...nodes];
  }
  /** Alle Nachkommen (Tiefensuche) für Testabfragen. */
  descendants(): FakeElement[] {
    return this.children.flatMap((c) => [c, ...c.descendants()]);
  }

  querySelector<T = FakeElement>(selector: string): T | null {
    const m = /^\[data-([a-z-]+)="([^"]*)"\]$/.exec(selector);
    if (!m) throw new Error(`FakeDom: Selektor nicht unterstützt: ${selector}`);
    const key = m[1]!.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const walk = (n: FakeElement): FakeElement | null => {
      for (const c of n.children) {
        if (c.dataset[key] === m[2]) return c;
        const r = walk(c);
        if (r) return r;
      }
      return null;
    };
    return walk(this) as T | null;
  }
}

export const fakeDocument = {
  createElement: (tag: string): FakeElement => new FakeElement(tag),
};

/** Ein Element mit `data-field`, wie `addLine(panel, '', feld)` es baut. */
export function fieldEl(field: string): FakeElement {
  const e = new FakeElement('p');
  e.dataset.field = field;
  return e;
}
