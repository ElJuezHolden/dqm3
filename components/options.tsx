"use client";
import type { DB } from "@/lib/data";
import { FAMILY_ES, ITEM_TYPE_ES, STATS_SHORT } from "@/lib/labels";
import type { Option } from "./Picker";
import { familyName, FamilyIcon, Img, Sprite } from "./ui";

const cache = new WeakMap<DB, Record<string, Option[]>>();
function memo(db: DB, key: string, make: () => Option[]) {
  let c = cache.get(db);
  if (!c) cache.set(db, (c = {}));
  return (c[key] ??= make());
}

const rankName = (db: DB, r: number) => db.ranks.find((x) => x.id === r)?.name ?? "";

export const monsterOptions = (db: DB) =>
  memo(db, "monsters", () =>
    [...db.monsters].sort((a, b) => a.name.localeCompare(b.name)).map((m) => ({
      id: m.id,
      label: m.name,
      sub: `${familyName(db, m.family)} · Rango ${rankName(db, m.rank)}${m.jp ? ` · ${m.jp}` : ""}`,
      icon: <Sprite db={db} slug={m.slug} size={32} />,
      search: `${m.name} ${m.jp ?? ""} ${m.fr ?? ""}`,
    })),
  );

/** Para padres/abuelos: primero "cualquier monstruo de familia X" y luego todos los monstruos. */
export const parentOptions = (db: DB) =>
  memo(db, "parents", () => [
    ...db.families.map((f) => ({
      id: f.id,
      label: `Familia ${FAMILY_ES[f.slug] ?? f.name}`,
      sub: "Sube " + f.bonus.map((b, i) => (b ? STATS_SHORT[i] : null)).filter(Boolean).join(", "),
      icon: <FamilyIcon slug={f.slug} size={28} />,
      search: `familia ${FAMILY_ES[f.slug]} ${f.name}`,
    })),
    ...monsterOptions(db),
  ]);

const bonusText = (b: number[]) => b.map((v, i) => (v ? `${STATS_SHORT[i]} +${v}` : null)).filter(Boolean).join(" · ");

export const talentOptions = (db: DB) =>
  memo(db, "talents", () =>
    db.talents.map((t) => ({ id: t.id, label: t.name, sub: [t.eggOnly ? "Solo huevo" : null, bonusText(t.bonus)].filter(Boolean).join(" · ") || undefined, search: `${t.name} ${t.jp ?? ""}` })),
  );

export const accessoryOptions = (db: DB) =>
  memo(db, "acc", () =>
    db.items.filter((i) => i.type === "Accessory").map((i) => ({ id: i.id, label: i.name, sub: i.desc })),
  );

export const itemOptions = (db: DB) =>
  memo(db, "items", () => db.items.map((i) => ({ id: i.id, label: i.name, sub: ITEM_TYPE_ES[i.type] ?? i.type })));

export const skillOptions = (db: DB) =>
  memo(db, "skills", () =>
    db.skills.map((s) => ({
      id: s.id,
      label: s.name,
      sub: s.desc,
      icon: <Img src={`/img/skills/${s.typeSlug}.png`} alt={s.type} />,
      search: `${s.name} ${s.jp ?? ""}`,
    })),
  );

export const traitOptions = (db: DB) =>
  memo(db, "traits", () => db.traits.map((t) => ({ id: t.id, label: t.name, sub: t.desc, search: `${t.name} ${t.jp ?? ""}` })));

export const placeOptions = (db: DB) => memo(db, "places", () => db.locations.map((l) => ({ id: l.id, label: l.name, sub: l.jp ?? undefined })));
