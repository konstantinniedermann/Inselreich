// I-114 T02 (AK-10): zwei Fernkarten zur Wahl.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { farAlternative } from '../../src/sim/orders';
import type { World } from '../../src/sim/types';
import { HOME } from '../../src/sim/world';
import { farAcceptTooltip, farOfferText } from '../../src/ui/farOrder';
import { renderNoticeStack, updateNoticeStack } from '../../src/ui/hud';
import { islandName } from '../../src/sim/islands';
import { FakeElement, fakeDocument } from './fakeDom';
import { farWorld, periodStart, stepAt } from '../sim/farHelpers';

const P = periodStart(1);

function offerWorld(kinds: Parameters<typeof farWorld>[1]): World {
  const w = farWorld(4, kinds);
  stepAt(w, P);
  return w;
}

describe('AK-10 Texte', () => {
  it('zwei Kontore: beide Texte im Format von farOfferText, Tooltip nennt die Insel', () => {
    const w = offerWorld(['A', 'B']);
    const alt = farAlternative(w)!;
    const t0 = farOfferText(w, 0)!;
    const t1 = farOfferText(w, 1)!;
    expect(t0).toBe(farOfferText(w));
    expect(t0).toContain(`Fernangebot ${islandName(w, w.farOffer!.island)}:`);
    expect(t1).toContain(`Fernangebot ${islandName(w, alt.island)}:`);
    expect(t1).toContain(`${alt.amount} `);
    expect(farAcceptTooltip(w, 0)).toContain(`Kontor ${islandName(w, w.farOffer!.island)}.`);
    expect(farAcceptTooltip(w, 1)).toContain(`Kontor ${islandName(w, alt.island)}.`);
    expect(farAcceptTooltip(w)).toBe(farAcceptTooltip(w, 0));
  });
  it('ein Kontor: keine Zweitkarte', () => {
    const w = offerWorld(['B']);
    expect(farOfferText(w, 1)).toBeNull();
    expect(farAcceptTooltip(w, 1)).toBe('');
  });
});

describe('AK-10 Kartenstapel', () => {
  afterEach(() => vi.unstubAllGlobals());
  const build = (w: World) => {
    vi.stubGlobal('document', fakeDocument);
    const picks: Array<number | undefined> = [];
    const actions = {
      deliver: () => {},
      accept: () => {},
      decline: () => {},
      toProducer: () => {},
      cancel: () => {},
      acceptFar: (pick?: 0 | 1) => {
        picks.push(pick);
      },
    };
    const game = new FakeElement('div');
    const stack = renderNoticeStack(
      game as unknown as HTMLElement,
      w,
      actions,
    ) as unknown as FakeElement;
    return { stack, picks };
  };

  it('zwei Kontore: Karte 2 sichtbar mit Text und Tooltip', () => {
    const w = offerWorld(['A', 'B']);
    const { stack } = build(w);
    expect(stack.querySelector('[data-field="far-card-2"]')!.hidden).toBe(false);
    expect(stack.querySelector('[data-field="far-text-2"]')!.textContent).toBe(farOfferText(w, 1));
    expect(stack.querySelector('[data-field="far-accept-2"]')!.title).toBe(farAcceptTooltip(w, 1));
    expect(stack.querySelector('[data-field="far-text"]')!.textContent).toBe(farOfferText(w, 0));
  });

  it('ein Kontor: Karte 2 verborgen', () => {
    const { stack } = build(offerWorld(['B']));
    expect(stack.querySelector('[data-field="far-card"]')!.hidden).toBe(false);
    expect(stack.querySelector('[data-field="far-card-2"]')!.hidden).toBe(true);
  });

  it('Klicks wählen die Karte', () => {
    const { stack, picks } = build(offerWorld(['A', 'B']));
    stack.querySelector('[data-field="far-accept"]')!.fire('click');
    stack.querySelector('[data-field="far-accept-2"]')!.fire('click');
    expect(picks).toEqual([0, 1]);
  });

  it('nach Annahme (kein Angebot mehr) sind beide verborgen', () => {
    const w = offerWorld(['A', 'B']);
    const { stack } = build(w);
    w.farOffer = null;
    updateNoticeStack(stack as unknown as HTMLElement, w, HOME);
    expect(stack.querySelector('[data-field="far-card"]')!.hidden).toBe(true);
    expect(stack.querySelector('[data-field="far-card-2"]')!.hidden).toBe(true);
  });
});
