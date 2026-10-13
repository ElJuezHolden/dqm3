// Cálculo de stats máximos y resistencias de un monstruo "montado" (padres, tamaño, talentos…).
// Fórmulas de la calculadora original de MetalKid:
//   floor(ceil(max × tamaño × táctico) × (1 + nivelesPadres × bonusFamilia × 0,0001))
//   + chispa (100) + extra de tamaño (def/agi) + talentos + accesorio
import type { DB } from "./data";
import type { Monster, Stat6, Trait } from "./types";

export type Sparkle = -1 | 0 | 1 | 2 | 3 | 4 | 5;

export interface Build {
  monster: number | null;
  /** 1–100; a partir de 51 el monstruo es grande. */
  size: number;
  /** Abuelos y padres: id de monstruo (>100) o id de familia (1–8). */
  p1g1: number | null;
  p1g2: number | null;
  p2g1: number | null;
  p2g2: number | null;
  p1: number | null;
  p2: number | null;
  p1Level: number;
  p2Level: number;
  /** Índice de stat con chispa (+100) o -1. */
  sparkle: Sparkle;
  talents: number[];
  accessory: number | null;
}

export const emptyBuild = (monster: number | null = null): Build => ({
  monster, size: 50, p1g1: null, p1g2: null, p2g1: null, p2g2: null, p1: null, p2: null,
  p1Level: 100, p2Level: 100, sparkle: -1, talents: [], accessory: null,
});

export const isLarge = (b: Build) => b.size > 50;

const TACTICAL: Record<string, number> = {
  "tactical-trooper": 0.9, "tactical-commander": 0.8, "tactical-genius": 0.8, "tactical-titan": 0.7,
};

/** Rasgos que tiene el monstruo según su tamaño (los "L" solo si es grande). */
export function activeMonsterTraits(db: DB, m: Monster, large: boolean): Trait[] {
  return m.traits.filter(([, s]) => s === "S" || large).map(([id]) => db.trait.get(id)!).filter(Boolean);
}

export function tacticalFactor(traits: Trait[]): { factor: number; trait: Trait | null } {
  for (const t of traits) if (TACTICAL[t.slug]) return { factor: TACTICAL[t.slug], trait: t };
  return { factor: 1, trait: null };
}

function familyOf(db: DB, id: number | null) {
  if (id == null) return null;
  if (id < 100) return db.family.get(id) ?? null;
  const m = db.monster.get(id);
  return m ? db.family.get(m.family) ?? null : null;
}

export function allDifferentFamilies(db: DB, b: Build) {
  const gps = [b.p1g1, b.p1g2, b.p2g1, b.p2g2];
  if (gps.some((g) => g == null)) return false;
  return new Set(gps.map((g) => familyOf(db, g)?.id)).size === 4;
}

const sizeMul = (i: number, large: boolean) => (large ? (i < 2 ? 1.5 : 1.1) : 1);
/** ceil(max × tamaño × táctico) evitando errores de coma flotante como la web original. */
const scaled = (max: number, size: number, tac: number) => Math.ceil((max * Math.floor(size * 10) * Math.floor(tac * 10)) / 100);
const levelBonus = (raw: number, levels: number, bonus: number) => {
  const v = raw * (1 + levels * bonus * 0.0001);
  return Math.floor(v + 1e-9);
};

export interface BreakdownRow { label: string; values: number[] }

export interface BuildResult {
  monster: Monster;
  large: boolean;
  stats: Stat6;
  breakdown: BreakdownRow[];
  parentBonus: Stat6;
  parentLevels: number;
  differentFamilies: boolean;
  tactical: { factor: number; trait: Trait | null };
  /** Rasgos activos: del monstruo, de talentos y del accesorio. */
  traits: { trait: Trait; source: string }[];
  res: number[];
}

export function computeBuild(db: DB, b: Build): BuildResult | null {
  const m = b.monster == null ? null : db.monster.get(b.monster);
  if (!m) return null;
  const large = isLarge(b);
  const own = activeMonsterTraits(db, m, large);
  const tactical = tacticalFactor(own);
  const parentLevels = (b.p1 != null ? b.p1Level : 0) + (b.p2 != null ? b.p2Level : 0);
  const diff = allDifferentFamilies(db, b);

  const slots: [string, number | null, number][] = [
    ["Abuelo 1-A", b.p1g1, 1], ["Abuelo 1-B", b.p1g2, 1], ["Abuelo 2-A", b.p2g1, 1], ["Abuelo 2-B", b.p2g2, 1],
    ["Padre 1", b.p1, 2], ["Padre 2", b.p2, 2],
  ];
  const parentBonus = [0, 1, 2, 3, 4, 5].map((i) => {
    let t = 0;
    for (const [, id, mult] of slots) t += (familyOf(db, id)?.bonus[i] ?? 0) * mult;
    return t + (diff ? 2 : 0);
  }) as Stat6;

  const talents = b.talents.map((id) => db.talent.get(id)).filter((t) => !!t);
  const acc = b.accessory != null ? db.item.get(b.accessory) : undefined;
  const talentStats = [0, 1, 2, 3, 4, 5].map((i) => talents.reduce((s, t) => s + t.bonus[i], 0));
  const accStats = [0, 1, 2, 3, 4, 5].map((i) => acc?.stats[i] ?? 0);
  const sizeExtra = [0, 0, 0, b.size - 50, 50 - b.size, 0];

  const raw = m.max.map((v, i) => scaled(v, sizeMul(i, large), tactical.factor));
  const stats = raw.map(
    (r, i) => levelBonus(r, parentLevels, parentBonus[i]) + (b.sparkle === i ? 100 : 0) + sizeExtra[i] + talentStats[i] + accStats[i],
  ) as Stat6;

  const contrib = (bonus: number[]) => raw.map((r, i) => Math.floor((r * (1 + parentLevels * bonus[i] * 0.0001) - r) * 10) / 10);
  const breakdown: BreakdownRow[] = [
    { label: "Base del monstruo", values: m.max },
    { label: large ? "Grande / rasgo táctico" : "Rasgo táctico", values: raw.map((r, i) => r - m.max[i]) },
    { label: "Tamaño (def/agi)", values: sizeExtra },
  ];
  for (const [label, id, mult] of slots) {
    const f = familyOf(db, id);
    if (f) breakdown.push({ label, values: contrib(f.bonus.map((x) => x * mult)) });
  }
  if (diff) breakdown.push({ label: "4 familias distintas", values: contrib([2, 2, 2, 2, 2, 2]) });
  if (b.sparkle >= 0) breakdown.push({ label: "Chispa", values: [0, 1, 2, 3, 4, 5].map((i) => (i === b.sparkle ? 100 : 0)) });
  if (talents.length) breakdown.push({ label: "Talentos", values: talentStats });
  if (acc) breakdown.push({ label: "Accesorio", values: accStats });

  // Rasgos y resistencias.
  const traits: { trait: Trait; source: string }[] = own.map((t) => ({ trait: t, source: m.name }));
  const seen = new Set(own.map((t) => t.id));
  for (const t of talents) for (const [id] of t.traits) {
    const tr = db.trait.get(id);
    if (tr && !tr.isStat && !seen.has(id)) { seen.add(id); traits.push({ trait: tr, source: t.name }); }
  }
  if (acc) for (const id of acc.traits) {
    const tr = db.trait.get(id);
    if (tr && !seen.has(id)) { seen.add(id); traits.push({ trait: tr, source: acc.name }); }
  }
  const res = m.res.map((v, i) => v + (large && i + 1 >= 10 ? 50 : 0));
  for (const { trait } of traits) for (const [dt, v] of trait.res) res[dt - 1] += v;

  return { monster: m, large, stats, breakdown, parentBonus, parentLevels, differentFamilies: diff, tactical, traits, res };
}

// Compartir: el equipo se codifica en la URL (#…) como JSON compacto en base64.
const KEYS: (keyof Build)[] = ["monster", "size", "p1g1", "p1g2", "p2g1", "p2g2", "p1", "p2", "p1Level", "p2Level", "sparkle", "talents", "accessory"];
export function encodeBuilds(builds: Build[]): string {
  const json = JSON.stringify(builds.map((b) => KEYS.map((k) => b[k])));
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeBuilds(s: string): Build[] | null {
  try {
    const json = decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
    const arr = JSON.parse(json) as unknown[][];
    return arr.map((row) => Object.fromEntries(KEYS.map((k, i) => [k, row[i]])) as unknown as Build);
  } catch {
    return null;
  }
}
