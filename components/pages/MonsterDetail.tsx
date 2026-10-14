"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { DB } from "@/lib/data";
import { DAMAGE_ES, EGG_ES, ELEMENT_IDS, RES_LABEL, resLevel, SEASON_ES, STATS, STATUS_IDS, WEATHER_ES } from "@/lib/labels";
import { recipeSlots, slotAccepts } from "@/lib/synthesis";
import type { Monster, Recipe, Skill, Trait } from "@/lib/types";
import { HowToGet, Ingredient } from "../Recipe";
import { DtIcon, Empty, FamilyTag, Img, NotFound, RankBadge, Sprite, Stars, WithData } from "../ui";

export function MonsterDetail({ slug }: { slug: string }) {
  return (
    <WithData>
      {(db) => {
        const m = db.monsterBySlug.get(slug);
        return m ? <Sheet key={m.id} db={db} m={m} /> : <NotFound what="monstruo" />;
      }}
    </WithData>
  );
}

/** Posición de cada monstruo en cada stat (1 = el más alto), calculada una vez. */
const rankCache = new WeakMap<DB, Map<number, number[]>>();
function statRanks(db: DB) {
  let r = rankCache.get(db);
  if (r) return r;
  r = new Map(db.monsters.map((m) => [m.id, [] as number[]]));
  for (let i = 0; i < 7; i++) {
    const val = (m: Monster) => (i < 6 ? m.max[i] : m.max.reduce((a, b) => a + b, 0));
    const sorted = [...db.monsters].sort((a, b) => val(b) - val(a));
    sorted.forEach((m, pos) => (r!.get(m.id)![i] = sorted.findIndex((x) => val(x) === val(m)) + 1 || pos + 1));
  }
  rankCache.set(db, r);
  return r;
}

function Panel({ title, id, right, children, className = "" }: { title: ReactNode; id?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`card min-w-0 scroll-mt-20 p-4 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="label text-[11px] text-gold-2">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Sheet({ db, m }: { db: DB; m: Monster }) {
  const router = useRouter();
  const idx = db.ordered.indexOf(m);
  const prev = db.ordered[idx - 1];
  const next = db.ordered[idx + 1];

  // ← → para pasar de monstruo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "") || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft" && prev) router.push(`/monstruos/${prev.slug}`, { scroll: false });
      if (e.key === "ArrowRight" && next) router.push(`/monstruos/${next.slug}`, { scroll: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prev, next]);

  const places = [...new Set(m.locations.map(([l]) => l))];

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <header className="card relative overflow-hidden p-4">
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border border-line bg-bg-2 p-2"><Sprite db={db} slug={m.slug} size={112} title={m.name} /></div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              {m.num && <span className="font-mono">Nº {String(m.num).padStart(3, "0")}</span>}
              <RankBadge db={db} rank={m.rank} className="text-sm" />
              <FamilyTag db={db} id={m.family} />
            </div>
            <h1 className="h-title text-3xl font-bold leading-tight sm:text-4xl">{m.name}</h1>
            <p className="text-sm text-muted">{[m.jp, m.fr].filter(Boolean).join(" · ")}</p>
            <div className="flex flex-wrap gap-1.5">
              {places.length > 0 && <a href="#donde" className="chip hover:border-gold">🎯 Se captura en {places.length} {places.length === 1 ? "zona" : "zonas"}</a>}
              {m.egg && <span className="chip"><Img src="/img/ui/egg.png" alt="" size={14} /> Huevo {EGG_ES[m.egg] ?? m.egg}</span>}
              {(db.recipesOf.get(m.id)?.length ?? 0) > 0 && <a href="#sintesis" className="chip hover:border-gold">🧬 {db.recipesOf.get(m.id)!.length} {db.recipesOf.get(m.id)!.length === 1 ? "receta" : "recetas"}</a>}
              {!places.length && !m.egg && !(db.recipesOf.get(m.id)?.length) && <span className="chip">Sin método conocido</span>}
            </div>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-col">
            <Link href={`/equipo?add=${m.id}`} className="btn btn-gold">🛡️ Al equipo</Link>
            <Link href={`/sintesis?m=${m.slug}`} className="btn">🧬 Árbol completo</Link>
            <Link href={`/calculadoras/stats?m=${m.id}`} className="btn">📈 Stats máx.</Link>
            <Link href={`/corral?add=${m.id}`} className="btn">🧪 Al corral</Link>
          </div>
        </div>
        <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-line pt-3 text-sm">
          {prev ? <Link href={`/monstruos/${prev.slug}`} scroll={false} className="flex items-center gap-1.5 text-muted hover:text-text">‹ <Sprite db={db} slug={prev.slug} size={22} /> {prev.name}</Link> : <span />}
          <span className="hidden text-[11px] text-muted sm:inline">Teclas ← →</span>
          {next ? <Link href={`/monstruos/${next.slug}`} scroll={false} className="flex items-center gap-1.5 text-muted hover:text-text">{next.name} <Sprite db={db} slug={next.slug} size={22} /> ›</Link> : <span />}
        </div>
      </header>

      {/* Fila 1: stats · resistencias · rasgos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-[1fr_1fr_1.1fr]">
        <StatsPanel db={db} m={m} />
        <ResPanel m={m} />
        <TraitsPanel db={db} m={m} className="lg:col-span-2 2xl:col-span-1" />
      </div>

      <SynthesisPanel db={db} m={m} />
      <SkillsPanel db={db} m={m} />
      <WherePanel db={db} m={m} />

      {m.trivia && (
        <Panel title="Curiosidades"><p className="text-sm leading-relaxed text-muted">{m.trivia}</p></Panel>
      )}
    </div>
  );
}

function StatsPanel({ db, m }: { db: DB; m: Monster }) {
  const ranks = statRanks(db).get(m.id)!;
  const max = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => Math.max(...db.monsters.map((x) => x.max[i]))), [db]);
  const total = m.max.reduce((a, b) => a + b, 0);
  const n = db.monsters.length;
  const tone = (r: number) => (r <= n * 0.1 ? "text-gold-2" : r <= n * 0.33 ? "text-text" : "text-muted");
  return (
    <Panel title="Stats máximos (base)">
      <div className="space-y-1.5">
        {m.max.map((v, i) => (
          <div key={i} className="grid grid-cols-[4.8rem_4.6rem_1fr_3rem_2.8rem] items-center gap-2 text-sm">
            <span className="text-muted">{STATS[i]}</span>
            <span className="text-xs"><Stars n={m.stars[i]} /></span>
            <div className="h-2 overflow-hidden rounded-full bg-bg-2">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-2" style={{ width: `${(v / max[i]) * 100}%` }} />
            </div>
            <span className="num font-semibold">{v}</span>
            <span className={`num text-[11px] ${tone(ranks[i])}`} title={`Puesto ${ranks[i]} de ${n}`}>#{ranks[i]}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-sm">
        <span className="text-muted">Total</span>
        <span><b>{total}</b> <span className={`text-[11px] ${tone(ranks[6])}`}>#{ranks[6]} de {n}</span></span>
      </div>
    </Panel>
  );
}

function ResPanel({ m }: { m: Monster }) {
  const [large, setLarge] = useState(false);
  const v = (id: number) => m.res[id - 1] + (large && id >= 10 ? 50 : 0);
  const weak = [...ELEMENT_IDS, ...STATUS_IDS].filter((id) => v(id) < 0);
  const immune = [...ELEMENT_IDS, ...STATUS_IDS].filter((id) => v(id) >= 100);
  const cell = (id: number) => {
    const val = v(id);
    const lvl = resLevel(val);
    return (
      <div key={id} className={`res-${lvl} flex items-center justify-between gap-1 rounded-md px-1.5 py-1 text-xs`} title={`${DAMAGE_ES[id]}: ${val}% · ${RES_LABEL[lvl]}`}>
        <DtIcon id={id} size={16} />
        <b className="tabular-nums">{val}</b>
      </div>
    );
  };
  return (
    <Panel title="Resistencias" right={
      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={large} onChange={(e) => setLarge(e.target.checked)} /> Grande</label>
    }>
      <div className="grid grid-cols-5 gap-1 sm:grid-cols-9">{ELEMENT_IDS.map(cell)}</div>
      <div className="mt-1 grid grid-cols-5 gap-1 sm:grid-cols-10">{STATUS_IDS.map(cell)}</div>
      <div className="mt-3 space-y-1 text-xs">
        <div><span className="text-red-300">Débil a:</span> {weak.length ? weak.map((id) => DAMAGE_ES[id]).join(", ") : <span className="text-muted">nada</span>}</div>
        {immune.length > 0 && <div><span className="text-yellow-300">Inmune/absorbe:</span> {immune.map((id) => DAMAGE_ES[id]).join(", ")}</div>}
      </div>
    </Panel>
  );
}

function TraitsPanel({ db, m, className }: { db: DB; m: Monster; className?: string }) {
  const groups: ["S" | "L", string][] = [["S", "Pequeño"], ["L", "Grande"]];
  return (
    <Panel title="Rasgos innatos" className={className}>
      {m.traits.length === 0 ? <Empty>Sin datos.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
          {groups.map(([size, label]) => {
            const list = m.traits.filter(([, s]) => s === size);
            if (!list.length) return null;
            return (
              <div key={size}>
                <div className="mb-1 text-[11px] font-semibold text-muted">{label}</div>
                <ul className="space-y-1">
                  {list.map(([id, , lv]) => {
                    const t = db.trait.get(id);
                    return t ? (
                      <li key={id} className="flex gap-2 text-sm" title={t.desc}>
                        <span className="w-10 shrink-0 text-[11px] leading-5 text-muted">Nv {lv}</span>
                        <span className="min-w-0">
                          <Link href={`/rasgos/${t.slug}`} className="link font-medium">{t.name}</Link>
                          <span className="block truncate text-[11px] text-muted">{t.desc}</span>
                        </span>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function RecipeCard({ db, r, n }: { db: DB; r: Recipe; n: number }) {
  const pair = (ids: number[]) => (
    <div className="space-y-2">
      {ids.map((id, i) => (
        <div key={i}>
          {i > 0 && <div className="-mt-1 mb-1 pl-2 text-xs text-muted">+</div>}
          <Ingredient db={db} id={id} size={36} strong />
          <div className="pl-[42px]"><HowToGet db={db} id={id} /></div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="rounded-xl border border-line bg-bg-2 p-3">
      <div className="mb-2 text-[11px] font-semibold text-muted">{r.g ? `Receta ${n} · síntesis cuádruple` : `Receta ${n}`}</div>
      {r.p ? pair(r.p) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line p-2">{pair([r.g[0], r.g[1]])}</div>
          <div className="rounded-lg border border-line p-2">{pair([r.g[2], r.g[3]])}</div>
        </div>
      )}
    </div>
  );
}

function SynthesisPanel({ db, m }: { db: DB; m: Monster }) {
  const recipes = db.recipesOf.get(m.id) ?? [];
  const used = useMemo(() => db.usedIn.get(m.id) ?? [], [db, m]);
  const [wild, setWild] = useState(false);
  const wildcard = useMemo(
    () => db.recipes.filter((r) => !used.includes(r) && r.r !== m.id && recipeSlots(r).some((s) => s < 100 && slotAccepts(s, m))),
    [db, m, used],
  );
  // "Para qué sirve": resultado + con quién hay que combinarlo.
  const partners = (r: Recipe) => {
    const slots = [...recipeSlots(r)];
    slots.splice(slots.indexOf(m.id) >= 0 ? slots.indexOf(m.id) : slots.findIndex((s) => slotAccepts(s, m)), 1);
    return slots;
  };
  const useRow = (r: Recipe, i: number) => {
    const res = db.monster.get(r.r);
    if (!res) return null;
    return (
      <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-bg-2 px-2.5 py-1.5">
        <span className="text-muted">+</span>
        {partners(r).map((p, j) => <span key={j} className="inline-flex items-center gap-1">{j > 0 && <span className="text-xs text-muted">{r.g && j === 2 ? "y" : "+"}</span>}<Ingredient db={db} id={p} size={24} /></span>)}
        <span className="text-gold">→</span>
        <Ingredient db={db} id={r.r} size={30} strong />
        {r.g && <span className="text-[10px] text-muted">(cuádruple)</span>}
      </li>
    );
  };

  return (
    <Panel id="sintesis" title={`Síntesis`} right={<Link href={`/sintesis?m=${m.slug}`} className="link text-xs">Ver árbol completo →</Link>}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Cómo se crea <span className="text-muted">({recipes.length})</span></h3>
          {recipes.length ? (
            <div className="space-y-2">{recipes.map((r, i) => <RecipeCard key={i} db={db} r={r} n={i + 1} />)}</div>
          ) : (
            <Empty>No tiene receta: {m.locations.length ? "se captura en el mapa" : m.egg ? "sale de huevos" : "método desconocido"}.</Empty>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Para qué sirve <span className="text-muted">({new Set(used.map((r) => r.r)).size} monstruos)</span></h3>
          {used.length ? <ul className="space-y-1.5">{used.map(useRow)}</ul> : <Empty>No aparece por nombre en ninguna receta.</Empty>}
          {wildcard.length > 0 && (
            <div className="mt-3">
              <button type="button" className="text-xs text-gold-2 hover:underline" onClick={() => setWild(!wild)}>
                {wild ? "▲ Ocultar" : "▼ Ver"} {wildcard.length} recetas más donde vale como «cualquier {db.family.get(m.family)?.name}»
              </button>
              {wild && <ul className="fade-in mt-2 space-y-1.5">{wildcard.map(useRow)}</ul>}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

type Row = { pts: number; skill?: Skill; trait?: Trait };

function SkillsPanel({ db, m }: { db: DB; m: Monster }) {
  const talents = [...m.talents].sort((a, b) => (a[1] === b[1] ? 0 : a[1] === "P" ? -1 : 1));
  return (
    <Panel id="habilidades" title="Talentos: habilidades y rasgos que aprende">
      {talents.length === 0 ? <Empty>Sin datos de talentos.</Empty> : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {talents.map(([id, kind]) => {
            const t = db.talent.get(id);
            if (!t) return null;
            const rows = ([
              ...t.skills.map(([sid, pts]) => ({ pts, skill: db.skill.get(sid) })),
              ...t.traits.map(([tid, pts]) => ({ pts, trait: db.trait.get(tid) })),
            ] as Row[]).filter((r) => r.skill || r.trait).sort((a, b) => a.pts - b.pts);
            return (
              <div key={id} className={`rounded-xl border p-3 ${kind === "P" ? "border-gold/50 bg-gold/5" : "border-line bg-bg-2"}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Link href={`/talentos/${t.slug}`} className="font-semibold hover:text-gold-2">{t.name}</Link>
                  <span className={`chip text-[10px] ${kind === "P" ? "chip-on" : "text-muted"}`}>{kind === "P" ? "Principal" : "Solo salvaje"}</span>
                </div>
                <ul className="space-y-1">
                  {rows.map((r, i) => {
                    const x = (r.skill ?? r.trait)!;
                    return (
                      <li key={i} className="grid grid-cols-[2.2rem_1fr] gap-2 text-sm" title={x.desc}>
                        <span className="num text-xs leading-5 text-gold-2">{r.pts}</span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1">
                            <Link href={r.skill ? `/habilidades/${x.slug}` : `/rasgos/${x.slug}`} className="truncate font-medium hover:text-gold-2">{x.name}</Link>
                            {r.skill?.damageTypes.map((d) => <DtIcon key={d} id={d} size={13} />)}
                            {r.trait && <span className="rounded bg-panel-2 px-1 text-[9px] uppercase text-muted">rasgo</span>}
                            {r.skill?.mp ? <span className="ml-auto shrink-0 text-[10px] text-muted">{r.skill.mp} PM</span> : null}
                          </span>
                          <span className="block truncate text-[11px] text-muted">{x.desc}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted">El número es el total de puntos de talento necesario. Pasa el ratón para leer la descripción completa.</p>
    </Panel>
  );
}

function WherePanel({ db, m }: { db: DB; m: Monster }) {
  const byPlace = new Map<number, Monster["locations"]>();
  for (const l of m.locations) byPlace.set(l[0], [...(byPlace.get(l[0]) ?? []), l]);
  return (
    <div id="donde" className="grid scroll-mt-20 grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <Panel title="Dónde capturarlo">
        {byPlace.size === 0 ? (
          <Empty>{m.egg ? `No aparece en el mapa; sale de huevos ${EGG_ES[m.egg]?.toLowerCase() ?? m.egg}.` : "No aparece en el mapa: se consigue por síntesis."}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="data">
              <thead>
                <tr>
                  <th>Lugar</th>
                  {db.seasons.map((s) => <th key={s.id} className="text-center"><Img src={`/img/seasons/${s.slug}.png`} alt={SEASON_ES[s.id]} size={16} /> <span className="hidden sm:inline">{SEASON_ES[s.id]}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {[...byPlace.entries()].map(([pid, rows]) => {
                  const p = db.place.get(pid);
                  return (
                    <tr key={pid}>
                      <td>
                        {p ? <Link href={`/lugares/${p.slug}`} className="link">{p.name}</Link> : pid}
                        {rows.some((r) => r[3]) && <span className="chip ml-2 text-[11px]">👑 Minijefe</span>}
                      </td>
                      {db.seasons.map((s) => (
                        <td key={s.id} className="text-center">
                          {rows.filter((r) => r[1] === s.id).map((r) => (
                            <Img key={r[2]} src={`/img/weather/${db.weatherById.get(r[2])?.slug}.png`} alt={WEATHER_ES[r[2]]} size={18} className="mx-0.5" />
                          ))}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel title="Objetos que suelta">
        {m.items.length === 0 ? <Empty>Sin datos.</Empty> : (
          <ul className="space-y-1.5">
            {m.items.map(([id, rarity]) => {
              const it = db.item.get(id);
              return it ? (
                <li key={id} className="text-sm">
                  <Link href={`/objetos/${it.slug}`} className="link font-medium">{it.name}</Link>
                  <span className="ml-2 text-xs text-muted">{rarity === "Rare" ? "Raro" : rarity === "Common" ? "Común" : rarity}</span>
                  <span className="block text-xs text-muted">{it.desc}</span>
                </li>
              ) : null;
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
