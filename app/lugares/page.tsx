import { Suspense } from "react";
import { PlaceList } from "@/components/pages/Places";
import { Loading } from "@/components/ui";

export const metadata = { title: "Lugares" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PlaceList />
    </Suspense>
  );
}
