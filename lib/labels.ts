// Textos en español. Los nombres propios (monstruos, talentos, habilidades…) se dejan en inglés,
// que es como vienen en la base de datos y como aparecen en la versión occidental del juego.
export const STATS = ["PV", "PM", "Ataque", "Defensa", "Agilidad", "Sabiduría"] as const;
export const STATS_SHORT = ["PV", "PM", "Ata", "Def", "Agi", "Sab"] as const;
export const STAT_KEYS = ["hp", "mp", "att", "def", "agi", "wis"] as const;

export const FAMILY_ES: Record<string, string> = {
  slime: "Slime",
  dragon: "Dragón",
  nature: "Naturaleza",
  beast: "Bestia",
  material: "Material",
  demon: "Demonio",
  undead: "No muerto",
  boss: "???",
};

export const DAMAGE_ES: Record<number, string> = {
  1: "Fuego", 2: "Agua", 3: "Viento", 4: "Tierra", 5: "Explosión", 6: "Hielo", 7: "Electricidad",
  8: "Luz", 9: "Oscuridad", 10: "Debilitación", 11: "Deslumbre", 12: "Antimagia", 13: "Absorción PM",
  14: "Confusión", 15: "Sueño", 16: "Parálisis", 17: "Aturdimiento", 18: "Veneno", 19: "Muerte instantánea",
};
/** Tipos de daño elemental (1–9) frente a los estados alterados (10–19). */
export const ELEMENT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const STATUS_IDS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

export const SEASON_ES: Record<number, string> = { 1: "Primavera", 2: "Verano", 3: "Otoño", 4: "Invierno" };
export const WEATHER_ES: Record<number, string> = { 1: "Sol", 2: "Lluvia" };

export const SKILL_TYPE_ES: Record<string, string> = { attacking: "Ataque", support: "Apoyo", healing: "Curación" };
export const ITEM_TYPE_ES: Record<string, string> = {
  Accessory: "Accesorio", Medicine: "Medicina", Battle: "Combate", Food: "Comida", Key: "Clave", Treasure: "Tesoro",
};
export const EGG_ES: Record<string, string> = {
  White: "Blanco", Silver: "Plateado", Gold: "Dorado", Rainbow: "Arcoíris", "Rainbow - Post Game Only": "Arcoíris (postpartida)",
};
export const TARGET_ES: Record<string, string> = {
  "Single Enemy": "Un enemigo", "All Enemies": "Todos los enemigos", "Random Enemies": "Enemigos al azar",
  "Single Ally": "Un aliado", "All Allies": "Todos los aliados", Self: "Uno mismo", Everyone: "Todos",
  "Line of Enemies": "Fila de enemigos",
};
export const METAL_ES = { Metal: "Metal Slime", Liquid: "Liquid Metal Slime", King: "Metal King Slime" } as const;

export const RANK_COLOR: Record<string, string> = {
  G: "#8b9bb4", F: "#6fbf73", E: "#4fb3bf", D: "#5b8def", C: "#9b6bf2", B: "#e06cc0", A: "#ef6b5b", S: "#f2b33d", X: "#ffe27a",
};

export type ResLevel = "weak" | "normal" | "strong" | "vstrong" | "immune" | "absorb";
export function resLevel(v: number): ResLevel {
  if (v < 0) return "weak";
  if (v < 25) return "normal";
  if (v < 50) return "strong";
  if (v < 100) return "vstrong";
  if (v < 125) return "immune";
  return "absorb";
}
export const RES_LABEL: Record<ResLevel, string> = {
  weak: "Débil", normal: "Normal", strong: "Resiste", vstrong: "Resiste mucho", immune: "Inmune", absorb: "Absorbe",
};

export const tr = (map: Record<string, string>, k: string | null | undefined) => (k == null ? "" : map[k] ?? k);
