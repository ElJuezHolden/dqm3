// Descarga una vez las imágenes de la web original a public/img (sprites, iconos y mapas).
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const SRC = "https://dev.metalkid.info/images/DQM3/";
const data = JSON.parse(await readFile("public/data/dqm3.json", "utf8"));
const files = [
  ["monsters-sprite.jpg", "monsters-sprite.jpg"],
  ...data.families.map((f) => [`${f.slug}.png`, `families/${f.slug}.png`]),
  ...data.damageTypes.map((d) => [`DamageTypes/${d.slug}.png`, `dt/${d.slug}.png`]),
  ...data.seasons.map((s) => [`${s.slug}.png`, `seasons/${s.slug}.png`]),
  ...data.weather.map((w) => [`${w.slug}.png`, `weather/${w.slug}.png`]),
  ...["attack", "defence", "agility", "wisdom", "egg"].map((s) => [`${s}.png`, `ui/${s}.png`]),
  ["../../Images/DQM3/star.png", "ui/star.png"],
  ...["support", "attacking", "healing"].map((s) => [`skill-${s}.png`, `skills/${s}.png`]),
  ...data.locations.filter((l) => l.map).map((l) => [`Locations/${l.slug}.jpg`, `maps/${l.slug}.jpg`]),
  ...["metal-slime", "liquid-metal-slime", "metal-king-slime"].map((s) => [`sprites/${s}-thumb.png`, `metal/${s}.png`]),
];
let ok = 0;
for (const [from, to] of files) {
  const dest = `public/img/${to}`;
  if (existsSync(dest)) { ok++; continue; }
  const res = await fetch(new URL(from, SRC), { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) { console.warn("falta", from, res.status); continue; }
  await mkdir(dest.slice(0, dest.lastIndexOf("/")), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  ok++;
}
// Posiciones del sprite de monstruos (75×75 cada uno) sacadas del CSS original.
const css = await (await fetch("https://dev.metalkid.info/css/dqm3.min.css")).text();
const pos = {};
for (const m of css.matchAll(/\.dqm3-([a-z0-9-]+)-thumb\{[^}]*background-position:(-?\d+)(?:px)? (-?\d+)(?:px)?/g)) pos[m[1]] = [-+m[2] / 75, -+m[3] / 75];
await writeFile("public/data/sprites.json", JSON.stringify(pos));
console.log(`${ok}/${files.length} imágenes, ${Object.keys(pos).length} sprites`);
