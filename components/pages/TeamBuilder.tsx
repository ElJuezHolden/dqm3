"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeBuild, decodeBuilds, emptyBuild, encodeBuilds, isLarge, type Build } from "@/lib/build";
import type { DB } from "@/lib/data";
import { DAMAGE_ES, resLevel, STATS_SHORT } from "@/lib/labels";
import { useQueryState } from "@/lib/useQueryState";
import { BuildEditor, ResultResistances, ResultTraits, StatTable } from "../BuildEditor";
import { monsterOptions } from "../options";
import { Picker } from "../Picker";
import { DtIcon, Empty, PageHeader, RankBadge, Section, Sprite, WithData } from "../ui";

const KEY = "dqm3-equipo";
const slotsOf = (bs: Build[]) => bs.reduce((s, b) => s + (isLarge(b) ? 2 : 1), 0);

export function TeamBuilder() {
  return <WithData>{(db) => <Inner db={db} />}</WithData>;
}

function Inner({ db }: { db: DB }) {
  const { get, set } = useQueryState();
  // Solo se monta en el cliente (espera a los datos). Orden de carga: enlace compartido (#…),
  // lo guardado en este navegador y, si llega ?add=id desde una ficha, ese monstruo al final.
  const [team, setTeam] = useState<Build[]>(() => {
    let t: Build[] = [];
    const fromHash = location.hash.length > 1 ? decodeBuilds(location.hash.slice(1)) : null;
    if (fromHash) t = fromHash;
    else try { t = JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { /* vacío */ }
    t = t.filter((b) => b.monster == null || db.monster.has(b.monster));
    const add = Number(get("add"));
    return add && db.monster.has(add) && slotsOf(t) < 4 ? [...t, emptyBuild(add)] : t;
  });
  const [sel, setSel] = useState(() => (get("add") ? Math.max(0, team.length - 1) : 0));
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (get("add")) set({ add: null }); }, [get, set]);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(team)); } catch { /* sin almacenamiento */ }
  }, [team]);

  const results = useMemo(() => team.map((b) => computeBuild(db, b)), [db, team]);
  const used = slotsOf(team);
  const cur = team[sel];

  const update = (b: Build) => {
    const next = team.map((x, i) => (i === sel ? b : x));
    if (slotsOf(next) > 4) { alert("No cabe: un monstruo grande ocupa 2 huecos y el equipo tiene 4."); return; }
    setTeam(next);
  };
  const share = async () => {
    const url = `${location.origin}${location.pathname}#${encodeBuilds(team)}`;
    history.replaceState(null, "", url);
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { prompt("Copia este enlace:", url); }
  };

  return (
    <>
      <PageHeader title="Team Builder" subtitle="Hasta 4 huecos: los monstruos grandes ocupan 2. Configura cada uno y mira los stats y las debilidades del equipo.">
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={share} disabled={!team.length}>{copied ? "✓ Enlace copiado" : "🔗 Compartir equipo"}</button>
          {team.length > 0 && <button type="button" className="btn" onClick={() => { if (confirm("¿Vaciar el equipo?")) { setTeam([]); history.replaceState(null, "", location.pathname); } }}>Vaciar</button>}
        </div>
      </PageHeader>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {team.map((b, i) => {
          const m = b.monster != null ? db.monster.get(b.monster) : null;
          return (
            <button key={i} type="button" onClick={() => setSel(i)}
              className={`card card-hover relative flex items-center gap-3 p-3 text-left ${isLarge(b) ? "col-span-2" : ""} ${i === sel ? "ring-2 ring-gold" : ""}`}>
              {m ? <Sprite db={db} slug={m.slug} size={isLarge(b) ? 64 : 48} /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-bg-2 text-muted">?</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{m?.name ?? "Sin elegir"}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted">{m && <RankBadge db={db} rank={m.rank} />} {isLarge(b) ? "Grande · 2 huecos" : "Pequeño"}</span>
              </span>
              <span role="button" tabIndex={0} aria-label="Quitar" className="absolute right-2 top-2 text-xs text-muted hover:text-text"
                onClick={(e) => { e.stopPropagation(); setTeam(team.filter((_, j) => j !== i)); setSel(Math.max(0, sel - (i <= sel ? 1 : 0))); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setTeam(team.filter((_, j) => j !== i)); } }}>✕</span>
            </button>
          );
        })}
        {Array.from({ length: 4 - used }, (_, i) => (
          <div key={"e" + i} className="rounded-[14px] border border-dashed border-line p-2">
            {i === 0 ? (
              <Picker options={monsterOptions(db)} value={null} clearable={false} placeholder="➕ Añadir"
                onChange={(id) => { if (id != null) { setTeam([...team, emptyBuild(id)]); setSel(team.length); } }} />
            ) : <div className="grid h-full min-h-10 place-items-center text-xs text-muted">Hueco libre</div>}
          </div>
        ))}
      </div>

      {!cur ? (
        <Empty>Añade un monstruo para empezar. También puedes pulsar «Añadir al equipo» desde la ficha de cualquier monstruo.</Empty>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <Section title={`Editar: ${db.monster.get(cur.monster ?? -1)?.name ?? "—"}`}>
            <BuildEditor db={db} build={cur} onChange={update} />
          </Section>
          <div className="space-y-5">
            {results[sel] ? (
              <>
                <Section title="Stats máximos"><StatTable result={results[sel]!} /></Section>
                <Section title="Resistencias"><ResultResistances result={results[sel]!} /></Section>
                <Section title="Rasgos"><ResultTraits result={results[sel]!} /></Section>
              </>
            ) : <Empty>Elige el monstruo de este hueco.</Empty>}
          </div>
        </div>
      )}

      {results.filter(Boolean).length > 1 && <TeamSummary db={db} results={results} />}
    </>
  );
}

function TeamSummary({ db, results }: { db: DB; results: ReturnType<typeof computeBuild>[] }) {
  const rs = results.filter((r): r is NonNullable<typeof r> => !!r);
  const weakCount = (i: number) => rs.filter((r) => r.res[i] < 0).length;
  return (
    <Section title="Resumen del equipo" className="mt-5">
      <div className="overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Monstruo</th>
              {STATS_SHORT.map((s) => <th key={s} className="num">{s}</th>)}
              {Array.from({ length: 19 }, (_, i) => <th key={i} className="px-1 text-center" title={DAMAGE_ES[i + 1]}><DtIcon id={i + 1} size={16} /></th>)}
            </tr>
          </thead>
          <tbody>
            {rs.map((r, k) => (
              <tr key={k}>
                <td><Link href={`/monstruos/${r.monster.slug}`} className="flex items-center gap-2 whitespace-nowrap hover:text-gold-2"><Sprite db={db} slug={r.monster.slug} size={28} />{r.monster.name}</Link></td>
                {r.stats.map((v, i) => <td key={i} className="num">{v}</td>)}
                {r.res.map((v, i) => <td key={i} className={`res-${resLevel(v)} num px-1.5 text-xs`}>{v}</td>)}
              </tr>
            ))}
            <tr>
              <td className="text-muted">Débiles</td>
              <td colSpan={6} />
              {Array.from({ length: 19 }, (_, i) => {
                const n = weakCount(i);
                return <td key={i} className={`num px-1.5 text-xs font-bold ${n >= 2 ? "text-red-400" : n ? "text-orange-300" : "text-muted/40"}`}>{n || "·"}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">La última fila cuenta cuántos miembros son débiles a cada tipo: en rojo, debilidades compartidas que un rival puede explotar.</p>
    </Section>
  );
}
