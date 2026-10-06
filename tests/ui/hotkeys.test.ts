import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { createWorld } from '../../src/sim/world';
import { tooltipLines } from '../../src/ui/buildMenu';
import { lockedToolText } from '../../src/ui/goal';
import {
  NAV_KEYS,
  TOOL_HOTKEYS,
  afterPause,
  categoryOf,
  hotkeyAction,
  hotkeyLabel,
  hotkeyList,
  nextOpenCategory,
  toolName,
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
    t: { kind: 'build', defId: 'toolmaker' },
    e: { kind: 'build', defId: 'firestation' },
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

  it('AK-U2-02: W/A/S/D, Pfeile, Leertaste, Esc und unbekannte Tasten ergeben null (Pan bleibt) (M11 Y)', () => {
    for (const key of ['w', 'a', 's', 'd', 'W', 'ArrowUp', ' ', 'Escape', '4', 'Enter']) {
      expect(hotkeyAction(key, NONE, false)).toBeNull();
    }
  });

  it('AK-U2-02: Tabelle enthält keine Pan-Tasten, T gehört dem Werkzeugmacher (S4) (M11 Y)', () => {
    for (const key of ['w', 'a', 's', 'd', ' ']) expect(TOOL_HOTKEYS[key]).toBeUndefined();
    expect(Object.keys(TOOL_HOTKEYS)).toHaveLength(21);
  });

  it('AK-U2-02: T und Shift+T wählen den Werkzeugmacher; Modifier und Formularfeld ergeben null', () => {
    const tool = { kind: 'tool', tool: { kind: 'build', defId: 'toolmaker' } };
    expect(hotkeyAction('t', NONE, false)).toEqual(tool);
    expect(hotkeyAction('T', NONE, false)).toEqual(tool);
    expect(hotkeyAction('t', { ...NONE, ctrl: true }, false)).toBeNull();
    expect(hotkeyAction('t', { ...NONE, meta: true }, false)).toBeNull();
    expect(hotkeyAction('t', { ...NONE, alt: true }, false)).toBeNull();
    expect(hotkeyAction('t', NONE, true)).toBeNull();
    expect(hotkeyLabel({ kind: 'build', defId: 'toolmaker' })).toBe('T');
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

describe('Feuerwache-Hotkey (M6-AK-U1-04)', () => {
  it('M6-AK-U1-04: E wählt die Feuerwache, Label "E"', () => {
    expect(hotkeyAction('e', NONE, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'build', defId: 'firestation' },
    });
    expect(hotkeyAction('E', NONE, false)).not.toBeNull();
    expect(hotkeyLabel({ kind: 'build', defId: 'firestation' })).toBe('E');
  });
});

it('AK-UX-06 hotkeyList nennt jede Taste genau einmal, Werkzeuge mit Namen', () => {
  const list = hotkeyList(createWorld(3, { crisisLevel: 'normal', unlockAll: true }));
  const keys = list.map((e) => e.key);
  for (const [k, tool] of Object.entries(TOOL_HOTKEYS)) {
    expect(keys.filter((x) => x === k.toUpperCase())).toHaveLength(1);
    expect(list.find((e) => e.key === k.toUpperCase())!.label).toBe(toolName(tool!));
  }
  for (const k of ['1', '2', '3', 'P']) expect(keys.filter((x) => x === k)).toHaveLength(1);
  for (const n of NAV_KEYS) expect(keys.filter((x) => x === n.key)).toHaveLength(1);
  expect(list).toContainEqual({ key: 'E', label: BUILDING_DEFS.firestation.name });
});
it('AK-UX-06 categoryOf: Gebäude → Kategorie, sonst null', () => {
  expect(categoryOf({ kind: 'build', defId: 'fisher' })).toBe('production');
  expect(categoryOf({ kind: 'road' })).toBeNull();
  expect(categoryOf({ kind: 'demolish' })).toBeNull();
  expect(categoryOf({ kind: 'select' })).toBeNull();
});
it('Untermenü: Klick schaltet um, Bau-Werkzeug öffnet seine Kategorie, andere Werkzeuge schliessen', () => {
  expect(nextOpenCategory(null, { kind: 'toggle', category: 'production' })).toBe('production');
  expect(nextOpenCategory('production', { kind: 'toggle', category: 'production' })).toBeNull();
  expect(nextOpenCategory('public', { kind: 'toggle', category: 'production' })).toBe('production');
  expect(nextOpenCategory(null, { kind: 'tool', tool: { kind: 'build', defId: 'fisher' } })).toBe(
    'production',
  );
  expect(nextOpenCategory('production', { kind: 'tool', tool: { kind: 'select' } })).toBeNull();
  expect(nextOpenCategory('production', { kind: 'tool', tool: { kind: 'road' } })).toBeNull();
});

describe('M8 Taste J (AK-S1-20)', () => {
  it('AK-S1-20 J wählt das Badehaus, Label „J“, J als 16. Taste, bisherige unverändert, „Badehaus (J)“', () => {
    expect(hotkeyAction('j', NONE, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'build', defId: 'bathhouse' },
    });
    expect(hotkeyAction('J', NONE, false)).not.toBeNull();
    expect(hotkeyLabel({ kind: 'build', defId: 'bathhouse' })).toBe('J');
    const keys = Object.keys(TOOL_HOTKEYS);
    expect(keys.slice(0, 15).join('')).toBe('rxhkumflbgvznte');
    expect(keys[15]).toBe('j');
    expect(hotkeyList(createWorld(3, { crisisLevel: 'normal', unlockAll: true }))).toContainEqual({
      key: 'J',
      label: 'Badehaus',
    });
    expect(tooltipLines({ kind: 'build', defId: 'bathhouse' })[0]).toBe('Badehaus (J)');
  });
});

describe('M8 Taste O (AK-S2-18)', () => {
  it('AK-S2-18 O wählt die Glashütte, Label „O“, 17 Tasten, bisherige unverändert, Tooltip „Glashütte (O)“ (M11 Y)', () => {
    expect(hotkeyAction('o', NONE, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'build', defId: 'glassworks' },
    });
    expect(hotkeyLabel({ kind: 'build', defId: 'glassworks' })).toBe('O');
    const keys = Object.keys(TOOL_HOTKEYS);
    expect(keys).toHaveLength(21);
    expect(keys.join('')).toBe('rxhkumflbgvzntejoicqy');
    expect(
      hotkeyList(createWorld(3, { crisisLevel: 'normal', unlockAll: true })).filter(
        (e) => e.key === 'O',
      ),
    ).toEqual([{ key: 'O', label: 'Glashütte' }]);
    expect(
      hotkeyList(createWorld(3, { crisisLevel: 'normal', unlockAll: true })).filter(
        (e) => e.key === 'J',
      ),
    ).toEqual([{ key: 'J', label: 'Badehaus' }]);
    expect(tooltipLines({ kind: 'build', defId: 'glassworks' })[0]).toBe('Glashütte (O)');
  });
});

describe('M8 U1 Tasten (Bestand nach S2)', () => {
  it('AK-U1-02 17 Werkzeugtasten; J und O je genau einmal mit Namen (M11 Y)', () => {
    expect(Object.keys(TOOL_HOTKEYS)).toHaveLength(21);
    const list = hotkeyList(createWorld(3, { crisisLevel: 'normal', unlockAll: true }));
    expect(list.filter((e) => e.key === 'J')).toEqual([
      { key: 'J', label: BUILDING_DEFS.bathhouse.name },
    ]);
    expect(list.filter((e) => e.key === 'O')).toEqual([
      { key: 'O', label: BUILDING_DEFS.glassworks.name },
    ]);
  });
});

describe('M10 Taste I', () => {
  it('AK-S2-16 I wählt die Amtsstube, Label „I“, 18 Tasten, bisherige 17 unverändert, Tooltip „Amtsstube (I)“ (M11 Y)', () => {
    expect(hotkeyAction('i', NONE, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'build', defId: 'townhall' },
    });
    expect(hotkeyLabel({ kind: 'build', defId: 'townhall' })).toBe('I');
    const keys = Object.keys(TOOL_HOTKEYS);
    expect(keys).toHaveLength(21);
    expect(keys.slice(0, 17).join('')).toBe('rxhkumflbgvzntejo');
    expect(tooltipLines({ kind: 'build', defId: 'townhall' })[0]).toBe('Amtsstube (I)');
  });
});

describe('M10 Tastenliste nach Freischaltung', () => {
  it('AK-U1-03 hotkeyList(world): neue Welt R, X, H, F, L, dann 1, 2, 3, P, NAV_KEYS; unlockAll normal: 18 Werkzeugtasten (M11 Y)', () => {
    const keys = hotkeyList(createWorld(3, { crisisLevel: 'normal' })).map((e) => e.key);
    expect(keys).toEqual([
      'R',
      'X',
      'H',
      'F',
      'L',
      '1',
      '2',
      '3',
      'P',
      '?',
      ...NAV_KEYS.map((n) => n.key),
    ]);
    const all = hotkeyList(createWorld(3, { crisisLevel: 'normal', unlockAll: true })).map(
      (e) => e.key,
    );
    expect(all.slice(0, 21)).toEqual(Object.keys(TOOL_HOTKEYS).map((k) => k.toUpperCase()));
    expect(all[21]).toBe('1');
  });
});

describe('M10 Tasten C, Q, ? (Spec 11.2)', () => {
  it('AK-U2-12 lockedToolText Roden; Liste mit „? Hilfe" nach P; unlockAll 20 Werkzeugtasten; ? ist Hilfe (M11 Y)', () => {
    expect(lockedToolText(createWorld(3), { kind: 'clearForest' })).toBe(
      'Roden: Erst wenn ein Wohnhaus 4 Pioniere hat',
    );
    const keys = hotkeyList(createWorld(3)).map((e) => `${e.key} ${e.label}`);
    expect(keys[keys.indexOf('P Pause / weiter') + 1]).toBe('? Hilfe');
    expect(keys.some((k) => k.startsWith('C ') || k.startsWith('Q '))).toBe(false);
    const all = hotkeyList(createWorld(3, { crisisLevel: 'normal', unlockAll: true }));
    expect(all.slice(0, 21).map((e) => e.key)).toEqual(
      Object.keys(TOOL_HOTKEYS).map((k) => k.toUpperCase()),
    );
    expect(Object.keys(TOOL_HOTKEYS)).toHaveLength(21);
    expect(hotkeyAction('?', { ctrl: false, meta: false, alt: false }, false)).toEqual({
      kind: 'help',
    });
    expect(hotkeyAction('?', { ctrl: true, meta: false, alt: false }, false)).toBeNull();
    expect(hotkeyAction('?', { ctrl: false, meta: false, alt: false }, true)).toBeNull();
    expect(hotkeyAction('c', { ctrl: false, meta: false, alt: false }, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'clearForest' },
    });
    expect(hotkeyAction('q', { ctrl: false, meta: false, alt: false }, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'plantForest' },
    });
  });
});

describe('M11 Taste Y (Spec 7, 13-10)', () => {
  const NONE = { ctrl: false, meta: false, alt: false };
  it('AK-UI-05 Y wählt die Jagdhütte; Rinderfarm ohne Taste; Y erst nach U2 in hotkeyList', () => {
    expect(hotkeyAction('y', NONE, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'build', defId: 'hunter' },
    });
    expect(hotkeyAction('Y', NONE, false)).not.toBeNull();
    expect(hotkeyLabel({ kind: 'build', defId: 'hunter' })).toBe('Y');
    expect(hotkeyLabel({ kind: 'build', defId: 'cattlefarm' })).toBeNull();
    const w = createWorld(3, { crisisLevel: 'normal' });
    expect(hotkeyList(w).some((e) => e.key === 'Y')).toBe(false);
    w.unlocked = ['U0', 'U2'];
    expect(hotkeyList(w)).toContainEqual({ key: 'Y', label: 'Jagdhütte' });
    expect(tooltipLines({ kind: 'build', defId: 'hunter' })[0]).toBe('Jagdhütte (Y)');
    expect(tooltipLines({ kind: 'build', defId: 'cattlefarm' })[0]).toBe('Rinderfarm');
  });
});

describe('M12 E2 UI Inseln: Tasten 0 und 9', () => {
  it('ohne seafaring stumm, auch mit Parameter false', () => {
    expect(hotkeyAction('0', NONE, false)).toBeNull();
    expect(hotkeyAction('9', NONE, false)).toBeNull();
    expect(hotkeyAction('0', NONE, false, false)).toBeNull();
  });
  it('mit seafaring Inselsprung; Formularfeld und Modifier bleiben stumm', () => {
    expect(hotkeyAction('0', NONE, false, true)).toEqual({ kind: 'islandHome' });
    expect(hotkeyAction('9', NONE, false, true)).toEqual({ kind: 'islandCycle' });
    expect(hotkeyAction('0', NONE, true, true)).toBeNull();
    expect(hotkeyAction('9', { ...NONE, ctrl: true }, false, true)).toBeNull();
  });
  it('hotkeyList nennt 0 und 9 erst ab seafaring', () => {
    const keys = (w: ReturnType<typeof createWorld>) => hotkeyList(w).map((e) => e.key);
    expect(keys(createWorld(3))).not.toContain('0');
    const all = createWorld(3, { crisisLevel: 'normal', unlockAll: true });
    expect(keys(all).filter((k) => k === '0')).toHaveLength(1);
    expect(keys(all).filter((k) => k === '9')).toHaveLength(1);
  });
});
