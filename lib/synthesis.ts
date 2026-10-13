import { genericFamily, genericRank, isGeneric, type DB } from "./data";
import type { Monster, Recipe } from "./types";

/** ¿Encaja este monstruo en la casilla de receta? (id exacto o genérico de su familia/rango). */
export function slotAccepts(slot: number, m: Monster): boolean {
  if (slot === m.id) return true;
  if (!isGeneric(slot)) return false;
  const r = genericRank(slot);
  return genericFamily(slot) === m.family && (r === 0 || r === m.rank);
}

export const recipeSlots = (r: Recipe) => (r.p ?? r.g) as number[];

export interface PaddockResult { monster: Monster; pairs: [Monster, Monster][] }

/** Calculadora de corral: qué monstruos nuevos salen combinando dos de los que tienes. */
export function paddockResults(db: DB, owned: number[]): PaddockResult[] {
  const mons = owned.map((id) => db.monster.get(id)).filter((m): m is Monster => !!m);
  const ownedSet = new Set(owned);
  const out = new Map<number, PaddockResult>();
  for (let i = 0; i < mons.length; i++) {
    for (let j = i + 1; j < mons.length; j++) {
      const a = mons[i], b = mons[j];
      for (const r of db.recipes) {
        if (!r.p || ownedSet.has(r.r)) continue;
        const [x, y] = r.p;
        if ((slotAccepts(x, a) && slotAccepts(y, b)) || (slotAccepts(x, b) && slotAccepts(y, a))) {
          const res = db.monster.get(r.r);
          if (!res) continue;
          const entry = out.get(r.r) ?? { monster: res, pairs: [] };
          if (!entry.pairs.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) entry.pairs.push([a, b]);
          out.set(r.r, entry);
        }
      }
    }
  }
  return [...out.values()].sort((p, q) => q.monster.rank - p.monster.rank || p.monster.family - q.monster.family || p.monster.name.localeCompare(q.monster.name));
}

/**
 * Monstruos que se pueden conseguir usando solo lo que se captura en esos lugares
 * (y, si se quiere, huevos y minijefes), encadenando síntesis hasta que no salga nada nuevo.
 */
export function obtainableFrom(db: DB, placeIds: number[], opts: { eggs: boolean; bosses: boolean }): Set<number> {
  const places = new Set(placeIds);
  const canEggs = opts.eggs && placeIds.some((id) => db.place.get(id)?.eggs);
  const got = new Set<number>();
  for (const m of db.monsters) {
    const here = m.locations.filter(([l]) => places.has(l));
    if (here.some(([, , , boss]) => opts.bosses || !boss)) got.add(m.id);
    else if (canEggs && m.egg && m.id !== 635) got.add(m.id);
  }
  const fams = () => {
    const s = new Set<number>();
    for (const id of got) {
      const m = db.monster.get(id)!;
      s.add(m.family * 10);
      s.add(m.family * 10 + m.rank);
    }
    return s;
  };
  let changed = true;
  while (changed) {
    changed = false;
    const generic = fams();
    for (const r of db.recipes) {
      if (got.has(r.r)) continue;
      if (recipeSlots(r).every((s) => (isGeneric(s) ? generic.has(s) : got.has(s)))) {
        got.add(r.r);
        changed = true;
      }
    }
  }
  return got;
}
