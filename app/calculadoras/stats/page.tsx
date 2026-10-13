import { Suspense } from "react";
import { MaxStats } from "@/components/pages/MaxStats";
import { Loading } from "@/components/ui";

export const metadata = { title: "Stats máximos" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <MaxStats />
    </Suspense>
  );
}
