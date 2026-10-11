/** Sperrbestand (I-049): Güter, die der Spieler je Insel vor Betrieben schützen kann, und die Stufen. */
export const RESERVE_GOODS = ['wood', 'stone'] as const;
export type ReserveGood = (typeof RESERVE_GOODS)[number];

export const RESERVE_STEPS = [0, 20, 40, 60] as const;
export type ReserveStep = (typeof RESERVE_STEPS)[number];
