import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeElement } from './fakeDom';
import { unreadLabel } from '../../src/ui/crisisLog';
import { renderEventLog, updateEventLog } from '../../src/ui/eventLogView';

/** FakeElement kennt `removeAttribute` und `classList.add` nicht; hier nachgerüstet (Attribute werden auf '' gesetzt = entfernt). */
class El extends FakeElement {
  constructor(tag: string) {
    super(tag);
    const base = this.classList;
    this.classList = {
      ...base,
      add: (name: string): void => void base.toggle(name, true),
    } as typeof base;
  }
  removeAttribute(name: string): void {
    this.setAttribute(name, '');
  }
  override getAttribute(name: string): string | null {
    return super.getAttribute(name) || null;
  }
}

describe('UI-AUFRAEUM-4 AK-6 Ereignis-Knopf: aria-label behält den Namen', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('mit ungelesenen: «Ereignisse» + unreadLabel; ohne: kein Attribut', () => {
    vi.stubGlobal('document', { createElement: (t: string) => new El(t) });
    const box = new El('div');
    renderEventLog(box as unknown as HTMLElement);
    const toggle = box.querySelector('[data-field="log-toggle"]')!;
    updateEventLog(box as unknown as HTMLElement, [], true, undefined, 3);
    expect(toggle.getAttribute('aria-label')).toBe(`Ereignisse${unreadLabel(3)}`);
    updateEventLog(box as unknown as HTMLElement, [], true, undefined, 12);
    expect(toggle.getAttribute('aria-label')).toBe(`Ereignisse${unreadLabel(12)}`);
    updateEventLog(box as unknown as HTMLElement, [], true, undefined, 0);
    expect(toggle.getAttribute('aria-label')).toBeNull();
  });
});
