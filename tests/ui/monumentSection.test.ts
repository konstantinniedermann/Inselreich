import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setMonumentPaused, startMonumentStage } from '../../src/sim/monument';
import type { World } from '../../src/sim/types';
import { updateRest } from '../../src/ui/inspect';
import { buildMonumentSection, updateMonumentSection } from '../../src/ui/monumentSection';
import { monumentWorld, placeMonument } from '../sim/monumentHelpers';
import { FakeElement, fakeDocument, fieldEl } from './fakeDom';

const asEl = (e: FakeElement): HTMLElement => e as unknown as HTMLElement;

beforeEach(() => {
  vi.stubGlobal('document', fakeDocument);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function running(): World {
  const w = monumentWorld();
  placeMonument(w);
  expect(startMonumentStage(w).ok).toBe(true);
  w.buildings[w.monument!.buildingId]!.connected = true;
  return w;
}

function build(calls: string[] = []) {
  const root = new FakeElement('div');
  const section = buildMonumentSection({
    start: () => calls.push('start'),
    setPaused: (p) => calls.push(`paused:${p}`),
    setBuy: (g, on) => calls.push(`buy:${g}:${on}`),
  }) as unknown as FakeElement;
  root.append(section);
  return { root, calls };
}

describe('AK-1 Denkmal-Abschnitt: Pause an/aus', () => {
  it('laufend: dataset.paused false, sichtbar; Klick fragt Pause an', () => {
    const { root, calls } = build();
    updateMonumentSection(asEl(root), running());
    const btn = root.querySelector('[data-field="monument-pause"]')!;
    expect(btn.hidden).toBe(false);
    expect(btn.dataset.paused).toBe('false');
    btn.fire('click');
    expect(calls).toEqual(['paused:true']);
  });

  it('angehalten: dataset.paused true; Klick fragt Fortsetzen an', () => {
    const { root, calls } = build();
    const w = running();
    expect(setMonumentPaused(w, true).ok).toBe(true);
    updateMonumentSection(asEl(root), w);
    const btn = root.querySelector('[data-field="monument-pause"]')!;
    expect(btn.dataset.paused).toBe('true');
    btn.fire('click');
    expect(calls).toEqual(['paused:false']);
  });

  it('Wechsel zurück auf laufend setzt dataset.paused wieder auf false', () => {
    const { root } = build();
    const w = running();
    setMonumentPaused(w, true);
    updateMonumentSection(asEl(root), w);
    setMonumentPaused(w, false);
    updateMonumentSection(asEl(root), w);
    const btn = root.querySelector('[data-field="monument-pause"]')!;
    expect(btn.dataset.paused).toBe('false');
  });

  it('Knopftexte: «Bau anhalten» laufend, «Bau fortsetzen» angehalten', () => {
    const { root } = build();
    const w = running();
    updateMonumentSection(asEl(root), w);
    const btn = root.querySelector('[data-field="monument-pause"]')!;
    expect(btn.textContent).toBe('Bau anhalten');
    setMonumentPaused(w, true);
    updateMonumentSection(asEl(root), w);
    expect(btn.textContent).toBe('Bau fortsetzen');
  });
});

describe('setText/setHidden im Abschnitt', () => {
  it('ohne Denkmal sind Abschnittszeilen, Reihen und Knöpfe versteckt', () => {
    const { root } = build();
    updateMonumentSection(asEl(root), monumentWorld());
    for (const f of ['monument-stage', 'monument-reason', 'monument-eta', 'monument-pause']) {
      expect(root.querySelector(`[data-field="${f}"]`)!.hidden).toBe(true);
    }
  });

  it('schreibt Zeilen und Sichtbarkeit: Abschnittszeile gefüllt, Grund-Zeile nur bei Text sichtbar', () => {
    const { root } = build();
    updateMonumentSection(asEl(root), running());
    const stage = root.querySelector('[data-field="monument-stage"]')!;
    expect(stage.textContent).not.toBe('');
    expect(stage.hidden).toBe(false);
    const reason = root.querySelector('[data-field="monument-reason"]')!;
    expect(reason.textContent === '').toBe(reason.hidden);
  });

  it('gleicher Wert wird nicht erneut geschrieben (setText/setHidden überspringen)', () => {
    const { root } = build();
    const w = running();
    updateMonumentSection(asEl(root), w);
    const stage = root.querySelector('[data-field="monument-stage"]')!;
    let writes = 0;
    let value = stage.textContent;
    Object.defineProperty(stage, 'textContent', {
      get: () => value,
      set: (v: string) => {
        writes++;
        value = v;
      },
    });
    updateMonumentSection(asEl(root), w);
    expect(writes).toBe(0);
  });
});

describe('AK-1 Zeile rest-monument', () => {
  function panel() {
    const p = new FakeElement('div');
    p.append(fieldEl('rest-monument'));
    return p;
  }

  it('Wahlziel erreicht: Abschlusszeile sichtbar', () => {
    const w = monumentWorld();
    w.monumentDone = true;
    const p = panel();
    updateRest(asEl(p), w);
    const line = p.querySelector('[data-field="rest-monument"]')!;
    expect(line.textContent).toBe('Wahlziel erreicht: Das Denkmal steht');
    expect(line.hidden).toBe(false);
  });

  it('laufender Abschnitt: Fortschrittszeile; ohne Handelsziel versteckt und leer', () => {
    const w = running();
    const p = panel();
    updateRest(asEl(p), w);
    const line = p.querySelector('[data-field="rest-monument"]')!;
    expect(line.textContent).toMatch(/^Denkmal: Abschnitt 1\/\d+ · \d+ %$/);
    expect(line.hidden).toBe(false);

    w.wonMerchants = false;
    updateRest(asEl(p), w);
    expect(line.textContent).toBe('');
    expect(line.hidden).toBe(true);
  });
});
