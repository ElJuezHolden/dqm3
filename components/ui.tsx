"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { genericFamily, genericRank, isGeneric, useData, type DB } from "@/lib/data";
import { DAMAGE_ES, FAMILY_ES, RANK_COLOR, RES_LABEL, resLevel, STATS_SHORT } from "@/lib/labels";
import { withBase } from "@/lib/paths";
import type { Monster } from "@/lib/types";

const SHEET_W = 1785 / 75;
const SHEET_H = 1725 / 75;

export function Sprite({ db, slug, size = 56, className = "", title }: { db: DB; slug: string; size?: number; className?: string; title?: string }) {
  const [x, y] = db.sprite[slug] ?? db.sprite.unknown ?? [22, 17];
  return (
    <span
      role="img"
      aria-label={title ?? slug}
      title={title}
      className={`sprite inline-block rounded-lg ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${withBase("/img/monsters-sprite.jpg")})`,
        backgroundSize: `${SHEET_W * size}px ${SHEET_H * size}px`,
        backgroundPosition: `${-x * size}px ${-y * size}px`,
      }}
    />
  );
}

export function FamilyIcon({ slug, size = 18 }: { slug: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={withBase(`/img/families/${slug}.png`)} alt={FAMILY_ES[slug] ?? slug} width={size} height={size} className="inline-block shrink-0" />;
}

export function DtIcon({ id, size = 18 }: { id: number; size?: number }) {
  const slug = DT_SLUG[id];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={withBase(`/img/dt/${slug}.png`)} alt={DAMAGE_ES[id]} title={DAMAGE_ES[id]} width={size} height={size} className="inline-block shrink-0" />;
}
export const DT_SLUG: Record<number, string> = {
  1: "fire", 2: "water", 3: "wind", 4: "earth", 5: "explosions", 6: "ice", 7: "electricity", 8: "light", 9: "dark",
  10: "debilitation", 11: "bedazzlement", 12: "antimagic", 13: "mp-absorption", 14: "confusion", 15: "sleep",
  16: "paralysis", 17: "stun", 18: "poison", 19: "instant-death",
};

export function Img({ src, alt, size = 18, className = "" }: { src: string; alt: string; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={withBase(src)} alt={alt} title={alt} width={size} height={size} className={`inline-block shrink-0 ${className}`} />;
}

export function RankBadge({ rank, db, className = "" }: { rank: number; db: DB; className?: string }) {
  const name = rank === 0 ? "Cualq." : db.ranks.find((r) => r.id === rank)?.name ?? "?";
  const color = RANK_COLOR[name] ?? "#94a0bd";
  return (
    <span
      className={`inline-flex min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-black leading-5 ${className}`}
      style={{ background: `color-mix(in srgb, ${color} 22%, transparent)`, color, border: `1px solid color-mix(in srgb, ${color} 50%, transparent)` }}
      title={`Rango ${name}`}
    >
      {name}
    </span>
  );
}

export function familyName(db: DB, id: number) {
  const f = db.family.get(id);
  return f ? FAMILY_ES[f.slug] ?? f.name : "?";
}

export function FamilyTag({ db, id, link = true }: { db: DB; id: number; link?: boolean }) {
  const f = db.family.get(id);
  if (!f) return null;
  const inner = (
    <span className="inline-flex items-center gap-1.5">
      <FamilyIcon slug={f.slug} /> {FAMILY_ES[f.slug] ?? f.name}
    </span>
  );
  return link ? <Link href={`/familias/${f.slug}`} className="link">{inner}</Link> : inner;
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-px" title={`${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "text-gold" : "text-line"}>★</span>
      ))}
    </span>
  );
}

export function ResCell({ id, v, compact = false }: { id: number; v: number; compact?: boolean }) {
  const lvl = resLevel(v);
  return (
    <div className={`res-${lvl} flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs`} title={`${DAMAGE_ES[id]}: ${v}% · ${RES_LABEL[lvl]}`}>
      <DtIcon id={id} size={16} />
      {!compact && <span className="truncate">{DAMAGE_ES[id]}</span>}
      <b className="ml-auto tabular-nums">{v}%</b>
    </div>
  );
}

export function ResLegend() {
  return (
    <div className="flex flex-wrap gap-1.5 text-[11px]">
      {(["weak", "normal", "strong", "vstrong", "immune", "absorb"] as const).map((l) => (
        <span key={l} className={`res-${l} rounded px-1.5 py-0.5`}>{RES_LABEL[l]}</span>
      ))}
    </div>
  );
}

export function StatBars({ values, max = 1500, labels = STATS_SHORT as readonly string[] }: { values: number[]; max?: number; labels?: readonly string[] }) {
  return (
    <div className="space-y-1.5">
      {values.map((v, i) => (
        <div key={i} className="grid grid-cols-[3rem_1fr_3.5rem] items-center gap-2 text-sm">
          <span className="text-muted">{labels[i]}</span>
          <div className="h-2 overflow-hidden rounded-full bg-bg-2">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (v / max) * 100)}%`, background: `linear-gradient(90deg, var(--gold), var(--gold-2))` }} />
          </div>
          <span className="num font-semibold">{v}</span>
        </div>
      ))}
    </div>
  );
}

/** Enlace a monstruo con su sprite. */
export function MonsterLink({ db, m, size = 40, sub, className = "" }: { db: DB; m: Monster; size?: number; sub?: ReactNode; className?: string }) {
  return (
    <Link href={`/monstruos/${m.slug}`} className={`group inline-flex items-center gap-2 ${className}`}>
      <Sprite db={db} slug={m.slug} size={size} />
      <span className="min-w-0">
        <span className="block truncate font-medium group-hover:text-gold-2">{m.name}</span>
        {sub && <span className="block truncate text-xs text-muted">{sub}</span>}
      </span>
    </Link>
  );
}

/** Tarjeta pequeña de monstruo para rejillas. */
export function MonsterTile({ db, m, extra, href }: { db: DB; m: Monster; extra?: ReactNode; href?: string }) {
  const f = db.family.get(m.family);
  return (
    <Link href={href ?? `/monstruos/${m.slug}`} className="card card-hover flex flex-col items-center gap-1 p-2 text-center">
      <Sprite db={db} slug={m.slug} size={64} />
      <span className="line-clamp-2 text-xs font-medium leading-tight">{m.name}</span>
      <span className="flex items-center gap-1">
        {f && <FamilyIcon slug={f.slug} size={14} />}
        <RankBadge db={db} rank={m.rank} />
      </span>
      {extra && <span className="text-[11px] text-muted">{extra}</span>}
    </Link>
  );
}

/** Nodo de receta: monstruo concreto o "cualquier monstruo de familia X (rango Y)". */
export function RecipeNode({ db, id, size = 48, onPick }: { db: DB; id: number; size?: number; onPick?: (id: number) => void }) {
  if (isGeneric(id)) {
    const f = db.family.get(genericFamily(id));
    const r = genericRank(id);
    return (
      <div className="flex flex-col items-center gap-1 text-center" style={{ width: size + 40 }}>
        <span className="grid place-items-center rounded-lg border border-dashed border-line bg-bg-2" style={{ width: size, height: size }}>
          {f && <FamilyIcon slug={f.slug} size={size * 0.55} />}
        </span>
        <span className="text-[11px] leading-tight text-muted">
          Cualquier {f ? FAMILY_ES[f.slug] ?? f.name : "?"}
          {r ? <> · <RankBadge db={db} rank={r} /></> : null}
        </span>
      </div>
    );
  }
  const m = db.monster.get(id);
  if (!m) return null;
  const content = (
    <>
      <Sprite db={db} slug={m.slug} size={size} />
      <span className="line-clamp-2 text-[11px] font-medium leading-tight">{m.name}</span>
      <RankBadge db={db} rank={m.rank} />
    </>
  );
  return onPick ? (
    <button type="button" onClick={() => onPick(id)} className="flex flex-col items-center gap-1 text-center hover:text-gold-2" style={{ width: size + 40 }}>
      {content}
    </button>
  ) : (
    <Link href={`/monstruos/${m.slug}`} className="flex flex-col items-center gap-1 text-center hover:text-gold-2" style={{ width: size + 40 }}>
      {content}
    </Link>
  );
}

export function PageHeader({ title, subtitle, children, icon }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode; icon?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h1 className="h-title text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </header>
  );
}

export function Section({ title, id, children, right, className = "" }: { title: ReactNode; id?: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section id={id} className={`card scroll-mt-24 p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="h-title text-lg font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Loading() {
  return (
    <div className="grid min-h-[40vh] place-items-center text-muted">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold" />
        <span className="text-sm">Cargando la enciclopedia…</span>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">{children}</p>;
}

export function NotFound({ what }: { what: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-lg font-semibold">No encuentro ese {what}.</p>
      <Link href="/" className="link mt-2 inline-block">Volver al inicio</Link>
    </div>
  );
}

/** Envuelve una página cliente: espera a que carguen los datos. */
export function WithData({ children }: { children: (db: DB) => ReactNode }) {
  const db = useData();
  if (!db) return <Loading />;
  return <>{children(db)}</>;
}
