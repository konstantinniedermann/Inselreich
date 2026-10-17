// I-136 AK-F2: Der Frame-Pfad (renderNoticeStack, updateNoticeStack) rechnet seaLanes je Welt genau einmal.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { seaLanes } from '../../src/sim/islands';
import { HOME } from '../../src/sim/world';
import { renderNoticeStack, updateNoticeStack } from '../../src/ui/hud';
import { FakeElement, fakeDocument } from './fakeDom';
import { farWorld, periodStart, stepAt } from '../sim/farHelpers';

vi.mock('../../src/sim/islands', async (orig) => {
  const real = await orig<typeof import('../../src/sim/islands')>();
  return { ...real, seaLanes: vi.fn(real.seaLanes) };
});

const actions = {
  deliver: () => {},
  accept: () => {},
  acceptFar: () => {},
  decline: () => {},
  toProducer: () => {},
  pick: () => {},
};

describe('I-136 AK-F2 Frame-Pfad', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('seaLanes läuft je Welt einmal, eine neue Welt rechnet neu', () => {
    vi.stubGlobal('document', fakeDocument);
    const w = farWorld(4, ['A', 'B']);
    stepAt(w, periodStart(1));
    vi.mocked(seaLanes).mockClear();
    const game = new FakeElement('div');
    const stack = renderNoticeStack(
      game as unknown as HTMLElement,
      w,
      actions as never,
    ) as unknown as HTMLElement;
    for (let i = 0; i < 5; i++) updateNoticeStack(stack, w, HOME);
    expect(seaLanes).toHaveBeenCalledTimes(1);
    const w2 = farWorld(4, ['A', 'B'], 4);
    stepAt(w2, periodStart(1));
    for (let i = 0; i < 5; i++) updateNoticeStack(stack, w2, HOME);
    expect(seaLanes).toHaveBeenCalledTimes(2);
  });
});
