import { describe, expect, it } from 'vitest';
import { afterPause, withSpeed } from '../../src/ui/hotkeys';
import {
  PAUSE_HINT,
  PAUSE_LABEL,
  applyPauseOverlay,
  pauseOverlayView,
} from '../../src/ui/pauseOverlay';
import { FakeElement } from './fakeDom';

type Speed = 0 | 1 | 2 | 4;

/** Overlay-Fake mit Label/Hint-Kindern und Schreibzähler auf hidden und Texten. */
function makeOverlay() {
  const el = new FakeElement('div');
  const label = new FakeElement('span');
  label.className = 'pause-overlay__label';
  label.dataset.field = 'pause-label';
  const hint = new FakeElement('span');
  hint.className = 'pause-overlay__hint';
  hint.dataset.field = 'pause-hint';
  el.append(label, hint);
  const writes = { n: 0 };
  let hidden = true;
  Object.defineProperty(el, 'hidden', {
    get: () => hidden,
    set: (v: boolean) => {
      writes.n++;
      hidden = v;
    },
  });
  for (const c of [label, hint]) {
    let text = '';
    Object.defineProperty(c, 'textContent', {
      get: () => text,
      set: (v: string) => {
        writes.n++;
        text = v;
      },
    });
  }
  return { el, label, hint, writes };
}
const apply = (el: FakeElement, s: Speed, m: boolean) =>
  applyPauseOverlay(el as unknown as HTMLElement, s, m);

describe('pauseOverlay (I-097)', () => {
  it('AK-1 sichtbar nur bei Tempo 0', () => {
    expect(pauseOverlayView(0, false).visible).toBe(true);
    for (const s of [1, 2, 4] as const) expect(pauseOverlayView(s, false).visible).toBe(false);
  });

  it('AK-2 offenes Modal verbirgt, danach wieder sichtbar', () => {
    expect(pauseOverlayView(0, true).visible).toBe(false);
    expect(pauseOverlayView(0, false).visible).toBe(true);
  });

  it('AK-3 P-Weg und Knopf-Weg teilen die Sichtbarkeit', () => {
    const p = afterPause(1, 1);
    expect(p.speed).toBe(0);
    expect(pauseOverlayView(p.speed, false).visible).toBe(true);
    const r = afterPause(0, 2);
    expect(r.speed).toBe(2);
    expect(pauseOverlayView(r.speed, false).visible).toBe(false);
  });

  it('AK-4 Tempo-Folge 0,1,2,4,0 sichtbar nur bei 0; 4,0,P ergibt 4', () => {
    let st: { speed: Speed; last: 1 | 2 | 4 } = { speed: 1, last: 1 };
    const seen: boolean[] = [];
    for (const s of [0, 1, 2, 4, 0] as const) {
      st = withSpeed(s, st.last);
      seen.push(pauseOverlayView(st.speed, false).visible);
    }
    expect(seen).toEqual([true, false, false, false, true]);
    expect(afterPause(st.speed, st.last).speed).toBe(4);
  });

  it('AK-5a hidden und Text korrekt, ohne Doppelschreiben', () => {
    const { el, label, hint, writes } = makeOverlay();
    apply(el, 0, false);
    expect(el.hidden).toBe(false);
    expect(label.textContent).toBe(PAUSE_LABEL);
    expect(label.textContent).toContain('Pause');
    expect(hint.textContent).toBe(PAUSE_HINT);
    const n = writes.n;
    apply(el, 0, false);
    expect(writes.n).toBe(n);
  });

  it('AK-5a Wechsel 0 -> 1 -> 0 schreibt nur hidden', () => {
    const { el, writes } = makeOverlay();
    apply(el, 0, false);
    const n = writes.n;
    apply(el, 1, false);
    expect(el.hidden).toBe(true);
    expect(writes.n).toBe(n + 1);
    apply(el, 1, false);
    expect(writes.n).toBe(n + 1);
    apply(el, 0, false);
    expect(el.hidden).toBe(false);
    expect(writes.n).toBe(n + 2);
  });
});
