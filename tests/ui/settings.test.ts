import { describe, expect, it } from 'vitest';
import { parseSettings } from '../../src/ui/settings';

const DEFAULTS = { muted: false, volume: 0.4 };

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
    expect(parseSettings('{"muted":true}')).toEqual({ muted: true, volume: 0.4 });
    expect(parseSettings('{"volume":0.7}')).toEqual({ muted: false, volume: 0.7 });
  });

  it('AK-U2-05: gültige Werte bleiben erhalten', () => {
    expect(parseSettings('{"muted":true,"volume":0.25}')).toEqual({ muted: true, volume: 0.25 });
    expect(parseSettings('{"muted":false,"volume":0}')).toEqual({ muted: false, volume: 0 });
  });

  it('AK-U2-05: muted, das kein Boolean ist, ergibt den Standard (false)', () => {
    expect(parseSettings('{"muted":"true","volume":0.5}')).toEqual({ muted: false, volume: 0.5 });
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
