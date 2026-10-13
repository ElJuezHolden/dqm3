"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { DB } from "@/lib/data";
import { DAMAGE_ES, SKILL_TYPE_ES, TARGET_ES, tr } from "@/lib/labels";
import type { Skill } from "@/lib/types";
import { useQueryState } from "@/lib/useQueryState";
import { norm } from "../Picker";
import { DtIcon, Empty, Img, NotFound, PageHeader, Section, Sprite, WithData } from "../ui";

const mpText = (s: Skill) => (s.mp == null || s.mp === 0 ? "—" : s.mpType === "percentage" ? `${s.mp} %` : s.mpType === "allwithmin" ? `Todo (mín. 100)` : String(s.mp));
const powerText = (s: Skill) => (s.dmin != null && s.dmax != null ? `${s.dmin}–${s.dmax}` : s.power != null ? String(s.power) : "—");
const hitsText = (s: Skill) => (s.hmin == null ? "—" : s.hmin === s.hmax ? String(s.hmin) : `${s.hmin}–${s.hmax}`);

export function SkillList() {
  return <WithData>{(db) => <List db={db} />}</WithData>;
}

function List({ db }: { db: DB }) {
  const { get, getList, set } = useQueryState();
  const q = get("q");
  const type = get("t");
  const dts = getList("dt");
  const target = get("tg");
  const sort = get("sort") || "name";
  const targets = [...new Set(db.skills.map((s) => s.target).filter(Boolean))] as string[];
  const list = useMemo(() => {
    const t = norm(q.trim());
    const out = db.skills.filter((s) =>
      (!t || norm(`${s.name} ${s.jp ?? ""} ${s.desc}`).includes(t)) &&
      (!type || s.typeSlug === type) &&
      (!dts.length || dts.some((d) => s.damageTypes.includes(d))) &&
      (!target || s.target === target));
    if (sort === "mp") out.sort((a, b) => (b.mp ?? 0) - (a.mp ?? 0));
    if (sort === "power") out.sort((a, b) => (b.dmax ?? b.power ?? 0) - (a.dmax ?? a.power ?? 0));
    return out;
  }, [db, q, type, dts, target, sort]);

  return (
    <>
      <PageHeader title="Habilidades" subtitle={`${db.skills.length} habilidades: hechizos, técnicas de ataque, apoyo y curación.`} />
      <div className="card mb-5 space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <input className="input max-w-sm flex-1" placeholder="Nombre o descripción…" value={q} onChange={(e) => set({ q: e.target.value })} />
          <select className="input w-auto" value={target} onChange={(e) => set({ tg: e.target.value })} aria-label="Objetivo">
            <option value="">Cualquier objetivo</option>
            {targets.map((t) => <option key={t} value={t}>{tr(TARGET_ES, t)}</option>)}
          </select>
          <select className="input w-auto" value={sort} onChange={(e) => set({ sort: e.target.value === "name" ? null : e.target.value })} aria-label="Ordenar">
            <option value="name">Ordenar: nombre</option>
            <option value="power">Ordenar: daño/poder</option>
            <option value="mp">Ordenar: coste PM</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[["", "Todas"], ["attacking", "Ataque"], ["support", "Apoyo"], ["healing", "Curación"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => set({ t: k })} className={`chip ${type === k ? "chip-on" : ""}`}>
              {k && <Img src={`/img/skills/${k}.png`} alt="" size={14} />} {l}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {db.damageTypes.map((d) => (
            <button key={d.id} type="button" title={DAMAGE_ES[d.id]} onClick={() => set({ dt: dts.includes(d.id) ? dts.filter((x) => x !== d.id) : [...dts, d.id] })}
              className={`chip px-2 ${dts.includes(d.id) ? "chip-on" : ""}`}>
              <DtIcon id={d.id} size={16} /> <span className="hidden sm:inline">{DAMAGE_ES[d.id]}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="mb-3 text-sm text-muted">{list.length} habilidades</p>
      <div className="card max-h-[75vh] overflow-auto">
        <table className="data">
          <thead>
            <tr><th>Habilidad</th><th>Tipo</th><th>Objetivo</th><th className="num">PM</th><th className="num">Daño</th><th className="num">Golpes</th><th>Descripción</th></tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-nowrap">
                  <Link href={`/habilidades/${s.slug}`} className="link font-medium">{s.name}</Link>
                  <span className="ml-1.5 inline-flex gap-0.5 align-middle">{s.damageTypes.map((d) => <DtIcon key={d} id={d} size={14} />)}</span>
                </td>
                <td className="whitespace-nowrap"><Img src={`/img/skills/${s.typeSlug}.png`} alt="" size={14} /> {SKILL_TYPE_ES[s.typeSlug] ?? s.type}</td>
                <td className="whitespace-nowrap text-muted">{tr(TARGET_ES, s.target)}</td>
                <td className="num">{mpText(s)}</td>
                <td className="num">{powerText(s)}</td>
                <td className="num">{hitsText(s)}</td>
                <td className="min-w-64 text-xs text-muted">{s.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function SkillDetail({ slug }: { slug: string }) {
  return (
    <WithData>
      {(db) => {
        const s = db.skillBySlug.get(slug);
        return s ? <Detail db={db} s={s} /> : <NotFound what="habilidad" />;
      }}
    </WithData>
  );
}

function Detail({ db, s }: { db: DB; s: Skill }) {
  const facts: [string, string | null][] = [
    ["Tipo", SKILL_TYPE_ES[s.typeSlug] ?? s.type],
    ["Objetivo", tr(TARGET_ES, s.target)],
    ["Coste PM", mpText(s)],
    ["Tipo de ataque", s.attackType],
    ["Cálculo", s.calc],
    ["Poder", s.power != null ? String(s.power) : null],
    ["Daño base", s.dmin != null ? `${s.dmin}–${s.dmax}` : null],
    ["Sabiduría", s.wmin != null ? `${s.wmin}–${s.wmax}` : null],
    ["Golpes", hitsText(s)],
    ["Prob. de estado", s.scmin != null ? `${s.scmin}–${s.scmax} %` : null],
    ["Efecto", s.statEffect],
    ["Nivel de daño", s.damageLevel],
    ["Familia", s.damageFamily],
  ];
  const byTalent = new Map<number, [number, number][]>();
  for (const [mid, pts, tid] of s.monsters) byTalent.set(tid, [...(byTalent.get(tid) ?? []), [mid, pts]]);

  return (
    <div className="space-y-5">
      <Link href="/habilidades" className="link text-sm">← Habilidades</Link>
      <PageHeader
        icon={<Img src={`/img/skills/${s.typeSlug}.png`} alt="" size={36} />}
        title={s.name}
        subtitle={<>{s.jp && <>{s.jp} · </>}{s.desc}</>}
      >
        {s.typeSlug === "attacking" && <Link href={`/calculadoras/dano?s=${s.slug}`} className="btn btn-gold">⚔️ Calcular daño</Link>}
      </PageHeader>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Section title="Datos">
          {s.damageTypes.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">{s.damageTypes.map((d) => <span key={d} className="chip"><DtIcon id={d} size={16} /> {DAMAGE_ES[d]}</span>)}</div>
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {facts.filter(([, v]) => v && v !== "—").map(([k, v]) => (
              <div key={k}><dt className="label">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          {s.notes && <p className="mt-3 rounded-lg bg-bg-2 p-3 text-sm text-muted">📝 {s.notes}</p>}
        </Section>
        <Section title="Talentos que la enseñan">
          {s.talents.length === 0 ? <Empty>Sin datos.</Empty> : (
            <div className="space-y-3">
              {s.talents.map(([tid, pts]) => {
                const t = db.talent.get(tid);
                if (!t) return null;
                const mons = byTalent.get(tid) ?? [];
                return (
                  <div key={tid} className="rounded-xl bg-bg-2 p-3">
                    <div className="flex items-center justify-between">
                      <Link href={`/talentos/${t.slug}`} className="link font-semibold">{t.name}</Link>
                      <span className="text-sm text-gold-2">{pts} puntos</span>
                    </div>
                    {mons.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mons.map(([mid]) => { const m = db.monster.get(mid); return m ? <Link key={mid} href={`/monstruos/${m.slug}`} title={m.name}><Sprite db={db} slug={m.slug} size={32} /></Link> : null; })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
