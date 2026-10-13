"use client";
import { useEffect, useState } from "react";
import { withBase } from "./paths";
import type { Family, Item, Monster, Named, Place, RawData, Recipe, Skill, Talent, Trait } from "./types";

export interface DB extends RawData {
  monster: Map<number, Monster>;
  monsterBySlug: Map<string, Monster>;
  family: Map<number, Family>;
  talent: Map<number, Talent>;
  talentBySlug: Map<string, Talent>;
  skill: Map<number, Skill>;
  skillBySlug: Map<string, Skill>;
  trait: Map<number, Trait>;
  traitBySlug: Map<string, Trait>;
  item: Map<number, Item>;
  itemBySlug: Map<string, Item>;
  place: Map<number, Place>;
  placeBySlug: Map<string, Place>;
  season: Map<number, Named>;
  weatherById: Map<number, Named>;
  damageType: Map<number, Named>;
  /** Recetas que producen cada monstruo. */
  recipesOf: Map<number, Recipe[]>;
  /** Recetas en las que aparece cada id (monstruo o genérico) como padre/abuelo. */
  usedIn: Map<number, Recipe[]>;
  /** Monstruos ordenados por número (los sin número al final). */
  ordered: Monster[];
  /** Posición [columna, fila] de cada monstruo en el sprite de 75×75. */
  sprite: Record<string, [number, number]>;
}

const byKey = <T, K>(list: T[], key: (t: T) => K) => new Map(list.map((t) => [key(t), t]));

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const arr = m.get(k);
  if (arr) { if (!arr.includes(v)) arr.push(v); } else m.set(k, [v]);
}

function build(raw: RawData, sprite: Record<string, [number, number]>): DB {
  const recipesOf = new Map<number, Recipe[]>();
  const usedIn = new Map<number, Recipe[]>();
  for (const r of raw.recipes) {
    push(recipesOf, r.r, r);
    for (const id of r.p ?? r.g) push(usedIn, id, r);
  }
  return {
    ...raw,
    monster: byKey(raw.monsters, (m) => m.id),
    monsterBySlug: byKey(raw.monsters, (m) => m.slug),
    family: byKey(raw.families, (f) => f.id),
    talent: byKey(raw.talents, (t) => t.id),
    talentBySlug: byKey(raw.talents, (t) => t.slug),
    skill: byKey(raw.skills, (s) => s.id),
    skillBySlug: byKey(raw.skills, (s) => s.slug),
    trait: byKey(raw.traits, (t) => t.id),
    traitBySlug: byKey(raw.traits, (t) => t.slug),
    item: byKey(raw.items, (i) => i.id),
    itemBySlug: byKey(raw.items, (i) => i.slug),
    place: byKey(raw.locations, (l) => l.id),
    placeBySlug: byKey(raw.locations, (l) => l.slug),
    season: byKey(raw.seasons, (s) => s.id),
    weatherById: byKey(raw.weather, (w) => w.id),
    damageType: byKey(raw.damageTypes, (d) => d.id),
    recipesOf,
    usedIn,
    ordered: raw.monsters,
    sprite,
  };
}

let cache: DB | null = null;
let pending: Promise<DB> | null = null;

export function loadData(): Promise<DB> {
  if (cache) return Promise.resolve(cache);
  pending ??= Promise.all([
    fetch(withBase("/data/dqm3.json")).then((r) => r.json() as Promise<RawData>),
    fetch(withBase("/data/sprites.json")).then((r) => r.json() as Promise<Record<string, [number, number]>>),
  ]).then(([raw, sprite]) => (cache = build(raw, sprite)));
  return pending;
}

/** Devuelve la base de datos (null mientras carga). Se descarga una sola vez por sesión. */
export function useData(): DB | null {
  const [db, setDb] = useState<DB | null>(cache);
  useEffect(() => {
    if (!db) loadData().then(setDb);
  }, [db]);
  return db;
}

/** Ids < 100: familia × 10 + rango (0 = cualquier rango). */
export const isGeneric = (id: number) => id < 100;
export const genericFamily = (id: number) => Math.floor(id / 10);
export const genericRank = (id: number) => id % 10;
