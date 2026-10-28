import { serviceRadiusOf } from './council';
import { GOODS } from './defs/goods';
import { LEVELS, WORKFORCE_RADIUS, type LevelDef } from './defs/levels';
import { MINUTE_MS, TICK_MS, UPKEEP_INTERVAL } from './defs/timing';
import { buildingUpkeep, upkeepOf } from './levels';
import { runningLevel, siteAt, workforceAt, type SiteInfo } from './levelRules';
import type { Building, BuildingDefId, GoodId, Tier, World } from './types';
import { functionLock } from './unlocks';
import { islandOf } from './world';

/**
 * Ausbau-Checkliste und Chip-Texte aus einer Textquelle (Spec R7, R9, Anhang 02 N3 und N5).
 * Alle Abfragen sind rein: sie lesen die Welt und schreiben nichts. Die Texte sind Anzeige, keine Spielwerte.
 */

export type LevelCheckId =
  'knowledge' | 'burning' | 'workforce' | 'site' | 'money' | 'wood' | 'tools' | 'stone' | 'extra';

/**
 * Richtung von ok/have/need je Zeile:
 * Geld und Baustoffe (money, wood, tools, stone, extra): ok = have >= need (Kasse bzw. Lager gegen Preis).
 * Fachkräfte: have = Abstand des nächsten passenden Hauses (0 ohne eines), need = Arbeitsweg; ok = have <= need, ohne Haus ✗.
 * Standort Gelände (Wald, Gras, Fels): ok = have >= need (gezählte Kacheln gegen Mindestzahl).
 * Standort Fischgrund: ok = have <= need (andere Hütten gegen erlaubte Zahl).
 * Standort Feuerwache: have 1 mit Wache, sonst 0; need 1, bei Krisen aus 0.
 * Wissen: have/need 1 oder 0; Brand: immer ✗, 0 / 0.
 */
export interface LevelCheck {
  id: LevelCheckId;
  ok: boolean;
  have: number;
  need: number;
  text: string;
}

/** Wortwahl je Fachkräfte-Stufe: Berufsname und Haus. */
const CREW: Readonly<Record<Tier, { who: string; house: string }>> = {
  1: { who: 'Pioniere', house: 'Pionierhaus' },
  2: { who: 'Handwerker', house: 'Siedlerhaus' },
  3: { who: 'Meister', house: 'Bürgerhaus' },
  4: { who: 'Verleger', house: 'Kaufmannshaus' },
};

/** Ofen-Wort je Betriebstyp für die Feuerwachen-Zeile. */
const OVEN: Readonly<Partial<Record<BuildingDefId, string>>> = {
  distillery: 'Brennofen',
  toolmaker: 'Esse',
  glassworks: 'Schmelzofen',
};

const DURABLE: readonly LevelCheckId[] = ['workforce', 'site'];

const defOf = (b: Building, level: number): LevelDef | undefined => LEVELS[b.defId]?.[level - 2];

function knowledgeLine(world: World, level: number): LevelCheck {
  const lock = functionLock(world, level === 2 ? 'upgrade2' : 'upgrade3');
  return lock === null
    ? { id: 'knowledge', ok: true, have: 1, need: 1, text: `Wissen: Ausbau Stufe ${level} bekannt` }
    : { id: 'knowledge', ok: false, have: 0, need: 1, text: lock };
}

function workforceLine(world: World, b: Building, level: number): LevelCheck {
  const info = workforceAt(world, b, level);
  const { who, house } = CREW[info.tier];
  const near = info.nearest === null ? null : `nächstes ${info.nearest} Felder`;
  const base = {
    id: 'workforce',
    ok: info.ok,
    have: info.nearest ?? 0,
    need: WORKFORCE_RADIUS,
  } as const;
  if (info.ok) return { ...base, text: `${who} im Umkreis ${WORKFORCE_RADIUS}: ${house}, ${near}` };
  const why =
    near !== null
      ? `${house} nötig, ${near}`
      : info.otherIsland
        ? `${house} nur auf anderer Insel`
        : `kein ${house} auf dieser Insel`;
  return { ...base, text: `Keine ${who} im Umkreis ${WORKFORCE_RADIUS} (${why})` };
}

function stationText(world: World, b: Building, info: SiteInfo): string {
  const r = serviceRadiusOf(world, 'firestation') ?? 0;
  if (world.crisisLevel === 'off') return 'Feuerwache: nicht nötig (Krisen aus)';
  return info.ok
    ? `Feuerwache in Reichweite ${r}`
    : `Keine Feuerwache in Reichweite ${r} (${OVEN[b.defId] ?? 'Ofen'})`;
}

function siteText(world: World, b: Building, level: number, info: SiteInfo): string {
  const site = defOf(b, level)!.site!;
  const { have, need, ok } = info;
  switch (site.kind) {
    case 'fisherSpacing': {
      const huts = have === 1 ? 'Fischerhütte' : 'Fischerhütten';
      return ok
        ? `Fischgrund: ${have} andere ${huts} im Umkreis ${site.radius} (erlaubt ${need})`
        : `Fischgrund überfischt: ${have} andere ${huts} im Umkreis ${site.radius} (erlaubt ${need})`;
    }
    case 'freeTerrain': {
      const [label, tiles] =
        site.terrain === 'forest' ? ['Wald', 'freie Waldfelder'] : ['Weide', 'freie Grasfelder'];
      return `${ok ? '' : 'Zu wenig '}${label}: ${have} ${tiles} im Umkreis ${site.radius} (nötig ${need})`;
    }
    case 'terrainNear':
      return `${ok ? '' : 'Zu wenig '}Fels: ${have} Gebirgsfelder im Umkreis ${site.radius} (nötig ${need})`;
    case 'fireStation':
      return stationText(world, b, info);
  }
}

function siteLine(world: World, b: Building, level: number): LevelCheck | null {
  const info = siteAt(world, b, level);
  if (info === null) return null;
  const { ok, have, need } = info;
  return { id: 'site', ok, have, need, text: siteText(world, b, level, info) };
}

function supplyLine(
  id: LevelCheckId,
  name: string,
  have: number,
  need: number,
  where: string,
): LevelCheck {
  const ok = have >= need;
  return {
    id,
    ok,
    have,
    need,
    text: ok ? `${name} ${need} (${where} ${have})` : `Zu wenig ${name} (${have} / ${need})`,
  };
}

function supplyLines(world: World, b: Building, def: LevelDef): LevelCheck[] {
  const stock = islandOf(world, b).stock;
  const out: LevelCheck[] = [supplyLine('money', 'Geld', world.money, def.cost.money, 'Kasse')];
  const goods: [LevelCheckId, GoodId, number][] = [
    ['wood', 'wood', def.cost.wood],
    ['tools', 'tools', def.cost.tools],
    ['stone', 'stone', def.cost.stone],
  ];
  for (const [id, good, need] of goods)
    if (need > 0) out.push(supplyLine(id, GOODS[good].name, stock[good], need, 'Lager'));
  if (def.extra !== undefined)
    out.push(
      supplyLine(
        'extra',
        GOODS[def.extra.good].name,
        stock[def.extra.good],
        def.extra.amount,
        'Lager',
      ),
    );
  return out;
}

/** Zeilen für den Ausbau auf `level` (= g + 1) in R7-Ordnung (N3). [] ohne LEVELS-Eintrag oder bei level > Höchststufe. */
export function levelChecks(world: World, b: Building, level: number): LevelCheck[] {
  const def = defOf(b, level);
  if (def === undefined) return [];
  const out: LevelCheck[] = [knowledgeLine(world, level)];
  if (b.outageUntil !== undefined)
    out.push({ id: 'burning', ok: false, have: 0, need: 0, text: 'Gebäude brennt' });
  out.push(workforceLine(world, b, level));
  const site = siteLine(world, b, level);
  if (site !== null) out.push(site);
  return [...out, ...supplyLines(world, b, def)];
}

/** Verletzte Dauerzeilen (Fachkräfte, Standort) der Stufe `level`. */
const violated = (world: World, b: Building, level: number): string[] =>
  levelChecks(world, b, level)
    .filter((c) => !c.ok && DURABLE.includes(c.id))
    .map((c) => c.text);

const showsChip = (world: World, b: Building): boolean =>
  b.paused !== true && b.outageUntil === undefined && runningLevel(world, b) < (b.level ?? 1);

/** Chip bei k < g: «Läuft wie Stufe k: <✗-Text der ersten verletzten Dauerzeile der Stufe k + 1>»; null bei k = g, paused oder brennend. */
export function levelChipText(world: World, b: Building): string | null {
  if (!showsChip(world, b)) return null;
  const k = runningLevel(world, b);
  const first = violated(world, b, k + 1)[0];
  return first === undefined ? null : `Läuft wie Stufe ${k}: ${first}`;
}

/** Unterhalt je Minute wie im Panel (eine Nachkommastelle). */
const perMin = (amount: number): number =>
  Math.round(((amount * MINUTE_MS) / (UPKEEP_INTERVAL * TICK_MS)) * 10) / 10;

/** Tooltip des Chips: alle verletzten Dauerzeilen der Stufen k + 1 … g, dann die Unterhaltszeile. */
export function levelChipDetail(world: World, b: Building): string[] {
  if (!showsChip(world, b)) return [];
  const out: string[] = [];
  for (let j = runningLevel(world, b) + 1; j <= (b.level ?? 1); j++)
    out.push(...violated(world, b, j));
  out.push(
    `Unterhalt ${perMin(buildingUpkeep(world, b))} statt ${perMin(upkeepOf(b))} (gedrosselt)`,
  );
  return out;
}
