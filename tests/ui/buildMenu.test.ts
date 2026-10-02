import { describe, expect, it } from 'vitest';
import { tabOrder } from '../../src/ui/buildMenu';

describe('tabOrder (Spec L2 Tastatur)', () => {
  const main = ['Auswahl', 'Weg', 'Abriss', 'Infra', 'Wohnen', 'Prod', 'Oeff'];
  it('offene Kategorie: Einträge direkt nach ihr, Rest der Hauptzeile danach', () => {
    expect(tabOrder(main, ['Fischer', 'Holz'], 5)).toEqual([
      'Auswahl',
      'Weg',
      'Abriss',
      'Infra',
      'Wohnen',
      'Prod',
      'Fischer',
      'Holz',
      'Oeff',
    ]);
  });
  it('ohne offene Kategorie nur die Hauptzeile', () => {
    expect(tabOrder(main, [], -1)).toEqual(main);
  });
});
