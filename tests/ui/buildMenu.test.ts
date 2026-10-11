import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { lockedToolText } from '../../src/ui/goal';
import { TOOL_HOTKEYS } from '../../src/ui/hotkeys';
import { tierPreviewLine, tooltipLines } from '../../src/ui/buildMenu';

const MONUMENT_TOOL = { kind: 'build', defId: 'monument' } as const;

describe('AK-M13E2-35 Bauleisten-Eintrag Denkmal', () => {
  it('tierPreviewLine liefert für das Denkmal null', () => {
    expect(tierPreviewLine('monument')).toBeNull();
  });

  it('Tooltip enthält die Zeile U-6 wörtlich', () => {
    expect(tooltipLines(MONUMENT_TOOL)).toContain(
      'Wahlziel in drei Abschnitten: Stein, Werkzeug, Glas, Gewürz',
    );
  });

  it('lockedToolText: vor Ziel 2 gesperrt, danach frei', () => {
    const w = createWorld(3, { unlockAll: true });
    w.wonMerchants = false;
    expect(lockedToolText(w, MONUMENT_TOOL)).toBe('Denkmal: Erst nach dem Kaufleute-Ziel');
    w.wonMerchants = true;
    expect(lockedToolText(w, MONUMENT_TOOL)).toBeNull();
  });

  it('kein Hotkey für das Denkmal', () => {
    const tools = Object.values(TOOL_HOTKEYS);
    expect(tools.some((t) => t?.kind === 'build' && t.defId === 'monument')).toBe(false);
  });
});
