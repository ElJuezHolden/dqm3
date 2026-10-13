import { Suspense } from "react";
import { DamageCalc } from "@/components/pages/DamageCalc";
import { Loading } from "@/components/ui";

export const metadata = { title: "Calculadora de daño" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <DamageCalc />
    </Suspense>
  );
}
