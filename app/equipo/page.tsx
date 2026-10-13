import { Suspense } from "react";
import { TeamBuilder } from "@/components/pages/TeamBuilder";
import { Loading } from "@/components/ui";

export const metadata = { title: "Team Builder" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TeamBuilder />
    </Suspense>
  );
}
