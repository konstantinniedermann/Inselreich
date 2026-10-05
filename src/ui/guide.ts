import { home } from '../sim/world';
// guide.ts — rein: nächster Schritt, Steuerwirkung, Abhilfe und Kartenzeichen als Klartext (Spec L5–L7).
import { PALETTE } from '../render/palette';
import { BUILDING_DEFS, BUILDING_IDS } from '../sim/defs/buildings';
import { GOOD_IDS, GOODS } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS } from '../sim/defs/tiers';
import { SERVICE_BUILDING, tierLock } from '../sim/population';
import { buildLock } from '../sim/placement';
import { effectiveTaxLevel, townhallActive } from '../sim/townhall';
import { entryOfBuilding, unlockText } from '../sim/unlocks';
import { houseDiagnosis, missingInputs } from '../sim/queries';
import type {
  Building,
  BuildingDefId,
  GoodId,
  ServiceId,
  TaxLevel,
  Tier,
  World,
} from '../sim/types';
import { crisisLogVisible } from './crisisLog';
import { hotkeyLabel } from './hotkeys';
import { unconnectedIds } from './hints';
import { formatGameTime } from './time';

const key = (id: BuildingDefId): string => hotkeyLabel({ kind: 'build', defId: id }) ?? '';
const nm = (id: BuildingDefId): string => BUILDING_DEFS[id].name;
const nk = (id: BuildingDefId): string => `${nm(id)} (${key(id)})`;
const has = (w: World, id: BuildingDefId): boolean =>
  Object.values(w.buildings).some((b) => b.defId === id);

export const producerOf = (g: GoodId): BuildingDefId | undefined =>
  BUILDING_IDS.find((id) => BUILDING_DEFS[id].produces === g);
export const consumerOf = (g: GoodId): BuildingDefId | undefined =>
  BUILDING_IDS.find((id) => BUILDING_DEFS[id].consumes?.includes(g) === true);

/** Spec 12.3: Nennt ein Satz ein gesperrtes Gebäude, lautet er „{Name} kommt, {whenText}". */
function lockedSentence(w: World, ids: readonly (BuildingDefId | undefined)[]): string | null {
  for (const id of ids) {
    if (id === undefined) continue;
    const e = entryOfBuilding(id);
    if (e !== null && buildLock(w, id) !== null)
      return `${nm(id)} kommt, ${unlockText(e, 'whenText')}`;
  }
  return null;
}

/** Hat jeder Erzeuger von `g` eine Bauregel `islandTrait`? Dann ist `g` in der Heimat nicht baubar (heute Gewürz). */
export function needsForeignIsland(g: GoodId): boolean {
  const producers = BUILDING_IDS.filter((id) => BUILDING_DEFS[id].produces === g);
  return (
    producers.length > 0 &&
    producers.every((id) => BUILDING_DEFS[id].site.some((r) => r.kind === 'islandTrait'))
  );
}

/** Satz für ein Gut von einer fernen Insel: kaufen oder ein Kontor gründen; nie ein Betrieb mit Taste. */
function foreignGoodHint(g: GoodId): string {
  const name = GOODS[g].name;
  return `kaufe es am Kontor oder gründe ein Kontor auf einer ${name}insel`;
}

/** Satz zu einem fehlenden Gut, oder null, wenn Erzeuger und Vorstufe stehen (dann weiterschalten). */
function goodSentence(w: World, tierName: string, g: GoodId): string | null {
  if (needsForeignIsland(g))
    return home(w).stock[g] >= 1
      ? null
      : `Deine ${tierName} brauchen ${GOODS[g].name}: ${foreignGoodHint(g)}`;
  const p = producerOf(g);
  if (!p) return null;
  const input = (BUILDING_DEFS[p].consumes ?? []).find((i) => {
    const q = producerOf(i);
    return q !== undefined && !has(w, q);
  });
  const q = input !== undefined ? producerOf(input) : undefined;
  if (!has(w, p)) {
    const locked = lockedSentence(w, [p, q]);
    if (locked) return locked;
    const base = `Deine ${tierName} brauchen ${GOODS[g].name}: baue ${nk(p)}`;
    return q ? `${base} und ${nk(q)} für ${GOODS[input!].name}` : base;
  }
  if (q) {
    const lockedQ = lockedSentence(w, [q]);
    if (lockedQ) return lockedQ;
  }
  if (q) return `${nm(p)} braucht ${GOODS[input!].name}: baue ${nk(q)}`;
  return null;
}

/** Kassen-Satz in drei Fassungen (Spec 12.3): vor U3, ab U3 ohne aktive Amtsstube, mit aktiver Amtsstube. */
function cashSentence(w: World): string {
  const base = 'Deine Kasse schrumpft: versorge mehr Wohnhäuser';
  if (townhallActive(w)) return `${base}, verkaufe Waren am Kontor oder erhöhe die Steuer`;
  if (buildLock(w, 'townhall') === null)
    return `${base}, verkaufe Waren am Kontor oder baue eine ${nk('townhall')}`;
  return `${base} oder verkaufe Waren am Kontor`;
}

export function nextStep(w: World): string {
  if (w.wonMerchants) return 'Handelsstadt erreicht — spiel frei weiter';
  const houses = Object.values(w.buildings)
    .filter((b) => b.house)
    .sort((a, b) => a.id - b.id);
  if (houses.length === 0) return `Baue ein ${nk('house')} nahe dem Kontor`;
  const unc = [...unconnectedIds(w)].sort((a, b) => a - b)[0];
  if (unc !== undefined)
    return `Verbinde ${nm(w.buildings[unc]!.defId)} per Weg (${hotkeyLabel({ kind: 'road' })}) mit dem Kontor`;
  // Nur Häuser, deren nächste Stufe frei ist (M8 14.8): vor dem Sieg kein Kaufleute-Satz.
  const canRise = (h: Building): boolean =>
    TIERS[h.house!.tier].upgradeCost !== null && tierLock(w, h.house!.tier + 1) === null;
  const full = houses.filter(
    (h) => h.house!.inhabitants === TIERS[h.house!.tier].maxInhabitants && canRise(h),
  );
  // Regel 3: erst Diagnosen (Versorgung, Güter), dann neue Güter der nächsten Stufe voller Häuser
  for (const h of houses)
    for (const d of houseDiagnosis(w, h)) {
      if (d.kind === 'supply')
        return (
          lockedSentence(w, ['market']) ??
          `Ein Wohnhaus liegt ausserhalb der Versorgung: baue einen ${nk('market')}`
        );
      if (d.kind === 'good') {
        const s = goodSentence(w, TIERS[h.house!.tier].name, d.good);
        if (s) return s;
      }
    }
  for (const h of full) {
    const next = (h.house!.tier + 1) as Tier;
    for (const g of GOOD_IDS) {
      if (!(g in TIERS[next].needs) || g in TIERS[h.house!.tier].needs) continue;
      const s = goodSentence(w, TIERS[next].name, g);
      if (s) return s;
    }
  }
  // Regel 4: Dienste
  const serviceSentence = (tierName: string, s: ServiceId): string | null => {
    const id = SERVICE_BUILDING[s];
    if (!has(w, id)) {
      const locked = lockedSentence(w, [id]);
      if (locked) return locked;
    }
    return has(w, id) ? null : `Deine ${tierName} brauchen ${nm(id)}: baue ${nk(id)} in ihrer Nähe`;
  };
  for (const h of houses)
    for (const d of houseDiagnosis(w, h))
      if (d.kind === 'service') {
        const s = serviceSentence(TIERS[h.house!.tier].name, d.service);
        if (s) return s;
      }
  for (const h of full) {
    const next = (h.house!.tier + 1) as Tier;
    for (const sv of TIERS[next].services) {
      if (TIERS[h.house!.tier].services.includes(sv)) continue;
      const s = serviceSentence(TIERS[next].name, sv);
      if (s) return s;
    }
  }
  if (w.money < 0 || w.stats.taxes - w.stats.upkeep < 0) return cashSentence(w);
  const tax = effectiveTaxLevel(w);
  if (TAX_LEVELS[tax].upgradeWait === null && houses.some(canRise))
    return `Steuer ‚${TAX_LEVELS[tax].name}' verhindert den Aufstieg: stelle sie auf ‚${TAX_LEVELS.normal.name}' oder ‚${TAX_LEVELS.low.name}'`;
  return 'Baue weitere Wohnhäuser und versorge sie';
}

export function taxEffect(level: TaxLevel): string {
  const t = TAX_LEVELS[level];
  const up =
    t.upgradeWait === null
      ? 'kein Aufstieg'
      : `Aufstieg nach ${formatGameTime(t.upgradeWait)} Zufriedenheit`;
  const occ =
    t.occupancy === 1
      ? 'Häuser voll belegt'
      : `Häuser nur zu ${Math.round(t.occupancy * 100)} % belegt`;
  return `${t.name}: ${t.pct} % Steuer · ${up} · ${occ}`;
}

export function remedyText(w: World, b: Building): string | null {
  if (b.id === home(w).kontorId) return null;
  if (b.house) {
    const d = houseDiagnosis(w, b)[0];
    if (!d) return null;
    if (d.kind === 'supply') return `Baue einen ${nk('market')} in der Nähe`;
    if (d.kind === 'service') {
      const id = SERVICE_BUILDING[d.service];
      return `${nm(id)} fehlt: baue ${nk(id)} in Reichweite`;
    }
    const g = GOODS[d.good].name;
    if (needsForeignIsland(d.good)) return `${g} fehlt: ${foreignGoodHint(d.good)}`;
    const p = producerOf(d.good)!;
    return has(w, p)
      ? `${g} fehlt: baue mehr ${nm(p)} oder kaufe ${g} am Kontor`
      : `${g} fehlt: baue ${nk(p)}`;
  }
  if (b.outageUntil !== undefined)
    return `Läuft nach dem Brand von selbst wieder; eine ${nk('firestation')} in der Nähe schützt`;
  if (!b.connected) return `Baue einen Weg (${hotkeyLabel({ kind: 'road' })}) von hier zum Kontor`;
  const def = BUILDING_DEFS[b.defId];
  if (b.state === 'noService' && def.requiresService) {
    const school = SERVICE_BUILDING[def.requiresService];
    return lockedSentence(w, [school]) ?? `Baue eine ${nk(school)} in Reichweite`;
  }
  if (b.state === 'waitingInput' && def.consumes) {
    const g = missingInputs(w, b)[0] ?? def.consumes[0]!;
    return `Baue ${nk(producerOf(g)!)} oder kaufe ${GOODS[g].name} am Kontor`;
  }
  if (b.state === 'storageFull' && def.produces) {
    const g = def.produces;
    const sell = `Verkaufe ${GOODS[g].name} am Kontor`;
    const c = consumerOf(g);
    if (c && buildLock(w, c) === null) return `${sell} oder baue ${nk(c)}`; // gesperrter Abnehmer: kein Zusatz (S11)
    if (Object.values(TIERS).some((t) => g in t.needs))
      return `${sell} oder baue weitere Wohnhäuser`;
    return sell;
  }
  return null;
}

/** Eine Legendenzeile der Kartenzeichen; `color` nur, wo das Zeichen eine feste Farbe aus `PALETTE` hat. */
export interface MapSign {
  sign: string;
  renderer: string;
  meaning: string;
  color: string | null;
}

/** Legende der Kartenzeichen, Reihenfolge der Spec-Tabelle L5. */
export const MAP_SIGNS: readonly MapSign[] = [
  {
    sign: 'Roter Punkt über Betrieb',
    renderer: 'drawUnconnected',
    meaning: 'nicht mit dem Kontor verbunden: Weg (R) bauen',
    color: PALETTE.signalRed,
  },
  {
    sign: 'Weisses Abzeichen, brauner Wegweiser',
    renderer: 'drawNeedSymbols, sign',
    meaning: 'Wohnhaus ohne Versorgung (Kontor/Markt zu weit)',
    color: null,
  },
  {
    sign: 'Weisses Abzeichen, Kreis in Gutfarbe',
    renderer: 'good, GOOD_COLORS',
    meaning: 'dem Wohnhaus fehlt dieses Gut',
    color: null,
  },
  {
    sign: 'Abzeichen mit gelber Glocke, blauem Buch bzw. türkiser Badewanne mit Dampf',
    renderer: 'bell, book bzw. bath',
    meaning: 'Kapelle, Schule bzw. Badehaus fehlt in Reichweite',
    color: null,
  },
  {
    sign: 'Kleiner roter Zusatzpunkt am Abzeichen',
    renderer: 'EXTRA_DOT',
    meaning: 'es fehlt noch mehr — Haus anklicken',
    color: null,
  },
  {
    sign: 'Pulsierender oranger Ring, Gebäude abgedunkelt',
    renderer: 'drawWarnRing, DIM_FIRE',
    meaning: 'Gebäude brennt und fällt aus',
    color: PALETTE.signalWarn,
  },
  {
    sign: 'Goldmünze über dem Kontor',
    renderer: 'drawBoomCoin',
    meaning: 'Boom: ein Gut verkauft sich teurer',
    color: null,
  },
  {
    sign: 'Gelber Umriss',
    renderer: 'Auswahl',
    meaning: 'ausgewähltes Gebäude',
    color: PALETTE.signalYellow,
  },
  {
    sign: 'Grüne / rote Fläche beim Bauen; rote beim Abreissen',
    renderer: 'HOVER_OK / HOVER_BAD',
    meaning: 'baubar / nicht baubar; wird abgerissen',
    color: PALETTE.signalOk,
  },
  {
    sign: 'Gestrichelter weisser Kreis, helle Felder',
    renderer: 'drawPlacementOverlay',
    meaning: 'Reichweite bzw. Standortfelder',
    color: null,
  },
  {
    sign: 'Weisse Umrisslinie',
    renderer: 'drawPlacementOverlay, coverage',
    meaning: 'schon versorgte bzw. geschützte Fläche',
    color: null,
  },
];

/** Renderer-Schlüssel der Legendenzeilen für Brand und Sturm (Kann K4). */
const CRISIS_SIGNS: readonly string[] = ['drawWarnRing, DIM_FIRE'];

/** Legende der Kartenzeichen; Brand- und Sturmzeilen erst ab der ersten Krisenperiode (Spec 11.10). */
export function mapSigns(world: World): readonly MapSign[] {
  return crisisLogVisible(world)
    ? MAP_SIGNS
    : MAP_SIGNS.filter((s) => !CRISIS_SIGNS.includes(s.renderer));
}
