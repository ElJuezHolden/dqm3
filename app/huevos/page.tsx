import { Suspense } from "react";
import { MapExplorer } from "@/components/pages/MapExplorer";
import { Loading } from "@/components/ui";

export const metadata = { title: "Huevos" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <MapExplorer mode="eggs" />
    </Suspense>
  );
}
