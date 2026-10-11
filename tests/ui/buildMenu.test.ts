import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { lockedToolText } from '../../src/ui/goal';
import { TOOL_HOTKEYS } from '../../src/ui/hotkeys';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { tierPreviewLine, tooltipLines } from '../../src/ui/buildMenu';

const MONUMENT_TOOL = { kind: 'build', defId: 'monument' } as const;

describe('AK-UT-05 Höchstzahl-Zeile', () => {
  it('maxCount 1: «Nur einmal je Insel», sonst keine «Nur einmal»-Zeile, nie «Höchstens»', () => {
    for (const def of Object.values(BUILDING_DEFS)) {
      const lines = tooltipLines({ kind: 'build', defId: def.id });
      expect(
        lines.some((l) => l.includes('Höchstens')),
        def.id,
      ).toBe(false);
      if (def.maxCount?.n === 1) expect(lines).toContain('Nur einmal je Insel');
      else
        expect(
          lines.some((l) => l.startsWith('Nur einmal')),
          def.id,
        ).toBe(false);
    }
  });
});

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
