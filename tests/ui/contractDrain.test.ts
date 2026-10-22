import { describe, expect, it } from 'vitest';
import { contractDrain } from '../../src/ui/contractDrain';
import { chipView, reachLine, stockChipView } from '../../src/ui/hud';
import { createWorld, home } from '../../src/sim/world';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { goodsBalance } from '../../src/sim/queries';

function withContract() {
  const w = createWorld(3);
  w.contract = { good: 'rum', amount: 5, price: 1, island: 0, deliveries: 0 };
  return w;
}

describe('I-123 contractDrain (AK-R1)', () => {
  it('Vertrag 5 Rum auf der Heimat: amount * 100 / 900', () => {
    expect(contractDrain(withContract(), 'rum', 0)).toBe((5 * 100) / 900);
  });
  it('andere Insel, anderes Gut, kein Vertrag: 0', () => {
    const w = withContract();
    expect(contractDrain(w, 'rum', 1)).toBe(0);
    expect(contractDrain(w, 'wood', 0)).toBe(0);
    w.contract = null;
    expect(contractDrain(w, 'rum', 0)).toBe(0);
  });
});

describe('I-123 reachLine (AK-R2)', () => {
  it('mit Abzug: kürzere Zeit, Zusatz «mit Stammkunde»', () => {
    const line = reachLine(12, -1, 0.56);
    expect(line).toContain('Leer in');
    expect(line).toContain('(mit Stammkunde, ohne Handel und Aufträge)');
    expect(line).not.toBe(reachLine(12, -1));
    expect(reachLine(12, -1)).toContain('(ohne Handel und Aufträge)');
    expect(reachLine(12, -1)).not.toContain('Stammkunde');
    expect(reachLine(12, -1, 0)).toBe(reachLine(12, -1));
  });
});

describe('I-123 Chip (AK-R3)', () => {
  it('Bilanz +0,3, Abzug 0,56: Reichweite leer, Pfeil aus roher Bilanz', () => {
    const v = stockChipView('rum', 0, 0.3, 0.56);
    expect(v.text).toBe('0 ↑ leer');
    expect(v.reach).toBe('alarm');
  });
  it('Abzug 0 bleibt wie vorher', () => {
    expect(stockChipView('rum', 0, 0.3)).toEqual(stockChipView('rum', 0, 0.3, 0));
    expect(stockChipView('rum', 20, 0.3).reach).toBeUndefined();
  });
  it('Überschuss trotz Abzug: Voll in …', () => {
    const v = stockChipView('rum', STORAGE_CAP - 3, 1.5, 0.56);
    expect(v.text).toMatch(/↑ \d/);
    expect(v.reach).toBe('full-warn');
  });
  it('chipView: Vertrag gekündigt → Chip wie ohne Abzug', () => {
    const w = withContract();
    home(w).stock.rum = 0;
    const bal = goodsBalance(w, 0);
    const mit = chipView(w, 'rum', 0, bal);
    w.contract = null;
    const ohne = chipView(w, 'rum', 0, goodsBalance(w, 0));
    expect(ohne).toEqual(stockChipView('rum', 0, bal.rum.net));
    expect(mit.text).toContain('leer');
  });
});
