"use client";
import { useState } from "react";
import type { DB } from "@/lib/data";
import { METAL_ES, SEASON_ES } from "@/lib/labels";
import { withBase } from "@/lib/paths";
import type { Place } from "@/lib/types";
import { Img } from "./ui";

const METAL_IMG = { Metal: "metal-slime", Liquid: "liquid-metal-slime", King: "metal-king-slime" } as const;

/** Mapa de una zona con marcadores de huevos y/o slimes de metal; filtrable por estación y con zoom. */
export function MapView({ db, place, layers = ["eggs", "metals"] }: { db: DB; place: Place; layers?: ("eggs" | "metals")[] }) {
  const [season, setSeason] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [show, setShow] = useState({ eggs: layers.includes("eggs"), metals: layers.includes("metals") });
  if (!place.map) return null;
  const inSeason = (s: number[]) => !season || s.includes(season);
  const eggs = show.eggs ? place.eggSpots.filter((e) => inSeason(e[2])) : [];
  const metals = show.metals ? place.metalSpots.filter((e) => inSeason(e[3])) : [];
  const hasEggs = place.eggSpots.length > 0;
  const hasMetals = place.metalSpots.length > 0;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => setSeason(0)} className={`chip ${season === 0 ? "chip-on" : ""}`}>Todas las estaciones</button>
        {db.seasons.map((s) => (
          <button key={s.id} type="button" onClick={() => setSeason(s.id)} className={`chip ${season === s.id ? "chip-on" : ""}`}>
            <Img src={`/img/seasons/${s.slug}.png`} alt="" size={14} /> {SEASON_ES[s.id]}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        {hasEggs && (
          <label className="chip cursor-pointer"><input type="checkbox" checked={show.eggs} onChange={(e) => setShow({ ...show, eggs: e.target.checked })} /> 🥚 Huevos ({place.eggSpots.length})</label>
        )}
        {hasMetals && (
          <label className="chip cursor-pointer"><input type="checkbox" checked={show.metals} onChange={(e) => setShow({ ...show, metals: e.target.checked })} /> 🪙 Metal ({place.metalSpots.length})</label>
        )}
        <span className="ml-auto flex gap-1">
          <button type="button" className="btn px-2.5 py-1" onClick={() => setZoom(Math.max(1, zoom - 0.5))} aria-label="Alejar">−</button>
          <button type="button" className="btn px-2.5 py-1" onClick={() => setZoom(Math.min(4, zoom + 0.5))} aria-label="Acercar">＋</button>
        </span>
      </div>
      <div className="max-h-[75vh] overflow-auto rounded-xl border border-line bg-bg-2">
        <div className="relative mx-auto" style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? 760 : undefined }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBase(`/img/maps/${place.slug}.jpg`)} alt={`Mapa de ${place.name}`} className="block w-full select-none" draggable={false} />
          {eggs.map(([x, y, s], i) => (
            <span key={"e" + i} className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_1px_2px_rgba(0,0,0,.9)]" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
              title={`Huevo · ${s.length === 4 ? "todo el año" : s.map((id) => SEASON_ES[id]).join(", ")}`}>
              <Img src="/img/ui/egg.png" alt="Huevo" size={22 + zoom * 2} />
            </span>
          ))}
          {metals.map(([x, y, t, s], i) => (
            <span key={"m" + i} className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_1px_2px_rgba(0,0,0,.9)]" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
              title={`${METAL_ES[t]} · ${s.length === 4 ? "todo el año" : s.map((id) => SEASON_ES[id]).join(", ")}`}>
              <Img src={`/img/metal/${METAL_IMG[t]}.png`} alt={METAL_ES[t]} size={24 + zoom * 2} />
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        {eggs.length + metals.length} marcadores visibles. Pasa el ratón por encima para ver en qué estaciones aparecen.
        {hasMetals && <> Leyenda: <Img src="/img/metal/metal-slime.png" alt="" size={14} /> Metal · <Img src="/img/metal/liquid-metal-slime.png" alt="" size={14} /> Liquid · <Img src="/img/metal/metal-king-slime.png" alt="" size={14} /> King.</>}
      </p>
    </div>
  );
}
