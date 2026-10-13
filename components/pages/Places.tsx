"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { DB } from "@/lib/data";
import { SEASON_ES } from "@/lib/labels";
import { withBase } from "@/lib/paths";
import type { Place } from "@/lib/types";
import { useQueryState } from "@/lib/useQueryState";
import { MapView } from "../MapView";
import { norm } from "../Picker";
import { Empty, Img, MonsterTile, NotFound, PageHeader, Section, Sprite, WithData } from "../ui";

export function PlaceList() {
  return <WithData>{(db) => <List db={db} />}</WithData>;
}

function List({ db }: { db: DB }) {
  const { get, set } = useQueryState();
  const q = get("q");
  const list = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return db.locations;
    return db.locations.filter((l) => norm(`${l.name} ${l.jp ?? ""} ${l.monsters.map((id) => db.monster.get(id)?.name).join(" ")}`).includes(t));
  }, [db, q]);
  return (
    <>
      <PageHeader title="Lugares" subtitle="Qué monstruos salen en cada zona y qué talentos traen los ejemplares salvajes. Busca también por monstruo." />
      <div className="card mb-5 p-4">
        <input className="input max-w-md" placeholder="Zona o monstruo…" value={q} onChange={(e) => set({ q: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((l) => (
          <Link key={l.id} href={`/lugares/${l.slug}`} className="card card-hover overflow-hidden">
            {l.map && (
              <div className="h-28 overflow-hidden border-b border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={withBase(`/img/maps/${l.slug}.jpg`)} alt="" className="h-full w-full object-cover opacity-80" loading="lazy" />
              </div>
            )}
            <div className="space-y-2 p-3">
              <div>
                <div className="font-semibold">{l.name}</div>
                <div className="text-xs text-muted">
                  {l.monsters.length} monstruos{l.eggSpots.length > 0 && ` · ${l.eggSpots.length} huevos`}{l.metalSpots.length > 0 && ` · ${l.metalSpots.length} metal`}
                </div>
              </div>
              <div className="flex flex-wrap gap-0.5">
                {l.monsters.slice(0, 14).map((id) => { const m = db.monster.get(id); return m ? <Sprite key={id} db={db} slug={m.slug} size={26} title={m.name} /> : null; })}
                {l.monsters.length > 14 && <span className="self-center text-[11px] text-muted">+{l.monsters.length - 14}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function PlaceDetail({ slug }: { slug: string }) {
  return (
    <WithData>
      {(db) => {
        const p = db.placeBySlug.get(slug);
        return p ? <Detail db={db} p={p} /> : <NotFound what="lugar" />;
      }}
    </WithData>
  );
}

function Detail({ db, p }: { db: DB; p: Place }) {
  const mons = p.monsters.map((id) => db.monster.get(id)).filter((m) => !!m).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  return (
    <div className="space-y-5">
      <Link href="/lugares" className="link text-sm">← Lugares</Link>
      <PageHeader title={p.name} subtitle={[p.jp, p.eggs ? "Con huevos" : null].filter(Boolean).join(" · ")}>
        <Link href={`/monstruos?from=${p.id}`} className="btn">🧬 Qué puedo crear desde aquí</Link>
      </PageHeader>
      {p.map && (p.eggSpots.length > 0 || p.metalSpots.length > 0) && (
        <Section title="Mapa"><MapView db={db} place={p} /></Section>
      )}
      <Section title={`Monstruos (${mons.length})`}>
        {mons.length === 0 ? <Empty>Sin datos de monstruos.</Empty> : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
            {mons.map((m) => {
              const here = m.locations.filter(([l]) => l === p.id);
              const seasons = [...new Set(here.map(([, s]) => s))];
              const boss = here.some(([, , , b]) => b);
              const extra = boss ? "👑 Minijefe" : seasons.length === 4 || !seasons.length ? "Todo el año" : seasons.map((s) => SEASON_ES[s]).join(", ");
              return <MonsterTile key={m.id} db={db} m={m} extra={extra} />;
            })}
          </div>
        )}
      </Section>
      {p.talents.length > 0 && (
        <Section title="Talentos de los monstruos salvajes">
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {p.talents.map(([tid, mid], i) => {
              const t = db.talent.get(tid), m = db.monster.get(mid);
              if (!t || !m) return null;
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-bg-2 p-2 text-sm">
                  <Sprite db={db} slug={m.slug} size={30} />
                  <span className="min-w-0">
                    <Link href={`/talentos/${t.slug}`} className="link block truncate font-medium">{t.name}</Link>
                    <Link href={`/monstruos/${m.slug}`} className="block truncate text-xs text-muted hover:text-text">en {m.name}</Link>
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
      <p className="text-xs text-muted"><Img src="/img/weather/sun.png" alt="" size={12} /> Las estaciones y el clima cambian qué monstruos aparecen: mira la ficha de cada uno para el detalle.</p>
    </div>
  );
}
