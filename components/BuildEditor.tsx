"use client";
import Link from "next/link";
import { useState } from "react";
import type { Build, BuildResult, Sparkle } from "@/lib/build";
import type { DB } from "@/lib/data";
import { ELEMENT_IDS, STATS, STATS_SHORT, STATUS_IDS } from "@/lib/labels";
import { accessoryOptions, monsterOptions, parentOptions, talentOptions } from "./options";
import { MultiPicker, Picker } from "./Picker";
import { ResCell, ResLegend } from "./ui";

function Slider({ label, value, min, max, onChange, hint }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-sm">
        <span className="label">{label}</span>
        <span className="flex items-center gap-2">
          {hint && <span className="text-xs text-gold-2">{hint}</span>}
          <input type="number" className="input w-16 px-2 py-0.5 text-right text-sm" value={value} min={min} max={max}
            onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))} />
        </span>
      </span>
      <input type="range" className="w-full" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

/** Editor de un monstruo montado: padres, tamaño, chispa, talentos y accesorio. */
export function BuildEditor({ db, build, onChange, showMonster = true }: { db: DB; build: Build; onChange: (b: Build) => void; showMonster?: boolean }) {
  const [tree, setTree] = useState(build.p1 != null || build.p1g1 != null);
  const up = (patch: Partial<Build>) => onChange({ ...build, ...patch });
  const m = build.monster != null ? db.monster.get(build.monster) : null;
  // Talentos sugeridos: los del propio monstruo primero.
  const own = new Set(m?.talents.map(([id]) => id) ?? []);
  const talents = [...talentOptions(db)].sort((a, b) => Number(own.has(b.id)) - Number(own.has(a.id)))
    .map((o) => (own.has(o.id) ? { ...o, sub: `★ Talento de ${m?.name}${o.sub ? " · " + o.sub : ""}` } : o));

  return (
    <div className="space-y-4">
      {showMonster && <Picker label="Monstruo" options={monsterOptions(db)} value={build.monster} onChange={(v) => up({ monster: v })} placeholder="Elige monstruo…" />}

      <Slider label="Tamaño" value={build.size} min={1} max={100} onChange={(v) => up({ size: v })}
        hint={build.size > 50 ? "🦣 Grande (ocupa 2 huecos)" : "Pequeño"} />

      <div className="rounded-xl border border-line">
        <button type="button" onClick={() => setTree(!tree)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold">
          🌳 Árbol familiar (padres y abuelos)
          <span className="text-muted">{tree ? "▲" : "▼"}</span>
        </button>
        {tree && (
          <div className="fade-in space-y-3 border-t border-line p-3">
            <p className="text-xs text-muted">Cada familia sube 3 stats. Los padres cuentan el doble que los abuelos y el bonus crece con el nivel de los padres. Con 4 abuelos de familias distintas, +bonus a todo.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Picker label="Abuelo 1-A" options={parentOptions(db)} value={build.p1g1} onChange={(v) => up({ p1g1: v })} placeholder="—" />
              <Picker label="Abuelo 1-B" options={parentOptions(db)} value={build.p1g2} onChange={(v) => up({ p1g2: v })} placeholder="—" />
              <Picker label="Abuelo 2-A" options={parentOptions(db)} value={build.p2g1} onChange={(v) => up({ p2g1: v })} placeholder="—" />
              <Picker label="Abuelo 2-B" options={parentOptions(db)} value={build.p2g2} onChange={(v) => up({ p2g2: v })} placeholder="—" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Picker label="Padre 1" options={parentOptions(db)} value={build.p1} onChange={(v) => up({ p1: v })} placeholder="—" />
                {build.p1 != null && <Slider label="Nivel padre 1" value={build.p1Level} min={10} max={100} onChange={(v) => up({ p1Level: v })} />}
              </div>
              <div className="space-y-2">
                <Picker label="Padre 2" options={parentOptions(db)} value={build.p2} onChange={(v) => up({ p2: v })} placeholder="—" />
                {build.p2 != null && <Slider label="Nivel padre 2" value={build.p2Level} min={10} max={100} onChange={(v) => up({ p2Level: v })} />}
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="label mb-1">Chispa (+100 al tope de una stat)</div>
        <div className="flex flex-wrap gap-1.5">
          {[-1, 0, 1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => up({ sparkle: i as Sparkle })} className={`chip ${build.sparkle === i ? "chip-on" : ""}`}>
              {i < 0 ? "Ninguna" : `✨ ${STATS_SHORT[i]}`}
            </button>
          ))}
        </div>
      </div>

      <MultiPicker label="Talentos (máx. 3)" options={talents} values={build.talents} max={3} onChange={(v) => up({ talents: v })} placeholder="Añadir talento…" />
      <Picker label="Accesorio" options={accessoryOptions(db)} value={build.accessory} onChange={(v) => up({ accessory: v })} placeholder="Sin accesorio" />
    </div>
  );
}

export function StatTable({ result, breakdown = false }: { result: BuildResult; breakdown?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="data">
        <thead>
          <tr><th></th>{STATS.map((s) => <th key={s} className="num">{s}</th>)}</tr>
        </thead>
        <tbody>
          {breakdown && result.breakdown.map((r) => (
            <tr key={r.label}>
              <td className="whitespace-nowrap text-muted">{r.label}</td>
              {r.values.map((v, i) => <td key={i} className={`num ${v === 0 ? "text-muted/50" : v < 0 ? "text-red-300" : ""}`}>{v > 0 && r.label !== "Base del monstruo" ? "+" : ""}{v}</td>)}
            </tr>
          ))}
          <tr>
            <td className="font-semibold text-gold-2">Total</td>
            {result.stats.map((v, i) => <td key={i} className="num text-base font-bold text-gold-2">{v}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function ResultResistances({ result }: { result: BuildResult }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {ELEMENT_IDS.map((id) => <ResCell key={id} id={id} v={result.res[id - 1]} />)}
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {STATUS_IDS.map((id) => <ResCell key={id} id={id} v={result.res[id - 1]} />)}
      </div>
      <div className="mt-2"><ResLegend /></div>
    </div>
  );
}

export function ResultTraits({ result }: { result: BuildResult }) {
  return (
    <ul className="space-y-1.5">
      {result.traits.map(({ trait, source }) => (
        <li key={trait.id} className="rounded-lg bg-bg-2 px-3 py-1.5 text-sm">
          <Link href={`/rasgos/${trait.slug}`} className="link font-medium">{trait.name}</Link>
          <span className="ml-2 text-[11px] text-muted">de {source}</span>
          <span className="block text-xs text-muted">{trait.desc}</span>
        </li>
      ))}
    </ul>
  );
}
