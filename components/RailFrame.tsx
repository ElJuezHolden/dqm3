"use client";
import type { ReactNode } from "react";
import { useData } from "@/lib/data";
import { MonsterRail } from "./MonsterRail";

export function RailFrame({ children }: { children: ReactNode }) {
  const db = useData();
  return (
    <div className="xl:grid xl:grid-cols-[270px_minmax(0,1fr)] xl:gap-6">
      <aside className="card sticky top-4 hidden h-[calc(100dvh-2rem)] overflow-hidden xl:block">
        {db && <MonsterRail db={db} />}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
