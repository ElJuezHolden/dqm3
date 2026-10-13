"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DB } from "@/lib/data";
import { EGG_ES, ELEMENT_IDS, SEASON_ES, STATS, STATUS_IDS, WEATHER_ES } from "@/lib/labels";
import { recipeSlots, slotAccepts } from "@/lib/synthesis";
import type { Monster, Recipe } from "@/lib/types";
import { Empty, FamilyTag, Img, NotFound, RankBadge, RecipeNode, ResCell, ResLegend, Section, Sprite, Stars, WithData } from "../ui";

export function MonsterDetail({ slug }: { slug: string }) {
  return (
    <WithData>
      {(db) => {
        const m = db.monsterBySlug.get(slug);
        return m ? <Detail key={m.id} db={db} m={m} /> : <NotFound what="monstruo" />;
      }}
    </WithData>
  );
}

const TOC = [
  ["stats", "Stats"], ["resistencias", "Resistencias"], ["talentos", "Talentos"], ["rasgos", "Rasgos"],
  ["sintesis", "Síntesis"], ["donde", "Dónde está"],
] as const;

function Detail({ db, m }: { db: DB; m: Monster }) {
  const idx = db.ordered.indexOf(m);
  const prev = db.ordered[idx - 1];
  const next = db.ordered[idx + 1];
  const statMax = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => Math.max(...db.monsters.map((x) => x.max[i]))), [db]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <Link href="/monstruos" className="link">← Monsterpedia</Link>
        <div className="flex gap-2">
          {prev && <Link href={`/monstruos/${prev.slug}`} className="btn px-2.5 py-1" title={prev.name}>‹ {prev.name}</Link>}
          {next && <Link href={`/monstruos/${next.slug}`} className="btn px-2.5 py-1" title={next.name}>{next.name} ›</Link>}
        </div>
      </div>

      <header className="card relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid place-items-center rounded-2xl border border-line bg-bg-2 p-3">
            <Sprite db={db} slug={m.slug} size={140} title={m.name} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              {m.num && <span className="font-mono">Nº {String(m.num).padStart(3, "0")}</span>}
              <RankBadge db={db} rank={m.rank} className="text-sm" />
              <FamilyTag db={db} id={m.family} />
            </div>
            <h1 className="h-title text-3xl font-bold sm:text-4xl">{m.name}</h1>
            <p className="text-sm text-muted">
              {[m.jp, m.fr].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {m.egg && <span className="chip"><Img src="/img/ui/egg.png" alt="Huevo" size={14} /> Huevo {EGG_ES[m.egg] ?? m.egg}</span>}
              <span className="chip">{m.locations.length ? "🎯 Se puede capturar" : "🧬 Solo síntesis / huevo"}</span>
              {m.traits.some(([, s]) => s === "L") && <span className="chip">🦣 Versión grande con 6 rasgos</span>}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href={`/sintesis?m=${m.slug}`} className="btn btn-gold">🧬 Árbol de síntesis</Link>
              <Link href={`/equipo?add=${m.id}`} className="btn">🛡️ Añadir al equipo</Link>
              <Link href={`/calculadoras/stats?m=${m.id}`} className="btn">📈 Stats máximos</Link>
              <Link href={`/corral?add=${m.id}`} className="btn">🧪 Al corral</Link>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-14 z-20 -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-line bg-bg/85 p-1 backdrop-blur lg:top-2">
        {TOC.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-lg px-3 py-1 text-sm text-muted hover:bg-panel-2 hover:text-text">{label}</a>
        ))}
      </nav>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Stats" id="stats">
          <div className="space-y-2">
            {m.max.map((v, i) => (
              <div key={i} className="grid grid-cols-[5.5rem_5.5rem_1fr_3.5rem] items-center gap-2 text-sm">
                <span className="text-muted">{STATS[i]}</span>
                <Stars n={m.stars[i]} />
                <div className="h-2 overflow-hidden rounded-full bg-bg-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-2" style={{ width: `${(v / statMax[i]) * 100}%` }} />
                </div>
                <span className="num font-semibold">{v}</span>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted">
              Topes base a nivel máximo (pequeño, sin bonus de padres). Total: <b className="text-text">{m.max.reduce((a, b) => a + b, 0)}</b>.
              Calcula el tope real en <Link className="link" href={`/calculadoras/stats?m=${m.id}`}>Stats máximos</Link>.
            </p>
          </div>
        </Section>
        <Resistances m={m} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Talents db={db} m={m} />
        <Traits db={db} m={m} />
      </div>

      <Synthesis db={db} m={m} />
      <Where db={db} m={m} />

      {m.trivia && (
        <Section title="Curiosidades">
          <p className="text-sm leading-relaxed text-muted">{m.trivia}</p>
        </Section>
      )}
    </div>
  );
}

function Resistances({ m }: { m: Monster }) {
  const [large, setLarge] = useState(false);
  const v = (id: number) => m.res[id - 1] + (large && id >= 10 ? 50 : 0);
  return (
    <Section
      title="Resistencias"
      id="resistencias"
      right={
        <label className="chip cursor-pointer select-none">
          <input type="checkbox" checked={large} onChange={(e) => setLarge(e.target.checked)} /> Grande (+50 % a estados)
        </label>
      }
    >
      <div className="label mb-1.5">Elementos</div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {ELEMENT_IDS.map((id) => <ResCell key={id} id={id} v={v(id)} />)}
      </div>
      <div className="label mb-1.5 mt-3">Estados</div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {STATUS_IDS.map((id) => <ResCell key={id} id={id} v={v(id)} />)}
      </div>
      <div className="mt-3"><ResLegend /></div>
    </Section>
  );
}

function Talents({ db, m }: { db: DB; m: Monster }) {
  const [open, setOpen] = useState<number | null>(m.talents.find(([, k]) => k === "P")?.[0] ?? null);
  return (
    <Section title="Talentos" id="talentos">
      {m.talents.length === 0 && <Empty>Sin datos de talentos.</Empty>}
      <div className="space-y-2">
        {m.talents.map(([id, kind]) => {
          const t = db.talent.get(id);
          if (!t) return null;
          const isOpen = open === id;
          const rows = [
            ...t.skills.map(([sid, pts]) => ({ pts, kind: "skill" as const, x: db.skill.get(sid) })),
            ...t.traits.map(([tid, pts]) => ({ pts, kind: "trait" as const, x: db.trait.get(tid) })),
          ].filter((r) => r.x).sort((a, b) => a.pts - b.pts);
          return (
            <div key={id} className="overflow-hidden rounded-xl border border-line">
              <button type="button" onClick={() => setOpen(isOpen ? null : id)} className="flex w-full items-center gap-2 bg-bg-2 px-3 py-2 text-left hover:bg-panel-2" aria-expanded={isOpen}>
                <span className="font-semibold">{t.name}</span>
                {kind === "P" ? <span className="chip chip-on text-[11px]">Principal</span> : <span className="chip text-[11px] text-muted">Solo salvaje</span>}
                {t.eggOnly && <span className="chip text-[11px]">Solo huevo</span>}
                <span className="ml-auto text-muted">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="fade-in p-2">
                  <table className="data">
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td className="num w-12 text-gold-2">{r.pts}</td>
                          <td>
                            <Link className="link font-medium" href={`/${r.kind === "skill" ? "habilidades" : "rasgos"}/${r.x!.slug}`}>{r.x!.name}</Link>
                            <span className="ml-1.5 text-[11px] text-muted">{r.kind === "skill" ? "habilidad" : "rasgo"}</span>
                            <div className="text-xs text-muted">{"desc" in r.x! ? r.x!.desc : ""}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link className="link mt-2 inline-block text-sm" href={`/talentos/${t.slug}`}>Ver talento completo →</Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Los números son los puntos de talento necesarios para desbloquear cada habilidad o rasgo.</p>
    </Section>
  );
}

function Traits({ db, m }: { db: DB; m: Monster }) {
  const groups: ["S" | "L", string][] = [["S", "Pequeño"], ["L", "Grande"]];
  return (
    <Section title="Rasgos" id="rasgos">
      {m.traits.length === 0 && <Empty>Sin datos de rasgos.</Empty>}
      <div className="space-y-4">
        {groups.map(([size, label]) => {
          const list = m.traits.filter(([, s]) => s === size);
          if (!list.length) return null;
          return (
            <div key={size}>
              <div className="label mb-1.5">{label}</div>
              <ul className="space-y-1.5">
                {list.map(([id, , lv]) => {
                  const t = db.trait.get(id);
                  if (!t) return null;
                  return (
                    <li key={id} className="flex gap-3 rounded-lg bg-bg-2 px-3 py-2">
                      <span className="w-12 shrink-0 text-xs text-muted">Nv {lv}</span>
                      <span className="min-w-0">
                        <Link href={`/rasgos/${t.slug}`} className="link font-medium">{t.name}</Link>
                        <span className="block text-xs text-muted">{t.desc}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function RecipeRow({ db, r, onPick, showResult = false }: { db: DB; r: Recipe; onPick?: (id: number) => void; showResult?: boolean }) {
  const plus = <span className="self-center pb-6 text-xl text-muted">+</span>;
  return (
    <div className="flex flex-wrap items-start justify-center gap-2 rounded-xl bg-bg-2 p-3">
      {r.p ? (
        <>
          <RecipeNode db={db} id={r.p[0]} onPick={onPick} />{plus}<RecipeNode db={db} id={r.p[1]} onPick={onPick} />
        </>
      ) : (
        <>
          <div className="flex items-start gap-1 rounded-lg border border-line p-1.5">
            <RecipeNode db={db} id={r.g[0]} size={40} onPick={onPick} />{plus}<RecipeNode db={db} id={r.g[1]} size={40} onPick={onPick} />
          </div>
          <span className="self-center pb-4 text-xs text-muted">y</span>
          <div className="flex items-start gap-1 rounded-lg border border-line p-1.5">
            <RecipeNode db={db} id={r.g[2]} size={40} onPick={onPick} />{plus}<RecipeNode db={db} id={r.g[3]} size={40} onPick={onPick} />
          </div>
        </>
      )}
      {showResult && (
        <>
          <span className="self-center pb-6 text-xl text-gold">→</span>
          <RecipeNode db={db} id={r.r} onPick={onPick} />
        </>
      )}
    </div>
  );
}

function Synthesis({ db, m }: { db: DB; m: Monster }) {
  const recipes = db.recipesOf.get(m.id) ?? [];
  const used = useMemo(() => db.usedIn.get(m.id) ?? [], [db, m]);
  const [showWild, setShowWild] = useState(false);
  // Recetas en las que este monstruo vale como comodín "cualquier monstruo de su familia/rango".
  const wildcard = useMemo(
    () => db.recipes.filter((r) => !used.includes(r) && r.r !== m.id && recipeSlots(r).some((s) => s < 100 && slotAccepts(s, m))),
    [db, m, used],
  );
  return (
    <Section title="Síntesis" id="sintesis" right={<Link href={`/sintesis?m=${m.slug}`} className="link text-sm">Abrir en el árbol →</Link>}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="label mb-2">Cómo se crea</div>
          {recipes.length ? (
            <div className="space-y-2">{recipes.map((r, i) => <RecipeRow key={i} db={db} r={r} />)}</div>
          ) : (
            <Empty>No se conoce receta: se consigue capturándolo o en huevo.</Empty>
          )}
        </div>
        <div>
          <div className="label mb-2">Para qué sirve ({used.length})</div>
          {used.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
              {[...new Set(used.map((r) => r.r))].map((id) => {
                const x = db.monster.get(id);
                return x ? <RecipeNode key={id} db={db} id={id} size={52} /> : null;
              })}
            </div>
          ) : (
            <Empty>No aparece por nombre en ninguna receta.</Empty>
          )}
          {wildcard.length > 0 && (
            <div className="mt-3">
              <button type="button" className="text-sm text-gold-2 hover:underline" onClick={() => setShowWild(!showWild)}>
                {showWild ? "Ocultar" : "Ver"} {new Set(wildcard.map((r) => r.r)).size} monstruos donde vale como «cualquiera de su familia»
              </button>
              {showWild && (
                <div className="fade-in mt-2 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
                  {[...new Set(wildcard.map((r) => r.r))].map((id) => <RecipeNode key={id} db={db} id={id} size={44} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function Where({ db, m }: { db: DB; m: Monster }) {
  const byPlace = new Map<number, Monster["locations"]>();
  for (const l of m.locations) byPlace.set(l[0], [...(byPlace.get(l[0]) ?? []), l]);
  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <Section title="Dónde encontrarlo" id="donde">
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
            <p className="mt-2 text-xs text-muted">Iconos: estación y clima en que aparece (☀ sol, 🌧 lluvia).</p>
          </div>
        )}
      </Section>
      <Section title="Objetos que suelta">
        {m.items.length === 0 ? <Empty>Sin datos.</Empty> : (
          <ul className="space-y-1.5">
            {m.items.map(([id, rarity]) => {
              const it = db.item.get(id);
              return it ? (
                <li key={id} className="rounded-lg bg-bg-2 px-3 py-2 text-sm">
                  <Link href={`/objetos/${it.slug}`} className="link font-medium">{it.name}</Link>
                  <span className="ml-2 text-xs text-muted">{rarity === "Rare" ? "Raro" : rarity === "Common" ? "Común" : rarity}</span>
                  <span className="block text-xs text-muted">{it.desc}</span>
                </li>
              ) : null;
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
