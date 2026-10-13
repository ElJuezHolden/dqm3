"use client";
import Link from "next/link";
import { useState } from "react";
import { isGeneric, type DB } from "@/lib/data";
import type { Recipe } from "@/lib/types";
import { useQueryState } from "@/lib/useQueryState";
import { monsterOptions } from "../options";
import { Picker } from "../Picker";
import { Empty, FamilyTag, PageHeader, RankBadge, Section, Sprite, WithData } from "../ui";
import { RecipeRow } from "./MonsterDetail";

export function SynthesisTree() {
  return <WithData>{(db) => <Tree db={db} />}</WithData>;
}

function Tree({ db }: { db: DB }) {
  const { get, set } = useQueryState();
  const m = db.monsterBySlug.get(get("m")) ?? null;
  const pick = (id: number | null) => {
    const x = id != null ? db.monster.get(id) : null;
    set({ m: x?.slug ?? null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <PageHeader title="Árbol de síntesis" subtitle="Elige un monstruo y despliega sus padres hasta llegar a monstruos que puedas capturar. Pulsa cualquier monstruo para saltar a su árbol." />
      <div className="card mb-5 p-4">
        <Picker options={monsterOptions(db)} value={m?.id ?? null} onChange={pick} placeholder="Elige un monstruo…" />
      </div>
      {!m ? (
        <Empty>Elige un monstruo para ver cómo se crea y en qué recetas aparece.</Empty>
      ) : (
        <div className="space-y-5">
          <div className="card flex flex-wrap items-center gap-4 p-4">
            <Sprite db={db} slug={m.slug} size={80} />
            <div className="flex-1">
              <h2 className="h-title text-2xl font-bold">{m.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm"><RankBadge db={db} rank={m.rank} /> <FamilyTag db={db} id={m.family} /></div>
            </div>
            <Link href={`/monstruos/${m.slug}`} className="btn">Ver ficha →</Link>
          </div>
          <Section title="Cómo se crea">
            <TreeLevel db={db} id={m.id} onPick={pick} depth={0} />
          </Section>
          <Section title={`Para qué sirve`}>
            <UsedIn db={db} id={m.id} onPick={pick} />
          </Section>
        </div>
      )}
    </>
  );
}

/** Recetas de un monstruo; cada padre se puede desplegar a su vez (árbol recursivo bajo demanda). */
function TreeLevel({ db, id, onPick, depth }: { db: DB; id: number; onPick: (id: number) => void; depth: number }) {
  const recipes = db.recipesOf.get(id) ?? [];
  const [sel, setSel] = useState(0);
  const m = db.monster.get(id);
  if (!recipes.length) {
    return (
      <p className="text-sm text-muted">
        {m?.locations.length ? "🎯 Se captura en el mapa." : m?.egg ? "🥚 Sale de huevos." : "Sin receta conocida."}
      </p>
    );
  }
  const r = recipes[Math.min(sel, recipes.length - 1)];
  return (
    <div className="space-y-3">
      {recipes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {recipes.map((_, i) => (
            <button key={i} type="button" onClick={() => setSel(i)} className={`chip ${i === sel ? "chip-on" : ""}`}>Receta {i + 1}</button>
          ))}
        </div>
      )}
      <RecipeBranches db={db} r={r} onPick={onPick} depth={depth} />
    </div>
  );
}

function RecipeBranches({ db, r, onPick, depth }: { db: DB; r: Recipe; onPick: (id: number) => void; depth: number }) {
  const ids = (r.p ?? r.g) as number[];
  return (
    <div>
      <RecipeRow db={db} r={r} onPick={onPick} />
      {r.g && <p className="mt-1 text-center text-xs text-muted">Síntesis cuádruple: primero se fusionan las dos parejas y luego los dos resultados.</p>}
      <div className={`mt-2 grid gap-2 ${ids.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}>
        {ids.map((pid, i) => <Branch key={i} db={db} id={pid} onPick={onPick} depth={depth + 1} />)}
      </div>
    </div>
  );
}

function Branch({ db, id, onPick, depth }: { db: DB; id: number; onPick: (id: number) => void; depth: number }) {
  const [open, setOpen] = useState(false);
  if (isGeneric(id)) return null;
  const m = db.monster.get(id);
  if (!m) return null;
  const has = (db.recipesOf.get(id) ?? []).length > 0;
  return (
    <div className="rounded-xl border border-line p-2" style={{ background: `color-mix(in srgb, var(--panel) ${Math.max(40, 90 - depth * 12)}%, var(--bg))` }}>
      <button type="button" onClick={() => setOpen(!open)} disabled={!has} className="flex w-full items-center gap-2 text-left text-sm disabled:cursor-default">
        <Sprite db={db} slug={m.slug} size={28} />
        <span className="flex-1 truncate font-medium">{m.name}</span>
        {has ? <span className="text-gold-2">{open ? "▲ ocultar" : "▼ receta"}</span> : <span className="text-xs text-muted">{m.locations.length ? "🎯 captura" : m.egg ? "🥚 huevo" : "—"}</span>}
      </button>
      {open && <div className="fade-in mt-2"><TreeLevel db={db} id={id} onPick={onPick} depth={depth} /></div>}
    </div>
  );
}

function UsedIn({ db, id, onPick }: { db: DB; id: number; onPick: (id: number) => void }) {
  const list = db.usedIn.get(id) ?? [];
  if (!list.length) return <Empty>No aparece por nombre en ninguna receta.</Empty>;
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {list.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1"><RecipeRow db={db} r={r} onPick={onPick} showResult /></div>
        </div>
      ))}
    </div>
  );
}
