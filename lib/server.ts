// Solo para el servidor/compilación: lee los datos para generar las rutas estáticas.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RawData } from "./types";

let raw: RawData | null = null;
export function serverData(): RawData {
  raw ??= JSON.parse(readFileSync(join(process.cwd(), "public/data/dqm3.json"), "utf8")) as RawData;
  return raw;
}

export const slugParams = (list: { slug: string }[]) => list.map((x) => ({ slug: x.slug }));

export const nameBySlug = (list: { slug: string; name: string }[], slug: string) => list.find((x) => x.slug === slug)?.name ?? slug;
