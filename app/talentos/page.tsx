import { Suspense } from "react";
import { TalentList } from "@/components/pages/Talents";
import { Loading } from "@/components/ui";

export const metadata = { title: "Talentos" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TalentList />
    </Suspense>
  );
}
