"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DB } from "@/lib/data";
import { paddockResults } from "@/lib/synthesis";
import { useQueryState } from "@/lib/useQueryState";
import { monsterOptions } from "../options";
import { Picker } from "../Picker";
import { Empty, PageHeader, RankBadge, Section, Sprite, WithData } from "../ui";

const KEY = "dqm3-corral";

export function Paddock() {
  return <WithData>{(db) => <Inner db={db} />}</WithData>;
}

function load(): number[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

function Inner({ db }: { db: DB }) {
  const { get, set } = useQueryState();
  // Solo se monta en el cliente (espera a los datos): puede leer localStorage al iniciar.
  // ?add=id llega desde la ficha de un monstruo.
  const [owned, setOwned] = useState<number[]>(() => {
    const list = load();
    const add = Number(get("add"));
    return add && db.monster.has(add) && !list.includes(add) ? [...list, add] : list;
  });
  useEffect(() => { if (get("add")) set({ add: null }); }, [get, set]);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(owned)); } catch { /* sin almacenamiento */ }
  }, [owned]);

  const results = useMemo(() => paddockResults(db, owned), [db, owned]);

  return (
    <>
      <PageHeader title="Corral de síntesis" subtitle="Añade los monstruos que tienes y te digo todo lo nuevo que puedes crear combinando dos de ellos. Se guarda en este navegador." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Section title={`Tus monstruos (${owned.length})`} right={owned.length > 0 && <button type="button" className="text-sm text-muted hover:text-text" onClick={() => confirm("¿Vaciar el corral?") && setOwned([])}>Vaciar</button>}>
          <Picker options={monsterOptions(db).filter((o) => !owned.includes(o.id))} value={null} onChange={(id) => id != null && setOwned([...owned, id])} placeholder="➕ Añadir monstruo capturado…" clearable={false} />
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {owned.map((id) => {
              const m = db.monster.get(id);
              if (!m) return null;
              return (
                <div key={id} className="group relative rounded-xl border border-line bg-bg-2 p-2 text-center">
                  <button type="button" onClick={() => setOwned(owned.filter((x) => x !== id))} className="absolute right-1 top-1 hidden h-6 w-6 rounded-full bg-panel text-xs text-muted hover:text-text group-hover:block" aria-label={`Quitar ${m.name}`}>✕</button>
                  <Link href={`/monstruos/${m.slug}`} className="flex flex-col items-center gap-1">
                    <Sprite db={db} slug={m.slug} size={52} />
                    <span className="line-clamp-2 text-[11px] leading-tight">{m.name}</span>
                    <RankBadge db={db} rank={m.rank} />
                  </Link>
                </div>
              );
            })}
          </div>
          {owned.length < 2 && <p className="mt-3 text-sm text-muted">Añade al menos dos monstruos.</p>}
        </Section>
        <Section title={`Puedes crear (${results.length})`}>
          {results.length === 0 ? <Empty>{owned.length < 2 ? "Aquí aparecerán los resultados." : "Ninguna combinación nueva con lo que tienes."}</Empty> : (
            <div className="space-y-2">
              {results.map(({ monster: m, pairs }) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl bg-bg-2 p-2.5">
                  <Link href={`/monstruos/${m.slug}`} className="flex w-44 shrink-0 items-center gap-2 hover:text-gold-2">
                    <Sprite db={db} slug={m.slug} size={48} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{m.name}</span>
                      <RankBadge db={db} rank={m.rank} />
                    </span>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                    {pairs.map(([a, b], i) => (
                      <span key={i} className="chip text-[11px]">
                        <Sprite db={db} slug={a.slug} size={20} /> {a.name} + <Sprite db={db} slug={b.slug} size={20} /> {b.name}
                      </span>
                    ))}
                  </div>
                  <button type="button" className="btn shrink-0 px-2 py-1 text-xs" onClick={() => setOwned([...owned, m.id])} title="Lo he creado: añadir al corral">＋</button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
