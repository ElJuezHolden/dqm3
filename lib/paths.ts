// En GitHub Pages la web vive en /dqm3; en local, en la raíz. next/link ya añade el basePath,
// pero las URLs "a mano" (imágenes, fetch, enlaces para compartir) necesitan withBase().
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const withBase = (p: string) => BASE_PATH + p;
