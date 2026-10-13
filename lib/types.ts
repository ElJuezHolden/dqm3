// Forma de public/data/dqm3.json (lo genera scripts/sync.mjs).
export type Stat6 = [number, number, number, number, number, number];

export interface Family { id: number; slug: string; name: string; jp: string; order: number; bonus: Stat6 }
export interface Rank { id: number; name: string }
export interface Named { id: number; name: string; slug: string }

export interface Monster {
  id: number;
  num: number | null;
  slug: string;
  name: string;
  jp: string | null;
  fr: string | null;
  family: number;
  rank: number;
  stars: Stat6;
  max: Stat6;
  /** Resistencias en el orden de los tipos de daño (id 1 → índice 0). */
  res: number[];
  egg: string | null;
  trivia: string | null;
  /** [talento, "P" principal | "W" solo salvaje] */
  talents: [number, "P" | "W"][];
  /** [rasgo, "S" pequeño | "L" grande, nivel] */
  traits: [number, "S" | "L", number][];
  /** [lugar, estación, clima, minijefe 0/1] */
  locations: [number, number, number, number][];
  /** [objeto, rareza] */
  items: [number, string][];
}

/** p = dos padres; g = cuatro abuelos. Ids < 100 son "familia + rango" genéricos. */
export type Recipe = { r: number; p: [number, number]; g?: undefined } | { r: number; g: [number, number, number, number]; p?: undefined };

export interface Talent {
  id: number;
  slug: string;
  name: string;
  jp: string | null;
  eggOnly: boolean;
  bonus: Stat6;
  skills: [number, number][];
  traits: [number, number][];
  monsters: [number, "P" | "W"][];
  parents: number[][];
  hasSkills: boolean;
}

export interface Skill {
  id: number;
  slug: string;
  name: string;
  jp: string | null;
  desc: string;
  type: string;
  typeSlug: string;
  target: string | null;
  mp: number | null;
  mpType: string | null;
  damageTypes: number[];
  attackType: string | null;
  statEffect: string | null;
  damageFamily: string | null;
  damageLevel: string | null;
  calc: string | null;
  power: number | null;
  wmin: number | null; wmax: number | null; dmin: number | null; dmax: number | null;
  hmin: number | null; hmax: number | null; mag: number | null;
  scmin: number | null; scmax: number | null;
  notes: string | null;
  talents: [number, number][];
  /** [monstruo, puntos, talento] */
  monsters: [number, number, number][];
}

export interface Trait {
  id: number;
  slug: string;
  name: string;
  jp: string | null;
  desc: string;
  notes: string | null;
  stat: Stat6;
  /** [tipo de daño, +resistencia] */
  res: [number, number][];
  isStat: boolean;
  talents: [number, number][];
  talentMonsters: [number, number, number][];
  /** [monstruo, S/L, nivel] */
  monsters: [number, "S" | "L", number][];
}

export interface TraitEffect { trait: number; damageType: number | null; family: number | null; damage: boolean; resist: boolean; self: boolean; value: number }

export interface Item {
  id: number;
  slug: string;
  name: string;
  desc: string;
  type: string;
  buy: number | null;
  sell: number | null;
  notes: string | null;
  stats: Stat6;
  traits: number[];
  monsters: [number, string][];
}

export interface Place {
  id: number;
  slug: string;
  name: string;
  jp: string | null;
  eggs: boolean;
  map: { w: number; h: number } | null;
  monsters: number[];
  talents: [number, number][];
  /** [x 0–1, y 0–1, estaciones] */
  eggSpots: [number, number, number[]][];
  metalSpots: [number, number, "Metal" | "Liquid" | "King", number[]][];
}

export interface RawData {
  meta: { syncedAt: string; source: string };
  families: Family[];
  ranks: Rank[];
  seasons: Named[];
  weather: Named[];
  damageTypes: Named[];
  monsters: Monster[];
  recipes: Recipe[];
  talents: Talent[];
  skills: Skill[];
  traits: Trait[];
  traitEffects: TraitEffect[];
  items: Item[];
  locations: Place[];
}
