import { Suspense } from "react";
import { Paddock } from "@/components/pages/Paddock";
import { Loading } from "@/components/ui";

export const metadata = { title: "Corral de síntesis" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Paddock />
    </Suspense>
  );
}
