"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NAV } from "./nav";
import { SearchPalette } from "./SearchPalette";

function isActive(path: string, href: string) {
  const p = path.replace(/\/$/, "") || "/";
  return p === href || p.startsWith(href + "/");
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="space-y-5">
      {NAV.map((g) => (
        <div key={g.title}>
          <div className="label mb-1.5 px-3">{g.title}</div>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const on = isActive(path, it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${on ? "bg-gold/15 font-semibold text-gold-2" : "text-text/85 hover:bg-panel-2 hover:text-text"}`}
                    aria-current={on ? "page" : undefined}
                  >
                    <span className="w-5 text-center" aria-hidden>{it.icon}</span>
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-2 to-gold text-lg font-black text-[#241a02] shadow-lg shadow-gold/20">3</span>
      <span className="leading-tight">
        <span className="h-title block text-base font-bold">DQM3 Dex</span>
        <span className="block text-[11px] text-muted">The Dark Prince</span>
      </span>
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "");
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const searchBtn = (
    <button type="button" onClick={() => setSearch(true)} className="input flex items-center gap-2 text-left text-sm text-muted hover:border-gold/60">
      <span aria-hidden>🔍</span>
      <span className="flex-1">Buscar…</span>
      <kbd className="hidden rounded border border-line px-1.5 text-[10px] sm:inline">Ctrl K</kbd>
    </button>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-5 overflow-y-auto border-r border-line bg-bg/60 px-3 py-5 backdrop-blur lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="px-1">{searchBtn}</div>
        <NavList />
        <p className="mt-auto px-3 text-[11px] leading-relaxed text-muted">
          Datos de la base de{" "}
          <a className="link" href="https://dev.metalkid.info/DQM3/Monsterpedia" target="_blank" rel="noreferrer">MetalKid</a>. Web no oficial.
        </p>
      </aside>

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-bg/85 px-4 py-2.5 backdrop-blur lg:hidden">
        <button type="button" className="btn px-2.5" onClick={() => setMenu(true)} aria-label="Abrir menú">☰</button>
        <Brand />
        <button type="button" className="btn ml-auto px-2.5" onClick={() => setSearch(true)} aria-label="Buscar">🔍</button>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenu(false)} />
          <div className="fade-in absolute inset-y-0 left-0 flex w-72 flex-col gap-5 overflow-y-auto border-r border-line bg-bg px-3 py-5">
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button type="button" className="btn px-2.5" onClick={() => setMenu(false)} aria-label="Cerrar menú">✕</button>
            </div>
            <NavList onNavigate={() => setMenu(false)} />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1500px] min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      {search && <SearchPalette onClose={() => setSearch(false)} />}
    </div>
  );
}
