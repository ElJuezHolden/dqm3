"use client";
import Link from "next/link";
import { genericFamily, genericRank, isGeneric, type DB } from "@/lib/data";
import { FAMILY_ES } from "@/lib/labels";
import type { Recipe } from "@/lib/types";
import { FamilyIcon, RankBadge, RecipeNode, Sprite } from "./ui";

/** Receta grande (árbol de síntesis): nodos con sprite, nombre y rango. */
export function RecipeRow({ db, r, onPick, showResult = false }: { db: DB; r: Recipe; onPick?: (id: number) => void; showResult?: boolean }) {
  const plus = <span className="self-center pb-6 text-xl text-muted">+</span>;
  return (
    <div className="flex flex-wrap items-start justify-center gap-2 rounded-xl bg-bg-2 p-3">
      {r.p ? (
        <>
          <RecipeNode db={db} id={r.p[0]} onPick={onPick} />{plus}<RecipeNode db={db} id={r.p[1]} onPick={onPick} />
        </>
      ) : (
        <>
          <div className="flex items-start gap-1 rounded-lg border border-line p-1.5">
            <RecipeNode db={db} id={r.g[0]} size={40} onPick={onPick} />{plus}<RecipeNode db={db} id={r.g[1]} size={40} onPick={onPick} />
          </div>
          <span className="self-center pb-4 text-xs text-muted">y</span>
          <div className="flex items-start gap-1 rounded-lg border border-line p-1.5">
            <RecipeNode db={db} id={r.g[2]} size={40} onPick={onPick} />{plus}<RecipeNode db={db} id={r.g[3]} size={40} onPick={onPick} />
          </div>
        </>
      )}
      {showResult && (
        <>
          <span className="self-center pb-6 text-xl text-gold">→</span>
          <RecipeNode db={db} id={r.r} onPick={onPick} />
        </>
      )}
    </div>
  );
}

/** Ingrediente en línea: sprite pequeño + nombre (o icono de familia si es genérico). */
export function Ingredient({ db, id, size = 28, strong = false }: { db: DB; id: number; size?: number; strong?: boolean }) {
  if (isGeneric(id)) {
    const f = db.family.get(genericFamily(id));
    const r = genericRank(id);
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-1.5 py-0.5 text-xs text-muted" title="Vale cualquier monstruo de esa familia (y rango)">
        {f && <FamilyIcon slug={f.slug} size={size * 0.6} />}
        <span>Cualquier {f ? FAMILY_ES[f.slug] ?? f.name : "?"}</span>
        {r ? <RankBadge db={db} rank={r} /> : null}
      </span>
    );
  }
  const m = db.monster.get(id);
  if (!m) return null;
  return (
    <Link href={`/monstruos/${m.slug}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-gold-2" title={m.name}>
      <Sprite db={db} slug={m.slug} size={size} />
      <span className={`truncate text-sm ${strong ? "font-semibold" : ""}`}>{m.name}</span>
      <RankBadge db={db} rank={m.rank} />
    </Link>
  );
}

/** Cómo se consigue un monstruo en una línea: su primera receta o "captura/huevo". */
export function HowToGet({ db, id }: { db: DB; id: number }) {
  if (isGeneric(id)) return null;
  const m = db.monster.get(id);
  if (!m) return null;
  const rec = db.recipesOf.get(id)?.[0];
  const where = m.locations.length ? db.place.get(m.locations[0][0]) : null;
  if (where) return <Link href={`/lugares/${where.slug}`} className="text-[11px] text-muted hover:text-text">🎯 Se captura en {where.name}</Link>;
  if (!rec) return <span className="text-[11px] text-muted">{m.egg ? "🥚 Sale de huevo" : "—"}</span>;
  const ids = (rec.p ?? rec.g) as number[];
  return (
    <span className="flex flex-wrap items-center gap-1 text-[11px] text-muted">
      <span>=</span>
      {ids.map((x, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <span>+</span>}
          {isGeneric(x) ? (
            <span>{FAMILY_ES[db.family.get(genericFamily(x))?.slug ?? ""] ?? "?"}</span>
          ) : (
            <Link href={`/monstruos/${db.monster.get(x)?.slug}`} className="inline-flex items-center gap-0.5 hover:text-text">
              <Sprite db={db} slug={db.monster.get(x)?.slug ?? "unknown"} size={16} />
              {db.monster.get(x)?.name}
            </Link>
          )}
        </span>
      ))}
    </span>
  );
}
