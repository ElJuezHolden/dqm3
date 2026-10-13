import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import { Shell } from "@/components/Shell";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const title = Cinzel({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-title" });

export const metadata: Metadata = {
  title: { default: "DQM3 Dex · Dragon Quest Monsters 3", template: "%s · DQM3 Dex" },
  description: "Enciclopedia rápida de Dragon Quest Monsters 3: The Dark Prince — monstruos, síntesis, talentos, habilidades, rasgos, mapas y calculadoras.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${body.variable} ${title.variable}`}>
      <body className="font-sans antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
