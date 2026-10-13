"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { computeBuild, emptyBuild, type Build } from "@/lib/build";
import type { DB } from "@/lib/data";
import { DAMAGE_ES, TARGET_ES, tr } from "@/lib/labels";
import type { Skill } from "@/lib/types";
import { useQueryState } from "@/lib/useQueryState";
import { BuildEditor, StatTable } from "../BuildEditor";
import { monsterOptions, skillOptions } from "../options";
import { Picker } from "../Picker";
import { DtIcon, Empty, PageHeader, Section, WithData } from "../ui";

const KEY = "dqm3-dano";

/** level es el nivel de tu monstruo (lo usan las habilidades de daño por nivel). */
interface Enemy { def: number; res: number; level: number; monster: number | null }

export function DamageCalc() {
  return <WithData>{(db) => <Inner db={db} />}</WithData>;
}

/** Fórmulas de la web original (fuente: datamine japonés). Devuelve [mín, máx] o null si no aplica. */
function damage(skill: Skill | null, att: number, wis: number, e: Enemy): [number, number] | null {
  const resist = (v: number) => v - v * (e.res / 100);
  if (!skill) {
    const d = Math.max((att * 2 - e.def) / 4, 1);
    return [Math.floor(d * 0.9375), Math.floor(d * 1.0625)];
  }
  if (skill.calc === "Spell" && skill.wmin != null && skill.wmax != null && skill.dmin != null && skill.dmax != null) {
    const mid = Math.min(Math.max(wis, skill.wmin), skill.wmax) - skill.wmin;
    const d = (mid / (skill.wmax - skill.wmin)) * (skill.dmax - skill.dmin) + skill.dmin;
    return [Math.floor(resist(Math.floor(d * 0.95))), Math.floor(resist(Math.floor(d * 1.05)))];
  }
  if (skill.calc === "Attack") {
    const d = resist(Math.max((att * 2 - e.def) / 4, 1));
    return [Math.floor(d * 0.9375), Math.floor(d * 1.0625)];
  }
  if (skill.calc === "Level" && skill.mag != null && skill.dmin != null) {
    const lo = resist(e.level * skill.mag + skill.dmin);
    const hi = resist(e.level * skill.mag + Math.max(skill.dmax ?? 0, skill.dmin));
    return [Math.floor(lo * 0.9375), Math.floor(hi * 1.0625)];
  }
  if (skill.calc === "Damage" && skill.dmin != null && skill.dmax != null) {
    return [Math.floor(resist(skill.dmin) * 0.9375), Math.floor(resist(skill.dmax) * 1.0625)];
  }
  return null;
}

function Inner({ db }: { db: DB }) {
  const { get, set } = useQueryState();
  const [state, setState] = useState(() => {
    let s = { build: emptyBuild() as Build, skill: null as number | null, enemy: { def: 300, res: 0, level: 100, monster: null } as Enemy, attOv: "", wisOv: "" };
    try { s = { ...s, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { /* nada */ }
    const sk = db.skillBySlug.get(get("s"));
    return sk ? { ...s, skill: sk.id } : s;
  });
  useEffect(() => { if (get("s")) set({ s: null }); }, [get, set]);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* nada */ } }, [state]);

  const result = useMemo(() => computeBuild(db, state.build), [db, state]);
  const skill = state.skill != null ? db.skill.get(state.skill) ?? null : null;
  const att = state.attOv ? Number(state.attOv) : result?.stats[2] ?? 0;
  const wis = state.wisOv ? Number(state.wisOv) : result?.stats[5] ?? 0;
  const dmg = result || state.attOv || state.wisOv ? damage(skill, att, wis, state.enemy) : null;
  const up = (p: Partial<typeof state>) => setState({ ...state, ...p });
  const upE = (p: Partial<Enemy>) => up({ enemy: { ...state.enemy, ...p } });

  // Si hay talentos elegidos, primero sus habilidades.
  const talentSkills = new Set(state.build.talents.flatMap((t) => db.talent.get(t)?.skills.map(([id]) => id) ?? []));
  const skills = [
    { id: -1, label: "Ataque normal", sub: "Ataque físico básico" },
    ...[...skillOptions(db)].filter((o) => db.skill.get(o.id)?.typeSlug === "attacking")
      .sort((a, b) => Number(talentSkills.has(b.id)) - Number(talentSkills.has(a.id)))
      .map((o) => (talentSkills.has(o.id) ? { ...o, sub: "★ De tus talentos · " + o.sub } : o)),
  ];

  const enemy = state.enemy.monster != null ? db.monster.get(state.enemy.monster) : null;
  const pickEnemy = (id: number | null) => {
    const m = id != null ? db.monster.get(id) : null;
    const dt = skill?.damageTypes[0];
    upE({ monster: id, ...(m ? { def: m.max[3], res: dt ? m.res[dt - 1] : state.enemy.res } : {}) });
  };
  const pickSkill = (id: number | null) => {
    const s = id != null && id >= 0 ? db.skill.get(id) : null;
    const dt = s?.damageTypes[0];
    up({ skill: s?.id ?? null, enemy: enemy && dt ? { ...state.enemy, res: enemy.res[dt - 1] } : state.enemy });
  };

  return (
    <>
      <PageHeader title="Calculadora de daño" subtitle="Daño aproximado de un ataque o habilidad según tus stats y la defensa/resistencia del rival. Aún no aplica los rasgos que suben el daño." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Section title="Tu monstruo">
          <BuildEditor db={db} build={state.build} onChange={(b) => up({ build: b })} />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <label><span className="label">Nivel</span><input type="number" className="input mt-1" value={state.enemy.level} onChange={(e) => upE({ level: Number(e.target.value) || 1 })} /></label>
            <label><span className="label">Forzar ataque</span><input className="input mt-1" inputMode="numeric" placeholder={String(result?.stats[2] ?? "")} value={state.attOv} onChange={(e) => up({ attOv: e.target.value.replace(/\D/g, "") })} /></label>
            <label><span className="label">Forzar sabiduría</span><input className="input mt-1" inputMode="numeric" placeholder={String(result?.stats[5] ?? "")} value={state.wisOv} onChange={(e) => up({ wisOv: e.target.value.replace(/\D/g, "") })} /></label>
          </div>
        </Section>
        <div className="space-y-5">
          <Section title="Habilidad">
            <Picker options={skills} value={state.skill ?? -1} onChange={pickSkill} clearable={false} />
            {skill && (
              <div className="mt-3 rounded-lg bg-bg-2 p-3 text-sm">
                <Link href={`/habilidades/${skill.slug}`} className="link font-semibold">{skill.name}</Link>
                <p className="text-muted">{skill.desc}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                  {skill.damageTypes.map((d) => <span key={d} className="chip"><DtIcon id={d} size={14} /> {DAMAGE_ES[d]}</span>)}
                  {skill.target && <span className="chip">{tr(TARGET_ES, skill.target)}</span>}
                  {skill.mp != null && <span className="chip">{skill.mp} PM</span>}
                  {skill.notes && <span className="chip">{skill.notes}</span>}
                </div>
              </div>
            )}
          </Section>
          <Section title="Rival">
            <Picker options={monsterOptions(db)} value={state.enemy.monster} onChange={pickEnemy} placeholder="(Opcional) elige un monstruo para rellenar sus datos" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label><span className="label">Defensa</span><input type="number" className="input mt-1" value={state.enemy.def} onChange={(e) => upE({ def: Number(e.target.value) || 0 })} /></label>
              <label><span className="label">Resistencia %</span><input type="number" className="input mt-1" value={state.enemy.res} onChange={(e) => upE({ res: Number(e.target.value) || 0 })} /></label>
            </div>
            <p className="mt-2 text-xs text-muted">Resistencia: 0 normal, 25–49 resiste, 50–99 resiste mucho, 100 inmune, &gt;100 absorbe, negativo débil.</p>
          </Section>
          <Section title="Resultado">
            {!result && !state.attOv && !state.wisOv ? <Empty>Elige tu monstruo (o fuerza ataque/sabiduría).</Empty> : dmg ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <div className="label">Daño por golpe</div>
                    <div className="h-title text-4xl font-bold text-gold-2">{dmg[0]}–{dmg[1]}</div>
                  </div>
                  <div>
                    <div className="label">Golpes</div>
                    <div className="text-2xl font-semibold">{skill?.hmin ?? 1}{skill && skill.hmax !== skill.hmin ? `–${skill.hmax}` : ""}</div>
                  </div>
                  {skill && (skill.hmax ?? 1) > 1 && (
                    <div>
                      <div className="label">Total</div>
                      <div className="text-2xl font-semibold">{dmg[0] * (skill.hmin ?? 1)}–{dmg[1] * (skill.hmax ?? 1)}</div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted">Usando ataque {att} y sabiduría {wis}.{skill?.calc === "Spell" && " Los hechizos dependen de la sabiduría, no de la defensa rival."}{skill?.calc === "Level" && " Depende de tu nivel."}</p>
                {result && <StatTable result={result} />}
              </div>
            ) : <Empty>Esta habilidad no tiene fórmula de daño conocida.</Empty>}
          </Section>
        </div>
      </div>
    </>
  );
}
