"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DB } from "@/lib/data";
import { FAMILY_ES } from "@/lib/labels";
import { norm } from "./Picker";
import { FamilyIcon, RankBadge, Sprite } from "./ui";

const KEY = "dqm3-rail";
interface RailState { q: string; fam: number; rank: number }

function load(): RailState {
  try { return { q: "", fam: 0, rank: 0, ...JSON.parse(sessionStorage.getItem(KEY) ?? "{}") }; } catch { return { q: "", fam: 0, rank: 0 }; }
}

/** Lista fija de monstruos junto a la ficha: buscar y saltar de uno a otro sin perder el sitio. */
export function MonsterRail({ db }: { db: DB }) {
  const path = usePathname();
  const current = decodeURIComponent(path.replace(/\/$/, "").split("/").pop() ?? "");
  const [st, setSt] = useState<RailState>(load);
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch { /* nada */ } }, [st]);

  const items = useMemo(() => {
    const t = norm(st.q.trim());
    return db.ordered.filter((m) =>
      (!st.fam || m.family === st.fam) && (!st.rank || m.rank === st.rank) &&
      (!t || norm(`${m.name} ${m.jp ?? ""} ${m.num ?? ""}`).includes(t)));
  }, [db, st]);

  // Mantiene visible el monstruo abierto.
  useEffect(() => {
    list.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
  }, [current, items]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-line p-3">
        <input className="input py-1.5 text-sm" placeholder="Filtrar lista…" value={st.q} onChange={(e) => setSt({ ...st, q: e.target.value })} />
        <div className="flex flex-wrap gap-1">
          {db.families.map((f) => (
            <button key={f.id} type="button" title={FAMILY_ES[f.slug]} onClick={() => setSt({ ...st, fam: st.fam === f.id ? 0 : f.id })}
              className={`rounded-md p-1 ${st.fam === f.id ? "bg-gold/20 ring-1 ring-gold" : "opacity-70 hover:opacity-100"}`}>
              <FamilyIcon slug={f.slug} size={18} />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-0.5">
          {db.ranks.map((r) => (
            <button key={r.id} type="button" onClick={() => setSt({ ...st, rank: st.rank === r.id ? 0 : r.id })} className={`rounded-md p-0.5 ${st.rank === r.id ? "ring-1 ring-gold" : "opacity-70 hover:opacity-100"}`}>
              <RankBadge db={db} rank={r.id} />
            </button>
          ))}
        </div>
        <div className="text-[11px] text-muted">{items.length} monstruos · usa ← → en la ficha</div>
      </div>
      <ul ref={list} className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {items.map((m) => {
          const on = m.slug === current;
          return (
            <li key={m.id}>
              <Link href={`/monstruos/${m.slug}`} aria-current={on ? "page" : undefined} scroll={false}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${on ? "bg-gold/15 font-semibold text-gold-2" : "hover:bg-panel-2"}`}>
                <Sprite db={db} slug={m.slug} size={30} />
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                <span className="w-7 text-right font-mono text-[10px] text-muted">{m.num ?? ""}</span>
                <RankBadge db={db} rank={m.rank} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
