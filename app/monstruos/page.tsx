import { Suspense } from "react";
import { MonsterList } from "@/components/pages/MonsterList";
import { Loading } from "@/components/ui";

export const metadata = { title: "Monsterpedia" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <MonsterList />
    </Suspense>
  );
}
