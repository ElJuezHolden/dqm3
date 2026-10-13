"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** Estado de filtros guardado en la URL (?clave=valor) para poder compartir y volver atrás. */
export function useQueryState() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const get = useCallback((k: string) => params.get(k) ?? "", [params]);
  const getList = useCallback((k: string) => (params.get(k) ?? "").split(",").filter(Boolean).map(Number), [params]);
  const set = useCallback(
    (patch: Record<string, string | number | number[] | boolean | null | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        const s = Array.isArray(v) ? v.join(",") : v === true ? "1" : v === false || v == null ? "" : String(v);
        if (s) next.set(k, s); else next.delete(k);
      }
      const qs = next.toString();
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [params, router, path],
  );
  return { get, getList, set, params };
}
