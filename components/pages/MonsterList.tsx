"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DB } from "@/lib/data";
import { DAMAGE_ES, EGG_ES, FAMILY_ES, resLevel, STATS_SHORT } from "@/lib/labels";
import { obtainableFrom } from "@/lib/synthesis";
import type { Monster } from "@/lib/types";
import { useQueryState } from "@/lib/useQueryState";
import { placeOptions, talentOptions, traitOptions } from "../options";
import { MultiPicker, norm, Picker } from "../Picker";
import { DtIcon, FamilyIcon, MonsterTile, PageHeader, RankBadge, Sprite, WithData } from "../ui";

const SORTS = [
  { k: "num", label: "Nº" },
  { k: "name", label: "Nombre" },
  { k: "rank", label: "Rango" },
  { k: "s0", label: "PV máx." },
  { k: "s1", label: "PM máx." },
  { k: "s2", label: "Ataque máx." },
  { k: "s3", label: "Defensa máx." },
  { k: "s4", label: "Agilidad máx." },
  { k: "s5", label: "Sabiduría máx." },
  { k: "total", label: "Total stats" },
  ...Array.from({ length: 19 }, (_, i) => ({ k: `r${i + 1}`, label: `Resistencia a ${DAMAGE_ES[i + 1]}` })),
];

const total = (m: Monster) => m.max.reduce((a, b) => a + b, 0);

export function MonsterList() {
  return <WithData>{(db) => <List db={db} />}</WithData>;
}

function List({ db }: { db: DB }) {
  const { get, getList, set } = useQueryState();
  const [showAdvanced, setShowAdvanced] = useState(() => !!(get("ta") || get("tr") || get("l") || get("from") || get("egg")));
  const q = get("q");
  const fams = getList("f");
  const ranks = getList("r");
  const talent = Number(get("ta")) || null;
  const trait = Number(get("tr")) || null;
  const smallOnly = get("sm") === "1";
  const place = Number(get("l")) || null;
  const egg = get("egg");
  const scout = get("sc");
  const from = getList("from");
  const fromEggs = get("fe") === "1";
  const fromBosses = get("fb") === "1";
  const sort = get("sort") || "num";
  const desc = get("dir") === "desc";
  const view = get("view") || "grid";
  const large = get("big") === "1";

  const reachable = useMemo(() => (from.length ? obtainableFrom(db, from, { eggs: fromEggs, bosses: fromBosses }) : null), [db, from, fromEggs, fromBosses]);

  const list = useMemo(() => {
    const t = norm(q.trim());
    const res = (m: Monster, i: number) => m.res[i] + (large && i + 1 >= 10 ? 50 : 0);
    const out = db.monsters.filter((m) => {
      if (t && !norm(`${m.name} ${m.jp ?? ""} ${m.fr ?? ""} ${m.num ?? ""}`).includes(t)) return false;
      if (fams.length && !fams.includes(m.family)) return false;
      if (ranks.length && !ranks.includes(m.rank)) return false;
      if (talent && !m.talents.some(([id]) => id === talent)) return false;
      if (trait && !m.traits.some(([id, s]) => id === trait && (!smallOnly || s === "S"))) return false;
      if (place && !m.locations.some(([l]) => l === place)) return false;
      if (egg === "any" && !m.egg) return false;
      if (egg === "none" && m.egg) return false;
      if (egg && egg !== "any" && egg !== "none" && m.egg !== egg) return false;
      if (scout === "1" && !m.locations.length) return false;
      if (scout === "0" && m.locations.length) return false;
      if (reachable && !reachable.has(m.id)) return false;
      return true;
    });
    const key = (m: Monster): number | string => {
      if (sort === "name") return m.name;
      if (sort === "rank") return m.rank * 1000 + (m.num ?? 999);
      if (sort === "total") return total(m);
      if (sort.startsWith("s")) return m.max[Number(sort.slice(1))];
      if (sort.startsWith("r")) return res(m, Number(sort.slice(1)) - 1);
      return m.num ?? 9999;
    };
    // Por defecto, las stats y resistencias se ordenan de mayor a menor.
    const naturalDesc = sort === "total" || sort.startsWith("s") || sort.startsWith("r");
    const dir = (naturalDesc ? -1 : 1) * (desc ? -1 : 1);
    return out.sort((a, b) => {
      const x = key(a), y = key(b);
      return (typeof x === "string" ? x.localeCompare(y as string) : x - (y as number)) * dir || (a.num ?? 9999) - (b.num ?? 9999);
    });
  }, [db, q, fams, ranks, talent, trait, smallOnly, place, egg, scout, reachable, sort, desc, large]);

  const toggle = (arr: number[], v: number) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const activeFilters = [q, fams.length, ranks.length, talent, trait, place, egg, scout, from.length].filter(Boolean).length;
  const eggs = [...new Set(db.monsters.map((m) => m.egg).filter(Boolean))] as string[];
  const resSort = sort.startsWith("r") ? Number(sort.slice(1)) : null;

  return (
    <>
      <PageHeader title="Monsterpedia" subtitle={`${db.monsters.length} monstruos. Filtra, ordena y pulsa cualquiera para ver su ficha completa.`}>
        <div className="flex gap-1 rounded-xl border border-line bg-bg-2 p-1">
          {[["grid", "▦ Rejilla"], ["table", "☰ Tabla"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => set({ view: k === "grid" ? null : k })} className={`rounded-lg px-3 py-1 text-sm ${view === k ? "bg-panel-2 font-semibold text-gold-2" : "text-muted"}`}>{l}</button>
          ))}
        </div>
      </PageHeader>

      <div className="card mb-5 space-y-3 p-4">
        <div className="flex flex-wrap gap-3">
          <input className="input max-w-sm flex-1" placeholder="Buscar por nombre, nº, japonés o francés…" value={q} onChange={(e) => set({ q: e.target.value })} />
          <select className="input w-auto" value={sort} onChange={(e) => set({ sort: e.target.value === "num" ? null : e.target.value })} aria-label="Ordenar por">
            {SORTS.map((s) => <option key={s.k} value={s.k}>Ordenar: {s.label}</option>)}
          </select>
          <button type="button" className="btn" onClick={() => set({ dir: desc ? null : "desc" })} title="Invertir orden">{desc ? "↑" : "↓"}</button>
          <label className="chip cursor-pointer select-none" title="Los grandes tienen +50 % de resistencia a estados">
            <input type="checkbox" checked={large} onChange={(e) => set({ big: e.target.checked })} /> Resistencias de grande
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {db.families.map((f) => (
            <button key={f.id} type="button" onClick={() => set({ f: toggle(fams, f.id) })} className={`chip ${fams.includes(f.id) ? "chip-on" : ""}`}>
              <FamilyIcon slug={f.slug} size={16} /> {FAMILY_ES[f.slug]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label mr-1">Rango</span>
          {db.ranks.map((r) => (
            <button key={r.id} type="button" onClick={() => set({ r: toggle(ranks, r.id) })} className={`rounded-lg p-0.5 ${ranks.includes(r.id) ? "ring-2 ring-gold" : "opacity-80 hover:opacity-100"}`}>
              <RankBadge db={db} rank={r.id} className="text-sm" />
            </button>
          ))}
          <button type="button" className="ml-auto text-sm text-gold-2 hover:underline" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? "Menos filtros ▲" : "Más filtros ▼"}
          </button>
          {activeFilters > 0 && (
            <button type="button" className="text-sm text-muted hover:text-text" onClick={() => set({ q: null, f: null, r: null, ta: null, tr: null, sm: null, l: null, egg: null, sc: null, from: null, fe: null, fb: null })}>
              Limpiar ({activeFilters})
            </button>
          )}
        </div>
        {showAdvanced && (
          <div className="fade-in grid gap-3 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <Picker label="Con el talento" options={talentOptions(db)} value={talent} onChange={(v) => set({ ta: v })} placeholder="Cualquier talento" />
            <div>
              <Picker label="Con el rasgo" options={traitOptions(db)} value={trait} onChange={(v) => set({ tr: v })} placeholder="Cualquier rasgo" />
              <label className="mt-1 flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={smallOnly} onChange={(e) => set({ sm: e.target.checked })} /> Solo si lo tiene siendo pequeño</label>
            </div>
            <Picker label="Se captura en" options={placeOptions(db)} value={place} onChange={(v) => set({ l: v })} placeholder="Cualquier lugar" />
            <div>
              <div className="label mb-1">Huevo</div>
              <select className="input" value={egg} onChange={(e) => set({ egg: e.target.value })}>
                <option value="">Da igual</option>
                <option value="any">Sale de huevo</option>
                <option value="none">No sale de huevo</option>
                {eggs.map((e) => <option key={e} value={e}>Huevo {EGG_ES[e] ?? e}</option>)}
              </select>
            </div>
            <div>
              <div className="label mb-1">Capturable</div>
              <select className="input" value={scout} onChange={(e) => set({ sc: e.target.value })}>
                <option value="">Da igual</option>
                <option value="1">Se puede capturar</option>
                <option value="0">Solo por síntesis/huevo</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <MultiPicker
                label="Conseguible solo con lo que hay en… (captura + síntesis encadenadas)"
                options={placeOptions(db)}
                values={from}
                onChange={(v) => set({ from: v })}
                placeholder="Añade lugares a los que ya tienes acceso"
              />
              <div className="mt-1.5 flex gap-4 text-xs text-muted">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={fromEggs} onChange={(e) => set({ fe: e.target.checked })} /> Incluir huevos</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={fromBosses} onChange={(e) => set({ fb: e.target.checked })} /> Incluir minijefes</label>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mb-3 text-sm text-muted">{list.length} resultado{list.length === 1 ? "" : "s"}</p>

      {view === "grid" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
          {list.map((m) => {
            const extra = resSort ? `${DAMAGE_ES[resSort]} ${m.res[resSort - 1] + (large && resSort >= 10 ? 50 : 0)}%`
              : sort.startsWith("s") ? `${STATS_SHORT[Number(sort.slice(1))]} ${m.max[Number(sort.slice(1))]}`
              : sort === "total" ? `Total ${total(m)}` : m.num ? `Nº ${String(m.num).padStart(3, "0")}` : undefined;
            return <MonsterTile key={m.id} db={db} m={m} extra={extra} />;
          })}
        </div>
      ) : (
        <div className="card max-h-[75vh] overflow-auto">
          <table className="data">
            <thead>
              <tr>
                <th>Monstruo</th><th className="num">Nº</th><th>Familia</th><th>Rango</th>
                {STATS_SHORT.map((s) => <th key={s} className="num">{s}</th>)}
                <th className="num">Total</th>
                {Array.from({ length: 19 }, (_, i) => <th key={i} className="px-1 text-center"><DtIcon id={i + 1} size={16} /></th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/monstruos/${m.slug}`} className="flex items-center gap-2 font-medium hover:text-gold-2">
                      <Sprite db={db} slug={m.slug} size={36} /> <span className="whitespace-nowrap">{m.name}</span>
                    </Link>
                  </td>
                  <td className="num text-muted">{m.num ?? "—"}</td>
                  <td className="whitespace-nowrap"><FamilyIcon slug={db.family.get(m.family)!.slug} size={16} /> {FAMILY_ES[db.family.get(m.family)!.slug]}</td>
                  <td><RankBadge db={db} rank={m.rank} /></td>
                  {m.max.map((v, i) => <td key={i} className="num">{v}</td>)}
                  <td className="num font-semibold">{total(m)}</td>
                  {m.res.map((v, i) => {
                    const val = v + (large && i + 1 >= 10 ? 50 : 0);
                    return <td key={i} className={`res-${resLevel(val)} num px-1.5 text-xs`} title={`${DAMAGE_ES[i + 1]}: ${val}%`}>{val}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
