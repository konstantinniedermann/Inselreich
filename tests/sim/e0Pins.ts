// Pins für M12 E0 Schritt 0 (Plan T00). Nie nachstellen: weicht ein Wert ab, ist E0 nicht bitgleich.
// Basis: b5a63ef (`src/` = 17cbafb, v6-Code unverändert), Datum 2026-10-05.
// Erzeugt mit: VITE_GEN_E0=1 npx vitest run tests/sim/gen-e0.test.ts --silent=false (temporärer Erzeuger, nicht eingecheckt).

/** P-9: `fnv1a32(serialize(w))` und Länge je v6-Form des Startzustands (Seed 3). */
export const V6_FORMS: Record<string, { hash: number; length: number }> = {
  off: { hash: 2986593589, length: 209659 },
  unlockAll: { hash: 3465396742, length: 209689 },
  mild: { hash: 621449178, length: 209660 },
  normal: { hash: 3305644891, length: 209662 },
};

/** AK-E0-04: `fnv1a32(sortedJson(deserialize(save-vN.json).world))`. */
export const CHAIN_HASHES: Record<number, number> = {
  1: 0x256f040f,
  2: 0xa302f7c5,
  3: 0x04ee15e8,
  4: 0x3f88b31a,
  5: 0x130b2ad5,
};

/** AK-E0-19: Zufallsfolge im Lauf „normal" bis zum Sieg, Seed 3. */
export const RANDOM_SEQUENCE: string[] = [
  'O0:stone:17:187@600',
  'O1:food:19:114@1500',
  'C0:storm:-:-:-@2400',
  'O2:wood:32:224@2400',
  'C1:fire:7:burning:-@3000',
  'O3:wood:23:161@3300',
  'C2:storm:-:-:-@3600',
  'C3:boom:-:-:stone@4200',
  'O4:wool:12:108@4200',
  'C4:fire:22:extinguished:-@4800',
  'O5:wool:14:126@5100',
  'C5:fire:15:extinguished:-@5400',
  'C6:fire:15:extinguished:-@6000',
  'O6:cloth:7:154@6000',
  'C7:storm:-:-:-@6600',
  'O7:rum:10:300@6900',
  'C8:boom:-:-:rum@7200',
  'C9:storm:-:-:-@7800',
  'O8:food:10:60@7800',
];
