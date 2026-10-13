"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { DB } from "@/lib/data";
import { ITEM_TYPE_ES, STATS } from "@/lib/labels";
import type { Item } from "@/lib/types";
import { useQueryState } from "@/lib/useQueryState";
import { norm } from "../Picker";
import { Empty, MonsterTile, NotFound, PageHeader, Section, Sprite, WithData } from "../ui";

const rarityEs = (r: string) => (r === "Rare" ? "Raro" : r === "Common" ? "Común" : r);

export function ItemList() {
  return <WithData>{(db) => <List db={db} />}</WithData>;
}

function List({ db }: { db: DB }) {
  const { get, set } = useQueryState();
  const q = get("q");
  const type = get("t");
  const types = [...new Set(db.items.map((i) => i.type))];
  const list = useMemo(() => {
    const t = norm(q.trim());
    return db.items.filter((i) => (!type || i.type === type) && (!t || norm(`${i.name} ${i.desc}`).includes(t)));
  }, [db, q, type]);
  return (
    <>
      <PageHeader title="Objetos" subtitle={`${db.items.length} objetos y accesorios, con su precio y qué monstruos los sueltan.`} />
      <div className="card mb-5 flex flex-wrap items-center gap-2 p-4">
        <input className="input max-w-sm flex-1" placeholder="Nombre o efecto…" value={q} onChange={(e) => set({ q: e.target.value })} />
        <button type="button" onClick={() => set({ t: null })} className={`chip ${!type ? "chip-on" : ""}`}>Todos</button>
        {types.map((t) => <button key={t} type="button" onClick={() => set({ t })} className={`chip ${type === t ? "chip-on" : ""}`}>{ITEM_TYPE_ES[t] ?? t}</button>)}
      </div>
      <p className="mb-3 text-sm text-muted">{list.length} objetos</p>
      <div className="card max-h-[75vh] overflow-auto">
        <table className="data">
          <thead><tr><th>Objeto</th><th>Tipo</th><th>Efecto</th><th className="num">Compra</th><th className="num">Venta</th><th>Lo sueltan</th></tr></thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td className="whitespace-nowrap"><Link href={`/objetos/${i.slug}`} className="link font-medium">{i.name}</Link></td>
                <td className="whitespace-nowrap text-muted">{ITEM_TYPE_ES[i.type] ?? i.type}</td>
                <td className="min-w-56 text-xs text-muted">{i.desc}</td>
                <td className="num">{i.buy ?? "—"}</td>
                <td className="num">{i.sell ?? "—"}</td>
                <td>
                  <div className="flex gap-0.5">
                    {i.monsters.slice(0, 6).map(([id]) => { const m = db.monster.get(id); return m ? <Sprite key={id} db={db} slug={m.slug} size={24} title={m.name} /> : null; })}
                    {i.monsters.length > 6 && <span className="text-[11px] text-muted">+{i.monsters.length - 6}</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ItemDetail({ slug }: { slug: string }) {
  return (
    <WithData>
      {(db) => {
        const i = db.itemBySlug.get(slug);
        return i ? <Detail db={db} i={i} /> : <NotFound what="objeto" />;
      }}
    </WithData>
  );
}

function Detail({ db, i }: { db: DB; i: Item }) {
  const traits = i.traits.map((id) => db.trait.get(id)).filter((t) => !!t);
  return (
    <div className="space-y-5">
      <Link href="/objetos" className="link text-sm">← Objetos</Link>
      <PageHeader title={i.name} subtitle={`${ITEM_TYPE_ES[i.type] ?? i.type} · ${i.desc}`} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Datos">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="label">Compra</dt><dd>{i.buy ?? "No se vende"}</dd></div>
            <div><dt className="label">Venta</dt><dd>{i.sell ?? "—"}</dd></div>
          </dl>
          {i.stats.some(Boolean) && (
            <div className="mt-3 flex flex-wrap gap-1.5">{i.stats.map((v, k) => (v ? <span key={k} className="chip">{STATS[k]} +{v}</span> : null))}</div>
          )}
          {traits.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="label">Rasgo que otorga</div>
              {traits.map((t) => (
                <div key={t.id} className="rounded-lg bg-bg-2 px-3 py-2 text-sm">
                  <Link href={`/rasgos/${t.slug}`} className="link font-medium">{t.name}</Link>
                  <div className="text-xs text-muted">{t.desc}</div>
                </div>
              ))}
            </div>
          )}
          {i.notes && <p className="mt-3 rounded-lg bg-bg-2 p-3 text-sm text-muted">📝 {i.notes}</p>}
        </Section>
        <Section title={`Lo sueltan (${i.monsters.length})`}>
          {i.monsters.length === 0 ? <Empty>Ningún monstruo conocido lo suelta.</Empty> : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
              {i.monsters.map(([id, r]) => { const m = db.monster.get(id); return m ? <MonsterTile key={id} db={db} m={m} extra={rarityEs(r)} /> : null; })}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
