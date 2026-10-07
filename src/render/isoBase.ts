// isoBase.ts — Blatt-Modul der Projektion (WALD-02): Rautenmasse und `project` ohne weitere Importe, damit reine
// Module (crown.ts, forest.ts) sie lesen können, ohne einen Import-Zyklus über iso.ts zu bilden. iso.ts exportiert
// dieselben Namen weiter; alle übrigen Module importieren wie bisher aus iso.ts.
export const ISO_W = 64;
export const ISO_H = 32;
export interface Pt {
  x: number;
  y: number;
}
export const project = (fx: number, fy: number): Pt => ({
  x: (fx - fy) * (ISO_W / 2),
  y: (fx + fy) * (ISO_H / 2),
});
