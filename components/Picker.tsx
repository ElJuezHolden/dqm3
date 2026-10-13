"use client";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

export interface Option { id: number; label: string; sub?: string; icon?: ReactNode; search?: string }

export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Selector con buscador: escribe para filtrar, flechas + Enter para elegir, Esc para cerrar. */
export function Picker({
  options, value, onChange, placeholder = "Buscar…", clearable = true, className = "", label,
}: {
  options: Option[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    const t = norm(q.trim());
    const res = t ? options.filter((o) => norm(o.search ?? `${o.label} ${o.sub ?? ""}`).includes(t)) : options;
    return res.slice(0, 120);
  }, [q, options]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const pick = (o: Option | undefined) => {
    if (!o) return;
    onChange(o.id);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={box} className={`relative ${className}`}>
      {label && <div className="label mb-1">{label}</div>}
      <button
        type="button"
        className="input flex min-h-10 items-center gap-2 text-left"
        onClick={() => { setOpen(!open); setHi(0); setTimeout(() => input.current?.focus(), 0); }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            {selected.icon}
            <span className="min-w-0 flex-1 truncate">{selected.label}</span>
          </>
        ) : (
          <span className="flex-1 text-muted">{placeholder}</span>
        )}
        {clearable && selected && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Quitar"
            className="rounded px-1 text-muted hover:text-text"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(null); } }}
          >
            ✕
          </span>
        )}
        <span className="text-muted">▾</span>
      </button>
      {open && (
        <div className="fade-in absolute z-40 mt-1 w-full min-w-64 overflow-hidden rounded-xl border border-line bg-panel shadow-2xl shadow-black/50">
          <input
            ref={input}
            className="w-full border-b border-line bg-transparent px-3 py-2 outline-none"
            placeholder="Escribe para filtrar…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setHi(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, filtered.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); pick(filtered[hi]); }
              else if (e.key === "Escape") setOpen(false);
            }}
            role="combobox"
            aria-controls={listId}
            aria-expanded
          />
          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-muted">Sin resultados</li>}
            {filtered.map((o, i) => (
              <li
                key={o.id}
                role="option"
                aria-selected={o.id === value}
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(o); }}
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm ${i === hi ? "bg-panel-2" : ""} ${o.id === value ? "text-gold-2" : ""}`}
              >
                {o.icon}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.label}</span>
                  {o.sub && <span className="block truncate text-xs text-muted">{o.sub}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Igual que Picker pero acumulando varios valores como chips. */
export function MultiPicker({
  options, values, onChange, max, placeholder, label,
}: {
  options: Option[];
  values: number[];
  onChange: (ids: number[]) => void;
  max?: number;
  placeholder?: string;
  label?: string;
}) {
  const full = max != null && values.length >= max;
  return (
    <div>
      {label && <div className="label mb-1">{label}</div>}
      {values.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {values.map((id) => {
            const o = options.find((x) => x.id === id);
            return (
              <button key={id} type="button" className="chip chip-on" onClick={() => onChange(values.filter((v) => v !== id))} title="Quitar">
                {o?.icon}
                {o?.label ?? id} <span aria-hidden>✕</span>
              </button>
            );
          })}
        </div>
      )}
      {!full && (
        <Picker
          options={options.filter((o) => !values.includes(o.id))}
          value={null}
          onChange={(id) => id != null && onChange([...values, id])}
          placeholder={placeholder}
          clearable={false}
        />
      )}
    </div>
  );
}
