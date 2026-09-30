import { describe, expect, it } from 'vitest';
import {
  TOOL_HOTKEYS,
  afterPause,
  hotkeyAction,
  hotkeyLabel,
  withSpeed,
} from '../../src/ui/hotkeys';

const NONE = { ctrl: false, meta: false, alt: false };

describe('hotkeyAction (AK-U2-02)', () => {
  const tools: Record<string, unknown> = {
    r: { kind: 'road' },
    x: { kind: 'demolish' },
    h: { kind: 'build', defId: 'house' },
    k: { kind: 'build', defId: 'chapel' },
    u: { kind: 'build', defId: 'school' },
    m: { kind: 'build', defId: 'market' },
    f: { kind: 'build', defId: 'fisher' },
    l: { kind: 'build', defId: 'lumberjack' },
    b: { kind: 'build', defId: 'quarry' },
    g: { kind: 'build', defId: 'sheepfarm' },
    v: { kind: 'build', defId: 'weaver' },
    z: { kind: 'build', defId: 'canefarm' },
    n: { kind: 'build', defId: 'distillery' },
  };

  it('AK-U2-02: jede Werkzeugtaste aus 10.6 wählt ihr Werkzeug', () => {
    for (const [key, tool] of Object.entries(tools)) {
      expect(hotkeyAction(key, NONE, false)).toEqual({ kind: 'tool', tool });
    }
  });

  it('AK-U2-02: Gross- und Kleinschreibung ist egal', () => {
    expect(hotkeyAction('L', NONE, false)).toEqual(hotkeyAction('l', NONE, false));
    expect(hotkeyAction('L', NONE, false)).not.toBeNull();
    expect(hotkeyAction('P', NONE, false)).toEqual({ kind: 'pause' });
  });

  it('AK-U2-02: 1 / 2 / 3 ergeben Tempo 1, 2, 4; P pausiert', () => {
    expect(hotkeyAction('1', NONE, false)).toEqual({ kind: 'speed', speed: 1 });
    expect(hotkeyAction('2', NONE, false)).toEqual({ kind: 'speed', speed: 2 });
    expect(hotkeyAction('3', NONE, false)).toEqual({ kind: 'speed', speed: 4 });
    expect(hotkeyAction('p', NONE, false)).toEqual({ kind: 'pause' });
  });

  it('AK-U2-02: Strg, Cmd oder Alt lösen nichts aus', () => {
    for (const key of ['l', 'p', '1', 'r']) {
      expect(hotkeyAction(key, { ...NONE, ctrl: true }, false)).toBeNull();
      expect(hotkeyAction(key, { ...NONE, meta: true }, false)).toBeNull();
      expect(hotkeyAction(key, { ...NONE, alt: true }, false)).toBeNull();
    }
  });

  it('AK-U2-02: in einem Formularfeld lösen die Tasten nichts aus', () => {
    for (const key of ['l', 'p', '1', 'r']) {
      expect(hotkeyAction(key, NONE, true)).toBeNull();
    }
  });

  it('AK-U2-02: W/A/S/D, Pfeile, Leertaste, Esc und unbekannte Tasten ergeben null (Pan bleibt)', () => {
    for (const key of ['w', 'a', 's', 'd', 'W', 'ArrowUp', ' ', 'Escape', 'q', '4', 't', 'Enter']) {
      expect(hotkeyAction(key, NONE, false)).toBeNull();
    }
  });

  it('AK-U2-02: Tabelle enthält weder Pan-Tasten noch T (nur mit S4)', () => {
    for (const key of ['w', 'a', 's', 'd', 't', ' ']) expect(TOOL_HOTKEYS[key]).toBeUndefined();
    expect(Object.keys(TOOL_HOTKEYS)).toHaveLength(13);
  });

  it('AK-U2-01: hotkeyLabel liefert die Taste grossgeschrieben für den Tooltip', () => {
    expect(hotkeyLabel({ kind: 'build', defId: 'lumberjack' })).toBe('L');
    expect(hotkeyLabel({ kind: 'road' })).toBe('R');
    expect(hotkeyLabel({ kind: 'select' })).toBe('Esc');
    expect(hotkeyLabel({ kind: 'build', defId: 'kontor' })).toBeNull();
  });
});

describe('Tempo merken (AK-U2-02)', () => {
  it('AK-U2-02: HUD 4x, Pause, P setzt 4x fort', () => {
    let r = withSpeed(4, 1);
    r = withSpeed(0, r.last);
    expect(r).toEqual({ speed: 0, last: 4 });
    expect(afterPause(r.speed, r.last).speed).toBe(4);
  });

  it('AK-U2-02: P bei laufendem Spiel pausiert und merkt das Tempo', () => {
    expect(afterPause(2, 1)).toEqual({ speed: 0, last: 2 });
  });
});
