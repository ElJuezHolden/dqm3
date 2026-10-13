"use client";
import Link from "next/link";
import { useState } from "react";
import type { DB } from "@/lib/data";
import { FAMILY_ES, STATS } from "@/lib/labels";
import type { Family } from "@/lib/types";
import { FamilyIcon, MonsterTile, NotFound, PageHeader, RankBadge, Section, WithData } from "../ui";

function BonusChips({ f }: { f: Family }) {
  return (
    <div className="flex flex-wrap gap-1">
      {f.bonus.map((b, i) => (b ? <span key={i} className="chip chip-on text-[11px]">▲ {STATS[i]}</span> : null))}
    </div>
  );
}

export function FamilyList() {
  return (
    <WithData>
      {(db) => (
        <>
          <PageHeader title="Familias" subtitle="Cada familia sube 3 stats cuando un monstruo suyo es padre o abuelo en una síntesis. Combinar 4 abuelos de familias distintas da bonus a las 6 stats." />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {db.families.map((f) => {
              const n = db.monsters.filter((m) => m.family === f.id).length;
              return (
                <Link key={f.id} href={`/familias/${f.slug}`} className="card card-hover space-y-2 p-4">
                  <div className="flex items-center gap-3">
                    <FamilyIcon slug={f.slug} size={36} />
                    <div>
                      <div className="h-title text-lg font-semibold">{FAMILY_ES[f.slug]}</div>
                      <div className="text-xs text-muted">{f.name} · {f.jp} · {n} monstruos</div>
                    </div>
                  </div>
                  <BonusChips f={f} />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </WithData>
  );
}

export function FamilyDetail({ slug }: { slug: string }) {
  return (
    <WithData>
      {(db) => {
        const f = db.families.find((x) => x.slug === slug);
        return f ? <Detail db={db} f={f} /> : <NotFound what="familia" />;
      }}
    </WithData>
  );
}

function Detail({ db, f }: { db: DB; f: Family }) {
  const mons = db.monsters.filter((m) => m.family === f.id);
  return (
    <div className="space-y-5">
      <Link href="/familias" className="link text-sm">← Familias</Link>
      <PageHeader icon={<FamilyIcon slug={f.slug} size={44} />} title={`Familia ${FAMILY_ES[f.slug]}`} subtitle={`${f.name} · ${f.jp} · ${mons.length} monstruos`}>
        <Link href={`/monstruos?f=${f.id}&view=table`} className="btn">Ver en tabla comparativa</Link>
      </PageHeader>
      <Section title="Bonus en síntesis"><BonusChips f={f} /></Section>
      {db.ranks.map((r) => {
        const list = mons.filter((m) => m.rank === r.id);
        if (!list.length) return null;
        return (
          <Section key={r.id} title={<span className="flex items-center gap-2">Rango <RankBadge db={db} rank={r.id} className="text-base" /> <span className="text-sm font-normal text-muted">{list.length}</span></span>}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
              {list.map((m) => <MonsterTile key={m.id} db={db} m={m} />)}
            </div>
          </Section>
        );
      })}
    </div>
  );
}

export function RankList() {
  return <WithData>{(db) => <Ranks db={db} />}</WithData>;
}

function Ranks({ db }: { db: DB }) {
  const [rank, setRank] = useState(db.ranks[0].id);
  const list = db.monsters.filter((m) => m.rank === rank);
  return (
    <>
      <PageHeader title="Rangos" subtitle="Del G (más débil) al X. Al sintetizar, el rango del resultado depende de las recetas: suele ser igual o superior al de los padres." />
      <div className="mb-5 flex flex-wrap gap-2">
        {db.ranks.map((r) => {
          const n = db.monsters.filter((m) => m.rank === r.id).length;
          return (
            <button key={r.id} type="button" onClick={() => setRank(r.id)} className={`card card-hover flex items-center gap-2 px-3 py-2 ${rank === r.id ? "ring-2 ring-gold" : ""}`}>
              <RankBadge db={db} rank={r.id} className="text-base" /> <span className="text-sm text-muted">{n}</span>
            </button>
          );
        })}
      </div>
      {db.families.map((f) => {
        const fl = list.filter((m) => m.family === f.id);
        if (!fl.length) return null;
        return (
          <Section key={f.id} className="mb-4" title={<span className="flex items-center gap-2"><FamilyIcon slug={f.slug} /> {FAMILY_ES[f.slug]} <span className="text-sm font-normal text-muted">{fl.length}</span></span>}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
              {fl.map((m) => <MonsterTile key={m.id} db={db} m={m} />)}
            </div>
          </Section>
        );
      })}
    </>
  );
}
