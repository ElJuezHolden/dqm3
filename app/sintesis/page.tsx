import { Suspense } from "react";
import { SynthesisTree } from "@/components/pages/SynthesisTree";
import { Loading } from "@/components/ui";

export const metadata = { title: "Árbol de síntesis" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SynthesisTree />
    </Suspense>
  );
}
