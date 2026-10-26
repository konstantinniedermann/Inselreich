import { STORAGE_CAP } from './defs/goods';
import { chapelWorks, inChapelRadius } from './feastEffect';
import { FRUGAL_PCT, PETITIONS } from './defs/petitions';
import type { Building, BuildingDefId, GoodId, PetitionEffectEntry, Tier, World } from './types';
import { HOME } from './world';

/** Blatt: einzige Leseorte der Bittschrift-Wirkungen. Ohne Einträge sofort der Eingabewert. */
function active(world: World): PetitionEffectEntry[] {
  return world.petitions.effects.filter((e) => e.until > world.tick);
}

export function overcrowdCap(world: World, island: number, tier: Tier, cap: number): number {
  if (world.petitions.effects.length === 0 || island !== HOME) return cap;
  let pct = 0;
  for (const e of active(world)) {
    const r = PETITIONS[e.id].reward;
    if (e.answer === 'yes' && r.kind === 'overcrowd' && r.tiers.includes(tier))
      pct = Math.max(pct, r.pct);
  }
  return pct === 0 ? cap : cap + Math.floor((cap * pct + 50) / 100);
}

export function needRate(world: World, island: number, good: GoodId, rate: number): number {
  if (world.petitions.effects.length === 0 || island !== HOME) return rate;
  const frugal = active(world).some((e) => e.answer === 'no' && PETITIONS[e.id].no === good);
  return frugal ? (rate * (100 - FRUGAL_PCT)) / 100 : rate;
}

export function petitionCycle(
  world: World,
  island: number,
  defId: BuildingDefId,
  cycle: number,
): number {
  if (world.petitions.effects.length === 0) return cycle;
  let pct = 100;
  for (const e of active(world)) {
    const r = PETITIONS[e.id].reward;
    if (e.answer !== 'yes' || r.kind !== 'cycle' || r.building !== defId) continue;
    if (r.homeOnly && island !== HOME) continue;
    pct = Math.min(pct, r.pct);
  }
  return pct === 100 ? cycle : Math.max(1, Math.floor((cycle * pct) / 100));
}

export function storageCap(world: World, island: number, good: GoodId): number {
  if (world.petitions.effects.length === 0 || island !== HOME) return STORAGE_CAP;
  let plus = 0;
  for (const e of active(world)) {
    const r = PETITIONS[e.id].reward;
    if (e.answer === 'yes' && r.kind === 'storage' && r.goods.includes(good))
      plus = Math.max(plus, r.plus);
  }
  return STORAGE_CAP + plus;
}

/** Glockenweihe (B4): «Ja» läuft, Ankerkapelle steht und arbeitet, das Haus liegt in ihrem Radius. Brand und Trennung pausieren, `until` läuft weiter. */
export function bellActive(world: World, house: Building): boolean {
  if (world.petitions.effects.length === 0) return false;
  return active(world).some((e) => {
    if (e.answer !== 'yes' || PETITIONS[e.id].reward.kind !== 'upgradeWait') return false;
    const chapel = world.buildings[e.anchor ?? -1];
    return chapel !== undefined && chapelWorks(chapel) && inChapelRadius(world, chapel, house);
  });
}

const isVoucher = (world: World, e: PetitionEffectEntry, chapelId: number): boolean =>
  e.answer === 'yes' &&
  e.anchor === chapelId &&
  e.until > world.tick &&
  PETITIONS[e.id].reward.kind === 'feastVoucher';

/** Festtrunk (B5): Läuft eine «Ja»-Wirkung mit dieser Kapelle als Anker? */
export function voucherAt(world: World, chapelId: number): boolean {
  return world.petitions.effects.some((e) => isVoucher(world, e, chapelId));
}

/**
 * Löst den Festtrunk dieser Kapelle ein: entfernt genau eine Wirkung. Einzige Schreibstelle im Blatt,
 * aufgerufen nur nach erfolgreichem `holdFeast`.
 */
export function useVoucher(world: World, chapelId: number): void {
  const i = world.petitions.effects.findIndex((e) => isVoucher(world, e, chapelId));
  if (i >= 0) world.petitions.effects.splice(i, 1);
}
