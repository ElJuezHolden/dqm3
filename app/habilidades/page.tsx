import { Suspense } from "react";
import { SkillList } from "@/components/pages/Skills";
import { Loading } from "@/components/ui";

export const metadata = { title: "Habilidades" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SkillList />
    </Suspense>
  );
}
