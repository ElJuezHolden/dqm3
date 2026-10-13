# DQM3 Dex

Enciclopedia rápida y no oficial de **Dragon Quest Monsters 3: The Dark Prince**: monstruos, árbol de síntesis,
talentos, habilidades, rasgos, familias, rangos, lugares, mapas de huevos y slimes de metal, objetos, y
calculadoras (corral, stats máximos, daño y Team Builder con enlace para compartir).

Los datos salen de la base de datos de [MetalKid](https://dev.metalkid.info/DQM3/Monsterpedia)
([repositorio](https://github.com/MetalKid/Databases)); esta web solo los reorganiza para navegarlos más rápido.

## Desarrollo

```bash
npm install
npm run sync        # descarga y normaliza los datos en public/data/dqm3.json
node scripts/assets.mjs   # descarga sprites, iconos y mapas (solo hace falta una vez)
npm run dev
```

Web 100 % estática (`output: "export"`); se publica en GitHub Pages con `.github/workflows/deploy.yml`.
