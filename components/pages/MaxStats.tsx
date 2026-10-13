"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeBuild, emptyBuild, type Build } from "@/lib/build";
import type { DB } from "@/lib/data";
import { useQueryState } from "@/lib/useQueryState";
import { BuildEditor, ResultResistances, ResultTraits, StatTable } from "../BuildEditor";
import { Empty, PageHeader, RankBadge, Section, Sprite, WithData } from "../ui";

const KEY = "dqm3-stats";

export function MaxStats() {
  return <WithData>{(db) => <Inner db={db} />}</WithData>;
}

function Inner({ db }: { db: DB }) {
  const { get, set } = useQueryState();
  // Este componente solo se monta en el cliente (espera a los datos), así que puede leer localStorage al iniciar.
  const [build, setBuild] = useState<Build>(() => {
    let b = emptyBuild();
    try { b = { ...b, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { /* nada guardado */ }
    const m = Number(get("m"));
    return m && db.monster.has(m) ? { ...b, monster: m } : b;
  });
  useEffect(() => { if (get("m")) set({ m: null }); }, [get, set]);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(build)); } catch { /* sin almacenamiento */ }
  }, [build]);

  const result = useMemo(() => computeBuild(db, build), [db, build]);

  return (
    <>
      <PageHeader title="Stats máximos" subtitle="El tope de cada stat depende del monstruo, su tamaño, el rasgo táctico, la familia y nivel de padres y abuelos, la chispa, los talentos y el accesorio." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Section title="Configuración" right={<button type="button" className="text-sm text-muted hover:text-text" onClick={() => setBuild(emptyBuild(build.monster))}>Reiniciar</button>}>
          <BuildEditor db={db} build={build} onChange={setBuild} />
        </Section>
        <div className="space-y-5">
          {!result ? <Empty>Elige un monstruo para calcular.</Empty> : (
            <>
              <Section title="Resultado">
                <div className="mb-3 flex items-center gap-3">
                  <Sprite db={db} slug={result.monster.slug} size={56} />
                  <div>
                    <Link href={`/monstruos/${result.monster.slug}`} className="link text-lg font-semibold">{result.monster.name}</Link>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <RankBadge db={db} rank={result.monster.rank} /> {result.large ? "Grande" : "Pequeño"}
                      {result.tactical.trait && <> · {result.tactical.trait.name} (×{result.tactical.factor})</>}
                      {result.parentLevels > 0 && <> · niveles de padres: {result.parentLevels}</>}
                      {result.differentFamilies && <> · 4 familias distintas ✓</>}
                    </div>
                  </div>
                </div>
                <StatTable result={result} breakdown />
              </Section>
              <Section title="Resistencias resultantes"><ResultResistances result={result} /></Section>
              <Section title="Rasgos activos"><ResultTraits result={result} /></Section>
            </>
          )}
          <details className="card p-4 text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-text">¿Cómo se calcula?</summary>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li><b className="text-text">Tamaño</b> (1–100): cada punto por encima de 50 suma defensa y resta agilidad (y al revés). Desde 51 es grande: PV/PM ×1,5 y el resto ×1,1.</li>
              <li><b className="text-text">Rasgos tácticos</b> (atacar varias veces) reducen todo: Trooper −10 %, Commander/Genius −20 %, Titan −30 %.</li>
              <li><b className="text-text">Padres</b>: la suma de sus niveles multiplica el bonus de familia. Dos padres a nivel 100 suman un 4 % por cada stat que suba su familia; los abuelos añaden más bonus (los padres cuentan doble).</li>
              <li><b className="text-text">4 abuelos de familias distintas</b>: bonus extra en las 6 stats.</li>
              <li><b className="text-text">Chispa</b>: +100 al tope de una stat al azar.</li>
              <li><b className="text-text">Talentos y accesorios</b> suman directamente al final.</li>
            </ul>
            <p className="mt-2 font-mono text-xs">floor(ceil(máx × tamaño × táctico) × (1 + nivelesPadres × bonus × 0,0001)) + chispa + extraTamaño + talentos + accesorio</p>
          </details>
        </div>
      </div>
    </>
  );
}
