import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseSettings, saveSettings, SETTINGS_KEY } from '../../src/ui/settings';

const DEFAULTS = { muted: false, volume: 0.4, dayNight: true };

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
    expect(parseSettings('{"muted":true}')).toEqual({ muted: true, volume: 0.4, dayNight: true });
    expect(parseSettings('{"volume":0.7}')).toEqual({ muted: false, volume: 0.7, dayNight: true });
  });

  it('AK-U2-05: gültige Werte bleiben erhalten', () => {
    expect(parseSettings('{"muted":true,"volume":0.25}')).toEqual({
      muted: true,
      volume: 0.25,
      dayNight: true,
    });
    expect(parseSettings('{"muted":false,"volume":0}')).toEqual({
      muted: false,
      volume: 0,
      dayNight: true,
    });
  });

  it('AK-U2-05: muted, das kein Boolean ist, ergibt den Standard (false)', () => {
    expect(parseSettings('{"muted":"true","volume":0.5}')).toEqual({
      muted: false,
      volume: 0.5,
      dayNight: true,
    });
    expect(parseSettings('{"muted":1}')).toEqual(DEFAULTS);
  });
});

describe('parseSettings Lautstärke (RF-4b)', () => {
  it('RF-4b: Zeichenkette "0.4" fällt auf den Standard 0.4', () => {
    expect(parseSettings('{"volume":"0.4"}').volume).toBe(0.4);
    expect(parseSettings('{"volume":"0.9"}').volume).toBe(0.4);
  });

  it('RF-4b: NaN (JSON kennt es nur als null) fällt auf den Standard', () => {
    expect(parseSettings(JSON.stringify({ volume: NaN })).volume).toBe(0.4);
    expect(parseSettings('{"volume":null}').volume).toBe(0.4);
  });

  it('RF-4b: negativ wird auf 0 geklemmt, über 1 auf 1', () => {
    expect(parseSettings('{"volume":-1}').volume).toBe(0);
    expect(parseSettings('{"volume":2}').volume).toBe(1);
  });

  it('RF-4b: nie NaN, auch nicht bei riesigen Zahlen', () => {
    expect(parseSettings('{"volume":1e999}').volume).toBe(0.4);
    expect(Number.isNaN(parseSettings('{"volume":-1e999}').volume)).toBe(false);
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
    const r = saveSettings({ muted: true, volume: 0.3, dayNight: false });
    expect(r.ok).toBe(true);
    expect(parseSettings(store.get(SETTINGS_KEY) ?? null)).toEqual({
      muted: true,
      volume: 0.3,
      dayNight: false,
    });
  });
});
