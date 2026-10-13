"use client";
import Link from "next/link";
import { useState } from "react";
import { useData, type DB } from "@/lib/data";
import { NAV } from "../nav";
import { FamilyIcon, MonsterTile, RankBadge } from "../ui";
import { FAMILY_ES } from "@/lib/labels";

export function Home() {
  const db = useData();

  return (
    <div className="space-y-8">
      <section className="card relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-blue/15 blur-3xl" />
        <div className="relative max-w-2xl space-y-4">
          <p className="label text-gold-2">Dragon Quest Monsters 3 · The Dark Prince</p>
          <h1 className="h-title text-3xl font-bold leading-tight sm:text-5xl">Todo el juego, a un clic.</h1>
          <p className="text-muted">
            Monstruos, síntesis, talentos, habilidades, rasgos, mapas de huevos y slimes de metal, y calculadoras de stats y daño.
            Todo enlazado: desde cualquier monstruo llegas a sus padres, sus talentos o dónde capturarlo.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/monstruos" className="btn btn-gold">📖 Abrir la Monsterpedia</Link>
            <Link href="/equipo" className="btn">🛡️ Montar un equipo</Link>
            <span className="self-center text-xs text-muted">Pulsa <kbd className="rounded border border-line px-1">Ctrl K</kbd> o <kbd className="rounded border border-line px-1">/</kbd> para buscar lo que sea.</span>
          </div>
          {db && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 text-sm text-muted">
              <span><b className="text-text">{db.monsters.length}</b> monstruos</span>
              <span><b className="text-text">{db.recipes.length}</b> recetas</span>
              <span><b className="text-text">{db.talents.length}</b> talentos</span>
              <span><b className="text-text">{db.skills.length}</b> habilidades</span>
              <span><b className="text-text">{db.traits.length}</b> rasgos</span>
              <span><b className="text-text">{db.items.length}</b> objetos</span>
            </div>
          )}
        </div>
      </section>

      {NAV.map((g) => (
        <section key={g.title}>
          <h2 className="h-title mb-3 text-lg font-semibold">{g.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.items.map((it) => (
              <Link key={it.href} href={it.href} className="card card-hover flex items-start gap-3 p-4">
                <span className="text-2xl" aria-hidden>{it.icon}</span>
                <span>
                  <span className="block font-semibold">{it.label}</span>
                  <span className="block text-sm text-muted">{it.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {db && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div>
            <h2 className="h-title mb-3 text-lg font-semibold">Por familia</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {db.families.map((f) => (
                <Link key={f.id} href={`/monstruos?f=${f.id}`} className="card card-hover flex items-center gap-2 p-3 text-sm">
                  <FamilyIcon slug={f.slug} size={22} /> {FAMILY_ES[f.slug]}
                </Link>
              ))}
            </div>
            <h2 className="h-title mb-3 mt-5 text-lg font-semibold">Por rango</h2>
            <div className="flex flex-wrap gap-2">
              {db.ranks.map((r) => (
                <Link key={r.id} href={`/monstruos?r=${r.id}`} className="card card-hover px-3 py-2"><RankBadge db={db} rank={r.id} className="text-base" /></Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="h-title mb-3 text-lg font-semibold">Descubre</h2>
            <Discover db={db} />
          </div>
        </section>
      )}
    </div>
  );
}

/** Seis monstruos de rango alto al azar (se monta solo en el cliente, tras cargar los datos). */
function Discover({ db }: { db: DB }) {
  const [pick] = useState(() => {
    const ids = db.monsters.filter((m) => m.rank >= 7).map((m) => m.id);
    const out: number[] = [];
    while (out.length < 6 && ids.length) out.push(ids.splice(Math.floor(Math.random() * ids.length), 1)[0]);
    return out;
  });
  return (
    <div className="grid grid-cols-3 gap-2">
      {pick.map((id) => <MonsterTile key={id} db={db} m={db.monster.get(id)!} />)}
    </div>
  );
}
