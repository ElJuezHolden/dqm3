export interface NavItem { href: string; label: string; icon: string; desc: string }
export interface NavGroup { title: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    title: "Monstruos",
    items: [
      { href: "/monstruos", label: "Monsterpedia", icon: "📖", desc: "Los 526 monstruos con filtros, stats y resistencias" },
      { href: "/sintesis", label: "Árbol de síntesis", icon: "🧬", desc: "Cómo se crea cada monstruo y para qué sirve" },
      { href: "/familias", label: "Familias", icon: "🐉", desc: "Bonus de stats de cada familia" },
      { href: "/rangos", label: "Rangos", icon: "🏅", desc: "Monstruos de G a X" },
      { href: "/monstruos-grandes", label: "Monstruos grandes", icon: "🦣", desc: "Cómo encontrarlos o crearlos" },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { href: "/equipo", label: "Team Builder", icon: "🛡️", desc: "Monta tu equipo y compártelo" },
      { href: "/corral", label: "Corral (síntesis)", icon: "🧪", desc: "Qué puedes crear con lo que tienes" },
      { href: "/calculadoras/stats", label: "Stats máximos", icon: "📈", desc: "Tope de stats según padres y talentos" },
      { href: "/calculadoras/dano", label: "Daño", icon: "⚔️", desc: "Cuánto pega cada habilidad" },
    ],
  },
  {
    title: "Habilidades",
    items: [
      { href: "/talentos", label: "Talentos", icon: "🌟", desc: "Árboles de talento, puntos y monstruos" },
      { href: "/habilidades", label: "Habilidades", icon: "✨", desc: "Hechizos y técnicas" },
      { href: "/rasgos", label: "Rasgos", icon: "🧩", desc: "Pasivas y quién las tiene" },
    ],
  },
  {
    title: "Mundo",
    items: [
      { href: "/lugares", label: "Lugares", icon: "🗺️", desc: "Qué monstruos y talentos hay en cada zona" },
      { href: "/huevos", label: "Huevos", icon: "🥚", desc: "Mapas con la posición de los huevos" },
      { href: "/slimes-metal", label: "Slimes de metal", icon: "🪙", desc: "Dónde salen Metal, Liquid y King" },
      { href: "/objetos", label: "Objetos", icon: "🎒", desc: "Accesorios, objetos y quién los suelta" },
    ],
  },
];
