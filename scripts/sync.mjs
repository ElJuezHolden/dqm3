// Descarga los datos de DQM3 de dev.metalkid.info y los deja normalizados en public/data/dqm3.json.
// La web original sirve cada tabla como un script `window.x=[...]`; aquí se parsea como literal
// (sin ejecutar nada) y se convierte en un JSON con relaciones ya resueltas.
import { writeFile, mkdir } from "node:fs/promises";

const BASE = "https://dev.metalkid.info/api/v1/DQM3/";
const ENDPOINTS = {
  monsters: "Monsterpedia/Data",
  families: "Families/Data",
  familiesLookup: "Lookup/Families",
  ranks: "Lookup/Ranks",
  seasons: "Lookup/Seasons",
  weather: "Lookup/Weather",
  damageTypes: "Lookup/DamageTypes",
  combinations: "Lookup/Combinations",
  talents: "Talents/Data",
  talentsLookup: "Lookup/Talents",
  skills: "Skills/Data",
  traits: "Traits/Data",
  traitsLookup: "Lookup/Traits",
  traitResistances: "Lookup/TraitResistances",
  items: "Items/Data",
  itemsLookup: "Lookup/Items",
  locations: "Locations/Data",
  locationsLookup: "Lookup/Locations",
  eggs: "EggLocations/Data",
  metals: "MetalSlimeLocations/Data",
};

// Parser mínimo de literales JS: objetos, arrays, cadenas, números, null, !0/!1 y claves sin comillas.
function parseLiteral(src) {
  let i = src.indexOf("=") + 1;
  const ws = () => { while (/\s/.test(src[i])) i++; };
  function value() {
    ws();
    const c = src[i];
    if (c === "[") {
      i++; const out = []; ws();
      if (src[i] === "]") { i++; return out; }
      for (;;) { out.push(value()); ws(); if (src[i] === ",") { i++; continue; } if (src[i] === "]") { i++; return out; } throw new Error("array @" + i); }
    }
    if (c === "{") {
      i++; const out = {}; ws();
      if (src[i] === "}") { i++; return out; }
      for (;;) {
        ws();
        let key;
        if (src[i] === '"') key = str(); else { const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i, i + 64)); key = m[0]; i += key.length; }
        ws(); if (src[i++] !== ":") throw new Error("colon @" + i);
        out[key] = value(); ws();
        if (src[i] === ",") { i++; continue; }
        if (src[i] === "}") { i++; return out; }
        throw new Error("object @" + i);
      }
    }
    if (c === '"') return str();
    if (src.startsWith("!0", i)) { i += 2; return true; }
    if (src.startsWith("!1", i)) { i += 2; return false; }
    if (src.startsWith("null", i)) { i += 4; return null; }
    if (src.startsWith("true", i)) { i += 4; return true; }
    if (src.startsWith("false", i)) { i += 5; return false; }
    const m = /^-?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?/i.exec(src.slice(i, i + 40));
    if (m) { i += m[0].length; return Number(m[0]); }
    throw new Error(`token inesperado "${src.slice(i, i + 20)}"`);
  }
  function str() {
    let j = i + 1;
    while (src[j] !== '"') j += src[j] === "\\" ? 2 : 1;
    const raw = src.slice(i, j + 1); i = j + 1;
    return JSON.parse(raw.replace(/\\'/g, "'"));
  }
  return value();
}

async function fetchAll() {
  const out = {};
  await Promise.all(Object.entries(ENDPOINTS).map(async ([k, path]) => {
    const res = await fetch(BASE + path, { headers: { "User-Agent": "Mozilla/5.0 dqm3-v2-sync" } });
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    out[k] = parseLiteral(await res.text());
  }));
  return out;
}

// "a|b|c,d|e|f," → [["a","b","c"],["d","e","f"]]
const rows = (s) => (s ?? "").split(",").filter(Boolean).map((r) => r.split("|"));
const ids = (s) => (s ?? "").split(",").filter(Boolean).map(Number);
const n = (v) => (v == null ? 0 : v);
const stat6 = (o, p = "") => ["hp", "mp", "att", "def", "agi", "wis"].map((k) => n(o[p + k]));
// Orden de resistencias = id de tipo de daño (1 Fuego … 19 Muerte instantánea).
const RES_KEYS = ["rfi", "rwa", "rwi", "rea", "rex", "ric", "rel", "rli", "rda", "rde", "rbe", "ram", "rmp", "rco", "rsl", "rpa", "rst", "rpo", "rid"];
// Algunos registros vienen sin slug: se genera desde el nombre.
const slugify = (name) => name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’.]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const slugOf = (x) => x.i || slugify(x.n);
const clean = (s) => (s == null || s === "" ? null : String(s).trim());

function normalize(raw) {
  const fam = new Map(raw.familiesLookup.map((f) => [f.id, f]));
  const families = raw.families
    .map((f) => ({ id: f.id, slug: slugOf(f), name: f.n, jp: f.jn, order: fam.get(f.id)?.o ?? f.id, bonus: stat6(f, "b") }))
    .sort((a, b) => a.order - b.order);

  const ranks = raw.ranks.filter((r) => r.id <= 9).map((r) => ({ id: r.id, name: r.n }));

  const monsters = raw.monsters
    .filter((m) => m.id > 100)
    .map((m) => ({
      id: m.id,
      num: m.num || null,
      slug: slugOf(m),
      name: m.n,
      jp: m.jn,
      fr: m.frn,
      family: Number(m.fid),
      rank: Number(m.raid),
      stars: stat6(m),
      max: stat6(m, "m"),
      res: RES_KEYS.map((k) => n(m[k])),
      egg: clean(m.en),
      trivia: clean(m.tv),
      talents: rows(m.ta).map(([id, k]) => [Number(id), k]),
      traits: rows(m.tr).map(([id, size, lv]) => [Number(id), size, Number(lv)]),
      locations: rows(m.l).map(([loc, season, weather, boss]) => [Number(loc), Number(season), Number(weather), boss === "Y" ? 1 : 0]),
      items: rows(m.it).map(([id, rarity]) => [Number(id), rarity]),
    }))
    .sort((a, b) => (a.num ?? 9999) - (b.num ?? 9999) || a.name.localeCompare(b.name));

  // Recetas: p = dos padres; g = cuatro abuelos (síntesis "cuádruple").
  const seen = new Set();
  const recipes = [];
  for (const c of raw.combinations) {
    const rec = c.p1 ? { r: c.r, p: [c.p1, c.p2] } : { r: c.r, g: [c.p1g1, c.p1g2, c.p2g1, c.p2g2] };
    const key = JSON.stringify(rec);
    if (!seen.has(key)) { seen.add(key); recipes.push(rec); }
  }

  const talentLk = new Map(raw.talentsLookup.map((t) => [t.id, t]));
  const talents = raw.talents
    .map((t) => ({
      id: t.id,
      slug: slugOf(t),
      name: t.n,
      jp: t.jn,
      eggOnly: !!t.eo,
      bonus: stat6(t, "b"),
      skills: rows(t.s).map(([id, p]) => [Number(id), Number(p)]).sort((a, b) => a[1] - b[1]),
      traits: rows(t.t).map(([id, p]) => [Number(id), Number(p)]).sort((a, b) => a[1] - b[1]),
      monsters: rows(t.m).map(([id, k]) => [Number(id), k]),
      parents: (t.pt ?? "").split(",").filter(Boolean).map((g) => g.split("|").filter(Boolean).map(Number)),
      hasSkills: !!talentLk.get(t.id)?.hs,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const skills = raw.skills
    .map((s) => ({
      id: s.id,
      slug: slugOf(s),
      name: s.n,
      jp: s.jn,
      desc: s.d,
      type: s.stn,
      typeSlug: s.sti,
      target: s.sttn,
      mp: s.mp,
      mpType: s.mpi,
      damageTypes: ids(s.dt),
      attackType: s.atn,
      statEffect: s.ssen,
      damageFamily: s.dfn,
      damageLevel: s.dln,
      calc: s.ct,
      power: s.p,
      wmin: s.wmin, wmax: s.wmax, dmin: s.dmin, dmax: s.dmax,
      hmin: s.nhmin, hmax: s.nhmax, mag: s.mag,
      scmin: s.scmin, scmax: s.scmax,
      notes: clean(s.notes),
      talents: rows(s.t).map(([id, p]) => [Number(id), Number(p)]),
      monsters: rows(s.m).map(([id, p, t]) => [Number(id), Number(p), Number(t)]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const traitLk = new Map(raw.traitsLookup.map((t) => [t.id, t]));
  const traits = raw.traits
    .map((t) => {
      const lk = traitLk.get(t.id) ?? {};
      return {
        id: t.id,
        slug: slugOf(t),
        name: t.n,
        jp: t.jn,
        desc: t.d,
        notes: clean(t.no),
        stat: stat6(lk),
        res: rows(lk.rids).map(([dt, v]) => [Number(dt), Number(v)]),
        isStat: !!t.iss,
        talents: rows(t.t).map(([id, p]) => [Number(id), Number(p)]),
        talentMonsters: rows(t.tam).map(([m, p, tal]) => [Number(m), Number(p), Number(tal)]),
        monsters: rows(t.trm).map(([m, size, lv]) => [Number(m), size, Number(lv)]),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const itemLk = new Map(raw.itemsLookup.map((it) => [it.id, it]));
  const items = raw.items
    .map((it) => {
      const lk = itemLk.get(it.id) ?? {};
      return {
        id: it.id,
        slug: slugOf(it),
        name: it.n,
        desc: it.d,
        type: it.itn,
        buy: it.bp,
        sell: it.sp,
        notes: clean(it.nt),
        stats: stat6(lk),
        traits: ids(lk.tr),
        monsters: rows(it.m).map(([id, r]) => [Number(id), r]),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const locLk = new Map(raw.locationsLookup.map((l) => [l.id, l]));
  const seasonIds = (s) => ids(s);
  const locations = raw.locations
    .map((l) => ({
      id: l.id,
      slug: slugOf(l),
      name: l.n,
      jp: l.jn,
      eggs: !!locLk.get(l.id)?.he,
      // Mapas: la web original usa Leaflet CRS.Simple con límites [[0,0],[longm,latm]];
      // aquí se guardan las posiciones como fracción (0–1) del ancho/alto de la imagen.
      map: l.longm ? { w: l.latm, h: -l.longm } : null,
      monsters: ids(l.m),
      talents: rows(l.t).map(([t, m]) => [Number(t), Number(m)]),
      eggSpots: raw.eggs.filter((e) => e.lid === l.id).map((e) => [+(e.lat / l.latm).toFixed(4), +(e.long / l.longm).toFixed(4), seasonIds(e.s)]),
      metalSpots: raw.metals.filter((e) => e.lid === l.id).map((e) => [+(e.lat / l.latm).toFixed(4), +(e.long / l.longm).toFixed(4), e.t, seasonIds(e.s)]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const traitEffects = raw.traitResistances.map((r) => ({
    trait: r.tid, damageType: r.dti, family: r.fi, damage: !!r.isd, resist: !!r.isr, self: !!r.self, value: r.v,
  }));

  return {
    meta: { syncedAt: new Date().toISOString(), source: "https://dev.metalkid.info/DQM3" },
    families,
    ranks,
    seasons: raw.seasons.map((s) => ({ id: s.id, name: s.n, slug: s.i })).sort((a, b) => a.id - b.id),
    weather: raw.weather.map((w) => ({ id: w.id, name: w.n, slug: w.i })),
    damageTypes: raw.damageTypes.map((d) => ({ id: d.id, name: d.n, slug: d.i })).sort((a, b) => a.id - b.id),
    monsters,
    recipes,
    talents,
    skills,
    traits,
    traitEffects,
    items,
    locations,
  };
}

const raw = await fetchAll();
const data = normalize(raw);
await mkdir("public/data", { recursive: true });
await writeFile("public/data/dqm3.json", JSON.stringify(data));
console.log(
  `OK · ${data.monsters.length} monstruos, ${data.recipes.length} recetas, ${data.talents.length} talentos, ` +
  `${data.skills.length} habilidades, ${data.traits.length} rasgos, ${data.items.length} objetos, ${data.locations.length} lugares`,
);
