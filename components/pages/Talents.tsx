"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { DB } from "@/lib/data";
import { STATS_SHORT } from "@/lib/labels";
import type { Talent } from "@/lib/types";
import { useQueryState } from "@/lib/useQueryState";
import { norm } from "../Picker";
import { Empty, MonsterTile, NotFound, PageHeader, Section, Sprite, WithData } from "../ui";

const bonusText = (t: Talent) => t.bonus.map((v, i) => (v ? `${STATS_SHORT[i]} +${v}` : null)).filter(Boolean).join(" · ");

export function TalentList() {
  return <WithData>{(db) => <List db={db} />}</WithData>;
}

function List({ db }: { db: DB }) {
  const { get, set } = useQueryState();
  const q = get("q");
  const hideBoost = get("nb") === "1";
  const kind = get("k"); // egg | skills | traits
  const list = useMemo(() => {
    const t = norm(q.trim());
    return db.talents.filter((x) => {
      if (hideBoost && x.name.includes("Booster")) return false;
      if (kind === "egg" && !x.eggOnly) return false;
      if (kind === "skills" && !x.skills.length) return false;
      if (kind === "traits" && x.skills.length) return false;
      if (!t) return true;
      // También busca dentro de las habilidades y rasgos que da el talento.
      const inner = [...x.skills.map(([id]) => db.skill.get(id)?.name), ...x.traits.map(([id]) => db.trait.get(id)?.name)].join(" ");
      return norm(`${x.name} ${x.jp ?? ""} ${inner}`).includes(t);
    });
  }, [db, q, hideBoost, kind]);

  return (
    <>
      <PageHeader title="Talentos" subtitle={`${db.talents.length} talentos. Cada uno se sube con puntos y va desbloqueando habilidades y rasgos. Busca también por la habilidad o el rasgo que quieres conseguir.`} />
      <div className="card mb-5 flex flex-wrap items-center gap-2 p-4">
        <input className="input max-w-sm flex-1" placeholder="Talento, habilidad o rasgo…" value={q} onChange={(e) => set({ q: e.target.value })} />
        {[["", "Todos"], ["skills", "Con habilidades"], ["traits", "Solo rasgos"], ["egg", "Solo de huevo"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => set({ k })} className={`chip ${kind === k ? "chip-on" : ""}`}>{l}</button>
        ))}
        <label className="chip cursor-pointer"><input type="checkbox" checked={hideBoost} onChange={(e) => set({ nb: e.target.checked })} /> Ocultar «Booster»</label>
      </div>
      <p className="mb-3 text-sm text-muted">{list.length} talentos</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((t) => {
          const prim = t.monsters.filter(([, k]) => k === "P");
          return (
            <Link key={t.id} href={`/talentos/${t.slug}`} className="card card-hover flex flex-col gap-1.5 p-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{t.name}</span>
                {t.eggOnly && <span className="chip text-[10px]">🥚 Huevo</span>}
              </div>
              <div className="text-xs text-muted">
                {t.skills.length} habilidades · {t.traits.length} rasgos{bonusText(t) && <> · {bonusText(t)}</>}
              </div>
              {t.skills.length > 0 && (
                <div className="line-clamp-2 text-xs text-text/80">{t.skills.map(([id]) => db.skill.get(id)?.name).filter(Boolean).join(", ")}</div>
              )}
              {prim.length > 0 && (
                <div className="flex flex-wrap gap-0.5 pt-1">
                  {prim.slice(0, 10).map(([id]) => { const m = db.monster.get(id); return m ? <Sprite key={id} db={db} slug={m.slug} size={24} title={m.name} /> : null; })}
                  {prim.length > 10 && <span className="self-center text-[11px] text-muted">+{prim.length - 10}</span>}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function TalentDetail({ slug }: { slug: string }) {
  return (
    <WithData>
      {(db) => {
        const t = db.talentBySlug.get(slug);
        return t ? <Detail db={db} t={t} /> : <NotFound what="talento" />;
      }}
    </WithData>
  );
}

function Detail({ db, t }: { db: DB; t: Talent }) {
  const rows = [
    ...t.skills.map(([id, pts]) => ({ pts, kind: "skill" as const, x: db.skill.get(id) })),
    ...t.traits.map(([id, pts]) => ({ pts, kind: "trait" as const, x: db.trait.get(id) })),
  ].filter((r) => r.x).sort((a, b) => a.pts - b.pts);
  const primary = t.monsters.filter(([, k]) => k === "P");
  const wild = t.monsters.filter(([, k]) => k === "W");
  const children = db.talents.filter((x) => x.parents.some((g) => g.includes(t.id)));
  const places = db.locations.filter((l) => l.talents.some(([tal]) => tal === t.id));

  return (
    <div className="space-y-5">
      <Link href="/talentos" className="link text-sm">← Talentos</Link>
      <PageHeader title={t.name} subtitle={[t.jp, t.eggOnly ? "Solo se consigue en huevos" : null, bonusText(t) ? `Al completarlo: ${bonusText(t)}` : null].filter(Boolean).join(" · ")} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Section title="Progresión">
          <table className="data">
            <thead><tr><th className="num">Puntos</th><th>Desbloquea</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="num w-16 font-semibold text-gold-2">{r.pts}</td>
                  <td>
                    <Link href={`/${r.kind === "skill" ? "habilidades" : "rasgos"}/${r.x!.slug}`} className="link font-medium">{r.x!.name}</Link>
                    <span className="ml-1.5 text-[11px] text-muted">{r.kind === "skill" ? "habilidad" : "rasgo"}</span>
                    <div className="text-xs text-muted">{r.x!.desc}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <div className="space-y-5">
          {t.parents.length > 0 && (
            <Section title="Se obtiene combinando">
              <ul className="space-y-1.5 text-sm">
                {t.parents.map((g, i) => (
                  <li key={i} className="rounded-lg bg-bg-2 px-3 py-2">
                    {g.map((id, j) => { const p = db.talent.get(id); return <span key={id}>{j > 0 && " + "}{p ? <Link className="link" href={`/talentos/${p.slug}`}>{p.name}</Link> : id}</span>; })}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {children.length > 0 && (
            <Section title="Lleva a">
              <div className="flex flex-wrap gap-1.5">{children.map((c) => <Link key={c.id} href={`/talentos/${c.slug}`} className="chip hover:border-gold">{c.name}</Link>)}</div>
            </Section>
          )}
          {places.length > 0 && (
            <Section title="Monstruos salvajes que lo traen">
              <ul className="space-y-1 text-sm">
                {places.map((l) => l.talents.filter(([tal]) => tal === t.id).map(([, mid]) => {
                  const m = db.monster.get(mid);
                  return (
                    <li key={l.id + "-" + mid} className="flex items-center gap-2">
                      {m && <Sprite db={db} slug={m.slug} size={28} />}
                      {m && <Link className="link" href={`/monstruos/${m.slug}`}>{m.name}</Link>}
                      <span className="text-muted">en</span>
                      <Link className="link" href={`/lugares/${l.slug}`}>{l.name}</Link>
                    </li>
                  );
                }))}
              </ul>
            </Section>
          )}
        </div>
      </div>
      <Section title={`Talento principal de (${primary.length})`}>
        {primary.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
            {primary.map(([id]) => { const m = db.monster.get(id); return m ? <MonsterTile key={id} db={db} m={m} /> : null; })}
          </div>
        ) : <Empty>Ningún monstruo lo tiene como talento principal.</Empty>}
      </Section>
      {wild.length > 0 && (
        <Section title={`Solo en ejemplares salvajes de (${wild.length})`}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
            {wild.map(([id]) => { const m = db.monster.get(id); return m ? <MonsterTile key={id} db={db} m={m} /> : null; })}
          </div>
        </Section>
      )}
    </div>
  );
}
