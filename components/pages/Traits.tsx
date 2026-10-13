"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { DB } from "@/lib/data";
import { DAMAGE_ES, STATS } from "@/lib/labels";
import type { Trait } from "@/lib/types";
import { useQueryState } from "@/lib/useQueryState";
import { norm } from "../Picker";
import { DtIcon, Empty, NotFound, PageHeader, Section, Sprite, WithData } from "../ui";

export function TraitList() {
  return <WithData>{(db) => <List db={db} />}</WithData>;
}

function List({ db }: { db: DB }) {
  const { get, set } = useQueryState();
  const q = get("q");
  const hideStat = get("ns") === "1";
  const kind = get("k"); // native | talent | res
  const list = useMemo(() => {
    const t = norm(q.trim());
    return db.traits.filter((x) =>
      (!hideStat || !x.isStat) &&
      (kind !== "native" || x.monsters.length) &&
      (kind !== "talent" || x.talents.length) &&
      (kind !== "res" || x.res.length) &&
      (!t || norm(`${x.name} ${x.jp ?? ""} ${x.desc}`).includes(t)));
  }, [db, q, hideStat, kind]);

  return (
    <>
      <PageHeader title="Rasgos" subtitle={`${db.traits.length} rasgos: pasivas que vienen con el monstruo (según tamaño y nivel) o que se desbloquean con talentos.`} />
      <div className="card mb-5 flex flex-wrap items-center gap-2 p-4">
        <input className="input max-w-sm flex-1" placeholder="Nombre o efecto (p. ej. «crítico», «fuego»)…" value={q} onChange={(e) => set({ q: e.target.value })} />
        {[["", "Todos"], ["native", "Innatos de monstruo"], ["talent", "De talentos"], ["res", "Dan resistencias"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => set({ k })} className={`chip ${kind === k ? "chip-on" : ""}`}>{l}</button>
        ))}
        <label className="chip cursor-pointer"><input type="checkbox" checked={hideStat} onChange={(e) => set({ ns: e.target.checked })} /> Ocultar «+stat»</label>
      </div>
      <p className="mb-3 text-sm text-muted">{list.length} rasgos</p>
      <div className="card max-h-[75vh] overflow-auto">
        <table className="data">
          <thead><tr><th>Rasgo</th><th>Efecto</th><th className="num">Monstruos</th><th className="num">Talentos</th></tr></thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td className="whitespace-nowrap"><Link href={`/rasgos/${t.slug}`} className="link font-medium">{t.name}</Link></td>
                <td className="min-w-64 text-sm text-muted">{t.desc}</td>
                <td className="num">{t.monsters.length || "—"}</td>
                <td className="num">{t.talents.length || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function TraitDetail({ slug }: { slug: string }) {
  return (
    <WithData>
      {(db) => {
        const t = db.traitBySlug.get(slug);
        return t ? <Detail db={db} t={t} /> : <NotFound what="rasgo" />;
      }}
    </WithData>
  );
}

function Detail({ db, t }: { db: DB; t: Trait }) {
  const items = db.items.filter((i) => i.traits.includes(t.id));
  const groups: ["S" | "L", string][] = [["S", "Pequeño"], ["L", "Grande"]];
  return (
    <div className="space-y-5">
      <Link href="/rasgos" className="link text-sm">← Rasgos</Link>
      <PageHeader title={t.name} subtitle={<>{t.jp && <>{t.jp} · </>}{t.desc}</>} />
      {(t.notes || t.res.length > 0 || t.stat.some(Boolean) || items.length > 0) && (
        <Section title="Efectos">
          <div className="flex flex-wrap gap-1.5">
            {t.stat.map((v, i) => (v ? <span key={i} className="chip">{STATS[i]} +{v}</span> : null))}
            {t.res.map(([dt, v]) => <span key={dt} className="chip"><DtIcon id={dt} size={14} /> {DAMAGE_ES[dt]} {v > 0 ? "+" : ""}{v} % resistencia</span>)}
            {items.map((i) => <Link key={i.id} href={`/objetos/${i.slug}`} className="chip hover:border-gold">🎒 Lo da {i.name}</Link>)}
          </div>
          {t.notes && <p className="mt-3 rounded-lg bg-bg-2 p-3 text-sm text-muted">📝 {t.notes}</p>}
        </Section>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title={`Innato en (${t.monsters.length})`}>
          {t.monsters.length === 0 ? <Empty>Ningún monstruo lo trae de serie.</Empty> : (
            <div className="space-y-3">
              {groups.map(([size, label]) => {
                const list = t.monsters.filter(([, s]) => s === size).sort((a, b) => a[2] - b[2]);
                if (!list.length) return null;
                return (
                  <div key={size}>
                    <div className="label mb-1.5">{label}</div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1.5">
                      {list.map(([mid, , lv]) => {
                        const m = db.monster.get(mid);
                        return m ? (
                          <Link key={mid + size} href={`/monstruos/${m.slug}`} className="flex items-center gap-2 rounded-lg bg-bg-2 p-1.5 text-sm hover:text-gold-2">
                            <Sprite db={db} slug={m.slug} size={32} />
                            <span className="min-w-0 flex-1 truncate">{m.name}</span>
                            <span className="text-[11px] text-muted">Nv {lv}</span>
                          </Link>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
        <Section title={`Con talentos (${t.talents.length})`}>
          {t.talents.length === 0 ? <Empty>No lo da ningún talento.</Empty> : (
            <div className="space-y-2">
              {t.talents.map(([tid, pts]) => {
                const tal = db.talent.get(tid);
                if (!tal) return null;
                const mons = t.talentMonsters.filter(([, , x]) => x === tid);
                return (
                  <div key={tid} className="rounded-xl bg-bg-2 p-3">
                    <div className="flex items-center justify-between">
                      <Link href={`/talentos/${tal.slug}`} className="link font-semibold">{tal.name}</Link>
                      <span className="text-sm text-gold-2">{pts} puntos</span>
                    </div>
                    {mons.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mons.map(([mid]) => { const m = db.monster.get(mid); return m ? <Link key={mid} href={`/monstruos/${m.slug}`} title={m.name}><Sprite db={db} slug={m.slug} size={30} /></Link> : null; })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
      <p className="text-xs text-muted">Los monstruos grandes desbloquean 3 rasgos de inicio y otro a nivel 60.</p>
    </div>
  );
}
