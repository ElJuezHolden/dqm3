import { Suspense } from "react";
import { FamilyList } from "@/components/pages/Families";
import { Loading } from "@/components/ui";

export const metadata = { title: "Familias" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <FamilyList />
    </Suspense>
  );
}
