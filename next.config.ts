import type { NextConfig } from "next";

// En GitHub Pages la web vive en /dqm3; en local, en la raíz.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Web 100 % estática: los datos van en public/data y todo se calcula en el navegador.
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
