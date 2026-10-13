"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useData, type DB } from "@/lib/data";
import { NAV } from "./nav";
import { norm } from "./Picker";
import { familyName, Img, Sprite } from "./ui";

interface Hit { key: string; href: string; label: string; kind: string; sub?: string; icon?: ReactNode; score: number }

function searchAll(db: DB, q: string): Hit[] {
  const t = norm(q.trim());
  if (!t) return [];
  const hits: Hit[] = [];
  const score = (name: string, extra = "") => {
    const n = norm(name);
    if (n === t) return 0;
    if (n.startsWith(t)) return 1;
    if (n.split(/[\s-]/).some((w) => w.startsWith(t))) return 2;
    if (n.includes(t)) return 3;
    if (norm(extra).includes(t)) return 4;
    return -1;
  };
  for (const g of NAV) for (const it of g.items) {
    const s = score(it.label, it.desc);
    if (s >= 0) hits.push({ key: "nav" + it.href, href: it.href, label: it.label, kind: "Sección", sub: it.desc, icon: <span className="w-8 text-center text-lg">{it.icon}</span>, score: s - 0.5 });
  }
  for (const m of db.monsters) {
    const s = score(m.name, `${m.jp ?? ""} ${m.fr ?? ""}`);
    if (s >= 0) hits.push({ key: "m" + m.id, href: `/monstruos/${m.slug}`, label: m.name, kind: "Monstruo", sub: `${familyName(db, m.family)} · Rango ${db.ranks.find((r) => r.id === m.rank)?.name}`, icon: <Sprite db={db} slug={m.slug} size={32} />, score: s });
  }
  for (const x of db.talents) {
    const s = score(x.name, x.jp ?? "");
    if (s >= 0) hits.push({ key: "ta" + x.id, href: `/talentos/${x.slug}`, label: x.name, kind: "Talento", icon: <span className="w-8 text-center">🌟</span>, score: s + 0.1 });
  }
  for (const x of db.skills) {
    const s = score(x.name, x.jp ?? "");
    if (s >= 0) hits.push({ key: "s" + x.id, href: `/habilidades/${x.slug}`, label: x.name, kind: "Habilidad", sub: x.desc, icon: <span className="grid w-8 place-items-center"><Img src={`/img/skills/${x.typeSlug}.png`} alt={x.type} size={22} /></span>, score: s + 0.2 });
  }
  for (const x of db.traits) {
    const s = score(x.name, x.jp ?? "");
    if (s >= 0) hits.push({ key: "tr" + x.id, href: `/rasgos/${x.slug}`, label: x.name, kind: "Rasgo", sub: x.desc, icon: <span className="w-8 text-center">🧩</span>, score: s + 0.3 });
  }
  for (const x of db.items) {
    const s = score(x.name);
    if (s >= 0) hits.push({ key: "i" + x.id, href: `/objetos/${x.slug}`, label: x.name, kind: "Objeto", sub: x.desc, icon: <span className="w-8 text-center">🎒</span>, score: s + 0.4 });
  }
  for (const x of db.locations) {
    const s = score(x.name, x.jp ?? "");
    if (s >= 0) hits.push({ key: "l" + x.id, href: `/lugares/${x.slug}`, label: x.name, kind: "Lugar", icon: <span className="w-8 text-center">🗺️</span>, score: s + 0.2 });
  }
  return hits.sort((a, b) => a.score - b.score || a.label.length - b.label.length).slice(0, 40);
}

export function SearchPalette({ onClose }: { onClose: () => void }) {
  const db = useData();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const hits = useMemo(() => (db ? searchAll(db, q) : []), [db, q]);

  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    list.current?.querySelector(`[data-i="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  const go = (h: Hit | undefined) => {
    if (!h) return;
    router.push(h.href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[10vh]" role="dialog" aria-modal aria-label="Buscar">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="fade-in relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/60">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <span aria-hidden>🔍</span>
          <input
            ref={input}
            className="w-full bg-transparent py-4 text-lg outline-none"
            placeholder="Monstruo, talento, habilidad, rasgo, objeto, lugar…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setHi(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, hits.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
              else if (e.key === "Enter") go(hits[hi]);
              else if (e.key === "Escape") onClose();
            }}
          />
          <kbd className="rounded border border-line px-1.5 text-[10px] text-muted">Esc</kbd>
        </div>
        <ul ref={list} className="max-h-[60vh] overflow-y-auto p-2">
          {!q && <li className="px-3 py-6 text-center text-sm text-muted">Escribe para buscar en toda la enciclopedia. También funciona en japonés.</li>}
          {q && hits.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Nada con «{q}».</li>}
          {hits.map((h, i) => (
            <li key={h.key} data-i={i}>
              <button
                type="button"
                onMouseEnter={() => setHi(i)}
                onClick={() => go(h)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${i === hi ? "bg-panel-2" : ""}`}
              >
                {h.icon}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{h.label}</span>
                  {h.sub && <span className="block truncate text-xs text-muted">{h.sub}</span>}
                </span>
                <span className="chip text-[11px] text-muted">{h.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
