import { Suspense } from "react";
import { TraitList } from "@/components/pages/Traits";
import { Loading } from "@/components/ui";

export const metadata = { title: "Rasgos" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TraitList />
    </Suspense>
  );
}
