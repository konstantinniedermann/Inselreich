import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  parseSettings,
  resolveReduceMotion,
  saveSettings,
  serializeSettings,
  SETTINGS_KEY,
} from '../../src/ui/settings';

const DEFAULTS = {
  muted: false,
  master: 0.4,
  music: 0.5,
  ambience: 0.7,
  effects: 1,
  dayNight: true,
  reduceMotion: 'auto' as const,
  crisisLevel: 'normal' as const,
  unlockMode: 'stepwise' as const,
};

describe('parseSettings (AK-U2-05)', () => {
  it('AK-U2-05: null ergibt die Standardwerte', () => {
    expect(parseSettings(null)).toEqual(DEFAULTS);
  });

  it('AK-U2-05: kaputte Werte ("x", Müll, Nicht-Objekte) ergeben die Standardwerte', () => {
    expect(parseSettings('x')).toEqual(DEFAULTS);
    expect(parseSettings('"x"')).toEqual(DEFAULTS);
    expect(parseSettings('[1,2]')).toEqual(DEFAULTS);
    expect(parseSettings('null')).toEqual(DEFAULTS);
    expect(parseSettings('42')).toEqual(DEFAULTS);
    expect(parseSettings('{')).toEqual(DEFAULTS);
  });

  it('AK-U2-05: fehlende Felder fallen einzeln auf den Standard zurück', () => {
    expect(parseSettings('{}')).toEqual(DEFAULTS);
    expect(parseSettings('{"muted":true}')).toEqual({ ...DEFAULTS, muted: true });
    expect(parseSettings('{"master":0.7}')).toEqual({ ...DEFAULTS, master: 0.7 });
  });

  it('AK-U2-05: gültige Werte bleiben erhalten', () => {
    expect(parseSettings('{"muted":true,"volume":0.25}')).toEqual({
      ...DEFAULTS,
      muted: true,
      master: 0.25,
    });
    expect(parseSettings('{"muted":false,"volume":0}')).toEqual({
      ...DEFAULTS,
      muted: false,
      master: 0,
    });
  });

  it('AK-U2-05: muted, das kein Boolean ist, ergibt den Standard (false)', () => {
    expect(parseSettings('{"muted":"true","volume":0.5}')).toEqual({
      ...DEFAULTS,
      muted: false,
      master: 0.5,
    });
    expect(parseSettings('{"muted":1}')).toEqual(DEFAULTS);
  });
});

describe('parseSettings Lautstärke (RF-4b)', () => {
  it('RF-4b: Zeichenkette "0.4" fällt auf den Standard 0.4', () => {
    expect(parseSettings('{"master":"0.4"}').master).toBe(0.4);
    expect(parseSettings('{"master":"0.9"}').master).toBe(0.4);
  });

  it('RF-4b: NaN (JSON kennt es nur als null) fällt auf den Standard', () => {
    expect(parseSettings(JSON.stringify({ master: NaN })).master).toBe(0.4);
    expect(parseSettings('{"master":null}').master).toBe(0.4);
  });

  it('RF-4b: negativ wird auf 0 geklemmt, über 1 auf 1', () => {
    expect(parseSettings('{"master":-1}').master).toBe(0);
    expect(parseSettings('{"master":2}').master).toBe(1);
  });

  it('RF-4b: nie NaN, auch nicht bei riesigen Zahlen', () => {
    expect(parseSettings('{"master":1e999}').master).toBe(0.4);
    expect(Number.isNaN(parseSettings('{"master":-1e999}').master)).toBe(false);
  });
});

describe('parseSettings dayNight (A4)', () => {
  it('A4: Standard ist an bei null, "x" und fehlendem Feld', () => {
    expect(parseSettings(null).dayNight).toBe(true);
    expect(parseSettings('"x"').dayNight).toBe(true);
    expect(parseSettings('{"muted":true,"volume":0.5}').dayNight).toBe(true);
  });

  it('A4: false bleibt false, true bleibt true', () => {
    expect(parseSettings('{"dayNight":false}').dayNight).toBe(false);
    expect(parseSettings('{"dayNight":true}').dayNight).toBe(true);
  });

  it('A4: ungültige Werte ("no", 0, null) ergeben true', () => {
    expect(parseSettings('{"dayNight":"no"}').dayNight).toBe(true);
    expect(parseSettings('{"dayNight":0}').dayNight).toBe(true);
    expect(parseSettings('{"dayNight":null}').dayNight).toBe(true);
  });
});

describe('saveSettings dayNight (A4)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('A4: Round-trip über ein Fake-Storage', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
    const r = saveSettings({ ...DEFAULTS, muted: true, master: 0.3, dayNight: false });
    expect(r.ok).toBe(true);
    expect(parseSettings(store.get(SETTINGS_KEY) ?? null)).toEqual({
      ...DEFAULTS,
      muted: true,
      master: 0.3,
      dayNight: false,
    });
  });
});

describe('parseSettings Krisenstufe (M6-AK-U1-01)', () => {
  it('M6-AK-U1-01: fehlend oder ungültig ergibt normal', () => {
    expect(parseSettings(null).crisisLevel).toBe('normal');
    expect(parseSettings('{}').crisisLevel).toBe('normal');
    expect(parseSettings('{"crisisLevel":"hard"}').crisisLevel).toBe('normal');
    expect(parseSettings('{"crisisLevel":3}').crisisLevel).toBe('normal');
    expect(parseSettings('{"crisisLevel":"toString"}').crisisLevel).toBe('normal');
  });

  it('M6-AK-U1-01: off, mild und normal bleiben', () => {
    for (const l of ['off', 'mild', 'normal'] as const) {
      expect(parseSettings(JSON.stringify({ crisisLevel: l })).crisisLevel).toBe(l);
    }
  });

  it('M6-AK-U1-01: M5-JSON ohne das Feld behält muted, dayNight und volume', () => {
    const s = parseSettings('{"muted":true,"volume":0.2,"dayNight":false}');
    expect(s).toEqual({ ...DEFAULTS, muted: true, master: 0.2, dayNight: false });
  });
});

describe('gemeinsames Einstellungsformat (M6-AK-U1-10)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('M6-AK-U1-10: Round-trip behält auch fremde Felder', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
    const input = {
      muted: true,
      master: 0.3,
      music: 0.2,
      ambience: 0.6,
      effects: 0.9,
      dayNight: false,
      reduceMotion: 'on',
      crisisLevel: 'mild',
    };
    const first = parseSettings(JSON.stringify(input));
    expect(saveSettings(first).ok).toBe(true);
    const saved = JSON.parse(store.get(SETTINGS_KEY) ?? '{}') as Record<string, unknown>;
    expect(saved).toMatchObject(input);
    expect(parseSettings(store.get(SETTINGS_KEY) ?? null)).toEqual(first);
  });

  it('M6-AK-U1-10: eine Änderung der Krisenstufe lässt fremde Felder stehen', () => {
    const s = parseSettings('{"zukunft":1,"crisisLevel":"off"}');
    expect(s.extra).toEqual({ zukunft: 1 });
  });
});

describe('M7-U1 Einstellungen (AK-U1-01, AK-U1-01b, RF-3a)', () => {
  it('AK-U1-01 Migration aus M5: volume wird master, Rest Standard, geschrieben wird kein volume', () => {
    const s = parseSettings('{"muted":true,"volume":0.2,"dayNight":false}');
    expect(s).toMatchObject({
      muted: true,
      master: 0.2,
      dayNight: false,
      music: 0.5,
      ambience: 0.7,
      effects: 1,
      reduceMotion: 'auto',
    });
    expect(JSON.parse(serializeSettings(s))).not.toHaveProperty('volume');
    expect(parseSettings('{kaputt')).toMatchObject(DEFAULT_SETTINGS);
  });

  it('AK-U1-01b Round-trip über das gemeinsame Format erhält alle Felder, auch fremde', () => {
    const all = {
      muted: true,
      master: 0.3,
      music: 0.2,
      ambience: 0.6,
      effects: 0.9,
      dayNight: false,
      reduceMotion: 'on',
      crisisLevel: 'mild',
      unlockMode: 'all',
      zukunft: 1,
    };
    expect(JSON.parse(serializeSettings(parseSettings(JSON.stringify(all))))).toEqual(all);
    const only = parseSettings('{"crisisLevel":"mild"}');
    expect(JSON.parse(serializeSettings(only))).toEqual({
      ...DEFAULT_SETTINGS,
      crisisLevel: 'mild',
    });
  });

  it('AK-U1-01: master hat Vorrang vor volume; ungültiges master fällt auf den Standard, nicht auf volume', () => {
    expect(parseSettings('{"master":0.1,"volume":0.9}').master).toBe(0.1);
    expect(parseSettings('{"master":"x","volume":0.9}').master).toBe(0.4);
  });

  it('RF-3a ungültige Einzelwerte fallen einzeln zurück', () => {
    const s = parseSettings(
      '{"master":"0.4","music":null,"effects":-2,"ambience":7,"reduceMotion":"maybe"}',
    );
    expect(s).toMatchObject({
      master: 0.4,
      music: 0.5,
      effects: 0,
      ambience: 1,
      reduceMotion: 'auto',
    });
  });

  it('resolveReduceMotion: auto folgt dem System, on/off gelten fest', () => {
    expect(resolveReduceMotion('auto', true)).toBe(true);
    expect(resolveReduceMotion('auto', false)).toBe(false);
    expect(resolveReduceMotion('on', false)).toBe(true);
    expect(resolveReduceMotion('off', true)).toBe(false);
  });
});

describe('M10 Freischalt-Modus', () => {
  it('AK-U1-10 unlockMode: Standard stepwise, all gelesen, unbekannt → stepwise', () => {
    expect(parseSettings(null).unlockMode).toBe('stepwise');
    expect(parseSettings(JSON.stringify({ unlockMode: 'all' })).unlockMode).toBe('all');
    expect(parseSettings(JSON.stringify({ unlockMode: 'foo' })).unlockMode).toBe('stepwise');
  });
});
