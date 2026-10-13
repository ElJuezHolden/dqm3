"use client";
import Link from "next/link";
import type { DB } from "@/lib/data";
import { useQueryState } from "@/lib/useQueryState";
import { MapView } from "../MapView";
import { PageHeader, Section, WithData } from "../ui";

export function MapExplorer({ mode }: { mode: "eggs" | "metals" }) {
  return <WithData>{(db) => <Inner db={db} mode={mode} />}</WithData>;
}

function Inner({ db, mode }: { db: DB; mode: "eggs" | "metals" }) {
  const { get, set } = useQueryState();
  const places = db.locations.filter((l) => l.map && (mode === "eggs" ? l.eggSpots.length : l.metalSpots.length));
  const cur = places.find((p) => p.slug === get("l")) ?? places[0];
  const count = (p: (typeof places)[number]) => (mode === "eggs" ? p.eggSpots.length : p.metalSpots.length);

  return (
    <>
      {mode === "eggs" ? (
        <PageHeader title="Huevos" subtitle="Posición de los huevos en cada zona. Elige zona y estación." />
      ) : (
        <PageHeader title="Slimes de metal" subtitle="Dónde aparecen Metal Slime, Liquid Metal Slime y Metal King Slime: los mejores monstruos para subir de nivel." />
      )}
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav className="card h-fit p-2 lg:sticky lg:top-4">
          <ul className="flex gap-1 overflow-x-auto lg:block lg:space-y-0.5">
            {places.map((p) => (
              <li key={p.id} className="shrink-0">
                <button type="button" onClick={() => set({ l: p.slug })}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm ${p === cur ? "bg-gold/15 font-semibold text-gold-2" : "hover:bg-panel-2"}`}>
                  <span className="whitespace-nowrap lg:whitespace-normal">{p.name}</span>
                  <span className="text-xs text-muted">{count(p)}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-5">
          {cur && (
            <Section title={cur.name} right={<Link href={`/lugares/${cur.slug}`} className="link text-sm">Monstruos de la zona →</Link>}>
              <MapView key={cur.id + mode} db={db} place={cur} layers={[mode]} />
            </Section>
          )}
          {mode === "eggs" ? (
            <Section title="Cómo funcionan los huevos">
              <div className="space-y-2 text-sm text-muted">
                <p>Desde el primer mapa de Escalón Medio aparecen huevos por el mundo. Cada huevo da al momento un monstruo al azar con un talento; a veces es un monstruo o un talento que solo sale de huevo. Hay cuatro colores —blanco, plateado, dorado y arcoíris—, cada uno más raro y mejor que el anterior. Algunos solo salen tras avanzar en la historia o acabar el juego, y en zonas más difíciles salen huevos mejores.</p>
                <p className="font-semibold text-text">Truco para conseguir el que quieres:</p>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Desactiva el autoguardado.</li>
                  <li>Coge los 6 huevos de la zona (cada zona genera 6 al entrar).</li>
                  <li>Haz un combate.</li>
                  <li>Viaja a otra zona y guarda.</li>
                  <li>Vuelve a entrar y busca de nuevo.</li>
                  <li>Si no sale lo que buscas, reinicia y repite.</li>
                </ol>
                <p>Filtra en la <Link className="link" href="/monstruos?egg=any">Monsterpedia</Link> los monstruos que salen de huevo.</p>
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </>
  );
}
